import { afterAll, describe, expect, test } from 'vitest';
import { FactorAnalysis } from './index';

describe('Factor Analysis', () => {
  // Common test matrices
  const simpleMatrix = [
    [1.0, 0.8, 0.6],
    [0.8, 1.0, 0.7],
    [0.6, 0.7, 1.0]
  ];

  const twoFactorMatrix = [
    [1.0, 0.9, 0.9, 0.2, 0.1, 0.1],
    [0.9, 1.0, 0.9, 0.1, 0.2, 0.1],
    [0.9, 0.9, 1.0, 0.1, 0.1, 0.2],
    [0.2, 0.1, 0.1, 1.0, 0.9, 0.9],
    [0.1, 0.2, 0.1, 0.9, 1.0, 0.9],
    [0.1, 0.1, 0.2, 0.9, 0.9, 1.0]
  ];

  describe('Basic Functionality', () => {
    test('computes factor analysis for simple matrix', () => {
      const result = FactorAnalysis.compute({
        correlationMatrix: simpleMatrix,
        numFactors: 2
      });

      expect(result.loadings.length).toBe(2);
      expect(result.loadings[0].length).toBe(3);
      expect(result.uniquenesses.length).toBe(3);
      expect(result.communalities.length).toBe(3);
      expect(result.explained.length).toBe(2);
      expect(result.converged).toBe(true);
    });

    test('detects clear two-factor structure', () => {
      const result = FactorAnalysis.compute({
        correlationMatrix: twoFactorMatrix,
        numFactors: 2
      });

      expect(Math.abs(result.loadings[0][0])).toBeGreaterThan(0.7);
      expect(Math.abs(result.loadings[0][1])).toBeGreaterThan(0.7);
      expect(Math.abs(result.loadings[0][2])).toBeGreaterThan(0.7);
      expect(Math.abs(result.loadings[1][3])).toBeGreaterThan(0.6);
      expect(Math.abs(result.loadings[1][4])).toBeGreaterThan(0.6);
      expect(Math.abs(result.loadings[1][5])).toBeGreaterThan(0.6);
    });

    test('handles automatic factor number determination', () => {
      const result = FactorAnalysis.compute({
        correlationMatrix: twoFactorMatrix
      });
      expect(result.loadings.length).toBe(2);
    });

    test('respects configuration options', () => {
      const resultMaxIter = FactorAnalysis.compute({
        correlationMatrix: simpleMatrix,
        numFactors: 2,
        options: { maxIterations: 1 }
      });
      expect(resultMaxIter.iterations).toBeLessThanOrEqual(2);

      const unrotated = FactorAnalysis.compute({
        correlationMatrix: simpleMatrix,
        numFactors: 2,
        options: { rotateFactors: false }
      });
      const rotated = FactorAnalysis.compute({
        correlationMatrix: simpleMatrix,
        numFactors: 2,
        options: { rotateFactors: true }
      });
      expect(unrotated.loadings).not.toEqual(rotated.loadings);
      expect(unrotated.totalVariance).toBeCloseTo(rotated.totalVariance, 5);
    });
  });

  describe('Error Handling', () => {
    test('rejects invalid correlation matrices', () => {
      const nonsymmetric = [
        [1.0, 0.8, 0.6],
        [0.7, 1.0, 0.7],
        [0.6, 0.7, 1.0]
      ];
      expect(() =>
        FactorAnalysis.compute({
          correlationMatrix: nonsymmetric,
          numFactors: 2
        })
      ).toThrow('Invalid correlation matrix');

      const badDiagonal = [
        [0.9, 0.8, 0.6],
        [0.8, 1.0, 0.7],
        [0.6, 0.7, 1.0]
      ];
      expect(() =>
        FactorAnalysis.compute({
          correlationMatrix: badDiagonal,
          numFactors: 2
        })
      ).toThrow('Invalid correlation matrix');

      const impossible = [
        [1.0, 1.2, 0.6],
        [1.2, 1.0, 0.7],
        [0.6, 0.7, 1.0]
      ];
      expect(() =>
        FactorAnalysis.compute({
          correlationMatrix: impossible,
          numFactors: 2
        })
      ).toThrow('Invalid correlation matrix');
    });

    test('validates number of factors', () => {
      [0, 3, 4].forEach((numFactors) => {
        expect(() =>
          FactorAnalysis.compute({
            correlationMatrix: simpleMatrix,
            numFactors
          })
        ).toThrow('Invalid number of factors');
      });
    });
  });

  describe('Numerical Stability', () => {
    test('handles nearly singular matrices', () => {
      const nearSingular = [
        [1.0, 0.99, 0.99],
        [0.99, 1.0, 0.99],
        [0.99, 0.99, 1.0]
      ];

      const result = FactorAnalysis.compute({
        correlationMatrix: nearSingular,
        numFactors: 1
      });
      expect(result.converged).toBe(true);
      expect(result.loadings.length).toBe(1);
    });

    test('regularization works effectively', () => {
      const nearSingular = [
        [1.0, 0.99, 0.98],
        [0.99, 1.0, 0.97],
        [0.98, 0.97, 1.0]
      ];

      const before = FactorAnalysis['eigenDecomposition'](nearSingular);
      expect(Math.min(...before.values)).toBeLessThan(0.1);

      const regularized = FactorAnalysis['regularizeMatrix']({
        matrix: nearSingular,
        epsilon: 1e-6
      });
      const after = FactorAnalysis['eigenDecomposition'](regularized);
      expect(Math.min(...after.values)).toBeGreaterThan(
        Math.min(...before.values)
      );

      const resultLow = FactorAnalysis.compute({
        correlationMatrix: nearSingular,
        numFactors: 1,
        options: { regularization: 1e-6 }
      });
      const resultHigh = FactorAnalysis.compute({
        correlationMatrix: nearSingular,
        numFactors: 1,
        options: { regularization: 1e-3 }
      });
      expect(resultHigh.uniquenesses[0]).toBeGreaterThanOrEqual(
        resultLow.uniquenesses[0]
      );
    });
  });

  describe('Statistical Properties', () => {
    test('reproduces correlation structure', () => {
      const result = FactorAnalysis.compute({
        correlationMatrix: simpleMatrix,
        numFactors: 2
      });

      const reconstructed = Array(simpleMatrix.length)
        .fill(0)
        .map((_, i) =>
          Array(simpleMatrix.length)
            .fill(0)
            .map((_, j) => {
              if (i === j) return 1;
              return result.loadings.reduce(
                (sum, factor) => sum + factor[i] * factor[j],
                0
              );
            })
        );

      for (let i = 0; i < simpleMatrix.length; i++) {
        for (let j = 0; j < simpleMatrix.length; j++) {
          expect(reconstructed[i][j]).toBeCloseTo(simpleMatrix[i][j], 1);
        }
      }
    });

    test('explains sufficient variance', () => {
      const clearStructure = [
        [1.0, 0.9, 0.9, 0.1],
        [0.9, 1.0, 0.9, 0.1],
        [0.9, 0.9, 1.0, 0.1],
        [0.1, 0.1, 0.1, 1.0]
      ];

      const result = FactorAnalysis.compute({
        correlationMatrix: clearStructure,
        numFactors: 2
      });
      expect(result.totalVariance).toBeGreaterThan(80);
      expect(result.explained[0]).toBeGreaterThan(result.explained[1]);
    });

    test('computes accurate eigenvalues and loadings', () => {
      const testMatrix = [
        [1.0, 0.7, 0.7],
        [0.7, 1.0, 0.7],
        [0.7, 0.7, 1.0]
      ];

      const result = FactorAnalysis.compute({
        correlationMatrix: testMatrix,
        numFactors: 2
      });
      expect(result.eigenvalues![0]).toBeCloseTo(2.4, 1);
      expect(result.eigenvalues![1]).toBeCloseTo(0.3, 1);
      expect(result.eigenvalues![2]).toBeCloseTo(0.3, 1);
    });

    test('calculates appropriate communalities', () => {
      const testMatrix = [
        [1.0, 0.8, 0.2],
        [0.8, 1.0, 0.2],
        [0.2, 0.2, 1.0]
      ];

      const result = FactorAnalysis.compute({
        correlationMatrix: testMatrix,
        numFactors: 2
      });

      expect(result.communalities[0]).toBeGreaterThan(0.7);
      expect(result.communalities[1]).toBeGreaterThan(0.7);
      expect(result.communalities[2]).toBeGreaterThan(0.6);
      expect(result.communalities[2]).toBeLessThan(0.9);
    });
  });

  // Add cleanup to prevent open handles
  afterAll(() => {
    return new Promise((resolve) => setTimeout(resolve, 500));
  });
});
