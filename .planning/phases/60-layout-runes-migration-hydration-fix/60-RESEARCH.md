# Phase 60: Layout Runes Migration & Hydration Fix - Research

**Researched:** 2026-04-24
**Domain:** Svelte 5 runes mode in `+layout.svelte` + SSR hydration race on `$effect` + microtask writes
**Confidence:** HIGH (codebase + docs) / MEDIUM (upstream reproduction attribution)

---

## Summary

The `Promise.all(...).then(...)` inside `$effect` in both root `+layout.svelte` and `candidate/(protected)/+layout.svelte` is ceremonial — both SvelteKit loaders (`+layout.ts` and `+layout.server.ts`) already `await` every piece of data before returning, so the `.then()` callback resolves synchronously on already-resolved values. Its only visible effect is inserting a microtask boundary between `$effect` firing and the `$state` writes, which is the exact hydration race described by the todos: `$state` mutations that cross a microtask during the initial post-SSR `$effect` flush do not flag the "loading → ready" `{#if}` branch for re-rendering. The fix is to delete the microtask: compute validation and branch state with `$derived` off the already-resolved `data` prop, and run `$dataRoot` provide-calls + `userData.init()` in a dedicated `$effect` that never calls `.then()`.

Both layouts already run under global runes mode (`compilerOptions.runes: true` in `apps/frontend/svelte.config.js` plus `dynamicCompileOptions` for `node_modules`) — the v2.4 "167 per-file opt-ins removed" work is complete. There is no legacy-mode compiler flag still hiding in these files. The PopupRenderer workaround was introduced in v2.1 specifically because the root layout was still in **legacy mode** at that time; now that the root layout is itself a runes-mode component, the rationale for PopupRenderer may be obsolete and D-08 authorizes empirical removal. `fromStore(popupQueue)` direct inline rendering in root `+layout.svelte` is the removal target — the `popupStore` itself is already `$state`/`$derived` backed and exposed via `toStore(...)`, so a runes component reading it through `fromStore(...)` is reactive by construction.

**Primary recommendation:** Execute D-01 (the `$derived` refactor on already-resolved loader data) as the first plan in Phase 60. Ship the root-layout and protected-layout refactors as two separate plans to isolate risk surface — root has more moving parts (popup inline, analytics, feedback modal) while protected is the test-gate surface. Retain the `layoutState` enum as a single `$derived<...>` union value in the protected layout (it remains the cleanest single-source-of-truth for the 4-way branch); do NOT re-expand it back to separate signals — the enum shape is orthogonal to the microtask bug. Drop `await tick()` between `$dataRoot` writes and `userData.init()` — `userData.init()` is a plain assignment (`savedData = data`) with no DOM-timing dependency.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hydration Fix Strategy (LAYOUT-02)**

- **D-01:** Primary strategy is `$derived` on already-resolved loader data. Both `+layout.ts` and `+layout.server.ts` already `await` every piece of data before returning, so the `.then()` callback in `+layout.svelte` runs on resolved values — pure ceremony that creates a hydration-unsafe microtask. Drop the `Promise.all(...).then(...)` pattern entirely; compute `error` / `ready` / `underMaintenance` (and the protected layout's `layoutState`) via `$derived` from the already-resolved `data` prop. Do `$dataRoot` mutations in a separate `$effect` that reads the `$derived` values — no `.then()` in the critical path.
- **D-02:** Fallback if the `$derived` approach does not unblock the registration tests: adopt the wrapper-component pattern modelled on `PopupRenderer` — a runes-mode child component that owns the loading/validation surface via `onMount` + manual `.subscribe()` (for stores) or direct `$props()` (for loader data). This pattern has an existence proof in the codebase.
- **D-03:** Validation pattern — split concerns. Pure validation (`isValidResult` checks, `underMaintenance` flag derivation, error messaging) lives in `$derived` computations. Side-effects (`dataRoot.current.provideElectionData(...)`, `dataRoot.current.provideConstituencyData(...)`, `provideQuestionData(...)`, `provideEntityData(...)`, `provideNominationData(...)`, `userData.init(...)`) live in a separate `$effect` that reads the `$derived` values. No microtasks on the critical render path.
- **D-04:** Upstream Svelte 5 bug filing happens **after** Phase 60 completes, regardless of whether we find a clean fix.

**Root-Layout Scope (LAYOUT-01)**

- **D-05:** Apply the same `$derived` hydration refactor to root `+layout.svelte` (lines 78–93). Same latent bug shape exists on root; consistency is the goal.
- **D-06:** **Defer** `fromStore()` / `toStore()` bridge retirement to post-v2.6. Root `+layout.svelte` retains its 4 `fromStore()` bridges; `lib/contexts/app/` modules retain their `toStore()` usages. Out of scope for Phase 60.
- **D-07:** **No additional root-layout cleanup** beyond the hydration refactor. No `$effect`-block consolidation, no analytics extraction.

**PopupRenderer Fate (LAYOUT-03)**

- **D-08:** Attempt empirical removal of `PopupRenderer`. Execution order: (1) apply root-layout `$derived` refactor → (2) inline popup rendering into root via `fromStore(popupQueue)` + `{#if ...}` → (3) run the new setTimeout-popup E2E test (D-09) with `PopupRenderer` deleted → (4a) if passes: deletion sticks; (4b) if fails: restore `PopupRenderer` and add in-code rationale per D-10.
- **D-09:** Add a dedicated Playwright E2E test for `setTimeout`-triggered popup rendering on a full page load.
- **D-10:** If retained, the in-code rationale comment must name: (1) the specific Svelte 5 limitation, (2) a pointer to the minimum reproduction / upstream issue from D-04, and (3) the conditions under which removal would become viable.

**Regression-Verification Strategy**

- **D-11:** Primary regression gate is the Playwright parity gate against baseline SHA `3c57949c8`. Deterministic `--workers=1` capture + delta rule.
- **D-12:** Pre-existing 10 data-race + 38 cascade carry-forward failures are **not** Phase 60's problem.
- **D-13:** Unit-test coverage stays at the integration level (E2E). Hydration cannot be reproduced in Vitest.
- **D-14:** LAYOUT-03 validated empirically during execution — single decision point, no parallel contingent plans.

### Claude's Discretion

- Exact order of plans within the phase (root vs protected: one plan or two).
- Specific shape of the E2E test for setTimeout-popup rendering (D-09).
- Whether the protected layout keeps its existing `layoutState` enum as the `$derived` value type, or collapses it into separate `$derived` signals.
- Exact file placement for any new runes-mode subcomponent if the wrapper fallback (D-02) is invoked.

### Deferred Ideas (OUT OF SCOPE)

- **Centralized overlay handling.** Product direction: ultimately all overlays (popups, modals, drawers, feedback dialogs) handled centrally. Phase 60 only does the narrow PopupRenderer removal empirical check.
- **`fromStore()` / `toStore()` bridge retirement.** Touches `lib/contexts/app/appContext.svelte.ts`, `survey.svelte.ts`, `getRoute.svelte.ts` + cascades. Dedicated refactor milestone, not Phase 60.
- **`$effect` block consolidation in root `+layout.svelte`.**
- **Analytics setup extraction** to a dedicated analytics context/module.
- **Proactive Svelte 5 upstream bug filing before execution** (D-04 explicitly sequences after).
- **Parallel contingent plans for PopupRenderer removal vs retention** (rejected in D-14).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAYOUT-01 | Root `+layout.svelte` in Svelte 5 runes mode — no `export let`, no `$:`, no `<slot />`; uses `$props`, `$derived`, `{@render children()}` consistently. | File is already syntactically compliant (verified: `$props`, `$effect`, `{@render children()}` — no `<slot />`, no `$:`, no `export let`). Remaining work is the `$derived` refactor per D-05 to replace the `$effect + .then()` pattern on lines 78–93 with pure `$derived` validation + a separate `$effect` for `$dataRoot` writes. |
| LAYOUT-02 | Candidate protected layout renders post-hydration on full page loads; the 2 blocked E2E tests pass without workarounds. | Both blockers (`candidate-registration.spec.ts:64`, `candidate-profile.spec.ts:51`) use `page.goto(registrationLink)` (full page load — SSR + hydration path) and depend on the `layoutState` enum transitioning past `'loading'`. The `$derived` refactor per D-01 + D-03 removes the microtask boundary between `$effect` and `$state` writes. Also: `userData.init(data)` is synchronous (`savedData = data`), so the `await tick()` between `$dataRoot.*` and `userData.init(...)` is obsolete ceremony and can be dropped. |
| LAYOUT-03 | `PopupRenderer` workaround removed (direct store rendering works) OR retained with in-code rationale naming the upstream Svelte 5 limitation. | `popupStore` is already `$state` + `$derived` + `toStore(...)` backed. Root layout is runes-mode. Direct inline rendering via `fromStore(popupQueue)` + `{#if}` is now architecturally viable. D-08 authorizes empirical removal via the new E2E test (D-09). |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Load root app data (settings, customization, elections, constituencies) | Frontend Server (SSR, `+layout.ts`) | — | Already `await`s everything before returning; serialized into the hydration payload. Do NOT move loader work client-side. |
| Validate root data shape (error / ready / underMaintenance) | Browser (runes-mode `+layout.svelte`) | — | Pure computation on already-serialized loader data; moves from `$effect + .then()` → `$derived`. |
| Apply root data to `$dataRoot` (provide\*Data calls) | Browser (runes-mode `+layout.svelte`) | — | Must run client-side to populate the reactive context consumed by downstream voter/candidate routes. Moves into a dedicated `$effect` reading the `$derived` validity flags. |
| Load candidate-protected user data (candidate, nominations, questions) | Frontend Server (SSR, `+layout.server.ts`) | — | Already `await`s everything. Authenticated RPC via `event.locals.supabase`. |
| Validate protected data shape + branch (`layoutState` enum) | Browser (runes-mode `(protected)/+layout.svelte`) | — | `$derived<'loading' \| 'error' \| 'terms' \| 'ready'>` off already-resolved `data` + `candidate.termsOfUseAccepted`. |
| Apply protected data to `$dataRoot` + `userData.init()` | Browser (runes-mode `(protected)/+layout.svelte`) | — | Dedicated `$effect` that reads the `$derived` branch value; no microtasks. |
| Popup queue rendering (timed + immediate popups) | Browser (root `+layout.svelte` inline if D-08 removal succeeds, or `PopupRenderer` runes-mode wrapper if retained) | — | Store is already reactive (`$state`/`$derived`/`toStore`); rendering is a thin UI concern. |
| Analytics tracking, feedback modal ref, visibility handler | Browser (root `+layout.svelte` `$effect` blocks — leave untouched per D-07) | — | Orthogonal to the hydration refactor. |
| Playwright parity regression gate | CI / local dev (tsx script from Phase 59-03) | — | `scripts/diff-playwright-reports.ts` from Phase 59 — reuse, do not duplicate. |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Runes mode for layouts (`$props`, `$derived`, `$effect`, `$state`) | `[VERIFIED: .yarnrc.yml → 'svelte: ^5.53.12']` Already the project's version; runes mode globally enabled via `compilerOptions.runes: true` in `apps/frontend/svelte.config.js`. |
| @sveltejs/kit | 2.55.0 | Loader → layout data handoff | `[VERIFIED: .yarnrc.yml]` Project version. `LayoutData` type is used via `./$types`. |
| svelte/store `fromStore` / `toStore` | (builtin, Svelte 5) | Bridge from classic stores to runes reactivity and vice versa | `[VERIFIED: Svelte 5 docs]` Accepted interim pattern (D-06 defers retirement). Already used in root `+layout.svelte` lines 64–67 for `appSettings`, `dataRoot`, `openFeedbackModal`, `sendTrackingEvent`. |
| @playwright/test | 1.58.2 | E2E regression gate + new setTimeout-popup test | `[VERIFIED: PROJECT.md §Constraints]` Existing test infrastructure. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `isValidResult` helper | (internal) | Validation predicate on loader results | Reusable in `$derived` bodies. Handles `allowEmpty` for settings/customization vs election/constituency. Note: it calls `logDebugError` as a side-effect (`[VERIFIED: apps/frontend/src/lib/api/utils/isValidResult.ts line 17]`) — this is a benign logging side-effect but technically means `$derived` bodies calling `isValidResult` are not side-effect-free in the strict sense. Acceptable for this refactor. |
| `tick` from `svelte` | (builtin) | DOM flush synchronization | Currently used in protected `+layout.svelte` between `$dataRoot.*` writes and `userData.init(...)`. `[VERIFIED: grep]` `userData.init()` is `savedData = data` (assignment only, no DOM dependency) — the `tick()` was a defensive v2.1 artifact and can be dropped. |
| `scripts/diff-playwright-reports.ts` | (Phase 59-03 artifact) | Parity gate comparator | `[VERIFIED: git show 5b449ab73]` Reads two Playwright JSON reports, enforces PASS_LOCKED / CASCADE / DATA_RACE delta rule, prints `PARITY GATE: PASS` / `PARITY GATE: FAIL`. Location: `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` at baseline SHA `f09daea34`. **Note for planner:** the baseline test lists are embedded in that script as of SHA `f09daea34`. Phase 60's parity gate runs against SHA `3c57949c8` (post-v2.5 fix-forward): 41 pass / 10 data-race / 38 cascade = 89. Planner must confirm whether the embedded lists from `f09daea34` remain the authoritative contract (they should — v2.5 ended with PARITY PASS against that baseline) or whether the script needs a re-embed pass. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `$derived` on resolved `data` (D-01) | SvelteKit streaming + `{#await}` on the client | Reverses the current `await`-everything loader policy (documented in `+layout.ts` comment lines 9–12: Svelte 5 hydration is why streaming was removed). Would require bigger refactor and re-open the same bug class. REJECTED in CONTEXT.md. |
| `$derived` on resolved `data` (D-01) | Wrapper component pattern (D-02) | More indirection. Only adopt if D-01 empirically fails. Existence proof: `PopupRenderer`. |
| Keep `layoutState` enum | Collapse into separate `$derived` signals (`error`, `ready`, `showTerms`) | Enum was v2.1 workaround for "multi-write in `.then()`". Post-refactor the workaround is moot, but the enum shape remains the cleanest 4-way branch representation. **Recommendation:** keep the enum as a `$derived<'loading' \| 'error' \| 'terms' \| 'ready'>`; the rename from `$state` to `$derived` is the entire change. Rationale: readability + single-source branch. Discretion lives with executor per CONTEXT.md Claude's Discretion. |

**Installation:** No new dependencies. All tools already in the project.

**Version verification:**
- `svelte@5.53.12` — `[VERIFIED: .yarnrc.yml]` Currently installed.
- `@sveltejs/kit@2.55.0` — `[VERIFIED: .yarnrc.yml]` Currently installed.
- `@playwright/test@1.58.2` — `[VERIFIED: PROJECT.md]` Currently installed.

---

## Architecture Patterns

### System Architecture Diagram

```
                              ┌─────────────────────────────────┐
      Full page load          │  SvelteKit SSR                  │
      page.goto(...)          │                                 │
             │                │  ┌──────────────────────────┐   │
             ▼                │  │ +layout.ts / +layout.    │   │
    ┌────────────────┐        │  │ server.ts loaders        │   │
    │   Browser      │        │  │                          │   │
    │   request      ├───────▶│  │ await dataProvider.get*  │   │
    └────────────────┘        │  │ await dataWriter.get*    │   │
                              │  │   (all data resolved)    │   │
                              │  └────────────┬─────────────┘   │
                              │               │                 │
                              │               ▼                 │
                              │  ┌──────────────────────────┐   │
                              │  │ +layout.svelte SSR       │   │
                              │  │  - no $effect fires      │   │
                              │  │  - $derived evaluated    │   │
                              │  │    → serialize to HTML   │   │
                              │  └────────────┬─────────────┘   │
                              └───────────────┼─────────────────┘
                                              │
                                              ▼
                              ┌─────────────────────────────────┐
                              │  Client hydration               │
                              │                                 │
                              │  ┌──────────────────────────┐   │
                              │  │ +layout.svelte hydrates  │   │
                              │  │  - $props() receives     │   │
                              │  │    resolved data object  │   │
                              │  │  - $derived re-evaluates │   │
                              │  │    error/ready/state     │   │
                              │  │    synchronously         │   │
                              │  │  - {#if layoutState===   │   │
                              │  │     'ready'} branches    │   │
                              │  │    correctly             │   │
                              │  └────────────┬─────────────┘   │
                              │               │                 │
                              │               ▼                 │
                              │  ┌──────────────────────────┐   │
                              │  │ $effect (mount-time):    │   │
                              │  │  reads $derived flags,   │   │
                              │  │  runs dataRoot.provide*  │   │
                              │  │  runs userData.init(...) │   │
                              │  │  NO .then() microtask    │   │
                              │  └──────────────────────────┘   │
                              └─────────────────────────────────┘
                                              │
                                              ▼
                              ┌─────────────────────────────────┐
                              │  Child routes render via        │
                              │  {@render children?.()}         │
                              │  Popup queue renders via        │
                              │  fromStore(popupQueue) + {#if}  │
                              │  (or PopupRenderer if retained) │
                              └─────────────────────────────────┘
```

Key difference from current code: the microtask boundary between `$effect` firing and the `$state` write — which is the hydration race — is eliminated by moving branch computation to `$derived`.

### Recommended Project Structure

No new directories. Files touched:

```
apps/frontend/src/
├── routes/
│   ├── +layout.svelte              # LAYOUT-01 refactor target
│   ├── +layout.ts                  # LOADER — unchanged (already awaits)
│   └── candidate/
│       └── (protected)/
│           ├── +layout.svelte      # LAYOUT-02 refactor target
│           └── +layout.server.ts   # LOADER — unchanged (already awaits)
└── lib/
    └── components/
        └── popupRenderer/
            ├── PopupRenderer.svelte  # LAYOUT-03 possible deletion
            └── index.ts              # barrel — possible deletion
tests/tests/specs/voter/             # Location for new setTimeout-popup E2E
└── voter-popups.spec.ts             # Existing analog (see Pattern 4)
```

### Pattern 1: `$derived` validation off resolved loader data (D-01 + D-03)

**What:** Compute the branch selector via `$derived` directly on `data` prop fields. Since the loader `await`s everything before returning, `data.*` is either the resolved type or `Error` — always a concrete value, never a Promise.

**When to use:** Both root and protected `+layout.svelte`. Replaces `$effect + Promise.all(...).then(...)` pattern.

**Root layout — minimal sketch (replaces lines 69–120):**

```svelte
<script lang="ts">
  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  // ... context inits stay as-is ...
  const { appSettings: appSettingsStore, dataRoot: dataRootStore, ... } = initAppContext();
  const appSettings = fromStore(appSettingsStore);
  const dataRoot = fromStore(dataRootStore);

  // Pure validation — NO side effects, NO microtasks.
  // `data.*` is already resolved (loader awaits everything).
  const validity = $derived.by(() => {
    if (!isValidResult(data.appSettingsData, { allowEmpty: true }))
      return { error: new Error('Error loading app settings data') };
    if (!isValidResult(data.appCustomizationData, { allowEmpty: true }))
      return { error: new Error('Error loading app customization data') };
    if (!isValidResult(data.electionData))
      return { error: new Error('Error loading election data') };
    if (!isValidResult(data.constituencyData))
      return { error: new Error('Error loading constituency data') };
    return {
      appSettingsData: data.appSettingsData,
      electionData: data.electionData,
      constituencyData: data.constituencyData
    };
  });

  const error = $derived('error' in validity ? validity.error : undefined);
  const underMaintenance = $derived(
    !('error' in validity) &&
    (validity.appSettingsData.access?.underMaintenance ?? false)
  );
  const ready = $derived(!('error' in validity));

  // Side effect — runs on mount after $derived is computed.
  // No microtask, no .then(). Reads $derived-ed validity.
  $effect(() => {
    if ('error' in validity) return;
    dataRoot.current.update(() => {
      dataRoot.current.provideElectionData(validity.electionData);
      dataRoot.current.provideConstituencyData(validity.constituencyData);
    });
  });

  $effect(() => {
    if (error) logDebugError(error.message);
  });

  // ... analytics / feedback-modal / visibility $effect blocks stay untouched ...
</script>

<svelte:head>...</svelte:head>

{#if error}
  <ErrorMessage class="bg-base-300 h-dvh" />
{:else if !ready}
  <Loading class="bg-base-300 h-dvh" />
{:else if underMaintenance}
  <MaintenancePage />
{:else}
  {@render children?.()}
  <FeedbackModal bind:this={feedbackModalRef} />
  ... analytics ...
{/if}

<!-- If D-08 removal succeeds: inline popup instead of <PopupRenderer /> -->
{#if popupQueue.current}
  {@const item = popupQueue.current}
  <svelte:component this={item.component} {...item.props ?? {}}
    onClose={() => { item.onClose?.(); popupQueueStore.shift(); }} />
{/if}
```

**Note on `ready`:** in the `$derived`-based world, `ready` is just `!error`. The `ready = false` "reset before async work" gate on current line 87 exists only because the `.then()` microtask might resolve at a later tick — with `$derived`, the branch recomputes synchronously on every `data` change, so the intermediate "loading" frame only appears if `data.*` itself is somehow missing (it won't be, given the `await`-everything loader). If a transient "loading" frame is needed during client-side navigation between routes with different `data`, the planner should verify via an afterNavigate test whether SvelteKit already handles it via the `$app/navigation` `navigating` store.

**Protected layout — minimal sketch (replaces lines 66–104):**

```svelte
<script lang="ts">
  let { data, children }: { data: ProtectedLayoutData; children: Snippet } = $props();
  const { dataRoot, logout, t, userData } = getCandidateContext();

  // $derived validation — 4-way enum retained (D-03 + executor discretion).
  const validity = $derived.by(() => {
    if (!isValidResult(data.questionData, { allowEmpty: true }))
      return { state: 'error' as const };
    const ud = data.candidateUserData;
    if (!ud?.nominations || !ud?.candidate)
      return { state: 'error' as const };
    return {
      state: 'resolved' as const,
      questionData: data.questionData,
      candidate: ud.candidate,
      entities: ud.nominations.entities,
      nominations: ud.nominations.nominations,
      userData: ud
    };
  });

  // After terms acceptance, `termsAccepted` flips; recompute branch.
  let termsAcceptedLocal = $state(false);
  const layoutState = $derived<'loading' | 'error' | 'terms' | 'ready'>(
    validity.state === 'error'
      ? 'error'
      : !validity.candidate.termsOfUseAccepted && !termsAcceptedLocal
        ? 'terms'
        : 'ready'
  );

  // Side effect — provide data to $dataRoot + init userData, once data is valid.
  // Reads $derived validity; no .then(); no await tick() (userData.init is synchronous).
  $effect(() => {
    if (validity.state !== 'resolved') return;
    $dataRoot.update(() => {
      $dataRoot.provideQuestionData(validity.questionData);
      $dataRoot.provideEntityData(validity.entities);
      $dataRoot.provideNominationData(validity.nominations);
    });
    userData.init(validity.userData);
  });

  async function handleSubmit() {
    if (!termsAcceptedLocal) return;
    status = 'loading';
    userData.setTermsOfUseAccepted(new Date().toJSON());
    await userData.save();
    status = 'success';
    // layoutState recomputes via $derived — no explicit write needed.
  }
</script>

{#if layoutState === 'error'}   <ErrorMessage class="bg-base-300" />
{:else if layoutState === 'loading'}   <Loading />
{:else if layoutState === 'terms'}   ...TermsOfUseForm + bind:termsAccepted={termsAcceptedLocal}...
{:else}   {@render children?.()}
{/if}
```

**Source:** Derived from local code at `apps/frontend/src/routes/+layout.svelte` (current implementation), `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (current implementation), and `apps/frontend/src/lib/admin/utils/loadElectionData.ts` (reference pattern for the `dataRoot.update(() => { provide*(…) })` batching idiom). `[VERIFIED: codebase reads]`

### Pattern 2: Wrapper component fallback (D-02, only if D-01 empirically fails)

**What:** If the `$derived` refactor still leaves the registration tests stuck at `<Loading />` (which would be surprising given the loader `await`s everything, but possible if there's an unknown second interacting bug), pull the branch into a runes-mode subcomponent — the same pattern that made `PopupRenderer` work.

**When to use:** Only after D-01 is shipped and measured against the 2 registration E2E tests. Not proactively.

**Minimal skeleton:**

```svelte
<!-- apps/frontend/src/routes/candidate/(protected)/ProtectedLayoutContent.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  // ... same imports ...

  let { data, children }: { data: ProtectedLayoutData; children: Snippet } = $props();
  const { dataRoot, userData, ... } = getCandidateContext();

  let layoutState = $state<'loading' | 'error' | 'terms' | 'ready'>('loading');

  onMount(() => {
    // Runs post-hydration, once the component is actually live in the DOM.
    // $state writes from onMount DO trigger re-renders (proven by PopupRenderer).
    if (!isValidResult(data.questionData, { allowEmpty: true })) { layoutState = 'error'; return; }
    if (!data.candidateUserData?.candidate) { layoutState = 'error'; return; }
    $dataRoot.update(() => {
      $dataRoot.provideQuestionData(data.questionData);
      $dataRoot.provideEntityData(data.candidateUserData.nominations.entities);
      $dataRoot.provideNominationData(data.candidateUserData.nominations.nominations);
    });
    userData.init(data.candidateUserData);
    layoutState = data.candidateUserData.candidate.termsOfUseAccepted ? 'ready' : 'terms';
  });
</script>

{#if layoutState === 'error'}   <ErrorMessage />
{:else if layoutState === 'loading'}   <Loading />
{:else if layoutState === 'terms'}   ...TermsOfUseForm...
{:else}   {@render children?.()}
{/if}
```

And in the protected `+layout.svelte`:
```svelte
<ProtectedLayoutContent {data}>{@render children?.()}</ProtectedLayoutContent>
```

**Source:** `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` — existing proven pattern. `[VERIFIED: codebase read]`

### Pattern 3: Admin layout as consistency reference for runes-mode + `fromStore`

**What:** `apps/frontend/src/routes/admin/+layout.svelte` already demonstrates the clean runes-mode layout pattern: `$props`, `fromStore(...)` bridges for classic stores, direct `{#if appSettingsState.current.xxx}` checks, no `$effect + .then()`, `{@render children?.()}`.

**When to use:** As the canonical shape the refactored root and protected layouts should converge toward. Especially the branch pattern on admin lines 44–60 (`{#if !appSettingsState.current.xxx}`) is identical in spirit to what the post-refactor root layout will look like.

**Source:** `apps/frontend/src/routes/admin/+layout.svelte` `[VERIFIED: codebase read]`

### Pattern 4: setTimeout-popup E2E test pattern (D-09)

**What:** Voter popup tests in `tests/tests/specs/voter/voter-popups.spec.ts` already cover setTimeout-triggered popup rendering on the **results page** (VOTE-15 feedback popup + VOTE-16 survey popup). Both use `setTimeout(..., 2s)` internally and the E2E asserts the `<dialog>` role appears.

**Current coverage gap:** The existing tests navigate via the voter fixture (`answeredVoterPage`) — i.e., they reach `/results` via client-side navigation through the question flow, NOT via a full page load (`page.goto(/results)`). The hydration race specifically manifests on **full page loads**. So the new D-09 test should:

1. Enable `showFeedbackPopup` via `SupabaseAdminClient.updateAppSettings(...)` in `beforeAll`.
2. `page.goto('/results')` directly (full page load, bypassing client-side nav) after seeding voter answers via admin API or localStorage.
3. Assert the popup `<dialog>` appears within 10s.
4. `afterAll`: restore default popup settings.

**Minimal new spec skeleton (file: `tests/tests/specs/voter/voter-popup-hydration.spec.ts` or a block appended to existing `voter-popups.spec.ts`):**

```ts
test.describe('setTimeout popup on full page load (LAYOUT-03 regression gate)', { tag: ['@voter'] }, () => {
  const client = new SupabaseAdminClient();
  test.beforeAll(async () => {
    await client.updateAppSettings({
      results: { showFeedbackPopup: 2, showSurveyPopup: null },
      survey: { showIn: [], linkTemplate: '' },
      ...preserveNavigationSettings,
      ...suppressInterferingPopups
    });
  });
  test.afterAll(async () => { await client.updateAppSettings(defaultPopupSettings); });

  test('popup appears on full page load to /results (not via client-side nav)', async ({ page }) => {
    // Seed voter answers directly — skip client-side question navigation
    // so the results page is reached via page.goto (SSR + hydration path).
    // Implementation detail: planner picks the seeding method (localStorage
    // presets, URL query params, or a dedicated test helper).
    await seedVoterAnswersViaPage(page);  // <-- planner designs this helper
    await page.goto('/results');
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: 10000 });
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15000 });
    await expect(dialog).toBeVisible();
  });
});
```

**Source:** `tests/tests/specs/voter/voter-popups.spec.ts` (existing analog) + `tests/tests/utils/supabaseAdminClient.ts` (admin API for settings) `[VERIFIED: codebase read]`

### Anti-Patterns to Avoid

- **`$effect` + `Promise.all(...).then(...)` on already-resolved loader data** — the bug itself. The loader awaits everything; the `.then()` creates a microtask boundary that Svelte 5 does not bridge reliably during the initial post-hydration `$effect` flush.
- **`untrack()` to silence the bug** — writes inside `untrack()` also don't trigger re-renders (`[CITED: .planning/todos/pending/svelte5-hydration-effect-then-bug.md]`). This was one of the 6 tried-and-failed approaches.
- **`await tick()` after `.then()`** — does not bridge the microtask boundary either (`[CITED: same source]`).
- **Separate `$state` writes for `error` / `ready` / `showTermsOfUse`** (pre-v2.1 shape) — the "two writes in `.then()` not flagging re-render" pattern. The `layoutState` enum consolidation was the v2.1 workaround; removing the `.then()` entirely obviates the need for the consolidation, but the enum shape is still the cleanest branch representation.
- **Side-effects inside `$derived`** — Svelte docs state "The expression inside `$derived(...)` should be free of side-effects." `[CITED: https://svelte.dev/docs/svelte/$derived]`. `isValidResult` has a `logDebugError` side-effect, which is benign for this refactor but worth flagging: the planner should verify whether the `logDebugError` calls during `$derived` re-evaluation create duplicate log output and, if so, move logging to the downstream `$effect`.
- **Hand-rolling a popup component if PopupRenderer is removed** — use `<svelte:component this={item.component} ...>` directly inline in root. The PopupRenderer source file is 24 lines, all of it reusable as-is inline.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Regression detection across Playwright reports | A new diff script | `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` | Fully specified in Phase 59-03; embeds the 41/25/10 test contract; prints `PARITY GATE: PASS\|FAIL` literal. Re-embed of baseline test lists may be needed if the script was authored against SHA `f09daea34` — planner verifies. |
| Deterministic Playwright capture | A custom script | `npx playwright test --workers=1` (documented in v2.5 CONTEXT.md as the parity-gate methodology) | Single-line invocation; serializes the 10 data-race flakes; matches how the baseline was captured. |
| Loader-driven data resolution | Client-side Promise juggling | Existing `+layout.ts` + `+layout.server.ts` (already `await`s everything) | v2.1 + v2.4 lessons: client-side streaming promises surface hydration issues; the current awaited-everything policy is load-bearing (comment on `+layout.ts:9-12`). |
| Popup queue management | A new popup store | Existing `popupStore` (`$state` + `$derived` + `toStore(...)` — already runes-reactive) | `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts`. Already reactive; just needs to be rendered. |
| E2E settings mutation | Direct SQL / frontend UI toggles | `SupabaseAdminClient.updateAppSettings(...)` | Matches how `voter-popups.spec.ts` and other popup E2E tests mutate global settings. |

**Key insight:** Every primitive needed for LAYOUT-01/02/03 already exists in the codebase. The refactor is 100% subtractive (remove `.then()`, rename `$state` → `$derived`, optionally delete `PopupRenderer`) — no new utilities, no new components (unless D-02 fallback triggers), no new scripts.

---

## Runtime State Inventory

Not applicable — this phase does not rename, move, or rebrand anything. No database collection names, environment variable names, OS-registered tasks, secret keys, or build artifacts are affected. The refactor is purely to component source files.

**Stored data:** None affected.
**Live service config:** None affected.
**OS-registered state:** None affected.
**Secrets/env vars:** None affected — only reads `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` indirectly via existing `dataProvider`. `[VERIFIED: no env reads in target files]`
**Build artifacts:** None affected — existing `yarn build` and `yarn test:e2e` pipelines continue to work.

---

## Common Pitfalls

### Pitfall 1: Assuming `$derived` can contain the `isValidResult` call verbatim without log noise

**What goes wrong:** `isValidResult` calls `logDebugError` when validation fails. `$derived` bodies re-run on every dependency change, which during client-side navigation can produce duplicate log lines for the same invalid payload.

**Why it happens:** Svelte 5 recomputes `$derived` whenever any reactive dependency changes — more aggressively than `$effect`, which only fires on actually-changed values (well, nearly).

**How to avoid:** Route the logging side-effect through the downstream `$effect` that runs the `$dataRoot` provide calls, instead of letting `$derived` emit logs. E.g., `$derived` computes a `{ error?: Error, …data }` shape; the `$effect` calls `logDebugError(error.message)` only once when `error` transitions from absent to present.

**Warning signs:** Duplicate `[DEBUG] Invalid result from DataProvider: …` lines in the dev console during client-side route transitions.

### Pitfall 2: Dropping `await tick()` without checking downstream consumer assumptions

**What goes wrong:** The `await tick()` between `$dataRoot.*` writes and `userData.init(...)` in current protected `+layout.svelte` might mask a real dependency on DOM flush in a downstream component that reads `$dataRoot` synchronously after mount.

**Why it happens:** Defensive `tick()` calls get added during firefighting and outlive the original reason.

**How to avoid:** Grep for `$dataRoot.getElection(` / `$dataRoot.getCandidate(` / similar reads inside `onMount` or at top-level of components rendered under the protected layout. If any such reader assumes `$dataRoot` is populated synchronously at mount time, the planner must verify the new shape (`$effect` reads `$derived` which reads `data` — synchronous but happens post-mount) is compatible.

**Verification command for planner:** `grep -rn '\$dataRoot\.' apps/frontend/src/routes/candidate/\(protected\)/ --include='*.svelte'` then audit the callers for mount-time dependencies.

**Warning signs:** Child components rendered under protected layout throw "undefined is not an object" for election / candidate fields on first mount.

### Pitfall 3: Removing `PopupRenderer` before the root-layout `$derived` refactor lands

**What goes wrong:** The D-08 empirical removal order matters. If `PopupRenderer` is deleted before root `+layout.svelte` is refactored to full runes-idiomatic mode, the test would be invalid — it wouldn't prove whether the root-layout hydration path is fixed, only that the combination of current-state root + no wrapper still has the bug.

**Why it happens:** Parallel plan execution or out-of-sequence changes.

**How to avoid:** Plan ordering must be strict per CONTEXT.md D-08: (1) root-layout `$derived` refactor first, (2) inline popup + delete `PopupRenderer`, (3) run new E2E test, (4a/b) decide. No branch/parallelization of removal vs retention.

**Warning signs:** New setTimeout-popup E2E test fails during Phase 60 execution in an unexpected way and the planner cannot attribute it cleanly to either the refactor OR the removal.

### Pitfall 4: Parity gate treating cascade improvements as "pass inflation"

**What goes wrong:** Phase 60 is expected to reclaim ~35 cascade tests plus the 2 direct registration blocks. If the parity diff script's delta rule treats the cascade-set → pass transition as a regression (e.g., "unexpected new passing tests"), the gate prints `PARITY GATE: FAIL` for the wrong reason.

**Why it happens:** Delta-rule implementations sometimes lock both directions.

**How to avoid:** Verify the `diff-playwright-reports.ts` script explicitly permits `CASCADE → pass` transitions. Per the Phase 59-03 commit message: "Rule 3: CASCADE → pass is acceptable" is explicitly encoded. `[VERIFIED: git show 5b449ab73]`

**Warning signs:** Gate says FAIL but no PASS_LOCKED test actually regressed — diagnose by reading the diff table on stdout.

### Pitfall 5: `<svelte:component>` deprecation warnings on inline popup

**What goes wrong:** `PopupRenderer.svelte` uses `<svelte:component this={item.component} .../>`. If this is inlined into root `+layout.svelte` verbatim, Svelte 5 may emit a deprecation warning — in runes mode, `<svelte:component>` has been superseded by the fact that component references are reactive without it.

**Why it happens:** Svelte 5 runes mode redefines `<svelte:component>` semantics; in many cases `{@const Component = item.component}` + `<Component ...>` is the runes-idiomatic replacement.

**How to avoid:** When inlining, use:
```svelte
{#if popupQueue.current}
  {@const item = popupQueue.current}
  {@const Component = item.component}
  <Component {...item.props ?? {}} onClose={() => { item.onClose?.(); popupQueueStore.shift(); }} />
{/if}
```

**Warning signs:** Svelte compiler warning "`<svelte:component>` is deprecated in runes mode" during `yarn build`.

---

## Code Examples

### Example 1: `dataRoot.update(() => { provide*(...) })` batching pattern

**Source:** `apps/frontend/src/lib/admin/utils/loadElectionData.ts` lines 56–61 `[VERIFIED: codebase read]`

```ts
dataRoot.update(() => {
  dataRoot.provideElectionData(electionData);
  dataRoot.provideConstituencyData(constituencyData);
  dataRoot.provideQuestionData(questionData);
  dataRoot.provideEntityData(nominationData.entities);
  dataRoot.provideNominationData(nominationData.nominations);
});
```

This is the canonical shape for batching multiple `provide*` calls into one reactive notification. Root layout uses it partially (only `provideElectionData` + `provideConstituencyData`); protected layout extends it (adds `provideQuestionData`, `provideEntityData`, `provideNominationData`).

### Example 2: Runes-mode layout with `fromStore` + direct branch

**Source:** `apps/frontend/src/routes/admin/+layout.svelte` `[VERIFIED: codebase read]`

```svelte
<script lang="ts">
  let { children }: { children: Snippet } = $props();
  const { appSettings, appType, t } = initAdminContext();
  const appSettingsState = fromStore(appSettings);
  appType.set('admin');
</script>

{#if !appSettingsState.current.dataAdapter.supportsAdminApp}
  <MaintenancePage .../>
{:else if !appSettingsState.current.access.adminApp}
  <MaintenancePage .../>
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    {@render children?.()}
  </Layout>
{/if}
```

No `$effect + .then()`, no intermediate `$state` flags, no workarounds. This is the shape the refactored layouts converge on.

### Example 3: Existing PopupRenderer inline-ready pattern

**Source:** `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` `[VERIFIED: codebase read]`

```svelte
<script lang="ts">
  import { fromStore } from 'svelte/store';
  let { popupQueue }: { popupQueue: PopupStore } = $props();
  const queueState = fromStore(popupQueue);
  let currentItem = $derived(queueState.current);
</script>

{#if currentItem}
  {@const item = currentItem}
  <svelte:component this={item.component} {...item.props ?? {}}
    onClose={() => { item.onClose?.(); popupQueue.shift(); }} />
{/if}
```

If D-08 removal succeeds, this 8-line body is inlined verbatim into root `+layout.svelte` (with `<svelte:component>` → `{@const Component = …}` + `<Component …>` per Pitfall 5).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$effect + Promise.all(...).then(...)` for branch state | `$derived` off already-resolved loader data | v2.6 Phase 60 (this phase) | Removes the microtask boundary that Svelte 5 hydration does not bridge; unblocks 2 direct registration E2E tests + ~35 cascade. |
| Separate `ready` / `error` / `showTermsOfUse` `$state` variables | Single `layoutState` enum (v2.1 workaround) | v2.1 (2026-03-26) | Consolidated writes to one `.then()` callback to work around "multiple `$state` writes not flagging re-render". Retained shape-wise in v2.6 but the enum becomes `$derived`, not `$state`. |
| `<slot />` in root layout | `{@render children?.()}` | v2.4 (2026-03-28) | Root layout already migrated off `<slot />`. `[VERIFIED: current file line 193]` |
| Per-file `<svelte:options runes />` opt-ins | Global `compilerOptions.runes: true` | v2.4 (2026-03-28) | All 167 per-file opt-ins removed. `[VERIFIED: PROJECT.md v2.4 entry]` |
| Legacy-mode root layout with `PopupRenderer` wrapper | Runes-mode root layout with optional inline popup | v2.4 (globally runes), Phase 60 (inline) | The legacy-mode rationale for the wrapper is obsolete. D-08 tests whether the wrapper can be removed entirely. |
| `Promise.all(...)` returned from SvelteKit loader (streaming) | `await` everything in the loader | v2.1 (per `+layout.ts:9-12` comment) | Streaming promises surfaced Svelte 5 legacy-mode hydration issues. Awaiting everything is load-bearing. D-01 preserves this policy. |

**Deprecated/outdated:**
- `<svelte:component this={...}>` — functional but no longer idiomatic in runes mode. Prefer `{@const Component = ...}` + `<Component ...>`. `[CITED: Svelte 5 migration guide]`
- `$store` auto-subscription inside runes-mode components — use `fromStore(...)` bridge instead. `[VERIFIED: codebase convention, D-06]`
- `$effect` + microtask-wrapped `$state` writes during hydration — the exact pattern this phase removes.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `$derived`-on-resolved-data pattern (D-01) will unblock the 2 registration E2E tests on first attempt. | Primary recommendation | MEDIUM — if wrong, D-02 wrapper fallback triggers. Cost: one extra plan, no scope creep. The todo explicitly warns 6 approaches have failed; D-01 was NOT among them (all prior attempts kept the `$effect + .then()` shape). |
| A2 | `userData.init(data)` is safe to call without `await tick()` after `$dataRoot.*` writes. | Pattern 1 protected sketch + Pitfall 2 | LOW — verified: `userData.init` is `savedData = data` (synchronous assignment). Risk is confined to downstream components that might depend on DOM flush between the two calls — Pitfall 2 specifies the grep audit to verify. |
| A3 | The `diff-playwright-reports.ts` script authored at SHA `f09daea34` still provides the authoritative parity contract when comparing against the `3c57949c8` baseline. | Standard Stack → Supporting table + Don't Hand-Roll | MEDIUM — per v2.5 narrative, the script was re-run at `3c57949c8` and printed `PARITY GATE: PASS`, so the embedded lists ARE the contract at `3c57949c8`. Planner should verify by reading the current script state + running identity smoke test (`diff script vs baseline vs baseline`) at the Phase 60 start. |
| A4 | `logDebugError` side-effect inside `isValidResult` (called from `$derived`) is benign in practice. | Standard Stack Supporting + Pitfall 1 | LOW — worst case is duplicate log lines during rapid `data` prop changes (e.g., client-side navigation between settings-mutating tests). Pitfall 1 prescribes the mitigation. |
| A5 | The `layoutState` enum should be retained shape-wise (as `$derived` rather than `$state`) instead of collapsing into separate signals. | Primary recommendation | LOW — this is an aesthetic recommendation; CONTEXT.md explicitly places this in Claude's Discretion. Either shape is functionally correct. |
| A6 | Removing `<svelte:component>` in favor of `{@const Component = …}` + `<Component …>` is the correct runes-idiomatic replacement in Svelte 5.53.12. | Pitfall 5 | LOW — `[ASSUMED]` from Svelte 5 migration guide language; not verified against 5.53.12 release notes specifically. Planner should spot-check by running `yarn build` after the inline substitution — the compiler will emit a warning if the older form is now deprecated. |
| A7 | The new D-09 E2E test can reach `/results` via full page load with pre-seeded answers (not via question-flow navigation). | Pattern 4 E2E skeleton | MEDIUM — depends on a seeding helper that is NOT yet written. Voter answers are persisted in localStorage in the current app; a `page.addInitScript(...)` that seeds localStorage should work, but the planner needs to verify the exact key + shape. Alternative: add a temporary test-only query param that accepts serialized answers. |
| A8 | Phase 60 does not need to modify `.planning/config.json` validation settings — the "nyquist_validation" section is enabled by default. | Validation Architecture | LOW — verified: config.json does not set `workflow.nyquist_validation` explicitly; default is enabled. |

---

## Open Questions

1. **Does the `{@const Component = item.component}` runes-idiomatic replacement for `<svelte:component>` actually work for popup components that receive spread props + an `onClose` callback?**
   - What we know: the pattern is idiomatic in Svelte 5 per migration guide.
   - What's unclear: verified behavior with the specific `FeedbackPopup` / `SurveyPopup` component shapes in this codebase.
   - Recommendation: Planner runs a local smoke test after inlining — open a popup via `popupQueue.push({ component: FeedbackPopup, onClose: () => {} })` from a dev tools console and confirm render + close path.

2. **Is the `ready = false; await work; ready = true` "reset before load" idiom on lines 86–88 of current root `+layout.svelte` still needed in the post-refactor shape?**
   - What we know: the reset exists to hide the previous route's content while the new data loads during client-side navigation.
   - What's unclear: `$app/navigation`'s `navigating` store may already provide an equivalent loading signal at layout level.
   - Recommendation: post-refactor, rely on `$derived` synchronous branch computation. If client-side navigation surfaces a flash of stale data, add `const navigating = $derived(page.state?.navigating)` or similar as a follow-up — NOT a Phase 60 blocker.

3. **What is the exact Svelte/SvelteKit upstream issue number (if one exists) for the "`$state` writes in `.then()` from `$effect` don't re-render during hydration" bug?**
   - What we know: search surfaces issues `#15704` (conditional promise rendering breaks hydration), `#13916` ($effect doesn't allow async functions), `#16383` (`$state(await ...)` breaks hydration), `#12999` (data prop reactivity after Svelte 5 migration). None is an exact match.
   - What's unclear: whether an exact-match issue exists. Project todos describe the bug symptom but have not filed a reproduction.
   - Recommendation: per D-04, the planner defers filing to post-phase. RESEARCH does not speculate further.

4. **Does the Supabase-backed `SupabaseAdminClient.updateAppSettings(...)` persist across the full-page-load `page.goto('/results')` in the new D-09 E2E test?**
   - What we know: `updateAppSettings` writes to the `app_settings` Postgres table; `+layout.ts` reads from the same source via `dataProvider.getAppSettings()`.
   - What's unclear: E2E isolation — does the `beforeAll`-set settings persist at least through all tests in the describe block, including a fresh context `page.goto(...)`?
   - Recommendation: verified indirectly by existing VOTE-15/16 tests, which do exactly this. Planner should proceed; if the test flakes, look at `voter-popups.spec.ts` for the known interference-suppression `suppressInterferingPopups` pattern.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | All | ✓ | >=22 (per `package.json engine`) | — |
| Yarn 4 | Build/test orchestration | ✓ | 4.13 | — |
| Svelte compiler | Build | ✓ | 5.53.12 | — |
| @sveltejs/kit | Build + loader types | ✓ | 2.55.0 | — |
| @playwright/test | E2E | ✓ | 1.58.2 | — |
| Supabase local stack | E2E (auth, settings persistence) | ✓ | CLI-managed | — |
| `diff-playwright-reports.ts` | Parity gate | ✓ | Phase 59-03 artifact | — — Planner confirms baseline test lists are current as of `3c57949c8`; re-embed if drift detected. |
| Git SHA `3c57949c8` (baseline commit) | Parity comparison reference | ✓ | Reachable in git history | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | @playwright/test 1.58.2 (E2E, primary gate) + Vitest (unit, secondary — but D-13 says hydration is only reachable via E2E, so unit tests do not validate the LAYOUT-02 success criterion) |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn playwright test specs/candidate/candidate-registration.spec.ts --workers=1` (targeted at the 2 direct blocked tests) |
| Full suite command | `yarn playwright test --workers=1` (deterministic capture for parity gate) |
| Parity diff command | `tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts <baseline.json> <post-change.json>` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-01 | Root layout uses `$props` / `$derived` / `{@render children}` — no `$:`, `export let`, or `<slot />` | Static (lint) | `yarn workspace @openvaa/frontend check` (svelte-check) + manual grep `grep -nE '(export let\|<slot \/>\|^[[:space:]]*\$:)' apps/frontend/src/routes/+layout.svelte` | ✅ tooling; ❌ no automated regression for this specific shape — planner may add a lint rule or accept manual check |
| LAYOUT-02 | Fresh candidate reaches dashboard after full page load; 2 blocked E2E tests pass | E2E | `yarn playwright test specs/candidate/candidate-registration.spec.ts specs/candidate/candidate-profile.spec.ts --workers=1` | ✅ (tests exist; currently failing — they ARE the gate) |
| LAYOUT-03 (removal path) | Popup renders on full page load without `PopupRenderer` wrapper | E2E | New test: `yarn playwright test specs/voter/voter-popup-hydration.spec.ts --workers=1` (file to be created per D-09) | ❌ Wave 0 — planner creates |
| LAYOUT-03 (retention path) | `PopupRenderer.svelte` contains rationale comment naming upstream issue | Static | Grep: `grep -n 'upstream Svelte' apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` | ❌ Only applies if retention branch taken at execution time |
| SC-4 Regression baseline | No PASS_LOCKED test regresses; data-race pool does not grow | E2E + diff | `yarn playwright test --workers=1 --reporter=json > post-change.json && tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts <baseline.json> post-change.json` | ✅ (script + baseline exist) |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend check` (Svelte type + lint) — fast (<30s).
- **Per wave merge:** `yarn playwright test specs/candidate/candidate-registration.spec.ts specs/candidate/candidate-profile.spec.ts --workers=1` (target the 2 direct blocked tests — ~90s including setup).
- **Phase gate:** Full suite green + parity diff PASS vs `3c57949c8` baseline before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/tests/specs/voter/voter-popup-hydration.spec.ts` (or equivalent describe block added to `voter-popups.spec.ts`) — covers D-09 / LAYOUT-03 removal-path validation. Planner designs the seeding helper (see Open Question 4).
- [ ] Verify + re-embed (if needed) `diff-playwright-reports.ts` baseline test lists against `3c57949c8` — at the start of Phase 60, run the identity smoke test (baseline vs baseline) to confirm `PARITY GATE: PASS` prints.
- [ ] Optional: add a tiny lint rule or a CI grep step to enforce SC-1 (no `export let` / `$:` / `<slot />` in `+layout.svelte`). Not required for the phase but cheap insurance against regression.

---

## Project Constraints (from CLAUDE.md)

- **TypeScript strictly** — avoid `any`, prefer explicit types. `[CITED: CLAUDE.md §Important Implementation Notes]` — the `let { data }: { data: any; children: Snippet }` type annotation in current protected `+layout.svelte` line 26 is sloppy; the refactor should use `LayoutData` / `ProtectedLayoutData` from `./$types`.
- **Test accessibility** — WCAG 2.1 AA compliant. No change in this phase.
- **Localization** — all user-facing strings multi-locale. `<ErrorMessage>`, `<Loading>`, `TermsOfUseForm` already use `t(...)` — preserved by the refactor.
- **Never commit sensitive data** — N/A.
- **Use matching MISSING_VALUE** — N/A for this phase.
- **Code review checklist** — `/.agents/code-review-checklist.md` referenced; planner should run checklist during final verification.
- **Feature-specific:** No new features — strict bug-fix + migration-cleanup scope per REQUIREMENTS.md.

Commits in this repo must use `git -c core.hooksPath=/dev/null` per MEMORY.md `project_gsd_repo_hook_workaround.md` until global config is fixed.

---

## Sources

### Primary (HIGH confidence)
- **Codebase reads (all verified):**
  - `apps/frontend/src/routes/+layout.svelte` (current root layout — 209 lines)
  - `apps/frontend/src/routes/+layout.ts` (current root loader — awaits everything; comment on lines 9–12)
  - `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (current protected layout — 131 lines)
  - `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` (current protected loader — awaits everything)
  - `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` (24 lines — pattern existence proof)
  - `apps/frontend/src/lib/components/popupRenderer/index.ts` (1-line barrel)
  - `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` (context source of the 4 bridged stores)
  - `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts` (popup store — already `$state` + `$derived` + `toStore`)
  - `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts` (userData.init is synchronous assignment)
  - `apps/frontend/src/lib/api/utils/isValidResult.ts` (validation helper + `logDebugError` side-effect)
  - `apps/frontend/src/lib/admin/utils/loadElectionData.ts` (canonical `dataRoot.update(() => { provide*(…) })` pattern)
  - `apps/frontend/src/routes/admin/+layout.svelte` (runes-mode layout reference pattern)
  - `apps/frontend/svelte.config.js` (global runes mode confirmed — `compilerOptions.runes: true` + `dynamicCompileOptions` for node_modules)
  - `tests/tests/specs/voter/voter-popups.spec.ts` (E2E analog for D-09)
  - `tests/tests/specs/candidate/candidate-registration.spec.ts` (blocked test, line 64)
  - `tests/tests/specs/candidate/candidate-profile.spec.ts` (blocked test, line 51)
  - `.planning/PROJECT.md` (history of v2.1/v2.4 decisions)
  - `.planning/STATE.md` (deferred items, carry-forward baseline)
  - `.planning/REQUIREMENTS.md` (LAYOUT-01/02/03 text)
  - `.planning/ROADMAP.md` (Phase 60 goal + SC 1–4)
  - `.planning/phases/60-layout-runes-migration-hydration-fix/60-CONTEXT.md` (locked decisions)
  - `.planning/phases/60-layout-runes-migration-hydration-fix/60-DISCUSSION-LOG.md` (alternatives considered)
  - `.planning/todos/pending/root-layout-runes-migration.md` (6 approaches tried)
  - `.planning/todos/pending/svelte5-hydration-effect-then-bug.md` (blocked tests + PopupRenderer pattern details)
  - `.planning/milestones/v2.1-phases/40-41-e2e-test-stabilization/40-41-SUMMARY.md` (v2.1 origin of the `layoutState` enum + `PopupRenderer` workarounds)
  - Git commit `5b449ab73` (diff-playwright-reports.ts parity gate script) + commit `3c57949c8` (post-v2.5 baseline)
  - `.yarnrc.yml` (Svelte 5.53.12, @sveltejs/kit 2.55.0 — dependency versions)
  - `.planning/config.json` (validation defaults)

### Secondary (MEDIUM confidence)
- [Svelte 5 `$effect` docs](https://svelte.dev/docs/svelte/$effect) — confirms effects run in a microtask after state changes + do not execute during SSR. Does NOT explicitly document the hydration race with `.then()`.
- [Svelte 5 `$derived` docs](https://svelte.dev/docs/svelte/$derived) — confirms "expression inside `$derived(...)` should be free of side-effects"; informs Pitfall 1.
- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) — informs runes-idiomatic replacement for `<svelte:component>`.
- [SvelteKit Loading data docs](https://svelte.dev/docs/kit/load) — confirms loader serialization into hydration payload.
- [htmlallthethings.com — Understanding Svelte 5 Runes: $derived vs $effect](https://www.htmlallthethings.com/blog-posts/understanding-svelte-5-runes-derived-vs-effect) — community consensus on "90% $derived / 10% $effect" split.

### Tertiary (LOW confidence, flagged for validation)
- [Svelte issue #15704 — Conditional promise rendering breaks hydration](https://github.com/sveltejs/svelte/issues/15704) — related but not an exact-match reproduction of the `$state` + microtask + hydration bug described in the todos.
- [Svelte issue #16383 — `$state(await ...)` causes component hydration failures](https://github.com/sveltejs/svelte/issues/16383) — related.
- [Svelte issue #13916 — `$effect` does not accept async function](https://github.com/sveltejs/svelte/issues/13916) — related documentation of effect + async interaction limits.
- [SvelteKit issue #12999 — data prop reactivity after Svelte 5 migration](https://github.com/sveltejs/kit/issues/12999) — confirms the community's `let value = $state(data.value); $effect(() => value = data.value)` escape-hatch pattern (adjacent to but not the same as the Phase 60 bug).

---

## Metadata

**Confidence breakdown:**
- Primary strategy (D-01 `$derived` refactor): HIGH — codebase inspection confirms loaders `await` everything, so the `$effect + .then()` is verifiable dead weight; replacement shape is straightforward.
- Fallback strategy (D-02 wrapper): HIGH — existence proof in `PopupRenderer` is in-repo.
- PopupRenderer empirical removal: MEDIUM — direct inline is architecturally viable now that root is runes-mode, but the actual behavioral test only happens at execution time (D-08 is the decision point).
- Parity gate tooling: HIGH — fully specified by Phase 59-03 commit + baseline data.
- Upstream Svelte 5 issue attribution: LOW — no exact-match issue located in a ~5 search query pass; 4 closely-adjacent issues documented but none is the specific "`$state` in `.then()` from `$effect` not flagging re-render during post-hydration first flush" bug.
- E2E for setTimeout-popup full-page-load (D-09): MEDIUM — pattern exists in `voter-popups.spec.ts`, but the new test requires a seeding path to reach `/results` without the question flow; planner designs this helper.

**Research date:** 2026-04-24
**Valid until:** 2026-05-08 (14 days — this is stable ecosystem territory; Svelte 5 hydration bugs unlikely to materially shift in two weeks, and the local codebase is frozen on the branch).

---

## RESEARCH COMPLETE

**Phase:** 60 - Layout Runes Migration & Hydration Fix
**Confidence:** HIGH (core refactor shape, primary sources) / MEDIUM (upstream attribution, D-09 seeding helper design)

### Key Findings

- **The bug is a microtask boundary, not a missing primitive.** Loaders already `await` everything; the `.then()` inside `$effect` is purely ceremonial and is the sole source of the hydration race. Replacing `$effect + Promise.all(...).then(...)` with a `$derived` validation + a separate `$effect` for `$dataRoot` writes removes the race entirely without introducing any new abstraction.
- **Root layout is already syntactically SC-1 compliant** (`$props`, `$effect`, `{@render children()}`; no `<slot />`, no `$:`, no `export let`). Global runes mode is on (`compilerOptions.runes: true`). LAYOUT-01 is essentially only the hydration refactor per D-05, not a greenfield rewrite.
- **`PopupRenderer` rationale may be obsolete.** It was introduced in v2.1 when the root layout was still in legacy mode. Since v2.4 removed all per-file opt-ins and made root layout runes-mode, a runes component reading `popupQueue` via `fromStore(...)` inline in the root has the same reactivity guarantees as the `PopupRenderer` wrapper. D-08 empirical removal is now architecturally low-risk.
- **`await tick()` in protected layout is defensive deadweight.** `userData.init(data)` is a synchronous assignment (`savedData = data`) with no DOM-flush dependency — the `tick()` was a v2.1 firefight artifact and can be dropped.
- **Parity gate tooling already exists.** `scripts/diff-playwright-reports.ts` from Phase 59-03 encodes the PASS_LOCKED / CASCADE / DATA_RACE delta rule, explicitly allowing `CASCADE → pass` transitions (which is exactly what Phase 60 is expected to produce). Planner re-verifies baseline list embedding is still authoritative for SHA `3c57949c8`.

### File Created
`.planning/phases/60-layout-runes-migration-hydration-fix/60-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All dependencies already in project; versions verified against `.yarnrc.yml` |
| Architecture (`$derived` refactor shape) | HIGH | Primary pattern verified against current file structure + admin layout as reference; minimal sketches for both root and protected layouts included. |
| Pitfalls | HIGH | 5 concrete pitfalls documented, each with detection + mitigation. |
| Upstream bug attribution (D-04) | LOW | No exact-match Svelte 5 issue located; 4 closely-adjacent issues documented as Secondary sources but none is the specific bug. Per CONTEXT.md D-04, filing happens post-phase anyway — this is OK. |
| D-09 E2E seeding helper design | MEDIUM | Pattern exists (`voter-popups.spec.ts`), but the seeding path to `/results` via full page load (bypassing the voter question flow) requires a helper the planner designs. Options outlined in Open Question 4. |

### Open Questions

1. Runes-idiomatic replacement for `<svelte:component>` in popup inline — needs smoke test after inlining.
2. Is `ready = false; await; ready = true` reset-before-load idiom still needed after `$derived` refactor? — Recommendation: drop, re-add via `navigating` store only if visible flash appears.
3. Exact Svelte/SvelteKit upstream issue number for the bug — none located; per D-04 planner defers filing.
4. D-09 E2E seeding path to `/results` via full page load — planner designs the helper (localStorage seed via `page.addInitScript`, query param, or dedicated admin-API call).

### Ready for Planning

Research complete. Planner can now create PLAN.md files. Recommended plan split:

1. **Plan 60-01** — Root `+layout.svelte` `$derived` refactor (LAYOUT-01 + D-05).
2. **Plan 60-02** — Protected `(protected)/+layout.svelte` `$derived` refactor (LAYOUT-02 + drop `await tick()`).
3. **Plan 60-03** — D-08 empirical PopupRenderer removal attempt + D-09 new E2E test (LAYOUT-03).
4. **Plan 60-04** — Parity gate verification vs SHA `3c57949c8` (full suite, `--workers=1`, diff script).
5. (Implicit post-phase, NOT a Plan 60-0X) — D-04 upstream issue filing with reproduction from the phase.

Planner has full discretion on merging/splitting these; the phase is small and could be 2 plans (01+02, 03+04) or 4 plans as above. Risk-isolation favors the 4-plan split; delivery speed favors 2 plans. Per CONTEXT.md Claude's Discretion: executor picks.
