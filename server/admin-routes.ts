import type { Express } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { speakers, users, speakerApplications, reviews, userLikes, userBookmarks, userSessions, categories, speakingTopics } from "../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { EmailService } from "./email-service";
import bcrypt from "bcryptjs";
import { BulkSpeakerImporter } from "./bulk-speaker-import";

import { GNYAPSpeakerImporter } from "./gnyap-speaker-import";
import { AAEDSpeakerImporter } from "./aaed-speaker-import";
import { UFCIDSpeakerImporter } from "./uf-cid-speaker-import";
import { BeckersSpeakerImporter } from "./beckers-speaker-import";
import { importEvent5Speakers } from "./event5-speaker-import";
import { importEvent24Speakers } from "./event24-speaker-import";
import { importEvent22Speakers } from "./event22-speaker-import";
import { importEvent26Speakers } from "./event26-speaker-import";
import { importEvent9Speakers } from "./event9-speaker-import";
import { importEvent23Speakers } from "./event23-speaker-import";
import { importEvent14Speakers } from "./event14-speaker-import";
import { importSpeakersFromCSV } from "./comprehensive-speaker-import";

// Utility functions
const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

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

  // User Management
  app.get("/api/admin/users", async (req, res) => {
    try {
      console.log("Getting all users for admin...");
      // Direct database query to bypass storage issues
      const userList = await db.select().from(users)
        .orderBy(desc(users.createdAt));
      console.log("Users found:", userList.length);
      res.json(userList);
    } catch (error) {
      console.error("Failed to get all users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/user-stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const totalUsers = users.length;
      const speakerUsers = users.filter(u => u.speakerId).length;
      const regularUsers = totalUsers - speakerUsers;
      
      res.json({
        totalUsers,
        speakerUsers,
        regularUsers
      });
    } catch (error) {
      console.error("Failed to get user stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User deletion endpoint
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const { adminPassword } = req.body;
      console.log("Attempting to delete user:", userId);
      
      // Verify admin password (use same password as admin login)
      if (!adminPassword || adminPassword !== "Doneright123!") {
        return res.status(401).json({ message: "Invalid admin password" });
      }
      
      // First check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (existingUser.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete associated data first to avoid foreign key constraints
      await db.delete(userLikes).where(eq(userLikes.userId, userId));
      await db.delete(userBookmarks).where(eq(userBookmarks.userId, userId));
      await db.delete(userSessions).where(eq(userSessions.userId, userId));
      
      // Delete the user from database
      const result = await db.delete(users).where(eq(users.id, userId));
      console.log("Delete result:", result);
      
      res.json({ 
        success: true, 
        message: "User deleted successfully" 
      });
      
      console.log(`🗑️ User ${userId} has been deleted from database`);
    } catch (error) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User update endpoint  
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      console.log("Attempting to update user:", userId, updateData);
      
      // Update the user in database
      const result = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      
      res.json({ 
        success: true, 
        message: "User updated successfully" 
      });
      
      console.log(`✏️ User ${userId} has been updated`);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Speaker Applications Management
  app.get("/api/admin/speaker-applications", async (req, res) => {
    try {
      const applications = await storage.getAllSpeakerApplications();
      res.json(applications);
    } catch (error) {
      console.error("Failed to get speaker applications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/speaker-applications/:id/status", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, adminNotes, reviewedBy } = req.body;
      
      // Get application details before update for email
      const application = await storage.getSpeakerApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const updatedApplication = await storage.updateSpeakerApplicationStatus(
        applicationId, 
        status, 
        adminNotes, 
        reviewedBy
      );
      
      // Send status update email (except for approved - that's handled in the approve endpoint)
      if (status === 'rejected') {
        const emailService = EmailService.getInstance();
        const emailSent = await emailService.sendSpeakerRejection(
          application.email,
          application.firstName,
          adminNotes
        );
        
        console.log(`📧 Rejection email for ${application.email}: ${emailSent ? 'sent' : 'failed'}`);
      }
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Failed to update application status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update full application data
  app.patch("/api/admin/speaker-applications/:id", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const updates = req.body;
      
      console.log("Update request received:", JSON.stringify(updates, null, 2));
      
      // Get current application to check if it exists
      const currentApplication = await storage.getSpeakerApplication(applicationId);
      if (!currentApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Filter out fields that shouldn't be updated (timestamps, IDs, etc.)
      const allowedUpdates: any = {};
      const excludeFields = ['id', 'createdAt', 'reviewedAt', 'createdSpeakerId'];
      
      for (const [key, value] of Object.entries(updates)) {
        // Skip excluded fields and any field that looks like a timestamp
        if (!excludeFields.includes(key) && 
            !key.toLowerCase().includes('at') && 
            !key.toLowerCase().includes('date') &&
            key !== 'createdAt' &&
            key !== 'reviewedAt') {
          allowedUpdates[key] = value;
        }
      }
      
      console.log("Filtered updates:", JSON.stringify(allowedUpdates, null, 2));
      
      // Update the application directly in the database
      const [updatedApplication] = await db.update(speakerApplications)
        .set(allowedUpdates)
        .where(eq(speakerApplications.id, applicationId))
        .returning();
      
      if (!updatedApplication) {
        return res.status(500).json({ message: "Failed to update application" });
      }
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Failed to update application:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check for potential duplicate speakers by name
  app.get("/api/admin/speaker-applications/:id/check-duplicates", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      
      // Get application details
      const application = await storage.getSpeakerApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const fullName = `${application.firstName} ${application.lastName}`.trim();
      
      // Search for existing speakers with similar names
      const allSpeakers = await storage.getSpeakers({ includeHidden: true });
      const potentialMatches = allSpeakers.filter(speaker => {
        const speakerName = speaker.name.toLowerCase();
        const applicationName = fullName.toLowerCase();
        
        // Check for exact match or very similar names
        return speakerName === applicationName || 
               speakerName.includes(applicationName) || 
               applicationName.includes(speakerName) ||
               // Check if individual names match (e.g., "Dr. John Smith" vs "John Smith")
               speakerName.replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '') === applicationName ||
               applicationName.replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '') === speakerName;
      });
      
      res.json({
        applicationName: fullName,
        potentialMatches: potentialMatches.map(speaker => ({
          id: speaker.id,
          name: speaker.name,
          title: speaker.title,
          email: speaker.email,
          category: speaker.category,
          hidden: speaker.hideProfile
        }))
      });
    } catch (error) {
      console.error("Failed to check for duplicates:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Link application to existing speaker
  app.post("/api/admin/speaker-applications/:id/link-existing", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { existingSpeakerId, reviewedBy } = req.body;
      
      // Get application details
      const application = await storage.getSpeakerApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Get existing speaker
      const existingSpeaker = await storage.getSpeaker(existingSpeakerId);
      if (!existingSpeaker) {
        return res.status(404).json({ message: "Existing speaker not found" });
      }
      
      // Check if there's already a user for this email
      let user = await storage.getUserByEmail(application.email);
      
      if (!user) {
        // Create a new user account for this email
        user = await storage.createUser({
          email: application.email,
          firstName: application.firstName,
          lastName: application.lastName,
          passwordHash: '' // Will be set later
        });
      }
      
      // Update application status and link to existing speaker
      await storage.updateSpeakerApplicationStatus(
        applicationId, 
        'approved', 
        `Linked to existing speaker profile: ${existingSpeaker.name} (ID: ${existingSpeaker.id})`,
        reviewedBy
      );
      
      // Generate temporary password and update user
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(temporaryPassword);
      
      await storage.updateUser(user.id, { 
        passwordHash: hashedPassword 
      });
      
      // Send welcome email with login credentials
      const emailService = EmailService.getInstance();
      const emailSent = await emailService.sendSpeakerApproval(
        application.email,
        application.firstName,
        { email: application.email, password: temporaryPassword }
      );
      
      res.json({ 
        success: true, 
        message: "Application linked to existing speaker profile",
        speakerId: existingSpeaker.id,
        userId: user.id,
        linkedToExisting: true,
        emailSent: emailSent,
        temporaryPassword: temporaryPassword,
        loginInstructions: {
          email: application.email,
          password: temporaryPassword,
          loginUrl: loginUrl
        }
      });
      
      console.log(`🔗 Application linked: ${application.firstName} ${application.lastName} -> existing speaker ${existingSpeaker.name} (${existingSpeaker.id})`);
    } catch (error) {
      console.error("Failed to link to existing speaker:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check for duplicate speakers before approval
  app.get("/api/admin/speaker-applications/:id/check-duplicates", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      
      // Get application details
      const application = await storage.getSpeakerApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Search for potential duplicates based on name similarity and email
      const allSpeakers = await storage.getSpeakers({ includeHidden: true });
      
      const potentialMatches = [];
      
      for (const speaker of allSpeakers) {
        let matchReason = null;
        
        // Check for exact email match
        if (speaker.email && application.email && speaker.email.toLowerCase() === application.email.toLowerCase()) {
          matchReason = "Exact email match";
        }
        
        // Check for similar names (simple word matching)
        const appName = `${application.firstName} ${application.lastName}`.toLowerCase();
        const speakerName = speaker.name.toLowerCase();
        
        // Check if names share significant words
        const appWords = appName.split(' ').filter(word => word.length > 2);
        const speakerWords = speakerName.split(' ').filter(word => word.length > 2);
        
        const sharedWords = appWords.filter(word => 
          speakerWords.some(sWord => sWord.includes(word) || word.includes(sWord))
        );
        
        // If more than half the words match, it's a potential duplicate
        if (sharedWords.length >= Math.max(1, Math.min(appWords.length, speakerWords.length) / 2)) {
          if (!matchReason) {
            matchReason = `Similar name (${sharedWords.join(', ')})`;
          }
        }
        
        if (matchReason) {
          potentialMatches.push({
            ...speaker,
            matchReason
          });
        }
      }
      
      res.json({ 
        potentialMatches,
        application: {
          id: application.id,
          firstName: application.firstName,
          lastName: application.lastName,
          email: application.email,
          title: application.title,
          specialty: application.specialty
        }
      });
      
      console.log(`🔍 Checked duplicates for ${application.firstName} ${application.lastName}: found ${potentialMatches.length} potential matches`);
    } catch (error) {
      console.error("Failed to check duplicates:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/speaker-applications/:id/approve", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { reviewedBy } = req.body;
      
      // Get application details before approval for email
      const application = await storage.getSpeakerApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const result = await storage.approveSpeakerApplication(applicationId, reviewedBy);
      
      // Generate temporary password and update user
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(temporaryPassword);
      
      // Update the created user with the hashed password
      await storage.updateUser(result.user.id, { 
        passwordHash: hashedPassword 
      });
      
      // Send welcome email with login credentials
      const emailService = EmailService.getInstance();
      const emailSent = await emailService.sendSpeakerApproval(
        application.email,
        application.firstName,
        { email: application.email, password: temporaryPassword }
      );
      
      res.json({ 
        success: true, 
        message: "Speaker application approved and profile created",
        speakerId: result.speaker.id,
        userId: result.user.id,
        emailSent: emailSent,
        temporaryPassword: temporaryPassword, // Include password in response for manual delivery
        loginInstructions: {
          email: application.email,
          password: temporaryPassword,
          loginUrl: loginUrl
        }
      });
      
      console.log(`🎉 Speaker ${application.firstName} ${application.lastName} approved. Login: ${application.email} / ${temporaryPassword}`);
    } catch (error) {
      console.error("Failed to approve speaker application:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete speaker (soft delete by hiding profile)
  app.delete("/api/admin/speakers/:id", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      const speaker = await storage.getSpeaker(speakerId);
      
      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      // Delete speaker (this sets hideProfile: true)
      const deleted = await storage.deleteSpeaker(speakerId);

      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete speaker" });
      }

      res.json({ 
        success: true, 
        message: "Speaker deleted successfully" 
      });
      
      console.log(`🗑️ Speaker ${speaker.name} has been deleted (hidden) from all domains`);
    } catch (error) {
      console.error("Failed to delete speaker:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all speaker inquiries for admin review
  app.get("/api/admin/inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getAllInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Failed to get inquiries:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update inquiry status
  app.patch("/api/admin/inquiries/:id/status", async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      
      const updatedInquiry = await storage.updateInquiryStatus(inquiryId, status, adminNotes);
      
      if (!updatedInquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      res.json({ 
        success: true, 
        message: "Inquiry status updated successfully",
        inquiry: updatedInquiry 
      });
      
      console.log(`📝 Inquiry ${inquiryId} status updated to: ${status}`);
    } catch (error) {
      console.error("Failed to update inquiry status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
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
      console.log("🚀 Starting comprehensive bulk speaker import from CSV...");
      const results = await importSpeakersFromCSV('speakers_data.json');

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

  // Event 9 speakers import from AAID Annual Meeting 2025
  app.post("/api/admin/speakers/event9-import", async (req, res) => {
    try {
      console.log("🚀 Starting Event 9 speaker import from AAID Annual Meeting 2025...");
      const results = await importEvent9Speakers();

      res.json({
        success: true,
        message: `Event 9 import completed: ${results.successCount} speakers imported successfully`,
        results: {
          successCount: results.successCount,
          errorCount: results.errorCount,
          errors: results.errors
        }
      });

      console.log(`✅ Event 9 import completed: ${results.successCount} speakers imported, ${results.errorCount} errors`);
    } catch (error) {
      console.error("❌ Event 9 import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Event 9 import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Event 23 speakers import from Straumann LABFEST 2025
  app.post("/api/admin/speakers/event23-import", async (req, res) => {
    try {
      console.log("🚀 Starting Event 23 speaker import from Straumann LABFEST 2025...");
      const results = await importEvent23Speakers();

      res.json({
        success: true,
        message: `Event 23 import completed: ${results.successCount} speakers imported successfully`,
        results: {
          successCount: results.successCount,
          errorCount: results.errorCount,
          errors: results.errors
        }
      });

      console.log(`✅ Event 23 import completed: ${results.successCount} speakers imported, ${results.errorCount} errors`);
    } catch (error) {
      console.error("❌ Event 23 import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Event 23 import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Event 14 speakers import from 2025 AAOMS Dental Implant Conference
  app.post("/api/admin/speakers/event14-import", async (req, res) => {
    try {
      console.log("🚀 Starting Event 14 speaker import from 2025 AAOMS Dental Implant Conference...");
      const results = await importEvent14Speakers();

      res.json({
        success: true,
        message: `Event 14 import completed: ${results.successCount} speakers imported successfully`,
        results: {
          successCount: results.successCount,
          errorCount: results.errorCount,
          errors: results.errors
        }
      });

      console.log(`✅ Event 14 import completed: ${results.successCount} speakers imported, ${results.errorCount} errors`);
    } catch (error) {
      console.error("❌ Event 14 import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "Event 14 import failed", 
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

  // CSV import from attached file
  app.post("/api/admin/speakers/csv-import", async (req, res) => {
    try {
      console.log("🚀 Starting CSV speaker import...");
      const results = await importSpeakersFromCSV();

      res.json({
        success: true,
        message: `CSV import completed: ${results.imported} speakers imported successfully`,
        results: {
          imported: results.imported,
          skipped: results.skipped,
          errors: results.errors,
          total: results.total
        }
      });

      console.log(`✅ CSV import completed: ${results.imported} speakers imported, ${results.skipped} skipped, ${results.errors} errors`);
    } catch (error) {
      console.error("❌ CSV import failed:", error);
      res.status(500).json({ 
        success: false,
        message: "CSV import failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Bulk toggle contact visibility for multiple speakers
  app.post("/api/admin/speakers/bulk-toggle-contact", async (req, res) => {
    try {
      const { speakerIds, hideContact } = req.body;
      
      if (!Array.isArray(speakerIds) || speakerIds.length === 0) {
        return res.status(400).json({ message: "Speaker IDs are required" });
      }

      const results = [];
      for (const speakerId of speakerIds) {
        try {
          const [speaker] = await db
            .update(speakers)
            .set({ hideContact })
            .where(eq(speakers.id, speakerId))
            .returning();
          
          results.push({ speakerId, success: true, speaker });
        } catch (error) {
          results.push({ speakerId, success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }

      res.json({ 
        success: true, 
        message: `Bulk contact visibility operation completed`,
        results 
      });
      
      console.log(`🔄 Bulk contact visibility operation completed for ${speakerIds.length} speakers (hideContact: ${hideContact})`);
    } catch (error) {
      console.error("Failed to bulk toggle contact visibility:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bulk toggle ratings visibility for multiple speakers
  app.post("/api/admin/speakers/bulk-toggle-ratings", async (req, res) => {
    try {
      const { speakerIds, hideRatings } = req.body;
      
      if (!Array.isArray(speakerIds) || speakerIds.length === 0) {
        return res.status(400).json({ message: "Speaker IDs are required" });
      }

      const results = [];
      for (const speakerId of speakerIds) {
        try {
          const [speaker] = await db
            .update(speakers)
            .set({ hideRatings })
            .where(eq(speakers.id, speakerId))
            .returning();
          
          results.push({ speakerId, success: true, speaker });
        } catch (error) {
          results.push({ speakerId, success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }

      res.json({ 
        success: true, 
        message: `Bulk ratings visibility operation completed`,
        results 
      });
      
      console.log(`🔄 Bulk ratings visibility operation completed for ${speakerIds.length} speakers (hideRatings: ${hideRatings})`);
    } catch (error) {
      console.error("Failed to bulk toggle ratings visibility:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Toggle contact visibility for individual speaker
  app.patch("/api/admin/speakers/:id/toggle-contact", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      const { hideContact } = req.body;

      const [speaker] = await db
        .update(speakers)
        .set({ hideContact })
        .where(eq(speakers.id, speakerId))
        .returning();

      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      res.json({ 
        success: true, 
        message: `Contact visibility ${hideContact ? 'hidden' : 'shown'} for speaker`,
        speaker 
      });
      
      console.log(`🔄 Contact visibility ${hideContact ? 'hidden' : 'shown'} for speaker: ${speaker.name}`);
    } catch (error) {
      console.error("Failed to toggle contact visibility:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Toggle ratings visibility for individual speaker
  app.patch("/api/admin/speakers/:id/toggle-ratings", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      const { hideRatings } = req.body;

      const [speaker] = await db
        .update(speakers)
        .set({ hideRatings })
        .where(eq(speakers.id, speakerId))
        .returning();

      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      res.json({ 
        success: true, 
        message: `Ratings visibility ${hideRatings ? 'hidden' : 'shown'} for speaker`,
        speaker 
      });
      
      console.log(`🔄 Ratings visibility ${hideRatings ? 'hidden' : 'shown'} for speaker: ${speaker.name}`);
    } catch (error) {
      console.error("Failed to toggle ratings visibility:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Review management endpoints
  // Get all pending reviews for admin approval
  app.get("/api/admin/reviews", async (req, res) => {
    try {
      // Query pending reviews with speaker information
      const result = await db.select({
        id: reviews.id,
        speakerId: reviews.speakerId,
        userId: reviews.userId,
        reviewerName: reviews.reviewerName,
        reviewerTitle: reviews.reviewerTitle,
        reviewerCompany: reviews.reviewerCompany,
        overallRating: reviews.overallRating,
        speakingStyleRating: reviews.speakingStyleRating,
        podiumPresenceRating: reviews.podiumPresenceRating,
        technicalProficiencyRating: reviews.technicalProficiencyRating,
        contentRelevanceRating: reviews.contentRelevanceRating,
        easeOfWorkingRating: reviews.easeOfWorkingRating,
        visualDesignRating: reviews.visualDesignRating,
        comment: reviews.comment,
        eventType: reviews.eventType,
        eventDate: reviews.eventDate,
        photoUrl: reviews.photoUrl,
        verified: reviews.verified,
        approvalStatus: reviews.approvalStatus,
        adminNotes: reviews.adminNotes,
        approvedAt: reviews.approvedAt,
        approvedBy: reviews.approvedBy,
        createdAt: reviews.createdAt,
        // Include speaker information
        speakerName: speakers.name,
        speakerSlug: speakers.slug,
        speakerImageUrl: speakers.imageUrl
      })
      .from(reviews)
      .leftJoin(speakers, eq(reviews.speakerId, speakers.id))
      .where(eq(reviews.approvalStatus, 'pending'))
      .orderBy(desc(reviews.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      res.status(500).json({ message: "Failed to fetch pending reviews" });
    }
  });

  // Get all reviews (pending, approved, rejected) for admin management
  app.get("/api/admin/all-reviews", async (req, res) => {
    try {
      // Query all reviews with speaker information
      const result = await db.select({
        id: reviews.id,
        speakerId: reviews.speakerId,
        userId: reviews.userId,
        reviewerName: reviews.reviewerName,
        reviewerTitle: reviews.reviewerTitle,
        reviewerCompany: reviews.reviewerCompany,
        overallRating: reviews.overallRating,
        speakingStyleRating: reviews.speakingStyleRating,
        podiumPresenceRating: reviews.podiumPresenceRating,
        technicalProficiencyRating: reviews.technicalProficiencyRating,
        contentRelevanceRating: reviews.contentRelevanceRating,
        easeOfWorkingRating: reviews.easeOfWorkingRating,
        visualDesignRating: reviews.visualDesignRating,
        comment: reviews.comment,
        eventType: reviews.eventType,
        eventDate: reviews.eventDate,
        photoUrl: reviews.photoUrl,
        verified: reviews.verified,
        approvalStatus: reviews.approvalStatus,
        adminNotes: reviews.adminNotes,
        approvedAt: reviews.approvedAt,
        approvedBy: reviews.approvedBy,
        createdAt: reviews.createdAt,
        // Include speaker information
        speakerName: speakers.name,
        speakerSlug: speakers.slug,
        speakerImageUrl: speakers.imageUrl
      })
      .from(reviews)
      .leftJoin(speakers, eq(reviews.speakerId, speakers.id))
      .orderBy(desc(reviews.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching all reviews:", error);
      res.status(500).json({ message: "Failed to fetch all reviews" });
    }
  });

  // Approve a review
  app.post("/api/admin/reviews/:id/approve", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { adminNotes } = req.body;
      
      const [updatedReview] = await db.update(reviews)
        .set({ 
          approvalStatus: 'approved',
          adminNotes: adminNotes || 'Review approved for publication',
          approvedAt: new Date(),
          approvedBy: 'admin'
        })
        .where(eq(reviews.id, reviewId))
        .returning();
      
      if (!updatedReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Recalculate speaker's overall rating based on all approved reviews
      const approvedReviewsForSpeaker = await db.select({
        overallRating: reviews.overallRating
      })
      .from(reviews)
      .where(and(
        eq(reviews.speakerId, updatedReview.speakerId),
        eq(reviews.approvalStatus, 'approved')
      ));

      if (approvedReviewsForSpeaker.length > 0) {
        const avgRating = approvedReviewsForSpeaker.reduce((sum, review) => sum + review.overallRating, 0) / approvedReviewsForSpeaker.length;
        
        // Update speaker's overall rating
        await db.update(speakers)
          .set({ 
            overallRating: avgRating.toFixed(1) // Store as string with 1 decimal place
          })
          .where(eq(speakers.id, updatedReview.speakerId));
      }
      
      res.json({
        success: true,
        message: "Review approved successfully",
        review: updatedReview
      });
    } catch (error) {
      console.error("Error approving review:", error);
      res.status(500).json({ message: "Failed to approve review" });
    }
  });

  // Reject a review
  app.post("/api/admin/reviews/:id/reject", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { adminNotes } = req.body;
      
      const [updatedReview] = await db.update(reviews)
        .set({ 
          approvalStatus: 'rejected',
          adminNotes: adminNotes || 'Review rejected due to policy violation',
          approvedAt: new Date(),
          approvedBy: 'admin'
        })
        .where(eq(reviews.id, reviewId))
        .returning();
      
      if (!updatedReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Recalculate speaker's overall rating based on remaining approved reviews
      const approvedReviewsForSpeaker = await db.select({
        overallRating: reviews.overallRating
      })
      .from(reviews)
      .where(and(
        eq(reviews.speakerId, updatedReview.speakerId),
        eq(reviews.approvalStatus, 'approved')
      ));

      if (approvedReviewsForSpeaker.length > 0) {
        const avgRating = approvedReviewsForSpeaker.reduce((sum, review) => sum + review.overallRating, 0) / approvedReviewsForSpeaker.length;
        
        // Update speaker's overall rating
        await db.update(speakers)
          .set({ 
            overallRating: avgRating.toFixed(1) // Store as string with 1 decimal place
          })
          .where(eq(speakers.id, updatedReview.speakerId));
      } else {
        // No approved reviews left, reset rating
        await db.update(speakers)
          .set({ 
            overallRating: "0.0"
          })
          .where(eq(speakers.id, updatedReview.speakerId));
      }
      
      res.json({
        success: true,
        message: "Review rejected successfully",
        review: updatedReview
      });
    } catch (error) {
      console.error("Error rejecting review:", error);
      res.status(500).json({ message: "Failed to reject review" });
    }
  });

  // Delete a review
  app.delete("/api/admin/reviews/:id", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      
      const [deletedReview] = await db.delete(reviews)
        .where(eq(reviews.id, reviewId))
        .returning();
      
      if (!deletedReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      res.json({
        success: true,
        message: "Review deleted successfully",
        deletedReview
      });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Topic-Category Management
  
  // Get all topics with their category assignments
  app.get("/api/admin/topics", async (req, res) => {
    try {
      const topics = await db.select().from(speakingTopics).orderBy(speakingTopics.name);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  // Update topic's category assignment
  app.patch("/api/admin/topics/:id/category", async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const { category } = req.body;
      
      const [updatedTopic] = await db.update(speakingTopics)
        .set({ category: category || null })
        .where(eq(speakingTopics.id, topicId))
        .returning();
      
      if (!updatedTopic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      res.json({
        success: true,
        message: "Topic category updated successfully",
        topic: updatedTopic
      });
    } catch (error) {
      console.error("Error updating topic category:", error);
      res.status(500).json({ message: "Failed to update topic category" });
    }
  });

  // Bulk update topic categories
  app.post("/api/admin/topics/bulk-category-update", async (req, res) => {
    try {
      const { topicIds, category } = req.body;
      
      if (!Array.isArray(topicIds) || topicIds.length === 0) {
        return res.status(400).json({ message: "Topic IDs must be a non-empty array" });
      }
      
      const updatedTopics = [];
      for (const topicId of topicIds) {
        const [updatedTopic] = await db.update(speakingTopics)
          .set({ category: category || null })
          .where(eq(speakingTopics.id, topicId))
          .returning();
        if (updatedTopic) {
          updatedTopics.push(updatedTopic);
        }
      }
      
      res.json({
        success: true,
        message: `Updated ${updatedTopics.length} topics`,
        updatedTopics
      });
    } catch (error) {
      console.error("Error bulk updating topic categories:", error);
      res.status(500).json({ message: "Failed to bulk update topic categories" });
    }
  });

  // Get topics by category
  app.get("/api/admin/categories/:categoryName/topics", async (req, res) => {
    try {
      const categoryName = decodeURIComponent(req.params.categoryName);
      const topics = await db.select()
        .from(speakingTopics)
        .where(eq(speakingTopics.category, categoryName))
        .orderBy(speakingTopics.name);
      
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics by category:", error);
      res.status(500).json({ message: "Failed to fetch topics by category" });
    }
  });
}