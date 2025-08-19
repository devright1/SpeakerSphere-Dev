import type { Express, Request } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { zfd } from "zod-form-data";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertSpeakerApplicationSchema } from "../shared/schema";
import { registerAdminRoutes } from "./admin-routes";
import multer from "multer";

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

  // Get current user
  app.get("/api/auth/me", (req, res) => {
    const user = (req as any).session?.user;
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
      const category = req.query.category as string;
      const location = req.query.location as string;
      const sort = req.query.sort as string || 'name';
      
      const speakers = await storage.getSpeakers({
        page,
        limit,
        search,
        category,
        location,
        sort
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
      const inquiry = await storage.createInquiry(req.body);
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
      const reviews = await storage.getReviewsBySpeaker(speakerId);
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

  // Search speakers with advanced filters
  app.get("/api/search", async (req, res) => {
    try {
      const {
        q: query,
        category,
        location,
        minRating,
        maxPrice,
        availability,
        experience,
        page = 1,
        limit = 20
      } = req.query;

      const results = await storage.searchSpeakers({
        query: query as string,
        category: category as string,
        location: location as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        availability: availability as string,
        experience: experience as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
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

      const inquiries = await storage.getInquiriesBySpeaker(user.speakerId);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching speaker inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Update inquiry status
  app.patch("/api/inquiries/:id/status", async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const { status } = req.body;
      
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Verify inquiry belongs to the speaker
      const inquiry = await storage.getInquiry(inquiryId);
      if (!inquiry || (user.speakerId && inquiry.speakerId !== user.speakerId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedInquiry = await storage.updateInquiryStatus(inquiryId, status);
      res.json({
        success: true,
        message: "Inquiry status updated",
        inquiry: updatedInquiry
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
  
  return app;
}