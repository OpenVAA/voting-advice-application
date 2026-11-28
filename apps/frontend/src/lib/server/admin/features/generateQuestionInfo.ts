import { generateQuestionInfo as generateQuestionInfoAPI } from '@openvaa/question-info';
import { loadElectionData } from '$lib/admin/utils/loadElectionData';
import { getLLMProvider } from '../../llm/llmProvider';
import { startAdminJob } from '../jobs/jobRecord';
import type { Id, Serializable } from '@openvaa/core';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInfoOperation, QuestionInfoResult } from '@openvaa/question-info';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { TemporarySetQuestionData } from '$lib/api/base/adminWriter.type';

/**
 * Generate question info (terms and/or info sections) for selected or all opinion questions.
 * - Loads elections and questions
 * - Calls generateQuestionInfo API
 * - Saves results to question customData
 *
 * @param args.electionId - Election id to scope questions
 * @param args.questionIds - If empty, runs all opinion questions applicable to the election
 * @param args.source - The initiating admin's request context, read ONCE for its verified session and then left behind; the job's own client is built from that session's credential and carries every read and every write the run makes, so the whole run reads and writes as one identity and none of it depends on the request outliving it
 * @param args.locale - Output language
 * @param args.jobId - Job ID for tracking progress
 * @param args.operations - Which operations to perform (Terms, InfoSections, or both)
 * @param args.sectionTopics - Optional custom section topics
 * @param args.customInstructions - Optional custom instructions for LLM
 * @param args.questionContext - Optional context about the election/topic
 * @returns DataApiActionResult indicating success/failure
 */
export async function generateQuestionInfo({
  electionId,
  questionIds,
  source,
  locale,
  jobId,
  operations,
  sectionTopics,
  customInstructions,
  questionContext
}: {
  electionId: Id;
  questionIds: Array<Id>;
  source: { fetch: Fetch; locals: App.Locals };
  locale: string;
  jobId: string;
  operations: Array<QuestionInfoOperation>;
  sectionTopics?: Array<string>;
  customInstructions?: string;
  questionContext?: string;
}): Promise<DataApiActionResult> {
  const inputParams = {
    electionId,
    questionIds,
    operations: operations.map(String),
    locale,
    ...(sectionTopics && { sectionTopics }),
    ...(customInstructions && { customInstructions }),
    ...(questionContext && { questionContext })
  };

  let results: Array<QuestionInfoResult> | undefined;

  // The job's credential, controller, writer and recorder are fixed here for the whole run; see `startAdminJob`.
  const { jobSource, controller, adminWriter, jobRecord } = await startAdminJob({
    jobId,
    source,
    electionId,
    input: inputParams,
    getOutput: () => (results ? (results as unknown as Array<Serializable>) : null),
    logPrefix: 'generateQuestionInfo',
    failureMessage: 'Question info generation failed'
  });

  try {
    // 1) Load data
    controller.info('Loading election and question data for question info generation...');
    // THE READS MOVE ONTO THE JOB'S CLIENT TOO, and that is a decision rather than a spillover. The parameter documentation above asserts that the whole run reads and writes as one identity; leaving these reads on the request's client would have made that sentence false the moment the writer moved, and would have left half the run exposed to exactly the expiry this change removes from the other half.
    const dataRoot = await loadElectionData({
      electionId,
      locale,
      source: jobSource
    });
    controller.info('Data loaded successfully!');

    // 2) Resolve questions: selected or all applicable opinion questions for the election
    const election = dataRoot.getElection(electionId);
    const selectedQuestions = questionIds.length
      ? questionIds.map((id) => dataRoot.getQuestion(id))
      : dataRoot.findQuestions({ type: 'opinion', elections: election });

    controller.info(
      `Resolved ${selectedQuestions.length} question(s): ${selectedQuestions.map((q) => q.name).join(', ')}`
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
    results = await generateQuestionInfoAPI({
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

      // Save to database
      controller.info(`Saving question info for question "${question.name}"`);

      try {
        const saveResult = await adminWriter.updateQuestion({
          id: question.id,
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

    // Save job record
    await jobRecord.recordCompletion({ questionsProcessed: results.length });

    return { type: 'success' };
  } catch (error) {
    // Marks the job aborted and records it, or fails the pipeline and records that; the branch itself is shared with `condenseArguments`.
    await jobRecord.recordFailure(error);
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
