import { handleQuestion } from '@openvaa/argument-condensation';
import { ENTITY_TYPE, QUESTION_TYPE } from '@openvaa/data';
import { loadElectionData } from '$lib/admin/utils/loadElectionData';
import { getLLMProvider } from '../../llm/llmProvider';
import { startAdminJob } from '../jobs/jobRecord';
import type { LocalizedQuestionArguments } from '@openvaa/app-shared';
import type { CondensationRunResult } from '@openvaa/argument-condensation';
import type { Id, Serializable } from '@openvaa/core';
import type { AnyQuestionVariant, SingleChoiceCategoricalQuestion } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * Run argument condensation for selected or all opinion questions.
 * - Loads elections, constituencies, questions, nominations and entities
 * - Builds SupportedQuestion subset (boolean, ordinal, categorical)
 * - Collects nominated entities for the election
 * - Calls handleQuestion for each question sequentially
 * @param args.electionId - Election id to scope questions and nominations
 * @param args.questionIds - If empty, runs all opinion questions applicable to the election
 * @param args.source - The initiating admin's request context, read ONCE for its verified session and then left behind; the job's own client is built from that session's credential and carries every read and every write the run makes, so the whole run reads and writes as one identity and none of it depends on the request outliving it
 * @param args.locale - Language for prompts ('en'|'fi' currently supported)
 * @param args.jobId - Job ID for tracking progress
 * @returns DataApiActionResult indicating success/failure
 */
export async function condenseArguments({
  electionId,
  questionIds,
  source,
  locale,
  jobId
}: {
  electionId: Id;
  questionIds: Array<Id>;
  source: { fetch: Fetch; locals: App.Locals };
  locale: string;
  jobId: string;
}): Promise<DataApiActionResult> {
  const inputParams = {
    electionId,
    questionIds,
    locale
  };

  // Accumulate all condensation results across all questions
  const allCondensationResults: Array<{
    questionId: string;
    questionName: string;
    results: Array<CondensationRunResult>;
  }> = [];

  // The job's credential, controller, writer and recorder are fixed here for the whole run; see `startAdminJob`.
  const { jobSource, controller, adminWriter, jobRecord } = await startAdminJob({
    jobId,
    source,
    electionId,
    input: inputParams,
    getOutput: () =>
      allCondensationResults.length > 0 ? (allCondensationResults as unknown as Array<Serializable>) : null,
    logPrefix: 'condenseArguments',
    failureMessage: 'Argument condensation failed'
  });

  try {
    // 1) Load data
    controller.info('Loading election and question data for argument condensation...');
    // THE READS MOVE ONTO THE JOB'S CLIENT TOO, and that is a decision rather than a spillover. The parameter documentation above asserts that the whole run reads and writes as one identity; leaving these four reads on the request's client would have made that sentence false the moment the writer moved, and would have left half the run exposed to exactly the expiry this change removes from the other half.
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
    const supportedQuestions = selectedQuestions.filter(
      (q) =>
        q.type === QUESTION_TYPE.Boolean ||
        q.type === QUESTION_TYPE.SingleChoiceOrdinal ||
        q.type === QUESTION_TYPE.SingleChoiceCategorical
    );
    controller.info(
      `${supportedQuestions.length} of those are of a supported type: ${supportedQuestions.map((q) => q.name).join(', ')}`
    );

    if (!supportedQuestions.length) {
      // Initialize with minimal pipeline for this case
      controller.initializePipeline([{ id: 'no-questions', weight: 1 }]);
      controller.warning(`No supported questions to process for election ${electionId}`);
      controller.complete();
      return { type: 'success' };
    }

    // Create pipeline dynamically based on the questions we'll actually process
    const pipeline = createQuestionPipeline(supportedQuestions);
    controller.initializePipeline(pipeline);

    // 3) Collect nominated entities (HasAnswers) for the election
    const entities = Object.values(ENTITY_TYPE).flatMap((t) =>
      dataRoot.findNominations({
        entityType: t,
        electionId: election.id,
        electionRound: election.round
      })
    );

    if (entities.length === 0) {
      controller.warning(`No nominated entities found to process for election ${electionId}`);
      controller.complete();
      return { type: 'success' };
    }

    // 4) LLM setup
    const llm = getLLMProvider();

    // 5) Run condensation sequentially per question
    for (let i = 0; i < supportedQuestions.length; i++) {
      const question = supportedQuestions[i];
      const runId = `admin-${electionId}-${question.id}-${Date.now()}`;
      controller.info(`Processing question "${question.name}" (${i + 1}/${supportedQuestions.length})`);

      const condensationResults = await handleQuestion({
        question,
        entities,
        options: {
          llmProvider: llm, // Model configured in llmProvider (currently gpt-4o-mini)
          language: locale,
          runId,
          maxCommentsPerGroup: 1000,
          createVisualizationData: false, // disable FS writes in server env for now
          controller
        }
      });

      // Store results for this question
      allCondensationResults.push({
        questionId: question.id,
        questionName: question.name,
        results: condensationResults
      });

      if (!condensationResults.length || condensationResults.every((r) => !r.data.arguments.length)) {
        controller.warning(`No arguments found for question: ${question.name}`);
        continue;
      }

      const condensedArguments: Array<LocalizedQuestionArguments> = condensationResults.map(
        ({ condensationType, data }) => ({
          type: condensationType,
          arguments: data.arguments.map(({ id, text }) => ({
            id,
            content: { [locale]: text }
          }))
        })
      );

      // Save the condensation results to the question's customData
      controller.info(`Saving condensation results for question "${question.name}"`);

      try {
        const result = await adminWriter.updateQuestion({
          id: question.id,
          data: {
            customData: {
              arguments: condensedArguments
            }
          }
        });

        if (result.type === 'success') {
          controller.info(`Successfully saved condensation results for question "${question.name}"`);
        } else {
          controller.warning(
            `Failed to save condensation results for question "${question.name}": ${JSON.stringify(result)}`
          );
        }
      } catch (error) {
        const message = (error as Error).message ?? JSON.stringify(error);
        controller.warning(`Error saving condensation results for question "${question.name}": ${message}`);
      }
    }

    controller.complete();

    // Save job record
    await jobRecord.recordCompletion({ questionsProcessed: allCondensationResults.length });

    return { type: 'success' };
  } catch (error) {
    // Marks the job aborted and records it, or fails the pipeline and records that; the branch itself is shared with `generateQuestionInfo`.
    await jobRecord.recordFailure(error);
    throw error;
  }
}

/**
 * Create a pipeline of sub-operations based on the questions to be processed.
 * Each question type creates different sub-operations:
 * - Boolean: pros, cons
 * - Ordinal: pros, cons
 * - Categorical: pros for each category
 */
function createQuestionPipeline(questions: Array<AnyQuestionVariant>): Array<{ id: string; weight: number }> {
  const pipeline: Array<{ id: string; weight: number }> = [];

  // Create equal weight operations for each question, even though the number of llmCalls and their average latency will vary
  for (const question of questions) {
    switch (question.type) {
      case QUESTION_TYPE.Boolean:
        pipeline.push(
          { id: `question-${question.id}-boolean-pros`, weight: 1 },
          { id: `question-${question.id}-boolean-cons`, weight: 1 }
        );
        break;

      case QUESTION_TYPE.SingleChoiceOrdinal:
        pipeline.push(
          { id: `question-${question.id}-ordinal-pros`, weight: 1 },
          { id: `question-${question.id}-ordinal-cons`, weight: 1 }
        );
        break;

      case QUESTION_TYPE.SingleChoiceCategorical: {
        // For categorical questions, create a pros operation for each choice/category
        const categoricalQuestion = question as SingleChoiceCategoricalQuestion;
        for (const choice of categoricalQuestion.choices) {
          pipeline.push({
            id: `question-${question.id}-categorical-${choice.id}-pros`,
            weight: 1
          });
        }
        break;
      }

      default:
        // Unknown question type, create a generic operation
        pipeline.push({ id: `question-${question.id}-generic`, weight: 1 });
    }
  }

  return pipeline;
}
