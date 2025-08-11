import type { Express } from "express";
import { storage } from "./storage";
import { BulkSpeakerImporter } from "./bulk-speaker-import";
import { ComprehensiveSpeakerImporter } from "./comprehensive-speaker-import";

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

  // Manually add a new speaker (admin only)
  app.post("/api/admin/speakers", async (req, res) => {
    try {
      const speakerData = req.body;
      
      // Basic validation
      if (!speakerData.name || !speakerData.title) {
        return res.status(400).json({ message: "Name and title are required" });
      }

      // Create the speaker with admin-added metadata
      const newSpeaker = await storage.createSpeaker({
        name: speakerData.name,
        title: speakerData.title,
        bio: speakerData.bio || "",
        slug: speakerData.slug,
        imageUrl: speakerData.imageUrl || "/placeholder-speaker.jpg",
        email: speakerData.email || "",
        phone: speakerData.phone || "",
        website: speakerData.website || "",
        location: speakerData.location || "",
        category: speakerData.category || "",
        expertise: speakerData.expertise ? [speakerData.expertise] : [],
        achievements: [],
        lectures: [],
        languages: ["English"],
        medicalSpecialties: [],
        speakerType: "keynote",
        featured: speakerData.featured || false,
        verified: speakerData.verified || false,
        socialMedia: []
      });

      res.json({ 
        success: true, 
        message: "Speaker added successfully",
        speaker: newSpeaker 
      });
      
      console.log(`✅ New speaker manually added: ${speakerData.name}`);
    } catch (error) {
      console.error("Failed to add speaker:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comprehensive bulk import speakers from dentalsymposiumhub.com
  app.post("/api/admin/speakers/bulk-import", async (req, res) => {
    try {
      console.log("🚀 Starting comprehensive bulk speaker import from dentalsymposiumhub.com...");
      const importer = new ComprehensiveSpeakerImporter();
      const results = await importer.importAllSpeakers();

      res.json({
        success: true,
        message: `Comprehensive bulk import completed: ${results.success} speakers imported successfully`,
        results: {
          successCount: results.success,
          errorCount: results.errors.length,
          errors: results.errors
        }
      });

      console.log(`✅ Comprehensive bulk import completed: ${results.success} speakers imported, ${results.errors.length} errors`);
    } catch (error) {
      console.error("❌ Comprehensive bulk import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Comprehensive bulk import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
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
          results.push({ id: speakerId, status: "error", error: (error as Error).message });
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
          results.push({ id: speakerId, status: "error", error: (error as Error).message });
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