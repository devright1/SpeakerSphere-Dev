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
import { officialSpeakers } from "./official-speakers";

export interface IStorage {
  // Speakers
  getSpeakers(filters?: {
    category?: string;
    location?: string;
    minRating?: number;
    expertise?: string;
    search?: string;
    includeHidden?: boolean;
  }): Promise<Speaker[]>;
  getSpeaker(id: number): Promise<Speaker | undefined>;
  getSpeakerBySlug(slug: string): Promise<Speaker | undefined>;
  createSpeaker(speaker: InsertSpeaker): Promise<Speaker>;
  updateSpeaker(id: number, speaker: Partial<InsertSpeaker>): Promise<Speaker | undefined>;
  deleteSpeaker(id: number): Promise<boolean>;
  getFeaturedSpeakers(): Promise<Speaker[]>;
  
  // Reviews
  getReviewsBySpeakerId(speakerId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiriesBySpeakerId(speakerId: number): Promise<Inquiry[]>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Videos
  getVideosBySpeakerId(speakerId: number): Promise<Video[]>;
  getFeaturedVideosBySpeakerId(speakerId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideoViewCount(videoId: number): Promise<void>;
  
  // User Authentication
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // User Sessions
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserByToken(token: string): Promise<User | undefined>;
  deleteUserSession(token: string): Promise<boolean>;
  
  // User Interactions
  createUserLike(like: InsertUserLike): Promise<UserLike>;
  deleteUserLike(userId: string, speakerId: number): Promise<boolean>;
  getUserLikes(userId: string): Promise<UserLike[]>;
  createUserBookmark(bookmark: InsertUserBookmark): Promise<UserBookmark>;
  deleteUserBookmark(userId: string, speakerId: number): Promise<boolean>;
  getUserBookmarks(userId: string): Promise<UserBookmark[]>;
  
  // User Profile Data
  getUserReviews(userId: string): Promise<Review[]>;
  getUserInquiries(userId: string): Promise<Inquiry[]>;
  
  // Admin User Management
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<boolean>;
  
  // Bookmark utility methods
  toggleUserBookmark(userId: string, speakerId: number): Promise<{ bookmarked: boolean }>;
  isUserBookmarked(userId: string, speakerId: number): Promise<boolean>;
  getUserBookmarkIds(userId: string): Promise<number[]>;
}

export class MemStorage implements IStorage {
  private speakers: Map<number, Speaker>;
  private reviews: Map<number, Review>;
  private inquiries: Map<number, Inquiry>;
  private categories: Map<number, Category>;
  private videos: Map<number, Video>;
  private users: Map<string, User>;
  private userSessions: Map<string, UserSession>;
  private userLikes: Map<number, UserLike>;
  private userBookmarks: Map<number, UserBookmark>;
  private currentSpeakerId: number;
  private currentReviewId: number;
  private currentInquiryId: number;
  private currentCategoryId: number;
  private currentVideoId: number;
  private currentLikeId: number;
  private currentBookmarkId: number;

  constructor() {
    this.speakers = new Map();
    this.reviews = new Map();
    this.inquiries = new Map();
    this.categories = new Map();
    this.videos = new Map();
    this.users = new Map();
    this.userSessions = new Map();
    this.userLikes = new Map();
    this.userBookmarks = new Map();
    this.currentSpeakerId = 1;
    this.currentReviewId = 1;
    this.currentInquiryId = 1;
    this.currentCategoryId = 1;
    this.currentVideoId = 1;
    this.currentLikeId = 1;
    this.currentBookmarkId = 1;
    
    this.seedData();
    this.seedVideoData();
  }

  private seedData() {
    // Seed categories
    const categoriesData = [
      { name: "Digital Dentistry", description: "CAD/CAM, 3D printing, and digital workflow solutions" },
      { name: "Prosthodontics", description: "Restorative dentistry and prosthetic rehabilitation" },
      { name: "Esthetic Dentistry", description: "Cosmetic procedures and smile design" },
      { name: "Orthodontics", description: "Teeth straightening and bite correction" },
      { name: "Implant Dentistry", description: "Dental implants and osseointegration" },
      { name: "Periodontics", description: "Gum disease treatment and periodontal therapy" },
      { name: "Oral Surgery", description: "Surgical procedures in the oral cavity" },
      { name: "Maxillofacial Surgery", description: "Complex facial and jaw surgical procedures" },
      { name: "Practice Management", description: "Dental practice operations and business growth" },
      { name: "Event Management", description: "Professional event coordination and management" },
    ];

    categoriesData.forEach(cat => {
      const category: Category = { ...cat, id: this.currentCategoryId++, speakerCount: 0 };
      this.categories.set(category.id, category);
    });

    // Seed speakers with official DevRight speakers only
    officialSpeakers.forEach(speakerData => {
      const speaker: Speaker = { 
        ...speakerData, 
        id: this.currentSpeakerId++,
        overallRating: speakerData.overallRating,
        reviewCount: speakerData.reviewCount,
        verified: speakerData.verified,
        featured: speakerData.featured
      };
      this.speakers.set(speaker.id, speaker);
    });

    // Seed reviews with detailed healthcare-specific ratings
    const reviewsData = [
      {
        speakerId: 1,
        reviewerName: "Dr. Sarah Mitchell",
        reviewerTitle: "Conference Director",
        reviewerCompany: "American College of Dental Surgeons",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 4,
        comment: "Dr. Polido delivered an exceptional presentation on zygomatic implant techniques. His technical expertise combined with clear communication made complex surgical concepts accessible to our diverse audience.",
        eventType: "Dental Conference",
        eventDate: "2024-01-15",
        verified: true
      },
      {
        speakerId: 2,
        reviewerName: "Dr. Michael Chen",
        reviewerTitle: "Department Chair",
        reviewerCompany: "University of California San Francisco",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 4,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 5,
        comment: "Dr. Martin's presentation on team-based implant workflows was incredibly valuable. His real-world case studies and practical solutions directly addressed our clinical challenges.",
        eventType: "Prosthodontic Summit",
        eventDate: "2024-02-20",
        verified: true
      },
      {
        speakerId: 3,
        reviewerName: "Dr. Lisa Rodriguez",
        reviewerTitle: "Clinical Director",
        reviewerCompany: "Florida Dental Institute",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 4,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 5,
        comment: "Dr. Chochlidakis provided outstanding insights into full arch treatment planning. His decision matrix approach has revolutionized our treatment protocols.",
        eventType: "Implant Dentistry Conference",
        eventDate: "2024-03-10",
        verified: true
      }
    ];

    reviewsData.forEach(reviewData => {
      const review: Review = { 
        ...reviewData, 
        id: this.currentReviewId++,
        createdAt: new Date(reviewData.eventDate)
      };
      this.reviews.set(review.id, review);
    });
  }

  private seedVideoData() {
    const videosData = [
      {
        speakerId: 1,
        title: "Zygomatic Implant Techniques",
        description: "Advanced surgical techniques for zygomatic implant placement",
        videoUrl: "https://example.com/video1",
        thumbnailUrl: "https://example.com/thumb1",
        duration: 1800,
        videoType: "lecture",
        eventName: "Full Arch Forum 2024",
        eventDate: "2024-01-15",
        topics: ["Zygomatic Implants", "Surgical Techniques", "Complex Cases"],
        viewCount: 2500,
        featured: true
      },
      {
        speakerId: 2,
        title: "Team-Based Implant Workflows",
        description: "Collaborative approaches to implant dentistry",
        videoUrl: "https://example.com/video2",
        thumbnailUrl: "https://example.com/thumb2",
        duration: 2100,
        videoType: "workshop",
        eventName: "Prosthodontic Summit 2024",
        eventDate: "2024-02-20",
        topics: ["Team Collaboration", "Implant Protocols", "Workflow Optimization"],
        viewCount: 1800,
        featured: true
      }
    ];

    videosData.forEach(videoData => {
      const video: Video = { 
        ...videoData, 
        id: this.currentVideoId++,
        createdAt: new Date(videoData.eventDate)
      };
      this.videos.set(video.id, video);
    });
  }

  async getSpeakers(filters?: {
    category?: string;
    location?: string;
    minRating?: number;
    expertise?: string;
    search?: string;
    includeHidden?: boolean;
  }): Promise<Speaker[]> {
    let speakers = Array.from(this.speakers.values());

    if (filters?.category) {
      speakers = speakers.filter(speaker => speaker.category === filters.category);
    }

    if (filters?.location) {
      speakers = speakers.filter(speaker => 
        speaker.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.minRating) {
      speakers = speakers.filter(speaker => 
        parseFloat(speaker.overallRating) >= filters.minRating!
      );
    }

    if (filters?.expertise) {
      speakers = speakers.filter(speaker => 
        speaker.expertise.some(exp => 
          exp.toLowerCase().includes(filters.expertise!.toLowerCase())
        )
      );
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      speakers = speakers.filter(speaker => 
        speaker.name.toLowerCase().includes(searchTerm) ||
        speaker.title.toLowerCase().includes(searchTerm) ||
        speaker.bio.toLowerCase().includes(searchTerm) ||
        speaker.expertise.some(exp => exp.toLowerCase().includes(searchTerm))
      );
    }

    return speakers.sort((a, b) => parseFloat(b.overallRating) - parseFloat(a.overallRating));
  }

  async getSpeaker(id: number): Promise<Speaker | undefined> {
    return this.speakers.get(id);
  }

  async getSpeakerBySlug(slug: string): Promise<Speaker | undefined> {
    return Array.from(this.speakers.values()).find(speaker => speaker.slug === slug);
  }

  async createSpeaker(insertSpeaker: InsertSpeaker): Promise<Speaker> {
    const speaker: Speaker = { 
      ...insertSpeaker, 
      id: this.currentSpeakerId++,
      overallRating: insertSpeaker.overallRating || "0.0",
      reviewCount: insertSpeaker.reviewCount || 0,
      verified: insertSpeaker.verified || false,
      featured: insertSpeaker.featured || false
    };
    this.speakers.set(speaker.id, speaker);
    return speaker;
  }

  async updateSpeaker(id: number, updates: Partial<InsertSpeaker>): Promise<Speaker | undefined> {
    const speaker = this.speakers.get(id);
    if (!speaker) return undefined;

    const updatedSpeaker = { ...speaker, ...updates };
    this.speakers.set(id, updatedSpeaker);
    return updatedSpeaker;
  }

  async deleteSpeaker(id: number): Promise<boolean> {
    const speaker = this.speakers.get(id);
    if (!speaker) return false;

    // In a real implementation, we would move to a recently deleted collection
    // with a 14-day retention period. For this demo, we'll just remove from active speakers
    this.speakers.delete(id);
    
    // Also remove associated reviews and videos for cleanup
    const reviews = Array.from(this.reviews.values())
      .filter(review => review.speakerId === id);
    reviews.forEach(review => this.reviews.delete(review.id));
    
    const videos = Array.from(this.videos.values())
      .filter(video => video.speakerId === id);
    videos.forEach(video => this.videos.delete(video.id));
    
    return true;
  }

  async getFeaturedSpeakers(): Promise<Speaker[]> {
    return Array.from(this.speakers.values())
      .filter(speaker => speaker.featured)
      .sort((a, b) => parseFloat(b.overallRating) - parseFloat(a.overallRating));
  }

  async getReviewsBySpeakerId(speakerId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.speakerId === speakerId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = { 
      ...insertReview, 
      id: this.currentReviewId++,
      createdAt: new Date()
    };
    this.reviews.set(review.id, review);
    return review;
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const inquiry: Inquiry = { 
      ...insertInquiry, 
      id: this.currentInquiryId++,
      createdAt: new Date()
    };
    this.inquiries.set(inquiry.id, inquiry);
    return inquiry;
  }

  async getInquiriesBySpeakerId(speakerId: number): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values())
      .filter(inquiry => inquiry.speakerId === speakerId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = { 
      ...insertCategory, 
      id: this.currentCategoryId++,
      speakerCount: 0
    };
    this.categories.set(category.id, category);
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const category = this.categories.get(id);
    if (!category) return false;

    this.categories.delete(id);
    return true;
  }

  async getVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.speakerId === speakerId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async getFeaturedVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.speakerId === speakerId && video.featured)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const video: Video = { 
      ...insertVideo, 
      id: this.currentVideoId++,
      createdAt: new Date()
    };
    this.videos.set(video.id, video);
    return video;
  }

  async updateVideoViewCount(videoId: number): Promise<void> {
    const video = this.videos.get(videoId);
    if (video) {
      video.viewCount = (video.viewCount || 0) + 1;
      this.videos.set(videoId, video);
    }
  }

  // User Authentication Methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: crypto.randomUUID(),
      emailVerified: false,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: string, userUpdates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { 
      ...user, 
      ...userUpdates, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // User Session Methods
  async createUserSession(insertSession: InsertUserSession): Promise<UserSession> {
    const session: UserSession = {
      ...insertSession,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    this.userSessions.set(session.token, session);
    return session;
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    const session = this.userSessions.get(token);
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        this.userSessions.delete(token);
      }
      return undefined;
    }
    return this.users.get(session.userId);
  }

  async deleteUserSession(token: string): Promise<boolean> {
    return this.userSessions.delete(token);
  }

  // User Interaction Methods
  async createUserLike(insertLike: InsertUserLike): Promise<UserLike> {
    const like: UserLike = {
      ...insertLike,
      id: this.currentLikeId++,
      createdAt: new Date()
    };
    this.userLikes.set(like.id, like);
    return like;
  }

  async deleteUserLike(userId: string, speakerId: number): Promise<boolean> {
    const like = Array.from(this.userLikes.values())
      .find(l => l.userId === userId && l.speakerId === speakerId);
    if (!like) return false;
    
    return this.userLikes.delete(like.id);
  }

  async getUserLikes(userId: string): Promise<UserLike[]> {
    return Array.from(this.userLikes.values())
      .filter(like => like.userId === userId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async createUserBookmark(insertBookmark: InsertUserBookmark): Promise<UserBookmark> {
    const bookmark: UserBookmark = {
      ...insertBookmark,
      id: this.currentBookmarkId++,
      createdAt: new Date()
    };
    this.userBookmarks.set(bookmark.id, bookmark);
    return bookmark;
  }

  async deleteUserBookmark(userId: string, speakerId: number): Promise<boolean> {
    const bookmark = Array.from(this.userBookmarks.values())
      .find(b => b.userId === userId && b.speakerId === speakerId);
    if (!bookmark) return false;
    
    return this.userBookmarks.delete(bookmark.id);
  }

  async getUserBookmarks(userId: string): Promise<UserBookmark[]> {
    return Array.from(this.userBookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.userId === userId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async getUserInquiries(userId: string): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values())
      .filter(inquiry => inquiry.clientEmail === userId) // Match by user email for now
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (!this.users.has(userId)) return false;
    
    // Clean up related data
    const userLikesToDelete = Array.from(this.userLikes.values())
      .filter(like => like.userId === userId);
    userLikesToDelete.forEach(like => this.userLikes.delete(like.id));
    
    const userBookmarksToDelete = Array.from(this.userBookmarks.values())
      .filter(bookmark => bookmark.userId === userId);
    userBookmarksToDelete.forEach(bookmark => this.userBookmarks.delete(bookmark.id));
    
    const userSessionsToDelete = Array.from(this.userSessions.values())
      .filter(session => session.userId === userId);
    userSessionsToDelete.forEach(session => this.userSessions.delete(session.id));
    
    return this.users.delete(userId);
  }
}

import { DatabaseStorage } from "./database-storage";
import { DataMigration } from "./data-migration";

// Check if we should use database storage
const USE_DATABASE = process.env.NODE_ENV === "production" || process.env.USE_DATABASE === "true" || true; // Always use database for domain sync

// Initialize storage based on environment
let storageInstance: IStorage;

if (USE_DATABASE) {
  storageInstance = new DatabaseStorage();
  
  // Run migration on startup if needed
  const migration = new DataMigration();
  migration.checkMigrationStatus().then(async (hasMigratedData) => {
    if (!hasMigratedData) {
      console.log("🚀 No existing data found in database. Running initial migration...");
      try {
        await migration.migrateAllData();
        console.log("✅ Initial data migration completed successfully!");
      } catch (error) {
        console.error("❌ Failed to migrate initial data:", error);
        console.log("⚠️  Falling back to memory storage for this session");
        storageInstance = new MemStorage();
      }
    } else {
      console.log("✅ Database contains existing data. Using PostgreSQL storage.");
    }
  }).catch((error) => {
    console.error("❌ Failed to check migration status:", error);
    console.log("⚠️  Falling back to memory storage for this session");
    storageInstance = new MemStorage();
  });
} else {
  storageInstance = new MemStorage();
  console.log("🔧 Using memory storage for development");
}

export const storage = storageInstance;