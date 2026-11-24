/**
 * The shared type guards, over the values a request body or a stored record can hold.
 */

import { describe, expect, it } from 'vitest';
import { isPlainObject, isUuid } from './guards.ts';

describe('isUuid', () => {
  it.each([
    ['00000000-0000-0000-0000-000000000001'],
    ['a1b2c3d4-e5f6-4789-abcd-ef0123456789'],
    ['A1B2C3D4-E5F6-4789-ABCD-EF0123456789']
  ])('accepts %j', (value) => {
    expect(isUuid(value)).toBe(true);
  });

  it.each([
    [''],
    ['00000000-0000-0000-0000-00000000000'],
    ['00000000-0000-0000-0000-0000000000011'],
    ['00000000000000000000000000000001'],
    ['g0000000-0000-0000-0000-000000000001'],
    [' 00000000-0000-0000-0000-000000000001'],
    ['00000000-0000-0000-0000-000000000001\n'],
    [null],
    [undefined],
    [42],
    [{}]
  ])('refuses %j', (value) => {
    expect(isUuid(value)).toBe(false);
  });
});

describe('isPlainObject', () => {
  it.each([[{}], [{ a: 1 }], [Object.create(null)], [new Date()]])('accepts %j', (value) => {
    expect(isPlainObject(value)).toBe(true);
  });

  it.each([[null], [undefined], [[]], [[1]], ['object'], [0], [true]])('refuses %j', (value) => {
    expect(isPlainObject(value)).toBe(false);
  });
});
