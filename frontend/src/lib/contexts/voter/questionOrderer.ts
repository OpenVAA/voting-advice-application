import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { FactorLoading } from './factorLoadings/factorLoading';

/**
 * QuestionOrderer - Orders questions by information gain based on factor loadings
 */
export class QuestionOrderer {
  private questions: Array<AnyQuestionVariant>;
  private factorLoadingsPerElection: Array<Array<Array<number>>>;
  private questionMap: Map<Id, number>;

  /**
   * Exponent used in the diminishing returns function for confidence calculation.
   * - Higher values (>3): Give more weight to initial question answers, reaching high confidence quickly
   * - Lower values (<3): Create a more linear relationship requiring more diverse answers
   * - Default (3): Balanced approach suitable for most applications
   */
  private diminishingReturnsExponent: number = 3;

  /**
   * Create a QuestionOrderer
   * @param questions - Array of questions to order
   * @param factorLoadingDataArray - Array of factor loadings from different elections
   */
  constructor(
    questions: Array<AnyQuestionVariant>,
    factorLoadingDataArray: Array<FactorLoading>,
    options?: { diminishingReturnsExponent?: number }
  ) {
    this.questions = questions;

    // Create a map of question IDs to their indices
    this.questionMap = new Map();
    questions.forEach((q, index) => {
      this.questionMap.set(q.id, index);
    });

    if (options?.diminishingReturnsExponent !== undefined) {
      this.diminishingReturnsExponent = options.diminishingReturnsExponent;
    }

    // Convert the backend format to our internal 3D array format
    // First dimension: elections
    // Second dimension: questions
    // Third dimension: factors
    this.factorLoadingsPerElection = factorLoadingDataArray.map((factorLoadingData) =>
      this.convertFactorLoadings(factorLoadingData)
    );
  }

  /**
   * Convert backend factor loading format to internal 2D array for a single election
   */
  private convertFactorLoadings(factorLoadingData: FactorLoading): Array<Array<number>> {
    const factorCount = factorLoadingData.explainedVariancePerFactor.length;
    const loadings = Array(this.questions.length)
      .fill(0)
      .map(() => Array(factorCount).fill(0));

    // Map loadings from backend format to our internal format
    factorLoadingData.questionFactorLoadings.forEach((loading) => {
      const questionIndex = this.questionMap.get(loading.questionId);
      if (questionIndex !== undefined) {
        loadings[questionIndex] = loading.factors;
      }
    });

    return loadings;
  }

  /**
   * Get next questions with highest information gain
   * @param answeredIds - IDs of questions already answered
   * @param count - Number of questions to return
   * @returns Array of questions with highest information gain
   */
  public getNextQuestions(answeredIds: Array<Id>, count: number): Array<AnyQuestionVariant> {
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
   * Calculate information gain for a question across all elections
   * @param questionId - ID of the question
   * @param answeredIds - IDs of questions already answered
   * @returns Information gain value (summed across all elections)
   */
  calculateInformationGain(questionId: Id, answeredIds: Array<Id>): number {
    // Calculate information gain for each election and sum them
    // You could use Math.max(...gains) instead of reduce((sum, gain) => sum + gain, 0) for maximum instead of sum
    return this.factorLoadingsPerElection
      .map((_, electionIndex) => this.calculateInformationGainForElection(questionId, answeredIds, electionIndex))
      .reduce((sum, gain) => sum + gain, 0);
  }

  /**
   * Calculate information gain for a question for a specific election
   * @param questionId - ID of the question
   * @param answeredIds - IDs of questions already answered
   * @param electionIndex - Index of the election
   * @returns Information gain value for the specific election
   */
  calculateInformationGainForElection(questionId: Id, answeredIds: Array<Id>, electionIndex: number): number {
    const questionIdx = this.questionMap.get(questionId);
    if (questionIdx === undefined) {
      console.error(`Question ID ${questionId} not found in map`);
      return 0;
    }

    // If this question doesn't have factor loadings for this election, return 0
    const factorLoadings = this.factorLoadingsPerElection[electionIndex][questionIdx];
    if (!factorLoadings || factorLoadings.every((loading) => Math.abs(loading) < 0.01)) {
      return 0;
    }

    // Get direct information from residual entropy
    const residualEntropy = this.calculateResidualEntropyForElection(questionId, answeredIds, electionIndex);
    let infoValue = residualEntropy;

    // Calculate indirect information gain
    let indirectGain = 0.0;

    // For each factor
    for (let factorIdx = 0; factorIdx < factorLoadings.length; factorIdx++) {
      // Get this question's loading on this factor
      const factorWeight = factorLoadings[factorIdx];

      // If loading is insignificant, skip
      if (Math.abs(factorWeight) < 0.01) continue;

      // For each other question
      for (const otherQuestion of this.questions) {
        const otherQuestionId = otherQuestion.id;
        const otherQuestionIdx = this.questionMap.get(otherQuestionId);

        // Skip if: same question, already answered, or index not found
        if (otherQuestionId === questionId || answeredIds.includes(otherQuestionId) || otherQuestionIdx === undefined) {
          continue;
        }

        // Get other question's loading on this factor
        const otherLoadings = this.factorLoadingsPerElection[electionIndex][otherQuestionIdx];
        if (!otherLoadings) continue;

        const otherWeight = otherLoadings[factorIdx];

        // If loading is insignificant, skip
        if (Math.abs(otherWeight) < 0.01) continue;

        // Calculate contribution
        const contribution =
          factorWeight *
          otherWeight *
          this.calculateResidualEntropyForElection(otherQuestionId, answeredIds, electionIndex);
        indirectGain += contribution;
      }
    }

    // Add indirect gain to total info value
    infoValue += indirectGain;

    return infoValue;
  }

  /**
   * Calculate residual entropy for a question for a specific election
   * @param questionId - ID of the question
   * @param answeredIds - IDs of questions already answered
   * @param electionIndex - Index of the election
   * @returns Entropy value
   */
  calculateResidualEntropyForElection(questionId: Id, answeredIds: Array<Id>, electionIndex: number): number {
    // Early return if no questions have been answered
    if (answeredIds.length === 0) {
      return 1.0;
    }

    // Get the index for this question
    const questionIdx = this.questionMap.get(questionId);
    if (questionIdx === undefined) {
      console.error(`Question ID ${questionId} not found in map`);
      return 0;
    }

    // Get factor loadings for this question across all factors for this election
    const factorLoadings = this.factorLoadingsPerElection[electionIndex][questionIdx];

    // If this question doesn't have factor loadings for this election, return 0
    if (!factorLoadings) return 0;

    let explainedVariance = 0.0;

    // For each factor, calculate its contribution to explained variance
    for (let factorIdx = 0; factorIdx < factorLoadings.length; factorIdx++) {
      const loading = factorLoadings[factorIdx];

      // Find maximum loading on this factor from answered questions
      let factorDetermination = 0;
      for (const answeredId of answeredIds) {
        const answeredIdx = this.questionMap.get(answeredId);
        if (answeredIdx !== undefined) {
          const answerLoadings = this.factorLoadingsPerElection[electionIndex][answeredIdx];
          if (answerLoadings) {
            const absLoading = Math.abs(answerLoadings[factorIdx]);
            if (absLoading > factorDetermination) {
              factorDetermination = absLoading;
            }
          }
        }
      }

      // Add to explained variance
      explainedVariance += loading * loading * (1 - factorDetermination);
    }

    // Calculate residual variance with minimum of 1e-10
    const residualVariance = Math.max(1e-10, 1 - explainedVariance);

    // Get number of categories for this question
    const question = this.questions.find((q) => q.id === questionId);
    const numCategories = question && 'choices' in question ? question.choices.length : 5;

    // Base entropy from continuous approximation
    const continuousEntropy = 0.5 * Math.log(2 * Math.PI * Math.E * residualVariance);

    // Correction for discretization
    const width = Math.sqrt(residualVariance) / numCategories;
    const discretizationLoss = -Math.log(width);

    // Additional correction for ordinal nature
    const ordinalCorrection = Math.log(numCategories);

    // Final entropy calculation
    return Math.max(0, continuousEntropy - discretizationLoss + ordinalCorrection);
  }

  /**
   * Calculate confidence score based on answered questions
   * @param answeredIds - IDs of questions already answered
   * @returns A score between 0-100 representing confidence in recommendations
   */
  public calculateConfidenceScore(answeredIds: Array<Id>): number {
    // Early return for no answers
    if (answeredIds.length === 0) return 0;

    // Calculate factor coverage across all elections
    const factorConfidence = this.calculateFactorCoverage(answeredIds);

    // Apply non-linear transformation to create a user-friendly 0-100 scale
    return Math.round(this.transformToFriendlyScale(factorConfidence) * 100);
  }

  /**
   * Calculate how well the answered questions cover the factor space
   * @param answeredIds - IDs of questions already answered
   * @returns A value between 0-1 representing factor coverage
   */
  private calculateFactorCoverage(answeredIds: Array<Id>): number {
    let totalCoverage = 0;
    let totalPossible = 0;

    // Calculate coverage for each election and sum them
    for (const factorLoadings of this.factorLoadingsPerElection) {
      if (!factorLoadings.length) continue;

      const numFactors = factorLoadings[0]?.length;
      if (!numFactors) continue;

      // Process each factor
      for (let factorIdx = 0; factorIdx < numFactors; factorIdx++) {
        // Calculate factor importance (sum of squared loadings)
        // This represents how much variance this factor explains
        let factorImportance = 0;
        for (const loadings of factorLoadings) {
          if (!loadings) continue;
          const loading = loadings[factorIdx] ?? 0;
          factorImportance += loading * loading;
        }

        // Skip factors with negligible importance
        if (factorImportance < 0.01) continue;

        // Calculate coverage from answered questions
        // This measures how much of this factor is represented by answered questions
        let factorCoverage = 0;
        for (const answeredId of answeredIds) {
          const questionIdx = this.questionMap.get(answeredId);
          if (questionIdx === undefined) continue;

          const loadings = factorLoadings[questionIdx];
          if (!loadings) continue;

          const loading = loadings[factorIdx] ?? 0;
          factorCoverage += loading * loading;
        }

        // Apply diminishing returns function to model information gain
        // This reflects the principle that additional similar questions provide
        // less new information than diverse questions. The formula 1-exp(-k*x)
        // creates a curve that rises quickly at first and then levels off.
        const coverageRatio = Math.min(1.0, factorCoverage / factorImportance);
        const effectiveCoverage = (1.0 - Math.exp(-this.diminishingReturnsExponent * coverageRatio)) * factorImportance;

        // Add to totals
        totalCoverage += effectiveCoverage;
        totalPossible += factorImportance;
      }
    }

    return totalPossible > 0 ? totalCoverage / totalPossible : 0;
  }

  /**
   * Transform linear confidence score to user-friendly scale with
   * better discrimination in middle ranges.
   *
   * Uses a sigmoid function that:
   * - Stretches the middle range (around 0.5) for better differentiation
   * - Compresses extremes (near 0 or 1) for more intuitive scaling
   * - Centers the transition at 0.5 (50% raw coverage)
   * - Uses steepness parameter 8 for appropriate curve shape
   */
  private transformToFriendlyScale(value: number): number {
    // Simple sigmoid function to create better separation in middle range
    return 1 / (1 + Math.exp(-8 * (value - 0.5)));
  }
}
