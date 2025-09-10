import { type Role, setPromptVars } from '@openvaa/llm';
import {
  createDynamicResponseContract,
  createErrorResult,
  determinePromptKey,
  loadPrompt,
  transformResponse
} from '../utils';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInfoOptions, QuestionInfoResult, ResponseWithInfo } from '../types';
import type { InfoSectionPrompt, QInfoPromptComponents, TermDefPrompt } from '../types';

// Type guard
function hasDefaultSectionTopics(
  template: QInfoPromptComponents
): template is InfoSectionsPromptTemplate | BothOperationsPromptTemplate {
  return 'defaultSectionTopics' in template;
}

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
    // Determine which prompt to use based on operations
    const promptKey = determinePromptKey(options.operations);

    // Load prompt template and extract variables
    const promptTemplate = await loadPrompt({ promptFileName: promptKey, language: options.language });
    const systemPrompt = promptTemplate.systemPrompt;
    const userPrompt = promptTemplate.userPrompt;

    // Get admin-provided context for the question
    const context = options.questionContext; // There is no default context...

    // Create dynamic schema based on operations
    const responseValContract = createDynamicResponseContract(options.operations);

    // Prepare inputs for parallel generation
    const inputs = questions.map((question) => ({
      messages: [
        // Prepare system prompt with variables
        {
          role: 'system' as Role,
          content: setPromptVars({
            promptText: systemPrompt,
            variables: {
              context,
              customInstructions: options.customInstructions
            },
            strict: false, // Want to fail on missing variables?
            controller: options.controller // Sends warning to admin UI, if there is a mismatch between the prompt and the variables
          })
        },
        // Prepare user prompt with variables
        {
          role: 'user' as Role,
          content: setPromptVars({
            promptText: userPrompt,
            variables: {
              question: question.name
            },
            strict: false,
            controller: options.controller
          })
        }
      ],
      temperature: 0,
      model: options.llmModel
    }));

    // Generate responses in parallel with validation
    const responses = await options.llmProvider.generateMultipleParallel({
      inputs,
      responseContract: {
        validate: (obj: unknown): obj is ResponseWithInfo => {
          try {
            responseValContract.validate(obj);
            return true;
          } catch {
            return false;
          }
        }
      },
      parallelBatches: 5 // TODO: tweak so that we use an appropriate amount of max capacity
    });

    const endTime = new Date();

    // Transform responses to our result format
    return questions.map((question, index) => {
      const response = responses[index];
      if (response.parsed) {
        return transformResponse(response, question, options, startTime, endTime);
      } else {
        return createErrorResult(question, response.raw, options, startTime, endTime);
      }
    });
  } catch (error) {
    throw new Error(`Error generating question info: ${error}`);
  }
}
