import { LLMResponse, retryUnvalidResponses } from '@openvaa/llm';
import * as path from 'path';
import { RESPONSE_WITH_ARGUMENTS_CONTRACT } from './responseValidators';
import {
  Argument,
  CondensationOperation,
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
} from '../types';
import {
  createBatches,
  createPromptInstance,
  LatencyTracker,
  LlmParser,
  setPromptVars,
  validateInputTokenCount,
  validatePlan
} from '../utils';
import { OperationTreeBuilder } from '../visualization/operationTreeBuilder';

/**
 * Takes in an array of comments and a configuration object and orchestrates the condensation process using these inputs.
 * Outputs a list of arguments and automatically generates operation tree visualization data for debugging and analysis.
 *
 * You can use the condenser either as a standalone class or simply by using the `handleQuestion` function defined in `main.ts`.
 * A standalone run provides minimal but not trivial customization options. Namely, you can run a process for only finding cons,
 * whereas `handleQuestion` automatically runs both pros and cons.
 *
 * The data needed for visualizing a run through the condenser will be automatically saved to `data/operationTrees` regardless of
 * whether you use the `handleQuestion` function or the condenser class directly.
 *
 * You can choose the condensation run you want to visualize from the `data/operationTrees` folder when the visualization UI is running.
 *
 * @example
 * const condenser = new Condenser({
 *   comments: comments,
 *   question: question,
 *   options: {
 *     runId: 'my-run-id',
 *     outputType: 'cons',
 *     processingSteps: [
 *       { operation: CondensationOperations.MAP, params: { batchSize: 10 } },
 *       { operation: CondensationOperations.REFINE, params: { batchSize: 10 } },
 *       { operation: CondensationOperations.REDUCE, params: { batchSize: 10 } },
 *       { operation: CondensationOperations.GROUND, params: { batchSize: 10 } }
 *     ]
 *   }
 * });
 *
 * const result = await condenser.run();
 *
 * // result is a CondensationRunResult object:
 * {
 *   runId: 'my-run-id',
 *   condensationType: 'likertCons',
 *   arguments: [...],
 *   metrics: {...},
 *   success: true,
 *   metadata: {...}
 * }
 *
 * @remarks Input data structure contrain current usage to political comment processing but
 * the underlying operations (REFINE, MAP, REDUCE, GROUND) are agnostic to the input data structure. So, in theory,
 * you could modify the condenser to summarize any unstructured data by modifying the input data structures and the underlying prompts.
 */
export class Condenser {
  private runId: string;
  private allPromptCalls: Array<PromptCall> = [];
  private treeBuilder: OperationTreeBuilder;
  private latencyTracker: LatencyTracker;
  private totalCost: number = 0;
  private startTime: Date;

  constructor(private input: CondensationRunInput) {
    this.runId = input.options.runId || 'default-run-id-from-condenser'; // TODO: hash?
    this.treeBuilder = new OperationTreeBuilder(this.runId);
    this.latencyTracker = new LatencyTracker();
    this.startTime = new Date();
  }

  /**
   * MAIN EXECUTION METHOD
   *
   * Orchestrates the entire condensation process according to the provided plan.
   *
   * EXECUTION FLOW:
   * 1. Validate the plan against input data
   * 2. Execute each step sequentially (steps may contain parallel operations)
   * 3. Pass output from each step as input to the next step
   * 4. Generate operation tree visualization data
   * 5. Return final results with metadata
   */
  async run(): Promise<CondensationRunResult> {
    this.latencyTracker.start('total_run'); // Track the total run time in addition to the individual calls

    // Get condensation plan from input config
    const processingSteps: Array<ProcessingStep> = this.input.options.processingSteps || [];

    // Validate the plan before execution
    validatePlan({ steps: processingSteps, commentCount: this.input.comments.length });

    // Execute plan steps sequentially - each step transforms the data for the next
    let currentData: Array<VAAComment> | Array<Argument> | Array<Array<Argument>> = this.input.comments; // Init with comments
    let previousNodeIds: Array<string> = []; // Start with empty array - first step will create root nodes
    let currentStepIndex = 0; // Track actual step index accounting for multi-level operations (MAP + ITERATE_MAP)

    // Execute each step in the plan sequentially (although the steps themselves may contain parallel operations)
    for (const step of processingSteps) {
      const stepResult = await this.executeStep(step, currentData, currentStepIndex, previousNodeIds);

      // Update current data for next step - this is the key data flow mechanism
      currentData = stepResult.arguments;
      previousNodeIds = stepResult.nodeIds || [];

      // Update step index based on how many levels this operation consumed
      // (MAP operations consume 2 levels: MAP + ITERATE_MAP). Not that clean, I know...
      currentStepIndex += stepResult.stepLevelsConsumed || 1;
    }

    // Calculate total execution time
    const totalDuration = this.latencyTracker.stop('total_run') || -1;
    const endTime = new Date();

    // Calculate total token usage from all prompt calls
    const totalTokens = this.allPromptCalls.reduce(
      (acc, call) => ({
        inputs: acc.inputs + call.metadata.tokens.input,
        outputs: acc.outputs + call.metadata.tokens.output,
        total: acc.total + call.metadata.tokens.total
      }),
      { inputs: 0, outputs: 0, total: 0 }
    );

    // Set final arguments in tree and save operation tree to JSON file
    this.treeBuilder.setFinalArguments(currentData as Array<Argument>);
    await this.treeBuilder.saveTree(path.join(__dirname, '../../data/operationTrees', `${this.runId}.json`));

    // Return the final result with all metadata
    return {
      runId: this.runId,
      condensationType: this.input.options.outputType,
      arguments: currentData as Array<Argument>,
      metrics: {
        duration: totalDuration / 1000, // Convert to seconds
        nLlmCalls: this.allPromptCalls.length,
        cost: this.totalCost,
        tokensUsed: totalTokens
      },
      success: true,
      metadata: {
        llmModel: this.allPromptCalls.length > 0 ? this.allPromptCalls[0].modelUsed : 'unknown',
        language: this.input.options.language,
        startTime: this.startTime,
        endTime: endTime
      }
    };
  }

  /**
   * STEP DISPATCHER
   *
   * Routes each processing step to the appropriate operation handler.
   *
   * OPERATION TYPES:
   * - REFINE: Sequential processing, accumulates arguments across batches
   * - MAP: Parallel processing, extracts arguments from comment batches
   * - REDUCE: Parallel processing, consolidates multiple argument lists into one
   * - GROUND: Parallel processing, iterates arguments with source comments
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

  // *****************************************************
  // -------------- OPERATION HANDLERS ---------------- :)
  // *****************************************************

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

    // Split comments into batches for sequential processing
    const batches = createBatches({ array: comments, batchSize });

    // Create tree nodes for each batch. These will be processed sequentially
    const batchNodeIds: Array<string> = [];
    for (let i = 0; i < batches.length; i++) {
      const nodeId = this.treeBuilder.createNode(CondensationOperations.REFINE, stepIndex, i);
      this.treeBuilder.setNodeInput(nodeId, { comments: batches[i] });

      // Link to previous nodes (only if they exist, first step has no parents)
      if (previousNodeIds.length > 0) {
        for (const parentId of previousNodeIds) {
          this.treeBuilder.linkNodes(parentId, nodeId);
        }
      }

      batchNodeIds.push(nodeId);
      this.treeBuilder.startNode(nodeId);
    }

    // Sequential processing: each batch builds upon previous results
    let currentArguments: Array<Argument> = []; // Accumulates arguments across batches
    const prompt = params.initialBatchPrompt; // Initial doesn't get arguments as input. Separate prompt for this is kept for clarity
    const allPromptCalls: Array<PromptCall> = [];

    // Go through each batch and refine it
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const isFirstBatch = i === 0;
      const nodeId = batchNodeIds[i];

      // Prepare template variables
      const templateVariables: Record<string, unknown> = {
        topic: this.input.question.name,
        comments: JSON.stringify(batch, null, 2)
      };

      // Existing arguments are included for refinement if not the first batch
      if (!isFirstBatch) {
        templateVariables.existingArguments = JSON.stringify(currentArguments, null, 2);
      }

      const promptText = setPromptVars({ promptText: prompt, variables: templateVariables });

      // Prepare messages for LLM
      const messages = [{ role: 'system' as const, content: promptText }];

      // Track latency for this LLM call
      const callOperationId = `refine_${nodeId}`;
      this.latencyTracker.start(callOperationId);

      // Make LLM call and process response
      const llmResponse = await this.input.options.llmProvider.generate({
        messages,
        temperature: 0.7,
        model: this.input.options.llmModel
      });

      // Stop latency tracking for LLM call after it has completed
      this.latencyTracker.stop(callOperationId);

      // Parse and validate the response
      let parsedResponse: ResponseWithArguments;
      try {
        parsedResponse = LlmParser.parse(llmResponse.content, RESPONSE_WITH_ARGUMENTS_CONTRACT);

        // Update visualization tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true); // Mark as completed
      } catch (error) {
        // Mark node as failed and stop processing (sequential dependency)
        this.treeBuilder.completeNode(nodeId, 1, false, error instanceof Error ? error.message : 'Unknown error');
        throw new Error(
          `Failed to parse ${isFirstBatch ? 'initial' : 'refinement'} response: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Track the LLM call for metrics
      const latency = this.latencyTracker.getDuration(callOperationId) || 0;
      const promptCall: PromptCall = createPromptInstance({
        operation: CondensationOperations.REFINE,
        promptId: isFirstBatch ? params.initialBatchPromptId : params.refinementPromptId,
        rawInputText: `${isFirstBatch ? 'Initial' : 'Refinement'} for batch ${i + 1}/${batches.length}`,
        llmResponse,
        latency
      });
      this.totalCost += promptCall.metadata.cost;

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
    const batches = createBatches({ array: comments, batchSize });

    // PRE-PROCESSING: Validate parallel batch token counts to prevent API failures
    // Makes sure that the combined number of tokens in the parallel calls does not exceed the model's TPM limit
    const parallelFactor = this.input.options.parallelBatches || 3; // How many batches to process in parallel?
    const validationResult = validateInputTokenCount({
      batches,
      topic: this.input.question.name,
      condensationPrompt: params.condensationPrompt,
      parallelFactor,
      modelTPMLimit: this.input.options.modelTPMLimit || 30000 // A common conservative limit at least for OpenAI
    });

    // Currently, if the batch exceeds the token limit, we throw an error. This happens so rarely, if ever, that it's not a big issue.
    // To improve: add a graceful degradation mechanism, e.g. reduce batch size automatically
    if (!validationResult.success) {
      const failedIndex = validationResult.failedBatchIndex || 0;
      const i = failedIndex * parallelFactor;
      const batchEnd = Math.min(i + parallelFactor, batches.length);
      const batchIndices = Array.from({ length: batchEnd - i }, (_, idx) => i + idx + 1);
      const modelTPMLimit = this.input.options.modelTPMLimit || 30000;
      throw new Error(
        'Map batch exceeds the model tokens per minute (TPM) limit. Halting execution to prevent a persistent API failure. \n\n' +
          `Batch ${failedIndex + 1} (inputs ${batchIndices.join(', ')}) has ${(
            validationResult.tokenCount || 0
          ).toFixed(0)} tokens (max: ${modelTPMLimit})\n\n` +
          `The TPM limit has been set ${
            this.input.options.modelTPMLimit
              ? 'in the input configuration'
              : 'automatically as a conservative default because it was not provided in the input config'
          }.\n\n` +
          ' SOLUTIONS:\n' +
          '   1. Clean up your input data\n' +
          '   2. Use a different LLM with a higher TPM limit (also, if you have configured the limit yourself, maybe check that it is correct) \n' +
          `   3. Reduce batch size from ${batchSize} (currently only possible for developers - see function createCondensationSteps) \n`
      );
    }

    // PHASE 1: Initial MAP step - parallel argument extraction
    const mapResult = await this._executeParallelOperation({
      items: batches,
      stepIndex,
      previousNodeIds,
      operation: CondensationOperations.MAP,
      prompt: params.condensationPrompt,
      logIdentifier: 'BATCH',
      promptId: params.condensationPromptId,
      prepareTemplateVars: (batch) => ({
        topic: this.input.question.name,
        comments: (batch as Array<VAAComment>).map((c) => c.text).join('\n'),
        parallelBatches: parallelFactor
      }),
      parallelBatches: parallelFactor
    });

    // PHASE 2: ITERATE_MAP step - refinement using original comments + extracted arguments
    const iterationResult = await this._executeParallelOperation({
      items: mapResult.arguments.map((argList, i) => ({ argList, batch: batches[i] })),
      stepIndex: stepIndex + 1,
      previousNodeIds: mapResult.nodeIds, // Link iteration nodes to initial MAP nodes
      operation: CondensationOperations.ITERATE_MAP,
      prompt: params.iterationPrompt,
      logIdentifier: 'ITERATION BATCH',
      promptId: params.iterationPromptId,
      prepareTemplateVars: (item) => ({
        topic: this.input.question.name,
        arguments: JSON.stringify(item.argList, null, 2), // Previous arguments
        comments: item.batch.map((c) => c.text).join('\n') // Original comments
      }),
      shouldThrowOnRetryFailure: false,
      parallelBatches: parallelFactor
    });

    // Update mapResult with successful iterations
    for (let i = 0; i < iterationResult.arguments.length; i++) {
      if (iterationResult.arguments[i]) {
        mapResult.arguments[i] = iterationResult.arguments[i];
      }
    }

    // Return the final arguments (either refined or original if iteration failed)
    const finalArguments = mapResult.arguments;

    return {
      arguments: finalArguments,
      promptCalls: [...mapResult.promptCalls, ...iterationResult.promptCalls],
      nodeIds: [...mapResult.nodeIds, ...iterationResult.nodeIds],
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
    const parallelFactor = this.input.options.parallelBatches || 3; // How many batches to process in parallel?

    // Early return if no reduction is needed
    if (argumentLists.length <= 1) {
      return { arguments: argumentLists, promptCalls: [], nodeIds: previousNodeIds };
    }

    // Group argument lists into chunks for parallel processing
    const chunks: Array<Array<Array<Argument>>> = [];
    for (let i = 0; i < argumentLists.length; i += denominator) {
      chunks.push(argumentLists.slice(i, i + denominator));
    }

    // Use the common parallel processing infrastructure
    const result = await this._executeParallelOperation({
      items: chunks,
      stepIndex,
      previousNodeIds,
      operation: CondensationOperations.REDUCE,
      prompt: params.coalescingPrompt,
      logIdentifier: 'CHUNK',
      promptId: params.coalescingPromptId,
      prepareTemplateVars: (chunk) => ({
        topic: this.input.question.name,
        argumentLists: JSON.stringify(chunk, null, 2) // Multiple argument lists to merge
      }),
      parallelBatches: parallelFactor
    });

    // Handle the output format - if we only have one result, unwrap it
    const outputArguments = result.arguments.length === 1 ? result.arguments[0] : result.arguments;

    return {
      arguments: outputArguments,
      promptCalls: result.promptCalls,
      nodeIds: result.nodeIds
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
    const parallelFactor = this.input.options.parallelBatches || 3; // How many batches to process in parallel?
    // Normalize input to always be an array of argument lists for convinience (even if single list)
    const argumentLists: Array<Array<Argument>> = Array.isArray(argumentData[0])
      ? (argumentData as Array<Array<Argument>>)
      : [argumentData as Array<Argument>]; // Single list wrapped in array

    // COMMENT ALLOCATION STRATEGY
    // Ensure we have enough comment batches for all argument lists
    const availableComments = this.input.comments;
    const numArgumentLists = argumentLists.length;
    const availableCommentBatches = Math.floor(availableComments.length / params.batchSize);
    let commentsToUse = availableComments;

    // If we don't have enough comment batches, replicate the comment array
    if (availableCommentBatches > 0 && availableCommentBatches < numArgumentLists) {
      const coefficient = Math.ceil(numArgumentLists / availableCommentBatches);
      commentsToUse = Array.from({ length: coefficient }, () => availableComments).flat();
    }
    const commentBatches = createBatches({ array: commentsToUse, batchSize: params.batchSize });

    // Use the common parallel processing infrastructure
    const result = await this._executeParallelOperation({
      items: argumentLists,
      stepIndex,
      previousNodeIds,
      operation: CondensationOperations.GROUND,
      prompt: params.groundingPrompt,
      logIdentifier: 'LIST',
      promptId: params.groundingPromptId,
      prepareTemplateVars: (argumentList, i) => ({
        topic: this.input.question.name,
        arguments: JSON.stringify(argumentList, null, 2), // Arguments to ground
        comments: JSON.stringify(commentBatches[i], null, 2) // Comments for evidence
      }),
      parallelBatches: parallelFactor
    });

    // Preserve input structure in output - single list stays single, multiple stays multiple
    const outputArguments = Array.isArray(argumentData[0]) ? result.arguments : result.arguments[0];

    return {
      arguments: outputArguments,
      promptCalls: result.promptCalls,
      nodeIds: result.nodeIds
    };
  }

  /**
   * A generic executor for parallel condensation operations MAP, REDUCE, and GROUND operations. It abstracts away the common patterns:
   * 1. Tree node creation and management
   * 2. Parallel LLM call execution
   * 3. Response parsing and validation
   * 4. Robust retry mechanisms for failed calls
   * 5. Success/failure tracking and logging
   * 6. Graceful degradation options
   */
  private async _executeParallelOperation<TInputItem>(config: {
    items: Array<TInputItem>;
    stepIndex: number;
    previousNodeIds: Array<string>;
    operation: CondensationOperation;
    prompt: string;
    logIdentifier: string;
    promptId: string;
    prepareTemplateVars: (item: TInputItem, index: number) => Record<string, unknown>; // Custom logic for how to format variables
    shouldThrowOnRetryFailure?: boolean; // false for map iteration because we can continue even if some batches fail, otherwise true
    parallelBatches?: number;
  }): Promise<{
    arguments: Array<Array<Argument>>;
    promptCalls: Array<PromptCall>;
    nodeIds: Array<string>;
  }> {
    const {
      items,
      stepIndex,
      previousNodeIds,
      operation,
      prompt,
      logIdentifier,
      promptId,
      prepareTemplateVars,
      shouldThrowOnRetryFailure = true,
      parallelBatches = 3
    } = config;

    // PHASE 1: CREATE TREE NODES
    // Create a tree node for each item we'll process
    const nodeIds: Array<string> = [];
    for (let i = 0; i < items.length; i++) {
      const nodeId = this.treeBuilder.createNode(operation, stepIndex, i);

      // Set appropriate input based on operation type for proper visualization
      let nodeInput: {
        comments?: Array<VAAComment>;
        arguments?: Array<Argument>;
        argumentLists?: Array<Array<Argument>>;
      };
      if (operation === CondensationOperations.MAP) {
        nodeInput = { comments: items[i] as Array<VAAComment> };
      } else if (operation === CondensationOperations.ITERATE_MAP) {
        const item = items[i] as { argList: Array<Argument>; batch: Array<VAAComment> };
        nodeInput = { arguments: item.argList };
      } else if (operation === CondensationOperations.REDUCE) {
        nodeInput = { argumentLists: items[i] as Array<Array<Argument>> };
      } else if (operation === CondensationOperations.GROUND) {
        nodeInput = { arguments: items[i] as Array<Argument> };
      } else {
        // Fallback for unknown operations
        nodeInput = { arguments: items[i] as Array<Argument> };
      }

      this.treeBuilder.setNodeInput(nodeId, nodeInput);

      // Link to parent nodes (creates the tree structure)
      if (previousNodeIds.length > 0) {
        for (const parentId of previousNodeIds) {
          this.treeBuilder.linkNodes(parentId, nodeId);
        }
      }
      nodeIds.push(nodeId);
      this.treeBuilder.startNode(nodeId);
    }

    // PHASE 2: PREPARE LLM INPUTS
    // Transform each item into an LLM input using operation-specific logic
    const llmInputs = items.map((item, i) => {
      const templateVariables = prepareTemplateVars(item, i);
      const promptText = setPromptVars({ promptText: prompt, variables: templateVariables });
      return {
        messages: [{ role: 'system' as const, content: promptText }],
        temperature: 0.7,
        model: this.input.options.llmModel
      };
    });

    // PHASE 3: EXECUTE PARALLEL LLM CALLS
    const llmResponses = await this.input.options.llmProvider.generateMultipleParallel({
      inputs: llmInputs,
      parallelBatches
    });

    // PHASE 4: PROCESS RESPONSES (FIRST ATTEMPT)
    const finalArguments: Array<Array<Argument>> = new Array(items.length);
    const allPromptCalls: Array<PromptCall> = [];
    const failedIndices: Array<number> = [];
    const successfulResponses: { [index: number]: LLMResponse } = {};

    // Try to parse each response
    for (let i = 0; i < items.length; i++) {
      const llmResponse = llmResponses[i];
      const nodeId = nodeIds[i];

      try {
        const parsedResponse = LlmParser.parse(llmResponse.content, RESPONSE_WITH_ARGUMENTS_CONTRACT);
        successfulResponses[i] = llmResponse;
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);
        finalArguments[i] = parsedResponse.arguments;
      } catch (error) {
        console.info(`\n❌ ${operation} ${logIdentifier} ${i + 1}/${items.length} FAILED ===`);
        console.info('Parse error:', error instanceof Error ? error.message : 'Unknown error');
        console.info('=====================================\n');
        failedIndices.push(i);
        this.treeBuilder.completeNode(
          nodeId,
          1,
          false,
          `Initial parse failed, retrying: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // PHASE 5: RETRY CALLS THAT FAILED TO PARSE
    if (failedIndices.length > 0) {
      console.info(`\n🔄 Retrying ${failedIndices.length} failed ${operation} ${logIdentifier}s...`);
      const retryResults = await retryUnvalidResponses(
        failedIndices,
        llmInputs,
        operation,
        2, // max retries
        RESPONSE_WITH_ARGUMENTS_CONTRACT,
        this.input.options.llmProvider,
        this.input.options.llmModel
      );

      const retriedSuccessIndices = new Set<number>();
      for (const { index, response } of retryResults) {
        const nodeId = nodeIds[index];
        try {
          const parsedResponse = LlmParser.parse(response.content, RESPONSE_WITH_ARGUMENTS_CONTRACT);
          console.info(`\n=== ${operation} ${logIdentifier} ${index + 1}/${items.length} (RETRY SUCCESS) ===`);
          successfulResponses[index] = response;
          this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
          this.treeBuilder.completeNode(nodeId, 1, true);
          finalArguments[index] = parsedResponse.arguments;
          retriedSuccessIndices.add(index);
        } catch (retryError) {
          this.treeBuilder.completeNode(
            nodeId,
            1,
            false,
            `All retries failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
          );
          if (shouldThrowOnRetryFailure) {
            throw new Error(
              `Failed to parse ${operation} response for ${logIdentifier} ${index + 1} after retries: ${
                retryError instanceof Error ? retryError.message : 'Unknown error'
              }`
            );
          }
        }
      }

      // Handle remaining failures. We wait for these patiently! :)
      const stillFailedIndices = failedIndices.filter((i) => !retriedSuccessIndices.has(i));
      if (stillFailedIndices.length > 0) {
        if (shouldThrowOnRetryFailure) {
          throw new Error(
            `${operation} operation failed for ${logIdentifier}s: ${stillFailedIndices
              .map((i) => i + 1)
              .join(', ')} after all retry attempts`
          );
        }
      }
    }

    // PHASE 6: COLLECT METRICS
    // Track all successful LLM calls for cost and usage analysis
    for (let i = 0; i < items.length; i++) {
      const llmResponse = successfulResponses[i];
      const latency = this.latencyTracker.getDuration(nodeIds[i]) || 0;
      if (llmResponse) {
        const promptCall: PromptCall = createPromptInstance({
          operation,
          promptId,
          rawInputText: `${operation} for ${logIdentifier} ${i + 1}/${items.length}`,
          llmResponse,
          latency
        });
        allPromptCalls.push(promptCall);
        this.allPromptCalls.push(promptCall);
        this.totalCost += promptCall.metadata.cost;
      }
    }

    return { arguments: finalArguments, promptCalls: allPromptCalls, nodeIds };
  }
}
