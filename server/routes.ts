import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "./storage";
import { insertReviewSchema, insertInquirySchema, insertUserSchema } from "@shared/schema";
import { AnalyticsService } from "./analytics";
import { registerAdminRoutes } from "./admin-routes";
import { z } from "zod";

// Analytics tracking middleware
const trackEvent = async (req: any, res: any, next: any) => {
  req.trackAnalytics = (speakerId: number, eventType: string, metadata?: any) => {
    // Don't wait for analytics to complete
    AnalyticsService.trackClick(
      speakerId,
      eventType,
      metadata,
      req.get('User-Agent'),
      req.ip,
      req.get('Referer'),
      req.sessionID,
      req.user?.id?.toString()
    ).catch(error => console.error('Analytics tracking error:', error));
  };
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Register admin routes for domain synchronization
  registerAdminRoutes(app);
  
  // Add analytics tracking middleware
  app.use(trackEvent);
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Authentication middleware
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    try {
      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: "Invalid token" });
    }
  };

  // User authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user  
      const { password, ...userDataWithoutPassword } = userData;
      const user = await storage.createUser({
        ...userDataWithoutPassword,
        passwordHash
      });

      // Create session token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      await storage.createUserSession({
        userId: user.id,
        token,
        expiresAt
      });

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      res.status(201).json({
        user: userResponse,
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Create session token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      await storage.createUserSession({
        userId: user.id,
        token,
        expiresAt
      });

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      res.json({
        user: userResponse,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: any, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        await storage.deleteUserSession(token);
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const { passwordHash: _, ...userResponse } = req.user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // User interaction routes
  app.post("/api/users/likes/:speakerId", authenticateToken, async (req: any, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const like = await storage.createUserLike({
        userId: req.user.id,
        speakerId
      });
      res.status(201).json(like);
    } catch (error) {
      res.status(500).json({ message: "Failed to like speaker" });
    }
  });

  app.delete("/api/users/likes/:speakerId", authenticateToken, async (req: any, res) => {
    try {
      const speakerId = parseInt(req.params.speakerId);
      const success = await storage.deleteUserLike(req.user.id, speakerId);
      if (success) {
        res.json({ message: "Like removed" });
      } else {
        res.status(404).json({ message: "Like not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to remove like" });
    }
  });

  app.get("/api/users/likes", authenticateToken, async (req: any, res) => {
    try {
      const likes = await storage.getUserLikes(req.user.id);
      res.json(likes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user likes" });
    }
  });

  // Get user stats for profile page
  app.get("/api/users/stats/:userId", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      
      // Ensure user can only access their own stats
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get user's favorites count
      const favorites = await storage.getUserBookmarks(userId);
      const favoritesCount = favorites.length;

      // Get user's reviews count  
      const reviews = await storage.getUserReviews(userId);
      const reviewsCount = reviews.length;

      // Get user's inquiries count
      const inquiries = await storage.getUserInquiries(userId);
      const inquiriesCount = inquiries.length;

      // Calculate total profile views (sum of views on speakers they've interacted with)
      const totalProfileViews = 0; // Will implement analytics later

      res.json({
        favoritesCount,
        reviewsCount,
        inquiriesCount,
        totalProfileViews
      });
    } catch (error) {
      console.error("Failed to get user stats:", error);
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  // Get user's favorite/bookmarked speakers
  app.get("/api/users/favorites/:userId", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const bookmarks = await storage.getUserBookmarks(userId);
      
      // Get full speaker details for each bookmark
      const favorites = [];
      for (const bookmark of bookmarks) {
        const speaker = await storage.getSpeaker(bookmark.speakerId);
        if (speaker) {
          favorites.push({
            ...speaker,
            bookmarkId: bookmark.id,
            notes: bookmark.notes,
            bookmarkedAt: bookmark.createdAt
          });
        }
      }

      res.json(favorites);
    } catch (error) {
      console.error("Failed to get user favorites:", error);
      res.status(500).json({ message: "Failed to get user favorites" });
    }
  });

  // Get user's reviews
  app.get("/api/users/reviews/:userId", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Failed to get user reviews:", error);
      res.status(500).json({ message: "Failed to get user reviews" });
    }
  });

  // Admin user management endpoints
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password hashes from response
      const safeUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Failed to get users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const updates = req.body;
      
      // Don't allow updating password hash directly
      delete updates.passwordHash;
      delete updates.id;
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password hash from response
      const { passwordHash, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { adminPassword } = req.body;
      
      // Verify admin password
      if (adminPassword !== "Doneright123!") {
        return res.status(401).json({ message: "Invalid admin password" });
      }

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "User deleted successfully", 
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/user-stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        verifiedUsers: users.filter(u => u.emailVerified).length,
        recentRegistrations: users.filter(u => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(u.createdAt) > weekAgo;
        }).length
      };

      res.json(stats);
    } catch (error) {
      console.error("Failed to get user stats:", error);
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  app.patch("/api/admin/users/bulk-update", async (req, res) => {
    try {
      const { userIds, updates, adminPassword } = req.body;
      
      // Verify admin password
      if (adminPassword !== "Doneright123!") {
        return res.status(401).json({ message: "Invalid admin password" });
      }

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "No user IDs provided" });
      }

      let updatedCount = 0;
      for (const userId of userIds) {
        const updatedUser = await storage.updateUser(userId, updates);
        if (updatedUser) {
          updatedCount++;
        }
      }

      res.json({ 
        message: "Bulk update completed", 
        updatedCount,
        totalRequested: userIds.length
      });
    } catch (error) {
      console.error("Failed to bulk update users:", error);
      res.status(500).json({ message: "Failed to bulk update users" });
    }
  });

  // Get all speakers with optional filters
  app.get("/api/speakers", async (req, res) => {
    try {
      const {
        category,
        location,
        minRating,
        expertise,
        search
      } = req.query;

      const filters = {
        category: category as string,
        location: location as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        expertise: expertise as string,
        search: search as string,
      };

      const speakers = await storage.getSpeakers(filters);
      res.json(speakers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch speakers" });
    }
  });

  // Get featured speakers
  app.get("/api/speakers/featured", async (req, res) => {
    try {
      const speakers = await storage.getFeaturedSpeakers();
      res.json(speakers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured speakers" });
    }
  });

  // Get single speaker by ID or slug
  app.get("/api/speakers/:identifier", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      let speaker;

      // Try to parse as ID first, then fall back to slug
      const id = parseInt(identifier);
      if (!isNaN(id)) {
        speaker = await storage.getSpeaker(id);
      } else {
        speaker = await storage.getSpeakerBySlug(identifier);
      }

      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      // Track profile view analytics
      await AnalyticsService.trackClick(
        speaker.id,
        'profile_view',
        { identifier },
        req.get('User-Agent'),
        req.ip,
        req.get('Referer'),
        req.sessionID,
        req.user?.id?.toString()
      );

      res.json(speaker);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch speaker" });
    }
  });

  // Get reviews for a speaker
  app.get("/api/speakers/:identifier/reviews", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      let speaker;

      // Try to parse as ID first, then fall back to slug
      const id = parseInt(identifier);
      if (!isNaN(id)) {
        speaker = await storage.getSpeaker(id);
      } else {
        speaker = await storage.getSpeakerBySlug(identifier);
      }

      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      const reviews = await storage.getReviewsBySpeakerId(speaker.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Create a new review
  app.post("/api/speakers/:id/reviews", upload.single('photo'), async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      if (isNaN(speakerId)) {
        return res.status(400).json({ message: "Invalid speaker ID" });
      }

      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      // Check if photo was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "Photo from audience is required" });
      }

      // Convert rating to number
      const rating = parseInt(req.body.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const reviewData = insertReviewSchema.parse({
        ...req.body,
        rating,
        speakerId,
        // For now, we'll store a placeholder for the photo
        // In a real app, you'd upload to cloud storage and store the URL
        photoUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Create an inquiry
  app.post("/api/speakers/:id/inquiries", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      if (isNaN(speakerId)) {
        return res.status(400).json({ message: "Invalid speaker ID" });
      }

      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      const inquiryData = insertInquirySchema.parse({
        ...req.body,
        speakerId
      });

      const inquiry = await storage.createInquiry(inquiryData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Update speaker (admin only)
  app.patch("/api/speakers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid speaker ID" });
      }

      const updatedSpeaker = await storage.updateSpeaker(id, updates);
      if (!updatedSpeaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      res.json(updatedSpeaker);
    } catch (error) {
      console.error("Failed to update speaker:", error);
      res.status(500).json({ message: "Failed to update speaker" });
    }
  });

  // Delete speaker (admin only - with password verification)
  app.delete("/api/speakers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adminPassword } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid speaker ID" });
      }

      // Verify admin password (using the same credentials as login)
      if (adminPassword !== "Doneright123!") {
        return res.status(401).json({ message: "Invalid admin password" });
      }

      const deleted = await storage.deleteSpeaker(id);
      if (!deleted) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      res.json({ 
        message: "Speaker deleted successfully", 
        deletedAt: new Date().toISOString(),
        retentionDays: 14 
      });
    } catch (error) {
      console.error("Failed to delete speaker:", error);
      res.status(500).json({ message: "Failed to delete speaker" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Add new category (admin only)
  app.post("/api/categories", async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name || !description) {
        return res.status(400).json({ message: "Name and description are required" });
      }

      const category = await storage.createCategory({ name, description });
      res.json(category);
    } catch (error) {
      console.error("Failed to create category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Delete category (admin only)
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Failed to delete category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Search endpoint for autocomplete/suggestions
  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.json([]);
      }

      const speakers = await storage.getSpeakers();
      const suggestions = new Set<string>();

      speakers.forEach(speaker => {
        // Add matching expertise
        speaker.expertise.forEach(exp => {
          if (exp.toLowerCase().includes(q.toLowerCase())) {
            suggestions.add(exp);
          }
        });

        // Add matching lectures
        speaker.lectures.forEach(lecture => {
          if (lecture.toLowerCase().includes(q.toLowerCase())) {
            suggestions.add(lecture);
          }
        });

        // Add speaker names if they match
        if (speaker.name.toLowerCase().includes(q.toLowerCase())) {
          suggestions.add(speaker.name);
        }
      });

      res.json(Array.from(suggestions).slice(0, 10));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Analytics endpoints
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { speakerId, eventType, metadata } = req.body;
      
      if (!speakerId || !eventType) {
        return res.status(400).json({ message: "Speaker ID and event type are required" });
      }

      // Get request metadata
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;
      const referrer = req.get('Referer');
      const sessionId = req.session?.id;

      await AnalyticsService.trackClick(
        speakerId, 
        eventType, 
        metadata,
        userAgent,
        ipAddress,
        referrer,
        sessionId
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to track analytics:", error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  app.get("/api/analytics/speaker/:id", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      if (isNaN(speakerId)) {
        return res.status(400).json({ message: "Invalid speaker ID" });
      }

      const analytics = await AnalyticsService.getSpeakerAnalytics(speakerId);
      const performanceScore = await AnalyticsService.calculatePerformanceScore(speakerId);
      const demandForecast = await AnalyticsService.getDemandForecast(speakerId);
      const trends = await AnalyticsService.getAnalyticsTrends(speakerId, 30);

      res.json({
        analytics,
        performanceScore,
        demandForecast,
        trends,
      });
    } catch (error) {
      console.error("Failed to get speaker analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const dashboardData = await AnalyticsService.getDashboardData();
      res.json(dashboardData);
    } catch (error) {
      console.error("Failed to get dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/analytics/top-performers", async (req, res) => {
    try {
      const { limit = 10, metric = 'profileViews' } = req.query;
      const topPerformers = await AnalyticsService.getTopPerformers(
        parseInt(limit as string), 
        metric as string
      );
      res.json(topPerformers);
    } catch (error) {
      console.error("Failed to get top performers:", error);
      res.status(500).json({ message: "Failed to fetch top performers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
