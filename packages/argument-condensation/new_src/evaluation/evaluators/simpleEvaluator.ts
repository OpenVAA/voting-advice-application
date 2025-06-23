import { BaseEvaluator } from './abstractEvaluator';
import { SingleEvaluationInput } from '../types/evaluationInput';
import { SingleEvaluationResult } from '../types/evaluationOutput';
import { LLMProvider, Message } from '@openvaa/llm';
import { Argument } from '../../core/types';
import { LlmParser, LLMResponseContract } from '../../core/parser/llmParser';

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
const EvaluationResponseContract: LLMResponseContract<EvaluationResponse> = {
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
 * Uses an LLM to compare arguments with a simple prompt.
 */
export class SimpleEvaluator extends BaseEvaluator {
  private readonly llmProvider: LLMProvider;

  constructor(llmProvider: LLMProvider) {
    super("SimpleEvaluator");
    this.llmProvider = llmProvider;
  }

  /**
   * Evaluates a single test case by comparing system arguments against expected arguments.
   */
  async evaluateSingle(input: SingleEvaluationInput): Promise<SingleEvaluationResult> {
    try {
      const prompt = this.buildEvaluationPrompt(input);
      
      const response = await this.llmProvider.generate({
        messages: [
          new Message({ role: 'system', content: prompt })
        ],
        temperature: 0.3 
      });

      const evaluation = this.parseEvaluationResponse(response.content);

      return {
        topic: input.topic,
        score: evaluation.score,
        explanation: evaluation.explanation,
        input: input
      };
    } catch (error) {
      throw new Error(`Error evaluating arguments: ${error}`);
    }
  }

  /**
   * Builds the evaluation prompt for comparing arguments.
   */
  private buildEvaluationPrompt(input: SingleEvaluationInput): string {
    const systemArgsText = this.formatArguments(input.systemArguments);
    const expectedArgsText = this.formatArguments(input.expectedArguments);

    return `You are an expert evaluator tasked with evaluating the quality of arguments produced by an autonomous argument finding system.
    
    Your job is to analyze how well the system has performed its job. 
    Do this by analyzing how well the produced arguments align with the target arguments curated by a human doing the same argument finding task.
    Provide a score between 0 and 10 with your reasoning for the score.

    ## DATA:

    # Topic: ${input.topic}

    # Target Arguments (Expected):
    ${expectedArgsText}

    # Produced Arguments (System Output):
    ${systemArgsText}

    Respond in the following JSON format:
    {
      "score": [0-10],
      "explanation": [Brief explanation of the score focusing on alignment quality]
    }`;
}

  /**
   * Formats arguments for display in the prompt.
   */
  private formatArguments(args: Argument[]): string {
    if (!args || args.length === 0) {
      return "No arguments provided";
    }

    return args
      .map((arg, index) => `${index + 1}. ${arg.text}`)
      .join('\n');
  }

  /**
   * Parses the LLM response to extract score and explanation using LlmParser.
   */
  private parseEvaluationResponse(response: string): { score: number; explanation: string } {
    try {
      const parsed = LlmParser.parse(response, EvaluationResponseContract);
      
      // Ensure score is within valid range
      const score = Math.max(0, Math.min(10, parsed.score));
      
      return {
        score,
        explanation: parsed.explanation
      };
    } catch (error) {
      throw new Error(`Failed to parse evaluation response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 