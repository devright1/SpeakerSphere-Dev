import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, uuid, customType, bigint } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom type for binary data (PostgreSQL bytea)
const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
  toDriver(value: Buffer): Buffer {
    return value;
  },
  fromDriver(value: unknown): Buffer {
    return value as Buffer;
  },
});

export const speakers = pgTable("speakers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  expertise: text("expertise").array().notNull(),
  location: text("location").notNull(),
  overallRating: decimal("overall_rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  imageUrl: text("image_url").notNull(),
  verified: boolean("verified").default(false),
  featured: boolean("featured").default(false),
  isFeaturedOverride: boolean("is_featured_override").default(false),
  categories: text("categories").array().default([]),
  achievements: text("achievements").array().notNull(),
  lectures: text("lectures").array().notNull(),
  eventPhotos: text("event_photos").array(),
  speakingVideos: text("speaking_videos").array(),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  socialMedia: text("social_media").array(),
  instagramHandle: text("instagram_handle"),
  facebookHandle: text("facebook_handle"),
  xHandle: text("x_handle"),
  linkedinHandle: text("linkedin_handle"),
  tiktokHandle: text("tiktok_handle"),
  selectedSocialPlatform: varchar("selected_social_platform", { length: 20 }), // For Pro tier: "instagram", "facebook", "x", "linkedin", "tiktok"
  languages: text("languages").array().notNull(),
  medicalSpecialties: text("medical_specialties").array(),
  speakerType: text("speaker_type").notNull(), // "keynote", "clinical", "research", "educational"
  fee: text("fee"), // speaking fee as text to handle currency formatting
  experience: integer("experience"), // years of experience
  education: text("education"), // education and credentials
  certifications: text("certifications"), // certifications and awards
  affiliations: text("affiliations"), // professional affiliations
  publications: text("publications"), // publications and research
  // Subscription tier
  subscriptionTier: varchar("subscription_tier", { length: 20 }).notNull().default("basic"), // "basic", "pro", "premier"
  // Stripe subscription tracking
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("none"), // "none", "active", "past_due", "canceled", "trialing"
  subscriptionPeriodEnd: timestamp("subscription_period_end"),
  cancellationReason: text("cancellation_reason"), // Reason for subscription cancellation
  cancelledAt: timestamp("cancelled_at"), // When subscription was cancelled
  // Visibility controls
  hideProfile: boolean("hide_profile").default(false),
  hideRatings: boolean("hide_ratings").default(false),
  hideSocial: boolean("hide_social").default(false),
  hideContact: boolean("hide_contact").default(false),
  // Deletion tracking
  deletedAt: timestamp("deleted_at"), // When marked for deletion (14-day retention)
  // Storage tracking for tier enforcement (Phase 2) - using bigint for large file support
  storageUsedBytes: bigint("storage_used_bytes", { mode: "number" }).default(0).notNull(),
  videoCount: integer("video_count").default(0).notNull(),
  // SDS Badge - prioritizes speakers within their subscription tier
  sdsBadge: varchar("sds_badge", { length: 20 }), // null, "sds", or "sds_faculty"
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  userId: text("user_id"), // Optional - links to registered user if logged in
  reviewerName: text("reviewer_name").notNull(),
  reviewerTitle: text("reviewer_title").notNull(),
  reviewerCompany: text("reviewer_company").notNull(),
  overallRating: integer("overall_rating").notNull(),
  speakingStyleRating: integer("speaking_style_rating").notNull(),
  podiumPresenceRating: integer("podium_presence_rating").notNull(),
  technicalProficiencyRating: integer("technical_proficiency_rating").notNull(),
  contentRelevanceRating: integer("content_relevance_rating").notNull(),
  easeOfWorkingRating: integer("ease_of_working_rating").notNull(),
  visualDesignRating: integer("visual_design_rating").notNull(),
  comment: text("comment").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: text("event_date").notNull(),
  photoUrl: text("photo_url"),
  verified: boolean("verified").default(false),
  approvalStatus: text("approval_status").default("pending"), // "pending", "approved", "tentative", "rejected"
  adminNotes: text("admin_notes"), // Admin notes for tentative/rejected reviews
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"), // Admin email who approved/rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientCompany: text("client_company").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: text("event_date").notNull(),
  eventLocation: text("event_location").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  message: text("message").notNull(),
  status: text("status").default("pending"), // "pending", "responded", "booked", "declined"
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  speakerCount: integer("speaker_count").default(0),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // in seconds
  videoType: text("video_type").notNull(), // "demo_reel", "keynote", "interview", "testimonial", "lecture"
  eventName: text("event_name"),
  eventDate: text("event_date"),
  topics: text("topics").array(),
  viewCount: integer("view_count").default(0),
  featured: boolean("featured").default(false),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).default(0).notNull(), // For storage quota tracking - bigint for large files
  createdAt: timestamp("created_at").defaultNow(),
});

// Speaking topics table for organizing topics from CSV
export const speakingTopics = pgTable("speaking_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  speakerCount: integer("speaker_count").default(0),
  category: text("category"), // Optional grouping for similar topics
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table linking speakers to their speaking topics
export const speakerTopics = pgTable("speaker_topics", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  topicId: integer("topic_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const speakerApplications = pgTable("speaker_applications", {
  id: serial("id").primaryKey(),
  // Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  website: text("website"),
  
  // Social Media Links
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  facebookUrl: text("facebook_url"),
  linkedinUrl: text("linkedin_url"),
  
  // Professional Information
  title: text("title").notNull(),
  specialty: text("specialty").notNull(),
  yearsExperience: text("years_experience").notNull(),
  credentials: text("credentials").notNull(),
  
  // Speaking Information
  selectedCategories: text("selected_categories").array().default([]), // Array of selected official categories (legacy field)
  selectedTopicIds: integer("selected_topic_ids").array().default([]), // Array of selected speaking topic IDs (max 3)
  specificTopics: text("specific_topics").notNull(), // Detailed list of specific expertise topics
  previousExperience: text("previous_experience").notNull(),
  availableFormats: text("available_formats").array().notNull(),
  travelWillingness: text("travel_willingness").notNull(),
  
  // Additional Information
  biography: text("biography").notNull(),
  specialRequirements: text("special_requirements"),
  references: text("references"),
  
  // Profile Claim
  claimExistingProfile: boolean("claim_existing_profile").default(false),

  // Application Status
  status: text("status").default("pending"), // "pending", "approved", "rejected", "under_review"
  adminNotes: text("admin_notes"),
  reviewedBy: text("reviewed_by"), // Admin email who reviewed
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // If approved, the created speaker ID
  createdSpeakerId: integer("created_speaker_id"),
  
  // Stripe Identity verification fields
  identityVerificationStatus: varchar("identity_verification_status", { length: 30 }).default("pending"), // "pending", "processing", "verified", "requires_input", "canceled"
  identityVerificationSessionId: varchar("identity_verification_session_id", { length: 255 }), // Stripe verification session ID
  identityVerifiedAt: timestamp("identity_verified_at"),
});

export const insertSpeakerSchema = createInsertSchema(speakers).omit({
  id: true,
  overallRating: true,
  reviewCount: true,
});

export const insertSpeakerApplicationSchema = createInsertSchema(speakerApplications).omit({
  id: true,
  status: true,
  adminNotes: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  createdSpeakerId: true,
  identityVerificationStatus: true,
  identityVerificationSessionId: true,
  identityVerifiedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  verified: true,
  approvalStatus: true,
  adminNotes: true,
  approvedAt: true,
  approvedBy: true,
  createdAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  speakerCount: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  viewCount: true,
  createdAt: true,
});

export const insertSpeakingTopicSchema = createInsertSchema(speakingTopics).omit({
  id: true,
  speakerCount: true,
  createdAt: true,
});

export const insertSpeakerTopicSchema = createInsertSchema(speakerTopics).omit({
  id: true,
  createdAt: true,
});

// User authentication and profile tables
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }),
  company: varchar("company", { length: 200 }),
  profileImageUrl: text("profile_image_url"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  verificationTokenExpires: timestamp("verification_token_expires"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  isActive: boolean("is_active").default(true),
  accountType: varchar("account_type", { length: 20 }).notNull().default("user"), // "user", "speaker", or "both"
  speakerId: integer("speaker_id").references(() => speakers.id), // Links to speaker profile if account_type includes "speaker"
  subscriptionTier: varchar("subscription_tier", { length: 20 }).notNull().default("free"), // "free", "premium", "pro"
  subscriptionStatus: varchar("subscription_status", { length: 20 }).notNull().default("active"), // "active", "canceled", "expired", "trial"
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  subscriptionStartedAt: timestamp("subscription_started_at"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Stripe Identity verification fields
  identityVerificationStatus: varchar("identity_verification_status", { length: 30 }).default("pending"), // "pending", "processing", "verified", "requires_input", "canceled"
  identityVerificationSessionId: varchar("identity_verification_session_id", { length: 255 }), // Stripe verification session ID
  identityVerifiedAt: timestamp("identity_verified_at"),
  tempPassword: varchar("temp_password", { length: 255 }),
  userPasswordHash: varchar("user_password_hash", { length: 255 }),
});

// User session management
export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User likes on speakers
export const userLikes = pgTable("user_likes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  speakerId: integer("speaker_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User bookmarks/favorites
export const userBookmarks = pgTable("user_bookmarks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  speakerId: integer("speaker_id").notNull(),
  notes: text("notes"), // User's private notes about the speaker
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "Free", "Premium", "Pro"
  slug: varchar("slug", { length: 50 }).notNull().unique(), // "free", "premium", "pro"
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Monthly price
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }), // Yearly price (optional)
  features: text("features").array().notNull(), // Array of feature descriptions
  maxBookmarks: integer("max_bookmarks").default(-1), // -1 for unlimited
  maxInquiries: integer("max_inquiries").default(-1), // -1 for unlimited
  maxReviews: integer("max_reviews").default(-1), // -1 for unlimited
  advancedFilters: boolean("advanced_filters").default(false),
  prioritySupport: boolean("priority_support").default(false),
  customReports: boolean("custom_reports").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription history for tracking changes
export const subscriptionHistory = pgTable("subscription_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // "subscribe", "upgrade", "downgrade", "cancel", "expire"
  previousPlan: varchar("previous_plan", { length: 20 }),
  newPlan: varchar("new_plan", { length: 20 }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  billingCycle: varchar("billing_cycle", { length: 20 }), // "monthly", "yearly"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics tracking tables
export const speakerAnalytics = pgTable("speaker_analytics", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  profileViews: integer("profile_views").default(0),
  emailClicks: integer("email_clicks").default(0),
  phoneClicks: integer("phone_clicks").default(0),
  websiteClicks: integer("website_clicks").default(0),
  socialClicks: integer("social_clicks").default(0),
  inquiryClicks: integer("inquiry_clicks").default(0),
  videoViews: integer("video_views").default(0),
  shareCount: integer("share_count").default(0),
  favoriteCount: integer("favorite_count").default(0),
  searchAppearances: integer("search_appearances").default(0),
  searchClicks: integer("search_clicks").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Daily analytics snapshots for trend analysis
export const dailyAnalytics = pgTable("daily_analytics", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  profileViews: integer("profile_views").default(0),
  emailClicks: integer("email_clicks").default(0),
  phoneClicks: integer("phone_clicks").default(0),
  websiteClicks: integer("website_clicks").default(0),
  socialClicks: integer("social_clicks").default(0),
  inquiryClicks: integer("inquiry_clicks").default(0),
  videoViews: integer("video_views").default(0),
  shareCount: integer("share_count").default(0),
  favoriteCount: integer("favorite_count").default(0),
  searchAppearances: integer("search_appearances").default(0),
  searchClicks: integer("search_clicks").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  totalInquiries: integer("total_inquiries").default(0),
  totalReviews: integer("total_reviews").default(0),
});

// Click tracking events for real-time analytics
export const clickEvents = pgTable("click_events", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  eventType: text("event_type").notNull(), // "profile_view", "email_click", "phone_click", etc.
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  sessionId: text("session_id"),
  userId: text("user_id"), // If user is logged in
  metadata: text("metadata"), // JSON string for additional data
  timestamp: timestamp("timestamp").defaultNow(),
});

// Enhanced speaker profile interaction tracking for detailed analytics
export const speakerInteractions = pgTable("speaker_interactions", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  userId: text("user_id"), // Optional - anonymous tracking allowed
  sessionId: text("session_id"), // For anonymous user tracking
  interactionType: text("interaction_type").notNull(), 
  // Interaction types: 'profile_view', 'video_play', 'video_pause', 'video_complete', 
  // 'contact_form_open', 'inquiry_submit', 'favorite_add', 'favorite_remove', 
  // 'social_click', 'bio_expand', 'review_section_view', 'tag_click', 'photo_view',
  // 'phone_click', 'email_click', 'website_click', 'share_click', 'download_bio'
  elementClicked: text("element_clicked"), // Specific element/button clicked
  metadata: text("metadata"), // JSON string for additional data (video duration, tag name, social platform, scroll depth, etc.)
  pageUrl: text("page_url"), // Full URL where interaction occurred
  timeOnPage: integer("time_on_page"), // Time spent on page in seconds
  scrollDepth: integer("scroll_depth"), // Percentage of page scrolled
  deviceType: text("device_type"), // 'desktop', 'tablet', 'mobile'
  referrerSource: text("referrer_source"), // Where user came from
  createdAt: timestamp("created_at").defaultNow(),
});

// Demand forecasting data
export const demandMetrics = pgTable("demand_metrics", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  period: text("period").notNull(), // "week", "month", "quarter"
  periodStart: text("period_start").notNull(), // YYYY-MM-DD
  periodEnd: text("period_end").notNull(), // YYYY-MM-DD
  inquiryVolume: integer("inquiry_volume").default(0),
  inquiryRate: decimal("inquiry_rate", { precision: 5, scale: 2 }), // inquiries per view
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }), // bookings per inquiry
  averageBudget: decimal("average_budget", { precision: 10, scale: 2 }),
  topEventTypes: text("top_event_types").array(),
  topLocations: text("top_locations").array(),
  seasonalityScore: decimal("seasonality_score", { precision: 3, scale: 2 }),
  trendDirection: text("trend_direction"), // "up", "down", "stable"
  demandScore: integer("demand_score"), // 1-100 composite score
  competitivePosition: integer("competitive_position"), // ranking vs similar speakers
  createdAt: timestamp("created_at").defaultNow(),
});

// Images table for storing binary image data  
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // File size in bytes
  width: integer("width"), // Image width in pixels
  height: integer("height"), // Image height in pixels
  data: bytea("data").notNull(), // Binary image data
  checksum: text("checksum").notNull(), // SHA-256 hash for deduplication
  ownerId: text("owner_id"), // User ID who uploaded the image
  ownerType: text("owner_type").notNull(), // "user", "speaker", "review", etc.
  entityId: text("entity_id"), // ID of the related entity (speaker ID, user ID, etc.)
  imageType: text("image_type").notNull(), // "profile", "headshot", "gallery", "thumbnail", etc.
  isPublic: boolean("is_public").default(true), // Whether image can be accessed without auth
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for all tables
export type Speaker = typeof speakers.$inferSelect;
export type InsertSpeaker = typeof speakers.$inferInsert;
export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;
export type SpeakerApplication = typeof speakerApplications.$inferSelect;
export type InsertSpeakerApplication = typeof speakerApplications.$inferInsert;
export type SpeakingTopic = typeof speakingTopics.$inferSelect;
export type InsertSpeakingTopic = typeof speakingTopics.$inferInsert;
export type SpeakerTopic = typeof speakerTopics.$inferSelect;
export type InsertSpeakerTopic = typeof speakerTopics.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
export type UserLike = typeof userLikes.$inferSelect;
export type InsertUserLike = typeof userLikes.$inferInsert;
export type UserBookmark = typeof userBookmarks.$inferSelect;
export type InsertUserBookmark = typeof userBookmarks.$inferInsert;
export type SpeakerInteraction = typeof speakerInteractions.$inferSelect;
export type InsertSpeakerInteraction = typeof speakerInteractions.$inferInsert;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type InsertSubscriptionHistory = typeof subscriptionHistory.$inferInsert;

// Speaker content management for file uploads
export const speakerContent = pgTable("speaker_content", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  fileType: text("file_type").notNull(), // MIME type
  category: text("category").notNull(), // "lecture_notes", "articles", "documents", "images"
  description: text("description"),
  isPublic: boolean("is_public").default(false), // Whether file is public or private
  requiresAccessCode: boolean("requires_access_code").default(false), // Whether file requires 4-letter code
  downloadCount: integer("download_count").default(0),
  uploadPath: text("upload_path").notNull(), // Path to file in storage
  thumbnailPath: text("thumbnail_path"), // Path to thumbnail for images/videos
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content access codes for protected content
export const contentAccessCodes = pgTable("content_access_codes", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  accessCode: varchar("access_code", { length: 4 }).notNull(), // 4-letter code
  description: text("description"), // Optional description for speaker reference
  isActive: boolean("is_active").default(true), // Can be deactivated
  expiresAt: timestamp("expires_at"), // Optional expiration date
  maxUses: integer("max_uses"), // Optional usage limit
  currentUses: integer("current_uses").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Track individual content downloads with user details
export const contentDownloads = pgTable("content_downloads", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  userId: text("user_id").notNull(), // Required - must be signed in
  accessCodeId: integer("access_code_id"), // Which access code was used (if any)
  userEmail: text("user_email").notNull(), // Store email for speaker tracking
  userName: text("user_name").notNull(), // Store name for speaker tracking
  userCompany: text("user_company"), // Optional company info
  downloadedAt: timestamp("downloaded_at").defaultNow(),
  ipAddress: text("ip_address"), // For security tracking
  userAgent: text("user_agent"), // Browser/device info
});

// Speaker video links for embedding videos on profiles
export const speakerVideoLinks = pgTable("speaker_video_links", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
  title: text("title").notNull(), // Display title for the video
  url: text("url").notNull(), // Video URL (YouTube, Vimeo, etc.)
  description: text("description"), // Optional description
  position: integer("position").notNull().default(0), // Order position for display
  isVisible: boolean("is_visible").notNull().default(true), // Whether visible on public profile
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription features that can be assigned to tiers
export const subscriptionFeatures = pgTable("subscription_features", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier
  name: text("name").notNull(), // Display name of the feature
  description: text("description"), // Optional description
  createdAt: timestamp("created_at").defaultNow(),
});

// Maps features to subscription tiers with ordering and highlighting
export const subscriptionTierFeatures = pgTable("subscription_tier_features", {
  id: serial("id").primaryKey(),
  tier: varchar("tier", { length: 20 }).notNull(), // "basic", "pro", "premier"
  featureId: integer("feature_id").notNull(), // FK to subscription_features
  sortOrder: integer("sort_order").default(0), // Display order within tier
  isHighlighted: boolean("is_highlighted").default(false), // Whether to emphasize this feature
});

// Tier limits defining what each subscription tier allows
export const tierLimits = pgTable("tier_limits", {
  id: serial("id").primaryKey(),
  tier: varchar("tier", { length: 20 }).notNull().unique(), // "basic", "pro", "premier"
  bioWordLimit: integer("bio_word_limit").notNull(), // Max words for bio (must be > 0)
  topicLimit: integer("topic_limit"), // Max speaking topics (NULL = unlimited, otherwise > 0)
  uploadLimit: integer("upload_limit").notNull(), // Max lecture/publication uploads (must be > 0)
  storageLimitMb: integer("storage_limit_mb").notNull(), // Total storage limit in MB (must be > 0)
  maxFileSizeMb: integer("max_file_size_mb").notNull(), // Max file size per upload in MB (must be > 0)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tierCheck: sql`CHECK (tier IN ('basic', 'pro', 'premier'))`,
  bioWordLimitCheck: sql`CHECK (bio_word_limit > 0)`,
  topicLimitCheck: sql`CHECK (topic_limit IS NULL OR topic_limit > 0)`,
  uploadLimitCheck: sql`CHECK (upload_limit > 0)`,
  storageLimitCheck: sql`CHECK (storage_limit_mb > 0)`,
  maxFileSizeCheck: sql`CHECK (max_file_size_mb > 0)`,
}));

// Enhanced reviews - add userId field for registered user reviews
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true, // Remove passwordHash from the input schema
  emailVerified: true,
  verificationToken: true, // System-managed
  verificationTokenExpires: true, // System-managed
  passwordResetToken: true, // System-managed
  passwordResetExpires: true, // System-managed
  isActive: true,
  speakerId: true, // This will be set by the system
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertSpeakerContentSchema = createInsertSchema(speakerContent).omit({
  id: true,
  downloadCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentAccessCodeSchema = createInsertSchema(contentAccessCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentDownloadSchema = createInsertSchema(contentDownloads).omit({
  id: true,
  downloadedAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertUserLikeSchema = createInsertSchema(userLikes).omit({
  id: true,
  createdAt: true,
});

export const insertUserBookmarkSchema = createInsertSchema(userBookmarks).omit({
  id: true,
  createdAt: true,
});

// Analytics schema exports
export const insertSpeakerAnalyticsSchema = createInsertSchema(speakerAnalytics).omit({
  id: true,
  lastUpdated: true,
});

export const insertDailyAnalyticsSchema = createInsertSchema(dailyAnalytics).omit({
  id: true,
});

export const insertClickEventSchema = createInsertSchema(clickEvents).omit({
  id: true,
  timestamp: true,
});

export const insertDemandMetricsSchema = createInsertSchema(demandMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertSpeakerInteractionSchema = createInsertSchema(speakerInteractions).omit({
  id: true,
  createdAt: true,
});

// Additional type exports that are not covered by the infer types above
export type SpeakerAnalytics = typeof speakerAnalytics.$inferSelect;
export type InsertSpeakerAnalytics = z.infer<typeof insertSpeakerAnalyticsSchema>;
export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;
export type InsertDailyAnalytics = z.infer<typeof insertDailyAnalyticsSchema>;
export type ClickEvent = typeof clickEvents.$inferSelect;
export type InsertClickEvent = z.infer<typeof insertClickEventSchema>;
export type DemandMetrics = typeof demandMetrics.$inferSelect;
export type InsertDemandMetrics = z.infer<typeof insertDemandMetricsSchema>;

// Content access and download tracking types
export type SpeakerContent = typeof speakerContent.$inferSelect;
export type InsertSpeakerContent = z.infer<typeof insertSpeakerContentSchema>;
export type ContentAccessCode = typeof contentAccessCodes.$inferSelect;
export type InsertContentAccessCode = z.infer<typeof insertContentAccessCodeSchema>;
export type ContentDownload = typeof contentDownloads.$inferSelect;
export type InsertContentDownload = z.infer<typeof insertContentDownloadSchema>;

// Speaker video links schema and types
export const insertSpeakerVideoLinkSchema = createInsertSchema(speakerVideoLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SpeakerVideoLink = typeof speakerVideoLinks.$inferSelect;
export type InsertSpeakerVideoLink = z.infer<typeof insertSpeakerVideoLinkSchema>;

// Video link tier limits helper
export const VIDEO_LINK_LIMITS = {
  basic: { maxLinks: 0, visibleLinks: 0 },
  pro: { maxLinks: 5, visibleLinks: 2 },
  premier: { maxLinks: 10, visibleLinks: 5 },
} as const;

// Subscription features schemas
export const insertSubscriptionFeatureSchema = createInsertSchema(subscriptionFeatures).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionTierFeatureSchema = createInsertSchema(subscriptionTierFeatures).omit({
  id: true,
});

// Subscription features types
export type SubscriptionFeature = typeof subscriptionFeatures.$inferSelect;
export type InsertSubscriptionFeature = z.infer<typeof insertSubscriptionFeatureSchema>;
export type SubscriptionTierFeature = typeof subscriptionTierFeatures.$inferSelect;
export type InsertSubscriptionTierFeature = z.infer<typeof insertSubscriptionTierFeatureSchema>;

// Tier limits schema and types
export const insertTierLimitSchema = createInsertSchema(tierLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TierLimit = typeof tierLimits.$inferSelect;
export type InsertTierLimit = z.infer<typeof insertTierLimitSchema>;
