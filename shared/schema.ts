import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  category: text("category").notNull(),
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
  languages: text("languages").array().notNull(),
  medicalSpecialties: text("medical_specialties").array(),
  speakerType: text("speaker_type").notNull(), // "keynote", "clinical", "research", "educational"
  fee: text("fee"), // speaking fee as text to handle currency formatting
  experience: integer("experience"), // years of experience
  education: text("education"), // education and credentials
  certifications: text("certifications"), // certifications and awards
  affiliations: text("affiliations"), // professional affiliations
  publications: text("publications"), // publications and research
  // Visibility controls
  hideProfile: boolean("hide_profile").default(false),
  hideRatings: boolean("hide_ratings").default(false),
  hideSocial: boolean("hide_social").default(false),
  hideContact: boolean("hide_contact").default(false),
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
  
  // Professional Information
  title: text("title").notNull(),
  specialty: text("specialty").notNull(),
  yearsExperience: text("years_experience").notNull(),
  credentials: text("credentials").notNull(),
  
  // Speaking Information
  speakingTopics: text("speaking_topics").notNull(),
  previousExperience: text("previous_experience").notNull(),
  availableFormats: text("available_formats").array().notNull(),
  travelWillingness: text("travel_willingness").notNull(),
  
  // Additional Information
  biography: text("biography").notNull(),
  specialRequirements: text("special_requirements"),
  references: text("references"),
  
  // Application Status
  status: text("status").default("pending"), // "pending", "approved", "rejected", "under_review"
  adminNotes: text("admin_notes"),
  reviewedBy: text("reviewed_by"), // Admin email who reviewed
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // If approved, the created speaker ID
  createdSpeakerId: integer("created_speaker_id"),
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

// User authentication and profile tables
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }),
  company: varchar("company", { length: 200 }),
  profileImageUrl: text("profile_image_url"),
  emailVerified: boolean("email_verified").default(false),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Enhanced reviews - add userId field for registered user reviews
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true, // Remove passwordHash from the input schema
  emailVerified: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
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

export type Speaker = typeof speakers.$inferSelect;
export type InsertSpeaker = z.infer<typeof insertSpeakerSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserLike = typeof userLikes.$inferSelect;
export type InsertUserLike = z.infer<typeof insertUserLikeSchema>;
export type UserBookmark = typeof userBookmarks.$inferSelect;
export type InsertUserBookmark = z.infer<typeof insertUserBookmarkSchema>;
export type SpeakerAnalytics = typeof speakerAnalytics.$inferSelect;
export type InsertSpeakerAnalytics = z.infer<typeof insertSpeakerAnalyticsSchema>;
export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;
export type InsertDailyAnalytics = z.infer<typeof insertDailyAnalyticsSchema>;
export type ClickEvent = typeof clickEvents.$inferSelect;
export type InsertClickEvent = z.infer<typeof insertClickEventSchema>;
export type DemandMetrics = typeof demandMetrics.$inferSelect;
export type InsertDemandMetrics = z.infer<typeof insertDemandMetricsSchema>;
export type SpeakerApplication = typeof speakerApplications.$inferSelect;
export type InsertSpeakerApplication = z.infer<typeof insertSpeakerApplicationSchema>;
