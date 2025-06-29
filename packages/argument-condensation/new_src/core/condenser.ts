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
import { OperationTreeBuilder } from './operationTreeBuilder';
import { LLMResponse, Message } from '@openvaa/llm';
import * as path from 'path';

/**
 * Stateful condenser that manages the condensation process based on a customizable plan.
 * Saves partial results after each step for caching and performance testing.
 * Automatically generates operation tree visualization data.
 */
export class Condenser {
  private runId: string;
  private allPromptCalls: PromptCall[] = [];
  private cacheManager: CacheManager;
  private performanceTracker = new PerformanceTracker();
  private treeBuilder: OperationTreeBuilder;

  constructor(private input: CondensationRunInput) {
    this.runId = input.runId;
    this.cacheManager = new CacheManager(input.electionId); // TODO: make this configurable
    this.treeBuilder = new OperationTreeBuilder(this.runId);
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

    // REFINE can only be the first operation
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      if (step.operation === CondensationOperations.REFINE && i !== 0) {
        throw new Error(`REFINE operation can only be the first step in the pipeline, found at step ${i}`);
      }
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

    // REFINE can ONLY be followed by GROUND (not by MAP, REDUCE, or other REFINE)
    if (currentStep.operation === CondensationOperations.REFINE && 
        nextStep.operation !== CondensationOperations.GROUND) {
      throw new Error('REFINE operation can only be followed by GROUND operation');
    }

    // REDUCE can be followed by GROUND or be final
    if (currentStep.operation === CondensationOperations.REDUCE && 
        nextStep.operation !== CondensationOperations.GROUND) {
      // This is valid - REDUCE can be final
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
    let previousNodeIds: string[] = []; // Start with empty array - first step will create root nodes
    
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const stepResult = await this.executeStep(step, currentData, i, previousNodeIds);
      
      // Save partial result after each step
      await this.savePartialResult(i, stepResult);
      
      // Update current data for next step
      currentData = stepResult.arguments;
      previousNodeIds = stepResult.nodeIds || [];
    }

    // Save final result
    await this.saveFinalResult({ arguments: currentData as Argument[], promptCalls: [] });

    // Set final arguments in tree and save operation tree to JSON file
    this.treeBuilder.setFinalArguments(currentData as Argument[]);
    await this.treeBuilder.saveTree(path.join(__dirname, '../data/operationTrees', `${this.runId}.json`));
    
    // Print tree summary
    console.log('\n=== OPERATION TREE SUMMARY ===');
    console.log(this.treeBuilder.getTreeSummary());
    console.log('===============================\n');

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
  private async executeStep(step: ProcessingStep, inputData: VAAComment[] | Argument[] | Argument[][], stepIndex: number, previousNodeIds: string[]): Promise<StepResult> {
    switch (step.operation) {
      case CondensationOperations.REFINE:
        return await this.executeRefine(step, inputData as VAAComment[], stepIndex, previousNodeIds);
      
      case CondensationOperations.MAP:
        return await this.executeMap(step, inputData as VAAComment[], stepIndex, previousNodeIds);
      
      case CondensationOperations.REDUCE:
        return await this.executeReduce(step, inputData as Argument[][], stepIndex, previousNodeIds);
      
      case CondensationOperations.GROUND:
        return await this.executeGround(step, inputData as Argument[] | Argument[][], stepIndex, previousNodeIds);
      
      default:
        throw new Error(`Unknown operation: ${step.operation}`);
    }
  }

  /**
   * Execute REFINE operation
   */
  private async executeRefine(step: ProcessingStep, comments: VAAComment[], stepIndex: number, previousNodeIds: string[]): Promise<StepResult> {
    const params = step.params as RefineOperationParams;
    const batchSize = params.batchSize;
    
    // Split comments into batches
    const batches = this.createBatches(comments, batchSize);
    
    // Create tree nodes for each batch
    const batchNodeIds: string[] = [];
    for (let i = 0; i < batches.length; i++) {
      const nodeId = this.treeBuilder.createNode(CondensationOperations.REFINE, stepIndex, i);
      this.treeBuilder.setNodeInput(nodeId, { comments: batches[i] });
      
      // Link to previous nodes (only if they exist - first step has no parents)
      if (previousNodeIds.length > 0) {
        for (const parentId of previousNodeIds) {
          this.treeBuilder.linkNodes(parentId, nodeId);
        }
      }
      
      batchNodeIds.push(nodeId);
      this.treeBuilder.startNode(nodeId);
    }
    
    let currentArguments: Argument[] = [];
    let prompt = params.initialBatchPrompt;
    const allPromptCalls: PromptCall[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const isFirstBatch = i === 0;
      const nodeId = batchNodeIds[i];
    
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
        
        // Update tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);
        
      } catch (error) {
        // Mark node as failed
        this.treeBuilder.completeNode(nodeId, 1, false, error instanceof Error ? error.message : 'Unknown error');
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
      promptCalls: allPromptCalls,
      nodeIds: batchNodeIds
    };
  }

  /**
   * Execute MAP operation
   */
  private async executeMap(step: ProcessingStep, comments: VAAComment[], stepIndex: number, previousNodeIds: string[]): Promise<StepResult> {
    const params = step.params as MapOperationParams;
    const batchSize = params.batchSize;
    
    // Split comments into batches
    const batches = this.createBatches(comments, batchSize);
    
    // Create tree nodes for each batch
    const batchNodeIds: string[] = [];
    for (let i = 0; i < batches.length; i++) {
      const nodeId = this.treeBuilder.createNode(CondensationOperations.MAP, stepIndex, i);
      this.treeBuilder.setNodeInput(nodeId, { comments: batches[i] });
      
      // Link to previous nodes (only if they exist - first step has no parents)
      if (previousNodeIds.length > 0) {
        for (const parentId of previousNodeIds) {
          this.treeBuilder.linkNodes(parentId, nodeId);
        }
      }
      
      batchNodeIds.push(nodeId);
      this.treeBuilder.startNode(nodeId);
    }
    
    // Prepare all LLM inputs for parallel processing
    const llmInputs = batches.map(batch => {
      // Prepare template variables for MAP prompt
      const templateVariables: Record<string, any> = {
        topic: this.input.question.topic,
        comments: JSON.stringify(batch, null, 2)
      };
      
      const promptText = this.embedTemplateVariables(params.condensationPrompt, templateVariables);
      
      return {
        messages: [
          { role: 'system' as const, content: promptText }
        ],
        temperature: 0.7
      };
    });
    
    // Queue all LLM calls
    const llmResponses = await this.input.llmProvider.generateMultiple(llmInputs);
    
    const argumentLists: Argument[][] = [];
    const allPromptCalls: PromptCall[] = [];
    const failedIndices: number[] = [];
    const successfulResponses: { [index: number]: LLMResponse } = {};
    
    // First pass: process all responses and collect failures
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const llmResponse = llmResponses[i];
      const nodeId = batchNodeIds[i];
      
      // Parse and validate the response
      try {
        const parsedResponse = LlmParser.parseArguments(llmResponse.content);
        
        // Log the parsed response for debugging
        console.log(`\n=== MAP BATCH ${i + 1}/${batches.length} ===`);
        console.log('Comments processed:', batch.length);
        console.log('Arguments extracted:', JSON.stringify(parsedResponse.arguments, null, 2));
        if (parsedResponse.reasoning) {
          console.log('Reasoning:', parsedResponse.reasoning);
        }
        console.log('=====================================\n');
        
        // Store successful response
        successfulResponses[i] = llmResponse;
        
        // Update tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);
        
        argumentLists[i] = parsedResponse.arguments;
        
      } catch (error) {
        console.log(`\n❌ MAP BATCH ${i + 1}/${batches.length} FAILED ===`);
        console.log('Parse error:', error instanceof Error ? error.message : 'Unknown error');
        console.log('Raw response:', llmResponse.content.substring(0, 200) + '...');
        console.log('=====================================\n');
        
        // Mark for retry
        failedIndices.push(i);
        
        // Mark node as temporarily failed (will be updated if retry succeeds)
        this.treeBuilder.completeNode(nodeId, 1, false, `Initial parse failed, retrying: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Retry failed calls individually
    if (failedIndices.length > 0) {
      console.log(`\n🔄 Retrying ${failedIndices.length} failed MAP batches...`);
      const retryResults = await this.retryFailedCalls(failedIndices, llmInputs, 'MAP');
      
      // Process retry results
      for (const { index, response } of retryResults) {
        const batch = batches[index];
        const nodeId = batchNodeIds[index];
        
        try {
          const parsedResponse = LlmParser.parseArguments(response.content);
          
          console.log(`\n=== MAP BATCH ${index + 1}/${batches.length} (RETRY SUCCESS) ===`);
          console.log('Comments processed:', batch.length);
          console.log('Arguments extracted:', JSON.stringify(parsedResponse.arguments, null, 2));
          if (parsedResponse.reasoning) {
            console.log('Reasoning:', parsedResponse.reasoning);
          }
          console.log('=====================================\n');
          
          // Store successful retry response
          successfulResponses[index] = response;
          
          // Update tree node with successful output
          this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
          this.treeBuilder.completeNode(nodeId, 1, true);
          
          argumentLists[index] = parsedResponse.arguments;
          
        } catch (retryError) {
          // Even retry failed - mark as permanently failed
          this.treeBuilder.completeNode(nodeId, 1, false, `All retries failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
          throw new Error(`Failed to parse MAP response for batch ${index + 1} after retries: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        }
      }
      
      // Check if any batches still failed after retries
      const stillFailedIndices = failedIndices.filter(i => !successfulResponses[i]);
      if (stillFailedIndices.length > 0) {
        throw new Error(`MAP operation failed for batches: ${stillFailedIndices.map(i => i + 1).join(', ')} after all retry attempts`);
      }
    }
    
    // Create prompt calls for all successful responses (including retries)
    for (let i = 0; i < batches.length; i++) {
      const llmResponse = successfulResponses[i];
      if (llmResponse) {
        const promptCall: PromptCall = {
          promptId: 'MapMockId', // TODO: get from prompt registry
          operation: step.operation,
          rawInputText: `Map operation for batch ${i + 1}/${batches.length}`,
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
      }
    }
    
    return {
      arguments: argumentLists,
      promptCalls: allPromptCalls,
      nodeIds: batchNodeIds
    };
  }

  /**
   * Execute REDUCE operation
   */
  private async executeReduce(step: ProcessingStep, argumentLists: Argument[][], stepIndex: number, previousNodeIds: string[]): Promise<StepResult> {
    const params = step.params as ReduceOperationParams;
    const denominator = params.denominator;
    
    // If we only have one list, return as is (no reduction needed)
    if (argumentLists.length <= 1) {
      return {
        arguments: argumentLists,
        promptCalls: [],
        nodeIds: previousNodeIds
      };
    }
    
    // Group argument lists into chunks based on denominator
    const chunks: Argument[][][] = [];
    for (let i = 0; i < argumentLists.length; i += denominator) {
      chunks.push(argumentLists.slice(i, i + denominator));
    }
    
    // Create tree nodes for each chunk
    const chunkNodeIds: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const nodeId = this.treeBuilder.createNode(CondensationOperations.REDUCE, stepIndex, i);
      this.treeBuilder.setNodeInput(nodeId, { argumentLists: chunks[i] });
      
      // Link to previous nodes
      for (const parentId of previousNodeIds) {
        this.treeBuilder.linkNodes(parentId, nodeId);
      }
      
      chunkNodeIds.push(nodeId);
      this.treeBuilder.startNode(nodeId);
    }
    
    // Prepare all LLM inputs for parallel processing
    const llmInputs = chunks.map(chunk => {
      // Prepare template variables for REDUCE prompt
      const templateVariables: Record<string, any> = {
        topic: this.input.question.topic,
        argumentLists: JSON.stringify(chunk, null, 2),
      };
      
      const promptText = this.embedTemplateVariables(params.coalescingPrompt, templateVariables);
      
      return {
        messages: [
          { role: 'system' as const, content: promptText }
        ],
        temperature: 0.7
      };
    });
    
    // Queue all LLM calls
    const llmResponses = await this.input.llmProvider.generateMultiple(llmInputs);
    
    const reducedArgumentLists: Argument[][] = [];
    const allPromptCalls: PromptCall[] = [];
    const failedIndices: number[] = [];
    const successfulResponses: { [index: number]: LLMResponse } = {};
    
    // First pass: process all responses and collect failures
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const llmResponse = llmResponses[i];
      const nodeId = chunkNodeIds[i];
      
      // Parse and validate the response
      try {
        const parsedResponse = LlmParser.parseArguments(llmResponse.content);
        
        // Log the parsed response for debugging
        console.log(`\n=== REDUCE CHUNK ${i + 1}/${chunks.length} ===`);
        console.log(`Coalescing ${chunk.length} argument lists into 1`);
        console.log('Input lists:', chunk.length);
        console.log('Output arguments:', JSON.stringify(parsedResponse.arguments, null, 2));
        if (parsedResponse.reasoning) {
          console.log('Reasoning:', parsedResponse.reasoning);
        }
        console.log('=====================================\n');
        
        // Store successful response
        successfulResponses[i] = llmResponse;
        
        // Update tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);
        
        reducedArgumentLists[i] = parsedResponse.arguments;
        
      } catch (error) {
        console.log(`\n❌ REDUCE CHUNK ${i + 1}/${chunks.length} FAILED ===`);
        console.log('Parse error:', error instanceof Error ? error.message : 'Unknown error');
        console.log('Raw response:', llmResponse.content.substring(0, 200) + '...');
        console.log('=====================================\n');
        
        // Mark for retry
        failedIndices.push(i);
        
        // Mark node as temporarily failed (will be updated if retry succeeds)
        this.treeBuilder.completeNode(nodeId, 1, false, `Initial parse failed, retrying: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Retry failed calls individually
    if (failedIndices.length > 0) {
      console.log(`\n🔄 Retrying ${failedIndices.length} failed REDUCE chunks...`);
      const retryResults = await this.retryFailedCalls(failedIndices, llmInputs, 'REDUCE');
      
      // Process retry results
      for (const { index, response } of retryResults) {
        const chunk = chunks[index];
        const nodeId = chunkNodeIds[index];
        
        try {
          const parsedResponse = LlmParser.parseArguments(response.content);
          
          console.log(`\n=== REDUCE CHUNK ${index + 1}/${chunks.length} (RETRY SUCCESS) ===`);
          console.log(`Coalescing ${chunk.length} argument lists into 1`);
          console.log('Input lists:', chunk.length);
          console.log('Output arguments:', JSON.stringify(parsedResponse.arguments, null, 2));
          if (parsedResponse.reasoning) {
            console.log('Reasoning:', parsedResponse.reasoning);
          }
          console.log('=====================================\n');
          
          // Store successful retry response
          successfulResponses[index] = response;
          
          // Update tree node with successful output
          this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
          this.treeBuilder.completeNode(nodeId, 1, true);
          
          reducedArgumentLists[index] = parsedResponse.arguments;
          
        } catch (retryError) {
          // Even retry failed - mark as permanently failed
          this.treeBuilder.completeNode(nodeId, 1, false, `All retries failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
          throw new Error(`Failed to parse REDUCE response for chunk ${index + 1} after retries: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        }
      }
      
      // Check if any chunks still failed after retries
      const stillFailedIndices = failedIndices.filter(i => !successfulResponses[i]);
      if (stillFailedIndices.length > 0) {
        throw new Error(`REDUCE operation failed for chunks: ${stillFailedIndices.map(i => i + 1).join(', ')} after all retry attempts`);
      }
    }
    
    // Create prompt calls for all successful responses (including retries)
    for (let i = 0; i < chunks.length; i++) {
      const llmResponse = successfulResponses[i];
      if (llmResponse) {
        const promptCall: PromptCall = {
          promptId: 'ReduceMockId', // TODO: get from prompt registry
          operation: step.operation,
          rawInputText: `Reduce operation for chunk ${i + 1}/${chunks.length}`,
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
      }
    }
    
    // If we only have one result, return it as a single list
    const outputArguments = reducedArgumentLists.length === 1 
      ? reducedArgumentLists[0] 
      : reducedArgumentLists;
    
    return {
      arguments: outputArguments,
      promptCalls: allPromptCalls,
      nodeIds: chunkNodeIds
    };
  }

  /**
   * Execute GROUND operation
   */
  private async executeGround(step: ProcessingStep, argumentData: Argument[] | Argument[][], stepIndex: number, previousNodeIds: string[]): Promise<StepResult> {
    const params = step.params as GroundingOperationParams;
    
    // Normalize input to always be an array of lists for simplicity
    const argumentLists: Argument[][] = Array.isArray(argumentData[0]) 
      ? argumentData as Argument[][]
      : [argumentData as Argument[]]; // if input is a single list, wrap it in an array
    
    // Create tree nodes for each argument list
    const listNodeIds: string[] = [];
    for (let i = 0; i < argumentLists.length; i++) {
      const nodeId = this.treeBuilder.createNode(CondensationOperations.GROUND, stepIndex, i);
      this.treeBuilder.setNodeInput(nodeId, { arguments: argumentLists[i] });
      
      // Link to previous nodes
      for (const parentId of previousNodeIds) {
        this.treeBuilder.linkNodes(parentId, nodeId);
      }
      
      listNodeIds.push(nodeId);
      this.treeBuilder.startNode(nodeId);
    }
    
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
    
    // Prepare all LLM inputs for parallel processing
    const llmInputs = argumentLists.map((argumentList, i) => {
      const commentsForGrounding = commentBatches[i];
      
      // Prepare template variables for grounding prompt
      const templateVariables: Record<string, any> = {
        topic: this.input.question.topic,
        arguments: JSON.stringify(argumentList, null, 2),
        comments: JSON.stringify(commentsForGrounding, null, 2),
      };
      
      const promptText = this.embedTemplateVariables(params.groundingPrompt, templateVariables);
      
      return {
        messages: [
          { role: 'system' as const, content: promptText }
        ],
        temperature: 0.7
      };
    });
    
    // Queue all LLM calls
    const llmResponses = await this.input.llmProvider.generateMultiple(llmInputs);
    
    const groundedArgumentLists: Argument[][] = [];
    const allPromptCalls: PromptCall[] = [];
    const failedIndices: number[] = [];
    const successfulResponses: { [index: number]: LLMResponse } = {};
    
    // First pass: process all responses and collect failures
    for (let i = 0; i < argumentLists.length; i++) {
      const argumentList = argumentLists[i];
      const commentsForGrounding = commentBatches[i];
      const llmResponse = llmResponses[i];
      const nodeId = listNodeIds[i];
      
      // Parse and validate the response
      try {
        const parsedResponse = LlmParser.parseArguments(llmResponse.content);
        
        // Log the parsed response for debugging
        console.log(`\n=== GROUND LIST ${i + 1}/${argumentLists.length} ===`);
        console.log('Original arguments:', JSON.stringify(argumentList, null, 2));
        console.log('Grounded arguments:', JSON.stringify(parsedResponse.arguments, null, 2));
        console.log(`Used ${commentsForGrounding.length} comments for grounding`);
        if (parsedResponse.reasoning) {
          console.log('Reasoning:', parsedResponse.reasoning);
        }
        console.log('=====================================\n');
        
        // Store successful response
        successfulResponses[i] = llmResponse;
        
        // Update tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);
        
        groundedArgumentLists[i] = parsedResponse.arguments;
        
      } catch (error) {
        console.log(`\n❌ GROUND LIST ${i + 1}/${argumentLists.length} FAILED ===`);
        console.log('Parse error:', error instanceof Error ? error.message : 'Unknown error');
        console.log('Raw response:', llmResponse.content.substring(0, 200) + '...');
        console.log('=====================================\n');
        
        // Mark for retry
        failedIndices.push(i);
        
        // Mark node as temporarily failed (will be updated if retry succeeds)
        this.treeBuilder.completeNode(nodeId, 1, false, `Initial parse failed, retrying: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Retry failed calls individually
    if (failedIndices.length > 0) {
      console.log(`\n🔄 Retrying ${failedIndices.length} failed GROUND lists...`);
      const retryResults = await this.retryFailedCalls(failedIndices, llmInputs, 'GROUND');
      
      // Process retry results
      for (const { index, response } of retryResults) {
        const argumentList = argumentLists[index];
        const commentsForGrounding = commentBatches[index];
        const nodeId = listNodeIds[index];
        
        try {
          const parsedResponse = LlmParser.parseArguments(response.content);
          
          console.log(`\n=== GROUND LIST ${index + 1}/${argumentLists.length} (RETRY SUCCESS) ===`);
          console.log('Original arguments:', JSON.stringify(argumentList, null, 2));
          console.log('Grounded arguments:', JSON.stringify(parsedResponse.arguments, null, 2));
          console.log(`Used ${commentsForGrounding.length} comments for grounding`);
          if (parsedResponse.reasoning) {
            console.log('Reasoning:', parsedResponse.reasoning);
          }
          console.log('=====================================\n');
          
          // Store successful retry response
          successfulResponses[index] = response;
          
          // Update tree node with successful output
          this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
          this.treeBuilder.completeNode(nodeId, 1, true);
          
          groundedArgumentLists[index] = parsedResponse.arguments;
          
        } catch (retryError) {
          // Even retry failed - mark as permanently failed
          this.treeBuilder.completeNode(nodeId, 1, false, `All retries failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
          throw new Error(`Failed to parse GROUND response for list ${index + 1} after retries: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        }
      }
      
      // Check if any lists still failed after retries
      const stillFailedIndices = failedIndices.filter(i => !successfulResponses[i]);
      if (stillFailedIndices.length > 0) {
        throw new Error(`GROUND operation failed for lists: ${stillFailedIndices.map(i => i + 1).join(', ')} after all retry attempts`);
      }
    }
    
    // Create prompt calls for all successful responses (including retries)
    for (let i = 0; i < argumentLists.length; i++) {
      const llmResponse = successfulResponses[i];
      if (llmResponse) {
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
      }
    }
    
    // Return the same structure as input: single list if input was single list, multiple lists if input was multiple lists
    const outputArguments = Array.isArray(argumentData[0]) 
      ? groundedArgumentLists 
      : groundedArgumentLists[0];
    
    return {
      arguments: outputArguments,
      promptCalls: allPromptCalls,
      nodeIds: listNodeIds
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

  /**
   * Retry helper function for failed parsing attempts
   * @param failedIndices Array of indices that failed in the batch
   * @param llmInputs Original LLM inputs
   * @param operation Operation name for logging
   * @param maxRetries Maximum number of retry attempts
   * @returns Array of successful LLM responses
   */
  private async retryFailedCalls(
    failedIndices: number[],
    llmInputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
    }>,
    operation: string,
    maxRetries: number = 2
  ): Promise<{ index: number; response: LLMResponse }[]> {
    const successfulRetries: { index: number; response: LLMResponse }[] = [];
    
    for (const failedIndex of failedIndices) {
      const input = llmInputs[failedIndex];
      let lastError: Error | null = null;
      
      console.log(`\n⚠️  Retrying ${operation} for batch ${failedIndex + 1} (up to ${maxRetries} attempts)`);
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`   Attempt ${attempt}/${maxRetries}...`);
          const response = await this.input.llmProvider.generate(input);
          
          // Try to parse the response to make sure it's valid
          LlmParser.parseArguments(response.content);
          
          console.log(`   ✅ Success on attempt ${attempt}`);
          successfulRetries.push({ index: failedIndex, response });
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.log(`   ❌ Attempt ${attempt} failed: ${lastError.message}`);
          
          if (attempt === maxRetries) {
            console.log(`   🚫 All ${maxRetries} retry attempts failed for batch ${failedIndex + 1}`);
          }
        }
      }
    }
    
    return successfulRetries;
  }
}

/**
 * Result from a single step
 */
interface StepResult {
  arguments: Argument[] | Argument[][];
  promptCalls: PromptCall[];
  nodeIds?: string[];
} 