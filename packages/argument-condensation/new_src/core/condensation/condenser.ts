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
import { calculateLLMCost, createBatches, LatencyTracker, LlmParser, setPromptVars, validatePlan } from '../utils';
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
    this.latencyTracker.start('total_run');

    // Get condensation plan from input config
    const processingSteps: Array<ProcessingStep> = this.input.options.processingSteps || [];

    // Early validation: check for empty comments
    if (this.input.comments.length === 0) {
      throw new Error('Cannot run condensation with empty comments array. At least one comment is required.');
    }

    // Validate the plan before execution
    validatePlan({ steps: processingSteps, commentCount: this.input.comments.length });

    // Execute plan steps sequentially - each step transforms the data for the next
    let currentData: Array<VAAComment> | Array<Argument> | Array<Array<Argument>> = this.input.comments; // Init with comments
    let previousNodeIds: Array<string> = []; // Start with empty array - first step will create root nodes
    let currentStepIndex = 0; // Track actual step index accounting for multi-level operations (MAP + ITERATE_MAP)

    for (let i = 0; i < processingSteps.length; i++) {
      const step = processingSteps[i];
      const stepResult = await this.executeStep(step, currentData, currentStepIndex, previousNodeIds);

      // Update current data for next step - this is the key data flow mechanism
      currentData = stepResult.arguments;
      previousNodeIds = stepResult.nodeIds || [];

      // Update step index based on how many levels this operation consumed
      // (MAP operations consume 2 levels: MAP + ITERATE_MAP)
      currentStepIndex += stepResult.stepLevelsConsumed || 1;
    }

    // Calculate total execution time
    const totalDuration = this.latencyTracker.stop('total_run') || 0;
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
   * This is the main branching point that determines how data flows through the system.
   *
   * OPERATION TYPES:
   * - REFINE: Sequential processing, accumulates arguments across batches
   * - MAP: Parallel processing, extracts arguments from comment batches
   * - REDUCE: Parallel processing, consolidates multiple argument lists
   * - GROUND: Parallel processing, connects arguments to source comments
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

    // Split comments into batches for sequential processing
    const batches = createBatches({ array: comments, batchSize });

    // Create tree nodes for each batch - these will be processed sequentially
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

    // Sequential processing - each batch builds upon previous results
    let currentArguments: Array<Argument> = []; // Accumulates arguments across batches
    const prompt = params.initialBatchPrompt;
    const allPromptCalls: Array<PromptCall> = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const isFirstBatch = i === 0;
      const nodeId = batchNodeIds[i];

      // Prepare template variables - note how existing arguments are included for refinement
      const templateVariables: Record<string, unknown> = {
        topic: this.input.question.name,
        comments: JSON.stringify(batch, null, 2)
      };

      // Add existing arguments for refinement prompts (key difference from MAP)
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

      // Stop latency tracking
      this.latencyTracker.stop(callOperationId);

      // Parse and validate the response
      let parsedResponse: ResponseWithArguments;
      try {
        parsedResponse = LlmParser.parse(llmResponse.content, RESPONSE_WITH_ARGUMENTS_CONTRACT);

        // Update tree node with output
        this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedResponse.arguments });
        this.treeBuilder.completeNode(nodeId, 1, true);
      } catch (error) {
        // Mark node as failed and stop processing (sequential dependency)
        this.treeBuilder.completeNode(nodeId, 1, false, error instanceof Error ? error.message : 'Unknown error');
        throw new Error(
          `Failed to parse ${isFirstBatch ? 'initial' : 'refinement'} response: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Track the LLM call for metrics
      const promptCall: PromptCall = this.createPromptCall(
        CondensationOperations.REFINE,
        'RefineMockId',
        `${isFirstBatch ? 'Initial' : 'Refinement'} for batch ${i + 1}/${batches.length}`,
        llmResponse,
        callOperationId
      );

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

    // PRE-PROCESSING: Validate batch token counts to prevent API failures
    // This is specific to MAP because it typically processes the largest comment volumes
    const MAX_TOKENS_PER_BATCH = 28500; // Conservative limit for most LLM providers
    // How many batches we send in parallel? 
    const llmBatchSize = this.input.options.parallelBatches || 3;

    // Estimate token usage by creating sample prompts
    const llmInputsForTokenCheck = batches.map((batch) => {
      const templateVariables: Record<string, unknown> = {
        topic: this.input.question.name,
        comments: batch.map((c) => c.text).join('\n')
      };
      const promptText = setPromptVars({ promptText: params.condensationPrompt, variables: templateVariables });
      return { messages: [{ role: 'system' as const, content: promptText }] };
    });

    // Rough token estimation: characters / 4 * safety margin
    const promptCharsCounts = llmInputsForTokenCheck.map((input) =>
      input.messages.reduce((total, message) => total + message.content.length, 0)
    );

    // Check consecutive batches that would be sent together
    for (let i = 0; i < promptCharsCounts.length; i += llmBatchSize) {
      const batchEnd = Math.min(i + llmBatchSize, promptCharsCounts.length);
      const batchCharSum = promptCharsCounts.slice(i, batchEnd).reduce((sum, count) => sum + count, 0);
      const estimatedTokens = (batchCharSum / 4) * 1.3; // Simple token estimation with buffer

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

    // PHASE 1: Initial MAP step - parallel argument extraction
    const mapResult = await this._executeParallelOperation({
      items: batches,
      stepIndex,
      previousNodeIds,
      operation: CondensationOperations.MAP,
      prompt: params.condensationPrompt,
      logIdentifier: 'BATCH',
      promptId: 'MapMockId',
      prepareTemplateVars: (batch) => ({
        topic: this.input.question.name,
        comments: (batch as Array<VAAComment>).map((c) => c.text).join('\n')
      })
    });

    // PHASE 2: ITERATE_MAP step - refinement using original comments + extracted arguments
    const iterationResult = await this._executeParallelOperation({
      items: mapResult.arguments.map((argList, i) => ({ argList, batch: batches[i] })),
      stepIndex: stepIndex + 1,
      previousNodeIds: mapResult.nodeIds, // Link iteration nodes to initial MAP nodes
      operation: CondensationOperations.ITERATE_MAP,
      prompt: params.iterationPrompt,
      logIdentifier: 'ITERATION BATCH',
      promptId: 'MapIterationPromptId',
      prepareTemplateVars: (item) => ({
        topic: this.input.question.name,
        arguments: JSON.stringify(item.argList, null, 2), // Previous arguments
        comments: item.batch.map((c) => c.text).join('\n') // Original comments
      }),
      // GRACEFUL DEGRADATION: If iteration fails, we keep the initial MAP results
      shouldThrowOnRetryFailure: false,
      onSuccess: (result, index) => {
        // Successful iteration replaces the original arguments with refined ones
        mapResult.arguments[index] = result.parsedResponse.arguments;
      },
      onFailure: (index) => {
        console.info(`\n⚠️  MAP ITERATION BATCH ${index + 1} failed after retries, keeping initial arguments`);
        // Note: mapResult.arguments[index] remains unchanged (initial MAP result)
      }
    });

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
      promptId: 'ReduceMockId',
      prepareTemplateVars: (chunk) => ({
        topic: this.input.question.name,
        argumentLists: JSON.stringify(chunk, null, 2) // Multiple argument lists to merge
      })
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
      promptId: 'GroundMockId',
      prepareTemplateVars: (argumentList, i) => ({
        topic: this.input.question.name,
        arguments: JSON.stringify(argumentList, null, 2), // Arguments to ground
        comments: JSON.stringify(commentBatches[i], null, 2) // Comments for evidence
      }),
      // Custom success handler for detailed logging
      onSuccess: (result, index) => {
        const commentsForGrounding = commentBatches[index];
        console.info(`\n=== GROUND LIST ${index + 1}/${argumentLists.length} ===`);
        console.info('Original arguments:', JSON.stringify(result.item, null, 2));
        console.info('Grounded arguments:', JSON.stringify(result.parsedResponse.arguments, null, 2));
        console.info(`Used ${commentsForGrounding.length} comments for grounding`);
        if (result.parsedResponse.reasoning) {
          console.info('Reasoning:', result.parsedResponse.reasoning);
        }
        console.info('=====================================\n');
      }
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
    prepareTemplateVars: (item: TInputItem, index: number) => Record<string, unknown>;
    shouldThrowOnRetryFailure?: boolean;
    onSuccess?: (result: { parsedResponse: ResponseWithArguments; item: TInputItem }, index: number) => void;
    onFailure?: (index: number) => void;
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
      onSuccess,
      onFailure
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
    const llmResponses = await this.input.options.llmProvider.generateMultipleParallel({ inputs: llmInputs });

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
        if (onSuccess) onSuccess({ parsedResponse, item: items[i] }, i);
      } catch (error) {
        console.info(`\n❌ ${operation} ${logIdentifier} ${i + 1}/${items.length} FAILED ===`);
        console.info('Parse error:', error instanceof Error ? error.message : 'Unknown error');
        console.info('Raw response:', llmResponse.content.substring(0, 200) + '...');
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
          if (onSuccess) onSuccess({ parsedResponse, item: items[index] }, index);
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

      // GRACEFUL DEGRADATION: Handle remaining failures
      const stillFailedIndices = failedIndices.filter((i) => !retriedSuccessIndices.has(i));
      if (stillFailedIndices.length > 0) {
        if (onFailure) stillFailedIndices.forEach((i) => onFailure(i));
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
      if (llmResponse) {
        const promptCall: PromptCall = this.createPromptCall(
          operation,
          promptId,
          `${operation} for ${logIdentifier} ${i + 1}/${items.length}`,
          llmResponse,
          nodeIds[i]
        );
        allPromptCalls.push(promptCall);
        this.allPromptCalls.push(promptCall);
      }
    }

    return { arguments: finalArguments, promptCalls: allPromptCalls, nodeIds };
  }

  /**
   * Helper method to create a PromptCall with proper latency and cost tracking
   */
  private createPromptCall(
    operation: CondensationOperation,
    promptId: string,
    rawInputText: string,
    llmResponse: LLMResponse,
    operationId: string
  ): PromptCall {
    const latency = this.latencyTracker.getDuration(operationId) || 0;

    // Calculate cost for this LLM call
    const callCost = calculateLLMCost({
      provider: 'openai', // TODO: get actual provider from llmProvider
      model: llmResponse.model,
      usage: {
        promptTokens: llmResponse.usage.promptTokens,
        completionTokens: llmResponse.usage.completionTokens,
        totalTokens: llmResponse.usage.totalTokens
      }
    });

    // Add to total cost
    this.totalCost += callCost;

    return {
      promptTemplateId: promptId,
      operation,
      rawInputText,
      rawOutputText: llmResponse.content,
      modelUsed: llmResponse.model,
      timestamp: new Date().toISOString(),
      metadata: {
        tokens: {
          input: llmResponse.usage.promptTokens,
          output: llmResponse.usage.completionTokens,
          total: llmResponse.usage.totalTokens
        },
        latency,
        cost: callCost
      }
    };
  }
}
