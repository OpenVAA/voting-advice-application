import { handleQuestion } from '@openvaa/argument-condensation';
import { DefaultLogger, type HasAnswers, type Id } from '@openvaa/core';
import { DataRoot, QUESTION_TYPE } from '@openvaa/data';
import { type Actions, fail } from '@sveltejs/kit';
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { isValidResult } from '$lib/api/utils/isValidResult';
import { getLLMProvider } from '$lib/server/llm/llmProvider';
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

      console.info('[condense] calling condenseArguments()…');
      const result = await condenseArguments({ electionId, questionIds, fetch, locale: lang as string });
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
 * Run argument condensation for selected or all opinion questions.
 * - Loads elections, constituencies, questions, nominations and entities
 * - Builds SupportedQuestion subset (boolean, ordinal, categorical)
 * - Collects nominated entities for the election
 * - Calls handleQuestion for each question sequentially
 * @param args.electionId - Election id to scope questions and nominations
 * @param args.questionIds - If empty, runs all opinion questions applicable to the election
 * @param args.fetch - SvelteKit fetch
 * @param args.locale - Language for prompts ('en'|'fi' currently supported)
 * @returns DataApiActionResult indicating success/failure
 */
async function condenseArguments({
  electionId,
  questionIds,
  fetch,
  locale
}: {
  electionId: Id;
  questionIds: Array<Id>;
  fetch: Fetch;
  locale: string;
}): Promise<DataApiActionResult> {
  const logger = new DefaultLogger();

  // 1) Load data
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

  dataRoot.update(() => {
    dataRoot.provideElectionData(electionData);
    dataRoot.provideConstituencyData(constituencyData);
    dataRoot.provideQuestionData(questionData);
    dataRoot.provideEntityData(nominationData.entities);
    dataRoot.provideNominationData(nominationData.nominations);
  });

  // 2) Resolve questions: selected or all applicable opinion questions for the election
  const election = dataRoot.getElection(electionId);

  const allOpinionForElection = dataRoot.findQuestions({ type: 'opinion', elections: election })

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
    logger.warning(`No supported questions to process for election ${electionId}`);
    return { type: 'success' };
  }

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
    logger.warning(`No nominated entities found to process for election ${electionId}`);
    return { type: 'success' };
  }

  // 4) LLM setup
  const llm = getLLMProvider();

  // 5) Run condensation sequentially per question (keeps TPM use predictable)
  for (const question of supportedQuestions) {
    const runId = `admin-${electionId}-${question.id}-${Date.now()}`;

    logger.info(`Condensing question ${question.id} "${question.name}" with ${hasAnswersEntities.length} entities`);
    const results = await handleQuestion({
      question,
      entities: hasAnswersEntities as Array<HasAnswers>,
      options: {
        llmProvider: llm,
        llmModel: 'gpt-4o',
        language: locale,
        runId,
        maxCommentsPerGroup: 5,
        createVisualizationData: false, // disable FS writes in server env for now
        logger
      }
    });

    const totalArgs = results.reduce((sum, r) => sum + r.arguments.length, 0);
    logger.info(`Done: ${question.id} → ${totalArgs} arguments across ${results.length} runs`);
  }

  return { type: 'success' };
}

type Fetch = typeof fetch;
