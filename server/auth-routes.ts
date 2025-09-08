import express, { type Request, Response } from "express";
import bcrypt from "bcryptjs";
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

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          message: "An account with this email already exists"
        });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user with verified email (verification temporarily disabled)
      const newUser = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        title: title || '',
        company: company || '',
        emailVerified: true
      });

      // Generate verification token and send email
      const verificationToken = generateVerificationToken();
      const tokenExpiration = getTokenExpiration();

      // Save verification token
      await storage.setEmailVerificationToken(newUser.id, verificationToken, tokenExpiration);

      // Send verification email
      const emailData = createVerificationEmail(email, firstName, verificationToken);
      const emailSent = await sendEmail(emailData);

      if (!emailSent) {
        console.error('Failed to send verification email to:', email);
        // Continue anyway - user can resend verification
      }

      res.status(201).json({
        message: "Account created successfully! You can now log in.",
        userId: newUser.id,
        emailSent
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

// Password reset request
router.post("/forgot-password",
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
          message: "If an account with this email exists, a password reset email has been sent."
        });
      }

      // Generate reset token (shorter expiration - 1 hour)
      const resetToken = generateVerificationToken();
      const tokenExpiration = new Date();
      tokenExpiration.setHours(tokenExpiration.getHours() + 1);

      // Save reset token (reusing verification token field)
      await storage.setEmailVerificationToken(user.id, resetToken, tokenExpiration);

      // Send password reset email
      const emailData = createPasswordResetEmail(user.email, user.firstName, resetToken);
      const emailSent = await sendEmail(emailData);

      res.json({
        message: "Password reset email sent! Please check your inbox.",
        emailSent
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        message: "Failed to process password reset request. Please try again."
      });
    }
  }
);

// Password reset with token
router.post("/reset-password",
  rateLimiters.auth,
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
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

      // Find user by reset token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired reset token"
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update password and clear reset token
      await storage.updateUserPassword(user.id, passwordHash);
      await storage.clearVerificationToken(user.id);

      res.json({
        message: "Password reset successfully! You can now log in with your new password."
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        message: "Password reset failed. Please try again."
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

      // Email verification temporarily disabled
      // if (!user.emailVerified) {
      //   return res.status(403).json({
      //     message: "Please verify your email address before logging in. Check your inbox for a verification email.",
      //     emailVerified: false,
      //     userId: user.id
      //   });
      // }

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