import { LLMProvider, Message } from '@openvaa/llm';
import { Argument } from './types/Argument';
import { OutputParser } from './utils/OutputParser';
import { LanguageConfig } from './types/LanguageConfig';
import { ArgumentCondensationError, LLMError } from './types/Errors';
import { CondensationType } from './types/CondensationType';

/**
 * Core class for condensing multiple comments into distinct arguments.
 * Processes comments in batches and maintains context between batches.
 */
export class Condenser {
  private llmProvider: LLMProvider;
  private parser: OutputParser;
  private existingArguments: Argument[][] = [];
  private config: LanguageConfig;
  private readonly MAP_PROMPT_TEMPLATE: string;
  private readonly RECURSIVE_PROMPT_TEMPLATE: string;
  private readonly MAX_COMMENT_LENGTH: number;
  private readonly MAX_TOPIC_LENGTH: number;
  private readonly MAX_BATCH_SIZE: number;
  private readonly MAX_PROMPT_LENGTH: number;

  /**
   * Creates a new Condenser instance
   * @param llmProvider - Provider for language model interactions
   * @param config - Language-specific configuration for prompts and formatting
   * @throws {ArgumentCondensationError} If required parameters are missing
   */
  constructor(llmProvider: LLMProvider, config: LanguageConfig) {
    if (!llmProvider) {
      throw new ArgumentCondensationError('LLM provider is required');
    }
    if (!config) {
      throw new ArgumentCondensationError('Language configuration is required');
    }

    this.llmProvider = llmProvider;
    this.config = config;
    this.parser = new OutputParser(this.config);

    // Define the prompt for the first level of condensation (map phase)
    this.MAP_PROMPT_TEMPLATE = `
    ### {instructions}

    ### ${this.config.existingArgumentsHeader}:
    {existingArguments}

    ### ${this.config.newCommentsHeader}:
    {comments}

    ### ${this.config.outputFormatHeader}:
    <ARGUMENTS>
    ${this.config.outputFormat.argumentPrefix} 1: ${this.config.outputFormat.argumentExplanation}
    ${this.config.outputFormat.sourcesPrefix}: ${this.config.outputFormat.sourcesExplanation}
    </ARGUMENTS>
  `;

    // Define the prompt for the recursive level of condensation (reduce phase)
    this.RECURSIVE_PROMPT_TEMPLATE = `
    ### {instructions}

    ### ${this.config.existingArgumentsHeader}:
    {existingArguments}

    ### ${this.config.outputFormatHeader}:
    <ARGUMENTS>
    ${this.config.outputFormat.argumentPrefix} 1: ${this.config.outputFormat.argumentExplanation}
    ${this.config.outputFormat.sourcesPrefix} 2: ${this.config.outputFormat.argumentExplanation}
    </ARGUMENTS>
  `;
    // Constants for limits
    this.MAX_COMMENT_LENGTH = 2000;
    this.MAX_TOPIC_LENGTH = 200;
    this.MAX_BATCH_SIZE = 200;
    this.MAX_PROMPT_LENGTH = 30000;
  }

  /**
   * Processes an array of comments to extract distinct arguments sequentially
   * @param comments - Array of text comments to process
   * @param topic - The topic these comments relate to
   * @param batchSize - Number of comments to process in each batch (default: 30)
   * @returns Promise<Argument[]> Array of condensed arguments
   * @throws {ArgumentCondensationError} If input validation fails
   * @throws {LLMError} If language model processing fails
   */
  async processComments(comments: string[], topic: string, batchSize: number = 30, condensationType: CondensationType = CondensationType.GENERAL): Promise<Argument[]> {
    try {
      // Input validation
      if (comments.length === 0) {
        throw new ArgumentCondensationError('Comments array cannot be empty');
      }
      if (topic.trim().length === 0) {
        throw new ArgumentCondensationError('Topic cannot be empty');
      }

      // Validate input lengths
      if (topic.length > this.MAX_TOPIC_LENGTH) {
        throw new ArgumentCondensationError(`Topic must be less than ${this.MAX_TOPIC_LENGTH} characters`);
      }

      // Validate batch size
      if (batchSize < 1 || batchSize > this.MAX_BATCH_SIZE) {
        throw new ArgumentCondensationError(`Batch size must be between 1 and ${this.MAX_BATCH_SIZE}`);
      }

      // Check for oversized comments
      const longComments = comments.filter((c) => c.length > this.MAX_COMMENT_LENGTH);
      if (longComments.length > 0) {
        throw new ArgumentCondensationError(
          `${longComments.length} comment(s) exceed the maximum length of ${this.MAX_COMMENT_LENGTH} characters. Please reduce the length of the comments.`
        );
      }

      // First level of condensation: coalesce BATCHES_PER_GROUP batches into a single argument list
      this.existingArguments = await this.createArgumentArrays(comments, topic, batchSize, condensationType);

      // Second level: Recursive pairwise condensation
      return this.reduceArgumentArrays(this.existingArguments, topic, condensationType);
    } catch (error) {
      throw error;
    }
  }

    /**
   * Performs the first level of condensation by creating argument arrays from comments
   * @param comments - Array of comments to process
   * @param topic - The topic these comments relate to
   * @param batchSize - Size of each batch
   * @param condensationType - Type of condensation (supporting, opposing, etc.)
   * @returns Promise<Argument[][]> - Array of argument arrays
   * @private
   */
    private async createArgumentArrays(
      comments: string[],
      topic: string,
      batchSize: number,
      condensationType: CondensationType
    ): Promise<Argument[][]> {
      const argumentGroups: Argument[][] = [];
      const BATCHES_PER_GROUP = 3;
      const nIterations = Math.ceil(comments.length / batchSize);
      let currentGroupArgs: Argument[] = [];
      
      for (let i = 0; i < nIterations; i++) {
        console.log('--------------------------------');
        console.log('        Batch', i + 1, 'of', nIterations);
        console.log(`Generating argument cluster from ${BATCHES_PER_GROUP} batches`);
  
        const batch = comments.slice(i * batchSize, (i + 1) * batchSize);
        const newArgs = await this.processCommentBatch(batch, currentGroupArgs, topic, batchSize, i, condensationType);
        currentGroupArgs.push(...newArgs);
        for (const arg of currentGroupArgs) {console.log(arg.argument);}
        console.log('--------------------------------');
  
        // After every BATCHES_PER_GROUP batches, store the group and start another argument list
        if ((i + 1) % BATCHES_PER_GROUP === 0 || i === nIterations - 1) {
          if (currentGroupArgs.length > 0) {
            argumentGroups.push([...currentGroupArgs]);
            currentGroupArgs = [];
          }
        }
      }
      
      return argumentGroups;
    }

  /**
   * Processes a single batch of comments, using previous arguments as context
   * @param batch - Array of comments to process in this batch
   * @param existingArgs - Previously extracted arguments to use as context
   * @param topic - The topic these comments relate to
   * @param batchSize - Size of the current batch
   * @param nIteration - Current batch iteration number
   * @returns Promise<Argument[]> New arguments extracted from this batch
   * @private
   */
  private async processCommentBatch(
    batch: string[],
    existingArgs: Argument[],
    topic: string,
    batchSize: number,
    nIteration: number,
    condensationType: CondensationType
  ): Promise<Argument[]> {
    try {
      
      let instructions = this.config.instructionsGeneral;
      if (condensationType === CondensationType.SUPPORTING) {
        instructions = this.config.instructionsSupportive;
      } else if (condensationType === CondensationType.OPPOSING) {
        instructions = this.config.instructionsOpposing;
      }

      // Format comments and existing arguments for the prompt
      const commentsText = batch
        .map((comment, i) => `${this.config.inputCommentPrefix} ${i + 1}: ${comment}`)
        .join('\n');

      const existingArgsText = existingArgs
        .map((arg, i) => `${this.config.outputArgumentPrefix} ${i + 1}: ${arg.argument}`)
        .join('\n');

      // Construct the prompt
      let prompt = this.MAP_PROMPT_TEMPLATE
        .replace('{instructions}', instructions)
        .replace('{existingArguments}', existingArgs.length ? existingArgsText : '')
        .replace('{comments}', commentsText)

      // Add reminder of the instructions for opposing condensation
      if (condensationType === CondensationType.OPPOSING) {
        prompt += this.config.opposingReminder.replace('{topic}', topic);
      }

      // Set the topic in the prompt
      prompt = prompt.replace(/{topic}/g, topic);

      // Validate prompt length
      const promptLength = prompt.length;
      if (promptLength > this.MAX_PROMPT_LENGTH) {
        throw new ArgumentCondensationError(
          `Total prompt length (${promptLength}) exceeds maximum of ${this.MAX_PROMPT_LENGTH} characters. Please reduce the number and/or the length of the comments.`
        );
      }

      // Has retry logic with exponential backoff
      // To do: we need to think about possible errors like
      // - Rate limits
      // - API errors
      // - Other errors
      // and how to handle them
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Generate response from language model
          const response = await this.llmProvider.generate({
            messages: [new Message({ role: 'user', content: prompt })],
            temperature: 1
          });

          // Parse arguments and source indices from response
          const newArgStrings = this.parser.parseArguments(response.content);
          const sourceIndices = this.parser.parseSourceIndices(response.content);

          // Convert parsed data into Argument objects
          return newArgStrings.map((argument, i) => {
            const localIndices = sourceIndices[i] || [];
            // Convert local indices to global indices based on batch position
            const globalIndices = localIndices.map((idx) => nIteration * batchSize + (idx - 1));
            const sourceComments = localIndices
              .map((idx) => batch[idx - 1])
              .filter((_, idx) => idx >= 0 && idx < batch.length);

            return {
              argument,
              sourceComments,
              sourceIndices: globalIndices,
              topic
            };
          });
        } catch (error) {
          lastError = error as Error;

          if (attempt === maxRetries) {
            throw new LLMError(`Failed after ${maxRetries} attempts`, lastError);
          }

          // Exponential backoff (delay) between retries
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      throw new LLMError('Failed to process batch', lastError);
    } catch (error) {
      throw new ArgumentCondensationError('Batch processing failed', error);
    }
  }

  private async condenseArgumentArray(argumentArray: Argument[], topic: string, condensationType: CondensationType): Promise<Argument[]> {
    let instructions = this.config.instructionsGeneral;
    if (condensationType === CondensationType.SUPPORTING) {
      instructions = this.config.recursiveInstructionsSupporting;
    } else if (condensationType === CondensationType.OPPOSING) {
      instructions = this.config.recursiveInstructionsOpposing;
    }

    // Format arguments without indices
    const formattedArgs = argumentArray.map(arg => {
      // Remove any existing indices like "1:", "2:" at the beginning of arguments
      return arg.argument.replace(/^\s*\d+\s*:\s*/, '');
    }).join('\n');

    let prompt = this.RECURSIVE_PROMPT_TEMPLATE
      .replace('{instructions}', instructions)
      .replace('{existingArguments}', formattedArgs);

    // Add reminder of the instructions for opposing condensation
    if (condensationType === CondensationType.OPPOSING) {
      prompt += this.config.opposingReminder.replace('{topic}', topic);
    }

    // Set the topic in the prompt last, because it may be references in different places in the prompt
    prompt = prompt.replace(/{topic}/g, topic);

    const response = await this.llmProvider.generate({
      messages: [new Message({ role: 'user', content: prompt })],
      temperature: 1
    });

    const newArgs = this.parser.parseRecursiveCondensation(response.content, topic)
    console.log('\n');
    console.log('Output Arguments:\n');
    for (const arg of newArgs) {console.log(arg.argument);}
    console.log('--------------------------------');
    return newArgs;
  }

  /**
   * Recursively condenses an array of argument arrays until only one array remains
   * @param argumentArrays - Array of argument arrays to condense
   * @param topic - The topic these arguments relate to
   * @returns Promise<Argument[]> Final condensed arguments
   * @private
   */
  private async reduceArgumentArrays(argumentArrays: Argument[][], topic: string, condensationType: CondensationType): Promise<Argument[]> {
    if (argumentArrays.length <= 1) {
      return argumentArrays[0];
    }

    console.log('--------------------------------');
    console.log(`    Processing ${argumentArrays.length} argument groups (will continue pair-wise until one array remains, e.g. 4 --> 2 --> 1)`);
    console.log('--------------------------------');

    const nextLevel: Argument[][] = [];
    
    // Process pairs of arrays
    for (let i = 0; i < argumentArrays.length; i += 2) {
      console.log(`Coalescing arguments ${Math.floor(i/2) + 1} of ${Math.ceil(argumentArrays.length/2)} array pairs`);
      const array1 = argumentArrays[i];
      const array2 = i + 1 < argumentArrays.length ? argumentArrays[i + 1] : [];
      
      // if odd number of arrays, the last one is added as is
      if (array2.length === 0) {
        nextLevel.push(array1);
        continue;
      }

      // Combine and condense the two arrays
      const combinedArgs = [...array1, ...array2];
      const condensedArgs = await this.condenseArgumentArray(combinedArgs, topic, condensationType);

      nextLevel.push(condensedArgs);
    }

    // Recursively process the next level
    return this.reduceArgumentArrays(nextLevel, topic, condensationType);
  }
}
