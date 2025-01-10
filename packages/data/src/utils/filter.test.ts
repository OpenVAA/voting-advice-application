import { describe, expect, test } from 'vitest';
import { match } from './filter';
describe('filter', () => {
  test('Missing filter should return true', () => {
    expect(match({})).toBe(true);
  });
  test('Undefined filter should return true', () => {
    expect(match({ filter: undefined, target: 1 })).toBe(true);
  });
  test('Empty array filter should return true', () => {
    expect(match({ filter: [], target: 1 })).toBe(true);
  });
  test('Missing target should return false', () => {
    expect(match({ filter: 1, target: undefined })).toBe(false);
  });
  test('Empty array target should return false', () => {
    expect(match({ filter: 1, target: [] })).toBe(false);
  });
  test('Exact match should return true', () => {
    expect(match({ filter: 1, target: 1 })).toBe(true);
  });
  test('Unit array and single items should be equal (array first)', () => {
    expect(match({ filter: [1], target: 1 })).toBe(true);
  });
  test('Unit array and single items should be equal (item first)', () => {
    expect(match({ filter: 1, target: [1] })).toBe(true);
  });
  test('Single filter and multiple targets', () => {
    expect(match({ filter: 1, target: [1, 2, 3] })).toBe(true);
  });
  test('Multiple filters and single target', () => {
    expect(match({ filter: [1, 2, 3], target: 1 })).toBe(true);
  });
  test('Multiple filters and multiple targets', () => {
    expect(match({ filter: [1, 2, 3], target: [1, 2, 3] })).toBe(true);
  });
  test('No match should return false (single item)', () => {
    expect(match({ filter: 5, target: [1, 2, 3] })).toBe(false);
  });
  test('No match should return false (multiple items)', () => {
    expect(match({ filter: [4, 5], target: [1, 2, 3] })).toBe(false);
  });
  test('Exact match should return true (string)', () => {
    expect(match({ filter: 'a', target: 'a' })).toBe(true);
  });
  test('No match should return false (string)', () => {
    expect(match({ filter: 'd', target: ['a', 'b', 'c'] })).toBe(false);
  });
  test('Similar objects should return false if not the same object', () => {
    const a = {};
    const b = {};
    expect(match({ filter: [a], target: [b] })).toBe(false);
  });
});
