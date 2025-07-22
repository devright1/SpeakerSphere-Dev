import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertReviewSchema, insertInquirySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
