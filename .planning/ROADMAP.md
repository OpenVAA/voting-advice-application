# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- ✅ **v2.6 Svelte 5 Migration Cleanup** — Phases 60-64 (shipped 2026-04-28)
- ✅ **v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends** — Phases 65-68 (shipped 2026-05-08)
- ✅ **v2.8 Alliance Card + Frontend Hygiene Sweep** — Phases 69-72 (shipped 2026-05-10)
- ✅ **v2.9 E2E Coverage + Suite Determinism** — Phases 73-78 (shipped 2026-05-12)
- ✅ **v2.10 Test Reliability + A11y Compliance + All-Green Suite** — Phases 79-94 (shipped 2026-06-04)
- 🚧 **v2.11 Svelte 5 Runes Migration + View Transitions** — Phases 95-101 (in progress)

See `.planning/MILESTONES.md` for cumulative history and `.planning/milestones/` for archived roadmaps + requirements.

## Phases

<details>
<summary>✅ v2.5 Dev Data Seeding Toolkit (Phases 56-59) — SHIPPED 2026-04-24</summary>

- [x] Phase 56: Generator Foundations & Plumbing (10/10 plans) — completed 2026-04-23
- [x] Phase 57: Latent-Factor Answer Model (7/7 plans) — completed 2026-04-23
- [x] Phase 58: Templates, CLI & Default Dataset (10/10 plans) — completed 2026-04-23
- [x] Phase 59: E2E Fixture Migration (7/7 plans) — completed 2026-04-24

Full details: `.planning/milestones/v2.5-ROADMAP.md`

</details>

<details>
<summary>✅ v2.6 Svelte 5 Migration Cleanup (Phases 60-64) — SHIPPED 2026-04-28</summary>

- [x] Phase 60: Layout Runes Migration & Hydration Fix (5/5 plans) — completed 2026-04-24
- [x] Phase 61: Voter-App Question Flow (3/3 plans) — completed 2026-04-25
- [x] Phase 62: Results Page Consolidation (3/3 plans) — completed 2026-04-26
- [x] Phase 63: E2E Template Extension & Greening (3/3 plans) — completed 2026-04-27
- [x] Phase 64: Voter Results Reactivity Completion (Phase 62-bis) (4/4 plans) — completed 2026-04-28

Full details: `.planning/milestones/v2.6-ROADMAP.md`

</details>

<details>
<summary>✅ v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (Phases 65-68) — SHIPPED 2026-05-08</summary>

- [x] Phase 65: Svelte 5 Audit Sweeps (3/3 plans) — completed 2026-04-29
- [x] Phase 66: Adapter Type Cleanup (1/1 plan) — completed 2026-04-29
- [x] Phase 67: Default Seed Alliances (2/2 plans) — completed 2026-04-30
- [x] Phase 68: Dev-Tooling Trio (3/3 plans) — completed 2026-05-08 _(95 pre-existing frontend lint errors deferred per Option C)_

Full details: `.planning/milestones/v2.7-ROADMAP.md`
Audit: `.planning/milestones/v2.7-MILESTONE-AUDIT.md` (status: tech_debt — 8/8 reqs wired; 3 documented deferrals)

</details>

<details>
<summary>✅ v2.8 Alliance Card + Frontend Hygiene Sweep (Phases 69-72) — SHIPPED 2026-05-10</summary>

- [x] Phase 69: Alliance Card Lane A (2/2 plans) — completed 2026-05-09
- [x] Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup (5/5 plans) — completed 2026-05-09
- [x] Phase 71: Frontend Strict-Typing Cleanup (3/3 plans) — completed 2026-05-09
- [x] Phase 72: Package Hygiene Trio (3/3 plans) — completed 2026-05-09

Full details: `.planning/milestones/v2.8-ROADMAP.md`
Audit: `.planning/milestones/v2.8-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ v2.9 E2E Coverage + Suite Determinism (Phases 73-78) — SHIPPED 2026-05-12</summary>

- [x] Phase 73: Determinism Baseline (6/6 plans) — completed 2026-05-11
- [x] Phase 74: High-Leverage E2E Coverage (7/7 plans) — completed 2026-05-11
- [x] Phase 75: Question-Rendering Specs (3/3 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; multi-choice deferred)_
- [x] Phase 76: Profile + A11y (4/4 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; PRODUCT-GAP cells + axe cite-and-fix routed to v2.10)_
- [x] Phase 77: Settings Matrix + Question-Customization Gap-Fills (5/5 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; 4 PRODUCT-GAP follow-ups; cold-start gate deferred)_
- [x] Phase 78: Cleanup Hygiene Phase (7/7 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; CLEAN-05 inherited candidate-profile race routed to v2.10; constants regen DEFERRED)_

Full details: `.planning/milestones/v2.9-ROADMAP.md`
Audit: `.planning/milestones/v2.9-MILESTONE-AUDIT.md` (status: tech_debt — 24/24 reqs satisfied; 12 PASS + 12 PASS-WITH-DEFERRAL; 8 v2.10+ candidate todos filed)

</details>

<details>
<summary>✅ v2.10 Test Reliability + A11y Compliance + All-Green Suite (Phases 79-94) — SHIPPED 2026-06-04</summary>

**Goal:** Restore Playwright parity-regen capability + reach WCAG 2.1 AA on the axe-baselined routes + drive the E2E suite to all-green, then audit / refactor / reorganise the entire E2E catalog into a clean, typechecked, deterministically-green suite. Final suite: **82 passed / 2 skipped** (human-verified 2026-06-04).

- [x] Phase 79: Determinism Recovery (Cascading-Race Fix + Constants Regen) (4/4 plans) — completed 2026-05-13 _(passed-with-deferral)_
- [x] Phase 80: A11Y Axe Cite-and-Fix (1/1 plan) — completed 2026-05-13
- [x] Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format (1/1 plan) — completed 2026-05-13
- [x] Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty (1/1 plan) — completed 2026-05-13
- [x] Phase 83: Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) (1/1 plan) — completed 2026-05-13
- [x] Phase 84: Imgproxy Decoupling (2/2 plans) — completed 2026-05-14
- [x] Phase 85: Variant-Project Cascade RCA & Fix (4/4 plans) — completed 2026-05-14
- [x] Phase 86: Voter-App FAILURE-CLASS Cleanup (4/4 plans) — completed 2026-05-14
- [x] Phase 86.1: Pre-Phase-87 Convergence Sweep (3/3 plans) — completed 2026-05-19 _(INSERTED)_
- [x] Phase 86.2: E2E Suite Refactor Pass (3/3 plans) — completed 2026-05-20 _(INSERTED)_
- [x] Phase 86.3: Implement Skipped Tests (5/5 plans) — completed 2026-05-21 _(INSERTED)_
- [x] Phase 87: v2.10 All-Green Milestone-Close Anchor (1/1 plan) — completed 2026-05-21 _(PASSED-WITH-DEFERRAL)_
- [x] Phase 88: E2E Test Catalog Audit + Forward-Looking Baseline (4/4 plans) — completed 2026-05-28
- [x] Phase 89: Continuing Test Refactoring — New Candidate Journey (5/5 plans) — completed 2026-05-29
- [x] Phase 90: TIR5 Permutations — Missing-Nominations + Localisation (3/3 plans) — completed 2026-05-30 _(Stage-A i18n reversed → v2.11 i18n Stage-B)_
- [x] Phase 91: TIR6 Perm + Edit Test Additions + Visual/Perf/A11y/Bank-Auth (5/5 plans) — completed 2026-05-31
- [x] Phase 92: E2E Test Infrastructure Hardening (typecheck:tests + locator guard) (5/5 plans) — completed 2026-06-01
- [x] Phase 93: Clean Up & Reorganise E2E Tests, Fixtures, Setup, Seed (6/6 plans) — completed 2026-06-03
- [x] Phase 94: Final E2E Suite Polish — De-planning + README Triage (8/8 plans) — completed 2026-06-04

Full details: `.planning/milestones/v2.10-ROADMAP.md`
Audit: `.planning/milestones/v2.10-MILESTONE-AUDIT.md` (status: tech_debt — no blockers; 13/16 formal reqs satisfied + 3 partial documentary; final suite 82 passed / 2 skipped)

</details>

### 🚧 v2.11 Svelte 5 Runes Migration + View Transitions (In Progress)

**Milestone Goal:** Retire every remaining legacy `svelte/store` bridge in the frontend in favor of idiomatic Svelte 5 runes (Domain A — 4 waves), and ship the View Transitions + navigation-a11y fix that closes the perceived "redraw on Q→Q" (Domain B — 2 waves), then re-enable the 2 quarantined `perm-per-app-notifications` E2E tests and prove the full suite stays green against the v2.10 ship baseline.

**Granularity:** fine. **Phases:** 7 (95-101). **Coverage:** 22/22 requirements mapped 1:1. Backed by the `spike-findings-voting-advice-application-gsd` skill (16 browser-verified spikes — production landing map, proven patterns, non-negotiable design constraints).

**Two independent domains:**

- **Domain A** (Phases 95-98) — context rune migration. Strict 4-wave dependency chain: Wave 1 → Wave 2 → Wave 3 → Wave 4.
- **Domain B** (Phases 99-100) — View Transitions + nav-a11y + questions-layout restructure. Additive and **fully independent of Domain A** — schedulable before, after, or in parallel. Internally Wave B depends on Wave A.
- **Final** (Phase 101) — green gate. Depends on ALL prior phases.

**Parallel-execution map (for autonomy):** Domain A and Domain B are independent and can be planned/executed together. Within Domain A, the 4 waves are strictly sequential (each consumes the prior). Within Phase 95, the 5 Tier-1 leaf contexts are internally parallel (6 separate-PR-eligible migrations per the spike inventory — they touch different files). Domain B Wave A (Phase 99) and the whole of Domain A's Wave 1 can run concurrently.

- [x] **Phase 95: Domain A Wave 1 — Tier-1 Leaf Contexts** - appContext (+SSR-gap fix), dataContext, answer stores (+`localStorageState`), overlay registry, popupStore migrated to pure runes (completed 2026-06-04)
- [ ] **Phase 96: Domain A Wave 2 — Tier-2 Bridges** - survey + tracking + voterContext + candidateContext rune-native factories (+`runeSessionStorage`), composing Wave 1
- [ ] **Phase 97: Domain A Wave 3 — getRoute + Consumer Codemod** - rune-native `getRoute` + mechanical rewrite of 280 consumer sites + destructure-trap/AdminNav production-bug fix
- [ ] **Phase 98: Domain A Wave 4 — Cleanup** - delete `persistedState`/`StackedState`, drop `Readable<T>`, zero `svelte/store` imports, ESLint guard
- [x] **Phase 99: Domain B Wave A — View Transitions + Navigation a11y** - `onNavigate` + `startViewTransition` cross-fade, `aria-live` route announcer, `afterNavigate` focus reset, reduced-motion belt-and-braces (completed 2026-06-04)
- [ ] **Phase 100: Domain B Wave B — Questions Layout Restructure** - `/questions` unified-layout-with-empty-leaf + `{#key question.type}` variant remount
- [ ] **Phase 101: Suite Re-enable + Milestone-Close Green Gate** - un-quarantine the 2 `perm-per-app-notifications` tests + full E2E + unit suites green vs v2.10 baseline

## Phase Details

### Phase 95: Domain A Wave 1 — Tier-1 Leaf Contexts

**Goal**: Every Tier-1 leaf context in `lib/contexts/**` (appContext, dataContext, the voter + candidate answer stores, the layout-overlay registry, popupStore) is pure idiomatic Svelte 5 runes — exposing reactive values via getters with zero `svelte/store` import — and the real SSR appSettings-override gap is closed.
**Depends on**: Nothing (first phase of the milestone; independent of Domain B). Foundation for Waves 2-4.
**Parallel-eligible**: Yes — independent of all of Domain B (Phases 99-100). Internally, the 5 leaf-context migrations touch different files and are spike-documented as 6 separate-PR-eligible parallel plans.
**Requirements**: CTX-01, CTX-02, CTX-03, CTX-04, CTX-05
**Success Criteria** (what must be TRUE):

  1. `appContext` has zero `svelte/store` imports; `appSettings`/`appCustomization` DB-override merge happens at `$state` init (server-rendered HTML now carries the override — the SSR gap is closed); `mergeAppSettings` is pure (`{ ...target, ...nonNull }`, no shared-ref mutation) and the effective-settings merge stays reactive on `page.data.appSettingsData` with a reference-equality guard.
  2. `dataContext` has zero `svelte/store` imports; the `writable(dataRoot)` bridge and `get(dataRootStore)` infinite-loop workaround are gone; sequential population (`provideElectionData → … → provideNominationData`) still triggers downstream `$derived` re-evaluation via the version counter, with `untrack()` isolating the write-after-read cycle.
  3. The voter `answerStore` and candidate `candidateUserDataStore` both persist through a single shared `localStorageState<T>(key, default)` helper (versioned `{ version, data }` payload); the three-layer `$state → localStorageWritable → fromStore` bridge is gone at both callsites.
  4. The layout overlay system uses a token-keyed registry + declarative `use*()` consumer API; `StackedState` and the `getLayoutContext(onDestroy)` index-revert plumbing are removed; `$effect` cleanup replaces `onDestroy`; out-of-order mount/unmount no longer corrupts the stack.
  5. `popupStore` is pure runes (queue-shaped Pattern-1 with a `get current()` getter, no `toStore(() => firstItem)` + `subscribe`); the existing E2E suite stays green with no behavior regression.

**Plans**: 5 plans (2 waves)

  - [x] 95-01-PLAN.md — appContext SSR-gap fix + pure mergeAppSettings (CTX-01)
  - [x] 95-02-PLAN.md — dataContext current/instance split, drop writable bridge (CTX-02)
  - [x] 95-03-PLAN.md — answer stores + new localStorageState helper (CTX-03)
  - [x] 95-04-PLAN.md — popupStore queue-shaped Pattern-1 + consumer (CTX-05)
  - [x] 95-05-PLAN.md — layout overlay registry + use*() callsite migration, isolated wave 2 (CTX-04)

### Phase 96: Domain A Wave 2 — Tier-2 Bridges

**Goal**: The Tier-2 secondary bridges (survey, trackingService) and the two orchestrating contexts (voterContext, candidateContext) are rune-native factories that compose the Wave-1 Tier-1 contexts via `getXContext()` and expose their reactive accessors as getters — with a new `sessionStorageState` helper (the spike-scratch `runeSessionStorage`, renamed per K1/D-05) backing `voterContext`'s `firstQuestionId`.
**Depends on**: Phase 95 (Tier-2 contexts consume Tier-1 outputs — `fromStore(appSettings)`, `fromStore(locale)`, etc.; migrating them before Wave 1 would remove a working bridge with nothing to replace it).
**Parallel-eligible**: No within Domain A (strictly after Wave 1). Independent of Domain B — can run concurrently with Phases 99-100.
**Requirements**: CTX-06, CTX-07
**Success Criteria** (what must be TRUE):

  1. `survey` and `trackingService` have zero `svelte/store` imports — no `fromStore`/`toStore` over appSettings / sessionId / userPreferences; their values are exposed via `.current` getters.
  2. `voterContext` and `candidateContext` are rune-native factories composing Tier-1 contexts via `getXContext()` and exposing all 18+/30+ reactive accessors as getters; a new `sessionStorageState` sibling helper backs `voterContext`'s `firstQuestionId`.
  3. The destructure-trap reproduces identically in the rune-native contexts and is preserved per the CLAUDE.md "Context Destructuring Rule" (consumers read reactive accessors via `ctx.X`, never destructured); the existing E2E suite stays green.

**Plans**: 2 plans (2 waves)

Plans:
- [ ] 96-01-PLAN.md — sessionStorageState helper + pure-rune survey/trackingService + appContext reactiveAppSettings/reactiveLocale getters + bridge seam (Wave 1)
- [ ] 96-02-PLAN.md — voterContext + candidateContext rune-native factories (firstQuestionId/prereg ids via session/localStorageState; getRoute bridge kept for Phase 97) (Wave 2)


### Phase 97: Domain A Wave 3 — getRoute + Consumer Codemod

**Goal**: `getRoute` is rune-native, and every consumer site across the frontend (146 `$store.X` template auto-subscribe sites + 134 `$getRoute(opts)` call sites) is mechanically migrated off the store bridges — surfacing and fixing the real AdminNav destructure production bug and the `adminContext` spread-of-context anti-pattern.
**Depends on**: Phases 95 + 96 (the codemod rewrites consumers to `ctx.current.X` / rune-native `getRoute` — those surfaces only exist once all contexts expose getters; running the codemod before then breaks consumers).
**Parallel-eligible**: No within Domain A (strictly after Wave 2). Independent of Domain B.
**Requirements**: CTX-08, CONS-01, CONS-02, CONS-03
**Success Criteria** (what must be TRUE):

  1. `getRoute` is a pure `$derived.by` reading `page.params` / `page.route` / `page.url` as separate fields (never `page` as a single value inside a tracking scope), bypassing the `toStore` short-circuit trap; the custom `afterNavigate` republish workaround is removed and path / query-param / locale navigation all still resolve correctly.
  2. All 146 `$store.X` template auto-subscribe sites across 45 `.svelte` files are rewritten to `ctx.current.X` / local `$derived` aliases via the idempotent dry-run-by-default codemod.
  3. All 134 `$getRoute(opts)` call sites are migrated to the rune-native `getRoute`.
  4. The destructure-trap audit pass fixes the `AdminNav.svelte:33` `isAuthenticated` destructure production bug and the `adminContext.svelte.ts:97` spread-of-context anti-pattern; admin auth-context `$derived` accessors react correctly; the existing E2E suite stays green.

**Plans**: TBD
**UI hint**: yes

### Phase 98: Domain A Wave 4 — Cleanup

**Goal**: The legacy store-bridge scaffolding is fully removed — `persistedState` and `StackedState` deleted, `Readable<T>` dropped from the relevant type files, and zero `svelte/store` imports remain anywhere in `lib/contexts/**` or `routes/**` — guarded against reintroduction by an ESLint rule.
**Depends on**: Phase 97 (the last callers of `persistedState`/`StackedState` are removed mid-Wave-3; premature deletion breaks the build).
**Parallel-eligible**: No within Domain A (strictly after Wave 3). Independent of Domain B.
**Requirements**: CLEAN-01, CLEAN-02
**Success Criteria** (what must be TRUE):

  1. `persistedState.svelte.ts` and `StackedState.svelte.ts` are deleted; `Readable<T>` is dropped from the relevant `.type.ts` files; a repo-wide grep for `svelte/store` imports across `lib/contexts/**` and `routes/**` returns zero matches.
  2. An ESLint guard rule fails the lint gate if a `svelte/store` import is reintroduced into a migrated context file; `yarn lint:check` exits 0 on the cleaned tree.

**Plans**: TBD

### Phase 99: Domain B Wave A — View Transitions + Navigation a11y

**Goal**: Navigation between views (Q→Q, results tabs, locale switches) renders as element-stable cross-fades instead of a perceived full-page redraw, with WCAG 2.1 AA-compliant focus management, route announcement, and reduced-motion handling.
**Depends on**: Nothing in Domain A — additive and fully independent (spikes 013-016). Can ship before, after, or in parallel with Domain A.
**Parallel-eligible**: Yes — independent of all of Domain A (Phases 95-98); schedulable concurrently with Wave 1.
**Requirements**: VT-01, VT-02, VT-03, NAVA11Y-01, NAVA11Y-02, NAVA11Y-03
**Success Criteria** (what must be TRUE):

  1. The root layout couples navigation to the View Transitions API via `onNavigate(navigation => new Promise(resolve => startViewTransition(async () => { resolve(); await navigation.complete; })))`, reading `navigation.to?.url` (not `page.url`) for destination-based decisions; `view-transition-name`s on Header / MainContent / hero / QuestionActions — **plus, per user decision 99-1, results election-switching, entity tabs in results, tabs in entity details, `QuestionHeading`, and the candidate-app `/questions` route where applicable** — produce visible element-stable cross-fades where the old "redraw" was perceived.
  2. `prefers-reduced-motion: reduce` is honored on both layers — `matchMedia` short-circuits `startViewTransition` in JS, and a CSS `@media (prefers-reduced-motion: reduce) { :global(...) }` block (correct Svelte-parser form) nulls any escaping animation.
  3. A dedicated `aria-live="polite"` route announcer (text derived from `page.params.X`, not `<svelte:head><title>`) announces route changes; focus is reset on navigation via `afterNavigate` → `requestAnimationFrame(() => target.focus({ preventScroll: true }))` with the question heading carrying `data-focus-on-nav` / `tabindex="-1"`.
  4. The full transition stack passes the WCAG 2.1 AA gate (focus management + aria-live announcer + reduced-motion) under the existing `@axe-core/playwright` env-gated smoke.

**Plans**: 4 plans (4 waves — strictly sequential; no file overlap; Plan 04 is a gap-closure plan)

  - [x] 99-01-PLAN.md — VT mechanism: shared `viewTransition.ts` helper (`shouldAnimate`/`startViewTransition`) + root-layout merge (onNavigate VT coupling, afterNavigate focus reset, aria-live announcer, reduced-motion both layers, `?notr=1`) — VT-01/VT-03/NAVA11Y-01/NAVA11Y-02 _(wave 1)_
  - [x] 99-02-PLAN.md — `view-transition-name` surface assignment across the expanded set (Header/MainContent/Hero/QuestionActions/QuestionHeading, voter+candidate `/questions`, results election-switch + entity tabs, entity-detail tabs via a minimal local Tabs wrapper) + heading focus markers — VT-02/NAVA11Y-02 _(wave 2)_
  - [x] 99-03-PLAN.md — extend the existing `a11y-smoke.spec.ts` (announcer + focus-on-nav assertions, `?notr=1` determinism) + full-suite parity check — NAVA11Y-03/NAVA11Y-01/NAVA11Y-02 _(wave 3)_
  - [x] 99-04-PLAN.md — **gap-closure (CR-01):** route announcer speaks the localized per-route page title (minus the app-name/maintenance suffix) via a new `routeTitle` layout-context rune signal registered by MainContent/SingleCardContent, replacing the hardcoded-English `Question ${questionId}` slug; a11y-smoke NAVA11Y-01 assertion updated — NAVA11Y-01 _(wave 4)_

**UI hint**: yes

### Phase 100: Domain B Wave B — Questions Layout Restructure

**Goal**: The `/questions` route adopts the unified-layout-with-empty-leaf shape (mirroring the existing production results pattern), so the layout owns rendering and variant remounting happens cleanly only at question-type boundaries while accumulated answers survive Q→Q navigation.
**Depends on**: Phase 99 (the View Transitions names + the post-navigation focus target land in Wave A; the questions-layout restructure builds on top of them).
**Parallel-eligible**: No within Domain B (strictly after Wave A). Independent of Domain A.
**Requirements**: QLAYOUT-01, QLAYOUT-02
**Success Criteria** (what must be TRUE):

  1. `/questions` rendering is hoisted from `[questionId]/+page.svelte` into the parent `questions/+layout.svelte` (matching the production `results/[[electionTab]]/+layout.svelte` pattern); `[questionId]/+page.svelte` is an empty stub.
  2. Variant remount uses `{#key question.type}` (not `{#key question.id}`) — the input stays mounted across a run of same-variant questions and remounts cleanly only at Likert↔open-text↔slider boundaries; layout-owned `$state` answers survive Q→Q navigation.

**Plans**: TBD
**UI hint**: yes

### Phase 101: Suite Re-enable + Milestone-Close Green Gate

**Goal**: The 2 quarantined `perm-per-app-notifications` E2E tests — whose quarantine was explicitly gated on this migration — are re-enabled, and the full E2E + unit suites are proven green with no behavior regression versus the v2.10 ship baseline.
**Depends on**: ALL prior phases (95-100) — this is the milestone-close green gate; it can only run once the rune migration and the transition/a11y work have landed.
**Parallel-eligible**: No — final gate, runs last.
**Requirements**: SUITE-01
**Success Criteria** (what must be TRUE):

  1. The 2 `perm-per-app-notifications` tests are un-quarantined (no `test.skip`) and pass deterministically.
  2. The full E2E suite and the unit suites are green with no behavior regression versus the v2.10 ship baseline (`yarn test:unit` + the Playwright suite both pass; prior PASS_LOCKED tests stay passing).

**Carried-in gaps** (deferred here from earlier phases):
  - **a11y-smoke `voter-detail-drawer` color-contrast (from Phase 99 UAT, 2026-06-04).** The entity-details drawer fails the axe color-contrast WCAG 2.1 AA gate: muted-gray `#b1b1b1`/`#c5c5c5` on white across the candidate `<h3>` title, alliance/faction tag spans, the `match` label, and `small-info`/`small-label` labels. Pre-existing theme debt, newly surfaced when Phase 99's fix `b801cfa6e` unblocked the located a11y walk (the route had never been axe-scanned before). The `a11y-smoke` gate is otherwise 7/8 green; this is the one known-red assertion (NOT quarantined). Needs theme/token remediation to meet 4.5:1 + visual-regression sign-off. See `99-UAT.md` Gaps + `.planning/debug/elections-continue-stall.md`.

**Plans**: TBD

## Progress

**Execution Order:**
Domain A is a strict chain: 95 → 96 → 97 → 98. Domain B is a chain: 99 → 100. The two domains are independent (can interleave / run in parallel). Phase 101 runs last, after all of 95-100. A valid serial order: 95 → 96 → 97 → 98 → 99 → 100 → 101 (or Domain B may run first / concurrently).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 95. Domain A Wave 1 — Tier-1 Leaf Contexts | v2.11 | 5/5 | Complete   | 2026-06-04 |
| 96. Domain A Wave 2 — Tier-2 Bridges | v2.11 | 0/TBD | Not started | - |
| 97. Domain A Wave 3 — getRoute + Consumer Codemod | v2.11 | 0/TBD | Not started | - |
| 98. Domain A Wave 4 — Cleanup | v2.11 | 0/TBD | Not started | - |
| 99. Domain B Wave A — View Transitions + Navigation a11y | v2.11 | 3/3 | Complete   | 2026-06-04 |
| 100. Domain B Wave B — Questions Layout Restructure | v2.11 | 0/TBD | Not started | - |
| 101. Suite Re-enable + Milestone-Close Green Gate | v2.11 | 0/TBD | Not started | - |

See `.planning/MILESTONES.md` for cumulative history and `.planning/milestones/` for per-milestone roadmaps + requirements + audits.
</content>
</invoke>
