/**
 * Token Utility for Password Reset
 * Generates and validates secure reset tokens
 */

/**
 * Generate a secure random token for password reset
 * Uses crypto for secure randomness
 */
export function generateResetToken(): string {
  // Generate 32 random bytes and convert to hex
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash a token using SHA-256 (for database storage)
 * Note: In production, use backend hashing with bcrypt
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a token hash (constant-time comparison)
 */
export async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  const tokenHash = await hashToken(token);
  
  // Constant-time comparison to prevent timing attacks
  if (tokenHash.length !== hash.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < tokenHash.length; i++) {
    result |= tokenHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Calculate expiry time (15 minutes from now for reset tokens)
 */
export function getTokenExpiry(minutesValid: number = 15): Date {
  const now = new Date();
  return new Date(now.getTime() + minutesValid * 60 * 1000);
}

/**
 * Format time remaining for token expiry
 */
export function getTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'Expired';
  }
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
