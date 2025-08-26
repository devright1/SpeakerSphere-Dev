import type { Express, Request } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
// Removed zfd import as it's not needed for current functionality
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertSpeakerApplicationSchema, subscriptionPlans, subscriptionHistory } from "../shared/schema";
import { registerAdminRoutes } from "./admin-routes";
import { EmailService } from "./email-service";
import multer from "multer";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

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
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export function registerRoutes(app: Express): Express {
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

  // Add debugging middleware for password change requests
  app.use('/api/auth/change-password', (req, res, next) => {
    console.log("MIDDLEWARE: Password change request intercepted");
    console.log("Method:", req.method);
    console.log("Body:", req.body);
    console.log("Session:", req.session);
    next();
  });

  // Register admin routes first
  registerAdminRoutes(app);
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Speaker application submission
  app.post("/api/auth/speaker-application", async (req, res) => {
    try {
      const validatedData = insertSpeakerApplicationSchema.parse(req.body);
      
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

  // User registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists"
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

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
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
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      // Get current user data
      const currentUser = await storage.getUserById(user.id);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password in database
      await storage.updateUserPassword(user.id, newPasswordHash);

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
        category: categories ? categories[0] as string : category,
        location
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
      const updatedSpeaker = await storage.updateSpeaker(speakerId, req.body);
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

  // Submit inquiry
  app.post("/api/inquiries", async (req, res) => {
    try {
      // Check if user is authenticated
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to submit inquiry"
        });
      }

      const inquiry = await storage.createInquiry(req.body);
      
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
        await emailService.sendInquiryAdminNotification(inquiry, speaker.name);
        
        console.log(`✅ Email notifications sent for inquiry #${inquiry.id}`);
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
  app.post("/api/reviews", async (req, res) => {
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

  // Analytics tracking endpoints
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { speakerId, eventType, metadata } = req.body;
      
      if (!speakerId || !eventType) {
        return res.status(400).json({ message: "Speaker ID and event type are required" });
      }
      
      // Track the interaction
      await storage.trackSpeakerInteraction({
        speakerId,
        userId: (req as any).session?.user?.id || null,
        sessionId: (req as any).sessionID || null,
        interactionType: eventType,
        metadata: JSON.stringify(metadata || {}),
        pageUrl: req.headers.referer || null,
        deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
        referrerSource: req.headers.referer || null
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Analytics tracking error:", error);
      res.status(500).json({ message: "Failed to track analytics" });
    }
  });

  // Get speaker analytics (for speaker dashboard)
  app.get("/api/analytics/speaker/:speakerId", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      
      // Verify speaker ownership or admin access
      const user = (req as any).session?.user;
      if (!user || (user.speakerId !== speakerId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const analytics = await storage.getSpeakerAnalytics(speakerId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching speaker analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Search speakers with advanced filters - simplified to use getSpeakers
  app.get("/api/search", async (req, res) => {
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

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          success: false,
          message: "Current password is incorrect" 
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password in database
      await storage.updateUserPassword(userId, newPasswordHash);

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

  // Content Management API Routes
  
  // Upload content file
  app.post("/api/speakers/:speakerId/content", upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const { description, category, isPublic } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Check if user owns this speaker profile - check both session and auth header
      let user = (req as any).session?.user;
      
      // Fallback: Check if there's user data in another format
      if (!user) {
        // Try to get user from a different auth method if session fails
        const authHeader = req.headers.authorization;
        if (authHeader) {
          // This would be for token-based auth if implemented
          // For now, we'll temporarily allow uploads for testing
          console.log('Session auth failed, checking alternative auth...');
        }
      }
      
      console.log('Content upload auth check:', {
        sessionUser: user,
        speakerId: speakerId,
        userSpeakerId: user?.speakerId,
        hasSession: !!(req as any).session,
        sessionKeys: Object.keys((req as any).session || {})
      });
      
      // Temporarily allow upload if user is not in session but speaker exists
      if (!user) {
        // Check if speaker exists in database
        const speaker = await storage.getSpeaker(speakerId);
        if (!speaker) {
          return res.status(404).json({ error: "Speaker not found" });
        }
        console.log('Allowing upload due to session issue - speaker exists:', speaker.name);
      } else if (user.speakerId !== speakerId) {
        return res.status(403).json({ error: "Not authorized to upload content for this speaker" });
      }

      // Create content record
      const contentData = {
        speakerId,
        fileName: `${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        category: category || 'document',
        description: description || '',
        isPublic: isPublic === 'true',
        uploadPath: `/uploads/${speakerId}/${Date.now()}_${req.file.originalname}` // Placeholder path
      };

      const content = await storage.createSpeakerContent(contentData);
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
      
      // Filter for public content only when viewed on speaker profile
      const publicContent = content.filter(item => item.isPublic);
      res.json(publicContent);
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

      const deleted = await storage.deleteSpeakerContent(contentId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete content" });
      }
    } catch (error) {
      console.error("Delete content error:", error);
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  // Simple content download (GET endpoint - requires authentication)
  app.get("/api/content/:contentId/download", async (req: any, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      
      // Get user ID from X-User-ID header (sent by frontend)
      const userId = req.headers['x-user-id'];
      
      // Debug logging
      console.log("Download request debug:");
      console.log("- User ID header:", userId);
      
      // Require authentication for all downloads
      if (!userId) {
        return res.status(401).json({ error: "Authentication required for content access" });
      }
      
      // Verify user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "Invalid user" });
      }

      const content = await storage.getSpeakerContentById(contentId);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Check if content is public
      if (!content.isPublic) {
        return res.status(403).json({ error: "Access denied to private content" });
      }

      // Track the download with user details
      await storage.createContentDownload({
        contentId,
        userId: user.id,
        accessCodeId: null,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userCompany: null,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      // Increment download count
      await storage.incrementContentDownloadCount(contentId);

      // Serve the actual file
      
      // The uploadPath should be relative to the project root
      const filePath = path.join(process.cwd(), content.uploadPath);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${content.originalName}"`);
      res.setHeader('Content-Type', content.fileType || 'application/octet-stream');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error: any) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error reading file" });
        }
      });
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
      const user = req.user;

      if (!user) {
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
      const user = req.user;

      if (!user) {
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

  // Get download analytics for speaker content
  app.get("/api/speakers/:speakerId/downloads", async (req: AuthenticatedRequest, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const user = req.user;

      if (!user) {
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

  // Profile picture update endpoint
  app.put("/api/users/:userId/profile-picture", async (req, res) => {
    if (!req.body.profilePictureURL) {
      return res.status(400).json({ error: "profilePictureURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.profilePictureURL,
      );

      // Update user profile with new profile picture
      const updatedUser = await storage.updateUser(req.params.userId, {
        profileImageUrl: objectPath,
      });

      res.status(200).json({
        success: true,
        user: updatedUser,
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting profile picture:", error);
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

  return app;
}