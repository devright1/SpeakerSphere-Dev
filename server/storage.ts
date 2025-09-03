import { 
  speakers, 
  reviews, 
  inquiries, 
  categories,
  videos,
  speakingTopics,
  speakerTopics,
  users,
  userSessions,
  userLikes,
  userBookmarks,
  speakerApplications,
  speakerInteractions,
  speakerContent,
  contentAccessCodes,
  contentDownloads,
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
  type SpeakingTopic,
  type InsertSpeakingTopic,
  type SpeakerTopic,
  type InsertSpeakerTopic,
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
  type InsertContentDownload
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
  getSpeakerByName(name: string): Promise<Speaker | undefined>;
  getSpeakerByUserId(userId: string): Promise<Speaker | undefined>;
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
  getAllInquiries(): Promise<Inquiry[]>;
  updateInquiryStatus(inquiryId: number, status: string, adminNotes?: string): Promise<Inquiry | null>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Speaking Topics
  getSpeakingTopics(): Promise<SpeakingTopic[]>;
  createSpeakingTopic(topic: InsertSpeakingTopic): Promise<SpeakingTopic>;
  getSpeakingTopicByName(name: string): Promise<SpeakingTopic | undefined>;
  updateTopicSpeakerCount(topicId: number): Promise<void>;
  
  // Speaker Topics
  getSpeakerTopicsBySpeakerId(speakerId: number): Promise<SpeakingTopic[]>;
  addSpeakerTopic(speakerId: number, topicId: number): Promise<SpeakerTopic>;
  removeSpeakerTopic(speakerId: number, topicId: number): Promise<boolean>;
  bulkAddSpeakerTopics(speakerId: number, topicIds: number[]): Promise<void>;
  clearSpeakerTopics(speakerId: number): Promise<void>;
  
  // Review management
  getPendingReviews(): Promise<Review[]>;
  approveReview(reviewId: number, adminNotes?: string): Promise<Review | undefined>;
  rejectReview(reviewId: number, adminNotes?: string): Promise<Review | undefined>;
  
  // Videos
  getVideosBySpeakerId(speakerId: number): Promise<Video[]>;
  getFeaturedVideosBySpeakerId(speakerId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideoViewCount(videoId: number): Promise<void>;
  
  // User Authentication
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'password'> & { passwordHash: string }): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  updateUserAccountType(id: string, accountType: string): Promise<User>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  updateUserSubscription(userId: string, subscriptionData: Partial<User>): Promise<User>;
  
  // Email verification operations
  setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(userId: string): Promise<User | undefined>;
  clearVerificationToken(userId: string): Promise<User | undefined>;
  
  // Speaker Application Methods
  createSpeakerApplication(application: InsertSpeakerApplication): Promise<SpeakerApplication>;
  getSpeakerApplicationByEmail(email: string): Promise<SpeakerApplication | undefined>;
  getSpeakerApplicationById(id: number): Promise<SpeakerApplication | undefined>;
  getAllSpeakerApplications(): Promise<SpeakerApplication[]>;
  updateSpeakerApplicationStatus(id: number, status: string, adminNotes?: string, reviewedBy?: string): Promise<SpeakerApplication>;
  approveSpeakerApplication(applicationId: number, reviewedBy: string): Promise<{ speaker: Speaker; user: User }>;
  
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
  getUserReviews(userId: string): Promise<any[]>;
  getUserInquiries(userId: string): Promise<Inquiry[]>;
  
  // Admin User Management
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<boolean>;
  
  // Bookmark utility methods
  toggleUserBookmark(userId: string, speakerId: number): Promise<{ bookmarked: boolean }>;
  isUserBookmarked(userId: string, speakerId: number): Promise<boolean>;
  getUserBookmarkIds(userId: string): Promise<number[]>;
  
  // Speaker Applications
  createSpeakerApplication(application: InsertSpeakerApplication): Promise<SpeakerApplication>;
  getAllSpeakerApplications(): Promise<SpeakerApplication[]>;
  getSpeakerApplication(id: number): Promise<SpeakerApplication | undefined>;
  updateSpeakerApplicationStatus(id: number, status: string, adminNotes?: string, reviewedBy?: string): Promise<SpeakerApplication>;
  approveSpeakerApplication(id: number, reviewedBy: string): Promise<{ speaker: Speaker; user: User }>;

  // Speaker Interaction Tracking & Analytics
  trackSpeakerInteraction(interaction: InsertSpeakerInteraction): Promise<void>;
  getSpeakerAnalytics(speakerId: number): Promise<any>;
  getUserSession(token: string): Promise<UserSession | undefined>;

  // Speaker Content Management
  createSpeakerContent(content: InsertSpeakerContent): Promise<SpeakerContent>;
  getSpeakerContent(speakerId: number): Promise<SpeakerContent[]>;
  getSpeakerContentById(contentId: number): Promise<SpeakerContent | undefined>;
  updateSpeakerContent(contentId: number, updates: Partial<SpeakerContent>): Promise<SpeakerContent | undefined>;
  deleteSpeakerContent(contentId: number): Promise<boolean>;
  incrementContentDownloadCount(contentId: number): Promise<void>;

  // Content Access Code Management
  createContentAccessCode(accessCode: InsertContentAccessCode): Promise<ContentAccessCode>;
  getContentAccessCodes(contentId: number): Promise<ContentAccessCode[]>;
  validateAccessCode(contentId: number, code: string): Promise<ContentAccessCode | undefined>;
  incrementAccessCodeUsage(accessCodeId: number): Promise<void>;
  updateAccessCodeUsage(accessCodeId: number): Promise<void>;
  deleteContentAccessCode(accessCodeId: number): Promise<boolean>;

  // Content Download Tracking
  createContentDownload(download: InsertContentDownload): Promise<ContentDownload>;
  getContentDownloads(contentId: number): Promise<ContentDownload[]>;
  getSpeakerContentDownloads(speakerId: number): Promise<ContentDownload[]>;
  getUserContentDownloads(userId: string): Promise<ContentDownload[]>;
}

export class MemStorage implements IStorage {
  private speakers: Map<number, Speaker>;
  private reviews: Map<number, Review>;
  private inquiries: Map<number, Inquiry>;
  private categories: Map<number, Category>;
  private speakingTopics: Map<number, SpeakingTopic>;
  private speakerTopics: Map<number, SpeakerTopic>;
  private videos: Map<number, Video>;
  private users: Map<string, User>;
  private userSessions: Map<string, UserSession>;
  private userLikes: Map<number, UserLike>;
  private userBookmarks: Map<number, UserBookmark>;
  private speakerApplications: Map<number, SpeakerApplication>;
  private speakerContentMap: Map<number, SpeakerContent>;
  private contentAccessCodes: Map<number, ContentAccessCode>;
  private contentDownloads: Map<number, ContentDownload>;
  private currentSpeakerId: number;
  private currentReviewId: number;
  private currentInquiryId: number;
  private currentCategoryId: number;
  private currentTopicId: number;
  private currentSpeakerTopicId: number;
  private currentVideoId: number;
  private currentLikeId: number;
  private currentBookmarkId: number;
  private currentApplicationId: number;
  private currentContentId: number;
  private currentAccessCodeId: number;
  private currentDownloadId: number;

  constructor() {
    this.speakers = new Map();
    this.reviews = new Map();
    this.inquiries = new Map();
    this.categories = new Map();
    this.speakingTopics = new Map();
    this.speakerTopics = new Map();
    this.videos = new Map();
    this.users = new Map();
    this.userSessions = new Map();
    this.userLikes = new Map();
    this.userBookmarks = new Map();
    this.speakerApplications = new Map();
    this.speakerContentMap = new Map();
    this.contentAccessCodes = new Map();
    this.contentDownloads = new Map();
    this.currentSpeakerId = 1;
    this.currentReviewId = 1;
    this.currentInquiryId = 1;
    this.currentCategoryId = 1;
    this.currentTopicId = 1;
    this.currentSpeakerTopicId = 1;
    this.currentVideoId = 1;
    this.currentLikeId = 1;
    this.currentBookmarkId = 1;
    this.currentApplicationId = 1;
    this.currentContentId = 1;
    this.currentAccessCodeId = 1;
    this.currentDownloadId = 1;
    
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
    categories?: string[];
    location?: string;
    expertise?: string;
    search?: string;
    includeHidden?: boolean;
  }): Promise<Speaker[]> {
    let speakers = Array.from(this.speakers.values());

    // Filter by categories (multiple selection support)
    if (filters?.categories && filters.categories.length > 0) {
      speakers = speakers.filter(speaker => 
        filters.categories!.some(cat => speaker.categories?.includes(cat))
      );
    } else if (filters?.category) {
      // Single category filter for backward compatibility
      speakers = speakers.filter(speaker => speaker.categories?.includes(filters.category!));
    }

    if (filters?.location) {
      speakers = speakers.filter(speaker => 
        speaker.location.toLowerCase().includes(filters.location!.toLowerCase())
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

  async getSpeakerByName(name: string): Promise<Speaker | undefined> {
    return Array.from(this.speakers.values()).find(speaker => speaker.slug === name);
  }

  async getSpeakerByUserId(userId: string): Promise<Speaker | undefined> {
    // Find user to get speakerId
    const user = this.users.get(userId);
    if (!user || !user.speakerId) {
      return undefined;
    }
    
    // Get speaker by speakerId
    return this.speakers.get(user.speakerId);
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
      .filter(review => review.speakerId === speakerId && review.approvalStatus === 'approved')
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = { 
      ...insertReview, 
      id: this.currentReviewId++,
      approvalStatus: 'pending',
      verified: false,
      createdAt: new Date()
    };
    this.reviews.set(review.id, review);
    return review;
  }

  async getPendingReviews(): Promise<Review[]> {
    const result = await this.db.select().from(reviews)
      .where(eq(reviews.approvalStatus, 'pending'))
      .orderBy(desc(reviews.createdAt));
    return result;
  }

  async approveReview(reviewId: number, adminNotes?: string): Promise<Review | undefined> {
    const review = this.reviews.get(reviewId);
    if (!review) return undefined;
    
    const updatedReview: Review = {
      ...review,
      approvalStatus: 'approved',
      adminNotes,
      approvedAt: new Date(),
      approvedBy: 'admin' // In a real app, this would be the admin user ID
    };
    
    this.reviews.set(reviewId, updatedReview);
    return updatedReview;
  }

  async rejectReview(reviewId: number, adminNotes?: string): Promise<Review | undefined> {
    const review = this.reviews.get(reviewId);
    if (!review) return undefined;
    
    const updatedReview: Review = {
      ...review,
      approvalStatus: 'rejected',
      adminNotes,
      approvedAt: new Date(),
      approvedBy: 'admin' // In a real app, this would be the admin user ID
    };
    
    this.reviews.set(reviewId, updatedReview);
    return updatedReview;
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

  async getAllInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values())
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async updateInquiryStatus(inquiryId: number, status: string, adminNotes?: string): Promise<Inquiry | null> {
    const inquiry = this.inquiries.get(inquiryId);
    if (!inquiry) return null;
    
    const updatedInquiry = { ...inquiry, status };
    this.inquiries.set(inquiryId, updatedInquiry);
    return updatedInquiry;
  }

  async getCategories(): Promise<Category[]> {
    const categories = Array.from(this.categories.values());
    
    // Return static categories without dynamic recalculation to prevent changes
    // Speaker counts are updated only when speakers are actually added/removed
    return categories.sort((a, b) => a.name.localeCompare(b.name));
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

  // Speaking Topics Methods
  async getSpeakingTopics(): Promise<SpeakingTopic[]> {
    return Array.from(this.speakingTopics.values());
  }

  async createSpeakingTopic(insertTopic: InsertSpeakingTopic): Promise<SpeakingTopic> {
    const topic: SpeakingTopic = {
      ...insertTopic,
      id: this.currentTopicId++,
      speakerCount: 0,
      isActive: true,
      createdAt: new Date()
    };
    this.speakingTopics.set(topic.id, topic);
    return topic;
  }

  async getSpeakingTopicByName(name: string): Promise<SpeakingTopic | undefined> {
    return Array.from(this.speakingTopics.values()).find(topic => topic.name === name);
  }

  async updateTopicSpeakerCount(topicId: number): Promise<void> {
    const topic = this.speakingTopics.get(topicId);
    if (topic) {
      const count = Array.from(this.speakerTopics.values())
        .filter(st => st.topicId === topicId).length;
      topic.speakerCount = count;
      this.speakingTopics.set(topicId, topic);
    }
  }

  // Speaker Topics Methods
  async getSpeakerTopicsBySpeakerId(speakerId: number): Promise<SpeakingTopic[]> {
    const speakerTopicIds = Array.from(this.speakerTopics.values())
      .filter(st => st.speakerId === speakerId)
      .map(st => st.topicId);
    
    return Array.from(this.speakingTopics.values())
      .filter(topic => speakerTopicIds.includes(topic.id));
  }

  async addSpeakerTopic(speakerId: number, topicId: number): Promise<SpeakerTopic> {
    const speakerTopic: SpeakerTopic = {
      id: this.currentSpeakerTopicId++,
      speakerId,
      topicId,
      createdAt: new Date()
    };
    this.speakerTopics.set(speakerTopic.id, speakerTopic);
    return speakerTopic;
  }

  async removeSpeakerTopic(speakerId: number, topicId: number): Promise<boolean> {
    const speakerTopic = Array.from(this.speakerTopics.values())
      .find(st => st.speakerId === speakerId && st.topicId === topicId);
    
    if (speakerTopic) {
      this.speakerTopics.delete(speakerTopic.id);
      return true;
    }
    return false;
  }

  async bulkAddSpeakerTopics(speakerId: number, topicIds: number[]): Promise<void> {
    for (const topicId of topicIds) {
      await this.addSpeakerTopic(speakerId, topicId);
    }
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

  async updateUserAccountType(id: string, accountType: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");

    const updatedUser: User = { 
      ...user, 
      accountType, 
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

  async getUserReviews(userId: string): Promise<any[]> {
    const userReviews = Array.from(this.reviews.values())
      .filter(review => review.userId === userId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      
    // Add speaker information to each review
    return userReviews.map(review => {
      const speaker = Array.from(this.speakers.values()).find(s => s.id === review.speakerId);
      return {
        ...review,
        speakerName: speaker?.name || 'Unknown Speaker',
        speakerSlug: speaker?.slug || '',
        speakerImageUrl: speaker?.imageUrl || ''
      };
    });
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

  // Speaker Applications
  async createSpeakerApplication(application: InsertSpeakerApplication): Promise<SpeakerApplication> {
    const newApplication: SpeakerApplication = {
      id: this.currentApplicationId++,
      ...application,
      status: 'pending',
      adminNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date(),
      createdSpeakerId: null
    };
    
    this.speakerApplications.set(newApplication.id, newApplication);
    return newApplication;
  }

  async getSpeakerApplicationByEmail(email: string): Promise<SpeakerApplication | undefined> {
    return Array.from(this.speakerApplications.values()).find(app => app.email === email);
  }

  async getSpeakerApplicationById(id: number): Promise<SpeakerApplication | undefined> {
    return this.speakerApplications.get(id);
  }

  async getAllSpeakerApplications(): Promise<SpeakerApplication[]> {
    return Array.from(this.speakerApplications.values());
  }

  async updateSpeakerApplicationStatus(id: number, status: string, adminNotes?: string, reviewedBy?: string): Promise<SpeakerApplication> {
    const application = this.speakerApplications.get(id);
    if (!application) throw new Error("Application not found");

    const updatedApplication: SpeakerApplication = {
      ...application,
      status,
      adminNotes: adminNotes || application.adminNotes,
      reviewedBy: reviewedBy || application.reviewedBy,
      reviewedAt: new Date()
    };

    this.speakerApplications.set(id, updatedApplication);
    return updatedApplication;
  }

  async approveSpeakerApplication(applicationId: number, reviewedBy: string): Promise<{ speaker: Speaker; user: User }> {
    const application = this.speakerApplications.get(applicationId);
    if (!application) throw new Error("Application not found");

    // Create speaker profile
    const speaker: Speaker = {
      id: this.currentSpeakerId++,
      name: `${application.firstName} ${application.lastName}`,
      slug: `${application.firstName.toLowerCase()}-${application.lastName.toLowerCase()}`.replace(/\s+/g, '-'),
      title: application.title,
      bio: application.biography,
      expertise: application.speakingTopics.split(',').map(s => s.trim()),
      location: "Location TBD",
      overallRating: "0.00",
      reviewCount: 0,
      imageUrl: "/api/placeholder/300/300",
      verified: false,
      featured: false,
      categories: [application.specialty],
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

    this.speakers.set(speaker.id, speaker);

    // Create user account
    const user: User = {
      id: crypto.randomUUID(),
      email: application.email,
      passwordHash: "temp_hash", // Will be set properly in database
      firstName: application.firstName,
      lastName: application.lastName,
      title: application.title,
      accountType: "speaker",
      speakerId: speaker.id,
      emailVerified: true,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(user.id, user);

    // Update application status
    await this.updateSpeakerApplicationStatus(applicationId, "approved", "Application approved and speaker profile created", reviewedBy);
    
    const updatedApplication = this.speakerApplications.get(applicationId)!;
    updatedApplication.createdSpeakerId = speaker.id;
    this.speakerApplications.set(applicationId, updatedApplication);

    return { speaker, user };
  }

  async getSpeakerApplications(): Promise<SpeakerApplication[]> {
    // For memory storage, return empty array since we don't persist applications
    return [];
  }

  async updateSpeakerApplication(id: number, updates: Partial<SpeakerApplication>): Promise<SpeakerApplication | undefined> {
    // For memory storage, return undefined since we don't persist applications
    return undefined;
  }

  // Speaker Interaction Tracking (basic implementation for memory storage)
  async createSpeakerInteraction(interaction: InsertSpeakerInteraction): Promise<SpeakerInteraction> {
    const newInteraction: SpeakerInteraction = {
      id: Date.now(),
      ...interaction,
      createdAt: new Date()
    };
    return newInteraction;
  }

  async getSpeakerInteractionAnalytics(speakerId: number, timeframe: string): Promise<any> {
    // Basic analytics for memory storage
    return {
      totalInteractions: 0,
      profileViews: 0,
      videoPlays: 0,
      contactFormOpens: 0,
      inquirySubmissions: 0,
      favoriteAdds: 0,
      socialClicks: 0,
      phoneClicks: 0,
      emailClicks: 0,
      websiteClicks: 0,
      reviewSectionViews: 0,
      tagClicks: 0,
      bioExpands: 0,
      shareClicks: 0,
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      averageTimeOnPage: 0,
      averageScrollDepth: 0,
      timeframe,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString()
    };
  }

  async updateSpeakerAnalytics(speakerId: number, interactionType: string): Promise<void> {
    // No-op for memory storage
  }

  async getUserSession(token: string): Promise<UserSession | undefined> {
    return Array.from(this.userSessions.values()).find(session => session.token === token);
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastLoginAt = new Date();
      this.users.set(userId, user);
    }
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  async toggleUserBookmark(userId: string, speakerId: number): Promise<{ bookmarked: boolean }> {
    const existingBookmark = Array.from(this.userBookmarks.values())
      .find(b => b.userId === userId && b.speakerId === speakerId);

    if (existingBookmark) {
      this.userBookmarks.delete(existingBookmark.id);
      return { bookmarked: false };
    } else {
      const newBookmark = {
        id: ++this.currentBookmarkId,
        userId,
        speakerId,
        createdAt: new Date(),
        notes: null
      };
      this.userBookmarks.set(newBookmark.id, newBookmark);
      return { bookmarked: true };
    }
  }

  async isUserBookmarked(userId: string, speakerId: number): Promise<boolean> {
    return Array.from(this.userBookmarks.values())
      .some(b => b.userId === userId && b.speakerId === speakerId);
  }

  async getUserBookmarkIds(userId: string): Promise<number[]> {
    return Array.from(this.userBookmarks.values())
      .filter(b => b.userId === userId)
      .map(b => b.speakerId);
  }

  // Speaker Content Management Methods
  async createSpeakerContent(content: InsertSpeakerContent): Promise<SpeakerContent> {
    const newContent: SpeakerContent = {
      ...content,
      id: this.currentContentId++,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.speakerContentMap.set(newContent.id, newContent);
    return newContent;
  }

  async getSpeakerContent(speakerId: number): Promise<SpeakerContent[]> {
    return Array.from(this.speakerContentMap.values())
      .filter(content => content.speakerId === speakerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSpeakerContentById(contentId: number): Promise<SpeakerContent | undefined> {
    return this.speakerContentMap.get(contentId);
  }

  async updateSpeakerContent(contentId: number, updates: Partial<SpeakerContent>): Promise<SpeakerContent | undefined> {
    const content = this.speakerContentMap.get(contentId);
    if (!content) return undefined;

    const updatedContent = { 
      ...content, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.speakerContentMap.set(contentId, updatedContent);
    return updatedContent;
  }

  async deleteSpeakerContent(contentId: number): Promise<boolean> {
    return this.speakerContentMap.delete(contentId);
  }

  async incrementContentDownloadCount(contentId: number): Promise<void> {
    const content = this.speakerContentMap.get(contentId);
    if (content) {
      content.downloadCount = (content.downloadCount || 0) + 1;
      content.updatedAt = new Date();
      this.speakerContentMap.set(contentId, content);
    }
  }

  // Content Access Code Management
  async createContentAccessCode(accessCode: InsertContentAccessCode): Promise<ContentAccessCode> {
    const newAccessCode = {
      id: this.currentAccessCodeId++,
      ...accessCode,
      currentUses: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contentAccessCodes.set(newAccessCode.id, newAccessCode);
    return newAccessCode;
  }

  async getContentAccessCodes(contentId: number): Promise<ContentAccessCode[]> {
    return Array.from(this.contentAccessCodes.values())
      .filter(code => code.contentId === contentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async validateAccessCode(contentId: number, code: string): Promise<ContentAccessCode | undefined> {
    const accessCode = Array.from(this.contentAccessCodes.values())
      .find(ac => ac.contentId === contentId && ac.accessCode === code && ac.isActive);
    
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
    const accessCode = this.contentAccessCodes.get(accessCodeId);
    if (accessCode) {
      accessCode.currentUses = (accessCode.currentUses || 0) + 1;
      accessCode.updatedAt = new Date();
      this.contentAccessCodes.set(accessCodeId, accessCode);
    }
  }

  async updateAccessCodeUsage(accessCodeId: number): Promise<void> {
    const accessCode = this.contentAccessCodes.get(accessCodeId);
    if (accessCode) {
      accessCode.currentUses = (accessCode.currentUses || 0) + 1;
      accessCode.updatedAt = new Date();
      this.contentAccessCodes.set(accessCodeId, accessCode);
    }
  }

  async deleteContentAccessCode(accessCodeId: number): Promise<boolean> {
    return this.contentAccessCodes.delete(accessCodeId);
  }

  // Content Download Tracking
  async createContentDownload(download: InsertContentDownload): Promise<ContentDownload> {
    const newDownload = {
      id: this.currentDownloadId++,
      ...download,
      downloadedAt: new Date(),
    };
    this.contentDownloads.set(newDownload.id, newDownload);
    return newDownload;
  }

  async getContentDownloads(contentId: number): Promise<ContentDownload[]> {
    return Array.from(this.contentDownloads.values())
      .filter(download => download.contentId === contentId)
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
  }

  async getSpeakerContentDownloads(speakerId: number): Promise<ContentDownload[]> {
    const speakerContent = Array.from(this.speakerContentMap.values())
      .filter(content => content.speakerId === speakerId)
      .map(content => content.id);
    
    return Array.from(this.contentDownloads.values())
      .filter(download => speakerContent.includes(download.contentId))
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
  }

  async getUserContentDownloads(userId: string): Promise<ContentDownload[]> {
    return Array.from(this.contentDownloads.values())
      .filter(download => download.userId === userId)
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
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