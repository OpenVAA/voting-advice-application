import { describe, expect, test } from 'vitest';
import { validatePasswordDetails } from './passwordValidation';

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
  test('Should return false when the password contains repeated characters equal to the repetition limit (4)', () => {
    const password = 'aaaa123!';
    const username = 'user';
    const result = validatePasswordDetails(password, username);
    expect(result.status).toBe(false);
    expect(result.details.repetition.status).toBe(false);
  });
});
