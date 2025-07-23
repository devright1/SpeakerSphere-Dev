import { 
  speakers, 
  reviews, 
  inquiries, 
  categories,
  videos,
  users,
  userSessions,
  userLikes,
  userBookmarks,
  type Speaker, 
  type InsertSpeaker, 
  type Review, 
  type InsertReview,
  type Inquiry,
  type InsertInquiry,
  type Category,
  type InsertCategory,
  type Video,
  type InsertVideo,
  type User,
  type InsertUser,
  type UserSession,
  type InsertUserSession,
  type UserLike,
  type InsertUserLike,
  type UserBookmark,
  type InsertUserBookmark
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, gte, lte, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Speakers
  async getSpeakers(filters?: {
    category?: string;
    location?: string;
    minRating?: number;
    maxFee?: number;
    minFee?: number;
    expertise?: string;
    search?: string;
    includeHidden?: boolean; // Add option to include hidden speakers
  }): Promise<Speaker[]> {
    // Only hide speakers from public view, not admin view
    const conditions = [];
    
    // Only apply hideProfile filter if not explicitly requesting hidden speakers
    if (!filters?.includeHidden) {
      conditions.push(eq(speakers.hideProfile, false));
    }

    if (filters?.category) {
      conditions.push(eq(speakers.category, filters.category));
    }

    if (filters?.location) {
      conditions.push(like(speakers.location, `%${filters.location}%`));
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

    const result = await db.select().from(speakers).where(and(...conditions));
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

  async createSpeaker(speaker: InsertSpeaker): Promise<Speaker> {
    const result = await db.insert(speakers).values(speaker).returning();
    return result[0];
  }

  async updateSpeaker(id: number, updates: Partial<InsertSpeaker>): Promise<Speaker | undefined> {
    const result = await db.update(speakers).set(updates).where(eq(speakers.id, id)).returning();
    return result[0];
  }

  async deleteSpeaker(id: number): Promise<boolean> {
    // Instead of deleting, hide the profile
    const result = await db.update(speakers).set({ hideProfile: true }).where(eq(speakers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getFeaturedSpeakers(): Promise<Speaker[]> {
    const result = await db.select().from(speakers).where(
      and(eq(speakers.featured, true), eq(speakers.hideProfile, false))
    );
    return result;
  }

  // Reviews
  async getReviewsBySpeakerId(speakerId: number): Promise<Review[]> {
    const result = await db.select().from(reviews)
      .where(eq(reviews.speakerId, speakerId))
      .orderBy(desc(reviews.createdAt));
    return result;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  // Inquiries
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const result = await db.insert(inquiries).values(inquiry).returning();
    return result[0];
  }

  async getInquiriesBySpeakerId(speakerId: number): Promise<Inquiry[]> {
    const result = await db.select().from(inquiries)
      .where(eq(inquiries.speakerId, speakerId))
      .orderBy(desc(inquiries.createdAt));
    return result;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const result = await db.select().from(categories);
    return result;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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

  async getUserReviews(userId: string): Promise<Review[]> {
    const result = await db.select().from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
    return result;
  }

  async getUserInquiries(userId: string): Promise<Inquiry[]> {
    // For now, match by email since we don't have user ID in inquiries table
    const user = await this.getUserById(userId);
    if (!user) return [];
    
    const result = await db.select().from(inquiries)
      .where(eq(inquiries.clientEmail, user.email))
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
      // Clean up related data first
      await db.delete(userSessions).where(eq(userSessions.userId, userId));
      await db.delete(userLikes).where(eq(userLikes.userId, userId));
      await db.delete(userBookmarks).where(eq(userBookmarks.userId, userId));
      
      // Delete the user
      const result = await db.delete(users).where(eq(users.id, userId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Failed to delete user:", error);
      return false;
    }
  }
}