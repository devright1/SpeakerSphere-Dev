import type { Express } from "express";
import { storage } from "./storage";
import { BulkSpeakerImporter } from "./bulk-speaker-import";
import { ComprehensiveSpeakerImporter } from "./comprehensive-speaker-import";
import { GNYAPSpeakerImporter } from "./gnyap-speaker-import";
import { AAEDSpeakerImporter } from "./aaed-speaker-import";
import { UFCIDSpeakerImporter } from "./uf-cid-speaker-import";
import { BeckersSpeakerImporter } from "./beckers-speaker-import";
import { importEvent5Speakers } from "./event5-speaker-import";
import { importEvent24Speakers } from "./event24-speaker-import";
import { importEvent22Speakers } from "./event22-speaker-import";
import { importEvent26Speakers } from "./event26-speaker-import";

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

  // GNYAP speakers import from event 6
  app.post("/api/admin/speakers/gnyap-import", async (req, res) => {
    try {
      console.log("🚀 Starting GNYAP speaker import from event 6...");
      const importer = new GNYAPSpeakerImporter();
      const results = await importer.importAllSpeakers();

      res.json({
        success: true,
        message: `GNYAP import completed: ${results.success} speakers imported successfully`,
        results: {
          successCount: results.success,
          errorCount: results.errors.length,
          errors: results.errors
        }
      });

      console.log(`✅ GNYAP import completed: ${results.success} speakers imported, ${results.errors.length} errors`);
    } catch (error) {
      console.error("❌ GNYAP import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "GNYAP import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // AAED speakers import from event 7
  app.post("/api/admin/speakers/aaed-import", async (req, res) => {
    try {
      console.log("🚀 Starting AAED speaker import from event 7...");
      const importer = new AAEDSpeakerImporter();
      const results = await importer.importAllSpeakers();

      res.json({
        success: true,
        message: `AAED import completed: ${results.success} speakers imported successfully`,
        results: {
          successCount: results.success,
          errorCount: results.errors.length,
          errors: results.errors
        }
      });

      console.log(`✅ AAED import completed: ${results.success} speakers imported, ${results.errors.length} errors`);
    } catch (error) {
      console.error("❌ AAED import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "AAED import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // UF CID speakers import from event 12
  app.post("/api/admin/speakers/uf-cid-import", async (req, res) => {
    try {
      console.log("🚀 Starting UF CID speaker import from event 12...");
      const importer = new UFCIDSpeakerImporter();
      const results = await importer.importAllSpeakers();

      res.json({
        success: true,
        message: `UF CID import completed: ${results.success} speakers imported successfully`,
        results: {
          successCount: results.success,
          errorCount: results.errors.length,
          errors: results.errors
        }
      });

      console.log(`✅ UF CID import completed: ${results.success} speakers imported, ${results.errors.length} errors`);
    } catch (error) {
      console.error("❌ UF CID import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "UF CID import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Becker's speakers import from event 16
  app.post("/api/admin/speakers/beckers-import", async (req, res) => {
    try {
      console.log("🚀 Starting Becker's speaker import from event 16...");
      const importer = new BeckersSpeakerImporter();
      const results = await importer.importAllSpeakers();

      res.json({
        success: true,
        message: `Becker's import completed: ${results.success} speakers imported successfully`,
        results: {
          successCount: results.success,
          errorCount: results.errors.length,
          errors: results.errors
        }
      });

      console.log(`✅ Becker's import completed: ${results.success} speakers imported, ${results.errors.length} errors`);
    } catch (error) {
      console.error("❌ Becker's import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Becker's import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Event 5 speakers import from North America Esthetic Days 2025
  app.post("/api/admin/speakers/event5-import", async (req, res) => {
    try {
      console.log("🚀 Starting Event 5 speaker import from North America Esthetic Days 2025...");
      const results = await importEvent5Speakers();

      res.json({
        success: true,
        message: `Event 5 import completed: ${results.successCount} speakers imported successfully`,
        results: {
          successCount: results.successCount,
          errorCount: results.errorCount,
          errors: results.errors
        }
      });

      console.log(`✅ Event 5 import completed: ${results.successCount} speakers imported, ${results.errorCount} errors`);
    } catch (error) {
      console.error("❌ Event 5 import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Event 5 import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Event 24 speakers import from AAOMS 107th Annual Meeting 2025
  app.post("/api/admin/speakers/event24-import", async (req, res) => {
    try {
      console.log("🚀 Starting Event 24 speaker import from AAOMS 107th Annual Meeting 2025...");
      const results = await importEvent24Speakers();

      res.json({
        success: true,
        message: `Event 24 import completed: ${results.successCount} speakers imported successfully`,
        results: {
          successCount: results.successCount,
          errorCount: results.errorCount,
          errors: results.errors
        }
      });

      console.log(`✅ Event 24 import completed: ${results.successCount} speakers imported, ${results.errorCount} errors`);
    } catch (error) {
      console.error("❌ Event 24 import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Event 24 import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Event 22 speakers import from AAP 111th Annual Meeting 2025
  app.post("/api/admin/speakers/event22-import", async (req, res) => {
    try {
      console.log("🚀 Starting Event 22 speaker import from AAP 111th Annual Meeting 2025...");
      const results = await importEvent22Speakers();

      res.json({
        success: true,
        message: `Event 22 import completed: ${results.successCount} speakers imported successfully`,
        results: {
          successCount: results.successCount,
          errorCount: results.errorCount,
          errors: results.errors
        }
      });

      console.log(`✅ Event 22 import completed: ${results.successCount} speakers imported, ${results.errorCount} errors`);
    } catch (error) {
      console.error("❌ Event 22 import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Event 22 import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Event 26 speakers import from ACP 2025 Annual Session
  app.post("/api/admin/speakers/event26-import", async (req, res) => {
    try {
      console.log("🚀 Starting Event 26 speaker import from ACP 2025 Annual Session...");
      const results = await importEvent26Speakers();

      res.json({
        success: true,
        message: `Event 26 import completed: ${results.successCount} speakers imported successfully`,
        results: {
          successCount: results.successCount,
          errorCount: results.errorCount,
          errors: results.errors
        }
      });

      console.log(`✅ Event 26 import completed: ${results.successCount} speakers imported, ${results.errorCount} errors`);
    } catch (error) {
      console.error("❌ Event 26 import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Event 26 import failed", 
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