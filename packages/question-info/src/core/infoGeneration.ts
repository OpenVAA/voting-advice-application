import { loadPrompt } from '@openvaa/llm';
import { DEFAULT_SECTION_TOPICS } from '../consts';
import {
  EXAMPLES,
  GENERAL_INSTRUCTIONS,
  INFO_SECTIONS_INSTRUCTIONS,
  NEUTRALITY_REQUIREMENTS,
  TERM_DEF_INSTRUCTIONS
} from '../prompts/en/consts';
import { chooseQInfoSchema, determinePromptKey, transformResponse } from '../utils';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { z } from 'zod';
import type { QuestionInfoOptions, QuestionInfoResult, ResponseWithInfo } from './infoGeneration.type';

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
  // Boundary guard, deliberately OUTSIDE the `try` below: that catch re-wraps everything it sees as `Error generating question info: ...`, and a guard whose message arrives double-prefixed does not say what it means.
  //
  // Why this guard exists at all, given that `questionType` is declared a REQUIRED prompt param: the required-param check at promptRegistry.ts:352 is `!(param in variables)` — key-PRESENCE, not value-definedness — and setPromptVars.ts:60 repeats the same `in` test. So `questionType: undefined` satisfies both, and setPromptVars.ts:54 interpolates `String(undefined)`, shipping the literal token `undefined` to the LLM under its own heading. Measured, not assumed. No production caller can reach that today (DataRoot selects a question's constructor BY its type discriminant, so an instance without a valid type cannot be built), but the hole is real at the framework level and this is the package boundary where it belongs closed.
  for (const question of questions) {
    // Read through an `unknown` local: the static type declares `type` non-nullable, so testing `question.type` directly narrows `question` to `never` and the runtime hazard becomes inexpressible. The hazard is real regardless of what the type says.
    const questionType: unknown = question.type;
    if (!questionType)
      throw new Error(
        `[question-info] Question '${question.id}' ("${question.name}") has no \`type\`. Question type is required to compose the prompt.`
      );
  }

  try {
    // Generate a unique run ID for this generation batch
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = new Date();

    // Determine which prompt to use based on which operations we want to run
    const promptKey = determinePromptKey({ operations: options.operations });

    // Format examples with their questions (using up to 3 examples)
    const examplesSlice = EXAMPLES.slice(0, 3);
    const formattedExamples = examplesSlice
      .map((example) => {
        let exampleOutput = '';

        if (promptKey === 'generateTerms') {
          exampleOutput = JSON.stringify({ terms: example.terms }, null, 2);
        } else if (promptKey === 'generateInfoSections') {
          exampleOutput = JSON.stringify({ infoSections: example.infoSections }, null, 2);
        } else {
          // generateBoth
          exampleOutput = JSON.stringify({ infoSections: example.infoSections, terms: example.terms }, null, 2);
        }

        return `### Question: ${example.question}\nOutput: ${exampleOutput}`;
      })
      .join('\n\n');

    // Create Zod schema for response validation
    const responseSchema = chooseQInfoSchema({
      operations: options.operations
    }) as z.ZodSchema<ResponseWithInfo>;

    // Prepare prompt inputs for parallel generation
    const requests = await Promise.all(
      questions.map(async (question) => {
        // Build variables object based on the operation type. Start with tasks' shared variables
        const variables: Record<string, unknown> = {
          question: question.name,
          // The question's structural type and its answering choices. Without these two, two questions sharing a name and differing only in type compose byte-identical prompts.
          // The `'choices' in question` guard is load-bearing: `choices` exists only on ChoiceQuestion subclasses, so Boolean and choice-less inputs must not dereference it.
          questionType: question.type,
          choices: 'choices' in question ? question.choices.map((choice) => choice.label).join(', ') : '',
          generalInstructions: GENERAL_INSTRUCTIONS,
          neutralityRequirements: NEUTRALITY_REQUIREMENTS,
          questionContext: options.questionContext || '',
          customInstructions: options.customInstructions || '',
          examples: formattedExamples
        };

        // Add operation-specific variables
        if (promptKey === 'generateTerms' || promptKey === 'generateBoth') {
          variables.termDefInstructions = TERM_DEF_INSTRUCTIONS;
        }
        if (promptKey === 'generateInfoSections' || promptKey === 'generateBoth') {
          variables.infoSectionInstructions = INFO_SECTIONS_INSTRUCTIONS;
          variables.sectionTopics = options.sectionTopics || DEFAULT_SECTION_TOPICS;
        }

        // Load and compose the prompt using centralized registry
        const { promptText } = await loadPrompt({
          promptId: promptKey,
          language: options.language,
          variables,
          throwIfVarsMissing: true,
          fallbackLocalization: true
        });

        return {
          schema: responseSchema,
          messages: [
            {
              role: 'system' as const,
              content: promptText
            }
          ],
          temperature: 0,
          validationRetries: 3
        };
      })
    );

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
