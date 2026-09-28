# Phase 60: Layout Runes Migration & Hydration Fix - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Milestone:** v2.6 Svelte 5 Migration Cleanup

<domain>
## Phase Boundary

Close out the Svelte 5 layout migration debt by fixing the `$effect + Promise.all(...).then(...)` hydration reactivity bug in both the root layout and the candidate protected layout, and deciding the fate of the `PopupRenderer` runes-mode workaround.

Scope covers LAYOUT-01 (root `+layout.svelte` runes-idiomatic), LAYOUT-02 (protected `+layout.svelte` renders post-hydration on full page loads), and LAYOUT-03 (`PopupRenderer` removed or retained with documented rationale). Success measured by the 2 direct registration E2E tests (`candidate-registration.spec.ts:64`, `candidate-profile.spec.ts:51`) unblocking without workarounds, and the Playwright parity gate holding against the post-v2.5 baseline on SHA `3c57949c8`.

Out of scope for this phase: voter-app question flow (Phase 61), results-page consolidation (Phase 62), broader E2E carry-forward greening (Phase 63), `fromStore()` / `toStore()` bridge retirement, centralized overlay architecture, analytics-setup extraction, and `$effect`-block consolidation.

</domain>

<decisions>
## Implementation Decisions

### Hydration Fix Strategy (LAYOUT-02)

- **D-01:** Primary strategy is `$derived` on already-resolved loader data. Both `+layout.ts` and `+layout.server.ts` already `await` every piece of data before returning, so the `.then()` callback in `+layout.svelte` runs on resolved values — pure ceremony that creates a hydration-unsafe microtask. Drop the `Promise.all(...).then(...)` pattern entirely; compute `error` / `ready` / `underMaintenance` (and the protected layout's `layoutState`) via `$derived` from the already-resolved `data` prop. Do `$dataRoot` mutations in a separate `$effect` that reads the `$derived` values — no `.then()` in the critical path.
- **D-02:** Fallback if the `$derived` approach does not unblock the registration tests: adopt the wrapper-component pattern modelled on `PopupRenderer` — a runes-mode child component that owns the loading/validation surface via `onMount` + manual `.subscribe()` (for stores) or direct `$props()` (for loader data). This pattern has an existence proof in the codebase.
- **D-03:** Validation pattern — split concerns. Pure validation (`isValidResult` checks, `underMaintenance` flag derivation, error messaging) lives in `$derived` computations. Side-effects (`dataRoot.current.provideElectionData(...)`, `dataRoot.current.provideConstituencyData(...)`, `provideQuestionData(...)`, `provideEntityData(...)`, `provideNominationData(...)`, `userData.init(...)`) live in a separate `$effect` that reads the `$derived` values. No microtasks on the critical render path.
- **D-04:** Upstream Svelte 5 bug filing happens **after** Phase 60 completes, regardless of whether we find a clean fix. Rationale: we'll have maximum context to write a well-scoped reproduction (either "we worked around it like this" or "we couldn't work around it"). REQUIREMENTS.md §Out of Scope authorizes shipping the best-available workaround if no clean in-userland fix exists.

### Root-Layout Scope (LAYOUT-01)

- **D-05:** Apply the same `$derived` hydration refactor to root `+layout.svelte` (lines 78–93). The file passes SC-1 syntactically today (already uses `$props`, `$state`, `$effect`, `{@render children()}`; no `<slot />`, no `$:`, no `export let`), but the same latent bug shape exists on root. Using one idiom across both layouts is the consistency goal.
- **D-06:** **Defer** `fromStore()` bridge retirement to post-v2.6. Root `+layout.svelte` has 4 `fromStore()` bridges (`appSettings`, `dataRoot`, `openFeedbackModal`, `sendTrackingEvent` — lines 64–67), and the `lib/contexts/app/` modules (`appContext.svelte.ts`, `survey.svelte.ts`, `getRoute.svelte.ts`) contain additional `toStore()` / `fromStore()` usages. Retirement cascades into the context architecture and is tracked as its own PROJECT.md Future item. Phase 60 stays focused on the hydration bug + syntactic SC-1 compliance.
- **D-07:** **No additional root-layout cleanup** beyond the hydration refactor. `$effect`-block consolidation, analytics-setup extraction to a dedicated module, and other housekeeping stay out of scope.

### PopupRenderer Fate (LAYOUT-03)

- **D-08:** Attempt empirical removal of `PopupRenderer`. Execution order: (1) apply root-layout `$derived` refactor → (2) inline popup rendering into root via `fromStore(popupQueue)` + `{#if ...}` → (3) run the new setTimeout-popup E2E test (D-09) with `PopupRenderer` deleted → (4a) if passes: deletion sticks; (4b) if fails: restore `PopupRenderer` and add an in-code rationale per D-10. Single decision point during execution — no speculative planning of both branches.
- **D-09:** Add a dedicated Playwright E2E test for `setTimeout`-triggered popup rendering on a full page load. Current coverage is implicit only (feedback modal touches popup infra indirectly); a targeted test validates the removal attempt AND locks in regression protection for the reactivity path.
- **D-10:** If `PopupRenderer` is retained, the in-code rationale comment must name: (1) the specific Svelte 5 limitation (e.g., "store `.set()` from `setTimeout` not tracked by `$derived` in root-layout context"), (2) a pointer to the minimum reproduction (test file + line) or the upstream issue filed in D-04, and (3) the conditions under which removal would become viable (e.g., "retry removal once upstream Svelte issue #NNN is fixed"). SC-3's "documented rationale that names the upstream Svelte 5 limitation" is the minimum bar; D-10 is the expanded form.

### Regression-Verification Strategy

- **D-11:** Primary regression gate is the Playwright parity gate against the post-v2.5 baseline on SHA `3c57949c8` (10 data-race + 38 cascade failures out of 89 total). Same methodology as Plan 59-04: deterministic capture with `--workers=1`; delta rule — pass-set must grow by at least the 2 direct registration tests, cascade-set may flip to pass, data-race pool may shift within itself but may not grow.
- **D-12:** Pre-existing 10 data-race + 38 cascade carry-forward failures are **not** Phase 60's problem. Hold the line via the parity gate; any cascade tests that pass as a side effect of the LAYOUT-02 fix (the ~35 expected to unblock) are tracked and welcomed, but no active greening work. Real greening work is Phase 63 (E2E-01).
- **D-13:** Unit-test coverage stays at the integration level (E2E). The bug only manifests in SSR + hydration paths, which Playwright's full page load reproduces. Vitest unit tests of `$derived` / `$effect` in isolation cannot reproduce hydration — E2E is the right level. Adds: the new setTimeout-popup E2E (D-09); the already-existing failing registration E2E tests serve as the LAYOUT-02 unblocking gate.
- **D-14:** LAYOUT-03 (PopupRenderer removal vs retention) is validated empirically during execution — single decision point as specified in D-08. No parallel contingent plans; no speculative removal before the refactor lands.

### Claude's Discretion

- Exact order of plans within the phase (e.g., does the root `$derived` refactor ship as a separate plan from the protected-layout fix, or as one plan?). Planner decides based on risk surface.
- Specific shape of the E2E test for setTimeout-popup rendering (D-09). Leverage existing test helpers / fixture patterns.
- Whether the protected layout keeps its existing `layoutState` enum as the `$derived` value type, or collapses it into separate `$derived` signals. The enum was a v2.1 workaround for multiple-writes-in-`.then()`; post-refactor it may no longer be necessary, but it may still be the cleanest representation. Executor picks.
- Exact file placement for any new runes-mode subcomponent if the wrapper fallback (D-02) is invoked.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements

- `.planning/ROADMAP.md` §Phase 60 — Goal, Depends on, Requirements (LAYOUT-01/02/03), Success Criteria 1-4
- `.planning/REQUIREMENTS.md` §LAYOUT — requirement text for LAYOUT-01/02/03; §Out of Scope (authorizes upstream filing + workaround)
- `.planning/PROJECT.md` §Key Decisions — v2.1 rows "Single layoutState enum over separate $state vars" and "PopupRenderer runes-mode wrapper" (these are the workarounds we're replacing / validating for removal)
- `.planning/STATE.md` §Deferred Items — pending todos flagged Active in v2.6 Phase 60
- `.planning/PROJECT.md` Future — "retire toStore/fromStore bridges" (explicitly deferred per D-06)

### Bug Context & Prior Investigation

- `.planning/todos/pending/root-layout-runes-migration.md` — root + protected-layout migration scope; 6 approaches already tried that don't work
- `.planning/todos/pending/svelte5-hydration-effect-then-bug.md` — 2 direct blocked tests + 35 cascade; prior approaches tried; PopupRenderer pattern description

### Target Files

- `apps/frontend/src/routes/+layout.svelte` — root layout (target of LAYOUT-01 refactor; `$effect + Promise.all(...).then(...)` pattern on lines 78–93)
- `apps/frontend/src/routes/+layout.ts` — root loader (already `await`s everything; see comment on lines 9–12 citing Svelte 5 hydration as the reason)
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` — protected layout (target of LAYOUT-02 fix; existing single `layoutState` enum is v2.1 workaround, insufficient on its own)
- `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` — protected loader (also `await`s everything)
- `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` — LAYOUT-03 target; uses `fromStore(popupQueue)` + `$derived` + `<svelte:component>` pattern
- `apps/frontend/src/lib/components/popupRenderer/index.ts` — barrel export
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — source of the 4 `fromStore()`'d stores in root; contains the `toStore()` bridges whose retirement is deferred

### E2E Surfaces

- `apps/frontend/tests/tests/candidate-registration.spec.ts:64` — blocked test: "should complete registration via email link"
- `apps/frontend/tests/tests/candidate-profile.spec.ts:51` — blocked test: "should register the fresh candidate via email link"
- Playwright parity baseline: post-v2.5 on SHA `3c57949c8` — 41 pass / 10 data-race / 38 cascade = 89 total (see STATE.md + v2.5 Plan 59-04/05 artifacts)
- Playwright parity gate tooling: same pattern used in v2.5 (deterministic `--workers=1` capture + delta-rule comparison)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`isValidResult` helper** (`apps/frontend/src/lib/api/utils/isValidResult`) — reusable in `$derived`-based validation. Already handles the `allowEmpty` distinction between settings/customization and election/constituency data.
- **`fromStore` / `toStore` bridges** (`svelte/store`) — accepted interim pattern; we do NOT retire them in Phase 60. Keep using where store access is needed from runes-mode components.
- **`PopupRenderer` component** (`apps/frontend/src/lib/components/popupRenderer/`) — proven runes-mode wrapper pattern. Serves as the model for the wrapper-component fallback (D-02) even if the component itself is removed per D-08.
- **Single `layoutState` enum pattern** (v2.1 decision) — already applied in protected `+layout.svelte`. May persist alongside the `$derived` refactor as a clean state representation, OR be collapsed into separate `$derived` signals if cleaner. Executor picks.

### Established Patterns

- **Loader-always-awaits:** both `+layout.ts` and `+layout.server.ts` explicitly `await` every piece of data before returning. The comment on `+layout.ts:9-12` cites Svelte 5 hydration as the reason. This policy is **preserved** — the bug is NOT the lack of streaming, it's the redundant `.then()` on the client side.
- **Context initialization at script top:** `initI18nContext()`, `initComponentContext()`, `initDataContext()`, `initAppContext()`, `initLayoutContext()`, `initAuthContext()` all run synchronously at the top of the root `+layout.svelte` script. This is load-bearing for downstream components; leave untouched.
- **Store-to-runes bridges:** pattern currently used for cross-layer reactivity. `fromStore(storeName)` exposes `.current` (readable as `$state`). Accepted idiom until bridge-retirement milestone.
- **Parity-gate methodology** (v2.5): deterministic Playwright capture with `--workers=1`, compared against captured baseline via delta rule. Phase 60 reuses this tooling; does not invent new gating.

### Integration Points

- **`$dataRoot` mutations** (`dataRoot.current.provideElectionData`, `provideConstituencyData`, `provideQuestionData`, `provideEntityData`, `provideNominationData`) — side-effect target. After refactor, these move out of the `.then()` path and into a dedicated `$effect` that reads `$derived` validity flags.
- **`openFeedbackModal` ref binding** — currently set inside an `$effect` without `.then()` (lines 159–161); leave as-is.
- **Analytics wiring** (`umamiRef`, `sendTrackingEventStore.set(...)`, `visibilitychange` handler) — currently in its own `$effect`s, not on the data-loading path; leave as-is.
- **Protected-layout `$dataRoot` + `userData.init()`** — current code uses `await tick()` between `$dataRoot.*` writes and `userData.init(...)`. Evaluate whether this ordering still matters after the refactor; if not, drop the `tick()`.

</code_context>

<specifics>
## Specific Ideas

- **Leverage the already-awaited loader:** the single biggest scout insight is that both loaders `await` every piece of data before returning. The `Promise.all(...).then(...)` in `.svelte` is ceremony on resolved values. This is what enables the `$derived`-based primary strategy (D-01) rather than requiring the heavier wrapper-component pattern.
- **E2E-first validation for hydration:** no unit test of `$derived` / `$effect` in isolation can reproduce the SSR + hydration race. The 2 currently-failing registration E2E tests + the new setTimeout-popup E2E (D-09) together form the functional gate.
- **Parity gate methodology reuse:** the deterministic `--workers=1` capture + delta-rule comparison used for v2.5 is the reference. No new tooling needed.
- **v2.1 decisions are guardrails, not ceiling:** the v2.1 "Single `layoutState` enum" and "`PopupRenderer` runes-mode wrapper" decisions were workarounds. Phase 60 is authorized to retire either if the `$derived` refactor makes them unnecessary — the empirical check (D-08) for PopupRenderer is the concrete form.

</specifics>

<deferred>
## Deferred Ideas

- **Centralized overlay handling.** Product direction captured from discussion: "ultimately we want to handle all overlays centrally" — one component/context handles popups, modals, drawers, feedback dialogs, etc. Phase 60 only does the narrow PopupRenderer removal empirical check. A future milestone owns the broader overlay architecture rethink (candidate: post-v2.6, dedicated phase).
- **`fromStore()` / `toStore()` bridge retirement.** PROJECT.md Future lists "retire toStore/fromStore bridges" as separate work. Touches `lib/contexts/app/appContext.svelte.ts`, `survey.svelte.ts`, `getRoute.svelte.ts`, and cascades to consumer components. Dedicated refactor milestone, not Phase 60.
- **`$effect` block consolidation in root `+layout.svelte`.** 4 separate `$effect` blocks (data-load, error-log, analytics-ref, visibility-handler) could theoretically be reduced but gain is low. Not Phase 60.
- **Analytics setup extraction.** Umami ref binding + `visibilitychange` handler + `submitAllEvents` in root could move to a dedicated analytics context/module. Housekeeping, not Phase 60.
- **Proactive Svelte 5 upstream bug filing before execution.** D-04 explicitly sequences the filing after Phase 60 completes so the reproduction context is maximal.
- **Parallel contingent plans for PopupRenderer removal vs retention.** Considered and rejected in D-14 — single empirical decision point during execution is simpler.

### Reviewed Todos (not folded)

None — the two pending todos directly relevant to Phase 60 (`root-layout-runes-migration.md`, `svelte5-hydration-effect-then-bug.md`) are already in scope via the LAYOUT-01/02/03 requirement mapping; no additional pending todos matched Phase 60.

</deferred>

---

*Phase: 60-layout-runes-migration-hydration-fix*
*Context gathered: 2026-04-24*
