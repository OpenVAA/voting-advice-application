import { afterAll, describe, expect, test } from 'vitest';
import { analyzeFactors } from './api';

describe('API Integration', () => {
  describe('Input Validation', () => {
    test('handles typical questionnaire data correctly', () => {
      const responses = [
        [4, 2, 5, 1, 3], // Question 1 responses
        [3, 4, 1, 2, 5], // Question 2 responses
        [1, 5, 3, 4, 2] // Question 3 responses
      ];
      const result = analyzeFactors({ responses });
      expect(result.questionFactorLoadings.length).toBe(3); // 3 questions
    });

    test('validates response matrix dimensions', () => {
      // Inconsistent response counts
      const badResponses = [
        [1, 2, 3, 4],
        [1, 2, 3], // Different length!
        [1, 2, 3, 4]
      ];
      expect(() => analyzeFactors({ responses: badResponses })).toThrow('All response rows must have same length');
    });
  });

  describe('Performance', () => {
    test('handles large response counts efficiently', () => {
      const nQuestions = 20;
      const nResponses = 5000;
      const responses = Array(nQuestions)
        .fill(0)
        .map(() =>
          Array(nResponses)
            .fill(0)
            .map(() => Math.floor(Math.random() * 5) + 1)
        );

      const startTime = performance.now();
      const result = analyzeFactors({ responses });
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(10000); // Should complete in under 10s
      expect(result.questionFactorLoadings.length).toBe(nQuestions);
    });

    test('handles random large matrices', () => {
      // starts getting really inefficient after 100. Some kind of quadratic scaling.
      // This is driven by polychoric correlation getting slower with longer vectors
      // (since the number of correlations to compute remains the same)
      const nOfResponses = 5000;
      const nOfQuestions = 30;
      const responses = Array(nOfQuestions)
        .fill(0)
        .map(() =>
          Array(nOfResponses)
            .fill(0)
            .map(() => Math.floor(Math.random() * 5) + 1)
        );
      expect(() => analyzeFactors({ responses })).not.toThrow();
    });
  });

  describe('Result Quality', () => {
    test('produces meaningful factors for known patterns', () => {
      const responses = [
        [5, 5, 5, 5, 5, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5],
        [5, 5, 5, 5, 5, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5],
        [1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        [1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
      ];

      const result = analyzeFactors({
        responses,
        numFactors: 2,
        options: { rotateFactors: true }
      });

      const loadings = result.questionFactorLoadings;

      // First factor should strongly distinguish Q1/Q2 from Q3/Q4
      expect(Math.abs(loadings[0][0])).toBeGreaterThan(0.7); // Q1 loads on factor1
      expect(Math.abs(loadings[1][0])).toBeGreaterThan(0.7); // Q2 loads on factor1
      expect(Math.sign(loadings[0][0])).toBe(-Math.sign(loadings[2][0])); // Opposite signs
      expect(Math.sign(loadings[1][0])).toBe(-Math.sign(loadings[3][0])); // Opposite signs

      // Second factor should have moderate positive loadings for all
      expect(loadings[0][1]).toBeGreaterThan(0.3);
      expect(loadings[1][1]).toBeGreaterThan(0.3);
      expect(loadings[2][1]).toBeGreaterThan(0.3);
      expect(loadings[3][1]).toBeGreaterThan(0.3);
    });
  });

  // Add cleanup to prevent open handles
  afterAll(() => {
    return new Promise((resolve) => setTimeout(resolve, 500));
  });
});
