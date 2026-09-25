# Phase 165: Results Navigation Redraw - Pattern Map

**Mapped:** 2026-09-23
**Files analyzed:** 28 (9 created · 19 modified)
**Analogs found:** 26 / 28
**Measured on:** worktree `voting-advice-application-spike`, branch `spike/results-redraw`, HEAD `0445370d9`

---

## How to read this document

Every analog path below was checked against `git ls-files` and is **git-tracked source** in this
worktree. No path points into a build mirror (`.svelte-kit/`, `node_modules/`, `.turbo/`).

**Line numbers are a convenience, not the anchor.** Per the project's standing content-anchor rule
(`.planning/` memory: *"Content-anchor citations, never line numbers"*), each excerpt names the
**construct** — a function name, a comment's opening words, a testid string — and gives the line
where it stood when measured (`@NNN`, 2026-09-23). The planner re-derives the line at run time; the
construct is the contract.

**Standing constraint that binds every Svelte analog in this phase.** CLAUDE.md § *Context
Destructuring Rule (Svelte 5)* and `.claude/skills/components/context-reactivity.md`:

- Never destructure a reactive accessor off `getVoterContext()`.
- Never bind `dataRoot` to an intermediate `$derived` read alias.

Every route-file excerpt below is annotated **⚠ CTX** wherever the analog reads a reactive accessor,
so the correct read pattern is inherited rather than the alias. D-07's file split multiplies the
temptation by three.

---

## File Classification

### A — Route tree (D-07 / D-08 / D-09 / D-10)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` **(MODIFIED — split to L1)** | route / layout | request-response (URL→render) | itself, pre-split; shape ref `results-layered/[electionTab]/+layout.svelte` | exact (self) |
| `routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte` **(NEW — L2)** | route / layout | request-response | `results-layered/[electionTab]/+layout.svelte` (the tab-owning layer) | role-match — **required→optional param correction needed** |
| `routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte` **(MODIFIED — empty → list + opener)** | route / page | request-response | `results/[[electionTab]]/+layout.svelte` markup block `{#snippet fullWidth()}` … `{/snippet}` | exact (extraction from self) |
| `routes/(voters)/(located)/results/[[electionTab]]/resultsRoutes.ts` **(NEW, optional — `buildListRoute` extraction)** | utility (route builder) | transform | `apps/frontend/src/lib/routes/route.ts` + the in-file `buildListRoute` | role-match |
| `routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts` | route / guard load | request-response | **unchanged** (D-10 keeps it in place) | n/a |
| `routes/(voters)/(located)/results/[[electionTab]]/+layout.ts` | route / guard load | request-response | **unchanged** | n/a |
| `routes/(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte` **(disposition, Pitfall 1)** | route / page | request-response | no analog — see § *No Analog Found* | none |

### B — Drawer host (D-11 / D-12 / D-13 / D-14)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/components/modal/drawerHost/DrawerHost.svelte` **(NEW)** | component (overlay host) | event-driven | `lib/spike/DrawerHost.svelte` (subject) + `lib/components/modal/ModalContainer.svelte` (a11y contract) + `lib/components/modal/drawer/Drawer.svelte` (motion) | exact + two contract analogs |
| `lib/components/modal/drawerHost/drawerHostState.svelte.ts` **(NEW)** | store / singleton | pub-sub | `lib/spike/drawerHostState.svelte.ts` | exact |
| `lib/components/modal/drawerHost/ContextBridge.svelte` **(NEW)** | component (provider) | transform | `lib/spike/ContextBridge.svelte` | exact |
| `lib/components/modal/drawerHost/index.ts` **(NEW)** | barrel | — | `lib/components/modal/index.ts`, `lib/components/modal/drawer/index.ts` | exact |
| `lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte` **(NEW)** | component (opener) | event-driven | `lib/spike/GlobalEntityDrawer.svelte` | exact |
| `lib/components/questions/QuestionExtendedInfoButton.svelte` **(MODIFIED)** | component | event-driven | itself, spike form | exact (self) |
| `lib/dynamic-components/entityDetails/EntityDetailsDrawer.svelte` **(DELETE?)** + `index.ts` barrel | component + barrel | — | `lib/dynamic-components/entityDetails/index.ts` | exact |
| `lib/components/questions/QuestionExtendedInfoDrawer.svelte` **(DELETE?)** + `index.ts` barrel | component + barrel | — | `lib/components/questions/index.ts` | exact |
| `routes/+layout.svelte` **(MODIFIED — host mount + de-lab)** | route / root layout | event-driven | itself | exact (self) |

### C — Tests and instruments (D-04 / D-05 / D-16 / D-18 / D-20)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/utils/viewTransition.test.ts` **(NEW)** | unit test (pure fn, table) | transform | `lib/utils/focusNavigationTarget.test.ts`; table form from `lib/_guards/eslint-store-guard.test.ts` | exact |
| `lib/_guards/spike-scaffolding.test.ts` **(NEW)** | unit test (fs invariant guard) | file-I/O | `lib/routes/routeConsistency.test.ts` (fs walk + non-vacuity); dir convention from `lib/_guards/eslint-*-guard.test.ts` | role-match (best available) |
| `routes/(voters)/(located)/layout.tracking.test.ts` **(MODIFIED — control replaced)** | unit test | transform | itself: `recordingUrl` Proxy kept verbatim | exact (self) |
| `tests/tests/specs/voter/voter-results-redraw.spec.ts` **(NEW)** | e2e spec (leaf) | event-driven | `tests/tests/specs/voter/voter-nominations.spec.ts` (leaf shape) + `cold-entry-dataroot.spec.ts` (navigation-behaviour regression) | exact |
| `tests/tests/fixtures/voter/viewTransitionLog.fixture.ts` **(NEW, name at discretion)** | e2e fixture (capture seam) | event-driven | `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` | exact |
| `tests/tests/fixtures/voter/views.ts` **(MODIFIED — compose new fixture)** | e2e composition root | — | itself | exact (self) |
| `tests/playwright.config.ts` **(MODIFIED — new project block)** | config | — | the `voter-alliance` / `voter-nominations` LEAF project blocks | exact |
| `tests/tests/utils/testIds.ts` **(MODIFIED — see gap below)** | config / constants | — | itself, `voter.results` block | exact (self) |
| `tests/tests/specs/perm/perm-interactive-info.spec.ts` **(MODIFIED — host assertions, D-13)** | e2e spec (perm chain) | event-driven | itself | exact (self) |

### D — De-labbing (criteria 1–3, D-03 / D-05 / D-06)

Nine further production files carry a pure deletion. Their analog is **their own pre-spike form**,
recoverable with `git show e1f1944cf -- <path>`. They are listed in RESEARCH § *Row-by-row* and are
not re-tabulated here; § *Shared Patterns → De-lab excision* gives the one pattern they all follow.

### E — Documents (D-17 / D-22 / D-23 / D-24)

| New/Modified File | Role | Closest Analog | Match Quality |
|---|---|---|---|
| `.planning/phases/165-…/165-NEGATIVE-CONTROL.md` **(NEW)** | evidence doc | `.planning/phases/164-…/164-NEGATIVE-CONTROL.md` | exact — D-17 names it |
| `.planning/REQUIREMENTS.md` **(MODIFIED)** | requirements register | its own `### Component & Context Consolidation` section + `## Traceability` table | exact (self) |
| `.claude/skills/spike-findings-voting-advice-application-gsd/references/results-redraw.md` **(NEW)** + `SKILL.md` | skill reference | `references/page-navigation-and-transitions.md` (nearest domain) | role-match |
| `CLAUDE.md` **(MODIFIED — § Frontend subsection)** | project doc | its own § *Context Destructuring Rule (Svelte 5)* subsection | exact (self) |

---

## Pattern Assignments

### A1. `results/[[electionTab]]/+layout.svelte` — L1 (route / layout, request-response)

**Analog:** itself, pre-split. **Every construct L1 keeps already exists in this file.** The split is
subtraction plus one addition (`{@render children()}`).

**⚠ CTX — the context block L1 must keep verbatim** (`@61-72`, opening words *"The reactive context
getters (constituenciesSelectable, matches, …"*):

```svelte
// The reactive context getters (constituenciesSelectable, matches, nominationsAvailable, resultsAvailable, selectedConstituencies, selectedElections) are read via voterCtx.X.
// Genuinely stable members (getRoute, t, answers, startEvent, *Countdown) remain destructured.
//
// appSettings and dataRoot are NOT in that set. Both are bare reactive accessors, so per CLAUDE.md's Context Destructuring Rule neither may be destructured: appSettings is value-replacing, so a destructured local stops updating, and dataRoot is identity-stable behind a #version bridge, so the destructure takes the version dependency once at init and never again.
const voterCtx = getVoterContext();
const { answers, getRoute, startEvent, startFeedbackPopupCountdown, startSurveyPopupCountdown, t } = voterCtx;
// appSettings is value-replacing: a $derived read alias is safe and correct.
const appSettings = $derived(voterCtx.appSettings);
// dataRoot is identity-stable: read `voterCtx.dataRoot.<prop>` directly inside the consuming tracking scope, never through an intermediate $derived alias (referential equality would suppress downstream notification and the cold/direct-URL snapshot would stay empty). See CLAUDE.md "Context Destructuring Rule" and its stable-reference carve-out.
// Local aliases for template readability:
const elections = $derived(voterCtx.selectedElections);
const constituencies = $derived(voterCtx.selectedConstituencies);
```

**This comment block is the CLAUDE.md-rule carrier.** Copy it, trimmed to what each level actually
reads, into L2 and P3 as well — the `dataRoot` sentence must survive in all three copies.

**⚠ CTX — the two direct `dataRoot` reads L1 keeps**, both inside their consuming tracking scope,
never aliased:
- `{#if voterCtx.dataRoot.elections.length > 1}` (`@307`) — the picker gate.
- `{#if Object.values(voterCtx.nominationsAvailable).some(Boolean)}` (`@267`) — the whole-page empty state.

**Props pattern — the one line that changes.** Today (`@54-55`):

```svelte
// reason: child routes render via URL-driven Drawer state inside this layout, not via `{@render children()}`. Renamed to `_children` to satisfy unused-vars while preserving SvelteKit prop contract.
let { children: _children }: { children: Snippet } = $props();
```

Becomes `let { children }: { children: Snippet } = $props();` and the `// reason:` comment is
**deleted with it** — it documents a condition that no longer holds. (Deleting it is what
un-swallows `statistics/`; see § *No Analog Found*.)

**D-08's "picker instead of children" — the shape already in the file** (`@325-386`, the
`{#snippet fullWidth()}` block). `{@render children()}` goes exactly where the `{#if activeElectionId}`
true-branch body sits today:

```svelte
{#snippet fullWidth()}
  <div
    class="bg-base-300 flex min-h-[120vh] flex-col items-center [content-visibility:auto]"
    style="content-visibility: auto;"
    data-testid="voter-results-list-container">
    {#if activeElectionId}
      {@render children()}          <!-- was: the tabs + list markup, now owned by L2/P3 -->
    {:else}
      <p class="text-secondary mt-[2rem] text-center text-sm" transition:slide>
        {t('results.selectElectionFirst')}
      </p>
    {/if}
  </div>
{/snippet}
```

`{@render children()}` **inside a snippet** is legal — the snippet closes over the layout's `children`
prop — and is the only way to keep the descendant-owned list inside `MainContent`'s full-width region.

**Election-picker pattern L1 keeps** (`@307-323`), including the inline VT name that the `!important`
name-strip rule exists to beat:

```svelte
<AccordionSelect
  options={elections}
  {activeIndex}
  labelGetter={getName}
  onChange={handleElectionChange}
  class="-mt-md mb-lg"
  style="view-transition-name: results-election-select"
  data-testid="voter-results-election-select" />
```

**Handler pattern L1 keeps — D-15's deliberate asymmetry** (`@221-226`). Note: **no** `noScroll`,
unlike its L2 sibling. D-15 makes that difference load-bearing; it needs a comment saying so, because
it will otherwise read as an oversight next to `handleEntityTabChange`.

```ts
function handleElectionChange(details: { option: unknown }): void {
  const { id } = details.option as Election;
  const plural = _urlPlural ?? _pluralForActiveType();
  goto(buildListRoute(id, plural));
  startEvent('results_changeElection', { election: id });
}
```

**Lifecycle patterns L1 keeps** (`@171-189`): the `onMount` `results_ranked`/`results_browse` entry
event, and both popup-countdown `$effect`s. L1 is the level that survives every in-results navigation,
which is the reason they belong there and not lower.

**De-lab deletions in this file:** the `GlobalEntityDrawer` import (`@43`), the `lab, labMount` import
(`@44`), `labMount('ResultsLayout'); // SPIKE results-redraw` (`@264`), and the `{#if lab.drawer === 'global'}`
branch (`@273-278`). **Keep** all three `{ noScroll: true }` and the comment above `handleEntityTabChange`
— that comment is RNAV-02's production record.

---

### A2. `results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte` — L2, NEW (route / layout, request-response)

**Primary analog:** `results-layered/[electionTab]/+layout.svelte` (spike 033) — the file that already
owns exactly L2's job. **Correction the planner must apply: that file uses REQUIRED params and
hand-builds its URL. D-08 keeps all four params optional and routes through `buildListRoute`.**

Structural pattern to copy (spike 033 file, `@55-65`):

```svelte
<div class="pb-safelgb pl-safemdl pr-safemdr match-w-xl:px-0 w-full max-w-xl">
  {#if entityTabs.length > 1}
    <Tabs
      tabs={entityTabs}
      activeIndex={activeTabIndex}
      onChange={handleEntityTabChange}
      style="view-transition-name: results-entity-tabs"
      data-testid="voter-results-entity-tabs" />
  {/if}
  {@render children()}
</div>
```

That wrapper `<div>` is byte-identical to the one at `results/[[electionTab]]/+layout.svelte@334`,
which is the proof the extraction is clean.

**⚠ CTX — the derivations L2 takes from the 401-line layout**, all reading through `voterCtx.X`:

```ts
// @106-115 — entityTabs
type EntityTab = { type: EntityType; label: string };
const entityTabs = $derived<Array<EntityTab>>(
  activeElectionId && voterCtx.matches[activeElectionId]
    ? (Object.keys(voterCtx.matches[activeElectionId]) as Array<EntityType>).map((type) => ({
        type,
        label: ucFirst(t(`common.${type}.plural`))
      }))
    : []
);

// @117-118 — the implied-tab resolution. READ THROUGH voterCtx.X. Never destructure.
// Plural → singular mapping uses American spelling. The implied entity type lives on voterContext via `currentResultsEntityType`: URL-first with default-pick fallback to the first available tab for the active election. Reading through `voterCtx.X` per the CLAUDE.md Context Destructuring Rule preserves reactivity (must not destructure).
const activeEntityType = $derived(voterCtx.currentResultsEntityType);

// @131-136 — activeTabIndex
const activeTabIndex = $derived.by(() => {
  if (!activeEntityType) return 0;
  const i = entityTabs.findIndex((tab) => tab.type === activeEntityType);
  return i === -1 ? 0 : i;
});
```

Note spike 033's L2 uses `Math.max(0, findIndex(...))` instead; the production `$derived.by` form
above is the one to carry, because it is the shipped one.

**⚠ CTX — L2 re-derives `activeElectionId` from `page.params`, it does not receive it as a prop.**
RESEARCH Pattern 2. The shipped form is `const _urlElectionTab = $derived(page.params.electionTab);`
(`@89`) plus the single-election fallback (`@91-93`).

**The handler L2 owns, verbatim including its comment — RNAV-02's production change** (`@228-246`):

```ts
// `noScroll: true` on every tab `goto`: the tabs sit in the lower half of the page, so SvelteKit's default scroll-to-top would throw a voter who scrolled down to them back to the intro on every switch (spike 031).
function handleEntityTabChange({ index, tab }: { index?: number; tab?: Tab }): void {
  const typed = tab as EntityTab | undefined;
  if (typed?.type === 'candidate' || index === 0) {
    goto(buildListRoute(activeElectionId, 'candidates'), { noScroll: true });
    startEvent('results_changeTab', { section: 'candidate' });
    return;
  }
  …
}
```

**D-08's "cannot be implied ⇒ chooser" at this level** (`@344, 374-378`):

```svelte
{#if activeEntityType}
  {@render children()}
{:else}
  <div class="py-lg text-error text-center text-lg" data-testid="voter-results-no-nominations-warning">
    {t('error.noNominations')}
  </div>
{/if}
```

**Anti-pattern (RESEARCH, spike 033 § Investigation Trail item 3):** do **not** add a `+page.svelte`
at this level. A second page node is what produced the measured implied-tab remount.

---

### A3. `…/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte` — P3 (route / page, request-response)

**Analog:** the 401-line layout's own list + drawer region. Today the file is a doc-comment and an
empty `<script>`; its `@1-26` component doc **must be rewritten**, because it states the opposite of
the post-split truth (*"The parent `+layout.svelte` renders both the list AND the drawer overlay … this
page file is deliberately empty"*).

**⚠ CTX — the list region to move whole** (`@344-373`), including the `{#key}` comment, which Pitfall 7
and D-18 both depend on:

```svelte
{#if activeEntityType}
  {#if activeMatches}
    <div
      data-testid={activeEntityType === 'candidate'
        ? 'voter-results-candidate-section'
        : activeEntityType === 'organization'
          ? 'voter-results-party-section'
          : activeEntityType === 'alliance'
            ? 'voter-results-alliance-section'
            : undefined}>
      <!-- {#key}: keep — a scope-tuple change discards per-scope filter UI state; without remount, EntityListWithControls would carry filter selections from one election:entityType context into the next. -->
      {#key `${activeElectionId}:${activeEntityType}`}
        <h3 class="my-lg mx-10 text-xl">
          {t(`results.${activeEntityType}.numShown`, { numShown: activeMatches.length })}
          {#if voterCtx.constituenciesSelectable}
            <span class="font-normal">
              {t('results.inConstituency')}
              {activeElection?.getApplicableConstituency(constituencies)?.name || '—'}
            </span>
          {/if}
        </h3>
        <EntityListWithControls entities={activeMatches} class="mb-lg mx-10" data-testid="voter-results-list" />
      {/key}
    </div>
  {:else}
    <Loading />
  {/if}
{/if}
```

**The sort + its tie-break rationale move whole** (`@120-129`). That comment is load-bearing history
(debug session `tied-match-order-churn`); it is not summarisable.

**⚠ CTX — the drawer derivation** (`@138-165`), which reads **two** reactive accessors inside one
`$derived.by`, both correctly through `voterCtx.X`, and carries a documented silent-degradation catch:

```ts
const drawerVisible = $derived<boolean>(!!(page.params.entity && page.params.id));

const drawerEntity = $derived.by<MaybeWrappedEntityVariant | undefined>(() => {
  if (!drawerVisible) return undefined;
  …
  try {
    const { entity } = getEntityAndTitle({
      dataRoot: voterCtx.dataRoot,     // ⚠ direct read inside the tracking scope — never an alias
      matches: voterCtx.matches,
      entityType, entityId, nominationId
    });
    return entity;
  } catch (e) {
    // Silent degradation — UI-SPEC Empty State Inventory "Deeplink to entity not found"
    log.error(…);
    return undefined;
  }
});
```

**The close handler P3 owns, verbatim with its comment** (`@248-251`):

```ts
function handleDrawerClose(): void {
  // `noScroll: true` mirrors the entity-card open path (EntityCard's `cardAction` snippet sets `data-sveltekit-noscroll` on its anchor branch). Without it, SvelteKit's default scroll-on-navigation snaps the list back to the top, which reads as "the page scrolls when the drawer closes".
  goto(buildListRoute(activeElectionId, _urlPlural ?? _pluralForActiveType()), { noScroll: true });
}
```

**The drawer mount becomes the opener** (`@272-279` → one line). The `{#if lab.drawer === 'global'}`
branch collapses to its `global` arm, re-pointed at the productionised opener:

```svelte
{#if drawerVisible && drawerEntity}
  <EntityDrawerOpener entity={drawerEntity} onClose={handleDrawerClose} />
{/if}
```

**Pitfall 2 — the drawer-first source-order comment (`@268-271`) does not survive the split.** Under
D-11 the `<dialog>` lives in the root layout and `showModal()` puts it in the top layer regardless of
source order, so the comment's claim becomes false. Delete it with the block and record the deletion;
do **not** carry it into P3, where it would mislead. This is the sequencing constraint: **host before
split.**

**Tracking `$effect` P3 owns** (`@191-201`) — keyed on `drawerVisible`/`drawerEntity`.

---

### A4. `buildListRoute` extraction (utility, transform) — optional new sibling module

**Analog:** the function and its doc-comment as they stand (`@207-219`). It reads `page.url.search`
from `$app/state`, so it needs **no props and no context** — which is what makes it extractable to a
plain module rather than a prop-drilled callback.

```ts
/**
 * Build a path-only /results URL with the SELECTED election landing on the new `electionTab` route segment and the existing search params preserved verbatim.
 *
 * Name-disjoint dissociation: `electionTab` is the route-side singular (route side); `electionId` is the search-side AVAILABLE-array (existing PERSISTENT_SEARCH_PARAMS member at `$lib/routes/params.ts`).
 * The two never alias: …
 */
function buildListRoute(electionTab: string | undefined, plural: EntityPlural | undefined): string {
  const electionSegment = electionTab ? `/${electionTab}` : '';
  // No `/candidates` force-fill when plural is absent: the URL `/results/{electionTab}` is itself a valid render shape — voterContext.currentResultsEntityType implies the active tab …
  const pluralSegment = plural ? `/${plural}` : '';
  // Preserve any persistent search params (electionId AVAILABLE array, constituencyId, etc.) on the URL verbatim. …
  return `/results${electionSegment}${pluralSegment}${page.url.search}`;
}
```

**Anti-pattern the comment guards, at all three call sites:** never force-fill the plural. Its twin
note lives at `+page.ts@34` (*"Post-88-02 loop fix"*) and at `[[electionTab]]/+layout.ts@13`
(*"This loader does NOT force-fill `entityTab` …"*). D-08 exists to keep that closed.

`EntityPlural` and the `_urlPlural` narrowing (`@99-104`) belong in the same module — RESEARCH flags
triplicating them as the alternative.

---

### B1. `lib/components/modal/drawerHost/drawerHostState.svelte.ts` (store / singleton, pub-sub)

**Analog:** `lib/spike/drawerHostState.svelte.ts` — copy whole; de-lab is the module doc's `SPIKE 034`
heading only. The payload interface is the contract two openers depend on:

```ts
export interface DrawerPayload {
  /** Identifies the opener; `close(key)` only closes the drawer if it still shows this payload. */
  key: string;
  /** Accessible name of the dialog. A getter, so it can track reactive state of the opener. */
  title: () => string;
  content: Snippet;
  /** The opener's contexts (`getAllContexts()`), re-provided around `content`. */
  contexts: Map<unknown, unknown>;
  /** Called when the USER dismisses the drawer (close button, backdrop, Escape). Routed openers navigate here. */
  onDismiss?: () => void;
  testId?: string;
}

class DrawerHost {
  current = $state<DrawerPayload | null>(null);
  newKey = (prefix: string): string => `${prefix}-${++nextKey}`;
  open = (payload: DrawerPayload): void => { this.current = payload; };
  close = (key?: string): void => { if (!key || this.current?.key === key) this.current = null; };
}
export const drawerHost = new DrawerHost();
```

**SSR safety note to carry verbatim** (spike file `@10-11`): *"Client-only by construction: `open` is
only ever called from `$effect`s / event handlers, so this module-level singleton is never written
during SSR (where it would leak across requests)."* A module-level mutable singleton is otherwise
exactly the shape `lib/_guards/eslint-adapter-singleton-guard.test.ts` exists to police — check
whether that guard's scope reaches `lib/components/**` before landing the file.

---

### B2. `lib/components/modal/drawerHost/ContextBridge.svelte` (component / provider, transform)

**Analog:** `lib/spike/ContextBridge.svelte` — 13 lines, copy whole:

```svelte
<script lang="ts">
  import { setContext } from 'svelte';
  import type { Snippet } from 'svelte';
  let { contexts, children }: { contexts: Map<unknown, unknown>; children: Snippet } = $props();
  // svelte-ignore state_referenced_locally -- init-time copy is the contract (see component doc)
  for (const [key, value] of contexts) setContext(key, value);
</script>
{@render children()}
```

The `svelte-ignore` line follows CLAUDE.md § *Svelte Warning-Accepted Format*'s spirit; the existing
comment already states the rationale ("init-time copy is the contract"), so keep it as written.

---

### B3. `lib/components/modal/drawerHost/DrawerHost.svelte` (component / overlay host, event-driven)

**Three analogs, each supplying a different half.**

**(i) Subject — `lib/spike/DrawerHost.svelte`.** The `$effect` is the mechanism; copy its structure,
remove the five `lab.log('dialog', …)` calls and the `lab` import:

```svelte
$effect(() => {
  const next = drawerHost.current;
  untrack(() => {
    if (!dialog) return;
    if (next) {
      clearTimeout(closeTimer);
      shown = next;
      if (!dialog.open) {
        dialog.showModal();
        // One frame in the closed-state styles first, so the slide-up / fade-in transitions run.
        requestAnimationFrame(() => requestAnimationFrame(() => (visible = true)));
        setTimeout(() => dialog && focusFirstDescendant(dialog), ANIMATION_MS);
      } else {
        visible = true;               // content swap: no second showModal, no backdrop flash
      }
    } else if (shown) {
      visible = false;
      closeTimer = setTimeout(() => { dialog?.close(); shown = null; }, ANIMATION_MS);
    }
  });
});
```

**(ii) a11y contract — `lib/components/modal/ModalContainer.svelte`.** D-14/criterion 5 require
parity, and the two differ today in three measured ways. The analog's forms:

```svelte
<!-- ModalContainer@128 — Escape via svelte:document, NOT the native dialog close -->
<svelte:document onkeydown={handleEscape} />
```
```ts
/**
 * Close the dialog by pressing the escape key. NB. Some browsers implement a default behaviour for the escape key, which closes the dialog, but this prevents us from performing cleanup, so we need a custom event handler.
 */
function handleEscape(e: KeyboardEvent) {          // ModalContainer@91-96
  if (isOpen && e.key == 'Escape') { handleClose(); e.stopPropagation(); }
}
```
```ts
setTimeout(() => {                                  // ModalContainer@110-120 — focus entry after DELAY.sm
  if (!isOpen) return;
  if (modalContainer) {
    if (autofocusId) { const el = modalContainer.querySelector(`#${autofocusId}`); if (el) attemptFocus(el); }
    else if (autofocusId !== false) { focusFirstDescendant(modalContainer); }
  }
}, DELAY.sm);
```
```svelte
{#if closeOnBackdropClick}                          <!-- ModalContainer@139-143 — backdrop is a labelled button -->
  <div class="modal-backdrop">
    <button onclick={() => handleClose()} tabindex="-1">{t('common.closeDialog')}</button>
  </div>
{/if}
```

The spike host uses `oncancel` + `e.target === dialog` and focuses after `ANIMATION_MS` instead.
Both are defensible; **the divergence must be a decision, not an accident**, and the `a11y-smoke`
axe project is the instrument (`autofocusId={false}` is a live caller — `QuestionExtendedInfoDrawer@34`
— so any parity decision must keep an opt-out of focus-entry).

**(iii) Motion — `lib/components/modal/drawer/Drawer.svelte`.** D-14 says reuse this:

```svelte
<div class="bg-base-100 relative … h-[calc(100dvh-3rem)] w-full max-w-xl … rounded-t-lg"
  transition:fly={{ y: '100%', duration: DELAY.xs }}>   <!-- Drawer@78-81 -->
```
with `DELAY` from `$lib/utils/timing` (`{ xs: 150, sm: 225, md: 350, lg: 450, xl: 600, '2xl': 800 }`).

**Landmine:** the host's JS timer and its CSS `transition: … 250ms` (spike `@129, 140`) must be the
same number. Drive the CSS from a custom property set from the constant (`style:--drawer-ms={DELAY.xs}ms`)
so one edit moves both. And branch the JS close timeout on `shouldAnimate(undefined)`
(`lib/utils/viewTransition.ts@24-30`) — the spike's `@media (prefers-reduced-motion: reduce)` block
already nulls the CSS transitions, but the JS still waits, so the dialog lingers with no motion.

**(iv) `<svelte:boundary>` — D-12's net. No existing use anywhere in `apps/frontend/src`**, so this is
a new pattern for the codebase and needs a doc-comment. Valid attributes are exactly
`['onerror', 'failed', 'pending']`. Wrap the bridge, not the dialog:

```svelte
{#if shown}
  {#key shown.key}
    <svelte:boundary onerror={(error) => { /* log + force-close; never leave the dialog open */ }}>
      <ContextBridge contexts={shown.contexts}>
        {@render shown.content()}
      </ContextBridge>
      {#snippet failed(error, reset)}<!-- minimal, non-throwing fallback -->{/snippet}
    </svelte:boundary>
  {/key}
{/if}
```

**Barrel analog** (`lib/components/modal/index.ts`, `lib/components/modal/drawer/index.ts`): default
export re-named + `export * from './X.type'` per component.

---

### B4. `lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte` (component / opener, event-driven)

**Analog:** `lib/spike/GlobalEntityDrawer.svelte` — copy whole, minus the `lab` import and the one
`lab.log` in the teardown. **D-12's convention half, and its comment, must survive productionisation
verbatim:**

```svelte
const contexts = getAllContexts();
const key = drawerHost.newKey('entity');

// ⚠ The host keeps rendering `content` through its close animation — i.e. AFTER this component is destroyed, when the `entity` prop already reads `undefined` (the parent's `{#if}` went false). Rendering straight from the prop crashes `EntityDetails` mid-flush, which aborts the host's close (spike 034). So the payload renders from the last defined entity, which outlives the prop.
// svelte-ignore state_referenced_locally -- seeded once; kept current by the pre-effect below
let shownEntity = $state.raw(entity);
$effect.pre(() => { if (entity) shownEntity = entity; });

// Opened once per mount; `content` and `title` read the entity reactively, so an A → B navigation that reuses this component just updates the content in the already-open drawer.
$effect(() => {
  untrack(() =>
    drawerHost.open({ key, title: () => unwrapEntity(shownEntity).entity.name, content, contexts,
                      onDismiss: onClose, testId: 'voter-results-drawer' })
  );
  return () => drawerHost.close(key);
});
```
```svelte
{#snippet content()}
  <EntityDetails entity={shownEntity} class="min-h-full" />
{/snippet}
```

**Component-doc pattern for a render-nothing component** (spike `@1`): *"opens `EntityDetails` for
`entity` in the root drawer host for as long as this component is mounted. Renders nothing in place."*

**Testid continuity:** `testId: 'voter-results-drawer'` reproduces what `EntityDetailsDrawer` carried
via `data-testid="voter-results-drawer"` at its call site (`results/[[electionTab]]/+layout.svelte@277`).

---

### B5. `lib/components/questions/QuestionExtendedInfoButton.svelte` (component, event-driven) — D-13

**Analog:** itself, spike form. De-lab collapses the `if (lab.drawer === 'global')` fork to its host arm:

```ts
const contexts = getAllContexts();
const hostKey = drawerHost.newKey('question-info');

function handleClick(): void {
  drawerHost.open({ key: hostKey, title: () => question.text, content: questionInfo, contexts,
                    testId: 'voter-questions-popup-info-modal' });
  onOpen?.();
}
// Close it if the button goes away (e.g. question → question navigation) while it is still showing this question.
$effect(() => () => drawerHost.close(hostKey));
```

**⚠ The testid moves, and that is a red-suite hazard.** Today `voter-questions-popup-info-modal` sits
on the info **body** (`QuestionExtendedInfoDrawer@41`, `data-testid="voter-questions-popup-info-modal"`
on `<QuestionExtendedInfo>`). The spike puts it on the **dialog** and gives the body
`…-modal-content`. The consumer is `tests/tests/fixtures/voter/questionInfo.fixture.ts`:

```ts
const popupModal = page.getByTestId(testIds.voter.questions.popupInfoModal);   // @81
…
await nthOrFirst(popupButton, question).click();
await expect(nthOrFirst(popupModal, question)).toBeVisible();                   // @87-88
// expander branch asserts the SAME locator is hidden:
await expect(popupModal).toBeHidden();                                          // @92
```

and `perm-interactive-info.spec.ts@26` dismisses on it:
```ts
await page.keyboard.press('Escape');
await expect(page.getByTestId(testIds.voter.questions.popupInfoModal)).toBeHidden({ timeout: 15_000 });
```

Note the expander-mode assertion: with the testid on a **persistent host dialog**, `toBeHidden()` in
expander mode now measures a dialog that exists but is closed rather than one that was never mounted.
Either keep the testid on the body in the host payload (cheapest, preserves both assertions' meaning),
or move it and re-verify both. Getting this wrong is a red `perm-interactive-info`.

**Barrel deletions** if `QuestionExtendedInfoDrawer` / `EntityDetailsDrawer` become callerless:
`lib/components/questions/index.ts@17-18` and `lib/dynamic-components/entityDetails/index.ts`
(`EntityDetailsDrawer` + `EntityDetailsDrawer.type` lines).

---

### B6. `routes/+layout.svelte` (route / root layout, event-driven)

**Analog:** itself. Three de-lab edits, one re-point.

**Host mount** (`@247-251`) — keep the position under `{:else}`, re-point the import:
```svelte
{:else}
  {@render children?.()}
  <!-- SPIKE 034: the app's single drawer; openers hand it a payload (lab `drawer: global`) -->
  <DrawerHost />
```
Delete `<RedrawLabPanel />` (`@267`) and its import (`@35`). Rewrite the comment (drop `SPIKE 034` and
the lab clause).

**The `onNavigate` gate** (`@155-181`). Keep the merged-hook doc (`@154`: *"Analytics flush THEN
View-Transitions coupling, in one merged hook…"*), the LANDMINE comment, and the overlay comment;
delete the two `lab.log` blocks, `navigation.complete.then(…)`, and `lab.vtOverride()`:

```ts
onNavigate((navigation) => {
  submitAllEvents(); // preserve existing analytics flush
  // LANDMINE: read `navigation.to?.url` — NOT `page.url`, which is the SOURCE url during onNavigate. `shouldAnimate` also gates reduced motion and ?notr=1.
  if (!shouldAnimate(navigation.to?.url)) return;
  // Opening / closing a modal overlay (the results entity drawer) gets no document VT: named groups would be painted above the top-layer dialog. The overlay's own motion is the transition. See `$lib/utils/viewTransition`.
  if (isOverlayNavigation(navigation.from, navigation.to)) return;
  return new Promise<void>((resolve) => {
    startViewTransition(async () => {
      resolve();                 // tells SvelteKit to apply the new DOM
      await navigation.complete; // SvelteKit swaps the DOM here
    });
  });
});
```

**The `<style>` block — D-06 says do not move it** (`@281-296`). Both comments stay readable together;
the `!important` is load-bearing (Pitfall 3 — it beats the two inline `style="view-transition-name: …"`
attributes) and NC-3's injection drops it rather than deleting the rule:

```svelte
<style>
  /* Reduced motion: null any escaping ::view-transition animation.
     LANDMINE: the @media query WRAPS the :global selector — never the reverse form (the Svelte CSS parser rejects an at-rule nested inside :global with "Expected a valid CSS identifier"). */
  /* A VT that runs while a modal dialog is open runs without named groups — otherwise they are painted above the top-layer dialog. `startViewTransition` in `$lib/utils/viewTransition` toggles the class. */
  :global(html.vt-no-names *) { view-transition-name: none !important; }

  @media (prefers-reduced-motion: reduce) {
    :global(::view-transition-group(*)), :global(::view-transition-old(*)), :global(::view-transition-new(*)) {
      animation: none !important;
    }
  }
</style>
```

---

### C1. `lib/utils/viewTransition.test.ts` — NEW (unit test, transform) — D-05

**Structure analog:** `lib/utils/focusNavigationTarget.test.ts` — a sibling-named `.test.ts` beside
the module under test, opening with a docblock that states *why the case that matters matters*:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { focusNavigationTarget } from './focusNavigationTarget';

/**
 * Specification for the post-navigation focus reset. The case that matters is the third: a focus target that renders AFTER the first frame. The one-shot form this replaced focused nothing in that case and left focus on `<body>`, which is how `a11y-smoke`'s "focus lands on heading after Q→Q nav" went red on a loaded host.
 * …
 */
describe('focusNavigationTarget', () => {
  it('focuses the [data-focus-on-nav] element present on the first frame, in preference to an <h1>', () => { … });
```

**Table form analog** — the repo's house style is array-of-arrays + `%s` positional tokens, stated in
terms at `lib/_guards/eslint-store-guard.test.ts@50`:

```ts
// Array-of-arrays + %s positional tokens is the repo's house style for table-driven specs, and it dissolves the quoted-object title rendering an object-shaped table would otherwise produce.
const cases = GUARDED_DIRS.flatMap((dir) => …);
describe.each(cases)('guard reach: src/%s/__store_guard_probe__%s', (dir, ext) => { … });
```

A second in-repo table form, `it.each` over plain strings, is at
`(located)/layout.tracking.test.ts@49-54` — closer for this file's five-row `from`/`to` matrix.

**Subject under test** (`lib/utils/viewTransition.ts@32-46`), whose shape dictates the fixture: the
predicate reads only `params`, so the test needs no SvelteKit mock at all —

```ts
/** The part of a SvelteKit `NavigationTarget` this module reads. */
interface NavigationEnd { params: Record<string, string | undefined> | null; }

export function isOverlayNavigation(from: NavigationEnd | null, to: NavigationEnd | null): boolean {
  return hasOverlay(from) || hasOverlay(to);
}
function hasOverlay(end: NavigationEnd | null): boolean {
  return !!(end?.params?.entity && end.params.id);
}
```

**Assertion-message pattern** — the repo attaches a message stating what a failure *means*, not what
was expected. `(located)/layout.tracking.test.ts@63`:
```ts
expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every navigation').toEqual([]);
```

D-05's required comment ("the results drawer is the only routed overlay") has its analog in the module
doc's own `⚠` paragraph (`viewTransition.ts@12`) — same register, same placement above the construct.

---

### C2. `lib/_guards/spike-scaffolding.test.ts` — NEW (unit test, file-I/O) — D-20

**Directory convention:** `apps/frontend/src/lib/_guards/` holds four guards today, all named
`eslint-*-guard.test.ts` and all ESLint-driven. **This file is the first filesystem-walking guard in
that directory**, so its mechanism analog is elsewhere: `lib/routes/routeConsistency.test.ts`.

**Walk pattern to copy** (`routeConsistency.test.ts@1-4, 51-54, 66, 91-102`):

```ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROUTE_TREE_ROOT = path.resolve(HERE, '..', '..', 'routes');

function collectDirectories(absoluteDirectory: string): Array<string> {
  const found: Array<string> = [];
  const entries = fs.readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !PRUNED_DIRECTORIES.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) { found.push(child, ...collectDirectories(child)); }
  return found;
}
```

**Non-vacuity pattern — the house answer, and the hard part** (`routeConsistency.test.ts@288-315`).
Every filesystem guard in this repo carries a dedicated describe block asserting the walk found
*something* before asserting it found *nothing bad*, with a failure message that explains the
consequence:

```ts
describe('the walk is not vacuous (REVIEW-RT-04)', () => {
  it('finds at least the two protected route groups the tree is known to carry', () => {
    expect(
      PROTECTED_GROUP_DIRECTORIES.map(toRouteId),
      `The walk of ${ROUTE_TREE_ROOT} found ${PROTECTED_GROUP_DIRECTORIES.length} directories named ${PROTECTED_GROUP}, and the tree is known to carry two … Every check in this file measures that set, so a smaller one makes them pass by looking at nothing. Either the walk is broken or the protected groups have been renamed, and in both cases this file has stopped guarding what it claims to guard.`
    ).toHaveLength(2);
  });
```

**Correctness-invariant docblock pattern** — both `routeConsistency.test.ts` and
`eslint-store-guard.test.ts` open with a numbered list headed *"Correctness invariants, each one a
distinct way this file could hand back a false pass"*. Reproduce it; the invariants here are (1) the
scan reached real source, (2) it scans for the **marker text** `SPIKE` as well as for `lib/spike`
imports — five of the fourteen production marker lines carry no import, and criterion 6 forbids the
markers in terms, and (3) the floor is derived at write time, not copied from a document.

**Measured populations to assert against zero** (re-derive at run time; RESEARCH § *Measured populations*):
`find apps/frontend/src/lib/spike -type f` → 6 · `results-layered` files → 9 · files importing
`lib/spike` → 15 · `SPIKE` marker lines → 30 · `labMount(` → 9.

---

### C3. `(located)/layout.tracking.test.ts` — MODIFIED (unit test) — D-04

**Analog:** itself. The instrument stays verbatim (`@21-46`):

```ts
/** A `URL` whose property reads are logged unless they happen inside the returned `untrack`. */
function recordingUrl(href: string): { url: URL; trackedReads: Array<string>; untrack: <TValue>(fn: () => TValue) => TValue } {
  const real = new URL(href);
  const trackedReads: Array<string> = [];
  let untracked = 0;
  const url = new Proxy(real, {
    get(target, prop) {
      if (!untracked && typeof prop === 'string') trackedReads.push(prop);
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  function untrack<TValue>(fn: () => TValue): TValue {
    untracked++;
    try { return fn(); } finally { untracked--; }
  }
  return { url, trackedReads, untrack };
}
```

The four positive `it.each` cases (`@49-66`) stay exactly as they are. **Only the block at `@68-83`
is replaced** — its opening line is `// SPIKE results-redraw control: the pre-032 tracked read must be
caught by the assertion above.` and it imports `$lib/spike/redrawLab.svelte`, which is why it cannot
survive criterion 6.

**Mock pattern the file already establishes** for driving the load directly (`@12-19`):
```ts
vi.mock('$lib/paraglide/runtime', () => ({ getLocale: () => 'en' }));
vi.mock('$lib/api/dataProvider', () => ({ createSupabaseUniversalClient: () => ({}), createDataProvider: () => ({ … }) }));
```
D-04's replacement control **must not import the real `load`** — a local load-shaped function is the
subject. The production body it reproduces is at `(located)/+layout.ts@44-49` (the `fixLoader` ternary).

---

### C4. `tests/tests/specs/voter/voter-results-redraw.spec.ts` — NEW (e2e spec, event-driven) — D-16/D-18

**Leaf-spec analog:** `tests/tests/specs/voter/voter-nominations.spec.ts` — header, rigidity clause,
imports, describe form:

```ts
/**
 * voter-nominations (rider) — the unscoped all-nominations route renders its entity list on the base dataset.
 *
 * Read-only LEAF spec on `data-setup-base` (`e2e/base`). …
 * Seed is ASSERT-ONLY: no dev-seed or product files are modified.
 *
 * ## Rigidity contract (project E2E Hard Rule)
 *
 * Every assertion is HARD — no `expect.soft`, no try/catch around `expect()`, no `.catch` fallback, no skip/flaky annotation. A failing OR did-not-run test blocks completion.
 */
import { expect, test } from '../../fixtures/voter/views';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';

test.describe('voter-nominations (UNBLK-04)', () => { … });
```

**Navigation-behaviour analog:** `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` — the nearest
existing spec whose subject is *mount/reactivity behaviour rather than content*. Two conventions to
inherit: the WAITING-assertion rule (*"the list mounts a beat after navigation, so use the WAITING
assertion `toBeVisible({ timeout })`, never one-shot `isVisible()`"*), and its explicit statement of
**how each case reaches its cold entry and why that keeps the cold property intact** — the same kind
of paragraph this spec needs for "from a scrolled start".

**Reduced-motion skip:** derive **in the page**, not from the runner. The repo carries two
contradictory claims — `voter-journey.fixture.ts@282` says `page.emulateMedia({reducedMotion})` does
not reach the app's `matchMedia`; `eperm07-term-trigger.spec.ts` uses it as a deliberate discriminator
against `viewTransition.ts:28`:

```ts
// Discriminator A: emulate prefers-reduced-motion so the app's own `shouldAnimate` gate (viewTransition.ts:28) short-circuits and no View Transition plays.
const FORCED_NO_VT = process.env.EPERM07_NO_VT === 'true';
async function applyReducedMotionKnob(page: Page): Promise<void> {
  if (!FORCED_NO_VT) return;
  await page.emulateMedia({ reducedMotion: 'reduce' });
}
```
`eperm07` also shows the house pattern for keeping a conditional **out of the test body** (module-scope
helper, for `playwright/no-conditional-in-test`) — directly applicable to D-16's `test.skip` gate.

**⚠ D-18 node-identity target — a testId gap, measured.** `testIds.voter.results` carries `list`,
`ingress`, `entityTabs`, the three sections, `card`, `entityDetails` — but **not**
`voter-results-list-container`, which exists in the markup
(`results/[[electionTab]]/+layout.svelte@332`) and is the node *above* the `{#key}`. Since
`voter-results-list` sits on `EntityListWithControls`, which is **deliberately** remounted on a
tab switch (`@354`: *"{#key}: keep — a scope-tuple change discards per-scope filter UI state…"*), the
tab-switch case must tag `voter-results-list-container` / `voter-results-ingress` /
`voter-results-entity-tabs`. Add the container to `testIds.ts` following the block's own form
(`ingress: 'voter-results-ingress'`, `@199`).

**Fixture surface to compose through** — `resultsPage.fixture.ts` already provides `goToPage`,
`selectEntityTab`, `getEntityCard`, `openEntityDetailsForCard`, `dismissAllDialogs`. Its **rigidity
contract forbids bolting readers on** (`@6-13`):

```
 * **Rigidity contract**:
 * - NO `expect.soft` in any helper.
 * - NO `try/catch` wrapping `expect(...)`.
 * - NO best-effort `.catch(() => null)` on assertion-bearing locator interactions. …
 * **Caller-supplied locators / regexes / indexers** (fixture coupling guard): every method that targets a specific entity / tab takes a `RegExp | string | ((count: number) => number)` from the caller. NO hardcoded base-specific strings …
```
So the VT-log and scroll readers go in a **new** fixture file (C5).

---

### C5. `tests/tests/fixtures/voter/viewTransitionLog.fixture.ts` — NEW (e2e fixture / capture seam)

**Analog:** `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` — the repo's own precedent for
wrapping a browser/global API from an init script with zero production instrumentation. Copy its whole
shape: docblock naming the **emission boundary**, a local `declare global` augmentation, an
`install()/read()/clear()` surface, an async factory that installs before returning.

```ts
/**
 * Local window augmentation scoped to this fixture file … Kept local rather than in the global `.d.ts` because it is a test-only capture seam, not an app contract.
 */
declare global {
  interface Window { __trackCalls?: Array<TrackCall>; umami?: { track: (name: string, data?: unknown) => void }; }
}

/**
 * ASYNC because it calls `page.addInitScript` (which returns a Promise). The init-script runs in EVERY document the context creates, BEFORE any app script — so `window.umami` is already stubbed when `UmamiAnalytics` checks `'umami' in window` …
 */
export async function createTrackingIntercept(page: Page): Promise<TrackingInterceptFixture> {
  const fixture: TrackingInterceptFixture = {
    async install(): Promise<void> {
      await page.addInitScript(() => {
        window.__trackCalls ||= [];
        window.umami = { track: (name, data) => { (window.__trackCalls ||= []).push({ name, data }); } };
      });
    },
    async getTrackCalls() { return page.evaluate(() => window.__trackCalls ?? []); },
    async clear() { await page.evaluate(() => { window.__trackCalls = []; }); }
  };
  await fixture.install();
  return fixture;
}
```

**The one production fact the wrapper depends on** (`lib/utils/viewTransition.ts@60-68`): the class is
added to `<html>` **before** `document.startViewTransition` is called, so a wrapper capturing
`getComputedStyle(el).viewTransitionName` at call time already sees the stripped state:

```ts
const root = document.documentElement;
const stripNames = …!!document.querySelector('dialog[open]');
if (stripNames) root.classList.add(VT_NO_NAMES_CLASS);
const transition = document.startViewTransition(updateCallback);
transition.finished.finally(() => { root.classList.remove(VT_NO_NAMES_CLASS); … });
```

**Composition analog — `tests/tests/fixtures/voter/views.ts`.** Add to three places, following the
file's own form exactly:
```ts
import { createResultsPage } from './resultsPage.fixture';          // @25 — alphabetical
type ViewFixtures = { resultsPage: ResultsPageFixture; … };          // @40-53
export const test = base.extend<ViewFixtures>({
  resultsPage: async ({ page }, use) => { await use(createResultsPage(page)); },   // @56-58
  …
});
export { expect };
```
Note the async-factory fixtures in this root are currently all **sync** `create*` calls; an
`addInitScript`-based factory is async (`await use(await createViewTransitionLog(page))`), which is a
new shape for this root — the `forensicCapture` entry (`@86-93`) is the precedent for a non-trivial
registration, and its long `NOTE —` comment is the precedent for *documenting* a convention crossing.

---

### C6. `tests/playwright.config.ts` — MODIFIED (config) — new project block

**Analog:** the `voter-alliance` / `voter-nominations` LEAF blocks (`@414-430`). Copy the shape **and
the comment form** — a prose line stating what the project is, what dataset it consumes, whether it
mutates, and the `testMatch`-scoping sentence:

```ts
// voter-nominations — LEAF. Read-only render check for the UNSCOPED all-nominations route (dedicated spec, NOT a journey step). assert-only (showAllNominations already true in e2e/base — no own setup/teardown). `testMatch` is scoped to this spec; sibling voter-* projects' exact testMatch excludes it.
{
  name: 'voter-nominations',
  testDir: './tests/specs/voter',
  testMatch: /voter-nominations\.spec\.ts/,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-base']
},
```

**Why the block is mandatory, in the config's own words** (`@28-35`, the ORPHAN-PROBE GUARD docblock):
*"ADDING a probe file without adding it to the pattern silently produces a test that matches no project
and runs from no command, while still sitting in `specs/` looking like coverage. That is precisely what
happened to four probe files … 6 tests, unreachable for a long stretch of this suite's history."*

If the new spec grows soft assertions, the `SOFT_ASSERTION_BUDGETS` map is the second place to edit —
`voter-journey.spec.ts` is budgeted at 136. (D-16's spec should need none; the rigidity contract is
hard-assertions-only.)

---

### C7. `tests/tests/specs/perm/perm-interactive-info.spec.ts` — MODIFIED (e2e spec) — D-13

**Analog:** itself. It already opens the popup and asserts its body, which is what makes RESEARCH's
route (a) cheap. The two helpers to extend, not replace:

```ts
/**
 * Dismiss the open popup-info modal (Drawer) so it stops intercepting pointer events on the page-level controls (the `question-next` button sits behind the modal scrim while it is open). Escape closes the Drawer; the assertion settles on the modal body being hidden.
 */
async function dismissInfoModal(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByTestId(testIds.voter.questions.popupInfoModal)).toBeHidden({ timeout: 15_000 });
}
```
⚠ Under the host, Escape reaches the **host's** dismissal path, and the host keeps the payload mounted
through its out-animation — so a `toBeHidden` immediately after Escape now races `DELAY.xs`. The
existing 15 s waiting assertion absorbs that, but the comment's claim ("Escape closes the Drawer")
becomes a claim about a different component and must be re-worded.

The project chain is already wired (`@1026-1046`): `data-setup-perm-interactive-info` →
`perm-interactive-info` → `data-teardown-perm-interactive-info`, `fullyParallel: false`.

---

### E1. `165-NEGATIVE-CONTROL.md` — NEW (evidence doc) — D-17

**Analog:** `.planning/phases/164-returns-table-nullability-audit-single-override-mechanism/164-NEGATIVE-CONTROL.md`
(1110 lines). D-17 names "the format every v2.15 phase used"; 164 is the most recent instance and
RESEARCH cites it. **Reproduce this section order:**

```
# Phase 165 — Negative Control: <what was mutated and what observed it>
  (bold one-line summary; then Date / Plan / Decisions discharged / Requirements / Precedent followed)
## 1. Why this run existed                    ← quote the ROADMAP criterion VERBATIM in a blockquote
## 2. Environment                             ← fenced stamp block, see below
### 2a. Which database state, and why it is stated
### 2b. Anchor drift measured before anything was cited   ← a table: anchor as the plan gives it | measured | handling
## 3. The discipline every row followed       ← the six numbered steps, verbatim
## 4..N  NC-<n> — <claim>                     ← Mutation (diff) · Pre-mutation hash · Instrument · Verdict + VERBATIM output
## <N+1>. The <k> rows, side by side          ← summary table
## <N+2>. Verdict — evidence mapped to ROADMAP Phase 165 criteria
### What is explicitly NOT discharged by this document
### Reproducibility and non-contamination
## Gates
```

**The six-step discipline, verbatim** (164 § 3):

> 1. `git hash-object <file>` captured **before** the file is touched.
> 2. The mutation applied.
> 3. The instrument run, **its exit code read directly from `$?` on the command itself — never through a pipe**, since a pipeline reports the last stage's status and would silently report the exit code of `tail` or `grep` instead of the gate's.
> 4. Exit code and **verbatim output** recorded in a fenced block. Never a description of the output.
> 5. The mutation reverted with `git checkout -- <specific file>` — never `git clean`, never a blanket `git checkout -- .`.
> 6. The revert proven **three ways**: `git diff --exit-code` returns 0, `git hash-object` equals the pre-captured value, and `git status --porcelain apps packages scripts` is empty.

**Environment stamp format** (164 § 2) — copy the field list, adding the fields this phase depends on
(dev-server port / `PUBLIC_PROJECT_ID`, seeded template, Playwright version):

```
date:               2026-09-03T09:04:38Z (UTC)  /  2026-09-03 12:04 EEST
repo root:          /Users/…/voting-advice-application-gsd
git HEAD:           0e8ed2720  branch integration/ship-12-squash
OS:                 macOS 26.5.1 arm64
Node:               v24.14.1
Yarn:               4.13.0
TypeScript (root):  5.9.3
Migrations applied: 00001, 00002, 00003, 00004
```

**Per-row format** (164 § 4): `**Mutation.**` + a real `diff` fence, `**Pre-mutation hash:**`,
`**Instrument:**` with the full command, `**Verdict: RED. Exit code 1.** Verbatim:` + fenced output,
then the un-mutated baseline for the same command.

**The honesty pattern D-17 depends on** (164 § 5, NC-2): a row that comes back **green** is recorded,
with a paragraph explaining why its green is what makes the reds mean something. RESEARCH prescribes
exactly this for NC-1 and NC-4 ("the pre-165 suite has no scroll assertion at all, so the same
mutation is green there").

---

### E2. `.planning/REQUIREMENTS.md` — MODIFIED — D-22

**Analog:** the file's own `### Component & Context Consolidation` section — an `### <Name>` heading,
then `- [ ] **PREFIX-NN**: <one paragraph stating the observable end state>`. Note the house habit of
appending `⚠ **Corrected <date>:**` / `_(**Recounted <date> from the table rows, not incremented.**)_`
inline rather than silently editing — D-22's counter correction must follow it.

**Traceability row form** (`## Traceability` table):
```
| Requirement | Phase | Status |
|-------------|-------|--------|
| VGATE-01 | Phase 146 — Visual Gate — Self-Hosted Inter + Height-Independent Sensitivity + Re-baseline | Complete |
```
and the coverage line above it, which states the recount discipline in terms:
> **Coverage: 104/104 v2.15 requirements mapped to exactly one phase each. No orphans, no duplicates.**
> _(**Recounted 2026-09-18 from the table rows, not incremented.** …)_

That parenthetical is the pattern D-22's "recounted, never incremented" clause points at.

---

### E3. Skill domain + CLAUDE.md subsection — D-23 / D-24

**Skill analog:** `.claude/skills/spike-findings-voting-advice-application-gsd/` — `SKILL.md` with YAML
frontmatter (`name`, `description`) and a `<context>` block, plus one file per domain under
`references/`. The nearest existing reference is `references/page-navigation-and-transitions.md`
(spikes 013–016 — `onNavigate` → `startViewTransition`, per-element `view-transition-name`,
`afterNavigate(focus(...))`, reduced-motion belt-and-braces), which the new `results-redraw` domain
supersedes in detail. `SKILL.md`'s `description:` field enumerates the domains and must gain the third.

**CLAUDE.md analog:** its own § *Context Destructuring Rule (Svelte 5)* subsection — a `### <Title>`
under § *Frontend (SvelteKit)*, a bolded one-line statement of the rule, the two prohibitions as
`- **NEVER …**` bullets, then a closing sentence pointing at the fuller reference. D-24's two invariants
and its two file pointers (`lib/utils/viewTransition.ts`,
`routes/(voters)/(located)/layout.tracking.test.ts`) drop straight into that shape. The Skill-Routing
section at the file's foot is the second place to touch if the new skill domain is to be reachable.

---

## Shared Patterns

### De-lab excision (applies to all 11 rows of RESEARCH § *The De-Labbing Diff*)

**Source of the pre-spike form:** `git show e1f1944cf -- <path>` (merge-base with
`integration/ship-12-squash`). The three code-bearing commits map cleanly onto spikes 031 / 032 /
033-034 (`f2a421063`, `9e663c7a5`, `70e2390e9`), which is what makes D-01's "read each one against its
spike README as it lands" executable.

**The shape every row takes.** In every case the lab branch is the *restore-the-old-behaviour* branch,
so the de-labbed form is the branch already taken by default. Example — `(located)/+layout.ts@43-47`:

```ts
// SPIKE results-redraw: `lab.loader === 'current'` restores the tracked read for live comparison.
const fixLoader = lab.loader === 'fixed';
const { pathname, search } = fixLoader
  ? untrack(() => ({ pathname: url.pathname, search: url.search }))
  : { pathname: url.pathname, search: url.search };
```
collapses to its `true` branch. **Keep the three-line doc-comment above it** (`@42`) — it is RNAV-01's
only production record — and **fix the file reference it contains**: it says *"Guarded by
`layout.load.test.ts`"*, and the guard is `layout.tracking.test.ts`. `layout.load.test.ts` is the
separate empty-selection guard.

**Measured correction to RESEARCH Pitfall 5:** `untrack` does **not** become an unused import in
`(located)/+layout.svelte` — it is still used at `@126` and `@141` (the `nominationsAvailable`
settle-poller). Only the `@65` `wasReady` read goes. Verify with the type gate anyway; do not skip it.

**The two lint/type gates every de-lab row runs through, exit status read directly:**
`yarn workspace @openvaa/frontend check` and `yarn lint:check`. The project memory records two commits
of hidden lint violations caused by piping `lint:check` through `grep`.

### Context acquisition in a voter route file

Source: `results/[[electionTab]]/+layout.svelte@61-72` (quoted in full in A1). Three rules it encodes:
destructure only the stable set (`answers`, `getRoute`, `startEvent`, `start*Countdown`, `t`);
`appSettings` is value-replacing so a `$derived` alias is **safe**; `dataRoot` is identity-stable so an
alias is **forbidden** — read `voterCtx.dataRoot.<prop>` inside the consuming tracking scope. Applies to
**all three** new/modified route files (A1, A2, A3) and to any component the split moves.

### Comment-carries-the-history

Every construct this phase moves carries a comment that is the only record of why it exists — the
`{#key}` filter-state note, the tie-break `tied-match-order-churn` rationale, the `noScroll` spike-031
note, the `Post-88-02 loop fix` note, the `@media`-wraps-`:global` landmine, the teardown-hang ⚠ on
`$state.raw`. **Move each comment with its construct, whole.** A moved construct with a summarised
comment is the failure mode this repo's review checklist reads for.

### Modal a11y contract

Source: `ModalContainer.svelte` (Escape via `<svelte:document onkeydown>`, focus entry after `DELAY.sm`
through `focusFirstDescendant` / `attemptFocus` from `$lib/utils/aria/focus`, labelled
`modal-backdrop` button carrying `t('common.closeDialog')`, `aria-modal="true"` + `aria-label={title}`).
Applies to `DrawerHost.svelte` and, through it, to both hosted payloads. The instrument is the
`a11y-smoke` axe project; any new violation is a defect, not a baseline (D-19's discipline applied to
a11y).

### E2E rigidity contract

Every spec and every fixture in `tests/tests/` opens with it, in these words: *no `expect.soft`, no
`try/catch` wrapping `expect(...)`, no best-effort `.catch(() => null)` on assertion-bearing locator
interactions*. Plus the waiting-assertion rule (`toBeVisible({ timeout })`, never one-shot
`isVisible()`), testid-only targeting via the `testIds` constant tree, and caller-supplied
locators/regexes in fixture methods (no base-dataset strings in fixture bodies).

### Non-vacuity before invariance

Every filesystem- or scan-based guard in this repo asserts the scan **found something** before
asserting it found nothing bad, in a dedicated `describe('the walk is not vacuous …')` block whose
failure message explains what a small population would mean. Applies to C2 (`spike-scaffolding.test.ts`)
and to C4's scroll baseline (`expect(before, 'the scrolled start collapsed — the assertion would be
vacuous at 0').toBeGreaterThan(0)`).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `results/[[electionTab]]/statistics/+page.svelte` (disposition) | route / page | request-response | **Currently swallowed** — the parent layout renames `children` to `_children` and never renders it, so `/results/{e}/statistics` renders the results page today. There is no in-repo precedent for a `+layout@.svelte` reset, and no other route in the tree has been re-homed out from under a layout. RESEARCH Open Question 1 gives three dispositions; the planner picks one explicitly. Closest mechanical reference: `ROUTE.Statistics` in `lib/routes/route.ts` and the `ROUTE`-value-names-a-real-directory check (C2) in `routeConsistency.test.ts`, which would be the guard if it is moved |
| `<svelte:boundary>` usage in `DrawerHost.svelte` | component | event-driven | **Zero existing uses in `apps/frontend/src`.** Svelte 5.53.12 accepts exactly `['onerror', 'failed', 'pending']`. New pattern for the codebase — needs its own doc-comment, and D-12's negative control (revert the opener to a bare prop read, drive a close) is what proves the boundary actually fires rather than merely compiling |

---

## Open questions carried forward (analogs for each candidate, no pick made)

**D-13's landing site** (RESEARCH Open Question 2 — the research recommends (a) but does not decide):

- **(a) `perm-interactive-info`** — analogs: `packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts`
  (already ships `interactiveInfo.enabled: true` over `[QU-POPUP-INFO]`-marked questions), the existing
  project chain at `tests/playwright.config.ts@1026-1046`, and `perm-interactive-info.spec.ts` which
  already opens and dismisses the popup. Zero base-dataset change, zero visual-baseline movement.
- **(b) flip `e2e/base`** — analogs: `packages/dev-seed/src/templates/e2e/base.ts` (the
  `interactiveInfo: { enabled: false }` block and the `[qu-opin-base-1-info]` question), plus
  `voter-journey.spec.ts`'s hard `toBeVisible` on `testIds.voter.questions.infoButton`, which is what
  goes red. Its mobile sibling, the 136-soft-assertion budget entry and both visual baselines move with it.

**`EntityDetailsDrawer` / `QuestionExtendedInfoDrawer` disposition** (Open Question 3): both are
barrel-exported; the barrels are `lib/dynamic-components/entityDetails/index.ts` and
`lib/components/questions/index.ts`, and deletion means editing both. Grep for external callers at plan
time rather than deciding here.

**`statistics/` disposition** (Open Question 1): see § *No Analog Found*.

---

## Metadata

**Analog search scope:**
`apps/frontend/src/routes/(voters)/(located)/` · `apps/frontend/src/lib/{spike,components/modal,components/questions,dynamic-components/entityDetails,utils,_guards,routes}/` ·
`tests/tests/{specs/voter,specs/perm,fixtures/voter,fixtures/shared,utils}/` · `tests/playwright.config.ts` ·
`.planning/phases/164-*/` · `.planning/REQUIREMENTS.md` · `.claude/skills/spike-findings-voting-advice-application-gsd/`

**Files read in full or in targeted ranges:** 30
**Tracked-source gate:** all 30 analog paths verified present in `git ls-files` (batch check, 30/30). No
build-mirror or gitignored path appears anywhere above.
**Pattern extraction date:** 2026-09-23
