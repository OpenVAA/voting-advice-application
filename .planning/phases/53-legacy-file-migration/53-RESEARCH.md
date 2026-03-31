# Phase 53: Legacy File Migration - Research

**Researched:** 2026-03-28
**Domain:** Svelte 5 runes migration -- converting Svelte 4 syntax (.svelte files) to runes
**Confidence:** HIGH

## Summary

Phase 53 migrates 16 remaining .svelte files from Svelte 4 syntax to Svelte 5 runes. After Phases 50-52, all context APIs are already `$state`-based, so this phase is purely about converting component-level syntax: `export let` to `$props()`, `$:` to `$derived`/`$effect`, `<slot>` to `{@render children()}`, `on:event` to callback props, and `<svelte:component>` to direct component rendering.

The root `+layout.svelte` is the highest-risk file (176 lines, initializes all contexts, handles async data loading with Promise.all, loads dynamic third-party components). The admin routes follow repetitive patterns and can be migrated mechanically. Shared layout components (Header, Banner, MaintenancePage, +error) each have specific conversion requirements but are straightforward.

**Primary recommendation:** Migrate in three waves -- (1) shared components (Header, Banner, MaintenancePage, +error, PreviewColorContrast), (2) admin routes (mechanical bulk migration), (3) root +layout.svelte (highest risk, done last). Each wave should build-verify before proceeding.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Root +layout.svelte -- full runes rewrite in one pass. Convert all legacy patterns at once: `export let data` to `$props()`, `$:` to `$derived`/`$effect`, `<slot>` to `{@render children()}`, `$store` to direct access. No incremental approach -- do it all in one commit.
- D-02: `<svelte:component>` replaced with direct component render. Replace `<svelte:component this={Module.default}>` with `<Module.default>` inside `{#await}` blocks.
- D-03: Admin routes -- mechanical bulk migration. All 8 admin route files + 2 admin layouts follow the same pattern. Apply identical runes conversion mechanically.

### Claude's Discretion
- Root layout's `$effect` structure for the Promise.all data loading pattern
- How to handle `on:hidden` event on VisibilityChange component (Svelte 5 callback prop or `onhidden` event)
- Header, Banner, MaintenancePage, +error specific conversion details
- PreviewColorContrast.svelte migration approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R5.1 | Migrate root +layout.svelte to runes ($props, $effect, {@render children()}) | Detailed conversion map in Architecture Patterns; async data loading pattern documented; `$app/state` `updated` API verified |
| R5.2 | Migrate admin route files to runes | Mechanical pattern documented; all 10 admin files analyzed with identical conversion recipe |
| R5.3 | Migrate shared layout components to runes | Per-file conversion details in Architecture Patterns; Header, Banner, MaintenancePage, +error all analyzed |
| R5.4 | Replace all `<slot>` with `{#snippet}`/`{@render}` in remaining files | 6 files with `<slot>` identified; conversion pattern documented |
| R5.5 | Replace all `$:` reactive declarations with `$derived`/`$effect` | All 17 `$:` occurrences catalogued with recommended conversion (derived vs effect) |
| R5.6 | Replace all `export let` with `$props()` in remaining files | 11 `export let` occurrences across files; `$$Props`/`$$restProps` migration pattern documented |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase uses only what is already installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Component framework | Already installed; runes API is the target |
| @sveltejs/kit | 2.55.0+ | Application framework | Already installed; `$app/state` module |

### Dependencies to Note
| Library | Version | Relevance |
|---------|---------|-----------|
| svelte-visibility-change | 0.6.0 (installed) | Third-party Svelte 3/4 component used in root layout; uses `createEventDispatcher` with `on:hidden` events |

**No installation needed.** All dependencies already present.

## Architecture Patterns

### Complete File Inventory and Conversion Map

Each file is categorized by complexity and the specific conversions needed.

#### Tier 1: Root Layout (Highest Risk)

**`+layout.svelte`** (176 lines) -- All contexts initialized here; async data loading; dynamic imports.

| Current Pattern | Line(s) | Conversion |
|----------------|---------|------------|
| `export let data: LayoutData` | 38 | `let { data, children }: { data: LayoutData; children: Snippet } = $props()` |
| `import { updated } from '$app/stores'` | 21 | `import { updated } from '$app/state'` then `updated.current` instead of `$updated` |
| `$: { ... Promise.all ... }` data loading block | 61-71 | `$effect(() => { ... })` -- must run Promise.all and update local `$state` vars |
| `$: if (error) logDebugError(...)` | 72 | `$effect(() => { if (error) logDebugError(...) })` |
| `$: if (umamiRef?.trackEvent) $sendTrackingEvent = ...` | 103 | `$effect(() => { if (umamiRef?.trackEvent) sendTrackingEvent = ... })` |
| `$: if (feedbackModalRef) $openFeedbackModal = ...` | 120 | `$effect(() => { if (feedbackModalRef) openFeedbackModal = ... })` |
| `$dataRoot.update(...)` | 89-92 | `dataRoot.update(...)` (direct access post-Phase 52) |
| `$appSettings.analytics?.platform` | 158 | `appSettings.analytics?.platform` |
| `$sendTrackingEvent`, `$openFeedbackModal` | various | Direct property access (no `$` prefix) |
| `<slot />` | 152 | `{@render children?.()}` |
| `<svelte:component this={UmamiAnalytics.default} ...>` | 161-164 | `<UmamiAnalytics.default ... />` |
| `<svelte:component this={VisibilityChange.default} on:hidden=...>` | 169 | See VisibilityChange section below |
| `$updated` in beforeNavigate | 107 | `updated.current` |
| `let error`, `let ready`, `let underMaintenance` | 58-60 | `let error = $state<Error \| undefined>()`, `let ready = $state(false)`, `let underMaintenance = $state(false)` |
| `on:hidden` on VisibilityChange | 169 | See discretion analysis below |

**Critical: Promise.all data loading pattern.** The `$:` block at line 61 runs whenever `data` changes, triggers `Promise.all`, and sets `ready`/`error`/`underMaintenance`. In runes mode:

```typescript
// Local state
let error = $state<Error | undefined>();
let ready = $state(false);
let underMaintenance = $state(false);

// Effect tracks 'data' prop changes and runs async loading
$effect(() => {
  // Read data prop fields to establish tracking
  const settingsP = data.appSettingsData;
  const customP = data.appCustomizationData;
  const electionP = data.electionData;
  const constituencyP = data.constituencyData;

  // Reset state before async work
  error = undefined;
  ready = false;
  underMaintenance = false;

  Promise.all([settingsP, customP, electionP, constituencyP]).then(
    (results) => {
      error = update(results);
    }
  );
});
```

The `update()` function stays the same but uses `dataRoot` directly (no `$` prefix) since contexts are `$state`-based after Phases 50-52.

**VisibilityChange `on:hidden` -- Discretion Analysis:**

The `svelte-visibility-change` library (v0.6.0) uses `createEventDispatcher` to emit `hidden`/`visible` events. Three approaches:

1. **Use `onhidden` prop (recommended):** Svelte 5 translates `onhidden={handler}` to event listener subscription even for legacy components. This is the cleanest Svelte 5 syntax.
2. **Use action-based API:** The library also exports a `visibilityChange` Svelte action that can be used on any element.
3. **Direct DOM listener:** Replace the component entirely with `document.addEventListener('visibilitychange', ...)` in an `$effect`.

**Recommendation: Option 3 (direct DOM listener).** The `svelte-visibility-change` component is only used in one place, for one purpose (calling `submitAllEvents()` on page hide). A simple `$effect` with DOM API eliminates the third-party component dependency and the `<svelte:component>` pattern entirely:

```typescript
$effect(() => {
  if (!appSettings.analytics?.platform) return;
  const handler = () => {
    if (document.visibilityState === 'hidden') submitAllEvents();
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
});
```

However, this is Claude's discretion per the CONTEXT.md. If preserving the library is preferred, use `onhidden`:

```svelte
{#await import('svelte-visibility-change') then VisibilityChange}
  <VisibilityChange.default onhidden={() => submitAllEvents()} />
{/await}
```

**UmamiAnalytics dynamic import -- direct rendering:**

```svelte
{#await import('$lib/components/analytics/umami/UmamiAnalytics.svelte') then UmamiAnalytics}
  <UmamiAnalytics.default
    websiteId={appSettings.analytics.platform.code}
    bind:this={umamiRef} />
{/await}
```

Note: `UmamiAnalytics` is already a runes component. `bind:this` on runes components gives access to exported values (`trackEvent`).

#### Tier 2: Shared Components

**`Header.svelte`** (131 lines):

| Current Pattern | Conversion |
|----------------|------------|
| `export let menuId`, `export let openDrawer`, etc. | `let { menuId, openDrawer, isDrawerOpen = false, drawerOpenElement }: HeaderProps = $props()` -- needs type definition or inline |
| `$: { bgColor = ... }` (lines 37-40) | `let bgColor = $derived.by(() => { ... })` |
| `$darkMode`, `$appSettings`, `$topBarSettings`, `$navigationSettings` | Direct access: `darkMode`, `appSettings`, `topBarSettings`, `navigationSettings` (post-Phase 52) |
| `on:click={openDrawer}` | `onclick={openDrawer}` |
| `bind:this={drawerOpenElement}` | Stays as-is (works in Svelte 5) |
| `$currentProgress`, `$maxProgress` | Direct: `progress.current.current`, `progress.max` (Tween has `.current` property per Phase 50 D-02) |

**Note:** Header receives `isDrawerOpen` as bindable in Layout.svelte (which is already runes-mode). Header must accept it as a regular prop since it does not bind back -- it only reads it. Check if `$bindable()` is needed based on Layout.svelte expectations.

Actually, looking at the current code: Header has `export let isDrawerOpen = false` and Layout.svelte does NOT bind to Header's isDrawerOpen -- it passes it down. So a regular prop is fine.

**`Banner.svelte`** (107 lines):

| Current Pattern | Conversion |
|----------------|------------|
| No `export let` props | No `$props()` needed (component takes no props) |
| `import { page } from '$app/stores'` | Already migrated in Phase 50 to `$app/state` |
| `$page.data.token` | `page.data.token` (direct access) |
| `$appType`, `$hasVideo`, `$videoMode`, `$player` | Direct access post-Phase 52 |
| `$topBarSettings`, `$openFeedbackModal`, `$getRoute` | Direct access post-Phase 52 |
| No `<slot>` | No snippet conversion needed |
| `onDestroy` import | Stays -- used for `getLayoutContext(onDestroy)` cleanup |

**`MaintenancePage.svelte`** (69 lines):

| Current Pattern | Conversion |
|----------------|------------|
| `type $$Props = MaintenancePageProps` | Remove -- use `$props<MaintenancePageProps>()` or destructure with type |
| `export let title`, `export let content`, `export let emoji` | `let { title, content, emoji, ...restProps }: MaintenancePageProps = $props()` |
| `$$restProps` with `concatClass()` | `restProps` from destructured `$props()` |
| `title ??= t(...)` lines 41-43 | These are one-time defaults. In runes, props are read-only. Use `$derived` or local state: `let effectiveTitle = $derived(title ?? t('maintenance.title'))` |
| No `$:` blocks | No `$derived`/`$effect` conversion needed beyond defaults |

**Important:** In Svelte 5, destructured props from `$props()` are read-only. The pattern `title ??= t(...)` that mutates the prop will not work. Must compute effective values:

```typescript
let { title: titleProp, content: contentProp, emoji: emojiProp, ...restProps }: MaintenancePageProps = $props();

const { t, track } = getAppContext();
track('maintenance_shown');

let effectiveTitle = $derived(titleProp ?? t('maintenance.title'));
let effectiveContent = $derived(contentProp ?? t('dynamic.maintenance.content'));
let effectiveEmoji = $derived(emojiProp ?? t('dynamic.maintenance.heroEmoji'));
```

**`+error.svelte`** (36 lines):

| Current Pattern | Conversion |
|----------------|------------|
| `import { page } from '$app/stores'` | Already migrated in Phase 50; will be `import { page } from '$app/state'` |
| `const description = $page.error?.description ...` | `let description = $derived(page.error?.description \|\| t('error.content'))` |
| `const emoji = $page.error?.emoji ...` | `let emoji = $derived(page.error?.emoji \|\| t('dynamic.error.heroEmoji'))` |
| `$: { title = ... }` block | `let title = $derived.by(() => { ... })` |
| `$page.error`, `$page.status` | `page.error`, `page.status` |
| Already uses `{#snippet}` | No slot conversion needed |

**`PreviewColorContrast.svelte`** (80 lines):

| Current Pattern | Conversion |
|----------------|------------|
| `$: { ... }` large reactive block | `$derived.by(() => { ... })` or split into multiple `$derived` |
| No `export let` | No props conversion |
| No `<slot>` | No snippet conversion |
| Pure utility component | Simple mechanical conversion |

The single `$:` block computes color values from local `let` variables. All local `let` variables that bind to inputs need `$state`:

```typescript
let origColor = $state('#000000');
let bgColor = $state('#d1ebee');
let color = $state('#000000');
// Derived computations
let computedValues = $derived.by(() => {
  const rgb = parseColorString(origColor);
  const bgRgb = parseColorString(bgColor);
  // ... computation logic
  return { parsedColor, origContrast, origLuminance, contrast, adjLum, bgLum, color: adjustedColor };
});
```

#### Tier 3: Admin Routes (Mechanical)

All admin routes follow one of two patterns:

**Pattern A: Data-loading layouts** (argument-condensation/+layout.svelte, question-info/+layout.svelte, (protected)/+layout.svelte)

| Current | Conversion |
|---------|------------|
| `export let data` | `let { data, children }: { data: any; children: Snippet } = $props()` |
| `$: { error = ...; ready = ...; Promise.all... }` | `$effect(() => { ... })` with `$state` vars |
| `$: if (error) logDebugError(...)` | `$effect(() => { if (error) ... })` |
| `$dataRoot.provideQuestionData(...)` | `dataRoot.provideQuestionData(...)` |
| `<slot />` | `{@render children?.()}` |

**Pattern B: Page components** (argument-condensation/+page.svelte, question-info/+page.svelte, jobs/+page.svelte)

| Current | Conversion |
|---------|------------|
| `$: job = $activeJobsByFeature.get(...)` | `let job = $derived(activeJobsByFeature.get(...))` |
| `$: { availableQuestions = ... }` | `let availableQuestions = $derived.by(() => { ... })` or `$effect` |
| `$: canSubmit = ...` | `let canSubmit = $derived(...)` |
| `$: activeJobsCount = ...` | `let activeJobsCount = $derived(...)` |
| `$dataRoot.getElection(...)` | `dataRoot.getElection(...)` |
| `on:change={handler}` | `onchange={handler}` |
| No `<slot>` | No snippet conversion needed |

**Pattern C: Simple layouts** (admin/+layout.svelte, jobs/+layout.svelte)

| Current | Conversion |
|---------|------------|
| `<slot />` | `{@render children?.()}` with `children` from `$props()` |
| `$appType = 'admin'` | `appType = 'admin'` |
| `$appSettings.xxx` | `appSettings.xxx` |

**Admin login page** (login/+page.svelte) -- unique pattern:

| Current | Conversion |
|---------|------------|
| `import { page } from '$app/stores'` | Already migrated in Phase 50 |
| `$: canSubmit = !!(status !== 'loading' && email && password)` | `let canSubmit = $derived(!!(status !== 'loading' && email && password))` -- needs `email` and `password` as `$state` |
| `$page.url.searchParams` | `page.url.searchParams` |
| No `export let` -- no data prop | Only need `$state` for form fields |

### `<slot>` to `{@render children()}` -- Complete List

6 files need this conversion:

1. `+layout.svelte` (root) -- `<slot />` at line 152
2. `admin/+layout.svelte` -- `<slot />` at line 53
3. `admin/(protected)/+layout.svelte` -- `<slot />` at line 48
4. `admin/(protected)/argument-condensation/+layout.svelte` -- `<slot />` at line 60
5. `admin/(protected)/question-info/+layout.svelte` -- `<slot />` at line 60
6. `admin/(protected)/jobs/+layout.svelte` -- `<slot />` at line 12

All follow the same pattern: accept `children: Snippet` in `$props()`, render with `{@render children?.()}`.

### `on:event` to Callback Prop -- Complete List

4 occurrences across the 16 files:

1. `+layout.svelte:169` -- `on:hidden` on VisibilityChange (discretion: DOM API or onhidden prop)
2. `Header.svelte:77` -- `on:click={openDrawer}` becomes `onclick={openDrawer}`
3. `argument-condensation/+page.svelte:132` -- `on:change` on select becomes `onchange`
4. `argument-condensation/+page.svelte:176` -- `on:change` on checkbox becomes `onchange`

### Anti-Patterns to Avoid

- **Mutating props:** In Svelte 5, `$props()` destructured values are read-only. Never do `title ??= 'default'`. Use `$derived` for computed defaults.
- **Mixing `$:` and `$effect` in one file:** Convert all reactive declarations. A file should be fully runes or fully legacy, never mixed.
- **Forgetting `$state` for mutable locals:** Variables that change (like `error`, `ready`, `status`) must be `$state()` for runes reactivity.
- **Using `$` prefix on post-Phase-52 context values:** After context rewrites, `$dataRoot` becomes `dataRoot`, `$appSettings` becomes `appSettings`. The `$` prefix is only for store subscriptions.
- **Not adding `<svelte:options runes />` (or relying on it):** Phase 53 files need `<svelte:options runes />` until Phase 54 enables global runes. Add it to every converted file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page visibility detection | Custom event system wrapping `svelte-visibility-change` | Direct `document.addEventListener('visibilitychange', ...)` in `$effect` | Simpler than wrapping a legacy component; eliminates `<svelte:component>` |
| Prop default computation | Inline `??=` assignment on props | `$derived(prop ?? default)` | Props are read-only in runes mode |
| Reactive data loading | Complex `$effect` chains for Promise resolution | Single `$effect` with Promise.all, updating `$state` in `.then()` | Matches existing proven pattern |

## Common Pitfalls

### Pitfall 1: Props Read-Only in Runes Mode
**What goes wrong:** Code like `title ??= t('...')` worked in Svelte 4 because `export let` created mutable bindings. In runes, `$props()` returns read-only values.
**Why it happens:** Svelte 5 enforces unidirectional data flow for props.
**How to avoid:** Use `$derived` for computed defaults: `let effectiveTitle = $derived(title ?? t('maintenance.title'))`.
**Warning signs:** TypeScript error "Cannot assign to ... because it is a read-only property" or runtime error.

### Pitfall 2: `$effect` Running Before Mount (Async Data Loading)
**What goes wrong:** The Promise.all pattern in the root layout sets `ready = false` then resolves asynchronously. If the `$effect` fires during SSR, `Promise.all` may not behave as expected.
**Why it happens:** `$effect` runs during component initialization on the server too, but async resolution happens differently.
**How to avoid:** The update function should be safe for SSR since it only modifies local state. Verify `ready` starts `false` (default).
**Warning signs:** Hydration mismatch errors or flash of loading state.

### Pitfall 3: `$app/state` `updated` API Change
**What goes wrong:** Code references `$updated` (store auto-subscription) but `updated` from `$app/state` is accessed as `updated.current`.
**Why it happens:** Different API surface between `$app/stores` and `$app/state`.
**How to avoid:** Use `updated.current` for the boolean value, `updated.check()` to force a check. Note that Phase 50 should have already migrated this import, but the `$:` usage pattern may need updating.
**Warning signs:** `updated` is always `undefined` or is an object instead of boolean.

### Pitfall 4: `bind:this` on Dynamically Imported Runes Components
**What goes wrong:** Using `bind:this` on a component loaded via `{#await import(...)}` -- the binding may not capture exported methods correctly.
**Why it happens:** Dynamic imports resolve to module objects, and `bind:this` on runes components only exposes `export const`/`export function` values.
**How to avoid:** `UmamiAnalytics` exports `trackEvent` via `export const` -- this works with `bind:this`. `FeedbackModal` exports `openFeedback` via `export function` -- also works. Verify bindings after migration.
**Warning signs:** `umamiRef.trackEvent` is undefined; `feedbackModalRef.openFeedback` is undefined.

### Pitfall 5: Context Store Prefix Removal After Phase 52
**What goes wrong:** Files reference `$dataRoot`, `$appSettings`, `$appType` with store subscription syntax, but after Phases 50-52, these are plain `$state` properties accessed without `$`.
**Why it happens:** Muscle memory from Svelte 4 store patterns.
**How to avoid:** After context rewrites, all context values are direct properties. Only `$state`, `$derived`, `$effect`, `$props`, `$bindable` are valid `$`-prefixed identifiers.
**Warning signs:** "$ is not a store" or "xxx is not a function" errors.

### Pitfall 6: Missing `<svelte:options runes />` Directive
**What goes wrong:** Converted file uses runes syntax but Svelte compiler treats it as legacy mode, causing syntax errors.
**Why it happens:** Global runes mode is not enabled until Phase 54. Each file needs explicit opt-in.
**How to avoid:** Add `<svelte:options runes />` as the first line of every converted file.
**Warning signs:** Compiler errors about `$state`, `$derived`, `$effect` being unknown.

## Code Examples

Verified patterns from Svelte 5 official docs and already-migrated files in this codebase.

### SvelteKit Layout with `$props()` and `children` Snippet
```svelte
<!-- Source: apps/frontend/src/routes/(voters)/+layout.svelte (already migrated) -->
<svelte:options runes />

<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

{@render children?.()}
```

### SvelteKit Layout with Data Prop
```svelte
<!-- Source: apps/frontend/src/routes/(voters)/(located)/+layout.svelte (already migrated) -->
<svelte:options runes />

<script lang="ts">
  import type { Snippet } from 'svelte';
  let { data, children }: { data: any; children: Snippet } = $props();
</script>
```

### Async Data Loading with `$effect`
```svelte
<!-- Pattern for root +layout.svelte and admin data-loading layouts -->
<svelte:options runes />

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  let error = $state<Error | undefined>();
  let ready = $state(false);

  $effect(() => {
    error = undefined;
    ready = false;
    Promise.all([data.somePromise, data.otherPromise]).then(
      (results) => {
        // Process results, set ready = true
        ready = true;
      }
    );
  });
</script>

{#if error}
  <ErrorMessage />
{:else if !ready}
  <Loading />
{:else}
  {@render children?.()}
{/if}
```

### `$app/state` updated usage
```svelte
<!-- Source: https://svelte.dev/docs/kit/$app-state -->
<script>
  import { updated } from '$app/state';
  import { beforeNavigate } from '$app/navigation';

  beforeNavigate(({ willUnload, to }) => {
    if (updated.current && !willUnload && to?.url) {
      location.href = to.url.href;
    }
  });
</script>
```

### Direct Component Rendering (replacing `<svelte:component>`)
```svelte
<!-- Source: Svelte 5 migration guide -->
<!-- Old: -->
{#await import('./MyComponent.svelte') then Module}
  <svelte:component this={Module.default} someProp={value} />
{/await}

<!-- New: -->
{#await import('./MyComponent.svelte') then Module}
  <Module.default someProp={value} />
{/await}
```

### Props with Defaults and Rest Props (replacing `$$Props`/`$$restProps`)
```svelte
<!-- Source: Svelte 5 migration guide -->
<svelte:options runes />

<script lang="ts">
  import type { MaintenancePageProps } from './MaintenancePage.type';

  let { title, content, emoji, ...restProps }: MaintenancePageProps = $props();

  // Compute defaults (props are read-only)
  let effectiveTitle = $derived(title ?? 'Default Title');
</script>

<main {...restProps}>
  <h1>{effectiveTitle}</h1>
</main>
```

### Event Handler Migration
```svelte
<!-- Old: on:click, on:change -->
<button on:click={handler}>Click</button>
<select on:change={handler}>...</select>

<!-- New: onclick, onchange -->
<button onclick={handler}>Click</button>
<select onchange={handler}>...</select>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `export let prop` | `let { prop } = $props()` | Svelte 5 (Oct 2024) | Props are read-only, use `$bindable()` for two-way |
| `$: derived = expr` | `let derived = $derived(expr)` | Svelte 5 | Cleaner dependency tracking |
| `$: { sideEffect() }` | `$effect(() => { sideEffect() })` | Svelte 5 | Explicit effect lifecycle |
| `<slot />` | `{@render children()}` | Svelte 5 | Type-safe, composable snippets |
| `$$Props` / `$$restProps` | `$props()` destructuring with `...rest` | Svelte 5 | Standard JS destructuring |
| `<svelte:component this={X}>` | `<X />` directly | Svelte 5 | Dynamic components just work |
| `on:event={handler}` | `onevent={handler}` | Svelte 5 | Standard DOM event props |
| `createEventDispatcher` | Callback props | Svelte 5 | Simpler, type-safe |
| `$app/stores` (page, updated) | `$app/state` (page, updated) | SvelteKit 2.12 | Rune-native reactivity |

## Open Questions

1. **`svelte-visibility-change` in root layout**
   - What we know: The library (v0.6.0) is a legacy Svelte 3/4 component using `createEventDispatcher`. It's dynamically imported and rendered with `<svelte:component>`.
   - What is unclear: Whether to keep the library with `onhidden` prop syntax or replace with direct DOM API.
   - Recommendation: Replace with direct DOM API in an `$effect` (simpler, no third-party dependency for a 3-line feature). This is Claude's discretion per CONTEXT.md.

2. **Post-Phase 52 context API shape**
   - What we know: After Phases 50-52, context values are `$state`-based with direct property access (no `$` prefix).
   - What is unclear: Exact property names and whether any context values need special access patterns (e.g., version counter for DataRoot).
   - Recommendation: The planner should verify the actual post-Phase 52 API shape when executing. The pattern will be `dataRoot.update(...)` not `$dataRoot.update(...)`.

3. **`concatClass` utility compatibility with runes**
   - What we know: `concatClass` takes `$$restProps` as first argument. In runes, this becomes `restProps` from `$props()` spread.
   - What is unclear: Whether the `concatClass` function signature handles the runes `...rest` spread correctly.
   - Recommendation: `concatClass(restProps, 'classes')` should work identically since `...rest` from `$props()` has the same shape as `$$restProps`. LOW risk.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via workspace) |
| Config file | `apps/frontend/vitest.config.ts` |
| Quick run command | `yarn test:unit` |
| Full suite command | `yarn test:unit && yarn build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R5.1 | Root layout uses runes, data loads correctly | build + e2e | `yarn build` | N/A (build verification) |
| R5.2 | Admin routes use runes syntax | build | `yarn build` | N/A |
| R5.3 | Shared components use runes syntax | build | `yarn build` | N/A |
| R5.4 | Zero `<slot>` in any .svelte file | grep | `grep -r '<slot' apps/frontend/src/routes/ --include='*.svelte'` | N/A (grep check) |
| R5.5 | Zero `$:` in any target .svelte file | grep | `grep -r '^\s*\$:' apps/frontend/src/routes/ --include='*.svelte'` | N/A (grep check) |
| R5.6 | Zero `export let` in any target .svelte file | grep | `grep -r 'export let' apps/frontend/src/routes/ --include='*.svelte'` | N/A (grep check) |

### Sampling Rate
- **Per task commit:** `yarn build` (catches syntax/type errors in converted files)
- **Per wave merge:** `yarn test:unit && yarn build`
- **Phase gate:** Full suite green + zero legacy syntax grep verification

### Wave 0 Gaps
None -- existing build and test infrastructure covers all phase requirements. No new test files needed; this phase is verified by successful build + grep checks for zero legacy syntax.

## Sources

### Primary (HIGH confidence)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide) -- `$props()`, `$derived`, `$effect`, `{@render}`, `<svelte:component>` removal, event handler syntax
- [$app/state SvelteKit Docs](https://svelte.dev/docs/kit/$app-state) -- `updated.current` API, migration from `$app/stores`
- [$app/stores SvelteKit Docs](https://svelte.dev/docs/kit/$app-stores) -- Deprecation notice, migration guidance
- Direct source code analysis of all 16 files in the codebase (HIGH confidence)
- Already-migrated files in codebase (e.g., `(voters)/+layout.svelte`, `Layout.svelte`, `results/+layout.svelte`) as pattern references

### Secondary (MEDIUM confidence)
- [svelte-visibility-change npm](https://www.npmjs.com/package/svelte-visibility-change) -- Version 0.7.0 available, 0.6.0 installed
- [svelte-visibility-change GitHub](https://github.com/metonym/svelte-visibility-change) -- Source code review confirms Svelte 3/4 patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; all versions verified against installed packages
- Architecture: HIGH -- all 16 files read and analyzed; conversion patterns derived from official Svelte 5 docs and already-migrated files in the same codebase
- Pitfalls: HIGH -- derived from actual code analysis and known Svelte 5 migration issues documented in official guide

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- Svelte 5 runes API is settled)
