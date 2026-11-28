import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import { entityTypeForPlural, parseParams } from '$lib/routes';
import type { FilterGroup } from '@openvaa/filters';
import type { FilterContext, InitFilterContextArgs } from './filterContext.type';

const CONTEXT_KEY = Symbol();

/**
 * Get the active `FilterContext` for the current voter session. Throws a status-500 error if `initFilterContext()` has not yet been called.
 */
export function getFilterContext(): FilterContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getFilterContext() called before initFilterContext()');
  return getContext<FilterContext>(CONTEXT_KEY);
}

/**
 * `FilterContext` as a Svelte 5 CLASS — a version-bridge over a non-rune `FilterGroup`. The reactive core is the private `#version` `$state` field, bumped on every `FilterGroup.onChange` — `FilterGroup.filters[i]._rules` is plain JS, not `$state`, so the version counter is the minimum-ceremony bridge into `$derived` reactivity (the same bridge as `dataContext`).
 * The version-bridge does NOT simplify away.
 *
 * Class-shape choices:
 *  - reactive projection in `$derived` field: `#filterGroup` is a `$derived` FIELD (init/projection goes in a `$derived`, never an init `$effect`); its `void this.#version` read is the defensive dependency edge so a consumer `$derived` that reads only `filterGroup` still re-runs on a filter mutation.
 *  - sanctioned exception — constructor `$effect`. The `onChange` bridge lives in an `$effect` in the CONSTRUCTOR. This is legal ONLY because the class is instantiated by `initFilterContext()` / `initVoterContext()` during component init (an effect context); the `$effect`'s cleanup detaches the handler on scope change. NB: a class with `$effect` in its constructor can only be constructed inside an effect context — which is exactly the case.
 *  - Prototype getters are spread-safe here: the handles are NOT spread by any consumer (read via `fctx.version` / `fctx.filterGroup`, never `{ ...fctx }`), so a prototype accessor is not dropped — unlike dataContext's appContext spread.
 */
class FilterContextProvider implements FilterContext {
  #version = $state(0);
  readonly #entityFilters: InitFilterContextArgs['entityFilters'];
  readonly #currentEntityType: InitFilterContextArgs['currentEntityType'];

  // The active FilterGroup, derived from the URL scope tuple (reactive projection in a `$derived` field). `void this.#version` is the version-bridge defensive edge: it ensures a $derived that reads ONLY filterGroup still re-runs on filter mutation.
  // We use `parseParams(page)` so the persistent `?electionId=` search param and the route-side `entityTab` key are merged transparently. When `currentEntityType` is injected (production path), prefer it over the URL-derived plural so the results route need not force-fill `entityTab` into the URL; fall back to the URL scope when absent.
  readonly #filterGroup = $derived.by<FilterGroup<MaybeWrappedEntityVariant> | undefined>(() => {
    void this.#version;
    const tree = this.#entityFilters();
    const params = parseParams(page);
    const electionIdRaw = params.electionId;
    const electionId = Array.isArray(electionIdRaw) ? electionIdRaw[0] : electionIdRaw;
    let entityType = this.#currentEntityType?.();
    if (!entityType) {
      const pluralRaw = params.entityTab;
      const plural = Array.isArray(pluralRaw) ? pluralRaw[0] : pluralRaw;
      entityType = entityTypeForPlural(plural);
    }
    if (!electionId || !entityType) return undefined;
    return tree?.[electionId]?.[entityType];
  });

  constructor({ entityFilters, currentEntityType }: InitFilterContextArgs) {
    this.#entityFilters = entityFilters;
    this.#currentEntityType = currentEntityType;

    // sanctioned exception — constructor `$effect` is legal ONLY because `initFilterContext()` runs during component init (an effect context). Bridge: attach an onChange handler to the active FilterGroup. The $effect re-runs when #filterGroup changes (scope change), so the cleanup detaches the handler from the old group before the new one is attached.
    $effect(() => {
      const fg = this.#filterGroup;
      if (!fg) return;
      const handler = () => {
        this.#version++;
      };
      fg.onChange(handler, true);
      return () => fg.onChange(handler, false);
    });
  }

  get filterGroup(): FilterGroup<MaybeWrappedEntityVariant> | undefined {
    return this.#filterGroup;
  }

  get version(): number {
    return this.#version;
  }
}

/**
 * Initialise the `FilterContext`. Must be called exactly once per voter session (typically from `initVoterContext()`). Throws status-500 on a second invocation.
 */
export function initFilterContext(args: InitFilterContextArgs): FilterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initFilterContext() called for a second time');
  return setContext<FilterContext>(CONTEXT_KEY, new FilterContextProvider(args));
}
