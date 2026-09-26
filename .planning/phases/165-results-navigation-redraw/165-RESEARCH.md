# Phase 165: Results Navigation Redraw - Research

**Researched:** 2026-09-23
**Domain:** SvelteKit 2 routing + layout composition, Svelte 5 runes, View Transitions vs. top-layer `<dialog>`, Playwright E2E instrumentation, negative-control discipline
**Confidence:** HIGH for the mechanism findings (every structural claim below was re-derived at run time on this worktree); MEDIUM for the sequencing recommendations

---

## Summary

The phase is **mostly a de-labbing plus two structural moves**, and the structural moves are smaller than the phase documents assume.

The four validated fixes (criteria 1–3) already exist as production code on `spike/results-redraw`, in **11 files**, gated by imports from `$lib/spike/redrawLab.svelte`. Stripping the gate is mechanical: in every case the lab branch is the *restore-the-old-behaviour* branch, so the de-labbed form is the branch that is already taken by default. § *The De-Labbing Diff* enumerates all eleven, line by line, with the exact residue each leaves.

D-08's optional-param nested tree is **sound, and it was proved rather than reasoned about**. I added the two scratch layout files D-08 calls for, ran `svelte-kit sync`, and read SvelteKit's own generated `$types.d.ts` for each: both layouts appear on the leaf route's `LayoutRouteId` union and both carry all four params as optional. Today's tree independently proves the "param absent, layout still renders" half — the `[[electionTab]]` layout is where the election picker lives and it renders for bare `/results`. The scratch files were removed and the tree re-synced; `git status` is clean. **The load-bearing consequence nobody has written down yet: D-08 changes no route id at all.** The leaf page stays at exactly the path it occupies today, so `ROUTE.ResultEntity`, `buildListRoute`, `routeConsistency.test.ts` and both `+page.ts` guards are structurally untouched — D-07's reversibility note in CONTEXT.md was written against spike 033's *required*-param tree and overstates the blast radius by roughly a plan's worth of work.

Three findings cut the other way and need planner decisions. (1) `results/[[electionTab]]/statistics/+page.svelte` is currently **swallowed** — its layout never renders `{@render children()}` — and the split un-swallows it. (2) The drawer-first DOM-source-order optimisation in today's layout is **incompatible** with "the innermost page renders the drawer", and the only thing that dissolves the conflict is landing D-11's root-level host first. (3) Flipping `e2e/base`'s `questions.interactiveInfo.enabled` to `true` — the obvious reading of D-13 — turns `voter-journey.spec.ts:662-666` **red**, which is a cardinal failure under CLAUDE.md's E2E hard rule. A ready-made alternative already exists in the tree.

**Primary recommendation:** sequence the phase as **de-lab (criteria 1–3) → drawer host (D-11/D-12/D-13) → route split (D-07/D-08/D-09/D-10) → guards + evidence (D-16..D-20) → docs (D-22/D-23/D-24)**, because the host is what makes the split's drawer placement free, and both the split and the host are what the E2E/visual evidence must be taken against.

---

## User Constraints

> Copied from `.planning/phases/165-results-navigation-redraw/165-CONTEXT.md`. All 24 are **locked**. Nothing below re-opens any of them; where research found an obstacle, it is reported as an obstacle with evidence.

### Locked Decisions

**A — Branch and integration**

- **D-01 (A-1):** Branch `feat/165-results-navigation-redraw` off `integration/ship-12-squash`. Re-apply the spike's production-file changes **by hand**, reading each one against its spike README as it lands. Never merge `lib/spike/` or `results-layered/` into the new branch. Re-measured on 2026-09-23: merge-base `e1f1944cf`, spike is **18 commits behind** and **4 ahead** of ship-12 (the discussion doc recorded 20 behind on 2026-09-22 — ship-12 moved; the planner re-derives this at run time rather than trusting either figure). — **Reversibility:** costly.
- **D-02 (A-2):** Leave `spike/results-redraw` in place, unmerged, as the reproduction rig. Its purpose is recorded in the phase's evidence doc so nobody merges it later.

**B — The four validated fixes (criteria 1–3)**

- **D-03 (B-1):** Ship the loader untrack fix **alone**; delete the `keepReady` stale-while-revalidate path. **Named residue:** a future load rerun from some other cause (a locale change, an `invalidate()`) still collapses the `(located)` subtree to `<Loading/>`. Accepted, and must appear in the phase's residue record.
- **D-04 (B-2):** The regression guard keeps a negative control **without** the lab. The test constructs a small local load-shaped function that reads `url.pathname` *tracked*, runs it through the same `recordingUrl` Proxy, and asserts `pathname` **is** recorded. **Named limit:** it proves the Proxy works, not that the real load was ever wrong — spike 031's README is the record of the latter, and must be cited from the test.
- **D-05 (B-3):** Keep `isOverlayNavigation` keyed on the `entity` + `id` params. Add a unit test pinning the contract — both params present on either end ⇒ true, either absent ⇒ false — and a comment naming the assumption that the results drawer is the only routed overlay.
- **D-06 (B-4):** The `html.vt-no-names *` rule stays in `routes/+layout.svelte`'s `<style>` block, beside the reduced-motion rule it pairs with. The landmine comment about `@media`-wrapping-`:global` stays readable next to both.

**C — Route restructure (criterion 4)**

- **D-07 (C-1):** **Do the restructure.** Recorded plainly: spike 033 found the new tree *behaviour-equivalent* and spike 031 marked the route-shape assumption **invalidated**. Delivered because criterion 4 is the phase's contract.
- **D-08 (C-2) — OPERATOR RULING.** The restructure splits the **files** but keeps **all four params optional**. The innermost page renders the list, so it matches every URL shape and stays a single component instance; a layout whose param is missing and cannot be implied renders the **picker** instead of `{@render children()}`. **No redirect is introduced anywhere.**

  ```
  results/
    [[electionTab]]/+layout.svelte           election tabs; picker when unimplied
      [[entityTab=etPl]]/+layout.svelte      entity-type tabs
        [[entity=etSg]]/[[id]]/+page.svelte  LIST + drawer
  ```

- **D-09 (C-3) — OPERATOR RULING.** Backward compatibility is a **non-goal**. The route test enumerates only the shapes the application itself emits. The cross-type `organizations/candidate/{id}` edge is kept only if a current emitter produces it, otherwise dropped with the drop recorded. **No aggressive canonicalisation and no redirects.**
- **D-10 (C-4) — AMENDS the discussion document's ★.** The params stay optional, so the URLs **stay routable** and both `+page.ts` guards keep their reason to exist: the matcher-fallthrough 404 and the entity-without-id / id-without-entity 307 are **carried into the new tree**, with their doc-comments.

**D — One app-wide drawer host (criterion 5)**

- **D-11 (D-1):** **Payload + context bridge**, as spike 034 built and measured it — `drawerHost.open({ key, title, content: Snippet, contexts: getAllContexts(), onDismiss })`, host wraps content in `ContextBridge`. **Standing obligation:** spike 034's verdict was `PARTIAL` because the question-info path was never exercised — D-13 discharges it.
- **D-12 (D-2):** **Both halves** of teardown safety: the opener-side last-defined pattern (`$state.raw` + `$effect.pre`) as the documented convention, **plus** a `<svelte:boundary>` around the hosted content inside the host.
- **D-13 (D-3):** The extended-question-info drawer **moves to the host in this phase, and is made exercisable**: the seed template gains a question with extended info and `questions.interactiveInfo.enabled`, plus an E2E spec that opens and closes it through the host. **Widest blast radius in the phase.**
- **D-14 (D-4):** Close motion reuses the existing `DELAY` constants and the `fly` shape `Drawer.svelte` already uses. Under `prefers-reduced-motion: reduce` the out-animation delay is skipped entirely. The spike's hard-coded 250 ms does not ship.

**E — Scroll and tab behaviour (criterion 2)**

- **D-15 (E-1):** Entity open, entity close and entity-tab switch keep scroll. **Election change keeps the default scroll-to-top.** Accepted cost: reads as inconsistent with the tab behaviour beside it.

**F — Verification and evidence**

- **D-16 (F-1):** Criteria 2 and 3 are proven by a **committed Playwright spec in the default E2E suite**. It asserts: scroll survives open / close / tab-switch **from a scrolled start**; no document VT runs for overlay navigations; any VT running with a `dialog[open]` present carries no named groups. The spec must **skip** rather than fail under reduced-motion or an unsupported browser.
- **D-17 (F-2):** One measured negative-control pair **per fix** — loader untrack, overlay-VT skip, name-strip, `noScroll` — recorded in `165-NEGATIVE-CONTROL.md` with command, exit code and counts, in the format every v2.15 phase used.
- **D-18 (F-3):** "Did not remount" is asserted by **node identity** — tag a list DOM node before the navigation, assert the same node is still there after.
- **D-19 (F-4):** Run the visual project **first**; re-capture a baseline only when the diff is explained by an intended change. Baselines captured **only** in `mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64`. **Precondition:** the ENOSPC constraint must be reclaimed before the phase's final gate.

**G — Removing the scaffolding (criterion 6)**

- **D-20 (G-1):** Delete all of it, and add **one cheap standing assertion** — a unit test grepping `apps/frontend/src` for `lib/spike` imports and for a `results-layered` route directory, expecting zero.
- **D-21 (G-2):** `forensics.mjs`, `probe-global.mjs` and `probe-qinfo.mjs` stay under `.planning/spikes/`. One line added to their READMEs noting they target the lab panel.

**H — Requirements and documentation**

- **D-22 (H-1):** Register a new `### Results Navigation` section in `.planning/REQUIREMENTS.md` with **RNAV-01 … RNAV-06** mapped one-to-one onto the six success criteria, plus matching § *Traceability* rows. **Hard coupling:** STATE.md's `29/29`, `270/270` and `100 %` must be corrected **in the same commit**. Both traceability counters are **recounted from the table rows, never incremented**.
- **D-23 (H-2):** Add a `results-redraw` domain to `./.claude/skills/spike-findings-voting-advice-application-gsd/`, carrying the two invariants.
- **D-24 (H-3):** One short subsection under `CLAUDE.md` § *Frontend (SvelteKit)* stating the same two invariants and pointing at `apps/frontend/src/lib/utils/viewTransition.ts` and `apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts`.

### Claude's Discretion

- Exact file names and internal split of the new route tree, provided it satisfies D-08's shape.
- Placement and naming of the new test files (D-05, D-16, D-18, D-20).
- The order plans are sequenced in, and which plans carry which negative-control pair (D-17).
- Whether the RNAV requirement text is worded per-criterion or per-mechanism, provided the mapping stays one-to-one (D-22).

### Deferred Ideas (OUT OF SCOPE)

- **Element-scoped VT (or a plain CSS fade) on the drawer's tab panel**, instead of today's whole-viewport root cross-fade for the in-drawer tab switch. Spike 032's open nit; cosmetic. **This is the residue half of the folded todo.**
- **A second routed overlay of any kind.** Would force D-05's predicate to generalise.
- **Shorter / slug IDs, multi-election and multi-constituency selection** — separate capabilities.
- Not in this phase (from § Phase Boundary): the disabled-Results-button affordance bug, and the SSR cookie crash on cold `/results` entry (hazard, not work).

---

## Phase Requirements

None are registered yet. D-22 makes registering **RNAV-01 … RNAV-06** in-scope work for this phase, mapped one-to-one onto the ROADMAP's six success criteria.

| ID | Maps to (ROADMAP § Phase 165 criterion) | Research support |
|----|------------------------------------------|------------------|
| RNAV-01 | 1 — no results navigation remounts the results subtree | § *De-Labbing Diff* rows 6 & 7 (the `fixLoader` branch + `keepReady` deletion); § *D-04's rebuilt control*; D-17 pair NC-1 |
| RNAV-02 | 2 — scroll preserved on open / close / entity-tab switch, from a scrolled start | § *De-Labbing Diff* row 10 (`noScroll: true` × 3 + `handleDrawerClose`); § *D-16 — the committed Playwright spec*; D-17 pair NC-4 |
| RNAV-03 | 3 — no document VT paints above an open modal | § *De-Labbing Diff* rows 1, 8, 9 (`isOverlayNavigation`, the `onNavigate` gate, the `html.vt-no-names *` rule); § *Pitfall 3 — the `!important` is load-bearing*; D-17 pairs NC-2 and NC-3 |
| RNAV-04 | 4 — results routes follow the layout | § *D-08 verified against SvelteKit* (probe output); § *What splitting the 401-line layout entails*. **Wording note:** the ROADMAP criterion says the `[entityTab]` level renders the list; D-08 supersedes that — the innermost *page* renders it. Word RNAV-04 to D-08's shape, not the ROADMAP's sentence, and record the divergence |
| RNAV-05 | 5 — one app-wide drawer host serving both drawers | § *The drawer host (D-11/D-12/D-13)*; § *D-13's exercisable path* |
| RNAV-06 | 6 — spike scaffolding gone | § *Measured populations*; § *D-20's standing assertion* |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Load-dependency tracking (`untrack` the URL reads) | Frontend Server (SSR) — universal `+layout.ts` | Browser (client-side reruns) | The load runs on both; `+layout.ts` is universal and the fix is correct on the server too (spike 032 item 2). Not an API-tier concern — nothing in the schema changes |
| Route shape / layout nesting | Frontend Server (SSR) — SvelteKit route tree | Browser (client navigation) | SvelteKit's route manifest is built at sync/build time from the directory tree; the layout chain is static per route id |
| Entity-list rendering and list identity | Browser | — | The "one component instance" guarantee is a client-side mount-lifecycle property |
| Drawer host / `<dialog>` top layer | Browser | — | `showModal()`, the top layer and View Transitions are browser-only. The host mounts under `{:else}` in the root layout, i.e. client-rendered |
| View Transition suppression + name stripping | Browser | — | `document.startViewTransition` does not exist on the server; `shouldAnimate` already short-circuits on `typeof document === 'undefined'` |
| Question extended-info content | Database / Storage (`app_settings` + `questions.info`) | Frontend Server (settings merge) | `questions.interactiveInfo.enabled` is an **app-level** setting in the `app_settings` singleton; the info body is per-question data |
| Scroll restoration | Browser | Frontend Server (`goto` options) | SvelteKit's `scroll_state()` restore runs client-side after the DOM update |
| E2E observation of VTs | Browser (Playwright init script) | — | `page.addInitScript` wraps `document.startViewTransition` before app script runs — no production instrumentation |

---

## Standard Stack

No new dependency is introduced by this phase. Everything is already in the tree.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sveltejs/kit` | 2.55.0 | Route tree, layout chain, `goto`, `onNavigate`, load `untrack` | `[VERIFIED: node_modules/@sveltejs/kit/package.json — "version": "2.55.0"]` |
| `svelte` | 5.53.12 | Runes, snippets, `getAllContexts`, `<svelte:boundary>` | `[VERIFIED: node_modules/svelte/package.json — "version": "5.53.12"]` |
| `@playwright/test` | 1.58.2 | E2E spec for D-16, visual project for D-19 | `[VERIFIED: npx playwright --version → "Version 1.58.2"]` |
| `vitest` | 3.x (catalog) | Unit guards for D-04, D-05, D-20 | `[VERIFIED: apps/frontend/package.json devDependencies "@vitest/coverage-v8": "^3.2.4", "vitest": "catalog:"]` |

### Supporting (in-repo modules the decisions name)

| Module | Purpose | When to Use |
|--------|---------|-------------|
| `$lib/utils/timing` → `DELAY` | `{ xs: 150, sm: 225, md: 350, lg: 450, xl: 600, '2xl': 800 }` `[VERIFIED: apps/frontend/src/lib/utils/timing.ts:4-11]` | D-14's close-animation duration. `Drawer.svelte` already flies with `DELAY.xs` |
| `$lib/utils/viewTransition` → `shouldAnimate` | SSR / feature-detect / reduced-motion / `?notr=1` gate | D-14 branches on the same gate for the reduced-motion close |
| `$lib/utils/aria/focus` → `focusFirstDescendant`, `attemptFocus` | Modal focus entry | The host must keep `ModalContainer`'s a11y contract |
| `$lib/components/modal` → `ModalContainer`, `Drawer` | The per-route drawer being retired | Read before writing the host — the a11y contract lives here |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Payload + `ContextBridge` (D-11) | Global shell + portal | **Excluded by D-11.** Svelte 5 has no portal primitive; manual DOM relocation breaks `transition:`, focus order and `ModalContainer`'s a11y contract. Spike 034 named it worth comparing and did not build it |
| `<svelte:boundary>` (D-12) | `try/catch` in the snippet | A `try/catch` cannot catch a throw inside Svelte's render flush. `<svelte:boundary>` is the only mechanism that can `[VERIFIED: node_modules/svelte/src/compiler/phases/2-analyze/visitors/SvelteBoundary.js:6 — const valid = ['onerror', 'failed', 'pending'];]` |
| Vitest filesystem guard (D-20) | `scripts/assert-*.mjs` wired into `lint:check` | Both are house style. `apps/frontend/src/lib/_guards/*.test.ts` and `lib/routes/routeConsistency.test.ts` are the vitest precedents; `yarn lint:check` carries 15 `assert:*` scripts. D-20 says "unit test" — follow it |

**Installation:** none. `yarn build` is the only prerequisite command.

---

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** Every module it touches is already a dependency of `apps/frontend`, `packages/dev-seed` or `tests`. No `npm install`, `pip install` or `cargo add` appears anywhere in the decision set, so there is no registry surface to audit.

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

If a plan later proposes a new dependency (none is indicated), it must run the Package Legitimacy Gate before the install task.

---

## Architecture Patterns

### System Architecture Diagram

```
                       ┌──────────────────────────────────────────┐
  URL change ────────▶ │ (located)/+layout.ts   [universal load]   │
  (/results/... )      │  reads url.* INSIDE untrack ONLY          │◀── RNAV-01
                       │  → returns SAME streamed promises when    │
                       │    only the path changed                  │
                       └───────────────┬──────────────────────────┘
                                       │ data.questionData / nominationData
                                       ▼
                       ┌──────────────────────────────────────────┐
                       │ (located)/+layout.svelte                  │
                       │  $effect: ready = false → <Loading/>      │
                       │  NOT re-entered on path-only navigation   │
                       └───────────────┬──────────────────────────┘
                                       │ {@render children()}
                                       ▼
   ┌───────────────────────────────────────────────────────────────────────┐
   │ results/[[electionTab]]/+layout.svelte      ── L1 ──                   │
   │  MainContent(title, hero, ingress) + AccordionSelect (election picker) │
   │  activeElectionId implied?  ──NO──▶ render PICKER (stop)               │
   │                             ──YES─▶ {@render children()} inside        │
   │                                     {#snippet fullWidth()}             │
   └───────────────────────────────┬───────────────────────────────────────┘
                                   ▼
   ┌───────────────────────────────────────────────────────────────────────┐
   │ .../[[entityTab=etPl]]/+layout.svelte       ── L2 ── (NEW FILE)        │
   │  <Tabs> when entityTabs.length > 1                                     │
   │  activeEntityType implied? ──NO──▶ render noNominations warning (stop) │
   │                            ──YES─▶ {@render children()}                │
   └───────────────────────────────┬───────────────────────────────────────┘
                                   ▼
   ┌───────────────────────────────────────────────────────────────────────┐
   │ .../[[entity=etSg]]/[[id]]/+page.svelte     ── P3 ── (EXISTS, empty)   │
   │  {#key electionId:entityType} heading + <EntityListWithControls>       │
   │  entity && id present? ──▶ mount <EntityDrawerOpener> (renders NOTHING)│
   │  +page.ts guards stay: matcher-fallthrough 404 · coupling 307 (D-10)   │
   └───────────────────────────────┬───────────────────────────────────────┘
                                   │ drawerHost.open({key,title,content,contexts,onDismiss})
                                   ▼
   ┌───────────────────────────────────────────────────────────────────────┐
   │ routes/+layout.svelte  ── ROOT ──                                      │
   │  onNavigate: isOverlayNavigation(from,to) ⇒ NO document VT  ◀── RNAV-03│
   │  <DrawerHost/>  — the app's only <dialog>                              │
   │    <svelte:boundary>  ContextBridge(payload.contexts)                  │
   │                         {@render payload.content()}                    │
   │  <style> html.vt-no-names * { view-transition-name: none !important }  │
   └───────────────────────────────────────────────────────────────────────┘
                                   ▲
   QuestionExtendedInfoButton ──────┘  (same host, same payload shape — D-13)
   (questions/+layout.svelte)
```

### Recommended Project Structure

```
apps/frontend/src/
├── lib/
│   ├── components/modal/drawerHost/      # NEW — productionised spike 034
│   │   ├── DrawerHost.svelte             #   the app's only <dialog>, with <svelte:boundary>
│   │   ├── drawerHostState.svelte.ts     #   the singleton + DrawerPayload type
│   │   ├── ContextBridge.svelte          #   setContext() re-provider
│   │   └── index.ts
│   ├── dynamic-components/entityDetails/
│   │   └── EntityDrawerOpener.svelte     # NEW — was lib/spike/GlobalEntityDrawer.svelte
│   ├── _guards/
│   │   └── spike-scaffolding.test.ts     # NEW — D-20 standing assertion
│   └── utils/viewTransition.ts           # de-labbed
└── routes/(voters)/(located)/results/[[electionTab]]/
    ├── +layout.svelte                    # SPLIT — L1 shell + election picker
    ├── +layout.ts                        # unchanged (guards 1–4 intact)
    ├── statistics/+page.svelte           # ⚠ see Pitfall 1
    └── [[entityTab=etPl]]/
        ├── +layout.svelte                # NEW — L2 entity-type tabs
        └── [[entity=etSg]]/[[id]]/
            ├── +page.svelte              # list + drawer opener (was empty)
            └── +page.ts                  # unchanged (D-10 keeps both guards)
```

**Deliberately absent:** a `+layout.svelte` at `[[entity=etSg]]/`. My probe showed SvelteKit accepts one, but D-08's shape names only two layout levels and a third adds a file with nothing to own.

### Pattern 1: Optional-param layout renders the picker instead of children

**What:** A layout whose own param is missing **and cannot be implied** renders a chooser and does **not** render `{@render children()}`. This is what makes the leaf page safe to assume its scope is resolved.

**When to use:** L1 (`activeElectionId` undefined) and L2 (`activeEntityType` undefined).

**Example — the shape L1 takes, derived from today's markup:**

```svelte
<!-- results/[[electionTab]]/+layout.svelte -->
<script lang="ts">
  let { children }: { children: Snippet } = $props();
  const voterCtx = getVoterContext();
  const elections = $derived(voterCtx.selectedElections);
  const activeElectionId = $derived<string | undefined>(
    page.params.electionTab ?? (elections.length === 1 ? elections[0].id : undefined)
  );
</script>

<MainContent title={...}>
  {#snippet hero()}…{/snippet}
  <div data-testid="voter-results-ingress">…</div>
  {#if voterCtx.dataRoot.elections.length > 1}
    <AccordionSelect … data-testid="voter-results-election-select" />
  {/if}
  {#snippet fullWidth()}
    <div style="content-visibility: auto;" data-testid="voter-results-list-container">
      {#if activeElectionId}
        {@render children()}
      {:else}
        <p transition:slide>{t('results.selectElectionFirst')}</p>
      {/if}
    </div>
  {/snippet}
</MainContent>
```

Note `{@render children()}` sitting **inside** the `fullWidth` snippet. That is legal — the snippet closes over the layout's `children` prop — and it is the only way to keep the list inside `MainContent`'s full-width region while the list is owned by a descendant route file.

### Pattern 2: `$derived` from `page.params`, never prop-drilled or context-bridged

Each level re-derives what it needs from `page.params` + `voterCtx`. This is exactly what today's single layout does (`const _urlElectionTab = $derived(page.params.electionTab)`), and it keeps the layout doc's stated architecture — "URL is the single source of truth … No local `$state` twins for URL-derivable state; no `$effect`-based sync" `[VERIFIED: apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:11-14]` — true across three files instead of one.

`voterCtx.currentResultsEntityType` already does the implied-tab resolution centrally and the loader's doc-comment names it as the reason the URL is not force-filled `[VERIFIED: apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts:13 — "The implied entity tab lives on `voterContext.currentResultsEntityType`; the URL carries `entityTab` only when the user explicitly selects a tab."]`. L2 reads `voterCtx.currentResultsEntityType` directly — **never** through a `$derived` alias bound to `dataRoot`, per CLAUDE.md's carve-out.

### Pattern 3: Opener renders nothing; the host renders everything

```svelte
<!-- EntityDrawerOpener.svelte — renders nothing in place -->
<script lang="ts">
  const contexts = getAllContexts();
  const key = drawerHost.newKey('entity');
  // svelte-ignore state_referenced_locally -- seeded once; kept current by the pre-effect below
  let shownEntity = $state.raw(entity);
  $effect.pre(() => { if (entity) shownEntity = entity; });
  $effect(() => {
    untrack(() => drawerHost.open({ key, title: () => unwrapEntity(shownEntity).entity.name,
                                    content, contexts, onDismiss: onClose,
                                    testId: 'voter-results-drawer' }));
    return () => drawerHost.close(key);
  });
</script>
{#snippet content()}<EntityDetails entity={shownEntity} class="min-h-full" />{/snippet}
```

This is spike 034's file with the lab log removed. The `$state.raw` + `$effect.pre` pair is D-12's "convention half" and the comment above it in the spike file is the one that must survive productionisation verbatim.

### Anti-Patterns to Avoid

- **Binding `dataRoot` to a `$derived` read alias in any of the three new files.** D-07's file split is precisely the operation that tempts it (`const dataRoot = $derived(ctx.dataRoot)` in each level). Today's layout carries the warning in a comment `[VERIFIED: .../results/[[electionTab]]/+layout.svelte:69]`; three files means three chances to lose it. Read `voterCtx.dataRoot.<prop>` directly inside the consuming tracking scope.
- **Destructuring a reactive accessor** (`const { matches } = getVoterContext()`). The layout's own comment lists which members are safe: "`getRoute`, `t`, `answers`, `startEvent`, `*Countdown`" are destructured; everything else goes through `voterCtx.X` `[VERIFIED: .../results/[[electionTab]]/+layout.svelte:61-72]`.
- **Force-filling `entityTab` into the URL** in any new emitter. `+layout.ts:13` and `+page.ts:34` both carry the loop-fix note. D-08 exists to keep it closed.
- **Adding a `+page.svelte` at L1 or L2.** That is what produced spike 033's measured implied-tab remount — "different component instances in different route files" `[CITED: .planning/spikes/033-layout-shaped-results-routes/README.md § Investigation Trail item 3]`.
- **Reading the opener's props from the hosted snippet.** The teardown hang. D-12's boundary is the net, not the fix.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Observing a View Transition from a test | A dev-only VT ledger in production code | `page.addInitScript` wrapping `document.startViewTransition` | D-18 forbids the ledger by name; the init-script form is the repo's own precedent (`trackingIntercept.fixture.ts` wraps `window.umami.track` the same way) `[VERIFIED: tests/tests/fixtures/shared/trackingIntercept.fixture.ts:66-78]` |
| "Did not remount" | A mount counter | DOM node identity via `page.evaluate` handle comparison | D-18. Zero production instrumentation |
| Stripping `view-transition-name` | Walking the DOM and clearing inline styles | The one `html.vt-no-names *` CSS rule + a class toggle | Already written and measured; the `!important` is what beats the inline `style="view-transition-name: …"` attributes |
| Catching a throw during Svelte's render flush | `try/catch` around `{@render}` | `<svelte:boundary onerror={…}>` | A `try/catch` in a component script cannot intercept an error thrown inside the flush; that is what hung the dialog in spike 034 |
| Re-providing contexts below a different component tree | Manual `setContext` per key at each opener | One `ContextBridge` fed `getAllContexts()` | Spike 034 built it in 13 lines; the alternative is a per-opener list that goes stale |
| Detecting reduced motion in a Playwright spec | Trusting `page.emulateMedia({reducedMotion})` reached the app | `page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)` | The repo carries **contradictory** claims about whether the Playwright option reaches the app's `matchMedia` — `voter-journey.fixture.ts:282` says it does not, `eperm07-term-trigger.spec.ts:63,143` uses it as a discriminator. Evaluating in-page sidesteps the disagreement |

**Key insight:** every instrument this phase needs already exists in the tree in some form — the lab's `logVtStart`, the fixture's `addInitScript` stub, the tracking test's `recordingUrl` Proxy. The phase's job is to **re-home** them, not to invent them, and each re-homing is where the negative control has to be re-taken because the instrument changed address.

---

## Runtime State Inventory

> This phase is a refactor + delete of frontend source. It touches no persisted application data, but the scaffolding removal and the seed question are state-shaped, so every category is answered explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | `localStorage` key **`redrawLab`** — written by `lib/spike/redrawLab.svelte.ts` (`const STORAGE_KEY = 'redrawLab'` `[VERIFIED: apps/frontend/src/lib/spike/redrawLab.svelte.ts:40]`) and read in its constructor. A developer who used the lab has a stale entry in their browser profile. Harmless after the module is deleted (nothing reads it) — but it is the one persisted artefact of the lab | Code deletion only; no migration. Record it in the residue note so a future "why is there a `redrawLab` key" question has an answer |
| **Live service config** | None — the phase touches no n8n workflow, no Datadog service, no Cloudflare tunnel. **Verified by:** the decision set names only `apps/frontend/src`, `packages/dev-seed`, `tests/` and `.planning/`/`.claude/` documents | None |
| **OS-registered state** | None — no scheduled task, pm2 process or launchd plist references anything this phase renames. **Verified by:** no rename of a binary, script name or package name appears in the decision set | None |
| **Secrets / env vars** | None added or renamed. `PUBLIC_PROJECT_ID` and `FRONTEND_PORT` are consumed unchanged | None. (The E2E preflight's project-id gate still applies — see § *Validation Architecture*) |
| **Build artifacts** | `apps/frontend/.svelte-kit/generated/**` carries route nodes for the nine `results-layered/` files and for the current layout chain — e.g. `"/(voters)/(located)/results-layered/[electionTab]/[entityTab=etPl]/[entity=etSg]/[id]": [30,[2,3,6,7,8]]` `[VERIFIED: apps/frontend/.svelte-kit/generated/client/app.js:110]`. Stale after the deletion. `.svelte-kit/types/**` likewise | `yarn workspace @openvaa/frontend build` (or `svelte-kit sync`) regenerates. `yarn dev:clean` wipes `.svelte-kit` + the vite cache if a stale node causes a phantom route |
| **Seed data (D-13)** | The `app_settings` singleton row carries `questions.interactiveInfo.enabled`. `e2e/base` ships **`false`** `[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:169-171 — "interactiveInfo: {\n      enabled: false\n    },"]`; `perm-interactive-info` ships **`true`** `[VERIFIED: packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts:300-302 — "interactiveInfo: {\n              enabled: true\n            }"]`. `perm-interactive-info.spec.ts` re-seeds the singleton per mode and restores it in `afterAll` | See § *D-13's exercisable path*. Any template edit requires a re-seed (`yarn db:seed --template …`) before the affected project runs; a stale singleton is the contamination shape the memory index records for Phase 124 |

**The canonical question — after every file in the repo is updated, what runtime systems still have the old string cached?** Answer for this phase: one `localStorage` key in developer browser profiles, and `.svelte-kit`'s generated route manifest. Nothing server-side, nothing in the database except the `app_settings` flag D-13 may touch.

---

## The De-Labbing Diff

> **Source of truth:** `git diff e1f1944cf8fe102e6725efac8ccef5cc3ea1c1ad HEAD -- apps packages tests` on this worktree, 2026-09-23. `e1f1944cf8fe102e6725efac8ccef5cc3ea1c1ad` is `git merge-base HEAD integration/ship-12-squash` `[VERIFIED: measured this session]`.
>
> **Topology re-measured:** `git rev-list --left-right --count integration/ship-12-squash...HEAD` → **`21  7`** — 21 behind, 7 ahead. CONTEXT.md records 18/4 as of 2026-09-22; ship-12 has moved again. All 7 ahead-commits are titled `docs(…)`, but **four of them carry the production code** (see below), which is the single most misleading thing about this branch's history.

### Which commit carries what

| Commit | Title prefix | Production files it touches |
|--------|--------------|------------------------------|
| `f2a421063` | `docs(spike-031)` | `Tabs.svelte`, `EntityDetailsDrawer.svelte`, `EntityListWithControls.svelte`, `MainContent.svelte`, `viewTransition.ts`, `(located)/+layout.svelte`, `(located)/+layout.ts`, `results/[[electionTab]]/+layout.svelte`, `routes/+layout.svelte` |
| `9e663c7a5` | `docs(spike-032)` | `viewTransition.ts`, `(located)/+layout.ts`, `layout.tracking.test.ts` (new), `results/[[electionTab]]/+layout.svelte`, `routes/+layout.svelte` |
| `70e2390e9` | `docs(spike-033,034)` | `QuestionExtendedInfoButton.svelte`, `viewTransition.ts`, `(located)/+layout.*`, `layout.tracking.test.ts`, `results/[[electionTab]]/+layout.svelte`, `routes/+layout.svelte`, + the 9 `results-layered/` files |
| `e65857f04` | `docs(165)` | none |

**Practical consequence for D-01:** `git show <commit> -- <path>` per file is the reliable way to read a change against its spike README, and the three code-bearing commits map cleanly onto spikes 031 / 032 / 033-034, so "read each one against its spike README as it lands" is directly executable.

### Row-by-row: what stays, what goes

Eleven production files carry a spike-era change. **Column "After de-labbing" is the form to re-apply by hand on the new branch.**

| # | File | Change on the spike branch | After de-labbing |
|---|------|---------------------------|------------------|
| 1 | `lib/utils/viewTransition.ts` | +`import { lab } from '$lib/spike/redrawLab.svelte'`; +`VT_NO_NAMES_CLASS`; +`NavigationEnd` iface; +`isOverlayNavigation` / `hasOverlay`; `startViewTransition` gains `toUrl?`/`label` params, the `stripNames` computation, the class add/remove and two `lab.log*` calls; module doc gains the ⚠ landmine paragraph | **KEEP** everything except: drop the `lab` import, drop both `lab.log*` lines, and simplify `const stripNames = lab.vt !== 'legacy' && !!document.querySelector('dialog[open]')` → `const stripNames = !!document.querySelector('dialog[open]')`. **Decide:** `toUrl` and `label` exist only to feed `lab.logVtStart`. With the lab gone they are unused → drop both params and revert the two call sites (rows 2 and 9) to the single-argument form. Dropping them is the honest de-lab; keeping them is dead API |
| 2 | `lib/components/tabs/Tabs.svelte` | `startViewTransition(fn)` → `startViewTransition(fn, undefined, 'local-tab')` | **REVERT** to `startViewTransition(() => { activeIndex = index; })`, consequent on row 1's decision. **No other change.** This is a pure lab artefact — spike 031's `names` toggle is what needed the label |
| 3 | `lib/dynamic-components/entityDetails/EntityDetailsDrawer.svelte` | +`import { labMount }`; +`labMount('EntityDetailsDrawer');` | **DELETE both lines.** Nothing else. (The component itself is superseded by the host in D-11 — see § *drawer host*, which may delete the file outright) |
| 4 | `lib/dynamic-components/entityList/EntityListWithControls.svelte` | +`import { labMount }`; +`labMount('EntityListWithControls');` | **DELETE both lines.** Nothing else |
| 5 | `lib/layouts/main/MainContent.svelte` | +`import { labMount }`; +`labMount('MainContent');` | **DELETE both lines.** Nothing else. ⚠ the import was inserted **between** two existing `$lib/contexts/*` imports, so removing it also restores import order for the lint rule |
| 6 | `routes/(voters)/(located)/+layout.ts` | The `fixLoader` branch: `const { pathname, search } = fixLoader ? untrack(…) : { … }`, plus a 3-line doc-comment and the `lab` import | **KEEP the doc-comment**, **DELETE the branch**: unconditional `const { pathname, search } = untrack(() => ({ pathname: url.pathname, search: url.search }));`, then the two existing consumers read `pathname` / `search`. Drop the `lab` import and the `SPIKE` line. **This is RNAV-01's entire production change** |
| 7 | `routes/(voters)/(located)/+layout.svelte` | The `keepReady` path: `const wasReady = untrack(() => ready); lab.log(…); if (!(lab.keepReady && wasReady)) ready = false;` + `lab` import | **REVERT to the original `ready = false;`** — D-03 deletes `keepReady`. Drop the `lab` import. ⚠ the `untrack` import may now be unused in this file: check, because `untrack` was added for the lab read. **Residue to record (D-03):** any load rerun from another cause still collapses the subtree to `<Loading/>` |
| 8 | `routes/+layout.svelte` — `onNavigate` | +`lab.log('nav', …)` + `navigation.complete.then(…)` logging; +`const animate = lab.vtOverride() ?? !isOverlayNavigation(navigation.from, navigation.to); if (!animate) { lab.log(…); return; }`; `startViewTransition(fn)` → 3-arg form | **KEEP** the overlay gate as `if (isOverlayNavigation(navigation.from, navigation.to)) return;` with the existing explanatory comment. **DELETE** both log blocks and the `vtOverride()`. Revert the `startViewTransition` call per row 1 |
| 9 | `routes/+layout.svelte` — markup + `<style>` | +`<DrawerHost />` under `{:else}`; +`<RedrawLabPanel />` at file scope; +`:global(html.vt-no-names *) { view-transition-name: none !important; }` with its doc-comment | **KEEP** `<DrawerHost />` (re-pointed at the productionised path) and the `:global` rule + comment **exactly where they are** (D-06). **DELETE** `<RedrawLabPanel />` and its import |
| 10 | `routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` | +`GlobalEntityDrawer` import + `{#if lab.drawer === 'global'}` branch; +`labMount('ResultsLayout')`; the three `goto(buildListRoute(…), { noScroll: true })` + the explanatory comment above `handleEntityTabChange` | **KEEP** all three `{ noScroll: true }` and the comment — **this is RNAV-02's production change** (`handleDrawerClose` already had `noScroll` pre-spike `[VERIFIED: same file :248-251]`). **DELETE** `labMount`, the `lab` import and the `{#if lab.drawer}` branch — under D-11 the surviving branch is the **host** opener, not `EntityDetailsDrawer`. Then this file is split per D-07/D-08 |
| 11 | `routes/(voters)/(located)/layout.tracking.test.ts` | New file. 4-case table test + a control case that flips `lab.loader = 'current'` | **KEEP** the file and the `recordingUrl` Proxy verbatim; **REPLACE** the control case per D-04 (see § *D-04's rebuilt control*) |

**Plus, not in the eleven:** `lib/spike/{ContextBridge,DrawerHost,drawerHostState,GlobalEntityDrawer}` are **productionised** (moved + de-labbed), and `lib/spike/{redrawLab.svelte.ts,RedrawLabPanel.svelte}` plus all nine `results-layered/` files are **deleted outright**.

### Measured populations (re-derived at run time, 2026-09-23, HEAD `e6c31161d`)

Per the repo's content-anchor rule these were measured, not read from CONTEXT.md. They agree with CONTEXT's snapshot — the apparent divergences are scoping, exactly as CONTEXT says.

```
find apps/frontend/src/lib/spike -type f | wc -l                          →  6
find 'apps/frontend/src/routes/(voters)/(located)/results-layered' -type f →  9
grep -rl 'lib/spike' apps/frontend/src --include='*.svelte' --include='*.ts' | wc -l          → 15
  … same, minus files under lib/spike/ itself                                                → 14
  … minus results-layered/ as well  (the production de-labbing surface)                      → 10
grep -rn 'SPIKE' apps/frontend/src --include='*.svelte' --include='*.ts' | wc -l             → 30
  … excluding results-layered/ and lib/spike/                                                → 14
grep -rn 'labMount(' … | wc -l                                                               →  9
  … excluding results-layered/                                                               →  5   (4 call sites + the definition)
  … excluding results-layered/ and lib/spike/                                                →  4
```

The **10** production importers are rows 1, 3, 4, 5, 6, 7, 8/9 (one file), 10, 11 above — nine files — plus `results-layered/…` excluded. Re-derive before planning: `grep -rl 'lib/spike' apps/frontend/src --include='*.svelte' --include='*.ts' | grep -v 'lib/spike/' | grep -v 'results-layered/'`.

---

## D-08 verified against SvelteKit

> **This is the section the phase asked to be told loudly about. The ruling holds.**

### The question

Do nested layouts at `[[a]]/` and `[[b]]/` both render when the URL supplies neither param?

### Evidence 1 — today's tree already proves the single-level case

The compiled client manifest maps the leaf route to layout chain `[2,3,5]`:

```
"/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]": [25,[2,3,5]]
"/(voters)/(located)/results/[[electionTab]]/statistics": [26,[2,3,5]]
```
`[VERIFIED: apps/frontend/.svelte-kit/generated/client/app.js:111-112]`

Layout node 5 is `results/[[electionTab]]/+layout.svelte`. **The chain carries no params** — it is a static function of the directory tree. And the `+layout.ts` doc-comment states in terms that the bare-`/results` case falls through to that layout to render the picker: *"**Absent `params.electionTab` AND 2+ AVAILABLE elections**: render the existing election-picker shape — fall through to the layout's normal render. The picker UI lives in `+layout.svelte` (the `AccordionSelect` block)."* `[VERIFIED: apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts:23-24]`

So an optional-param layout demonstrably renders when its param is absent. That is half the question.

### Evidence 2 — a positive probe for the two-level case

I created the two scratch files D-08's shape calls for and ran SvelteKit's own route analysis:

```bash
# created: results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte
# created: results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/+layout.svelte
cd apps/frontend && node ../../node_modules/@sveltejs/kit/src/cli.js sync   # EXIT=0
```

SvelteKit generated a `$types.d.ts` for each. Verbatim, from the `[[entityTab=etPl]]` one:

```ts
type RouteId = '/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]';
type LayoutRouteId = RouteId | "/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]"
type LayoutParams = RouteParams & { electionTab?: string; entityTab?: MatcherParam<…etPl…>; entity?: MatcherParam<…etSg…>; id?: string }
type LayoutProps = { params: LayoutParams; data: LayoutData; children: import("svelte").Snippet }
```
`[VERIFIED: apps/frontend/.svelte-kit/types/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/$types.d.ts — generated this session by the probe; file removed afterwards]`

And from the `[[entity=etSg]]` one:

```ts
type RouteId = '/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]';
type LayoutRouteId = RouteId | "/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]"
type LayoutParams = RouteParams & { electionTab?: string; entityTab?: …; entity?: …; id?: string }
```

Three things this establishes:

1. SvelteKit **accepts** the arrangement — `sync` exits 0, no `svelte_kit` route error.
2. Each new layout's `LayoutRouteId` union **contains the leaf route id**, i.e. SvelteKit places it on the leaf's layout chain.
3. `LayoutParams` declares **every one of the four params optional** at each level, which is exactly D-08's "all four params optional" and is what makes "render the picker when the param is missing" a type-level supported state rather than a hack.

**Cleanup verified:** both scratch files deleted, `sync` re-run (EXIT=0), `git status --porcelain` → `M .planning/config.json` only (the pre-existing modification). No probe artefact survives.

### Evidence 3 — what actually differed in spike 033

`results-layered/` used **required** params and put a `+page.svelte` at three levels:

```
results-layered/+page.svelte
results-layered/[electionTab]/+page.svelte
results-layered/[electionTab]/[entityTab=etPl]/+page.svelte
results-layered/[electionTab]/[entityTab=etPl]/[entity=etSg]/[id]/+page.svelte
```
`[VERIFIED: find on apps/frontend/src/routes/(voters)/(located)/results-layered — 9 files, listed this session]`

and its manifest chain is `[2,3,6,7,8]` with **four distinct page nodes** (27, 28, 29, 30) `[VERIFIED: apps/frontend/.svelte-kit/generated/client/app.js:107-110]`. Spike 033's measured regression names the cause exactly: *"the first switch from the implied tab … to an explicit one … remounts L3 — **different component instances in different route files**. `/results` keeps one list instance because one layout renders every shape."* `[CITED: .planning/spikes/033-layout-shaped-results-routes/README.md § Investigation Trail item 3]`

D-08 keeps **one** page node. The remount spike 033 measured cannot occur, because there is no second file for the list to move into.

### Consequence nobody has written down: D-08 changes no route id

The leaf page under D-08 sits at `results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte` — **byte-identical to where it sits today** `[VERIFIED: file exists at that path on this worktree]`. Therefore:

- `ROUTE.ResultEntity` / `ResultCandidate` / `ResultParty` = `` `${VOTER_LOCATED}/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]` `` — **unchanged** `[VERIFIED: apps/frontend/src/lib/routes/route.ts:70-72]`
- `ROUTE.Results` and `ROUTE.Statistics` — unchanged `[VERIFIED: route.ts:73-74]`
- `DEFAULT_PARAMS` for `ResultCandidate` / `ResultParty` — unchanged `[VERIFIED: route.ts:123-127]`
- `buildListRoute` emits path strings (`/results{/e}{/plural}${page.url.search}`) — **unchanged** `[VERIFIED: .../results/[[electionTab]]/+layout.svelte:213-219]`; it moves file, not shape
- Both `+page.ts` guards stay where they are, per D-10 — **and they do not even have to move**, since the leaf directory is unchanged
- `routeConsistency.test.ts` — **does not assert the results path at all.** `ROUTE.Results` appears in exactly one place, as a *negative control* for `isProtectedRoute`: `['Results', ROUTE.Results]` inside the `it.each` that asserts `isProtectedRoute` answers **false** `[VERIFIED: apps/frontend/src/lib/routes/routeConsistency.test.ts:379]`. The file's filesystem walk is scoped to `(protected)` group directories `[VERIFIED: routeConsistency.test.ts:249-271]`, so no results route is compared against disk by it

**Bottom line for the planner:** CONTEXT.md's D-07 reversibility note ("undoing it means … reverting `ROUTE.ResultEntity`, `routeConsistency.test.ts`, `buildListRoute` and both `+page.ts` guards together") describes spike 033's required-param tree. Under D-08 it is **one layout file added and one layout file split**. Plan for that scope, and record the correction so the reversibility note is not carried forward as-is.

---

## What splitting the 401-line layout entails

`apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` is **401 lines** `[VERIFIED: wc -l, this session]`. Here is everything it owns and where each piece lands.

### Inventory → destination

| What it owns | Lines | Destination under D-08 | Note |
|---|---|---|---|
| `_children` prop (renamed, never rendered) | 54-55 | **L1 — now genuinely rendered** | The `// reason:` comment explaining the rename is deleted with it |
| Context acquisition + the destructure-rule comment block | 61-72 | **Duplicated at all three levels**, trimmed to what each needs | The comment is the CLAUDE.md-rule carrier; each copy must keep the `dataRoot` sentence |
| `_urlElectionTab`, `activeElectionId`, `activeElection` | 89-97 | **L1** (L2/P3 re-derive `activeElectionId` from `page.params.electionTab` if they need it) | |
| `_urlPluralRaw` / `_urlPlural` (`EntityPlural` narrowing) | 99-104 | **L2** (and P3, for `buildListRoute`) | Consider exporting the narrowing from a small shared module next to the routes rather than copying it |
| `entityTabs` (`EntityTab[]` from `voterCtx.matches`) | 106-115 | **L2** | |
| `activeEntityType` = `voterCtx.currentResultsEntityType` | 117-118 | **L2** (gate) and **P3** (list scope) | Read through `voterCtx.X` at both |
| `activeMatches` (`toSorted(compareMaybeWrappedEntities)`) + its long tie-break rationale | 120-129 | **P3** | The tie-break comment is load-bearing history — move it whole |
| `activeTabIndex` | 131-136 | **L2** | |
| `drawerVisible`, `drawerEntity` (+ the silent-degradation `catch`) | 138-165 | **P3** | |
| `onMount` `results_ranked`/`results_browse` page-entry event | 171-177 | **L1** | Must fire once per results entry. L1 is the level that persists across every in-results navigation |
| Feedback + survey popup countdown `$effect`s | 179-189 | **L1** | Same reason |
| Drawer-view tracking `$effect` | 191-201 | **P3** | It is keyed on `drawerVisible`/`drawerEntity` |
| `buildListRoute` + its name-disjoint doc-comment | 207-219 | **Shared** — L1 (election change), L2 (tab change), P3 (drawer close). Extract to a sibling module (e.g. `results/resultsRoutes.ts`) rather than triplicating | Takes `page.url.search`, so it needs no props |
| `handleElectionChange` | 221-226 | **L1** — keeps default scroll-to-top per **D-15** | |
| `handleEntityTabChange` (3× `{ noScroll: true }`) + its comment | 228-246 | **L2** | RNAV-02 |
| `handleDrawerClose` (`noScroll: true`) + its comment | 248-251 | **P3** | |
| `_pluralForActiveType`, `getName` | 253-262 | with their callers | |
| `{#if Object.values(voterCtx.nominationsAvailable).some(Boolean)}` / `{:else}` no-nominations `MainContent` | 267, 388-400 | **L1** | The whole-page empty state |
| Drawer-first `{#if drawerVisible && drawerEntity}` block | 268-279 | **P3** — but see § *Pitfall 2* | |
| `MainContent` + `hero` + ingress | 281-305 | **L1** | |
| `AccordionSelect` election picker + `activeElection.info` slide | 307-323 | **L1** | `style="view-transition-name: results-election-select"` travels with it |
| `{#snippet fullWidth()}` list container (`content-visibility: auto`) | 325-332, 385-386 | **L1** — `{@render children()}` goes inside it | |
| `{#if activeElectionId}` … `{:else} results.selectElectionFirst` | 333, 380-384 | **L1** — this **is** D-08's "picker instead of children" | |
| `<Tabs>` (`view-transition-name: results-entity-tabs`) | 336-341 | **L2** | |
| `{#if activeEntityType}` … `{:else} voter-results-no-nominations-warning` | 344, 374-378 | **L2** — D-08's "cannot be implied ⇒ picker" at this level | |
| `{#if activeMatches}` / `{:else} <Loading/>` | 345, 371-373 | **P3** | |
| Section testid `div` (`voter-results-{candidate,party,alliance}-section`) | 346-353 | **P3** | The E2E fixture's `activeSectionLocator()` depends on exactly one being present |
| `{#key `${activeElectionId}:${activeEntityType}`}` + heading + `EntityListWithControls` | 354-369 | **P3** | The `{#key}` comment explains the filter-state reset — move it whole |

### What breaks, and what does not

| Surface | Verdict | Evidence |
|---|---|---|
| `ROUTE.ResultEntity` / `ResultCandidate` / `ResultParty` | **Unchanged** | leaf path identical — § *D-08 verified* |
| `ROUTE.Results`, `DEFAULT_PARAMS` | **Unchanged** | `route.ts:73,123-127` |
| `buildListRoute` | **Moves file; shape unchanged** | emits `/results{/e}{/plural}${search}` |
| `routeConsistency.test.ts` | **Unchanged** | results appears only as an `isProtectedRoute` negative control (`:379`) |
| `[[…]]/[[id]]/+page.ts` — matcher-fallthrough 404 + coupling 307 | **Unchanged and kept (D-10)** | Same directory. Both guards, both doc-comments, and the "Post-88-02 loop fix" note at `:34` |
| `[[electionTab]]/+layout.ts` — guards 1–4 | **Unchanged** | It sits at L1's directory, which does not move |
| `tests/tests/fixtures/voter/resultsPage.fixture.ts` | **Unchanged if every testid survives.** It reaches the page by `buildRoute({ route: 'Results' })` + testids, never a hand-built URL `[VERIFIED: resultsPage.fixture.ts:67-71]`. The testids it depends on: `voter-results-list`, `voter-results-entity-tabs`, `voter-results-election-select`, `voter-results-{candidate,party,alliance}-section`, `entity-card`, `entity-card-action`, `entity-details` | D-09's non-goal does **not** license breaking it |
| `results/[[electionTab]]/statistics/+page.svelte` | **Behaviour changes** | See Pitfall 1 |
| Drawer-first DOM source order | **Lost unless D-11 lands first** | See Pitfall 2 |
| Visual baselines `voter-results-{desktop,mobile}.png` | **At risk** — any markup nesting change can move them | `[VERIFIED: tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/ holds exactly 4 baselines: candidate-preview-{desktop,mobile}.png, voter-results-{desktop,mobile}.png]`. D-19 governs |

### D-09's cross-type edge — is there an emitter?

D-09 says the `organizations/candidate/{id}` shape is kept **only if a current emitter produces it**. The evidence to decide:

- `buildListRoute` never emits a 4-segment URL; only list shapes `[VERIFIED: +layout.svelte:213-219]`.
- Entity cards link via `getRoute`/`ROUTE.ResultEntity` with `DEFAULT_PARAMS` — `ResultCandidate` forces `entityTab: 'candidates'`, `ResultParty` forces `entityTab: 'organizations'` `[VERIFIED: route.ts:123-127]`, i.e. the matching pair, not the cross pair.
- Both `+page.ts` and the leaf `+page.svelte` doc it as an explicit supported shape: *"`/results/[electionTab]/organizations/candidate/[id]` — edge case: org list + candidate drawer"* `[VERIFIED: .../[[id]]/+page.ts:12]`.

**The live emitter to check at plan time:** alliance/organization cards carrying **subcards** (`entity-card-subcard`) — a member candidate rendered inside an organization list. `resultsPage.fixture.ts:163-166` documents that subcards are independently navigable `[VERIFIED]`. If a subcard's link is built with the parent list's plural and the child's singular, that **is** the cross-type emitter. Derive it at run time from `EntityCard.svelte` / `EntityCardAction`; do not decide from this document.

---

## The drawer host (D-11/D-12/D-13)

### What spike 034 built — verbatim inventory

| File | Lines | What it is |
|---|---|---|
| `lib/spike/drawerHostState.svelte.ts` | 45 | `DrawerPayload` interface (`key`, `title: () => string`, `content: Snippet`, `contexts: Map<unknown,unknown>`, `onDismiss?`, `testId?`), a `DrawerHost` class with `current = $state<DrawerPayload|null>(null)`, `newKey(prefix)`, `open(payload)`, `close(key?)`, and a module singleton `export const drawerHost = new DrawerHost()` |
| `lib/spike/DrawerHost.svelte` | 151 | One `<dialog class="drawer-host">`; `$effect` over `drawerHost.current` wrapped in `untrack`; `showModal()` on first open, content swap on payload change, `visible=false` → `setTimeout(close, ANIMATION_MS)` on dismiss; `{#key shown.key}<ContextBridge contexts={shown.contexts}>{@render shown.content()}</ContextBridge>{/key}`; a floating close `Button`; a `<style>` block with `::backdrop` opacity and `translateY(100%)` panel transitions, both 250 ms, both nulled under `prefers-reduced-motion` |
| `lib/spike/ContextBridge.svelte` | 13 | `for (const [key, value] of contexts) setContext(key, value);` then `{@render children()}` |
| `lib/spike/GlobalEntityDrawer.svelte` | 43 | The opener: `getAllContexts()`, `$state.raw` last-defined entity + `$effect.pre`, `$effect` that opens on mount and `close(key)` on teardown, a `content` snippet rendering `<EntityDetails entity={shownEntity} class="min-h-full" />` |

### What must change to productionise

| Change | Why |
|---|---|
| **Move out of `lib/spike/`** — e.g. `lib/components/modal/drawerHost/` | Criterion 6 / D-20's guard greps for `lib/spike` imports |
| **Delete the `lab` import + 5 `lab.log('dialog', …)` calls** from `DrawerHost.svelte` and the one in `GlobalEntityDrawer.svelte` | de-lab |
| **Replace `const ANIMATION_MS = 250` with a `DELAY` constant, and make the CSS agree** (D-14) | `DELAY = { xs:150, sm:225, md:350, … }`. `Drawer.svelte` flies with `transition:fly={{ y: '100%', duration: DELAY.xs }}` `[VERIFIED: Drawer.svelte:81]`. **Landmine:** the host's JS timer and its CSS `transition: … 250ms` must be the same number. Drive the CSS from a custom property set from the constant (`style:--drawer-ms={DELAY.xs}ms`) so one edit moves both |
| **Skip the out-delay entirely under reduced motion** (D-14) | The host's `<style>` already nulls the transitions under `@media (prefers-reduced-motion: reduce)` `[VERIFIED: DrawerHost.svelte:145-150]`, but the JS still waits `ANIMATION_MS` before `dialog.close()` — so the dialog lingers with no motion. Branch the timeout on `shouldAnimate(undefined)`, the gate the repo already uses (`viewTransition.ts:24-30`) |
| **Wrap the payload in `<svelte:boundary>`** (D-12) | See below |
| **Rename `GlobalEntityDrawer`** — "Global" was a lab word | e.g. `EntityDrawerOpener.svelte`, under `lib/dynamic-components/entityDetails/` |
| **Decide the fate of `EntityDetailsDrawer.svelte` and `QuestionExtendedInfoDrawer.svelte`** | Criterion 5 says the host serves both. Once both openers go through the host, `QuestionExtendedInfoDrawer.svelte` has no caller (its only consumer is `QuestionExtendedInfoButton`'s `{#if showDrawer}` branch `[VERIFIED: QuestionExtendedInfoButton.svelte, diff row]`), and `EntityDetailsDrawer.svelte` likewise. Both are exported from barrels (`lib/components/questions/index.ts` exports `QuestionExtendedInfoDrawer` + its `.type`) — deleting them means editing the barrel |
| **a11y parity with `ModalContainer`** | `ModalContainer` handles Escape with a custom `svelte:document onkeydown` (because the native `dialog` close prevents cleanup) `[VERIFIED: ModalContainer.svelte:88-96,128]`, focuses the first descendant after `DELAY.sm`, and renders a `modal-backdrop` `<button>` carrying `t('common.closeDialog')` for the backdrop click. The host uses `oncancel` + `e.target === dialog` instead and focuses after `ANIMATION_MS` `[VERIFIED: DrawerHost.svelte:48,78-84]`. **Both are defensible; they are not identical.** The a11y-smoke axe project scans results routes with the drawer path exercised — re-run it, and treat any new violation as a defect, not a baseline |

### D-12 — how the two halves fit together

The failure mode, in the spike's own words: *"the host keeps rendering the payload through its 250 ms out-animation — after the opener is destroyed. The snippet read the opener's `entity` prop, which then reads `undefined` … → `EntityDetails` threw `Cannot destructure property 'type' of 'unwrapped.entity'` **mid-flush** → the host's effect never ran, the dialog stayed open."* `[CITED: .planning/spikes/034-global-drawer-host/README.md § Investigation Trail item 2]`

The two halves address different links in that chain:

- **Opener-side `$state.raw` + `$effect.pre` (the convention)** prevents the *throw*. `$effect.pre` is the right phase: it runs **before** the DOM update for the current flush, so `shownEntity` is already the new entity when the host re-renders, and it is never re-assigned to `undefined` because the assignment is guarded (`if (entity) shownEntity = entity;`).
- **`<svelte:boundary>` in the host (the net)** prevents the *hang*. `<svelte:boundary>` is available in Svelte 5.53.12 with attributes `onerror`, `failed`, `pending` `[VERIFIED: node_modules/svelte/src/compiler/phases/2-analyze/visitors/SvelteBoundary.js:6 — "const valid = ['onerror', 'failed', 'pending'];"]`. **No existing use in `apps/frontend/src`** `[VERIFIED: grep -rn 'svelte:boundary' apps/frontend/src → no matches]`, so this is a new pattern for the codebase and deserves a doc-comment.

Sketch of the host's boundary:

```svelte
{#if shown}
  {#key shown.key}
    <svelte:boundary onerror={(error) => { /* log + force-close, never leave the dialog open */ }}>
      <ContextBridge contexts={shown.contexts}>
        {@render shown.content()}
      </ContextBridge>
      {#snippet failed(error, reset)}
        <!-- minimal, non-throwing fallback; the dialog still closes on dismiss -->
      {/snippet}
    </svelte:boundary>
  {/key}
{/if}
```

**Two things to verify at build time, not assume:** (a) `<svelte:boundary>` catches errors raised during *effects and rendering* of its children — it does **not** catch errors in event handlers, so the boundary is not a substitute for the opener convention; (b) the `onerror` handler must not itself throw, or the dialog is back in the hung state. The negative control for D-12 (see § *Negative controls*) is what proves the boundary actually fires, and the injected regression writes itself: revert the opener to `<EntityDetails entity={entity} />` and drive an entity→close.

### D-13's exercisable path — the finding that changes the plan

**The literal reading of D-13 — flip `e2e/base`'s flag — turns the E2E suite red.** Measured:

- `e2e/base` ships the flag **off**: `interactiveInfo: {\n      enabled: false\n    },` `[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:169-171]`
- `e2e/base` already carries an opinion question **with** `info`: `info: { en: '[qu-opin-base-1-info] Hero info content for Likert-5 question 1.' },` `[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:731]`
- The questions layout picks the affordance on exactly that pair: `{#if appSettings.questions.interactiveInfo?.enabled && (info || customData.infoSections?.length)}` → popup button; `{:else if info}` → inline `QuestionBasicInfo` `[VERIFIED: apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:244-257]`
- `voter-journey.spec.ts` **hard-asserts the inline expander on that very question**:
  ```ts
  const infoButton = page.getByTestId(testIds.voter.questions.infoButton);
  await expect(infoButton).toBeVisible({ timeout: TIMEOUTS.element });
  await infoButton.click({ timeout: TIMEOUTS.click });
  await expect.soft(infoButton).toContainText(/\[qu-opin-base-1-info\]/i, …);
  ```
  `[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:662-666]` — `testIds.voter.questions.infoButton` is `'voter-questions-info-button'`, the `QuestionBasicInfo` expander `[VERIFIED: tests/tests/utils/testIds.ts (questions block) — infoButton: 'voter-questions-info-button'; popupInfoButton: 'voter-questions-popup-info-button']`

Flipping the base flag makes that button not render. `toBeVisible` is a hard assertion. **Cardinal failure.**

**What already exists instead.** `packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts` is a dedicated template that ships the flag **on** — `interactiveInfo: {\n              enabled: true\n            }` `[VERIFIED: perm-interactive-info.ts:300-302]` — over questions built for this exact purpose (`[QU-POPUP-INFO] Info body shown as a modal dialog when interactiveInfo is enabled.` `[VERIFIED: perm-interactive-info.ts:160]`). It has its own Playwright projects `data-setup-perm-interactive-info` → `perm-interactive-info` → `data-teardown-perm-interactive-info` `[VERIFIED: tests/playwright.config.ts:1026-1046]`, and `tests/tests/specs/perm/perm-interactive-info.spec.ts` already **opens the popup modal and asserts its body**, in both desktop and a scoped mobile slice `[VERIFIED: perm-interactive-info.spec.ts:7-8,56,115,131]`.

**Three routes for the planner, with their measured costs:**

| Route | Cost | Verdict |
|---|---|---|
| **(a) Discharge D-13 against `perm-interactive-info`** — migrate `QuestionExtendedInfoButton` to the host, and the existing spec exercises it automatically; add explicit open→close-through-the-host assertions there | Zero base-dataset change, zero visual-baseline movement, zero `voter-journey` risk. The template already satisfies D-13's words ("the seed template gains a question with extended info and `questions.interactiveInfo.enabled`" — it has both) | **Recommended.** The blast radius CONTEXT.md warns about evaporates |
| **(b) Flip `e2e/base` and rewrite `voter-journey`'s info assertions to the popup form** | Edits the 136-soft-assertion budget spec `[VERIFIED: tests/playwright.config.ts SOFT_ASSERTION_BUDGETS — 'specs/voter/voter-journey.spec.ts': 136]`, its mobile sibling, and re-runs a11y-smoke + both visual baselines. This is what CONTEXT's "widest blast radius" describes | Do only if the operator wants the popup mode to be the base posture, which no decision says |
| **(c) Add a *new* info-carrying question to `e2e/base` and leave the flag off** | Satisfies neither half — with the flag off the popup never renders, so the host path stays unexercised, which is exactly spike 034's `PARTIAL` | Rejected |

**If (a) is taken, record it explicitly** as "D-13 discharged against the existing `perm-interactive-info` template rather than `e2e/base`, because flipping `e2e/base` was measured to break `voter-journey.spec.ts:662-666`". That is a scoping refinement within D-13's words, not a decision reopening — but it contradicts CONTEXT.md's § *Integration Points* line ("`packages/dev-seed` + the `e2e/base` template — D-13's seed change lands here"), so it must be written down.

**One more thing D-13 needs regardless of route:** `QuestionExtendedInfoButton.svelte` on the spike branch opens the host with `testId: 'voter-questions-popup-info-modal'` on the **dialog**, while the payload content carries `data-testid="voter-questions-popup-info-modal-content"` `[VERIFIED: git diff row for QuestionExtendedInfoButton.svelte]`. Today's non-host path puts `voter-questions-popup-info-modal` on the `QuestionExtendedInfo` **body** inside the drawer `[VERIFIED: QuestionExtendedInfoDrawer.svelte:41]`, which is what `questionInfo.fixture.ts` reads. **The testid moves from the body to the dialog.** Either keep it on the body in the host payload, or update the fixture — and the fixture is consumed by `perm-interactive-info.spec.ts`, so getting this wrong is a red suite.

---

## D-04's rebuilt control

`layout.tracking.test.ts` is 84 lines. Its instrument — `recordingUrl(href)` — returns `{ url, trackedReads, untrack }` where `url` is a `Proxy` whose `get` trap pushes the property name into `trackedReads` unless a counter says it is inside the supplied `untrack` `[VERIFIED: apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts:22-46]`. D-04 keeps that verbatim.

**The control to remove** (lines 68-83):

```ts
// SPIKE results-redraw control: the pre-032 tracked read must be caught by the assertion above.
it('detects the pre-032 tracked path read (control)', async () => {
  const { lab } = await import('$lib/spike/redrawLab.svelte');
  lab.loader = 'current';
  try { … expect(trackedReads).toEqual(expect.arrayContaining(['pathname'])); }
  finally { lab.loader = 'fixed'; }
});
```

**The control to write.** It must (1) use the same `recordingUrl` Proxy, (2) contain the known-bad read locally, (3) assert `pathname` **is** recorded, and (4) cite spike 031 for the named limit. Shape:

```ts
/**
 * Negative control (D-04): the assertion above is only meaningful if the Proxy can catch a tracked read.
 *
 * The subject is a LOCAL load-shaped function reproducing the pre-032 body — `url.pathname` read OUTSIDE
 * `untrack`, which is what `(located)/+layout.ts` did before spike 032. No production code needs to be bad
 * for this to hold.
 *
 * NAMED LIMIT: this proves the INSTRUMENT works. It does not prove the real load was ever wrong. The record
 * of that is `.planning/spikes/031-results-nav-flicker-forensics/README.md` § Investigation Trail item 2 —
 * "(located)/+layout.ts deliberately untracks parseParams … then reads url.pathname / url.search *tracked*
 * two lines later for the `next=` redirect target."
 */
it('the recording Proxy catches a tracked url.pathname read (negative control)', () => {
  // The pre-032 shape, reproduced locally and nowhere else.
  function legacyNextTarget(url: URL, untrack: <T>(fn: () => T) => T): string {
    let electionId: unknown;
    untrack(() => ({ electionId } = parseParamsStub(url)));   // the reads that WERE untracked
    const isVoterRoute = /^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/.test(url.pathname); // TRACKED — the bug
    return isVoterRoute ? `next=${encodeURIComponent(url.pathname + url.search)}` : '';
  }

  const { url, trackedReads, untrack } = recordingUrl('http://localhost/results/el-1?electionId=el-1');
  legacyNextTarget(url, untrack);
  expect(
    trackedReads,
    'the Proxy failed to record a tracked url.pathname read, so the four assertions above prove nothing'
  ).toEqual(expect.arrayContaining(['pathname']));
});
```

Three details that matter:

1. **No import of the real `load`** in the control. Importing it would make the control depend on the production body, which is the "checked-in legacy copy" D-04 rejects.
2. `parseParamsStub` can be nothing at all — the control does not need the untracked half to be realistic; it needs the **tracked** read present and the untracked region exercised so `untracked` counter behaviour is also covered. A single `untrack(() => url.searchParams.get('electionId'))` is enough, and it additionally proves the counter suppresses.
3. The four positive cases (lines 49-66) stay exactly as they are; only this block is replaced. `layout.load.test.ts` (the empty-selection guard) is a separate, untouched file `[VERIFIED: both files exist in `(located)/`]`.

**D-05's companion test** (the `isOverlayNavigation` contract) has no home yet. Recommended: `apps/frontend/src/lib/utils/viewTransition.test.ts`, table-driven over the four combinations:

| from.params | to.params | expected |
|---|---|---|
| `{entity:'candidate', id:'c-1'}` | `{}` | `true` (close) |
| `{}` | `{entity:'candidate', id:'c-1'}` | `true` (open) |
| `{entity:'candidate'}` | `{}` | `false` (id absent — the 307 shape) |
| `{}` | `{id:'c-1'}` | `false` (entity absent — the fallthrough shape) |
| `null` | `null` | `false` |

plus the comment D-05 requires, naming the assumption that the results drawer is the only routed overlay.

---

## Negative controls (D-17) — four pairs, concretely

Format: `165-NEGATIVE-CONTROL.md`, following `.planning/phases/164-.../164-NEGATIVE-CONTROL.md` `[VERIFIED: read this session]`. Its six-step discipline is the one to reproduce verbatim:

> 1. `git hash-object <file>` captured **before** the file is touched. 2. The mutation applied. 3. The instrument run, **its exit code read directly from `$?` on the command itself — never through a pipe**. 4. Exit code and **verbatim output** recorded in a fenced block. Never a description of the output. 5. The mutation reverted with `git checkout -- <specific file>` — never `git clean`, never a blanket `git checkout -- .`. 6. The revert proven **three ways**: `git diff --exit-code` returns 0, `git hash-object` equals the pre-captured value, and `git status --porcelain apps packages scripts` is empty.
> `[VERIFIED: .planning/phases/164-returns-table-nullability-audit-single-override-mechanism/164-NEGATIVE-CONTROL.md § 3]`

The document also carries § *Environment* (date, repo root, git HEAD + branch, OS, Node, Yarn, TypeScript, migrations applied) and § *Anchor drift measured before anything was cited*. Both are expected.

| Pair | Injected regression (the realistic one) | Instrument | Expected verdict | Notes |
|---|---|---|---|---|
| **NC-1 loader untrack** | In `(located)/+layout.ts`, move the `pathname`/`search` read **out** of `untrack`: `const { pathname, search } = { pathname: url.pathname, search: url.search };` | `npx vitest run "src/routes/(voters)/(located)/layout.tracking.test.ts"` from `apps/frontend` | **RED** — the four positive cases fail on `trackedReads` containing `pathname` (and `search`) | The paired *blind* run D-17 wants: run the same mutation against the **pre-165** test file (which had no such assertion) and record the green. If the file is new on this branch, the honest pairing is "no instrument existed" — say so |
| **NC-2 overlay-VT skip** | In `routes/+layout.svelte`'s `onNavigate`, delete the `if (isOverlayNavigation(…)) return;` line | The committed D-16 Playwright spec, project-scoped: `npx playwright test -c ./tests/playwright.config.ts --project=<new-project>` | **RED** — `window.__vtCalls` gains an entry whose `dialogOpen` is true or whose navigation carries `entity`+`id` | Needs a dev server + seeded DB. Budget for it |
| **NC-3 name-strip** | In `routes/+layout.svelte`'s `<style>`, drop the `!important` from `:global(html.vt-no-names *) { view-transition-name: none !important; }` — **not** delete the rule. The `!important` is the load-bearing token (§ Pitfall 3) | Same spec | **RED** — the recorded `names[]` for the drawer-tab-switch VT is non-empty (`results-entity-tabs`, `results-election-select` come back, because they are **inline** `style=` attributes) | This is a far better injection than deleting the rule: deleting it is obvious, dropping `!important` is the mistake a real editor makes |
| **NC-4 `noScroll`** | In the new L2 layout's `handleEntityTabChange`, drop `{ noScroll: true }` from one `goto` | Same spec, the scroll-survival case | **RED** — scrollY after the tab switch is 0 where the baseline was the scrolled value | Pair with the **blind** run: the pre-165 suite has no scroll assertion at all, so the same mutation is green there. Record that green — it is what makes the red mean something |

**Cost note:** NC-2/3/4 each need `yarn db:start` + a seeded DB + one fresh dev server on the preflight-approved port, and the four cycles are revert-measure-restore. Sequence them into a single plan so the server is started once.

**What does not substitute** (D-17 says so, and the evidence agrees): spike 032's `legacy` vs `hardened` `forensics.mjs` run was taken on the spike tree with the lab present. Different tree, different instrument.

---

## D-16 — the committed Playwright spec

### Where it lands

`tests/tests/specs/voter/voter-results-redraw.spec.ts` (name at planner discretion), with a **new project** in `tests/playwright.config.ts` following the leaf-project shape:

```ts
// voter-results-redraw — LEAF. Read-only navigation-behaviour regression on the base dataset:
// scroll survival across open/close/tab-switch from a scrolled start, and the two View-Transition
// invariants. `testMatch` is scoped to this spec; sibling voter-* projects' exact testMatch excludes it.
{
  name: 'voter-results-redraw',
  testDir: './tests/specs/voter',
  testMatch: /voter-results-redraw\.spec\.ts/,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-base']
}
```
modelled on `voter-alliance` / `voter-nominations` `[VERIFIED: tests/playwright.config.ts:414-430]`. **A spec with no project matches no command** — the config's own orphan guard exists because that happened to six probe tests `[VERIFIED: tests/playwright.config.ts:28-30]`. The default suite is `playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe` `[VERIFIED: root package.json "test:e2e"]`, so a new non-`@probe` project is picked up automatically.

### (b) + (c) — observing View Transitions with zero production instrumentation

Wrap `document.startViewTransition` in an init script, exactly as `trackingIntercept.fixture.ts` wraps `window.umami.track`:

```ts
await page.addInitScript(() => {
  (window as any).__vtCalls = [];
  const native = (document as any).startViewTransition?.bind(document);
  (window as any).__vtSupported = typeof native === 'function';
  if (!native) return;
  (document as any).startViewTransition = (cb: () => unknown) => {
    const names: string[] = [];
    for (const el of document.body.querySelectorAll('*')) {
      const n = getComputedStyle(el).viewTransitionName;
      if (n && n !== 'none') names.push(n);
    }
    (window as any).__vtCalls.push({
      url: location.pathname,
      dialogOpen: !!document.querySelector('dialog[open]'),
      noNames: document.documentElement.classList.contains('vt-no-names'),
      names
    });
    return native(cb);
  };
});
```

Three correctness points, each derived from the production code:

1. **Capture happens *inside* the wrapper, i.e. after the class is applied.** `startViewTransition` adds `VT_NO_NAMES_CLASS` to `<html>` **before** calling `document.startViewTransition` `[VERIFIED: viewTransition.ts:62-65 — "if (stripNames) root.classList.add(VT_NO_NAMES_CLASS);" then "const transition = document.startViewTransition(updateCallback);"]`. So by the time the wrapper runs, `getComputedStyle(el).viewTransitionName` already reflects the stripped state. That is what makes `names[]` the right observable — the same technique the lab's own `namedElements()` uses `[VERIFIED: redrawLab.svelte.ts:211-219]`.
2. **`html.vt-no-names *` selects descendants only**, so `<html>`'s own UA-assigned `root` group survives — correct, and the assertion must be "no *named* groups", not "no groups".
3. The init script must be installed **before** navigation; `addInitScript` runs in every document the context creates, before any app script `[VERIFIED: trackingIntercept.fixture.ts:64 doc-comment]`.

**Assertions:**
- overlay open and overlay close ⇒ **no new `__vtCalls` entry at all** (criterion 3 first half; `isOverlayNavigation` returns before `startViewTransition` is reached).
- any entry with `dialogOpen === true` ⇒ `names.length === 0` **and** `noNames === true` (criterion 3 second half; the drawer-tab switch is the case that produces one).

### (a) — scroll survival from a scrolled start

**The pitfall that already bit the spike:** *"at scrollY 0 hardened 'scrolled to 566' on open — Playwright scrolls an off-screen card into view before clicking (log: `scrollY 0 → 566` *before* the `nav` line)."* `[CITED: .planning/spikes/032-results-redraw-hardened-fixes/README.md § Investigation Trail item 5]`

So the baseline must be read **after** the target is in view and **immediately before** the click:

```ts
await page.mouse.wheel(0, 700);                      // or scrollTo — get to a scrolled start
const action = card.getByTestId('entity-card-action').first();
await action.scrollIntoViewIfNeeded();               // do Playwright's auto-scroll explicitly
const before = await page.evaluate(() => window.scrollY);
expect(before, 'the scrolled start collapsed — the assertion would be vacuous at 0').toBeGreaterThan(0);
await action.click();
await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeVisible();
expect(await page.evaluate(() => window.scrollY)).toBe(before);
```

The `before > 0` guard is what stops the test passing vacuously from the top of the page — the same non-vacuity discipline `routeConsistency.test.ts` builds its whole "the walk is not vacuous" describe block around `[VERIFIED: routeConsistency.test.ts:288-315]`.

Repeat for close (`Escape` or the close button) and for the entity-tab switch (`resultsPage.selectEntityTab('orgs')`).

### D-18 — node identity

```ts
const listHandle = await page.getByTestId(testIds.voter.results.list).elementHandle();
await resultsPage.selectEntityTab('orgs');
const stillThere = await page.evaluate((el) => document.contains(el), listHandle);
expect(stillThere, 'the results list node was replaced — the subtree remounted').toBe(true);
```

⚠ **choose the node carefully.** `voter-results-list` is on `EntityListWithControls`, which is **deliberately** remounted by `{#key `${activeElectionId}:${activeEntityType}`}` on an entity-tab switch `[VERIFIED: .../results/[[electionTab]]/+layout.svelte:354-369 — the `{#key}` comment: "keep — a scope-tuple change discards per-scope filter UI state"]`. So for the tab-switch case the node to tag is one **above** the key — `voter-results-list-container`, `voter-results-ingress` or `voter-results-entity-tabs`. For the entity open/close case, `voter-results-list` is the right node (nothing keys on entity/id). Getting this backwards produces a test that fails for a correct reason and gets "fixed" by weakening it.

### Skip, not fail

D-16 requires a skip under reduced motion or an unsupported browser. Derive both **in the page**, not from the runner:

```ts
test.beforeEach(async ({ page }) => {
  const { vtSupported, reduced } = await page.evaluate(() => ({
    vtSupported: !!(window as any).__vtSupported,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches
  }));
  test.skip(!vtSupported, 'document.startViewTransition unavailable in this browser');
  test.skip(reduced, 'prefers-reduced-motion: reduce — shouldAnimate short-circuits, so there is no VT to observe');
});
```

**Why in-page:** the repo carries two contradictory claims about whether `page.emulateMedia({ reducedMotion })` reaches the app's `matchMedia` — `voter-journey.fixture.ts:282` says *"the Playwright option does not reach the app's matchMedia anyway"*, while `eperm07-term-trigger.spec.ts:63,143` uses `await page.emulateMedia({ reducedMotion: 'reduce' })` as a deliberate discriminator against `viewTransition.ts:28` `[VERIFIED: both read this session]`. Evaluating the media query in the page is true either way. **The scroll assertions need no skip** — they hold with or without motion, so split the file into two describes and skip only the VT one.

### Matching the existing fixtures

`tests/tests/fixtures/voter/resultsPage.fixture.ts` is the surface to compose through, and it already provides everything the spec needs: `goToPage`, `selectEntityTab`, `getEntityCard`, `openEntityDetailsForCard`, `dismissAllDialogs` `[VERIFIED: read in full this session]`. Its **rigidity contract** binds any addition: *"NO `expect.soft` in any helper. NO `try/catch` wrapping `expect(...)`. NO best-effort `.catch(() => null)` on assertion-bearing locator interactions"* and *"every method that targets a specific entity / tab takes a `RegExp | string | ((count: number) => number)` from the caller. NO hardcoded base-specific strings"* `[VERIFIED: resultsPage.fixture.ts:6-12]`. If the spec needs a new helper (a scroll reader, a VT-log reader), it belongs in a **new** fixture file composed in `views.ts`, not bolted onto `resultsPage`.

---

## D-20's standing assertion

D-20 wants a unit test grepping `apps/frontend/src` for `lib/spike` imports and for a `results-layered` route directory, expecting zero.

**Home:** `apps/frontend/src/lib/_guards/spike-scaffolding.test.ts`. That directory already holds four filesystem/ESLint-driven guards `[VERIFIED: ls apps/frontend/src/lib/_guards → eslint-adapter-boundary-guard.test.ts, eslint-adapter-singleton-guard.test.ts, eslint-parse-posture-guard.test.ts, eslint-store-guard.test.ts]`, and `lib/routes/routeConsistency.test.ts` is the precedent for a vitest spec that walks `src/routes` from disk.

**Non-vacuity is the hard part**, and `routeConsistency.test.ts` shows the house answer: every filesystem-walking guard in this repo carries a "the walk is not vacuous" block asserting the walk found *something* before asserting it found *nothing bad* `[VERIFIED: routeConsistency.test.ts:288-315]`. Reproduce it:

```ts
// 1. non-vacuity: the scan reached real source
expect(scannedFiles.length, 'the scan found no .ts/.svelte under src — every assertion below is vacuous')
  .toBeGreaterThan(1000);
// 2. the invariant
expect(filesImportingSpike).toEqual([]);
expect(fs.existsSync(path.join(ROUTES, '(voters)/(located)/results-layered'))).toBe(false);
```

Measured today for the non-vacuity floor: `apps/frontend/src` carries **30** `SPIKE` marker lines and **15** files importing `lib/spike` — after the phase both must be 0, and the file count the scan walks should be asserted against a floor derived at write time, not a literal copied from here.

**Also grep for the marker text `SPIKE`**, not just the import: five of the fourteen production marker lines are comments with no accompanying import (`Tabs.svelte`'s label argument leaves none at all). A guard that only checks imports passes with the comments still in the tree, and criterion 6 says "no `// SPIKE` call sites" in terms.

---

## Common Pitfalls

### Pitfall 1: `results/[[electionTab]]/statistics` is currently swallowed, and the split un-swallows it

**What goes wrong:** `ROUTE.Statistics` is `` `${VOTER_LOCATED}/results/[[electionTab]]/statistics` `` `[VERIFIED: route.ts:74]`, and the compiled manifest gives it layout chain `[2,3,5]` — the **same chain as the results leaf**, i.e. it is wrapped by `results/[[electionTab]]/+layout.svelte` `[VERIFIED: .svelte-kit/generated/client/app.js:111]`. That layout renames its `children` prop to `_children` and **never renders it**: *"reason: child routes render via URL-driven Drawer state inside this layout, not via `{@render children()}`. Renamed to `_children` to satisfy unused-vars while preserving SvelteKit prop contract."* `[VERIFIED: .../results/[[electionTab]]/+layout.svelte:54-55]`.

So `/results/{election}/statistics` today renders the **results page**, not the statistics page. There is no test on it and no link to it — the only references anywhere are `route.ts:74` and the file itself `[VERIFIED: grep across apps/frontend/src and tests]`.

**Why it happens:** the statistics page predates the layout-owns-everything shape and was never re-homed.

**How to avoid:** the D-08 split necessarily makes L1 render `{@render children()}`, which means statistics starts rendering — **nested inside the results hero, ingress and election picker**. Three dispositions, all legitimate; the plan must pick one explicitly:
- move `statistics/` out from under `[[electionTab]]/` (e.g. to `results/statistics/`) and update `ROUTE.Statistics`;
- give it a `+layout@.svelte` reset so it breaks out of the results chrome;
- accept the nesting and record it.

**Warning signs:** `/results/{e}/statistics` renders two `<h1>`s, or a visual/a11y run flags a heading-order violation on a route nothing was watching.

### Pitfall 2: drawer-first source order vs. "the innermost page renders the drawer"

**What goes wrong:** today's layout renders the drawer **before** `MainContent` deliberately: *"Rendered before MainContent so that on a cold deeplink the drawer paints before the list container below it (the list carries `content-visibility: auto` so the browser defers its layout/paint until in view)."* `[VERIFIED: .../results/[[electionTab]]/+layout.svelte:268-271]`, with the matching note on the list container at `:326-328`. Under D-08 the drawer is owned by the innermost page, which renders **inside** `MainContent`'s `fullWidth` snippet — i.e. *after* the list container. The cold-deeplink paint order inverts.

**Why it happens:** D-08 assigns list **and** drawer to the same innermost page, and the list is necessarily inside `MainContent`.

**How to avoid:** land **D-11's root-level host first**. Once the `<dialog>` lives in `routes/+layout.svelte` and the leaf page mounts only a render-nothing opener, the results tree's source order is irrelevant — `showModal()` puts the dialog in the top layer regardless. This makes the sequencing *host → split*, not *split → host*. If for any reason the split lands first, the drawer-first block must stay at L1 (reading `page.params.entity`/`id` there) and only move to the leaf when the host arrives — two moves instead of one.

**Warning signs:** a cold `/results/{e}/{plural}/{entity}/{id}` deeplink shows the list flash before the drawer.

### Pitfall 3: the `!important` in the name-strip rule is load-bearing

**What goes wrong:** removing `!important` from `:global(html.vt-no-names *) { view-transition-name: none !important; }` silently restores the bug for the two named elements that matter. Both are set as **inline style attributes** — `style="view-transition-name: results-election-select"` and `style="view-transition-name: results-entity-tabs"` `[VERIFIED: .../results/[[electionTab]]/+layout.svelte:315,340]` — and an inline declaration beats any stylesheet rule unless the rule is `!important`.

**How to avoid:** keep it, and make NC-3's injection *drop the `!important`* rather than delete the rule (see § Negative controls). Also keep the existing landmine comment about `@media` wrapping `:global` and never the reverse `[VERIFIED: routes/+layout.svelte <style> block]` — D-06 requires both comments to stay readable together.

### Pitfall 4: `svelte-kit sync` does not regenerate the client manifest

**What goes wrong:** I ran `svelte-kit sync` after adding two layout files; `.svelte-kit/types/**` regenerated (new `$types.d.ts` directories appeared, `tsconfig.json` mtime moved) but `.svelte-kit/generated/client/app.js` did **not** `[VERIFIED: measured this session — app.js mtime unchanged at "21 syyskuuta 21:52" across three sync invocations, while .svelte-kit/tsconfig.json moved to today]`. An executor who checks the manifest after adding a route will conclude SvelteKit rejected the file.

**How to avoid:** verify new route files through `.svelte-kit/types/src/routes/**/$types.d.ts` (which `sync` does write) or by starting the dev server / running the build. Do not treat a stale `app.js` as evidence.

### Pitfall 5: `untrack` may become an unused import after the `keepReady` deletion

**What goes wrong:** `(located)/+layout.svelte` gained `untrack(() => ready)` for the lab's `wasReady` read. Deleting the `keepReady` path per D-03 may leave `import { untrack } from 'svelte'` unused → `lint:check` red.

**How to avoid:** after each de-labbing row, run `yarn workspace @openvaa/frontend check` (svelte-check `--fail-on-warnings`) and `yarn lint:check` — **and read the exit status directly, never through a pipe**. The project memory records two commits of hidden lint violations caused by piping `lint:check` through `grep`.

### Pitfall 6: cold direct entry to `/results` may kill the dev server

**What goes wrong:** `.planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md` records that a cold navigation to `/results` with no session has exited the Vite process with `Error: Cannot use cookies.set(...) after the response has been generated` — an uncaught rejection, not a logged error. **This phase drives cold direct entry to `/results` constantly** (D-16, D-17, D-18 all do).

**How to avoid:** recognise it as the known defect, **not** as something the phase broke. It was last measured 2026-08-24 at HEAD `e74ae377e` and is **unverified on this tree** — re-measure before either assuming it is live or assuming it is fixed. The cause is `lib/supabase/server.ts` / `hooks.server.ts`, out of scope per the phase boundary.

### Pitfall 7: `{#key}` remount is intended, and will be mistaken for the bug

`EntityListWithControls` is keyed on `` `${activeElectionId}:${activeEntityType}` `` **on purpose** — the comment says so: *"keep — a scope-tuple change discards per-scope filter UI state; without remount, EntityListWithControls would carry filter selections from one election:entityType context into the next."* `[VERIFIED: .../results/[[electionTab]]/+layout.svelte:354]`. A D-18 node-identity assertion aimed at `voter-results-list` across a **tab switch** will fail correctly. Aim above the key. See § *D-18 — node identity*.

---

## Code Examples

### The de-labbed loader (RNAV-01's entire production change)

```ts
// apps/frontend/src/routes/(voters)/(located)/+layout.ts
export async function load({ data, fetch, parent, untrack, url }) {
  let electionId: …, constituencyId: …;
  untrack(() => ({ electionId, constituencyId } = parseParams({ url })));

  // reason: voter-app routes allowlist for ?next= deferred target — prevents open-redirect attacks. …
  // The path + search are read untracked too: they only feed the `next=` redirect target. Read tracked, they
  // defeat the untrack above — every results tab / drawer navigation reruns this load, re-streams the question
  // + nomination data and blanks the whole subtree via +layout.svelte's `ready` flag (remount, scroll clamped
  // to 0, intro redraw; spike 031). Guarded by `layout.tracking.test.ts`.
  const { pathname, search } = untrack(() => ({ pathname: url.pathname, search: url.search }));
  const isVoterRoute = /^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/.test(pathname);
  const nextKv = isVoterRoute ? `next=${encodeURIComponent(pathname + search)}` : '';
  …
}
```
`[VERIFIED: derived from apps/frontend/src/routes/(voters)/(located)/+layout.ts as it stands, with the `fixLoader` ternary collapsed to its `true` branch]`

**Note** the doc-comment's own claim — "Guarded by `layout.load.test.ts`" — names the **wrong file**. The guard is `layout.tracking.test.ts`; `layout.load.test.ts` is the empty-selection guard. Fix the reference while de-labbing.

### The de-labbed VT wrapper

```ts
export function startViewTransition(updateCallback: () => void | Promise<void>): ViewTransition | undefined {
  if (typeof document === 'undefined') return undefined;
  if (!('startViewTransition' in document)) return undefined;
  const root = document.documentElement;
  const stripNames = !!document.querySelector('dialog[open]');
  if (stripNames) root.classList.add(VT_NO_NAMES_CLASS);
  const transition = document.startViewTransition(updateCallback);
  transition.finished.finally(() => root.classList.remove(VT_NO_NAMES_CLASS));
  return transition;
}
```
`[VERIFIED: derived from apps/frontend/src/lib/utils/viewTransition.ts:53-71 with the lab branch and both log calls removed, and the two lab-only parameters dropped]`

### The de-labbed `onNavigate` gate

```ts
onNavigate((navigation) => {
  submitAllEvents(); // preserve existing analytics flush
  // LANDMINE: read `navigation.to?.url` — NOT `page.url`, which is the SOURCE url during onNavigate.
  if (!shouldAnimate(navigation.to?.url)) return;
  // Opening / closing a modal overlay (the results entity drawer) gets no document VT: named groups would be
  // painted above the top-layer dialog. The overlay's own motion is the transition. See `$lib/utils/viewTransition`.
  if (isOverlayNavigation(navigation.from, navigation.to)) return;
  return new Promise<void>((resolve) => {
    startViewTransition(async () => {
      resolve();                 // tells SvelteKit to apply the new DOM
      await navigation.complete; // SvelteKit swaps the DOM here
    });
  });
});
```
`[VERIFIED: derived from apps/frontend/src/routes/+layout.svelte:155-181 with the four lab lines removed]`

---

## State of the Art

| Old approach | Current approach | When changed | Impact |
|---|---|---|---|
| "The results layout persists across tab swaps" (spike 013) | **False since the tracked `url.pathname` read landed.** The baseline ledger shows destroy→mount of `ResultsLayout` / `MainContent` / `EntityListWithControls` on *every* results navigation | Regressed silently between spike 013 and spike 031 | The whole premise of criteria 1–3. `[CITED: .planning/spikes/031-.../README.md § Surprises]` |
| "The flicker comes from the route shape / where the drawer is mounted" | **Invalidated.** 031 attributes every symptom to the load rerun and to document VTs over the top layer; 033 measured the restructured tree as behaviour-*equivalent* | spikes 031 / 033 | Criteria 4 and 5 are organisational, and the phase says so in terms |
| `keepReady` stale-while-revalidate as the fix | **Rejected** — "a fallback, not the fix"; the list still churns 170–260 nodes per navigation because the data is re-provided | spike 031 item 4 | D-03 deletes it |
| Per-route `<Drawer>` with no out-animation | Root `DrawerHost` with an animated close and A→B content swap | spike 034 | D-11. The per-route drawer *cannot* animate out: `ModalContainer.handleClose` calls `dialog.close()` synchronously and the parent `{#if}` then removes the node, so `transition:fly` never plays `[VERIFIED: ModalContainer.svelte:98-103; Drawer.svelte:81]` |
| Hand-rolled `ViewTransition` interface | Built-in `lib.dom.d.ts` type (TS 5.9.3) | pre-existing | Keep — the module doc says so, and CLAUDE.md bans `any` |

**Deprecated / outdated after this phase:**
- `lib/spike/**` — deleted (criterion 6).
- `results-layered/**` — deleted (criterion 6).
- `EntityDetailsDrawer.svelte` and `QuestionExtendedInfoDrawer.svelte` — superseded by the host if criterion 5 is taken literally. Check their barrel exports before deleting.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | `<svelte:boundary>` catches a throw raised during the render flush of `{@render shown.content()}`, which is where spike 034's crash occurred | D-12 | D-12's net does not net. **Mitigation:** D-12's negative control (revert the opener to a bare prop read, drive a close) *is* the falsification — if the boundary does not fire, that control is green and the plan learns it at build time, not at review |
| A2 | Adding `{@render children()}` to L1 makes `results/[[electionTab]]/statistics` render nested inside the results chrome | Pitfall 1 | Only that the disposition question is framed slightly differently. Verified structurally (shared layout chain `[2,3,5]`); not observed in a browser this session |
| A3 | The `toUrl` / `label` parameters on `startViewTransition` have no consumer outside the lab | De-lab row 1 | Dead API survives. Cheap to check: `grep -rn 'startViewTransition(' apps/frontend/src` returns exactly the two call sites (root layout, `Tabs.svelte`) — both shown above |
| A4 | Moving `voter-questions-popup-info-modal` from the info **body** to the host **dialog** breaks `questionInfo.fixture.ts`'s popup reader | D-13 | A red `perm-interactive-info` run. The fixture reads `popupInfoModal` `[VERIFIED: testIds.ts and questionInfo.fixture.ts:79-81]`; whether it asserts on the dialog or the body was not traced line-by-line |
| A5 | The a11y-smoke axe project covers a results route with the drawer open | Drawer host, a11y parity | A new a11y violation ships unobserved. `AXE_ROUTES` is a declared table `[VERIFIED: a11y-smoke.spec.ts:74]`; its entries were not enumerated this session |
| A6 | The alliance/organization subcard link is the live emitter of the cross-type `organizations/candidate/{id}` URL | D-09 | D-09's "drop it if no emitter" is decided on the wrong evidence. Derive from `EntityCard.svelte` / `EntityCardAction` at plan time |
| A7 | `DELAY.xs` (150 ms) is the right close duration for the host (`Drawer.svelte`'s fly uses it; the spike used 250 ms) | D-14 | Cosmetic only — the constraint that matters is JS timer == CSS duration |

---

## Open Questions

1. **What happens to `results/[[electionTab]]/statistics`?**
   - *Known:* it is currently unrendered, unlinked and untested; the split changes that.
   - *Unclear:* whether the operator wants it re-homed, reset out of the layout, or nested.
   - *Recommendation:* plan a task to move it to `results/statistics/` with `ROUTE.Statistics` updated in the same commit, and record the pre-existing swallow as a finding. It is a one-file move and it removes a latent surprise rather than carrying it into the new tree.

2. **Does D-13 land on `e2e/base` or on `perm-interactive-info`?**
   - *Known:* flipping `e2e/base` breaks `voter-journey.spec.ts:662-666` (measured). `perm-interactive-info` already carries the flag and an exercising spec.
   - *Unclear:* whether "the seed template" in D-13 was meant as `e2e/base` specifically.
   - *Recommendation:* take the `perm-interactive-info` route, record the divergence from CONTEXT's § Integration Points line, and surface it at plan review rather than deciding silently.

3. **Does `EntityDetailsDrawer` / `QuestionExtendedInfoDrawer` get deleted or kept?**
   - *Known:* criterion 5 collapses both into the host; both become callerless.
   - *Unclear:* whether anything outside the voter results / questions flows uses them (both are barrel-exported).
   - *Recommendation:* grep at plan time; if callerless, delete with the barrel entries, since a dead second drawer implementation is exactly the rot criterion 6 exists to prevent.

4. **Is the cold-`/results` dev-server crash live on this tree?**
   - *Recommendation:* measure it in the first plan that needs a dev server, and record the result in the phase's evidence doc either way. Three decisions depend on driving that path repeatedly.

5. **How many plans, and which carries which negative-control pair?**
   - Planner discretion (CONTEXT says so). The constraint from research: NC-2/3/4 all need one dev server + one seeded DB, so they belong in **one** plan, run back to back.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | everything | ✓ | v24.14.1 | — |
| Yarn | everything | ✓ | 4.13.0 | — |
| `@sveltejs/kit` | route probe, build | ✓ | 2.55.0 | — |
| `svelte` | `<svelte:boundary>` (D-12) | ✓ | 5.53.12 | — |
| Playwright | D-16 spec, D-17 NC-2/3/4, D-19 visual | ✓ | 1.58.2 | — |
| Docker daemon | local Supabase, D-19 baseline container | ✓ (`docker info` exit 0) | images 14.4 GB / build cache 3.06 GB reclaimable | — |
| Host disk | D-19 | ✓ | 246 GiB free on `/` | — |
| Supabase local stack | every E2E run | not probed this session | — | `yarn db:start` |
| `mcr.microsoft.com/playwright:v1.58.2-noble` (linux/amd64) | D-19 baseline capture | not probed | — | **No fallback** — D-19 forbids capturing on a developer Mac |

**Missing dependencies with no fallback:** none blocking. **But:** D-19's ENOSPC precondition is about space *inside* `Docker.raw`, not on the host — the host has 246 GiB free while the project memory records the VM filling. Re-measure inside the container (`docker run --rm … df -h`) before the final visual gate, not from the host figure above.

---

## Validation Architecture

`workflow.nyquist_validation` is **absent** from `.planning/config.json` `[VERIFIED: read this session — the `workflow` object holds only `research`, `plan_check`, `verifier`, `_auto_chain_active`, `use_worktrees`]`, so it is treated as enabled.

### Test Framework

| Property | Value |
|---|---|
| Unit framework | Vitest 3 (`environment: 'jsdom'`) `[VERIFIED: apps/frontend/vitest.config.ts:57]` |
| Unit config file | `apps/frontend/vitest.config.ts` |
| E2E framework | `@playwright/test` 1.58.2 |
| E2E config file | `tests/playwright.config.ts` |
| Quick run (unit, one file) | `cd apps/frontend && npx vitest run "src/routes/(voters)/(located)/layout.tracking.test.ts"` |
| Quick run (unit, frontend) | `yarn workspace @openvaa/frontend test:unit` |
| Full unit suite | `yarn test:unit` (= `yarn assert:unit-coverage && turbo run test:unit`) |
| Type gate | `yarn workspace @openvaa/frontend check` (`svelte-kit sync && svelte-check --fail-on-warnings`) |
| Lint gate | `yarn lint:check` (turbo lint + tests eslint + typecheck + 15 `assert:*` scripts) |
| Full E2E suite | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` (preferred), or `yarn test:e2e` against a self-started, correctly-scoped server |
| Single E2E project | `npx playwright test -c ./tests/playwright.config.ts --project=<name>` |

### Phase Requirements → Test Map

| Req | Behaviour | Test type | Automated command | File exists? |
|---|---|---|---|---|
| RNAV-01 | `(located)` load reads no URL property tracked | unit | `npx vitest run "src/routes/(voters)/(located)/layout.tracking.test.ts"` | ✅ (control replaced — D-04) |
| RNAV-01 | The recording Proxy catches a tracked read (negative control) | unit | same file | ❌ Wave 0 — new `it` block |
| RNAV-02 | Scroll survives open / close / entity-tab switch from a scrolled start | e2e | `npx playwright test -c ./tests/playwright.config.ts --project=voter-results-redraw` | ❌ Wave 0 — new spec + new project |
| RNAV-03 | `isOverlayNavigation` contract (4 param combinations) | unit | `npx vitest run "src/lib/utils/viewTransition.test.ts"` | ❌ Wave 0 (D-05) |
| RNAV-03 | No document VT for overlay navigations; any VT with `dialog[open]` carries no named groups | e2e | same project as RNAV-02 | ❌ Wave 0 |
| RNAV-04 | Every URL shape the app emits routes to the leaf page and renders one list instance | e2e | same project (node-identity assertions, D-18) | ❌ Wave 0 |
| RNAV-04 | Both `+page.ts` guards still fire (404 on matcher fallthrough, 307 on entity/id coupling) | e2e or unit | a direct `load()` unit test is cheapest; the guards are pure functions of `params`+`url` | ❌ Wave 0 |
| RNAV-05 | Entity→entity swap without reopening; animated close; question-info through the host | e2e | `--project=voter-results-redraw` (entity half) + `--project=perm-interactive-info` (question-info half) | ⚠ partial — `perm-interactive-info.spec.ts` exists and already opens the popup; host-specific assertions ❌ Wave 0 |
| RNAV-05 | A hosted payload whose opener unmounts mid-close does not hang the dialog | e2e | same project; assert `dialog[open]` is absent after close | ❌ Wave 0 (this is D-12's negative control subject) |
| RNAV-06 | No `lib/spike` import and no `results-layered` directory under `apps/frontend/src` | unit | `npx vitest run "src/lib/_guards/spike-scaffolding.test.ts"` | ❌ Wave 0 (D-20) |
| — (all) | No visual regression on the two `voter-results-*` baselines | visual e2e | `npx playwright test -c ./tests/playwright.config.ts --project=visual-regression` — **in the pinned container only** | ✅ baselines exist |
| — (all) | No new WCAG 2.1 AA violation on the results routes | a11y e2e | `--project=a11y-smoke` | ✅ |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` + `yarn workspace @openvaa/frontend check`. Read exit status directly — never through a pipe.
- **Per wave merge:** `yarn test:unit` + `yarn lint:check` + the phase's own Playwright project.
- **Phase gate:** full E2E suite green via `tests/scripts/e2e-run.sh`, **then** `visual-regression` in the pinned container per D-19. The E2E hard rule applies: a "did not run" cell counts as a failure.

### Wave 0 Gaps

- [ ] `apps/frontend/src/lib/utils/viewTransition.test.ts` — RNAV-03 unit half (D-05)
- [ ] `apps/frontend/src/lib/_guards/spike-scaffolding.test.ts` — RNAV-06 (D-20)
- [ ] `tests/tests/specs/voter/voter-results-redraw.spec.ts` — RNAV-02/03/04/05 e2e
- [ ] A new project block in `tests/playwright.config.ts` for the above (a spec with no project runs from no command)
- [ ] A fixture for the VT log + scroll readers, composed in `tests/tests/fixtures/voter/views.ts` (the `resultsPage` rigidity contract forbids bolting them on)
- [ ] The replacement control block in `layout.tracking.test.ts` (D-04)
- [ ] `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` (D-17)
- [ ] Framework install: **none needed**

---

## Security Domain

`security_enforcement` is not set to `false` anywhere in `.planning/config.json`, so the section is included.

### Applicable ASVS Categories

| ASVS category | Applies | Standard control in this phase |
|---|---|---|
| V2 Authentication | no | The phase touches no auth surface. The known cold-`/results` SSR cookie crash is explicitly **out of scope** (phase boundary) |
| V3 Session Management | no | Unchanged. The `?next=` allowlist in `(located)/+layout.ts` is **read differently** (untracked) but its regex and semantics are untouched — verify this in review, since it is the one security-relevant line the de-lab edits |
| V4 Access Control | no | No route gains or loses a gate. `isProtectedRoute` / `APP_GATES` untouched; `routeConsistency.test.ts` continues to guard them |
| V5 Input Validation | **yes** | The `etPl` / `etSg` matchers are strict boolean-OR allowlists with no regex and no user-supplied predicate, and their doc-comments say why: *"All other values return `false` and SvelteKit serves its built-in 404 before the page component mounts, which is what keeps an attacker-supplied segment from reaching the page"* `[VERIFIED: apps/frontend/src/params/etPl.ts, etSg.ts]`. **D-08 keeps both matchers on the same segments**, so this control is preserved by construction — but it is preserved *only because* the params stay matcher-gated. A plan that drops a matcher to simplify the split removes an input-validation control |
| V6 Cryptography | no | None |

### Known Threat Patterns

| Pattern | STRIDE | Standard mitigation | Status in this phase |
|---|---|---|---|
| Open redirect via `?next=` | Tampering | The voter-route allowlist regex in `(located)/+layout.ts`, with its `// reason:` comment | **Preserved verbatim** — the de-lab changes only where `pathname`/`search` are read from, not what is tested. Reviewer must confirm the regex and the `nextKv` construction are byte-identical |
| Attacker-supplied route segment reaching a component | Tampering / Info disclosure | `etPl` / `etSg` matchers → built-in 404 | Preserved. The matcher-fallthrough 404 in `+page.ts` is the second layer and **D-10 keeps it** |
| Navigation loop from force-filled params (availability) | DoS (self-inflicted) | The "Post-88-02 loop fix" — no `/candidates` fallback when `entityTab` is absent | **D-08 and D-09 exist to keep it closed.** Any new emitter added during the split must be checked against it |
| Context leakage across the SSR boundary via a module singleton | Info disclosure | `drawerHostState.svelte.ts`'s doc-comment: *"Client-only by construction: `open` is only ever called from `$effect`s / event handlers, so this module-level singleton is never written during SSR (where it would leak across requests)."* `[VERIFIED: drawerHostState.svelte.ts:10-11]` | **Carry this comment into production verbatim.** A module-level `$state` singleton written during SSR is a cross-request leak, and this one is safe only because of a call-site convention. Consider an explicit `if (!browser) return;` guard in `open()` to make the invariant enforced rather than conventional |

---

## Project Constraints (from CLAUDE.md)

Actionable directives the planner must honour. Each is quoted or paraphrased from `./CLAUDE.md` read this session.

| Directive | Where it binds this phase |
|---|---|
| **E2E Hard Rule (cardinal failure)** — no task proceeds, completes, or is marked done while any E2E test fails. No "known-flaky" exemptions. A "did not run" test counts as a failure. Prefer running the whole suite (`yarn test:e2e`) for interim verification | Directly decides § *D-13's exercisable path* — the `e2e/base` flip is a cardinal failure, not a tradeoff |
| **Context Destructuring Rule (Svelte 5)** — never destructure a reactive accessor; never bind `dataRoot` to an intermediate `$derived` read alias | Three new/split route files each acquire the temptation. See § *Anti-Patterns* |
| **Svelte Warning-Accepted Format** — `// svelte-warning: accepted — <one-sentence-rationale>`, immediately above the triggering line | The spike code already uses `<!-- svelte-ignore … -->` and `// svelte-ignore state_referenced_locally` in `ContextBridge.svelte`, `DrawerHost.svelte` and `GlobalEntityDrawer.svelte`. Review each on productionisation; `svelte-ignore` and `svelte-warning: accepted` are different mechanisms and the rationale text must survive |
| **Use TypeScript strictly — avoid `any`** | The VT init script in the Playwright spec is the place `any` creeps in. `tests/` has its own tsconfig (`yarn typecheck:tests`); declare the `Window` augmentation the way `trackingIntercept.fixture.ts` does rather than casting |
| **Localization — all user-facing strings support multiple locales** | The split moves `t('results.selectElectionFirst')`, `t('error.noNominations')` and the tab labels between files. No new literal strings |
| **Test accessibility — WCAG 2.1 AA** | The drawer host replaces `ModalContainer`'s a11y implementation. Re-run `a11y-smoke`; treat any new violation as a defect |
| **Always check against `.agents/code-review-checklist.md`** | Before any plan is called done |
| **`yarn db:types` after a schema change** | N/A — no schema change |
| **`yarn build` first when starting a feature** | The phase edits `apps/frontend` only, but `@openvaa/app-shared` types are consumed; build before the first dev server |
| **Port conflicts / `strictPort`** | `yarn dev` fails loudly on a busy port. The E2E preflight additionally asserts the served app is *this* checkout and is scoped to the project the suite seeds — a wrong-project server aborts the run naming both ids |

---

## Documentation deliverables (D-22 / D-23 / D-24) — what the files actually look like

### D-22 — REQUIREMENTS.md and STATE.md, in one commit

Measured today, so the plan edits the real numbers:

- `.planning/REQUIREMENTS.md:222` reads **`**Coverage: 104/104 v2.15 requirements mapped to exactly one phase each. No orphans, no duplicates.**`** `[VERIFIED]`
- The § Traceability table holds **104 data rows** (a `grep -c '^| [A-Z]'` returns 105; one is the `| Requirement | Phase | Status |` header) `[VERIFIED: measured this session]`
- The § *Phase → requirement rollup* table ends `| **Total** | | **104** |` `[VERIFIED: REQUIREMENTS.md:369]`
- `.planning/STATE.md:33` reads **`Milestone: v2.15 (Phases 137-164 + 142.1 + 157.1 + 157.2, 29 phases; 148 absorbed into 147) — **100% complete, 270/270 plans**`** `[VERIFIED]`

So the edit set is: a new `### Results Navigation` requirement section; six new § Traceability rows; a new rollup row `| 165 — Results Navigation Redraw | RNAV-01..06 | 6 |`; the coverage line and the rollup Total **recounted** to 110; and STATE.md:33's phase count, plan count and percentage corrected — **all in one commit**. The file's own note explains why recounting rather than incrementing is mandatory: a previous edit advanced neither counter after adding ASSERT-11's row, and the number sat one low for six days `[VERIFIED: REQUIREMENTS.md:225-229]`.

Also worth a line in the ROADMAP: its § Progress header still reads *"Phases 137-164 (29 phases …), 39/39 original requirements"* and its `| 165. Results Navigation Redraw | 0/? | Not started |` row `[VERIFIED: .planning/ROADMAP.md § Progress]`.

**Commit mechanics:** the project memory records that in the *main* repo, `.planning` doc commits get aborted by the husky/lint-staged build hook and need `git commit --no-verify` (verifying the blob is non-empty afterwards). This worktree has a local `core.hooksPath=/dev/null` override, so plain commits work here — but the phase merges onto `integration/ship-12-squash`, so whichever checkout the commit is made in decides which applies.

### D-23 — the skill's third domain

The skill is `./.claude/skills/spike-findings-voting-advice-application-gsd/` with `SKILL.md` (30 574 bytes), a `references/` directory of 8 files and a `sources/` directory of 16 spike-code directories `[VERIFIED: ls this session]`. Five edits:

1. **`references/results-redraw.md`** — new, carrying the two invariants plus the mechanisms behind them.
2. **A row in § *Feature Areas***, matching the existing table's shape (`| Area | Reference | Key Finding |`).
3. **Rows in § *Production Landing Map*** (`| Migration target | Current legacy surface | Spike | Reference |`) for `(located)/+layout.ts`, `lib/utils/viewTransition.ts`, `routes/+layout.svelte` and the drawer host.
4. **`031`–`034` appended to `<metadata>` § *Processed Spikes***, which currently ends at `016-focus-and-a11y-during-transitions` `[VERIFIED: SKILL.md § Processed Spikes]`. **This is what silences the "unpackaged spikes" warning** — `.planning/spikes/MANIFEST.md` already carries rows 128–131 for all four `[VERIFIED]`.
5. **The `description:` frontmatter**, which today says *"two domains"* and enumerates them `[VERIFIED: SKILL.md:3]`. It becomes three. **CLAUDE.md § Skill Routing carries the same "two domains" phrasing** in its `spike-findings-…` bullet `[VERIFIED: ./CLAUDE.md § Skill Routing]` — update both or they disagree.

Note on § *Source Files*: phase 160 deliberately removed the duplicated write-ups from `sources/`, keeping only runnable spike code. **Do not add 031–034's READMEs under `sources/`** — `.planning/spikes/` is the canonical copy and the skill says so in terms.

### D-24 — the CLAUDE.md subsection

One short subsection under § *Frontend (SvelteKit)*, stating exactly the two invariants in the operator's words and pointing at `apps/frontend/src/lib/utils/viewTransition.ts` and `apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts`. Place it beside § *Context Destructuring Rule* and § *Svelte Warning-Accepted Format*, which are the two existing invariant subsections in that section and set the house format.

---

## Sources

### Primary (HIGH confidence) — read or executed this session

- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` (401 lines, read in full)
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts`, `.../[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts`, `.../+page.svelte`, `.../statistics/+page.svelte`
- `apps/frontend/src/routes/(voters)/(located)/+layout.ts`, `+layout.svelte`, `layout.tracking.test.ts`
- `apps/frontend/src/routes/+layout.svelte`; `apps/frontend/src/lib/utils/viewTransition.ts`, `timing.ts`
- `apps/frontend/src/lib/routes/route.ts`, `routeConsistency.test.ts`; `apps/frontend/src/params/etPl.ts`, `etSg.ts`
- `apps/frontend/src/lib/spike/{drawerHostState.svelte.ts, DrawerHost.svelte, ContextBridge.svelte, GlobalEntityDrawer.svelte, redrawLab.svelte.ts}`
- `apps/frontend/src/lib/components/modal/{ModalContainer.svelte, drawer/Drawer.svelte}`, `questions/QuestionExtendedInfoDrawer.svelte`, `layouts/main/MainContent.type.ts`
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (`#currentResultsEntityType`), `voterContext.type.ts`
- `apps/frontend/.svelte-kit/generated/client/app.js` (route → layout-chain manifest)
- `apps/frontend/.svelte-kit/types/.../[[entityTab=etPl]]/$types.d.ts` and `.../[[entity=etSg]]/$types.d.ts` — **generated by the probe this session**, then removed
- `tests/playwright.config.ts`, `tests/tests/fixtures/voter/resultsPage.fixture.ts`, `entityDetails.fixture.ts`, `tests/tests/fixtures/shared/trackingIntercept.fixture.ts`, `tests/tests/utils/testIds.ts`, `tests/tests/specs/voter/voter-journey.spec.ts:662-666`, `tests/tests/specs/perm/perm-interactive-info.spec.ts`
- `packages/dev-seed/src/templates/e2e/base.ts`, `.../e2e/perm/perm-interactive-info.ts`
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md:33`, `.planning/ROADMAP.md § Phase 165` + § Progress, `.planning/config.json`
- `.planning/phases/164-.../164-NEGATIVE-CONTROL.md` (format precedent)
- `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md`
- `node_modules/svelte/src/compiler/phases/2-analyze/visitors/SvelteBoundary.js`
- Commands run: `git merge-base`, `git rev-list --left-right --count`, `git diff <merge-base> HEAD`, `git show --stat`, `git status --porcelain`, `svelte-kit sync`, `npx playwright --version`, `docker info`, `docker system df`, `df -h`, and the population greps recorded in § *Measured populations*

### Secondary (MEDIUM confidence)

- `.planning/spikes/031-results-nav-flicker-forensics/README.md`, `032-.../README.md`, `033-.../README.md`, `034-.../README.md` — the phase's evidence base, read in full. Cited rather than verified where the claim is a *measurement the spike took* rather than a fact about the current tree
- `.planning/spikes/MANIFEST.md` rows 128-131 and its invariant list at lines 89-91
- `.planning/phases/165-results-navigation-redraw/165-CONTEXT.md` and `165-DISCUSSION-POINTS.md`

### Tertiary (LOW confidence)

- None. No web search was used and no claim here rests on training knowledge about SvelteKit's routing — the one claim that would have (D-08's layout nesting) was replaced by a positive probe.

---

## Metadata

**Confidence breakdown:**
- **De-labbing diff: HIGH** — derived from `git diff` against the measured merge-base, file by file, with every hunk read.
- **D-08 route mechanism: HIGH** — proved by a positive probe against SvelteKit 2.55.0's own route analysis, plus the existing tree's manifest, plus the loader doc-comment describing the picker fall-through.
- **Splitting inventory: HIGH** — line-by-line from the 401-line file.
- **Drawer host: MEDIUM-HIGH** — the spike files were read in full; `<svelte:boundary>`'s support is verified from the installed compiler, but its behaviour under this specific mid-flush throw is A1.
- **D-13: HIGH on the obstacle** (the `voter-journey.spec.ts` assertion and both template flags were read directly), **MEDIUM on the recommended route** (A4's testid question is untraced).
- **Negative controls: MEDIUM-HIGH** — format verified from phase 164; the injected regressions are designed, not yet run.
- **D-16 spec: MEDIUM** — the mechanism is grounded in the production code's own ordering, but the spec has not been written or run.
- **Pitfalls: HIGH** — each is a direct read of the source-of-truth file, with the line and the quote.

**Research date:** 2026-09-23
**Valid until:** ~2026-10-07 (14 days). Shorter than the usual 30: `integration/ship-12-squash` is moving (21 behind and counting), and every measured population in this document is a run-time derivation that the planner must re-take. The structural findings (D-08's mechanism, the statistics swallow, the `voter-journey` collision) are stable; the counts are not.
