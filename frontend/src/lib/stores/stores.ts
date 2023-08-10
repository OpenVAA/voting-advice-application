/**
 * Contains all transient and persistent stores used in the app.
 * Also contains derived stores based on these.
 *
 * TO DO: The filtering logic for effective elections etc. might be best
 * kept separate so that we don't reduplicate it, as we sometimes do the
 * same filtering in SSR. However, we might also just not do that in SSR...
 */

import {derived, writable} from 'svelte/store';
import type {Writable} from 'svelte/store';
import {page} from '$app/stores';
import {browser} from '$app/environment';

import {logDebugError} from '$lib/utils/logger';

import type {AppLabels} from '$lib/api/dataProvider.types';
import {Election, ConstituencyCategory, QuestionCategory, Question} from '$lib/api/dataObjects';
import type {
  ElectionData,
  ConstituencyCategoryData,
  QuestionCategoryData,
  QuestionData
} from '$lib/api/dataObjects';
import {DEFAULT_SETTINGS, OrganizedContents} from './stores.types';
import type {Settings, SessionData, UserData} from './stores.types';
import {removeDuplicates} from './utils';

////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS
////////////////////////////////////////////////////////////////

// Store values in local storage to prevent them from disappearing in refresh
// Here we check if item already exists on a refresh event
function getItemFromLocalStorage<T>(key: string, defaultValue: T): T {
  let item = defaultValue;
  if (browser && localStorage) {
    const itemInLocalStorage = localStorage.getItem(key);
    if (itemInLocalStorage != null) {
      item = JSON.parse(itemInLocalStorage);
    }
  }
  return item;
}

function subscribeToLocalStorage<T>(item: Writable<T>, key: string): void {
  if (browser && localStorage) {
    item.subscribe((value) => localStorage.setItem(key, JSON.stringify(value)));
  }
}

function createStoreValueAndSubscribeToLocalStorage<T>(key: string, defaultValue: T): Writable<T> {
  const storeValue = writable(getItemFromLocalStorage(key, defaultValue));
  subscribeToLocalStorage(storeValue, key);
  return storeValue;
}

////////////////////////////////////////////////////////////////
// STORES
////////////////////////////////////////////////////////////////

// Here we initialize all the stores used by all the pages in the app
// It's up to the pages to update the stores values

////////////////////////////////////////////////////////////////
// TRANSIENT STORES FOR ALL SSR LOADED DATA
////////////////////////////////////////////////////////////////

// Transient stores (lost upon page refresh)
export const appLabels = writable<AppLabels>({});
export const appSettings = writable<Settings>({});
export const electionsData = writable<ElectionData[]>([]);
export const constituencyCategoriesData = writable<ConstituencyCategoryData[]>([]);
export const questionCategoriesData = writable<QuestionCategoryData[]>([]);
export const questionsData = writable<QuestionData[]>([]);
// TO DO: Add entity data and derived stores

////////////////////////////////////////////////////////////////
// SETTINGS STORES
////////////////////////////////////////////////////////////////

// TO DO: Check if we should split this into substores to avoid unnecessary derived calls below
// Remove funny indices from names, but we need these to reset the stores
export const userData = createStoreValueAndSubscribeToLocalStorage('userData_1', {
  settings: {},
  customData: {}
} as UserData);
export const sessionData = createStoreValueAndSubscribeToLocalStorage('sessionData_1', {
  settings: {},
  temporaryChoices: {},
  customData: {}
} as SessionData);

export const effectiveSettings = derived(
  [appSettings, userData, sessionData],
  ([$appSettings, $userData, $sessionData]) => {
    // TO DO: Create a appSettings store that works like appLabels and apply its settings here
    logDebugError('Updating effectiveSettings from [$appSettings, $userData, $sessionData]');
    return {
      ...DEFAULT_SETTINGS,
      ...($appSettings ?? {}),
      ...($userData?.settings ?? {}),
      ...($sessionData?.settings ?? {})
    };
  }
);

export const effectiveTemporaryChoices = derived([sessionData, page], ([$sessionData, $page]) => {
  // Get current question id from route params
  logDebugError('Updating effectiveTemporaryChoices from [$sessionData, $page]');
  const questionId = $page.params.questionId;
  const choices = $sessionData.temporaryChoices ?? {};
  return questionId != null ? {...choices, currentQuestionId: questionId} : choices;
});

////////////////////////////////////////////////////////////////
// TRANSIENT, DERIVED STORES FOR DATA OBJECTS BEFORE FILTERING
////////////////////////////////////////////////////////////////

export const allConstituencyCategories = derived(
  constituencyCategoriesData,
  ($constituencyCategoriesData) => {
    logDebugError(
      'Creating allConstituencyCategories constituencyCategoriesData: len ' +
        $constituencyCategoriesData.length
    );
    return $constituencyCategoriesData.map((d) => new ConstituencyCategory(d));
  }
);

export const allElections = derived(
  [electionsData, allConstituencyCategories],
  ([$electionsData, $allConstituencyCategories]) => {
    logDebugError('Creating allElections from [$electionsData, $allConstituencyCategories]');
    const elections = $electionsData.map((d) => new Election(d));
    if ($allConstituencyCategories?.length) {
      elections.forEach((e) => e.supplyConstituencyCategories($allConstituencyCategories));
    }
    return elections;
  }
);

export const allQuestionCategories = derived(
  [questionCategoriesData, questionsData],
  ([$questionCategoriesData, $questionsData]) => {
    logDebugError(
      'Creating allQuestionCategories from [$questionCategoriesData, $questionsData]: $questionCategoriesData.length ' +
        $questionCategoriesData.length
    );
    const questionCategories = $questionCategoriesData.map((d) => new QuestionCategory(d));
    // TO DO: Include Questions data in questionCategories data so that they cannot
    // exist separately
    if ($questionsData?.length) {
      questionCategories.forEach((e) => e.supplyQuestionsData($questionsData));
    }
    return questionCategories;
  }
);

export const allQuestions = derived([allQuestionCategories], ([$allQuestionCategories]) => {
  logDebugError(
    'Creating allQuestions from [$allQuestionCategories (length ${$allQuestionCategories.length})]'
  );
  return removeDuplicates($allQuestionCategories.map((c) => c.questions).flat());
});

////////////////////////////////////////////////////////////////
// TRANSIENT, DERIVED STORES FOR AVAILABLE DATA OBJECTS
// ********************************
// NB! From this on, the stores return OrganisedStores except
// the Elections stores
////////////////////////////////////////////////////////////////

// These are based on allElections etc. stores and contain only
// the subset of the objects that are currently available based
// on persistent user selections, such as
// userData.constituencyId

// For convenience, and this might change in the future
export const availableElections = derived(allElections, ($allElections) => $allElections);

export const availableConstituencyCategories = derived(
  availableElections,
  ($availableElections) => {
    logDebugError(
      'Getting availableConstituencyCategories from $availableElections ' +
        $availableElections.length
    );
    // TO DO: Apply sorting
    return new OrganizedContents($availableElections.map((e) => [e, e.constituencyCategories]));
  }
);

export const availableConstituencies = derived(
  [availableConstituencyCategories, userData],
  ([$availableConstituencyCategories, $userData]) => {
    logDebugError(
      'Getting availableConstituencies from [$availableConstituencyCategories, $userData]'
    );
    // TO DO: Apply sorting
    // TO DO: Handle recursive constituencies and pick the effective ones for each election
    // We filter to find the user-specified constituency ids and return arrays
    // although there should always be either 0 or 1 of matches
    return $availableConstituencyCategories.mapContents((constCats) =>
      constCats
        .map((c) => c.constituencies)
        .flat()
        .filter((c) => $userData.constituencyIds?.includes(c.id))
    );
  }
);

export const availableQuestions = derived(
  [allQuestions, availableConstituencies],
  ([$allQuestions, $availableConstituencies]) => {
    logDebugError(
      'Getting availableQuestions from [$allQuestions, $availableConstituencies]: $allQuestions.length ' +
        $allQuestions.length
    );
    return $availableConstituencies.mapContents((consts) => {
      // Get ids
      const ids = consts.map((c) => c.id);
      if (ids.length === 0) {
        return [];
      }
      // Filter questions based on their own constituencyId limits or that of their category's
      // TO DO: Make this check a method of Question
      const qsts = $allQuestions.filter(
        (q) =>
          (q.constituencyId === '' || ids.includes(q.constituencyId)) &&
          (!q.category ||
            q.category.constituencyId === '' ||
            ids.includes(q.category.constituencyId))
      );
      return qsts;
    });
  }
);

export const availableQuestionCategories = derived(
  [availableQuestions],
  ([$availableQuestions]) => {
    logDebugError(
      `Getting availableQuestionCategories from [$availableQuestions]: all.length ${$availableQuestions.all.length}`
    );
    // TO DO: Apply sorting
    // NB! The categories' question properties may contain questions that are not applicable
    // because of constituencyId
    return $availableQuestions.mapContents((qsts) => removeDuplicates(qsts.map((q) => q.category)));
  }
);

////////////////////////////////////////////////////////////////
// TRANSIENT, DERIVED STORES FOR VISIBLE DATA OBJECTS
////////////////////////////////////////////////////////////////

// These are based on availableElections etc. stores and contain
// only the subset of the objects that are currently effective
// based on transient user selections, such as
// SessionState.selectedQuestionCategoryIds

export const visibleElections = derived(
  [availableElections, effectiveTemporaryChoices],
  ([$availableElections, $effectiveTemporaryChoices]) => {
    // TO DO: Make sure that filter does produce some elections!
    logDebugError(
      'Computing visibleElections from [$availableElections, $effectiveTemporaryChoices]'
    );
    const ids = $effectiveTemporaryChoices?.selectedElectionIds;
    return ids?.length && $availableElections
      ? $availableElections.filter((e) => ids.includes(e.id))
      : $availableElections;
  }
);

// For convenience
export const visibleConstituencyCategories = derived(
  availableConstituencyCategories,
  ($availableConstituencyCategories) => $availableConstituencyCategories
);

// For convenience
export const visibleConstituencies = derived(
  availableConstituencies,
  ($availableConstituencies) => $availableConstituencies
);

export const visibleQuestions = derived(
  [availableQuestions, effectiveTemporaryChoices],
  ([$availableQuestions, $effectiveTemporaryChoices]) => {
    logDebugError(
      `Getting visibleQuestions from [$availableQuestions (length ${$availableQuestions.all.length}), $effectiveTemporaryChoices (selectedQuestionCategoryIds ${$effectiveTemporaryChoices.selectedQuestionCategoryIds})]`
    );
    // TO DO: Apply sorting
    // Now we need to filter out duplicates already from the byElectionId questions list
    const seen = new Set<Question>();
    return $availableQuestions.mapContents((qsts) => {
      const filtered = qsts.filter(
        (q) =>
          !seen.has(q) &&
          q.category?.id != null &&
          $effectiveTemporaryChoices.selectedQuestionCategoryIds?.includes(q.category?.id)
      );
      filtered.forEach((q) => seen.add(q));
      return filtered;
    });
  }
);

export const visibleQuestionCategories = derived([visibleQuestions], ([$visibleQuestions]) => {
  logDebugError(
    `Getting visibleQuestionCategories from visibleQuestions: all.len ${$visibleQuestions.all.length}`
  );
  // TO DO: Apply sorting
  // NB! The categories' question properties may contain questions that are not applicable
  // because of constituencyId
  return $visibleQuestions.mapContents((qsts) => removeDuplicates(qsts.map((q) => q.category)));
});

////////////////////////////////////////////////////////////////
// ADDITIONAL, TRANSIENT UTILITY STORES
////////////////////////////////////////////////////////////////

export const currentQuestionIndex = derived(
  [visibleQuestions, effectiveTemporaryChoices],
  ([$visibleQuestions, $effectiveTemporaryChoices]) => {
    logDebugError(
      'Getting currentQuestionIndex from [$visibleQuestions, $effectiveTemporaryChoices]'
    );
    const qsts = $visibleQuestions?.all;
    const id = $effectiveTemporaryChoices?.currentQuestionId;
    if (!qsts?.length || id == null) {
      return undefined;
    }
    const current = qsts.filter((q) => q.id === id);
    if (current.length > 1) {
      throw new Error(`More than one question with id ${id} found!`);
    }
    return qsts.indexOf(current[0]);
  }
);

// TO DO
// Strangely the const below will always be true, but the error below will always be thrown!
// export const wasBrowser = browser === true;
// if (!wasBrowser) throw new Error();
