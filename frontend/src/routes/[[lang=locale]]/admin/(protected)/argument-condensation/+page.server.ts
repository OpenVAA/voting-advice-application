import { handleQuestion } from '@openvaa/argument-condensation';
import { type HasAnswers, type Id } from '@openvaa/core';
import { DataRoot, QUESTION_TYPE } from '@openvaa/data';
import { type Actions, fail } from '@sveltejs/kit';
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { isValidResult } from '$lib/api/utils/isValidResult';
import { PipelineLogger } from '$lib/jobs/pipelineLogger';
import { getLLMProvider } from '$lib/server/llm/llmProvider';
import type { AnyQuestionVariant, SingleChoiceCategoricalQuestion } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { DPDataType } from '$lib/api/base/dataTypes';

/**
 * Handle form submit from the UI to start condensation.
 */
export const actions = {
  default: async ({ fetch, request, params: { lang } }) => {
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
        jobId
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
 * @param args.fetch - SvelteKit fetch function for server-side requests
 * @param args.locale - Language for prompts ('en'|'fi' currently supported)
 * @param args.jobId - Job ID for tracking progress
 * @returns DataApiActionResult indicating success/failure
 */
async function condenseArguments({
  electionId,
  questionIds,
  fetch,
  locale,
  jobId
}: {
  electionId: Id;
  questionIds: Array<Id>;
  fetch: {
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    (input: string | URL | globalThis.Request, init?: RequestInit): Promise<Response>;
  };
  locale: string;
  jobId: string;
}): Promise<DataApiActionResult> {
  // Create logger immediately - it will be initialized with pipeline later
  const logger = new PipelineLogger(jobId, fetch);

  try {
    await logger.info('Starting argument condensation process...');

    // 1) Load data
    await logger.info('Loading election and question data...');
    const dataRoot = new DataRoot();
    const dataProvider = await dataProviderPromise;
    dataProvider.init({ fetch });

    const [electionData, constituencyData, questionData, nominationData] = (await Promise.all([
      dataProvider.getElectionData({ locale }).catch((e) => e),
      dataProvider.getConstituencyData({ locale }).catch((e) => e),
      dataProvider
        .getQuestionData({
          electionId,
          locale
        })
        .catch((e) => e),
      dataProvider
        .getNominationData({
          electionId,
          locale
        })
        .catch((e) => e)
    ])) as [DPDataType['elections'], DPDataType['constituencies'], DPDataType['questions'], DPDataType['nominations']];

    if (!isValidResult(electionData)) throw new Error('Error loading election data');
    if (!isValidResult(constituencyData, { allowEmpty: true })) throw new Error('Error loading constituency data');
    if (!isValidResult(questionData, { allowEmpty: true })) throw new Error('Error loading question data');
    if (!isValidResult(nominationData, { allowEmpty: true })) throw new Error('Error loading nomination data');

    await logger.info('Data loaded successfully');

    dataRoot.update(() => {
      dataRoot.provideElectionData(electionData);
      dataRoot.provideConstituencyData(constituencyData);
      dataRoot.provideQuestionData(questionData);
      dataRoot.provideEntityData(nominationData.entities);
      dataRoot.provideNominationData(nominationData.nominations);
    });

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

    await logger.info(
      `Processing ${supportedQuestions.length} supported questions with ${pipeline.length} sub-operations`
    );

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

    await logger.info(`Found ${hasAnswersEntities.length} entities to process`);

    // 4) LLM setup
    await logger.info('Initializing LLM provider...');
    const llm = getLLMProvider();

    // 5) Run condensation sequentially per question
    for (let i = 0; i < supportedQuestions.length; i++) {
      const question = supportedQuestions[i];
      const runId = `admin-${electionId}-${question.id}-${Date.now()}`;

      await logger.info(`Processing question ${i + 1}/${supportedQuestions.length}: ${question.name}`);

      const results = await handleQuestion({
        question,
        entities: hasAnswersEntities as Array<HasAnswers>,
        options: {
          llmProvider: llm,
          llmModel: 'gpt-4o-mini',
          language: locale,
          runId,
          maxCommentsPerGroup: 3,
          createVisualizationData: false, // disable FS writes in server env for now
          logger
        }
      });

      const totalArgs = results.reduce((sum, r) => sum + r.arguments.length, 0);
      await logger.info(`Completed question ${i + 1}: ${totalArgs} arguments generated`);

      logger.info(`Done: ${question.id} → ${totalArgs} arguments across ${results.length} runs`);
    }

    await logger.info('Argument condensation completed successfully!');

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
