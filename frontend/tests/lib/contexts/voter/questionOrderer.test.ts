import {
  type AnyQuestionVariant,
  DataRoot,
  QUESTION_TYPE,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { QuestionOrderer } from '../../../../src/lib/contexts/voter/questionOrderer';
import type { FactorLoading } from '$lib/contexts/voter/factorLoadings/factorLoading';

describe('QuestionOrderer with multiple elections', () => {
  // Create a data root instance for constructing questions
  const dataRoot = new DataRoot();

  // Create real SingleChoiceOrdinalQuestion instances
  const mockQuestions = [
    new SingleChoiceOrdinalQuestion({
      data: {
        id: 'q1',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        name: 'Question 1',
        categoryId: 'category1',
        choices: [
          { id: 'c1', label: 'Choice 1', normalizableValue: 1 },
          { id: 'c2', label: 'Choice 2', normalizableValue: 2 },
          { id: 'c3', label: 'Choice 3', normalizableValue: 3 }
        ]
      },
      root: dataRoot
    }),
    new SingleChoiceOrdinalQuestion({
      data: {
        id: 'q2',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        name: 'Question 2',
        categoryId: 'category1',
        choices: [
          { id: 'c4', label: 'Choice 4', normalizableValue: 1 },
          { id: 'c5', label: 'Choice 5', normalizableValue: 2 }
        ]
      },
      root: dataRoot
    }),
    new SingleChoiceOrdinalQuestion({
      data: {
        id: 'q3',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        name: 'Question 3',
        categoryId: 'category2',
        choices: [
          { id: 'c6', label: 'Choice 6', normalizableValue: 1 },
          { id: 'c7', label: 'Choice 7', normalizableValue: 2 },
          { id: 'c8', label: 'Choice 8', normalizableValue: 3 },
          { id: 'c9', label: 'Choice 9', normalizableValue: 4 }
        ]
      },
      root: dataRoot
    }),
    new SingleChoiceOrdinalQuestion({
      data: {
        id: 'q4',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        name: 'Question 4',
        categoryId: 'category2',
        choices: [
          { id: 'c10', label: 'Choice 10', normalizableValue: 1 },
          { id: 'c11', label: 'Choice 11', normalizableValue: 2 }
        ]
      },
      root: dataRoot
    })
  ] as Array<AnyQuestionVariant>;

  // Create a mock of the FactorLoading with just the properties that are used by QuestionOrderer
  class MockFactorLoading {
    explainedVariancePerFactor: Array<number>;
    questionFactorLoadings: Array<{
      questionId: string;
      factors: Array<number>;
    }>;

    constructor(
      explainedVariance: Array<number>,
      questionLoadings: Array<{ questionId: string; factors: Array<number> }>
    ) {
      this.explainedVariancePerFactor = explainedVariance;
      this.questionFactorLoadings = questionLoadings;
    }
  }

  // Create factor loading data for election 1
  const factorLoadingData1 = new MockFactorLoading(
    [0.5, 0.3],
    [
      { questionId: 'q1', factors: [0.8, 0.1] },
      { questionId: 'q2', factors: [0.7, 0.2] },
      { questionId: 'q3', factors: [0.1, 0.9] }
    ]
  );

  // Create factor loading data for election 2
  const factorLoadingData2 = new MockFactorLoading(
    [0.6, 0.2],
    [
      { questionId: 'q1', factors: [0.6, 0.3] },
      { questionId: 'q3', factors: [0.2, 0.8] },
      { questionId: 'q4', factors: [0.9, 0.1] }
    ]
  );

  test('constructor initializes with multiple factor loadings', () => {
    const orderer = new QuestionOrderer(mockQuestions, [
      factorLoadingData1 as unknown as FactorLoading,
      factorLoadingData2 as unknown as FactorLoading
    ]);
    expect(orderer).toBeDefined();
  });

  test('getNextQuestions returns empty array when all questions are answered', () => {
    const orderer = new QuestionOrderer(mockQuestions, [
      factorLoadingData1 as unknown as FactorLoading,
      factorLoadingData2 as unknown as FactorLoading
    ]);
    const answeredIds: Array<string> = ['q1', 'q2', 'q3', 'q4'];
    const nextQuestions = orderer.getNextQuestions(answeredIds, 2);
    expect(nextQuestions).toHaveLength(0);
  });

  test('getNextQuestions returns expected number of questions', () => {
    const orderer = new QuestionOrderer(mockQuestions, [
      factorLoadingData1 as unknown as FactorLoading,
      factorLoadingData2 as unknown as FactorLoading
    ]);
    const answeredIds: Array<string> = [];
    const nextQuestions = orderer.getNextQuestions(answeredIds, 2);
    expect(nextQuestions).toHaveLength(2);
  });

  test('getNextQuestions respects already answered questions', () => {
    const orderer = new QuestionOrderer(mockQuestions, [
      factorLoadingData1 as unknown as FactorLoading,
      factorLoadingData2 as unknown as FactorLoading
    ]);
    const answeredIds: Array<string> = ['q1', 'q3'];
    const nextQuestions = orderer.getNextQuestions(answeredIds, 2);
    expect(nextQuestions).toHaveLength(2);
    expect(nextQuestions.some((q) => q.id === 'q1')).toBe(false);
    expect(nextQuestions.some((q) => q.id === 'q3')).toBe(false);
  });

  test('calculateInformationGain handles question without factor loadings', () => {
    const orderer = new QuestionOrderer(mockQuestions, [
      factorLoadingData1 as unknown as FactorLoading,
      factorLoadingData2 as unknown as FactorLoading
    ]);
    // q2 is missing from election 2
    const infoGain = orderer.calculateInformationGain('q2', []);
    // Should still return non-zero value because q2 is in election 1
    expect(infoGain).toBeGreaterThan(0);
  });

  test('getNextQuestions with some answered questions', () => {
    const orderer = new QuestionOrderer(mockQuestions, [
      factorLoadingData1 as unknown as FactorLoading,
      factorLoadingData2 as unknown as FactorLoading
    ]);

    // Mock the calculateInformationGain method to return predetermined values
    const originalCalculate = orderer.calculateInformationGain;

    function mockMethod(questionId: string): number {
      const gains: Record<string, number> = {
        q1: 0.5,
        q2: 0.7,
        q3: 0.3,
        q4: 0.9
      };
      return gains[questionId] || 0;
    }

    // Use type assertion to override the method
    orderer.calculateInformationGain =
      mockMethod as typeof orderer.calculateInformationGain;

    const answeredIds: Array<string> = ['q3']; // Already answered q3
    const nextQuestions = orderer.getNextQuestions(answeredIds, 2);

    // Should return q4 and q2 as they have the highest mocked info gain
    expect(nextQuestions[0].id).toBe('q4');
    expect(nextQuestions[1].id).toBe('q2');

    // Restore original method
    orderer.calculateInformationGain = originalCalculate;
  });

  test('empty factor loadings array is handled gracefully', () => {
    const orderer = new QuestionOrderer(mockQuestions, []);
    const nextQuestions = orderer.getNextQuestions([], 2);

    // Should still return questions even with no factor loadings
    expect(nextQuestions).toHaveLength(2);

    // All information gains should be 0 since there are no factor loadings
    const infoGain = orderer.calculateInformationGain('q1', []);
    expect(infoGain).toBe(0);
  });

  test('questions with higher information gain are prioritized', () => {
    // Create custom factor loadings with predictable patterns
    const customFactorLoading1 = new MockFactorLoading(
      [0.5, 0.3],
      [
        { questionId: 'q1', factors: [0.3, 0.1] },
        { questionId: 'q2', factors: [0.4, 0.2] },
        { questionId: 'q3', factors: [0.9, 0.9] }, // Highest loadings
        { questionId: 'q4', factors: [0.5, 0.4] }
      ]
    ) as unknown as FactorLoading;

    const customFactorLoading2 = new MockFactorLoading(
      [0.6, 0.2],
      [
        { questionId: 'q1', factors: [0.2, 0.3] },
        { questionId: 'q2', factors: [0.3, 0.2] },
        { questionId: 'q3', factors: [0.8, 0.8] }, // Highest loadings
        { questionId: 'q4', factors: [0.4, 0.4] }
      ]
    ) as unknown as FactorLoading;

    const orderer = new QuestionOrderer(mockQuestions, [
      customFactorLoading1,
      customFactorLoading2
    ]);
    const nextQuestions = orderer.getNextQuestions([], 1);

    // With these factor loadings, q3 should have the highest information gain
    expect(nextQuestions).toHaveLength(1);
    expect(nextQuestions[0].id).toBe('q3');
  });

  test('question not in map returns zero information gain', () => {
    const orderer = new QuestionOrderer(mockQuestions, [
      factorLoadingData1 as unknown as FactorLoading,
      factorLoadingData2 as unknown as FactorLoading
    ]);
    const infoGain = orderer.calculateInformationGain('nonexistent', []);
    expect(infoGain).toBe(0);
  });
});
