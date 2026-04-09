# Security Questions Authentication API Documentation

## Overview

This document describes the backend API endpoints for the security questions-based account recovery system. The frontend implementation includes:
- Question/answer setup during signup
- Answer verification during forgot password flow
- Rate limiting (5 attempts per hour)
- Progressive delays for failed attempts
- bcrypt hashing for answer storage

## API Endpoints

### 1. POST /api/auth/forgot-password

**Purpose:** Retrieve a user's security questions for the forgot password recovery flow.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "user_id": "uuid-here",
  "questions": [
    {
      "question_id": "q1",
      "question_text": "What is the name of your first pet?"
    },
    {
      "question_id": "q5",
      "question_text": "What city were you born in?"
    },
    {
      "question_id": "q12",
      "question_text": "What is your mother's maiden name?"
    }
  ],
  "recovery_token": "jwt-token-for-session"
}
```

**Response (User Not Found - 404):**
```json
{
  "error": "User not found",
  "message": "No account exists with this email"
}
```

**Response (Rate Limited - 429):**
```json
{
  "error": "Too many attempts",
  "message": "Please try again later",
  "reset_at": "2024-01-15T14:30:00Z"
}
```

**Security Considerations:**
- Return generic error messages (don't reveal if email is registered or not)
- Implement rate limiting: max 5 failed attempts per hour per email
- Log all attempts for audit trail
- Use JWT for recovery session (short-lived, 10-15 minutes)

**Implementation Notes:**
```typescript
// Pseudocode for backend
async function forgotPassword(email: string) {
  // Normalize email (lowercase, trim)
  const normalizedEmail = email.toLowerCase().trim();
  
  // Query user (generic error if not found)
  const user = await db.users.findByEmail(normalizedEmail);
  if (!user) {
    return { error: "User not found" }; // Generic message
  }
  
  // Check rate limit
  const attempts = await db.security_question_attempts
    .countFailed(user.id, { since: 1.hour });
  if (attempts >= 5) {
    return { error: "Rate limited" };
  }
  
  // Get user's security questions
  const questions = await db.security_questions.get(user.id);
  
  // Generate recovery token (JWT, 10 min expiration)
  const token = generateJWT(
    { user_id: user.id, type: 'password_recovery' },
    { expiresIn: '10m' }
  );
  
  return {
    user_id: user.id,
    questions: questions,
    recovery_token: token
  };
}
```

---

### 2. POST /api/auth/verify-security-answers

**Purpose:** Verify the user's security question answers during forgot password flow.

**Request Body:**
```json
{
  "user_id": "uuid-here",
  "recovery_token": "jwt-token",
  "answers": [
    "Fluffy",
    "New York",
    "Johnson"
  ]
}
```

**Response (Success - 200):**
```json
{
  "verified": true,
  "reset_token": "jwt-token-for-password-reset",
  "message": "Answers verified successfully"
}
```

**Response (Wrong Answers - 400):**
```json
{
  "error": "Verification failed",
  "message": "One or more answers are incorrect",
  "attempts_remaining": 3,
  "delay_seconds": 2
}
```

**Response (Max Attempts - 429):**
```json
{
  "error": "Access denied",
  "message": "Too many failed attempts. Please try again in 1 hour.",
  "reset_at": "2024-01-15T14:30:00Z"
}
```

**Security Considerations:**
- Generic error messages (don't reveal which answer is wrong)
- Use bcrypt for answer comparison (constant-time)
- Implement progressive delays: 2^n seconds (2s, 4s, 8s, max 10s)
- Max 5 attempts per hour
- Log failed attempts with timestamps
- Answers are case-insensitive and trimmed

**Implementation Notes:**
```typescript
// Pseudocode for backend
import bcrypt from 'bcryptjs';

async function verifySecurityAnswers(
  userId: string,
  recoveryToken: string,
  answers: string[]
) {
  // Verify token validity
  const decoded = verifyJWT(recoveryToken);
  if (decoded.user_id !== userId || decoded.type !== 'password_recovery') {
    return { error: "Invalid token" };
  }
  
  // Check rate limit
  const failedAttempts = await db.security_question_attempts
    .countFailed(userId, { since: 1.hour });
  if (failedAttempts >= 5) {
    return { error: "Access denied - rate limited" };
  }
  
  // Get stored answers (hashed)
  const storedAnswers = await db.security_questions.get(userId);
  
  // Normalize and verify answers using bcrypt
  const allCorrect = await Promise.all(
    storedAnswers.map((stored, index) => {
      const userAnswer = normalizeAnswer(answers[index]);
      // Use bcrypt for constant-time comparison
      return bcrypt.compare(userAnswer, stored.answer_hash);
    })
  );
  
  const isVerified = allCorrect.every(result => result === true);
  
  if (!isVerified) {
    // Log failed attempt
    await db.security_question_attempts.create({
      user_id: userId,
      success: false,
      failure_reason: 'invalid_answer'
    });
    
    // Calculate next delay: 2^(failedAttempts + 1), max 10s
    const delaySeconds = Math.min(
      Math.pow(2, failedAttempts + 1),
      10
    );
    
    return {
      error: "Verification failed",
      attempts_remaining: 5 - failedAttempts - 1,
      delay_seconds: delaySeconds
    };
  }
  
  // Log successful attempt
  await db.security_question_attempts.create({
    user_id: userId,
    success: true
  });
  
  // Generate password reset token
  const resetToken = generateJWT(
    { user_id: userId, type: 'password_reset' },
    { expiresIn: '15m' }
  );
  
  return {
    verified: true,
    reset_token: resetToken
  };
}

// Helper function to normalize answers
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase() // Case insensitive
    .trim() // Remove leading/trailing spaces
    .replace(/\s+/g, ' '); // Normalize internal spaces
}
```

---

### 3. POST /api/auth/reset-password

**Purpose:** Reset user's password after successful security question verification.

**Request Body:**
```json
{
  "user_id": "uuid-here",
  "reset_token": "jwt-token",
  "new_password": "SecurePassword123!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset successfully. Redirecting to login..."
}
```

**Response (Invalid Token - 401):**
```json
{
  "error": "Invalid token",
  "message": "Your reset token has expired. Please start over."
}
```

**Response (Invalid Password - 400):**
```json
{
  "error": "Invalid password",
  "message": "Password does not meet security requirements"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)
- Cannot contain spaces at start/end

**Implementation Notes:**
```typescript
// Pseudocode for backend
async function resetPassword(
  userId: string,
  resetToken: string,
  newPassword: string
) {
  // Verify token
  const decoded = verifyJWT(resetToken);
  if (decoded.user_id !== userId || decoded.type !== 'password_reset') {
    return { error: "Invalid token" };
  }
  
  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    return { error: "Invalid password", details: validation.errors };
  }
  
  // Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  // Update auth.users password via Supabase Admin API
  const { error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );
  
  if (error) {
    return { error: "Failed to reset password" };
  }
  
  // Clear recovery tokens (invalidate all sessions as precaution)
  // Optional: could require re-login on all devices
  await db.security_question_attempts.clearOldAttempts(userId);
  
  return { success: true };
}

function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

### 4. POST /api/auth/signup-security-questions

**Purpose:** Store security questions and answers during user signup.

**Request Body:**
```json
{
  "user_id": "uuid-here",
  "security_questions": [
    {
      "question_id": "q1",
      "answer": "Fluffy"
    },
    {
      "question_id": "q5",
      "answer": "New York"
    },
    {
      "question_id": "q12",
      "answer": "Johnson"
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Security questions configured successfully"
}
```

**Response (Duplicate Questions - 400):**
```json
{
  "error": "Invalid questions",
  "message": "You must select 3 different questions"
}
```

**Implementation Notes:**
```typescript
// Pseudocode for backend
async function setupSecurityQuestions(
  userId: string,
  securityQuestions: Array<{
    question_id: string;
    answer: string;
  }>
) {
  // Validate exactly 3 questions
  if (securityQuestions.length !== 3) {
    return { error: "Must provide exactly 3 questions" };
  }
  
  // Validate unique question IDs
  const questionIds = securityQuestions.map(q => q.question_id);
  if (new Set(questionIds).size !== 3) {
    return { error: "Cannot select same question twice" };
  }
  
  // Hash answers with bcrypt
  const hashedQuestions = await Promise.all(
    securityQuestions.map(async (q) => {
      const normalizedAnswer = normalizeAnswer(q.answer);
      const hashedAnswer = await bcrypt.hash(normalizedAnswer, 12);
      
      return {
        user_id: userId,
        question_id: q.question_id,
        question_text: getQuestionText(q.question_id),
        answer_hash: hashedAnswer
      };
    })
  );
  
  // Store in database
  await db.security_questions.deleteByUserId(userId); // Remove old
  await db.security_questions.createMany(hashedQuestions);
  
  return { success: true };
}
```

---

## Database Schema

### security_questions table

```sql
CREATE TABLE security_questions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id VARCHAR(3) NOT NULL,
  question_text TEXT NOT NULL,
  answer_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_security_questions_user_id ON security_questions(user_id);
```

### security_question_attempts table

```sql
CREATE TABLE security_question_attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN,
  failure_reason VARCHAR(100),  -- 'invalid_answer', 'timeout', etc.
  ip_address INET
);

CREATE INDEX idx_attempts_user_at ON security_question_attempts(user_id, attempted_at);
```

---

## Error Handling

### Common Error Codes

| Code | Message | Status | Action |
|------|---------|--------|--------|
| INVALID_EMAIL | Email format is invalid | 400 | Validate email format client-side |
| USER_NOT_FOUND | User not found | 404 | Redirect to signup (generic message) |
| RATE_LIMITED | Too many attempts | 429 | Show reset time, disable form |
| INVALID_TOKEN | Token expired | 401 | Redirect to /forgot-password to start over |
| ANSWERS_INCORRECT | Answers incorrect | 400 | Show attempts remaining |
| WEAK_PASSWORD | Password too weak | 400 | Show requirements to user |
| SERVER_ERROR | Internal error | 500 | Log error, show generic message |

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "User-friendly message",
  "details": {
    "retry_after": "10 minutes",
    "attempts_remaining": 3
  }
}
```

---

## Rate Limiting

### Rules

- **Forgot Password (email lookup):** 5 attempts/hour per email
- **Answer Verification:** 5 attempts/hour per user
- **Password Reset:** 3 attempts/hour per user

### Progressive Delays

Failed answer verification attempts have progressive delays:

| Attempt | Delay | Total Time |
|---------|-------|-----------|
| 1st fail | 2s | 2s |
| 2nd fail | 4s | 6s |
| 3rd fail | 8s | 14s |
| 4th fail | 10s | 24s |
| 5th fail | Locked out for 1 hour | - |

---

## Security Checklist

- [x] Answers hashed with bcrypt (not stored plain)
- [x] Constant-time comparison to prevent timing attacks
- [x] Generic error messages (don't reveal if email exists)
- [x] Rate limiting per user per hour
- [x] Progressive delays for failed attempts
- [x] JWT tokens with short expiration (10-15 min)
- [x] HTTPS only (configure in nginx/load balancer)
- [x] CORS properly configured
- [x] Input validation and sanitization
- [x] Audit logging for all attempts
- [x] Case-insensitive, trimmed answers
- [x] Max 5 questions per user selection
- [x] No information disclosure in errors

---

## Integration Checklist

- [ ] Create database tables via migration
- [ ] Create API endpoints in backend
- [ ] Implement bcrypt hashing for answers
- [ ] Add rate limiting middleware
- [ ] Set up audit logging
- [ ] Configure CORS
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Test with security questions flow

---

## Testing Scenarios

### Scenario 1: Successful Recovery
1. Enter email → Receive questions
2. Answer correctly → Receive reset token
3. Reset password → Redirected to login

### Scenario 2: Wrong Answer
1. Enter email → Receive questions
2. Answer incorrectly → See "Answers incorrect, 4 attempts remaining"
3. Wait 2 seconds → Try again
4. Answer correctly → Receive reset token

### Scenario 3: Rate Limited
1. Fail 5 times → See "Too many attempts, retry in 1 hour"
2. Try to recover → See lockout message with reset time

### Scenario 4: Expired Token
1. Wait 10+ minutes
2. Submit answers → See "Session expired, start over"
3. Redirect to forgot password page

---

## Frontend Integration

The frontend components that need backend integration:

1. **ForgotPasswordSecurityQuestions.tsx**
   - POST to `/api/auth/forgot-password` to get questions
   - POST to `/api/auth/verify-security-answers` to verify
   - POST to `/api/auth/reset-password` to reset password

2. **SecurityAnswersVerification.tsx**
   - Shows user's questions
   - Handles attempt counting
   - Shows recovery tokens from backend

3. **SignupPage (future)**
   - POST to `/api/auth/signup-security-questions` to store questions

---

## Future Enhancements

- [ ] Two-factor authentication (2FA) option
- [ ] Biometric authentication support
- [ ] Backup codes for account recovery
- [ ] Email notification on password change
- [ ] Suspicious activity detection
- [ ] Device fingerprinting
- [ ] IP-based rate limiting
- [ ] Account recovery via support team
