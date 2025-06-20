import { Argument, CondensationRunInput, CondensationRunResult } from './types';
import { CondensationPhase } from './types/condensationPhase';
import { PromptCall } from './types/promptCall';
import { PipelineSignature } from './types/pipelineSignature';
import { PartialCondensationRunRecord, FullCondensationRunRecord } from '../evaluation/types/analytics/runRecord';
import { CacheManager } from '../evaluation/cacheManager';
import { CONDENSATION_METHOD } from './types/condensationMethod';
import { PerformanceTracker } from '../evaluation/performanceTracker';
import { LlmParser } from './parser/llmParser';
import { ResponseWithArguments } from './types/responseWithArguments';

/**
 * Stateful condenser that manages the three-phase condensation process.
 * Saves partial results after each phase for caching and performance testing.
 */
export class Condenser {
  private runId: string;
  private pipelineSignature: PipelineSignature = [];
  private allPromptCalls: PromptCall[] = [];
  private cacheManager: CacheManager;
  private performanceTracker = new PerformanceTracker();

  constructor(private input: CondensationRunInput) {
    this.runId = input.runId;
    this.cacheManager = new CacheManager(input.electionId); // TODO: make this configurable
  }

  /**
   * Run the complete three-phase condensation process.
   */
  async run(): Promise<CondensationRunResult> {
    // Load deprecated prompts
    await this.cacheManager.loadDeprecatedPrompts();

    // Phase 1: Initial batch condensation
    const phase1Result = await this.runInitialBatchCondensation();
    await this.savePartialResult('initialCondensation', phase1Result);

    // Phase 2: Main condensation
    const phase2Result = await this.runMainCondensation(phase1Result.arguments);
    await this.savePartialResult('mainCondensation', phase2Result);

    // Phase 3: Argument list improvement
    const phase3Result = await this.runArgumentListImprovement(phase2Result.arguments);
    await this.saveFinalResult(phase3Result);

    // Return the final result
    return {
      runId: this.runId,
      input: this.input,
      arguments: phase3Result.arguments,
      metrics: {
        duration: 1.5, // stubbed
        nLlmCalls: this.allPromptCalls.length,
        cost: 0.05, // stubbed
        tokensUsed: { inputs: 1000, outputs: 200, total: 1200 } // stubbed
      },
      success: true,
      metadata: {
        llmModel: 'mock',
        language: this.input.config.language,
        startTime: new Date(),
        endTime: new Date()
      }
    };
  }

  /**
   * Phase 1: Initial batch condensation
   */
  private async runInitialBatchCondensation(): Promise<PhaseResult> {
    const promptId = this.input.config.initialCondensationPrompt.promptId;
    this.pipelineSignature.push({ phase: 'initialCondensation', promptId });

    // Stub LLM response
    const response = `{
      "arguments": [
        {
          "id": "pro_arg_1",
          "text": "Raising minimum wage reduces poverty and inequality"
        },
        {
          "id": "pro_arg_2", 
          "text": "Higher wages improve worker productivity and morale"
        }
      ],
      "reasoning": "Extracted two main pro arguments from the comments: economic benefits and worker welfare improvements."
    }`;

    // Parse and validate the response
    let parsedResponse: ResponseWithArguments;
    try {
      parsedResponse = LlmParser.parseArguments(response);
    } catch (error) {
      throw new Error(`Failed to parse initial condensation response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const promptCalls: PromptCall[] = [
      {
        promptId,
        phase: 'initialCondensation',
        rawInputText: `Initial condensation for question: ${this.input.question.topic}`,
        rawOutputText: response,
        model: 'mock',
        timestamp: new Date().toISOString(),
        metadata: { tokens: { input: 100, output: 50, total: 150 }, latency: 0.5 }
      }
    ];

    this.allPromptCalls.push(...promptCalls);

    return {
      arguments: parsedResponse.arguments,
      promptCalls
    };
  }

  /**
   * Phase 2: Main condensation
   */
  private async runMainCondensation(initialArgs: Argument[]): Promise<PhaseResult> {
    const promptId = this.input.config.mainCondensationPrompt.promptId;
    this.pipelineSignature.push({ phase: 'mainCondensation', promptId });

    // Stub LLM response
    const response = `{
      "arguments": [
        {
          "id": "refined_pro_arg_1",
          "text": "Minimum wage increases reduce poverty and improve economic equality"
        },
        {
          "id": "refined_pro_arg_2", 
          "text": "Higher wages boost worker productivity and reduce turnover"
        },
        {
          "id": "refined_pro_arg_3",
          "text": "Increased wages stimulate consumer spending and economic growth"
        }
      ],
      "reasoning": "Refined and consolidated the initial arguments, adding economic stimulus as a new perspective from the additional comments."
    }`;

    // Parse and validate the response
    let parsedResponse: ResponseWithArguments;
    try {
      parsedResponse = LlmParser.parseArguments(response);
    } catch (error) {
      throw new Error(`Failed to parse main condensation response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const promptCalls: PromptCall[] = [
      {
        promptId,
        phase: 'mainCondensation',
        rawInputText: `Main condensation for question: ${this.input.question.topic} with ${initialArgs.length} initial arguments`,
        rawOutputText: response,
        model: 'mock',
        timestamp: new Date().toISOString(),
        metadata: { tokens: { input: 200, output: 100, total: 300 }, latency: 1.0 }
      }
    ];

    this.allPromptCalls.push(...promptCalls);

    return {
      arguments: parsedResponse.arguments,
      promptCalls
    };
  }

  /**
   * Phase 3: Argument list improvement
   */
  private async runArgumentListImprovement(condensedArgs: Argument[]): Promise<PhaseResult> {
    const promptId = this.input.config.argumentImprovementPrompt.promptId;
    this.pipelineSignature.push({ phase: 'full', promptId });

    // Stub LLM response
    const response = `{
      "arguments": [
        {
          "id": "final_pro_arg_1",
          "text": "Minimum wage increases effectively reduce poverty and improve economic equality"
        },
        {
          "id": "final_pro_arg_2", 
          "text": "Higher wages boost worker productivity, reduce turnover, and improve job satisfaction"
        }
      ],
      "reasoning": "Improved argument clarity and combined related points for better impact and readability."
    }`;

    // Parse and validate the response
    let parsedResponse: ResponseWithArguments;
    try {
      parsedResponse = LlmParser.parseArguments(response);
    } catch (error) {
      throw new Error(`Failed to parse argument improvement response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const promptCalls: PromptCall[] = [
      {
        promptId,
        phase: 'full',
        rawInputText: `Improve arguments for question: ${this.input.question.topic} with ${condensedArgs.length} arguments`,
        rawOutputText: response,
        model: 'mock',
        timestamp: new Date().toISOString(),
        metadata: { tokens: { input: 150, output: 75, total: 225 }, latency: 0.8 }
      }
    ];

    this.allPromptCalls.push(...promptCalls);

    return {
      arguments: parsedResponse.arguments,
      promptCalls
    };
  }

  /**
   * Save partial result after each phase
   */
  private async savePartialResult(phase: CondensationPhase, result: PhaseResult) {
    const record: PartialCondensationRunRecord = {
      questionId: this.input.question.id,
      runId: this.runId,
      phase,
      method: CONDENSATION_METHOD.SEQUENTIAL,
      outputType: this.input.config.condensationType,
      pipelineSignature: [...this.pipelineSignature],
      promptCalls: [...this.allPromptCalls],
      timestamp: new Date().toISOString()
    };

    await this.cacheManager.savePartialResult(record);
  }

  /**
   * Save final result with evaluation
   */
  private async saveFinalResult(result: PhaseResult) {
    const record: FullCondensationRunRecord = {
      questionId: this.input.question.id,
      runId: this.runId,
      phase: 'full',  
      method: CONDENSATION_METHOD.SEQUENTIAL,
      outputType: this.input.config.condensationType,
      pipelineSignature: [...this.pipelineSignature],
      promptCalls: [...this.allPromptCalls],
      timestamp: new Date().toISOString(),
      evaluation: {
        score: 8, // stubbed evaluation
        explanation: 'Stub evaluation explanation'
      }
    };

    await this.cacheManager.saveFinalResult(record);

    // Update per-question performance metrics
    await this.performanceTracker.updateQuestionMetrics(
      this.input.electionId,
      this.input.config.condensationType,
      this.input.question.id,
      record
    );
  }
}

/**
 * Result from a single phase
 */
interface PhaseResult {
  arguments: Argument[];
  promptCalls: PromptCall[];
} 