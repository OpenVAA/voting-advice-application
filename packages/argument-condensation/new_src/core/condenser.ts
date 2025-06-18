import { Argument, CondensationRunInput, CondensationRunResult } from './types';
import { CondensationPhase } from './types/condensationPhase';
import { PromptCall } from './types/promptCall';
import { PipelineSignature } from './types/pipelineSignature';
import { PartialCondensationRunRecord, FullCondensationRunRecord } from '../evaluation/types/analytics/runRecord';
import { CacheManager } from '../evaluation/cacheManager';
import { CONDENSATION_METHOD } from './types/condensationMethod';

/**
 * Stateful condenser that manages the three-phase condensation process.
 * Saves partial results after each phase for caching and performance testing.
 */
export class Condenser {
  private runId: string;
  private pipelineSignature: PipelineSignature = [];
  private allPromptCalls: PromptCall[] = [];
  private cacheManager: CacheManager;

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

    // Stub implementation - in real code, this would make LLM calls
    const promptCalls: PromptCall[] = [
      {
        promptId,
        phase: 'initialCondensation',
        rawInputText: `Initial condensation for question: ${this.input.question.topic}`,
        rawOutputText: 'Stub initial arguments',
        model: 'mock',
        timestamp: new Date().toISOString(),
        metadata: { tokens: { input: 100, output: 50, total: 150 }, latency: 0.5 }
      }
    ];

    this.allPromptCalls.push(...promptCalls);

    return {
      arguments: [
        { id: 'init-1', text: 'Initial argument 1' },
        { id: 'init-2', text: 'Initial argument 2' }
      ],
      promptCalls
    };
  }

  /**
   * Phase 2: Main condensation
   */
  private async runMainCondensation(initialArgs: Argument[]): Promise<PhaseResult> {
    const promptId = this.input.config.mainCondensationPrompt.promptId;
    this.pipelineSignature.push({ phase: 'mainCondensation', promptId });

    // Stub implementation
    const promptCalls: PromptCall[] = [
      {
        promptId,
        phase: 'mainCondensation',
        rawInputText: `Main condensation for question: ${this.input.question.topic} with ${initialArgs.length} initial arguments`,
        rawOutputText: 'Stub condensed arguments',
        model: 'mock',
        timestamp: new Date().toISOString(),
        metadata: { tokens: { input: 200, output: 100, total: 300 }, latency: 1.0 }
      }
    ];

    this.allPromptCalls.push(...promptCalls);

    return {
      arguments: [
        { id: 'main-1', text: 'Main condensed argument 1' },
        { id: 'main-2', text: 'Main condensed argument 2' },
        { id: 'main-3', text: 'Main condensed argument 3' }
      ],
      promptCalls
    };
  }

  /**
   * Phase 3: Argument list improvement
   */
  private async runArgumentListImprovement(condensedArgs: Argument[]): Promise<PhaseResult> {
    const promptId = this.input.config.argumentImprovementPrompt.promptId;
    this.pipelineSignature.push({ phase: 'full', promptId });

    // Stub implementation
    const promptCalls: PromptCall[] = [
      {
        promptId,
        phase: 'full',
        rawInputText: `Improve arguments for question: ${this.input.question.topic} with ${condensedArgs.length} arguments`,
        rawOutputText: 'Stub improved arguments',
        model: 'mock',
        timestamp: new Date().toISOString(),
        metadata: { tokens: { input: 150, output: 75, total: 225 }, latency: 0.8 }
      }
    ];

    this.allPromptCalls.push(...promptCalls);

    return {
      arguments: [
        { id: 'final-1', text: 'Final improved argument 1' },
        { id: 'final-2', text: 'Final improved argument 2' }
      ],
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
      outputType: this.input.question.answerType,
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
      outputType: this.input.question.answerType,
      pipelineSignature: [...this.pipelineSignature],
      promptCalls: [...this.allPromptCalls],
      timestamp: new Date().toISOString(),
      evaluation: {
        score: 7, // stubbed evaluation
        explanation: 'Stub evaluation explanation'
      }
    };

    await this.cacheManager.saveFinalResult(record);
  }
}

/**
 * Result from a single phase
 */
interface PhaseResult {
  arguments: Argument[];
  promptCalls: PromptCall[];
} 