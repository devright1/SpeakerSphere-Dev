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
  speakerVideoLinks,
  images,
  subscriptionFeatures,
  subscriptionTierFeatures,
  tierLimits,
  speakerEvents,
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
  reviewReactions,
  reviewComments,
} from "@shared/schema";
import { officialSpeakers } from "./official-speakers";

export interface IStorage {
  // Speakers
  getSpeakers(filters?: {
    category?: string;
    categories?: string[];
    topics?: string[];
    location?: string;
    minRating?: number;
    expertise?: string;
    search?: string;
    includeHidden?: boolean;
  }): Promise<Speaker[]>;
  getSpeakersByTopicCategory(categoryName: string, filters?: {
    search?: string;
    verified?: boolean;
    featured?: boolean;
    minFee?: number;
    maxFee?: number;
    includeHidden?: boolean;
  }): Promise<Speaker[]>;
  getSpeaker(id: number): Promise<Speaker | undefined>;
  getSpeakerBySlug(slug: string): Promise<Speaker | undefined>;
  getSpeakerByName(name: string): Promise<Speaker | undefined>;
  getSpeakerByUserId(userId: string): Promise<Speaker | undefined>;
  getSpeakerByEmail(email: string): Promise<Speaker | undefined>;
  createSpeaker(speaker: InsertSpeaker): Promise<Speaker>;
  updateSpeaker(id: number, speaker: Partial<InsertSpeaker>): Promise<Speaker | undefined>;
  deleteSpeaker(id: number, deletionType?: "immediate" | "retention"): Promise<boolean>;
  getFeaturedSpeakers(): Promise<Speaker[]>;
  getSpeakersByTier(tier: 'basic' | 'pro' | 'premier'): Promise<Speaker[]>;
  
  // Reviews
  getReviewsBySpeakerId(speakerId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Review Reactions
  getReviewReactionCounts(reviewId: number): Promise<{ likes: number; dislikes: number }>;
  getUserReviewReaction(reviewId: number, voterIdentifier: string): Promise<string | null>;
  upsertReviewReaction(reviewId: number, voterIdentifier: string, reaction: string): Promise<void>;
  removeReviewReaction(reviewId: number, voterIdentifier: string): Promise<void>;

  // Review Comments
  getReviewComments(reviewId: number): Promise<ReviewComment[]>;
  addReviewComment(data: InsertReviewComment): Promise<ReviewComment>;
  
  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiry(inquiryId: number): Promise<Inquiry | undefined>;
  getInquiriesBySpeakerId(speakerId: number): Promise<Inquiry[]>;
  getAllInquiries(): Promise<Inquiry[]>;
  updateInquiryStatus(inquiryId: number, status: string, adminNotes?: string): Promise<Inquiry | null>;
  deleteInquiry(inquiryId: number): Promise<boolean>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;

  // Disciplines & two-level taxonomy
  getDisciplines(): Promise<(Discipline & { categoryCount: number; speakerCount: number })[]>;
  getDiscipline(id: number): Promise<Discipline | undefined>;
  createDiscipline(discipline: InsertDiscipline): Promise<Discipline>;
  updateDiscipline(id: number, updates: Partial<InsertDiscipline>): Promise<Discipline | undefined>;
  deleteDiscipline(id: number): Promise<boolean>;
  getCategoriesByDiscipline(disciplineId: number): Promise<Category[]>;
  createCategoryForDiscipline(disciplineId: number, name: string, description?: string): Promise<Category>;
  updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  updateSpeakerDiscipline(speakerId: number, disciplineId: number | null, categoryIds: number[], status?: string): Promise<Speaker | undefined>;
  getSpeakersByMigrationStatus(status: string): Promise<Speaker[]>;
  
  // Speaking Topics
  getSpeakingTopics(disciplineId?: number): Promise<SpeakingTopic[]>;
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
  updateUserBannerColor(id: string, bannerColor: string | null): Promise<void>;
  updateUserAccountType(id: string, accountType: string): Promise<User>;
  updateUserPassword(userId: string, passwordHash: string, tempPassword?: string): Promise<void>;
  updateUserSetPassword(userId: string, userPasswordHash: string): Promise<void>;
  resetUserPasswords(userId: string, passwordHash: string, tempPassword: string): Promise<void>;
  updateUserSubscription(userId: string, subscriptionData: Partial<User>): Promise<User>;
  
  // Email verification operations
  setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(userId: string): Promise<User | undefined>;
  clearVerificationToken(userId: string): Promise<User | undefined>;
  
  // Password reset operations
  setPasswordResetToken(userId: string, tokenHash: string, expires: Date): Promise<User | undefined>;
  getUserByPasswordResetToken(tokenHash: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<User | undefined>;
  invalidateAllUserSessions(userId: string): Promise<void>;

  // OTP reset code operations
  savePasswordResetCode(userId: string, codeHash: string, expiresAt: Date): Promise<void>;
  verifyAndConsumeResetCode(userId: string, codeHash: string): Promise<boolean>;
  deletePasswordResetCodes(userId: string): Promise<void>;
  
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
  updateSpeakerApplicationVerification(id: number, verification: { identityVerificationSessionId: string; identityVerificationStatus: string; identityVerifiedAt: Date | null }): Promise<SpeakerApplication | undefined>;
  approveSpeakerApplication(id: number, reviewedBy: string): Promise<{ speaker: Speaker; user: User }>;

  // Speaker Interaction Tracking & Analytics
  trackSpeakerInteraction(interaction: InsertSpeakerInteraction): Promise<void>;
  getSpeakerAnalytics(speakerId: number, month?: number | null, year?: number | null, timeframe?: string): Promise<any>;
  getSpeakerInteractionAnalytics(speakerId: number, timeframe: string): Promise<any>;
  getPlatformAnalytics(): Promise<{
    totalSpeakers: number;
    totalViews: number;
    totalClicks: number;
    totalInquiries: number;
  }>;
  getTopPerformers(limit?: number): Promise<Array<{
    speakerId: number;
    name: string;
    profileViews: number;
    engagementClicks: number;
    inquiryClicks: number;
  }>>;
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
  updateContentAccessCode(accessCodeId: number, updates: { description?: string; isActive?: boolean; expiresAt?: Date | null; maxUses?: number | null }): Promise<ContentAccessCode | undefined>;
  deleteContentAccessCode(accessCodeId: number): Promise<boolean>;

  // Content Download Tracking
  createContentDownload(download: InsertContentDownload): Promise<ContentDownload>;
  getContentDownloads(contentId: number): Promise<ContentDownload[]>;
  getSpeakerContentDownloads(speakerId: number): Promise<(ContentDownload & { fileName: string })[]>;
  getUserContentDownloads(userId: string): Promise<ContentDownload[]>;
  
  // Speaker Video Links
  getSpeakerVideoLinks(speakerId: number): Promise<SpeakerVideoLink[]>;
  createSpeakerVideoLink(videoLink: InsertSpeakerVideoLink): Promise<SpeakerVideoLink>;
  updateSpeakerVideoLink(id: number, updates: Partial<InsertSpeakerVideoLink>): Promise<SpeakerVideoLink | undefined>;
  deleteSpeakerVideoLink(id: number): Promise<boolean>;
  reorderSpeakerVideoLinks(speakerId: number, linkIds: number[]): Promise<void>;
  
  // Images
  createImage(image: InsertImage): Promise<Image>;
  getImageById(id: number): Promise<Image | undefined>;
  getImageByChecksum(checksum: string): Promise<Image | undefined>;
  deleteImage(id: number): Promise<boolean>;
  saveImageFromBase64(base64Data: string, ownerId: string, ownerType?: string, imageType?: string): Promise<{ id: number; url: string; }>;
  getUserBySpeakerId(speakerId: number): Promise<User | undefined>;
  
  // Video Management (Phase 2)
  getSpeakerVideos(speakerId: number): Promise<Video[]>;
  getVideo(videoId: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  deleteVideo(videoId: number): Promise<boolean>;
  incrementVideoViewCount(videoId: number): Promise<void>;
  updateSpeakerStorage(speakerId: number, bytesChange: number, videoCountChange: number): Promise<void>;

  // Subscription features management
  listSubscriptionFeatures(): Promise<(SubscriptionFeature & { tiers: Array<{ id: number; tier: string; sortOrder: number; isHighlighted: boolean }> })[]>;
  listSubscriptionFeaturesByTier(tier: string): Promise<SubscriptionFeature[]>;
  createSubscriptionFeature(feature: InsertSubscriptionFeature): Promise<SubscriptionFeature>;
  updateSubscriptionFeature(id: number, feature: Partial<InsertSubscriptionFeature>): Promise<SubscriptionFeature>;
  deleteSubscriptionFeature(id: number): Promise<void>;
  assignFeatureToTier(tierFeature: InsertSubscriptionTierFeature): Promise<SubscriptionTierFeature>;
  updateTierFeature(id: number, updates: Partial<Omit<SubscriptionTierFeature, 'id'>>): Promise<SubscriptionTierFeature>;
  removeTierFeature(id: number): Promise<void>;
  
  // Tier limits management
  getTierLimit(tier: 'basic' | 'pro' | 'premier'): Promise<TierLimit | undefined>;
  getAllTierLimits(): Promise<TierLimit[]>;
  
  // Speaker subscriptions for admin view
  listSpeakerSubscriptions(filter?: { tier?: string; status?: string }): Promise<Array<Speaker & { subscriptionInterval?: string; subscriptionAmount?: number }>>;
  // Update speaker cancellation data
  updateSpeakerCancellation(speakerId: number, data: {
    reason: string;
    cancelledAt: Date;
    periodEnd?: Date;
    status?: string;
  }): Promise<Speaker>;

  // Speaker Events
  getSpeakerEvents(speakerId: number, upcomingOnly?: boolean): Promise<SpeakerEvent[]>;
  createSpeakerEvent(event: InsertSpeakerEvent): Promise<SpeakerEvent>;
  updateSpeakerEvent(eventId: number, updates: Partial<InsertSpeakerEvent>): Promise<SpeakerEvent | undefined>;
  deleteSpeakerEvent(eventId: number): Promise<boolean>;
  getSpeakerEventById(eventId: number): Promise<SpeakerEvent | undefined>;
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
  private speakerVideoLinksMap: Map<number, SpeakerVideoLink>;
  private images: Map<number, Image>;
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
  private currentVideoLinkId: number;
  private currentImageId: number;

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
    this.speakerVideoLinksMap = new Map();
    this.images = new Map();
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
    this.currentVideoLinkId = 1;
    this.currentImageId = 1;
    
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

    // Filter hidden speakers (only show visible speakers by default)
    if (!filters?.includeHidden) {
      speakers = speakers.filter(speaker => !speaker.hideProfile);
    }

    return speakers.sort((a, b) => parseFloat(b.overallRating) - parseFloat(a.overallRating));
  }

  async getSpeakersByTopicCategory(categoryName: string, filters?: {
    search?: string;
    verified?: boolean;
    featured?: boolean;
    minFee?: number;
    maxFee?: number;
    includeHidden?: boolean;
  }): Promise<Speaker[]> {
    // Stub implementation for MemStorage - returns all speakers filtered by direct categories
    // In a real implementation, this would use topic relationships like DatabaseStorage
    return this.getSpeakers({ 
      category: categoryName.trim(),
      search: filters?.search,
      includeHidden: filters?.includeHidden 
    });
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

  async getSpeakerByEmail(email: string): Promise<Speaker | undefined> {
    return Array.from(this.speakers.values()).find(speaker => speaker.email === email);
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

  async deleteSpeaker(id: number, deletionType: "immediate" | "retention" = "retention"): Promise<boolean> {
    const speaker = this.speakers.get(id);
    if (!speaker) return false;

    if (deletionType === "immediate") {
      // Permanently delete speaker and associated data
      this.speakers.delete(id);
      
      // Remove associated reviews for cleanup
      const reviews = Array.from(this.reviews.values())
        .filter(review => review.speakerId === id);
      reviews.forEach(review => this.reviews.delete(review.id));
      
      // Remove associated videos for cleanup
      const videos = Array.from(this.videos.values())
        .filter(video => video.speakerId === id);
      videos.forEach(video => this.videos.delete(video.id));
      
      // Remove associated inquiries for cleanup
      const inquiries = Array.from(this.inquiries.values())
        .filter(inquiry => inquiry.speakerId === id);
      inquiries.forEach(inquiry => this.inquiries.delete(inquiry.id));
      
      // Remove associated speaker topics for cleanup
      const speakerTopics = Array.from(this.speakerTopics.values())
        .filter(st => st.speakerId === id);
      speakerTopics.forEach(st => this.speakerTopics.delete(st.id));
      
      // Remove associated content for cleanup
      const content = Array.from(this.content.values())
        .filter(c => c.speakerId === id);
      content.forEach(c => this.content.delete(c.id));
    } else {
      // 14-day retention: hide profile and set deletion timestamp
      const updatedSpeaker = { 
        ...speaker, 
        hideProfile: true,
        deletedAt: new Date()
      };
      this.speakers.set(id, updatedSpeaker);
    }
    
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
    
    // Recalculate speaker's review count and average rating
    await this.updateSpeakerReviewStats(review.speakerId);
    
    return updatedReview;
  }
  
  private async updateSpeakerReviewStats(speakerId: number): Promise<void> {
    // Get all approved reviews for this speaker
    const approvedReviews = Array.from(this.reviews.values())
      .filter(r => r.speakerId === speakerId && r.approvalStatus === 'approved');
    
    const reviewCount = approvedReviews.length;
    
    // Calculate average rating from overall ratings
    let overallRating = "0.00";
    if (reviewCount > 0) {
      const totalRating = approvedReviews.reduce((sum, r) => sum + parseFloat(r.overallRating), 0);
      overallRating = (totalRating / reviewCount).toFixed(2);
    }
    
    // Update speaker record
    await this.updateSpeaker(speakerId, {
      reviewCount,
      overallRating
    });
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
    
    // Recalculate speaker's review count and average rating (in case this was previously approved)
    await this.updateSpeakerReviewStats(review.speakerId);
    
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

  async getInquiry(inquiryId: number): Promise<Inquiry | undefined> {
    return this.inquiries.get(inquiryId);
  }

  async deleteInquiry(inquiryId: number): Promise<boolean> {
    return this.inquiries.delete(inquiryId);
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
    
    // Deduplicate categories by name, merging speaker counts
    const categoryMap = new Map<string, Category>();
    
    categories.forEach(category => {
      const existing = categoryMap.get(category.name);
      if (existing) {
        // Merge: keep the first ID, sum the speaker counts
        existing.speakerCount += category.speakerCount;
      } else {
        categoryMap.set(category.name, { ...category });
      }
    });
    
    // Return deduplicated categories sorted by name
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = { 
      disciplineId: null,
      sortOrder: 0,
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

  // Disciplines & two-level taxonomy (in-memory; primarily handled by DatabaseStorage)
  private disciplines: Map<number, Discipline> = new Map();
  private currentDisciplineId: number = 1;

  async getDisciplines(): Promise<(Discipline & { categoryCount: number; speakerCount: number })[]> {
    return Array.from(this.disciplines.values()).map((d) => ({
      ...d,
      categoryCount: Array.from(this.categories.values()).filter((c) => c.disciplineId === d.id).length,
      speakerCount: Array.from(this.speakers.values()).filter((s) => s.disciplineId === d.id).length,
    }));
  }

  async getDiscipline(id: number): Promise<Discipline | undefined> {
    return this.disciplines.get(id);
  }

  async createDiscipline(discipline: InsertDiscipline): Promise<Discipline> {
    const d: Discipline = {
      description: null,
      sortOrder: 0,
      ...discipline,
      id: this.currentDisciplineId++,
    };
    this.disciplines.set(d.id, d);
    return d;
  }

  async updateDiscipline(id: number, updates: Partial<InsertDiscipline>): Promise<Discipline | undefined> {
    const d = this.disciplines.get(id);
    if (!d) return undefined;
    const updated = { ...d, ...updates };
    this.disciplines.set(id, updated);
    return updated;
  }

  async deleteDiscipline(id: number): Promise<boolean> {
    return this.disciplines.delete(id);
  }

  async getCategoriesByDiscipline(disciplineId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter((c) => c.disciplineId === disciplineId);
  }

  async createCategoryForDiscipline(disciplineId: number, name: string, description: string = ""): Promise<Category> {
    return this.createCategory({ name, description, disciplineId, sortOrder: 0 } as InsertCategory);
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const c = this.categories.get(id);
    if (!c) return undefined;
    const updated = { ...c, ...updates };
    this.categories.set(id, updated);
    return updated;
  }

  async updateSpeakerDiscipline(speakerId: number, disciplineId: number | null, categoryIds: number[], status: string = "manual"): Promise<Speaker | undefined> {
    const s = this.speakers.get(speakerId);
    if (!s) return undefined;
    const updated = { ...s, disciplineId, speakerCategoryIds: categoryIds, disciplineMigrationStatus: status };
    this.speakers.set(speakerId, updated);
    return updated;
  }

  async getSpeakersByMigrationStatus(status: string): Promise<Speaker[]> {
    return Array.from(this.speakers.values()).filter((s) => s.disciplineMigrationStatus === status);
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

  async updateUserBannerColor(id: string, bannerColor: string | null): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, bannerColor, updatedAt: new Date() });
    }
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

  async getUserInquiries(userEmail: string): Promise<any[]> {
    const userInquiries = Array.from(this.inquiries.values())
      .filter(inquiry => inquiry.clientEmail === userEmail) // Match by user email
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      
    // Add speaker information to each inquiry
    return userInquiries.map(inquiry => {
      const speaker = Array.from(this.speakers.values()).find(s => s.id === inquiry.speakerId);
      return {
        ...inquiry,
        speakerName: speaker?.name || 'Unknown Speaker',
        speakerSlug: speaker?.slug || '',
        speakerImageUrl: speaker?.imageUrl || ''
      };
    });
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
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
    
    // Clean up inquiries made by this user (as a client)
    const userInquiriesToDelete = Array.from(this.inquiries.values())
      .filter(inquiry => inquiry.clientEmail === user.email);
    userInquiriesToDelete.forEach(inquiry => this.inquiries.delete(inquiry.id));
    
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
      categories: application.selectedCategories,
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

  async updateSpeakerApplicationVerification(id: number, verification: { identityVerificationSessionId: string; identityVerificationStatus: string; identityVerifiedAt: Date | null }): Promise<SpeakerApplication | undefined> {
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

  async trackSpeakerInteraction(interaction: InsertSpeakerInteraction): Promise<void> {
    // No-op for memory storage
  }

  async getSpeakerAnalytics(speakerId: number, month?: number | null, year?: number | null, timeframe?: string): Promise<any> {
    // Basic stub for memory storage
    return {
      profileViews: 0,
      engagementClicks: 0,
      socialClicks: 0,
      websiteClicks: 0,
      inquiryClicks: 0,
      tabClicks: 0,
      resourceDownloads: 0,
      bioExpands: 0,
      topicClicks: 0,
      reviewSectionViews: 0,
      shareClicks: 0,
      videoPlays: 0,
      searchAppearances: 0,
      totalInteractions: 0,
      weeklyViews: 0,
      weeklyClicks: 0,
      dailyTrends: [],
      downloads: [],
      totalDownloads: 0,
      selectedTimeframe: timeframe || 'all',
    };
  }

  async getPlatformAnalytics(): Promise<{
    totalSpeakers: number;
    totalViews: number;
    totalClicks: number;
    totalInquiries: number;
  }> {
    // Return basic counts from memory storage
    return {
      totalSpeakers: this.speakers.size,
      totalViews: 0,
      totalClicks: 0,
      totalInquiries: this.inquiries.size
    };
  }

  async getTopPerformers(limit: number = 10): Promise<Array<{
    speakerId: number;
    name: string;
    profileViews: number;
    engagementClicks: number;
    inquiryClicks: number;
  }>> {
    // Return empty array for memory storage (no tracking data)
    return [];
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

  async updateUserPassword(userId: string, passwordHash: string, tempPassword?: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.tempPassword = tempPassword ?? null;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  async updateUserSetPassword(userId: string, userPasswordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.userPasswordHash = userPasswordHash;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  async resetUserPasswords(userId: string, passwordHash: string, tempPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.tempPassword = tempPassword;
      user.userPasswordHash = null;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  // OTP reset codes (in-memory store: userId -> {codeHash, expiresAt})
  private resetCodes = new Map<string, { codeHash: string; expiresAt: Date; usedAt: Date | null }>();

  async savePasswordResetCode(userId: string, codeHash: string, expiresAt: Date): Promise<void> {
    this.resetCodes.set(userId, { codeHash, expiresAt, usedAt: null });
  }

  async verifyAndConsumeResetCode(userId: string, codeHash: string): Promise<boolean> {
    const entry = this.resetCodes.get(userId);
    if (!entry || entry.usedAt || entry.codeHash !== codeHash || entry.expiresAt < new Date()) {
      return false;
    }
    entry.usedAt = new Date();
    this.resetCodes.set(userId, entry);
    return true;
  }

  async deletePasswordResetCodes(userId: string): Promise<void> {
    this.resetCodes.delete(userId);
  }

  async updateUserSubscription(userId: string, subscriptionData: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    const updatedUser = { ...user, ...subscriptionData, updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      user.verificationToken = token;
      user.verificationTokenExpires = expires;
      user.updatedAt = new Date();
      this.users.set(userId, user);
      return user;
    }
    return undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => 
      user.verificationToken === token && 
      user.verificationTokenExpires && 
      user.verificationTokenExpires > new Date()
    );
  }

  async verifyUserEmail(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      user.emailVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpires = null;
      user.updatedAt = new Date();
      this.users.set(userId, user);
      return user;
    }
    return undefined;
  }

  async clearVerificationToken(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      user.verificationToken = null;
      user.verificationTokenExpires = null;
      user.updatedAt = new Date();
      this.users.set(userId, user);
      return user;
    }
    return undefined;
  }

  async clearSpeakerTopics(speakerId: number): Promise<void> {
    const topicsToDelete = Array.from(this.speakerTopics.values())
      .filter(st => st.speakerId === speakerId);
    
    topicsToDelete.forEach(topic => this.speakerTopics.delete(topic.id));
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

  async updateContentAccessCode(accessCodeId: number, updates: { description?: string; isActive?: boolean; expiresAt?: Date | null; maxUses?: number | null }): Promise<ContentAccessCode | undefined> {
    const accessCode = this.contentAccessCodes.get(accessCodeId);
    if (!accessCode) return undefined;
    if (updates.description !== undefined) accessCode.description = updates.description;
    if (updates.isActive !== undefined) accessCode.isActive = updates.isActive;
    if (updates.expiresAt !== undefined) accessCode.expiresAt = updates.expiresAt;
    if (updates.maxUses !== undefined) accessCode.maxUses = updates.maxUses;
    accessCode.updatedAt = new Date();
    this.contentAccessCodes.set(accessCodeId, accessCode);
    return accessCode;
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

  async getSpeakerContentDownloads(speakerId: number): Promise<(ContentDownload & { fileName: string })[]> {
    const contentMap = new Map(
      Array.from(this.speakerContentMap.values())
        .filter(content => content.speakerId === speakerId)
        .map(content => [content.id, content.originalName])
    );
    return Array.from(this.contentDownloads.values())
      .filter(download => contentMap.has(download.contentId))
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime())
      .map(download => ({ ...download, fileName: contentMap.get(download.contentId) || 'Unknown File' }));
  }

  async getUserContentDownloads(userId: string): Promise<ContentDownload[]> {
    return Array.from(this.contentDownloads.values())
      .filter(download => download.userId === userId)
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
  }

  // Speaker Video Links Methods
  async getSpeakerVideoLinks(speakerId: number): Promise<SpeakerVideoLink[]> {
    return Array.from(this.speakerVideoLinksMap.values())
      .filter(link => link.speakerId === speakerId)
      .sort((a, b) => a.position - b.position);
  }

  async createSpeakerVideoLink(videoLink: InsertSpeakerVideoLink): Promise<SpeakerVideoLink> {
    const existingLinks = await this.getSpeakerVideoLinks(videoLink.speakerId);
    const newLink: SpeakerVideoLink = {
      ...videoLink,
      id: this.currentVideoLinkId++,
      position: videoLink.position ?? existingLinks.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.speakerVideoLinksMap.set(newLink.id, newLink);
    return newLink;
  }

  async updateSpeakerVideoLink(id: number, updates: Partial<InsertSpeakerVideoLink>): Promise<SpeakerVideoLink | undefined> {
    const link = this.speakerVideoLinksMap.get(id);
    if (!link) return undefined;

    const updatedLink = {
      ...link,
      ...updates,
      updatedAt: new Date(),
    };
    this.speakerVideoLinksMap.set(id, updatedLink);
    return updatedLink;
  }

  async deleteSpeakerVideoLink(id: number): Promise<boolean> {
    return this.speakerVideoLinksMap.delete(id);
  }

  async reorderSpeakerVideoLinks(speakerId: number, linkIds: number[]): Promise<void> {
    linkIds.forEach((linkId, index) => {
      const link = this.speakerVideoLinksMap.get(linkId);
      if (link && link.speakerId === speakerId) {
        this.speakerVideoLinksMap.set(linkId, { ...link, position: index, updatedAt: new Date() });
      }
    });
  }

  // Image methods
  async createImage(image: InsertImage): Promise<Image> {
    const newImage: Image = {
      id: this.currentImageId++,
      ...image,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.images.set(newImage.id, newImage);
    return newImage;
  }

  async getImageById(id: number): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async getImageByChecksum(checksum: string): Promise<Image | undefined> {
    return Array.from(this.images.values()).find(image => image.checksum === checksum);
  }

  async deleteImage(id: number): Promise<boolean> {
    return this.images.delete(id);
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
    
    // Check for existing image
    const existingImage = await this.getImageByChecksum(checksum);
    if (existingImage) {
      return {
        id: existingImage.id,
        url: `/api/images/${existingImage.id}`
      };
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
    return Array.from(this.users.values()).find(user => user.speakerId === speakerId);
  }

  // Video Management (Phase 2)
  async getSpeakerVideos(speakerId: number): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.speakerId === speakerId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getVideo(videoId: number): Promise<Video | undefined> {
    return this.videos.get(videoId);
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const newVideo: Video = {
      id: this.currentVideoId++,
      ...video,
      viewCount: 0,
      featured: false,
      createdAt: new Date()
    } as Video;
    
    this.videos.set(newVideo.id, newVideo);
    return newVideo;
  }

  async deleteVideo(videoId: number): Promise<boolean> {
    return this.videos.delete(videoId);
  }

  async incrementVideoViewCount(videoId: number): Promise<void> {
    const video = this.videos.get(videoId);
    if (video) {
      video.viewCount = (video.viewCount || 0) + 1;
    }
  }

  async updateSpeakerStorage(speakerId: number, bytesChange: number, videoCountChange: number): Promise<void> {
    const speaker = this.speakers.get(speakerId);
    if (speaker) {
      speaker.storageUsedBytes = (speaker.storageUsedBytes || 0) + bytesChange;
      speaker.videoCount = (speaker.videoCount || 0) + videoCountChange;
    }
  }

  async listSpeakerSubscriptions(filter?: { tier?: string; status?: string }): Promise<Array<Speaker & { subscriptionInterval?: string; subscriptionAmount?: number }>> {
    const speakers = Array.from(this.speakers.values());
    
    let filtered = speakers;
    
    if (filter?.tier) {
      filtered = filtered.filter(s => s.subscriptionTier === filter.tier);
    }
    
    if (filter?.status) {
      filtered = filtered.filter(s => s.subscriptionStatus === filter.status);
    }
    
    // Add subscription interval and amount based on tier
    return filtered.map(speaker => ({
      ...speaker,
      subscriptionInterval: speaker.subscriptionStatus === 'active' ? 'monthly' : undefined,
      subscriptionAmount: speaker.subscriptionTier === 'premier' ? 9900 : speaker.subscriptionTier === 'pro' ? 2900 : 0,
    }));
  }

  async updateSpeakerCancellation(speakerId: number, data: {
    reason: string;
    cancelledAt: Date;
    periodEnd?: Date;
    status?: string;
  }): Promise<Speaker> {
    const speaker = this.speakers.get(speakerId);
    if (!speaker) {
      throw new Error(`Speaker ${speakerId} not found`);
    }
    
    speaker.cancellationReason = data.reason;
    speaker.cancelledAt = data.cancelledAt;
    
    if (data.periodEnd) {
      speaker.subscriptionPeriodEnd = data.periodEnd;
    }
    
    if (data.status) {
      speaker.subscriptionStatus = data.status as any;
    }
    
    return speaker;
  }

  // Speaker Events (MemStorage stubs — not used in production)
  async getSpeakerEvents(_speakerId: number, _upcomingOnly?: boolean): Promise<SpeakerEvent[]> { return []; }
  async createSpeakerEvent(event: InsertSpeakerEvent): Promise<SpeakerEvent> { return { ...event, id: 1, createdAt: new Date() } as SpeakerEvent; }
  async updateSpeakerEvent(_eventId: number, _updates: Partial<InsertSpeakerEvent>): Promise<SpeakerEvent | undefined> { return undefined; }
  async deleteSpeakerEvent(_eventId: number): Promise<boolean> { return false; }
  async getSpeakerEventById(_eventId: number): Promise<SpeakerEvent | undefined> { return undefined; }

  // Review Reactions (MemStorage stubs)
  async getReviewReactionCounts(_reviewId: number): Promise<{ likes: number; dislikes: number }> { return { likes: 0, dislikes: 0 }; }
  async getUserReviewReaction(_reviewId: number, _voterIdentifier: string): Promise<string | null> { return null; }
  async upsertReviewReaction(_reviewId: number, _voterIdentifier: string, _reaction: string): Promise<void> {}
  async removeReviewReaction(_reviewId: number, _voterIdentifier: string): Promise<void> {}

  // Review Comments (MemStorage stubs)
  async getReviewComments(_reviewId: number): Promise<ReviewComment[]> { return []; }
  async addReviewComment(data: InsertReviewComment): Promise<ReviewComment> { return { ...data, id: 1, createdAt: new Date() } as ReviewComment; }
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