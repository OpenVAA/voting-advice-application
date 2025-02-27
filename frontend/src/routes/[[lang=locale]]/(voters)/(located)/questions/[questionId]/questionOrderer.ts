import type { AnyQuestionVariant } from '@openvaa/data';
import type { FactorAnalysisOutput, IQuestionOrderer } from './questionOrderer.type';

// Only keep the loading threshold as a true constant
const LOADING_THRESHOLD = 0.1;

/**
 * QuestionOrderer - Orders questions by information gain based on factor loadings
 */
export class QuestionOrderer implements IQuestionOrderer {
  private questions: Array<AnyQuestionVariant>;
  private factorLoadings: Array<Array<number>>;
  private questionMap: Map<string, number>;

  /**
   * Create a QuestionOrderer
   * @param questions - Array of questions to order
   * @param factorAnalysis - Factor analysis results
   */
  constructor(questions: Array<AnyQuestionVariant>, factorAnalysis: FactorAnalysisOutput) {
    this.questions = questions;
    this.factorLoadings = factorAnalysis.questionFactorLoadings;

    // Create a map of question IDs to their indices
    this.questionMap = new Map();
    questions.forEach((q, index) => {
      this.questionMap.set(q.id, index);
    });
  }

  /**
   * Get next questions with highest information gain
   * @param answeredIds - IDs of questions already answered
   * @param count - Number of questions to return
   * @returns Array of questions with highest information gain
   */
  public getNextQuestions(answeredIds: Array<string>, count: number): Array<AnyQuestionVariant> {
    // Filter questions that haven't been answered yet
    const unansweredQuestions = this.questions.filter((q) => !answeredIds.includes(q.id));

    if (unansweredQuestions.length === 0) return [];

    // Calculate information gain for each question
    const questionsWithGain = unansweredQuestions.map((q) => ({
      question: q,
      gain: this.calculateInformationGain(q.id, answeredIds)
    }));

    // Sort by information gain (highest first) and return top count
    return questionsWithGain
      .sort((a, b) => b.gain - a.gain)
      .slice(0, count)
      .map((item) => item.question);
  }

  /**
   * Calculate information gain for a question
   * @param questionId - ID of the question
   * @param answeredIds - IDs of questions already answered
   * @returns Information gain value
   */
  private calculateInformationGain(questionId: string, answeredIds: Array<string>): number {
    const questionIndex = this.questionMap.get(questionId);

    // Return 0 if question not found in factor loadings
    if (questionIndex === undefined || questionIndex >= this.factorLoadings.length) {
      return 0;
    }

    // Calculate direct information gain
    const directGain = this.calculateResidualEntropy(questionId, answeredIds);

    // Calculate indirect gain based on factor loadings
    const loadings = this.factorLoadings[questionIndex];
    const indirectGain = loadings.reduce((sum, loading) => sum + Math.abs(loading), 0) / loadings.length;

    // Combine direct and indirect gain with weights
    return directGain * 0.7 + indirectGain * 0.3;
  }

  /**
   * Calculate residual entropy (information potential) for a question
   * @param questionId - ID of the question
   * @param answeredIds - IDs of questions already answered
   * @returns Entropy value
   */
  private calculateResidualEntropy(questionId: string, answeredIds: Array<string>): number {
    const questionIndex = this.questionMap.get(questionId);

    if (questionIndex === undefined || questionIndex >= this.factorLoadings.length) {
      return 0;
    }

    // If no questions answered yet, return baseline entropy
    if (answeredIds.length === 0) {
      return 1.0;
    }

    const loadings = this.factorLoadings[questionIndex];
    let explainedVariance = 0;

    // For each factor, calculate how much is already explained by answered questions
    for (let factorIdx = 0; factorIdx < loadings.length; factorIdx++) {
      const loading = loadings[factorIdx];

      // Skip insignificant loadings
      if (Math.abs(loading) < LOADING_THRESHOLD) continue;

      // Find maximum loading on this factor from answered questions
      const maxExplainedLoading = answeredIds
        .map((id) => {
          const idx = this.questionMap.get(id);
          if (idx === undefined || idx >= this.factorLoadings.length) return 0;
          return Math.abs(this.factorLoadings[idx][factorIdx]);
        })
        .reduce((max, val) => Math.max(max, val), 0);

      // Add to explained variance
      explainedVariance += loading * loading * maxExplainedLoading;
    }

    // Calculate residual variance
    const residualVariance = Math.max(0.1, 1 - explainedVariance);

    // Get the actual question to determine its choices
    const question = this.questions.find((q) => q.id === questionId);

    // Dynamically determine number of categories from the question
    let numCategories = 5; // Default fallback

    if (question && 'choices' in question) {
      numCategories = question.choices.length;
    }

    // Calculate entropy with dynamic category count
    const entropy = Math.log(residualVariance * numCategories);

    return Math.max(0, entropy);
  }
}

/**
 * Create mock factor analysis data for testing
 * @param questionCount - Number of questions
 * @returns Mock factor analysis output
 */
export function getMockFactorData(questionCount: number): FactorAnalysisOutput {
  return {
    questionFactorLoadings: Array(questionCount)
      .fill(0)
      .map(
        () => [Math.random() * 0.9, Math.random() * 0.9] // Two factors with random loadings
      ),
    explainedVariancePerFactor: [60, 20],
    totalExplainedVariance: 80,
    communalities: Array(questionCount).fill(0.8),
    converged: true
  };
}
