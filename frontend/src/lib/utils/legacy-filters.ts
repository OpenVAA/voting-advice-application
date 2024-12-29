/**
 * A store and functions for filtering candidate results.
 * The `candidateFilters` store is used to store candidate filters so that they are persistent during the session. It is dependent both on the locale and the availability of `infoQuestions` and `parties` in `page.data`. For this reason, it is provided as a derived store and will be `undefined` until these are available.
 */

import {
  type ChoiceQuestion,
  ChoiceQuestionFilter,
  Filter,
  FilterGroup,
  type NumberQuestion,
  NumberQuestionFilter,
  ObjectFilter
} from '@openvaa/filters';
import { derived, type Readable } from 'svelte/store';
import { locale, t } from '$lib/i18n';
import { infoQuestions, parties } from '$lib/legacy-stores';
import { logDebugError } from './logger';

let candidateFilterGroup: FilterGroup<LegacyMaybeRanked<LegacyCandidateProps>> | undefined = undefined;
let candidateFiltersLocale: string = '';

export const candidateFilters: Readable<Promise<FilterGroup<LegacyMaybeRanked<LegacyCandidateProps>> | undefined>> =
  derived(
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
export function buildCandidateFilters(infoQuestions: Array<LegacyQuestionProps>, parties: Array<LegacyPartyProps>) {
  const filters: Array<Filter<LegacyMaybeRanked<LegacyCandidateProps>, unknown>> = [];
  if (parties.length) {
    filters.push(
      new ObjectFilter<LegacyMaybeRanked<LegacyCandidateProps>, LegacyPartyProps>(
        {
          property: 'party',
          keyProperty: 'id',
          labelProperty: 'name',
          objects: parties,
          name: t.get('common.organization.singular')
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
          new ChoiceQuestionFilter<LegacyMaybeRanked<LegacyCandidateProps>>(
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
          new NumberQuestionFilter<LegacyMaybeRanked<LegacyCandidateProps>>({
            question: q as NumberQuestion,
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
