import { describe, expect, test } from 'vitest';
import { isEmoji } from './isEmoji';

describe('isEmoji', () => {
  test('should return true for valid emoji objects', () => {
    expect(isEmoji({ emoji: '🎃' })).toBe(true);
    expect(isEmoji({ emoji: '👍' })).toBe(true);
    expect(isEmoji({ emoji: '🚀' })).toBe(true);
  });

  test('should return false for objects without emoji property', () => {
    expect(isEmoji({ url: 'image.jpg' })).toBe(false);
    expect(isEmoji({ image: '🎃' })).toBe(false);
    expect(isEmoji({})).toBe(false);
  });

  test('should return false for primitive values', () => {
    expect(isEmoji('🎃')).toBe(false);
    expect(isEmoji(123)).toBe(false);
    expect(isEmoji(true)).toBe(false);
  });

  test('should return false for null and undefined', () => {
    expect(isEmoji(null)).toBe(false);
    expect(isEmoji(undefined)).toBe(false);
  });

  test('should return false for arrays', () => {
    expect(isEmoji(['🎃'])).toBe(false);
    expect(isEmoji([{ emoji: '🎃' }])).toBe(false);
  });

  test('should return false when emoji property is not a string', () => {
    expect(isEmoji({ emoji: 123 })).toBe(false);
    expect(isEmoji({ emoji: null })).toBe(false);
    expect(isEmoji({ emoji: undefined })).toBe(false);
    expect(isEmoji({ emoji: { nested: '🎃' } })).toBe(false);
  });

  test('should return true for objects with emoji property and other properties', () => {
    expect(isEmoji({ emoji: '🎃', extra: 'data' })).toBe(true);
  });
});
