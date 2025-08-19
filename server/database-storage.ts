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
  speakerApplications,
  speakerInteractions,
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
  type InsertUserBookmark,
  type SpeakerApplication,
  type InsertSpeakerApplication,
  type SpeakerInteraction,
  type InsertSpeakerInteraction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, or, sql, ilike, ne } from "drizzle-orm";
import { hashPassword } from "./auth";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Speakers
  async getSpeakers(filters?: {
    category?: string;
    location?: string;
    minRating?: number;
    expertise?: string;
    search?: string;
    includeHidden?: boolean;
  }): Promise<Speaker[]> {
    let query = db.select().from(speakers);
    
    const conditions = [];
    if (!filters?.includeHidden) {
      conditions.push(eq(speakers.hideProfile, false));
    }
    if (filters?.category) {
      conditions.push(eq(speakers.category, filters.category));
    }
    if (filters?.location) {
      conditions.push(ilike(speakers.location, `%${filters.location}%`));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(speakers.name, `%${filters.search}%`),
          ilike(speakers.bio, `%${filters.search}%`),
          sql`${speakers.expertise} @> ARRAY[${filters.search}]::text[]`
        )
      );
    }
    
    const baseQuery = db.select().from(speakers);
    
    if (conditions.length > 0) {
      return await baseQuery.where(and(...conditions)).orderBy(desc(speakers.featured), desc(speakers.overallRating));
    }
    
    return await baseQuery.orderBy(desc(speakers.featured), desc(speakers.overallRating));
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
    return (result.rowCount || 0) > 0;
  }

  async getFeaturedSpeakers(): Promise<Speaker[]> {
    return await db
      .select()
      .from(speakers)
      .where(and(eq(speakers.featured, true), eq(speakers.hideProfile, false)))
      .orderBy(desc(speakers.overallRating))
      .limit(24);
  }

  // Reviews
  async getReviewsBySpeakerId(speakerId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.speakerId, speakerId))
      .orderBy(desc(reviews.createdAt));
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
    return await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.speakerId, speakerId))
      .orderBy(desc(inquiries.createdAt));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Videos
  async getVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.speakerId, speakerId))
      .orderBy(desc(videos.createdAt));
  }

  async getFeaturedVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(and(eq(videos.speakerId, speakerId), eq(videos.featured, true)))
      .orderBy(desc(videos.createdAt));
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db.insert(videos).values(video).returning();
    return newVideo;
  }

  async updateVideoViewCount(videoId: number): Promise<void> {
    await db
      .update(videos)
      .set({ viewCount: sql`${videos.viewCount} + 1` })
      .where(eq(videos.id, videoId));
  }

  // User Authentication
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const passwordHash = await hashPassword(user.password);
    const userData = {
      ...user,
      passwordHash,
      userType: user.userType || 'reviewer',
    };
    delete (userData as any).password;
    
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async createSpeakerAccount(user: InsertUser, speakerId: number): Promise<User> {
    const passwordHash = await hashPassword(user.password);
    const userData = {
      ...user,
      passwordHash,
      userType: 'speaker' as const,
      speakerId,
    };
    delete (userData as any).password;
    
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async linkSpeakerToUser(userId: string, speakerId: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ speakerId, userType: 'speaker' })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
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
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(
        eq(userSessions.token, token),
        sql`${userSessions.expiresAt} > NOW()`
      ));
    
    if (!session) return undefined;
    
    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    return user;
  }

  async getUserSession(token: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(
        eq(userSessions.token, token),
        sql`${userSessions.expiresAt} > NOW()`
      ));
    return session;
  }

  async deleteUserSession(token: string): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.token, token));
    return (result.rowCount || 0) > 0;
  }

  // User Interactions
  async createUserLike(like: InsertUserLike): Promise<UserLike> {
    const [newLike] = await db.insert(userLikes).values(like).returning();
    return newLike;
  }

  async deleteUserLike(userId: string, speakerId: number): Promise<boolean> {
    const result = await db
      .delete(userLikes)
      .where(and(eq(userLikes.userId, userId), eq(userLikes.speakerId, speakerId)));
    return (result.rowCount || 0) > 0;
  }

  async getUserLikes(userId: string): Promise<UserLike[]> {
    return await db
      .select()
      .from(userLikes)
      .where(eq(userLikes.userId, userId))
      .orderBy(desc(userLikes.createdAt));
  }

  async createUserBookmark(bookmark: InsertUserBookmark): Promise<UserBookmark> {
    const [newBookmark] = await db.insert(userBookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async deleteUserBookmark(userId: string, speakerId: number): Promise<boolean> {
    const result = await db
      .delete(userBookmarks)
      .where(and(eq(userBookmarks.userId, userId), eq(userBookmarks.speakerId, speakerId)));
    return (result.rowCount || 0) > 0;
  }

  async getUserBookmarks(userId: string): Promise<UserBookmark[]> {
    return await db
      .select()
      .from(userBookmarks)
      .where(eq(userBookmarks.userId, userId))
      .orderBy(desc(userBookmarks.createdAt));
  }

  async toggleUserBookmark(userId: string, speakerId: number): Promise<{ bookmarked: boolean }> {
    const existing = await db
      .select()
      .from(userBookmarks)
      .where(and(eq(userBookmarks.userId, userId), eq(userBookmarks.speakerId, speakerId)));
    
    if (existing.length > 0) {
      await this.deleteUserBookmark(userId, speakerId);
      return { bookmarked: false };
    } else {
      await this.createUserBookmark({ userId, speakerId });
      return { bookmarked: true };
    }
  }

  async isUserBookmarked(userId: string, speakerId: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(userBookmarks)
      .where(and(eq(userBookmarks.userId, userId), eq(userBookmarks.speakerId, speakerId)));
    return !!bookmark;
  }

  async getUserBookmarkIds(userId: string): Promise<number[]> {
    const bookmarks = await db
      .select({ speakerId: userBookmarks.speakerId })
      .from(userBookmarks)
      .where(eq(userBookmarks.userId, userId));
    return bookmarks.map(b => b.speakerId);
  }

  // User Profile Data
  async getUserReviews(userId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getUserInquiries(userId: string): Promise<Inquiry[]> {
    // Note: inquiries don't have userId field, would need to add it or track differently
    return [];
  }

  // Admin User Management
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, userId));
    return (result.rowCount || 0) > 0;
  }

  // Speaker Applications
  async createSpeakerApplication(application: InsertSpeakerApplication): Promise<SpeakerApplication> {
    const [newApplication] = await db.insert(speakerApplications).values(application).returning();
    return newApplication;
  }

  async getSpeakerApplications(): Promise<SpeakerApplication[]> {
    return await db
      .select()
      .from(speakerApplications)
      .orderBy(desc(speakerApplications.createdAt));
  }

  async updateSpeakerApplication(id: number, updates: Partial<SpeakerApplication>): Promise<SpeakerApplication | undefined> {
    const [updatedApplication] = await db
      .update(speakerApplications)
      .set(updates)
      .where(eq(speakerApplications.id, id))
      .returning();
    return updatedApplication;
  }

  // Speaker Interaction Tracking
  async createSpeakerInteraction(interaction: InsertSpeakerInteraction): Promise<SpeakerInteraction> {
    const [newInteraction] = await db.insert(speakerInteractions).values(interaction).returning();
    return newInteraction;
  }

  async getSpeakerInteractionAnalytics(speakerId: number, timeframe: string): Promise<any> {
    // Implementation for analytics queries
    return {};
  }

  async updateSpeakerAnalytics(speakerId: number, interactionType: string): Promise<void> {
    // Implementation for updating analytics
  }
}

export const storage = new DatabaseStorage();