/**
 * Password Validation Utility
 * Enforces strong password policy for security
 */

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Validates password against security policy
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  if (!requirements.minLength) {
    errors.push('Password must be at least 8 characters');
  }
  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least 1 uppercase letter');
  }
  if (!requirements.hasLowercase) {
    errors.push('Password must contain at least 1 lowercase letter');
  }
  if (!requirements.hasNumber) {
    errors.push('Password must contain at least 1 number');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Password must contain at least 1 special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
  };
}

/**
 * Get password strength percentage (0-100)
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  
  const validation = validatePassword(password);
  const { requirements } = validation;
  
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  return (metRequirements / Object.keys(requirements).length) * 100;
}

/**
 * Get user-friendly password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  if (strength === 0) return 'No password';
  if (strength < 40) return 'Weak';
  if (strength < 70) return 'Fair';
  if (strength < 100) return 'Good';
  return 'Strong';
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: number): string {
  if (strength === 0) return 'bg-gray-300';
  if (strength < 40) return 'bg-red-500';
  if (strength < 70) return 'bg-yellow-500';
  if (strength < 100) return 'bg-blue-500';
  return 'bg-green-500';
}
