import { 
  speakers, 
  reviews, 
  inquiries, 
  categories,
  disciplines,
  speakingTopics,
  speakerTopics,
  videos,
  users,
  userSessions,
  userLikes,
  userBookmarks,
  speakerApplications,
  speakerInteractions,
  speakerContent,
  contentAccessCodes,
  contentDownloads,
  speakerVideoLinks,
  images,
  subscriptionFeatures,
  subscriptionTierFeatures,
  subscriptionHistory,
  tierLimits,
  speakerEvents,
  passwordResetCodes,
  type Speaker, 
  type InsertSpeaker, 
  type Review, 
  type InsertReview,
  type Inquiry,
  type InsertInquiry,
  type Category,
  type InsertCategory,
  type Discipline,
  type InsertDiscipline,
  type SpeakingTopic,
  type InsertSpeakingTopic,
  type SpeakerTopic,
  type InsertSpeakerTopic,
  type Video,
  type InsertVideo,
  type User,
  type InsertUser,
  type UserSession,
  type InsertUserSession,
  type UserLike,
  type InsertUserLike,
  type UserBookmark,
  type InsertUserBookmark,
  type SpeakerApplication,
  type InsertSpeakerApplication,
  type SpeakerInteraction,
  type InsertSpeakerInteraction,
  type SpeakerContent,
  type InsertSpeakerContent,
  type ContentAccessCode,
  type InsertContentAccessCode,
  type ContentDownload,
  type InsertContentDownload,
  type SpeakerVideoLink,
  type InsertSpeakerVideoLink,
  type Image,
  type InsertImage,
  type SubscriptionFeature,
  type InsertSubscriptionFeature,
  type SubscriptionTierFeature,
  type InsertSubscriptionTierFeature,
  type TierLimit,
  type InsertTierLimit,
  type SpeakerEvent,
  type InsertSpeakerEvent,
  type ReviewComment,
  type InsertReviewComment,
  type TopicRequest,
  type InsertTopicRequest,
  topicRequests,
  reviewReactions,
  reviewComments,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, gte, lte, sql, isNotNull, isNull, inArray } from "drizzle-orm";
import type { IStorage } from "./storage";

/**
 * Helper to build tier-based ordering for speaker queries.
 * Returns SQL fragments for ordering by tier (Premier > Pro > Basic) with SDS badge priority within each tier.
 * SDS Faculty badges appear first, then SDS badges, then non-badged speakers.
 * Within same tier and badge, speakers are randomized (or deterministically if seeded) and finally by ID for stable pagination.
 * @param seed Optional seed for deterministic randomization (useful for pagination/caching consistency)
 */
function buildTierRotationOrder(seed?: string): { seedSql?: any; order: any[] } {
  if (seed) {
    // Convert seed string to a number between 0 and 1 for setseed
    const seedValue = parseInt(seed, 36) % 1_000_000 / 1_000_000;
    return {
      seedSql: sql`SELECT setseed(${seedValue})`,
      order: [
        // First sort by subscription tier (Premier > Pro > Basic)
        sql`CASE ${speakers.subscriptionTier} WHEN 'premier' THEN 1 WHEN 'pro' THEN 2 ELSE 3 END`,
        // Within each tier, SDS Faculty first, then SDS, then non-badged
        sql`CASE ${speakers.sdsBadge} WHEN 'sds_faculty' THEN 1 WHEN 'sds' THEN 2 ELSE 3 END`,
        // Randomize within same tier+badge, then stable ID for pagination
        sql`RANDOM()`,
        speakers.id
      ]
    };
  }
  
  // Default: no seed, fresh randomization on each request
  return {
    order: [
      // First sort by subscription tier (Premier > Pro > Basic)
      sql`CASE ${speakers.subscriptionTier} WHEN 'premier' THEN 1 WHEN 'pro' THEN 2 ELSE 3 END`,
      // Within each tier, SDS Faculty first, then SDS, then non-badged
      sql`CASE ${speakers.sdsBadge} WHEN 'sds_faculty' THEN 1 WHEN 'sds' THEN 2 ELSE 3 END`,
      // Randomize within same tier+badge, then stable ID for pagination
      sql`RANDOM()`,
      speakers.id
    ]
  };
}

export class DatabaseStorage implements IStorage {
  // Speakers
  async getSpeakers(filters?: {
    category?: string;
    categories?: string[];
    topics?: string[]; // New topic filtering
    location?: string;
    minRating?: number;
    maxFee?: number;
    minFee?: number;
    expertise?: string;
    search?: string;
    includeHidden?: boolean; // Add option to include hidden speakers
    seed?: string; // Optional seed for deterministic randomization
  }): Promise<Speaker[]> {
    // Apply tier-based rotation ordering with optional seed
    const { seedSql, order } = buildTierRotationOrder(filters?.seed);
    if (seedSql) {
      await db.execute(seedSql);
    }
    
    // Only hide speakers from public view, not admin view
    const conditions = [];
    
    // Only apply hideProfile filter if not explicitly requesting hidden speakers
    if (!filters?.includeHidden) {
      // Show speakers where hideProfile is false OR hideProfile is null (not set)
      conditions.push(or(eq(speakers.hideProfile, false), isNull(speakers.hideProfile)));
    }

    // Handle both single category (for backward compatibility) and multiple categories
    if (filters?.categories && filters.categories.length > 0) {
      // Multiple categories - use OR condition
      const categoryConditions = filters.categories.map(cat => sql`${cat} = ANY(${speakers.categories})`);
      conditions.push(or(...categoryConditions));
    } else if (filters?.category) {
      // Single category (backward compatibility)
      conditions.push(sql`${filters.category} = ANY(${speakers.categories})`);
    }

    // Handle topic filtering using speaker_topics junction table
    if (filters?.topics && filters.topics.length > 0) {
      // Get speaker IDs that are associated with any of the selected topics
      const topicSpeakers = await db
        .select({ speakerId: speakerTopics.speakerId })
        .from(speakerTopics)
        .innerJoin(speakingTopics, eq(speakerTopics.topicId, speakingTopics.id))
        .where(or(...filters.topics.map(topic => eq(speakingTopics.name, topic))));
      
      const speakerIds = topicSpeakers.map(s => s.speakerId);
      
      if (speakerIds.length > 0) {
        conditions.push(or(...speakerIds.map(id => eq(speakers.id, id))));
      } else {
        // No speakers found for the selected topics, return empty result
        return [];
      }
    }



    if (filters?.minRating) {
      conditions.push(gte(speakers.overallRating, filters.minRating.toString()));
    }

    if (filters?.maxFee && filters.minFee) {
      // Fee range filter
      conditions.push(
        and(
          gte(sql`CAST(REPLACE(REPLACE(${speakers.fee}, '$', ''), ',', '') AS INTEGER)`, filters.minFee),
          lte(sql`CAST(REPLACE(REPLACE(${speakers.fee}, '$', ''), ',', '') AS INTEGER)`, filters.maxFee)
        )
      );
    } else if (filters?.maxFee) {
      conditions.push(
        lte(sql`CAST(REPLACE(REPLACE(${speakers.fee}, '$', ''), ',', '') AS INTEGER)`, filters.maxFee)
      );
    } else if (filters?.minFee) {
      conditions.push(
        gte(sql`CAST(REPLACE(REPLACE(${speakers.fee}, '$', ''), ',', '') AS INTEGER)`, filters.minFee)
      );
    }

    if (filters?.search) {
      // Use safe string comparison - Drizzle automatically parameterizes these queries
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${speakers.name})`, searchTerm),
          like(sql`LOWER(${speakers.title})`, searchTerm),
          like(sql`LOWER(${speakers.bio})`, searchTerm),
          like(sql`LOWER(array_to_string(${speakers.expertise}, ' '))`, searchTerm)
        )
      );
    }

    let query = db.select().from(speakers);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    // Apply tier-based rotation ordering
    query = query.orderBy(...order) as any;
    
    const result = await query;
    return result;
  }

  async getSpeakersByTopicCategory(categoryName: string, filters?: {
    search?: string;
    verified?: boolean;
    featured?: boolean;
    minFee?: number;
    maxFee?: number;
    includeHidden?: boolean;
    seed?: string; // Optional seed for deterministic randomization
  }): Promise<Speaker[]> {
    // Apply tier-based rotation ordering with optional seed
    const { seedSql, order } = buildTierRotationOrder(filters?.seed);
    if (seedSql) {
      await db.execute(seedSql);
    }
    
    // Normalize category name (trim and case-insensitive)
    const normalizedCategory = categoryName.trim();
    
    // First, get all topic IDs that belong to this category
    const categoryTopics = await db
      .select({ topicId: speakingTopics.id })
      .from(speakingTopics)
      .where(and(
        sql`LOWER(TRIM(${speakingTopics.category})) = LOWER(${normalizedCategory})`,
        eq(speakingTopics.isActive, true)
      ));
    
    const topicIds = categoryTopics.map(t => t.topicId);
    
    if (topicIds.length === 0) {
      return []; // No topics in this category
    }
    
    // Get speaker IDs that have any of these topics
    const speakersWithTopics = await db
      .select({ speakerId: speakerTopics.speakerId })
      .from(speakerTopics)
      .where(inArray(speakerTopics.topicId, topicIds));
    
    const speakerIds = Array.from(new Set(speakersWithTopics.map(s => s.speakerId))); // Deduplicate
    
    if (speakerIds.length === 0) {
      return []; // No speakers have topics in this category
    }
    
    // Build conditions for speaker filtering
    const conditions = [];
    
    // Only hide speakers from public view, not admin view
    if (!filters?.includeHidden) {
      conditions.push(or(eq(speakers.hideProfile, false), isNull(speakers.hideProfile)));
    }
    
    // Filter by speaker IDs from topic relationships
    conditions.push(inArray(speakers.id, speakerIds));
    
    // Apply additional filters
    if (filters?.verified !== undefined) {
      conditions.push(eq(speakers.verified, filters.verified));
    }
    
    if (filters?.featured !== undefined) {
      conditions.push(eq(speakers.featured, filters.featured));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${speakers.name})`, searchTerm),
          like(sql`LOWER(${speakers.title})`, searchTerm),
          like(sql`LOWER(${speakers.bio})`, searchTerm),
          like(sql`LOWER(array_to_string(${speakers.expertise}, ' '))`, searchTerm)
        )
      );
    }
    
    if (filters?.maxFee && filters.minFee) {
      conditions.push(
        and(
          gte(sql`CAST(REPLACE(REPLACE(${speakers.fee}, '$', ''), ',', '') AS INTEGER)`, filters.minFee),
          lte(sql`CAST(REPLACE(REPLACE(${speakers.fee}, '$', ''), ',', '') AS INTEGER)`, filters.maxFee)
        )
      );
    } else if (filters?.maxFee) {
      conditions.push(
        lte(sql`CAST(REPLACE(REPLACE(${speakers.fee}, '$', ''), ',', '') AS INTEGER)`, filters.maxFee)
      );
    } else if (filters?.minFee) {
      conditions.push(
        gte(sql`CAST(REPLACE(REPLACE(${speakers.fee}, '$', ''), ',', '') AS INTEGER)`, filters.minFee)
      );
    }
    
    // Execute query with all conditions
    let query = db.select().from(speakers);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    // Apply tier-based rotation ordering
    query = query.orderBy(...order) as any;
    
    const result = await query;
    return result;
  }

  async getSpeaker(id: number): Promise<Speaker | undefined> {
    const result = await db.select().from(speakers).where(eq(speakers.id, id));
    return result[0];
  }

  async getSpeakerBySlug(slug: string): Promise<Speaker | undefined> {
    const result = await db.select().from(speakers).where(eq(speakers.slug, slug));
    return result[0];
  }

  async getSpeakerByName(name: string): Promise<Speaker | undefined> {
    const result = await db.select().from(speakers).where(eq(speakers.slug, name));
    return result[0];
  }

  async getSpeakerByUserId(userId: string): Promise<Speaker | undefined> {
    // First find the user to get their speaker ID
    const userResult = await db.select().from(users).where(eq(users.id, userId));
    const user = userResult[0];
    
    if (!user || !user.speakerId) {
      return undefined;
    }
    
    // Then get the speaker profile
    const result = await db.select().from(speakers).where(eq(speakers.id, user.speakerId));
    return result[0];
  }

  async getSpeakerByEmail(email: string): Promise<Speaker | undefined> {
    const result = await db.select().from(speakers).where(eq(speakers.email, email));
    return result[0];
  }

  async createSpeaker(speaker: InsertSpeaker): Promise<Speaker> {
    const result = await db.insert(speakers).values(speaker).returning();
    return result[0];
  }

  async updateSpeaker(id: number, updates: Partial<InsertSpeaker>): Promise<Speaker | undefined> {
    const timestampFields = ['cancelledAt', 'subscriptionPeriodEnd', 'deletedAt', 'approvedAt', 'createdAt'];
    const sanitized: any = { ...updates };
    for (const field of timestampFields) {
      if (field in sanitized && sanitized[field] !== null && sanitized[field] !== undefined) {
        if (typeof sanitized[field] === 'string') {
          sanitized[field] = new Date(sanitized[field]);
        }
      }
    }
    const result = await db.update(speakers).set(sanitized).where(eq(speakers.id, id)).returning();
    return result[0];
  }

  async deleteSpeaker(id: number, deletionType: "immediate" | "retention" = "retention"): Promise<boolean> {
    if (deletionType === "immediate") {
      try {
        // Get content IDs first so we can clean up access codes and downloads
        const contentRows = await db.select({ id: speakerContent.id }).from(speakerContent).where(eq(speakerContent.speakerId, id));
        const contentIds = contentRows.map(c => c.id);

        // Clean up associated data
        await db.delete(speakerEvents).where(eq(speakerEvents.speakerId, id));
        await db.delete(speakerVideoLinks).where(eq(speakerVideoLinks.speakerId, id));
        await db.delete(speakerInteractions).where(eq(speakerInteractions.speakerId, id));
        await db.delete(speakerTopics).where(eq(speakerTopics.speakerId, id));
        await db.delete(videos).where(eq(videos.speakerId, id));
        await db.delete(reviews).where(eq(reviews.speakerId, id));
        await db.delete(inquiries).where(eq(inquiries.speakerId, id));
        await db.delete(userLikes).where(eq(userLikes.speakerId, id));
        await db.delete(userBookmarks).where(eq(userBookmarks.speakerId, id));

        // Clean up content-related data
        if (contentIds.length > 0) {
          await db.delete(contentDownloads).where(inArray(contentDownloads.contentId, contentIds));
          await db.delete(contentAccessCodes).where(inArray(contentAccessCodes.contentId, contentIds));
        }
        await db.delete(speakerContent).where(eq(speakerContent.speakerId, id));

        // Permanently delete the speaker record
        const result = await db.delete(speakers).where(eq(speakers.id, id));
        return result.rowCount ? result.rowCount > 0 : false;
      } catch (error) {
        console.error("Failed to delete speaker:", error);
        return false;
      }
    } else {
      // Hide profile and set deletion timestamp for 14-day retention
      const deletedAt = new Date();
      const result = await db.update(speakers).set({ 
        hideProfile: true,
        deletedAt: deletedAt
      }).where(eq(speakers.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    }
  }

  async getFeaturedSpeakers(): Promise<Speaker[]> {
    const result = await db.select().from(speakers).where(
      and(eq(speakers.featured, true), eq(speakers.hideProfile, false))
    );
    return result;
  }

  async getSpeakersByTier(tier: 'basic' | 'pro' | 'premier'): Promise<Speaker[]> {
    const result = await db.select().from(speakers).where(
      and(
        eq(speakers.subscriptionTier, tier),
        or(eq(speakers.hideProfile, false), isNull(speakers.hideProfile))
      )
    ).orderBy(desc(speakers.overallRating));
    return result;
  }

  // Reviews
  async getReviewsBySpeakerId(speakerId: number): Promise<Review[]> {
    const result = await db.select().from(reviews)
      .where(and(
        eq(reviews.speakerId, speakerId),
        eq(reviews.approvalStatus, 'approved')
      ))
      .orderBy(desc(reviews.createdAt));
    return result;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  // Inquiries
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    // Clean budget field - remove commas and non-numeric characters except decimal points
    const cleanedInquiry = {
      ...inquiry,
      budget: inquiry.budget ? inquiry.budget.toString().replace(/[,$]/g, '') : inquiry.budget
    };
    
    const result = await db.insert(inquiries).values(cleanedInquiry).returning();
    return result[0];
  }

  async getInquiry(inquiryId: number): Promise<Inquiry | undefined> {
    const result = await db.select().from(inquiries).where(eq(inquiries.id, inquiryId));
    return result[0];
  }

  async deleteInquiry(inquiryId: number): Promise<boolean> {
    const result = await db.delete(inquiries).where(eq(inquiries.id, inquiryId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getInquiriesBySpeakerId(speakerId: number): Promise<Inquiry[]> {
    const result = await db.select().from(inquiries)
      .where(eq(inquiries.speakerId, speakerId))
      .orderBy(desc(inquiries.createdAt));
    return result;
  }

  async getAllInquiries(): Promise<Inquiry[]> {
    const result = await db.select({
      id: inquiries.id,
      speakerId: inquiries.speakerId,
      clientName: inquiries.clientName,
      clientEmail: inquiries.clientEmail,
      clientCompany: inquiries.clientCompany,
      eventType: inquiries.eventType,
      eventDate: inquiries.eventDate,
      eventLocation: inquiries.eventLocation,
      budget: inquiries.budget,
      message: inquiries.message,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      speakerName: speakers.name,
    }).from(inquiries)
      .leftJoin(speakers, eq(inquiries.speakerId, speakers.id))
      .orderBy(desc(inquiries.createdAt));
    return result;
  }

  async updateInquiryStatus(inquiryId: number, status: string, adminNotes?: string): Promise<Inquiry | null> {
    const result = await db.update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, inquiryId))
      .returning();
    return result[0] || null;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    // Only legacy flat categories (no discipline). Discipline-scoped categories
    // are served via getCategoriesByDiscipline.
    const result = await db.select().from(categories).where(isNull(categories.disciplineId));
    
    // Deduplicate categories by name (merge duplicates)
    const categoryMap = new Map<string, Category>();
    result.forEach(category => {
      if (!categoryMap.has(category.name)) {
        categoryMap.set(category.name, category);
      }
    });
    
    const uniqueCategories = Array.from(categoryMap.values());
    
    // Get speaker counts per category by counting speakers.categories array directly
    const countMap = new Map<string, number>();
    
    // For each unique category, count speakers that have it in their categories array
    for (const category of uniqueCategories) {
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(speakers)
        .where(sql`${speakers.categories} @> ARRAY[${category.name}]`);
      
      countMap.set(category.name, parseInt(count[0].count as any) || 0);
    }
    
    // Merge counts into categories
    const categoriesWithCounts = uniqueCategories.map(category => ({
      ...category,
      speakerCount: countMap.get(category.name) || 0
    }));
    
    return categoriesWithCounts.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== Disciplines & two-level taxonomy =====
  async getDisciplines(): Promise<(Discipline & { categoryCount: number; speakerCount: number })[]> {
    const allDisciplines = await db.select().from(disciplines).orderBy(disciplines.sortOrder, disciplines.name);

    // Get all category IDs grouped by discipline in one query
    const allCats = await db.select({ id: categories.id, disciplineId: categories.disciplineId }).from(categories);
    const catIdsByDiscipline = new Map<number, number[]>();
    for (const c of allCats) {
      if (c.disciplineId == null) continue;
      const arr = catIdsByDiscipline.get(c.disciplineId) ?? [];
      arr.push(c.id);
      catIdsByDiscipline.set(c.disciplineId, arr);
    }

    const result = [];
    for (const d of allDisciplines) {
      const discCatIds = catIdsByDiscipline.get(d.id) ?? [];
      const catCount = discCatIds.length;

      // Count visible speakers whose speakerDisciplineIds includes this discipline.
      // speakerDisciplineIds is populated by the auto-migration and contains all
      // disciplines a speaker belongs to (one or more exact matches).
      const countRow = await db
        .select({ count: sql<number>`count(*)` })
        .from(speakers)
        .where(
          and(
            or(eq(speakers.hideProfile, false), isNull(speakers.hideProfile)),
            sql`${speakers.speakerDisciplineIds} && ARRAY[${d.id}]::integer[]`
          )
        );
      const spkCount = parseInt(countRow[0].count as any) || 0;

      result.push({
        ...d,
        categoryCount: catCount,
        speakerCount: spkCount,
      });
    }
    return result;
  }

  async getDiscipline(id: number): Promise<Discipline | undefined> {
    const result = await db.select().from(disciplines).where(eq(disciplines.id, id));
    return result[0];
  }

  async createDiscipline(discipline: InsertDiscipline): Promise<Discipline> {
    const result = await db.insert(disciplines).values(discipline).returning();
    return result[0];
  }

  async updateDiscipline(id: number, updates: Partial<InsertDiscipline>): Promise<Discipline | undefined> {
    const result = await db.update(disciplines).set(updates).where(eq(disciplines.id, id)).returning();
    return result[0];
  }

  async deleteDiscipline(id: number): Promise<boolean> {
    // Remove discipline link from its categories and speakers first
    await db.update(categories).set({ disciplineId: null }).where(eq(categories.disciplineId, id));
    await db.update(speakers).set({ disciplineId: null }).where(eq(speakers.disciplineId, id));
    const result = await db.delete(disciplines).where(eq(disciplines.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getCategoriesByDiscipline(disciplineId: number): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .where(eq(categories.disciplineId, disciplineId))
      .orderBy(categories.sortOrder, categories.name);
  }

  async createCategoryForDiscipline(disciplineId: number, name: string, description: string = ""): Promise<Category> {
    const existing = await db
      .select({ max: sql<number>`coalesce(max(${categories.sortOrder}), -1)` })
      .from(categories)
      .where(eq(categories.disciplineId, disciplineId));
    const nextSort = (parseInt(existing[0].max as any) || -1) + 1;
    const result = await db
      .insert(categories)
      .values({ name, description, disciplineId, sortOrder: nextSort, speakerCount: 0 })
      .returning();
    return result[0];
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return result[0];
  }

  async updateSpeakerDiscipline(
    speakerId: number,
    disciplineIds: number[],
    categoryIds: number[],
    status: string = "manual"
  ): Promise<Speaker | undefined> {
    const primaryDisciplineId = disciplineIds.length > 0 ? disciplineIds[0] : null;
    const result = await db
      .update(speakers)
      .set({
        disciplineId: primaryDisciplineId,
        speakerDisciplineIds: disciplineIds,
        speakerCategoryIds: categoryIds,
        disciplineMigrationStatus: status,
      })
      .where(eq(speakers.id, speakerId))
      .returning();
    return result[0];
  }

  async getSpeakersByMigrationStatus(status: string): Promise<Speaker[]> {
    return db.select().from(speakers).where(eq(speakers.disciplineMigrationStatus, status));
  }

  // Speaking Topics
  async getSpeakingTopics(disciplineId?: number): Promise<SpeakingTopic[]> {
    const conditions = [eq(speakingTopics.isActive, true)];
    if (disciplineId !== undefined) {
      conditions.push(eq(speakingTopics.disciplineId, disciplineId));
    }
    const result = await db.select().from(speakingTopics)
      .where(and(...conditions))
      .orderBy(speakingTopics.name);
    return result;
  }

  async createSpeakingTopic(topic: InsertSpeakingTopic): Promise<SpeakingTopic> {
    const result = await db.insert(speakingTopics).values(topic).returning();
    return result[0];
  }

  async getSpeakingTopicByName(name: string): Promise<SpeakingTopic | undefined> {
    const result = await db.select().from(speakingTopics)
      .where(eq(speakingTopics.name, name))
      .limit(1);
    return result[0];
  }

  async updateTopicSpeakerCount(topicId: number): Promise<void> {
    const speakerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(speakerTopics)
      .where(eq(speakerTopics.topicId, topicId));
    
    await db.update(speakingTopics)
      .set({ speakerCount: parseInt(speakerCount[0]?.count as any) || 0 })
      .where(eq(speakingTopics.id, topicId));
  }

  // Speaker Topics
  async getSpeakerTopicsBySpeakerId(speakerId: number): Promise<SpeakingTopic[]> {
    const result = await db
      .select({
        id: speakingTopics.id,
        name: speakingTopics.name,
        slug: speakingTopics.slug,
        description: speakingTopics.description,
        speakerCount: speakingTopics.speakerCount,
        category: speakingTopics.category,
        isActive: speakingTopics.isActive,
        createdAt: speakingTopics.createdAt,
      })
      .from(speakerTopics)
      .innerJoin(speakingTopics, eq(speakerTopics.topicId, speakingTopics.id))
      .where(and(
        eq(speakerTopics.speakerId, speakerId),
        eq(speakingTopics.isActive, true)
      ))
      .orderBy(speakingTopics.name);
    return result;
  }

  async addSpeakerTopic(speakerId: number, topicId: number): Promise<SpeakerTopic> {
    const result = await db.insert(speakerTopics).values({
      speakerId,
      topicId
    }).returning();
    return result[0];
  }

  async removeSpeakerTopic(speakerId: number, topicId: number): Promise<boolean> {
    const result = await db.delete(speakerTopics)
      .where(and(
        eq(speakerTopics.speakerId, speakerId),
        eq(speakerTopics.topicId, topicId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async bulkAddSpeakerTopics(speakerId: number, topicIds: number[]): Promise<void> {
    if (topicIds.length === 0) return;
    
    const values = topicIds.map(topicId => ({
      speakerId,
      topicId
    }));
    
    await db.insert(speakerTopics).values(values);
  }

  async clearSpeakerTopics(speakerId: number): Promise<void> {
    await db.delete(speakerTopics)
      .where(eq(speakerTopics.speakerId, speakerId));
  }

  // Videos
  async getVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    const result = await db.select().from(videos)
      .where(eq(videos.speakerId, speakerId))
      .orderBy(desc(videos.createdAt));
    return result;
  }

  async getFeaturedVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    const result = await db.select().from(videos)
      .where(and(eq(videos.speakerId, speakerId), eq(videos.featured, true)))
      .orderBy(desc(videos.createdAt));
    return result;
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const result = await db.insert(videos).values(video).returning();
    return result[0];
  }

  async updateVideoViewCount(videoId: number): Promise<void> {
    await db.update(videos)
      .set({ viewCount: sql`${videos.viewCount} + 1` })
      .where(eq(videos.id, videoId));
  }

  // User Authentication
  async getUserByEmail(email: string): Promise<User | undefined> {
    // First try to get user with speaker_id
    const speakerUser = await db.select().from(users)
      .where(and(eq(users.email, email), isNotNull(users.speakerId)));
    
    if (speakerUser.length > 0) {
      return speakerUser[0];
    }
    
    // Fallback to any user with this email
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserBannerColor(id: string, bannerColor: string | null): Promise<void> {
    await db.execute(
      sql`UPDATE users SET banner_color = ${bannerColor} WHERE id = ${id}`
    );
  }

  async updateUserAccountType(id: string, accountType: string): Promise<User> {
    const result = await db.update(users)
      .set({ accountType })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Speaker Application Methods
  async createSpeakerApplication(application: InsertSpeakerApplication): Promise<SpeakerApplication> {
    const result = await db.insert(speakerApplications).values(application).returning();
    return result[0];
  }

  async getSpeakerApplicationByEmail(email: string): Promise<SpeakerApplication | undefined> {
    const result = await db.select().from(speakerApplications).where(eq(speakerApplications.email, email));
    return result[0];
  }

  async getSpeakerApplicationById(id: number): Promise<SpeakerApplication | undefined> {
    const result = await db.select().from(speakerApplications).where(eq(speakerApplications.id, id));
    return result[0];
  }

  async getAllSpeakerApplications(): Promise<SpeakerApplication[]> {
    return db.select().from(speakerApplications).orderBy(speakerApplications.createdAt);
  }

  async updateSpeakerApplicationStatus(id: number, status: string, adminNotes?: string, reviewedBy?: string): Promise<SpeakerApplication> {
    const result = await db.update(speakerApplications)
      .set({ 
        status, 
        adminNotes, 
        reviewedBy, 
        reviewedAt: new Date() 
      })
      .where(eq(speakerApplications.id, id))
      .returning();
    return result[0];
  }

  async updateSpeakerApplicationVerification(id: number, verification: { identityVerificationSessionId: string; identityVerificationStatus: string; identityVerifiedAt: Date | null }): Promise<SpeakerApplication | undefined> {
    const result = await db.update(speakerApplications)
      .set({
        identityVerificationSessionId: verification.identityVerificationSessionId,
        identityVerificationStatus: verification.identityVerificationStatus,
        identityVerifiedAt: verification.identityVerifiedAt
      })
      .where(eq(speakerApplications.id, id))
      .returning();
    return result[0];
  }

  // Helper method to generate unique slug
  private async generateUniqueSlug(firstName: string, lastName: string): Promise<string> {
    const baseSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-');
    
    // Check if base slug exists
    const existingSpeaker = await db.select().from(speakers)
      .where(eq(speakers.slug, baseSlug))
      .limit(1);
    
    if (existingSpeaker.length === 0) {
      return baseSlug;
    }
    
    // If exists, find next available number suffix
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;
    
    while (true) {
      const existingWithSuffix = await db.select().from(speakers)
        .where(eq(speakers.slug, uniqueSlug))
        .limit(1);
      
      if (existingWithSuffix.length === 0) {
        return uniqueSlug;
      }
      
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }
  }

  async approveSpeakerApplication(applicationId: number, reviewedBy: string): Promise<{ speaker: Speaker; user: User }> {
    const application = await this.getSpeakerApplicationById(applicationId);
    if (!application) throw new Error("Application not found");

    // Generate unique slug
    const uniqueSlug = await this.generateUniqueSlug(application.firstName, application.lastName);

    // Create speaker profile
    const speakerData: InsertSpeaker = {
      name: `${application.firstName} ${application.lastName}`,
      slug: uniqueSlug,
      title: application.title,
      bio: application.biography,
      expertise: application.specificTopics.split(',').map(s => s.trim()),
      location: "Location TBD",
      imageUrl: "/api/placeholder/300/300",
      verified: true, // Set to true so Speaker Resources tab appears
      featured: false,
      categories: application.selectedCategories,
      disciplineId: application.selectedDisciplineId ?? null,
      speakerCategoryIds: application.selectedCategoryIds || [],
      speakerDisciplineIds: application.selectedDisciplineId ? [application.selectedDisciplineId] : [],
      disciplineMigrationStatus: application.selectedDisciplineId ? "confirmed" : null,
      achievements: [],
      lectures: [],
      eventPhotos: [],
      speakingVideos: [],
      email: application.email,
      phone: application.phone,
      website: application.website,
      socialMedia: [],
      instagramHandle: application.instagramUrl,
      facebookHandle: application.facebookUrl,
      xHandle: application.twitterUrl,
      linkedinHandle: application.linkedinUrl,
      languages: ["English"],
      medicalSpecialties: [application.specialty],
      speakerType: "clinical",
      fee: "Contact for pricing",
      experience: parseInt(application.yearsExperience) || 0,
      education: application.credentials,
      hideProfile: false,
      hideRatings: false,
      hideSocial: false,
      hideContact: true // Hide contact information by default
    };

    const speakerResult = await db.insert(speakers).values(speakerData).returning();
    const speaker = speakerResult[0];

    // Assign selected topics to the speaker if provided
    if (application.selectedTopicIds && application.selectedTopicIds.length > 0) {
      await this.bulkAddSpeakerTopics(speaker.id, application.selectedTopicIds);
      
      // Update speaker counts for the selected topics
      for (const topicId of application.selectedTopicIds) {
        await this.updateTopicSpeakerCount(topicId);
      }
      
      // Update speaker categories based on their selected topics
      const speakerTopics = await this.getSpeakerTopicsBySpeakerId(speaker.id);
      const uniqueCategories = new Set(speakerTopics
        .map(topic => topic.category)
        .filter(category => category !== null && category !== undefined)
      );
      
      if (uniqueCategories.size > 0) {
        await db.update(speakers)
          .set({ categories: Array.from(uniqueCategories) as string[] })
          .where(eq(speakers.id, speaker.id));
      }
    }

    // Create user account with temporary password hash
    const userData: InsertUser = {
      email: application.email,
      passwordHash: "temp_hash", // Admin will need to set up password
      firstName: application.firstName,
      lastName: application.lastName,
      title: application.title,
      accountType: "speaker",
      speakerId: speaker.id,
      emailVerified: true,
      isActive: true
    };

    const userResult = await db.insert(users).values(userData).returning();
    const user = userResult[0];

    // Update application status
    await this.updateSpeakerApplicationStatus(
      applicationId, 
      "approved", 
      "Application approved and speaker profile created", 
      reviewedBy
    );

    // Link the created speaker to the application
    await db.update(speakerApplications)
      .set({ createdSpeakerId: speaker.id })
      .where(eq(speakerApplications.id, applicationId));

    return { speaker, user };
  }

  // User Sessions
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const result = await db.insert(userSessions).values(session).returning();
    return result[0];
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    const result = await db.select({ user: users })
      .from(userSessions)
      .innerJoin(users, eq(userSessions.userId, users.id))
      .where(and(
        eq(userSessions.token, token),
        gte(userSessions.expiresAt, new Date())
      ));
    return result[0]?.user;
  }

  async getUserSessionByToken(token: string): Promise<UserSession | undefined> {
    const result = await db.select().from(userSessions)
      .where(and(
        eq(userSessions.token, token),
        gte(userSessions.expiresAt, new Date())
      ));
    return result[0];
  }

  async deleteUserSession(token: string): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.token, token));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User Interactions
  async createUserLike(like: InsertUserLike): Promise<UserLike> {
    const result = await db.insert(userLikes).values(like).returning();
    return result[0];
  }

  async deleteUserLike(userId: string, speakerId: number): Promise<boolean> {
    const result = await db.delete(userLikes)
      .where(and(eq(userLikes.userId, userId), eq(userLikes.speakerId, speakerId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUserLikes(userId: string): Promise<UserLike[]> {
    const result = await db.select().from(userLikes).where(eq(userLikes.userId, userId));
    return result;
  }

  async createUserBookmark(bookmark: InsertUserBookmark): Promise<UserBookmark> {
    const result = await db.insert(userBookmarks).values(bookmark).returning();
    return result[0];
  }

  async deleteUserBookmark(userId: string, speakerId: number): Promise<boolean> {
    const result = await db.delete(userBookmarks)
      .where(and(eq(userBookmarks.userId, userId), eq(userBookmarks.speakerId, speakerId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUserBookmarks(userId: string): Promise<UserBookmark[]> {
    const result = await db.select().from(userBookmarks).where(eq(userBookmarks.userId, userId));
    return result;
  }

  async getUserReviews(userId: string): Promise<any[]> {
    const result = await db.select({
      id: reviews.id,
      speakerId: reviews.speakerId,
      userId: reviews.userId,
      reviewerName: reviews.reviewerName,
      reviewerTitle: reviews.reviewerTitle,
      reviewerCompany: reviews.reviewerCompany,
      overallRating: reviews.overallRating,
      speakingStyleRating: reviews.speakingStyleRating,
      podiumPresenceRating: reviews.podiumPresenceRating,
      technicalProficiencyRating: reviews.technicalProficiencyRating,
      contentRelevanceRating: reviews.contentRelevanceRating,
      easeOfWorkingRating: reviews.easeOfWorkingRating,
      visualDesignRating: reviews.visualDesignRating,
      comment: reviews.comment,
      eventType: reviews.eventType,
      eventDate: reviews.eventDate,
      photoUrl: reviews.photoUrl,
      verified: reviews.verified,
      approvalStatus: reviews.approvalStatus,
      adminNotes: reviews.adminNotes,
      approvedAt: reviews.approvedAt,
      approvedBy: reviews.approvedBy,
      createdAt: reviews.createdAt,
      // Include speaker information
      speakerName: speakers.name,
      speakerSlug: speakers.slug,
      speakerImageUrl: speakers.imageUrl
    })
    .from(reviews)
    .leftJoin(speakers, eq(reviews.speakerId, speakers.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));
    return result;
  }

  async getUserInquiries(userEmail: string): Promise<any[]> {
    // Match directly by email and include speaker information
    const result = await db.select({
      id: inquiries.id,
      speakerId: inquiries.speakerId,
      clientName: inquiries.clientName,
      clientEmail: inquiries.clientEmail,
      clientCompany: inquiries.clientCompany,
      eventType: inquiries.eventType,
      eventDate: inquiries.eventDate,
      eventLocation: inquiries.eventLocation,
      budget: inquiries.budget,
      message: inquiries.message,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      // Include speaker information
      speakerName: speakers.name,
      speakerSlug: speakers.slug,
      speakerImageUrl: speakers.imageUrl
    })
    .from(inquiries)
    .leftJoin(speakers, eq(inquiries.speakerId, speakers.id))
    .where(eq(inquiries.clientEmail, userEmail))
    .orderBy(desc(inquiries.createdAt));
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users)
      .orderBy(desc(users.createdAt));
    return result;
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Get user email before deletion to clean up inquiries
      const user = await db.select().from(users).where(eq(users.id, userId));
      const userEmail = user[0]?.email;
      
      // Clean up related data first
      await db.delete(userSessions).where(eq(userSessions.userId, userId));
      await db.delete(userLikes).where(eq(userLikes.userId, userId));
      await db.delete(userBookmarks).where(eq(userBookmarks.userId, userId));
      await db.delete(reviews).where(eq(reviews.userId, userId));
      await db.delete(contentDownloads).where(eq(contentDownloads.userId, userId));
      await db.delete(subscriptionHistory).where(eq(subscriptionHistory.userId, userId));

      // Clean up inquiries made by this user (as a client)
      if (userEmail) {
        await db.delete(inquiries).where(eq(inquiries.clientEmail, userEmail));
      }
      
      // Delete the user
      const result = await db.delete(users).where(eq(users.id, userId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Failed to delete user:", error);
      return false;
    }
  }

  // Bookmark utility methods
  async toggleUserBookmark(userId: string, speakerId: number): Promise<{ bookmarked: boolean }> {
    // Check if bookmark exists
    const existing = await db.select().from(userBookmarks)
      .where(and(eq(userBookmarks.userId, userId), eq(userBookmarks.speakerId, speakerId)));
    
    if (existing.length > 0) {
      // Remove bookmark
      await this.deleteUserBookmark(userId, speakerId);
      return { bookmarked: false };
    } else {
      // Add bookmark
      await this.createUserBookmark({ userId, speakerId });
      return { bookmarked: true };
    }
  }

  async isUserBookmarked(userId: string, speakerId: number): Promise<boolean> {
    const result = await db.select().from(userBookmarks)
      .where(and(eq(userBookmarks.userId, userId), eq(userBookmarks.speakerId, speakerId)));
    return result.length > 0;
  }

  async getUserBookmarkIds(userId: string): Promise<number[]> {
    const result = await db.select().from(userBookmarks)
      .where(eq(userBookmarks.userId, userId));
    return result.map(bookmark => bookmark.speakerId);
  }


  // Speaker Interaction Tracking
  async createSpeakerInteraction(interaction: InsertSpeakerInteraction): Promise<SpeakerInteraction> {
    const [result] = await db.insert(speakerInteractions).values(interaction).returning();
    return result;
  }

  async getSpeakerInteractionAnalytics(speakerId: number, timeframe: string): Promise<any> {
    const now = new Date();
    let startDate = new Date();

    // Calculate start date based on timeframe
    switch (timeframe) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const interactions = await db.select()
      .from(speakerInteractions)
      .where(
        and(
          eq(speakerInteractions.speakerId, speakerId),
          gte(speakerInteractions.createdAt, startDate)
        )
      )
      .orderBy(desc(speakerInteractions.createdAt));

    // Get actual favorite count from bookmarks table (accurate count of unique users)
    const [bookmarkCount] = await db.select({ count: sql<number>`count(*)` })
      .from(userBookmarks)
      .where(eq(userBookmarks.speakerId, speakerId));
    const actualFavoriteCount = Number(bookmarkCount?.count || 0);

    // Group interactions by type and calculate statistics
    const analytics = {
      totalInteractions: interactions.length,
      profileViews: interactions.filter(i => i.interactionType === 'profile_view').length,
      videoPlays: interactions.filter(i => i.interactionType === 'video_play').length,
      contactFormOpens: interactions.filter(i => i.interactionType === 'contact_form_open').length,
      inquirySubmissions: interactions.filter(i => i.interactionType === 'inquiry_submit').length,
      favoriteAdds: actualFavoriteCount,
      socialClicks: interactions.filter(i => i.interactionType === 'social_click').length,
      phoneClicks: interactions.filter(i => i.interactionType === 'phone_click').length,
      emailClicks: interactions.filter(i => i.interactionType === 'email_click').length,
      websiteClicks: interactions.filter(i => i.interactionType === 'website_click').length,
      reviewSectionViews: interactions.filter(i => i.interactionType === 'review_section_view').length,
      tagClicks: interactions.filter(i => i.interactionType === 'tag_click').length,
      bioExpands: interactions.filter(i => i.interactionType === 'bio_expand').length,
      shareClicks: interactions.filter(i => i.interactionType === 'share_click').length,
      deviceBreakdown: {
        desktop: interactions.filter(i => i.deviceType === 'desktop').length,
        mobile: interactions.filter(i => i.deviceType === 'mobile').length,
        tablet: interactions.filter(i => i.deviceType === 'tablet').length,
      },
      averageTimeOnPage: interactions
        .filter(i => i.timeOnPage)
        .reduce((acc, i) => acc + (i.timeOnPage || 0), 0) / 
        interactions.filter(i => i.timeOnPage).length || 0,
      averageScrollDepth: interactions
        .filter(i => i.scrollDepth)
        .reduce((acc, i) => acc + (i.scrollDepth || 0), 0) / 
        interactions.filter(i => i.scrollDepth).length || 0,
      timeframe,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };

    return analytics;
  }

  async updateSpeakerAnalytics(speakerId: number, interactionType: string): Promise<void> {
    // This method can be used to update aggregate analytics tables if needed
    // For now, we're just tracking individual interactions
    // In the future, we could add logic to update speakerAnalytics table for faster queries
  }

  async getUserSession(token: string): Promise<UserSession | undefined> {
    const [result] = await db.select().from(userSessions)
      .where(eq(userSessions.token, token));
    return result;
  }

  // Speaker Content Management Methods
  async createSpeakerContent(content: InsertSpeakerContent): Promise<SpeakerContent> {
    const result = await db.insert(speakerContent).values(content).returning();
    return result[0];
  }

  async getSpeakerContent(speakerId: number): Promise<SpeakerContent[]> {
    return await db
      .select()
      .from(speakerContent)
      .where(eq(speakerContent.speakerId, speakerId))
      .orderBy(desc(speakerContent.createdAt));
  }

  async getSpeakerContentById(contentId: number): Promise<SpeakerContent | undefined> {
    const result = await db
      .select()
      .from(speakerContent)
      .where(eq(speakerContent.id, contentId));
    return result[0];
  }

  async updateSpeakerContent(contentId: number, updates: Partial<SpeakerContent>): Promise<SpeakerContent | undefined> {
    const result = await db
      .update(speakerContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(speakerContent.id, contentId))
      .returning();
    return result[0];
  }

  async deleteSpeakerContent(contentId: number): Promise<boolean> {
    const result = await db
      .delete(speakerContent)
      .where(eq(speakerContent.id, contentId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementContentDownloadCount(contentId: number): Promise<void> {
    await db
      .update(speakerContent)
      .set({ 
        downloadCount: sql`${speakerContent.downloadCount} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(speakerContent.id, contentId));
  }

  // Content Access Code Management
  async createContentAccessCode(accessCode: InsertContentAccessCode): Promise<ContentAccessCode> {
    const result = await db
      .insert(contentAccessCodes)
      .values(accessCode)
      .returning();
    return result[0];
  }

  async getContentAccessCodes(contentId: number): Promise<ContentAccessCode[]> {
    return await db
      .select()
      .from(contentAccessCodes)
      .where(eq(contentAccessCodes.contentId, contentId))
      .orderBy(desc(contentAccessCodes.createdAt));
  }

  async validateAccessCode(contentId: number, code: string): Promise<ContentAccessCode | undefined> {
    const result = await db
      .select()
      .from(contentAccessCodes)
      .where(
        and(
          eq(contentAccessCodes.contentId, contentId),
          eq(contentAccessCodes.accessCode, code),
          eq(contentAccessCodes.isActive, true)
        )
      );
    
    const accessCode = result[0];
    if (!accessCode) return undefined;
    
    // Check expiration
    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      return undefined;
    }
    
    // Check usage limit
    if (accessCode.maxUses && accessCode.currentUses && accessCode.currentUses >= accessCode.maxUses) {
      return undefined;
    }
    
    return accessCode;
  }

  async incrementAccessCodeUsage(accessCodeId: number): Promise<void> {
    await db
      .update(contentAccessCodes)
      .set({ 
        currentUses: sql`${contentAccessCodes.currentUses} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(contentAccessCodes.id, accessCodeId));
  }

  async updateAccessCodeUsage(accessCodeId: number): Promise<void> {
    await db
      .update(contentAccessCodes)
      .set({ 
        currentUses: sql`${contentAccessCodes.currentUses} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(contentAccessCodes.id, accessCodeId));
  }

  async updateContentAccessCode(accessCodeId: number, updates: { description?: string; isActive?: boolean; expiresAt?: Date | null; maxUses?: number | null }): Promise<ContentAccessCode | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.expiresAt !== undefined) updateData.expiresAt = updates.expiresAt;
    if (updates.maxUses !== undefined) updateData.maxUses = updates.maxUses;

    const result = await db
      .update(contentAccessCodes)
      .set(updateData)
      .where(eq(contentAccessCodes.id, accessCodeId))
      .returning();
    return result[0];
  }

  async deleteContentAccessCode(accessCodeId: number): Promise<boolean> {
    const codeToDelete = await db
      .select()
      .from(contentAccessCodes)
      .where(eq(contentAccessCodes.id, accessCodeId));
    if (!codeToDelete.length) return false;

    const contentId = codeToDelete[0].contentId;

    const result = await db
      .delete(contentAccessCodes)
      .where(eq(contentAccessCodes.id, accessCodeId));

    if (!result.rowCount || result.rowCount === 0) return false;

    const remaining = await db
      .select()
      .from(contentAccessCodes)
      .where(eq(contentAccessCodes.contentId, contentId));

    if (remaining.length === 0) {
      await db
        .update(speakerContent)
        .set({ requiresAccessCode: false })
        .where(eq(speakerContent.id, contentId));
    }

    return true;
  }

  // Content Download Tracking
  async createContentDownload(download: InsertContentDownload): Promise<ContentDownload> {
    const result = await db
      .insert(contentDownloads)
      .values(download)
      .returning();
    return result[0];
  }

  async getContentDownloads(contentId: number): Promise<ContentDownload[]> {
    return await db
      .select()
      .from(contentDownloads)
      .where(eq(contentDownloads.contentId, contentId))
      .orderBy(desc(contentDownloads.downloadedAt));
  }

  async getSpeakerContentDownloads(speakerId: number): Promise<(ContentDownload & { fileName: string })[]> {
    return await db
      .select({
        id: contentDownloads.id,
        contentId: contentDownloads.contentId,
        userId: contentDownloads.userId,
        accessCodeId: contentDownloads.accessCodeId,
        userEmail: contentDownloads.userEmail,
        userName: contentDownloads.userName,
        userCompany: contentDownloads.userCompany,
        downloadedAt: contentDownloads.downloadedAt,
        ipAddress: contentDownloads.ipAddress,
        userAgent: contentDownloads.userAgent,
        fileName: speakerContent.originalName,
      })
      .from(contentDownloads)
      .innerJoin(speakerContent, eq(contentDownloads.contentId, speakerContent.id))
      .where(eq(speakerContent.speakerId, speakerId))
      .orderBy(desc(contentDownloads.downloadedAt));
  }

  async getUserContentDownloads(userId: string): Promise<ContentDownload[]> {
    return await db
      .select()
      .from(contentDownloads)
      .where(eq(contentDownloads.userId, userId))
      .orderBy(desc(contentDownloads.downloadedAt));
  }

  // Speaker Video Links Methods
  async getSpeakerVideoLinks(speakerId: number): Promise<SpeakerVideoLink[]> {
    return await db
      .select()
      .from(speakerVideoLinks)
      .where(eq(speakerVideoLinks.speakerId, speakerId))
      .orderBy(speakerVideoLinks.position);
  }

  async createSpeakerVideoLink(videoLink: InsertSpeakerVideoLink): Promise<SpeakerVideoLink> {
    const [newLink] = await db
      .insert(speakerVideoLinks)
      .values(videoLink)
      .returning();
    return newLink;
  }

  async updateSpeakerVideoLink(id: number, updates: Partial<InsertSpeakerVideoLink>): Promise<SpeakerVideoLink | undefined> {
    const [updatedLink] = await db
      .update(speakerVideoLinks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(speakerVideoLinks.id, id))
      .returning();
    return updatedLink;
  }

  async deleteSpeakerVideoLink(id: number): Promise<boolean> {
    const result = await db
      .delete(speakerVideoLinks)
      .where(eq(speakerVideoLinks.id, id))
      .returning();
    return result.length > 0;
  }

  async reorderSpeakerVideoLinks(speakerId: number, linkIds: number[]): Promise<void> {
    for (let i = 0; i < linkIds.length; i++) {
      await db
        .update(speakerVideoLinks)
        .set({ position: i, updatedAt: new Date() })
        .where(and(
          eq(speakerVideoLinks.id, linkIds[i]),
          eq(speakerVideoLinks.speakerId, speakerId)
        ));
    }
  }

  // Missing methods to implement IStorage interface
  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, passwordHash: string, tempPassword?: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordHash, 
        tempPassword: tempPassword ?? null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserSetPassword(userId: string, userPasswordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ userPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async resetUserPasswords(userId: string, passwordHash: string, tempPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordHash, 
        tempPassword, 
        userPasswordHash: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserSubscription(userId: string, subscriptionData: Partial<User>): Promise<User> {
    const result = await db.update(users)
      .set({ 
        ...subscriptionData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!result[0]) {
      throw new Error("User not found");
    }
    
    return result[0];
  }

  async getSpeakerApplication(id: number): Promise<SpeakerApplication | undefined> {
    const result = await db.select().from(speakerApplications).where(eq(speakerApplications.id, id)).limit(1);
    return result[0];
  }

  async trackSpeakerInteraction(interaction: InsertSpeakerInteraction): Promise<void> {
    await db.insert(speakerInteractions).values(interaction);
  }

  async getSpeakerAnalytics(speakerId: number, month?: number | null, year?: number | null, timeframe?: string): Promise<any> {
    // Calculate date filter based on timeframe
    let startDate: Date | null = null;
    if (timeframe && timeframe !== 'all') {
      startDate = new Date();
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '180d':
          startDate.setDate(startDate.getDate() - 180);
          break;
        case '365d':
          startDate.setDate(startDate.getDate() - 365);
          break;
        default:
          startDate = null;
      }
    }
    
    // Fetch interactions for this speaker, optionally filtered by date
    const interactions = startDate
      ? await db
          .select()
          .from(speakerInteractions)
          .where(and(
            eq(speakerInteractions.speakerId, speakerId),
            gte(speakerInteractions.createdAt, startDate)
          ))
      : await db
          .select()
          .from(speakerInteractions)
          .where(eq(speakerInteractions.speakerId, speakerId));

    // Engagement interaction types that count as actual profile activity (beyond just viewing)
    const engagementInteractionTypes = [
      'social_click',      // Clicked a social media link
      'tab_click',         // Clicked a tab on the profile (Overview, Resources, Reviews, etc.)
      'resource_download', // Downloaded a resource
      'bio_expand',        // Expanded the bio section
      'share_click',       // Shared the profile
      'website_click',     // Clicked website link
      'inquiry_click',     // Started an inquiry
      'topic_click',       // Clicked a topic tag
      'review_section_view', // Viewed reviews section
    ];

    // Basic metrics
    const profileViews = interactions.filter(i => i.interactionType === 'profile_view').length;
    const socialClicks = interactions.filter(i => i.interactionType === 'social_click').length;
    const shareClicks = interactions.filter(i => i.interactionType === 'share_click').length;
    const websiteClicks = interactions.filter(i => i.interactionType === 'website_click').length;
    const videoPlays = interactions.filter(i => i.interactionType === 'video_play').length;
    const searchAppearances = interactions.filter(i => i.interactionType === 'search_appearance').length;
    
    // Engagement metrics (activity on the profile)
    const tabClicks = interactions.filter(i => i.interactionType === 'tab_click').length;
    const resourceDownloads = interactions.filter(i => i.interactionType === 'resource_download').length;
    const bioExpands = interactions.filter(i => i.interactionType === 'bio_expand').length;
    const inquiryClicks = interactions.filter(i => i.interactionType === 'inquiry_click').length;
    const topicClicks = interactions.filter(i => i.interactionType === 'topic_click').length;
    const reviewSectionViews = interactions.filter(i => i.interactionType === 'review_section_view').length;
    
    // Total engagement clicks (all activity that shows visitor is engaging with the profile)
    const engagementClicks = interactions.filter(i => engagementInteractionTypes.includes(i.interactionType)).length;
    
    // Calculate average time on profile from session_end events
    const sessionEndEvents = interactions.filter(i => i.interactionType === 'session_end');
    let avgTimeOnProfile = 0;
    if (sessionEndEvents.length > 0) {
      const totalTime = sessionEndEvents.reduce((sum, event) => {
        try {
          const metadata = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata;
          return sum + (metadata?.duration || 0);
        } catch {
          return sum;
        }
      }, 0);
      avgTimeOnProfile = Math.round(totalTime / sessionEndEvents.length);
    }

    // Get social media clicks breakdown
    const socialClicksData = interactions
      .filter(i => i.interactionType === 'social_click')
      .map(i => {
        try {
          const metadata = typeof i.metadata === 'string' ? JSON.parse(i.metadata) : i.metadata;
          return metadata?.platform || 'unknown';
        } catch {
          return 'unknown';
        }
      });
    
    const socialClicksByPlatform = {
      instagram: socialClicksData.filter(p => p === 'instagram').length,
      facebook: socialClicksData.filter(p => p === 'facebook').length,
      x: socialClicksData.filter(p => p === 'x' || p === 'twitter').length,
      linkedin: socialClicksData.filter(p => p === 'linkedin').length,
      tiktok: socialClicksData.filter(p => p === 'tiktok').length,
    };

    // Get discovery sources - parse from metadata JSON
    const discoveryData = interactions
      .filter(i => i.interactionType === 'profile_view')
      .map(i => {
        // Try to parse metadata for source field
        if (i.metadata) {
          try {
            const meta = typeof i.metadata === 'string' ? JSON.parse(i.metadata) : i.metadata;
            return meta.source || meta.discoverySource;
          } catch (e) {
            return null;
          }
        }
        // Fallback to referrerSource
        return i.referrerSource;
      })
      .filter(s => s); // Remove nulls
    
    const discoverySources = {
      search: discoveryData.filter(s => s === 'search' || s?.includes('search')).length,
      category: discoveryData.filter(s => s === 'category' || s?.includes('category') || s === 'speaker_card').length,
      featured: discoveryData.filter(s => s === 'featured' || s?.includes('featured')).length,
      direct: discoveryData.filter(s => s === 'direct').length,
    };

    // Get favorites count
    const favoritesCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userBookmarks)
      .where(eq(userBookmarks.speakerId, speakerId));
    
    // Get reviews count
    const reviewsCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(
        and(
          eq(reviews.speakerId, speakerId),
          eq(reviews.approvalStatus, 'approved')
        )
      );

    // Get content downloads with user details
    const downloads = await db
      .select({
        id: contentDownloads.id,
        contentId: contentDownloads.contentId,
        userName: contentDownloads.userName,
        userEmail: contentDownloads.userEmail,
        userCompany: contentDownloads.userCompany,
        downloadedAt: contentDownloads.downloadedAt,
        fileName: speakerContent.fileName,
        originalName: speakerContent.originalName,
        category: speakerContent.category,
      })
      .from(contentDownloads)
      .innerJoin(speakerContent, eq(contentDownloads.contentId, speakerContent.id))
      .where(eq(speakerContent.speakerId, speakerId))
      .orderBy(desc(contentDownloads.downloadedAt))
      .limit(100);

    // Time-series data: group interactions by date for trends
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Determine the month to display
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== null && month !== undefined ? month - 1 : now.getMonth(); // Convert 1-indexed month to 0-indexed
    
    // Get the first and last day of the target month
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0); // Day 0 of next month = last day of current month
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Filter interactions for the selected month
    const monthInteractions = interactions.filter(i => {
      const date = new Date(i.createdAt!);
      return date >= firstDayOfMonth && date <= lastDayOfMonth;
    });

    // Initialize all days of the month with zero values
    const dailyTrends: Record<string, any> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyTrends[dateStr] = {
        date: dateStr,
        day,
        profileViews: 0,
        totalClicks: 0,
        socialClicks: 0,
      };
    }
    
    // Populate with actual interaction data
    monthInteractions.forEach(interaction => {
      const date = new Date(interaction.createdAt!).toISOString().split('T')[0];
      if (dailyTrends[date]) {
        if (interaction.interactionType === 'profile_view') dailyTrends[date].profileViews++;
        if (engagementInteractionTypes.includes(interaction.interactionType)) dailyTrends[date].totalClicks++;
        if (interaction.interactionType === 'social_click') dailyTrends[date].socialClicks++;
      }
    });

    const dailyData = Object.values(dailyTrends).sort((a: any, b: any) => a.date.localeCompare(b.date));

    // Weekly summary (last 7 days)
    const weeklyInteractions = interactions.filter(i => {
      const date = new Date(i.createdAt!);
      return date >= sevenDaysAgo;
    });

    const weeklyViews = weeklyInteractions.filter(i => i.interactionType === 'profile_view').length;
    const weeklyClicks = weeklyInteractions.filter(i => 
      engagementInteractionTypes.includes(i.interactionType)
    ).length;
    const weeklyShares = weeklyInteractions.filter(i => i.interactionType === 'share_click').length;
    const weeklyDownloads = weeklyInteractions.filter(i => i.interactionType === 'resource_download').length;

    // Generate interactionsOverTime based on timeframe
    const interactionsOverTime: Array<{ date: string; views: number; clicks: number }> = [];
    
    if (timeframe === '7d' || timeframe === '30d') {
      // Daily granularity for week and month
      const days = timeframe === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayInteractions = interactions.filter(int => {
          const intDate = new Date(int.createdAt!).toISOString().split('T')[0];
          return intDate === dateStr;
        });
        
        interactionsOverTime.push({
          date: dayLabel,
          views: dayInteractions.filter(i => i.interactionType === 'profile_view').length,
          clicks: dayInteractions.filter(i => engagementInteractionTypes.includes(i.interactionType)).length,
        });
      }
    } else if (timeframe === '90d' || timeframe === '180d') {
      // Weekly granularity for 3-6 months
      const weeks = timeframe === '90d' ? 13 : 26;
      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        const weekLabel = `Week ${weeks - i}`;
        
        const weekInteractions = interactions.filter(int => {
          const intDate = new Date(int.createdAt!);
          return intDate >= weekStart && intDate <= weekEnd;
        });
        
        interactionsOverTime.push({
          date: weekLabel,
          views: weekInteractions.filter(i => i.interactionType === 'profile_view').length,
          clicks: weekInteractions.filter(i => engagementInteractionTypes.includes(i.interactionType)).length,
        });
      }
    } else {
      // Monthly granularity for year or all time
      const months = timeframe === '365d' ? 12 : 6; // Show last 6 months for "all time" as default
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        const monthInteractionsFiltered = interactions.filter(int => {
          const intDate = new Date(int.createdAt!);
          return intDate >= monthStart && intDate <= monthEnd;
        });
        
        interactionsOverTime.push({
          date: monthLabel,
          views: monthInteractionsFiltered.filter(i => i.interactionType === 'profile_view').length,
          clicks: monthInteractionsFiltered.filter(i => engagementInteractionTypes.includes(i.interactionType)).length,
        });
      }
    }

    // Peak activity analysis
    const hourlyActivity: Record<number, number> = {};
    const dayOfWeekActivity: Record<number, number> = {};
    
    interactions.forEach(interaction => {
      if (!interaction.createdAt) return;
      const date = new Date(interaction.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      dayOfWeekActivity[dayOfWeek] = (dayOfWeekActivity[dayOfWeek] || 0) + 1;
    });

    const peakHour = Object.entries(hourlyActivity).sort((a, b) => b[1] - a[1])[0];
    const peakDay = Object.entries(dayOfWeekActivity).sort((a, b) => b[1] - a[1])[0];
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      // Selected period info
      selectedMonth: targetMonth + 1, // Return 1-indexed month
      selectedYear: targetYear,
      daysInMonth,
      
      // Basic metrics
      totalInteractions: interactions.length,
      profileViews,
      websiteClicks,
      socialClicks,
      shareClicks,
      videoPlays,
      searchAppearances,
      
      // Engagement metrics (what people are actually doing on the profile)
      engagementClicks, // Total engagement activity
      tabClicks,
      resourceDownloads,
      bioExpands,
      inquiryClicks,
      topicClicks,
      reviewSectionViews,
      
      // Advanced metrics
      avgTimeOnProfile, // in seconds
      favoritesCount: favoritesCount[0]?.count || 0,
      reviewsCount: reviewsCount[0]?.count || 0,
      
      // Social breakdown
      socialClicksByPlatform,
      
      // Discovery sources
      discoverySources,
      
      // Downloads with details
      downloads: downloads.map(d => ({
        id: d.id,
        contentId: d.contentId,
        fileName: d.originalName || d.fileName,
        category: d.category,
        userName: d.userName,
        userEmail: d.userEmail,
        userCompany: d.userCompany,
        downloadedAt: d.downloadedAt,
      })),
      totalDownloads: downloads.length,
      
      // Trends
      dailyTrends: dailyData,
      weeklyViews,
      weeklyClicks,
      
      // Timeframe-adaptive chart data
      interactionsOverTime,
      
      // Last 7 days summary (for quick stats card)
      last7Days: {
        views: weeklyViews,
        clicks: weeklyClicks,
        shares: weeklyShares,
        downloads: weeklyDownloads,
      },
      
      // Peak activity
      peakActivity: {
        hour: peakHour ? { time: `${peakHour[0]}:00`, count: peakHour[1] } : null,
        dayOfWeek: peakDay ? { day: dayNames[parseInt(peakDay[0])], count: peakDay[1] } : null,
      },
      
      // Hourly and daily distribution for heatmap
      hourlyDistribution: Object.entries(hourlyActivity).map(([hour, count]) => ({ hour: parseInt(hour), count })),
      dailyDistribution: Object.entries(dayOfWeekActivity).map(([day, count]) => ({ day: parseInt(day), dayName: dayNames[parseInt(day)], count })),
      
      // Timeframe info
      selectedTimeframe: timeframe || 'all',
      dateRange: startDate ? { from: startDate.toISOString(), to: new Date().toISOString() } : null,
    };
  }

  // Efficient platform-wide analytics aggregation (for admin dashboard)
  async getPlatformAnalytics(): Promise<{
    totalSpeakers: number;
    totalViews: number;
    totalClicks: number;
    totalInquiries: number;
  }> {
    // Engagement interaction types (must match those in getSpeakerAnalytics)
    const engagementTypes = [
      'social_click',
      'tab_click',
      'resource_download',
      'bio_expand',
      'share_click',
      'website_click',
      'inquiry_click',
      'topic_click',
      'review_section_view',
    ];

    // Get total speakers count
    const speakersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(speakers);
    const totalSpeakers = speakersResult[0]?.count || 0;

    // Get total profile views
    const viewsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(speakerInteractions)
      .where(eq(speakerInteractions.interactionType, 'profile_view'));
    const totalViews = viewsResult[0]?.count || 0;

    // Get total engagement clicks (all engagement interaction types)
    const clicksResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(speakerInteractions)
      .where(inArray(speakerInteractions.interactionType, engagementTypes));
    const totalClicks = clicksResult[0]?.count || 0;

    // Get total inquiries
    const inquiriesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inquiries);
    const totalInquiries = inquiriesResult[0]?.count || 0;

    return {
      totalSpeakers,
      totalViews,
      totalClicks,
      totalInquiries
    };
  }

  // Get top performing speakers efficiently (for admin dashboard)
  async getTopPerformers(limit: number = 10): Promise<Array<{
    speakerId: number;
    name: string;
    profileViews: number;
    engagementClicks: number;
    inquiryClicks: number;
  }>> {
    const engagementTypes = [
      'social_click',
      'tab_click',
      'resource_download',
      'bio_expand',
      'share_click',
      'website_click',
      'inquiry_click',
      'topic_click',
      'review_section_view',
    ];

    // First, get all valid speaker IDs that actually exist
    const validSpeakers = await db
      .select({ id: speakers.id, name: speakers.name })
      .from(speakers);
    
    const validSpeakerIds = validSpeakers.map(s => s.id);
    const nameMap = new Map(validSpeakers.map(s => [s.id, s.name]));
    
    if (validSpeakerIds.length === 0) return [];

    // Get speakers with their interaction counts, filtering to only valid speakers
    const results = await db
      .select({
        speakerId: speakerInteractions.speakerId,
        interactionType: speakerInteractions.interactionType,
        count: sql<number>`count(*)::int`,
      })
      .from(speakerInteractions)
      .where(inArray(speakerInteractions.speakerId, validSpeakerIds))
      .groupBy(speakerInteractions.speakerId, speakerInteractions.interactionType);

    // Aggregate by speaker
    const speakerStats: Record<number, { profileViews: number; engagementClicks: number; inquiryClicks: number }> = {};
    
    for (const row of results) {
      if (!speakerStats[row.speakerId]) {
        speakerStats[row.speakerId] = { profileViews: 0, engagementClicks: 0, inquiryClicks: 0 };
      }
      
      if (row.interactionType === 'profile_view') {
        speakerStats[row.speakerId].profileViews = row.count;
      }
      if (engagementTypes.includes(row.interactionType)) {
        speakerStats[row.speakerId].engagementClicks += row.count;
      }
      if (row.interactionType === 'inquiry_click') {
        speakerStats[row.speakerId].inquiryClicks = row.count;
      }
    }

    // Sort by profile views and return top performers (only speakers with interactions)
    return Object.entries(speakerStats)
      .map(([id, stats]) => ({
        speakerId: parseInt(id),
        name: nameMap.get(parseInt(id)) || 'Unknown Speaker',
        profileViews: stats.profileViews,
        engagementClicks: stats.engagementClicks,
        inquiryClicks: stats.inquiryClicks,
      }))
      .filter(s => s.name !== 'Unknown Speaker') // Extra safety: exclude any that didn't get a name
      .sort((a, b) => b.profileViews - a.profileViews)
      .slice(0, limit);
  }

  // Email verification operations
  async setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        verificationToken: token,
        verificationTokenExpires: expires,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(
        and(
          eq(users.verificationToken, token),
          gte(users.verificationTokenExpires, new Date()) // Token not expired
        )
      );
    return result[0];
  }

  async verifyUserEmail(userId: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async clearVerificationToken(userId: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        verificationToken: null,
        verificationTokenExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Password reset operations
  async setPasswordResetToken(userId: string, tokenHash: string, expires: Date): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUserByPasswordResetToken(tokenHash: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(and(
        eq(users.passwordResetToken, tokenHash),
        gte(users.passwordResetExpires, new Date()) // Token must not be expired
      ));
    return result[0];
  }

  async clearPasswordResetToken(userId: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    await db.delete(userSessions)
      .where(eq(userSessions.userId, userId));
  }

  async savePasswordResetCode(userId: string, codeHash: string, expiresAt: Date): Promise<void> {
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.userId, userId));
    await db.insert(passwordResetCodes).values({ userId, codeHash, expiresAt });
  }

  async verifyAndConsumeResetCode(userId: string, codeHash: string): Promise<boolean> {
    const result = await db.select().from(passwordResetCodes)
      .where(and(
        eq(passwordResetCodes.userId, userId),
        eq(passwordResetCodes.codeHash, codeHash),
        gte(passwordResetCodes.expiresAt, new Date()),
        isNull(passwordResetCodes.usedAt)
      ))
      .limit(1);
    if (!result[0]) return false;
    await db.update(passwordResetCodes)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetCodes.id, result[0].id));
    return true;
  }

  async deletePasswordResetCodes(userId: string): Promise<void> {
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.userId, userId));
  }

  // Review management methods
  async getPendingReviews(): Promise<Review[]> {
    const result = await db.select().from(reviews)
      .where(eq(reviews.approvalStatus, 'pending'))
      .orderBy(desc(reviews.createdAt));
    return result;
  }

  async approveReview(reviewId: number, adminNotes?: string): Promise<Review | undefined> {
    const result = await db.update(reviews)
      .set({
        approvalStatus: 'approved',
        adminNotes,
        approvedAt: new Date(),
        approvedBy: 'admin' // In a real app, this would be the admin user ID
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    
    // Recalculate speaker's review count and average rating
    if (result[0]) {
      await this.updateSpeakerReviewStats(result[0].speakerId);
    }
    
    return result[0];
  }

  async rejectReview(reviewId: number, adminNotes?: string): Promise<Review | undefined> {
    const result = await db.update(reviews)
      .set({
        approvalStatus: 'rejected',
        adminNotes,
        approvedAt: new Date(),
        approvedBy: 'admin' // In a real app, this would be the admin user ID
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    
    // Recalculate speaker's review count and average rating (in case this was previously approved)
    if (result[0]) {
      await this.updateSpeakerReviewStats(result[0].speakerId);
    }
    
    return result[0];
  }
  
  private async updateSpeakerReviewStats(speakerId: number): Promise<void> {
    // Get all approved reviews for this speaker
    const approvedReviews = await db.select()
      .from(reviews)
      .where(and(
        eq(reviews.speakerId, speakerId),
        eq(reviews.approvalStatus, 'approved')
      ));
    
    const reviewCount = approvedReviews.length;
    
    // Calculate average rating from overall ratings
    let overallRating = "0.00";
    if (reviewCount > 0) {
      const totalRating = approvedReviews.reduce((sum, r) => sum + Number(r.overallRating), 0);
      overallRating = (totalRating / reviewCount).toFixed(2);
    }
    
    // Update speaker record
    await db.update(speakers)
      .set({
        reviewCount,
        overallRating
      })
      .where(eq(speakers.id, speakerId));
  }

  // Image methods
  async createImage(image: InsertImage): Promise<Image> {
    const result = await db.insert(images).values(image).returning();
    return result[0];
  }

  async getImageById(id: number): Promise<Image | undefined> {
    const result = await db.select().from(images).where(eq(images.id, id));
    return result[0];
  }

  async getImageByChecksum(checksum: string): Promise<Image | undefined> {
    const result = await db.select().from(images).where(eq(images.checksum, checksum));
    return result[0];
  }

  async deleteImage(id: number): Promise<boolean> {
    const result = await db.delete(images).where(eq(images.id, id));
    return (result.rowCount || 0) > 0;
  }

  async saveImageFromBase64(base64Data: string, ownerId: string, ownerType: string = 'user', imageType: string = 'profile'): Promise<{ id: number; url: string; }> {
    // Convert base64 to buffer
    const base64Content = base64Data.split(',')[1] || base64Data;
    const imageBuffer = Buffer.from(base64Content, 'base64');
    
    // Determine MIME type from base64 header or default to jpeg
    let mimeType = 'image/jpeg';
    if (base64Data.startsWith('data:')) {
      const mimeMatch = base64Data.match(/data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }
    
    // Calculate checksum
    const crypto = await import('crypto');
    const checksum = crypto.default.createHash('sha256').update(imageBuffer).digest('hex');
    
    // For profile/headshot images, always create new records to ensure fresh URLs
    // (skip deduplication to avoid confusion during testing/updates)
    if (imageType === 'profile' || imageType === 'headshot') {
      console.log(`[IMAGE DEBUG] Creating new ${imageType} image, skipping deduplication`);
    } else {
      // Check for existing image (only for non-profile images)
      const existingImage = await this.getImageByChecksum(checksum);
      if (existingImage) {
        return {
          id: existingImage.id,
          url: `/api/images/${existingImage.id}`
        };
      }
    }
    
    // Create new image record
    const newImage = await this.createImage({
      filename: `${Date.now()}_profile.${mimeType.split('/')[1]}`,
      originalName: `profile.${mimeType.split('/')[1]}`,
      mimeType,
      size: imageBuffer.length,
      width: undefined,
      height: undefined,
      data: imageBuffer,
      checksum,
      ownerId,
      ownerType,
      entityId: ownerId,
      imageType,
      isPublic: true
    });
    
    return {
      id: newImage.id,
      url: `/api/images/${newImage.id}`
    };
  }

  async getUserBySpeakerId(speakerId: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.speakerId, speakerId));
    return result[0];
  }

  // Video Management (Phase 2)
  async getSpeakerVideos(speakerId: number): Promise<Video[]> {
    return this.getVideosBySpeakerId(speakerId); // Use existing method
  }

  async getVideo(videoId: number): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(eq(videos.id, videoId));
    return result[0];
  }

  async deleteVideo(videoId: number): Promise<boolean> {
    await db.delete(videos).where(eq(videos.id, videoId));
    return true;
  }

  async incrementVideoViewCount(videoId: number): Promise<void> {
    await this.updateVideoViewCount(videoId); // Use existing method
  }

  async updateSpeakerStorage(speakerId: number, bytesChange: number, videoCountChange: number): Promise<void> {
    await db.update(speakers)
      .set({
        storageUsedBytes: sql`GREATEST(0, COALESCE(${speakers.storageUsedBytes}, 0) + ${bytesChange})`,
        videoCount: sql`GREATEST(0, COALESCE(${speakers.videoCount}, 0) + ${videoCountChange})`
      })
      .where(eq(speakers.id, speakerId));
  }

  // Subscription features management
  async listSubscriptionFeatures(): Promise<(SubscriptionFeature & { tiers: Array<{ id: number; tier: string; sortOrder: number; isHighlighted: boolean }> })[]> {
    try {
      const features = await db.select().from(subscriptionFeatures).orderBy(subscriptionFeatures.name);
      
      const featuresWithTiers = await Promise.all(
        features.map(async (feature) => {
          const tierAssociations = await db
            .select({
              id: subscriptionTierFeatures.id,
              tier: subscriptionTierFeatures.tier,
              sortOrder: subscriptionTierFeatures.sortOrder,
              isHighlighted: subscriptionTierFeatures.isHighlighted,
            })
            .from(subscriptionTierFeatures)
            .where(eq(subscriptionTierFeatures.featureId, feature.id))
            .orderBy(subscriptionTierFeatures.sortOrder);
          
          const tiersWithDefaults = tierAssociations.map(tier => ({
            id: tier.id,
            tier: tier.tier,
            sortOrder: tier.sortOrder ?? 0,
            isHighlighted: tier.isHighlighted ?? false,
          }));
          
          return {
            ...feature,
            tiers: tiersWithDefaults,
          };
        })
      );
      
      return featuresWithTiers;
    } catch (error) {
      console.error('Error listing subscription features:', error);
      throw error;
    }
  }

  async listSubscriptionFeaturesByTier(tier: string): Promise<SubscriptionFeature[]> {
    try {
      const result = await db
        .select({
          id: subscriptionFeatures.id,
          slug: subscriptionFeatures.slug,
          name: subscriptionFeatures.name,
          description: subscriptionFeatures.description,
          createdAt: subscriptionFeatures.createdAt,
        })
        .from(subscriptionFeatures)
        .innerJoin(
          subscriptionTierFeatures,
          eq(subscriptionFeatures.id, subscriptionTierFeatures.featureId)
        )
        .where(eq(subscriptionTierFeatures.tier, tier))
        .orderBy(subscriptionTierFeatures.sortOrder);
      
      return result;
    } catch (error) {
      console.error(`Error listing subscription features for tier ${tier}:`, error);
      throw error;
    }
  }

  async createSubscriptionFeature(feature: InsertSubscriptionFeature): Promise<SubscriptionFeature> {
    try {
      const result = await db.insert(subscriptionFeatures).values(feature).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating subscription feature:', error);
      throw error;
    }
  }

  async updateSubscriptionFeature(id: number, feature: Partial<InsertSubscriptionFeature>): Promise<SubscriptionFeature> {
    try {
      const result = await db
        .update(subscriptionFeatures)
        .set(feature)
        .where(eq(subscriptionFeatures.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error(`Subscription feature with id ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error(`Error updating subscription feature ${id}:`, error);
      throw error;
    }
  }

  async deleteSubscriptionFeature(id: number): Promise<void> {
    try {
      // First, delete all tier associations
      await db.delete(subscriptionTierFeatures).where(eq(subscriptionTierFeatures.featureId, id));
      
      // Then delete the feature itself
      const result = await db.delete(subscriptionFeatures).where(eq(subscriptionFeatures.id, id));
      
      if (result.rowCount === 0) {
        throw new Error(`Subscription feature with id ${id} not found`);
      }
    } catch (error) {
      console.error(`Error deleting subscription feature ${id}:`, error);
      throw error;
    }
  }

  async assignFeatureToTier(tierFeature: InsertSubscriptionTierFeature): Promise<SubscriptionTierFeature> {
    try {
      const result = await db.insert(subscriptionTierFeatures).values(tierFeature).returning();
      return result[0];
    } catch (error) {
      console.error('Error assigning feature to tier:', error);
      throw error;
    }
  }

  async updateTierFeature(id: number, updates: Partial<Omit<SubscriptionTierFeature, 'id'>>): Promise<SubscriptionTierFeature> {
    try {
      const result = await db
        .update(subscriptionTierFeatures)
        .set(updates)
        .where(eq(subscriptionTierFeatures.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error(`Tier feature with id ${id} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error(`Error updating tier feature ${id}:`, error);
      throw error;
    }
  }

  async removeTierFeature(id: number): Promise<void> {
    try {
      const result = await db.delete(subscriptionTierFeatures).where(eq(subscriptionTierFeatures.id, id));
      
      if (result.rowCount === 0) {
        throw new Error(`Tier feature with id ${id} not found`);
      }
    } catch (error) {
      console.error(`Error removing tier feature ${id}:`, error);
      throw error;
    }
  }

  // Tier limits management
  async getTierLimit(tier: 'basic' | 'pro' | 'premier'): Promise<TierLimit | undefined> {
    try {
      const result = await db.select().from(tierLimits).where(eq(tierLimits.tier, tier));
      return result[0];
    } catch (error) {
      console.error(`Error fetching tier limits for ${tier}:`, error);
      throw error;
    }
  }

  async getAllTierLimits(): Promise<TierLimit[]> {
    try {
      const result = await db.select().from(tierLimits).orderBy(
        sql`CASE ${tierLimits.tier} WHEN 'basic' THEN 1 WHEN 'pro' THEN 2 WHEN 'premier' THEN 3 ELSE 4 END`
      );
      return result;
    } catch (error) {
      console.error('Error fetching all tier limits:', error);
      throw error;
    }
  }

  async listSpeakerSubscriptions(filter?: { tier?: string; status?: string }): Promise<Array<Speaker & { subscriptionInterval?: string; subscriptionAmount?: number }>> {
    try {
      const conditions = [];
      
      // Filter by subscription tier if provided
      if (filter?.tier) {
        conditions.push(eq(speakers.subscriptionTier, filter.tier));
      }
      
      // Filter by subscription status if provided
      if (filter?.status) {
        conditions.push(eq(speakers.subscriptionStatus, filter.status));
      }
      
      let query = db.select().from(speakers);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      // Order by subscription tier (premier > pro > basic) and then by name
      query = query.orderBy(
        sql`CASE ${speakers.subscriptionTier} 
          WHEN 'premier' THEN 1 
          WHEN 'pro' THEN 2 
          WHEN 'basic' THEN 3 
          ELSE 4 
        END`,
        speakers.name
      ) as any;
      
      const result = await query;
      
      // Fetch real subscription data from Stripe for speakers with active subscriptions
      const speakersWithSubscriptionData = await Promise.all(
        result.map(async (speaker) => {
          if (speaker.stripeSubscriptionId) {
            try {
              const stripe = (await import('stripe')).default;
              const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
                apiVersion: '2025-10-29.clover' as any,
              });
              const subscription = await stripeClient.subscriptions.retrieve(speaker.stripeSubscriptionId);
              const price = subscription.items.data[0]?.price;
              
              return {
                ...speaker,
                subscriptionInterval: price?.recurring?.interval,
                subscriptionAmount: price?.unit_amount || 0,
              };
            } catch (error) {
              console.error(`Error fetching Stripe subscription for speaker ${speaker.id}:`, error);
              // Fallback to tier-based amounts if Stripe fetch fails
              return {
                ...speaker,
                subscriptionInterval: speaker.subscriptionStatus === 'active' ? 'monthly' : undefined,
                subscriptionAmount: speaker.subscriptionTier === 'premier' ? 9900 : speaker.subscriptionTier === 'pro' ? 2900 : 0,
              };
            }
          }
          
          // For speakers without Stripe subscription ID but with active subscription, use tier-based amounts
          return {
            ...speaker,
            subscriptionInterval: speaker.subscriptionStatus === 'active' ? 'monthly' : undefined,
            subscriptionAmount: speaker.subscriptionTier === 'premier' ? 9900 : speaker.subscriptionTier === 'pro' ? 2900 : 0,
          };
        })
      );
      
      return speakersWithSubscriptionData;
    } catch (error) {
      console.error('Error listing speaker subscriptions:', error);
      throw error;
    }
  }

  async updateSpeakerCancellation(speakerId: number, data: {
    reason: string;
    cancelledAt: Date;
    periodEnd?: Date;
    status?: string;
  }): Promise<Speaker> {
    try {
      const updateData: any = {
        cancellationReason: data.reason,
        cancelledAt: data.cancelledAt,
      };
      
      if (data.periodEnd) {
        updateData.subscriptionPeriodEnd = data.periodEnd;
      }
      
      if (data.status) {
        updateData.subscriptionStatus = data.status;
      }
      
      const result = await db
        .update(speakers)
        .set(updateData)
        .where(eq(speakers.id, speakerId))
        .returning();
      
      if (!result || result.length === 0) {
        throw new Error(`Speaker ${speakerId} not found`);
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating speaker cancellation:', error);
      throw error;
    }
  }

  // Speaker Events
  async getSpeakerEvents(speakerId: number, upcomingOnly = false): Promise<SpeakerEvent[]> {
    const conditions = [eq(speakerEvents.speakerId, speakerId)];
    if (upcomingOnly) {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      conditions.push(gte(speakerEvents.eventDate, today));
    }
    const result = await db
      .select()
      .from(speakerEvents)
      .where(and(...conditions))
      .orderBy(speakerEvents.eventDate);
    return result;
  }

  async createSpeakerEvent(event: InsertSpeakerEvent): Promise<SpeakerEvent> {
    const result = await db.insert(speakerEvents).values(event).returning();
    return result[0];
  }

  async updateSpeakerEvent(eventId: number, updates: Partial<InsertSpeakerEvent>): Promise<SpeakerEvent | undefined> {
    const result = await db
      .update(speakerEvents)
      .set(updates)
      .where(eq(speakerEvents.id, eventId))
      .returning();
    return result[0];
  }

  async deleteSpeakerEvent(eventId: number): Promise<boolean> {
    const result = await db.delete(speakerEvents).where(eq(speakerEvents.id, eventId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getSpeakerEventById(eventId: number): Promise<SpeakerEvent | undefined> {
    const result = await db.select().from(speakerEvents).where(eq(speakerEvents.id, eventId));
    return result[0];
  }

  // Topic Requests
  async getTopicRequestsBySpeaker(speakerId: number): Promise<TopicRequest[]> {
    return await db
      .select()
      .from(topicRequests)
      .where(eq(topicRequests.speakerId, speakerId))
      .orderBy(desc(topicRequests.createdAt));
  }

  async getAllTopicRequests(status?: string): Promise<TopicRequest[]> {
    const query = db.select().from(topicRequests);
    if (status) {
      return await query.where(eq(topicRequests.status, status)).orderBy(desc(topicRequests.createdAt));
    }
    return await query.orderBy(desc(topicRequests.createdAt));
  }

  async createTopicRequest(request: InsertTopicRequest): Promise<TopicRequest> {
    const result = await db.insert(topicRequests).values(request).returning();
    return result[0];
  }

  async getTopicRequestById(requestId: number): Promise<TopicRequest | undefined> {
    const result = await db.select().from(topicRequests).where(eq(topicRequests.id, requestId));
    return result[0];
  }

  async updateTopicRequestStatus(requestId: number, status: string, adminNotes?: string): Promise<TopicRequest | undefined> {
    const result = await db
      .update(topicRequests)
      .set({ status, adminNotes: adminNotes ?? null, reviewedAt: new Date() })
      .where(eq(topicRequests.id, requestId))
      .returning();
    return result[0];
  }

  // Review Reactions
  async getReviewReactionCounts(reviewId: number): Promise<{ likes: number; dislikes: number }> {
    const rows = await db
      .select()
      .from(reviewReactions)
      .where(eq(reviewReactions.reviewId, reviewId));
    const likes = rows.filter(r => r.reaction === 'like').length;
    const dislikes = rows.filter(r => r.reaction === 'dislike').length;
    return { likes, dislikes };
  }

  async getUserReviewReaction(reviewId: number, voterIdentifier: string): Promise<string | null> {
    const rows = await db
      .select()
      .from(reviewReactions)
      .where(and(eq(reviewReactions.reviewId, reviewId), eq(reviewReactions.voterIdentifier, voterIdentifier)));
    return rows[0]?.reaction ?? null;
  }

  async upsertReviewReaction(reviewId: number, voterIdentifier: string, reaction: string): Promise<void> {
    const existing = await db
      .select()
      .from(reviewReactions)
      .where(and(eq(reviewReactions.reviewId, reviewId), eq(reviewReactions.voterIdentifier, voterIdentifier)));
    if (existing.length > 0) {
      await db
        .update(reviewReactions)
        .set({ reaction })
        .where(and(eq(reviewReactions.reviewId, reviewId), eq(reviewReactions.voterIdentifier, voterIdentifier)));
    } else {
      await db.insert(reviewReactions).values({ reviewId, voterIdentifier, reaction });
    }
  }

  async removeReviewReaction(reviewId: number, voterIdentifier: string): Promise<void> {
    await db
      .delete(reviewReactions)
      .where(and(eq(reviewReactions.reviewId, reviewId), eq(reviewReactions.voterIdentifier, voterIdentifier)));
  }

  // Review Comments
  async getReviewComments(reviewId: number): Promise<ReviewComment[]> {
    return db
      .select()
      .from(reviewComments)
      .where(eq(reviewComments.reviewId, reviewId))
      .orderBy(reviewComments.createdAt);
  }

  async addReviewComment(data: InsertReviewComment): Promise<ReviewComment> {
    const result = await db.insert(reviewComments).values(data).returning();
    return result[0];
  }
}