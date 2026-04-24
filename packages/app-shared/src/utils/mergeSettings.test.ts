import { describe, expect, test } from 'vitest';
import { mergeSettings } from './mergeSettings';

describe('mergeSettings', () => {
  test('Should deep-merge nested objects without clobbering sibling keys', () => {
    const target = { a: { b: 1 } };
    const source = { a: { c: 2 } };
    const result = mergeSettings(target, source);
    expect(result).toEqual({ a: { b: 1, c: 2 } });
  });

  test('Should let the overlay win on primitive collisions', () => {
    const result = mergeSettings({ x: 1 }, { x: 2 });
    expect(result.x).toBe(2);
  });

  test('Should replace arrays wholesale (no element-wise merge)', () => {
    const result = mergeSettings({ xs: [1, 2, 3] }, { xs: [9] });
    expect(result.xs).toEqual([9]);
  });

  test('Should not mutate inputs', () => {
    const target = { a: { b: 1 }, arr: [1, 2, 3] };
    const source = { a: { c: 2 } };
    const targetSnapshot = structuredClone(target);
    const sourceSnapshot = structuredClone(source);
    mergeSettings(target, source);
    expect(target).toEqual(targetSnapshot);
    expect(source).toEqual(sourceSnapshot);
  });

  test('Should initialize missing nested target keys from the overlay', () => {
    const result = mergeSettings({}, { a: { b: 1 } });
    expect(result).toEqual({ a: { b: 1 } });
  });

  test('Should preserve function values from the overlay by reference', () => {
    const fn = (): number => 42;
    const result = mergeSettings({}, { fn });
    expect(typeof result.fn).toBe('function');
    expect(result.fn()).toBe(42);
    // Function is assigned by reference, not cloned.
    expect(result.fn).toBe(fn);
  });
});
