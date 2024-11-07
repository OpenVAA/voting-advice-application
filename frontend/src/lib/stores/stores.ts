import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { derived, get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import { startEvent, track } from '$lib/utils/analytics/track';
import { wrap } from '$lib/utils/entities';
import { logDebugError } from '$lib/utils/logger';
import { match, matchParties } from '$lib/utils/matching';
import { extractCategories, filterVisible } from '$lib/utils/questions';
import { sortCandidates, sortParties } from '$lib/utils/sort';
import { localStorageWritable } from '$lib/utils/storage';
import { hasAllAnswers } from '../utils/hasAllAnswers';
import type { Readable, Writable } from 'svelte/store';

/**
 * Contains the currently effective app settings.
 * NB! Settings are overwritten by root key.
 */
export const settings: Readable<AppSettings> = derived([page], ([$page]) =>
  $page?.data?.appSettings
    ? { ...dynamicSettings, ...$page.data.appSettings, ...staticSettings }
    : { ...dynamicSettings, ...staticSettings }
);

/**
 * Contains app customization from `DataProvider`.
 */
export const customization: Readable<AppCustomization> = derived([page], ([$page]) =>
  $page?.data?.appCustomization ? $page.data.appCustomization : {}
);

/**
 * A store for the voter's answers which is maintained in local storage.
 */
export const answeredQuestions = localStorageWritable('answeredQuestions', {} as AnswerDict);

/**
 * Set a voter's answer value
 * @param questionId The question id
 * @param value The question value. If `undefined`, the answer will be deleted
 */
export function setVoterAnswer(questionId: string, value?: AnswerProps['value']) {
  answeredQuestions.update((d) => {
    if (value === undefined) {
      startEvent('answer_delete', { questionId });
      delete d[questionId];
    } else {
      startEvent('answer', {
        questionId,
        value: typeof value === 'number' || typeof value === 'boolean' ? value : `${value}`
      });
      d[questionId] = { value };
    }
    return d;
  });
}

/**
 * Delete a voter's answer value
 * @param questionId The question id
 */
export function deleteVoterAnswer(questionId: string) {
  setVoterAnswer(questionId);
}

/**
 * Reset the locally stored voter answers
 */
export function resetVoterAnswers(): void {
  if (browser && localStorage) {
    localStorage.removeItem('answeredQuestions');
    answeredQuestions.set({});
    startEvent('answer_resetAll');
    logDebugError('Local storage has been reset');
  }
}

/**
 * A store for the voter's usage preferences which is maintained in local storage.
 */
export const userPreferences = localStorageWritable('userPreferences', {} as UserPreferences);

/**
 * Set the user's data consent together with the date of giving or denying the consent.
 * @param consent The value for the consent
 */
export function setDataConsent(consent: UserDataCollectionConsent): void {
  userPreferences.update((d) => ({
    ...d,
    dataCollection: { consent, date: new Date().toISOString() }
  }));
  if (consent === 'granted') {
    track('dataConsent_granted');
  }
}

/**
 * Set the user's feedback status together with the date of update.
 * @param status The value for the status
 */
export function setFeedbackStatus(status: UserFeedbackStatus): void {
  userPreferences.update((d) => ({
    ...d,
    feedback: { status, date: new Date().toISOString() }
  }));
}

/**
 * Set the user's survey filling status together with the date of update.
 * @param status The value for the status
 */
export function setSurveyStatus(status: UserFeedbackStatus): void {
  userPreferences.update((d) => ({
    ...d,
    survey: { status, date: new Date().toISOString() }
  }));
}

/**
 * A store that will be true, if the user should be shown the feedback popup.
 */
export const showFeedbackPopup: Writable<boolean> = writable(false);

let feedbackTimeout: NodeJS.Timeout | undefined;

/**
 * Start the countdown for the feedback popup, after which it will be shown on next page load.
 * This will do nothing, if the user has already given their feedback.
 * @param delay The delay in seconds. @default 180 (3 minutes)
 */
export function startFeedbackPopupCountdown(delay = 3 * 60) {
  if (feedbackTimeout) return;
  feedbackTimeout = setTimeout(() => {
    if (get(userPreferences).feedback?.status !== 'received') showFeedbackPopup.set(true);
  }, delay * 1000);
}

/**
 * A store that will be true, if the user should be shown the survey popup.
 */
export const showSurveyPopup: Writable<boolean> = writable(false);

let surveyTimeout: NodeJS.Timeout | undefined;

/**
 * Start the countdown for the survey popup, after which it will be shown on next page load.
 * This will do nothing, if the user has already opened the survey.
 * @param delay The delay in seconds. @default 300 (5 minutes)
 */
export function startSurveyPopupCountdown(delay = 5 * 60) {
  if (surveyTimeout) return;
  surveyTimeout = setTimeout(() => {
    if (get(userPreferences).survey?.status !== 'received') showSurveyPopup.set(true);
  }, delay * 1000);
}

/**
 * Utility store for the election as part of `PageData`.
 */
export const election: Readable<ElectionProps | undefined> = derived(page, ($page) => $page.data.election);

/**
 * Utility store for candidates as part of `PageData` that also handles possible filtering by answers and sorting of candidates.
 */
export const candidates: Readable<Promise<Array<CandidateProps>>> = derived(
  page,
  ($page) => {
    const candsPromise = $page.data.candidates;
    if (!candsPromise) return Promise.resolve([]);
    // Technically, we should derive this store also from settings and opinionQuestions, but this will cause unnecessary updates and these are all dependent on page, so we just fetch them manually
    const hideIfMissing = get(settings).entities?.hideIfMissingAnswers?.candidate;
    if (!hideIfMissing) return candsPromise.then((d) => d.sort(sortCandidates));
    const questPromise = get(opinionQuestions);
    return Promise.all([candsPromise, questPromise]).then(([cands, questions]) =>
      cands.filter((c) => hasAllAnswers(c, questions)).sort(sortCandidates)
    );
  },
  Promise.resolve([])
);

/**
 * Utility store for parties as part of `PageData`.
 */
export const parties: Readable<Promise<Array<PartyProps>>> = derived(
  page,
  ($page) => $page.data.parties?.then((d) => d.sort(sortParties)) ?? Promise.resolve([]),
  Promise.resolve([])
);

/**
 * Utility store for infoQuestions as part of `PageData`.
 */
export const infoQuestions: Readable<Promise<Array<QuestionProps>>> = derived(
  page,
  ($page) => $page.data.infoQuestions?.then((qq) => filterVisible(qq ?? [])) ?? Promise.resolve([]),
  Promise.resolve([])
);

/**
 * Utility store for opinionQuestions as part of `PageData`.
 */
export const opinionQuestions: Readable<Promise<Array<QuestionProps>>> = derived(
  page,
  ($page) => $page.data.opinionQuestions?.then((qq) => filterVisible(qq ?? [])) ?? Promise.resolve([]),
  Promise.resolve([])
);

/**
 * Utility store for an dictionary of all info and opinion questions as part of `PageData`.
 */
export const allQuestions: Readable<Promise<Record<string, QuestionProps>>> = derived(
  [infoQuestions, opinionQuestions],
  async ([$infoQuestions, $opinionQuestions]) => {
    const infoQuestionsSync = await $infoQuestions;
    const opinionQuestionsSync = await $opinionQuestions;
    return Object.fromEntries([...infoQuestionsSync, ...opinionQuestionsSync].map((q) => [q.id, q]));
  },
  Promise.resolve({})
);

/**
 * Utility store for opinion question catetgories as part of `PageData`.
 */
export const opinionQuestionCategories: Readable<Promise<Array<QuestionCategoryProps>>> = derived(
  opinionQuestions,
  ($opinionQuestions) => $opinionQuestions.then((qq) => extractCategories(qq)),
  Promise.resolve([])
);

/**
 * This store tells which application we're using. For other app types,
 * set this to the current type in the layout containing the app.
 */
export const appType: Writable<AppType> = writable('voter');

/**
 * The possible types of the application
 */
export type AppType = 'candidate' | 'voter';

/**
 * A store that is true, when the results (and questions) are available
 */
export const resultsAvailable: Readable<Promise<boolean>> = derived(
  [answeredQuestions, opinionQuestions, settings],
  async ([$answeredQuestions, $opinionQuestions, $settings]) => {
    const opinionQuestionsSync = await $opinionQuestions;
    if (!(opinionQuestionsSync.length && Object.keys($answeredQuestions).length)) return false;
    // We need to filtering because some of the user's answers might be to questions subsequently removed or hidden
    return (
      opinionQuestionsSync.filter((q) => $answeredQuestions[q.id] != null).length >=
      Math.min(opinionQuestionsSync.length, $settings.matching?.minimumAnswers ?? 1)
    );
  },
  Promise.resolve(false)
);

/**
 * A store that holds the candidate rankings. For ease of use, these will be wrapped entities with no `score` properties, if results are not yet available.
 */
export const candidateRankings: Readable<
  Promise<Array<RankingProps<CandidateProps>> | Array<WrappedEntity<CandidateProps>>>
> = derived(
  [candidates, opinionQuestions, answeredQuestions, resultsAvailable, settings],
  async ([$candidates, $opinionQuestions, $answeredQuestions, $resultsAvailable, $settings]) => {
    const resultsAvailableSync = await $resultsAvailable;
    const candidatesSync = await $candidates;
    const opinionQuestionsSync = await $opinionQuestions;
    return resultsAvailableSync && candidatesSync.length
      ? match(opinionQuestionsSync, $answeredQuestions, candidatesSync, {
          subMatches: $settings.results.cardContents.candidate.includes('submatches')
        })
      : candidatesSync.map(wrap);
  },
  Promise.resolve([])
);

/**
 * A store that holds the party rankings. For ease of use, these will be wrapped entities with no `score` properties, if results are not yet available.
 */
export const partyRankings: Readable<Promise<Array<RankingProps<PartyProps>> | Array<WrappedEntity<PartyProps>>>> =
  derived(
    [candidates, parties, opinionQuestions, answeredQuestions, resultsAvailable, settings],
    async ([$candidates, $parties, $opinionQuestions, $answeredQuestions, $resultsAvailable, $settings]) => {
      const resultsAvailableSync = await $resultsAvailable;
      const opinionQuestionsSync = await $opinionQuestions;
      const candidatesSync = await $candidates;
      const partiesSync = await $parties;
      return resultsAvailableSync && $settings.matching.partyMatching !== 'none' && partiesSync.length
        ? matchParties(opinionQuestionsSync, $answeredQuestions, candidatesSync, partiesSync, {
            subMatches: $settings.results.cardContents.party.includes('submatches'),
            matchingType: $settings.matching.partyMatching
          })
        : partiesSync.map(wrap);
    },
    Promise.resolve([])
  );

/**
 * A store that holds the function for opening the feedback modal.
 */
export const openFeedbackModal: Writable<() => void | undefined> = writable();
