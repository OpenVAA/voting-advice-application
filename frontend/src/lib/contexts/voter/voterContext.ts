import { type EntityType, QUESTION_CATEGORY_TYPE, QuestionCategory } from '@openvaa/data';
import { DISTANCE_METRIC, MatchingAlgorithm, MISSING_VALUE_METHOD } from '@openvaa/matching';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { derived, get, type Readable } from 'svelte/store';
import { getImpliedConstituencyIds, getImpliedElectionIds } from '$lib/utils/route';
import { answerStore } from './answerStore';
import { countAnswers } from './countAnswers';
import { filterStore } from './filters/filterStore';
import { matchStore } from './matchStore';
import { nominationAndQuestionStore } from './nominationAndQuestionStore';
import { getAppContext } from '../../contexts/app';
import { dataCollectionStore } from '../utils/dataCollectionStore';
import { paramStore } from '../utils/paramStore';
import { questionBlockStore } from '../utils/questionBlockStore';
import { sessionStorageWritable } from '../utils/storageStore';
import type { Id } from '@openvaa/core';
import type { VoterContext } from './voterContext.type';

const CONTEXT_KEY = Symbol();

export function getVoterContext(): VoterContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getVoterContext() called before initVoterContext()');
  return getContext<VoterContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getGlobalContext()` and cannot be called twice.
 * @returns The context object
 */
export function initVoterContext(): VoterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initVoterContext() called for a second time');

  ////////////////////////////////////////////////////////////
  // Inheritance from other Contexts
  ////////////////////////////////////////////////////////////

  const appContext = getAppContext();
  const { dataRoot, appSettings, locale, startEvent, t } = appContext;

  ////////////////////////////////////////////////////////////
  // Elections and Constituencies
  ////////////////////////////////////////////////////////////

  // Stores related to selection pages

  const electionsSelectable = derived(
    [appSettings, dataRoot],
    ([appSettings, dataRoot]) => !appSettings.elections?.disallowSelection && dataRoot.elections?.length !== 1
  );

  const constituenciesSelectable = derived(dataRoot, (dataRoot) =>
    dataRoot.elections?.some((e) => !e.singleConstituency)
  );

  // Param-based collection stores

  /**
   * A paramStore with implied defaults.
   */
  const electionId = derived([paramStore('electionId'), appSettings, dataRoot], ([param, appSettings, dataRoot]) => {
    if (param) return param;
    if (dataRoot.elections.length === 0) return undefined;
    return getImpliedElectionIds({
      appSettings,
      elections: dataRoot.elections
    });
  });

  const selectedElections = dataCollectionStore(electionId, (id) => get(dataRoot).getElection(id));

  /**
   * A paramStore with implied defaults.
   */
  const constituencyId = derived([paramStore('constituencyId'), selectedElections], ([param, elections]) => {
    if (param) return param;
    return getImpliedConstituencyIds({ elections });
  });

  const selectedConstituencies = dataCollectionStore(constituencyId, (id) => get(dataRoot).getConstituency(id));

  ////////////////////////////////////////////////////////////
  // Questions and QuestionCategories
  ////////////////////////////////////////////////////////////

  /**
   * All applicable, non-empty question categories to be used as a base for the other stores.
   */
  const questionCategories: Readable<Array<QuestionCategory>> = derived(
    [dataRoot, selectedElections, selectedConstituencies],
    ([dataRoot, elections, constituencies]) =>
      dataRoot.questionCategories?.filter(
        (c) =>
          c.appliesTo({ elections, constituencies }) &&
          c.getApplicableQuestions({ elections, constituencies }).length > 0
      ) ?? [],
    []
  );

  const infoQuestionCategories = derived(
    questionCategories,
    (categories) => categories.filter((c) => c.type !== QUESTION_CATEGORY_TYPE.Opinion),
    []
  );

  const infoQuestions = derived(
    [infoQuestionCategories, selectedElections, selectedConstituencies],
    ([categories, elections, constituencies]) =>
      categories.flatMap((c) => c.getApplicableQuestions({ elections, constituencies })),
    []
  );

  const opinionQuestionCategories = derived(
    questionCategories,
    (categories) => categories.filter((c) => c.type === QUESTION_CATEGORY_TYPE.Opinion),
    []
  );

  const opinionQuestions = derived(
    [opinionQuestionCategories, selectedElections, selectedConstituencies],
    ([categories, elections, constituencies]) => {
      const questions = categories.flatMap((c) => c.getApplicableQuestions({ elections, constituencies }));
      // Ensure that all questions in the opinion question categories are matchable.
      for (const q of questions) {
        if (!q.isMatchable) error(500, `Opinion question ${q.id} is not matchable.`);
      }
      return questions;
    },
    []
  );

  const selectedQuestionCategoryIds = sessionStorageWritable('voterContext-selectedCategoryIds', new Array<Id>());

  const firstQuestionId = sessionStorageWritable('voterContext-firstQuestionId', null as Id | null);

  const selectedQuestionBlocks = questionBlockStore({
    firstQuestionId,
    opinionQuestionCategories,
    selectedQuestionCategoryIds,
    selectedElections,
    selectedConstituencies
  });

  ////////////////////////////////////////////////////////////
  // Matching, Voter Answers and Filters
  ///////////////////////////////////////////////////////////

  const answers = answerStore({ startEvent });

  const resultsAvailable = derived(
    [appSettings, opinionQuestions, answers, selectedElections],
    ([appSettings, questions, answers, selectedElections]) => {
      // For results to be available, we need at least the specified number of answers for each election
      if (selectedElections.length === 0) return false;
      return selectedElections.every((e) => {
        const applicableQuestions = questions.filter((q) => q.appliesTo({ elections: e }));
        return countAnswers({ answers, questions: applicableQuestions }) >= appSettings.matching.minimumAnswers;
      });
    }
  );

  /** The types of entities we show in results */
  const entityTypes = derived(appSettings, (appSettings) => appSettings.results.sections);

  // Matching and filtering depend on the available nominations and questions, for which we use a utility store
  const nominationsAndQuestions = nominationAndQuestionStore({
    constituencies: selectedConstituencies,
    dataRoot,
    elections: selectedElections,
    entityTypes
  });

  const algorithm = new MatchingAlgorithm({
    distanceMetric: DISTANCE_METRIC.Manhattan,
    missingValueOptions: {
      method: MISSING_VALUE_METHOD.RelativeMaximum
    }
  });

  const minAnswers = derived(appSettings, (appSettings) => appSettings.matching.minimumAnswers);

  /** Get the entityTypes whose cardContents include `submatches` */
  const calcSubmatches = derived(appSettings, (appSettings) => {
    console.info(appSettings);
    return [];
    return Object.entries(appSettings.results.cardContents)
      .filter(([, value]) => value.includes('submatches'))
      .map(([type]) => type as EntityType);
  });

  const matches = matchStore({
    algorithm,
    answers,
    nominationsAndQuestions,
    minAnswers,
    calcSubmatches
  });

  const entityFilters = filterStore({
    nominationsAndQuestions,
    locale,
    t
  });

  ////////////////////////////////////////////////////////////
  // Build context
  ////////////////////////////////////////////////////////////

  return setContext<VoterContext>(CONTEXT_KEY, {
    ...appContext,
    algorithm,
    answers,
    constituenciesSelectable,
    electionsSelectable,
    entityFilters,
    firstQuestionId,
    infoQuestionCategories,
    infoQuestions,
    matches,
    opinionQuestionCategories,
    opinionQuestions,
    resultsAvailable,
    selectedConstituencies,
    selectedElections,
    selectedQuestionBlocks,
    selectedQuestionCategoryIds
  });
}
