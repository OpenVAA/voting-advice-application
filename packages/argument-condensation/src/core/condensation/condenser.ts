import { DefaultLogger } from '@openvaa/core';
import * as path from 'path';
import { RESPONSE_WITH_ARGUMENTS_CONTRACT } from './responseValidators';
import { MODEL_DEFAULTS } from '../../defaultValues';
import { CondensationOperations } from '../types';
import {
  calculateStepWeights,
  createBatches,
  createPromptInstance,
  LatencyTracker,
  normalizeArgumentLists,
  parse,
  setPromptVars,
  validatePlan
} from '../utils';
import { OperationTreeBuilder } from '../utils/operationTrees/operationTreeBuilder';
import type { Logger } from '@openvaa/core';
import type { ParsedLLMResponse } from '@openvaa/llm';
import type {
  Argument,
  CondensationOperation,
  CondensationRunInput,
  CondensationRunResult,
  CondensationStepResult,
  GroundingOperationParams,
  IterateMapOperationParams,
  MapOperationParams,
  ProcessingStep,
  PromptCall,
  ReduceOperationParams,
  RefineOperationParams,
  ResponseWithArguments,
  VAAComment
} from '../types';

/** A no-op version of OperationTreeBuilder for when visualization data creation is disabled */
class DummyTreeBuilder {
  createNode(operation: string, stepIndex: number, itemIndex: number): string {
    return `${operation}-${stepIndex}-${itemIndex}`;
  }
  setNodeInput() {}
  linkNodes() {}
  startNode() {}
  setFinalArguments() {}
  async saveTree(): Promise<void> {}
  setNodeOutput() {}
  completeNode() {}
}

/**
 * Takes in an array of comments and a configuration object and orchestrates the condensation process using these inputs.
 * Outputs a list of arguments and generates operation tree visualization data for debugging and analysis.
 *
 * You can use the condenser either as a standalone class or simply by using the `handleQuestion` function defined in `main.ts`.
 * A standalone run provides minimal but not trivial customization options. Namely, you can run a process for only finding cons,
 * whereas `handleQuestion` automatically runs both pros and cons.
 *
 * The data needed for visualizing a run through the condenser will be saved to `data/operationTrees` if the flag
 * `createVisualizationData` is set to `true`.
 *
 * You can choose the condensation run you want to visualize from the `data/operationTrees` folder in  the visualization UI.
 *
 * @example
 * import { Condenser } from '@openvaa/argument-condensation';
 * import { SingleChoiceCategoricalQuestion, DataRoot, QUESTION_TYPE } from '@openvaa/data';
 * import { OpenAIProvider } from '@openvaa/llm';
 * import type { CondensationRunInput } from '@openvaa/argument-condensation';
 *
 * const question = new SingleChoiceCategoricalQuestion({
 *   data: {
 *     id: 'q2',
 *     type: QUESTION_TYPE.SingleChoiceCategorical,
 *     name: 'Public Transport Improvement',
 *     customData: {},
 *     categoryId: 'cat1',
 *     choices: [
 *       { id: 'choice1', customData: {} },
 *       { id: 'choice2', customData: {} }
 *     ]
 *   },
 *   root: dataRoot // Your DataRoot instance
 * });
 *
 * const comments = [
 *   { id: 'c1', entityId: 'cand1', entityAnswer: 'choice1', text: 'New subways are essential.' },
 *   { id: 'c2', entityId: 'cand2', entityAnswer: 'choice2', text: 'Buses are more flexible.' }
 * ];
 *
 * const condenser = new Condenser({
 *   question,
 *   comments,
 *   options: {
 *     llmProvider: new OpenAIProvider({ apiKey: 'your-api-key' }),
 *     language: 'en',
 *     outputType: 'categoricalPros',
 *     processingSteps: [
 *       { operation: 'map', params: { batchSize: 20 } },
 *       { operation: 'reduce', params: { denominator: 5 } }
 *     ],
 *     llmModel: 'gpt-4o',
 *     modelTPMLimit: 30000,
 *     runId: 'my-run-id',
 *     createVisualizationData: true
 *   }
 * });
 *
 * const result = await condenser.run();
 */
export class Condenser {
  private runId: string;
  private allPromptCalls: Array<PromptCall> = [];
  private treeBuilder: OperationTreeBuilder | DummyTreeBuilder;
  private latencyTracker: LatencyTracker;
  private totalCost: number = 0;
  private startTime: Date;
  private logger: Logger;

  constructor(private input: CondensationRunInput) {
    this.runId = input.options.runId;
    this.logger = input.options.logger ?? new DefaultLogger();
    this.latencyTracker = new LatencyTracker(this.logger);
    this.startTime = new Date();

    if (input.options.createVisualizationData) {
      this.treeBuilder = new OperationTreeBuilder(this.runId);
    } else {
      this.treeBuilder = new DummyTreeBuilder();
    }
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
    this.logger.info(`Starting condensation run for "${this.input.question.name}"`);
    this.latencyTracker.start('total_run'); // Track the total run time in addition to the individual calls

    // Get condensation plan from input config
    const processingSteps: Array<ProcessingStep> = this.input.options.processingSteps ?? [];

    // Validate the plan before execution
    validatePlan({ steps: processingSteps, commentCount: this.input.comments.length });

    // NEW: Granularize progress tracking by defining sub-operations for each processing step
    if (
      processingSteps.length > 0 &&
      this.logger &&
      typeof this.logger.defineSubOperations === 'function' &&
      typeof this.logger.getCurrentOperation === 'function'
    ) {
      const currentOperationId = this.logger.getCurrentOperation()!.id;
      const stepWeights = calculateStepWeights(processingSteps, this.input.comments.length);
      const subOperations = stepWeights.map((step) => ({
        id: `${step.operation}-step-${step.stepIndex}`,
        weight: step.weight
      }));

      this.logger.info(`currentOperationId: ${currentOperationId}, \nsubOperations: ${subOperations}`);
      this.logger.defineSubOperations(currentOperationId, subOperations);
      this.logger.info(`Defined ${subOperations.length} sub-operations for progress tracking`);
    }

    // Execute plan steps sequentially - each step transforms the data for the next
    let currentData: Array<VAAComment> | Array<Argument> | Array<Array<Argument>> = this.input.comments; // Init with comments
    let previousNodeMapping: Array<Array<string>> = []; // Start with empty mapping - first step will create root nodes

    // Execute each step in the plan sequentially (although the steps themselves may contain parallel operations)
    for (const [i, step] of processingSteps.entries()) {
      const stepResult = await this.executeStep({ step, inputData: currentData, stepIndex: i, previousNodeMapping });

      // Update current data for next step: the output of the current step becomes the input for the next step
      currentData = stepResult.arguments;
      // The node IDs from the completed step become the potential parents for the next step.
      // Each node ID is wrapped in its own array to represent a distinct data source that the next step can group.
      previousNodeMapping = stepResult.nodeIds?.map((id) => [id]) ?? [];
    }

    // Calculate total execution time
    const totalDuration = this.latencyTracker.stop('total_run') ?? -1;
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
    await this.treeBuilder.saveTree(path.join(__dirname, '../../../data/operationTrees', `${this.runId}.json`));

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
   * - refine: Sequential processing, accumulates arguments across batches
   * - map: Parallel processing, extracts arguments from comment batches
   * - reduce: Parallel processing, consolidates multiple argument lists into one
   * - ground: Parallel processing, iterates arguments with source comments
   */
  private async executeStep({
    step,
    inputData,
    stepIndex,
    previousNodeMapping
  }: {
    step: ProcessingStep;
    inputData: Array<VAAComment> | Array<Argument> | Array<Array<Argument>>;
    stepIndex: number;
    previousNodeMapping: Array<Array<string>>;
  }): Promise<CondensationStepResult> {
    switch (step.operation) {
      case CondensationOperations.REFINE:
        return await this.executeRefine({
          step,
          comments: inputData as Array<VAAComment>,
          stepIndex,
          previousNodeMapping
        });

      case CondensationOperations.MAP:
        return await this.executeMap({
          step,
          comments: inputData as Array<VAAComment>,
          stepIndex,
          previousNodeMapping
        });

      case CondensationOperations.ITERATE_MAP:
        return await this.executeIterateMap({
          step,
          argumentData: inputData as Array<Argument> | Array<Array<Argument>>,
          stepIndex,
          previousNodeMapping
        });

      case CondensationOperations.REDUCE:
        return await this.executeReduce({
          step,
          argumentLists: inputData as Array<Array<Argument>>,
          stepIndex,
          previousNodeMapping
        });

      case CondensationOperations.GROUND:
        return await this.executeGround({
          step,
          argumentData: inputData as Array<Argument> | Array<Array<Argument>>,
          stepIndex,
          previousNodeMapping
        });

      default:
        throw new Error(`Unknown operation: ${step.operation}`);
    }
  }

  // *****************************************************
  // -------------- OPERATION HANDLERS ---------------- :)
  // *****************************************************

  /**
   * Execute refine operation
   */
  private async executeRefine({
    step,
    comments,
    stepIndex,
    previousNodeMapping
  }: {
    step: ProcessingStep;
    comments: Array<VAAComment>;
    stepIndex: number;
    previousNodeMapping: Array<Array<string>>;
  }): Promise<CondensationStepResult> {
    const params = step.params as RefineOperationParams;
    const batchSize = params.batchSize;

    // Split comments into batches for sequential processing
    const batches = createBatches({ array: comments, batchSize });

    // Create tree nodes for each batch. These will be processed sequentially
    const batchNodeIds: Array<string> = [];
    for (let i = 0; i < batches.length; i++) {
      const nodeId = this.treeBuilder.createNode(CondensationOperations.REFINE, stepIndex, i);
      this.treeBuilder.setNodeInput(nodeId, { comments: batches[i] });

      // Link to parent nodes: first batch links to previous step, subsequent batches link to previous batch
      const parentIds = i === 0 ? (previousNodeMapping[0] ?? []) : [batchNodeIds[i - 1]];
      for (const parentId of parentIds) {
        this.treeBuilder.linkNodes(parentId, nodeId);
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

      const promptText = setPromptVars({ promptText: prompt, variables: templateVariables, logger: this.logger });

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
        parsedResponse = parse(llmResponse.content, RESPONSE_WITH_ARGUMENTS_CONTRACT);

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
      const latency = this.latencyTracker.getDuration(callOperationId) ?? 0;
      const promptCall = createPromptInstance({
        operation: CondensationOperations.REFINE,
        promptId: isFirstBatch ? params.initialBatchPromptId : params.refinementPromptId,
        rawInputText: `${isFirstBatch ? 'Initial' : 'Refinement'} for batch ${i + 1}/${batches.length}`,
        llmResponse,
        latency,
        llmProvider: this.input.options.llmProvider,
        logger: this.logger
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
      nodeIds: batchNodeIds,
      nodeMapping: batchNodeIds.map((_, i) => (i === 0 ? (previousNodeMapping[0] ?? []) : [batchNodeIds[i - 1]]))
    };
  }

  /**
   * Execute map operation
   */
  private async executeMap({
    step,
    comments,
    stepIndex,
    previousNodeMapping
  }: {
    step: ProcessingStep;
    comments: Array<VAAComment>;
    stepIndex: number;
    previousNodeMapping: Array<Array<string>>;
  }): Promise<CondensationStepResult> {
    const params = step.params as MapOperationParams;

    // Create batches using the validated batch size from the processing step
    const batches = createBatches({ array: comments, batchSize: params.batchSize });
    const parallelFactor = this.input.options.parallelBatches;

    // Parallel argument extraction
    const result = await this._executeParallelOperation({
      items: batches,
      stepIndex,
      previousNodeMapping,
      operation: CondensationOperations.MAP,
      prompt: params.condensationPrompt,
      logIdentifier: 'BATCH',
      promptId: params.condensationPromptId,
      prepareTemplateVars: (batch) => ({
        topic: this.input.question.name,
        comments: (batch as Array<VAAComment>).map((c) => c.text).join('\n')
      }),
      parallelBatches: parallelFactor
    });

    return {
      arguments: result.arguments,
      promptCalls: result.promptCalls,
      nodeIds: result.nodeIds,
      nodeMapping: result.nodeIds.map((_, i) => previousNodeMapping[i] ?? [])
    };
  }

  /**
   * Execute iterate_map operation (refinement using original comments + extracted arguments)
   */
  private async executeIterateMap({
    step,
    argumentData,
    stepIndex,
    previousNodeMapping
  }: {
    step: ProcessingStep;
    argumentData: Array<Argument> | Array<Array<Argument>>;
    stepIndex: number;
    previousNodeMapping: Array<Array<string>>;
  }): Promise<CondensationStepResult> {
    const params = step.params as IterateMapOperationParams;
    const batchSize = params.batchSize;
    const parallelFactor = this.input.options.parallelBatches;

    const argumentLists = normalizeArgumentLists(argumentData);

    // Create batches from original comments to match the argument lists
    const commentBatches = createBatches({ array: this.input.comments, batchSize });

    // Combine argument lists with their corresponding comment batches
    const items = argumentLists.map((argList, i) => ({
      argList,
      batch: commentBatches[i] ?? []
    }));

    const result = await this._executeParallelOperation({
      items,
      stepIndex,
      previousNodeMapping,
      operation: CondensationOperations.ITERATE_MAP,
      prompt: params.iterationPrompt,
      logIdentifier: 'ITERATION BATCH',
      promptId: params.iterationPromptId,
      prepareTemplateVars: (item) => ({
        topic: this.input.question.name,
        arguments: JSON.stringify(item.argList, null, 2), // Previous arguments
        comments: item.batch.map((c) => c.text).join('\n') // Original comments
      }),
      parallelBatches: parallelFactor
    });

    // Preserve input structure in output - single list stays single, multiple stays multiple
    const outputArguments = Array.isArray(argumentData[0]) ? result.arguments : result.arguments[0];

    return {
      arguments: outputArguments,
      promptCalls: result.promptCalls,
      // `nodeIds`: The final output nodes of this step (the iterate_map nodes).
      // These will serve as parents for the next condensation step.
      nodeIds: result.nodeIds,
      // `nodeMapping`: The internal wiring for visualization. This links each iterate_map node
      // back to its parent map node, showing the two-phase nature of this operation.
      nodeMapping: result.nodeIds.map((_, i) => previousNodeMapping[i] ?? [])
    };
  }

  /**
   * Execute reduce operation
   */
  private async executeReduce({
    step,
    argumentLists,
    stepIndex,
    previousNodeMapping
  }: {
    step: ProcessingStep;
    argumentLists: Array<Array<Argument>>;
    stepIndex: number;
    previousNodeMapping: Array<Array<string>>;
  }): Promise<CondensationStepResult> {
    const params = step.params as ReduceOperationParams;
    const denominator = params.denominator;
    const parallelFactor = this.input.options.parallelBatches; // How many batches to process in parallel?

    // Early return if no reduction is needed
    if (argumentLists.length <= 1) {
      return {
        arguments: argumentLists,
        promptCalls: [],
        nodeIds: previousNodeMapping.map((_, i) => `passthrough_${i}`),
        nodeMapping: previousNodeMapping
      };
    }

    // Group argument lists into chunks for parallel processing
    const chunks: Array<Array<Array<Argument>>> = [];
    for (let i = 0; i < argumentLists.length; i += denominator) {
      chunks.push(argumentLists.slice(i, i + denominator));
    }

    // Create the parent mapping for each new reduce node. Each node will be linked
    // to the group of parent nodes that produced the argument lists it is reducing.
    const chunkNodeMapping = chunks.map((chunk, chunkIndex) => {
      const startIdx = chunkIndex * denominator;
      const endIdx = Math.min(startIdx + denominator, previousNodeMapping.length);
      return previousNodeMapping.slice(startIdx, endIdx).flat();
    });

    const result = await this._executeParallelOperation({
      items: chunks,
      stepIndex,
      previousNodeMapping: chunkNodeMapping,
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

    const outputArguments = result.arguments.length === 1 ? result.arguments[0] : result.arguments;

    return {
      arguments: outputArguments,
      promptCalls: result.promptCalls,
      nodeIds: result.nodeIds,
      nodeMapping: chunkNodeMapping
    };
  }

  /**
   * Execute ground operation
   */
  private async executeGround({
    step,
    argumentData,
    stepIndex,
    previousNodeMapping
  }: {
    step: ProcessingStep;
    argumentData: Array<Argument> | Array<Array<Argument>>;
    stepIndex: number;
    previousNodeMapping: Array<Array<string>>;
  }): Promise<CondensationStepResult> {
    const params = step.params as GroundingOperationParams;
    const parallelFactor = this.input.options.parallelBatches; // How many batches to process in parallel?
    const argumentLists = normalizeArgumentLists(argumentData);

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
      previousNodeMapping,
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
      nodeIds: result.nodeIds,
      nodeMapping: previousNodeMapping // Pass through the same mapping
    };
  }

  /**
   * A generic executor for parallel condensation operations map, reduce, and ground operations. It abstracts away the common patterns:
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
    previousNodeMapping: Array<Array<string>>;
    operation: CondensationOperation;
    prompt: string;
    logIdentifier: string;
    promptId: string;
    prepareTemplateVars: (item: TInputItem, index: number) => Record<string, unknown>; // Custom logic for how to format variables
    parallelBatches?: number;
  }): Promise<{
    arguments: Array<Array<Argument>>;
    promptCalls: Array<PromptCall>;
    nodeIds: Array<string>;
  }> {
    const {
      items,
      stepIndex,
      previousNodeMapping,
      operation,
      prompt,
      logIdentifier,
      promptId,
      prepareTemplateVars,
      parallelBatches = MODEL_DEFAULTS.PARALLEL_BATCHES
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

      // Link to parent nodes using the specific mapping for this item.
      // This ensures that nodes are only linked to the parents that directly produced their input data
      const parentIds = previousNodeMapping[i] ?? [];
      for (const parentId of parentIds) {
        this.treeBuilder.linkNodes(parentId, nodeId);
      }

      nodeIds.push(nodeId);
      this.treeBuilder.startNode(nodeId);
    }

    // PHASE 2: PREPARE LLM INPUTS
    // Transform each item into an LLM input using operation-specific logic
    const llmInputs = items.map((item, i) => {
      const templateVariables = prepareTemplateVars(item, i);
      const promptText = setPromptVars({ promptText: prompt, variables: templateVariables, logger: this.logger });
      return {
        messages: [{ role: 'system' as const, content: promptText }],
        temperature: 0.7,
        model: this.input.options.llmModel
      };
    });

    // PHASE 3: EXECUTE PARALLEL LLM CALLS WITH VALIDATION
    // The llmProvider handles all retry logic (for both network and validation errors) internally.
    // We provide the inputs and a validation contract, and the provider returns fully parsed and validated objects.
    let validatedResponses: Array<ParsedLLMResponse<{ arguments: Array<Argument> }>>;
    try {
      validatedResponses = await this.input.options.llmProvider.generateMultipleParallel(
        {
          inputs: llmInputs,
          responseContract: RESPONSE_WITH_ARGUMENTS_CONTRACT,
          parallelBatches,
          validationAttempts: MODEL_DEFAULTS.VALIDATION_ATTEMPTS
        },
        this.logger
      );
    } catch (error) {
      // If the provider fails after all retries, we add context and re-throw to abort the condensation.
      throw new Error(
        `${operation} operation failed for ${logIdentifier}. The LLM provider could not get a valid response. Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    // PHASE 4: PROCESS RESULTS AND COLLECT METRICS
    // All responses are valid because they have been validated against the contract by the provider.
    const finalArguments: Array<Array<Argument>> = new Array(items.length);
    const allPromptCalls: Array<PromptCall> = [];

    for (let i = 0; i < items.length; i++) {
      const response = validatedResponses[i];
      const nodeId = nodeIds[i];

      // Store the successfully parsed arguments
      const parsedArgs = response.parsed.arguments;
      finalArguments[i] = parsedArgs;

      // Update the operation tree with the successful result
      this.treeBuilder.setNodeOutput(nodeId, { arguments: parsedArgs });
      this.treeBuilder.completeNode(nodeId, 1, true);

      // Collect metrics for cost and performance tracking
      const latency = this.latencyTracker.getDuration(nodeId) ?? 0;
      const promptCall: PromptCall = createPromptInstance({
        operation,
        promptId,
        rawInputText: `${operation} for ${logIdentifier} ${i + 1}/${items.length}`,
        llmResponse: response.raw, // Pass the raw response to extract metadata
        latency,
        llmProvider: this.input.options.llmProvider,
        logger: this.logger
      });

      allPromptCalls.push(promptCall);
      this.allPromptCalls.push(promptCall);
      this.totalCost += promptCall.metadata.cost;
    }

    return { arguments: finalArguments, promptCalls: allPromptCalls, nodeIds };
  }
}
