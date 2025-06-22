import { Argument, CondensationRunInput, CondensationRunResult, VAAComment } from './types';
import { PromptCall } from './types/promptCall';
import { PartialCondensationRunRecord, FullCondensationRunRecord } from '../evaluation/types/analytics/runRecord';
import { CacheManager } from '../evaluation/cacheManager';
import { PerformanceTracker } from '../evaluation/performanceTracker';
import { LlmParser } from './parser/llmParser';
import { ResponseWithArguments } from './types/responseWithArguments';
import { CondensationPlan, ProcessingStep } from './types/condensation/processDefinition';
import { CondensationOperations } from './types/condensation/operation';
import { StubEvaluator } from '../evaluation/evaluators/stubEvaluator';
import { MapOperationParams, ReduceOperationParams, RefineOperationParams, GroundingOperationParams } from './types/condensation/processParams';

/**
 * Stateful condenser that manages the condensation process based on a customizable plan.
 * Saves partial results after each step for caching and performance testing.
 */
export class Condenser {
  private runId: string;
  private allPromptCalls: PromptCall[] = [];
  private cacheManager: CacheManager;
  private performanceTracker = new PerformanceTracker();

  constructor(private input: CondensationRunInput) {
    this.runId = input.runId;
    this.cacheManager = new CacheManager(input.electionId); // TODO: make this configurable
  }

  /**
   * Utility function to embed template literals in prompt text
   * @param promptText The prompt text with {{variable}} placeholders
   * @param variables The variables to embed
   * @returns The prompt text with variables embedded
   */
  private embedTemplateVariables(promptText: string, variables: Record<string, any>): string {
    let result = promptText;
    
    // Replace template variables using {{variable}} syntax
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), valueStr);
    }
    
    return result;
  }

  /**
   * Validate a condensation plan before execution
   */
  public validatePlan(plan: CondensationPlan): void {
    if (plan.steps.length === 0) {
      throw new Error('Condensation plan must have at least one step');
    }

    // Validate each step and the flow between steps
    for (let i = 0; i < plan.steps.length; i++) {
      const currentStep = plan.steps[i];
      const nextStep = plan.steps[i + 1];

      // Validate current step parameters
      this.validateStepParameters(currentStep);

      // Validate flow between steps
      if (nextStep) {
        this.validateStepFlow(currentStep, nextStep);
      }
    }

    // Validate final step produces arguments (not argument lists)
    const finalStep = plan.steps[plan.steps.length - 1];
    if (finalStep.operation === CondensationOperations.MAP) {
      throw new Error('MAP operation cannot be the final step - it produces argument lists, not arguments');
    }

    // Validate mathematical output structure
    this.validatePipelineOutputs(plan, this.input.comments.length);
  }

  /**
   * Validate that the pipeline configuration will mathematically produce a single list of arguments
   */
  private validatePipelineOutputs(plan: CondensationPlan, commentCount: number): void {
    let currentStructure: 'comments' | 'list' | 'listOfLists' = 'comments';
    let currentBatchCount = 1;

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];

      switch (step.operation) {
        case CondensationOperations.REFINE:
          if (currentStructure !== 'comments') {
            throw new Error(`REFINE operation can only process comments as first step, got ${currentStructure} at step ${i}`);
          }
          const refineParams = step.params as RefineOperationParams;
          currentBatchCount = Math.ceil(commentCount / refineParams.batchSize);
          currentStructure = 'list'; // REFINE always produces a single list
          break;

        case CondensationOperations.MAP:
          if (currentStructure !== 'comments') {
            throw new Error(`MAP operation can only process comments as first step, got ${currentStructure} at step ${i}`);
          }
          const mapParams = step.params as MapOperationParams;
          currentBatchCount = Math.ceil(commentCount / mapParams.batchSize);
          // MAP can produce either list or listOfLists - we need to check the actual implementation
          // For validation purposes, assume it produces listOfLists if batchCount > 1
          currentStructure = currentBatchCount > 1 ? 'listOfLists' : 'list';
          break;

        case CondensationOperations.REDUCE:
          if (currentStructure !== 'listOfLists') {
            throw new Error(`REDUCE operation can only process list of lists, got ${currentStructure} at step ${i}`);
          }
          const reduceParams = step.params as ReduceOperationParams;
          const newBatchCount = Math.ceil(currentBatchCount / reduceParams.denominator);
          currentBatchCount = newBatchCount;
          // REDUCE can output either list or listOfLists depending on the result
          currentStructure = newBatchCount === 1 ? 'list' : 'listOfLists';
          break;

        case CondensationOperations.GROUND:
          // GROUND preserves structure: list → list, listOfLists → listOfLists
          // No change to currentStructure or currentBatchCount
          break;

        default:
          throw new Error(`Unknown operation: ${step.operation} at step ${i}`);
      }

      // Log the progression for debugging
      console.log(`Step ${i} (${step.operation}): ${currentStructure} with ${currentBatchCount} batch(es)`);
    }

    // Final validation: must end with a single list
    if (currentStructure !== 'list') {
      throw new Error(
        `Pipeline must produce a single list of arguments as final output, but produces ${currentStructure} with ${currentBatchCount} batch(es). ` +
        `Consider adjusting REDUCE denominators or adding additional REDUCE steps to consolidate to a single list.`
      );
    }
  }

  /**
   * Validate individual step parameters
   */
  private validateStepParameters(step: ProcessingStep): void {
    switch (step.operation) {
      case CondensationOperations.REFINE:
        const refineParams = step.params as RefineOperationParams; // Type assertion needed due to union type
        if (refineParams.batchSize <= 0) {
          throw new Error('REFINE operation batchSize must be positive');
        }
        if (!refineParams.initialBatchPrompt || !refineParams.refinementPrompt) {
          throw new Error('REFINE operation requires both initialBatchPrompt and refinementPrompt');
        }
        break;

      case CondensationOperations.MAP:
        const mapParams = step.params as any; // Type assertion needed due to union type
        if (mapParams.batchSize <= 0) {
          throw new Error('MAP operation batchSize must be positive');
        }
        if (!mapParams.condensationPrompt) {
          throw new Error('MAP operation requires condensationPrompt');
        }
        break;

      case CondensationOperations.REDUCE:
        const reduceParams = step.params as any; // Type assertion needed due to union type
        if (reduceParams.denominator <= 0) {
          throw new Error('REDUCE operation denominator must be positive');
        }
        if (!reduceParams.coalescingPrompt) {
          throw new Error('REDUCE operation requires coalescingPrompt');
        }
        break;

      case CondensationOperations.GROUND:
        const groundParams = step.params as any; // Type assertion needed due to union type
        if (groundParams.batchSize <= 0) {
          throw new Error('GROUND operation batchSize must be positive');
        }
        if (!groundParams.groundingPrompt) {
          throw new Error('GROUND operation requires groundingPrompt');
        }
        break;
    }
  }

  /**
   * Validate flow between two consecutive steps
   */
  private validateStepFlow(currentStep: ProcessingStep, nextStep: ProcessingStep): void {
    // MAP must be followed by REDUCE
    if (currentStep.operation === CondensationOperations.MAP && nextStep.operation !== CondensationOperations.REDUCE) {
      throw new Error('MAP operation must be followed by REDUCE operation');
    }

    // REDUCE can be followed by GROUND or be final
    if (currentStep.operation === CondensationOperations.REDUCE && 
        nextStep.operation !== CondensationOperations.GROUND) {
      // This is valid - REDUCE can be final
    }

    // REFINE can be followed by GROUND or be final
    if (currentStep.operation === CondensationOperations.REFINE && 
        nextStep.operation !== CondensationOperations.GROUND) {
      // This is valid - REFINE can be final
    }

    // GROUND can be followed by REDUCE or be final
    if (currentStep.operation === CondensationOperations.GROUND && 
        nextStep.operation !== CondensationOperations.REDUCE) {
      // This is valid - GROUND can be final
    }
  }

  /**
   * Run the condensation process based on the provided plan.
   */
  async run(): Promise<CondensationRunResult> {
    // Get plan from input config
    const plan = this.input.config;

    // Validate the plan before execution
    this.validatePlan(plan);

    // Execute plan steps sequentially
    let currentData: VAAComment[] | Argument[] | Argument[][] = this.input.comments;
    
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const stepResult = await this.executeStep(step, currentData, i);
      
      // Save partial result after each step
      await this.savePartialResult(i, stepResult);
      
      // Update current data for next step
      currentData = stepResult.arguments;
    }

    // Save final result
    await this.saveFinalResult({ arguments: currentData as Argument[], promptCalls: [] });

    // Return the final result
    return {
      runId: this.runId,
      input: this.input,
      arguments: currentData as Argument[],
      metrics: {
        duration: 1.5, // stubbed
        nLlmCalls: this.allPromptCalls.length,
        cost: 0.05, // stubbed
        tokensUsed: { inputs: 1000, outputs: 200, total: 1200 } // stubbed
      },
      success: true,
      metadata: {
        llmModel: 'mock',
        language: plan.language,
        startTime: new Date(),
        endTime: new Date()
      }
    };
  }

  /**
   * Execute a single step in the condensation plan
   */
  private async executeStep(step: ProcessingStep, inputData: VAAComment[] | Argument[] | Argument[][], stepIndex: number): Promise<StepResult> {
    switch (step.operation) {
      case CondensationOperations.REFINE:
        return await this.executeRefine(step, inputData as VAAComment[]);
      
      case CondensationOperations.MAP:
        return await this.executeMap(step, inputData as VAAComment[], stepIndex);
      
      case CondensationOperations.REDUCE:
        return await this.executeReduce(step, inputData as Argument[][], stepIndex);
      
      case CondensationOperations.GROUND:
        return await this.executeGround(step, inputData as Argument[] | Argument[][], stepIndex);
      
      default:
        throw new Error(`Unknown operation: ${step.operation}`);
    }
  }

  /**
   * Execute REFINE operation
   */
  private async executeRefine(step: ProcessingStep, comments: VAAComment[]): Promise<StepResult> {
    const params = step.params as RefineOperationParams;
    const batchSize = params.batchSize;
    
    // Split comments into batches
    const batches = this.createBatches(comments, batchSize);
    
    let currentArguments: Argument[] = [];
    let prompt = params.initialBatchPrompt;
    const allPromptCalls: PromptCall[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const isFirstBatch = i === 0;
    
      // Prepare template variables
      const templateVariables: Record<string, any> = {
        topic: this.input.question.topic,
        comments: JSON.stringify(batch, null, 2),
      };
      
      // Add existing arguments for refinement prompts
      if (!isFirstBatch) {
        templateVariables.existingArguments = JSON.stringify(currentArguments, null, 2);
      }
      
      const promptText = this.embedTemplateVariables(prompt, templateVariables);
      
      // Prepare messages for LLM
      const messages = [
        { role: 'system' as const, content: promptText }
      ];
      
      // Make real LLM call
      const llmResponse = await this.input.llmProvider.generate({
        messages,
        temperature: 0.7
      });
      
      // Parse and validate the response
      let parsedResponse: ResponseWithArguments;
      try {
        parsedResponse = LlmParser.parseArguments(llmResponse.content);
        
        // Log the parsed response for debugging
        console.log(`\n=== REFINE ${isFirstBatch ? 'INITIAL' : 'REFINEMENT'} BATCH ${i + 1}/${batches.length} ===`);
        console.log('Arguments:', JSON.stringify(parsedResponse.arguments, null, 2));
        if (parsedResponse.reasoning) {
          console.log('Reasoning:', parsedResponse.reasoning);
        }
        console.log('=====================================\n');
        
      } catch (error) {
        throw new Error(`Failed to parse ${isFirstBatch ? 'initial' : 'refinement'} response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      const promptCall: PromptCall = {
        promptId: 'MockPromptId',
        operation: step.operation,
        rawInputText: `${isFirstBatch ? 'Initial' : 'Refinement'} for batch ${i + 1}/${batches.length}`,
        rawOutputText: llmResponse.content,
        model: llmResponse.model,
        timestamp: new Date().toISOString(),
        metadata: { 
          tokens: { 
            input: llmResponse.usage.promptTokens, 
            output: llmResponse.usage.completionTokens, 
            total: llmResponse.usage.totalTokens 
          }, 
          latency: 0.5 // TODO: track actual latency
        }
      };
      
      allPromptCalls.push(promptCall);
      this.allPromptCalls.push(promptCall);
      
      // Update current arguments for next iteration
      currentArguments = parsedResponse.arguments;
    }
    
    return {
      arguments: currentArguments,
      promptCalls: allPromptCalls
    };
  }

  /**
   * Execute MAP operation
   */
  private async executeMap(step: ProcessingStep, comments: VAAComment[], stepIndex: number): Promise<StepResult> {
    const params = step.params as any;
    const batchSize = params.batchSize;
    
    // Split comments into batches
    const batches = this.createBatches(comments, batchSize);
    const argumentLists: Argument[][] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Stub LLM response
      const response = this.generateStubResponse([], batch, true);
      
      // Parse and validate the response
      let parsedResponse: ResponseWithArguments;
      try {
        parsedResponse = LlmParser.parseArguments(response);
      } catch (error) {
        throw new Error(`Failed to parse map response for batch ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      const promptCalls: PromptCall[] = [
        {
          promptId: `map_${stepIndex}_${i}`,
          operation: step.operation,
          rawInputText: `Map operation for batch ${i + 1}/${batches.length}`,
          rawOutputText: response,
          model: 'mock',
          timestamp: new Date().toISOString(),
          metadata: { tokens: { input: 100, output: 50, total: 150 }, latency: 0.5 }
        }
      ];
      
      this.allPromptCalls.push(...promptCalls);
      argumentLists.push(parsedResponse.arguments);
    }
    
    return {
      arguments: argumentLists,
      promptCalls: []
    };
  }

  /**
   * Execute REDUCE operation
   */
  private async executeReduce(step: ProcessingStep, argumentLists: Argument[][], stepIndex: number): Promise<StepResult> {
    const params = step.params as any;
    const denominator = params.denominator;
    
    // If we have fewer lists than denominator, return as is
    if (argumentLists.length <= denominator) {
      return {
        arguments: argumentLists,
        promptCalls: []
      };
    }
    
    // Stub LLM response for reduction
    const response = this.generateStubResponse([], [], false);
    
    // Parse and validate the response
    let parsedResponse: ResponseWithArguments;
    try {
      parsedResponse = LlmParser.parseArguments(response);
    } catch (error) {
      throw new Error(`Failed to parse reduce response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const promptCalls: PromptCall[] = [
      {
        promptId: `reduce_${stepIndex}`,
        operation: step.operation,
        rawInputText: `Reduce operation on ${argumentLists.length} argument lists`,
        rawOutputText: response,
        model: 'mock',
        timestamp: new Date().toISOString(),
        metadata: { tokens: { input: 100, output: 50, total: 150 }, latency: 0.5 }
      }
    ];
    
    this.allPromptCalls.push(...promptCalls);
    
    return {
      arguments: parsedResponse.arguments,
      promptCalls: []
    };
  }

  /**
   * Execute GROUND operation
   */
  private async executeGround(step: ProcessingStep, argumentData: Argument[] | Argument[][], stepIndex: number): Promise<StepResult> {
    const params = step.params as GroundingOperationParams;
    
    // Normalize input to always be an array of lists for simplicity
    const argumentLists: Argument[][] = Array.isArray(argumentData[0]) 
      ? argumentData as Argument[][]
      : [argumentData as Argument[]]; // if input is a single list, wrap it in an array
    
    // Prepare comment batches - each argument list gets its own batch
    const availableComments = this.input.comments;
    const numArgumentLists = argumentLists.length;
    
    // Calculate how many comment batches we can create with current comments
    const availableCommentBatches = Math.floor(availableComments.length / params.batchSize);
    
    let commentsToUse = availableComments;
    
    // If we don't have enough comment batches, multiply the comment array
    if (availableCommentBatches < numArgumentLists) {
      const coefficient = Math.ceil(numArgumentLists / availableCommentBatches);
      commentsToUse = [];
      for (let i = 0; i < coefficient; i++) {
        commentsToUse.push(...availableComments);
      }
    }
    
    // Prepare comment batches
    const commentBatches = this.createBatches(commentsToUse, params.batchSize);
    
    const groundedArgumentLists: Argument[][] = [];
    const allPromptCalls: PromptCall[] = [];
    
    // Process each argument list with its dedicated comment batch
    for (let i = 0; i < argumentLists.length; i++) {
      const argumentList = argumentLists[i];
      const commentsForGrounding = commentBatches[i];
      
      // Prepare template variables for grounding prompt
      const templateVariables: Record<string, any> = {
        topic: this.input.question.topic,
        arguments: JSON.stringify(argumentList, null, 2),
        comments: JSON.stringify(commentsForGrounding, null, 2),
      };
      
      const promptText = this.embedTemplateVariables(params.groundingPrompt, templateVariables);
      
      // Prepare messages for LLM
      const messages = [
        { role: 'system' as const, content: promptText },
      ];
      
      // Make real LLM call
      const llmResponse = await this.input.llmProvider.generate({
        messages,
        temperature: 0.7
      });
      
      // Parse and validate the response
      let parsedResponse: ResponseWithArguments;
      try {
        parsedResponse = LlmParser.parseArguments(llmResponse.content);
        
        // Log the parsed response for debugging
        console.log(`\n=== GROUND LIST ${i + 1}/${argumentLists.length} ===`);
        console.log('Original arguments:', JSON.stringify(argumentList, null, 2));
        console.log('Grounded arguments:', JSON.stringify(parsedResponse.arguments, null, 2));
        console.log(`Used ${commentsForGrounding.length} comments for grounding`);
        if (parsedResponse.reasoning) {
          console.log('Reasoning:', parsedResponse.reasoning);
        }
        console.log('=====================================\n');
        
      } catch (error) {
        throw new Error(`Failed to parse ground response for list ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      const promptCall: PromptCall = {
        promptId: 'GroundMockId', // TODO: get from prompt registry
        operation: step.operation,
        rawInputText: `Ground operation for list ${i + 1}/${argumentLists.length}`,
        rawOutputText: llmResponse.content,
        model: llmResponse.model,
        timestamp: new Date().toISOString(),
        metadata: { 
          tokens: { 
            input: llmResponse.usage.promptTokens, 
            output: llmResponse.usage.completionTokens, 
            total: llmResponse.usage.totalTokens 
          }, 
          latency: 0.5 // TODO: track actual latency
        }
      };
      
      allPromptCalls.push(promptCall);
      this.allPromptCalls.push(promptCall);
      
      // Use the grounded arguments
      groundedArgumentLists.push(parsedResponse.arguments);
    }
    
    // Return the same structure as input: single list if input was single list, multiple lists if input was multiple lists
    const outputArguments = Array.isArray(argumentData[0]) 
      ? groundedArgumentLists 
      : groundedArgumentLists[0];
    
    return {
      arguments: outputArguments,
      promptCalls: allPromptCalls
    };
  }

  /**
   * Create batches from an array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Generate stub LLM response for testing
   */
  private generateStubResponse(existingArgs: Argument[], comments: VAAComment[], isInitial: boolean): string {
    const argCount = isInitial ? 2 : Math.min(existingArgs.length + 1, 3);
    const args: Argument[] = [];
    
    for (let i = 0; i < argCount; i++) {
      args.push({
        id: `stub_arg_${i + 1}`,
        text: `Stub argument ${i + 1} for testing purposes`
      });
    }
    
    return JSON.stringify({
      arguments: args,
      reasoning: `Generated ${argCount} stub arguments for testing`
    });
  }

  /**
   * Save partial result after each step
   */
  private async savePartialResult(stepIndex: number, result: StepResult) {
    const record: PartialCondensationRunRecord = {
      questionId: this.input.question.id,
      runId: this.runId,
      outputType: this.input.config.outputType,
      model: this.input.model,
      plan: this.input.config,
      promptCalls: [...this.allPromptCalls],
      timestamp: new Date().toISOString()
    };

    await this.cacheManager.savePartialResult(record);
  }

  /**
   * Save final result with evaluation
   */
  private async saveFinalResult(result: StepResult) {
    // Use the same evaluator as the evaluation script
    const evaluator = new StubEvaluator(8, "Stub evaluation for testing");
    
    // Create a simple evaluation input for the final arguments
    const evaluationInput = {
      topic: this.input.question.topic,
      systemArguments: result.arguments as Argument[],
      expectedArguments: [] // No expected arguments in this context, but evaluator will handle it
    };
    
    // Run evaluation
    const evaluationResult = await evaluator.evaluateSystem({
      description: "Individual run evaluation",
      inputs: [evaluationInput]
    });
    
    const record: FullCondensationRunRecord = {
      questionId: this.input.question.id,
      runId: this.runId,
      outputType: this.input.config.outputType,
      plan: this.input.config,
      promptCalls: [...this.allPromptCalls],
      timestamp: new Date().toISOString(),
      model: this.input.model,
      evaluation: {
        score: evaluationResult.metrics.averageScore,
        explanation: evaluationResult.results[0]?.explanation || 'Evaluation completed'
      }
    };

    await this.cacheManager.saveFinalResult(record);

    // Update per-question performance metrics
    await this.performanceTracker.updateQuestionMetrics(
      this.input.electionId,
      this.input.config.outputType,
      this.input.question.id,
      record
    );
  }
}

/**
 * Result from a single step
 */
interface StepResult {
  arguments: Argument[] | Argument[][];
  promptCalls: PromptCall[];
} 