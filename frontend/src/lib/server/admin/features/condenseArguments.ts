import { handleQuestion } from '@openvaa/argument-condensation';
import { AbortError, type Id } from '@openvaa/core';
import { type AnyQuestionVariant, ENTITY_TYPE, QUESTION_TYPE } from '@openvaa/data';
import { loadElectionData } from '$lib/admin/utils/loadElectionData';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { getLLMProvider } from '../../llm/llmProvider';
import { markAborted } from '../jobs/jobStore';
import { PipelineController } from '../jobs/pipelineController';
import type { ArgumentType, LocalizedQuestionArguments } from '@openvaa/app-shared';
import type { SingleChoiceCategoricalQuestion } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * Run argument condensation for selected or all opinion questions.
 * - Loads elections, constituencies, questions, nominations and entities
 * - Builds SupportedQuestion subset (boolean, ordinal, categorical)
 * - Collects nominated entities for the election
 * - Calls handleQuestion for each question sequentially
 * @param args.electionId - Election id to scope questions and nominations
 * @param args.questionIds - If empty, runs all opinion questions applicable to the election
 * @param args.fetch - SvelteKit fetch function for data loading (not used for job updates)
 * @param args.locale - Language for prompts ('en'|'fi' currently supported)
 * @param args.jobId - Job ID for tracking progress
 * @param args.authToken - Authentication token for API calls
 * @returns DataApiActionResult indicating success/failure
 */
export async function condenseArguments({
  electionId,
  questionIds,
  fetch,
  locale,
  jobId,
  authToken
}: {
  electionId: Id;
  questionIds: Array<Id>;
  fetch: Fetch;
  locale: string;
  jobId: string;
  authToken: string; // Add this parameter
}): Promise<DataApiActionResult> {
  // Create controller immediately - it will be initialized with pipeline later
  const controller = new PipelineController(jobId);

  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  try {
    // 1) Load data
    controller.info('Loading election and question data for argument condensation...');
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
      '[condense] selectedQuestions',
      selectedQuestions.map((q) => q.name)
    );
    const supportedQuestions = selectedQuestions.filter(
      (q) =>
        q.type === QUESTION_TYPE.Boolean ||
        q.type === QUESTION_TYPE.SingleChoiceOrdinal ||
        q.type === QUESTION_TYPE.SingleChoiceCategorical
    );
    console.info(
      '[condense] supportedQuestions',
      supportedQuestions.map((q) => q.name)
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

    console.error({ election });
    console.error(dataRoot.candidateNominations.map((n) => n.entity.id));

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
          llmProvider: llm,
          llmModel: 'gpt-4o-mini', // TODO: to make configurable - preferably use stronger model for actual generation
          language: locale,
          runId,
          maxCommentsPerGroup: 1000,
          createVisualizationData: false, // disable FS writes in server env for now
          controller
        }
      });

      if (!condensationResults.length || condensationResults.every((r) => !r.arguments.length)) {
        controller.info(`No condensed arguments found for question: ${question.name}`);
        controller.info('Adding a mock result for testing');

        // ------------------------------------------------------------
        // MOCK SAVING
        // ------------------------------------------------------------
        const mockResults = [
          {
            type: 'likertPros' as ArgumentType,
            arguments: [
              {
                id: '1',
                content: {
                  [locale]: 'This is a test argument'
                }
              }
            ]
          }
        ];
        await dataWriter.updateQuestion({
          authToken,
          id: question.id,
          data: {
            customData: {
              arguments: mockResults
            }
          }
        });
        // ------------------------------------------------------------
        // MOCK SAVING END
        // ------------------------------------------------------------

        continue;
      }

      const condensedArguments: Array<LocalizedQuestionArguments> = condensationResults.map(
        ({ condensationType, arguments: args }) => ({
          type: condensationType,
          arguments: args.map(({ id, text }) => ({
            id,
            content: { [locale]: text }
          }))
        })
      );

      // Save the condensation results to the question's customData
      controller.info(`Saving condensation results for question "${question.name}"`);

      try {
        const result = await dataWriter.updateQuestion({
          id: question.id,
          authToken,
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

    return { type: 'success' };
  } catch (error) {
    // Job was aborted if the error is an AbortError. Avoid instanceof, check name instead
    if (error && typeof error === 'object' && 'name' in error && error.name === AbortError.name) {
      markAborted(jobId);
    } else {
      // else it's a real error so we fail the job
      const message = error && typeof error === 'object' && 'message' in error ? error.message : JSON.stringify(error);
      controller.fail(`Argument condensation failed: ${message}`);
    }
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
