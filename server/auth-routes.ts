import type { Express } from "express";
import { storage } from "./storage";
import { 
  hashPassword, 
  verifyPassword, 
  generateSessionToken, 
  generateTokenExpiry,
  isValidEmail,
  sanitizeUser,
  type AuthUser 
} from "./auth";
import { insertReviewerSchema, insertSpeakerAccountSchema } from "@shared/schema";

export function registerAuthRoutes(app: Express) {
  // Middleware to extract auth token
  const requireAuth = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.authToken;
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const user = await storage.getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }
      
      req.user = sanitizeUser(user);
      next();
    } catch (error) {
      return res.status(401).json({ message: "Authentication failed" });
    }
  };

  // Register reviewer account
  app.post("/api/auth/register/reviewer", async (req, res) => {
    try {
      const validatedData = insertReviewerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create reviewer account
      const newUser = await storage.createUser({
        ...validatedData,
        userType: 'reviewer'
      });

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = generateTokenExpiry();
      
      await storage.createUserSession({
        userId: newUser.id,
        token: sessionToken,
        expiresAt
      });

      // Set cookie and return user data
      res.cookie('authToken', sessionToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.status(201).json({
        user: sanitizeUser(newUser),
        token: sessionToken
      });
    } catch (error) {
      console.error("Reviewer registration error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Registration failed" 
      });
    }
  });

  // Register speaker account (requires existing speaker profile)
  app.post("/api/auth/register/speaker", async (req, res) => {
    try {
      const { speakerId, ...userData } = req.body;
      const validatedData = insertSpeakerAccountSchema.parse(userData);
      
      if (!speakerId) {
        return res.status(400).json({ message: "Speaker ID is required" });
      }

      // Verify speaker exists
      const speaker = await storage.getSpeaker(parseInt(speakerId));
      if (!speaker) {
        return res.status(400).json({ message: "Speaker profile not found" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Check if speaker already has an account
      const existingUserBySpeaker = await storage.getAllUsers();
      const speakerHasAccount = existingUserBySpeaker.some(user => user.speakerId === parseInt(speakerId));
      if (speakerHasAccount) {
        return res.status(400).json({ message: "This speaker profile already has an account" });
      }

      // Create speaker account
      const newUser = await storage.createSpeakerAccount(validatedData, parseInt(speakerId));

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = generateTokenExpiry();
      
      await storage.createUserSession({
        userId: newUser.id,
        token: sessionToken,
        expiresAt
      });

      // Set cookie and return user data
      res.cookie('authToken', sessionToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.status(201).json({
        user: sanitizeUser(newUser),
        speaker,
        token: sessionToken
      });
    } catch (error) {
      console.error("Speaker registration error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Registration failed" 
      });
    }
  });

  // Login for both user types
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = generateTokenExpiry();
      
      await storage.createUserSession({
        userId: user.id,
        token: sessionToken,
        expiresAt
      });

      // Set cookie and return user data
      res.cookie('authToken', sessionToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Get speaker data if user is a speaker
      let speakerData = null;
      if (user.userType === 'speaker' && user.speakerId) {
        speakerData = await storage.getSpeaker(user.speakerId);
      }

      res.json({
        user: sanitizeUser(user),
        speaker: speakerData,
        token: sessionToken
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.authToken;
      
      if (token) {
        await storage.deleteUserSession(token);
      }

      res.clearCookie('authToken');
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Get speaker data if user is a speaker
      let speakerData = null;
      if (user.userType === 'speaker' && user.speakerId) {
        speakerData = await storage.getSpeaker(user.speakerId);
      }

      res.json({
        user,
        speaker: speakerData
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Check if email is available
  app.post("/api/auth/check-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const existingUser = await storage.getUserByEmail(email);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Email check error:", error);
      res.status(500).json({ message: "Failed to check email availability" });
    }
  });

  // Verify speaker ownership (for speaker account registration)
  app.post("/api/auth/verify-speaker", async (req, res) => {
    try {
      const { speakerId, email } = req.body;
      
      if (!speakerId || !email) {
        return res.status(400).json({ message: "Speaker ID and email are required" });
      }

      // Get speaker profile
      const speaker = await storage.getSpeaker(parseInt(speakerId));
      if (!speaker) {
        return res.status(404).json({ message: "Speaker profile not found" });
      }

      // Check if speaker already has an account
      const existingUsers = await storage.getAllUsers();
      const speakerHasAccount = existingUsers.some(user => user.speakerId === parseInt(speakerId));
      
      if (speakerHasAccount) {
        return res.status(400).json({ message: "This speaker profile already has an account" });
      }

      // Basic verification - in production, you might want to verify the email matches
      // the speaker's contact information or send a verification email
      const emailMatches = speaker.email.toLowerCase() === email.toLowerCase();
      
      res.json({
        speaker: {
          id: speaker.id,
          name: speaker.name,
          title: speaker.title,
          imageUrl: speaker.imageUrl,
          verified: speaker.verified
        },
        verified: emailMatches,
        message: emailMatches 
          ? "Email verified. You can proceed with registration." 
          : "Email does not match speaker profile. Please contact support for assistance."
      });
    } catch (error) {
      console.error("Speaker verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  return requireAuth;
}