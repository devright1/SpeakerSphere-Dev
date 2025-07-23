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
import { eq, and, or, sql, desc, asc, ilike, inArray } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Speakers
  async getSpeakers(filters?: {
    category?: string;
    location?: string;
    minRating?: number;
    expertise?: string;
    search?: string;
  }): Promise<Speaker[]> {
    let query = db.select().from(speakers);
    
    if (filters?.search) {
      query = query.where(
        or(
          ilike(speakers.name, `%${filters.search}%`),
          ilike(speakers.bio, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.category) {
      query = query.where(eq(speakers.category, filters.category));
    }
    
    if (filters?.location) {
      query = query.where(ilike(speakers.location, `%${filters.location}%`));
    }
    
    if (filters?.minRating) {
      query = query.where(sql`CAST(${speakers.overallRating} AS DECIMAL) >= ${filters.minRating}`);
    }

    return await query;
  }

  async getSpeaker(id: number): Promise<Speaker | undefined> {
    const [speaker] = await db.select().from(speakers).where(eq(speakers.id, id));
    return speaker;
  }

  async getSpeakerBySlug(slug: string): Promise<Speaker | undefined> {
    const [speaker] = await db.select().from(speakers).where(eq(speakers.slug, slug));
    return speaker;
  }

  async createSpeaker(speaker: InsertSpeaker): Promise<Speaker> {
    const [newSpeaker] = await db.insert(speakers).values(speaker).returning();
    return newSpeaker;
  }

  async updateSpeaker(id: number, speaker: Partial<InsertSpeaker>): Promise<Speaker | undefined> {
    const [updatedSpeaker] = await db
      .update(speakers)
      .set(speaker)
      .where(eq(speakers.id, id))
      .returning();
    return updatedSpeaker;
  }

  async deleteSpeaker(id: number): Promise<boolean> {
    const result = await db.delete(speakers).where(eq(speakers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getFeaturedSpeakers(): Promise<Speaker[]> {
    return await db.select().from(speakers).where(eq(speakers.featured, true));
  }

  // Reviews
  async getReviewsBySpeakerId(speakerId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.speakerId, speakerId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  // Inquiries
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async getInquiriesBySpeakerId(speakerId: number): Promise<Inquiry[]> {
    return await db.select().from(inquiries).where(eq(inquiries.speakerId, speakerId));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Videos
  async getVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.speakerId, speakerId));
  }

  async getFeaturedVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    return await db.select().from(videos).where(
      and(eq(videos.speakerId, speakerId), eq(videos.featured, true))
    );
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db.insert(videos).values(video).returning();
    return newVideo;
  }

  async updateVideoViewCount(videoId: number): Promise<void> {
    await db.update(videos)
      .set({ viewCount: sql`COALESCE(${videos.viewCount}, 0) + 1` })
      .where(eq(videos.id, videoId));
  }

  // User Authentication
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // User Sessions
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.token, token));
    if (!session?.userId) return undefined;
    
    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    return user;
  }

  async deleteUserSession(token: string): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.token, token));
    return (result.rowCount ?? 0) > 0;
  }

  // Analytics methods
  async getSpeakerAnalytics(): Promise<any[]> {
    // Return empty array for now since analytics are optional
    return [];
  }

  async getDashboardAnalytics(): Promise<any> {
    const totalSpeakers = await db.select({ count: sql`count(*)` }).from(speakers);
    return {
      overview: {
        totalSpeakers: totalSpeakers[0]?.count?.toString() || "0",
        totalReviews: "0",
        averageRating: "0",
        totalInquiries: "0"
      }
    };
  }

  // User interactions
  async createUserLike(insertLike: InsertUserLike): Promise<UserLike> {
    const [newLike] = await db.insert(userLikes).values(insertLike).returning();
    return newLike;
  }

  async deleteUserLike(userId: string, speakerId: number): Promise<boolean> {
    const result = await db.delete(userLikes).where(
      and(eq(userLikes.userId, userId), eq(userLikes.speakerId, speakerId))
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getUserLikes(userId: string): Promise<UserLike[]> {
    return await db.select().from(userLikes).where(eq(userLikes.userId, userId));
  }

  async createUserBookmark(insertBookmark: InsertUserBookmark): Promise<UserBookmark> {
    const [newBookmark] = await db.insert(userBookmarks).values(insertBookmark).returning();
    return newBookmark;
  }

  async deleteUserBookmark(userId: string, speakerId: number): Promise<boolean> {
    const result = await db.delete(userBookmarks).where(
      and(eq(userBookmarks.userId, userId), eq(userBookmarks.speakerId, speakerId))
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getUserBookmarks(userId: string): Promise<UserBookmark[]> {
    return await db.select().from(userBookmarks).where(eq(userBookmarks.userId, userId));
  }
}