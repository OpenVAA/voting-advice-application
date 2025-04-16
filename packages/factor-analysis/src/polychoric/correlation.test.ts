import { afterAll, describe, expect, test } from 'vitest';
import { polychoricCorrelation } from './correlation';

describe('Polychoric Correlation', () => {
  describe('Basic Functionality', () => {
    test('computes perfect correlations correctly', () => {
      // Perfect positive correlation
      const x1 = [1, 2, 3, 4, 5];
      const y1 = [1, 2, 3, 4, 5];
      const result1 = polychoricCorrelation({
        x: x1,
        y: y1,
        options: { returnDetails: true }
      });
      expect(result1.correlation).toBeCloseTo(1.0, 1);
      expect(result1.converged).toBe(true);

      // Perfect negative correlation
      const x2 = [1, 2, 3, 4, 5];
      const y2 = [5, 4, 3, 2, 1];
      const result2 = polychoricCorrelation({
        x: x2,
        y: y2,
        options: { returnDetails: true }
      });
      expect(result2.correlation).toBeCloseTo(-1.0, 1);
      expect(result2.converged).toBe(true);
    });

    test('handles moderate correlations', () => {
      // Moderate positive correlation
      const x1 = [1, 1, 2, 2, 3, 3, 4, 4];
      const y1 = [3, 2, 2, 3, 3, 4, 3, 4];
      const result1 = polychoricCorrelation({
        x: x1,
        y: y1,
        options: { returnDetails: true }
      });
      expect(result1.correlation).toBeGreaterThan(0.3);
      expect(result1.correlation).toBeLessThan(0.9);
      expect(result1.converged).toBe(true);

      // Moderate negative correlation
      const x2 = [1, 1, 2, 2, 3, 3, 4, 4];
      const y2 = [4, 3, 3, 2, 2, 1, 2, 1];
      const result2 = polychoricCorrelation({
        x: x2,
        y: y2,
        options: { returnDetails: true }
      });
      expect(result2.correlation).toBeLessThan(-0.3);
      expect(result2.correlation).toBeGreaterThan(-0.9);
      expect(result2.converged).toBe(true);
    });

    test('handles independence and weak correlations', () => {
      // No correlation
      const x3 = [1, 1, 1, 2, 2, 2, 3, 3, 3, 1, 1, 1];
      const y3 = [1, 2, 3, 1, 2, 3, 1, 2, 3, 2, 1, 3];
      const result3 = polychoricCorrelation({
        x: x3,
        y: y3,
        options: { returnDetails: true }
      });
      expect(Math.abs(result3.correlation)).toBeLessThan(0.3);
      expect(result3.converged).toBe(true);

      // Weak positive correlation
      const x4 = [1, 1, 1, 1, 2, 2, 3];
      const y4 = [1, 1, 2, 2, 2, 3, 3];
      const result4 = polychoricCorrelation({ x: x4, y: y4 });
      expect(result4.correlation).toBeGreaterThan(0);
      expect(result4.correlation).toBeLessThan(0.8);
    });
  });

  describe('Edge Cases', () => {
    test('handles skewed distributions', () => {
      // Right-skewed data
      const x1 = [1, 1, 1, 1, 1, 2, 2, 3];
      const y1 = [1, 1, 1, 2, 2, 2, 3, 3];
      const result1 = polychoricCorrelation({
        x: x1,
        y: y1,
        options: { returnDetails: true }
      });
      expect(result1.correlation).toBeGreaterThan(0.5);
      expect(result1.converged).toBe(true);

      // Left-skewed data
      const x2 = [1, 2, 2, 3, 3, 3, 3, 3];
      const y2 = [1, 1, 2, 2, 2, 3, 3, 3];
      const result2 = polychoricCorrelation({
        x: x2,
        y: y2,
        options: { returnDetails: true }
      });
      expect(result2.correlation).toBeGreaterThan(0.5);
      expect(result2.converged).toBe(true);
    });

    test('handles unbalanced category frequencies', () => {
      const x = [1, 1, 1, 1, 2, 2, 3];
      const y = [1, 1, 2, 2, 2, 3, 3];
      const result = polychoricCorrelation({
        x,
        y,
        options: { returnDetails: true }
      });
      expect(result.converged).toBe(true);
      expect(Math.abs(result.correlation)).toBeLessThan(1);
    });

    test('handles binary variables correctly', () => {
      const x = [0, 0, 0, 0, 1, 1, 1, 1];
      const y = [0, 0, 1, 1, 0, 0, 1, 1];
      const result = polychoricCorrelation({
        x,
        y,
        options: { returnDetails: true }
      });
      expect(result.correlation).toBeCloseTo(0, 1);
      expect(result.converged).toBe(true);

      // Perfect binary correlation
      const x2 = [0, 0, 1, 1];
      const y2 = [0, 0, 1, 1];
      const result2 = polychoricCorrelation({ x: x2, y: y2 });
      expect(result2.correlation).toBeCloseTo(1, 1);
    });

    test('handles correlation of binary and non-binary', () => {
      const x = [0, 0, 1, 1, 1, 0];
      const y = [1, 2, 3, 4, 5, 1];

      const result = polychoricCorrelation({
        x,
        y,
        options: { returnDetails: true }
      });
      expect(result.correlation).toBeLessThan(1);
      expect(result.correlation).toBeGreaterThan(-1);
      expect(result.converged).toBe(true);

      // Test reverse order
      const result2 = polychoricCorrelation({
        x: y,
        y: x,
        options: { returnDetails: true }
      });
      expect(result2.correlation).toBeCloseTo(result.correlation, 8);
      expect(result2.converged).toBe(true);
    });

    test('handles error cases', () => {
      expect(() => polychoricCorrelation({ x: [1, 2], y: [1, 2, 3] })).toThrow('Input vectors must have same length');
      expect(() => polychoricCorrelation({ x: [1, 1, 1], y: [1, 2, 3] })).toThrow('Variable has only one category');
      expect(() => polychoricCorrelation({ x: [1], y: [1] })).toThrow(
        'Input vectors must have at least 2 observations'
      );
    });
  });

  describe('Numerical Properties', () => {
    test('computes specific correlation values accurately', () => {
      const x = [1, 1, 2, 2, 3, 3];
      const y = [1, 1, 2, 2, 3, 3];
      const result = polychoricCorrelation({ x, y });
      expect(result.correlation).toBeCloseTo(1.0, 4);

      const x2 = [1, 1, 2, 2, 3, 3];
      const y2 = [1, 2, 2, 3, 3, 3];
      const result2 = polychoricCorrelation({ x: x2, y: y2 });
      expect(result2.correlation).toBeGreaterThan(0.7);
      expect(result2.correlation).toBeLessThan(0.9);
    });

    test('produces valid standardErrors', () => {
      const x = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
      const y = [1, 2, 3, 4, 5, 2, 3, 4, 5, 1];
      const result = polychoricCorrelation({
        x,
        y,
        options: { returnDetails: true }
      });
      expect(result.standardError).toBeDefined();
      expect(result.standardError).toBeGreaterThan(0);
      expect(result.standardError).toBeLessThan(1);
    });

    test('handles convergence options', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [1, 2, 3, 4, 5];

      const result1 = polychoricCorrelation({
        x,
        y,
        options: {
          tolerance: 1e-8,
          returnDetails: true
        }
      });
      expect(result1.iterations).toBeGreaterThan(1);

      const result2 = polychoricCorrelation({
        x,
        y,
        options: {
          tolerance: 0.1,
          returnDetails: true
        }
      });
      expect(result2.iterations ?? 0).toBeLessThanOrEqual(result1.iterations ?? 0);
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', () => {
      const size = 1000;
      const x = Array.from({ length: size }, (_, i) => Math.floor(i / 200) + 1);
      const y = Array.from({ length: size }, (_, i) => Math.floor((i + Math.random() * 300) / 200) + 1);

      const result = polychoricCorrelation({
        x,
        y,
        options: { returnDetails: true }
      });
      expect(Math.abs(result.correlation)).toBeGreaterThan(0.1);
      expect(Math.abs(result.correlation)).toBeLessThan(1);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThan(20);
    });

    test('handles long vectors with mixed patterns', () => {
      const x = Array.from({ length: 100 }, (_, i) => Math.floor(i / 20) + 1);

      // Modify y generation to ensure integer values
      const y = x.map((v, i) => {
        if (i < 33) {
          // First third: Strong positive correlation with noise
          return Math.max(1, Math.min(5, Math.round(v + (Math.random() - 0.5))));
        } else if (i < 66) {
          // Middle third: Strong negative correlation with noise
          return Math.max(1, Math.min(5, Math.round(6 - v + (Math.random() - 0.5))));
        } else {
          // Last third: Random values with some correlation
          const randomComponent = Math.floor(Math.random() * 5) + 1;
          return Math.max(1, Math.min(5, Math.round((randomComponent + v) / 2)));
        }
      });

      const result = polychoricCorrelation({
        x,
        y,
        options: { returnDetails: true }
      });

      // Adjust expectations for mixed patterns
      expect(Math.abs(result.correlation)).toBeGreaterThan(0.2);
      expect(Math.abs(result.correlation)).toBeLessThan(0.9);
      expect(result.converged).toBe(true);
    });

    test('verifies meaningful correlations', () => {
      const x = Array(5000)
        .fill(0)
        .map((_, i) => Math.floor(i / 1000) + 1);
      const y = x.map((v) => v + Math.floor(Math.random() * 2));
      const result = polychoricCorrelation({ x, y });
      expect(result.correlation).toBeGreaterThan(0.9);

      const z = Array(5000)
        .fill(0)
        .map(() => Math.floor(Math.random() * 5) + 1);
      const uncorrelated = polychoricCorrelation({ x, y: z });
      expect(Math.abs(uncorrelated.correlation)).toBeLessThan(0.1);
    });
  });

  // Add cleanup to prevent open handles
  afterAll(() => {
    return new Promise((resolve) => setTimeout(resolve, 500));
  });
});
