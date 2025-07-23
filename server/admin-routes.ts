import type { Express } from "express";
import { storage } from "./storage";

// Admin authentication middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const { email, password } = req.body;
  
  // Simple admin authentication - in production, use proper authentication
  if (email === "speakers@devright.com" && password === "Doneright123!") {
    req.adminUser = { email };
    next();
  } else {
    return res.status(401).json({ message: "Unauthorized admin credentials" });
  }
};

export function registerAdminRoutes(app: Express) {
  // Admin authentication
  app.post("/api/admin/auth", authenticateAdmin, (req, res) => {
    res.json({ success: true, message: "Admin authenticated" });
  });

  // Toggle speaker visibility (this is the key feature for domain sync)
  app.post("/api/admin/speakers/:id/toggle-visibility", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      const speaker = await storage.getSpeaker(speakerId);
      
      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      // Toggle the hideProfile flag
      const updatedSpeaker = await storage.updateSpeaker(speakerId, {
        hideProfile: !speaker.hideProfile
      });

      if (!updatedSpeaker) {
        return res.status(500).json({ message: "Failed to update speaker" });
      }

      const status = updatedSpeaker.hideProfile ? "hidden" : "visible";
      res.json({ 
        success: true, 
        message: `Speaker ${status} successfully`,
        speaker: updatedSpeaker 
      });
      
      console.log(`🔄 Speaker ${speaker.name} is now ${status} across all domains`);
    } catch (error) {
      console.error("Failed to toggle speaker visibility:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all speakers including hidden ones (for admin panel)
  app.get("/api/admin/speakers", async (req, res) => {
    try {
      // Get all speakers including hidden ones for admin panel
      const allSpeakers = await storage.getSpeakers({ includeHidden: true });
      res.json(allSpeakers);
    } catch (error) {
      console.error("Failed to fetch all speakers:", error);
      res.status(500).json({ message: "Failed to fetch speakers" });
    }
  });

  // Bulk operations for speakers
  app.post("/api/admin/speakers/bulk-hide", async (req, res) => {
    try {
      const { speakerIds } = req.body;
      
      if (!Array.isArray(speakerIds)) {
        return res.status(400).json({ message: "speakerIds must be an array" });
      }

      const results = [];
      for (const speakerId of speakerIds) {
        try {
          const updatedSpeaker = await storage.updateSpeaker(speakerId, {
            hideProfile: true
          });
          if (updatedSpeaker) {
            results.push({ id: speakerId, status: "hidden" });
          }
        } catch (error) {
          results.push({ id: speakerId, status: "error", error: error.message });
        }
      }

      res.json({ 
        success: true, 
        message: `Bulk hide operation completed`,
        results 
      });
      
      console.log(`🔄 Bulk hide operation completed for ${speakerIds.length} speakers`);
    } catch (error) {
      console.error("Failed to bulk hide speakers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Show previously hidden speakers
  app.post("/api/admin/speakers/bulk-show", async (req, res) => {
    try {
      const { speakerIds } = req.body;
      
      if (!Array.isArray(speakerIds)) {
        return res.status(400).json({ message: "speakerIds must be an array" });
      }

      const results = [];
      for (const speakerId of speakerIds) {
        try {
          const updatedSpeaker = await storage.updateSpeaker(speakerId, {
            hideProfile: false
          });
          if (updatedSpeaker) {
            results.push({ id: speakerId, status: "visible" });
          }
        } catch (error) {
          results.push({ id: speakerId, status: "error", error: error.message });
        }
      }

      res.json({ 
        success: true, 
        message: `Bulk show operation completed`,
        results 
      });
      
      console.log(`🔄 Bulk show operation completed for ${speakerIds.length} speakers`);
    } catch (error) {
      console.error("Failed to bulk show speakers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}