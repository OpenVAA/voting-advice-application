# Architecture Patterns: Svelte 5 Content Migration (Voter App)

**Domain:** Migrating voter app routes, shared components, contexts, and stores from Svelte 4 patterns to Svelte 5 idioms
**Researched:** 2026-03-18

## Recommended Architecture: Bottom-Up Component Migration with Context Bridge Layer

The strategy is to migrate components bottom-up (leaf components first, then containers, then routes, then contexts) while maintaining a temporary bridge layer that lets Svelte 5 rune-based code coexist with store-based contexts. The context system is migrated last because it is the deepest dependency -- every component and route depends on it.

**Confidence:** HIGH (based on official Svelte 5 migration guide, codebase analysis, Svelte 5.53.12 API surface)

---

## Current Architecture Analysis

### Component Count and Legacy Pattern Usage

| Layer | Svelte Files | `$:` Reactive | `on:event` | `<slot>`/`slot=` | `$$Props`/`$$restProps`/`$$slots` |
|-------|-------------|---------------|------------|-----------------|----------------------------------|
| `lib/components/` | 63 | 53 occurrences (28 files) | 78 occurrences (24 files) | 28 occurrences (15 files) | 399 occurrences (63 files) |
| `lib/dynamic-components/` | 30 | ~10 | 39 occurrences (19 files) | 18 occurrences (13 files) | ~89 occurrences (28 files) |
| `routes/(voters)/` | 19 | ~5 | 5 occurrences (4 files) | 40 occurrences (17 files) | ~10 |
| `routes/` (root layouts) | 8 | ~8 | ~5 | ~6 | ~5 |

### Context Dependency Chain

The contexts form a strict initialization chain in `+layout.svelte`:

```
initI18nContext()
  -> initComponentContext()     [depends on I18n]
    -> initDataContext()        [depends on I18n]
      -> initAppContext()       [depends on Component + Data]
        -> initLayoutContext()  [standalone]
        -> initAuthContext()    [standalone]
          -> initVoterContext() [depends on App, in (voters)/+layout.svelte]
```

Every voter route calls `getVoterContext()` which returns all properties from VoterContext, AppContext, ComponentContext, DataContext, and I18nContext merged together. This means the context system is the FOUNDATION -- migrating it requires every consumer to update simultaneously, so it must be done last.

### Store Usage Patterns

The codebase uses four distinct store patterns that each need different migration strategies:

| Pattern | Example | Svelte 5 Replacement | Complexity |
|---------|---------|---------------------|------------|
| `parsimoniusDerived()` | `selectedElections`, `matches`, `opinionQuestions` | `$derived` in context class | HIGH -- 15+ instances in voter context alone, custom caching semantics |
| `storageWritable()` (local/session) | `answerStore`, `userPreferences`, `selectedQuestionCategoryIds` | `$state` + manual `$effect` for storage sync | MEDIUM -- need to preserve storage persistence |
| `stackedStore()` | `topBarSettings`, `pageStyles`, `navigationSettings` | Custom class with `$state` + push/revert methods | MEDIUM -- unique stack-based pattern |
| `paramStore()` / `pageDatumStore()` | `electionId`, `constituencyId`, `appSettingsData` | `$derived` from `page` (`$app/state`) | LOW -- direct replacement available |

### DataRoot Integration Problem

The `DataRoot` from `@openvaa/data` is a mutable-in-place object that fires `onUpdate()` callbacks. The current workaround (`alwaysNotifyStore` in `dataContext.ts`) exists because Svelte 5's `Object.is()` equality check skips notifications for same-reference objects. This is the single most architecturally significant migration challenge.

**The fix:** Wrap `DataRoot` in a `$state` proxy object using the class pattern:

```typescript
class DataContextState {
  root = $state<DataRoot>(new DataRoot({ locale: getLocale() }));
  #version = $state(0);

  get dataRoot() {
    // Touch version to create dependency
    void this.#version;
    return this.root;
  }

  notifyUpdate() {
    this.#version++;
  }
}
```

This replaces the `alwaysNotifyStore` hack with idiomatic Svelte 5 reactivity.

---

## Component Boundaries

### What Changes vs What Stays

#### Files That Are MODIFIED (Svelte 4 -> Svelte 5 idioms)

| Category | Files Affected | Key Changes |
|----------|---------------|-------------|
| **Voter route pages** | 14 `+page.svelte` + 4 `+layout.svelte` | `export let data` -> `let { data } = $props()`, `$:` -> `$derived`/`$effect`, `on:click` -> `onclick`, `slot=` -> `{#snippet}` |
| **Shared components (voter-used)** | ~25 from `lib/components/` | `export let` -> `$props()`, `$$Props` -> typed `$props<>()`, `$$restProps` -> `...rest`, `$$slots` -> check snippet presence, `<slot>` -> `{@render}`, `on:event` -> callback props |
| **Dynamic components (voter-used)** | ~15 from `lib/dynamic-components/` | Same patterns as shared components |
| **Root route files** | `Layout.svelte`, `MainContent.svelte`, `+layout.svelte` | Full migration of all patterns |
| **Context system** | 9 context directories + utils | Stores -> `$state`/`$derived` classes, `setContext`/`getContext` retained (or `createContext` if Svelte >=5.40) |
| **Context utils** | `parsimoniusDerived.ts`, `paramStore.ts`, `pageDatumStore.ts`, `storageStore.ts`, `stackedStore.ts` | Rewrite to rune-based equivalents or DELETE if `$derived` covers the use case |

#### Files That STAY UNCHANGED (out of v1.3 scope)

| Category | Reason |
|----------|--------|
| `routes/candidate/` | Deferred to v1.4 |
| `routes/admin/` | Deferred to later milestone |
| Candidate-only components | Not in voter app dependency tree |
| `packages/*` | No Svelte dependency, consumed as built JS |
| `apps/strapi/` | Backend, independent |
| `apps/docs/` | Separate documentation site |
| Data adapters (`lib/api/`) | Pure TypeScript, no Svelte patterns |

#### Components Shared Between Voter and Candidate Apps

These components are used by BOTH voter and candidate routes and must be migrated carefully so the candidate app (still on Svelte 4 patterns during v1.3) continues to work:

| Component | Voter Uses | Candidate Uses | Migration Strategy |
|-----------|-----------|---------------|-------------------|
| `Button` | 15+ | 10+ | Migrate fully -- Svelte 5 components accept both old and new patterns from callers |
| `Modal` / `ModalContainer` | 5+ | 5+ | Migrate fully -- callback props work alongside `on:event` callers |
| `Icon` | Everywhere | Everywhere | Migrate fully -- pure display, no event forwarding |
| `Loading` | 5+ | 3+ | Migrate fully -- trivial leaf component |
| `ErrorMessage` | 3+ | 2+ | Migrate fully -- trivial leaf component |
| `HeadingGroup` | 3+ | 2+ | Migrate -- slot to snippet, candidate callers still work |
| `Input` | 0 (voter doesn't use) | 10+ | SKIP -- candidate-only, defer to v1.4 |
| `PreventNavigation` | 0 | 3+ | SKIP -- candidate-only |

**Critical insight:** Svelte 5 components can receive both old-style slotted content AND new-style snippets. A migrated `Button` component using `{@render children?.()}` will still work when a candidate route passes `<Button on:click={...}>text</Button>` because Svelte 5's compatibility mode automatically wraps the old syntax. However, `on:click` event forwarding from the component side (`on:click` on the element without a handler) is removed in Svelte 5 -- these must become callback props.

---

## Migration Order Architecture

### Phase Dependency Graph

```
Phase 1: Leaf components (no children, no slots, no events)
    |
    v
Phase 2: Container components (slots -> snippets, events -> callbacks)
    |
    v
Phase 3: Root layout components (Layout.svelte, MainContent.svelte)
    |
    v
Phase 4: Voter route pages (consumers of contexts + components)
    |
    v
Phase 5: Context utils (parsimoniusDerived -> $derived, paramStore -> $derived(page))
    |
    v
Phase 6: Context system (stores -> $state/$derived classes)
    |
    v
Phase 7: Root layout context initialization (final integration)
```

### Phase 1: Leaf Components (No Dependencies Down)

Components that render content but don't compose other custom components or use slots. Safe to migrate independently.

**Voter-used leaf components:**
- `Icon`, `Loading`, `ErrorMessage`, `SuccessMessage`, `Avatar`
- `HeroEmoji`, `Hero`, `CategoryTag`, `ElectionSymbol`, `ElectionTag`
- `MatchScore`, `ScoreGauge`, `InfoBadge`, `OpenVAALogo`
- `Image`, `Toggle`, `Warning`, `Term`

**Migration pattern per component:**
```svelte
<!-- BEFORE -->
<script lang="ts">
  import type { IconProps } from './Icon.type';
  type $$Props = IconProps;
  export let name: $$Props['name'];
  export let size: $$Props['size'] = 'md';
</script>

<!-- AFTER -->
<script lang="ts">
  import type { IconProps } from './Icon.type';
  let { name, size = 'md', ...rest }: IconProps = $props();
</script>
```

### Phase 2: Container Components (Slots + Events)

Components with `<slot>`, `on:click` forwarding, `$$slots` checks. These need the most careful migration.

**Key voter-used container components:**
- `Button` (6 slot refs, event forwarding, `$$restProps`)
- `Modal` / `ModalContainer` (named slots, `bind:openModal`/`bind:closeModal`)
- `MainContent` (5 named slots: `note`, `hero`, `heading`, `fullWidth`, `primaryActions`)
- `Layout.svelte` (2 named slots: default + `menu`)
- `Alert` (3 slot refs, `on:close`)
- `Expander` (1 slot)
- `Notification` (1 slot)
- `Tabs` (slot-based tab panels)
- `HeadingGroup` (slot)
- `AccordionSelect` (slot)

**Migration pattern for named slots:**

```svelte
<!-- BEFORE (MainContent.svelte) -->
<script lang="ts">
  type $$Props = MainContentProps;
  export let title: $$Props['title'];
</script>

{#if $$slots.primaryActions}
  <section>
    <slot name="primaryActions" />
  </section>
{/if}

<!-- Caller -->
<MainContent title="Elections">
  <Button slot="primaryActions" on:click={submit} text="Continue" />
</MainContent>

<!-- AFTER -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { title, primaryActions, children, hero, heading, note, fullWidth, ...rest }: {
    title: string;
    primaryActions?: Snippet;
    children?: Snippet;
    hero?: Snippet;
    heading?: Snippet;
    note?: Snippet;
    fullWidth?: Snippet;
  } & HTMLAttributes<HTMLDivElement> = $props();
</script>

{#if primaryActions}
  <section>
    {@render primaryActions()}
  </section>
{/if}

<!-- Caller -->
<MainContent title="Elections">
  {#snippet primaryActions()}
    <Button onclick={submit} text="Continue" />
  {/snippet}
</MainContent>
```

**Migration pattern for event forwarding:**

```svelte
<!-- BEFORE (Button.svelte) -->
<svelte:element this={href == null ? 'button' : 'a'} on:click ...>

<!-- AFTER -->
<script lang="ts">
  let { onclick, ...rest } = $props();
</script>
<svelte:element this={href == null ? 'button' : 'a'} {onclick} ...>
```

### Phase 3: Root Layout Components

`Layout.svelte` and `MainContent.svelte` in `routes/` are shared between voter and candidate apps. They must be migrated carefully.

`Layout.svelte` migration involves:
- `export let menuId` / `isDrawerOpen` -> `$props()` with `$bindable()`
- `type $$Props` -> typed props destructuring
- Named slots (`menu`, default) -> snippet props
- `on:click={closeDrawer}` -> `onclick={closeDrawer}`
- Store subscriptions (`$pageStyles`, `$showVideo`) remain until Phase 6

`MainContent.svelte` migration involves:
- 6 named slots -> snippet props
- `$$slots.x` checks -> `x != null` snippet checks
- `$$restProps` -> `...rest` spread
- `type $$Props` removal

### Phase 4: Voter Route Pages

14 voter `+page.svelte` files and 4 `+layout.svelte` files.

**Pattern A: Simple pages (about, privacy, info)** -- straightforward prop/slot migration:
```svelte
<!-- BEFORE -->
<MainContent title={t('about.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={t('dynamic.about.heroEmoji')} />
  </figure>
  <p>{t('about.content')}</p>
</MainContent>

<!-- AFTER -->
<MainContent title={t('about.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.about.heroEmoji')} />
    </figure>
  {/snippet}
  <p>{t('about.content')}</p>
</MainContent>
```

**Pattern B: Data-loading pages (elections, constituencies)** -- replace `$:` reactive blocks:
```svelte
<!-- BEFORE -->
export let data;
$: {
  elections = $dataRoot.elections;
  setSelected();
}
$: canSubmit = selected?.length > 0;

<!-- AFTER -->
let { data } = $props();
let elections = $derived.by(() => {
  const e = $dataRoot.elections;
  // Filter logic...
  return e;
});
let selected = $state<Array<Id>>([]);
let canSubmit = $derived(selected.length > 0);
```

**Pattern C: Root +layout.svelte** -- the most complex, handles data loading promises:
```svelte
<!-- BEFORE -->
export let data: LayoutData;
let error: Error | undefined;
let ready: boolean;
$: {
  error = undefined;
  ready = false;
  Promise.all([...]).then((data) => { error = update(data); });
}

<!-- AFTER -->
let { data, children } = $props();
let error = $state<Error | undefined>();
let ready = $state(false);
$effect(() => {
  error = undefined;
  ready = false;
  Promise.all([data.appSettingsData, ...]).then((resolved) => {
    error = update(resolved);
  });
});
```

### Phase 5: Context Utility Rewrites

Replace the custom store utilities with rune-based equivalents:

**`parsimoniusDerived` -> DELETE:** Replace all call sites with `$derived` or `$derived.by()`. The caching behavior of `parsimoniusDerived` was a workaround for Svelte 4's eager resubscription; `$derived` in Svelte 5 is natively lazy and memoized.

**`paramStore` -> inline `$derived`:** Replace with:
```typescript
// Before
const electionId = paramStore('electionId');
// After (in context class)
get electionId() { return parseParams(page)[paramName]; }
```

Where `page` comes from `$app/state` (not `$app/stores`).

**`pageDatumStore` -> inline `$derived`:** Replace with:
```typescript
// Before
const appSettingsData = pageDatumStore<DynamicSettings>('appSettingsData');
// After
get appSettingsData() { return page.data['appSettingsData']; }
```

**`storageStore` -> `$state` + `$effect`:** Replace with a utility that creates a `$state` value with an `$effect` that syncs to `localStorage`/`sessionStorage`.

**`stackedStore` -> class with `$state`:** Rewrite as:
```typescript
class StackedState<T> {
  #stack = $state<T[]>([]);

  constructor(initial: T) { this.#stack = [initial]; }

  get current() { return this.#stack[this.#stack.length - 1]; }
  push(value: T) { this.#stack = [...this.#stack, value]; }
  revert(index: number) { this.#stack = this.#stack.slice(0, index + 1); }
  get length() { return this.#stack.length; }
}
```

### Phase 6: Context System Migration

Convert each context from "bag of stores" to "class with `$state`/`$derived` properties."

**Current pattern:**
```typescript
export function initVoterContext(): VoterContext {
  const appContext = getAppContext();
  const electionsSelectable = parsimoniusDerived([appSettings, dataRoot], ...);
  return setContext(CONTEXT_KEY, { ...appContext, electionsSelectable, ... });
}
// Consumer:
const { selectedElections, t } = getVoterContext();
// In template: {$selectedElections.map(...)}
```

**New pattern:**
```typescript
class VoterContextState {
  #app: AppContextState;

  constructor(app: AppContextState) { this.#app = app; }

  get electionsSelectable() {
    return !this.#app.appSettings.elections?.disallowSelection
      && this.#app.dataRoot.elections?.length !== 1;
  }

  get selectedElections() {
    // Derived computation using $derived semantics
    // ...
  }
}

export function initVoterContext(): VoterContextState {
  const app = getAppContext();
  const ctx = new VoterContextState(app);
  return setContext(CONTEXT_KEY, ctx);
}

// Consumer:
const voter = getVoterContext();
// In template: {voter.selectedElections.map(...)}  (no $ prefix)
```

**Migration impact on consumers:** Every `$storeName` reference in templates becomes `context.propertyName`. This is a mechanical find-and-replace within each file but touches many lines.

**Use `createContext` (Svelte 5.40+):** Since we're on Svelte 5.53.12, use the new typed context API:
```typescript
import { createContext } from 'svelte';
export const [getVoterContext, setVoterContext] = createContext<VoterContextState>();
```

This eliminates the manual `Symbol()` key and `hasContext` check boilerplate.

### Phase 7: Root Layout Integration

Final step: update `+layout.svelte` to initialize contexts using the new class-based system, pass `children` snippet instead of `<slot>`, and use `$app/state` instead of `$app/stores`.

---

## Data Flow Comparison

### Current Data Flow (Store-Based)

```
+layout.ts (load function)
    -> page.data (SvelteKit page store)
        -> pageDatumStore() extracts subkeys
            -> appContext subscribes to pageDatumStore
                -> parsimoniusDerived chains through voterContext
                    -> store value flows to components via $storeName
```

### Target Data Flow (Rune-Based)

```
+layout.ts (load function)
    -> page.data ($app/state, fine-grained)
        -> AppContext class reads page.data directly via $derived
            -> VoterContext class computes $derived properties
                -> Components read context.property directly
```

Key improvement: The intermediate `pageDatumStore` and `parsimoniusDerived` layers disappear. `$derived` provides the same caching behavior natively.

---

## Patterns to Follow

### Pattern 1: Props Migration

**What:** Convert `export let` + `type $$Props` to `$props()` with TypeScript interface.

**When:** Every component migration.

**Example:**
```typescript
// Before
import type { ButtonProps } from './Button.type';
type $$Props = ButtonProps;
export let text: $$Props['text'];
export let variant: $$Props['variant'] = 'normal';

// After
import type { ButtonProps } from './Button.type';
let { text, variant = 'normal', ...rest }: ButtonProps = $props();
```

**Note on `$bindable()`:** Properties that parent components `bind:` to (like `isDrawerOpen` in `Layout.svelte`, `closeModal`/`openModal` in `Modal`) must use `$bindable()`:
```typescript
let { isDrawerOpen = $bindable(false) } = $props();
```

### Pattern 2: Event Handler Migration

**What:** Replace `on:event` directive with callback props.

**When:** Any component forwarding or dispatching events.

**Rules:**
1. Native DOM events on native elements: `on:click` -> `onclick` (lowercase, no colon)
2. Component event forwarding: `on:click` (passthrough) -> accept `onclick` in `$props()` and spread
3. `createEventDispatcher` -> callback props (e.g., `onChange`, `onClose`)
4. Event modifiers (`|preventDefault|stopPropagation`) -> inline in handler

**Example (Button.svelte):**
```svelte
<!-- Before: event forwarding via on:click -->
<svelte:element this={...} on:click role="button" ...>

<!-- After: callback prop -->
<script lang="ts">
  let { onclick, ...rest } = $props();
</script>
<svelte:element this={...} {onclick} role="button" ...>
```

### Pattern 3: Slot to Snippet Migration

**What:** Replace `<slot>` with `{@render}` and named slots with snippet props.

**When:** Any component accepting child content.

**Rules:**
1. Default `<slot />` -> accept `children` prop, render `{@render children?.()}`
2. Named `<slot name="x" />` -> accept `x` snippet prop, render `{@render x?.()}`
3. `$$slots.x` check -> `x != null` check
4. `<div slot="x">` in caller -> `{#snippet x()}<div>...</div>{/snippet}` in caller
5. Slot with `let:x` -> snippet parameter: `{#snippet name(x)}...{/snippet}`

### Pattern 4: Reactive Statement Migration

**What:** Replace `$:` blocks with `$derived` and `$effect`.

**When:** Any component with reactive declarations.

**Rules:**
1. `$: x = expr` -> `let x = $derived(expr)` (pure computation)
2. `$: { multiline }` -> `let x = $derived.by(() => { ... })` (computation with logic)
3. `$: if (cond) sideEffect()` -> `$effect(() => { if (cond) sideEffect() })`
4. `$: { x = ...; y = ...; }` -> separate `$derived` for each if independent; `$effect` if they must be set together

**Important difference:** `$derived` values are read-only. If the original `$:` both computed AND was later assigned to (like `let selected; $: selected = ...; // later: selected = newValue`), use `$state` with an `$effect` that recomputes, or restructure to separate the computation from the mutation.

### Pattern 5: Context Consumer Update

**What:** Update context consumers when context migrates from stores to rune state.

**When:** Phase 6-7, after context system migration.

**Pattern:**
```svelte
<!-- Before: store-based context -->
<script>
  const { selectedElections, t } = getVoterContext();
</script>
{#each $selectedElections as election}

<!-- After: rune-based context -->
<script>
  const voter = getVoterContext();
</script>
{#each voter.selectedElections as election}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Top-Down Migration

**What:** Starting with root layouts and working down to leaf components.

**Why bad:** Root layouts initialize contexts and compose many components. If you change the root first, you must simultaneously update all children. The blast radius is the entire voter app.

**Instead:** Start with leaf components (Icon, Loading, etc.) that have no downstream consumers. Each migration is self-contained and independently testable.

### Anti-Pattern 2: Migrating Context Before Components

**What:** Converting the context system from stores to `$state`/`$derived` before component props and events are migrated.

**Why bad:** Every component currently reads context via `const { appSettings } = getVoterContext()` and accesses values via `$appSettings`. Changing the context return type requires updating every consumer simultaneously.

**Instead:** Migrate components first while they still consume store-based contexts (stores work fine in Svelte 5). Then migrate contexts last, updating all consumers in a single batch per context.

### Anti-Pattern 3: Using `$effect` for Derived Values

**What:** Using `$effect` to update a `$state` variable when a `$derived` would work.

**Why bad:** Creates unnecessary reactive nodes, risks infinite loops, harder to reason about.

**Instead:** Always prefer `$derived` or `$derived.by()`. Use `$effect` only for true side effects (DOM manipulation, API calls, logging, localStorage sync).

### Anti-Pattern 4: Breaking the Context Inheritance Chain

**What:** Migrating `VoterContext` to runes while `AppContext` still uses stores, or vice versa.

**Why bad:** `VoterContext` extends `AppContext` (spread `...appContext` into the return). If they use different reactivity models, consumers see a mix of stores and rune state on the same context object.

**Instead:** Migrate the entire context chain (I18n -> Component -> Data -> App -> Voter) in a single phase. All contexts switch together.

### Anti-Pattern 5: Premature DataRoot Rune Conversion

**What:** Trying to make `DataRoot` itself use `$state` internally.

**Why bad:** `DataRoot` lives in `@openvaa/data` package which has no Svelte dependency and shouldn't have one. It's consumed by non-Svelte code (matching algorithms, tests, CLI tools).

**Instead:** Keep `DataRoot` as-is. Wrap it in a reactive proxy at the context boundary (the version-counter pattern described above). The `@openvaa/data` package stays framework-agnostic.

---

## Scalability Considerations

| Concern | During Migration (v1.3) | After Migration (v1.3 complete) | Long-term (v1.4+) |
|---------|------------------------|--------------------------------|-------------------|
| Mixed patterns | Old + new patterns coexist safely in Svelte 5 | Zero legacy patterns in voter app | Candidate app migration follows same order |
| E2E test stability | Run full 92-test suite after each phase | All tests pass, no regressions | Same suite covers candidate migration |
| Build performance | No impact -- Turborepo caching works regardless of Svelte patterns | Slightly smaller bundle (no store compatibility overhead) | Further optimization with tree-shaking |
| Context type safety | Keep existing `Readable<T>` types until Phase 6 | Full rune types, no `Readable<T>` in voter contexts | `createContext<T>` provides type inference |

---

## TODO[Svelte 5] Resolution Map

The codebase contains 13+ `TODO[Svelte 5]` markers from v1.2. Here's how each resolves:

| Location | TODO | Resolution |
|----------|------|-----------|
| `dataContext.ts:60` | Replace with `$state`/`$derived` | Phase 6: DataRoot version-counter class pattern |
| `pageDatumStore.ts:7` | Replace with subproperty subscriptions | Phase 5: DELETE file, use `$derived(page.data.key)` directly |
| `+layout.svelte:56` | Centralize in DataContext | Phase 7: `$effect` in root layout reads `page.data` and updates context |
| `elections/+page.svelte:38,49` | Check if reactivity needed | Phase 4: Replace with `$derived`, simpler logic |
| `constituencies/+page.svelte:46,53` | Check if reactivity needed | Phase 4: Same as elections |
| `(located)/+layout.svelte:84` | Rewrite with runes | Phase 4: Replace `awaitNominationsSettled` with `$effect` |
| `EntityCard.svelte:264` | Whitespace auto-fix | Phase 2: Svelte 5 handles this natively |
| `EntityCardAction.svelte:4` | Convert to `$snippet` | Phase 2: Convert to snippet prop |
| `Alert.svelte:73` | Refactor onClose | Phase 2: Use `onclose` callback prop |
| `Input.svelte:337` | Use snippets | SKIP v1.3 (Input is candidate-only) |
| `ConstituencySelector.svelte:79` | Check if necessary | Phase 2: Replace with `$derived` |
| `EntityFilters.svelte:36` | Check if needed | Phase 2: Replace with `$derived` |
| `EnumeratedEntityFilter.svelte:81` | Check extra setting | Phase 2: Verify with `$derived`, simplify |
| `jobStores.ts:53` / `jobStores.type.ts:21,26` | Count subscriptions for auto-polling | DEFER (admin-only, out of v1.3 scope) |
| `WithPolling.svelte:5` | Count subscriptions | DEFER (admin-only) |
| `i18n/tests/utils.test.ts:6` | Probably not needed | Phase 5: Remove if confirmed unnecessary |

---

## SvelteKit-Specific Migration Points

### `$app/stores` -> `$app/state`

The `page` store from `$app/stores` is deprecated. Replace with `page` from `$app/state`:

```typescript
// Before
import { page } from '$app/stores';
$: params = $page.params;

// After
import { page } from '$app/state';
const params = $derived(page.params);
```

**Critical:** Changes to `page` from `$app/state` are ONLY visible with runes. The legacy `$:` syntax will NOT reflect changes. This means `$app/state` migration must happen AFTER the component's own reactivity is migrated to runes.

### `updated` Store

```typescript
// Before
import { updated } from '$app/stores';
if ($updated && !willUnload && to?.url) ...

// After
import { updated } from '$app/state';
if (updated.current && !willUnload && to?.url) ...
```

### Layout `data` Prop

```svelte
<!-- Before -->
<script>
  export let data: LayoutData;
</script>

<!-- After -->
<script>
  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

{@render children()}  <!-- replaces <slot /> -->
```

---

## Sources

- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide) (official docs) -- HIGH confidence
- [Svelte 5 Context Documentation](https://svelte.dev/docs/svelte/context) -- HIGH confidence
- [$app/state Documentation](https://svelte.dev/docs/kit/$app-state) -- HIGH confidence
- [Runes and Global State: Do's and Don'ts](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) -- MEDIUM confidence
- [Svelte 5 Patterns: Shared State, getContext, Tweened Stores](https://fubits.dev/notes/svelte-5-patterns-simple-shared-state-getcontext-tweened-stores-with-runes/) -- MEDIUM confidence
- [Different Ways to Share State in Svelte 5](https://joyofcode.xyz/how-to-share-state-in-svelte-5) -- MEDIUM confidence
- [createContext PR by Rich Harris](https://github.com/sveltejs/svelte/pull/16948) -- HIGH confidence
- Codebase analysis of `apps/frontend/src/` -- HIGH confidence (direct observation)
