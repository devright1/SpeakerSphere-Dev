import sgMail from '@sendgrid/mail';
import { getEmailLogoHeader } from './email-logo';

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
    const logoHeader = await getEmailLogoHeader();
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
    const logoHeader = await getEmailLogoHeader();
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
    const logoHeader = await getEmailLogoHeader();
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'Welcome to SpeakerSphere - Application Approved!',
      html: `
        ${logoHeader}
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Congratulations! Your application has been approved</h2>
          
          <p>Dear ${firstName},</p>
          
          <p>We're excited to welcome you to the SpeakerSphere platform! Your speaker application has been approved and your profile is now live.</p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">Your Login Credentials</h3>
            <p><strong>Email:</strong> ${credentials.email}</p>
            <p><strong>Password:</strong> ${credentials.password}</p>
            <p style="color: #dc2626; font-size: 14px;">Please change your password after your first login for security.</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #475569; margin-top: 0;">Getting Started</h3>
            <ul style="color: #64748b;">
              <li>Log in to your speaker dashboard</li>
              <li>Complete your profile with additional details</li>
              <li>Upload professional photos and videos</li>
              <li>Manage your content visibility settings</li>
              <li>Respond to booking inquiries</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://thespeakersphere.com/auth" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          
          <p>Welcome to the SpeakerSphere community!</p>
          
          <p>Best regards,<br>The SpeakerSphere Team</p>
        </div>
      `,
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

  // Resend login credentials to approved speaker
  async sendLoginCredentials(email: string, speakerName: string, credentials: { email: string; password: string }): Promise<boolean> {
    const logoHeader = await getEmailLogoHeader();
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'Your SpeakerSphere Login Credentials',
      html: `
        ${logoHeader}
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your SpeakerSphere Login Information</h2>
          
          <p>Dear ${speakerName},</p>
          
          <p>As requested, here are your login credentials for accessing your SpeakerSphere dashboard.</p>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; margin-top: 0;">Your Login Credentials</h3>
            <p><strong>Email:</strong> ${credentials.email}</p>
            <p><strong>Temporary Password:</strong> <span style="font-family: monospace; background: white; padding: 4px 8px; border-radius: 4px;">${credentials.password}</span></p>
            <p style="color: #dc2626; font-size: 14px; margin-top: 15px;">⚠️ For security, please change your password immediately after logging in.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://thespeakersphere.com/for-speakers" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #475569; margin-top: 0;">Quick Access</h3>
            <ul style="color: #64748b;">
              <li>Manage your speaker profile</li>
              <li>Upload photos and videos</li>
              <li>View and respond to inquiries</li>
              <li>Update your content settings</li>
            </ul>
          </div>
          
          <p>If you didn't request these credentials or have any questions, please contact us immediately.</p>
          
          <p>Best regards,<br>The SpeakerSphere Team</p>
        </div>
      `,
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
    const logoHeader = await getEmailLogoHeader();
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'SpeakerSphere Application Update',
      html: `
        ${logoHeader}
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #475569;">Thank you for your interest in SpeakerSphere</h2>
          
          <p>Dear ${firstName},</p>
          
          <p>Thank you for taking the time to apply to become a speaker on our platform. After careful review, we have decided not to move forward with your application at this time.</p>
          
          ${reason ? `
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Feedback</h3>
            <p style="color: #64748b;">${reason}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #475569; margin-top: 0;">Next Steps</h3>
            <ul style="color: #64748b;">
              <li>You're welcome to reapply in the future</li>
              <li>Consider gaining additional speaking experience</li>
              <li>Build your professional portfolio</li>
              <li>Connect with us on social media for updates</li>
            </ul>
          </div>
          
          <p>We appreciate your interest in our platform and wish you the best in your speaking career.</p>
          
          <p>Best regards,<br>The SpeakerSphere Team</p>
        </div>
      `,
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
    const logoHeader = await getEmailLogoHeader();
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
    const logoHeader = await getEmailLogoHeader();
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
    const logoHeader = await getEmailLogoHeader();
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
    const logoHeader = await getEmailLogoHeader();
    const verificationUrl = `${process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
    
    const template: EmailTemplate = {
      to: email,
      from: FROM_EMAIL,
      subject: 'Welcome to SpeakerSphere - Please Verify Your Email',
      html: `
        ${logoHeader}
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">🎉 Congratulations! Your application has been approved</h2>
          
          <p>Dear ${firstName},</p>
          
          <p>We're excited to welcome you to the SpeakerSphere platform! Your speaker application has been approved and your profile is now live.</p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">Your Login Credentials</h3>
            <p><strong>Email:</strong> ${credentials.email}</p>
            <p><strong>Password:</strong> ${credentials.password}</p>
            <p style="color: #dc2626; font-size: 14px;">Please change your password after your first login for security.</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #d97706; margin-top: 0;">⚠️ Email Verification Required</h3>
            <p style="color: #92400e;">Before you can log in, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                ✅ Verify Email Address
              </a>
            </div>
            
            <p style="color: #92400e; font-size: 14px;">This verification link will expire in 24 hours. You will not be able to log in until your email is verified.</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #475569; margin-top: 0;">After Email Verification</h3>
            <ul style="color: #64748b;">
              <li>Log in to your speaker dashboard</li>
              <li>Complete your profile with additional details</li>
              <li>Upload professional photos and videos</li>
              <li>Manage your content visibility settings</li>
              <li>Respond to booking inquiries</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; font-size: 14px;">After verifying your email, you can access your dashboard:</p>
            <a href="https://thespeakersphere.com/auth" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          
          <p>Welcome to the SpeakerSphere community!</p>
          
          <p>Best regards,<br>The SpeakerSphere Team</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="font-size: 12px; color: #94a3b8;">
            If you can't click the verification button, copy and paste this link into your browser:<br>
            ${verificationUrl}
          </p>
        </div>
      `,
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