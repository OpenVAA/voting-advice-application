# Phase 24: Voter Route Migration - Research

**Researched:** 2026-03-19
**Domain:** Svelte 5 runes migration for SvelteKit route files (pages + layouts)
**Confidence:** HIGH

## Summary

Phase 24 migrates 19 voter route files (10 `+page.svelte`, 5 `+layout.svelte`, plus 4 additional pages without legacy patterns) from Svelte 4 reactive patterns to Svelte 5 runes. The migration scope includes 13 `$:` reactive statements, 5 `<slot />` usages, 2 `export let data` declarations, 4 files using `$page` from `$app/stores`, and adding `<svelte:options runes />` to all 19 files. ROUTE-02 (on:event directives) is already complete -- Phase 23 eliminated all remaining `on:event` directives from voter route files.

The project runs Svelte 5.53.12 and SvelteKit 2.55.0, both current versions. The `$app/state` module is available and provides a reactive `page` object that replaces the `$page` store. The most complex migration is `(located)/+layout.svelte` which has an async data-loading `$:` block that must become `$effect` with careful dependency tracking to avoid infinite loops.

**Primary recommendation:** Batch the migration by complexity tier -- simple files first (no `$:`, just need `<svelte:options runes />`), then single-derivation files, then multi-pattern files, with the `(located)/+layout.svelte` async pattern as the final, highest-attention migration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- The `(located)/+layout.svelte` `$:` block watching `data` is converted to `$effect` -- NOT `$derived` (it has async side effects)
- `ready`, `error`, and `hasNominations` are converted to `$state()` since they drive conditional rendering
- The `awaitNominationsSettled` function and its store-based subscription pattern are kept as-is -- the TODO[Svelte 5] stays for a future phase when stores are replaced with native reactivity
- Only the reactive trigger mechanism changes (`$:` to `$effect`), not the underlying async logic
- Single-expression derivations use `$derived()` -- e.g. `$: canSubmit = selected?.length > 0` to `let canSubmit = $derived(selected?.length > 0)`
- Multi-statement `$:` blocks use `$derived.by(() => { ... })` for pure computations
- `$:` blocks with side effects (async calls, navigation, store mutations) use `$effect`
- Mixed blocks that combine derivation and side effects are split: pure derivation extracted to `$derived`, side effects isolated in `$effect`
- Every migrated voter route file gets `<svelte:options runes />`
- `export let data` to `let { data } = $props()` in all route files
- `$page` store access converted to `page` from `$app/state` (reactive object, not a function)
- `$store` shorthand kept for all context stores -- no conversion needed
- All 5 `<slot />` usages in voter route layouts to `{@render children?.()}`

### Claude's Discretion
- Migration ordering and plan batching across the 19 voter route files
- Exact cleanup of any redundant imports after migration
- How to handle edge cases in `$effect` cleanup/teardown

### Deferred Ideas (OUT OF SCOPE)
- Layout to +layout conversion (from Phase 23): Converting Layout.svelte, MainContent.svelte into proper `+layout` files
- Store-to-runes migration: Replacing context stores with native Svelte 5 reactivity (separate milestone)
- awaitNominationsSettled rewrite: Rewriting with `$derived`/`$effect` once stores are replaced
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUTE-01 | All voter route `$:` reactive statements converted to `$derived`/`$derived.by()`/`$effect` (correct rune per statement) | 13 `$:` statements catalogued with correct rune classification per file. Dependency tracking rules for `$effect` documented. |
| ROUTE-02 | All voter route `on:event` directives replaced with native event attributes or callback props | ALREADY COMPLETE: Zero `on:event` directives remain in voter route files (verified by grep). Phase 23 handled this. |
| ROUTE-03 | All voter route `<slot>` usage converted to `{@render}` snippets | 5 `<slot />` usages catalogued across 5 layout files. All are default slots using `children` convention. |
| ROUTE-04 | Root `+layout.svelte` async data-loading pattern migrated from `$:` to `$effect` | Detailed analysis of the `(located)/+layout.svelte` and `nominations/+layout.svelte` patterns. Dependency tracking pitfalls documented. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Component framework | Project dependency, current |
| @sveltejs/kit | 2.55.0 | Application framework | Project dependency, current |

### Key Imports for Migration
| Import | From | Purpose |
|--------|------|---------|
| `page` | `$app/state` | Replaces `$page` from `$app/stores` -- reactive object, not store |
| `$props()` | svelte (rune) | Replaces `export let` for component/route props |
| `$derived()` | svelte (rune) | Replaces single-expression `$:` reactive declarations |
| `$derived.by()` | svelte (rune) | Replaces multi-statement `$:` blocks (pure computations) |
| `$effect()` | svelte (rune) | Replaces `$:` blocks with side effects |
| `$state()` | svelte (rune) | Replaces `let` vars that need explicit reactivity in runes mode |
| `{@render}` | svelte (template) | Replaces `<slot />` |

No new packages need to be installed.

## Architecture Patterns

### Complete File Inventory

**19 voter route files** organized by migration complexity:

#### Tier 1: No `$:` statements (need `<svelte:options runes />` only)
These files have no legacy reactive patterns but need the runes opt-in directive added:
1. `(voters)/+page.svelte` -- frontpage, no props/`$:`/`<slot>`
2. `(voters)/about/+page.svelte` -- static content page
3. `(voters)/info/+page.svelte` -- static content page
4. `(voters)/intro/+page.svelte` -- static content page
5. `(voters)/privacy/+page.svelte` -- static content page
6. `(voters)/nominations/+page.svelte` -- static content page
7. `(voters)/(located)/results/statistics/+page.svelte` -- statistics page

#### Tier 2: Simple `<slot />` only (no `$:` statements)
8. `(voters)/(located)/results/+layout.svelte` -- has `<slot />`, no `$:`, no `export let data`

#### Tier 3: Single `$:` derivation
9. `(voters)/(located)/questions/+page.svelte` -- 1x `$:` derivation (`canSubmit`)
10. `(voters)/(located)/questions/+layout.svelte` -- 1x `$:` (store `.set()` call) + `<slot />`

#### Tier 4: `$:` blocks + `$page` store access
11. `(voters)/elections/+page.svelte` -- 1x `$:` block + 1x `$:` derivation
12. `(voters)/constituencies/+page.svelte` -- 1x `$:` block + 1x `$:` derivation
13. `(voters)/(located)/questions/[questionId]/+page.svelte` -- 1x `$:` block + `$page` store
14. `(voters)/(located)/questions/category/[categoryId]/+page.svelte` -- 1x `$:` block + `$page` store
15. `(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` -- 1x `$:` block + `$page` store

#### Tier 5: Complex `$:` patterns
16. `(voters)/(located)/results/+page.svelte` -- 2x `$:` conditional blocks + `$page` store + `$page.state` (shallow routing)

#### Tier 6: Async data-loading + `<slot />`  (ROUTE-04)
17. `(voters)/+layout.svelte` -- `<slot />` only (root voter layout)
18. `(voters)/nominations/+layout.svelte` -- `export let data` + `$:` async block + `<slot />`
19. `(voters)/(located)/+layout.svelte` -- `export let data` + `$:` async block + `<slot />` + complex nomination settlement

### Pattern 1: `$page` to `page` Migration
**What:** Replace `import { page } from '$app/stores'` with `import { page } from '$app/state'` and remove all `$` prefixes from `$page` usages.
**When to use:** All 4 files that import from `$app/stores`.
**Critical detail:** `page` from `$app/state` is a **reactive object**, not a store. Access properties directly: `page.params`, `page.url`, `page.state`. Do NOT use `$page.params` (that's store syntax). Do NOT call it as `page()` (it's not a function).

**Template usage changes:**
```svelte
<!-- Before (store): -->
{#if $page.state.resultsShowEntity}

<!-- After ($app/state): -->
{#if page.state.resultsShowEntity}
```

**Script usage changes:**
```typescript
// Before:
import { page } from '$app/stores';
const questionId = parseParams($page).questionId;

// After:
import { page } from '$app/state';
const questionId = parseParams(page).questionId;
```

**Inside `$derived`:** When `page` properties are used in reactive derivations, wrap with `$derived`:
```typescript
// The reactive object's properties are automatically tracked in $derived and $effect
let questionId = $derived(parseParams(page).questionId);
```

### Pattern 2: Simple `$:` Derivation to `$derived()`
**What:** Single-expression reactive declarations become `$derived()`.
**Example:**
```typescript
// Before:
$: canSubmit = selected?.length > 0;

// After:
let canSubmit = $derived(selected?.length > 0);
```

### Pattern 3: `$:` Block to `$derived.by()` (Pure Computation)
**What:** Multi-statement `$:` blocks that compute values without side effects.
**When to use:** Blocks that only read reactive state and assign local variables.

**Example (elections/+page.svelte):**
```typescript
// Before:
$: {
    elections = $dataRoot.elections;
    if ($appSettings.elections?.startFromConstituencyGroup) {
        elections = elections.filter((e) => e.getApplicableConstituency($selectedConstituencies));
    }
    setSelected();
}

// After: Split into derivation + effect
let elections = $derived.by(() => {
    let result = $dataRoot.elections;
    if ($appSettings.elections?.startFromConstituencyGroup) {
        result = result.filter((e) => e.getApplicableConstituency($selectedConstituencies));
    }
    return result;
});
// setSelected() is a side effect that mutates `selected` -- handle separately
$effect(() => {
    // Re-derive selected when elections or selectedElections change
    selected = ($selectedElections.length ? $selectedElections : elections).map((e) => e.id);
});
```

### Pattern 4: `$:` Block with Side Effects to `$effect()`
**What:** Blocks that perform navigation, async calls, or store mutations.
**Critical:** Read all reactive dependencies synchronously BEFORE any `await` or `setTimeout`.

**Example ([questionId]/+page.svelte):**
```typescript
// Before:
$: {
    const questionId = parseParams($page).questionId;
    // ... uses questionId, $dataRoot, $selectedQuestionBlocks
}

// After:
$effect(() => {
    const questionId = parseParams(page).questionId;
    // All reactive reads happen synchronously at the top
    const questionBlocks = $selectedQuestionBlocks;
    const root = $dataRoot;
    // ... rest of logic using local variables
});
```

### Pattern 5: Async Data-Loading `$effect` (ROUTE-04)
**What:** The `(located)/+layout.svelte` `$:` block that watches `data` and triggers async Promise resolution.
**Critical pitfalls:**
1. `data` must be accessed synchronously at the top of the `$effect` to register as a dependency
2. `$dataRoot` must NOT be read inside the effect -- it's already isolated in the `update()` function to prevent infinite loops (this existing pattern is preserved)
3. `ready`, `error`, `hasNominations` become `$state()` variables

```typescript
// Before:
let error: Error | undefined;
let ready: boolean;
let hasNominations: NominationStatus;
$: {
    error = undefined;
    ready = false;
    Promise.all([data.questionData, data.nominationData]).then(async (data) => {
        error = await update(data);
    });
}

// After:
let error = $state<Error | undefined>(undefined);
let ready = $state(false);
let hasNominations = $state<NominationStatus>('none');

$effect(() => {
    // Read data synchronously to track as dependency
    const questionData = data.questionData;
    const nominationData = data.nominationData;
    // Reset state
    error = undefined;
    ready = false;
    Promise.all([questionData, nominationData]).then(async (resolved) => {
        error = await update(resolved);
    });
});
```

### Pattern 6: `<slot />` to `{@render children?.()}`
**What:** SvelteKit route layouts use `<slot />` for child route content.
**Example:**
```svelte
<!-- Before: -->
<script lang="ts">
  // ... existing code
</script>

{#if condition}
  <slot />
{/if}

<!-- After: -->
<svelte:options runes />
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
  // ... existing code
</script>

{#if condition}
  {@render children?.()}
{/if}
```

### Pattern 7: `export let data` to `$props()`
**What:** Route files receiving data from `+layout.ts`/`+page.ts` load functions.
**Where:** Only 2 files: `(located)/+layout.svelte` and `nominations/+layout.svelte`.
**Example:**
```typescript
// Before:
export let data;

// After:
let { data } = $props();
```

### Anti-Patterns to Avoid

- **Reading reactive state after `await` in `$effect`:** Values read asynchronously are NOT tracked. Access all dependencies synchronously first, then use local variables in async code.
- **Using `$page` with `$app/state`:** The `page` object from `$app/state` is NOT a store. Do not use `$page.something` -- use `page.something` directly.
- **Using `$:` inside runes mode:** Will cause compiler errors. Every `$:` must be converted before adding `<svelte:options runes />`.
- **Tracking `$dataRoot` inside the data-loading `$effect`:** This was explicitly avoided in the original code (isolated in `update()` function) to prevent infinite loops. Preserve this pattern.
- **Making `$effect` callback async:** Svelte does not support async effect functions. Call `.then()` on promises instead, or invoke an async function from within the synchronous effect body.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page state reactivity | Custom store subscriptions | `page` from `$app/state` | Built-in reactive object, fine-grained updates |
| Reactive declarations | Manual subscriptions | `$derived` / `$derived.by()` | Compiler-optimized, automatic dependency tracking |
| Side effect tracking | Manual dependency arrays | `$effect` | Automatic tracking of synchronously-read values |

## Common Pitfalls

### Pitfall 1: Infinite Loop in Data-Loading Effect
**What goes wrong:** Reading `$dataRoot` inside the `$effect` that calls `$dataRoot.update()` creates a read-write cycle.
**Why it happens:** `$effect` tracks all reactive reads. If you read `$dataRoot` and then mutate it via `.update()`, the effect re-triggers infinitely.
**How to avoid:** The existing code already isolates `$dataRoot` access inside the `update()` function. Preserve this pattern -- do NOT destructure or read `$dataRoot` at the top of the `$effect`.
**Warning signs:** Browser tab freezes, "Maximum update depth exceeded" console errors.

### Pitfall 2: Untracked Async Dependencies
**What goes wrong:** Reactive values read after `await` are not tracked by `$effect`.
**Why it happens:** Svelte only tracks synchronous reads during the effect's initial execution.
**How to avoid:** Capture all reactive dependencies into local `const` variables BEFORE any `await`.
**Warning signs:** Effect doesn't re-run when expected data changes.

### Pitfall 3: `$page.state` in Template Without Runes
**What goes wrong:** After migrating to `page` from `$app/state`, using `$page.state.resultsShowEntity` in templates will fail because `$page` no longer exists.
**Why it happens:** Template references to `$page` must ALL change to `page` when switching to `$app/state`.
**How to avoid:** Search-and-replace ALL `$page` occurrences (both script and template) in each file simultaneously.

### Pitfall 4: `$:` Block Split Causing Double Updates
**What goes wrong:** Splitting a `$:` block into `$derived` + `$effect` can cause the effect to run before the derived value updates.
**Why it happens:** `$effect` runs after DOM updates by default. If the derived value is used in the effect, ensure the derived declaration comes first.
**How to avoid:** Place `$derived` declarations before `$effect` declarations. Use `$effect.pre()` if DOM-timing matters.
**Warning signs:** Stale values in effect callbacks, UI flicker.

### Pitfall 5: Store `$` Shorthand in Runes Mode
**What goes wrong:** Developers might try to convert `$store` syntax, but this is NOT required.
**Why it happens:** Confusion between store `$` prefix and Svelte 4 `$:` reactive syntax.
**How to avoid:** `$store` shorthand (e.g., `$dataRoot`, `$selectedElections`) works correctly in Svelte 5 runes mode. Leave all store access unchanged.

### Pitfall 6: Missing `$state()` for Mutable Variables
**What goes wrong:** Variables that were previously mutated and triggered re-renders via `$:` won't cause re-renders in runes mode without `$state()`.
**Why it happens:** In runes mode, only `$state()` variables trigger reactivity when mutated.
**How to avoid:** Any `let` variable that is reassigned AND drives conditional rendering or derived computations must use `$state()`. Key candidates: `ready`, `error`, `hasNominations` in layout files, and `disabled` in question pages.
**Warning signs:** UI not updating after variable assignment.

### Pitfall 7: SSR and `$effect`
**What goes wrong:** `$effect` does not run during SSR. If initial state depends on effect execution, SSR will render the "loading" or "error" state.
**Why it happens:** Effects are browser-only by design.
**How to avoid:** This is actually the desired behavior for the data-loading layouts (they show `<Loading />` initially). Verify that the initial `$state` values produce correct SSR output (e.g., `ready = false` shows loading spinner).

## Code Examples

### Complete Migration: elections/+page.svelte
```svelte
<svelte:options runes />
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { ElectionSelector } from '$lib/components/electionSelector';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import MainContent from '../../MainContent.svelte';
  import type { Id } from '@openvaa/core';
  import type { Election } from '@openvaa/data';

  const { appSettings, dataRoot, getRoute, selectedConstituencies, selectedElections, t } = getVoterContext();

  let selected: Array<Id> = $state([]);

  // Pure derivation: compute filtered elections
  let elections = $derived.by(() => {
    let result = $dataRoot.elections;
    if ($appSettings.elections?.startFromConstituencyGroup) {
      result = result.filter((e) => e.getApplicableConstituency($selectedConstituencies));
    }
    return result;
  });

  // Side effect: set initial selection when elections or selectedElections change
  $effect(() => {
    selected = ($selectedElections.length ? $selectedElections : elections).map((e) => e.id);
  });

  let canSubmit = $derived(selected?.length > 0);

  function handleSubmit(): void {
    if (!canSubmit) return;
    const electionId = Object.values(selected);
    goto(
      $appSettings.elections?.startFromConstituencyGroup
        ? $getRoute({ route: 'Questions', electionId })
        : $getRoute({ route: 'Constituencies', electionId, constituencyId: undefined })
    );
  }
</script>
```

### Complete Migration: (located)/+layout.svelte (ROUTE-04)
```svelte
<svelte:options runes />
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { isValidResult } from '$lib/api/utils/isValidResult.js';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { Modal } from '$lib/components/modal';
  import { getVoterContext } from '$lib/contexts/voter';
  import { sanitizeHtml } from '$lib/utils/sanitize.js';
  import type { DPDataType } from '$lib/api/base/dataTypes';

  let { data, children }: { data: any; children: Snippet } = $props();

  const { dataRoot, getRoute, nominationsAvailable, selectedElections, t } = getVoterContext();

  const NOMINATIONS_SETTLE_TIMEOUT = 3000;

  type NominationStatus = 'all' | 'none' | 'some';

  let error = $state<Error | undefined>(undefined);
  let modalRef: Modal;
  let ready = $state(false);
  let hasNominations = $state<NominationStatus>('none');

  $effect(() => {
    // Read data synchronously to register as dependency
    const questionData = data.questionData;
    const nominationData = data.nominationData;
    // Reset state
    error = undefined;
    ready = false;
    Promise.all([questionData, nominationData]).then(async (resolved) => {
      error = await update(resolved);
    });
  });

  // update() function and awaitNominationsSettled() remain unchanged
  // ...
</script>

{#if error}
  <ErrorMessage class="bg-base-300" />
{:else if !ready}
  <Loading />
{:else}
  {@render children?.()}
{/if}
```

### Complete Migration: results/+page.svelte ($page to page)
```svelte
<svelte:options runes />
<script lang="ts">
  // ...
  import { page } from '$app/state';
  // ...

  // $: if (activeElectionId) { ... } becomes $effect:
  $effect(() => {
    if (activeElectionId) {
      entityTabs = Object.keys($matches[activeElectionId]).map((type) => ({
        type: type as EntityType,
        label: ucFirst(t(`common.${type as EntityType}.plural`))
      }));
      if (!activeEntityType || !(activeEntityType in $matches[activeElectionId]))
        activeEntityType = entityTabs[0]?.type;
      activeElection = $elections.find((e) => e.id === activeElectionId)!;
    }
  });
</script>

<!-- Template: $page.state becomes page.state -->
{#if page.state.resultsShowEntity}
  {@const props = getDrawerProps(page.state.resultsShowEntity)}
  <!-- ... -->
{/if}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$:` reactive declarations | `$derived` / `$derived.by()` | Svelte 5 (Oct 2024) | Explicit dependency tracking, better performance |
| `$:` side effect blocks | `$effect()` | Svelte 5 (Oct 2024) | Cleanup functions, no SSR execution |
| `export let` | `$props()` | Svelte 5 (Oct 2024) | Type-safe, destructurable |
| `<slot />` | `{@render children?.()}` | Svelte 5 (Oct 2024) | Snippet-based, composable |
| `import { page } from '$app/stores'` | `import { page } from '$app/state'` | SvelteKit 2.12 (2024) | Fine-grained reactivity, no store overhead |
| `$page.params.id` | `page.params.id` | SvelteKit 2.12 (2024) | Direct property access, runes-compatible |

**Deprecated:**
- `$app/stores`: Deprecated in SvelteKit 2.12, will be removed in SvelteKit 3. Still functional but should be migrated.
- `$:` syntax: Still supported in Svelte 5 legacy mode, but incompatible with `<svelte:options runes />`.

## Open Questions

1. **`selected` state in elections/constituencies pages**
   - What we know: Both pages have `let selected` that is mutated by both `$:` blocks and user interaction (bind:selected). In runes mode, this needs `$state()` for reactivity.
   - What's unclear: Whether `bind:selected` on child components automatically makes the variable reactive in runes mode or whether explicit `$state()` is needed.
   - Recommendation: Use `$state()` for `selected` to be safe. `$bindable()` on the child component side handles the binding; the parent still needs `$state()`.

2. **`disabled` variable in [questionId]/+page.svelte**
   - What we know: `let disabled = false` is mutated in handlers but not in a `$:` block. It's used in template conditionals.
   - What's unclear: Whether template reads of plain `let` variables in runes mode trigger re-renders.
   - Recommendation: Convert to `$state(false)` since it drives UI rendering and is mutated imperatively.

3. **Results page `activeElectionId` / `activeEntityType` state variables**
   - What we know: Multiple `let` variables are mutated and drive conditional rendering in the results page.
   - Recommendation: Convert `activeElectionId`, `activeEntityType`, `activeMatches`, `entityTabs`, `initialEntityTabIndex`, `activeElection`, `filteredEntities` to `$state()` since they are mutated and drive template rendering.

## Detailed `$:` Statement Classification

| File | `$:` Statement | Classification | Target Rune | Notes |
|------|---------------|---------------|-------------|-------|
| elections/+page.svelte:37 | Block: filter elections + setSelected() | Mixed (derivation + side effect) | `$derived.by` + `$effect` | Split: elections derivation + selected effect |
| elections/+page.svelte:61 | `canSubmit = selected?.length > 0` | Pure derivation | `$derived` | Simple |
| constituencies/+page.svelte:45 | Block: set elections + setSelected() | Mixed (derivation + side effect) | `$derived.by` + `$effect` | Same pattern as elections |
| constituencies/+page.svelte:70 | `canSubmit = selectionComplete` | Pure derivation | `$derived` | Simple |
| questions/+page.svelte:78 | `canSubmit = ...` (multi-line) | Pure derivation | `$derived` | Reads multiple stores |
| questions/+layout.svelte:35 | `progress.max.set(...)` | Side effect (store mutation) | `$effect` | Calls `.set()` on store |
| [questionId]/+page.svelte:65 | Block: parse page, get question, update progress | Side effect (navigation, store mutation) | `$effect` | Reads `$page`, calls `goto`, `progress.current.set` |
| [categoryId]/+page.svelte:54 | Block: parse page, get category, compute state | Mixed | `$effect` | Has side effects (video.load, error()) |
| (located)/+layout.svelte:48 | Block: async data loading | Side effect (async, state mutation) | `$effect` | ROUTE-04: Most complex |
| nominations/+layout.svelte:26 | Block: async data loading | Side effect (async, state mutation) | `$effect` | Simpler version of ROUTE-04 |
| results/+page.svelte:112 | `if (activeElectionId) { entityTabs... }` | Side effect (state mutation) | `$effect` | Mutates multiple state vars |
| results/+page.svelte:123 | `if (activeElectionId) { activeMatches... }` | Side effect (state mutation + function call) | `$effect` | Calls setInitialEntityTab() |
| results/[entityType]/[entityId]/+page.svelte:66 | Block: parse page params, get entity, track | Side effect (navigation, tracking) | `$effect` | Calls goto, doTrack |

## Sources

### Primary (HIGH confidence)
- SvelteKit `$app/state` module source code -- verified reactive object API (not a function), property access pattern
- Svelte `$effect` source and docs -- dependency tracking, async limitations, cleanup semantics
- Direct inspection of all 19 voter route files in the project codebase

### Secondary (MEDIUM confidence)
- [Svelte $effect docs](https://svelte.dev/docs/svelte/$effect) -- async values after `await` are not tracked
- [SvelteKit $app/state docs](https://svelte.dev/docs/kit/$app-state) -- page reactive object API, SSR caveats
- [Avoid async effects in Svelte](https://joyofcode.xyz/avoid-async-effects-in-svelte) -- patterns for handling promises in effects

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- versions verified from installed node_modules
- Architecture: HIGH -- all 19 files read and analyzed, patterns verified against Svelte 5 docs
- Pitfalls: HIGH -- infinite loop risk documented from existing code comments, async tracking verified in official docs
- `$app/state` API: HIGH -- verified from installed SvelteKit source code (reactive object with getters, not a function)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- Svelte 5 runes API is finalized)
