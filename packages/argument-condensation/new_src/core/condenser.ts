import { LLMResponse } from '@openvaa/llm';
import { retryFailedCalls } from '@openvaa/llm';
import * as path from 'path';
import {
  Argument,
  CondensationOperations,
  CondensationRunInput,
  CondensationRunResult,
  CondensationStepResult,
  GroundingOperationParams,
  MapOperationParams,
  ProcessingStep,
  PromptCall,
  ReduceOperationParams,
  RefineOperationParams,
  ResponseWithArguments,
  VAAComment
} from './types';
import { ResponseWithArgumentsContract } from './types/llm/responseWithArguments';
import { createBatches, LlmParser, setPromptVars, validatePlan } from './utils';
import { OperationTreeBuilder } from './visualization/operationTreeBuilder';

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
   * Run the condensation process based on the provided plan.
   */
  async run(): Promise<CondensationRunResult> {
    // Get plan from input config
    const plan = this.input.config;

    // Validate the plan before execution
    validatePlan(plan, this.input.comments.length);

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
  ): Promise<CondensationStepResult> {
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
  ): Promise<CondensationStepResult> {
    const params = step.params as RefineOperationParams;
    const batchSize = params.batchSize;

    // Split comments into batches
    const batches = createBatches(comments, batchSize);

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

      const promptText = setPromptVars(prompt, templateVariables);

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
        parsedResponse = LlmParser.parse(llmResponse.content, ResponseWithArgumentsContract);

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
  ): Promise<CondensationStepResult> {
    const params = step.params as MapOperationParams;
    const batchSize = params.batchSize;

    // Split comments into batches
    const batches = createBatches(comments, batchSize);

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

      const promptText = setPromptVars(params.condensationPrompt, templateVariables);

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
    const llmResponses = await this.input.llmProvider.generateMultipleParallel({ inputs: llmInputs });

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
        const parsedResponse = LlmParser.parse(llmResponse.content, ResponseWithArgumentsContract);
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
      const retryResults = await retryFailedCalls(failedIndices, llmInputs, 'MAP', 2, ResponseWithArgumentsContract, this.input.llmProvider);

      // Process retry results
      for (const { index, response } of retryResults) {
        const nodeId = batchNodeIds[index];

        try {
          const parsedResponse = LlmParser.parse(response.content, ResponseWithArgumentsContract);

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

      const promptText = setPromptVars(params.iterationPrompt, templateVariables);

      return {
        messages: [{ role: 'system' as const, content: promptText }],
        temperature: 0.7
      };
    });

    // Queue iteration LLM calls
    const iterationLlmResponses = await this.input.llmProvider.generateMultipleParallel({ inputs: iterationLlmInputs });

    const iterationFailedIndices: Array<number> = [];
    const iterationSuccessfulResponses: { [index: number]: LLMResponse } = {};

    // Process iteration responses
    for (let i = 0; i < batches.length; i++) {
      const llmResponse = iterationLlmResponses[i];
      const nodeId = iterationNodeIds[i];

      try {
        const parsedResponse = LlmParser.parse(llmResponse.content, ResponseWithArgumentsContract);
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
      const iterationRetryResults = await retryFailedCalls(
        iterationFailedIndices,
        iterationLlmInputs,
        'MAP_ITERATION',
        2,
        ResponseWithArgumentsContract,
        this.input.llmProvider
      );

      for (const { index, response } of iterationRetryResults) {
        const nodeId = iterationNodeIds[index];

        try {
          const parsedResponse = LlmParser.parse(response.content, ResponseWithArgumentsContract);

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
  ): Promise<CondensationStepResult> {
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

      const promptText = setPromptVars(params.coalescingPrompt, templateVariables);

      return {
        messages: [{ role: 'system' as const, content: promptText }],
        temperature: 0.7
      };
    });

    // Queue all LLM calls
    const llmResponses = await this.input.llmProvider.generateMultipleParallel({ inputs: llmInputs });

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
        const parsedResponse = LlmParser.parse(llmResponse.content, ResponseWithArgumentsContract);
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
      const retryResults = await retryFailedCalls(failedIndices, llmInputs, 'REDUCE', 2, ResponseWithArgumentsContract, this.input.llmProvider);

      // Process retry results
      for (const { index, response } of retryResults) {
        const nodeId = chunkNodeIds[index];

        try {
          const parsedResponse = LlmParser.parse(response.content, ResponseWithArgumentsContract);

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
  ): Promise<CondensationStepResult> {
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
    const commentBatches = createBatches(commentsToUse, params.batchSize);

    // Prepare all LLM inputs for parallel processing
    const llmInputs = argumentLists.map((argumentList, i) => {
      const commentsForGrounding = commentBatches[i];

      // Prepare template variables for grounding prompt
      const templateVariables: Record<string, unknown> = {
        topic: this.input.question.topic,
        arguments: JSON.stringify(argumentList, null, 2),
        comments: JSON.stringify(commentsForGrounding, null, 2)
      };

      const promptText = setPromptVars(params.groundingPrompt, templateVariables);

      return {
        messages: [{ role: 'system' as const, content: promptText }],
        temperature: 0.7
      };
    });

    // Queue all LLM calls  
    const llmResponses = await this.input.llmProvider.generateMultipleParallel({ inputs: llmInputs });

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
        const parsedResponse = LlmParser.parse(llmResponse.content, ResponseWithArgumentsContract);

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
      const retryResults = await retryFailedCalls(failedIndices, llmInputs, 'GROUND', 2, ResponseWithArgumentsContract, this.input.llmProvider);

      // Process retry results
      for (const { index, response } of retryResults) {
        const argumentList = argumentLists[index];
        const commentsForGrounding = commentBatches[index];
        const nodeId = listNodeIds[index];

        try {
          const parsedResponse = LlmParser.parse(response.content, ResponseWithArgumentsContract);

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
}