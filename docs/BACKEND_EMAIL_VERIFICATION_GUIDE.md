# Email Verification & Security Questions - Backend Implementation Guide

## Overview

Aapke frontend mein complete signup flow hai with:
1. **Multi-step signup** (Details → Password → Security Questions)
2. **Email verification** needed
3. **Security questions** ko store karna hoga

## ⚠️ Critical Issues to Fix

### Issue 1: Email Verification System
**Problem:** Signup ke baad email verification link nahi send ho raha

**Solution - Implement These Endpoints:**

#### Endpoint 1: Send Verification Email
```
POST /api/auth/send-verification-email
Content-Type: application/json

Request Body:
{
  "userId": "uuid-here",
  "email": "user@example.com",
  "verificationToken": "random-token",
  "userName": "User's Name"
}

Response (Success):
{
  "success": true,
  "message": "Verification email sent"
}
```

**Python/FastAPI Implementation:**
```python
from fastapi import APIRouter, HTTPException
from supabase import create_client
import secrets
from datetime import datetime, timedelta
import httpx

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/send-verification-email")
async def send_verification_email(
    userId: str,
    email: str,
    verificationToken: str,
    userName: str
):
    """Send verification email after signup"""
    
    # 1. Store token in database
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    token_expiry = datetime.utcnow() + timedelta(hours=24)
    supabase.table("email_verification_tokens").insert({
        "id": str(uuid.uuid4()),
        "user_id": userId,
        "token": hashlib.sha256(verificationToken.encode()).hexdigest(),
        "expires_at": token_expiry.isoformat(),
        "is_used": False
    }).execute()
    
    # 2. Create verification link
    verification_link = f"{FRONTEND_URL}/verify-email?user_id={userId}&token={verificationToken}"
    
    # 3. Send email (using SendGrid, AWS SES, or Mailgun)
    from email_templates import get_verification_email_html
    html_content = get_verification_email_html(userName, verification_link)
    
    # SendGrid Example:
    await send_email_via_sendgrid(
        to_email=email,
        subject="Verify Your Bee.Dr Account",
        html_content=html_content,
        from_email="noreply@bee.dr"
    )
    
    return {"success": True, "message": "Verification email sent"}
```

#### Endpoint 2: Verify Email Token
```
POST /api/auth/verify-email-token
Content-Type: application/json

Request Body:
{
  "userId": "uuid-here",
  "token": "token-from-url"
}

Response (Success):
{
  "success": true,
  "message": "Email verified successfully"
}

Response (Error):
{
  "error": "Token expired or invalid"
}
```

**Python/FastAPI Implementation:**
```python
@router.post("/verify-email-token")
async def verify_email_token(userId: str, token: str):
    """Verify email token from verification link"""
    
    # 1. Hash token
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # 2. Check token in database
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    result = supabase.table("email_verification_tokens").select("*").eq(
        "user_id", userId
    ).eq(
        "token", token_hash
    ).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=400, detail="Token not found")
    
    token_record = result.data
    
    # 3. Check if expired
    if datetime.fromisoformat(token_record["expires_at"]) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")
    
    # 4. Check if already used
    if token_record["is_used"]:
        raise HTTPException(status_code=400, detail="Token already used")
    
    # 5. Mark as used
    supabase.table("email_verification_tokens").update({
        "is_used": True
    }).eq("id", token_record["id"]).execute()
    
    # 6. Update user verified status
    supabase.table("auth.users").update({
        "email_confirmed_at": datetime.utcnow().isoformat()
    }).eq("id", userId).execute()
    
    return {"success": True, "message": "Email verified"}
```

---

### Issue 2: Security Questions Storage
**Problem:** Signup ke time questions selected ho rahe hain par store nahi ho rahe

**Solution - Implement This Endpoint:**

#### Endpoint 3: Store Security Questions
```
POST /api/auth/store-security-questions
Content-Type: application/json

Request Body:
{
  "userId": "uuid-here",
  "questions": [
    {
      "question_id": "q1",
      "question_text": "What is the name of your first pet?",
      "answer": "fluffy"  // MUST hash this
    },
    {
      "question_id": "q5",
      "question_text": "What city were you born in?",
      "answer": "new york"  // MUST hash this
    },
    {
      "question_id": "q12",
      "question_text": "What is your mother's maiden name?",
      "answer": "johnson"  // MUST hash this
    }
  ]
}

Response (Success):
{
  "success": true,
  "message": "Security questions stored"
}
```

**Python/FastAPI Implementation:**
```python
from bcrypt import hashpw, gensalt

@router.post("/store-security-questions")
async def store_security_questions(userId: str, questions: list):
    """Store user's security questions with hashed answers"""
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Process each question
    for q in questions:
        # IMPORTANT: Normalize answer (lowercase, trim)
        answer_normalized = q["answer"].lower().strip()
        
        # Hash answer with bcrypt
        answer_hash = hashpw(
            answer_normalized.encode(),
            gensalt(rounds=12)  # Same as password
        ).decode()
        
        # Store in database
        supabase.table("security_questions").insert({
            "id": str(uuid.uuid4()),
            "user_id": userId,
            "question_id": q["question_id"],
            "question_text": q["question_text"],
            "answer_hash": answer_hash,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
    
    return {"success": True, "message": "Security questions stored"}
```

---

## Database Schema Needed

### Table 1: email_verification_tokens
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL,  -- SHA-256 hash
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_user ON email_verification_tokens(user_id);
```

### Table 2: security_questions (Already created)
```sql
CREATE TABLE security_questions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id VARCHAR(3) NOT NULL,
  question_text TEXT NOT NULL,
  answer_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_user ON security_questions(user_id);
```

---

## Complete User Signup Flow

```
1. USER VISITS /signup
   ↓
2. STEP 1: Enter Name + Email
   ↓
3. STEP 2: Enter Password (validated)
   ↓
4. STEP 3: Select 3 Security Questions + Answers
   ↓
5. FRONTEND CALLS: POST /auth/signup
   - Creates account in Supabase auth
   - Returns: userId, email
   ↓
6. FRONTEND CALLS: POST /api/auth/store-security-questions
   - Stores 3 questions + hashed answers
   ↓
7. FRONTEND CALLS: POST /api/auth/send-verification-email
   - Sends verification link to email
   - Link: /verify-email?user_id=XXX&token=YYY
   ↓
8. USER CHECKS EMAIL
   ↓
9. USER CLICKS LINK → /verify-email route
   ↓
10. FRONTEND CALLS: POST /api/auth/verify-email-token
    ↓
11. USER EMAIL VERIFIED ✓
    ↓
12. REDIRECT: /auth (Login page)
    ↓
13. USER SIGNS IN with email + password
    ↓
14. WHEN USER FORGETS PASSWORD:
    - Users go to /forgot-password-security-questions
    - Answer 3 questions
    - Reset password
```

---

## Important Security Notes

### ⚠️ Answer Hashing Must Use bcrypt
```python
# WRONG ❌
answer_hash = hashlib.sha256(answer.encode()).hexdigest()

# RIGHT ✓
answer_hash = hashpw(answer.encode(), gensalt(rounds=12)).decode()
```

### ⚠️ Answer Normalization
```python
def normalize_answer(answer: str) -> str:
    """Normalize answer for consistent verification"""
    return answer.lower().strip().replace(" ", " ")
    # Examples:
    # "  Fluffy  " → "fluffy"
    # "NEW YORK" → "new york"
    # "John    Doe" → "john doe"
```

### ⚠️ Verify Answers with Constant-Time Comparison
```python
from bcrypt import checkpw

# WRONG ❌ (Vulnerable to timing attacks)
if user_answer_hash == stored_hash:

# RIGHT ✓ (Constant-time comparison)
if checkpw(user_answer.encode(), stored_hash.encode()):
```

---

## Email Templates

Frontend ke `src/utils/email-verification.ts` mein HTML templates hain:
- `getVerificationEmailHTML()`
- `getPasswordResetEmailHTML()`
- `getVerificationEmailText()`
- `getPasswordResetEmailText()`

Backend should in templates ko use karke email send kare.

---

## Environment Variables Needed

```
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=noreply@bee.dr

# OR

AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@bee.dr

FRONTEND_URL=http://localhost:8082  # For verification links
DATABASE_URL=postgresql://...
```

---

## Testing Checklist

- [ ] Signup creates user account
- [ ] Security questions stored with bcrypt hashed answers
- [ ] Verification email sent
- [ ] Verification link works
- [ ] Email marked as verified in database
- [ ] Cannot login without email verified (optional: per business logic)
- [ ] Forgot password can retrieve questions
- [ ] Answers verified with bcrypt comparison
- [ ] Rate limiting 5 attempts per hour
- [ ] Token expiration (24 hours for email, 30 min for password reset)

---

## Next Steps (In Order)

1. **Create database tables** (email_verification_tokens)
2. **Implement send-verification-email endpoint**
3. **Implement verify-email-token endpoint**
4. **Implement store-security-questions endpoint**
5. **Setup email service** (SendGrid/AWS SES)
6. **Test complete signup flow**
7. **Test forgot password flow**
8. **Deploy to staging**

---

## Quick Integration Checklist for Backend Team

- [ ] Read this entire document
- [ ] Create database tables
- [ ] Setup email service
- [ ] Implement 3 endpoints above
- [ ] Update AuthContext.tsx to check email_verified
- [ ] Add guards to create user only after email verified
- [ ] Test with frontend
- [ ] Deploy

**Estimated Time:** 2-3 days for complete implementation
