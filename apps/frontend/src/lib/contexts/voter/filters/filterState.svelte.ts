import { getCustomData } from '@openvaa/app-shared';
import { ENTITY_TYPE } from '@openvaa/data';
import { FilterGroup } from '@openvaa/filters';
import { ucFirst } from '$lib/utils/text/ucFirst';
import { buildParentFilters } from './buildParentFilters';
import { buildQuestionFilter } from './buildQuestionFilter';
import { retainRelevantFilters } from './filterRelevance';
import type { Filter } from '@openvaa/filters';
import type { TranslationKey } from '$types';
import type { NominationAndQuestionTree } from '../nominationAndQuestionState.svelte';
import type { SelectionTree } from '../selectionTree.type';

/**
 * Create a reactive value that contains `FilterGroup`s for each `Election` and each `EntityType` included in `entityTypes`.
 *
 * @param nominationsAndQuestions - A getter returning `Nomination`s, info and opinion `Question`s for each `Election` and each `EntityType`
 * @param locale - A getter returning the current locale string.
 * @param t - A getter returning the translation function.
 * @returns A reactive filter tree value.
 */
type FilterStateDeps = {
  nominationsAndQuestions: () => NominationAndQuestionTree;
  locale: () => string;
  t: () => (key: TranslationKey) => string;
};

class FilterStateImpl {
  #deps: FilterStateDeps;

  constructor(deps: FilterStateDeps) {
    this.#deps = deps;
  }

  #value = $derived.by(() => {
    const nq = this.#deps.nominationsAndQuestions();
    const currentLocale = this.#deps.locale();
    const currentT = this.#deps.t();
    if (!nq || !currentLocale || !currentT) return {} as FilterTree;
    const tree: Partial<FilterTree> = {};
    for (const [electionId, electionContent] of Object.entries(nq)) {
      tree[electionId] = Object.fromEntries(
        Object.entries(electionContent).map(([entityType, { nominations, infoQuestions, opinionQuestions }]) => {
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

          // Build question filters from any question (info or opinion) flagged `filterable: true`. Opinion-category questions with the flag let voters narrow results by candidate answer to a specific question.
          const filterableQuestions = [...infoQuestions, ...opinionQuestions].filter(
            (q) => getCustomData(q).filterable
          );
          filters.push(
            ...filterableQuestions
              .map((q) => buildQuestionFilter({ question: q, locale: currentLocale }))
              .filter((f) => f != null)
          );

          // Offer a filter only when THIS entity type's own nominations produce more than one distinct value for it. A question that declares no `entityType` restriction applies to every entity type, so without this pass the organizations and alliances tabs are offered candidate-facing filters their entities never answered. The pass is purely subtractive over the filters assembled above, and an entity type left with none loses the whole filter affordance, because both list controls gate the Button and the Modal on `filterGroup.filters.length`.
          return [entityType, new FilterGroup(retainRelevantFilters({ filters, targets: nominations }))];
        })
      );
    }
    return tree as FilterTree;
  });

  get value(): FilterTree {
    return this.#value;
  }
}

export function filterState(deps: FilterStateDeps): { readonly value: FilterTree } {
  return new FilterStateImpl(deps);
}

/**
 * Contains the filters for each `Election` and each `EntityType`.
 */
export type FilterTree = SelectionTree<FilterGroup<MaybeWrappedEntityVariant>>;
