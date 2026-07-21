import { db } from "./db";
import { sql } from "drizzle-orm";
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

    // 1. Subscription plans
    for (const plan of data.subscriptionPlans) {
      await db.execute(sql`
        INSERT INTO subscription_plans (id, name, slug, description, price, yearly_price, features, max_bookmarks, max_inquiries, max_reviews, advanced_filters, priority_support, custom_reports, is_active, created_at, updated_at)
        VALUES (${plan.id}, ${plan.name}, ${plan.slug}, ${plan.description}, ${plan.price}, ${plan.yearly_price}, ${JSON.stringify(plan.features)}, ${plan.max_bookmarks}, ${plan.max_inquiries}, ${plan.max_reviews}, ${plan.advanced_filters}, ${plan.priority_support}, ${plan.custom_reports}, ${plan.is_active}, ${plan.created_at}, ${plan.updated_at})
        ON CONFLICT (id) DO NOTHING
      `);
    }
    console.log(`[prod-seed] Upserted ${data.subscriptionPlans.length} subscription plans`);

    // 2. Disciplines
    for (const d of data.disciplines) {
      await db.execute(sql`
        INSERT INTO disciplines (id, name, slug, description, sort_order)
        VALUES (${d.id}, ${d.name}, ${d.slug}, ${d.description}, ${d.sort_order})
        ON CONFLICT (id) DO NOTHING
      `);
    }
    console.log(`[prod-seed] Upserted ${data.disciplines.length} disciplines`);

    // 3. Categories
    for (const c of data.categories) {
      await db.execute(sql`
        INSERT INTO categories (id, name, slug, description, discipline_id, sort_order, is_custom)
        VALUES (${c.id}, ${c.name}, ${c.slug}, ${c.description}, ${c.discipline_id}, ${c.sort_order ?? 0}, ${c.is_custom ?? false})
        ON CONFLICT (id) DO NOTHING
      `);
    }
    console.log(`[prod-seed] Upserted ${data.categories.length} categories`);

    // 4. Speaking topics
    for (const t of data.speakingTopics) {
      await db.execute(sql`
        INSERT INTO speaking_topics (id, name, slug, category, description, is_active)
        VALUES (${t.id}, ${t.name}, ${t.slug}, ${t.category}, ${t.description}, ${t.is_active ?? true})
        ON CONFLICT (id) DO NOTHING
      `);
    }
    console.log(`[prod-seed] Upserted ${data.speakingTopics.length} speaking topics`);

    // 5. Speakers — insert in batches of 50
    const speakers = data.speakers;
    let inserted = 0;
    for (const s of speakers) {
      try {
        await db.execute(sql`
          INSERT INTO speakers (
            id, name, slug, title, bio, expertise, location, overall_rating, review_count,
            image_url, verified, featured, is_featured_override, categories, discipline_id,
            speaker_category_ids, speaker_discipline_ids, discipline_migration_status,
            achievements, lectures, event_photos, speaking_videos, email, phone, website,
            social_media, instagram_handle, facebook_handle, x_handle, linkedin_handle,
            tiktok_handle, selected_social_platform, languages, medical_specialties,
            speaker_type, fee, experience, education, certifications, affiliations,
            publications, subscription_tier, stripe_customer_id, stripe_subscription_id,
            subscription_status, subscription_period_end, cancellation_reason, cancelled_at,
            hide_profile, hide_ratings, hide_social, hide_contact, deleted_at,
            storage_used_bytes, video_count, sds_badge, sponsored_tier, sponsored_note
          ) VALUES (
            ${s.id}, ${s.name}, ${s.slug}, ${s.title}, ${s.bio},
            ${JSON.stringify(s.expertise)}, ${s.location}, ${s.overall_rating}, ${s.review_count},
            ${s.image_url}, ${s.verified}, ${s.featured}, ${s.is_featured_override},
            ${JSON.stringify(s.categories)}, ${s.discipline_id},
            ${JSON.stringify(s.speaker_category_ids ?? [])}, ${JSON.stringify(s.speaker_discipline_ids ?? [])},
            ${s.discipline_migration_status},
            ${JSON.stringify(s.achievements ?? [])}, ${JSON.stringify(s.lectures ?? [])},
            ${JSON.stringify(s.event_photos ?? [])}, ${JSON.stringify(s.speaking_videos ?? [])},
            ${s.email}, ${s.phone}, ${s.website},
            ${JSON.stringify(s.social_media ?? [])}, ${s.instagram_handle}, ${s.facebook_handle},
            ${s.x_handle}, ${s.linkedin_handle}, ${s.tiktok_handle}, ${s.selected_social_platform},
            ${JSON.stringify(s.languages ?? [])}, ${JSON.stringify(s.medical_specialties ?? [])},
            ${s.speaker_type}, ${s.fee}, ${s.experience},
            ${JSON.stringify(s.education ?? [])}, ${JSON.stringify(s.certifications ?? [])},
            ${JSON.stringify(s.affiliations ?? [])}, ${JSON.stringify(s.publications ?? [])},
            ${s.subscription_tier ?? 'basic'}, ${s.stripe_customer_id}, ${s.stripe_subscription_id},
            ${s.subscription_status}, ${s.subscription_period_end}, ${s.cancellation_reason},
            ${s.cancelled_at}, ${s.hide_profile ?? false}, ${s.hide_ratings ?? false},
            ${s.hide_social ?? false}, ${s.hide_contact ?? false}, ${s.deleted_at},
            ${s.storage_used_bytes ?? 0}, ${s.video_count ?? 0}, ${s.sds_badge},
            ${s.sponsored_tier}, ${s.sponsored_note}
          )
          ON CONFLICT (id) DO NOTHING
        `);
        inserted++;
      } catch (err: any) {
        console.error(`[prod-seed] Failed to insert speaker ${s.id} (${s.name}):`, err.message);
      }
    }
    console.log(`[prod-seed] Inserted ${inserted}/${speakers.length} speakers`);

    // 6. Speaker topics junction
    for (const st of data.speakerTopics) {
      await db.execute(sql`
        INSERT INTO speaker_topics (speaker_id, topic_id)
        VALUES (${st.speaker_id}, ${st.topic_id})
        ON CONFLICT DO NOTHING
      `);
    }
    console.log(`[prod-seed] Upserted ${data.speakerTopics.length} speaker-topic links`);

    // 7. Speaker events
    for (const e of data.speakerEvents) {
      await db.execute(sql`
        INSERT INTO speaker_events (id, speaker_id, event_name, event_date, location, event_url, event_end_date, image_url)
        VALUES (${e.id}, ${e.speaker_id}, ${e.event_name}, ${e.event_date}, ${e.location}, ${e.event_url}, ${e.event_end_date}, ${e.image_url})
        ON CONFLICT (id) DO NOTHING
      `);
    }
    console.log(`[prod-seed] Upserted ${data.speakerEvents.length} speaker events`);

    // Reset sequences so new inserts don't collide
    await db.execute(sql`SELECT setval('speakers_id_seq', (SELECT MAX(id) FROM speakers))`);
    await db.execute(sql`SELECT setval('disciplines_id_seq', (SELECT MAX(id) FROM disciplines))`);
    await db.execute(sql`SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))`);
    await db.execute(sql`SELECT setval('speaking_topics_id_seq', (SELECT MAX(id) FROM speaking_topics))`);
    await db.execute(sql`SELECT setval('speaker_events_id_seq', (SELECT MAX(id) FROM speaker_events))`);

    console.log(`[prod-seed] ✅ Production seed complete!`);
  } catch (err) {
    console.error("[prod-seed] Seed failed:", err);
  }
}
