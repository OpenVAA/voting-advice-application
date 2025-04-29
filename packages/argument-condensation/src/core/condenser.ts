import { LLMProvider, Message } from '@openvaa/llm';
import { Argument } from './types/argument';
import { CONDENSATION_TYPE, CondensationType } from './types/condensationType';
import { ArgumentCondensationError, LLMError } from './types/errors';
import { LanguageConfig } from '../languageOptions/languageConfig.type';
import { OutputParser } from '../utils/outputParser';

/** Maximum cumulative length of comments in a single batch */
const MAX_BATCH_CHARS = 30000;

/** Maximum length for a single comment */
const MAX_COMMENT_LENGTH = 2000;

/**
 * Core class for condensing multiple comments into distinct arguments.
 * Processes comments in batches and maintains context between batches.
 */
export class Condenser {
  private llmProvider: LLMProvider;
  private parser: OutputParser;
  private existingArguments: Array<Array<Argument>> = [];
  private languageConfig: LanguageConfig;
  private readonly mapPromptTemplate: string; // Comments --> Arguments
  private readonly recursivePromptTemplate: string; // Arguments --> Less Arguments

  /**
   * Creates a new Condenser instance
   * @param llmProvider - Provider for language model interactions
   * @param languageConfig - Language-specific configuration for prompts
   * @throws {ArgumentCondensationError} If required parameters are missing
   */
  constructor({ llmProvider, languageConfig }: { llmProvider: LLMProvider; languageConfig: LanguageConfig }) {
    if (!llmProvider) {
      throw new ArgumentCondensationError('LLM provider is required');
    }
    if (!languageConfig) {
      throw new ArgumentCondensationError('Language configuration is required');
    }
    // Set the language configuration
    this.languageConfig = languageConfig;

    // Set basic classes
    this.llmProvider = llmProvider;
    this.parser = new OutputParser(this.languageConfig);

    // Define the prompt for the first level of condensation (map phase)
    this.mapPromptTemplate = `
    ### {instructions}

    ### ${this.languageConfig.existingArgumentsHeader}:
    {existingArguments}

    ### ${this.languageConfig.newCommentsHeader}:
    {comments}

    ### ${this.languageConfig.outputFormatHeader}:
    <ARGUMENTS>
    ${this.languageConfig.outputFormat.argumentPrefix} 1: ${this.languageConfig.outputFormat.argumentPlaceholder}
    </ARGUMENTS>
  `;

    // Define the prompt for the recursive level of condensation (reduce phase)
    this.recursivePromptTemplate = `
    ### {instructions}

    ### ${this.languageConfig.existingArgumentsHeader}:
    {existingArguments}

    ### ${this.languageConfig.outputFormatHeader}:
    <ARGUMENTS>
    ${this.languageConfig.outputFormat.argumentPrefix} 1: ${this.languageConfig.outputFormat.argumentPlaceholder}
    </ARGUMENTS>
  `;
  }

  /**
   * Processes an array of comments to extract distinct Arguments sequentially
   * @param comments - Array of text comments to process
   * @param topic - The topic these comments relate to
   * @param batchSize - Number of comments to process in each batch (default: 30)
   * @returns Promise<Argument[]> Array of condensed Arguments
   * @throws {ArgumentCondensationError} If input validation fails
   * @throws {LLMError} If language model processing fails
   */
  async processComments({
    comments,
    topic,
    batchSize = 30,
    condensationType = CONDENSATION_TYPE.General,
    batchesPerArray = 3
  }: {
    comments: Array<string>;
    topic: string;
    batchSize?: number;
    condensationType?: CondensationType;
    batchesPerArray?: number;
  }): Promise<Array<Argument>> {
    try {
      // Validate non-empty comments and truncate those exceeding MAX_COMMENT_LENGTH
      const validatedComments = comments
        .filter((comment) => comment?.trim() !== '')
        .map((comment) =>
          comment.length > MAX_COMMENT_LENGTH ? comment.substring(0, MAX_COMMENT_LENGTH) + '...' : comment
        );

      console.log(validatedComments);

      // Check that the comment array is non-empty
      if (validatedComments.length === 0) {
        throw new ArgumentCondensationError('Comments array cannot be empty');
      }
      // Check that the topic is non-empty
      if (topic.trim().length === 0) {
        throw new ArgumentCondensationError('Topic cannot be empty');
      }

      // First level of condensation: turn some k (batchesPerArray) comment batches into Argument arrays
      this.existingArguments = await this.createArgumentArrays(
        validatedComments,
        topic,
        batchSize,
        condensationType,
        batchesPerArray
      );

      // Second level: Recursively (and pairwise) coalesce the Argument arrays into a single array.
      // Does not flatten k arrays to 1 array directly, but k --> k/2 --> ... --> 1
      return this.reduceArgumentArrays({
        argumentArrays: this.existingArguments,
        topic,
        condensationType
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Performs the first level of condensation by creating Argument arrays from comments
   * @param comments - Array of comments to process
   * @param topic - The topic these comments relate to
   * @param batchSize - Size of each batch
   * @param condensationType - Type of condensation (supporting, opposing, etc.)
   * @param batchesPerArray - Number of batches to use for one Argument array
   * @returns Promise<Argument[][]> - Array of Argument arrays
   * @private
   */
  private async createArgumentArrays(
    comments: Array<string>,
    topic: string,
    batchSize: number,
    condensationType: CondensationType,
    batchesPerArray: number
  ): Promise<Array<Array<Argument>>> {
    const nIterations = Math.ceil(comments.length / batchSize); // nIterations = number of batches to process

    /** Array to populate with Argument arrays */
    const argumentArrays: Array<Array<Argument>> = [];

    /** Array of Arguments for the current batch */
    let currentGroupArgs: Array<Argument> = [];

    // For k (batchesPerArray) batches, create an Argument array
    for (let i = 0; i < nIterations; i++) {
      // Process the current batch
      const commentBatch = comments.slice(i * batchSize, (i + 1) * batchSize);
      const newArgs = await this.processCommentBatch({
        commentBatch,
        existingArgs: currentGroupArgs,
        topic,
        condensationType
      });
      currentGroupArgs.push(...newArgs);

      // Logging (for debugging)
      console.log('--------------------------------');
      console.log('        Batch', i + 1, 'of', nIterations);
      for (const arg of currentGroupArgs) {
        console.log(arg.argument);
      }
      console.log('--------------------------------');

      // After every batchesPerArray batches, store the Argument array and start a new one
      if ((i + 1) % batchesPerArray === 0 || i === nIterations - 1) {
        if (currentGroupArgs.length > 0) {
          argumentArrays.push([...currentGroupArgs]);
          currentGroupArgs = [];
        }
      }
    }

    // Return the array of Argument arrays
    return argumentArrays;
  }

  /**
   * Processes a single batch of comments using previous Arguments as context
   * @param commentBatch - Array of comments to process in this batch
   * @param existingArgs - Previously extracted Arguments to use as context
   * @param topic - The topic these comments relate to
   * @param batchSize - Size of the current batch
   * @param nIteration - Current batch iteration number
   * @returns Promise<Argument[]> New Arguments extracted from this batch
   * @private
   */
  private async processCommentBatch({
    commentBatch,
    existingArgs,
    topic,
    condensationType
  }: {
    commentBatch: Array<string>;
    existingArgs: Array<Argument>;
    topic: string;
    condensationType: CondensationType;
  }): Promise<Array<Argument>> {
    try {
      /** Instructions for the current condensation type (supporting, opposing, etc.) */
      let instructions = this.languageConfig.instructionsGeneral;
      if (condensationType === CONDENSATION_TYPE.Supporting) {
        instructions = this.languageConfig.instructionsSupportive;
      } else if (condensationType === CONDENSATION_TYPE.Opposing) {
        instructions = this.languageConfig.instructionsOpposing;
      }

      // Remove the longest comments if the batch's cumulative length > MAX_BATCH_CHARS
      let commentsCharSum = commentBatch.reduce((sum, comment) => sum + comment.length, 0);
      while (commentsCharSum > MAX_BATCH_CHARS) {
        const longestCommentIndex = commentBatch.reduce(
          (maxIndex, comment, currentIndex, arr) => (comment.length > arr[maxIndex].length ? currentIndex : maxIndex),
          0
        );

        // Remove the longest comment
        commentBatch.splice(longestCommentIndex, 1);

        // Recalculate sum
        commentsCharSum = commentBatch.reduce((sum, comment) => sum + comment.length, 0);
      }

      /** Comments formatted for the prompt */
      const commentsText = commentBatch
        .map((comment, i) => `${this.languageConfig.inputCommentPrefix} ${i + 1}: ${comment}`)
        .join('\n');

      /** Existing Arguments formatted for the prompt */
      const existingArgsText = existingArgs
        .map((arg, i) => `${this.languageConfig.existingArgumentPrefix} ${i + 1}: ${arg.argument}`)
        .join('\n');

      /** Prompt for the current batch */
      let prompt = this.mapPromptTemplate
        .replace('{instructions}', instructions)
        .replace('{existingArguments}', existingArgs.length ? existingArgsText : '')
        .replace('{comments}', commentsText);

      // Add prompt instructions at the end (now only for opposing condensation, because it's the hardest one for LLMs)
      if (condensationType === CONDENSATION_TYPE.Opposing) {
        prompt += this.languageConfig.opposingReminder;
      }

      // Set the topic last, because it may have references in different sub-sections of the prompt
      prompt = prompt.replace(/{topic}/g, topic);

      /** Maximum number of retries for LLM calls */
      const maxRetries = 3;
      /** Last error to be thrown if k (maxRetries) LLM calls fail */
      let lastError: Error | undefined = undefined;

      // Try to generate a response from the LLM
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Generate response from the LLM
          const response = await this.llmProvider.generate({
            messages: [new Message({ role: 'user', content: prompt })],
            temperature: 0 // 0 is most deterministic, best for factual output
          });

          /** Parsed Arguments from LLM response */
          const newArgStrings = this.parser.parseArguments({ text: response.content, topic });

          // Return the new Argument objects
          return newArgStrings;
        } catch (error) {
          lastError = error as Error;

          // If too many attempts fail, throw an error
          if (attempt === maxRetries) {
            throw new LLMError(`Failed after ${maxRetries} attempts`, lastError);
          }

          // Exponential delay between retries, base 2
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      throw new LLMError('Failed to process batch', lastError);
    } catch (error) {
      throw new ArgumentCondensationError('Batch processing failed', error);
    }
  }

  /**
   * Condenses an array of Arguments into a smaller array of Arguments
   * @param argumentArray - Array of Arguments to condense
   * @param topic - The topic these Arguments relate to
   * @param condensationType - Type of condensation (supporting, opposing, etc.)
   * @returns Promise<Argument[]> Final condensed Argument
   * @private
   */
  private async condenseArgumentArray({
    argumentArray,
    topic,
    condensationType
  }: {
    argumentArray: Array<Argument>;
    topic: string;
    condensationType: CondensationType;
  }): Promise<Array<Argument>> {
    /** Instructions for the current condensation type */
    let instructions = this.languageConfig.instructionsGeneral;
    if (condensationType === CONDENSATION_TYPE.Supporting) {
      instructions = this.languageConfig.reduceInstructionsSupporting;
    } else if (condensationType === CONDENSATION_TYPE.Opposing) {
      instructions = this.languageConfig.reduceInstructionsOpposing;
    }

    /** Formatted Arguments without "1:", "2:", etc. index prefixes */
    const formattedArgs = argumentArray
      .map((arg) => {
        return arg.argument.replace(/^\s*\d+\s*:\s*/, '');
      })
      .join('\n');

    /** Prompt for the current batch */
    let prompt = this.recursivePromptTemplate
      .replace('{instructions}', instructions)
      .replace('{existingArguments}', formattedArgs);

    // Add prompt instructions for opposing condensation, because it's the hardest one for LLMs
    if (condensationType === CONDENSATION_TYPE.Opposing) {
      prompt += this.languageConfig.opposingReminder;
    }

    // Set the topic in the prompt last, because it may have references in different places in the prompt
    prompt = prompt.replace(/{topic}/g, topic);

    /** Response from the LLM */
    const response = await this.llmProvider.generate({
      messages: [new Message({ role: 'user', content: prompt })],
      temperature: 1
    });

    /** Array of parsed Arguments from LLM response */
    const newArgs = this.parser.parseArgumentCondensation({ output: response.content, topic });

    // Logging (for debugging)
    console.log('\nOutput Arguments:\n');
    for (const arg of newArgs) {
      console.log(arg.argument);
    }
    console.log('--------------------------------');

    return newArgs;
  }

  /**
   * Recursively condenses an array of Argument arrays until only one array remains
   * @param argumentArrays - Array of Argument arrays to condense
   * @param topic - The topic these Arguments relate to
   * @returns Promise<Argument[]> Final condensed Arguments
   * @private
   */
  private async reduceArgumentArrays({
    argumentArrays,
    topic,
    condensationType
  }: {
    argumentArrays: Array<Array<Argument>>;
    topic: string;
    condensationType: CondensationType;
  }): Promise<Array<Argument>> {
    if (argumentArrays.length <= 1) {
      return argumentArrays[0];
    }

    // Logging (for debugging)
    console.log('--------------------------------');
    console.log(
      `    Processing ${argumentArrays.length} Argument groups (will continue pair-wise until one array remains, e.g. 4 --> 2 --> 1)`
    );
    console.log('--------------------------------');

    /** Array to populate with Argument arrays */
    const reducedArrays: Array<Array<Argument>> = [];

    // Process pairs of Argument arrays to create a single, more concise array
    for (let i = 0; i < argumentArrays.length; i += 2) {
      const array1 = argumentArrays[i];
      const array2 = i + 1 < argumentArrays.length ? argumentArrays[i + 1] : [];

      // If there is an odd number of Argumentarrays, leave the last one as is
      if (array2.length === 0) {
        reducedArrays.push(array1);
        continue;
      }

      /** Two Argument arrays coalesced into one */
      const combinedArgs = [...array1, ...array2];

      /** Condensed Argument array from the two coalesced arrays */
      const condensedArgs = await this.condenseArgumentArray({
        argumentArray: combinedArgs,
        topic,
        condensationType
      });

      // Add the condensed array to the arrays of arrays
      reducedArrays.push(condensedArgs);
    }

    // Recursively process the next level: k arrays--> k/2 --> k/4 --> ... --> 1 array
    return this.reduceArgumentArrays({
      argumentArrays: reducedArrays,
      topic,
      condensationType
    });
  }
}
