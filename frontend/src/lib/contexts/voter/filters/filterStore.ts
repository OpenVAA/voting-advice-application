import { getCustomData } from '@openvaa/app-shared';
import { ENTITY_TYPE } from '@openvaa/data';
import { Filter, FilterGroup } from '@openvaa/filters';
import { derived, type Readable } from 'svelte/store';
import { ucFirst } from '$lib/utils/text/ucFirst';
import { buildParentFilters } from './buildParentFilters';
import { buildQuestionFilter } from './buildQuestionFilter';
import type { TranslationKey } from '$types';
import type { NominationAndQuestionTree } from '../nominationAndQuestionStore';
import type { SelectionTree } from '../selectionTree.type';

/**
 * Create a readable store that contains `FilterGroup`s for each `Election` and each `EntityType` included in `entityTypes`.
 *
 * NB. A store is used for these so that the filters are persisted between page refreshes. This also allows us to combine filtering with answering opinion questions in the future.
 *
 * @param nominationsAndQuestions - A store containing `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType`
 * @returns A `FilterGroup` for each `Election` and each `EntityType`.
 */
export function filterStore({
  nominationsAndQuestions,
  locale,
  t
}: {
  nominationsAndQuestions: Readable<NominationAndQuestionTree>;
  locale: Readable<string>;
  t: Readable<(key: TranslationKey) => string>;
}): Readable<FilterTree> {
  return derived(
    [nominationsAndQuestions, locale, t],
    ([nominationsAndQuestions, locale, t]) => {
      const tree: Partial<FilterTree> = {};

      for (const [electionId, electionContent] of Object.entries(nominationsAndQuestions)) {
        tree[electionId] = Object.fromEntries(
          Object.entries(electionContent).map(([entityType, { nominations, infoQuestions }]) => {
            const filters = new Array<Filter<MaybeWrappedEntityVariant, unknown>>();

            // Build parent nomination filters
            if (entityType !== ENTITY_TYPE.Alliance) {
              filters.push(
                ...buildParentFilters({
                  nominations,
                  names: {
                    alliance: ucFirst(t('common.alliance.singular')),
                    faction: ucFirst(t('common.faction.singular')),
                    organization: ucFirst(t('common.organization.singular'))
                  },
                  locale
                })
              );
            }

            // Build info question filters
            const filterableQuestions = infoQuestions.filter((q) => getCustomData(q).filterable);
            filters.push(
              ...filterableQuestions.map((q) => buildQuestionFilter({ question: q, locale })).filter((f) => f != null)
            );

            return [entityType, new FilterGroup(filters)];
          })
        );
      }
      return tree as FilterTree;
    },
    {} as FilterTree
  );
}

/**
 * Contains the filters for each `Election` and each `EntityType`.
 */
export type FilterTree = SelectionTree<FilterGroup<MaybeWrappedEntityVariant>>;
