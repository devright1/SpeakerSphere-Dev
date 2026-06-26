import sgMail from '@sendgrid/mail';
import { getEmailLogoHeader, getEmailWrapper } from './email-logo';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email templates and service configuration
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@thespeakersphere.com';
const ADMIN_EMAIL = 'admin@thespeakersphere.com';


// Logo rotation is now centralized in email-logo.ts



export interface EmailTemplate {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      await sgMail.send({
        to: template.to,
        from: template.from,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      console.log(`✅ Email sent successfully to ${template.to}`);
      return true;
    } catch (error) {
      console.error('❌ SendGrid email error:', error);
      return false;
    }
  }

  // Inquiry confirmation to client
  async sendInquiryConfirmation(clientEmail: string, clientName: string, speakerName: string, inquiryId: number): Promise<boolean> {
    const logoHeader = getEmailLogoHeader();
    const template: EmailTemplate = {
      to: clientEmail,
      from: FROM_EMAIL,
      subject: `Inquiry Confirmation - ${speakerName}`,
      html: `
        ${logoHeader}
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Thank you for your speaker inquiry!</h2>
          
          <p>Dear ${clientName},</p>
          
          <p>We've received your inquiry for <strong>${speakerName}</strong> and our team will review it shortly.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #475569; margin-top: 0;">What happens next?</h3>
            <ul style="color: #64748b;">
              <li>Our team will review your inquiry within 24 hours</li>
              <li>We'll contact the speaker on your behalf</li>
              <li>You'll receive an update via email with their response</li>
            </ul>
          </div>
          
          <p style="color: #64748b;">
            <strong>Inquiry Reference:</strong> #${inquiryId}<br>
            <strong>Speaker:</strong> ${speakerName}
          </p>
          
          <p>If you have any questions, feel free to reply to this email.</p>
          
          <p>Best regards,<br>The SpeakerSphere Team</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="font-size: 12px; color: #94a3b8;">
            This is an automated message from SpeakerSphere Reviews. Please do not reply directly to this email.
          </p>
        </div>
      `,
      text: `Thank you for your speaker inquiry!

Dear ${clientName},

We've received your inquiry for ${speakerName} and our team will review it shortly.

What happens next?
- Our team will review your inquiry within 24 hours
- We'll contact the speaker on your behalf  
- You'll receive an update via email with their response

Inquiry Reference: #${inquiryId}
Speaker: ${speakerName}

If you have any questions, feel free to reply to this email.

Best regards,
The SpeakerSphere Team`
    };

    return await this.sendEmail(template);
  }


  // Admin notification for new inquiry
  async sendInquiryAdminNotification(inquiry: any, speakerName: string): Promise<boolean> {
    const logoHeader = getEmailLogoHeader();
    const template: EmailTemplate = {
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: `New Speaker Inquiry - ${speakerName}`,
      html: `
        ${logoHeader}
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">New Speaker Inquiry Received</h2>
          
          <div style="background-color: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Inquiry Details</h3>
            <p><strong>Speaker:</strong> ${speakerName}</p>
            <p><strong>Client:</strong> ${inquiry.clientName}</p>
            <p><strong>Company:</strong> ${inquiry.clientCompany}</p>
            <p><strong>Email:</strong> ${inquiry.clientEmail}</p>
            <p><strong>Event Type:</strong> ${inquiry.eventType}</p>
            <p><strong>Event Date:</strong> ${inquiry.eventDate}</p>
            <p><strong>Location:</strong> ${inquiry.eventLocation}</p>
            <p><strong>Budget:</strong> $${inquiry.budget?.toLocaleString() || 'Not specified'}</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #475569; margin-top: 0;">Message:</h4>
            <p style="color: #64748b; font-style: italic;">"${inquiry.message}"</p>
          </div>
          
          <p style="color: #64748b;">
            <strong>Inquiry ID:</strong> #${inquiry.id}<br>
            <strong>Received:</strong> ${new Date(inquiry.createdAt).toLocaleDateString()}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://thespeakersphere.com/admin" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Admin Panel
            </a>
          </div>
        </div>
      `,
      text: `New Speaker Inquiry Received

Speaker: ${speakerName}
Client: ${inquiry.clientName}
Company: ${inquiry.clientCompany}
Email: ${inquiry.clientEmail}
Event Type: ${inquiry.eventType}
Event Date: ${inquiry.eventDate}
Location: ${inquiry.eventLocation}
Budget: $${inquiry.budget?.toLocaleString() || 'Not specified'}

Message: "${inquiry.message}"

Inquiry ID: #${inquiry.id}
Received: ${new Date(inquiry.createdAt).toLocaleDateString()}

View in Admin Panel: https://thespeakersphere.com/admin`
    };

    return await this.sendEmail(template);
  }

  // Speaker application approval
  async sendSpeakerApproval(email: string, firstName: string, credentials: { email: string; password: string }): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'Welcome to SpeakerSphere - Application Approved!',
      html: getEmailWrapper(`
          <h2 style="color: #1e4347; margin-top: 0; font-size: 22px;">Welcome to SpeakerSphere!</h2>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Dear ${firstName},</p>
          
          <p style="color: #3a3a3a; line-height: 1.6;">We're excited to let you know your speaker application has been <strong>approved</strong> and your profile is now live on the platform.</p>
          
          <div style="background-color: #eef4f5; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #1e4347;">
            <h3 style="color: #1e4347; margin-top: 0; font-size: 15px;">Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b8285; font-size: 13px; width: 90px;">Email</td>
                <td style="padding: 6px 0; color: #1e4347; font-weight: 600;">${credentials.email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b8285; font-size: 13px;">Password</td>
                <td style="padding: 6px 0;"><span style="font-family: 'Courier New', monospace; background: #fff; padding: 3px 8px; border-radius: 4px; border: 1px solid #d1dbdc; color: #1e4347; font-weight: 600;">${credentials.password}</span></td>
              </tr>
            </table>
            <p style="color: #8b6914; font-size: 12px; margin-top: 12px; margin-bottom: 0;">We recommend changing your password after your first login.</p>
          </div>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://thespeakersphere.com/for-speakers" 
               style="background-color: #1e4347; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 14px; letter-spacing: 0.3px;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="background-color: #f7fafa; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1e4347; margin-top: 0; font-size: 14px;">Getting Started</h3>
            <ul style="color: #4a6568; font-size: 13px; line-height: 1.8; padding-left: 18px; margin-bottom: 0;">
              <li>Complete your profile with additional details</li>
              <li>Upload professional photos and videos</li>
              <li>Manage your content visibility settings</li>
              <li>Respond to booking inquiries</li>
            </ul>
          </div>
          
          <p style="color: #6b8285; font-size: 13px;">Questions? Reply to this email and we'll be happy to help.</p>
          
          <p style="color: #3a3a3a;">Best regards,<br><strong style="color: #1e4347;">The SpeakerSphere Team</strong></p>
      `),
      text: `Congratulations! Your application has been approved

Dear ${firstName},

We're excited to welcome you to the SpeakerSphere platform! Your speaker application has been approved and your profile is now live.

Your Login Credentials:
Email: ${credentials.email}
Password: ${credentials.password}

Please change your password after your first login for security.

Getting Started:
- Log in to your speaker dashboard
- Complete your profile with additional details
- Upload professional photos and videos
- Manage your content visibility settings
- Respond to booking inquiries

Access Your Dashboard: https://thespeakersphere.com/auth

If you have any questions or need assistance, please don't hesitate to contact us.

Welcome to the SpeakerSphere community!

Best regards,
The SpeakerSphere Team`
    };

    return await this.sendEmail(template);
  }

  async sendResetCode(email: string, firstName: string, code: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'SpeakerSphere - Your Password Reset Code',
      html: getEmailWrapper(`
          <h2 style="color: #1e4347; margin-top: 0; font-size: 22px;">Password Reset Code</h2>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Hi ${firstName},</p>
          
          <p style="color: #3a3a3a; line-height: 1.6;">We received a request to reset your SpeakerSphere password. Use the code below — it expires in <strong>15 minutes</strong>.</p>
          
          <div style="background-color: #eef4f5; padding: 28px; border-radius: 8px; margin: 24px 0; text-align: center; border-left: 4px solid #1e4347;">
            <p style="color: #6b8285; font-size: 13px; margin: 0 0 12px 0; letter-spacing: 0.5px; text-transform: uppercase;">Your reset code</p>
            <span style="font-family: 'Courier New', monospace; font-size: 38px; font-weight: 700; letter-spacing: 10px; color: #1e4347; display: inline-block; padding: 8px 16px; background: #fff; border-radius: 6px; border: 2px solid #1e4347;">${code}</span>
            <p style="color: #8b6914; font-size: 12px; margin: 16px 0 0 0;">Expires in 15 minutes. Do not share this code with anyone.</p>
          </div>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Enter this code on the SpeakerSphere login page along with your new password to complete the reset.</p>
          
          <p style="color: #6b8285; font-size: 12px;">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
          
          <p style="color: #3a3a3a;">Best regards,<br><strong style="color: #1e4347;">The SpeakerSphere Team</strong></p>
      `),
      text: `SpeakerSphere Password Reset

Hi ${firstName},

Your password reset code is: ${code}

This code expires in 15 minutes. Do not share it with anyone.

If you didn't request this, you can safely ignore this email.

The SpeakerSphere Team`
    };
    return await this.sendEmail(template);
  }

  async sendPasswordReset(email: string, firstName: string, temporaryPassword: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'SpeakerSphere - Password Reset',
      html: getEmailWrapper(`
          <h2 style="color: #1e4347; margin-top: 0; font-size: 22px;">Password Reset</h2>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Dear ${firstName},</p>
          
          <p style="color: #3a3a3a; line-height: 1.6;">We received a request to reset your password. Your new temporary password is below.</p>
          
          <div style="background-color: #eef4f5; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #1e4347;">
            <h3 style="color: #1e4347; margin-top: 0; font-size: 15px;">Your New Password</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b8285; font-size: 13px; width: 90px;">Email</td>
                <td style="padding: 6px 0; color: #1e4347; font-weight: 600;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b8285; font-size: 13px;">Password</td>
                <td style="padding: 6px 0;"><span style="font-family: 'Courier New', monospace; background: #fff; padding: 3px 8px; border-radius: 4px; border: 1px solid #d1dbdc; color: #1e4347; font-weight: 600; font-size: 15px;">${temporaryPassword}</span></td>
              </tr>
            </table>
            <p style="color: #8b6914; font-size: 12px; margin-top: 12px; margin-bottom: 0;">Please log in and change your password right away.</p>
          </div>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://thespeakersphere.com/for-speakers" 
               style="background-color: #1e4347; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 14px; letter-spacing: 0.3px;">
              Log In Now
            </a>
          </div>
          
          <p style="color: #6b8285; font-size: 12px;">If you did not request this reset, you can safely ignore this email.</p>
          
          <p style="color: #3a3a3a;">Best regards,<br><strong style="color: #1e4347;">The SpeakerSphere Team</strong></p>
      `),
      text: `Password Reset Request

Dear ${firstName},

We received a request to reset your password. Your new temporary password is:

Email: ${email}
Password: ${temporaryPassword}

Please log in and change your password right away for security.

Log in at: https://thespeakersphere.com/for-speakers

If you did not request this reset, you can ignore this email.

Best regards,
The SpeakerSphere Team`
    };

    return await this.sendEmail(template);
  }

  // Resend login credentials to approved speaker
  async sendLoginCredentials(email: string, speakerName: string, credentials: { email: string; password: string }): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'Your SpeakerSphere Login Credentials',
      html: getEmailWrapper(`
          <h2 style="color: #1e4347; margin-top: 0; font-size: 22px;">Your Login Information</h2>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Dear ${speakerName},</p>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Here are your login credentials for accessing your SpeakerSphere dashboard.</p>
          
          <div style="background-color: #eef4f5; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #1e4347;">
            <h3 style="color: #1e4347; margin-top: 0; font-size: 15px;">Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b8285; font-size: 13px; width: 90px;">Email</td>
                <td style="padding: 6px 0; color: #1e4347; font-weight: 600;">${credentials.email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b8285; font-size: 13px;">Password</td>
                <td style="padding: 6px 0;"><span style="font-family: 'Courier New', monospace; background: #fff; padding: 3px 8px; border-radius: 4px; border: 1px solid #d1dbdc; color: #1e4347; font-weight: 600;">${credentials.password}</span></td>
              </tr>
            </table>
            <p style="color: #8b6914; font-size: 12px; margin-top: 12px; margin-bottom: 0;">We recommend changing your password after logging in.</p>
          </div>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://thespeakersphere.com/for-speakers" 
               style="background-color: #1e4347; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 14px; letter-spacing: 0.3px;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="color: #6b8285; font-size: 12px;">If you didn't request these credentials, please contact us immediately.</p>
          
          <p style="color: #3a3a3a;">Best regards,<br><strong style="color: #1e4347;">The SpeakerSphere Team</strong></p>
      `),
      text: `Your SpeakerSphere Login Information

Dear ${speakerName},

As requested, here are your login credentials for accessing your SpeakerSphere dashboard.

Your Login Credentials:
Email: ${credentials.email}
Temporary Password: ${credentials.password}

⚠️ For security, please change your password immediately after logging in.

Access Your Dashboard: https://thespeakersphere.com/for-speakers

Quick Access:
- Manage your speaker profile
- Upload photos and videos
- View and respond to inquiries
- Update your content settings

If you didn't request these credentials or have any questions, please contact us immediately.

Best regards,
The SpeakerSphere Team`
    };

    return await this.sendEmail(template);
  }

  // Speaker application rejection
  async sendSpeakerRejection(email: string, firstName: string, reason?: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'SpeakerSphere Application Update',
      html: getEmailWrapper(`
          <h2 style="color: #1e4347; margin-top: 0; font-size: 22px;">Application Update</h2>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Dear ${firstName},</p>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Thank you for taking the time to apply to become a speaker on our platform. After careful review, we have decided not to move forward with your application at this time.</p>
          
          ${reason ? `
          <div style="background-color: #fdf6f6; padding: 16px 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #c9a2a2;">
            <h3 style="color: #6b4545; margin-top: 0; font-size: 14px;">Feedback</h3>
            <p style="color: #4a6568; font-size: 13px; margin-bottom: 0;">${reason}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #f7fafa; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1e4347; margin-top: 0; font-size: 14px;">Next Steps</h3>
            <ul style="color: #4a6568; font-size: 13px; line-height: 1.8; padding-left: 18px; margin-bottom: 0;">
              <li>You're welcome to reapply in the future</li>
              <li>Consider gaining additional speaking experience</li>
              <li>Build your professional portfolio</li>
            </ul>
          </div>
          
          <p style="color: #3a3a3a; line-height: 1.6;">We appreciate your interest and wish you the best in your speaking career.</p>
          
          <p style="color: #3a3a3a;">Best regards,<br><strong style="color: #1e4347;">The SpeakerSphere Team</strong></p>
      `),
      text: `Thank you for your interest in SpeakerSphere

Dear ${firstName},

Thank you for taking the time to apply to become a speaker on our platform. After careful review, we have decided not to move forward with your application at this time.

${reason ? `Feedback: ${reason}` : ''}

Next Steps:
- You're welcome to reapply in the future
- Consider gaining additional speaking experience  
- Build your professional portfolio
- Connect with us on social media for updates

We appreciate your interest in our platform and wish you the best in your speaking career.

Best regards,
The SpeakerSphere Team`
    };

    return await this.sendEmail(template);
  }

  // Review submission notification
  async sendReviewNotification(speakerEmail: string, speakerName: string, reviewerName: string, rating: number): Promise<boolean> {
    const logoHeader = getEmailLogoHeader();
    const template: EmailTemplate = {
      to: speakerEmail,
      from: FROM_EMAIL,
      subject: `New Review Received - ${rating}/5 Stars`,
      html: `
        ${logoHeader}
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">You've received a new review!</h2>
          
          <p>Hello ${speakerName},</p>
          
          <p>Great news! You've received a new review on your SpeakerSphere profile.</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">Review Summary</h3>
            <p><strong>Reviewer:</strong> ${reviewerName}</p>
            <p><strong>Overall Rating:</strong> ${rating}/5 ⭐</p>
            <p style="color: #64748b; font-size: 14px;">The review is currently pending approval and will appear on your profile once verified.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://thespeakersphere.com/auth" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Your Dashboard
            </a>
          </div>
          
          <p>Keep up the excellent work!</p>
          
          <p>Best regards,<br>The SpeakerSphere Team</p>
        </div>
      `
    };

    return await this.sendEmail(template);
  }

  // Inquiry status update to client
  async sendInquiryUpdate(clientEmail: string, clientName: string, speakerName: string, status: string, message?: string): Promise<boolean> {
    const logoHeader = getEmailLogoHeader();
    const statusColors: { [key: string]: string } = {
      'responded': '#059669',
      'booked': '#059669',
      'declined': '#dc2626'
    };

    const statusMessages: { [key: string]: string } = {
      'responded': 'The speaker has responded to your inquiry',
      'booked': 'Your booking has been confirmed!',
      'declined': 'The speaker is not available for your event'
    };

    const template: EmailTemplate = {
      to: clientEmail,
      from: FROM_EMAIL,
      subject: `Inquiry Update - ${speakerName}`,
      html: `
        ${logoHeader}
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColors[status] || '#475569'};">Inquiry Status Update</h2>
          
          <p>Dear ${clientName},</p>
          
          <p>We have an update regarding your speaker inquiry for <strong>${speakerName}</strong>.</p>
          
          <div style="background-color: ${status === 'booked' ? '#ecfdf5' : status === 'declined' ? '#fef2f2' : '#f8fafc'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: ${statusColors[status] || '#475569'}; margin-top: 0;">Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</h3>
            <p>${statusMessages[status] || 'Your inquiry status has been updated.'}</p>
            ${message ? `<p style="color: #64748b; font-style: italic;">"${message}"</p>` : ''}
          </div>
          
          <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The SpeakerSphere Team</p>
        </div>
      `
    };

    return await this.sendEmail(template);
  }

  // Test email functionality
  async sendTestEmail(toEmail: string, testMessage: string = "This is a test email to verify your SendGrid configuration is working properly."): Promise<boolean> {
    const logoHeader = getEmailLogoHeader();
    const template: EmailTemplate = {
      to: toEmail,
      from: FROM_EMAIL,
      subject: 'SpeakerSphere Email Test - Configuration Check',
      html: `
        ${logoHeader}
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📧 Email System Test</h2>
          
          <p>Hello!</p>
          
          <p>${testMessage}</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">✅ Test Details</h3>
            <p><strong>From:</strong> ${FROM_EMAIL}</p>
            <p><strong>To:</strong> ${toEmail}</p>
            <p><strong>Service:</strong> SendGrid</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
          
          <p>If you receive this email, your email configuration is working correctly! 🎉</p>
          
          <p>Best regards,<br>The SpeakerSphere Team</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="font-size: 12px; color: #94a3b8;">
            This is a test email from SpeakerSphere's email system verification.
          </p>
        </div>
      `,
      text: `Email System Test
      
Hello!

${testMessage}

Test Details:
- From: ${FROM_EMAIL}
- To: ${toEmail}  
- Service: SendGrid
- Time: ${new Date().toISOString()}

If you receive this email, your email configuration is working correctly!

Best regards,
The SpeakerSphere Team

This is a test email from SpeakerSphere's email system verification.`
    };

    return await this.sendEmail(template);
  }

  // Speaker application approval with email verification
  async sendSpeakerApprovalWithVerification(email: string, firstName: string, credentials: { email: string; password: string }, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
    
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'Welcome to SpeakerSphere - Please Verify Your Email',
      html: getEmailWrapper(`
          <h2 style="color: #1e4347; margin-top: 0; font-size: 22px;">Welcome to SpeakerSphere!</h2>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Dear ${firstName},</p>
          
          <p style="color: #3a3a3a; line-height: 1.6;">Your speaker application has been <strong>approved</strong> and your profile is now live on the platform.</p>
          
          <div style="background-color: #eef4f5; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #1e4347;">
            <h3 style="color: #1e4347; margin-top: 0; font-size: 15px;">Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b8285; font-size: 13px; width: 90px;">Email</td>
                <td style="padding: 6px 0; color: #1e4347; font-weight: 600;">${credentials.email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b8285; font-size: 13px;">Password</td>
                <td style="padding: 6px 0;"><span style="font-family: 'Courier New', monospace; background: #fff; padding: 3px 8px; border-radius: 4px; border: 1px solid #d1dbdc; color: #1e4347; font-weight: 600;">${credentials.password}</span></td>
              </tr>
            </table>
            <p style="color: #8b6914; font-size: 12px; margin-top: 12px; margin-bottom: 0;">We recommend changing your password after your first login.</p>
          </div>
          
          <div style="background-color: #fdf6e3; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #c99a2e;">
            <h3 style="color: #8b6914; margin-top: 0; font-size: 15px;">Email Verification Required</h3>
            <p style="color: #6b5318; font-size: 13px;">Before you can log in, please verify your email address:</p>
            
            <div style="text-align: center; margin: 16px 0 8px;">
              <a href="${verificationUrl}" 
                 style="background-color: #1e4347; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 13px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #8b6914; font-size: 11px; margin-bottom: 0;">This link expires in 24 hours.</p>
          </div>
          
          <div style="background-color: #f7fafa; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #1e4347; margin-top: 0; font-size: 14px;">After Verification</h3>
            <ul style="color: #4a6568; font-size: 13px; line-height: 1.8; padding-left: 18px; margin-bottom: 0;">
              <li>Log in to your speaker dashboard</li>
              <li>Complete your profile with additional details</li>
              <li>Upload professional photos and videos</li>
              <li>Manage your content visibility settings</li>
            </ul>
          </div>
          
          <p style="color: #6b8285; font-size: 13px;">Questions? Reply to this email and we'll be happy to help.</p>
          
          <p style="color: #3a3a3a;">Best regards,<br><strong style="color: #1e4347;">The SpeakerSphere Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e2e8e9; margin: 24px 0;">
          <p style="font-size: 11px; color: #9bb0b3;">
            Can't click the button? Copy this link into your browser:<br>
            <span style="color: #1e4347;">${verificationUrl}</span>
          </p>
      `),
      text: `Congratulations! Your application has been approved

Dear ${firstName},

We're excited to welcome you to the SpeakerSphere platform! Your speaker application has been approved and your profile is now live.

Your Login Credentials:
Email: ${credentials.email}
Password: ${credentials.password}

Please change your password after your first login for security.

IMPORTANT: Email Verification Required
Before you can log in, please verify your email address by visiting this link:
${verificationUrl}

This verification link will expire in 24 hours. You will not be able to log in until your email is verified.

After Email Verification:
- Log in to your speaker dashboard
- Complete your profile with additional details
- Upload professional photos and videos
- Manage your content visibility settings
- Respond to booking inquiries

Dashboard URL: https://thespeakersphere.com/auth

If you have any questions or need assistance, please don't hesitate to contact us.

Welcome to the SpeakerSphere community!

Best regards,
The SpeakerSphere Team`
    };

    return await this.sendEmail(template);
  }
}