/**
 * Email Service for Authentication
 * Handles password reset, verification emails, etc.
 */

export interface EmailPayload {
  email: string;
  resetLink?: string;
  otp?: string;
  userName?: string;
}

/**
 * Send password reset email with secure token
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string = 'User'
): Promise<boolean> {
  try {
    // In production, this would call your email service
    // (SendGrid, AWS SES, Supabase Email, etc.)
    
    const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
    
    // For now, we'll console log to demonstrate
    console.log('📧 Password Reset Email:');
    console.log(`To: ${email}`);
    console.log(`Subject: Reset Your Bee.dr Password`);
    console.log(`Link: ${resetLink}`);
    console.log('Token expires in 15 minutes');
    
    // TODO: Integrate with Supabase Email or SendGrid
    // const response = await fetch('/api/auth/send-reset-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, resetToken, userName })
    // });
    
    // return response.ok;
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

/**
 * Send OTP via SMS for password reset
 */
export async function sendPasswordResetOTP(
  phone: string,
  otp: string
): Promise<boolean> {
  try {
    // In production, use Twilio, AWS SNS, or similar
    console.log('📱 Password Reset OTP:');
    console.log(`To: +${phone}`);
    console.log(`OTP: ${otp}`);
    console.log('OTP expires in 5 minutes');
    
    // TODO: Integrate with Twilio or similar SMS service
    // const response = await fetch('/api/auth/send-otp', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ phone, otp })
    // });
    
    // return response.ok;
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

/**
 * Email template for password reset link
 */
export function getPasswordResetEmailTemplate(
  resetLink: string,
  userName: string = 'User'
): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d9668 0%, #0a7a52 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { padding: 20px; line-height: 1.6; color: #333; }
          .button { display: inline-block; background: #0d9668; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; border-radius: 4px; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>We received a request to reset your Bee.dr password. Click the button below to create a new password:</p>
            <center>
              <a href="${resetLink}" class="button">Reset Password</a>
            </center>
            <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
            <div class="warning">
              ⏱️ <strong>This link expires in 15 minutes</strong> for security reasons.
            </div>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>Stay healthy! 💚<br>The Bee.dr Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Bee.dr. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
