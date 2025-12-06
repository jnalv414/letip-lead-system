/**
 * Password Service Unit Tests
 *
 * Tests for bcrypt hashing, password comparison, and strength validation.
 * Covers success paths, error handling, and edge cases.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from '../password.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module
jest.mock('bcrypt');

describe('PasswordService', () => {
  let service: PasswordService;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // hash() Tests
  // ============================================================
  describe('hash()', () => {
    describe('Success Cases', () => {
      it('should hash a password with bcrypt using 12 salt rounds', async () => {
        const password = 'MySecurePassword123';
        const expectedHash = '$2b$12$hashedpasswordstringhere';
        mockBcrypt.hash.mockResolvedValue(expectedHash as never);

        const result = await service.hash(password);

        expect(result).toBe(expectedHash);
        expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
        expect(mockBcrypt.hash).toHaveBeenCalledTimes(1);
      });

      it('should hash empty string password', async () => {
        const password = '';
        const expectedHash = '$2b$12$emptypasswordhash';
        mockBcrypt.hash.mockResolvedValue(expectedHash as never);

        const result = await service.hash(password);

        expect(result).toBe(expectedHash);
        expect(mockBcrypt.hash).toHaveBeenCalledWith('', 12);
      });

      it('should hash password with special characters', async () => {
        const password = '!@#$%^&*()_+{}:"<>?~`-=[]\\;\',./';
        const expectedHash = '$2b$12$specialcharshash';
        mockBcrypt.hash.mockResolvedValue(expectedHash as never);

        const result = await service.hash(password);

        expect(result).toBe(expectedHash);
        expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      });

      it('should hash password with unicode characters', async () => {
        const password = 'Password123';
        const expectedHash = '$2b$12$unicodehash';
        mockBcrypt.hash.mockResolvedValue(expectedHash as never);

        const result = await service.hash(password);

        expect(result).toBe(expectedHash);
        expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      });

      it('should hash very long password', async () => {
        const password = 'A'.repeat(1000);
        const expectedHash = '$2b$12$longpasswordhash';
        mockBcrypt.hash.mockResolvedValue(expectedHash as never);

        const result = await service.hash(password);

        expect(result).toBe(expectedHash);
        expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      });
    });

    describe('Error Cases', () => {
      it('should propagate bcrypt hash errors', async () => {
        const password = 'TestPassword123';
        const error = new Error('Bcrypt internal error');
        mockBcrypt.hash.mockRejectedValue(error as never);

        await expect(service.hash(password)).rejects.toThrow('Bcrypt internal error');
        expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      });
    });
  });

  // ============================================================
  // compare() Tests
  // ============================================================
  describe('compare()', () => {
    describe('Success Cases - Matching Passwords', () => {
      it('should return true when password matches hash', async () => {
        const password = 'MySecurePassword123';
        const hash = '$2b$12$validhash';
        mockBcrypt.compare.mockResolvedValue(true as never);

        const result = await service.compare(password, hash);

        expect(result).toBe(true);
        expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
        expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);
      });

      it('should return true for empty password that matches', async () => {
        const password = '';
        const hash = '$2b$12$emptypasswordhash';
        mockBcrypt.compare.mockResolvedValue(true as never);

        const result = await service.compare(password, hash);

        expect(result).toBe(true);
        expect(mockBcrypt.compare).toHaveBeenCalledWith('', hash);
      });
    });

    describe('Success Cases - Non-Matching Passwords', () => {
      it('should return false when password does not match hash', async () => {
        const password = 'WrongPassword';
        const hash = '$2b$12$validhash';
        mockBcrypt.compare.mockResolvedValue(false as never);

        const result = await service.compare(password, hash);

        expect(result).toBe(false);
        expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      });

      it('should return false for similar but different passwords', async () => {
        const password = 'MySecurePassword123';
        const wrongPassword = 'MySecurePassword124'; // One digit different
        const hash = '$2b$12$validhash';
        mockBcrypt.compare.mockResolvedValue(false as never);

        const result = await service.compare(wrongPassword, hash);

        expect(result).toBe(false);
      });

      it('should return false for case-sensitive mismatch', async () => {
        const password = 'MYSECUREPASSWORD123'; // All caps
        const hash = '$2b$12$validhash'; // Hash of lowercase version
        mockBcrypt.compare.mockResolvedValue(false as never);

        const result = await service.compare(password, hash);

        expect(result).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle password with whitespace', async () => {
        const password = '  password with spaces  ';
        const hash = '$2b$12$whitespacehash';
        mockBcrypt.compare.mockResolvedValue(true as never);

        const result = await service.compare(password, hash);

        expect(result).toBe(true);
        expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      });

      it('should handle newline characters in password', async () => {
        const password = 'password\nwith\nnewlines';
        const hash = '$2b$12$newlinehash';
        mockBcrypt.compare.mockResolvedValue(true as never);

        const result = await service.compare(password, hash);

        expect(result).toBe(true);
      });
    });

    describe('Error Cases', () => {
      it('should propagate bcrypt compare errors', async () => {
        const password = 'TestPassword123';
        const hash = '$2b$12$validhash';
        const error = new Error('Bcrypt compare error');
        mockBcrypt.compare.mockRejectedValue(error as never);

        await expect(service.compare(password, hash)).rejects.toThrow('Bcrypt compare error');
        expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      });

      it('should handle invalid hash format', async () => {
        const password = 'TestPassword123';
        const invalidHash = 'not-a-valid-bcrypt-hash';
        const error = new Error('Invalid hash format');
        mockBcrypt.compare.mockRejectedValue(error as never);

        await expect(service.compare(password, invalidHash)).rejects.toThrow('Invalid hash format');
      });
    });
  });

  // ============================================================
  // validateStrength() Tests
  // ============================================================
  describe('validateStrength()', () => {
    describe('Valid Passwords', () => {
      it('should accept password meeting all requirements', () => {
        const password = 'MySecure1';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should accept password at minimum length (8 chars)', () => {
        const password = 'Abcdefg1'; // Exactly 8 chars

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should accept long password meeting requirements', () => {
        const password = 'MyVeryLongSecurePassword123';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should accept password with special characters', () => {
        const password = 'Secure@1Password!';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should accept password with multiple numbers', () => {
        const password = 'Password123456';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should accept password with mixed case throughout', () => {
        const password = 'PaSsWoRd1';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    describe('Invalid Passwords - Length Requirement', () => {
      it('should reject password shorter than 8 characters', () => {
        const password = 'Abc1'; // Only 4 chars

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should reject password with exactly 7 characters', () => {
        const password = 'Abcdef1'; // 7 chars (boundary test)

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should reject empty password', () => {
        const password = '';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should reject single character password', () => {
        const password = 'A';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Invalid Passwords - Uppercase Requirement', () => {
      it('should reject password without uppercase letter', () => {
        const password = 'lowercase1';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });

      it('should reject password with numbers but no uppercase', () => {
        const password = 'password123';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });

      it('should reject password with only numbers', () => {
        const password = '12345678';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });
    });

    describe('Invalid Passwords - Lowercase Requirement', () => {
      it('should reject password without lowercase letter', () => {
        const password = 'UPPERCASE1';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
      });

      it('should reject password with only uppercase and numbers', () => {
        const password = 'ABCDEFGH1';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
      });
    });

    describe('Invalid Passwords - Number Requirement', () => {
      it('should reject password without number', () => {
        const password = 'NoNumbersHere';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });

      it('should reject password with only letters', () => {
        const password = 'ABCDabcd';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });

      it('should reject password with special chars but no numbers', () => {
        const password = 'Password!@#';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });
    });

    describe('Invalid Passwords - Multiple Violations', () => {
      it('should report all violations for password missing everything', () => {
        const password = ''; // Empty password

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
        expect(result.errors.length).toBe(4);
      });

      it('should report multiple violations for short lowercase password', () => {
        const password = 'abc'; // Short, no uppercase, no number

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
        expect(result.errors.length).toBe(3);
      });

      it('should report multiple violations for numbers-only password', () => {
        const password = '123'; // Short, no uppercase, no lowercase

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
        expect(result.errors.length).toBe(3);
      });

      it('should report two violations for short password with uppercase and lowercase', () => {
        const password = 'Abc'; // Short, no number

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
        expect(result.errors).toContain('Password must contain at least one number');
        expect(result.errors.length).toBe(2);
      });
    });

    describe('Edge Cases', () => {
      it('should handle password with whitespace only', () => {
        const password = '        '; // 8 spaces

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        // Whitespace counts as length but fails other requirements
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
      });

      it('should handle password with unicode letters', () => {
        // Unicode letters may or may not match [A-Z] and [a-z]
        const password = '12345678';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
      });

      it('should treat number 0 as valid number', () => {
        const password = 'Password0';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should accept password with tab character', () => {
        const password = 'Password1\t';

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    describe('Boundary Value Analysis', () => {
      it('should reject 7-character password (boundary - 1)', () => {
        const password = 'Abcde1x'; // 7 chars

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should accept 8-character password (boundary)', () => {
        const password = 'Abcdef1x'; // 8 chars

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should accept 9-character password (boundary + 1)', () => {
        const password = 'Abcdefg1x'; // 9 chars

        const result = service.validateStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });
  });
});
