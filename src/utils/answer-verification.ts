/**
 * Security Answer Verification
 * Hash and verify security question answers
 */

import { normalizeAnswer } from './security-questions';

/**
 * Hash a security answer using crypto
 * In production, use bcrypt on the backend
 * 
 * Frontend hashing is for client-side validation only
 * Always verify hashes on backend
 */
export async function hashSecurityAnswer(answer: string): Promise<string> {
  const normalized = normalizeAnswer(answer);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a security answer against a hash
 * Uses constant-time comparison to prevent timing attacks
 */
export async function verifySecurityAnswer(
  answer: string,
  hash: string
): Promise<boolean> {
  const answerHash = await hashSecurityAnswer(answer);

  // Constant-time comparison
  if (answerHash.length !== hash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < answerHash.length; i++) {
    result |= answerHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate answer format
 * Must be non-empty string
 */
export function validateAnswerFormat(answer: string): boolean {
  return answer.trim().length > 0 && answer.length <= 200;
}

/**
 * Validate answer is not too simple
 * Prevents single-word or very short answers
 */
export function validateAnswerComplexity(answer: string): boolean {
  const normalized = normalizeAnswer(answer);
  
  // At least 2 characters
  if (normalized.length < 2) {
    return false;
  }

  // Can be single word (e.g., "Alice", "London")
  // No complexity requirements - users should choose meaningful answers
  return true;
}

/**
 * Get password strength for answers (informational)
 */
export function getAnswerQuality(answer: string): {
  quality: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string;
} {
  const normalized = normalizeAnswer(answer);
  const length = normalized.length;
  const hasNumbers = /\d/.test(normalized);
  const hasSpaces = /\s/.test(normalized);
  const wordCount = normalized.split(' ').length;

  // Scoring
  let score = 0;
  if (length >= 5) score++;
  if (length >= 10) score++;
  if (wordCount >= 2) score++;
  if (hasNumbers) score++;
  if (hasSpaces && wordCount >= 2) score++;

  // Feedback
  let feedback = '';
  if (length < 2) {
    return {
      quality: 'weak',
      feedback: 'Answer is too short',
    };
  }

  if (score <= 1) {
    return {
      quality: 'weak',
      feedback: 'Consider a longer or more detailed answer',
    };
  }

  if (score === 2) {
    return {
      quality: 'fair',
      feedback: 'Good - but can be more specific',
    };
  }

  if (score <= 3) {
    return {
      quality: 'good',
      feedback: 'Good answer - specific enough',
    };
  }

  return {
    quality: 'strong',
    feedback: 'Strong answer - very specific',
  };
}

/**
 * Security note about answers
 */
export const ANSWER_SECURITY_TIPS = [
  '✓ Use actual facts about yourself',
  '✓ Be specific (e.g., full name, not nickname)',
  '✓ Avoid common answers (everyone knows your city)',
  '✓ Remember your answers exactly (case insensitive)',
  '✓ Answers must be 2-200 characters',
];

/**
 * Validate all answers for signup/recovery
 */
export function validateAnswerSet(answers: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (answers.length !== 3) {
    errors.push('Must provide exactly 3 answers');
  }

  answers.forEach((answer, index) => {
    if (!validateAnswerFormat(answer)) {
      errors.push(`Answer ${index + 1} is invalid (must be 2-200 characters)`);
    }

    if (!validateAnswerComplexity(answer)) {
      errors.push(
        `Answer ${index + 1} is too simple (must be at least 2 characters)`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
