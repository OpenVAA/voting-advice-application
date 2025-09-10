import { type Role, setPromptVars } from '@openvaa/llm';
import { DEFAULT_SECTION_TOPICS } from '../consts';
import {
  createDynamicResponseContract,
  createErrorResult,
  determinePromptKey,
  loadAllExamples,
  loadInstructions,
  loadPrompt,
  transformResponse
} from '../utils';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInfoOptions, QuestionInfoResult } from '../types';

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
  const startTime = new Date();

  try {
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

    // Create response validation schema to make sure the LLM's text response is always
    // formatted as we expect it to be
    const responseValContract = createDynamicResponseContract({ operations: options.operations });

    // Prepare inputs for parallel generation
    const inputs = questions.map((question) => {
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
        messages: [
          {
            role: 'user' as Role,
            content: setPromptVars({
              promptText: promptTemplate.prompt,
              variables,
              strict: false,
              controller: options.controller // For warnings
            })
          }
        ],
        temperature: 0, // TODO: we should probably remove these repo-wide. Also changing default temp to 0 is better than current 0.7, because some models don't support temp at all
        model: options.llmModel
      };
    });

    // Generate responses in parallel with validation
    const responses = await options.llmProvider.generateMultipleParallel({
      inputs,
      responseContract: responseValContract,
      parallelBatches: 5 // TODO: tweak so that we use an appropriate amount of max capacity
    });

    const endTime = new Date();

    // Transform responses to our result format
    return questions.map((question, index) => {
      const response = responses[index];
      if (response.parsed) {
        return transformResponse({ llmResponse: response, question, options, startTime, endTime });
      } else {
        return createErrorResult({ question, raw: response.raw, options, startTime, endTime });
      }
    });
  } catch (error) {
    throw new Error(`Error generating question info: ${error}`);
  }
}
