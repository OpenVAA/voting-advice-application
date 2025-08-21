import { handleQuestion } from '@openvaa/argument-condensation';
import { type HasAnswers, type Id } from '@openvaa/core';
import { QUESTION_TYPE } from '@openvaa/data';
import { type Actions, fail } from '@sveltejs/kit';
import { loadElectionData } from '$lib/api/utils/loadElectionData';
import { AUTH_TOKEN_KEY } from '$lib/server/auth';
import { PipelineLogger } from '$lib/server/jobs/pipelineLogger';
import { getLLMProvider } from '$lib/server/llm/llmProvider';
import { constants as pub } from '$lib/utils/constants';
import type { AnyQuestionVariant, SingleChoiceCategoricalQuestion } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * Handle form submit from the UI to start condensation.
 */
export const actions = {
  default: async ({ fetch, request, params: { lang }, cookies }) => {
    try {
      console.info('[condense] action start');
      const formData = await request.formData();
      const electionId = formData.get('electionId')?.toString();
      const questionIds = formData.getAll('questionIds').map((id) => id.toString());
      console.info('[condense] parsed form', { electionId, nQuestionIds: questionIds.length });

      if (!electionId) {
        console.warn('[condense] early exit: missing electionId');
        return fail(400, { type: 'error', error: 'Missing electionId' });
      }

      // Get the authentication token from cookies
      const authToken = cookies.get(AUTH_TOKEN_KEY);

      if (!authToken) {
        return fail(401, { type: 'error', error: 'Authentication required' });
      }

      // Create a job for tracking progress using the SvelteKit fetch function
      const adminEmail = 'admin@example.com'; // TODO: Get from actual admin context

      const jobResponse = await fetch('/api/admin/jobs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'argument-condensation',
          author: adminEmail
        })
      });

      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error('[condense] Job creation failed:', errorText);
        throw new Error('Failed to create job');
      }

      const { jobId } = await jobResponse.json();
      console.info('[condense] created job:', jobId);

      // DEBUG: Check if the job was created and is in active state
      const jobCheckResponse = await fetch(`/api/admin/jobs/${jobId}/progress`);

      if (jobCheckResponse.ok) {
        const jobData = await jobCheckResponse.json();
        console.info('[condense] job initial state:', {
          id: jobData.id,
          status: jobData.status,
          progress: jobData.progress,
          feature: jobData.feature
        });
      } else {
        console.error('[condense] Failed to check job state:', jobCheckResponse.status);
      }

      console.info('[condense] calling condenseArguments()…');
      const result = await condenseArguments({
        electionId,
        questionIds,
        fetch,
        locale: lang as string,
        jobId,
        authToken // Add this parameter
      });
      console.info('[condense] condenseArguments() returned', result);

      return result ? { type: 'success' } : fail(500);
    } catch (err) {
      console.error('[condense] error', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return fail(500, { type: 'error', error: errorMessage });
    }
  }
} satisfies Actions;

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
async function condenseArguments({
  electionId,
  questionIds,
  fetch,
  locale,
  jobId,
  authToken
}: {
  electionId: Id;
  questionIds: Array<Id>;
  fetch: {
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    (input: string | URL | globalThis.Request, init?: RequestInit): Promise<Response>;
  };
  locale: string;
  jobId: string;
  authToken: string; // Add this parameter
}): Promise<DataApiActionResult> {
  // Create logger immediately - it will be initialized with pipeline later
  const logger = new PipelineLogger(jobId);

  try {
    // 1) Load data
    await logger.info('Loading election and question data for argument condensation...');
    const dataRoot = await loadElectionData({
      electionId,
      locale,
      fetch
    });
    await logger.info('Data loaded successfully!');

    // 2) Resolve questions: selected or all applicable opinion questions for the election
    const election = dataRoot.getElection(electionId);

    const allOpinionForElection = dataRoot.findQuestions({ type: 'opinion', elections: election });

    const selectedQuestions = questionIds.length
      ? questionIds.map((id) => dataRoot.getQuestion(id))
      : allOpinionForElection;

    console.info('[condense] selectedQuestions', selectedQuestions);
    const supportedQuestions = selectedQuestions.filter(
      (q) =>
        q.type === QUESTION_TYPE.Boolean ||
        q.type === QUESTION_TYPE.SingleChoiceOrdinal ||
        q.type === QUESTION_TYPE.SingleChoiceCategorical
    );
    console.info('[condense] supportedQuestions', supportedQuestions);

    if (!supportedQuestions.length) {
      // Initialize with minimal pipeline for this case
      logger.initializePipeline([{ id: 'no-questions', weight: 1 }]);
      await logger.warning(`No supported questions to process for election ${electionId}`);
      await logger.complete();
      return { type: 'success' };
    }

    // Create pipeline dynamically based on the questions we'll actually process
    const pipeline = createQuestionPipeline(supportedQuestions);
    logger.initializePipeline(pipeline);

    // 3) Collect nominated entities (HasAnswers) for the election
    function byElection(n: { data: { electionId: Id } }): boolean {
      return `${n.data.electionId}` === `${electionId}`;
    }
    const entities = new Map<string, { answers: unknown }>();
    for (const n of dataRoot.candidateNominations.filter(byElection)) entities.set(n.entity.id, n.entity);
    for (const n of dataRoot.organizationNominations.filter(byElection)) entities.set(n.entity.id, n.entity);
    for (const n of dataRoot.factionNominations.filter(byElection)) entities.set(n.entity.id, n.entity);
    for (const n of dataRoot.allianceNominations.filter(byElection)) entities.set(n.entity.id, n.entity);
    const hasAnswersEntities = Array.from(entities.values());

    if (hasAnswersEntities.length === 0) {
      await logger.warning(`No nominated entities found to process for election ${electionId}`);
      await logger.complete();
      return { type: 'success' };
    }

    // 4) LLM setup
    const llm = getLLMProvider();

    // 5) Run condensation sequentially per question
    for (let i = 0; i < supportedQuestions.length; i++) {
      const question = supportedQuestions[i];
      const runId = `admin-${electionId}-${question.id}-${Date.now()}`;
      await logger.info(`Processing question "${question.name}" (${i + 1}/${supportedQuestions.length})`);

      const condensationResults = await handleQuestion({
        question,
        entities: hasAnswersEntities as Array<HasAnswers>,
        options: {
          llmProvider: llm,
          llmModel: 'gpt-4o-mini',
          language: locale,
          runId,
          maxCommentsPerGroup: 1000,
          createVisualizationData: false, // disable FS writes in server env for now
          logger
        }
      });

      // Save the condensation results to the question's customData
      if (condensationResults && condensationResults.length > 0) {
        await logger.info(`Saving condensation results for question "${question.name}"`);

        try {
          // Debug logging for authentication
          await logger.info(
            `[DEBUG] Auth token details: tokenLength=${authToken?.length || 0}, tokenPrefix=${authToken?.substring(0, 20) + '...'}, backendUrl=${pub.PUBLIC_SERVER_BACKEND_URL}/openvaa-admin-tools/update-question-custom-data`
          );

          // Directly call Strapi Admin Tools plugin to update the question customData
          const updateResponse = await fetch(
            `${pub.PUBLIC_SERVER_BACKEND_URL}/openvaa-admin-tools/update-question-custom-data-public`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
              },
              body: JSON.stringify({
                questionId: question.id,
                locale,
                condensedArgs: condensationResults
              })
            }
          );

          if (updateResponse.ok) {
            await logger.info(`Successfully saved condensation results for question "${question.name}"`);
          } else {
            const errorText = await updateResponse.text();
            await logger.info(
              `[DEBUG] Strapi response details: status=${updateResponse.status}, statusText=${updateResponse.statusText}, body=${errorText}`
            );
            await logger.warning(`Failed to save condensation results for question "${question.name}": ${errorText}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await logger.warning(`Error saving condensation results for question "${question.name}": ${errorMessage}`);
        }
      }
    }

    // TODO: Save the results to the database - DONE! Results are now saved per question above

    await logger.complete();

    return { type: 'success' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log the error
    await logger.error(`Argument condensation failed: ${errorMessage}`);
    await logger.fail(errorMessage);

    throw error;
  }
}
