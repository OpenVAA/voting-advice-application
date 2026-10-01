import { describe, expect, test } from 'vitest';
import { validatePasswordDetails } from './passwordValidation';

/**
 * The overall verdict for a password.
 * @param password - The password to validate.
 * @param username - The username the password must not contain.
 * @returns Whether every enforced requirement is met.
 */
function isValidPassword(password: string, username?: string): boolean {
  return validatePasswordDetails(password, username).status;
}

describe('validatePasswordDetails status', () => {
  test('Should return false for a password shorter than the minimum length', () => {
    expect(isValidPassword('short')).toBe(false);
  });
  test('Should return false for a password without uppercase letters', () => {
    expect(isValidPassword('lowercaseonly123!')).toBe(false);
  });
  test('Should return false for a password without lowercase letters', () => {
    expect(isValidPassword('UPPERCASEONLY123!')).toBe(false);
  });
  test('Should return false for a password without numbers', () => {
    expect(isValidPassword('NoNumbersHere!')).toBe(false);
  });
  test('Should return false for a password without symbols', () => {
    expect(isValidPassword('NoSymbolsHere123')).toBe(false);
  });
  test('Should return false for a password containing the username', () => {
    expect(isValidPassword('password123!', 'password')).toBe(false);
  });
  test('Should return true for a valid password', () => {
    expect(isValidPassword('ValidPassword123!')).toBe(true);
  });
});

describe('validatePasswordDetails', () => {
  test('Should return false when the password contains the username as a substring', () => {
    const password = 'user1234!';
    const username = 'user';
    const result = validatePasswordDetails(password, username);
    expect(result.status).toBe(false);
    expect(result.details.username.status).toBe(false);
  });
  test('Should return true when the password is valid and the username is an empty string', () => {
    const password = 'ValidPass123!';
    const username = '';
    const result = validatePasswordDetails(password, username);
    expect(result.status).toBe(true);
    expect(result.details.length.status).toBe(true);
    expect(result.details.uppercase.status).toBe(true);
    expect(result.details.lowercase.status).toBe(true);
    expect(result.details.number.status).toBe(true);
    expect(result.details.symbol.status).toBe(true);
    expect(result.details.username.status).toBe(true);
    expect(result.details.repetition.status).toBe(true);
  });
  test('Should return false when the password is too short', () => {
    const password = 'Short1!';
    const username = 'user';
    const result = validatePasswordDetails(password, username);
    expect(result.status).toBe(false);
    expect(result.details.length.status).toBe(false);
    expect(result.details.length.message).toBe('candidateApp.register.passwordValidation.length');
  });
  test('Should return false when the password lacks a special character', () => {
    const password = 'ValidPass123';
    const username = 'user';
    const result = validatePasswordDetails(password, username);
    expect(result.status).toBe(false);
    expect(result.details.symbol.status).toBe(false);
  });
  test('Should return false when the password lacks an uppercase letter', () => {
    const password = 'validpass123!';
    const username = 'user';
    const result = validatePasswordDetails(password, username);
    expect(result.status).toBe(false);
    expect(result.details.uppercase.status).toBe(false);
  });
  test('Should return false when the password lacks a lowercase letter', () => {
    const password = 'VALIDPASS123!';
    const username = 'user';
    const result = validatePasswordDetails(password, username);
    expect(result.status).toBe(false);
    expect(result.details.lowercase.status).toBe(false);
  });
  test('Should return false when the password lacks a digit', () => {
    const password = 'NoDigitsHere!';
    const username = 'user';
    const result = validatePasswordDetails(password, username);
    expect(result.status).toBe(false);
    expect(result.details.number.status).toBe(false);
  });
  test('Should flag repeated characters at the repetition limit (4)', () => {
    const password = 'aaaa123!';
    const username = 'user';
    const result = validatePasswordDetails(password, username);
    expect(result.details.repetition.status).toBe(false);
  });
  test('Should keep a password valid when only the non-enforced repetition rule fails', () => {
    const result = validatePasswordDetails('aaaaaaBBB123!');
    expect(result.status).toBe(true);
    expect(result.details.repetition.status).toBe(false);
    expect(result.details.repetition.message).toBe('candidateApp.register.passwordValidation.repetition');
  });
});
