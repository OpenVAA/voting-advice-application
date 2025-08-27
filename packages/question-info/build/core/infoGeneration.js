import { createDynamicResponseContract, createErrorResult, determinePromptKey, loadPrompt, transformResponse } from '../utils/index.js';
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
 * const results = await generateQuestionInfo(questions, options);
 * console.log(results); // Array of QuestionInfoResult
 *
 * ```
 */
export async function generateInfo({ questions, options }) {
    const startTime = new Date();
    try {
        // Determine which prompt to use based on operations
        const promptKey = determinePromptKey(options.operations);
        const promptTemplate = await loadPrompt(promptKey, options.language);
        const systemPrompt = promptTemplate.systemPrompt;
        const userPrompt = promptTemplate.userPrompt;
        const examples = options.examples || promptTemplate.defaultExamples;
        // Create dynamic schema based on operations
        const responseValContract = createDynamicResponseContract(options.operations);
        // Prepare inputs for parallel generation
        const inputs = questions.map((question) => ({
            // TODO: use setPromptVars from the llm package to set variables in the prompt
            messages: [
                { role: 'system',
                    content: systemPrompt.replace('{{examples}}', String(examples)) }, // String(examples) if options.examples exists (an object)
                {
                    role: 'user',
                    content: userPrompt.replace('{{question}}', question.name) // TODO: add question context?
                }
            ],
            temperature: 0,
            model: options.llmModel
        }));
        // Generate responses in parallel with validation
        const responses = await options.llmProvider.generateMultipleParallel({
            inputs,
            responseContract: {
                validate: (obj) => {
                    try {
                        responseValContract.validate(obj);
                        return true;
                    }
                    catch {
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
                return transformResponse(response.parsed, question, options, startTime, endTime);
            }
            else {
                return createErrorResult(question, options, startTime, endTime);
            }
        });
    }
    catch (error) {
        throw new Error(`Error generating question info: ${error}`);
    }
}
