/** 
 * Backend API Endpoints for Password Reset
 * 
 * NOTE: These are template endpoints for the FastAPI backend.
 * Copy these patterns into your med-saas/backend/app/ directory
 * to complete the password reset implementation.
 */

// ============================================
// FILE: med-saas/backend/app/routes/auth.py
// ============================================

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import secrets
import hashlib
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Database models (these are imported from your DB)
from app.models import PasswordReset, PasswordResetAttempt, User

# ============================================
# DATA MODELS
# ============================================

class ForgotPasswordRequest(BaseModel):
    email: str
    method: str = "email"  # "email" or "phone"

class VerifyResetRequest(BaseModel):
    token: str
    type: str = "email"

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# ============================================
# REQUEST PASSWORD RESET
# ============================================

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    req: Request,
    db: Session = Depends(get_db)
):
    """
    Initiate password reset flow
    
    Request a password reset token via email or SMS.
    Returns generic response to prevent user enumeration.
    
    Rate Limit: 5 requests per hour per user/IP
    """
    
    # Get client IP
    client_ip = req.client.host
    
    # Validate email format
    if not is_valid_email(request.email):
        # Always return generic response for security
        return {
            "success": True,
            "message": "If this account exists, recovery instructions have been sent"
        }
    
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Prevent user enumeration: still send generic response
        return {
            "success": True,
            "message": "If this account exists, recovery instructions have been sent"
        }
    
    # Check rate limiting (max 5 requests per hour)
    recent_attempts = db.query(PasswordResetAttempt).filter(
        PasswordResetAttempt.user_id == user.id,
        PasswordResetAttempt.attempted_at >= datetime.utcnow() - timedelta(hours=1),
        PasswordResetAttempt.ip_address == client_ip
    ).count()
    
    if recent_attempts >= 5:
        # Log failed attempt
        log_reset_attempt(db, user.id, client_ip, "rate_limited")
        return {
            "success": False,
            "message": "Too many reset requests. Please try again later."
        }, 429
    
    # Generate secure token (32 bytes = 256 bits)
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Store token in database (15 minute expiry)
    password_reset = PasswordReset(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
        is_used=False,
        ip_address=client_ip,
        user_agent=req.headers.get("user-agent")
    )
    db.add(password_reset)
    db.commit()
    
    # Send email or SMS
    if request.method == "email":
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(user.email, user.display_name, reset_link)
        log_reset_attempt(db, user.id, client_ip, "email_sent")
    
    elif request.method == "phone":
        otp = secrets.choice(range(100000, 999999))
        # Store OTP separately or in cache
        send_password_reset_otp(user.phone, otp)
        log_reset_attempt(db, user.id, client_ip, "otp_sent")
    
    # Always return generic response
    return {
        "success": True,
        "message": "If this account exists, recovery instructions have been sent"
    }

# ============================================
# VERIFY RESET TOKEN
# ============================================

@router.post("/verify-reset")
async def verify_reset(
    request: VerifyResetRequest,
    db: Session = Depends(get_db)
):
    """
    Verify password reset token is valid
    
    Checks if token:
    - Exists in database
    - Is not expired
    - Is not already used
    
    Returns user info if valid (for password reset page)
    """
    
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    
    # Find token in database
    password_reset = db.query(PasswordReset).filter(
        PasswordReset.token_hash == token_hash
    ).first()
    
    if not password_reset:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    # Check if expired
    if datetime.utcnow() > password_reset.expires_at:
        raise HTTPException(status_code=400, detail="Reset token expired")
    
    # Check if already used
    if password_reset.is_used:
        raise HTTPException(status_code=400, detail="Reset token already used")
    
    # Get user info
    user = db.query(User).filter(User.id == password_reset.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    # Calculate time remaining
    time_remaining = (password_reset.expires_at - datetime.utcnow()).total_seconds()
    
    return {
        "valid": True,
        "user_id": str(user.id),
        "email": user.email,
        "expires_in": int(time_remaining)
    }

# ============================================
# RESET PASSWORD
# ============================================

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset user password with valid token
    
    Validates token, updates password, marks token as used,
    and invalidates all old sessions.
    
    Requirements:
    - Token must be valid and not expired
    - Token must not be used
    - Password must meet security policy
    """
    
    # Hash token for lookup
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    
    # Find and verify token (reuse verify logic)
    password_reset = db.query(PasswordReset).filter(
        PasswordReset.token_hash == token_hash
    ).first()
    
    if not password_reset:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    if datetime.utcnow() > password_reset.expires_at:
        raise HTTPException(status_code=400, detail="Reset token expired")
    
    if password_reset.is_used:
        raise HTTPException(status_code=400, detail="Reset token already used")
    
    # Get user
    user = db.query(User).filter(User.id == password_reset.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    # Validate password format (server-side check)
    if not validate_password_policy(request.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password does not meet security requirements"
        )
    
    # Hash new password with bcrypt (minimum 10 rounds)
    hashed_password = bcrypt.hashpw(
        request.new_password.encode(),
        bcrypt.gensalt(rounds=10)
    )
    
    # Update user password
    user.password_hash = hashed_password.decode()
    user.updated_at = datetime.utcnow()
    
    # Mark token as used
    password_reset.is_used = True
    password_reset.used_at = datetime.utcnow()
    
    # Invalidate all old sessions (user must log in again)
    invalidate_user_sessions(user.id, db)
    
    # Commit changes
    db.commit()
    
    # Log successful reset
    log_reset_attempt(db, user.id, None, "success")
    
    # Send confirmation email (optional)
    send_password_reset_confirmation(user.email)
    
    return {
        "success": True,
        "message": "Password reset successfully. Please sign in with your new password."
    }

# ============================================
# HELPER FUNCTIONS
# ============================================

def is_valid_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None

def validate_password_policy(password: str) -> bool:
    """
    Validate password meets security policy:
    - 8+ characters
    - 1+ uppercase
    - 1+ lowercase
    - 1+ digit
    - 1+ special char
    """
    import re
    
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[^A-Za-z0-9]", password):
        return False
    
    return True

def send_password_reset_email(email: str, name: str, reset_link: str):
    """Send password reset email via SendGrid or similar service"""
    # Implementation example with SendGrid
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    
    message = Mail(
        from_email=('noreply@bee.dr', 'Bee.dr'),
        to_emails=email,
        subject='Reset Your Bee.dr Password',
    )
    
    html_content = f"""
    <html>
        <body>
            <h1>Reset Your Password</h1>
            <p>Hi {name},</p>
            <p>Click the link below to reset your password:</p>
            <a href="{reset_link}" style="background: #0d9668; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Reset Password
            </a>
            <p>This link expires in 15 minutes.</p>
            <p>If you didn't request this, ignore this email.</p>
            <p>The Bee.dr Team</p>
        </body>
    </html>
    """
    
    message.html_content = html_content
    
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(f"Email sent: {response.status_code}")
    except Exception as e:
        print(f"Error sending email: {e}")

def send_password_reset_otp(phone: str, otp: str):
    """Send OTP via SMS using Twilio or similar"""
    # Implementation example with Twilio
    from twilio.rest import Client
    
    client = Client(os.environ.get('TWILIO_ACCOUNT_SID'), 
                    os.environ.get('TWILIO_AUTH_TOKEN'))
    
    message = client.messages.create(
        body=f"Your Bee.dr password reset code is: {otp}. Valid for 5 minutes.",
        from_=os.environ.get('TWILIO_PHONE_NUMBER'),
        to=phone
    )
    
    print(f"OTP sent: {message.sid}")

def log_reset_attempt(db: Session, user_id: str, ip_address: str, status: str):
    """Log password reset attempt for audit/rate limiting"""
    attempt = PasswordResetAttempt(
        user_id=user_id,
        ip_address=ip_address,
        status=status,
        attempted_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()

def invalidate_user_sessions(user_id: str, db: Session):
    """Invalidate all active sessions for user"""
    # Query all active tokens for user and mark as invalid
    # Implementation depends on your session management approach
    pass

# ============================================
# REQUIREMENTS
# ============================================

# Add to med-saas/backend/requirements.txt:
# sendgrid==6.10.0
# twilio==8.10.0
# bcrypt==4.0.1
# python-jose==3.3.0

