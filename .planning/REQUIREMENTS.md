# Milestone v2.6: Svelte 5 Migration Cleanup — Requirements

**Goal:** Close out the Svelte 5 migration debt — fix hydration reactivity bugs, migrate the remaining legacy layouts to runes, resolve voter-app rendering gaps surfaced by v2.5 UAT, and drive the E2E carry-forward pool toward green.

**Context sources:**

- `.planning/todos/pending/root-layout-runes-migration.md`
- `.planning/todos/pending/svelte5-hydration-effect-then-bug.md`
- `.planning/todos/pending/entity-list-controls-infinite-loop.md`
- `.planning/todos/pending/svelte5-cleanup.md` (Phase 58 UAT findings)
- `.planning/STATE.md` Deferred Items (10 data-race + 38 cascade E2E carry-forward)
- Phase 59 Plan 04 deferred follow-up (e2e template `app_settings` extension)

---

## v2.6 Requirements

### LAYOUT — Runes-mode migration + hydration bug fix

- [x] **LAYOUT-01
**: Root layout (`apps/frontend/src/routes/+layout.svelte`) is migrated to Svelte 5 runes mode — no `export let`, no `$:` reactive statements, no `<slot />`. Uses `$props`, `$derived`, and `{@render children()}` consistently.
- [ ] **LAYOUT-02**: Candidate protected layout (`apps/frontend/src/routes/candidate/(protected)/+layout.svelte`) reliably renders post-hydration on full page loads. The `$effect` + `Promise.all(...).then(...)` pattern that leaves the page stuck at `<Loading />` is replaced with a pattern that re-renders correctly after SSR. The 2 blocked E2E registration tests (`candidate-registration.spec.ts:64`, `candidate-profile.spec.ts:51`) pass without workarounds.
- [ ] **LAYOUT-03**: `PopupRenderer` runes-mode wrapper workaround is removed (direct store rendering works after root-layout migration), OR is explicitly retained with a documented rationale in-code if the underlying Svelte 5 limitation persists.

### QUESTION — Voter-app question flow (Phase 58 UAT gaps)

- [ ] **QUESTION-01**: Boolean-type questions render an appropriate answer control (yes/no or equivalent binary UI) in the voter flow. Voter can answer the boolean question and advance.
- [ ] **QUESTION-02**: Candidate result-detail page opens without error when the voter has answered a boolean question. The per-question match-breakdown component handles `type === 'boolean'` in the same switch that handles `singleChoiceOrdinal` and `singleChoiceCategorical`.
- [ ] **QUESTION-03**: Category-selection screen has a sensible default selection (all opinion categories checked by default, or an explicit product decision documented in the component). The "questions" counter updates reactively on every category toggle — no stuck-at-0 behavior.

### RESULTS — Results-page stability + filter re-enablement

- [ ] **RESULTS-01**: `EntityListControls` and `EntityList` are merged into a single component. The infinite `$effect` loop on line 56 of `EntityListControls.svelte` is eliminated by replacing the `$effect` + `filterGroup.onChange` + `updateFilters` circular chain with a `$derived`-based computation.
- [ ] **RESULTS-02**: Filters are re-enabled on the voter results page (currently temporarily disabled per the todo). No regressions when filters are toggled in the layout-based render path.
- [ ] **RESULTS-03**: Empty `results/+page.svelte` is removed. The `[entityType]/[entityId]` route params are made optional so the results list and entity-detail drawer share the same route. The `entityType` route param sets the initially active entity tab (candidate/organization) when present.

### E2E — Carry-forward greening

- [ ] **E2E-01**: E2E carry-forward pool shrinks measurably from the post-v2.5 baseline (10 data-race + 38 cascade failures on SHA `3c57949c8`). LAYOUT-02 alone is expected to reclaim the 2 direct candidate-registration blocks plus ~35 cascaded tests. Any remaining residual is documented as framework-level (upstream Svelte 5 bug or structural test concurrency issue) and does not block milestone close.
- [ ] **E2E-02**: The `e2e` template in `@openvaa/dev-seed` carries an `app_settings.fixed[]` block that matches the defaults currently applied by legacy `updateAppSettings(...)` calls. The 4 legacy calls (`data.setup.ts` + 3 variant setups, ~60 lines per Plan 59-04 Rule-2 follow-up) are deleted. Playwright parity gate remains PASS.

---

## Future Requirements (deferred)

_Items tracked but not in v2.6 scope. Carry forward to a later milestone or backlog._

- 165 pre-existing intra-package circular deps in `@openvaa/data` / `@openvaa/matching` / `@openvaa/filters` (the `internal.ts` barrel pattern) — structural refactor, scope undecided (STATE.md carry-forward)
- Claude Skills: architect, components, LLM (deferred to post-Svelte 5 stabilization — PROJECT.md Future)
- Admin App Migration (frontend Admin App) — PROJECT.md §Milestones #13
- Parties in Candidate App generalization — PROJECT.md §Milestones #17
- Settings & Configuration Reorg — PROJECT.md §Milestones #16
- Automated security and secrets scanning — PROJECT.md §Milestones #14
- Trusted publishing for npm (OIDC) — PROJECT.md Future

## Out of Scope

- Upstream Svelte 5 hydration bug itself: if a root-cause fix in Svelte core is needed and no clean workaround exists, file upstream issue and ship the best available workaround rather than block v2.6.
- Structural dependency-graph refactor (the 165 intra-package cycles): explicitly out — belongs to a dedicated refactor milestone, not this cleanup pass.
- Other outstanding voter-app or candidate-app bugs not tied to Svelte 5 runes migration, hydration reactivity, or the three Phase 58 UAT surfaces.
- New features. This milestone is bug-fix + migration-cleanup only.

---

## Traceability

Phase assignments mapped by `.planning/ROADMAP.md` on 2026-04-24. Success-criterion references point to the numbered criteria under each phase's `**Success Criteria**` block in ROADMAP.md.

| REQ-ID | Phase | Success criterion reference |
| --- | --- | --- |
| LAYOUT-01 | Phase 60 | Phase 60 SC-1 (root layout uses `$props` / `$derived` / `{@render children()}`; no legacy Svelte 4 patterns) |
| LAYOUT-02 | Phase 60 | Phase 60 SC-2 (protected candidate layout renders post-hydration on full page loads — no stuck `<Loading />`) |
| LAYOUT-03 | Phase 60 | Phase 60 SC-3 (`PopupRenderer` workaround removed or explicitly retained with documented in-code rationale) |
| QUESTION-01 | Phase 61 | Phase 61 SC-1 (boolean-type questions render a binary answer control; voter can answer and advance) |
| QUESTION-02 | Phase 61 | Phase 61 SC-2 (candidate result-detail page renders match breakdown without error for boolean answers) |
| QUESTION-03 | Phase 61 | Phase 61 SC-3 (category-selection screen has sensible default; question counter updates reactively on toggle) |
| RESULTS-01 | Phase 62 | Phase 62 SC-1 + SC-4 (merged entity-list component; no infinite-loop symptoms; `$derived` replaces circular `$effect` chain) |
| RESULTS-02 | Phase 62 | Phase 62 SC-2 (filters re-enabled on voter results page; toggling narrows list without layout-based regression) |
| RESULTS-03 | Phase 62 | Phase 62 SC-3 (empty `results/+page.svelte` removed; optional `[entityType]/[entityId]` route shared; `entityType` sets active tab) |
| E2E-01 | Phase 63 | Phase 63 SC-1 + SC-2 (carry-forward pool shrinks measurably from SHA `3c57949c8` baseline — 10 data-race + 38 cascade out of 89; residuals documented as framework-level) |
| E2E-02 | Phase 63 | Phase 63 SC-3 + SC-4 (`app_settings.fixed[]` in e2e template; 4 legacy `updateAppSettings(...)` blocks deleted; parity gate PASS) |

**Coverage:** 11 / 11 requirements mapped ✓ — no orphans, no duplicates.
