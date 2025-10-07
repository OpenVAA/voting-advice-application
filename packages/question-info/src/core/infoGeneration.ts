import { DEFAULT_SECTION_TOPICS } from '../consts';
import {
  chooseQInfoSchema,
  determinePromptKey,
  loadAllExamples,
  loadInstructions,
  loadPrompt,
  transformResponse
} from '../utils';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { z } from 'zod';
import type { QuestionInfoOptions, QuestionInfoResult, ResponseWithInfo } from '../types';

/**
 * Generate question info for any number of questions with parallelization
 * @param questions - The questions to generate info for
 * @param options - The options for the info generation
 * @returns The generated info for the questions
 * @throws Error if the generation fails
 * @throws Error if the operations are invalid
 *
 * @example
 * ```ts
 * const questions = [{ id: '1', name: 'Question 1', content: 'What is the capital of France?' }];
 * const options: QuestionInfoOptions = { operations: [QUESTION_INFO_OPERATION.InfoSections, QUESTION_INFO_OPERATION.Terms], language: 'en' };
 * const results = await generateInfo({ questions, options });
 * console.log(results); // Array of QuestionInfoResult
 *
 * ```
 */
export async function generateInfo({
  questions,
  options
}: {
  questions: Array<AnyQuestionVariant>;
  options: QuestionInfoOptions;
}): Promise<Array<QuestionInfoResult>> {
  try {
    // Generate a unique run ID for this generation batch
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = new Date();

    // Determine which prompt to use based on which operations we want to run
    const promptKey = determinePromptKey({ operations: options.operations });

    // Load prompt template, instructions and examples
    const promptTemplate = await loadPrompt({ promptFileName: promptKey, language: options.language });
    const instructions = await loadInstructions({ language: options.language });
    const examples = (await loadAllExamples({ language: options.language })).slice(0, 3); // over 3 examples is almost never useful

    // Format examples with their questions
    const formattedExamples = examples
      .map((example) => {
        let exampleOutput = '';

        if (promptKey === 'generateTerms') {
          exampleOutput = example.termExample;
        } else if (promptKey === 'generateInfoSections') {
          exampleOutput = example.infoSectionExample;
        } else {
          // generateBoth
          exampleOutput = `{${example.termExample}, ${example.infoSectionExample}}`;
        }

        return `### Question: ${example.question}\nOutput: ${exampleOutput}`;
      })
      .join('\n\n');

    // Create Zod schema for response validation
    const responseSchema = chooseQInfoSchema({
      operations: options.operations
    }) as z.ZodSchema<ResponseWithInfo>;

    // Prepare prompt inputs for parallel generation
    const requests = questions.map((question) => {
      // Build variables object based on the operation type. Start with tasks' shared variables
      const variables: Record<string, unknown> = {
        question: question.name,
        generalInstructions: instructions.generalInstructions,
        neutralityRequirements: instructions.neutralityRequirements,
        questionContext: options.questionContext || '',
        customInstructions: options.customInstructions || '',
        examples: formattedExamples
      };

      // Add operation-specific variables
      if (promptKey === 'generateTerms' || promptKey === 'generateBoth') {
        variables.termDefInstructions = instructions.termDefInstructions;
      }
      if (promptKey === 'generateInfoSections' || promptKey === 'generateBoth') {
        variables.infoSectionInstructions = instructions.infoSectionsInstructions;
        variables.sectionTopics = options.sectionTopics || DEFAULT_SECTION_TOPICS;
      }

      return {
        modelConfig: { primary: options.llmModel },
        schema: responseSchema,
        messages: [
          {
            role: 'system' as const,
            content: promptTemplate.prompt
          }
        ],
        temperature: 0,
        validationRetries: 3
      };
    });

    // Generate responses in parallel with validation
    const responses = await options.llmProvider.generateObjectParallel<ResponseWithInfo>({
      requests,
      maxConcurrent: 1, // TODO: tweak so that we use an appropriate amount of max capacity
      controller: options.controller
    });

    const endTime = new Date();

    // Transform responses to our result format
    return questions.map((question, index) => {
      const response = responses[index];
      const success = response?.object != null;
      return transformResponse({
        llmResponse: response,
        question,
        success,
        runId,
        language: options.language,
        startTime,
        endTime
      });
    });
  } catch (error) {
    throw new Error(`Error generating question info: ${error}`);
  }
}
