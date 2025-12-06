/**
 * Password Service
 *
 * Handles password hashing and comparison using bcrypt.
 * Provides secure password validation.
 */

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly SALT_ROUNDS = 12;

  /**
   * Hash a plain text password using bcrypt
   *
   * @param password - Plain text password
   * @returns Hashed password string
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a hash
   *
   * @param password - Plain text password to verify
   * @param hash - Stored password hash
   * @returns True if password matches, false otherwise
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   *
   * Requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   *
   * @param password - Password to validate
   * @returns Object with isValid flag and errors array
   */
  validateStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
