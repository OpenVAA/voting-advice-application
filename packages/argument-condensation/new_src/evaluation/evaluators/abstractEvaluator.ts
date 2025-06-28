import { LLMResponseContract } from '../../core/parser/llmParser';
import { SingleEvaluationInput, SystemEvaluationInput } from '../types/evaluationInput';
import { SingleEvaluationResult, SystemEvaluationResult } from '../types/evaluationOutput';

/**
 * Evaluation response structure
 */
interface EvaluationResponse {
  score: number;
  explanation: string;
}

/**
 * Contract for EvaluationResponse validation
 */
export const EvaluationResponseContract: LLMResponseContract<EvaluationResponse> = {
  validate(obj: any): obj is EvaluationResponse {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.score === 'number' &&
      typeof obj.explanation === 'string'
    );
  }
};

/**
 * Abstract base class for all evaluators.
 * Defines the interface and provides common functionality.
 */
export abstract class BaseEvaluator {
  protected readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Evaluate a single test case. Must be implemented by subclasses.
   */
  abstract evaluateSingle(input: SingleEvaluationInput): Promise<SingleEvaluationResult>;

  /**
   * Evaluate multiple test cases. Default implementation calls evaluateSingle for each. Can be parallelized.
   */
  async evaluateSystem(input: SystemEvaluationInput): Promise<SystemEvaluationResult> {
    const results: SingleEvaluationResult[] = [];
    
    for (const singleInput of input.inputs) {
      const result = await this.evaluateSingle(singleInput);
      results.push(result);
    }

    return {
      results,
      metrics: this.calculateMetrics(results)
    };
  }

  /**
   * Calculate summary metrics from individual results.
   */
  private calculateMetrics(results: SingleEvaluationResult[]) {
    const scores = results.map(r => r.score);
    return {
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      totalTestCases: results.length
    };
  }

  getName(): string {
    return this.name;
  }
}