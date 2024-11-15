/**
 * A store and functions for filtering candidate results.
 * The `candidateFilters` store is used to store candidate filters so that they are persistent during the session. It is dependent both on the locale and the availability of `infoQuestions` and `parties` in `page.data`. For this reason, it is provided as a derived store and will be `undefined` until these are available.
 */

import {
  type ChoiceQuestion,
  ChoiceQuestionFilter,
  Filter,
  FilterGroup,
  type NumericQuestion,
  NumericQuestionFilter,
  ObjectFilter
} from '@openvaa/filters';
import { derived, type Readable } from 'svelte/store';
import { locale, t } from '$lib/i18n';
import { infoQuestions, parties } from '$lib/legacy-stores';
import { logDebugError } from './logger';

let candidateFilterGroup: FilterGroup<MaybeRanked<CandidateProps>> | undefined = undefined;
let candidateFiltersLocale: string = '';

export const candidateFilters: Readable<Promise<FilterGroup<MaybeRanked<CandidateProps>> | undefined>> = derived(
  [infoQuestions, locale, parties],
  async ([$infoQuestions, $locale, $parties]) => {
    const parties = await $parties;
    const infoQuestionsSync = await $infoQuestions;
    if (!infoQuestionsSync.length && !parties.length) return undefined;
    if (candidateFiltersLocale !== $locale) {
      candidateFilterGroup = buildCandidateFilters(infoQuestionsSync, parties);
      candidateFiltersLocale = $locale;
    }
    return candidateFilterGroup;
  },
  Promise.resolve(undefined)
);

/**
 * Initialize candidate filters
 */
export function buildCandidateFilters(infoQuestions: Array<QuestionProps>, parties: Array<PartyProps>) {
  const filters: Array<Filter<MaybeRanked<CandidateProps>, unknown>> = [];
  if (parties.length) {
    filters.push(
      new ObjectFilter<MaybeRanked<CandidateProps>, PartyProps>(
        {
          property: 'party',
          keyProperty: 'id',
          labelProperty: 'name',
          objects: parties,
          name: t.get('common.party.singular')
        },
        locale.get()
      )
    );
  }
  for (const q of infoQuestions.filter((q) => q.filterable)) {
    switch (q.type) {
      case 'singleChoiceCategorical':
      case 'singleChoiceOrdinal':
      case 'multipleChoiceCategorical':
        filters.push(
          new ChoiceQuestionFilter<MaybeRanked<CandidateProps>>(
            {
              question: q as ChoiceQuestion,
              name: q.text
            },
            locale.get()
          )
        );
        break;
      case 'number':
        filters.push(
          new NumericQuestionFilter<MaybeRanked<CandidateProps>>({
            question: q as NumericQuestion,
            name: q.text
          })
        );
        break;
      default:
        logDebugError(`No filters supported for question type: ${q.type}`);
    }
  }
  return new FilterGroup(filters);
}
