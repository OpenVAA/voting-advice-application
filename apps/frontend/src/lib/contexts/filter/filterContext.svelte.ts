import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import { parseParams } from '$lib/utils/route';
import type { FilterGroup } from '@openvaa/filters';
import type { FilterContext, InitFilterContextArgs } from './filterContext.type';

const CONTEXT_KEY = Symbol();

/**
 * Get the active `FilterContext` for the current voter session. Throws a
 * status-500 error if `initFilterContext()` has not yet been called.
 *
 * Used both as the direct entry point (e.g. for the future LLM chat surface)
 * and as the implementation of the `filterContext` accessor on `VoterContext`
 * (per D-05).
 */
export function getFilterContext(): FilterContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getFilterContext() called before initFilterContext()');
  return getContext<FilterContext>(CONTEXT_KEY);
}

/**
 * Initialise the `FilterContext`. Must be called exactly once per voter session
 * (typically from `initVoterContext()` per D-05). Throws status-500 on a
 * second invocation.
 *
 * The `entityFilters` getter closes over the `FilterTree` built by
 * `filterStore()` inside `voterContext`. Scope is derived from
 * `page.params.electionId` + `page.params.entityTypePlural` (D-14: a different
 * tuple yields a different `FilterGroup` reference, implicitly resetting
 * filter state per the existing `filterStore` rebuild semantics).
 *
 * Reactivity bridge (RESEARCH.md §Pattern 1, Pitfall 1): `FilterGroup.filters[i]._rules`
 * is plain JS, not `$state`. Subscribing to `FilterGroup.onChange` and bumping
 * a `$state` version counter is the minimum-ceremony bridge that lets any
 * `$derived` consumer re-run on filter mutation. The `$effect` that attaches
 * the listener returns a cleanup that detaches it on scope change (Pitfall 2).
 */
export function initFilterContext({ entityFilters }: InitFilterContextArgs): FilterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initFilterContext() called for a second time');

  // Version counter — incremented on every FilterGroup.onChange. Read inside
  // any consumer $derived (or via fctx.version) to subscribe.
  let version = $state(0);

  // The active FilterGroup, derived from the URL scope tuple. The `void version`
  // read here is a defensive dependency edge — it ensures a $derived that ONLY
  // reads filterGroup (not version) still re-runs when a filter mutation bumps
  // version, which is the contract the EntityListWithControls $derived relies on.
  //
  // We use `parseParams(page)` (matching the `paramStore` analog in
  // `voterContext`) instead of `page.params.X` directly, because:
  //   1. `electionId` is a persistent search param today (URL `?electionId=...`)
  //      and may also become a route param in Plan 62-02. `parseParams` merges
  //      both surfaces transparently.
  //   2. `entityTypePlural` is a future route param (added by Plan 62-02). The
  //      `Partial<Params>` return type uses an indexed `Record<string, ...>`
  //      fallback so accessing it before the param exists is type-safe.
  //
  // Plural→singular mapping uses American spelling per RESEARCH Open Question 1.
  const _filterGroup = $derived.by<FilterGroup<MaybeWrappedEntityVariant> | undefined>(() => {
    void version;
    const tree = entityFilters();
    const params = parseParams(page);
    const electionIdRaw = params.electionId;
    const electionId = Array.isArray(electionIdRaw) ? electionIdRaw[0] : electionIdRaw;
    const pluralRaw = params.entityTypePlural;
    const plural = Array.isArray(pluralRaw) ? pluralRaw[0] : pluralRaw;
    const entityType =
      plural === 'candidates' ? 'candidate' : plural === 'organizations' ? 'organization' : undefined;
    if (!electionId || !entityType) return undefined;
    return tree?.[electionId]?.[entityType];
  });

  // Bridge: attach onChange handler to the active FilterGroup. The $effect
  // re-runs when _filterGroup changes (scope change), so the cleanup return
  // detaches the handler from the old group before the new one is attached
  // (RESEARCH.md §Pitfall 2 — leaked handlers without cleanup).
  $effect(() => {
    const fg = _filterGroup;
    if (!fg) return;
    const handler = () => {
      version++;
    };
    fg.onChange(handler, true);
    return () => fg.onChange(handler, false);
  });

  const ctx: FilterContext = {
    get filterGroup() {
      return _filterGroup;
    },
    get version() {
      return version;
    },
    setFilter(id, value) {
      const f = _filterGroup?.filters.find((x) => x.name === id);
      // Filter.setRule expects Partial<FilterRule<T>>; the consumer passes a
      // pre-shaped rule. Per D-06 this is a thin pass-through — UI flows still
      // call filter.setRule() directly via the EntityFilters component; this
      // surface is primarily for the future LLM chat integration.
      (f as unknown as { setRule?: (v: unknown) => void } | undefined)?.setRule?.(value);
    },
    resetFilters() {
      _filterGroup?.reset();
    },
    addFilter(_spec) {
      // eslint-disable-next-line no-console
      console.warn(
        'filterContext.addFilter() is not implemented in Phase 62 — see D-06 (future LLM chat follow-up).'
      );
    },
    removeFilter(_id) {
      // eslint-disable-next-line no-console
      console.warn(
        'filterContext.removeFilter() is not implemented in Phase 62 — see D-06 (future LLM chat follow-up).'
      );
    }
  };

  return setContext<FilterContext>(CONTEXT_KEY, ctx);
}
