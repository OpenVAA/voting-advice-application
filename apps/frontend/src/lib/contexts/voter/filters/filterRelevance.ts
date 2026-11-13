import { log } from '@openvaa/app-shared';
import { isMissing, MISSING_VALUE } from '@openvaa/filters';
import type { Filter } from '@openvaa/filters';

/**
 * The number of distinct values a filter's own population must produce before the filter is worth offering.
 *
 * A filter whose whole population collapses to a single value can only ever return everybody or nobody, so it is noise rather than a control.
 * By operator ruling a MISSING answer counts as one distinct value of its own, shared by every non-answering target rather than counted once per non-answerer.
 * That is why a question nobody answered loses its filter, while a unanimously-answered question with a single skipper keeps one, showing its one answer row plus "No answer".
 */
export const MIN_DISTINCT_ANSWERS = 2;

/**
 * Count the distinct values a filter's targets produce for it.
 *
 * Each target contributes exactly one key. A target with no value at all contributes the `MISSING_VALUE` sentinel OBJECT, and every other target contributes the `JSON.stringify` canonicalisation of its de-duplicated, sorted non-missing values. The two key families are structurally disjoint, an object identity versus a family of strings, so no answer can ever collide with the missing sentinel. That disjointness is what keeps "did not answer" apart from "answered with nothing", whose canonical key is the empty JSON array.
 *
 * @param filter - The filter whose relevance is being measured.
 * @param targets - The entities of ONE entity type, the same array the tab renders.
 * @returns The number of distinct values, where missing counts once.
 */
export function countDistinctAnswers({
  filter,
  targets
}: {
  filter: Filter<MaybeWrappedEntityVariant, unknown>;
  targets: Array<MaybeWrappedEntityVariant>;
}): number {
  const keys = new Set<unknown>();

  for (const target of targets) {
    let raw: unknown;
    try {
      raw = filter.getValue(target);
    } catch (e) {
      // Never log the extracted value or the target entity here: both carry candidate and organization answer data, and the browser console sanitises nothing.
      log.debug('Filter relevance: could not read a value from a target', {
        filter: filter.name,
        err: e
      });
      keys.add(MISSING_VALUE);
      continue;
    }

    // Normalise to the array form, which carries everything the classification needs for both the single-value and the multi-value branch of `Filter.getValue()`.
    const values = Array.isArray(raw) ? raw : [raw];

    // Classify BEFORE reducing. A non-empty array of nothing but missing members is "did not answer"; an array that started empty falls through to the canonicalisation below and becomes "answered with nothing", which is a different fact.
    if (values.length > 0 && values.every((value) => isMissing(value))) {
      keys.add(MISSING_VALUE);
      continue;
    }

    const answered = [...new Set(values.filter((value) => !isMissing(value)))].sort();
    keys.add(JSON.stringify(answered));
  }

  return keys.size;
}

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
    const distinct = countDistinctAnswers({ filter, targets });
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
