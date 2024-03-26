/**
 * A store and functions for filtering candidate results.
 * TODO: Create a store for the filtered rankings.
 */

import {type Writable, derived, writable, get, type Readable} from 'svelte/store';
import {t, locale} from '$lib/i18n';
import {candidateRankings} from './stores';
import {
  Filter,
  FilterGroup,
  TextPropertyFilter,
  ObjectFilter,
  ChoiceQuestionFilter,
  type ChoiceQuestion
} from '$voter/vaa-filters';
import {logDebugError} from './logger';

/**
 * A store that can be used to store candidate filters so that they are persistent during the session.
 * This is dependent on the locale, so we currently have to clear it upon locale change.
 */
export const candidateFilters: Writable<{
  filters: {
    title: string;
    filter: Filter<RankingProps<CandidateProps>, unknown>;
  }[];
  group: FilterGroup<RankingProps<CandidateProps>>;
  locale: string;
} | null> = writable(null);

locale.subscribe((l) => {
  const filters = get(candidateFilters);
  if (filters && filters.locale !== l) resetCandidateFilters();
});

/**
 * A store that contains filtered candidate rankings.
 */
export const filteredCandidateRankings: Readable<RankingProps<CandidateProps>[]> = derived(
  [candidateRankings, candidateFilters],
  ([$candidateRankings, $candidateFilters]) => {
    return $candidateFilters
      ? $candidateFilters.group.apply($candidateRankings)
      : $candidateRankings;
  },
  []
);

/**
 * Initialize candidate filters
 */
export function initCandidateFilters(parties: PartyProps[], questions: QuestionProps[]) {
  const filters: {
    title: string;
    filter: Filter<RankingProps<CandidateProps>, unknown>;
  }[] = [];
  filters.push({
    title: t.get('components.entityFilters.titles.name'),
    filter: new TextPropertyFilter<RankingProps<CandidateProps>>({property: 'name'}, locale.get())
  });
  filters.push({
    title: t.get('components.entityFilters.titles.party'),
    filter: new ObjectFilter<RankingProps<CandidateProps>, PartyProps>(
      {
        property: 'party',
        keyProperty: 'id',
        labelProperty: 'name',
        objects: parties
      },
      locale.get()
    )
  });
  for (const q of questions.filter((q) => q.filterable)) {
    switch (q.type) {
      case 'singleChoiceCategorical':
      case 'singleChoiceOrdinal':
      case 'multipleChoiceCategorical':
        filters.push({
          title: q.text,
          filter: new ChoiceQuestionFilter<RankingProps<CandidateProps>>(
            {question: q as ChoiceQuestion},
            locale.get()
          )
        });
        break;
      default:
        logDebugError(`No filters supported for question type: ${q.type}`);
    }
  }
  const group = new FilterGroup(filters.map((f) => f.filter));
  candidateFilters.set({filters, group, locale: locale.get()});
  // Subscribe to changes in the filters to trigger updates to the store
  group.onChange(updateCandidateFilters);
}

/**
 * Reset the filters. To use them later, they have to be re-initialised
 */
export function resetCandidateFilters() {
  candidateFilters.set(null);
}

/**
 * A utility to trigger a reactive update for the candidateFilters
 */
export function updateCandidateFilters() {
  candidateFilters.update((f) => f);
}
