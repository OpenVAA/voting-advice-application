# Phase 62: Results Page Consolidation - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 14 (7 new, 5 modified, 2 deleted)
**Analogs found:** 14 / 14

This map pins the closest existing analog and the concrete excerpt to copy for every file touched in Phase 62. The planner should cite these file+line references in plan action items rather than restating the patterns abstractly.

Note on CONTEXT.md British-spelling vs codebase spelling: CONTEXT.md §Decisions uses `organisations` / `organisation`; the codebase (ENTITY_TYPE enum, i18n keys, app settings) is uniformly American (`organization` / `organizations`). RESEARCH.md Open Question 1 RESOLVED = use American spelling. All matcher accept-sets and route segments below reflect American spelling — do not carry the British spelling from CONTEXT.md into code.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` (new) | provider (Svelte context module) | pub-sub + transform | `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` + `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` (version-counter bridge) | exact (role) + role-match (bridge) |
| `apps/frontend/src/lib/contexts/filter/filterContext.type.ts` (new) | type | — | `apps/frontend/src/lib/contexts/voter/voterContext.type.ts` | exact |
| `apps/frontend/src/lib/contexts/filter/index.ts` (new) | config (barrel) | — | `apps/frontend/src/lib/contexts/app/index.ts` | exact |
| `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (modified) | provider | pub-sub | self — extend composition pattern at lines 41-42, 276-332 | self-reference |
| `apps/frontend/src/lib/contexts/voter/voterContext.type.ts` (modified) | type | — | self — extend the `entityFilters: FilterTree` accessor block at lines 48-51 | self-reference |
| `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` (new) | component | request-response (derived over reactive state) | `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` (visual idiom) + `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` lines 33-45 ($derived via version counter) + `apps/frontend/src/routes/+layout.svelte` lines 82-133 ($derived + dedicated $effect split) | exact (layout) + role-match (reactivity) |
| `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts` (new) | type | — | `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.type.ts` | exact |
| `apps/frontend/src/lib/dynamic-components/entityList/index.ts` (modified) | config (barrel) | — | self — add export alongside existing lines 1-4 | self-reference |
| `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` (retained on disk) | component | — | Kept — file stays (2 external callers); results-layout import is removed | no change |
| `apps/frontend/src/params/entityTypePlural.ts` (new) | route (param matcher) | request-response | `apps/frontend/src/params/entityType.ts` | exact |
| `apps/frontend/src/params/entityTypeSingular.ts` (new) | route (param matcher) | request-response | `apps/frontend/src/params/entityType.ts` | exact |
| `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` (refactored) | component (route) | request-response | self — retain structural skeleton at lines 46-61, 191-306; replace tab+drawer wiring per Patterns 3-4 | self-reference |
| `apps/frontend/src/routes/(voters)/(located)/results/+page.svelte` (deleted) | route | — | — | deletion (matches stub at `results/+page.svelte:1-9`) |
| `apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` (deleted) | component (route) | request-response | Superseded by new shape | deletion |
| `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.svelte` (new) | component (route) | request-response | `apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` lines 24-109 | exact |
| `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.ts` (new) | route (load function) | request-response | No local analog exists for coupling-guard + streaming load; RESEARCH §Pattern 5 supplies the idiom | no analog (use RESEARCH) |
| `apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts` (new, Wave 0) | test | — | `apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts` | exact |
| `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts` (new, Wave 0) | test | — | `apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts` (vitest+jsdom) | role-match |
| `apps/frontend/src/params/entityTypePlural.test.ts` / `entityTypeSingular.test.ts` (new, Wave 0) | test | — | No existing matcher test; use `apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts` for vitest shape | role-match |
| `tests/tests/specs/voter/voter-results.spec.ts` (extended) | test (E2E) | — | self — extend `describe('voter results')` block | self-reference |

---

## Pattern Assignments

### `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` (provider, pub-sub + transform)

**Analog 1:** `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — Symbol-keyed `setContext`/`getContext` + inheritance pattern
**Analog 2:** `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` — version-counter bridge for non-`$state` backed imperative change emitters (directly applicable to `FilterGroup.onChange`)

**Imports + context-key pattern** (voterContext.svelte.ts lines 1-28):
```ts
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext, untrack } from 'svelte';
// ... other feature imports
import { getAppContext } from '../../contexts/app';

const CONTEXT_KEY = Symbol();

export function getVoterContext(): VoterContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getVoterContext() called before initVoterContext()');
  return getContext<VoterContext>(CONTEXT_KEY);
}

export function initVoterContext(): VoterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initVoterContext() called for a second time');
  // ... construction
  return setContext<VoterContext>(CONTEXT_KEY, { /* ... */ });
}
```
Copy verbatim, swap `Voter` → `Filter`, swap message strings, keep the `error(500, ...)` fail-fast shape.

**Core pattern — version-counter bridge over imperative `subscribe`/`onChange`** (dataContext.svelte.ts lines 33-45):
```ts
// Version counter: $state incremented on every DataRoot update.
// This bridges DataRoot's imperative subscribe() notifications to $derived reactivity.
let version = $state(0);

// Subscribe to DataRoot's imperative change notifications
dataRoot.subscribe(() => {
  version++;
});

// Derived value that re-evaluates when version changes
const dataRootReactive = $derived.by(() => {
  void version; // Read version to create dependency
  return dataRoot;
});
```
**This is the exact shape the filterContext's `FilterGroup.onChange` bridge must copy.** The consumer `$derived` reads `version` (via `void version;` or `fctx.version;`) to subscribe; the context's `$effect` attaches/detaches `onChange` handlers on scope change with a cleanup closure. See Pattern 1 of RESEARCH.md and Pitfall 2 (leaked handlers without cleanup).

**Scope-driven derived (voterContext.svelte.ts lines 55-67, 253-257):**
```ts
const _electionId = paramStore('electionId');
// paramStore is a $derived over page.params — see paramStore.svelte.ts below
// ...
const _entityFilters = filterStore({
  nominationsAndQuestions: () => _nominationsAndQuestions.value,
  locale: () => localeState.current,
  t: () => t
});
```
filterContext composes on top of voterContext's already-built `FilterTree` — do NOT re-build the tree.

**Return / setContext pattern (voterContext.svelte.ts lines 276-332):**
```ts
return setContext<VoterContext>(CONTEXT_KEY, {
  ...appContext,                              // inherits parent context
  algorithm,
  answers,
  get constituenciesSelectable() { return constituenciesSelectable; },
  // ... each $derived/$state exposed via a getter
  get entityFilters() { return _entityFilters.value; },
  // ...
});
```
Filter mutators (`setFilter`, `resetFilters`, `addFilter`, `removeFilter` per D-06) are plain methods on the return object — same shape as `resetVoterData` at voterContext.svelte.ts lines 263-270.

**Reactivity bridge — `paramStore` for scope key** (`apps/frontend/src/lib/contexts/utils/paramStore.svelte.ts` lines 1-19):
```ts
import { page } from '$app/state';
import { parseParams } from '$lib/utils/route';

export function paramStore<TParam extends Param>(
  param: TParam
): { readonly value: TParam extends ArrayParam ? Array<string> : string | undefined } {
  const _value = $derived(parseParams(page)[param] as TParam extends ArrayParam ? Array<string> : string | undefined);
  return {
    get value() { return _value; }
  };
}
```
filterContext uses this same shape to read `electionId` + `entityTypePlural` as a scope tuple; derived from it is the active `FilterGroup` reference inside the `FilterTree`.

---

### `apps/frontend/src/lib/contexts/filter/filterContext.type.ts` (type)

**Analog:** `apps/frontend/src/lib/contexts/voter/voterContext.type.ts` lines 1-85

**Import pattern (lines 1-8):**
```ts
import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
// ... feature types
import type { FilterTree } from './filters/filterStore.svelte';
```
filterContext.type.ts should import `FilterGroup` from `@openvaa/filters` and `FilterTree` from `$lib/contexts/voter/filters/filterStore.svelte` (the same shared package already consumed by voterContext).

**Shape pattern:**
```ts
export type VoterContext = AppContext & {
  algorithm: MatchingAlgorithm;
  /**
   * The voters `Answer`s to the `Question`s.
   */
  answers: AnswerStore;
  // ... TSDoc on every field
};
```
Do not extend an existing context in the type signature for filterContext — it stands alone (consumers get it either directly via `getFilterContext()` or via voterContext accessors per D-05). Each field gets a TSDoc block.

**Mutator signatures (D-06):**
- `filterGroup: FilterGroup<MaybeWrappedEntityVariant> | undefined` (undefined when scope is incomplete)
- `setFilter(id: string, value: unknown): void`
- `resetFilters(): void`
- `addFilter(spec: ...): void`
- `removeFilter(id: string): void`
- `version: number` (exposed read-only getter for the `$derived` dependency edge)

---

### `apps/frontend/src/lib/contexts/filter/index.ts` (barrel)

**Analog:** `apps/frontend/src/lib/contexts/app/index.ts` (full file, 4 lines):
```ts
export * from './appContext.svelte';
export * from './appContext.type';
export * from './appCustomization.type';
export * from './userPreferences.type';
```
Copy idiom verbatim: `export * from './filterContext.svelte';` + `export * from './filterContext.type';`. Per CLAUDE.md §Module Resolution the barrel is required for TypeScript project references to work.

---

### `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (MODIFIED)

**Analog:** self — add filterContext bundle at the same place where `_entityFilters` is constructed.

**Extension point 1 — call `initFilterContext` inside `initVoterContext` (after line 257 where `_entityFilters` is built):**
```ts
// Existing (lines 253-257):
const _entityFilters = filterStore({
  nominationsAndQuestions: () => _nominationsAndQuestions.value,
  locale: () => localeState.current,
  t: () => t
});

// NEW: initialize filterContext using the just-built FilterTree
initFilterContext({ entityFilters: () => _entityFilters.value });
```

**Extension point 2 — expose filterContext accessors on the return object (after line 288):**
Add getters for `filterGroup`, `setFilter`, etc. that delegate to `getFilterContext()`. The existing voterContext already composes AppContext via `...appContext` at line 277; the filterContext exposure is parallel but uses explicit delegation (not spread) because filterContext is a separate Symbol-keyed context that must be initialized with the FilterTree closure.

**Imports to add:**
```ts
import { getFilterContext, initFilterContext } from '$lib/contexts/filter';
```

---

### `apps/frontend/src/lib/contexts/voter/voterContext.type.ts` (MODIFIED)

**Analog:** self — extend the shape at lines 48-51 (the existing `entityFilters: FilterTree` block):
```ts
  /**
   * The currently active `EntityFilter`s for each `Election` and `EntityType`.
   */
  entityFilters: FilterTree;
```
Add a `filterContext: FilterContext` accessor block (typed by filterContext.type.ts import) OR keep `entityFilters` and spread mutator accessors inline per D-05's "ergonomic consumption via getVoterContext". Planner picks the surface shape; the analog idiom is TSDoc + explicit typed field per line.

---

### `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` (component, request-response)

**Analog 1 (visual idiom + controls layout):** `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` — full file, excluding the circular-chain at lines 56-73
**Analog 2 ($derived reactivity bridge):** `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` lines 33-45 (version-counter bridge)
**Analog 3 ($derived + dedicated $effect split; cleanup in $effect):** `apps/frontend/src/routes/+layout.svelte` lines 82-133

**Imports pattern (EntityListControls.svelte lines 27-39):**
```svelte
<script lang="ts">
  import { TextPropertyFilter } from '@openvaa/filters';
  import { slide } from 'svelte/transition';
  import { Button } from '$lib/components/button';
  import { EntityFilters } from '$lib/components/entityFilters';
  import { TextEntityFilter } from '$lib/components/entityFilters/text';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import type { EntityListControlsProps } from './EntityListControls.type';
```
**Change vs analog:** drop `import { onDestroy } from 'svelte';` (replaced by `$effect` cleanup), add `import { getFilterContext } from '$lib/contexts/filter';` (or accept `filterGroup` as a prop per D-02 additive contract), add `import { EntityList } from './EntityList';`.

**Props + $props destructure pattern (EntityListControls.svelte line 41):**
```svelte
let { entities, filterGroup, searchProperty = 'name', onUpdate, ...restProps }: EntityListControlsProps = $props();
```
EntityListWithControls changes: drop `onUpdate` (no more callback; filtering is $derived), make `filterGroup` optional (can come from filterContext), add `itemsPerPage` / `itemsTolerance` / `scrollIntoView` / `data-testid` to forward to the nested `<EntityList>`.

**$derived filter computation pattern (RESEARCH.md §Pattern 2 + Pattern 7):**
```svelte
<!-- DO THIS (replaces the broken lines 56-73 of EntityListControls.svelte) -->
const fctx = getFilterContext();
const filtered = $derived.by(() => {
  fctx.version;  // subscribe to version counter
  const group = filterGroup ?? fctx.filterGroup;
  const afterGroup = group ? group.apply(entities) : [...entities];
  return searchFilter ? searchFilter.apply(afterGroup) : afterGroup;
});

const numActiveFilters = $derived(
  (filterGroup ?? fctx.filterGroup)?.filters.filter((f) => f.active).length ?? 0
);
```

**$effect cleanup pattern for search filter onChange** (drawn from the RESEARCH.md Pitfall 2 idiom + the existing onDestroy cleanup at EntityListControls.svelte lines 64-67 which must migrate to $effect cleanup):
```svelte
let searchVersion = $state(0);
$effect(() => {
  if (!searchFilter) return;
  const h = () => { searchVersion++; };
  searchFilter.onChange(h, true);
  return () => searchFilter.onChange(h, false);  // cleanup on re-run / destroy
});
```

**Markup layout to copy verbatim (EntityListControls.svelte lines 96-145 then 147-161):**
```svelte
<div data-testid="entity-list-controls" {...concatClass(restProps, 'flex flex-col')}>
  <div class="mb-md gap-lg flex flex-row-reverse justify-between">
    {#if searchFilter}
      <TextEntityFilter
        filter={searchFilter}
        placeholder={t('entityList.controls.searchPlaceholder')}
        variant="discrete"
        class="grow"
        data-testid="entity-list-search" />
    {/if}
    {#if filterGroup?.filters.length}
      {#if numActiveFilters}
        <Button onclick={openFilters} color="warning" icon="filter" iconPos="left"
          class="!w-auto" data-testid="entity-list-filter"
          text={t('entityFilters.filterButtonLabel')}
          >{#snippet badge()}<InfoBadge text={numActiveFilters} />{/snippet}</Button>
      {:else}
        <Button onclick={openFilters} icon="filter" iconPos="left" class="!w-auto"
          data-testid="entity-list-filter" text={t('entityFilters.filterButtonLabel')} />
      {/if}
    {/if}
  </div>
  <!-- "Showing N results" / "No filter results" hints — lines 128-144 — copy verbatim -->
</div>

{#if filterGroup?.filters.length}
  <Modal bind:this={filtersModalRef} title={t('entityFilters.filters')}
    boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]" onClose={trackActiveFilters}>
    <EntityFilters {filterGroup} targets={entities} />
    {#snippet actions()}
      <div class="flex w-full flex-col items-center">
        <Button onclick={() => filtersModalRef?.closeModal()}
          text={t('entityFilters.applyAndClose')} variant="main" />
        <Button onclick={resetFilters} color="warning" disabled={!numActiveFilters}
          text={t('entityFilters.reset')} />
      </div>
    {/snippet}
  </Modal>
{/if}
```

**New append — `<EntityList>` below the controls block (D-01 + D-03 compound layout):**
```svelte
<EntityList
  cards={filtered.map((e) => ({ entity: e }))}
  class="mb-lg"
  data-testid="voter-results-list" />
```

**Anti-pattern to remove (EntityListControls.svelte lines 56-73 — the infinite-loop bug):**
```svelte
// DO NOT copy this shape:
filterGroup?.onChange(updateFilters);
searchFilter?.onChange(updateSearch);

$effect(() => {
  entities;
  updateFilters();
});

onDestroy(() => { /* cleanup */ });

function updateFilters() {
  filteredContents = filterGroup ? filterGroup.apply(entities) : [...entities];
  numActiveFilters = filterGroup ? filterGroup.filters.filter((f) => f.active).length : 0;
  updateSearch();
}
```
Replaced entirely by the `$derived` + `$effect`-cleanup-with-return pattern above. This is RESULTS-01 in one diff.

---

### `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts` (type)

**Analog:** `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.type.ts` lines 1-23:
```ts
import type { FilterGroup } from '@openvaa/filters';
import type { SvelteHTMLElements } from 'svelte/elements';

export type EntityListControlsProps<TEntity extends MaybeWrappedEntityVariant = MaybeWrappedEntityVariant> =
  SvelteHTMLElements['div'] & {
    entities: Array<TEntity>;
    filterGroup?: FilterGroup<TEntity>;
    searchProperty?: string;
    onUpdate: (filtered: Array<TEntity>) => void;
  };
```
**Modifications for the compound component:**
- Drop `onUpdate` (no callback in $derived model)
- Add forwarded EntityList props: `itemsPerPage?: number; itemsTolerance?: number; scrollIntoView?: boolean`
- Keep the generic `<TEntity extends MaybeWrappedEntityVariant = MaybeWrappedEntityVariant>` signature
- Keep `SvelteHTMLElements['div']` spread for `class`, `data-testid`, etc.

---

### `apps/frontend/src/lib/dynamic-components/entityList/index.ts` (MODIFIED barrel)

**Analog:** self — current state (lines 1-4):
```ts
export { default as EntityList } from './EntityList.svelte';
export * from './EntityList.type';
export { default as EntityListControls } from './EntityListControls.svelte';
export * from './EntityListControls.type';
```
**Add (additive per D-02 — do NOT remove EntityListControls exports, 2 external callers depend on them per RESEARCH §Runtime State Inventory):**
```ts
export { default as EntityListWithControls } from './EntityListWithControls.svelte';
export * from './EntityListWithControls.type';
```

---

### `apps/frontend/src/params/entityTypePlural.ts` (route / param matcher)

**Analog:** `apps/frontend/src/params/entityType.ts` — full file:
```ts
/**
 * Matches an entity type
 */
export function match(param: string) {
  return ['candidate', 'party'].includes(param);
}
```
**Copy exactly for entityTypePlural (American spelling per Open Question 1 RESOLVED):**
```ts
/**
 * Matches a plural entity type segment used as the list-view scope in /results.
 */
export function match(param: string): param is 'candidates' | 'organizations' {
  return param === 'candidates' || param === 'organizations';
}
```
Prefer the `param is 'candidates' | 'organizations'` type predicate over the existing `.includes()` form — gives downstream `page.params.entityTypePlural` a narrowed union type instead of `string`. RESEARCH §Pattern 4 shows this idiom with `ParamMatcher`; direct `param is ...` narrowing is the same contract.

**Filename ↔ folder bracket coupling** (RESEARCH Pitfall 7): the folder must be `[[entityTypePlural=entityTypePlural]]` — matcher name inside the `=` must match the filename (`entityTypePlural.ts`), not an ad-hoc alias.

---

### `apps/frontend/src/params/entityTypeSingular.ts` (route / param matcher)

**Analog:** `apps/frontend/src/params/entityType.ts` — same template.

**Copy:**
```ts
/**
 * Matches a singular entity type segment used as the drawer-entity type in /results.
 */
export function match(param: string): param is 'candidate' | 'organization' {
  return param === 'candidate' || param === 'organization';
}
```
Note: the existing `entityType.ts` accepts `party` (RESEARCH Open Question 2 RESOLVED = dead legacy). Do not copy `party` into the new singular matcher — use `organization`.

---

### `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` (REFACTORED)

**Analog:** self — retain structural skeleton lines 46-61 (context destructure), 67-86 (tracking effects), 191-306 (markup tree); replace tabs+drawer+list wiring per D-09, D-13, D-15.

**Context destructure pattern to keep (lines 46-61):**
```svelte
const {
  answers,
  appSettings,
  constituenciesSelectable,
  dataRoot,
  getRoute,
  matches,
  nominationsAvailable,
  resultsAvailable,
  selectedConstituencies: constituencies,
  selectedElections: elections,
  startEvent,
  startFeedbackPopupCountdown,
  startSurveyPopupCountdown,
  t
} = getVoterContext();
```
Add `getFilterContext` accessors (via voterContext bundle per D-05 — or direct call).

**Active-tab URL-driven pattern (RESEARCH §Pattern 3, applied to this file):**
```svelte
// REMOVE (lines 94-113):
let activeElectionId = $state<Id | undefined>(undefined);
let activeElection = $state<Election>();
let activeEntityType = $state<EntityType | undefined>(undefined);
// ... $effect blocks mutating these on render

// REPLACE WITH:
const activeElectionId = $derived<Id | undefined>(page.params.electionId);
const activeEntityType = $derived<EntityType | undefined>(() => {
  const plural = page.params.entityTypePlural;
  return plural === 'candidates' ? 'candidate' : plural === 'organizations' ? 'organization' : undefined;
});
const activeElection = $derived(elections.find((e) => e.id === activeElectionId));
const activeMatches = $derived(
  activeElectionId && activeEntityType ? matches[activeElectionId]?.[activeEntityType] : undefined
);
```

**Drawer visibility — $derived over page.params (D-09):**
```svelte
// REPLACE the existing isEntityDetail + drawerEntity logic (lines 150-173)
const drawerVisible = $derived(!!(page.params.entityTypeSingular && page.params.id));
const drawerEntity = $derived.by<MaybeWrappedEntityVariant | undefined>(() => {
  if (!drawerVisible) return undefined;
  const entityType = page.params.entityTypeSingular as EntityType;
  const entityId = page.params.id!;
  try {
    const { entity } = getEntityAndTitle({
      dataRoot: $dataRoot, matches, entityType, entityId,
      nominationId: page.url.searchParams.get('nominationId') ?? undefined
    });
    return entity;
  } catch (e) {
    logDebugError(`Could not get entity details for ${entityType} ${entityId}. Error: ${e instanceof Error ? e.message : '-'}`);
    return undefined;
  }
});
```
Preserve the existing `logDebugError` catch shape (lines 167-172) verbatim — silent degradation is the contract per UI-SPEC Empty State Inventory.

**URL-driven handlers (replace lines 135-188):**
```svelte
function handleElectionChange(details: { option: unknown }): void {
  const { id } = details.option as Election;
  const plural = page.params.entityTypePlural ?? 'candidates';
  goto(`/results/${id}/${plural}`);
  startEvent('results_changeElection', { election: id });
}

function handleEntityTabChange({ tab }: { tab: Tab }): void {
  const plural = (tab as EntityTab).type === 'candidate' ? 'candidates' : 'organizations';
  goto(`/results/${page.params.electionId}/${plural}`);
  startEvent('results_changeTab', { section: (tab as EntityTab).type });
}

function handleDrawerClose(): void {
  const { electionId, entityTypePlural } = page.params;
  goto(`/results/${electionId}/${entityTypePlural ?? 'candidates'}`);
}
```

**Tab activeIndex — non-bound prop (RESEARCH §Pitfall 3):**
```svelte
// DO NOT bind:activeIndex — $derived is not writable.
const initialEntityTabIndex = $derived(entityTabs.findIndex((t) => t.type === activeEntityType));
// Pass non-bound:
<Tabs tabs={entityTabs} activeIndex={initialEntityTabIndex} onChange={handleEntityTabChange} ... />
```

**EntityList → EntityListWithControls swap (RESULTS-02 re-enable filters) — line 270:**
```svelte
<!-- BEFORE (with TODO comment at line 269): -->
<EntityList cards={activeMatches.map((e) => ({ entity: e }))} class="mb-lg" data-testid="voter-results-list" />

<!-- AFTER (controls above, list below, compound): -->
<EntityListWithControls entities={activeMatches} class="mb-lg mx-10" data-testid="voter-results-list" />
```
`EntityListWithControls` pulls its FilterGroup from filterContext (scoped via the URL params per D-14). No `onUpdate` callback, no local `filteredEntities` state. Delete the TODO comment at line 269.

**Tracking effects to preserve verbatim (lines 78-86, 175-184):**
Per RESEARCH §Pitfall 6, these are sibling concerns not touched by the refactor. Keep the `$effect` blocks for `startFeedbackPopupCountdown` / `startSurveyPopupCountdown` / drawer tracking events — only update the drawer-tracking `$effect` to read `drawerVisible` + `page.params.entityTypeSingular` instead of the old `isEntityDetail` + `page.params.entityType`.

---

### `apps/frontend/src/routes/(voters)/(located)/results/+page.svelte` (DELETED)

**Current content (lines 1-9)** is an 8-line stub. Remove the file and the folder entry in the new nested route will serve `/results/[electionId]`.

---

### `apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` (DELETED)

Superseded by the new `[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]/+page.svelte` shape. Delete the folder tree in the same commit that adds the new folder tree (RESEARCH §Pitfall 5 — do not split across commits).

---

### `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.svelte` (NEW)

**Analog:** `apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` lines 24-121 — for the single-card drawer detail page.

**Imports pattern to carry forward (lines 24-36):**
```svelte
<script lang="ts">
  import { isMatch } from '@openvaa/matching';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { EntityDetails } from '$lib/dynamic-components/entityDetails';
  import { getEntityAndTitle } from '$lib/utils/entityDetails';
  import { logDebugError } from '$lib/utils/logger';
  import SingleCardContent from '../../../../../SingleCardContent.svelte';
  import type { EntityType } from '@openvaa/data';
```
**Change:** drop `SingleCardContent` import if the new shape routes all rendering through the parent `+layout.svelte`'s drawer; this page may become minimal since the layout is responsible for drawer rendering. Planner decides based on D-10 drawer-first-paint mechanism (see Pattern 5 below).

**Page-style / top-bar pattern (lines 49-58):**
```svelte
pageStyles.push({ drawer: { background: 'bg-base-300' } });
topBarSettings.push({
  actions: {
    help: 'hide',
    feedback: 'hide',
    return: 'show',
    returnButtonLabel: t('common.back'),
    returnButtonCallback: () => goto($getRoute('Results'))
  }
});
```
Return-button callback should strip `entityTypeSingular` + `id` from the URL via `goto(`/results/${electionId}/${entityTypePlural ?? 'candidates'}`)` rather than the whole-results redirect — matches D-09 drawer-close semantics.

**Entity-lookup + tracking pattern (lines 66-86, 100-109) — read `page.params.entityTypeSingular`/`page.params.id`:**
Keep the `try { ... } catch (e) { handleError(...) }` shape. Change param names: `entityType` → `entityTypeSingular`; `entityId` → `id`.

---

### `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.ts` (NEW)

**Analog:** No local SvelteKit load function with redirect + coupling-guard pattern exists in this codebase that's a precise match. Use RESEARCH §Pattern 5 as the reference.

**Code from RESEARCH §Pattern 5 (exact shape to copy):**
```ts
import { redirect, error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
  const { entityTypeSingular, id, entityTypePlural, electionId } = params;

  // Coupling guard (D-11, Open Question 6 RESOLVED to preserve nominations gate in parent layout)
  if ((entityTypeSingular && !id) || (!entityTypeSingular && id)) {
    throw redirect(307, `/results/${electionId}/${entityTypePlural ?? 'candidates'}`);
  }

  // Parent layout has dataRoot + matches already loaded
  const { dataRoot } = await parent();

  // Drawer entity resolved synchronously — drives drawer-first paint per D-10
  const drawerEntity = entityTypeSingular && id
    ? dataRoot.tryGetEntity?.(entityTypeSingular, id)
    : undefined;

  return { drawerEntity };
};
```
**Drawer-first-paint mechanism (RESEARCH Open Question 4 RESOLVED = cheapest-first):** add `content-visibility: auto` class on the list container in `+layout.svelte` (source-order: drawer before list in markup). Only escalate to streaming SSR (return a promise for non-critical fields and use `{#await}` in markup) if Playwright trace gate fails. This `+page.ts` already supports the streaming shape by awaiting `parent()` and resolving the drawer entity synchronously — the list data comes from the parent layout's `+layout.ts` which is loaded in parallel.

---

### Test files (Wave 0 unit tests)

#### `apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts`

**Analog:** `apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts`

**Setup pattern (lines 1-60):**
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks
vi.mock('@openvaa/app-shared', () => ({
  staticSettings: { /* minimal */ }
}));
vi.mock('$lib/utils/logger', () => ({
  logDebugError: vi.fn()
}));

// Helper to re-import with fresh module cache per test
async function importFresh() {
  vi.resetModules();
  return await import('./filterContext.svelte');
}

describe('filterContext', () => {
  let mockStorageData: Record<string, string>;

  beforeEach(() => {
    vi.resetModules();
    // ... storage mocks (copy from persistedState lines 32-60)
  });
  // ...
});
```

**Contracts to test (RESEARCH.md §Validation Architecture + Open Question 5 RESOLVED):**
1. `initFilterContext` followed by `getFilterContext` returns the same object; calling `initFilterContext` twice throws; calling `getFilterContext` without init throws 500.
2. Version counter bumps when `filterGroup.filters[i].setRule(...)` is called — asserts the $derived re-run contract (Pitfall 1).
3. Scope change (mock different `page.params`) returns a different `FilterGroup` reference; previous scope's filters are not observed.
4. Mutator methods (`setFilter`, `resetFilters`) call through to the underlying FilterGroup.

#### `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts`

**Analog:** Existing vitest+jsdom tests with mocking (`persistedState.svelte.test.ts` setup shape). No existing `@testing-library/svelte` tests in the frontend, so either (a) use `@testing-library/svelte` if available, or (b) compose-unit-test the `$derived` computations by directly exercising the `$derived.by(...)` body via `createRoot()` + rune plumbing. Planner picks.

**Contracts:**
1. Given `entities` + `filterGroup` with an inactive filter, `filtered` returns `[...entities]`.
2. Filter rule mutation → `filtered` re-runs and shrinks (asserts the $derived + version-counter bridge).
3. No infinite loop (assertion: mutate filter N times, observe bounded $derived re-run count). Matches the smoke check in RESEARCH §Validation for RESULTS-01.

#### `apps/frontend/src/params/entityTypePlural.test.ts` + `entityTypeSingular.test.ts`

**Analog:** No existing matcher test. Use vitest shape from `persistedState.svelte.test.ts` minimally.

**Contracts:**
```ts
import { describe, expect, it } from 'vitest';
import { match } from './entityTypePlural';

describe('entityTypePlural matcher', () => {
  it('accepts candidates', () => expect(match('candidates')).toBe(true));
  it('accepts organizations', () => expect(match('organizations')).toBe(true));
  it('rejects candidate (singular)', () => expect(match('candidate')).toBe(false));
  it('rejects party', () => expect(match('party')).toBe(false));
  it('rejects empty', () => expect(match('')).toBe(false));
});
```

#### `tests/tests/specs/voter/voter-results.spec.ts` (EXTENDED)

**Analog:** self — append new `test('...')` blocks inside the existing `test.describe('voter results', { tag: ['@voter'] }, () => { ... })` block (file lines 29-83).

**Shape template (lines 30-46):**
```ts
test('should display candidates section with result cards', async ({ answeredVoterPage: page }) => {
  const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
  await expect(candidateSection).toBeVisible();
  // ... assertions
});
```

**New tests to add (one per RESEARCH §Validation row):**
- `filter toggle narrows candidate count` (RESULTS-02 smoke for infinite-loop absence)
- `filter state persists across drawer open/close` (D-15)
- `filter state resets on plural-tab switch` (D-14)
- `filter state resets on election switch` (D-14)
- `deeplink list+drawer URL renders both` (RESULTS-03)
- `deeplink org-list + candidate-drawer edge case` (RESULTS-03 D-08 shape 4)
- `browser Back/Forward steps through tab + drawer` (D-13)
- `invalid matcher value 404s` (D-11)
- `coupling rule: singular without id redirects to list` (D-11)

---

## Shared Patterns

### Context Setup (Symbol-keyed setContext/getContext)

**Source:** `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` lines 23-36 (+ appContext, componentContext, dataContext all use the identical shape)
**Apply to:** new `filterContext.svelte.ts`
```ts
const CONTEXT_KEY = Symbol();

export function getFooContext(): FooContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getFooContext() called before initFooContext()');
  return getContext<FooContext>(CONTEXT_KEY);
}

export function initFooContext(/* deps */): FooContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initFooContext() called for a second time');
  // ... build
  return setContext<FooContext>(CONTEXT_KEY, { /* ... */ });
}
```

### $derived reactivity bridge for imperative `subscribe`/`onChange` emitters

**Source:** `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` lines 33-45
**Apply to:** filterContext (FilterGroup.onChange), EntityListWithControls (searchFilter.onChange)
```ts
let version = $state(0);

$effect(() => {
  const target = /* the onChange emitter */;
  if (!target) return;
  const handler = () => { version++; };
  target.onChange(handler, true);
  return () => target.onChange(handler, false);  // cleanup — prevents Pitfall 2
});

const derivedValue = $derived.by(() => {
  void version;  // subscribe
  return target.apply(input);  // pure call; safe inside $derived
});
```
**Why this shape:** `FilterGroup.filters[i]._rules` is plain JS, not `$state`. Svelte 5's `$derived` does not track reads into plain JS fields. The version-counter is the minimum-ceremony bridge (Option B per RESEARCH Open Question 5 RESOLVED).

### $derived + dedicated $effect split (Phase 60 canonical)

**Source:** `apps/frontend/src/routes/+layout.svelte` lines 82-133
**Apply to:** EntityListWithControls.svelte, results/+layout.svelte refactor
```svelte
// $derived: pure computation with dependency tracking
const validity = $derived.by(() => { /* pure */ });

// $effect: side effects only; snapshot then untrack() to prevent loops
$effect(() => {
  if ('error' in validity) return;
  const snapshot = { /* pluck fields out of tracked scope */ };
  untrack(() => {
    // side effect — writes to stores, calls APIs, etc.
  });
});
```
**Why:** This pattern eliminated the `effect_update_depth_exceeded` class of bugs in Phase 60 and is the canonical shape for all new reactive code in this repo. Pure computation in `$derived`, side effects in `$effect` with `untrack()` for any writes that would otherwise feed back into the effect's dependency graph.

### URL as single source of truth for routable state (D-13)

**Source:** `apps/frontend/src/lib/contexts/utils/paramStore.svelte.ts` + `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` lines 65-67
**Apply to:** results/+layout.svelte tabs + drawer + election selector, filterContext scope key
```ts
const _electionId = paramStore('electionId');
// Consumers use `_electionId.value` — $derived over page.params[...]
```
`$page.params.X` (or `page` from `$app/state` at `+layout.svelte:19`) is the source. `$state` twin + `$effect` sync is explicitly the wrong shape (Pitfall at RESEARCH Anti-Patterns section).

### Param matcher (SvelteKit)

**Source:** `apps/frontend/src/params/entityType.ts` — full file (4 lines)
**Apply to:** new `entityTypePlural.ts`, `entityTypeSingular.ts`
```ts
export function match(param: string): param is 'a' | 'b' {
  return param === 'a' || param === 'b';
}
```
**Folder ↔ filename coupling rule (Pitfall 7):** `src/params/FOO.ts` ↔ `src/routes/.../[[x=FOO]]/`. The matcher name inside `=` is the filename, not a free alias.

### Barrel exports (contexts and components)

**Source:** `apps/frontend/src/lib/contexts/app/index.ts` (contexts) + `apps/frontend/src/lib/dynamic-components/entityList/index.ts` (components)
**Apply to:** new `filter/index.ts`, updated `entityList/index.ts`
```ts
// Context barrel: re-export everything from each module
export * from './fooContext.svelte';
export * from './fooContext.type';

// Component barrel: explicit default re-exports + type re-exports
export { default as Foo } from './Foo.svelte';
export * from './Foo.type';
```

### $effect cleanup for subscription lifecycle

**Source:** RESEARCH §Pitfall 2 + Svelte docs (replaces manual `onDestroy` pairing)
**Apply to:** EntityListWithControls.svelte (searchFilter.onChange), filterContext.svelte.ts (filterGroup.onChange on scope change)
```ts
$effect(() => {
  const handler = () => { /* ... */ };
  target.onChange(handler, true);
  return () => target.onChange(handler, false);  // runs on re-run + destroy
});
```
**Replaces:** the `onChange(..., true)` + `onDestroy(() => onChange(..., false))` pair at EntityListControls.svelte lines 56-57, 64-67.

### Silent-degradation error handling for entity lookup

**Source:** `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` lines 158-172
**Apply to:** new `[[id]]/+page.svelte`, new `+page.ts` load fn
```ts
try {
  const { entity } = getEntityAndTitle({ dataRoot, matches, entityType, entityId, nominationId });
  return entity;
} catch (e) {
  logDebugError(`Could not get entity details for ${entityType} ${entityId}. Error: ${e instanceof Error ? e.message : '-'}`);
  return undefined;
}
```
UI-SPEC row "Deeplink to entity not found" locks silent degradation + debug-log as the intentional contract. Toast/soft-error surfaces are OUT of scope.

### i18n key reuse

**Source:** UI-SPEC §Copywriting Contract Reused Keys table
**Apply to:** All new UI — EntityListWithControls.svelte, results/+layout.svelte, drawer +page.svelte
**Rule:** Zero new user-facing strings in the happy path. All filter/search/empty-state/section-header keys already exist; cite them by key name (`entityFilters.filterButtonLabel`, `entityList.controls.searchPlaceholder`, etc.). If the drawer-first paint branch demands a "Loading details…" surface, the optional key is `results.drawer.loadingDetails` and MUST be added to all 7 locales (en, fi, sv, fr, et, da, lb) — Wave 0 cost.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.../results/[[...]]/[[id]]/+page.ts` | route (load fn with coupling guard + streaming) | request-response | No existing SvelteKit load function in this repo combines a coupling guard redirect with a streaming data resolve. RESEARCH.md §Pattern 5 supplies the exact shape to copy. Planner uses that as the canonical reference, not a codebase analog. |
| `apps/frontend/src/params/entityTypePlural.test.ts` + `entityTypeSingular.test.ts` | test | — | No existing matcher unit test exists in the codebase (`find src/params -name "*.test.ts"` returns no hits). The test is trivial (pure function, 5 assertions) — use vitest-plain shape without any analog. |

---

## Metadata

**Analog search scope:**
- `apps/frontend/src/lib/contexts/**` (7 contexts verified)
- `apps/frontend/src/lib/dynamic-components/entityList/**` (entire folder, 5 files)
- `apps/frontend/src/params/**` (1 file — `entityType.ts`)
- `apps/frontend/src/routes/(voters)/(located)/results/**` (5 files)
- `apps/frontend/src/routes/+layout.svelte` (Phase 60 reference for $derived + $effect split)
- `packages/filters/src/group/filterGroup.ts` + `packages/filters/src/filter/base/filter.ts` (read-only per D-07 — API contract only)
- `tests/tests/specs/voter/voter-results.spec.ts` (E2E template)
- `apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts` (vitest template)

**Files scanned:** 22 primary analogs + 4 supporting contexts + 3 component files + 2 package source files + 1 test file + 1 E2E spec = 33

**Pattern extraction date:** 2026-04-24

**Key cross-cutting insight:** Every new file in Phase 62 has an exact or near-exact in-repo analog. The refactor is composition and routing work — the three net-new modules (`filterContext.svelte.ts`, `EntityListWithControls.svelte`, two param matchers) are thin adapters over existing code. No new primitives, no new libraries, no `@openvaa/filters` changes. The heart of the correctness fix is the version-counter bridge pattern already present in `dataContext.svelte.ts` applied to `FilterGroup.onChange`.
