# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- 🚧 **v2.6 Svelte 5 Migration Cleanup** — Phases 60-63 (in progress, started 2026-04-24)

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

### 🚧 v2.6 Svelte 5 Migration Cleanup (In Progress)

**Milestone Goal:** Close out the Svelte 5 migration debt — fix hydration reactivity bugs, migrate the remaining legacy layouts to runes, resolve voter-app rendering gaps surfaced by v2.5 UAT, and drive the E2E carry-forward pool toward green.

- [x] **Phase 60: Layout Runes Migration & Hydration Fix** — Root + candidate-protected layouts run under runes mode; protected layout renders post-hydration on full page loads (completed 2026-04-24)
- [ ] **Phase 61: Voter-App Question Flow** — Boolean question rendering, candidate-result boolean handling, and category-selection reactivity restored
- [ ] **Phase 62: Results Page Consolidation** — `EntityListControls` + `EntityList` merged; results-page filters re-enabled; entity-detail route collapsed into a single route
- [ ] **Phase 63: E2E Template Extension & Greening** — E2E carry-forward pool shrinks from the post-v2.5 baseline; `app_settings` block in e2e template retires the legacy `updateAppSettings` workaround

## Phase Details

### Phase 60: Layout Runes Migration & Hydration Fix
**Goal**: Both the root layout and the candidate protected layout run under Svelte 5 runes mode, render reliably after SSR + hydration on full page loads, and no longer depend on undocumented workarounds for store-driven rendering.
**Depends on**: Nothing (first phase of v2.6)
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03
**Success Criteria** (what must be TRUE):
  1. The root layout (`apps/frontend/src/routes/+layout.svelte`) contains no `export let`, no `$:` reactive statements, and no `<slot />` — it uses `$props`, `$derived`, and `{@render children()}` consistently.
  2. A fresh candidate arriving at a protected candidate route via full page load (not client-side navigation) sees the candidate dashboard render after data resolution — the page no longer stays stuck at `<Loading />`.
  3. The `PopupRenderer` workaround is either removed (direct store rendering now works through the migrated root layout) or retained with a documented in-code rationale that names the upstream Svelte 5 limitation it still guards against.
  4. Existing voter-app and candidate-app E2E tests that previously passed continue to pass — the layout migration introduces no regressions to the Playwright parity baseline.
**Plans**: 5 plans
  - [x] 60-01-PLAN.md — Wave-0 prep: restore diff-playwright-reports.ts + baseline JSON; create D-09 setTimeout-popup E2E scaffold
  - [x] 60-02-PLAN.md — Root `+layout.svelte` $derived refactor (LAYOUT-01, D-05)
  - [x] 60-03-PLAN.md — Protected `(protected)/+layout.svelte` $derived refactor + D-02 wrapper fallback gate (LAYOUT-02)
  - [x] 60-04-PLAN.md — D-08 PopupRenderer empirical removal + D-10 retention branch (LAYOUT-03)
  - [x] 60-05-PLAN.md — Playwright parity gate vs baseline `3c57949c8` (SC-4) — PARITY GATE: FAIL documented (24 regressions all Category A orthogonal, handoff to Phase 61); LAYOUT-01/02/03 satisfied by alternative evidence; `pending_review: true`
**UI hint**: yes

### Phase 61: Voter-App Question Flow
**Goal**: The voter question flow — from category selection, through boolean questions, to candidate match detail — renders and reacts correctly across all question types produced by the default seed template. Also restores candidate-app question-list reactivity so the `candidate-questions.spec.ts` cascade surfaced by Phase 60 clears.
**Depends on**: Phase 60 (runes-mode root layout lets downstream reactivity rely on Svelte 5 idioms end-to-end)
**Requirements**: QUESTION-01, QUESTION-02, QUESTION-03, QUESTION-04
**Success Criteria** (what must be TRUE):
  1. A voter encountering a boolean-type question sees an appropriate binary answer control (yes/no or equivalent), can submit an answer, and advances to the next question.
  2. Opening a candidate result-detail page after answering a boolean question renders the per-question match breakdown without error — the question-type switch handles `boolean` alongside `singleChoiceOrdinal` and `singleChoiceCategorical`.
  3. On the category-selection screen, the voter sees a sensible default selection (all opinion categories checked by default, or an explicit product decision documented at the component) and the "questions" counter updates reactively on every category toggle — no stuck-at-0 behaviour.
  4. On the candidate app question route, the `candidate-questions-list` and `candidate-questions-start` testIds become visible within Playwright's default timeout, the 6 direct `candidate-questions.spec.ts` tests pass, and their 18 dependent cascade tests (candidate-app-mutation / candidate-app-settings / candidate-app-password / re-auth-setup) run and pass. (Folded from Phase 60 handoff 2026-04-24.)
**Plans**: 3 plans
  - [x] 61-01-PLAN.md — Boolean opinion input + auto-fix result-detail boolean match-breakdown via shared OpinionQuestionInput dispatch (QUESTION-01 + QUESTION-02)
  - [x] 61-02-PLAN.md — Category default + counter reactivity: migrate voterContext selectedQuestionCategoryIds to pure $state per D-11 (QUESTION-03)
  - [x] 61-03-PLAN.md — Candidate-questions testId visibility: diagnose-first then apply reactivity/readiness/timeout fix (QUESTION-04)
**UI hint**: yes

### Phase 62: Results Page Consolidation
**Goal**: The voter results page renders through a single merged entity-list component, filters work without triggering an infinite `$effect` loop, the results list and entity-detail drawer share a 4-segment optional-param route that handles the org-list + candidate-drawer edge case cleanly, and filter state is exposed via a shared `filterContext` so a future LLM chat can read and mutate the voter's active filters.
**Depends on**: Phase 60 (layout-based rendering path relied on in the consolidated results layout)
**Requirements**: RESULTS-01, RESULTS-02, RESULTS-03
**Success Criteria** (what must be TRUE):
  1. A voter reaching `/results` sees the merged entity list + controls render once — no infinite-loop symptoms (frozen UI, runaway re-renders) when filters are toggled.
  2. Filters on the voter results page are enabled and functional — toggling a filter narrows the displayed candidate/organization list without regressing the layout-based render path. Filter state lives in a shared `filterContext` module (bundled through `voterContext` for ergonomic consumption), scoped per (election, plural) tuple, preserved across drawer open/close.
  3. The empty `results/+page.svelte` no longer exists; the results list and the entity-detail drawer share the path `/results/[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]` with typed param matchers (`entityTypePlural` ∈ {candidates, organisations}; `entityTypeSingular` ∈ {candidate, organisation}). The schema supports the org-list + candidate-drawer edge case. `entityTypePlural` drives the Tabs component via `$page.params`. On full-page-load to a detail URL, drawer rendering is prioritized over list rendering for perceived performance.
  4. The filter-driven list derivation uses `$derived` — there is no `$effect` + `filterGroup.onChange` → `updateFilters` → `filterGroup.apply` circular chain in the merged `EntityListWithControls` component. `@openvaa/filters` is untouched (consumer-side refactor only).
**Plans**: 3 plans
  - [x] 62-01-PLAN.md — filterContext (version-counter bridge over FilterGroup.onChange) + EntityListWithControls compound (RESULTS-01, RESULTS-02)
  - [x] 62-02-PLAN.md — Route collapse to 4-segment optional shape + entityTypePlural/entityTypeSingular param matchers (RESULTS-03)
  - [x] 62-03-PLAN.md — results/+layout.svelte URL-driven tabs + drawer + filter re-enable + drawer-first paint + E2E coverage (RESULTS-01, RESULTS-02, RESULTS-03)
**UI hint**: yes

### Phase 63: E2E Template Extension & Greening
**Goal**: The Playwright carry-forward pool shrinks measurably from the post-v2.5 baseline, and the `@openvaa/dev-seed` e2e template carries its own `app_settings` block so the legacy `updateAppSettings(...)` workaround can be retired.
**Depends on**: Phase 60 (LAYOUT-02 fix is the largest single source of reclaimed tests — 2 direct blocks + ~35 cascade)
**Requirements**: E2E-01, E2E-02
**Success Criteria** (what must be TRUE):
  1. Relative to the post-v2.5 parity baseline on SHA `3c57949c8` (10 data-race + 38 cascade failures out of 89 total), the Playwright carry-forward failure pool is measurably smaller — at minimum the 2 direct candidate-registration tests (`candidate-registration.spec.ts:64`, `candidate-profile.spec.ts:51`) pass, and their ~35 downstream cascade tests run and pass independently.
  2. Any residual failures that remain after Phase 60-62 land are documented as framework-level (upstream Svelte 5 bug or structural test-concurrency issue) with a specific pointer — not generic "flake" — and do not block milestone close.
  3. The `e2e` template in `@openvaa/dev-seed` carries an `app_settings.fixed[]` block whose emitted defaults match the values currently applied by the 4 legacy `updateAppSettings(...)` call sites (`data.setup.ts` + 3 variant setups, ~60 lines per Plan 59-04 Rule-2 follow-up).
  4. After the template change lands, the 4 legacy `updateAppSettings(...)` blocks are deleted and the Playwright parity gate prints `PARITY GATE: PASS` against the post-v2.5 baseline.
**Plans**: 3 plans
  - [x] 63-01-PLAN.md — Hoist `mergeSettings` (+ `DeepPartial`) from frontend to `@openvaa/app-shared`; vitest coverage; add `@openvaa/app-shared` workspace dep to `@openvaa/dev-seed` (E2E-02 foundation)
  - [x] 63-02-PLAN.md — Populate e2e template `app_settings.fixed[]` + 3 variant overlays via `mergeSettings`; delete 4 legacy `updateAppSettings(...)` blocks in `tests/tests/setup/*.setup.ts`; add post-seed `toMatchObject` assertion + `getAppSettings()` helper + D-11 JSDoc update + D-09 spec-level audit (E2E-02)
  - [ ] 63-03-PLAN.md — Post-v2.6 Playwright parity gate vs baseline `3c57949c8`; commit post-v2.6 baseline JSON + diff.md unconditionally; residual classification per D-06; up to 2-3 residual fixes per D-07 (RESOLVED Q3 triple); escalate if over budget (E2E-01)

## Progress

**Execution Order:**
Phases execute in numeric order: 60 → 61 → 62 → 63

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 56. Generator Foundations & Plumbing | v2.5 | 10/10 | Complete | 2026-04-23 |
| 57. Latent-Factor Answer Model | v2.5 | 7/7 | Complete | 2026-04-23 |
| 58. Templates, CLI & Default Dataset | v2.5 | 10/10 | Complete | 2026-04-23 |
| 59. E2E Fixture Migration | v2.5 | 7/7 | Complete | 2026-04-24 |
| 60. Layout Runes Migration & Hydration Fix | v2.6 | 5/5 | Complete    | 2026-04-24 |
| 61. Voter-App Question Flow | v2.6 | 0/3   | Not started | - |
| 62. Results Page Consolidation | v2.6 | 0/3   | Not started | - |
| 63. E2E Template Extension & Greening | v2.6 | 0/3   | Not started | - |

### Phase 64: Voter Results Reactivity Completion (Phase 62-bis)

Close out 5 voter-results E2E failures deferred from Phase 63's parity gate: RESULTS-01/02 (filter toggle), D-14 (plural-tab switch), D-15 (drawer survival), D-08 shape 3 (list+drawer deeplink), D-08 shape 4 (organizations+candidate-drawer deeplink). All in `tests/tests/specs/voter/voter-results.spec.ts`. Root cause: incomplete Phase 62 `entity-list-controls` reactivity refactor.

**Goal:** Flip the v2.6 parity gate to PASS so `/gsd-complete-milestone` can proceed without `pending_review` caveat.
**Requirements**: RESULTS-01, RESULTS-02, RESULTS-03
**Depends on:** Phase 63
**Out of scope:** imgproxy infrastructure flake (separate concern; tracked as STATE.md known infrastructure debt).
**Plans:** 3 plans

Plans:
- [ ] 64-01-PLAN.md - Reactivity bridge + fixture stabilization (RESULTS-01/02 + D-14 + D-15): empirical reproduction, 6 truthy test.skip(true) replacements with expect.poll (D-11), selected fixture-flake fix path (F1/F2/spec-only) per repro outcome
- [ ] 64-02-PLAN.md - Deeplink load chain (RESULTS-03 / D-08 shape 3+4): independent reproduction via direct page.goto bypassing answeredVoterPage; conditional fix in +layout.svelte / +layout.ts / +page.ts only if reproduction surfaces a rendering defect (default = NONE - Plan 64-01 fixture fix closes shapes 3+4)
- [ ] 64-03-PLAN.md - Verification + close: single canonical Playwright JSON capture (D-07 + Pitfall 6), parity-script constants regeneration (D-08 + D-09 + Pitfall 5), Phase 64 verification report, 9-step manual smoke checkpoint (D-10)
