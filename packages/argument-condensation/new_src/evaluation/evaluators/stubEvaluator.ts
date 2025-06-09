import { BaseEvaluator } from './abstractEvaluator';
import { SingleEvaluationInput } from '../types/evaluationInput';
import { SingleEvaluationResult } from '../types/evaluationOutput';

/**
 * Stub evaluator that returns mock scores for solving the dependency for the meta-evaluation system.
 * Always returns predictable results regardless of input.
 */
export class StubEvaluator extends BaseEvaluator {
  private readonly fixedScore: number;
  private readonly fixedExplanation: string;

  constructor(fixedScore: number = 7, fixedExplanation: string = "Mock evaluation result") {
    super("StubEvaluator");
    this.fixedScore = fixedScore;
    this.fixedExplanation = fixedExplanation;
  }

  /**
   * Stub implementation - returns fixed score regardless of input.
   */
  async evaluateSingle(input: SingleEvaluationInput): Promise<SingleEvaluationResult> {
    // Stub implementation - returns fixed score regardless of input
    return {
      topic: input.topic,
      score: this.fixedScore,
      explanation: this.fixedExplanation,
      input: input
    };
  }
}
