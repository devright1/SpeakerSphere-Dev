import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import sanitizeHtml from 'sanitize-html';
import DOMPurify from 'dompurify';
import { body, param, query, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import { fileTypeFromBuffer } from 'file-type';

// Use DOMPurify with JSDOM for server-side sanitization
let purify: any;
try {
  const { JSDOM } = require('jsdom');
  const window = new JSDOM('').window;
  purify = DOMPurify(window as any);
} catch {
  // Fallback if JSDOM is not available
  purify = { sanitize: (text: string) => text };
}

// Input sanitization utilities
export class SecurityUtils {
  // Sanitize HTML content (for reviews, descriptions, etc.)
  static sanitizeHtml(content: string): string {
    return sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
      allowedSchemes: ['http', 'https'],
    });
  }

  // Sanitize plain text (removes all HTML)
  static sanitizeText(text: string): string {
    return purify.sanitize(text, { ALLOWED_TAGS: [] });
  }

  // Validate and sanitize email
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  // Sanitize file names
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  // Validate file types securely
  static async validateFileType(buffer: Buffer, allowedTypes: string[]): Promise<boolean> {
    try {
      const fileType = await fileTypeFromBuffer(buffer);
      if (!fileType) return false;
      return allowedTypes.includes(fileType.mime);
    } catch {
      return false;
    }
  }

  // Check file size
  static validateFileSize(size: number, maxSizeMB: number): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return size <= maxBytes;
  }
}

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Configure to work with Replit's proxy setup
    validate: {
      trustProxy: false, // Disable the strict trust proxy validation
      xForwardedForHeader: false // Disable X-Forwarded-For validation
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Specific rate limiters
export const rateLimiters = {
  // General API rate limit: 1000 requests per 15 minutes (increased for normal browsing)
  general: createRateLimit(15 * 60 * 1000, 1000),
  
  // Auth endpoints: 10 attempts per 15 minutes
  auth: createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'),
  
  // Review submissions: 3 reviews per hour
  reviews: createRateLimit(60 * 60 * 1000, 3, 'Too many review submissions'),
  
  // File uploads: 100 uploads per hour
  uploads: createRateLimit(60 * 60 * 1000, 100, 'Too many file uploads'),
  
  // Search: 100 searches per minute (increased for better UX)
  search: createRateLimit(60 * 1000, 100, 'Too many search requests'),
  
  // Contact/inquiry: 1000 messages per hour (increased for testing)
  contact: createRateLimit(60 * 60 * 1000, 1000, 'Too many contact attempts')
};

// Helmet configuration for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https://api.stripe.com", "https://www.google-analytics.com", "https://analytics.google.com", "https://www.googletagmanager.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"], // Allow Stripe iframes
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Common validation rules
export const validators = {
  // Speaker profile validation
  speakerProfile: [
    body('name').trim().isLength({ min: 2, max: 100 }).escape(),
    body('bio').optional().isLength({ max: 2000 }).customSanitizer(SecurityUtils.sanitizeHtml),
    body('expertise').optional().isArray({ max: 20 }),
    body('expertise.*').trim().isLength({ max: 50 }).escape(),
    body('location').optional().trim().isLength({ max: 100 }).escape(),
    body('website').optional().isURL({ protocols: ['http', 'https'] }),
    body('email').isEmail(),
    body('languages').optional().isArray({ max: 10 }),
    body('languages.*').trim().isLength({ max: 30 }).escape()
  ],

  speakerApplication: [
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required and must be between 1-50 characters').escape(),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be between 1-50 characters').escape(),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().isLength({ min: 1, max: 20 }).withMessage('Phone number is required').escape(),
    body('website').optional().custom((value) => {
      // Allow empty, null, undefined, or valid URLs
      return !value || value === '' || value.trim() === '' || /^https?:\/\/.+/.test(value);
    }),
    body('title').trim().isLength({ min: 1, max: 20 }).withMessage('Professional title is required').escape(),
    body('specialty').trim().isLength({ min: 1, max: 100 }).withMessage('Specialty is required').escape(),
    body('yearsExperience').trim().isLength({ min: 1, max: 20 }).withMessage('Years of experience is required').escape(),
    body('credentials').trim().isLength({ min: 1, max: 500 }).withMessage('Credentials are required').escape(),
    body('selectedCategories').optional().isArray({ max: 10 }),
    body('selectedCategories.*').optional().trim().isLength({ max: 100 }).escape(),
    body('selectedDisciplineId').isInt().withMessage('Please select a discipline'),
    body('selectedCategoryIds').isArray({ min: 1, max: 3 }).withMessage('Please select between 1 and 3 categories'),
    body('selectedCategoryIds.*').isInt().withMessage('Category IDs must be valid integers'),
    body('selectedTopicIds').optional().isArray({ max: 3 }).withMessage('You may select up to 3 speaking topics'),
    body('selectedTopicIds.*').optional().isInt().withMessage('Topic IDs must be valid integers'),
    body('specificTopics').trim().isLength({ min: 1, max: 1000 }).withMessage('Please describe your specific topics').escape(),
    body('previousExperience').trim().isLength({ min: 1, max: 2000 }).withMessage('Previous speaking experience is required').escape(),
    body('availableFormats').isArray({ min: 1, max: 10 }).withMessage('Please select at least one speaking format'),
    body('availableFormats.*').trim().isLength({ max: 100 }).escape(),
    body('travelWillingness').trim().isLength({ min: 1, max: 100 }).withMessage('Travel willingness is required').escape(),
    body('biography').trim().isLength({ min: 1, max: 2000 }).withMessage('Biography is required').escape(),
    body('specialRequirements').optional().custom((value) => !value || typeof value === 'string'),
    body('references').optional().custom((value) => !value || typeof value === 'string'),
    // Social media fields are optional - allow empty values
    body('instagramUrl').optional().custom((value) => {
      // Allow empty, null, undefined, or valid URLs starting with http/https
      return !value || value === '' || value.trim() === '' || /^https?:\/\/.+/.test(value);
    }),
    body('twitterUrl').optional().custom((value) => {
      // Allow empty, null, undefined, or valid URLs starting with http/https
      return !value || value === '' || value.trim() === '' || /^https?:\/\/.+/.test(value);
    }),
    body('facebookUrl').optional().custom((value) => {
      // Allow empty, null, undefined, or valid URLs starting with http/https
      return !value || value === '' || value.trim() === '' || /^https?:\/\/.+/.test(value);
    }),
    body('linkedinUrl').optional().custom((value) => {
      // Allow empty, null, undefined, or valid URLs starting with http/https
      return !value || value === '' || value.trim() === '' || /^https?:\/\/.+/.test(value);
    })
  ],

  // Review validation
  review: [
    body('overallRating').isFloat({ min: 1, max: 5 }),
    body('contentQuality').isFloat({ min: 1, max: 5 }),
    body('deliveryStyle').isFloat({ min: 1, max: 5 }),
    body('expertise').isFloat({ min: 1, max: 5 }),
    body('engagement').isFloat({ min: 1, max: 5 }),
    body('organization').isFloat({ min: 1, max: 5 }),
    body('value').isFloat({ min: 1, max: 5 }),
    body('reviewText').trim().isLength({ min: 10, max: 2000 }).customSanitizer(SecurityUtils.sanitizeHtml),
    body('reviewerName').trim().isLength({ min: 2, max: 100 }).escape(),
    body('reviewerEmail').isEmail(),
    body('eventName').optional().trim().isLength({ max: 200 }).escape(),
    body('eventDate').optional().isISO8601()
  ],

  // Inquiry validation
  inquiry: [
    body('name').trim().isLength({ min: 2, max: 100 }).escape(),
    body('email').isEmail(),
    body('phone').optional().trim().isMobilePhone('any'),
    body('organization').optional().trim().isLength({ max: 200 }).escape(),
    body('eventDate').optional().isISO8601(),
    body('eventType').optional().trim().isLength({ max: 100 }).escape(),
    body('budget').optional().trim().isLength({ max: 100 }).escape(),
    body('message').trim().isLength({ min: 10, max: 2000 }).customSanitizer(SecurityUtils.sanitizeHtml),
    body('audienceSize').optional().isInt({ min: 1, max: 100000 })
  ],

  // Search validation
  search: [
    query('q').optional().trim().isLength({ max: 200 }).escape(),
    query('category').optional().trim().isLength({ max: 50 }).escape(),
    query('location').optional().trim().isLength({ max: 100 }).escape(),
    query('expertise').optional().trim().isLength({ max: 50 }).escape(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],

  // Topic validation
  topics: [
    body('topicIds').isArray({ min: 0, max: 50 }),
    body('topicIds.*').isInt({ min: 1 })
  ],

  // ID parameter validation
  id: [
    param('id').isInt({ min: 1 })
  ],

  // UUID validation
  uuid: [
    param('id').isUUID()
  ]
};

// File upload validation middleware
export const validateFileUpload = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const maxSizeMB = 50; // 50MB limit
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'video/mp4', 'video/mpeg', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/mp4'
  ];

  // Check file size
  if (!SecurityUtils.validateFileSize(file.size, maxSizeMB)) {
    return res.status(400).json({ 
      error: 'File too large', 
      message: `File size must be less than ${maxSizeMB}MB` 
    });
  }

  try {
    // Validate file type by content, not just extension
    const isValidType = await SecurityUtils.validateFileType(file.buffer, allowedTypes);
    if (!isValidType) {
      return res.status(400).json({ 
        error: 'Invalid file type', 
        message: 'File type not allowed or file is corrupted' 
      });
    }

    // Sanitize filename
    file.originalname = SecurityUtils.sanitizeFileName(file.originalname);
    
    next();
  } catch (error) {
    console.error('File validation error:', error);
    res.status(500).json({ error: 'File validation failed' });
  }
};

// Error handling middleware
export const handleValidationError = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Validation error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: error.message
    });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size exceeds maximum allowed size'
    });
  }
  
  next(error);
};
