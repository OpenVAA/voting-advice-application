import { validatePassword, validatePasswordDetails } from '@openvaa/app-shared';

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should return false for a password less than the minimum length', () => {
      expect(validatePassword('short')).toBe(false);
    });

    it('should return false for a password without uppercase letters', () => {
      expect(validatePassword('lowercaseonly123!')).toBe(false);
    });

    it('should return false for a password without lowercase letters', () => {
      expect(validatePassword('UPPERCASEONLY123!')).toBe(false);
    });

    it('should return false for a password without numbers', () => {
      expect(validatePassword('NoNumbersHere!')).toBe(false);
    });

    it('should return false for a password without symbols', () => {
      expect(validatePassword('NoSymbolsHere123')).toBe(false);
    });

    it('should return false for a password containing the username', () => {
      expect(validatePassword('password123!', 'password')).toBe(false);
    });

    it('should return true for a valid password', () => {
      expect(validatePassword('ValidPassword123!')).toBe(true);
    });
  });

  describe('validatePasswordDetails', () => {
    it('should return detailed validation results', () => {
      const result = validatePasswordDetails('short');
      expect(result.status).toBe(false);
      expect(result.details.length.status).toBe(false);
      expect(result.details.length.message).toBe('candidateApp.register.passwordValidation.length');
    });

    it('should return a warning for a password with repeated characters', () => {
      const result = validatePasswordDetails('aaaaaaBBB123!');
      expect(result.status).toBe(true);
      expect(result.details.repetition.status).toBe(false);
      expect(result.details.repetition.message).toBe('candidateApp.register.passwordValidation.repetition');
    });
  });
});
