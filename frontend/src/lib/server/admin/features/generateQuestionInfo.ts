import { AbortError, type Id } from '@openvaa/core';
import { generateQuestionInfo as generateQuestionInfoAPI } from '@openvaa/question-info';
import { type QuestionInfoOperation } from '@openvaa/question-info';
import { loadElectionData } from '$lib/admin/utils/loadElectionData';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { getLLMProvider } from '../../llm/llmProvider';
import { markAborted } from '../jobs/jobStore';
import { PipelineController } from '../jobs/pipelineController';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { TemporarySetQuestionData } from '$lib/api/base/dataWriter.type';

/**
 * Generate question info (terms and/or info sections) for selected or all opinion questions.
 * - Loads elections and questions
 * - Calls generateQuestionInfo API
 * - Saves results to question customData
 *
 * @param args.electionId - Election id to scope questions
 * @param args.questionIds - If empty, runs all opinion questions applicable to the election
 * @param args.fetch - SvelteKit fetch function for data loading
 * @param args.locale - Language for prompts and results
 * @param args.jobId - Job ID for tracking progress
 * @param args.authToken - Authentication token for API calls
 * @param args.operations - Which operations to perform (Terms, InfoSections, or both)
 * @param args.sectionTopics - Optional custom section topics
 * @param args.customInstructions - Optional custom instructions for LLM
 * @param args.questionContext - Optional context about the election/topic
 * @returns DataApiActionResult indicating success/failure
 */
export async function generateQuestionInfo({
  electionId,
  questionIds,
  fetch,
  locale,
  jobId,
  authToken,
  operations,
  sectionTopics,
  customInstructions,
  questionContext
}: {
  electionId: Id;
  questionIds: Array<Id>;
  fetch: Fetch;
  locale: string;
  jobId: string;
  authToken: string;
  operations: Array<QuestionInfoOperation>;
  sectionTopics?: Array<string>;
  customInstructions?: string;
  questionContext?: string;
}): Promise<DataApiActionResult> {
  // Create controller immediately - it will be initialized with pipeline later
  const controller = new PipelineController(jobId);

  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  try {
    // 1) Load data
    controller.info('Loading election and question data for question info generation...');
    const dataRoot = await loadElectionData({
      electionId,
      locale,
      fetch
    });
    controller.info('Data loaded successfully!');

    // 2) Resolve questions: selected or all applicable opinion questions for the election
    const election = dataRoot.getElection(electionId);
    const selectedQuestions = questionIds.length
      ? questionIds.map((id) => dataRoot.getQuestion(id))
      : dataRoot.findQuestions({ type: 'opinion', elections: election });

    console.info(
      '[question-info] selectedQuestions',
      selectedQuestions.map((q) => q.name)
    );

    if (!selectedQuestions.length) {
      // Initialize with minimal pipeline for this case
      controller.initializePipeline([{ id: 'no-questions', weight: 1 }]);
      controller.warning(`No questions to process for election ${electionId}`);
      controller.complete();
      return { type: 'success' };
    }

    // Create pipeline dynamically based on the questions we'll process
    const pipeline = createQuestionPipeline(selectedQuestions);
    controller.initializePipeline(pipeline);

    // 3) LLM setup
    const llm = getLLMProvider();

    // 4) Build options object
    const options = {
      runId: jobId,
      operations,
      language: locale,
      llmProvider: llm, // Model configured in llmProvider (currently gpt-4o-mini)
      controller,
      ...(sectionTopics && sectionTopics.length > 0 && { sectionTopics }),
      ...(customInstructions && { customInstructions }),
      ...(questionContext && { questionContext })
    };

    // 5) Process all questions in a single API call
    controller.info(`Processing ${selectedQuestions.length} question(s) in parallel...`);

    // Call generateQuestionInfo API once with all questions
    const results = await generateQuestionInfoAPI({
      questions: selectedQuestions,
      options
    });

    // 6) Process and save results for each question
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      const result = results[i];

      // Check if result is successful and has data
      if (!result.success || !result.data) {
        controller.warning(`No question info generated for question: ${question.name}`);
        controller.updateOperation(`question-${question.id}`, 1.0);
        continue;
      }

      // Transform result to localized format
      const updateData: { customData: { terms?: Array<unknown>; infoSections?: Array<unknown> } } = {
        customData: {}
      };

      if (result.data.terms && result.data.terms.length > 0) {
        updateData.customData.terms = result.data.terms.map((term) => ({
          triggers: { [locale]: term.triggers },
          title: term.title ? { [locale]: term.title } : undefined,
          content: { [locale]: term.content }
        }));
      }

      if (result.data.infoSections && result.data.infoSections.length > 0) {
        updateData.customData.infoSections = result.data.infoSections.map((section) => ({
          title: { [locale]: section.title },
          content: { [locale]: section.content }
        }));
      }

      // Save to Strapi
      controller.info(`Saving question info for question "${question.name}"`);

      try {
        const saveResult = await dataWriter.updateQuestion({
          id: question.id,
          authToken,
          data: updateData as TemporarySetQuestionData
        });

        if (saveResult.type === 'success') {
          controller.info(`Successfully saved question info for question "${question.name}"`);
        } else {
          controller.warning(
            `Failed to save question info for question "${question.name}": ${JSON.stringify(saveResult)}`
          );
        }
      } catch (error) {
        const message = (error as Error).message ?? JSON.stringify(error);
        controller.warning(`Error saving question info for question "${question.name}": ${message}`);
      }

      // Update pipeline progress
      controller.updateOperation(`question-${question.id}`, 1.0);
    }

    controller.complete();
    return { type: 'success' };
  } catch (error) {
    // Job was aborted if the error is an AbortError
    if (error && typeof error === 'object' && 'name' in error && error.name === AbortError.name) {
      markAborted(jobId);
    } else {
      // else it's a real error so we fail the job
      const message = error && typeof error === 'object' && 'message' in error ? error.message : JSON.stringify(error);
      controller.fail(`Question info generation failed: ${message}`);
    }
    throw error;
  }
}

/**
 * Create a simple pipeline with one operation per question.
 * Each question gets equal weight regardless of operations selected.
 *
 * @param questions - Questions to create pipeline for
 * @returns Pipeline array with one entry per question
 */
function createQuestionPipeline(questions: Array<AnyQuestionVariant>): Array<{ id: string; weight: number }> {
  return questions.map((question) => ({
    id: `question-${question.id}`,
    weight: 1
  }));
}
