/**
 * Backfill script: Recalculate reviews.overall_rating from sub-ratings
 * and update speakers.overall_rating aggregates for all approved reviews.
 *
 * Run with: npx tsx server/scripts/backfill-review-ratings.ts
 *
 * Background: reviews.overall_rating was previously stored as an integer
 * (Math.round of the average), losing decimal precision. This script recalculates
 * the true average from the six stored sub-ratings and updates speaker aggregates.
 */

import { db } from "../db";
import { speakers } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

interface SpeakerRatingRow {
  speaker_id: number;
  avg_rating: string;
  review_count: string;
}

async function backfillReviewRatings() {
  console.log("Starting review rating backfill...");

  // Step 1: Recalculate overall_rating for every review from its sub-ratings
  const updateResult = await db.execute(sql`
    UPDATE reviews
    SET overall_rating = ROUND(
      (speaking_style_rating + podium_presence_rating + technical_proficiency_rating +
       content_relevance_rating + ease_of_working_rating + visual_design_rating)::numeric / 6, 2
    )
    RETURNING id, overall_rating
  `);

  console.log(`Updated ${updateResult.rowCount} review(s) with corrected overall_rating.`);

  // Step 2: Recalculate each speaker's aggregate rating from approved reviews
  const speakersWithApprovedReviews = await db.execute(sql`
    SELECT speaker_id, 
      ROUND(AVG(overall_rating)::numeric, 2) as avg_rating,
      COUNT(*) as review_count
    FROM reviews
    WHERE approval_status = 'approved'
    GROUP BY speaker_id
  `);

  let speakerUpdateCount = 0;
  for (const row of speakersWithApprovedReviews.rows as SpeakerRatingRow[]) {
    await db.update(speakers)
      .set({
        overallRating: String(row.avg_rating),
        reviewCount: Number(row.review_count),
      })
      .where(eq(speakers.id, row.speaker_id));
    speakerUpdateCount++;
  }

  console.log(`Updated ${speakerUpdateCount} speaker aggregate rating(s).`);

  // Step 3: Reset speakers with no approved reviews to 0.00
  await db.execute(sql`
    UPDATE speakers
    SET overall_rating = '0.00', review_count = 0
    WHERE id NOT IN (
      SELECT DISTINCT speaker_id FROM reviews WHERE approval_status = 'approved'
    ) AND review_count > 0
  `);

  console.log("Backfill complete.");
}

backfillReviewRatings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
