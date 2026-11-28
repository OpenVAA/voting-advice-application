import { log } from '@openvaa/app-shared';
import type { Filter } from '@openvaa/filters';

/**
 * The number of distinct values a filter's own population must produce before the filter is worth offering.
 *
 * A filter whose whole population collapses to a single value can only ever return everybody or nobody, so it is noise rather than a control.
 * A missing answer counts as one distinct value of its own, shared by every non-answering target rather than counted once per non-answerer.
 * That is why a question nobody answered loses its filter, while a unanimously-answered question with a single skipper keeps one, showing its one answer row plus "No answer".
 */
export const MIN_DISTINCT_ANSWERS = 2;

/**
 * Drop the filters whose own population cannot distinguish between its targets.
 *
 * @param filters - The filters assembled for one entity type, in display order.
 * @param targets - The entities of that entity type.
 * @returns The subset worth offering, in the input order.
 */
export function retainRelevantFilters({
  filters,
  targets
}: {
  filters: Array<Filter<MaybeWrappedEntityVariant, unknown>>;
  targets: Array<MaybeWrappedEntityVariant>;
}): Array<Filter<MaybeWrappedEntityVariant, unknown>> {
  return filters.filter((filter) => {
    const distinct = filter.countDistinctValues(targets);
    if (distinct >= MIN_DISTINCT_ANSWERS) return true;
    // The payload names the filter and the count only, never a value, so "my filter disappeared" is a one-glance diagnosis without publishing answer data.
    log.debug('Filter relevance: dropping a filter whose targets produce too few distinct values', {
      filter: filter.name,
      distinct,
      threshold: MIN_DISTINCT_ANSWERS
    });
    return false;
  });
}
