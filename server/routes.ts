import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
// Removed zfd import as it's not needed for current functionality
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertSpeakerApplicationSchema, subscriptionPlans, subscriptionHistory, speakers, VIDEO_LINK_LIMITS, insertSpeakerVideoLinkSchema, EVENT_LIMITS } from "../shared/schema";
import { registerAdminRoutes } from "./admin-routes";
import { EmailService } from "./email-service";
import multer from "multer";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { 
  rateLimiters, 
  validators, 
  validateRequest, 
  validateFileUpload, 
  SecurityUtils 
} from "./security";
import { authRoutes } from "./auth-routes";
import Stripe from "stripe";
import * as XLSX from "xlsx";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});

// Types for user authentication
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    speakerId?: number;
  };
  session: any;
}

async function resolveUserId(req: AuthenticatedRequest): Promise<string | undefined> {
  const tokenHeader = req.headers['x-user-id'] as string;
  if (tokenHeader) {
    const user = await storage.getUserByToken(tokenHeader);
    if (user) return user.id;
  }
  if (req.session?.user?.id) {
    return req.session.user.id;
  }
  return undefined;
}

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

// Multer configuration for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(), // Store in memory instead of disk
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit (matches tier max file size)
});

export async function registerRoutes(app: Express): Promise<Express> {
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Register authentication routes first
  app.use("/api/auth", authRoutes);
  
  // Register admin routes
  registerAdminRoutes(app);
  
  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      message: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }
    const { name, email, message } = parsed.data;
    const emailService = EmailService.getInstance();
    const sent = await emailService.sendEmail({
      to: "speakers@devright.com",
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@thespeakersphere.com",
      subject: `Contact Form Message from ${name}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    });
    if (!sent) {
      return res.status(500).json({ error: "Failed to send message" });
    }
    return res.json({ success: true });
  });

  // =====================
  // Speaker Events API
  // =====================

  // GET /api/speakers/:id/events — public, upcoming only (for profile page)
  app.get("/api/speakers/:id/events", async (req, res) => {
    const speakerId = parseInt(req.params.id);
    if (isNaN(speakerId)) return res.status(400).json({ error: "Invalid speaker ID" });
    const events = await storage.getSpeakerEvents(speakerId, true);
    return res.json(events);
  });

  // GET /api/speakers/:id/events/all — authenticated, all events for dashboard management
  app.get("/api/speakers/:id/events/all", async (req: AuthenticatedRequest, res) => {
    const speakerId = parseInt(req.params.id);
    if (isNaN(speakerId)) return res.status(400).json({ error: "Invalid speaker ID" });

    const userId = await resolveUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = await storage.getUserById(userId);
    if (!user || user.speakerId !== speakerId) return res.status(403).json({ error: "Forbidden" });

    const events = await storage.getSpeakerEvents(speakerId, false);
    return res.json(events);
  });

  // POST /api/speakers/:id/events — create event (auth required, tier check)
  app.post("/api/speakers/:id/events", async (req: AuthenticatedRequest, res) => {
    const speakerId = parseInt(req.params.id);
    if (isNaN(speakerId)) return res.status(400).json({ error: "Invalid speaker ID" });

    const userId = await resolveUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = await storage.getUserById(userId);
    if (!user || user.speakerId !== speakerId) return res.status(403).json({ error: "Forbidden" });

    const speaker = await storage.getSpeaker(speakerId);
    if (!speaker) return res.status(404).json({ error: "Speaker not found" });

    const tier = speaker.subscriptionTier as 'basic' | 'pro' | 'premier';
    const limit = EVENT_LIMITS[tier] ?? 0;
    if (limit === 0) return res.status(403).json({ error: "Upgrade required to add events" });

    const existing = await storage.getSpeakerEvents(speakerId, false);
    if (existing.length >= limit) {
      return res.status(400).json({ error: `Event limit reached (${limit} for ${tier} tier)` });
    }

    const schema = z.object({
      eventName: z.string().min(1),
      eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      location: z.string().optional(),
      eventUrl: z.string().url().optional().or(z.literal('')),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid event data", details: parsed.error.errors });

    const event = await storage.createSpeakerEvent({ speakerId, ...parsed.data });
    return res.status(201).json(event);
  });

  // PUT /api/speakers/:id/events/:eventId — update event (auth required)
  app.put("/api/speakers/:id/events/:eventId", async (req: AuthenticatedRequest, res) => {
    const speakerId = parseInt(req.params.id);
    const eventId = parseInt(req.params.eventId);
    if (isNaN(speakerId) || isNaN(eventId)) return res.status(400).json({ error: "Invalid ID" });

    const userId = await resolveUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = await storage.getUserById(userId);
    if (!user || user.speakerId !== speakerId) return res.status(403).json({ error: "Forbidden" });

    const existing = await storage.getSpeakerEventById(eventId);
    if (!existing || existing.speakerId !== speakerId) return res.status(404).json({ error: "Event not found" });

    const schema = z.object({
      eventName: z.string().min(1).optional(),
      eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      location: z.string().optional().nullable(),
      eventUrl: z.string().url().optional().nullable().or(z.literal('')),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid event data", details: parsed.error.errors });

    const updated = await storage.updateSpeakerEvent(eventId, parsed.data);
    return res.json(updated);
  });

  // DELETE /api/speakers/:id/events/:eventId — delete event (auth required)
  app.delete("/api/speakers/:id/events/:eventId", async (req: AuthenticatedRequest, res) => {
    const speakerId = parseInt(req.params.id);
    const eventId = parseInt(req.params.eventId);
    if (isNaN(speakerId) || isNaN(eventId)) return res.status(400).json({ error: "Invalid ID" });

    const userId = await resolveUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = await storage.getUserById(userId);
    if (!user || user.speakerId !== speakerId) return res.status(403).json({ error: "Forbidden" });

    const existing = await storage.getSpeakerEventById(eventId);
    if (!existing || existing.speakerId !== speakerId) return res.status(404).json({ error: "Event not found" });

    await storage.deleteSpeakerEvent(eventId);
    return res.json({ success: true });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Test verification email endpoint (for testing purposes)
  app.post("/api/test/verification-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Generate a test verification token
      const { generateVerificationToken, createVerificationEmail, sendEmail } = await import("./email");
      const testToken = generateVerificationToken();
      const testName = email.split('@')[0]; // Use email prefix as name
      
      // Create and send test verification email
      const emailData = createVerificationEmail(email, testName, testToken);
      const emailSent = await sendEmail(emailData);
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Test verification email sent successfully",
          testUrl: `${req.protocol}://${req.get('host')}/verify-email?token=${testToken}`
        });
      } else {
        res.status(500).json({ error: "Failed to send test email" });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  // Speaker application submission with validation (rate limiting temporarily disabled for testing)
  app.post("/api/auth/speaker-application", 
    // rateLimiters.contact, // Temporarily disabled for testing
    validators.speakerApplication,
    validateRequest,
    async (req: any, res: any) => {
    try {
      // Sanitize input data for speaker application
      const sanitizedData = {
        ...req.body,
        firstName: SecurityUtils.sanitizeText(req.body.firstName),
        lastName: SecurityUtils.sanitizeText(req.body.lastName),
        email: SecurityUtils.sanitizeEmail(req.body.email),
        phone: SecurityUtils.sanitizeText(req.body.phone),
        website: req.body.website ? SecurityUtils.sanitizeText(req.body.website) : undefined,
        title: SecurityUtils.sanitizeText(req.body.title),
        specialty: SecurityUtils.sanitizeText(req.body.specialty),
        yearsExperience: SecurityUtils.sanitizeText(req.body.yearsExperience),
        credentials: SecurityUtils.sanitizeText(req.body.credentials),
        selectedCategories: req.body.selectedCategories?.map((category: string) => SecurityUtils.sanitizeText(category)),
        specificTopics: SecurityUtils.sanitizeText(req.body.specificTopics),
        previousExperience: SecurityUtils.sanitizeText(req.body.previousExperience),
        availableFormats: req.body.availableFormats?.map((format: string) => SecurityUtils.sanitizeText(format)),
        travelWillingness: SecurityUtils.sanitizeText(req.body.travelWillingness),
        biography: SecurityUtils.sanitizeHtml(req.body.biography),
        specialRequirements: req.body.specialRequirements ? SecurityUtils.sanitizeText(req.body.specialRequirements) : undefined,
        references: req.body.references ? SecurityUtils.sanitizeText(req.body.references) : undefined,
        instagramUrl: req.body.instagramUrl ? SecurityUtils.sanitizeText(req.body.instagramUrl) : undefined,
        twitterUrl: req.body.twitterUrl ? SecurityUtils.sanitizeText(req.body.twitterUrl) : undefined,
        facebookUrl: req.body.facebookUrl ? SecurityUtils.sanitizeText(req.body.facebookUrl) : undefined,
        linkedinUrl: req.body.linkedinUrl ? SecurityUtils.sanitizeText(req.body.linkedinUrl) : undefined
      };

      const validatedData = insertSpeakerApplicationSchema.parse(sanitizedData);
      
      // Check if email already exists in users or applications
      const existingUser = await storage.getUserByEmail(validatedData.email);
      const existingSpeaker = await storage.getSpeakerByEmail(validatedData.email);
      const existingApplication = await storage.getSpeakerApplicationByEmail(validatedData.email);
      
      if (existingUser || existingSpeaker || existingApplication) {
        return res.status(400).json({
          success: false,
          message: "Submission failed. This email address is already in use. Please use a different email address or sign in.",
          field: "email"
        });
      }
      
      // Create speaker application record
      const application = await storage.createSpeakerApplication(validatedData);
      
      res.status(201).json({
        success: true,
        message: "Speaker application submitted successfully! We'll review your application within 5-7 business days.",
        applicationId: application.id
      });
    } catch (error: any) {
      console.error("Speaker application error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid application data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to submit application. Please try again."
      });
    }
  });

  // User registration with rate limiting and validation
  app.post("/api/auth/register", 
    rateLimiters.auth,
    [
      validators.speakerProfile[4], // email validation
      validators.speakerProfile[0], // name validation
    ],
    validateRequest,
    async (req: any, res: any) => {
    try {
      // Sanitize input data
      const sanitizedData = {
        ...req.body,
        name: SecurityUtils.sanitizeText(req.body.name),
        email: SecurityUtils.sanitizeEmail(req.body.email),
        password: req.body.password // Don't sanitize password, just validate
      };

      const userData = insertUserSchema.parse(sanitizedData);

      // Check if email already exists in users, speakers, or applications
      const existingUser = await storage.getUserByEmail(userData.email);
      const existingSpeaker = await storage.getSpeakerByEmail(userData.email);
      const existingApplication = await storage.getSpeakerApplicationByEmail(userData.email);
      
      if (existingUser || existingSpeaker || existingApplication) {
        return res.status(400).json({
          success: false,
          message: "This email is already in use. Please use a different email or log in to your existing account."
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create new user
      // Create new user
      const { password, ...userDataWithoutPassword } = userData;
      const user = await storage.createUser({
        ...userDataWithoutPassword,
        passwordHash
      });

      // Create session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid registration data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Registration failed. Please try again."
      });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      // Verify password — check both admin-assigned password and user-set password
      const isAdminPasswordValid = await bcrypt.compare(password, user.passwordHash);
      const isUserPasswordValid = user.userPasswordHash ? await bcrypt.compare(password, user.userPasswordHash) : false;
      if (!isAdminPasswordValid && !isUserPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Create session
      if (!(req as any).session) {
        (req as any).session = {};
      }
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        speakerId: user.speakerId,
      };

      // Save session explicitly
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({
            success: false,
            message: "Login failed - session error"
          });
        }

        res.json({
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            speakerId: user.speakerId,
          }
        });
      });
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid login data"
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Login failed. Please try again."
      });
    }
  });

  // User logout
  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          success: false,
          message: "Logout failed"
        });
      }
      
      res.json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });

  // Change password
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      let userId = sessionUser?.id;
      
      if (!userId) {
        const headerToken = req.headers['x-user-id'] as string;
        if (headerToken) {
          const userSession = await storage.getUserSession(headerToken);
          if (userSession) {
            userId = userSession.userId;
          }
        }
      }
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      // Get current user data
      const currentUser = await storage.getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Verify current password — accept either admin or user-set password
      const isAdminPwValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      const isUserPwValid = currentUser.userPasswordHash ? await bcrypt.compare(currentPassword, currentUser.userPasswordHash) : false;
      if (!isAdminPwValid && !isUserPwValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }

      // Hash new password and store as user-set password only (admin password stays untouched)
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      await storage.updateUserSetPassword(userId, newPasswordHash);

      res.json({
        success: true,
        message: "Password changed successfully"
      });
    } catch (error: any) {
      console.error("Change password error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid password data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to change password. Please try again."
      });
    }
  });

  // Get current user
  app.get("/api/auth/me", (req, res) => {
    const user = (req as any).session?.user;
    
    // Debug logging for auth/me endpoint
    console.log("Auth/me debug:");
    console.log("- Session exists:", !!(req as any).session);
    console.log("- Session keys:", Object.keys((req as any).session || {}));
    console.log("- User exists:", !!user);
    console.log("- User ID:", user?.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    res.json({
      success: true,
      user
    });
  });

  // Get all speakers with pagination
  app.get("/api/speakers", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const location = req.query.location as string;
      const sort = req.query.sort as string || 'name';
      
      // Handle multiple categories from query params
      const categories = req.query.categories ? 
        (Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories]) : 
        undefined;
      
      // Handle single category (for backward compatibility)
      const category = req.query.category as string;
      
      const speakers = await storage.getSpeakers({
        search,
        categories: categories && categories.length > 0 ? categories as string[] : undefined,
        category: category, // Keep for backward compatibility when no categories array
        location,
        includeHidden: false // Explicitly exclude hidden speakers from public view
      });
      
      res.json(speakers);
    } catch (error) {
      console.error("Error fetching speakers:", error);
      res.status(500).json({ message: "Failed to fetch speakers" });
    }
  });

  // Get featured speakers
  app.get("/api/speakers/featured", async (req, res) => {
    try {
      const speakers = await storage.getFeaturedSpeakers();
      res.json(speakers);
    } catch (error) {
      console.error("Error fetching featured speakers:", error);
      res.status(500).json({ message: "Failed to fetch featured speakers" });
    }
  });

  // Download CSV of speakers missing images
  app.get("/api/speakers/missing-images/download", async (req, res) => {
    try {
      // Query database directly to get all speakers with their image URLs
      const allSpeakers = await db.select({
        name: speakers.name,
        title: speakers.title,
        imageUrl: speakers.imageUrl,
      }).from(speakers);
      
      // Filter for speakers without migrated images
      const speakersWithoutMigratedImages = allSpeakers.filter(
        speaker => !speaker.imageUrl?.startsWith('/api/speaker-images/')
      );
      
      // Helper function to properly escape CSV fields per RFC 4180
      const escapeCsvField = (field: string): string => {
        // Quote if field contains: quotes, commas, CR, LF, or leading/trailing whitespace
        const needsQuoting = 
          field.includes('"') || 
          field.includes(',') || 
          field.includes('\r') || 
          field.includes('\n') ||
          field.trim() !== field;
        
        if (needsQuoting) {
          // Escape quotes by doubling them and wrap in quotes
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      // Generate CSV content with proper escaping
      const csvHeader = 'Name,Title\n';
      const csvRows = speakersWithoutMigratedImages
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(speaker => {
          const name = escapeCsvField(speaker.name);
          const title = escapeCsvField(speaker.title || '');
          return `${name},${title}`;
        })
        .join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Log count for verification
      console.log(`CSV Export: ${speakersWithoutMigratedImages.length} speakers missing migrated images`);
      
      // Set headers for file download with UTF-8 charset
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="speakers-missing-images.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error("Error generating CSV:", error);
      res.status(500).json({ message: "Failed to generate CSV file" });
    }
  });

  // Get speakers by tier
  app.get("/api/speakers/tier/:tier", async (req, res) => {
    try {
      const tier = req.params.tier as 'basic' | 'pro' | 'premier';
      if (!['basic', 'pro', 'premier'].includes(tier)) {
        return res.status(400).json({ message: "Invalid tier. Must be 'basic', 'pro', or 'premier'" });
      }
      const speakers = await storage.getSpeakersByTier(tier);
      res.json(speakers);
    } catch (error) {
      console.error("Error fetching speakers by tier:", error);
      res.status(500).json({ message: "Failed to fetch speakers by tier" });
    }
  });

  // Get single speaker by name
  app.get("/api/speakers/:name", async (req, res) => {
    try {
      const speaker = await storage.getSpeakerByName(req.params.name);
      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }
      res.json(speaker);
    } catch (error) {
      console.error("Error fetching speaker:", error);
      res.status(500).json({ message: "Failed to fetch speaker" });
    }
  });

  // Get speaker by user ID
  app.get("/api/speakers/by-user/:userId", async (req, res) => {
    try {
      const speaker = await storage.getSpeakerByUserId(req.params.userId);
      if (!speaker) {
        return res.status(404).json({ message: "Speaker profile not found" });
      }
      res.json(speaker);
    } catch (error) {
      console.error("Error fetching speaker by user:", error);
      res.status(500).json({ message: "Failed to fetch speaker profile" });
    }
  });

  // Update speaker profile
  app.put("/api/speakers/:id", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      
      // Remove timestamp and system fields that shouldn't be manually updated
      const {
        subscriptionPeriodEnd,
        cancelledAt,
        deletedAt,
        currentStorageBytes,
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus,
        ...updateData
      } = req.body;
      
      const updatedSpeaker = await storage.updateSpeaker(speakerId, updateData);
      res.json(updatedSpeaker);
    } catch (error) {
      console.error("Error updating speaker:", error);
      res.status(500).json({ message: "Failed to update speaker" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Add new category
  app.post("/api/categories", async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name || !description) {
        return res.status(400).json({ message: "Name and description are required" });
      }

      // Check if category already exists
      const existingCategories = await storage.getCategories();
      const existingCategory = existingCategories.find(cat => 
        cat.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingCategory) {
        return res.status(400).json({ message: "Category with this name already exists" });
      }

      const newCategory = await storage.createCategory({ name, description });
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({ message: "Failed to add category" });
    }
  });

  // Delete category
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const success = await storage.deleteCategory(categoryId);
      
      if (success) {
        res.json({ message: "Category deleted successfully" });
      } else {
        res.status(404).json({ message: "Category not found" });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Get speakers by category (through their topics)
  app.get("/api/categories/:categoryName/speakers", async (req, res) => {
    try {
      const categoryName = decodeURIComponent(req.params.categoryName);
      
      // Parse query parameters for additional filtering
      const filters: any = {};
      
      if (req.query.search) {
        filters.search = req.query.search as string;
      }
      
      if (req.query.verified !== undefined) {
        filters.verified = req.query.verified === 'true';
      }
      
      if (req.query.featured !== undefined) {
        filters.featured = req.query.featured === 'true';
      }
      
      if (req.query.minFee) {
        filters.minFee = parseInt(req.query.minFee as string);
      }
      
      if (req.query.maxFee) {
        filters.maxFee = parseInt(req.query.maxFee as string);
      }
      
      // Use direct database query like deployed site (bypass storage layer)
      const { db } = await import('./db');
      const { speakers } = await import('../shared/schema');
      const { and, like, sql, gte, lte, eq, or, isNull } = await import('drizzle-orm');
      
      // Build conditions
      const conditions = [];
      conditions.push(sql`${speakers.categories} @> ARRAY[${categoryName}]`);
      
      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        conditions.push(
          or(
            like(sql`LOWER(${speakers.name})`, searchTerm),
            like(sql`LOWER(${speakers.title})`, searchTerm),
            like(sql`LOWER(${speakers.bio})`, searchTerm)
          )
        );
      }
      
      if (filters.verified !== undefined) {
        conditions.push(eq(speakers.verified, filters.verified));
      }
      
      if (filters.featured !== undefined) {
        conditions.push(eq(speakers.featured, filters.featured));
      }
      
      const filteredSpeakers = await db
        .select()
        .from(speakers)
        .where(and(...conditions))
        .orderBy(speakers.name);
      
      res.json(filteredSpeakers);
    } catch (error) {
      console.error("Error fetching speakers by category:", error);
      res.status(500).json({ message: "Failed to fetch speakers by category" });
    }
  });

  // Get all speaking topics
  app.get("/api/topics", async (req, res) => {
    try {
      const topics = await storage.getSpeakingTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  // Get speaking topics grouped by category
  app.get("/api/topics/grouped", async (req, res) => {
    try {
      const topics = await storage.getSpeakingTopics();
      
      // Group topics by category
      const groupedTopics = topics.reduce((acc: Record<string, typeof topics>, topic) => {
        const category = topic.category || "Uncategorized";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(topic);
        return acc;
      }, {});
      
      res.json(groupedTopics);
    } catch (error) {
      console.error("Error fetching grouped topics:", error);
      res.status(500).json({ message: "Failed to fetch grouped topics" });
    }
  });

  // Get topics by speaker ID
  app.get("/api/speakers/:id/topics", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      const topics = await storage.getSpeakerTopicsBySpeakerId(speakerId);
      
      // Get speaker to check subscription tier
      const speaker = await storage.getSpeaker(speakerId);
      
      // Basic tier speakers (or speakers with no subscription) can only show 3 topics
      const tier = speaker?.subscriptionTier || 'basic';
      if (tier === 'basic' && topics.length > 3) {
        // Use deterministic random selection based on speaker ID for consistency
        const seededRandom = (seed: number) => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };
        
        // Shuffle topics using seeded random
        const shuffled = [...topics].sort((a, b) => {
          const hashA = seededRandom(speakerId * 1000 + a.id);
          const hashB = seededRandom(speakerId * 1000 + b.id);
          return hashA - hashB;
        });
        
        // Return only first 3 topics
        res.json(shuffled.slice(0, 3));
      } else {
        res.json(topics);
      }
    } catch (error) {
      console.error("Error fetching speaker topics:", error);
      res.status(500).json({ message: "Failed to fetch speaker topics" });
    }
  });

  // Update speaker topics
  app.put("/api/speakers/:id/topics", 
    rateLimiters.general,
    validators.id,
    validators.topics,
    validateRequest,
    async (req: any, res: any) => {
    try {
      const speakerId = parseInt(req.params.id);
      const { topicIds } = req.body;

      if (!Array.isArray(topicIds)) {
        return res.status(400).json({ message: "topicIds must be an array" });
      }

      // Remove all existing topics for this speaker
      await storage.clearSpeakerTopics(speakerId);

      // Add new topics if any are selected
      if (topicIds.length > 0) {
        await storage.bulkAddSpeakerTopics(speakerId, topicIds);
      }

      // Update speaker counts for all affected topics
      const allTopics = await storage.getSpeakingTopics();
      for (const topic of allTopics) {
        await storage.updateTopicSpeakerCount(topic.id);
      }

      // Update speaker categories based on their selected topics
      const speakerTopics = await storage.getSpeakerTopicsBySpeakerId(speakerId);
      const uniqueCategories = new Set(speakerTopics
        .map(topic => topic.category)
        .filter(category => category !== null && category !== undefined)
      );
      const speakerCategories = Array.from(uniqueCategories);
      
      // Update the speaker's categories field
      await storage.updateSpeaker(speakerId, { categories: speakerCategories });

      res.json({ success: true, message: "Speaker topics updated successfully" });
    } catch (error) {
      console.error("Error updating speaker topics:", error);
      res.status(500).json({ message: "Failed to update speaker topics" });
    }
  });

  // VIDEO MANAGEMENT ENDPOINTS (Phase 2)
  
  // Get videos for a speaker
  app.get("/api/speakers/:speakerId/videos", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const videos = await storage.getSpeakerVideos(speakerId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching speaker videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Upload new video (with storage quota enforcement)
  app.post("/api/speakers/:speakerId/videos", 
    rateLimiters.general,
    async (req: any, res: any) => {
    try {
      // Check authentication
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Must be logged in" });
      }

      const speakerId = parseInt(req.params.speakerId);
      const userId = req.session.user.id;

      // Verify the user owns this speaker profile
      const speaker = await storage.getSpeakerByUserId(userId);
      if (!speaker || speaker.id !== speakerId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { title, description, videoUrl, thumbnailUrl, duration, videoType, eventName, eventDate, topics, fileSizeBytes } = req.body;

      // Validate required fields
      if (!title || !videoUrl || !videoType || !fileSizeBytes) {
        return res.status(400).json({ error: "Missing required fields: title, videoUrl, videoType, fileSizeBytes" });
      }

      // Import storage limits
      const { canUploadVideo } = await import("../shared/storage-limits");
      
      // Check storage quota
      const uploadCheck = canUploadVideo(
        speaker.storageUsedBytes || 0,
        speaker.videoCount || 0,
        fileSizeBytes,
        speaker.subscriptionTier
      );

      if (!uploadCheck.allowed) {
        return res.status(403).json({ 
          error: "Upload not allowed",
          reason: uploadCheck.reason 
        });
      }

      // Create video
      const video = await storage.createVideo({
        speakerId,
        title,
        description: description || null,
        videoUrl,
        thumbnailUrl: thumbnailUrl || null,
        duration: duration || null,
        videoType,
        eventName: eventName || null,
        eventDate: eventDate || null,
        topics: topics || [],
        fileSizeBytes
      });

      // Update speaker storage tracking
      await storage.updateSpeakerStorage(speakerId, fileSizeBytes, 1);

      res.status(201).json(video);
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  // Delete video
  app.delete("/api/videos/:videoId",
    rateLimiters.general,
    async (req: any, res: any) => {
    try {
      // Check authentication
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Must be logged in" });
      }

      const videoId = parseInt(req.params.videoId);
      const userId = req.session.user.id;

      // Get video to verify ownership
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Verify the user owns this video's speaker profile
      const speaker = await storage.getSpeakerByUserId(userId);
      if (!speaker || speaker.id !== video.speakerId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Delete video and update storage
      await storage.deleteVideo(videoId);
      await storage.updateSpeakerStorage(speaker.id, -video.fileSizeBytes, -1);

      res.json({ success: true, message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Track video view
  app.post("/api/videos/:videoId/view", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      await storage.incrementVideoViewCount(videoId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking video view:", error);
      res.status(500).json({ error: "Failed to track view" });
    }
  });

  // Get speaker storage usage
  app.get("/api/speakers/:speakerId/storage", async (req: any, res: any) => {
    try {
      // Check authentication
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Must be logged in" });
      }

      const speakerId = parseInt(req.params.speakerId);
      const userId = req.session.user.id;

      // Verify the user owns this speaker profile
      const speaker = await storage.getSpeakerByUserId(userId);
      if (!speaker || speaker.id !== speakerId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Import storage limits
      const { getStorageLimits, formatBytes } = await import("../shared/storage-limits");
      const limits = getStorageLimits(speaker.subscriptionTier);

      res.json({
        storageUsedBytes: speaker.storageUsedBytes || 0,
        storageUsedFormatted: formatBytes(speaker.storageUsedBytes || 0),
        maxStorageBytes: limits.maxStorageBytes,
        maxStorageFormatted: limits.displayStorage,
        videoCount: speaker.videoCount || 0,
        maxVideos: limits.maxVideos,
        maxVideosFormatted: limits.displayVideos,
        tier: speaker.subscriptionTier,
        storagePercentage: ((speaker.storageUsedBytes || 0) / limits.maxStorageBytes) * 100,
        videosPercentage: limits.maxVideos === -1 ? 0 : ((speaker.videoCount || 0) / limits.maxVideos) * 100
      });
    } catch (error) {
      console.error("Error fetching storage usage:", error);
      res.status(500).json({ error: "Failed to fetch storage usage" });
    }
  });

  // Submit inquiry
  app.post("/api/inquiries", async (req, res) => {
    try {
      // Get user info from token to link inquiry properly
      const token = req.headers['x-user-id'] as string;
      let userEmail = req.body.clientEmail; // Default to form email
      
      if (token) {
        const user = await storage.getUserByToken(token);
        if (user) {
          userEmail = user.email; // Use authenticated user's email
        }
      }

      // Ensure the inquiry is linked to the user's account
      const inquiryData = {
        ...req.body,
        clientEmail: userEmail
      };

      const inquiry = await storage.createInquiry(inquiryData);
      
      // Get speaker information for email notifications
      const speaker = await storage.getSpeaker(inquiry.speakerId);
      if (speaker) {
        const emailService = EmailService.getInstance();
        
        // Send confirmation email to client
        await emailService.sendInquiryConfirmation(
          inquiry.clientEmail,
          inquiry.clientName,
          speaker.name,
          inquiry.id
        );
        
        // Send notification email to admin
        // All inquiries are managed by admin regardless of subscription tier
        await emailService.sendInquiryAdminNotification(inquiry, speaker.name);
        
        console.log(`✅ Email notifications sent for inquiry #${inquiry.id} - routed to admin`);
      }
      
      res.status(201).json({
        success: true,
        message: "Inquiry submitted successfully",
        inquiry
      });
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to submit inquiry" 
      });
    }
  });

  // Get user inquiries by email
  app.get("/api/users/:email/inquiries", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const inquiries = await storage.getUserInquiries(email);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching user inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Submit review
  app.post("/api/reviews", 
    rateLimiters.reviews,
    validators.review,
    validateRequest,
    async (req: any, res: any) => {
    try {
      const review = await storage.createReview(req.body);
      res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        review
      });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit review"
      });
    }
  });

  // Submit review for specific speaker (with file upload support)
  app.post("/api/speakers/:speakerId/reviews", (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: "File size too large. Please upload an image smaller than 10MB."
          });
        }
        return res.status(400).json({
          success: false,
          message: "File upload error: " + err.message
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      
      // Use a default user ID for now - simplified authentication
      const userIdHeader = req.headers['x-user-id'];
      const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader || 'anonymous-user';

      // Handle photo upload if present
      let photoUrl = null;
      if (req.file) {
        // Validate file type
        if (!req.file.mimetype.startsWith('image/')) {
          return res.status(400).json({ 
            success: false,
            message: "Only image files are allowed" 
          });
        }

        // Store image in database using the same pattern as profile pictures
        const imageData = req.file.buffer;
        
        // Calculate checksum for deduplication
        const crypto = await import('crypto');
        const checksum = crypto.default.createHash('sha256').update(imageData).digest('hex');
        
        // Save image to database
        const imageRecord = await storage.createImage({
          filename: `${Date.now()}_${req.file.originalname}`,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          width: undefined, // Skip dimensions for now
          height: undefined,
          data: imageData,
          checksum,
          ownerId: userId,
          ownerType: 'review',
          entityId: speakerId.toString(),
          imageType: 'review',
          isPublic: true
        });

        photoUrl = `/api/images/${imageRecord.id}`;
      }

      const reviewData = {
        speakerId,
        userId: userId,
        reviewerName: req.body.reviewerName,
        reviewerTitle: req.body.reviewerTitle,
        reviewerCompany: req.body.reviewerCompany,
        speakingStyleRating: parseInt(req.body.speakingStyleRating),
        podiumPresenceRating: parseInt(req.body.podiumPresenceRating),
        technicalProficiencyRating: parseInt(req.body.technicalProficiencyRating),
        contentRelevanceRating: parseInt(req.body.contentRelevanceRating),
        easeOfWorkingRating: parseInt(req.body.easeOfWorkingRating),
        visualDesignRating: parseInt(req.body.visualDesignRating),
        overallRating: Math.round(
          (parseInt(req.body.speakingStyleRating) + 
           parseInt(req.body.podiumPresenceRating) + 
           parseInt(req.body.technicalProficiencyRating) + 
           parseInt(req.body.contentRelevanceRating) + 
           parseInt(req.body.easeOfWorkingRating) + 
           parseInt(req.body.visualDesignRating)) / 6
        ),
        comment: req.body.comment,
        eventType: req.body.eventType,
        eventDate: req.body.eventDate,
        photoUrl: photoUrl,
        approvalStatus: 'pending' // Reviews start as pending admin approval
      };

      const review = await storage.createReview(reviewData);
      
      res.status(201).json({
        success: true,
        message: "Review submitted successfully and is pending approval",
        review
      });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit review"
      });
    }
  });

  // Get reviews for a speaker
  app.get("/api/speakers/:speakerId/reviews", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const reviews = await storage.getReviewsBySpeakerId(speakerId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Analytics tracking endpoints - track ALL speakers for admin visibility
  // Individual speakers only see their own analytics if they're Premier tier
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { speakerId, eventType, metadata } = req.body;
      
      if (!speakerId || !eventType) {
        return res.status(400).json({ message: "Speaker ID and event type are required" });
      }
      
      // Verify speaker exists
      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker) {
        return res.json({ success: true, tracked: false });
      }
      
      // Extract timeOnPage and scrollDepth from metadata for dedicated columns
      const timeOnPage = metadata?.timeOnPage ? parseInt(metadata.timeOnPage) : null;
      const scrollDepth = metadata?.scrollDepth ? parseInt(metadata.scrollDepth) : null;
      
      // Track the interaction for ALL speakers - admin can view all analytics
      await storage.trackSpeakerInteraction({
        speakerId,
        userId: (req as any).session?.user?.id || null,
        sessionId: (req as any).sessionID || null,
        interactionType: eventType,
        elementClicked: metadata?.elementClicked || null,
        metadata: JSON.stringify(metadata || {}),
        pageUrl: req.headers.referer || null,
        timeOnPage,
        scrollDepth,
        deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
        referrerSource: req.headers.referer || null
      });
      
      res.json({ success: true, tracked: true });
    } catch (error) {
      console.error("Analytics tracking error:", error);
      res.status(500).json({ message: "Failed to track analytics" });
    }
  });

  // Get speaker analytics (for speaker dashboard)
  app.get("/api/analytics/speaker/:speakerId", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const month = req.query.month ? parseInt(req.query.month as string) : null;
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      const timeframe = req.query.timeframe as string || 'all';
      
      // Verify speaker ownership or admin access
      const sessionUser = (req as any).session?.user;
      const userId = req.headers['x-user-id'] as string;
      
      // Get the speaker to verify ownership
      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }
      
      // Check if user owns this speaker profile
      let isOwner = false;
      if (userId) {
        const user = await storage.getUserById(userId);
        isOwner = user?.speakerId === speakerId;
      }
      if (!isOwner && sessionUser) {
        isOwner = sessionUser.speakerId === speakerId;
      }
      
      const isAdmin = sessionUser?.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Analytics data is now available to all tiers (for greyed-out preview)
      // The frontend handles displaying the upgrade prompt for non-Premier tiers
      const analytics = await storage.getSpeakerAnalytics(speakerId, month, year, timeframe);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching speaker analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Helper function to check admin access
  const isAdminRequest = (req: any): boolean => {
    // Check session-based admin role
    const sessionUser = req.session?.user;
    if (sessionUser?.role === 'admin') {
      return true;
    }
    // Check for admin email header (used by client-side admin auth)
    const adminEmail = req.headers['x-admin-email'] as string;
    if (adminEmail === 'speakers@devright.com') {
      return true;
    }
    return false;
  };

  // Get overall analytics dashboard (admin only)
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Use efficient aggregated query instead of iterating through all speakers
      const platformAnalytics = await storage.getPlatformAnalytics();

      res.json({
        overview: platformAnalytics
      });
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard analytics" });
    }
  });

  // Get individual speaker analytics (admin only) - uses timeframe parameter
  // This endpoint is used by the admin dashboard's detailed speaker analytics
  app.get("/api/speakers/:speakerId/analytics", async (req, res) => {
    try {
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const speakerId = parseInt(req.params.speakerId);
      const timeframe = (req.query.timeframe as string) || '7d';
      
      // Get the speaker to verify it exists
      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }
      
      // Use the interaction analytics method that supports timeframe
      const analytics = await storage.getSpeakerInteractionAnalytics(speakerId, timeframe);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching speaker analytics:", error);
      res.status(500).json({ message: "Failed to fetch speaker analytics" });
    }
  });

  // Get top performing speakers (admin only)
  app.get("/api/analytics/top-performers", async (req, res) => {
    try {
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Use efficient aggregated query
      const topPerformers = await storage.getTopPerformers(10);

      // Map to expected format
      res.json(topPerformers.map(p => ({
        speakerId: p.speakerId,
        name: p.name,
        profileViews: p.profileViews,
        totalClicks: p.engagementClicks,
        inquiryClicks: p.inquiryClicks
      })));
    } catch (error) {
      console.error("Error fetching top performers:", error);
      res.status(500).json({ message: "Failed to fetch top performers" });
    }
  });

  // Search speakers with advanced filters - simplified to use getSpeakers
  app.get("/api/search", 
    rateLimiters.search,
    validators.search,
    validateRequest,
    async (req: any, res: any) => {
    try {
      const {
        q: query,
        category,
        location,
        minRating,
        expertise
      } = req.query;

      const results = await storage.getSpeakers({
        search: query as string,
        category: category as string,
        location: location as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        expertise: expertise as string
      });

      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Speaker profile management endpoints (for logged-in speakers)
  app.get("/api/speaker/profile", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user || !user.speakerId) {
        return res.status(401).json({ message: "Speaker authentication required" });
      }

      const speaker = await storage.getSpeaker(user.speakerId);
      if (!speaker) {
        return res.status(404).json({ message: "Speaker profile not found" });
      }

      res.json(speaker);
    } catch (error) {
      console.error("Error fetching speaker profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/speaker/profile", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user || !user.speakerId) {
        return res.status(401).json({ message: "Speaker authentication required" });
      }

      const updatedSpeaker = await storage.updateSpeaker(user.speakerId, req.body);
      res.json({
        success: true,
        message: "Profile updated successfully",
        speaker: updatedSpeaker
      });
    } catch (error) {
      console.error("Error updating speaker profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile"
      });
    }
  });

  // Speaker inquiries management
  app.get("/api/speaker/inquiries", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user || !user.speakerId) {
        return res.status(401).json({ message: "Speaker authentication required" });
      }

      const inquiries = await storage.getInquiriesBySpeakerId(user.speakerId);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching speaker inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Update inquiry status - simplified endpoint
  app.patch("/api/inquiries/:id/status", async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const { status } = req.body;
      
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // For now, just return success - implement full functionality later
      res.json({
        success: true,
        message: "Inquiry status update requested",
        inquiryId
      });
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update inquiry status"
      });
    }
  });

  // File upload for speaker media
  app.post("/api/speaker/upload", upload.single('file'), async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user || !user.speakerId) {
        return res.status(401).json({ message: "Speaker authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Here you would implement file upload to your storage service
      // For now, we'll return a mock URL
      const fileUrl = `/uploads/${Date.now()}_${req.file.originalname}`;

      res.json({
        success: true,
        fileUrl,
        message: "File uploaded successfully"
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file"
      });
    }
  });

  // Change password endpoint - simplified approach
  app.post("/api/users/:userId/change-password", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      console.log("Password change request for user:", userId);

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          success: false,
          message: "All fields are required" 
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          success: false,
          message: "New passwords don't match" 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false,
          message: "Password must be at least 6 characters long" 
        });
      }

      // Get user from database
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Verify current password — accept either admin or user-set password
      const isAdminPwValid = await bcrypt.compare(currentPassword, user.passwordHash);
      const isUserPwValid = user.userPasswordHash ? await bcrypt.compare(currentPassword, user.userPasswordHash) : false;
      if (!isAdminPwValid && !isUserPwValid) {
        return res.status(400).json({ 
          success: false,
          message: "Current password is incorrect" 
        });
      }

      // Hash new password and store as user-set password only (admin password stays untouched)
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUserSetPassword(userId, newPasswordHash);

      console.log("Password changed successfully for user:", userId);

      res.json({
        success: true,
        message: "Password changed successfully"
      });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change password"
      });
    }
  });

  // Get user reviews
  app.get("/api/users/reviews/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      console.log("Getting reviews for user:", userId);
      
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  // Content Management API Routes
  
  // Upload content file
  app.post("/api/speakers/:speakerId/content", 
    rateLimiters.uploads,
    validators.id,
    upload.single('file'), 
    validateFileUpload,
    async (req: AuthenticatedRequest, res: Response) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const { description, category, section, isPublic } = req.body;
      
      const validSections = ['lecture_notes', 'articles', 'documents', 'images'];
      const resolvedCategory = section && validSections.includes(section) 
        ? section 
        : (category && validSections.includes(category) ? category : 'documents');
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const sectionMimeRules: Record<string, string[]> = {
        lecture_notes: ['application/pdf'],
        articles: ['application/pdf'],
        documents: ['application/pdf'],
        images: ['image/jpeg', 'image/png', 'image/gif'],
      };
      const allowedMimes = sectionMimeRules[resolvedCategory];
      if (allowedMimes && !allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          error: "Invalid file type", 
          message: `${resolvedCategory === 'images' ? 'Images' : 'This'} section only accepts ${resolvedCategory === 'images' ? 'JPG, PNG, or GIF' : 'PDF'} files.`
        });
      }

      // Check if user owns this speaker profile - check both session and auth header
      let user = (req as any).session?.user;
      
      console.log('Content upload POST endpoint debug:', {
        sessionUser: user,
        sessionExists: !!(req as any).session,
        sessionKeys: Object.keys((req as any).session || {}),
        userIdHeader: req.headers['x-user-id'],
        speakerId: speakerId,
        fileUploaded: !!req.file,
        fileName: req.file?.filename,
        filePath: req.file?.path
      });
      
      // Fallback: Check if there's user data in another format
      if (!user) {
        // Try to get user from X-User-ID header like downloads do
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          try {
            const userData = await storage.getUserById(userIdHeader);
            if (userData?.speakerId) {
              user = { speakerId: userData.speakerId };
              console.log('Found user via X-User-ID header:', userIdHeader);
            }
          } catch (error) {
            console.error('Fallback auth failed during upload:', error);
          }
        }
      }
      
      console.log('Content upload auth check:', {
        sessionUser: user,
        speakerId: speakerId,
        userSpeakerId: user?.speakerId,
        hasSession: !!(req as any).session,
        sessionKeys: Object.keys((req as any).session || {})
      });
      
      // Get speaker to check tier limits and storage
      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker) {
        return res.status(404).json({ error: "Speaker not found" });
      }
      
      // Temporarily allow upload if user is not in session but speaker exists
      if (!user) {
        console.log('Allowing upload due to session issue - speaker exists:', speaker.name);
      } else if (user.speakerId !== speakerId) {
        return res.status(403).json({ error: "Not authorized to upload content for this speaker" });
      }
      
      // Check tier limits for file size and storage
      const tierLimits = await storage.getTierLimit(speaker.subscriptionTier as 'basic' | 'pro' | 'premier');
      if (!tierLimits) {
        return res.status(500).json({ error: "Tier limits not found" });
      }
      
      // Check individual file size limit
      const fileSizeMB = req.file.size / (1024 * 1024);
      if (fileSizeMB > tierLimits.maxFileSizeMb) {
        return res.status(400).json({ 
          error: "File too large", 
          message: `File size (${fileSizeMB.toFixed(2)}MB) exceeds your tier limit of ${tierLimits.maxFileSizeMb}MB` 
        });
      }
      
      // Check total storage limit
      const currentStorageMB = (speaker.storageUsedBytes || 0) / (1024 * 1024);
      const newTotalMB = currentStorageMB + fileSizeMB;
      if (newTotalMB > tierLimits.storageLimitMb) {
        return res.status(400).json({ 
          error: "Storage limit exceeded", 
          message: `Upload would exceed your storage limit. Used: ${currentStorageMB.toFixed(2)}MB, Limit: ${tierLimits.storageLimitMb}MB` 
        });
      }
      
      // Generate a unique filename for the uploaded file
      const timestamp = Date.now();
      const sanitizedOriginalName = SecurityUtils.sanitizeFileName(req.file.originalname);
      const finalFileName = `${timestamp}_${sanitizedOriginalName}`;
      
      // Use object storage service to save the file
      const objectStorage = new ObjectStorageService();
      const privateDir = objectStorage.getPrivateObjectDir();
      const uploadPath = `${privateDir}/${speakerId}/${finalFileName}`;
      
      try {
        // Parse the object path to get bucket and object names
        const parseObjectPath = (path: string) => {
          if (!path.startsWith("/")) {
            path = `/${path}`;
          }
          const pathParts = path.split("/");
          if (pathParts.length < 3) {
            throw new Error("Invalid path: must contain at least a bucket name");
          }
          const bucketName = pathParts[1];
          const objectName = pathParts.slice(2).join("/");
          return { bucketName, objectName };
        };

        const { bucketName, objectName } = parseObjectPath(uploadPath);
        
        // Upload file buffer to object storage using the client directly
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        
        await file.save(req.file.buffer, {
          metadata: {
            contentType: req.file.mimetype,
          },
        });
        
        console.log(`File uploaded to object storage: ${uploadPath}`);
      } catch (error) {
        console.error('Failed to upload file to object storage:', error);
        return res.status(500).json({ error: "Failed to upload file to storage" });
      }

      // Create content record
      const copyrightAcknowledged = req.body.copyrightAcknowledged === 'true';
      const contentData = {
        speakerId,
        fileName: finalFileName,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        category: resolvedCategory,
        description: description || '',
        isPublic: isPublic === 'true',
        uploadPath: uploadPath,
        copyrightAcknowledgedAt: copyrightAcknowledged ? new Date() : null,
      };

      const content = await storage.createSpeakerContent(contentData);
      
      // Update speaker's storage usage
      const newStorageUsed = (speaker.storageUsedBytes || 0) + req.file.size;
      await storage.updateSpeaker(speakerId, {
        storageUsedBytes: newStorageUsed
      });
      
      res.json(content);
    } catch (error) {
      console.error("Content upload error:", error);
      res.status(500).json({ error: "Failed to upload content" });
    }
  });

  // Get speaker content (public only for public speaker profiles)
  app.get("/api/speakers/:speakerId/content", async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const content = await storage.getSpeakerContent(speakerId);
      res.json(content);
    } catch (error) {
      console.error("Get content error:", error);
      res.status(500).json({ error: "Failed to get content" });
    }
  });

  // Get all speaker content for dashboard (includes private content)
  app.get("/api/speakers/:speakerId/content/all", async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const user = (req as any).session?.user;
      
      // Check if user owns this speaker profile or allow temporarily during session issue
      if (user && user.speakerId !== speakerId) {
        return res.status(403).json({ error: "Not authorized to view this content" });
      }
      
      const content = await storage.getSpeakerContent(speakerId);
      console.log(`Retrieved ${content.length} content items for speaker ${speakerId}`);
      res.json(content);
    } catch (error) {
      console.error("Get all content error:", error);
      res.status(500).json({ error: "Failed to get content" });
    }
  });

  // Update content
  app.patch("/api/content/:contentId", async (req: AuthenticatedRequest, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const { description, category, isPublic } = req.body;
      
      // Get content to check ownership
      const content = await storage.getSpeakerContentById(contentId);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Check if user owns this content
      const user = req.user;
      const sessionUser = (req as any).session?.user;
      
      console.log('Content update auth check:', {
        sessionUser: sessionUser?.id,
        contentSpeakerId: content.speakerId,
        userSpeakerId: user?.speakerId,
        hasSession: !!(req as any).session,
        sessionKeys: Object.keys((req as any).session || {})
      });

      // Temporarily allow update during session issue
      if (!user || user.speakerId !== content.speakerId) {
        // Allow if session exists (temporary workaround)
        if (!(req as any).session) {
          return res.status(403).json({ error: "Not authorized to update this content" });
        }
        
        // Verify the speaker exists
        const speaker = await storage.getSpeaker(content.speakerId);
        if (!speaker) {
          return res.status(404).json({ error: "Speaker not found" });
        }
        console.log('Allowing update due to session issue - content belongs to speaker:', speaker.name);
      }

      const updates = { description, category, isPublic };
      const updatedContent = await storage.updateSpeakerContent(contentId, updates);
      res.json(updatedContent);
    } catch (error) {
      console.error("Update content error:", error);
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  // Delete content
  app.delete("/api/content/:contentId", async (req: AuthenticatedRequest, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      
      // Get content to check ownership
      const content = await storage.getSpeakerContentById(contentId);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Check if user owns this content
      const user = req.user;
      const sessionUser = (req as any).session?.user;
      
      console.log('Content delete auth check:', {
        sessionUser: sessionUser?.id,
        contentSpeakerId: content.speakerId,
        userSpeakerId: user?.speakerId,
        hasSession: !!(req as any).session,
        sessionKeys: Object.keys((req as any).session || {})
      });

      // Temporarily allow deletion during session issue
      if (!user || user.speakerId !== content.speakerId) {
        // Allow if session exists (temporary workaround)
        if (!(req as any).session) {
          return res.status(403).json({ error: "Not authorized to delete this content" });
        }
        
        // Verify the speaker exists
        const speaker = await storage.getSpeaker(content.speakerId);
        if (!speaker) {
          return res.status(404).json({ error: "Speaker not found" });
        }
        console.log('Allowing deletion due to session issue - content belongs to speaker:', speaker.name);
      }

      // Get speaker to update storage
      const speaker = await storage.getSpeaker(content.speakerId);
      
      const deleted = await storage.deleteSpeakerContent(contentId);
      if (deleted) {
        // Update speaker's storage usage
        if (speaker) {
          const newStorageUsed = Math.max(0, (speaker.storageUsedBytes || 0) - content.fileSize);
          await storage.updateSpeaker(speaker.id, {
            storageUsedBytes: newStorageUsed
          });
        }
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete content" });
      }
    } catch (error) {
      console.error("Delete content error:", error);
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  // Simple content download (GET endpoint - supports access codes and authentication)
  app.get("/api/content/:contentId/preview", async (req: any, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const content = await storage.getSpeakerContentById(contentId);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      const uploadPath = content.uploadPath.startsWith('/') ? content.uploadPath : `/${content.uploadPath}`;
      const pathParts = uploadPath.split('/').filter((part: string) => part.length > 0);
      if (pathParts.length < 2) {
        return res.status(404).json({ error: "Invalid file path" });
      }

      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "File not found" });
      }

      res.setHeader('Content-Type', content.fileType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const stream = file.createReadStream();
      stream.on('error', (err: any) => {
        console.error('Preview stream error:', err);
        if (!res.headersSent) res.status(500).json({ error: "Preview failed" });
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Content preview error:", error);
      res.status(500).json({ error: "Failed to load preview" });
    }
  });

  app.get("/api/content/:contentId/download", async (req: any, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const accessCode = req.query.accessCode as string;
      const user = req.session?.user;
      
      // Debug session information
      console.log("Download authentication debug:");
      console.log("- Session exists:", !!req.session);
      console.log("- Session user:", user ? 'exists' : 'missing');
      console.log("- User speakerId:", user?.speakerId);
      console.log("- X-User-ID header:", req.headers['x-user-id']);
      console.log("- Access code provided:", !!accessCode);
      
      // For speaker dashboard downloads, allow session-based authentication
      // For public profile downloads, require explicit authentication or access code
      let authUser = user;
      let userId = user?.id;
      let validatedAccessCode = null;
      
      // Check if access code is provided and valid
      if (accessCode) {
        validatedAccessCode = await storage.validateAccessCode(contentId, accessCode.toUpperCase());
        if (validatedAccessCode) {
          console.log("- Valid access code provided");
          // Even with valid access code, user must be authenticated
          if (!authUser) {
            // Try fallback authentication with X-User-ID header or userId query param
            const headerUserId = req.headers['x-user-id'] || req.query.userId;
            if (headerUserId) {
              authUser = await storage.getUserById(headerUserId);
              userId = headerUserId;
              console.log("- Fallback user lookup:", authUser ? 'found' : 'not found');
            }
            
            if (!authUser) {
              console.log("- Access denied: valid access code but user not authenticated");
              return res.status(401).json({ 
                error: "Authentication required", 
                details: "Please sign in or create an account to download content, even with an access code" 
              });
            }
          }
          console.log("- Access granted: valid access code and authenticated user");
        } else {
          console.log("- Invalid access code provided");
          return res.status(403).json({ error: "Invalid or expired access code" });
        }
      } else if (!authUser) {
        // Fallback to X-User-ID header or userId query param authentication for public profile downloads
        const headerUserId = req.headers['x-user-id'] || req.query.userId;
        if (headerUserId) {
          authUser = await storage.getUserById(headerUserId);
          userId = headerUserId;
          console.log("- Fallback user lookup:", authUser ? 'found' : 'not found');
        }
      }
      
      const content = await storage.getSpeakerContentById(contentId);
      
      // Debug logging (after content is fetched)
      console.log("Download request debug:");
      console.log("- Content found:", !!content);
      console.log("- Content upload path:", content?.uploadPath);
      console.log("- Content filename:", content?.fileName);
      console.log("- Content speakerId:", content?.speakerId);
      console.log("- Requires access code:", content?.requiresAccessCode);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // For speaker dashboard: allow downloads of own content (public or private)
      // For public profiles: allow public content downloads or content with valid access codes
      const isOwnContent = authUser && authUser.speakerId === content.speakerId;
      const hasValidAccessCode = !!validatedAccessCode;
      
      // Check if content requires access code
      if (content.requiresAccessCode && !hasValidAccessCode) {
        console.log("- Access denied: content requires access code but none provided or invalid");
        return res.status(403).json({ 
          error: "Access code required", 
          details: "This content requires a 4-letter access code to download",
          requiresAccessCode: true 
        });
      }
      
      // Allow access if:
      // 1. Content is public AND doesn't require access code, OR
      // 2. User owns the content AND content doesn't require access code, OR 
      // 3. Valid access code is provided (already checked above)
      if (!content.isPublic && !isOwnContent && !hasValidAccessCode) {
        console.log("- Access denied: not public, not own content, and no valid access code");
        return res.status(403).json({ error: "Access denied to private content" });
      }
      
      // For analytics, try to get user info but don't require it for public content
      if (!authUser && content.isPublic) {
        // Allow anonymous downloads of public content
        authUser = { id: 'anonymous', email: 'anonymous@guest.user', firstName: 'Anonymous', lastName: 'User' };
        userId = 'anonymous';
      } else if (!authUser) {
        console.log("- Authentication required for private content");
        return res.status(401).json({ error: "Authentication required for content access" });
      }
      
      console.log("- Download authorized for user:", userId, "own content:", isOwnContent);
      console.log("- Auth user email:", authUser?.email);
      console.log("- Auth user details:", authUser);

      // Track the download with user details
      await storage.createContentDownload({
        contentId,
        userId: userId || 'anonymous',
        accessCodeId: validatedAccessCode?.id || null,
        userEmail: authUser?.email || 'guest@access-code.user',
        userName: authUser?.firstName && authUser?.lastName ? `${authUser.firstName} ${authUser.lastName}` : authUser?.email || 'Unknown',
        userCompany: null,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      // If access code was used, increment its usage count
      if (validatedAccessCode) {
        await storage.incrementAccessCodeUsage(validatedAccessCode.id);
      }

      // Increment download count
      await storage.incrementContentDownloadCount(contentId);

      // Serve the actual file from object storage
      try {
        // Parse the object storage path to get bucket and object name
        const uploadPath = content.uploadPath.startsWith('/') ? content.uploadPath : `/${content.uploadPath}`;
        const pathParts = uploadPath.split('/').filter(part => part.length > 0);
        
        if (pathParts.length < 2) {
          console.error(`Invalid upload path: ${uploadPath}`);
          return res.status(404).json({ 
            error: "Invalid file path",
            details: "The file path is malformed. Please contact the speaker or administrator."
          });
        }

        const bucketName = pathParts[0];
        const objectName = pathParts.slice(1).join('/');
        
        console.log("- Bucket name:", bucketName);
        console.log("- Object name:", objectName);
        
        // Get the file from object storage
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        
        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
          console.error(`File not found in object storage: ${uploadPath}`);
          console.error(`Expected file size: ${content.fileSize} bytes`);
          
          return res.status(404).json({ 
            error: "Content temporarily unavailable",
            details: "This file needs to be re-uploaded. Please contact the speaker or administrator.",
            fileInfo: {
              originalName: content.originalName,
              expectedSize: content.fileSize,
              uploadDate: content.createdAt
            }
          });
        }

        // Set appropriate headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${content.originalName}"`);
        res.setHeader('Content-Type', content.fileType || 'application/octet-stream');
        
        // Stream the file from object storage
        const stream = file.createReadStream();
        
        stream.on('error', (error: any) => {
          console.error('Object storage stream error:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error reading file from storage" });
          }
        });
        
        stream.pipe(res);
      } catch (storageError) {
        console.error('Object storage error:', storageError);
        return res.status(500).json({ 
          error: "Storage error",
          details: "Failed to retrieve file from storage. Please try again later."
        });
      }
    } catch (error) {
      console.error("Download content error:", error);
      res.status(500).json({ error: "Failed to download content" });
    }
  });

  // Download content with access control and tracking (POST endpoint for access codes)
  app.post("/api/content/:contentId/download", async (req: any, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const { accessCode } = req.body;
      const user = req.session?.user;
      
      // Require authentication for download tracking
      if (!user) {
        return res.status(401).json({ error: "Authentication required for content access" });
      }

      const content = await storage.getSpeakerContentById(contentId);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Check if content requires access code
      if (content.requiresAccessCode && !accessCode) {
        return res.status(403).json({ error: "Access code required for this content" });
      }

      let validatedAccessCode = null;
      if (content.requiresAccessCode && accessCode) {
        validatedAccessCode = await storage.validateAccessCode(contentId, accessCode);
        if (!validatedAccessCode) {
          return res.status(403).json({ error: "Invalid or expired access code" });
        }
      }

      // Check if content is public or user has access
      if (!content.isPublic && !validatedAccessCode) {
        return res.status(403).json({ error: "Access denied to private content" });
      }

      // Track the download with user details
      await storage.createContentDownload({
        contentId,
        userId: user.id,
        accessCodeId: validatedAccessCode?.id || null,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userCompany: null, // Could be added to user schema later
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      // Update access code usage if used
      if (validatedAccessCode) {
        await storage.updateAccessCodeUsage(validatedAccessCode.id);
      }

      // Increment download count
      await storage.incrementContentDownloadCount(contentId);

      // Return download info (in real implementation, serve the actual file)
      res.json({ 
        success: true,
        fileName: content.originalName,
        downloadPath: content.uploadPath,
        message: "Download tracked successfully"
      });
    } catch (error) {
      console.error("Download content error:", error);
      res.status(500).json({ error: "Failed to download content" });
    }
  });

  // Create access code for content
  app.post("/api/content/:contentId/access-codes", async (req: AuthenticatedRequest, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const { accessCode, description, expiresAt, maxUses } = req.body;
      
      console.log("Access code creation authentication debug:");
      console.log("- Session exists:", !!(req as any).session);
      console.log("- Session user:", (req as any).session?.user ? 'exists' : 'missing');
      console.log("- X-User-ID header:", req.headers['x-user-id']);
      
      // Authentication using same pattern as downloads
      let user = (req as any).session?.user;
      
      // Fallback: Check if there's user data from X-User-ID header
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          console.log("- Fallback user lookup for:", userIdHeader);
          try {
            const userData = await storage.getUserById(userIdHeader);
            console.log("- Fallback user found:", userData ? 'yes' : 'no');
            console.log("- User speakerId:", userData?.speakerId);
            if (userData?.speakerId) {
              user = { speakerId: userData.speakerId, id: userData.id };
            }
          } catch (error) {
            console.error('Fallback auth failed for access code creation:', error);
          }
        }
      }

      console.log("- Final user object:", user);
      console.log("- User has speakerId:", !!user?.speakerId);

      if (!user || !user.speakerId) {
        console.log("- Access code creation rejected: no authenticated user or speakerId");
        return res.status(401).json({ error: "Authentication required" });
      }

      const content = await storage.getSpeakerContentById(contentId);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Check if user owns this content
      if (user.speakerId !== content.speakerId) {
        return res.status(403).json({ error: "Not authorized to manage access codes for this content" });
      }

      const newAccessCode = await storage.createContentAccessCode({
        contentId,
        accessCode: accessCode.toUpperCase(), // Store as uppercase for consistency
        description,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses || null
      });

      // Mark content as requiring access code
      try {
        const updatedContent = await storage.updateSpeakerContent(contentId, { requiresAccessCode: true });
        console.log("- Content marked as requiring access code:", !!updatedContent);
        console.log("- Updated content requiresAccessCode:", updatedContent?.requiresAccessCode);
      } catch (error) {
        console.error("- Failed to mark content as requiring access code:", error);
      }

      res.status(201).json(newAccessCode);
    } catch (error) {
      console.error("Create access code error:", error);
      res.status(500).json({ error: "Failed to create access code" });
    }
  });

  // Get access codes for content
  app.get("/api/content/:contentId/access-codes", async (req: AuthenticatedRequest, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      
      // Authentication using same pattern as downloads
      let user = (req as any).session?.user;
      
      // Fallback: Check if there's user data from X-User-ID header
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          try {
            const userData = await storage.getUserById(userIdHeader);
            if (userData?.speakerId) {
              user = { speakerId: userData.speakerId };
            }
          } catch (error) {
            console.error('Fallback auth failed for access code retrieval:', error);
          }
        }
      }

      if (!user || !user.speakerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const content = await storage.getSpeakerContentById(contentId);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Check if user owns this content
      if (user.speakerId !== content.speakerId) {
        return res.status(403).json({ error: "Not authorized to view access codes for this content" });
      }

      const accessCodes = await storage.getContentAccessCodes(contentId);
      res.json(accessCodes);
    } catch (error) {
      console.error("Get access codes error:", error);
      res.status(500).json({ error: "Failed to get access codes" });
    }
  });

  app.patch("/api/access-codes/:codeId", async (req: AuthenticatedRequest, res) => {
    try {
      const codeId = parseInt(req.params.codeId);

      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData?.speakerId) {
            user = { speakerId: userData.speakerId };
          }
        }
      }

      if (!user || !user.speakerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { description, isActive, expiresAt, maxUses } = req.body;

      const updates: any = {};
      if (description !== undefined) updates.description = description;
      if (isActive !== undefined) updates.isActive = isActive;
      if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (maxUses !== undefined) updates.maxUses = maxUses;

      const updated = await storage.updateContentAccessCode(codeId, updates);
      if (!updated) {
        return res.status(404).json({ error: "Access code not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Update access code error:", error);
      res.status(500).json({ error: "Failed to update access code" });
    }
  });

  app.delete("/api/access-codes/:codeId", async (req: AuthenticatedRequest, res) => {
    try {
      const codeId = parseInt(req.params.codeId);

      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData?.speakerId) {
            user = { speakerId: userData.speakerId };
          }
        }
      }

      if (!user || !user.speakerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const deleted = await storage.deleteContentAccessCode(codeId);
      if (!deleted) {
        return res.status(404).json({ error: "Access code not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete access code error:", error);
      res.status(500).json({ error: "Failed to delete access code" });
    }
  });

  // Verify access code for content download
  app.post("/api/content/:contentId/verify-access-code", async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const { accessCode } = req.body;

      if (!accessCode || accessCode.length !== 4) {
        return res.status(400).json({ error: "Invalid access code format" });
      }

      // Validate the access code using existing storage method
      const validatedCode = await storage.validateAccessCode(contentId, accessCode.toUpperCase());
      
      if (validatedCode) {
        res.json({ 
          valid: true, 
          description: validatedCode.description || "Valid access code"
        });
      } else {
        res.status(403).json({ 
          valid: false, 
          error: "Invalid or expired access code" 
        });
      }
    } catch (error) {
      console.error("Access code verification error:", error);
      res.status(500).json({ error: "Failed to verify access code" });
    }
  });

  // Get download analytics for speaker content
  app.get("/api/speakers/:speakerId/downloads", async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      
      // Authentication using same pattern as downloads
      let user = (req as any).session?.user;
      
      // Fallback: Check if there's user data from X-User-ID header
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          try {
            const userData = await storage.getUserById(userIdHeader);
            if (userData?.speakerId) {
              user = { speakerId: userData.speakerId };
            }
          } catch (error) {
            console.error('Fallback auth failed for download analytics:', error);
          }
        }
      }

      if (!user || !user.speakerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user owns this speaker profile
      if (user.speakerId !== speakerId) {
        return res.status(403).json({ error: "Not authorized to view download analytics" });
      }

      const downloads = await storage.getSpeakerContentDownloads(speakerId);
      res.json(downloads);
    } catch (error) {
      console.error("Get speaker downloads error:", error);
      res.status(500).json({ error: "Failed to get download analytics" });
    }
  });

  // Export download analytics as Excel (Premier only)
  app.get("/api/speakers/:speakerId/downloads/export", async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      
      // Authentication - session or X-User-ID header only (no query params for security)
      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          try {
            const userData = await storage.getUserById(userIdHeader);
            if (userData?.speakerId) {
              user = { speakerId: userData.speakerId };
            }
          } catch (error) {
            console.error('Fallback auth failed for export:', error);
          }
        }
      }

      if (!user || !user.speakerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (user.speakerId !== speakerId) {
        return res.status(403).json({ error: "Not authorized to export download analytics" });
      }

      // Check Premier tier
      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker || speaker.subscriptionTier !== 'premier') {
        return res.status(403).json({ error: "Download analytics export is only available for Premier tier" });
      }

      // Get downloads and content info
      const downloads = await storage.getSpeakerContentDownloads(speakerId);
      const speakerContent = await storage.getSpeakerContent(speakerId);
      
      // Create content ID to name mapping
      const contentMap = new Map(speakerContent.map(c => [c.id, c.originalName]));

      // Build Excel data
      const excelData = downloads.map(d => ({
        'Downloaded File': contentMap.get(d.contentId) || 'Unknown',
        'Downloader Name': d.userName,
        'Email': d.userEmail,
        'Company': d.userCompany || '',
        'Download Date': d.downloadedAt ? new Date(d.downloadedAt).toLocaleString() : '',
        'Used Access Code': d.accessCodeId ? 'Yes' : 'No'
      }));

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Download Analytics');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Send file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="download-analytics-${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export downloads error:", error);
      res.status(500).json({ error: "Failed to export download analytics" });
    }
  });

  // Validate access code endpoint (for frontend validation)
  app.post("/api/content/:contentId/validate-access-code", async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const { accessCode } = req.body;

      if (!accessCode) {
        return res.status(400).json({ error: "Access code is required" });
      }

      const validatedCode = await storage.validateAccessCode(contentId, accessCode);
      if (validatedCode) {
        res.json({ valid: true, description: validatedCode.description });
      } else {
        res.json({ valid: false, error: "Invalid or expired access code" });
      }
    } catch (error) {
      console.error("Validate access code error:", error);
      res.status(500).json({ error: "Failed to validate access code" });
    }
  });

  // ============ SPEAKER VIDEO LINKS ROUTES ============

  // Get video links for a speaker (public - respects tier visibility limits)
  app.get("/api/speakers/:speakerId/video-links", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const speaker = await storage.getSpeaker(speakerId);
      
      if (!speaker) {
        return res.status(404).json({ error: "Speaker not found" });
      }

      const videoLinks = await storage.getSpeakerVideoLinks(speakerId);
      const tier = (speaker.subscriptionTier || 'basic') as keyof typeof VIDEO_LINK_LIMITS;
      const limits = VIDEO_LINK_LIMITS[tier] || VIDEO_LINK_LIMITS.basic;
      
      // Filter by isVisible and limit by tier's visibleLinks count
      const visibleLinks = videoLinks
        .filter(link => link.isVisible)
        .slice(0, limits.visibleLinks);
      
      res.json({
        links: visibleLinks,
        tier,
        visibleCount: limits.visibleLinks,
        maxLinks: limits.maxLinks
      });
    } catch (error) {
      console.error("Get speaker video links error:", error);
      res.status(500).json({ error: "Failed to get video links" });
    }
  });

  // Get all video links for speaker dashboard (authenticated - shows all stored links)
  app.get("/api/speakers/:speakerId/video-links/all", async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      
      // Authentication
      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData?.speakerId) {
            user = { speakerId: userData.speakerId };
          }
        }
      }

      if (!user || user.speakerId !== speakerId) {
        return res.status(403).json({ error: "Not authorized to view all video links" });
      }

      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker) {
        return res.status(404).json({ error: "Speaker not found" });
      }

      const videoLinks = await storage.getSpeakerVideoLinks(speakerId);
      const tier = (speaker.subscriptionTier || 'basic') as keyof typeof VIDEO_LINK_LIMITS;
      const limits = VIDEO_LINK_LIMITS[tier] || VIDEO_LINK_LIMITS.basic;
      const currentVisibleCount = videoLinks.filter(link => link.isVisible).length;
      
      res.json({
        links: videoLinks,
        tier,
        visibleCount: limits.visibleLinks,
        maxLinks: limits.maxLinks,
        currentCount: videoLinks.length,
        currentVisibleCount
      });
    } catch (error) {
      console.error("Get all speaker video links error:", error);
      res.status(500).json({ error: "Failed to get video links" });
    }
  });

  // Create a new video link
  app.post("/api/speakers/:speakerId/video-links", async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      
      // Authentication
      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData?.speakerId) {
            user = { speakerId: userData.speakerId };
          }
        }
      }

      if (!user || user.speakerId !== speakerId) {
        return res.status(403).json({ error: "Not authorized to add video links" });
      }

      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker) {
        return res.status(404).json({ error: "Speaker not found" });
      }

      // Check tier limits
      const tier = (speaker.subscriptionTier || 'basic') as keyof typeof VIDEO_LINK_LIMITS;
      const limits = VIDEO_LINK_LIMITS[tier] || VIDEO_LINK_LIMITS.basic;
      
      if (limits.maxLinks === 0) {
        return res.status(403).json({ error: "Video links are not available for Basic tier. Please upgrade to Pro or Premier." });
      }

      const existingLinks = await storage.getSpeakerVideoLinks(speakerId);
      if (existingLinks.length >= limits.maxLinks) {
        return res.status(400).json({ error: `Maximum of ${limits.maxLinks} video links allowed for ${tier} tier` });
      }

      const { title, url, description, thumbnailUrl } = req.body;
      
      if (!title || !url) {
        return res.status(400).json({ error: "Title and URL are required" });
      }

      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      if (thumbnailUrl) {
        try {
          new URL(thumbnailUrl);
        } catch {
          return res.status(400).json({ error: "Invalid thumbnail URL format" });
        }
      }

      const newLink = await storage.createSpeakerVideoLink({
        speakerId,
        title,
        url,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        position: existingLinks.length
      });

      res.status(201).json(newLink);
    } catch (error) {
      console.error("Create video link error:", error);
      res.status(500).json({ error: "Failed to create video link" });
    }
  });

  app.post("/api/speakers/:speakerId/video-thumbnail", upload.single('thumbnail'), async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);

      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData?.speakerId) {
            user = { speakerId: userData.speakerId };
          }
        }
      }

      if (!user || user.speakerId !== speakerId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No thumbnail file provided" });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." });
      }

      const ext = req.file.originalname.split('.').pop() || 'jpg';
      const fileName = `video-thumb-${speakerId}-${Date.now()}.${ext}`;
      const privateDir = objectStorage.getPrivateObjectDir();
      const uploadPath = `${privateDir}/${speakerId}/${fileName}`;

      const parseObjectPath = (path: string) => {
        if (!path.startsWith("/")) path = `/${path}`;
        const pathParts = path.split("/");
        const bucketName = pathParts[1];
        const objectName = pathParts.slice(2).join("/");
        return { bucketName, objectName };
      };

      const { bucketName, objectName } = parseObjectPath(uploadPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
      });

      const thumbnailUrl = `/api/video-thumbnail/${speakerId}/${fileName}`;
      res.json({ thumbnailUrl });
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      res.status(500).json({ error: "Failed to upload thumbnail" });
    }
  });

  app.get("/api/video-thumbnail/:speakerId/:fileName", async (req, res) => {
    try {
      const { speakerId, fileName } = req.params;
      const privateDir = objectStorage.getPrivateObjectDir();
      const filePath = `${privateDir}/${speakerId}/${fileName}`;

      const parseObjectPath = (path: string) => {
        if (!path.startsWith("/")) path = `/${path}`;
        const pathParts = path.split("/");
        const bucketName = pathParts[1];
        const objectName = pathParts.slice(2).join("/");
        return { bucketName, objectName };
      };

      const { bucketName, objectName } = parseObjectPath(filePath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "Thumbnail not found" });
      }

      const [metadata] = await file.getMetadata();
      res.setHeader('Content-Type', metadata.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const stream = file.createReadStream();
      stream.pipe(res);
    } catch (error) {
      console.error("Thumbnail serve error:", error);
      res.status(500).json({ error: "Failed to serve thumbnail" });
    }
  });

  // Update a video link
  app.patch("/api/video-links/:linkId", async (req: AuthenticatedRequest, res) => {
    try {
      const linkId = parseInt(req.params.linkId);
      
      // Get the link to check ownership
      const links = await db.select().from(speakers).limit(1); // Just checking DB access
      
      // Authentication
      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData?.speakerId) {
            user = { speakerId: userData.speakerId };
          }
        }
      }

      if (!user || !user.speakerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { title, url, description, isVisible, thumbnailUrl } = req.body;
      
      if (url) {
        try {
          new URL(url);
        } catch {
          return res.status(400).json({ error: "Invalid URL format" });
        }
      }

      if (thumbnailUrl) {
        try {
          new URL(thumbnailUrl);
        } catch {
          return res.status(400).json({ error: "Invalid thumbnail URL format" });
        }
      }

      const updatedLink = await storage.updateSpeakerVideoLink(linkId, {
        title,
        url,
        description,
        isVisible,
        thumbnailUrl
      });

      if (!updatedLink) {
        return res.status(404).json({ error: "Video link not found" });
      }

      res.json(updatedLink);
    } catch (error) {
      console.error("Update video link error:", error);
      res.status(500).json({ error: "Failed to update video link" });
    }
  });

  // Delete a video link
  app.delete("/api/video-links/:linkId", async (req: AuthenticatedRequest, res) => {
    try {
      const linkId = parseInt(req.params.linkId);
      
      // Authentication
      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData?.speakerId) {
            user = { speakerId: userData.speakerId };
          }
        }
      }

      if (!user || !user.speakerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const deleted = await storage.deleteSpeakerVideoLink(linkId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Video link not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete video link error:", error);
      res.status(500).json({ error: "Failed to delete video link" });
    }
  });

  // Toggle video link visibility
  app.post("/api/video-links/:linkId/toggle-visibility", async (req: AuthenticatedRequest, res) => {
    try {
      const linkId = parseInt(req.params.linkId);
      
      // Authentication
      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData?.speakerId) {
            user = { speakerId: userData.speakerId };
          }
        }
      }

      if (!user || !user.speakerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get the existing link
      const existingLinks = await storage.getSpeakerVideoLinks(user.speakerId);
      const existingLink = existingLinks.find(l => l.id === linkId);
      
      if (!existingLink) {
        return res.status(404).json({ error: "Video link not found" });
      }

      // Get speaker tier to check visibility limits
      const speaker = await storage.getSpeaker(user.speakerId);
      if (!speaker) {
        return res.status(404).json({ error: "Speaker not found" });
      }

      const tier = (speaker.subscriptionTier || 'basic') as keyof typeof VIDEO_LINK_LIMITS;
      const limits = VIDEO_LINK_LIMITS[tier] || VIDEO_LINK_LIMITS.basic;
      
      // If trying to make visible, check limit
      const currentVisibleCount = existingLinks.filter(l => l.isVisible).length;
      const newIsVisible = !existingLink.isVisible;
      
      if (newIsVisible && currentVisibleCount >= limits.visibleLinks) {
        return res.status(400).json({ 
          error: `Maximum of ${limits.visibleLinks} visible videos allowed for ${tier} tier. Hide another video first.` 
        });
      }

      const updatedLink = await storage.updateSpeakerVideoLink(linkId, {
        isVisible: newIsVisible
      });

      res.json(updatedLink);
    } catch (error) {
      console.error("Toggle video visibility error:", error);
      res.status(500).json({ error: "Failed to toggle visibility" });
    }
  });

  // Reorder video links
  app.post("/api/speakers/:speakerId/video-links/reorder", async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      
      // Authentication
      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData?.speakerId) {
            user = { speakerId: userData.speakerId };
          }
        }
      }

      if (!user || user.speakerId !== speakerId) {
        return res.status(403).json({ error: "Not authorized to reorder video links" });
      }

      const { linkIds } = req.body;
      
      if (!Array.isArray(linkIds)) {
        return res.status(400).json({ error: "linkIds must be an array" });
      }

      await storage.reorderSpeakerVideoLinks(speakerId, linkIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Reorder video links error:", error);
      res.status(500).json({ error: "Failed to reorder video links" });
    }
  });

  // Object storage endpoints for profile pictures
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Database image storage endpoints
  app.post("/api/images", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: "No image file provided" 
        });
      }

      // Get user from session or header
      let user = (req as any).session?.user;
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          user = await storage.getUserById(userIdHeader);
        }
      }

      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Validate file type
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: "Only image files are allowed" });
      }

      // Read file data from memory buffer
      const imageData = req.file.buffer;
      
      // Calculate checksum for deduplication
      const crypto = await import('crypto');
      const checksum = crypto.default.createHash('sha256').update(imageData).digest('hex');
      
      // Check for existing image with same checksum
      const existingImage = await storage.getImageByChecksum(checksum);
      if (existingImage) {
        return res.json({
          success: true,
          imageId: existingImage.id,
          imageUrl: `/api/images/${existingImage.id}`,
          message: "Image already exists, reusing existing copy"
        });
      }

      // Save image to database
      const imageRecord = await storage.createImage({
        filename: `${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        width: undefined, // Skip dimensions for now
        height: undefined,
        data: imageData,
        checksum,
        ownerId: user.id,
        ownerType: req.body.ownerType || 'user',
        entityId: req.body.entityId || user.id,
        imageType: req.body.imageType || 'profile',
        isPublic: req.body.isPublic !== 'false' // Default to true unless explicitly false
      });

      res.json({
        success: true,
        imageId: imageRecord.id,
        imageUrl: `/api/images/${imageRecord.id}`,
        message: "Image uploaded successfully"
      });

    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Serve images from database
  app.get("/api/images/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      if (isNaN(imageId)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      const image = await storage.getImageById(imageId);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Check if image is public or user has access
      if (!image.isPublic) {
        let user = (req as any).session?.user;
        if (!user) {
          const userIdHeader = req.headers['x-user-id'] as string;
          if (userIdHeader) {
            user = await storage.getUserById(userIdHeader);
          }
        }

        if (!user || user.id !== image.ownerId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Set cache headers for performance
      const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
      const lastModified = image.updatedAt || image.createdAt;
      res.set({
        'Content-Type': image.mimeType,
        'Content-Length': image.size.toString(),
        'Cache-Control': `public, max-age=${maxAge}, immutable`,
        'ETag': `"${image.checksum}"`,
        'Last-Modified': lastModified ? new Date(lastModified).toUTCString() : new Date().toUTCString()
      });

      // Check if client has cached version
      const clientETag = req.headers['if-none-match'];
      if (clientETag === `"${image.checksum}"`) {
        return res.status(304).end();
      }

      // Send image data
      res.send(image.data);

    } catch (error) {
      console.error("Image serve error:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Profile picture update endpoint
  app.put("/api/users/:userId/profile-picture", async (req, res) => {
    try {
      let updatedUser;
      
      if (req.body.profilePictureURL) {
        // Update with new profile picture - now supports database image URLs
        updatedUser = await storage.updateUser(req.params.userId, {
          profileImageUrl: req.body.profilePictureURL, // Use the database image URL directly
        });
      } else if (req.body.remove === true) {
        // Remove profile picture (set to null)
        updatedUser = await storage.updateUser(req.params.userId, {
          profileImageUrl: null,
        });
      } else {
        return res.status(400).json({ 
          error: "Either profilePictureURL or remove=true is required" 
        });
      }

      // Also sync with speaker headshot if user is a speaker
      let updatedSpeaker = null;
      try {
        if (updatedUser && updatedUser.speakerId) {
          if (req.body.remove === true) {
            // Remove speaker headshot
            updatedSpeaker = await storage.updateSpeaker(updatedUser.speakerId, {
              imageUrl: "/placeholder-avatar.png",
            });
          } else if (req.body.profilePictureURL) {
            // Update speaker headshot with same image URL
            updatedSpeaker = await storage.updateSpeaker(updatedUser.speakerId, {
              imageUrl: req.body.profilePictureURL,
            });
          }
        }
      } catch (error) {
        console.warn("Failed to sync speaker headshot:", error);
        // Continue even if speaker sync fails
      }

      res.status(200).json({
        success: true,
        user: updatedUser,
        speaker: updatedSpeaker,
        message: req.body.remove ? "Profile picture removed" : "Profile picture updated",
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Speaker headshot update endpoint
  app.put("/api/speakers/:speakerId/headshot", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      
      if (isNaN(speakerId)) {
        return res.status(400).json({ error: "Invalid speaker ID" });
      }

      if (!req.body.headshotData) {
        return res.status(400).json({ 
          error: "headshotData is required" 
        });
      }

      // Authentication using same pattern as downloads
      let user = (req as any).session?.user;
      
      // Fallback: Check if there's user data from X-User-ID header
      if (!user) {
        const userIdHeader = req.headers['x-user-id'] as string;
        if (userIdHeader) {
          const userData = await storage.getUserById(userIdHeader);
          if (userData) {
            user = userData;
          }
        }
      }

      // Verify user has access to update this speaker
      if (!user || (user.speakerId !== speakerId && !user.isAdmin)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Convert base64 to database image and update speaker headshot
      const imageResult = await storage.saveImageFromBase64(
        req.body.headshotData, 
        user.id, 
        'speaker', 
        'headshot'
      );
      
      const updatedSpeaker = await storage.updateSpeaker(speakerId, {
        imageUrl: imageResult.url,
      });

      if (!updatedSpeaker) {
        return res.status(404).json({ error: "Speaker not found" });
      }

      // Also update the user's profile picture to sync both
      let updatedUser = null;
      try {
        console.log(`[SYNC DEBUG] Looking for user with speakerId: ${speakerId}`);
        const linkedUser = await storage.getUserBySpeakerId(speakerId);
        console.log(`[SYNC DEBUG] Found linked user:`, linkedUser ? { id: linkedUser.id, email: linkedUser.email } : null);
        if (linkedUser) {
          console.log(`[SYNC DEBUG] Updating user profile picture to: ${imageResult.url}`);
          updatedUser = await storage.updateUser(linkedUser.id, {
            profileImageUrl: imageResult.url,
          });
          console.log(`[SYNC DEBUG] User profile picture updated successfully`);
        } else {
          console.log(`[SYNC DEBUG] No linked user found for speakerId: ${speakerId}`);
        }
      } catch (error) {
        console.error("Failed to sync user profile picture:", error);
        // Continue even if user sync fails
      }

      res.status(200).json({
        success: true,
        speaker: updatedSpeaker,
        user: updatedUser,
        message: "Headshot updated successfully",
      });
    } catch (error) {
      console.error("Error updating speaker headshot:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Remove speaker headshot endpoint
  app.delete("/api/speakers/:speakerId/headshot", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      
      if (isNaN(speakerId)) {
        return res.status(400).json({ error: "Invalid speaker ID" });
      }

      // Set imageUrl to a default placeholder or empty string
      const updatedSpeaker = await storage.updateSpeaker(speakerId, {
        imageUrl: "/placeholder-avatar.png", // Default placeholder image
      });

      if (!updatedSpeaker) {
        return res.status(404).json({ error: "Speaker not found" });
      }

      // Also remove the user's profile picture to sync both
      let updatedUser = null;
      try {
        const linkedUser = await storage.getUserBySpeakerId(speakerId);
        if (linkedUser) {
          updatedUser = await storage.updateUser(linkedUser.id, {
            profileImageUrl: null,
          });
        }
      } catch (error) {
        console.warn("Failed to sync user profile picture removal:", error);
        // Continue even if user sync fails
      }

      res.status(200).json({
        success: true,
        speaker: updatedSpeaker,
        user: updatedUser,
        message: "Headshot removed successfully",
      });
    } catch (error) {
      console.error("Error removing speaker headshot:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user profile endpoint
  app.put("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { firstName, lastName, title, company } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({ 
          error: "First name and last name are required" 
        });
      }

      // Update user profile
      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: title?.trim() || null,
        company: company?.trim() || null,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({
        success: true,
        user: updatedUser,
        message: "Profile updated successfully"
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Placeholder image endpoint
  app.get("/api/placeholder/:width/:height", (req, res) => {
    const { width, height } = req.params;
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">
          ${width} × ${height}
        </text>
      </svg>
    `;
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  });

  // Helper function to serve logo from object storage
  const serveLogo = async (logoFileName: string, res: any) => {
    try {
      const bucketName = 'replit-objstore-b2538833-2c0e-4f8b-ac68-5d4359557493';
      const objectName = `public/${logoFileName}`;
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Set proper caching headers for email stability
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      
      // Override security headers to allow cross-origin access for email clients
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");
      
      // Stream the file directly to response
      file.createReadStream()
        .on('error', (err) => {
          console.error('Error streaming DevRight logo:', err);
          res.status(404).send('Logo not found');
        })
        .pipe(res);
    } catch (error) {
      console.error('Error serving DevRight logo:', error);
      res.status(500).send('Error loading logo');
    }
  };

  // Public DevRight logo endpoints for email templates (no authentication required)
  // Logo 1: Color icon
  app.get("/api/devright-logo-1.png", async (req, res) => {
    await serveLogo('devright-logo-color.png', res);
  });

  // Logo 2: White icon
  app.get("/api/devright-logo-2.png", async (req, res) => {
    await serveLogo('devright-logo-white.png', res);
  });

  // Logo 3: TM Color
  app.get("/api/devright-logo-3.png", async (req, res) => {
    await serveLogo('devright-logo-tm-color.png', res);
  });

  // Backward compatibility - original endpoint
  app.get("/api/devright-logo.png", async (req, res) => {
    await serveLogo('devright-icon.png', res);
  });

  // Serve speaker images from object storage
  app.get("/api/speaker-images/:filename", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const filename = req.params.filename;
      
      // Search for the image in the public directory
      const file = await objectStorageService.searchPublicObject(`speaker-images/${filename}`);
      
      if (!file) {
        return res.status(404).send('Image not found');
      }
      
      // Serve the image with proper caching
      await objectStorageService.downloadObject(file, res, 86400); // Cache for 1 day
    } catch (error) {
      console.error('Error serving speaker image:', error);
      res.status(500).send('Error loading image');
    }
  });
  
  // Subscription routes
  
  // Get all subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get user's current subscription
  app.get("/api/users/:userId/subscription", async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If user has subscription tier, get plan details and return formatted data
      if (user.subscriptionTier && user.subscriptionStatus === 'active') {
        // Find the plan details
        const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, user.subscriptionTier));
        
        return res.json({
          planName: plan?.name || user.subscriptionTier,
          planSlug: user.subscriptionTier,
          price: plan?.price || "0",
          billingCycle: 'monthly', // Default to monthly for now
          status: user.subscriptionStatus,
          expiresAt: user.subscriptionExpiresAt,
          startedAt: user.subscriptionStartedAt
        });
      }
      
      // If user has no active subscription, return null
      res.json(null);
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Update user subscription
  app.post("/api/users/:userId/subscription", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { planSlug, billingCycle } = req.body;

      // Get the selected plan
      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, planSlug));
      if (!plan) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      // Calculate expiration date (for demo purposes, just add 30 days for monthly or 365 days for yearly)
      const expirationDate = new Date();
      if (billingCycle === "yearly") {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      } else {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      }

      // Update user subscription
      await storage.updateUserSubscription(userId, {
        subscriptionTier: planSlug,
        subscriptionStatus: "active",
        subscriptionExpiresAt: expirationDate,
        subscriptionStartedAt: new Date()
      });

      // Record subscription history
      await db.insert(subscriptionHistory).values({
        userId: userId,
        planId: plan.id,
        action: "subscribe",
        newPlan: planSlug,
        amount: billingCycle === "yearly" ? plan.yearlyPrice : plan.price,
        currency: "USD",
        billingCycle: billingCycle,
        notes: `Subscribed to ${plan.name} plan`
      });

      res.json({
        success: true,
        message: "Subscription updated successfully",
        subscription: {
          tier: planSlug,
          status: "active",
          expiresAt: expirationDate
        }
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Cancel subscription
  app.post("/api/users/:userId/subscription/cancel", async (req, res) => {
    try {
      const userId = req.params.userId;
      
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: "canceled"
      });

      res.json({
        success: true,
        message: "Subscription canceled successfully"
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Bookmark endpoints
  // Toggle bookmark (create or delete)
  app.post("/api/users/:userId/bookmarks", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { speakerId } = req.body;
      
      if (!speakerId) {
        return res.status(400).json({ message: "Speaker ID is required" });
      }
      
      const result = await storage.toggleUserBookmark(userId, speakerId);
      
      res.json({
        success: true,
        bookmarked: result.bookmarked,
        message: result.bookmarked ? "Speaker bookmarked" : "Bookmark removed"
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  // Check if speaker is bookmarked
  app.get("/api/users/:userId/bookmarks/check/:speakerId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const speakerId = parseInt(req.params.speakerId);
      
      const isBookmarked = await storage.isUserBookmarked(userId, speakerId);
      
      res.json({ bookmarked: isBookmarked });
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      res.status(500).json({ message: "Failed to check bookmark status" });
    }
  });

  // Get all user bookmarks (returns speaker IDs only for frontend compatibility)
  app.get("/api/users/:userId/bookmarks", async (req, res) => {
    try {
      const userId = req.params.userId;
      
      const bookmarkIds = await storage.getUserBookmarkIds(userId);
      
      res.json(bookmarkIds);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Get user activity stats
  app.get("/api/users/stats/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      
      // Get favorites count
      const bookmarkIds = await storage.getUserBookmarkIds(userId);
      const favoritesCount = bookmarkIds.length;
      
      // Get reviews count
      const userReviews = await storage.getUserReviews(userId);
      const reviewsCount = userReviews.length;
      
      // Get inquiries count
      const user = await storage.getUserById(userId);
      let inquiriesCount = 0;
      if (user?.email) {
        const userInquiries = await storage.getUserInquiries(user.email);
        inquiriesCount = userInquiries.length;
      }
      
      // Profile views (would need analytics tracking - return 0 for now)
      const totalProfileViews = 0;
      
      res.json({
        favoritesCount,
        reviewsCount,
        inquiriesCount,
        totalProfileViews
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // ===== STRIPE SUBSCRIPTION ENDPOINTS =====

  // Stripe subscription endpoints
  // Stripe Price IDs from Stripe Dashboard
  const STRIPE_PRICE_IDS: Record<string, Record<string, string>> = {
    pro: {
      monthly: 'price_1SQWeD2KfWIY1BOyGKNeaLLF',
      annual: 'price_1SRwRA2KfWIY1BOyCgczlidp'
    },
    premier: {
      monthly: 'price_1SRwQh2KfWIY1BOydMaxI2Tm',
      annual: 'price_1SRwRe2KfWIY1BOySdq1lQON'
    }
  };

  // Create subscription checkout session
  app.post("/api/subscriptions/create-checkout", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Must be logged in" });
      }

      // Get speaker by user ID
      const speaker = await storage.getSpeakerByUserId(userId);
      if (!speaker) {
        return res.status(404).json({ error: "Speaker profile not found. Please create a speaker profile first." });
      }

      const { tier, interval } = req.body; // tier: "pro" | "premier", interval: "monthly" | "annual"
      
      if (!tier || !interval) {
        return res.status(400).json({ error: "Tier and interval are required" });
      }

      if (!['pro', 'premier'].includes(tier) || !['monthly', 'annual'].includes(interval)) {
        return res.status(400).json({ error: "Invalid tier or interval" });
      }

      // Create or get Stripe customer
      let customerId = speaker.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: speaker.email,
          name: speaker.name,
          metadata: {
            speakerId: speaker.id.toString()
          }
        });
        customerId = customer.id;
        
        // Update speaker with customer ID
        await storage.updateSpeaker(speaker.id, { stripeCustomerId: customerId });
      }

      // Get the correct Stripe Price ID
      const priceId = STRIPE_PRICE_IDS[tier as 'pro' | 'premier'][interval as 'monthly' | 'annual'];

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        metadata: {
          speakerId: speaker.id.toString(),
          tier: tier,
          interval: interval
        },
        success_url: `${req.protocol}://${req.get('host')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/subscription/upgrade`
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message || 'Failed to create checkout session' });
    }
  });

  // Validate Stripe checkout session and return metadata for analytics
  app.get("/api/subscriptions/session/:sessionId", async (req: AuthenticatedRequest, res) => {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      // Retrieve session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Extract metadata
      const metadata = session.metadata || {};
      const tier = metadata.tier;
      const interval = metadata.interval;
      const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents to dollars

      res.json({
        tier,
        interval,
        price: amount,
        status: session.payment_status
      });
    } catch (error: any) {
      console.error('Error retrieving session:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve session' });
    }
  });

  // Get subscription features (public endpoint)
  app.get("/api/subscriptions/features", async (req, res) => {
    try {
      const features = await storage.listSubscriptionFeatures();
      
      // Group features by tier
      const featuresByTier = {
        basic: [] as any[],
        pro: [] as any[],
        premier: [] as any[]
      };
      
      features.forEach(feature => {
        feature.tiers.forEach(tierAssociation => {
          if (featuresByTier[tierAssociation.tier as keyof typeof featuresByTier]) {
            featuresByTier[tierAssociation.tier as keyof typeof featuresByTier].push({
              ...feature,
              sortOrder: tierAssociation.sortOrder,
              isHighlighted: tierAssociation.isHighlighted
            });
          }
        });
      });
      
      // Sort features by sortOrder within each tier
      Object.keys(featuresByTier).forEach(tier => {
        featuresByTier[tier as keyof typeof featuresByTier].sort((a, b) => a.sortOrder - b.sortOrder);
      });
      
      res.json(featuresByTier);
    } catch (error: any) {
      console.error('Error fetching subscription features:', error);
      res.status(500).json({ error: 'Failed to fetch subscription features' });
    }
  });

  // Get all tier limits (public endpoint)
  app.get("/api/tier-limits", async (req, res) => {
    try {
      const limits = await storage.getAllTierLimits();
      res.json(limits);
    } catch (error: any) {
      console.error('Error fetching tier limits:', error);
      res.status(500).json({ error: 'Failed to fetch tier limits' });
    }
  });

  // Get tier limits for specific tier (public endpoint)
  app.get("/api/tier-limits/:tier", async (req, res) => {
    try {
      const tier = req.params.tier;
      
      // Validate tier parameter
      if (!['basic', 'pro', 'premier'].includes(tier)) {
        return res.status(400).json({ error: 'Invalid tier. Must be basic, pro, or premier.' });
      }
      
      const limits = await storage.getTierLimit(tier as 'basic' | 'pro' | 'premier');
      
      if (!limits) {
        return res.status(404).json({ error: `Tier limits not found for ${tier}` });
      }
      
      res.json(limits);
    } catch (error: any) {
      console.error(`Error fetching tier limits for ${req.params.tier}:`, error);
      res.status(500).json({ error: 'Failed to fetch tier limits' });
    }
  });

  // Get subscription status
  app.get("/api/subscriptions/status", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Must be logged in" });
      }

      // Get speaker by user ID
      const speaker = await storage.getSpeakerByUserId(userId);
      if (!speaker) {
        return res.status(404).json({ error: "Speaker profile not found" });
      }

      // If no Stripe subscription ID, check database subscription status
      if (!speaker.stripeSubscriptionId) {
        return res.json({
          tier: speaker.subscriptionTier || 'basic',
          status: speaker.subscriptionStatus || 'none',
          periodEnd: speaker.subscriptionPeriodEnd,
          cancelAtPeriodEnd: false,
          cancelledAt: speaker.cancelledAt
        });
      }

      // Get subscription from Stripe
      try {
        const subscription = await stripe.subscriptions.retrieve(speaker.stripeSubscriptionId);
        const subscriptionItem = subscription.items.data[0];
        
        return res.json({
          tier: speaker.subscriptionTier,
          status: subscription.status,
          periodEnd: subscriptionItem?.current_period_end ? new Date(subscriptionItem.current_period_end * 1000) : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          cancelledAt: speaker.cancelledAt,
          amount: subscriptionItem?.price.unit_amount || 0,
          interval: subscriptionItem?.price.recurring?.interval || 'month'
        });
      } catch (stripeError: any) {
        if (stripeError?.code === 'resource_missing') {
          console.warn(`⚠️ Stripe subscription ${speaker.stripeSubscriptionId} not found for speaker ${speaker.id} (${speaker.name}) - downgrading to basic`);
          await storage.updateSpeaker(speaker.id, {
            subscriptionTier: 'basic',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
            subscriptionPeriodEnd: null
          });
          return res.json({
            tier: 'basic',
            status: 'canceled',
            periodEnd: null,
            cancelAtPeriodEnd: false,
            cancelledAt: null
          });
        }
        throw stripeError;
      }
    } catch (error: any) {
      console.error('Error getting subscription status:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  // Cancel subscription with reason
  app.post("/api/subscriptions/cancel", async (req: AuthenticatedRequest, res) => {
    try {
      // Validate cancellation feedback (structured data)
      const cancellationSchema = z.object({
        primaryReason: z.enum([
          'too_expensive',
          'not_using_enough',
          'missing_features',
          'found_alternative',
          'technical_issues',
          'other'
        ], { required_error: "Please select a reason for canceling" }),
        wouldRecommend: z.enum(['yes', 'no', 'maybe']).optional(),
        missingFeatures: z.string().max(200).optional(),
        additionalFeedback: z.string().max(500).optional()
      });
      
      const validation = cancellationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid cancellation feedback", 
          details: validation.error.errors 
        });
      }
      
      const cancellationData = validation.data;
      // Store as JSON string in the reason field
      const reason = JSON.stringify(cancellationData);
      
      const userId = await resolveUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Must be logged in" });
      }

      // Get speaker by user ID
      const speaker = await storage.getSpeakerByUserId(userId);
      if (!speaker) {
        return res.status(404).json({ error: "Speaker profile not found" });
      }
      
      // Check if speaker has an active premium subscription
      if (speaker.subscriptionTier === 'basic') {
        return res.status(400).json({ error: "No active subscription to cancel" });
      }

      let periodEnd: Date | null = null;
      let hasStripeSubscription = false;
      let subscriptionId = speaker.stripeSubscriptionId;

      // RECONCILIATION: If subscription ID is missing but customer ID exists, try to find it in Stripe
      if (!subscriptionId && speaker.stripeCustomerId) {
        console.warn(`⚠️ Speaker ${speaker.id} has Stripe customer but missing subscription ID - attempting reconciliation`);
        
        try {
          // Get ALL non-canceled subscriptions (active, trialing, past_due, etc.)
          const subscriptions = await stripe.subscriptions.list({
            customer: speaker.stripeCustomerId,
            limit: 10
          });

          // Filter out only canceled/incomplete subscriptions
          const validSubscriptions = subscriptions.data.filter(sub => 
            sub.status !== 'canceled' && sub.status !== 'incomplete' && sub.status !== 'incomplete_expired'
          );

          if (validSubscriptions.length > 0) {
            // Found subscription(s) - use the first one
            const foundSubscription = validSubscriptions[0];
            subscriptionId = foundSubscription.id;
            
            // Determine tier from price
            const priceId = foundSubscription.items.data[0]?.price.id;
            let tier: 'pro' | 'premier' | undefined;
            if (priceId === STRIPE_PRICE_IDS.pro.monthly || priceId === STRIPE_PRICE_IDS.pro.annual) {
              tier = 'pro';
            } else if (priceId === STRIPE_PRICE_IDS.premier.monthly || priceId === STRIPE_PRICE_IDS.premier.annual) {
              tier = 'premier';
            }
            
            // Save the subscription ID to database
            await storage.updateSpeaker(speaker.id, {
              stripeSubscriptionId: subscriptionId,
              subscriptionTier: tier || speaker.subscriptionTier,
              subscriptionStatus: foundSubscription.status
            });
            
            console.log(`✅ Reconciled: saved subscription ${subscriptionId} (status: ${foundSubscription.status}) for speaker ${speaker.id}`);
          } else {
            // No valid Stripe subscription found - cannot proceed with cancellation
            console.error(`❌ CRITICAL: Speaker ${speaker.id} has no valid Stripe subscription but has tier ${speaker.subscriptionTier}`);
            return res.status(409).json({ 
              error: "Subscription mismatch detected. Please contact support to resolve your subscription status." 
            });
          }
        } catch (error: any) {
          console.error(`❌ Failed to reconcile subscription for speaker ${speaker.id}:`, error.message);
          return res.status(502).json({ 
            error: "Unable to verify subscription with payment provider. Please try again or contact support." 
          });
        }
      }

      // If speaker has Stripe subscription, cancel it via Stripe
      if (subscriptionId) {
        try {
          const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
          });

          const subscriptionItem = subscription.items.data[0];
          periodEnd = subscriptionItem?.current_period_end 
            ? new Date(subscriptionItem.current_period_end * 1000) 
            : null;
          hasStripeSubscription = true;
          
          console.log(`✅ Stripe subscription ${subscriptionId} set to cancel at period end`);
        } catch (error: any) {
          console.error('Error canceling Stripe subscription:', error);
          return res.status(502).json({ 
            error: "Failed to cancel subscription with payment provider. Please try again or contact support." 
          });
        }
      }
      
      // Store cancellation reason and timestamp
      await storage.updateSpeakerCancellation(speaker.id, {
        reason: reason,
        cancelledAt: new Date(),
        periodEnd: periodEnd || speaker.subscriptionPeriodEnd || undefined,
        // Only mark as canceled immediately for non-Stripe subscriptions
        // Stripe subscriptions stay 'active' until period end
        status: hasStripeSubscription ? undefined : 'canceled'
      });

      res.json({ 
        success: true, 
        message: "Subscription will be canceled at the end of the current billing period",
        periodEnd
      });
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  // Reactivate cancelled subscription
  app.post("/api/subscriptions/reactivate", async (req: AuthenticatedRequest, res) => {
    try {
      // Get user from X-User-ID header or session
      const userId = await resolveUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Must be logged in" });
      }

      // Get speaker by user ID
      const speaker = await storage.getSpeakerByUserId(userId);
      if (!speaker) {
        return res.status(404).json({ error: "Speaker profile not found" });
      }

      // Check if subscription was cancelled
      if (!speaker.cancelledAt) {
        return res.status(400).json({ error: "Subscription is not cancelled" });
      }

      // If speaker has Stripe subscription, reactivate it via Stripe
      if (speaker.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.update(speaker.stripeSubscriptionId, {
            cancel_at_period_end: false
          });

          const subscriptionItem = subscription.items.data[0];
          const periodEnd = subscriptionItem?.current_period_end 
            ? new Date(subscriptionItem.current_period_end * 1000) 
            : null;
          
          console.log(`✅ Stripe subscription ${speaker.stripeSubscriptionId} reactivated`);
          
          // Clear cancellation data
          await storage.updateSpeaker(speaker.id, {
            cancelledAt: null,
            cancellationReason: null,
            subscriptionStatus: 'active',
            subscriptionPeriodEnd: periodEnd
          });

          res.json({ 
            success: true, 
            message: "Subscription reactivated successfully"
          });
        } catch (error: any) {
          console.error('Error reactivating Stripe subscription:', error);
          return res.status(502).json({ 
            error: "Failed to reactivate subscription with payment provider. Please try again or contact support." 
          });
        }
      } else {
        // For non-Stripe subscriptions, just clear the cancellation
        await storage.updateSpeaker(speaker.id, {
          cancelledAt: null,
          cancellationReason: null,
          subscriptionStatus: 'active'
        });

        res.json({ 
          success: true, 
          message: "Subscription reactivated successfully"
        });
      }
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      res.status(500).json({ error: 'Failed to reactivate subscription' });
    }
  });

  // Create billing portal session
  app.post("/api/subscriptions/billing-portal", async (req: AuthenticatedRequest, res) => {
    try {
      // Get user from X-User-ID header or session
      const userIdHeader = req.headers['x-user-id'] as string;
      let userId: string | undefined;
      
      if (userIdHeader) {
        userId = userIdHeader;
      } else if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Must be logged in" });
      }

      // Get speaker by user ID
      const speaker = await storage.getSpeakerByUserId(userId);
      if (!speaker || !speaker.stripeCustomerId) {
        return res.status(404).json({ error: "No billing account found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: speaker.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/profile`
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      res.status(500).json({ error: 'Failed to create billing portal session' });
    }
  });

  // Stripe webhook handler
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('No signature');
    }

    let event: Stripe.Event;

    try {
      // In production, you would verify the webhook signature
      // For now, we'll just parse the event
      event = req.body;
      
      console.log('Stripe webhook event:', event.type);

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Get subscription ID from the session
          const subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription?.id;
          
          if (!subscriptionId) {
            console.log('No subscription found in checkout session');
            break;
          }
          
          // Get speaker info from session metadata (guaranteed to be present)
          const speakerId = parseInt(session.metadata?.speakerId || '0');
          const tier = session.metadata?.tier as 'pro' | 'premier';
          
          if (!speakerId || !tier) {
            console.warn(`Missing metadata in checkout session ${session.id}: speakerId=${speakerId}, tier=${tier}`);
            break;
          }
          
          // Fetch full subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subscriptionItem = subscription.items.data[0];
          const periodEnd = subscriptionItem?.current_period_end 
            ? new Date(subscriptionItem.current_period_end * 1000) 
            : null;
          
          // Save subscription ID and tier immediately
          await storage.updateSpeaker(speakerId, {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionTier: tier,
            subscriptionPeriodEnd: periodEnd
          });
          
          console.log(`✅ Checkout completed: speaker ${speakerId} subscribed to ${tier} tier (subscription: ${subscription.id})`);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          let speakerId = parseInt(subscription.metadata.speakerId || '0');
          let tier = subscription.metadata.tier as 'pro' | 'premier' | undefined;
          
          // If no metadata, lookup speaker by customer ID
          if (!speakerId && subscription.customer) {
            const customerId = typeof subscription.customer === 'string' 
              ? subscription.customer 
              : subscription.customer.id;
            const speakers = await storage.getSpeakers();
            const speaker = speakers.find(s => s.stripeCustomerId === customerId);
            if (speaker) {
              speakerId = speaker.id;
              console.log(`Resolved speaker ${speakerId} by customer ID ${customerId}`);
            } else {
              console.warn(`⚠️ Could not find speaker for customer ${customerId} (subscription ${subscription.id})`);
              break;
            }
          }
          
          // Determine tier from subscription price if not in metadata
          if (!tier) {
            const priceId = subscription.items.data[0]?.price.id;
            if (priceId === STRIPE_PRICE_IDS.pro.monthly || priceId === STRIPE_PRICE_IDS.pro.annual) {
              tier = 'pro';
            } else if (priceId === STRIPE_PRICE_IDS.premier.monthly || priceId === STRIPE_PRICE_IDS.premier.annual) {
              tier = 'premier';
            }
            
            if (!tier) {
              console.warn(`⚠️ Could not determine tier for subscription ${subscription.id} (price: ${priceId})`);
            }
          }
          
          if (speakerId) {
            const subscriptionItem = subscription.items.data[0];
            const periodEnd = subscriptionItem?.current_period_end 
              ? new Date(subscriptionItem.current_period_end * 1000) 
              : null;
            
            // Always save subscription ID, even if tier couldn't be determined
            const updateData: any = {
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionPeriodEnd: periodEnd
            };
            
            // Only update tier if we successfully determined it
            if (tier) {
              updateData.subscriptionTier = tier;
            }
            
            await storage.updateSpeaker(speakerId, updateData);
            
            console.log(`✅ Subscription ${event.type}: speaker ${speakerId} → ${tier || 'tier unknown'} (${subscription.status}, ID: ${subscription.id})`);
          } else {
            console.error(`❌ CRITICAL: Could not find speaker for subscription ${subscription.id} - subscription ID not saved!`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          let speakerId = parseInt(subscription.metadata.speakerId || '0');
          
          // If no metadata, lookup by customer ID
          if (!speakerId && subscription.customer) {
            const customerId = typeof subscription.customer === 'string' 
              ? subscription.customer 
              : subscription.customer.id;
            const speakers = await storage.getSpeakers();
            const speaker = speakers.find(s => s.stripeCustomerId === customerId);
            if (speaker) {
              speakerId = speaker.id;
            }
          }
          
          if (speakerId) {
            // Downgrade to basic tier
            await storage.updateSpeaker(speakerId, {
              subscriptionTier: 'basic',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
              subscriptionPeriodEnd: null
            });
            
            console.log(`Canceled subscription for speaker ${speakerId}`);
          } else {
            console.log(`Could not find speaker for deleted subscription ${subscription.id}`);
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = (invoice as any).subscription;
          
          if (subscriptionId && typeof subscriptionId === 'string') {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            let speakerId = parseInt(subscription.metadata.speakerId || '0');
            
            // If no metadata, lookup by customer ID
            if (!speakerId && subscription.customer) {
              const customerId = typeof subscription.customer === 'string' 
                ? subscription.customer 
                : subscription.customer.id;
              const speakers = await storage.getSpeakers();
              const speaker = speakers.find(s => s.stripeCustomerId === customerId);
              if (speaker) {
                speakerId = speaker.id;
              }
            }
            
            if (speakerId) {
              const subscriptionItem = subscription.items.data[0];
              const periodEnd = subscriptionItem?.current_period_end 
                ? new Date(subscriptionItem.current_period_end * 1000) 
                : null;
              
              await storage.updateSpeaker(speakerId, {
                subscriptionStatus: 'active',
                subscriptionPeriodEnd: periodEnd
              });
              
              console.log(`Payment succeeded for speaker ${speakerId}`);
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = (invoice as any).subscription;
          
          if (subscriptionId && typeof subscriptionId === 'string') {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            let speakerId = parseInt(subscription.metadata.speakerId || '0');
            
            // If no metadata, lookup by customer ID
            if (!speakerId && subscription.customer) {
              const customerId = typeof subscription.customer === 'string' 
                ? subscription.customer 
                : subscription.customer.id;
              const speakers = await storage.getSpeakers();
              const speaker = speakers.find(s => s.stripeCustomerId === customerId);
              if (speaker) {
                speakerId = speaker.id;
              }
            }
            
            if (speakerId) {
              await storage.updateSpeaker(speakerId, {
                subscriptionStatus: 'past_due'
              });
              
              console.log(`Payment failed for speaker ${speakerId}`);
            }
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Register sitemap and robots.txt routes  
  const sitemapModule = await import("./routes/sitemap");
  app.use("/", sitemapModule.createSitemapRouter(storage));

  return app;
}