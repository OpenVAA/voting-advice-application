import { LLMResponse, Message } from '@openvaa/llm';
import * as path from 'path';
import { OperationTreeBuilder } from './operationTreeBuilder';
import { LlmParser } from './parser/llmParser';
import { Argument, CondensationRunInput, CondensationRunResult, VAAComment } from './types';
import { CondensationOperations } from './types/condensation/operation';
import { CondensationPlan, ProcessingStep } from './types/condensation/processDefinition';
import {
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from './types/condensation/processParams';
import { PromptCall } from './types/promptCall';
import { ResponseWithArguments } from './types/responseWithArguments';

/**
 * Stateful condenser that manages the condensation process based on a customizable plan.
 * Automatically generates operation tree visualization data.
 */
export class Condenser {
  private runId: string;
  private allPromptCalls: Array<PromptCall> = [];
  private treeBuilder: OperationTreeBuilder;

  constructor(private input: CondensationRunInput) {
    this.runId = input.runId;
    this.treeBuilder = new OperationTreeBuilder(this.runId);
  }

  /**
   * Utility function to embed template literals in prompt text
   * @param promptText The prompt text with {{variable}} placeholders
   * @param variables The variables to embed
   * @returns The prompt text with variables embedded
   */
  private embedTemplateVariables(promptText: string, variables: Record<string, unknown>): string {
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
        case CondensationOperations.REFINE: {
          if (currentStructure !== 'comments') {
            throw new Error(
              `REFINE operation can only process comments as first step, got ${currentStructure} at step ${i}`
            );
          }
          const refineParams = step.params as RefineOperationParams;
          currentBatchCount = Math.ceil(commentCount / refineParams.batchSize);
          currentStructure = 'list'; // REFINE always produces a single list
          break;
        }

        case CondensationOperations.MAP: {
          if (currentStructure !== 'comments') {
            throw new Error(
              `MAP operation can only process comments as first step, got ${currentStructure} at step ${i}`
            );
          }
          const mapParams = step.params as MapOperationParams;
          currentBatchCount = Math.ceil(commentCount / mapParams.batchSize);
          // MAP can produce either list or listOfLists - we need to check the actual implementation
          // For validation purposes, assume it produces listOfLists if batchCount > 1
          currentStructure = currentBatchCount > 1 ? 'listOfLists' : 'list';
          break;
        }

        case CondensationOperations.REDUCE: {
          if (currentStructure !== 'listOfLists') {
            throw new Error(`REDUCE operation can only process list of lists, got ${currentStructure} at step ${i}`);
          }
          const reduceParams = step.params as ReduceOperationParams;
          const newBatchCount = Math.ceil(currentBatchCount / reduceParams.denominator);
          currentBatchCount = newBatchCount;
          // REDUCE can output either list or listOfLists depending on the result
          currentStructure = newBatchCount === 1 ? 'list' : 'listOfLists';
          break;
        }

        case CondensationOperations.GROUND: {
          // GROUND preserves structure: list → list, listOfLists → listOfLists
          // No change to currentStructure or currentBatchCount
          break;
        }

        default:
          throw new Error(`Unknown operation: ${step.operation} at step ${i}`);
      }

      // Log the progression for debugging
      console.info(`Step ${i} (${step.operation}): ${currentStructure} with ${currentBatchCount} batch(es)`);
    }

    // Final validation: must end with a single list
    if (currentStructure !== 'list') {
      throw new Error(
        `Pipeline must produce a single list of arguments as final output, but produces ${currentStructure} with ${currentBatchCount} batch(es). ` +
          'Consider adjusting REDUCE denominators or adding additional REDUCE steps to consolidate to a single list.'
      );
    }
  }

  /**
   * Validate individual step parameters
   */
  private validateStepParameters(step: ProcessingStep): void {
    switch (step.operation) {
      case CondensationOperations.REFINE: {
        const refineParams = step.params as RefineOperationParams; // Type assertion needed due to union type
        if (refineParams.batchSize <= 0) {
          throw new Error('REFINE operation batchSize must be positive');
        }
        if (!refineParams.initialBatchPrompt || !refineParams.refinementPrompt) {
          throw new Error('REFINE operation requires both initialBatchPrompt and refinementPrompt');
        }
        break;
      }

      case CondensationOperations.MAP: {
        const mapParams = step.params as MapOperationParams; // Type assertion needed due to union type
        if (mapParams.batchSize <= 0) {
          throw new Error('MAP operation batchSize must be positive');
        }
        if (!mapParams.condensationPrompt) {
          throw new Error('MAP operation requires condensationPrompt');
        }
        break;
      }

      case CondensationOperations.REDUCE: {
        const reduceParams = step.params as ReduceOperationParams; // Type assertion needed due to union type
        if (reduceParams.denominator <= 0) {
          throw new Error('REDUCE operation denominator must be positive');
        }
        if (!reduceParams.coalescingPrompt) {
          throw new Error('REDUCE operation requires coalescingPrompt');
        }
        break;
      }

      case CondensationOperations.GROUND: {
        const groundParams = step.params as GroundingOperationParams; // Type assertion needed due to union type
        if (groundParams.batchSize <= 0) {
          throw new Error('GROUND operation batchSize must be positive');
        }
        if (!groundParams.groundingPrompt) {
          throw new Error('GROUND operation requires groundingPrompt');
        }
        break;
      }
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
    if (
      currentStep.operation === CondensationOperations.REFINE &&
      nextStep.operation !== CondensationOperations.GROUND
    ) {
      throw new Error('REFINE operation can only be followed by GROUND operation');
    }

    // REDUCE can be followed by GROUND or be final
    if (
      currentStep.operation === CondensationOperations.REDUCE &&
      nextStep.operation !== CondensationOperations.GROUND
    ) {
      // This is valid - REDUCE can be final
    }

    // GROUND can be followed by REDUCE or be final
    if (
      currentStep.operation === CondensationOperations.GROUND &&
      nextStep.operation !== CondensationOperations.REDUCE
    ) {
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
    let currentData: Array<VAAComment> | Array<Argument> | Array<Array<Argument>> = this.input.comments;
    let previousNodeIds: Array<string> = []; // Start with empty array - first step will create root nodes
    let currentStepIndex = 0; // Track actual step index accounting for multi-level operations

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const stepResult = await this.executeStep(step, currentData, currentStepIndex, previousNodeIds);

      // Update current data for next step
      currentData = stepResult.arguments;
      previousNodeIds = stepResult.nodeIds || [];

      // Update step index based on how many levels this operation consumed
      currentStepIndex += stepResult.stepLevelsConsumed || 1;
    }

    // Set final arguments in tree and save operation tree to JSON file
    this.treeBuilder.setFinalArguments(currentData as Array<Argument>);
    await this.treeBuilder.saveTree(path.join(__dirname, '../data/operationTrees', `${this.runId}.json`));

    // Print tree summary
    console.info('\n=== OPERATION TREE SUMMARY ===');
    console.info(this.treeBuilder.getTreeSummary());
    console.info('===============================\n');

    // Return the final result
    return {
      runId: this.runId,
      input: this.input,
      arguments: currentData as Array<Argument>,
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
  private async executeStep(
    step: ProcessingStep,
    inputData: Array<VAAComment> | Array<Argument> | Array<Array<Argument>>,
    stepIndex: number,
    previousNodeIds: Array<string>
  ): Promise<StepResult> {
    switch (step.operation) {
      case CondensationOperations.REFINE:
        return await this.executeRefine(step, inputData as Array<VAAComment>, stepIndex, previousNodeIds);

      case CondensationOperations.MAP:
        return await this.executeMap(step, inputData as Array<VAAComment>, stepIndex, previousNodeIds);

      case CondensationOperations.REDUCE:
        return await this.executeReduce(step, inputData as Array<Array<Argument>>, stepIndex, previousNodeIds);

      case CondensationOperations.GROUND:
        return await this.executeGround(
          step,
          inputData as Array<Argument> | Array<Array<Argument>>,
          stepIndex,
          previousNodeIds
        );

      default:
        throw new Error(`Unknown operation: ${step.operation}`);
    }
  }

  /**
   * Execute REFINE operation
   */
  private async executeRefine(
    step: ProcessingStep,
    comments: Array<VAAComment>,
    stepIndex: number,
    previousNodeIds: Array<string>
  ): Promise<StepResult> {
    const params = step.params as RefineOperationParams;
    const batchSize = params.batchSize;

    // Split comments into batches
    const batches = this.createBatches(comments, batchSize);

    // Create tree nodes for each batch
    const batchNodeIds: Array<string> = [];
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

    let currentArguments: Array<Argument> = [];
    const prompt = params.initialBatchPrompt;
    const allPromptCalls: Array<PromptCall> = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const isFirstBatch = i === 0;
      const nodeId = batchNodeIds[i];

      // Prepare template variables
      const templateVariables: Record<string, unknown> = {
        topic: this.input.question.topic,
        comments: JSON.stringify(batch, null, 2)
      };

      // Add existing arguments for refinement prompts
      if (!isFirstBatch) {
        templateVariables.existingArguments = JSON.stringify(currentArguments, null, 2);
      }

      const promptText = this.embedTemplateVariables(prompt, templateVariables);

      // Prepare messages for LLM
      const messages = [{ role: 'system' as const, content: promptText }];

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
        console.info(`\n=== REFINE ${isFirstBatch ? 'INITIAL' : 'REFINEMENT'} BATCH ${i + 1}/${batches.length} ===`);
        console.info('Arguments:', JSON.stringify(parsedResponse.arguments, null, 2));
        if (parsedResponse.reasoning) {
          console.info('Reasoning:', parsedResponse.reasoning);
        }
        console.info('=====================================\n');

        // Update tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);
      } catch (error) {
        // Mark node as failed
        this.treeBuilder.completeNode(nodeId, 1, false, error instanceof Error ? error.message : 'Unknown error');
        throw new Error(
          `Failed to parse ${isFirstBatch ? 'initial' : 'refinement'} response: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
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
  private async executeMap(
    step: ProcessingStep,
    comments: Array<VAAComment>,
    stepIndex: number,
    previousNodeIds: Array<string>
  ): Promise<StepResult> {
    const params = step.params as MapOperationParams;
    const batchSize = params.batchSize;

    // Split comments into batches
    const batches = this.createBatches(comments, batchSize);

    // Create tree nodes for each batch
    const batchNodeIds: Array<string> = [];
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
    const llmInputs = batches.map((batch) => {
      // Prepare template variables for MAP prompt
      const templateVariables: Record<string, unknown> = {
        topic: this.input.question.topic,
        comments: batch.map((c) => c.text).join('\n')
      };

      const promptText = this.embedTemplateVariables(params.condensationPrompt, templateVariables);

      return {
        messages: [{ role: 'system' as const, content: promptText }],
        temperature: 0.7
      };
    });

    // Validate batch token counts before sending to LLM
    const MAX_TOKENS_PER_BATCH = 28500;
    const llmBatchSize = 7;

    // Calculate character count for each LLM input and group into batches
    const promptCharsCounts = llmInputs.map((input) =>
      input.messages.reduce((total, message) => total + message.content.length, 0)
    );

    // Check consecutive batches of llmBatchSize
    for (let i = 0; i < promptCharsCounts.length; i += llmBatchSize) {
      const batchEnd = Math.min(i + llmBatchSize, promptCharsCounts.length);
      const batchCharSum = promptCharsCounts.slice(i, batchEnd).reduce((sum, count) => sum + count, 0);
      const estimatedTokens = (batchCharSum / 4) * 1.3; // Simple token estimation: (characters / 4 * 1.3 buffer)

      console.info(`CONDENSER: Batch ${Math.floor(i / llmBatchSize) + 1} estimated tokens:`, estimatedTokens);

      if (estimatedTokens > MAX_TOKENS_PER_BATCH) {
        const batchIndices = Array.from({ length: batchEnd - i }, (_, idx) => i + idx + 1);
        throw new Error(
          '❌ MAP BATCH EXCEEDS TOKEN LIMIT\n' +
            `📊 Batch ${Math.floor(i / llmBatchSize) + 1} (inputs ${batchIndices.join(', ')}) has ${estimatedTokens.toFixed(0)} tokens (max: ${MAX_TOKENS_PER_BATCH})\n` +
            ' SOLUTIONS:\n' +
            `   1. Reduce batch size from ${batchSize}\n` +
            '   2. Clean up/shorten comment text in your input data\n'
        );
      }
    }

    // Queue all LLM calls
    const llmResponses = await this.input.llmProvider.generateMultiple({ inputs: llmInputs });

    // Initialize argumentLists array with proper size
    const argumentLists: Array<Array<Argument>> = new Array(batches.length);
    const allPromptCalls: Array<PromptCall> = [];
    const failedIndices: Array<number> = [];
    const successfulResponses: { [index: number]: LLMResponse } = {};

    // First pass: process all responses and collect failures
    for (let i = 0; i < batches.length; i++) {
      const llmResponse = llmResponses[i];
      const nodeId = batchNodeIds[i];

      // Parse and validate the response
      try {
        const parsedResponse = LlmParser.parseArguments(llmResponse.content);
        successfulResponses[i] = llmResponse;

        // Update tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);

        argumentLists[i] = parsedResponse.arguments;
      } catch (error) {
        console.info(`\n❌ MAP BATCH ${i + 1}/${batches.length} FAILED ===`);
        console.info('Parse error:', error instanceof Error ? error.message : 'Unknown error');
        console.info('Raw response:', llmResponse.content.substring(0, 200) + '...');
        console.info('=====================================\n');

        // Mark for retry
        failedIndices.push(i);

        // Mark node as temporarily failed (will be updated if retry succeeds)
        this.treeBuilder.completeNode(
          nodeId,
          1,
          false,
          `Initial parse failed, retrying: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Retry failed calls individually
    if (failedIndices.length > 0) {
      console.info(`\n🔄 Retrying ${failedIndices.length} failed MAP batches...`);
      const retryResults = await this.retryFailedCalls(failedIndices, llmInputs, 'MAP');

      // Process retry results
      for (const { index, response } of retryResults) {
        const nodeId = batchNodeIds[index];

        try {
          const parsedResponse = LlmParser.parseArguments(response.content);

          console.info(`\n=== MAP BATCH ${index + 1}/${batches.length} (RETRY SUCCESS) ===`);
          console.info('=====================================\n');

          // Store successful retry response
          successfulResponses[index] = response;

          // Update tree node with successful output
          this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
          this.treeBuilder.completeNode(nodeId, 1, true);

          argumentLists[index] = parsedResponse.arguments;
        } catch (retryError) {
          // Even retry failed - mark as permanently failed
          this.treeBuilder.completeNode(
            nodeId,
            1,
            false,
            `All retries failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
          );
          throw new Error(
            `Failed to parse MAP response for batch ${index + 1} after retries: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
          );
        }
      }

      // Check if any batches still failed after retries
      const stillFailedIndices = failedIndices.filter((i) => !successfulResponses[i]);
      if (stillFailedIndices.length > 0) {
        throw new Error(
          `MAP operation failed for batches: ${stillFailedIndices.map((i) => i + 1).join(', ')} after all retry attempts`
        );
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

    console.info('\n🔄 Starting MAP iteration step...');

    // Create iteration nodes for each batch as children of MAP nodes
    const iterationNodeIds: Array<string> = [];
    for (let i = 0; i < batches.length; i++) {
      const nodeId = this.treeBuilder.createNode(CondensationOperations.ITERATE_MAP, stepIndex + 1, i);
      this.treeBuilder.setNodeInput(nodeId, {
        arguments: argumentLists[i] // Only show arguments as input, comments are in parent MAP node
      });

      // Link to the corresponding initial MAP node
      this.treeBuilder.linkNodes(batchNodeIds[i], nodeId);

      iterationNodeIds.push(nodeId);
      this.treeBuilder.startNode(nodeId);
    }

    // Prepare iteration LLM inputs
    const iterationLlmInputs = batches.map((batch, i) => {
      // Prepare template variables for iteration prompt
      const templateVariables: Record<string, unknown> = {
        topic: this.input.question.topic,
        arguments: JSON.stringify(argumentLists[i], null, 2),
        comments: batch.map((c) => c.text).join('\n')
      };

      const promptText = this.embedTemplateVariables(params.iterationPrompt, templateVariables);

      return {
        messages: [{ role: 'system' as const, content: promptText }],
        temperature: 0.7
      };
    });

    // Queue iteration LLM calls
    const iterationLlmResponses = await this.input.llmProvider.generateMultiple({ inputs: iterationLlmInputs });

    const iterationFailedIndices: Array<number> = [];
    const iterationSuccessfulResponses: { [index: number]: LLMResponse } = {};

    // Process iteration responses
    for (let i = 0; i < batches.length; i++) {
      const llmResponse = iterationLlmResponses[i];
      const nodeId = iterationNodeIds[i];

      try {
        const parsedResponse = LlmParser.parseArguments(llmResponse.content);
        iterationSuccessfulResponses[i] = llmResponse;

        // Update tree node with iteration output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);

        // Replace the initial arguments with the refined ones
        argumentLists[i] = parsedResponse.arguments;
      } catch (error) {
        console.info(`\n❌ MAP ITERATION BATCH ${i + 1}/${batches.length} FAILED ===`);
        console.info('Parse error:', error instanceof Error ? error.message : 'Unknown error');
        console.info('Raw response:', llmResponse.content.substring(0, 200) + '...');
        console.info('=====================================\n');

        // Mark for retry
        iterationFailedIndices.push(i);

        // Mark node as temporarily failed
        this.treeBuilder.completeNode(
          nodeId,
          1,
          false,
          `Iteration parse failed, retrying: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Retry failed iteration calls
    if (iterationFailedIndices.length > 0) {
      console.info(`\n🔄 Retrying ${iterationFailedIndices.length} failed MAP iteration batches...`);
      const iterationRetryResults = await this.retryFailedCalls(
        iterationFailedIndices,
        iterationLlmInputs,
        'MAP_ITERATION'
      );

      for (const { index, response } of iterationRetryResults) {
        const nodeId = iterationNodeIds[index];

        try {
          const parsedResponse = LlmParser.parseArguments(response.content);

          console.info(`\n=== MAP ITERATION BATCH ${index + 1}/${batches.length} (RETRY SUCCESS) ===`);

          // Store successful retry response
          iterationSuccessfulResponses[index] = response;

          // Update tree node with successful iteration output
          this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
          this.treeBuilder.completeNode(nodeId, 1, true);

          // Replace the initial arguments with the refined ones
          argumentLists[index] = parsedResponse.arguments;
        } catch (retryError) {
          // Iteration retry failed - keep initial arguments and mark as failed
          console.info(`\n⚠️  MAP ITERATION BATCH ${index + 1} failed after retries, keeping initial arguments`);
          this.treeBuilder.completeNode(
            nodeId,
            1,
            false,
            `All iteration retries failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
          );
        }
      }
    }

    // Create prompt calls for successful iteration responses
    const iterationPromptCalls: Array<PromptCall> = [];
    for (let i = 0; i < batches.length; i++) {
      const llmResponse = iterationSuccessfulResponses[i];
      if (llmResponse) {
        const promptCall: PromptCall = {
          promptId: 'MapIterationPromptId', // TODO: get from prompt registry or params
          operation: CondensationOperations.ITERATE_MAP, // Use ITERATE_MAP instead of step.operation
          rawInputText: `Map iteration for batch ${i + 1}/${batches.length}`,
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

        iterationPromptCalls.push(promptCall);
        this.allPromptCalls.push(promptCall);
      }
    }

    // Add iteration prompt calls to the main prompt calls array
    allPromptCalls.push(...iterationPromptCalls);

    // Update nodeIds to include iteration nodes
    batchNodeIds.push(...iterationNodeIds);

    return {
      arguments: argumentLists,
      promptCalls: allPromptCalls,
      nodeIds: batchNodeIds,
      stepLevelsConsumed: 2 // MAP operation uses 2 step levels (MAP + ITERATE_MAP)
    };
  }

  /**
   * Execute REDUCE operation
   */
  private async executeReduce(
    step: ProcessingStep,
    argumentLists: Array<Array<Argument>>,
    stepIndex: number,
    previousNodeIds: Array<string>
  ): Promise<StepResult> {
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
    const chunks: Array<Array<Array<Argument>>> = [];
    for (let i = 0; i < argumentLists.length; i += denominator) {
      chunks.push(argumentLists.slice(i, i + denominator));
    }

    // Create tree nodes for each chunk
    const chunkNodeIds: Array<string> = [];
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
    const llmInputs = chunks.map((chunk) => {
      // Prepare template variables for REDUCE prompt
      const templateVariables: Record<string, unknown> = {
        topic: this.input.question.topic,
        argumentLists: JSON.stringify(chunk, null, 2)
      };

      const promptText = this.embedTemplateVariables(params.coalescingPrompt, templateVariables);

      return {
        messages: [{ role: 'system' as const, content: promptText }],
        temperature: 0.7
      };
    });

    // Queue all LLM calls
    const llmResponses = await this.input.llmProvider.generateMultiple({ inputs: llmInputs });

    const reducedArgumentLists: Array<Array<Argument>> = [];
    const allPromptCalls: Array<PromptCall> = [];
    const failedIndices: Array<number> = [];
    const successfulResponses: { [index: number]: LLMResponse } = {};

    // First pass: process all responses and collect failures
    for (let i = 0; i < chunks.length; i++) {
      const llmResponse = llmResponses[i];
      const nodeId = chunkNodeIds[i];

      // Parse and validate the response
      try {
        const parsedResponse = LlmParser.parseArguments(llmResponse.content);
        successfulResponses[i] = llmResponse;

        // Update tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);

        reducedArgumentLists[i] = parsedResponse.arguments;
      } catch (error) {
        console.info(`\n❌ REDUCE CHUNK ${i + 1}/${chunks.length} FAILED ===`);
        console.info('Parse error:', error instanceof Error ? error.message : 'Unknown error');
        console.info('Raw response:', llmResponse.content.substring(0, 200) + '...');
        console.info('=====================================\n');

        // Mark for retry
        failedIndices.push(i);

        // Mark node as temporarily failed (will be updated if retry succeeds)
        this.treeBuilder.completeNode(
          nodeId,
          1,
          false,
          `Initial parse failed, retrying: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Retry failed calls individually
    if (failedIndices.length > 0) {
      console.info(`\n🔄 Retrying ${failedIndices.length} failed REDUCE chunks...`);
      const retryResults = await this.retryFailedCalls(failedIndices, llmInputs, 'REDUCE');

      // Process retry results
      for (const { index, response } of retryResults) {
        const nodeId = chunkNodeIds[index];

        try {
          const parsedResponse = LlmParser.parseArguments(response.content);

          console.info(`\n=== REDUCE CHUNK ${index + 1}/${chunks.length} (RETRY SUCCESS) ===`);

          // Store successful retry response
          successfulResponses[index] = response;

          // Update tree node with successful output
          this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
          this.treeBuilder.completeNode(nodeId, 1, true);

          reducedArgumentLists[index] = parsedResponse.arguments;
        } catch (retryError) {
          // Even retry failed - mark as permanently failed
          this.treeBuilder.completeNode(
            nodeId,
            1,
            false,
            `All retries failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
          );
          throw new Error(
            `Failed to parse REDUCE response for chunk ${index + 1} after retries: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
          );
        }
      }

      // Check if any chunks still failed after retries
      const stillFailedIndices = failedIndices.filter((i) => !successfulResponses[i]);
      if (stillFailedIndices.length > 0) {
        throw new Error(
          `REDUCE operation failed for chunks: ${stillFailedIndices.map((i) => i + 1).join(', ')} after all retry attempts`
        );
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
    const outputArguments = reducedArgumentLists.length === 1 ? reducedArgumentLists[0] : reducedArgumentLists;

    return {
      arguments: outputArguments,
      promptCalls: allPromptCalls,
      nodeIds: chunkNodeIds
    };
  }

  /**
   * Execute GROUND operation
   */
  private async executeGround(
    step: ProcessingStep,
    argumentData: Array<Argument> | Array<Array<Argument>>,
    stepIndex: number,
    previousNodeIds: Array<string>
  ): Promise<StepResult> {
    const params = step.params as GroundingOperationParams;

    // Normalize input to always be an array of lists for simplicity
    const argumentLists: Array<Array<Argument>> = Array.isArray(argumentData[0])
      ? (argumentData as Array<Array<Argument>>)
      : [argumentData as Array<Argument>]; // if input is a single list, wrap it in an array

    // Create tree nodes for each argument list
    const listNodeIds: Array<string> = [];
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
      const templateVariables: Record<string, unknown> = {
        topic: this.input.question.topic,
        arguments: JSON.stringify(argumentList, null, 2),
        comments: JSON.stringify(commentsForGrounding, null, 2)
      };

      const promptText = this.embedTemplateVariables(params.groundingPrompt, templateVariables);

      return {
        messages: [{ role: 'system' as const, content: promptText }],
        temperature: 0.7
      };
    });

    // Queue all LLM calls
    const llmResponses = await this.input.llmProvider.generateMultiple({ inputs: llmInputs });

    const groundedArgumentLists: Array<Array<Argument>> = [];
    const allPromptCalls: Array<PromptCall> = [];
    const failedIndices: Array<number> = [];
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
        console.info(`\n=== GROUND LIST ${i + 1}/${argumentLists.length} ===`);
        console.info('Original arguments:', JSON.stringify(argumentList, null, 2));
        console.info('Grounded arguments:', JSON.stringify(parsedResponse.arguments, null, 2));
        console.info(`Used ${commentsForGrounding.length} comments for grounding`);
        if (parsedResponse.reasoning) {
          console.info('Reasoning:', parsedResponse.reasoning);
        }
        console.info('=====================================\n');

        // Store successful response
        successfulResponses[i] = llmResponse;

        // Update tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);

        groundedArgumentLists[i] = parsedResponse.arguments;
      } catch (error) {
        console.info(`\n❌ GROUND LIST ${i + 1}/${argumentLists.length} FAILED ===`);
        console.info('Parse error:', error instanceof Error ? error.message : 'Unknown error');
        console.info('Raw response:', llmResponse.content.substring(0, 200) + '...');
        console.info('=====================================\n');

        // Mark for retry
        failedIndices.push(i);

        // Mark node as temporarily failed (will be updated if retry succeeds)
        this.treeBuilder.completeNode(
          nodeId,
          1,
          false,
          `Initial parse failed, retrying: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Retry failed calls individually
    if (failedIndices.length > 0) {
      console.info(`\n🔄 Retrying ${failedIndices.length} failed GROUND lists...`);
      const retryResults = await this.retryFailedCalls(failedIndices, llmInputs, 'GROUND');

      // Process retry results
      for (const { index, response } of retryResults) {
        const argumentList = argumentLists[index];
        const commentsForGrounding = commentBatches[index];
        const nodeId = listNodeIds[index];

        try {
          const parsedResponse = LlmParser.parseArguments(response.content);

          console.info(`\n=== GROUND LIST ${index + 1}/${argumentLists.length} (RETRY SUCCESS) ===`);
          console.info('Original arguments:', JSON.stringify(argumentList, null, 2));
          console.info('Grounded arguments:', JSON.stringify(parsedResponse.arguments, null, 2));
          console.info(`Used ${commentsForGrounding.length} comments for grounding`);
          if (parsedResponse.reasoning) {
            console.info('Reasoning:', parsedResponse.reasoning);
          }
          console.info('=====================================\n');

          // Store successful retry response
          successfulResponses[index] = response;

          // Update tree node with successful output
          this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
          this.treeBuilder.completeNode(nodeId, 1, true);

          groundedArgumentLists[index] = parsedResponse.arguments;
        } catch (retryError) {
          // Even retry failed - mark as permanently failed
          this.treeBuilder.completeNode(
            nodeId,
            1,
            false,
            `All retries failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
          );
          throw new Error(
            `Failed to parse GROUND response for list ${index + 1} after retries: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
          );
        }
      }

      // Check if any lists still failed after retries
      const stillFailedIndices = failedIndices.filter((i) => !successfulResponses[i]);
      if (stillFailedIndices.length > 0) {
        throw new Error(
          `GROUND operation failed for lists: ${stillFailedIndices.map((i) => i + 1).join(', ')} after all retry attempts`
        );
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
    const outputArguments = Array.isArray(argumentData[0]) ? groundedArgumentLists : groundedArgumentLists[0];

    return {
      arguments: outputArguments,
      promptCalls: allPromptCalls,
      nodeIds: listNodeIds
    };
  }

  /**
   * Create batches from an array
   */
  private createBatches<TElement>(array: Array<TElement>, batchSize: number): Array<Array<TElement>> {
    const batches: Array<Array<TElement>> = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
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
    failedIndices: Array<number>,
    llmInputs: Array<{
      messages: Array<Message>;
      temperature: number;
      maxTokens?: number;
    }>,
    operation: string,
    maxRetries: number = 2
  ): Promise<Array<{ index: number; response: LLMResponse }>> {
    const successfulRetries: Array<{ index: number; response: LLMResponse }> = [];

    // Process all failed indices in parallel
    const retryPromises = failedIndices.map(async (failedIndex) => {
      const input = llmInputs[failedIndex];
      let lastError: Error | null = null;

      console.info(`\n⚠️  Retrying ${operation} for batch ${failedIndex + 1} (up to ${maxRetries} attempts)`);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.info(`   Attempt ${attempt}/${maxRetries}...`);
          const response = await this.input.llmProvider.generate(input);

          // Try to parse the response to make sure it's valid
          LlmParser.parseArguments(response.content);

          console.info(`   ✅ Success on attempt ${attempt}`);
          return { index: failedIndex, response };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.info(`   ❌ Attempt ${attempt} failed: ${lastError.message}`);

          if (attempt === maxRetries) {
            console.info(`   🚫 All ${maxRetries} retry attempts failed for batch ${failedIndex + 1}`);
          }
        }
      }

      // If we get here, all retry attempts failed
      return null;
    });

    // Wait for all retry attempts to complete
    const retryResults = await Promise.all(retryPromises);

    // Filter out null results (failed retries) and collect successful ones
    for (const result of retryResults) {
      if (result !== null) {
        successfulRetries.push(result);
      }
    }

    return successfulRetries;
  }
}

/**
 * Result from a single step
 */
interface StepResult {
  arguments: Array<Argument> | Array<Array<Argument>>;
  promptCalls: Array<PromptCall>;
  nodeIds?: Array<string>;
  stepLevelsConsumed?: number; // How many step levels this operation consumed (default 1)
}
