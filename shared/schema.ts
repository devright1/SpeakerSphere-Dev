import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const speakers = pgTable("speakers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
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
  languages: text("languages").array().notNull(),
  medicalSpecialties: text("medical_specialties").array(),
  speakerType: text("speaker_type").notNull(), // "keynote", "clinical", "research", "educational"
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  speakerId: integer("speaker_id").notNull(),
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
  verified: boolean("verified").default(false),
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

export const insertSpeakerSchema = createInsertSchema(speakers).omit({
  id: true,
  overallRating: true,
  reviewCount: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  verified: true,
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

export type Speaker = typeof speakers.$inferSelect;
export type InsertSpeaker = z.infer<typeof insertSpeakerSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
