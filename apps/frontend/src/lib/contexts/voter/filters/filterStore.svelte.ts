import { getCustomData } from '@openvaa/app-shared';
import { ENTITY_TYPE } from '@openvaa/data';
import { FilterGroup } from '@openvaa/filters';
import { ucFirst } from '$lib/utils/text/ucFirst';
import { buildParentFilters } from './buildParentFilters';
import { buildQuestionFilter } from './buildQuestionFilter';
import type { Filter } from '@openvaa/filters';
import type { TranslationKey } from '$types';
import type { NominationAndQuestionTree } from '../nominationAndQuestionStore.svelte';
import type { SelectionTree } from '../selectionTree.type';

/**
 * Create a reactive value that contains `FilterGroup`s for each `Election` and each `EntityType` included in `entityTypes`.
 *
 * @param nominationsAndQuestions - A getter returning `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType`
 * @param locale - A getter returning the current locale string.
 * @param t - A getter returning the translation function.
 * @returns A reactive filter tree value.
 */
export function filterStore({
  nominationsAndQuestions,
  locale,
  t
}: {
  nominationsAndQuestions: () => NominationAndQuestionTree;
  locale: () => string;
  t: () => (key: TranslationKey) => string;
}): { readonly value: FilterTree } {
  const _value = $derived.by(() => {
    const nq = nominationsAndQuestions();
    const currentLocale = locale();
    const currentT = t();
    if (!nq || !currentLocale || !currentT) return {} as FilterTree;
    const tree: Partial<FilterTree> = {};
    for (const [electionId, electionContent] of Object.entries(nq)) {
      tree[electionId] = Object.fromEntries(
        Object.entries(electionContent).map(([entityType, { nominations, infoQuestions }]) => {
          const filters = new Array<Filter<MaybeWrappedEntityVariant, unknown>>();

          // Build parent nomination filters
          if (entityType !== ENTITY_TYPE.Alliance) {
            filters.push(
              ...buildParentFilters({
                nominations,
                names: {
                  alliance: ucFirst(currentT('common.alliance.singular')),
                  faction: ucFirst(currentT('common.faction.singular')),
                  organization: ucFirst(currentT('common.organization.singular'))
                },
                locale: currentLocale
              })
            );
          }

          // Build info question filters
          const filterableQuestions = infoQuestions.filter((q) => getCustomData(q).filterable);
          filters.push(
            ...filterableQuestions
              .map((q) => buildQuestionFilter({ question: q, locale: currentLocale }))
              .filter((f) => f != null)
          );

          return [entityType, new FilterGroup(filters)];
        })
      );
    }
    return tree as FilterTree;
  });

  return {
    get value() {
      return _value;
    }
  };
}

/**
 * Contains the filters for each `Election` and each `EntityType`.
 */
export type FilterTree = SelectionTree<FilterGroup<MaybeWrappedEntityVariant>>;
