import express, { type Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import { rateLimiters } from "./security";
import { storage } from "./storage";
import { 
  generateVerificationToken, 
  getTokenExpiration, 
  createVerificationEmail, 
  createWelcomeEmail,
  createPasswordResetEmail,
  sendEmail 
} from "./email";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const router = express.Router();

// Registration with email verification
router.post("/register", 
  rateLimiters.auth, // Rate limit: 5 attempts per 15 minutes
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName')
      .trim()
      .isLength({ min: 1 })
      .withMessage('First name is required'),
    body('lastName')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Last name is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const { email, password, firstName, lastName, title, company } = req.body;

      // Check if email already exists in users, speakers, or applications  
      const existingUser = await storage.getUserByEmail(email);
      const existingSpeaker = await storage.getSpeakerByEmail(email);
      const existingApplication = await storage.getSpeakerApplicationByEmail(email);
      
      if (existingUser || existingSpeaker || existingApplication) {
        return res.status(400).json({
          message: "Submission failed. This email address is already in use. Please use a different email address or sign in."
        });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user with email verification disabled
      const newUser = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        title: title || '',
        company: company || '',
        emailVerified: true
      });

      res.status(201).json({
        message: "Account created successfully! You can now log in.",
        userId: newUser.id
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        message: "Registration failed. Please try again."
      });
    }
  }
);

// Email verification endpoint
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required"
      });
    }

    // Find user by verification token
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token"
      });
    }

    // Verify the user's email
    await storage.verifyUserEmail(user.id);

    // Send welcome email
    const welcomeEmailData = createWelcomeEmail(user.email, user.firstName);
    await sendEmail(welcomeEmailData);

    res.json({
      message: "Email verified successfully! Welcome to SpeakerSphere.",
      verified: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      message: "Email verification failed. Please try again."
    });
  }
});

// Resend verification email
router.post("/resend-verification",
  rateLimiters.auth,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Please provide a valid email address",
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({
          message: "If an account with this email exists and is unverified, a verification email has been sent."
        });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({
          message: "This email address is already verified"
        });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiration = getTokenExpiration();

      // Update verification token
      await storage.setEmailVerificationToken(user.id, verificationToken, tokenExpiration);

      // Send verification email
      const emailData = createVerificationEmail(user.email, user.firstName, verificationToken);
      const emailSent = await sendEmail(emailData);

      res.json({
        message: "Verification email sent! Please check your inbox.",
        emailSent
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        message: "Failed to resend verification email. Please try again."
      });
    }
  }
);



// Enhanced login that checks email verification
router.post("/login",
  rateLimiters.auth,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Please provide valid email and password",
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      // Check password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      // Generate session token
      const sessionToken = generateVerificationToken();
      const sessionExpiration = new Date();
      sessionExpiration.setDate(sessionExpiration.getDate() + 30); // 30 days

      // Create session
      await storage.createUserSession({
        userId: user.id,
        token: sessionToken,
        expiresAt: sessionExpiration
      });

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Return user data without sensitive information
      const { passwordHash, verificationToken, verificationTokenExpires, ...safeUser } = user;

      res.json({
        message: "Login successful",
        user: safeUser,
        token: sessionToken
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: "Login failed. Please try again."
      });
    }
  }
);

// Forgot password endpoint
router.post("/forgot-password",
  rateLimiters.auth, // Rate limit: 10 attempts per 15 minutes
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Please provide a valid email address",
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Always return success to prevent email enumeration attacks
      const successMessage = "If an account with this email exists, you will receive a password reset link shortly.";

      try {
        // Find user by email
        const user = await storage.getUserByEmail(email);
        
        if (user) {
          // Generate secure 32-byte token
          const resetToken = crypto.randomBytes(32).toString('hex');
          
          // Hash the token before storing (SHA-256)
          const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
          
          // Set 1-hour expiration
          const expires = new Date();
          expires.setHours(expires.getHours() + 1);

          // Store hashed token in database
          await storage.setPasswordResetToken(user.id, tokenHash, expires);

          // Send password reset email with raw token
          const emailData = createPasswordResetEmail(user.email, user.firstName, resetToken);
          const emailSent = await sendEmail(emailData);

          if (!emailSent) {
            console.error('Failed to send password reset email to:', email);
          }
        }
      } catch (error) {
        console.error('Password reset error:', error);
        // Don't expose error to prevent information disclosure
      }

      // Always return success message regardless of whether email exists
      res.json({
        message: successMessage
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        message: "Password reset request failed. Please try again."
      });
    }
  }
);

// Reset password endpoint
router.post("/reset-password",
  rateLimiters.auth, // Rate limit: 10 attempts per 15 minutes
  [
    body('token')
      .isLength({ min: 64, max: 64 })
      .withMessage('Invalid reset token'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const { token, password } = req.body;

      // Hash the token to match what's stored in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find user by password reset token (includes expiry check)
      const user = await storage.getUserByPasswordResetToken(tokenHash);
      
      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired reset token. Please request a new password reset."
        });
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update user password
      await storage.updateUserPassword(user.id, passwordHash);

      // Clear the reset token (one-time use)
      await storage.clearPasswordResetToken(user.id);

      // Invalidate all existing sessions for security
      await storage.invalidateAllUserSessions(user.id);

      res.json({
        message: "Password reset successful. You can now log in with your new password."
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        message: "Password reset failed. Please try again."
      });
    }
  }
);

// Logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await storage.deleteUserSession(token);
    }

    res.json({
      message: "Logged out successfully"
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: "Logout failed"
    });
  }
});

export { router as authRoutes };