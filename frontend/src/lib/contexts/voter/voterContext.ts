import { DISTANCE_METRIC, MatchingAlgorithm, MISSING_VALUE_METHOD } from '@openvaa/matching';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { logDebugError } from '$lib/utils/logger';
import { getImpliedConstituencyIds, getImpliedElectionIds } from '$lib/utils/route';
import { answerStore } from './answerStore';
import { countAnswers } from './countAnswers';
import { filterStore } from './filters/filterStore';
import { matchStore } from './matchStore';
import { nominationAndQuestionStore } from './nominationAndQuestionStore';
import { getAppContext } from '../../contexts/app';
import { paramStore } from '../utils/paramStore';
import { parsimoniusDerived } from '../utils/parsimoniusDerived';
import { questionBlockStore } from '../utils/questionBlockStore';
import { extractInfoCategories, extractOpinionCategories, questionCategoryStore } from '../utils/questionCategoryStore';
import { questionStore } from '../utils/questionStore';
import { sessionStorageWritable } from '../utils/storageStore';
import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';
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
  const { appSettings, dataRoot, getRoute, locale, startEvent, t } = appContext;

  ////////////////////////////////////////////////////////////
  // Elections and Constituencies
  ////////////////////////////////////////////////////////////

  // Stores related to selection pages

  const electionsSelectable = parsimoniusDerived(
    [appSettings, dataRoot],
    ([appSettings, dataRoot]) => !appSettings.elections?.disallowSelection && dataRoot.elections?.length !== 1
  );

  const constituenciesSelectable = parsimoniusDerived(dataRoot, (dataRoot) =>
    dataRoot.elections?.some((e) => !e.singleConstituency)
  );

  // Param-based collection stores

  const electionId = paramStore('electionId');

  const constituencyId = paramStore('constituencyId');

  const selectedElections = parsimoniusDerived(
    [dataRoot, appSettings, electionId, constituencyId],
    ([dataRoot, appSettings, electionId, constituencyId]) => {
      if (!dataRoot.elections.length) return [];
      const ids = electionId?.length
        ? electionId
        : getImpliedElectionIds({
            appSettings,
            dataRoot,
            selectedConstituencyIds: constituencyId
          });
      if (!ids?.length) return [];
      try {
        return ids.map((id) => dataRoot.getElection(id));
      } catch (e) {
        logDebugError(`[selectedElections] Error fetching election: ${e}`);
        goto(get(getRoute)({ route: 'Elections', electionId: undefined, constituencyId: undefined }));
        return [];
      }
    }
  );

  const selectedConstituencies = parsimoniusDerived(
    [dataRoot, constituencyId, electionId],
    ([dataRoot, constituencyId, electionId]) => {
      if (!dataRoot.constituencies.length) return [];
      const ids = constituencyId?.length
        ? constituencyId
        : getImpliedConstituencyIds({
            dataRoot,
            selectedElectionIds: electionId
          });
      if (!ids?.length) return [];
      try {
        return ids.map((id) => dataRoot.getConstituency(id));
      } catch (e) {
        logDebugError(`[selectedConstituencies] Error fetching constituency: ${e}`);
        goto(get(getRoute)({ route: 'Constituencies', constituencyId: undefined }));
        return [];
      }
    }
  );

  ////////////////////////////////////////////////////////////
  // Questions and QuestionCategories
  ////////////////////////////////////////////////////////////

  /**
   * All applicable, non-empty question categories to be used as a base for the other stores.
   */
  const questionCategories = questionCategoryStore({ dataRoot, selectedElections, selectedConstituencies });

  const infoQuestionCategories = extractInfoCategories(questionCategories);

  const opinionQuestionCategories = extractOpinionCategories(questionCategories);

  const infoQuestions = questionStore({
    categories: infoQuestionCategories,
    selectedElections,
    selectedConstituencies,
    appType: 'voter'
  });

  const opinionQuestions = questionStore({
    categories: opinionQuestionCategories,
    selectedElections,
    selectedConstituencies,
    appType: 'voter'
  });

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

  const resultsAvailable = parsimoniusDerived(
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
  const entityTypes = parsimoniusDerived(appSettings, (appSettings) => appSettings.results?.sections ?? []);

  /** The parent entity matching method */
  const parentMatchingMethod = parsimoniusDerived(
    appSettings,
    (appSettings) => appSettings.matching?.organizationMatching || 'none'
  );

  // Matching and filtering depend on the available nominations and questions, for which we use a utility store
  const nominationsAndQuestions = nominationAndQuestionStore({
    constituencies: selectedConstituencies,
    dataRoot,
    elections: selectedElections,
    entityTypes,
    parentMatchingMethod
  });

  const nominationsAvailable = parsimoniusDerived(nominationsAndQuestions, (nominationsAndQuestions) =>
    Object.fromEntries(
      Object.entries(nominationsAndQuestions).map(([id, contents]) => [
        id,
        Object.values(contents).some(({ nominations }) => nominations.length > 0)
      ])
    )
  );

  const algorithm = new MatchingAlgorithm({
    distanceMetric: DISTANCE_METRIC.Manhattan,
    missingValueOptions: {
      method: MISSING_VALUE_METHOD.RelativeMaximum
    }
  });

  const minAnswers = parsimoniusDerived(appSettings, (appSettings) => appSettings.matching.minimumAnswers);

  /** Get the entityTypes whose cardContents include `submatches` */
  const calcSubmatches = parsimoniusDerived(appSettings, (appSettings) =>
    Object.entries(appSettings.results.cardContents)
      .filter(([, value]) => value.includes('submatches'))
      .map(([type]) => type as EntityType)
  );

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
  // Resetting voter data
  ///////////////////////////////////////////////////////////

  function resetVoterData(): void {
    answers.reset();
    firstQuestionId.set(null);
    selectedQuestionCategoryIds.set([]);
  }

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
    nominationsAvailable,
    opinionQuestionCategories,
    opinionQuestions,
    resetVoterData,
    resultsAvailable,
    selectedConstituencies,
    selectedElections,
    selectedQuestionBlocks,
    selectedQuestionCategoryIds
  });
}
