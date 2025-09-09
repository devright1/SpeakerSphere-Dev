import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is required');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email configuration - use environment variable or fallback to verified sender
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'speakers@devright.com';
const FROM_NAME = 'SpeakerSphere Reviews';

// Get the correct domain for Replit deployment
function getDomain(): string {
  // Try various Replit environment variables
  if (process.env.REPLIT_DOMAIN) {
    return `https://${process.env.REPLIT_DOMAIN}`;
  }
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`;
  }
  // Fallback to localhost for local development
  return 'http://localhost:5000';
}

// Generate secure verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Calculate token expiration (24 hours from now)
export function getTokenExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration;
}

// Email verification template
export function createVerificationEmail(
  userEmail: string, 
  userName: string, 
  verificationToken: string
) {
  
  const verificationUrl = `${getDomain()}/verify-email?token=${verificationToken}`;
  
  return {
    to: userEmail,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: 'Verify Your SpeakerSphere Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SpeakerSphere!</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>Thank you for joining SpeakerSphere Reviews, the premier platform for connecting healthcare professionals with top medical speakers.</p>
            <p>To complete your registration and start exploring our community of expert speakers, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>Browse and search our extensive speaker database</li>
              <li>Read detailed speaker profiles and reviews</li>
              <li>Submit inquiries to speakers</li>
              <li>Leave reviews for speakers you've worked with</li>
              <li>Bookmark your favorite speakers</li>
            </ul>
            <p>If you didn't create this account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The SpeakerSphere Team</p>
            <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${userName},
      
      Welcome to SpeakerSphere Reviews! To complete your registration, please verify your email address by visiting this link:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      Once verified, you'll have full access to browse speakers, read reviews, and submit inquiries.
      
      If you didn't create this account, you can safely ignore this email.
      
      Best regards,
      The SpeakerSphere Team
    `,
  };
}

// Welcome email after verification
export function createWelcomeEmail(userEmail: string, userName: string) {
  return {
    to: userEmail,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: 'Welcome to SpeakerSphere - Your Account is Active!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Account Verified!</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>Congratulations! Your SpeakerSphere account has been successfully verified and is now active.</p>
            <p>You now have full access to all platform features. Here's what you can do:</p>
            <ul>
              <li><strong>Discover Speakers:</strong> Browse our database of verified medical speakers</li>
              <li><strong>Advanced Search:</strong> Filter by specialty, location, topics, and ratings</li>
              <li><strong>Read Reviews:</strong> Access detailed speaker reviews from healthcare professionals</li>
              <li><strong>Submit Inquiries:</strong> Connect directly with speakers for your events</li>
              <li><strong>Leave Reviews:</strong> Share your experiences with speakers you've worked with</li>
              <li><strong>Manage Favorites:</strong> Bookmark speakers for easy access</li>
            </ul>
            <div style="text-align: center;">
              <a href="${getDomain()}" class="button">Start Exploring</a>
            </div>
            <p>Thank you for joining our community of healthcare professionals. We're excited to help you find the perfect speakers for your events!</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The SpeakerSphere Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${userName},
      
      Congratulations! Your SpeakerSphere account has been successfully verified and is now active.
      
      You now have full access to browse speakers, read reviews, submit inquiries, and manage your favorites.
      
      Visit ${getDomain()} to start exploring.
      
      Thank you for joining our community!
      
      Best regards,
      The SpeakerSphere Team
    `,
  };
}

// Password reset email
export function createPasswordResetEmail(
  userEmail: string, 
  userName: string, 
  resetToken: string
) {
  
  const resetUrl = `${getDomain()}/reset-password?token=${resetToken}`;
  
  return {
    to: userEmail,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: 'Reset Your SpeakerSphere Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>We received a request to reset your SpeakerSphere account password.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f59e0b;">${resetUrl}</p>
            <p><strong>This reset link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The SpeakerSphere Team</p>
            <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${userName},
      
      We received a request to reset your SpeakerSphere account password.
      
      Click this link to create a new password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this reset, you can safely ignore this email.
      
      Best regards,
      The SpeakerSphere Team
    `,
  };
}

// Send email function with error handling
export async function sendEmail(emailData: any): Promise<boolean> {
  try {
    await sgMail.send(emailData);
    console.log(`Email sent successfully to ${emailData.to}`);
    return true;
  } catch (error: any) {
    console.error('Email sending failed:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    return false;
  }
}