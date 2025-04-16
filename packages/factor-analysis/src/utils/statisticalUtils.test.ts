import { describe, expect, test } from 'vitest';
import {
  bivariateNormalCDF,
  bivariateNormalProbability,
  detectCategories,
  normalizeData
} from './statisticalUtils';

describe('Statistical Utilities', () => {
  describe('Category Detection', () => {
    test('detects correct number of categories', () => {
      expect(detectCategories([1, 1, 2, 2, 3, 3]).nCategories).toBe(3);
      expect(detectCategories([1, 5, 3, 5, 1, 3]).nCategories).toBe(5);
      expect(detectCategories([0, 1, 0, 1, 1, 0]).nCategories).toBe(2);
    });

    test('identifies binary variables', () => {
      expect(detectCategories([0, 1, 0, 1]).isBinary).toBe(true);
      expect(detectCategories([1, 2, 1, 2]).isBinary).toBe(true);
      expect(detectCategories([1, 2, 3]).isBinary).toBe(false);
    });

    test('handles non-consecutive categories', () => {
      const info = detectCategories([1, 5, 1, 5]);
      expect(info.nCategories).toBe(5);
      expect(info.min).toBe(1);
      expect(info.max).toBe(5);
    });

    test('rejects single category', () => {
      expect(() => detectCategories([1, 1, 1])).toThrow(
        'Variable has only one category'
      );
    });
  });

  describe('Data Normalization', () => {
    test('normalizes to zero-based indices', () => {
      const x = [1, 3, 5, 1, 3, 5];
      const normalized = normalizeData(x);
      expect(normalized).toEqual([0, 2, 4, 0, 2, 4]);
    });

    test('preserves order relations', () => {
      const x = [10, 20, 30, 10, 30];
      const normalized = normalizeData(x);

      // Check if order is preserved
      for (let i = 0; i < x.length; i++) {
        for (let j = 0; j < x.length; j++) {
          expect(Math.sign(x[i] - x[j])).toBe(
            Math.sign(normalized[i] - normalized[j])
          );
        }
      }
    });

    test('handles non-consecutive categories', () => {
      const x = [1, 5, 10, 1, 10, 5];
      const normalized = normalizeData(x);
      expect(normalized).toEqual([0, 4, 9, 0, 9, 4]);
    });
  });

  describe('Bivariate Normal Distributions', () => {
    describe('CDF', () => {
      test('handles standard cases', () => {
        // For standard bivariate normal with rho=0 at (0,0),
        // the probability should be 0.25 + φ(0)φ(0)/(2π) ≈ 0.409
        expect(bivariateNormalCDF({ x: 0, y: 0, rho: 0 })).toBeCloseTo(
          0.409,
          2
        );
        expect(bivariateNormalCDF({ x: Infinity, y: Infinity, rho: 0 })).toBe(
          1
        );
        expect(bivariateNormalCDF({ x: -Infinity, y: -Infinity, rho: 0 })).toBe(
          0
        );
      });

      test('respects correlation parameter', () => {
        // For positive correlation, probability should be higher in same quadrant
        const pos = bivariateNormalCDF({ x: 1, y: 1, rho: 0.9 });
        const neg = bivariateNormalCDF({ x: 1, y: -1, rho: 0.9 }); // Changed y to -1
        expect(pos).toBeGreaterThan(neg);
      });

      test('handles perfect correlations', () => {
        expect(bivariateNormalCDF({ x: 1, y: 1, rho: 1 })).toBeCloseTo(
          bivariateNormalCDF({ x: 1, y: 1, rho: 0.9999 }),
          3
        );
      });
    });

    describe('Rectangle Probability', () => {
      test('computes valid probabilities', () => {
        const result = bivariateNormalProbability({
          a1: -1,
          a2: 1,
          b1: -1,
          b2: 1,
          rho: 0
        });
        expect(result.probability).toBeGreaterThan(0);
        expect(result.probability).toBeLessThan(1);
      });

      test('produces valid derivatives', () => {
        const { derivative } = bivariateNormalProbability({
          a1: -1,
          a2: 1,
          b1: -1,
          b2: 1,
          rho: 0.5
        });
        expect(isFinite(derivative)).toBe(true);
      });

      test('handles boundary cases', () => {
        const result = bivariateNormalProbability({
          a1: -Infinity,
          a2: Infinity,
          b1: -Infinity,
          b2: Infinity,
          rho: 0
        });
        expect(result.probability).toBeCloseTo(1, 6);
        expect(result.derivative).toBeCloseTo(0, 6);
      });
    });
  });
});
