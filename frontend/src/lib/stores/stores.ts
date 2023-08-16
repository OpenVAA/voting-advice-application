/**
 * Contains all transient and persistent stores used in the app.
 * Also contains derived stores based on these.
 *
 * TO DO: The filtering logic for effective elections etc. might be best
 * kept separate and implemented already in the DataObjects so that we
 * don't reduplicate it, as we sometimes do the same filtering in SSR.
 * The principle could be that availableStores would rely on that logic
 * and only the visibleStores would possibly have some Svelte- and UI-
 * specific filtering logic.
 *
 * TO DO: Instead of returning the raw DataObjectCollections from the
 * stores for the .svelte files, we could always return Arrays with
 * DataObjectCollections<T>.sorted.
 */

import {derived, writable} from 'svelte/store';
import type {Unsubscriber, Writable} from 'svelte/store';
import {page} from '$app/stores';
import {browser} from '$app/environment';

import {logDebugError} from '$lib/utils/logger';

import type {AppLabels} from '$types';
import {DataRoot} from '$lib/vaa-data';
import type {
  ElectionData,
  QuestionCategoryData,
  QuestionData,
  AnyConstituencyCategoryData,
  PersonData,
  NominationData,
  EntityData,
  FullySpecifiedAnswerData,
  QuestionTemplateData
} from '$lib/vaa-data';
import {DEFAULT_SETTINGS} from './stores.types';
import type {Settings, SessionData, UserData} from './stores.types';

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

/**
 * This will house the unsubscriber functions needed by createConnectedStore and
 * unsubscribeAll
 */
const subscriptions: Unsubscriber[] = [];

function unsubscribeAll() {
  logDebugError('Clearing all manual store subscriptions');
  subscriptions.forEach((unsubscribe) => unsubscribe());
}

/**
 * A utility for creating data stores that are connected to the dataRoot.
 * @param callback The function to be called when the data value changes.
 * @returns The store
 */
function createConnectedStore<T>(callback: (data: T[]) => void): Writable<T[]> {
  logDebugError(`Creating connected store (${callback})`);
  const store = writable<T[]>([] as T[], () => unsubscribeAll);
  subscriptions.push(
    store.subscribe((data) => {
      if (!(data?.length > 0)) {
        return;
      }
      logDebugError('Manual data store subscription activated.');
      callback(data);
    })
  );
  return store;
}

////////////////////////////////////////////////////////////////
// DATA ROOT
////////////////////////////////////////////////////////////////

// DataRoot will contain the full DataObject hierarchy that
// the all-type derived stores create. They always provide the
// data to the dataRoot object using dataRoot.provideSomeData.

const dataRoot = new DataRoot();

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

export const electionData = createConnectedStore((data: ElectionData[]) =>
  dataRoot.provideElectionData(data)
);
export const constituencyCategoryData = createConnectedStore(
  (data: AnyConstituencyCategoryData[]) => dataRoot.provideConstituencyCategoryData(data)
);
export const questionTemplateData = createConnectedStore((data: QuestionTemplateData[]) =>
  dataRoot.provideQuestionTemplateData(data)
);
export const questionCategoryData = createConnectedStore((data: QuestionCategoryData[]) =>
  dataRoot.provideQuestionCategoryData(data)
);
export const questionData = createConnectedStore((data: QuestionData[]) =>
  dataRoot.provideQuestionData(data)
);
export const personData = createConnectedStore((data: PersonData[]) =>
  dataRoot.providePersonData(data)
);
export const organizationData = createConnectedStore((data: EntityData[]) =>
  dataRoot.provideOrganizationData(data)
);
export const nominationData = createConnectedStore((data: NominationData[]) =>
  dataRoot.provideNominationData(data)
);
export const answerData = createConnectedStore((data: FullySpecifiedAnswerData[]) =>
  dataRoot.provideAnswerData(data)
);

// TO DO: Add entity data and derived stores

////////////////////////////////////////////////////////////////
// SETTINGS STORES
////////////////////////////////////////////////////////////////

// TO DO: Check if we should split this into substores to avoid unnecessary derived calls below
// TO DO: Remove funny indices from names, but we need these to reset the stores
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
  const questionId = $page.params.questionId ?? '';
  const personNominationId = $page.params.personNominationId ?? '';
  const choices = $sessionData.temporaryChoices ?? {};
  return questionId != null
    ? {...choices, currentQuestionId: questionId, currentPersonNominationId: personNominationId}
    : choices;
});

////////////////////////////////////////////////////////////////
// TRANSIENT, DERIVED STORES FOR DATA OBJECTS BEFORE FILTERING
////////////////////////////////////////////////////////////////

// NB. These are bit superfluous because we've already supplied
// the data to dataRoot with the manual subscriptions above. We
// can't rely on these derived stores to do that updating,
// however, because the derived stores will only be updated when
// them or their descendant stores are used in the frontend!
// Thus, if, for example, we updated the dataRoot's constituency
// categories in the derived store allConstituencyCategories,
// but iterated over $allElections in the frontend, the Election
// objects returned would not have their constituecyCategories
// properties updated with the data (constituencyCategoryData).

export const allTemplates = derived(questionTemplateData, ($data) => {
  logDebugError(`Reflecting allTemplates from [questionTemplateData (len ${$data.length})]`);
  return dataRoot.questionTemplates;
});

export const allElections = derived(electionData, ($data) => {
  logDebugError(`Reflecting allElections from [electionData (len ${$data.length})]`);
  return dataRoot.elections;
});

export const allConstituencyCategories = derived(constituencyCategoryData, ($data) => {
  logDebugError(
    `Reflecting allConstituencyCategories constituencyCategoryData: len ${$data.length}`
  );
  return dataRoot.constituencyCategories;
});

// export const allQuestions = derived([allQuestionCategories], ([$data]) => {
//   logDebugError(`Creating allQuestions from [$allQuestionCategories (length ${$data.length})]`);
//   return dataRoot.questions;
// });

export const allMatchableQuestions = derived([questionData], ([$data]) => {
  logDebugError(`Reflecting allMatchableQuestions from [$questionData (length ${$data.length})]`);
  return dataRoot.matchableQuestions;
});

export const allMatchableQuestionCategories = derived([allMatchableQuestions], ([$qsts]) => {
  logDebugError(
    `Reflecting allMatchableQuestionCategories from [$allMatchableQuestions ${$qsts.length}]`
  );
  return $qsts.mapAsList((q) => q.parent);
});

export const allNonMatchableQuestions = derived([questionData], ([$data]) => {
  logDebugError(
    `Reflecting allNonMatchableQuestions from [$questionData (length ${$data.length})]`
  );
  return dataRoot.nonMatchableQuestions;
});

export const allNonMatchableQuestionCategories = derived([allNonMatchableQuestions], ([$qsts]) => {
  logDebugError(
    `Reflecting allNonMatchableQuestionCategories from [$allNonMatchableQuestions ${$qsts.length}]`
  );
  return $qsts.mapAsList((q) => q.parent);
});

export const allPersons = derived([personData], ([$data]) => {
  logDebugError(`Reflecting allPersons from [$personData (length ${$data.length})]`);
  return dataRoot.entities.persons;
});

export const allCandidates = derived([nominationData], ([$data]) => {
  logDebugError(`Reflecting allCandidates from [$nominationData (length ${$data.length})]`);
  return dataRoot.elections.mapAsList((e) => e.nominations.persons.items);
});

export const allOrganizations = derived([organizationData], ([$data]) => {
  logDebugError(`Reflecting allPersons from [$organizationData (length ${$data.length})]`);
  return dataRoot.entities.organizations;
});

export const allPersonNominations = derived([nominationData], ([$data]) => {
  logDebugError(`Reflecting allNominations from [$nominationData (length ${$data.length})]`);
  return dataRoot.elections.mapAsList((e) => e.nominations.persons.items);
});

////////////////////////////////////////////////////////////////
// TRANSIENT, DERIVED STORES FOR AVAILABLE DATA OBJECTS
////////////////////////////////////////////////////////////////

// These are based on allElections etc. stores and contain only
// the subset of the objects that are currently available based
// on persistent user selections, such as
// userData.constituencyId

// For convenience, and this might change in the future
export const availableElections = derived(allElections, ($els) => $els);

export const availableConstituencyCategories = derived(availableElections, ($els) => {
  logDebugError(`Getting availableConstituencyCategories from $availableElections ${$els.length}`);
  return $els.mapAsList((e) => e.constituencyCategories.items);
});

export const availableConstituencies = derived(
  [availableConstituencyCategories, userData],
  ([$cats, $user]) => {
    logDebugError(
      `Getting availableConstituencies from [$availableConstituencyCategories (${$cats.length}), $userData]`
    );
    // We filter to find the user-specified constituency ids and return arrays
    // although there should always be either 0 or 1 of matches
    return $cats.mapAsList((cat) => cat.constituencies.filter({id: $user.constituencyIds}));
  }
);

export const availableMatchableQuestions = derived(
  [allMatchableQuestions, availableConstituencies],
  ([$qsts, $consts]) => {
    logDebugError(
      `Getting availableMatchableQuestions from [$allMatchableQuestions ${$qsts.length}]`
    );
    // The filter also applies to any questions within categries restricted by constituencyId
    return $qsts.filterAsList({constituencyId: $consts.ids});
  }
);

export const availableMatchableQuestionCategories = derived(
  [availableMatchableQuestions, availableConstituencies],
  ([$qsts, $consts]) => {
    logDebugError(
      `Getting availableMatchableQuestionCategories from [$availableMatchableQuestions ${$qsts.length}, availableConstituencies]`
    );
    // NB! The categories' question properties may contain questions that are not applicable
    // because of constituencyId
    return $qsts.mapAsList((q) => q.parent).filterAsList({constituencyId: $consts.ids});
  }
);

export const availableNonMatchableQuestions = derived(
  [allNonMatchableQuestions, availableConstituencies],
  ([$qsts, $consts]) => {
    logDebugError(
      `Getting availableNonMatchableQuestions from [$allNonMatchableQuestions ${$qsts.length}]`
    );
    // The filter also applies to any questions within categries restricted by constituencyId
    return $qsts.filterAsList({constituencyId: $consts.ids});
  }
);

export const availableNonMatchableQuestionCategories = derived(
  [availableNonMatchableQuestions, availableConstituencies],
  ([$qsts, $consts]) => {
    logDebugError(
      `Getting availableNonMatchableQuestionCategories from [$availableNonMatchableQuestions ${$qsts.length}, availableConstituencies]`
    );
    // NB! The categories' question properties may contain questions that are not applicable
    // because of constituencyId
    return $qsts.mapAsList((q) => q.parent).filterAsList({constituencyId: $consts.ids});
  }
);

export const availablePersonNominations = derived(
  [allPersonNominations, availableConstituencies],
  ([$prsns, $cnsts]) => {
    logDebugError(
      `Getting availablePersons from [$allPersonNominations ${$prsns.length}, $availableConstituencies]`
    );
    return $prsns.filterAsList({constituencyId: $cnsts.ids});
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
      ? $availableElections.filterAsList({id: ids})
      : $availableElections;
  }
);

// // For convenience
export const visibleConstituencyCategories = derived(
  availableConstituencyCategories,
  ($cats) => $cats
);

// // For convenience
export const visibleConstituencies = derived(availableConstituencies, ($consts) => $consts);

export const visibleMatchableQuestions = derived(
  [availableMatchableQuestions, effectiveTemporaryChoices],
  ([$qsts, $choices]) => {
    logDebugError(
      `Getting visibleMatchableQuestions from [$availableMatchableQuestions (length ${$qsts.length}), $effectiveTemporaryChoices (selectedQuestionCategoryIds ${$choices.selectedQuestionCategoryIds})]`
    );
    const catIds = $choices.selectedQuestionCategoryIds ?? [];
    return $qsts.filterAsList({questionCategoryId: catIds});
  }
);

export const visibleMatchableQuestionCategories = derived(
  [visibleMatchableQuestions],
  ([$qsts]) => {
    logDebugError(
      `Getting visibleMatchableQuestionCategories from visibleMatchableQuestions: ${$qsts.length}`
    );
    // NB! The categories' question properties may contain questions that are not applicable
    // because of constituencyId
    return $qsts.mapAsList((q) => q.parent);
  }
);

// TO DO Name into visibleResults
//
// export const visiblePersonNominations = derived([availablePersonNominations, effectiveTemporaryChoices],
//   ([$prsns, $choices]) => {
//     logDebugError(
//       `Getting visiblePersonNominations from [availablePersonNominations (${$prsns.length}), effectiveTemporaryChoices (${$choices})]`
//     );
//     // TO DO: Apply any filters here
//     return $prsns;
//   }
// );

// ////////////////////////////////////////////////////////////////
// // ADDITIONAL, TRANSIENT UTILITY STORES
// ////////////////////////////////////////////////////////////////

export const isSingleElection = derived(visibleElections, ($els) => $els.length === 1);

export const currentQuestion = derived(
  [visibleMatchableQuestions, effectiveTemporaryChoices],
  ([$qsts, $choices]) => {
    logDebugError(
      'Getting currentQuestion from [$visibleMatchableQuestions, $effectiveTemporaryChoices]'
    );
    const id = $choices.currentQuestionId;
    return id == null ? undefined : $qsts.byId(id);
  }
);

export const nextQuestion = derived(
  [visibleMatchableQuestions, currentQuestion],
  ([$qsts, $current]) => {
    logDebugError('Getting prevQuestion from [$visibleMatchableQuestions, $currentQuestion]');
    if ($current == null) {
      return undefined;
    }
    const sortedQsts = $qsts.sorted;
    const idx = sortedQsts.indexOf($current) + 1;
    return idx >= sortedQsts.length ? undefined : sortedQsts[idx];
  }
);

export const currentPersonNomination = derived(
  [availablePersonNominations, effectiveTemporaryChoices],
  ([$noms, $choices]) => {
    logDebugError(
      'Getting currentPersonNomination from [$availablePersonNominations, $effectiveTemporaryChoices]'
    );
    const id = $choices.currentPersonNominationId;
    return id == null ? undefined : $noms.byId(id);
  }
);
