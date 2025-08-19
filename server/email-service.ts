import sgMail from '@sendgrid/mail';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface SpeakerWelcomeEmailData {
  firstName: string;
  lastName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

export class EmailService {
  private static isConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  static generateTemporaryPassword(): string {
    // Generate a secure 12-character temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  static async sendSpeakerWelcomeEmail(data: SpeakerWelcomeEmailData): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 SendGrid not configured - would send welcome email to:', {
        to: data.email,
        subject: 'Welcome to SpeakerSphere - Your Account is Approved!',
        temporaryPassword: data.temporaryPassword,
        loginUrl: data.loginUrl
      });
      return true; // Return true to indicate the process completed successfully
    }

    const msg = {
      to: data.email,
      from: 'speakers@devright.com', // Use verified sender
      subject: 'Welcome to SpeakerSphere - Your Account is Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .important { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to SpeakerSphere!</h1>
              <p>Your speaker application has been approved</p>
            </div>
            <div class="content">
              <p>Dear Dr. ${data.firstName} ${data.lastName},</p>
              
              <p>Congratulations! We're excited to inform you that your speaker application has been <strong>approved</strong> and your SpeakerSphere account is now active.</p>
              
              <div class="credentials-box">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${data.temporaryPassword}</code></p>
              </div>
              
              <div class="important">
                <strong>Important:</strong> Please log in and change your password immediately for security purposes.
              </div>
              
              <a href="${data.loginUrl}" class="cta-button">Login to Your Account</a>
              
              <h3>What's Next?</h3>
              <ul>
                <li>Complete your speaker profile with additional details</li>
                <li>Upload professional headshots and speaking videos</li>
                <li>Set your speaking topics and availability</li>
                <li>Start receiving inquiries from event organizers</li>
              </ul>
              
              <p>As an approved speaker, you now have access to:</p>
              <ul>
                <li>📊 Analytics dashboard to track profile views and inquiries</li>
                <li>📅 Booking management system</li>
                <li>🎥 Video portfolio showcase</li>
                <li>📈 Performance insights and ratings</li>
              </ul>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Welcome to the SpeakerSphere community!</p>
              
              <p>Best regards,<br>
              The SpeakerSphere Team<br>
              <a href="mailto:speakers@devright.com">speakers@devright.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to SpeakerSphere!
        
        Dear Dr. ${data.firstName} ${data.lastName},
        
        Congratulations! Your speaker application has been approved and your account is now active.
        
        Login Credentials:
        Email: ${data.email}
        Temporary Password: ${data.temporaryPassword}
        
        Please log in at ${data.loginUrl} and change your password immediately.
        
        As an approved speaker, you now have access to analytics, booking management, video portfolio showcase, and performance insights.
        
        Welcome to the SpeakerSphere community!
        
        Best regards,
        The SpeakerSphere Team
      `
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Welcome email sent successfully to ${data.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  static async sendApplicationStatusEmail(
    email: string, 
    firstName: string, 
    lastName: string, 
    status: string, 
    adminNotes?: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 SendGrid not configured - would send status email to:', {
        to: email,
        name: `${firstName} ${lastName}`,
        status: status,
        adminNotes: adminNotes || 'No additional notes'
      });
      return true; // Return true to indicate the process completed successfully
    }

    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';
    
    let subject = 'SpeakerSphere Application Update';
    let statusMessage = 'Your application status has been updated';
    
    if (isApproved) {
      subject = 'Welcome to SpeakerSphere - Application Approved!';
      statusMessage = '🎉 Congratulations! Your application has been approved.';
    } else if (isRejected) {
      subject = 'SpeakerSphere Application Status';
      statusMessage = 'We appreciate your interest in joining SpeakerSphere.';
    }

    const msg = {
      to: email,
      from: 'speakers@devright.com',
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>SpeakerSphere Application Status</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>${statusMessage}</p>
          <p><strong>Status:</strong> ${status.toUpperCase()}</p>
          ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ''}
          ${isRejected ? '<p>Please feel free to reapply in the future when you meet our criteria.</p>' : ''}
          <p>Best regards,<br>The SpeakerSphere Team</p>
        </div>
      `,
      text: `
        SpeakerSphere Application Status
        
        Dear ${firstName} ${lastName},
        
        ${statusMessage}
        
        Status: ${status.toUpperCase()}
        ${adminNotes ? `Notes: ${adminNotes}` : ''}
        
        Best regards,
        The SpeakerSphere Team
      `
    };

    try {
      await sgMail.send(msg);
      console.log(`📧 Status email sent to ${email} for status: ${status}`);
      return true;
    } catch (error) {
      console.error('Failed to send status email:', error);
      return false;
    }
  }
}