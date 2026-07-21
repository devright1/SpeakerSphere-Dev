import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  speakers as speakersTable,
  disciplines as disciplinesTable,
  categories as categoriesTable,
  speakingTopics as speakingTopicsTable,
  speakerTopics as speakerTopicsTable,
  speakerEvents as speakerEventsTable,
  subscriptionPlans as subscriptionPlansTable,
} from "../shared/schema";
import fs from "fs";
import path from "path";

export async function seedProdDataIfEmpty() {
  try {
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM speakers`);
    const count = parseInt((countResult.rows[0] as any).count, 10);
    if (count >= 100) {
      console.log(`✅ Production seed not needed — ${count} speakers already exist.`);
      return;
    }
    console.log(`[prod-seed] Only ${count} speakers found — running full data import...`);

    const seedFile = path.resolve(process.cwd(), "server/prod-seed-data.json");
    if (!fs.existsSync(seedFile)) {
      console.warn("[prod-seed] Seed file not found, skipping.");
      return;
    }

    const data = JSON.parse(fs.readFileSync(seedFile, "utf-8"));

    // ── 1. Subscription plans ──────────────────────────────────────────────────
    for (const p of data.subscriptionPlans) {
      await db.insert(subscriptionPlansTable).values({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        yearlyPrice: p.yearly_price,
        features: p.features ?? [],
        maxBookmarks: p.max_bookmarks,
        maxInquiries: p.max_inquiries,
        maxReviews: p.max_reviews,
        advancedFilters: p.advanced_filters ?? false,
        prioritySupport: p.priority_support ?? false,
        customReports: p.custom_reports ?? false,
        isActive: p.is_active ?? true,
      }).onConflictDoNothing();
    }
    console.log(`[prod-seed] ✓ ${data.subscriptionPlans.length} subscription plans`);

    // ── 2. Disciplines ─────────────────────────────────────────────────────────
    for (const d of data.disciplines) {
      await db.insert(disciplinesTable).values({
        id: d.id,
        name: d.name,
        slug: d.slug,
        description: d.description,
        sortOrder: d.sort_order ?? 0,
      }).onConflictDoNothing();
    }
    console.log(`[prod-seed] ✓ ${data.disciplines.length} disciplines`);

    // ── 3. Categories ──────────────────────────────────────────────────────────
    for (const c of data.categories) {
      await db.insert(categoriesTable).values({
        id: c.id,
        name: c.name,
        description: c.description ?? "",
        speakerCount: c.speaker_count ?? 0,
        disciplineId: c.discipline_id,
        sortOrder: c.sort_order ?? 0,
        isCustom: c.is_custom ?? false,
      }).onConflictDoNothing();
    }
    console.log(`[prod-seed] ✓ ${data.categories.length} categories`);

    // ── 4. Speaking topics ─────────────────────────────────────────────────────
    for (const t of data.speakingTopics) {
      await db.insert(speakingTopicsTable).values({
        id: t.id,
        name: t.name,
        slug: t.slug,
        category: t.category,
        description: t.description,
        isActive: t.is_active ?? true,
      }).onConflictDoNothing();
    }
    console.log(`[prod-seed] ✓ ${data.speakingTopics.length} speaking topics`);

    // ── 5. Speakers ────────────────────────────────────────────────────────────
    let inserted = 0;
    let failed = 0;
    for (const s of data.speakers) {
      try {
        await db.insert(speakersTable).values({
          id: s.id,
          name: s.name,
          slug: s.slug,
          title: s.title,
          bio: s.bio,
          expertise: s.expertise ?? [],
          location: s.location,
          overallRating: s.overall_rating,
          reviewCount: s.review_count ?? 0,
          imageUrl: s.image_url,
          verified: s.verified ?? false,
          featured: s.featured ?? false,
          isFeaturedOverride: s.is_featured_override ?? false,
          categories: s.categories ?? [],
          disciplineId: s.discipline_id,
          speakerCategoryIds: s.speaker_category_ids ?? [],
          speakerDisciplineIds: s.speaker_discipline_ids ?? [],
          disciplineMigrationStatus: s.discipline_migration_status,
          achievements: s.achievements ?? [],
          lectures: s.lectures ?? [],
          eventPhotos: s.event_photos ?? [],
          speakingVideos: s.speaking_videos ?? [],
          email: s.email,
          phone: s.phone,
          website: s.website,
          socialMedia: s.social_media ?? [],
          instagramHandle: s.instagram_handle,
          facebookHandle: s.facebook_handle,
          xHandle: s.x_handle,
          linkedinHandle: s.linkedin_handle,
          tiktokHandle: s.tiktok_handle,
          selectedSocialPlatform: s.selected_social_platform,
          languages: s.languages ?? [],
          medicalSpecialties: s.medical_specialties ?? [],
          speakerType: s.speaker_type,
          fee: s.fee,
          experience: s.experience,
          education: s.education,
          certifications: s.certifications,
          affiliations: s.affiliations,
          publications: s.publications,
          subscriptionTier: s.subscription_tier ?? "basic",
          stripeCustomerId: s.stripe_customer_id,
          stripeSubscriptionId: s.stripe_subscription_id,
          subscriptionStatus: s.subscription_status,
          subscriptionPeriodEnd: s.subscription_period_end ? new Date(s.subscription_period_end) : null,
          cancellationReason: s.cancellation_reason,
          cancelledAt: s.cancelled_at ? new Date(s.cancelled_at) : null,
          hideProfile: s.hide_profile ?? false,
          hideRatings: s.hide_ratings ?? false,
          hideSocial: s.hide_social ?? false,
          hideContact: s.hide_contact ?? false,
          deletedAt: s.deleted_at ? new Date(s.deleted_at) : null,
          storageUsedBytes: s.storage_used_bytes ?? 0,
          videoCount: s.video_count ?? 0,
          sdsBadge: s.sds_badge,
          sponsoredTier: s.sponsored_tier,
          sponsoredNote: s.sponsored_note,
        }).onConflictDoNothing();
        inserted++;
      } catch (err: any) {
        failed++;
        if (failed <= 5) {
          console.error(`[prod-seed] Speaker ${s.id} (${s.name}) failed:`, err.message);
        }
      }
    }
    console.log(`[prod-seed] ✓ ${inserted} speakers inserted (${failed} skipped/failed)`);

    // ── 6. Speaker–topic links ─────────────────────────────────────────────────
    for (const st of data.speakerTopics) {
      await db.insert(speakerTopicsTable).values({
        speakerId: st.speaker_id,
        topicId: st.topic_id,
      }).onConflictDoNothing();
    }
    console.log(`[prod-seed] ✓ ${data.speakerTopics.length} speaker-topic links`);

    // ── 7. Speaker events ──────────────────────────────────────────────────────
    for (const e of data.speakerEvents) {
      await db.insert(speakerEventsTable).values({
        id: e.id,
        speakerId: e.speaker_id,
        eventName: e.event_name,
        eventDate: e.event_date ? new Date(e.event_date) : new Date(),
        location: e.location,
        eventUrl: e.event_url,
        eventEndDate: e.event_end_date ? new Date(e.event_end_date) : null,
        imageUrl: e.image_url,
      }).onConflictDoNothing();
    }
    console.log(`[prod-seed] ✓ ${data.speakerEvents.length} speaker events`);

    // ── 8. Reset sequences so new inserts don't collide ───────────────────────
    await db.execute(sql`SELECT setval('speakers_id_seq', GREATEST((SELECT MAX(id) FROM speakers), 1))`);
    await db.execute(sql`SELECT setval('disciplines_id_seq', GREATEST((SELECT MAX(id) FROM disciplines), 1))`);
    await db.execute(sql`SELECT setval('categories_id_seq', GREATEST((SELECT MAX(id) FROM categories), 1))`);
    await db.execute(sql`SELECT setval('speaking_topics_id_seq', GREATEST((SELECT MAX(id) FROM speaking_topics), 1))`);
    await db.execute(sql`SELECT setval('speaker_events_id_seq', GREATEST((SELECT MAX(id) FROM speaker_events), 1))`);
    await db.execute(sql`SELECT setval('subscription_plans_id_seq', GREATEST((SELECT MAX(id) FROM subscription_plans), 1))`);

    console.log(`[prod-seed] ✅ Production seed complete!`);
  } catch (err: any) {
    console.error("[prod-seed] Seed failed:", err.message);
    console.error("[prod-seed] Stack:", err.stack);
  }
}
