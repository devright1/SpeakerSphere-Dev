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
  speakerContent,
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
  type InsertSpeakerInteraction,
  type SpeakerContent,
  type InsertSpeakerContent
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, gte, lte, sql, isNotNull } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Speakers
  async getSpeakers(filters?: {
    category?: string;
    categories?: string[];
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
      conditions.push(or(eq(speakers.hideProfile, false), sql`${speakers.hideProfile} IS NULL`));
    }

    // Handle both single category (for backward compatibility) and multiple categories
    if (filters?.categories && filters.categories.length > 0) {
      // Multiple categories - use OR condition
      const categoryConditions = filters.categories.map(cat => eq(speakers.category, cat));
      conditions.push(or(...categoryConditions));
    } else if (filters?.category) {
      // Single category (backward compatibility)
      conditions.push(eq(speakers.category, filters.category));
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

    let query = db.select().from(speakers);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
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
    // Clean budget field - remove commas and non-numeric characters except decimal points
    const cleanedInquiry = {
      ...inquiry,
      budget: inquiry.budget ? inquiry.budget.toString().replace(/[,$]/g, '') : inquiry.budget
    };
    
    const result = await db.insert(inquiries).values(cleanedInquiry).returning();
    return result[0];
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

  async approveSpeakerApplication(applicationId: number, reviewedBy: string): Promise<{ speaker: Speaker; user: User }> {
    const application = await this.getSpeakerApplicationById(applicationId);
    if (!application) throw new Error("Application not found");

    // Create speaker profile
    const speakerData: InsertSpeaker = {
      name: `${application.firstName} ${application.lastName}`,
      slug: `${application.firstName.toLowerCase()}-${application.lastName.toLowerCase()}`.replace(/\s+/g, '-'),
      title: application.title,
      bio: application.biography,
      expertise: application.speakingTopics.split(',').map(s => s.trim()),
      location: "Location TBD",
      imageUrl: "/api/placeholder/300/300",
      verified: false,
      featured: false,
      category: application.specialty,
      achievements: [],
      lectures: [],
      eventPhotos: [],
      speakingVideos: [],
      email: application.email,
      phone: application.phone,
      website: application.website,
      socialMedia: [],
      languages: ["English"],
      medicalSpecialties: [application.specialty],
      speakerType: "clinical",
      fee: "Contact for pricing",
      experience: parseInt(application.yearsExperience) || 0,
      education: application.credentials,
      hideProfile: false,
      hideRatings: false,
      hideSocial: false,
      hideContact: false
    };

    const speakerResult = await db.insert(speakers).values(speakerData).returning();
    const speaker = speakerResult[0];

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

  // Speaker Applications
  async createSpeakerApplication(application: InsertSpeakerApplication): Promise<SpeakerApplication> {
    const [result] = await db.insert(speakerApplications).values(application).returning();
    return result;
  }

  async getSpeakerApplications(): Promise<SpeakerApplication[]> {
    return await db.select().from(speakerApplications).orderBy(desc(speakerApplications.createdAt));
  }

  async updateSpeakerApplication(id: number, updates: Partial<SpeakerApplication>): Promise<SpeakerApplication | undefined> {
    const [result] = await db.update(speakerApplications)
      .set(updates)
      .where(eq(speakerApplications.id, id))
      .returning();
    return result;
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

    // Group interactions by type and calculate statistics
    const analytics = {
      totalInteractions: interactions.length,
      profileViews: interactions.filter(i => i.interactionType === 'profile_view').length,
      videoPlays: interactions.filter(i => i.interactionType === 'video_play').length,
      contactFormOpens: interactions.filter(i => i.interactionType === 'contact_form_open').length,
      inquirySubmissions: interactions.filter(i => i.interactionType === 'inquiry_submit').length,
      favoriteAdds: interactions.filter(i => i.interactionType === 'favorite_add').length,
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

  // Speaker Applications
  async createSpeakerApplication(application: InsertSpeakerApplication): Promise<SpeakerApplication> {
    const result = await db.insert(speakerApplications).values(application).returning();
    return result[0];
  }

  async getAllSpeakerApplications(): Promise<SpeakerApplication[]> {
    return await db.select().from(speakerApplications).orderBy(desc(speakerApplications.createdAt));
  }

  async getSpeakerApplication(id: number): Promise<SpeakerApplication | undefined> {
    const result = await db.select().from(speakerApplications).where(eq(speakerApplications.id, id)).limit(1);
    return result[0];
  }

  async updateSpeakerApplicationStatus(
    id: number, 
    status: string, 
    adminNotes?: string, 
    reviewedBy?: string
  ): Promise<SpeakerApplication> {
    const updateData: any = {
      status,
      reviewedAt: new Date()
    };
    
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (reviewedBy) updateData.reviewedBy = reviewedBy;
    
    const result = await db
      .update(speakerApplications)
      .set(updateData)
      .where(eq(speakerApplications.id, id))
      .returning();
    
    return result[0];
  }

  async approveSpeakerApplication(applicationId: number, reviewedBy: string): Promise<{ speaker: Speaker; user: User }> {
    const application = await this.getSpeakerApplication(applicationId);
    if (!application) {
      throw new Error("Speaker application not found");
    }

    // Create speaker profile from application data
    const fullName = `${application.firstName} ${application.lastName}`;
    const slug = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const speakerData: InsertSpeaker = {
      name: fullName,
      slug: slug,
      title: application.title,
      bio: application.biography || 'Professional speaker and expert in healthcare',
      expertise: [application.specialty],
      location: 'Location to be updated',
      imageUrl: '/api/placeholder/300/300',
      category: application.specialty,
      achievements: [],
      lectures: [],
      email: application.email,
      phone: application.phone || '',
      website: application.website || '',
      languages: ['English'],
      medicalSpecialties: [application.specialty],
      speakerType: 'clinical',
      verified: true,
      featured: false,
      hideProfile: false,
      hideRatings: false,
      hideSocial: false,
      hideContact: false
    };

    const speaker = await this.createSpeaker(speakerData);

    // Create user account for the speaker
    const userData = {
      email: application.email,
      passwordHash: '', // Will be set during first login
      firstName: application.firstName,
      lastName: application.lastName,
      title: application.title,
      company: application.specialty,
      accountType: 'speaker',
      speakerId: speaker.id
    };

    const user = await this.createUser(userData);

    // Update application status
    await this.updateSpeakerApplicationStatus(applicationId, 'approved', 'Application approved and accounts created', reviewedBy);

    // Update application with created speaker ID
    await db
      .update(speakerApplications)
      .set({ createdSpeakerId: speaker.id })
      .where(eq(speakerApplications.id, applicationId));

    return { speaker, user };
  }

  // Analytics
  async trackSpeakerInteraction(interaction: InsertSpeakerInteraction): Promise<void> {
    await db.insert(speakerInteractions).values(interaction);
  }

  async getSpeakerAnalytics(speakerId: number): Promise<any> {
    // Basic analytics implementation
    const interactions = await db
      .select()
      .from(speakerInteractions)
      .where(eq(speakerInteractions.speakerId, speakerId));

    return {
      totalInteractions: interactions.length,
      profileViews: interactions.filter(i => i.interactionType === 'profile_view').length,
      emailClicks: interactions.filter(i => i.interactionType === 'email_click').length,
      phoneClicks: interactions.filter(i => i.interactionType === 'phone_click').length,
      websiteClicks: interactions.filter(i => i.interactionType === 'website_click').length
    };
  }

  // User management for authentication
  async createUser(user: Omit<InsertUser, 'password'> & { passwordHash: string }): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
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
    return result.rowCount > 0;
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
}