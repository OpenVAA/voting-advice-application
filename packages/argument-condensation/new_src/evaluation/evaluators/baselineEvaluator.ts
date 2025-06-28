import { BaseEvaluator } from './abstractEvaluator';
import { SingleEvaluationInput } from '../types/evaluationInput';
import { SingleEvaluationResult } from '../types/evaluationOutput';
import { LLMProvider, Message } from '@openvaa/llm';
import { Argument } from '../../core/types';
import { LlmParser } from '../../core/parser/llmParser';
import { EvaluationResponseContract } from './abstractEvaluator';
import { loadPromptTemplate } from '../../core/utils/loadPrompt';
/**
 * Uses an LLM to compare arguments with a baseline prompt.
 */
export class BaselineEvaluator extends BaseEvaluator {
  private readonly llmProvider: LLMProvider;

  constructor(llmProvider: LLMProvider) {
    super("BaselineEvaluator");
    this.llmProvider = llmProvider;
  }

  /**
   * Evaluates a single test case by comparing system arguments against expected arguments.
   */
  async evaluateSingle(input: SingleEvaluationInput): Promise<SingleEvaluationResult> {
    try {
      const prompt = await this.buildEvaluationPrompt(input);
      
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
   * Builds the evaluation prompt for comparing arguments using the loaded template.
   */
  private async buildEvaluationPrompt(input: SingleEvaluationInput): Promise<string> {
    const template = loadPromptTemplate('EVALS', 'baselineEvaluator');
    const systemArgsText = this.formatArguments(input.systemArguments);
    const expectedArgsText = this.formatArguments(input.expectedArguments);

    // Replace template variables
    let prompt = template;
    prompt = prompt.replace(/\$\{input\.topic\}/g, input.topic);
    prompt = prompt.replace(/\$\{expectedArgsText\}/g, expectedArgsText);
    prompt = prompt.replace(/\$\{systemArgsText\}/g, systemArgsText);

    return prompt;
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