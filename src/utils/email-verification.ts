/**
 * Email Service for Authentication
 * Handles verification emails, OTP sending, and password reset emails
 */

export interface VerificationEmailPayload {
  userId: string;
  email: string;
  verificationToken: string;
  userName: string;
}

export interface PasswordResetEmailPayload {
  email: string;
  resetToken: string;
  userName: string;
}

/**
 * Send verification email after signup
 * This is called after user creates account with security questions
 * 
 * Backend Implementation needed:
 * POST /api/auth/send-verification-email
 * 
 * @param payload Verification email details
 * @returns Promise<boolean> true if email sent successfully
 */
export const sendVerificationEmail = async (
  payload: VerificationEmailPayload
): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send verification email');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

/**
 * Send password reset email
 * Used in forgot password flow
 * 
 * Backend Implementation needed:
 * POST /api/auth/send-password-reset-email
 * 
 * @param payload Password reset email details
 * @returns Promise<boolean> true if email sent successfully
 */
export const sendPasswordResetEmail = async (
  payload: PasswordResetEmailPayload
): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/send-password-reset-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send password reset email');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Verify email token
 * Called when user clicks verification link in email
 * 
 * Backend Implementation needed:
 * POST /api/auth/verify-email-token
 * 
 * @param userId User ID from URL
 * @param token Verification token from URL
 * @returns Promise<boolean> true if token is valid and email verified
 */
export const verifyEmailToken = async (
  userId: string,
  token: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/verify-email-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, token }),
    });

    if (!response.ok) {
      console.error('Failed to verify email token');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying email token:', error);
    return false;
  }
};

/**
 * Store security questions after signup
 * This stores the user's 3 security questions and hashed answers
 * 
 * Backend Implementation needed:
 * POST /api/auth/store-security-questions
 * 
 * @param userId User ID
 * @param questions Array of { question_id, question_text, answer }
 * @returns Promise<boolean> true if stored successfully
 */
export const storeSecurityQuestions = async (
  userId: string,
  questions: Array<{
    question_id: string;
    question_text: string;
    answer: string;
  }>
): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/store-security-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        questions, // Backend must hash these with bcrypt before storing
      }),
    });

    if (!response.ok) {
      console.error('Failed to store security questions');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error storing security questions:', error);
    return false;
  }
};

// ============================================================================
// EMAIL TEMPLATES (backend should use these)
// ============================================================================

/**
 * HTML Template for Verification Email
 * Backend should use this template with interpolated values
 */
export const getVerificationEmailHTML = (
  userName: string,
  verificationLink: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; border-radius: 4px; margin: 15px 0; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Bee.Dr! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for creating your account! To complete your signup, please verify your email address by clicking the button below:</p>
            
            <center>
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </center>
            
            <p>Or copy this link:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">
              ${verificationLink}
            </p>
            
            <div class="warning">
              ⏱️ <strong>This link expires in 24 hours</strong>
              <br />
              🔒 For account security, never share this link with anyone
              <br />
              ❓ If you didn't create this account, please ignore this email
            </div>
            
            <p>Once verified, you can sign in and start using Bee.Dr to:</p>
            <ul>
              <li>🏥 Access AI-powered health reports</li>
              <li>📊 Track your health metrics</li>
              <li>🔐 Secure your medical data with encryption</li>
            </ul>
            
            <p>If you have any questions, please contact support@bee.dr</p>
            
            <p>Best regards,<br/>The Bee.Dr Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Bee.Dr. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * HTML Template for Password Reset Email
 */
export const getPasswordResetEmailHTML = (
  userName: string,
  resetLink: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; border-radius: 4px; margin: 15px 0; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password 🔐</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your Bee.Dr password. Click the button below to create a new password:</p>
            
            <center>
              <a href="${resetLink}" class="button">Reset Password</a>
            </center>
            
            <p>Or copy this link:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">
              ${resetLink}
            </p>
            
            <div class="warning">
              ⏱️ <strong>This link expires in 30 minutes</strong>
              <br />
              🔒 For security, use a strong password with uppercase, lowercase, numbers, and special characters
              <br />
              ❓ If you didn't request this reset, ignore this email and change your password
            </div>
            
            <p><strong>Password Requirements:</strong></p>
            <ul style="font-size: 14px;">
              <li>At least 8 characters</li>
              <li>One uppercase letter (A-Z)</li>
              <li>One lowercase letter (a-z)</li>
              <li>One number (0-9)</li>
              <li>One special character (!@#$%^&*)</li>
            </ul>
            
            <p>If you have questions, please contact support@bee.dr</p>
            
            <p>Best regards,<br/>The Bee.Dr Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Bee.Dr. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Plain text template for verification email (fallback for clients without HTML support)
 */
export const getVerificationEmailText = (
  userName: string,
  verificationLink: string
): string => {
  return `
Welcome to Bee.Dr!

Hi ${userName},

Thank you for creating your account! To complete your signup, please visit this link to verify your email:

${verificationLink}

This link expires in 24 hours for security reasons.

If you didn't create this account, please ignore this email.

Best regards,
The Bee.Dr Team

---
© 2024 Bee.Dr. All rights reserved.
  `;
};

/**
 * Plain text template for password reset email
 */
export const getPasswordResetEmailText = (
  userName: string,
  resetLink: string
): string => {
  return `
Reset Your Password

Hi ${userName},

We received a request to reset your Bee.Dr password. Visit this link to create a new password:

${resetLink}

This link expires in 30 minutes for security.

Password Requirements:
- At least 8 characters
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)
- One special character (!@#$%^&*)

If you didn't request this reset, ignore this email.

Best regards,
The Bee.Dr Team

---
© 2024 Bee.Dr. All rights reserved.
  `;
};
