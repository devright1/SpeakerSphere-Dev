import type { Express } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { speakers, users, speakerApplications, reviews, userLikes, userBookmarks, userSessions, categories, speakingTopics, speakerContent } from "../shared/schema";
import { eq, desc, and, or, isNotNull } from "drizzle-orm";
import { EmailService } from "./email-service";
import { generateVerificationToken, getTokenExpiration } from "./email";
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

  app.get("/api/admin/speaker-accounts", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const speakerUsers = allUsers.filter(u => u.speakerId && u.accountType === 'speaker');
      const speakerIds = speakerUsers.map(u => u.speakerId!);
      const allSpeakers = await storage.getSpeakers({ includeHidden: true });
      const speakerMap = new Map(allSpeakers.map(s => [s.id, s]));
      const accounts = speakerUsers.map(u => {
        const speaker = speakerMap.get(u.speakerId!);
        return {
          speakerId: u.speakerId,
          userId: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          lastLogin: u.lastLogin,
          speakerName: speaker?.name || 'Unknown',
          speakerSlug: speaker?.slug || '',
          speakerImageUrl: speaker?.imageUrl || '',
          speakerTitle: speaker?.title || '',
          subscriptionTier: speaker?.subscriptionTier || 'basic',
          tempPassword: u.tempPassword || null,
        };
      });
      res.json(accounts);
    } catch (error) {
      console.error("Failed to get speaker accounts:", error);
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
      
      console.log(`🔍 Checking for duplicates of: "${fullName}"`);
      console.log(`📊 Total speakers in database: ${allSpeakers.length}`);
      
      const potentialMatches = allSpeakers.filter(speaker => {
        const speakerName = speaker.name.toLowerCase().trim();
        const applicationName = fullName.toLowerCase().trim();
        
        // Normalize names (remove extra spaces, titles, punctuation)
        const normalizedSpeakerName = speakerName
          .replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|dds\.?|dmd\.?|phd\.?)\s+/i, '')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
          
        const normalizedApplicationName = applicationName
          .replace(/^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|dds\.?|dmd\.?|phd\.?)\s+/i, '')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        const isMatch = (
          // Exact match
          speakerName === applicationName ||
          normalizedSpeakerName === normalizedApplicationName ||
          // Contains match
          speakerName.includes(applicationName) || 
          applicationName.includes(speakerName) ||
          normalizedSpeakerName.includes(normalizedApplicationName) ||
          normalizedApplicationName.includes(normalizedSpeakerName) ||
          // Email match
          (speaker.email && application.email && speaker.email.toLowerCase() === application.email.toLowerCase())
        );
        
        if (isMatch) {
          console.log(`✅ Found match: "${speaker.name}" (ID: ${speaker.id}) matches "${fullName}"`);
        }
        
        return isMatch;
      });
      
      res.json({
        applicationName: fullName,
        potentialMatches: potentialMatches.map(speaker => ({
          id: speaker.id,
          name: speaker.name,
          title: speaker.title,
          email: speaker.email,
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
        // Create a new user account for this email and link to existing speaker
        user = await storage.createUser({
          email: application.email,
          firstName: application.firstName,
          lastName: application.lastName,
          passwordHash: '', // Will be set later
          accountType: 'speaker',
          speakerId: existingSpeaker.id
        });
      } else {
        // Update existing user to link to the speaker profile
        await storage.updateUser(user.id, { 
          accountType: 'speaker',
          speakerId: existingSpeaker.id
        });
      }
      
      // Update the speaker profile's email and mark as verified (claimed profile)
      await storage.updateSpeaker(existingSpeaker.id, { email: application.email, verified: true });

      // Update the application with the linked speaker ID
      await db.update(speakerApplications)
        .set({ createdSpeakerId: existingSpeaker.id })
        .where(eq(speakerApplications.id, applicationId));

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
        passwordHash: hashedPassword,
        tempPassword: temporaryPassword,
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
          loginUrl: process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}/for-speakers` : 'http://localhost:5000/for-speakers'
        }
      });
      
      console.log(`🔗 Application linked: ${application.firstName} ${application.lastName} -> existing speaker ${existingSpeaker.name} (${existingSpeaker.id})`);
    } catch (error) {
      console.error("Failed to link to existing speaker:", error);
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
      
      // Update the created user with the hashed password, store temp password, and verify email immediately
      await storage.updateUser(result.user.id, { 
        passwordHash: hashedPassword,
        tempPassword: temporaryPassword,
        emailVerified: true
      });
      
      // Send approval email with login credentials (no verification needed)
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
          loginUrl: process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}/for-speakers` : 'http://localhost:5000/for-speakers'
        }
      });
      
      console.log(`🎉 Speaker ${application.firstName} ${application.lastName} approved. Login: ${application.email} / ${temporaryPassword}`);
    } catch (error) {
      console.error("Failed to approve speaker application:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset user password (generate temporary password)
  app.patch("/api/admin/users/:userId/reset-password", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { adminPassword } = req.body;
      
      // Verify admin password
      if (!adminPassword || adminPassword !== "Doneright123!") {
        return res.status(401).json({ message: "Invalid admin password" });
      }
      
      // Generate temporary password and hash it
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(temporaryPassword);
      
      // Update user's admin password and clear any user-set password
      await storage.updateUser(userId, { 
        passwordHash: hashedPassword, 
        tempPassword: temporaryPassword,
        userPasswordHash: null 
      });
      
      // Get user details for response
      const user = await storage.getUserById(userId);
      
      res.json({
        success: true,
        message: "Temporary password generated",
        loginInstructions: {
          email: user?.email,
          password: temporaryPassword,
          loginUrl: process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}/for-speakers` : 'http://localhost:5000/for-speakers'
        }
      });
      
      console.log(`🔑 Temporary password generated for ${user?.email}: ${temporaryPassword}`);
    } catch (error) {
      console.error("Failed to reset password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete speaker (immediate or 14-day retention)
  app.delete("/api/admin/speakers/:id", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      const { adminPassword, deletionType } = req.body;
      console.log("Attempting to delete speaker:", speakerId, "Type:", deletionType);
      
      // Verify admin password (use same password as admin login)
      if (!adminPassword || adminPassword !== "Doneright123!") {
        return res.status(401).json({ message: "Invalid admin password" });
      }
      
      const speaker = await storage.getSpeaker(speakerId);
      
      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      // Delete speaker with specified type
      const deleted = await storage.deleteSpeaker(speakerId, deletionType || "retention");

      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete speaker" });
      }

      const message = deletionType === "immediate" 
        ? "Speaker permanently deleted" 
        : "Speaker deleted with 14-day retention";

      res.json({ 
        success: true, 
        message: message
      });
      
      console.log(`🗑️ Speaker ${speaker.name} has been deleted (${deletionType === "immediate" ? "permanently" : "with 14-day retention"})`);
    } catch (error) {
      console.error("Failed to delete speaker:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send login credentials to approved speaker
  app.post("/api/admin/speakers/:id/send-credentials", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      
      // Get speaker details
      const speaker = await storage.getSpeaker(speakerId);
      if (!speaker) {
        return res.status(404).json({ message: "Speaker not found" });
      }

      // Get the associated user account
      const user = await storage.getUserByEmail(speaker.email);
      if (!user) {
        return res.status(404).json({ message: "No user account found for this speaker" });
      }

      let temporaryPassword = user.tempPassword;
      
      if (!temporaryPassword) {
        temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await hashPassword(temporaryPassword);
        await storage.updateUser(user.id, { 
          passwordHash: hashedPassword,
          tempPassword: temporaryPassword,
        });
      }

      const emailService = EmailService.getInstance();
      const emailSent = await emailService.sendLoginCredentials(
        speaker.email,
        speaker.name,
        { email: speaker.email, password: temporaryPassword }
      );

      res.json({ 
        success: true, 
        message: emailSent ? "Login credentials sent successfully" : "Failed to send email",
        emailSent: emailSent,
        credentials: {
          email: speaker.email,
          password: temporaryPassword
        }
      });
      
      console.log(`📧 Login credentials sent to ${speaker.name} (${speaker.email}): ${temporaryPassword}`);
    } catch (error) {
      console.error("Failed to send credentials:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete speaker application (for organization, keeps speaker profile if approved)
  app.delete("/api/admin/speaker-applications/:id", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { adminPassword } = req.body;
      console.log("Attempting to delete application:", applicationId);
      
      // Verify admin password (use same password as admin login)
      if (!adminPassword || adminPassword !== "Doneright123!") {
        return res.status(401).json({ message: "Invalid admin password" });
      }
      
      // Delete the application record (this is just for organization)
      const result = await db.delete(speakerApplications).where(eq(speakerApplications.id, applicationId));
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json({ 
        success: true, 
        message: "Application deleted successfully" 
      });
      
      console.log(`🗑️ Speaker application ${applicationId} has been deleted for organizational purposes`);
    } catch (error) {
      console.error("Failed to delete speaker application:", error);
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

  // Delete inquiry (admin only)
  app.delete("/api/admin/inquiries/:id", async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const { adminPassword } = req.body;
      console.log("Attempting to delete inquiry:", inquiryId);
      
      // Verify admin password (use same password as admin login)
      if (!adminPassword || adminPassword !== "Doneright123!") {
        return res.status(401).json({ message: "Invalid admin password" });
      }
      
      // First check if inquiry exists
      const existingInquiry = await storage.getInquiry(inquiryId);
      if (!existingInquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      // Delete the inquiry
      const deleted = await storage.deleteInquiry(inquiryId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete inquiry" });
      }

      res.json({ 
        success: true, 
        message: "Inquiry deleted successfully" 
      });
      
      console.log(`🗑️ Inquiry ${inquiryId} has been deleted`);
    } catch (error) {
      console.error("Failed to delete inquiry:", error);
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
      const results = await importSpeakersFromCSV();

      res.json({
        success: true,
        message: `Comprehensive bulk import completed: ${results.imported} speakers imported successfully`,
        results: {
          successCount: results.imported,
          errorCount: results.errors,
          skippedCount: results.skipped,
          total: results.total
        }
      });

      console.log(`✅ Comprehensive bulk import completed: ${results.imported} speakers imported, ${results.errors} errors`);
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

  // Admin speaker update endpoint
  app.put("/api/admin/speakers/:id", async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      
      if (isNaN(speakerId)) {
        return res.status(400).json({ error: "Invalid speaker ID" });
      }

      const updatedSpeaker = await storage.updateSpeaker(speakerId, req.body);
      
      if (!updatedSpeaker) {
        return res.status(404).json({ error: "Speaker not found" });
      }

      console.log(`✏️ Admin updated speaker ${speakerId}: ${updatedSpeaker.name}`);
      res.json(updatedSpeaker);
    } catch (error) {
      console.error("Error updating speaker:", error);
      res.status(500).json({ error: "Failed to update speaker" });
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
        const avgRating = approvedReviewsForSpeaker.reduce((sum, review) => sum + parseFloat(review.overallRating as unknown as string), 0) / approvedReviewsForSpeaker.length;
        
        // Update speaker's overall rating
        await db.update(speakers)
          .set({ 
            overallRating: avgRating.toFixed(2)
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
        const avgRating = approvedReviewsForSpeaker.reduce((sum, review) => sum + parseFloat(review.overallRating as unknown as string), 0) / approvedReviewsForSpeaker.length;
        
        // Update speaker's overall rating
        await db.update(speakers)
          .set({ 
            overallRating: avgRating.toFixed(2)
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

  // Create new topic
  app.post("/api/admin/topics", async (req, res) => {
    try {
      const { name, category, slug } = req.body;
      
      if (!name?.trim()) {
        return res.status(400).json({ message: "Topic name is required" });
      }

      // Generate slug if not provided
      const finalSlug = slug || name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if topic with same name or slug already exists
      const existingTopic = await db.query.speakingTopics.findFirst({
        where: or(
          eq(speakingTopics.name, name.trim()),
          eq(speakingTopics.slug, finalSlug)
        )
      });

      if (existingTopic) {
        return res.status(400).json({ 
          message: existingTopic.name === name.trim() 
            ? "A topic with this name already exists" 
            : "A topic with this slug already exists"
        });
      }

      // Create the new topic
      const [newTopic] = await db.insert(speakingTopics)
        .values({
          name: name.trim(),
          slug: finalSlug,
          category: category || null
        })
        .returning();

      console.log(`✅ Created new topic: ${newTopic.name} (${newTopic.slug})`);
      
      res.status(201).json(newTopic);
    } catch (error) {
      console.error("Error creating topic:", error);
      res.status(500).json({ message: "Failed to create topic" });
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

  // Test email endpoint
  app.post("/api/admin/send-test-email", async (req, res) => {
    try {
      const { email, message } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      const emailService = EmailService.getInstance();
      const emailSent = await emailService.sendTestEmail(email, message);

      if (emailSent) {
        console.log(`📧 Test email sent successfully to ${email}`);
        res.json({ 
          message: "Test email sent successfully!", 
          recipient: email,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ message: "Test email failed", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Subscription Features Management
  app.get("/api/admin/subscription-features", async (req, res) => {
    try {
      const features = await storage.listSubscriptionFeatures();
      res.json(features);
    } catch (error) {
      console.error("Failed to list subscription features:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/subscription-features/:tier", async (req, res) => {
    try {
      const tier = req.params.tier;
      const features = await storage.listSubscriptionFeaturesByTier(tier);
      res.json(features);
    } catch (error) {
      console.error(`Failed to list subscription features for tier ${req.params.tier}:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/subscription-features", async (req, res) => {
    try {
      const { slug, name, description } = req.body;
      
      if (!slug || !name) {
        return res.status(400).json({ message: "Slug and name are required" });
      }
      
      const feature = await storage.createSubscriptionFeature({ slug, name, description });
      res.json(feature);
    } catch (error) {
      console.error("Failed to create subscription feature:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/subscription-features/:id", async (req, res) => {
    try {
      const featureId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedFeature = await storage.updateSubscriptionFeature(featureId, updates);
      res.json(updatedFeature);
    } catch (error) {
      console.error(`Failed to update subscription feature ${req.params.id}:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/subscription-features/:id", async (req, res) => {
    try {
      const featureId = parseInt(req.params.id);
      await storage.deleteSubscriptionFeature(featureId);
      res.json({ success: true, message: "Feature deleted successfully" });
    } catch (error) {
      console.error(`Failed to delete subscription feature ${req.params.id}:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/subscription-features/:id/assign-tier", async (req, res) => {
    try {
      const featureId = parseInt(req.params.id);
      const { tier, sortOrder, isHighlighted } = req.body;
      
      if (!tier) {
        return res.status(400).json({ message: "Tier is required" });
      }
      
      const tierFeature = await storage.assignFeatureToTier({
        featureId,
        tier,
        sortOrder: sortOrder || 0,
        isHighlighted: isHighlighted || false,
      });
      
      res.json(tierFeature);
    } catch (error) {
      console.error(`Failed to assign feature ${req.params.id} to tier:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/tier-features/:id", async (req, res) => {
    try {
      const tierFeatureId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedTierFeature = await storage.updateTierFeature(tierFeatureId, updates);
      res.json(updatedTierFeature);
    } catch (error) {
      console.error(`Failed to update tier feature ${req.params.id}:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/tier-features/:id", async (req, res) => {
    try {
      const tierFeatureId = parseInt(req.params.id);
      await storage.removeTierFeature(tierFeatureId);
      res.json({ success: true, message: "Tier feature removed successfully" });
    } catch (error) {
      console.error(`Failed to remove tier feature ${req.params.id}:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Speaker Subscriptions for Admin View
  app.get("/api/admin/speaker-subscriptions", async (req, res) => {
    try {
      const { tier, status } = req.query;
      const speakers = await storage.listSpeakerSubscriptions({
        tier: tier as string,
        status: status as string,
      });
      res.json(speakers);
    } catch (error) {
      console.error("Failed to list speaker subscriptions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Upload all DevRight logos to object storage (admin only)
  app.post("/api/admin/upload-logos", authenticateAdmin, async (req, res) => {
    try {
      const fs = await import('fs');
      const { objectStorageClient } = await import('./objectStorage');
      
      const bucketName = 'replit-objstore-b2538833-2c0e-4f8b-ac68-5d4359557493';
      const bucket = objectStorageClient.bucket(bucketName);
      
      const logos = [
        {
          local: 'attached_assets/DevRight icon - Color (1)_1763406768677.png',
          remote: 'public/devright-logo-color.png'
        },
        {
          local: 'attached_assets/DevRight icon - White_1763406768678.png',
          remote: 'public/devright-logo-white.png'
        },
        {
          local: 'attached_assets/DevRight TM - Color_1763406768678.png',
          remote: 'public/devright-logo-tm-color.png'
        }
      ];
      
      const uploaded = [];
      
      for (const logo of logos) {
        const fileBuffer = fs.readFileSync(logo.local);
        const file = bucket.file(logo.remote);
        
        await file.save(fileBuffer, {
          metadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000, immutable',
          },
        });
        
        uploaded.push(logo.remote);
      }
      
      res.json({ 
        success: true, 
        message: `Uploaded ${uploaded.length} logo variations`,
        logos: uploaded
      });
    } catch (error) {
      console.error('Failed to upload logos:', error);
      res.status(500).json({ message: "Failed to upload logos" });
    }
  });

  // Send all email templates individually (admin only)
  app.post("/api/admin/send-all-template-samples", authenticateAdmin, async (req, res) => {
    try {
      const { recipientEmail } = req.body;
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!recipientEmail || !emailRegex.test(recipientEmail)) {
        return res.status(400).json({ message: "Valid recipient email is required" });
      }

      const emailService = EmailService.getInstance();
      const { createVerificationEmail, createWelcomeEmail, createPasswordResetEmail, sendEmail } = await import('./email');
      
      const results = [];
      
      // 1. Email Verification
      const verificationEmail = createVerificationEmail(recipientEmail, "John", "sample-token-123");
      await sendEmail(verificationEmail);
      results.push("1. Email Verification");
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      
      // 2. Welcome Email
      const welcomeEmail = createWelcomeEmail(recipientEmail, "John");
      await sendEmail(welcomeEmail);
      results.push("2. Welcome Email");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Password Reset
      const resetEmail = createPasswordResetEmail(recipientEmail, "John", "reset-token-456");
      await sendEmail(resetEmail);
      results.push("3. Password Reset");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. Speaker Approval
      await emailService.sendSpeakerApproval(recipientEmail, "John", { email: recipientEmail, password: "TempPass123!" });
      results.push("4. Speaker Application Approval");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. Login Credentials
      await emailService.sendLoginCredentials(recipientEmail, "Dr. John Smith", { email: recipientEmail, password: "NewPass456!" });
      results.push("5. Login Credentials Resend");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 6. Speaker Rejection
      await emailService.sendSpeakerRejection(recipientEmail, "John", "We appreciate your application, but we're looking for speakers with more experience in the healthcare field.");
      results.push("6. Speaker Application Rejection");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 7. Inquiry Confirmation
      await emailService.sendInquiryConfirmation(recipientEmail, "Jane Client", "Dr. Sarah Johnson", 12345);
      results.push("7. Inquiry Confirmation (Client)");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 8. Admin Inquiry Notification
      const sampleInquiry = {
        id: 12345,
        clientName: "Jane Client",
        clientEmail: "jane@healthsystem.com",
        clientCompany: "Memorial Health System",
        eventType: "Medical Conference",
        eventDate: "2025-06-15",
        eventLocation: "Chicago, IL",
        budget: 5000,
        message: "We would like to invite you to speak at our annual medical conference about recent advances in cardiology.",
        createdAt: new Date()
      };
      await emailService.sendInquiryAdminNotification(sampleInquiry, "Dr. Sarah Johnson");
      results.push("8. Inquiry Admin Notification");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 9. Inquiry Status Update (Booked)
      await emailService.sendInquiryUpdate(recipientEmail, "Jane Client", "Dr. Sarah Johnson", "booked", "Dr. Johnson has confirmed and is excited to speak at your event!");
      results.push("9. Inquiry Status Update");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 10. Review Notification
      await emailService.sendReviewNotification(recipientEmail, "Dr. Sarah Johnson", "Dr. Michael Chen", 5);
      results.push("10. Review Notification");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 11. Test Email
      await emailService.sendTestEmail(recipientEmail, "This is a sample test email to verify SendGrid configuration.");
      results.push("11. Test Email");
      
      res.json({ 
        success: true, 
        message: `All 11 email templates sent individually to ${recipientEmail}`,
        templates: results
      });
    } catch (error) {
      console.error("Failed to send template samples:", error);
      res.status(500).json({ message: "Internal server error", error: String(error) });
    }
  });

  // Send email templates reference (admin only)
  app.post("/api/admin/send-template-reference", authenticateAdmin, async (req, res) => {
    try {
      const { recipientEmail } = req.body;
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!recipientEmail || !emailRegex.test(recipientEmail)) {
        return res.status(400).json({ message: "Valid recipient email is required" });
      }

      const fs = await import('fs/promises');
      const refDoc = await fs.readFile('/tmp/email_templates_reference.md', 'utf8');

      const emailService = EmailService.getInstance();
      const success = await emailService.sendEmail({
        to: recipientEmail,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@thespeakersphere.com',
        subject: 'SpeakerSphere Email Templates - Complete Reference (11 Templates)',
        text: refDoc,
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin: -40px -40px 30px -40px; }
    h2 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 30px; }
    .template-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .meta { color: #64748b; font-size: 14px; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #dc2626; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 SpeakerSphere Email Templates</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Complete Reference - 11 Templates</p>
    </div>
    
    <p><strong>Generated:</strong> November 17, 2025</p>
    <p>Comprehensive reference of all 11 email templates in SpeakerSphere platform.</p>
    
    <h2>📊 Template Categories</h2>
    <div class="template-box">
      <ul>
        <li><strong>Authentication &amp; Account:</strong> Email Verification, Welcome Email, Password Reset</li>
        <li><strong>Speaker Applications:</strong> Approval, Credentials Resend, Rejection</li>
        <li><strong>Inquiry Management:</strong> Client Confirmation, Admin Alert, Status Updates</li>
        <li><strong>Reviews &amp; Testing:</strong> Review Notification, Test Email</li>
      </ul>
    </div>
    
    <h2>Templates Summary</h2>
    
    <div class="template-box">
      <h3>1. Email Verification</h3>
      <p class="meta">server/email.ts | createVerificationEmail()</p>
      <p><strong>Subject:</strong> "Verify Your SpeakerSphere Account"</p>
      <p>24-hour secure token, purple gradient design</p>
    </div>
    
    <div class="template-box">
      <h3>2. Welcome Email</h3>
      <p class="meta">server/email.ts | createWelcomeEmail()</p>
      <p><strong>Subject:</strong> "Welcome to SpeakerSphere - Your Account is Active!"</p>
      <p>Account activation confirmation, green success design</p>
    </div>
    
    <div class="template-box">
      <h3>3. Password Reset</h3>
      <p class="meta">server/email.ts | createPasswordResetEmail()</p>
      <p><strong>Subject:</strong> "Reset Your SpeakerSphere Password"</p>
      <p>1-hour reset link, orange warning design</p>
    </div>
    
    <div class="template-box">
      <h3>4. Speaker Approval</h3>
      <p class="meta">server/email-service.ts | sendSpeakerApproval()</p>
      <p><strong>Subject:</strong> "Welcome to SpeakerSphere - Application Approved!"</p>
      <p>Login credentials with getting started checklist</p>
    </div>
    
    <div class="template-box">
      <h3>5. Login Credentials</h3>
      <p class="meta">server/email-service.ts | sendLoginCredentials()</p>
      <p><strong>Subject:</strong> "Your SpeakerSphere Login Credentials"</p>
      <p>Temporary password with security warning</p>
    </div>
    
    <div class="template-box">
      <h3>6. Speaker Rejection</h3>
      <p class="meta">server/email-service.ts | sendSpeakerRejection()</p>
      <p><strong>Subject:</strong> "SpeakerSphere Application Update"</p>
      <p>Optional feedback, encouragement to reapply</p>
    </div>
    
    <div class="template-box">
      <h3>7. Inquiry Confirmation</h3>
      <p class="meta">server/email-service.ts | sendInquiryConfirmation()</p>
      <p><strong>Subject:</strong> "Inquiry Confirmation - [Speaker Name]"</p>
      <p>Reference number with timeline and next steps</p>
    </div>
    
    <div class="template-box">
      <h3>8. Admin Inquiry Notification</h3>
      <p class="meta">server/email-service.ts | sendInquiryAdminNotification()</p>
      <p><strong>Subject:</strong> "New Speaker Inquiry - [Speaker Name]"</p>
      <p>Admin panel link with red alert design</p>
    </div>
    
    <div class="template-box">
      <h3>9. Inquiry Status Update</h3>
      <p class="meta">server/email-service.ts | sendInquiryUpdate()</p>
      <p><strong>Subject:</strong> "Inquiry Update - [Speaker Name]"</p>
      <p>Color-coded status with dynamic messages</p>
    </div>
    
    <div class="template-box">
      <h3>10. Review Notification</h3>
      <p class="meta">server/email-service.ts | sendReviewNotification()</p>
      <p><strong>Subject:</strong> "New Review Received - [Rating]/5 Stars"</p>
      <p>Star rating with pending approval notice</p>
    </div>
    
    <div class="template-box">
      <h3>11. Test Email</h3>
      <p class="meta">server/email-service.ts | sendTestEmail()</p>
      <p><strong>Subject:</strong> "SpeakerSphere Email Test - Configuration Check"</p>
      <p>Configuration details with timestamp</p>
    </div>
    
    <div class="footer">
      <p><strong>Full markdown documentation in plain text</strong></p>
      <p>Version 1.0 | November 17, 2025</p>
      <p><a href="mailto:admin@thespeakersphere.com">admin@thespeakersphere.com</a></p>
    </div>
  </div>
</body>
</html>`
      });

      if (success) {
        res.json({ success: true, message: `Email templates reference sent to ${recipientEmail}` });
      } else {
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Failed to send template reference email:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/fix-speaker-emails", async (req, res) => {
    try {
      const approvedApps = await db.select()
        .from(speakerApplications)
        .where(eq(speakerApplications.status, 'approved'));
      
      const claimedMap = new Map<number, string>();
      for (const app of approvedApps) {
        if (app.createdSpeakerId) {
          claimedMap.set(app.createdSpeakerId, app.email);
        }
      }

      const linkedUsers = await db.select({ speakerId: users.speakerId, email: users.email })
        .from(users)
        .where(and(
          eq(users.accountType, 'speaker'),
          isNotNull(users.speakerId)
        ));
      const linkedUserMap = new Map<number, string>();
      for (const u of linkedUsers) {
        if (u.speakerId) {
          linkedUserMap.set(u.speakerId, u.email);
        }
      }

      const explicitFixes = new Map<number, string>([
        [1231, 'wmartin@devright.com'],
        [1641, 'alex@zahnlab.com'],
        [1795, 'alex@zahnlab.com'],
      ]);

      const allSpeakers = await db.select({ id: speakers.id, email: speakers.email }).from(speakers);
      let cleared = 0;
      let updated = 0;

      for (const speaker of allSpeakers) {
        const appEmail = claimedMap.get(speaker.id);
        const userEmail = linkedUserMap.get(speaker.id);
        const explicitEmail = explicitFixes.get(speaker.id);
        const claimedEmail = appEmail || userEmail || explicitEmail;

        if (claimedEmail) {
          if (speaker.email !== claimedEmail) {
            await db.update(speakers).set({ email: claimedEmail }).where(eq(speakers.id, speaker.id));
            updated++;
          }
        } else if (speaker.email) {
          await db.update(speakers).set({ email: '' }).where(eq(speakers.id, speaker.id));
          cleared++;
        }
      }

      res.json({
        success: true,
        message: `Fixed speaker emails: ${cleared} cleared, ${updated} updated to match applications/accounts`,
        cleared,
        updated,
        totalSpeakers: allSpeakers.length,
        claimedByApp: claimedMap.size,
        claimedByUser: linkedUserMap.size
      });
    } catch (error) {
      console.error("Failed to fix speaker emails:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/all-content", async (_req, res) => {
    try {
      const allContent = await db
        .select({
          id: speakerContent.id,
          speakerId: speakerContent.speakerId,
          fileName: speakerContent.fileName,
          originalName: speakerContent.originalName,
          fileSize: speakerContent.fileSize,
          fileType: speakerContent.fileType,
          category: speakerContent.category,
          description: speakerContent.description,
          isPublic: speakerContent.isPublic,
          requiresAccessCode: speakerContent.requiresAccessCode,
          downloadCount: speakerContent.downloadCount,
          copyrightAcknowledgedAt: speakerContent.copyrightAcknowledgedAt,
          createdAt: speakerContent.createdAt,
          speakerName: speakers.name,
          speakerSlug: speakers.slug,
        })
        .from(speakerContent)
        .leftJoin(speakers, eq(speakerContent.speakerId, speakers.id))
        .orderBy(desc(speakerContent.createdAt));

      res.json(allContent);
    } catch (error) {
      console.error("Failed to fetch all content:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}