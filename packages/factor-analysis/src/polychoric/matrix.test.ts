import { describe, expect, test } from 'vitest';
import { computePolychoricMatrix } from './matrix';

describe('Polychoric Matrix Computation', () => {
  describe('Input Validation', () => {
    test('rejects empty matrix', () => {
      expect(() => computePolychoricMatrix([])).toThrow('Empty response matrix');
      expect(() => computePolychoricMatrix([[], []])).toThrow('Empty response matrix');
    });

    test('validates matrix dimensions', () => {
      const badResponses = [
        [1, 2, 3],
        [1, 2], // Different length
        [1, 2, 3]
      ];
      expect(() => computePolychoricMatrix(badResponses)).toThrow('All response rows must have same length');
    });

    test('validates data types', () => {
      const nonIntegerResponses = [
        [1, 2, 3],
        [1.5, 2, 3], // Non-integer value
        [1, 2, 3]
      ];
      expect(() => computePolychoricMatrix(nonIntegerResponses)).toThrow('All values must be integers');

      /*const nanResponses = [
        [1, 2, 3],
        [1, NaN, 3], // NaN value
        [1, 2, 3]
      ];
      expect(() => computePolychoricMatrix(nanResponses)).toThrow(
        'All values must be integers'
        );*/
    });
  });

  describe('Computation', () => {
    test('produces symmetric matrix', () => {
      const responses = [
        [1, 2, 3, 4],
        [2, 3, 4, 1],
        [3, 4, 1, 2]
      ];
      const matrix = computePolychoricMatrix(responses);

      // Check dimensions
      expect(matrix.length).toBe(3);
      expect(matrix[0].length).toBe(3);

      // Check symmetry
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < i; j++) {
          expect(matrix[i][j]).toBeCloseTo(matrix[j][i], 10);
        }
      }
    });

    test('produces valid diagonal values', () => {
      const responses = [
        [1, 2, 3],
        [2, 3, 1],
        [3, 1, 2]
      ];
      const matrix = computePolychoricMatrix(responses);

      // Check diagonal elements are 1
      for (let i = 0; i < matrix.length; i++) {
        expect(matrix[i][i]).toBeCloseTo(1.0, 10);
      }
    });

    test('produces valid correlation range', () => {
      const responses = [
        [1, 1, 1, 2, 2, 2],
        [1, 2, 3, 1, 2, 3],
        [3, 3, 3, 2, 2, 2]
      ];
      const matrix = computePolychoricMatrix(responses);

      // Check correlation values are in [-1, 1]
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
          expect(matrix[i][j]).toBeGreaterThanOrEqual(-1);
          expect(matrix[i][j]).toBeLessThanOrEqual(1);
        }
      }
    });

    test('handles perfect correlations', () => {
      const responses = [
        [1, 2, 3, 4],
        [1, 2, 3, 4], // Perfect positive correlation with first row
        [4, 3, 2, 1] // Perfect negative correlation with first row
      ];
      const matrix = computePolychoricMatrix(responses);

      expect(matrix[0][1]).toBeCloseTo(1.0, 6);
      expect(matrix[0][2]).toBeCloseTo(-1.0, 6);
    });

    test('handles large response sets efficiently', () => {
      const nQuestions = 10;
      const nResponses = 1000;
      const responses = Array(nQuestions)
        .fill(0)
        .map(() =>
          Array(nResponses)
            .fill(0)
            .map(() => Math.floor(Math.random() * 5) + 1)
        );

      const startTime = performance.now();
      const matrix = computePolychoricMatrix(responses);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in under 5s
      expect(matrix.length).toBe(nQuestions);
      expect(matrix[0].length).toBe(nQuestions);
    });
  });
});
