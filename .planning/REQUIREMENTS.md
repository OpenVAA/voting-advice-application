# Milestone v2.9: E2E Coverage + Suite Determinism — Requirements

**Defined:** 2026-05-10
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

**Goal:** Reduce the Playwright suite to a hard pass/fail signal first (skip-modifier sweep + 19 data-loading races + 98 `playwright/*` warnings), then add high-leverage coverage on top of that stable base — translation surface, browse-without-match, election/constituency selector matrix, voter answer rendering, skip/delete/back navigation, locale switching, focused question-rendering specs, candidate profile validation+persistence, automated a11y, and the `appSettings`/`appCustomization` toggle matrix (plus `customData.allowOpen` and per-question visibility/required gap-fills). Close residual operator + post-71 hygiene todos in a final cleanup phase.

**Strategy: determinism first, coverage on top.** Adding new tests against an unstable suite hides regressions: a new test failing for a real reason looks like just-another-flake. Phase A (DETERM) is gating — Phases B, C, D, E do not start coverage work until the existing suite is 0 skipped / 0 races / 0 `playwright/*` warnings.

**Context sources:**

- `.planning/notes/2026-05-10-v2.9-e2e-coverage-inventory.md` — E2E gap inventory + REAL/NOT-REAL classification + operator-pre-drafted 6-phase shape (compiled 2026-05-10 during v2.8 close)
- `.planning/notes/2026-05-08-e2e-test-inventory.md` — broader E2E test inventory (~103 tests, ~30 gap categories) underlying the v2.9 framing
- `.planning/todos/pending/2026-04-27-remove-e2e-skip-modifiers.md` — `test.skip(true, …)` sweep plan + classification protocol
- `.planning/todos/pending/2026-05-10-tests-playwright-hygiene-sweep.md` — 98 `playwright/*` warnings sweep
- `.planning/todos/pending/2026-04-27-extend-e2e-filter-type-coverage.md` — filter-type matrix coverage (folds into SETTINGS-01)
- `.planning/todos/pending/2026-05-10-rename-package-scripts-dev-to-db.md` — `dev:* → db:*` script rename + `dev:clean` cache wipe
- `.planning/todos/pending/2026-05-10-redirect-unlocated-voter-to-selectors.md` — voter-not-located deferred-target redirect
- `.planning/todos/pending/2026-05-10-d04-per-cast-reason-distribution.md` — D-04 per-cast `// reason:` anchor distribution
- `.planning/todos/pending/2026-05-10-getroute-setstore-cast-cleanup.md` — `setStore` cast cleanup at `getRoute.svelte.ts:41`
- `.planning/todos/pending/2026-05-09-claude-md-svelte-warning-accepted-format.md` — CLAUDE.md Svelte warning-accepted format anchor
- `.planning/todos/pending/2026-05-09-tighten-i18n-wrapper.md` — i18n wrapper tightening (paired with locale-switching coverage)
- PROJECT.md "Current Milestone: v2.9" — full goal + 6-phase A–F shape + key context
- v2.8 PROJECT.md "Out of scope (deferred to v2.9+)" — E2E coverage workstream as v2.9 anchor

---

## v2.9 Requirements

### DETERM — Determinism baseline (gating prerequisite for Phases B–E)

- [x] **DETERM-01**: All `test.skip(true, …)` modifiers across the Playwright suite are either removed (when the underlying issue is resolved or the test was permanently obsolete) or converted to `expect.poll(...).toBeGreaterThan(0)` race-tolerant hard assertions (matching the v2.6 Phase 64 pattern that cleared the 6 voter-results.spec.ts skips). Each skip is classified per the protocol in `2026-04-27-remove-e2e-skip-modifiers.md` (legitimate skip / convert-to-poll / fix-and-remove). After the sweep: `git grep -nE "test\.skip\(true," tests/` returns zero matches outside of comments. Post-resolution suite shows 0 skipped tests on the green run.

- [x] **DETERM-02**: The 19 known pre-existing data-loading race E2E failures (PROJECT.md "Future") are resolved deterministically. Each failure is investigated per failure type (race in initial data fetch / subscription not flushed before assertion / auth-cookie not set in time / hydration timing) and given a deterministic fix at the test level (proper `waitFor` against the asserted element, replacing `waitForLoadState('networkidle')`, removing `if (...)` branches that mask race outcomes) or at the code level (where the race surfaces a real product bug). Post-resolution: 3 consecutive `yarn test:e2e --workers=1` runs pass identically (same pass/fail set across runs); the v2.6 parity baseline `67p / 1f / 34c` shifts to a stable green count or is explicitly re-baselined.

- [x] **DETERM-03**: All 98 pre-existing `playwright/*` ESLint warnings in `tests/` are resolved. Breakdown per `2026-05-10-tests-playwright-hygiene-sweep.md`: `playwright/no-conditional-in-test` (`if (...)` branches inside test bodies replaced with explicit assertions or split into separate tests), `playwright/no-raw-locators` (`page.locator('...')` rewritten to semantic locators `getByRole`/`getByText`/`getByTestId`), `playwright/no-networkidle` (`waitForLoadState('networkidle')` replaced with `waitFor` against the asserted element). Post-sweep: `yarn lint:check` exits 0 with 0 warnings across all workspaces (frontend lint baseline 0 errors / 0 warnings; tests/ contributes 0 of either). The hygiene sweep forces the rewrite of the conditional / `networkidle` patterns that drive flakiness — paired with DETERM-02.

### E2E — High-leverage E2E coverage (depends on DETERM Phase A green)

- [x] **E2E-01**: A multilocale candidate sees and uses the translation surface; a single-locale candidate does not. When `staticSettings.supportedLocales.length > 1`, candidates can add translations to questions where `localizationDisabled` is not set. When `staticSettings.supportedLocales.length === 1`, the translation tab/dialog is not rendered. Asserted on a parameterized fixture — multilocale + single-locale variants — via `aria-label` / role-based locators on the translation surface.

- [x] **E2E-02**: A voter with a completed location but fewer than `minimumAnswers` opinion answers can still browse the entity list (results page). The list does not show match scores; the page intro text does not reference matches. Variant fixture sets `minimumAnswers` low enough that the voter has not crossed it after location is set; spec navigates to results and asserts absence of match-score column + alternative intro copy.

- [x] **E2E-03**: A voter's typed feedback text persists across dismissing the dialog and is reset after the message is sent. Sequence: open feedback → type text → dismiss → reopen → expect text retained. Then: type new text → send → reopen → expect empty.

- [x] **E2E-04**: The election + constituency selectors are bypassed whenever the election + constituency can be implied from the data, not just the trivial `1e × 1c` case. Variant matrix covers `1e × 1c` (already covered, kept as regression baseline), `1e × Nc`, `Ne × 1c`, `Ne × Nc`, plus `startFromConstituency` setups. Each cell asserts URL state (selectors-bypassed vs. shown) and selector visibility on the page. The constituency dropdown options for a selected election filter to that election's constituencies only (no cross-election bleed).

- [x] **E2E-05**: The voter's answer is rendered alongside the entity's answer on the entity-detail drawer for all four cases: (a) both answered, (b) voter answered + entity missing, (c) voter missing + entity answered, (d) both missing. Parameterized fixture with each case; voter-detail spec asserts both rows present with appropriate visual state (agree / disagree / missing-marker).

- [x] **E2E-06**: A voter who skips a question, deletes their answer, and navigates back sees predictable result-CTA availability. Specifically: deleting an answer that brings count below `minimumAnswers` hides the results CTA; re-answering re-enables it. Sequence test answers N questions → deletes one → asserts results-CTA disabled → re-answers → asserts re-enabled.

- [x] **E2E-07**: The per-category match SubMatch breakdown renders correctly on the voter-detail spec. Existing voter-detail tests cover info+opinions tabs; this adds a per-category assertion block that reuses the fixture's category metadata to verify the subdimensional-pillar rendering for both Manhattan and directional metric paths.

- [x] **E2E-08**: A voter switches locale and the UI translates correctly. Spec visits the page in `en` → asserts key strings → switches to `fi` (or another configured locale) → asserts translated key strings → switches back. Both the route-prefixed form (`/fi/...`) and the locale-switcher widget (if present) are covered. (i18n is a v1.2 milestone capability; no E2E covers this end-to-end yet.)

### QSPEC — Question-rendering specs (parallel with E2E Phase B)

- [ ] **QSPEC-01**: A focused user-story spec walks the voter through a Boolean opinion question end-to-end — input shape correct (2-button radio per v2.6 P61), voter answers, navigates, sees their answer reflected on entity-detail. Deduplicated against existing matching tests (assertion-by-assertion).

- [ ] **QSPEC-02**: A focused user-story spec walks the voter through a categorical (single-choice + multi-choice) opinion question end-to-end — input shape correct, voter answers, navigates, sees their answer reflected on entity-detail. The per-category match breakdown is verified separately by E2E-07 — QSPEC-02 only covers the input + flow.

### A11Y — Profile + accessibility (parallel with Phase B)

- [ ] **A11Y-01**: Candidate profile field validation rejection paths are E2E-covered. Parameterized profile spec exercises bad-input cells (invalid email format, name length boundaries, image type/size violations); each asserts validation error UI + unsaved-state preservation. Happy paths remain covered by existing profile spec.

- [ ] **A11Y-02**: Candidate profile field reload-persistence is E2E-covered for all profile fields, not just the image. Existing CAND-12 covers image + answers + comment text; A11Y-02 extends the spec to cover name, bio, and social links (note: social links depend on configured info questions, so the fixture must include them). After save → page reload → all fields show their saved values.

- [ ] **A11Y-03**: `@axe-core/playwright` is integrated into the suite as a WCAG 2.1 AA smoke. Initial wiring covers the 5 highest-traffic routes — home, election/constituency selector, questions flow, results list, voter-detail drawer. Violations surfaced by the smoke are documented in a follow-up todo for cite-and-fix in a future phase (not in scope for v2.9 — wiring + first-run baseline only).

### SETTINGS — Settings matrix + question-customization gap-fills (parallel with Phase B)

- [ ] **SETTINGS-01**: `appSettings` / `appCustomization` per-toggle E2E coverage. Enumerate the toggles surfaced by `staticSettings` + `dynamicSettings` (extending the v2.4 candidate-settings.spec.ts which covers app-mode + notifications + hideHero + help/privacy); add an assertion-per-toggle (parameterized matrix-driven spec where shape allows, dedicated specs where toggle interactions warrant). Folds the existing `2026-04-27-extend-e2e-filter-type-coverage.md` todo (filter-type matrix becomes one slice of the toggle coverage).

- [ ] **SETTINGS-02**: `customData.allowOpen` E2E-covered per the v2.0 milestone-notes gap. Variant fixture enables `allowOpen` on a subset of questions; spec asserts the open-comment UI surfaces, voter can author comment text, comment persists across reload (matching the existing CAND-12 persistence pattern for candidate comments).

- [ ] **SETTINGS-03**: Per-question visibility flags + "must-answer" enforcement E2E-covered. `hideHero` is already covered (existing settings spec); SETTINGS-03 adds variant-fixture coverage for the remaining per-question visibility/required configuration: hidden questions don't render in the question flow; required-but-unanswered questions block navigation to results (per `requiredInfoQuestions` / `unansweredOpinionQuestions` voter-context contracts).

### CLEAN — Cleanup hygiene phase (Phase F shape, like v2.7 P68 / v2.8 P72)

- [ ] **CLEAN-01**: The `yarn dev:*` Supabase scripts are renamed to `yarn db:*` per `2026-05-10-rename-package-scripts-dev-to-db.md`. Renames: `dev:start → db:start`, `dev:stop → db:stop`, `dev:down → db:down`, `dev:reset → db:reset`, `dev:reset-with-data → db:reset-with-data`, `dev:status → db:status`, `dev:seed → db:seed`. A new `yarn dev:clean` is added that wipes `apps/frontend/.svelte-kit` + `node_modules/.vite/`. `db:reset` and `db:reset-with-data` chain `dev:clean` after the supabase reset (the v2.8-close hidden-gotcha recipe). Root `package.json`, CI workflows, and CLAUDE.md "Supabase Commands" section are updated. Verification: `yarn db:status` runs the supabase status command; `yarn dev:* → db:*` aliases either are removed or kept as deprecated shims with a logged deprecation warning (decision deferred to phase planning).

- [ ] **CLEAN-02**: Voters who hit a located route (`/results/...`, `/questions/...`) without `selectedElection` + `selectedConstituency` set are redirected through the selector with the original route preserved as a deferred-target — after the voter completes selection, they resume the originally-requested route. Source: `2026-05-10-redirect-unlocated-voter-to-selectors.md`. E2E-covered by a spec that arrives at `/results/X` cold (no localStorage), completes the selector, and asserts final URL matches the original deferred target.

- [ ] **CLEAN-03**: The 3 post-71 carry-forward Phase 71 OOS findings are closed:
  - **D-04 per-cast distribution** (`2026-05-10-d04-per-cast-reason-distribution.md`): the cluster-level `// reason:` anchor in `supabaseDataProvider.ts` (covering 13 cast sites) is distributed to per-cast lines, with reason text that distinguishes JSONB → typed-shape vs. JSONB → answers cases.
  - **`setStore` cast cleanup** (`2026-05-10-getroute-setstore-cast-cleanup.md`): the structural cast at `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts:41` is replaced with a properly-typed approach (likely returning the writable as `Writable<RouteBuilder>` rather than `Readable` from the factory, or restructuring to avoid the setter-extraction pattern).
  - **CLAUDE.md Svelte warning-accepted format** (`2026-05-09-claude-md-svelte-warning-accepted-format.md`): canonical anchor for the v2.8 Phase 70 Cat A "inline ignore-with-rationale preamble" pattern is added to CLAUDE.md so future warning-acceptance decisions follow the same shape.

- [ ] **CLEAN-04**: The i18n wrapper (`apps/frontend/src/lib/i18n/`) is tightened per `2026-05-09-tighten-i18n-wrapper.md`. Paired with E2E-08 (locale switching) so the wrapper improvements are exercised by the new locale-switching coverage. Specific tightening tracked in the source todo; expected outcome: stricter typing on translation function arguments + cleaner runtime override surface.

- [ ] **CLEAN-05**: Phase 73 code-review follow-ups + voter-fixture race-fix (Path B with `--likert-only` modifier). Source: `.planning/phases/73-determinism-baseline/73-REVIEW.md` (CR-02 + 7 WR + 5 IN findings) + `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` (operator-locked Path B). Sub-items:
  - **Voter-fixture race (Path B + `--likert-only`).** Add a `--likert-only` seed mode to `@openvaa/dev-seed` (CLI flag + template override) that restricts the e2e seed to `singleChoiceOrdinal` opinion questions (16 max), keeping `voter.fixture.ts answeredVoterPage` Likert-only. After this lands, `yarn db:reset-with-data --likert-only` (or the renamed `db:seed --likert-only` per CLEAN-01) feeds a fixture-compatible dataset; the 16 voter-app tests currently in the post-73 DATA_RACE pool pass on cold-start `--workers=1`. Estimated scope: ~15 LOC in `packages/dev-seed/src/templates/e2e.ts` + ~1 LOC fixture default + plumbing the CLI flag through `dev-seed`/`db:reset-with-data`. Heterogeneous-question-type coverage is explicitly deferred to a future-milestone backlog item (out of scope here).
  - **CR-02 voter-popups race-tolerance regression** (`tests/tests/specs/voter/voter-popups.spec.ts:138, 220`). Replace `waitFor({state:'visible'})` on already-visible anchors with `expect(dialog).toBeHidden({ timeout: 3000 })` (or `expect(dialogLocator).toHaveCount(0, { timeout: 3000 })` for the negative case at :220). The 2-5s popup-delay wait must actually take 2-5s — the current rewrite resolves instantly and false-positive-PASSes.
  - **WR-01** (`multi-election.spec.ts:145`). Replace the `.catch(() => false)` swallow-trap in the `answerAllQuestions` helper with a single union `waitFor` (Pattern 3): `answerOption.first().or(categoryStart).waitFor({state:'visible'})` + deterministic branch on which anchor resolved.
  - **WR-02** (`constituency.spec.ts:89-98` + `startfromcg.spec.ts:120-128`). The `selectElectionFromAccordionIfPresent` helpers branch on `count()`/`isVisible()` snapshots after a union `waitFor` — race-prone. Fix: branch on which anchor resolved the union, OR add a dedicated `electionAccordion.waitFor` follow-up with a longer timeout, OR remove the optional helper entirely and split the test's expectations on the multi-election shape.
  - **WR-03** (`multi-election.spec.ts:215-231`). Root-cause the silent SvelteKit `goto()` navigation failure on `elections.continue` → `/questions` (or document it as a known issue with a tracking link) and remove the `try/catch` fallback. Add hard precondition assertions in the `beforeAll` lookups: `expect(electionUuids.length, 'multi-election variant requires 2 elections').toBe(2)` (analogous for `constituencyUuids`).
  - **WR-04** (`auth.setup.ts:35-46`). Remove the wasted `reload()` in the retry loop — the next iteration's `goto(loginRoute)` already replaces the reloaded page. Either hoist the `goto` out of the loop body and keep `reload` as the actual retry mechanism, OR drop the `reload` entirely and let the loop's `goto` retry handle the path.
  - **WR-05** (`supabaseAdminClient.ts forceRegister`, lines 340-377). Wrap the 4-step mutation chain (createUser → find candidate → insert user_role → update candidates) in `try/catch` with a compensating `this.client.auth.admin.deleteUser(user.id)` rollback to prevent orphan auth users on partial failure. Prevents "User already exists" cascade across subsequent test runs.
  - **WR-06** (`supabaseAdminClient.ts deleteAllTestUsers`, lines 532-547). Propagate per-user step errors. Match the `unregisterCandidate` pattern (lines 386-413) which throws on each step's error. Either fail-fast on first error or collect-and-throw at end; the current silent-swallow is lossy and the caller cannot tell teardown succeeded.
  - **WR-07** (`supabaseAdminClient.ts fixGoTrueNulls`, lines 122-156). Delete as dead code (zero callers, internally inconsistent comments). If the GoTrue NULL bug is still relevant upstream, wire `fixGoTrueNulls` into `safeListUsers` with documentation of the bug + upstream issue link instead; deletion is preferred if the bug is resolved.
  - **IN-01** (`candidate-bank-auth.spec.ts:28-33`). Throw a hard error if `SUPABASE_SERVICE_ROLE_KEY` is not set — drop the demo-JWT fallback. OR document the demo-fallback with a `// reason:` block matching the DETERM-01 D-07 convention (operator decides at planning time).
  - **IN-02** (`candidate-bank-auth.spec.ts:168-169`). Simplify the fragile `((body.error ?? body.msg ?? body.details) as string | null) ?? null` chain with explicit `typeof` checks — make the type assertion safe at runtime.
  - **IN-03** (multiple specs). Audit unjustified `getByTestId` usages in `candidate-questions.spec.ts:34-36`, `candidate-settings.spec.ts:64`, `voter-results.spec.ts:170,219,277` and either (a) replace with semantic locators (`getByRole`, `getByText`) where unambiguous, OR (b) add `// reason:` blocks documenting why testId was chosen (Pattern P70 Cat A).
  - **IN-04** (`voter-results.spec.ts:206-211`). Strengthen the filter assertion from `expect.poll(...).toBeLessThanOrEqual(initialCount)` (trivially satisfied when filter no-ops) to `toBeLessThan(initialCount)` OR an exact-count check derived from the seed dataset.
  - **IN-05** (`data.setup.ts:144-146`). Replace the tautological `expect(true).toBe(true)` stub with a semantic assertion that verifies `forceRegister`'s post-condition (e.g., `findData('candidates', {externalId: {$eq: 'test-candidate-alpha'}})` returns a row with non-null `auth_user_id`).
  - **Acceptance**: (a) `yarn db:reset-with-data --likert-only` runs cleanly + the 16 voter-app tests in the post-73 DATA_RACE pool pass on cold-start `--workers=1`; (b) `tests/scripts/diff-playwright-reports.ts` constants re-regenerate against the post-CLEAN-05 baseline with the 16 tests removed from `DATA_RACE` and added to `PASS_LOCKED` (parity gate still PASSes); (c) 3-run determinism re-confirms (cold-start `--workers=1` × 3 identical pass/fail); (d) all 12 review findings are either fixed in code or accepted with an inline `// reason:` block at the call site. The Phase 73 follow-up entries in `STATE.md §Blockers/Concerns` are removed and `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` moves to `completed/`.

---

## Future Requirements (deferred)

_Items tracked but not in v2.9 scope. Carry forward to v2.10+ or backlog._

- **Sharable URLs + multi-tenant pair (v2.10 candidate)** — `results-url-refactor-followups` (shorter IDs, multi-election URL schema, upstream voter routes; `.planning/todos/pending/results-url-refactor-followups.md`) + `frontend-project-id-scoping` (per-instance project scoping in voter data provider; `.planning/todos/pending/frontend-project-id-scoping.md`). Pair as one milestone; multi-tenant prep wanted typing cleanup (now done in v2.8 P71).
- **Luxembourg + Danish VAA reconciliation** — `2026-05-10-incorporate-luxembourg-and-danish-vaa-changes.md`. Inventory deltas, classify, merge or reject. Operator deferred — deltas unscoped.
- **Cite-and-fix WCAG 2.1 AA violations surfaced by the v2.9 axe smoke** — A11Y-03 only covers wiring; violations from the first-run baseline are tracked as a follow-up phase.
- **DB-01 nominations table cleanup** — deferred 2026-04-29 during v2.7 Phase 66 discussion; user opted to keep table as is. Source: `2026-04-28-cleanup-nominations-table.md`.
- **Generalize candidate app to support parties** — `2026-03-28-generalize-candidate-app-to-party-app.md` + PROJECT.md §Milestones #22.
- **Investigate migrating candidate answer store** — architectural; `2026-03-28-investigate-migrating-candidate-answer-store.md`.
- **Strapi-era auth-flow leftovers** — `password-reset-code-method` + `register-page-registrationkey-method`. Pair as a small "candidate-app auth dead-code retirement" workstream.
- **Configurable mock data generation** — `configurable-mock-data.md`. Supabase replacement for the old Strapi `GENERATE_MOCK_DATA_ON_INITIALISE`.
- **Adapter package loading via TSConfig** — `adapter-package-loading.md`.
- **AdminWriter rename** — `rename-admin-writer.md`. Low priority.
- **`2026-05-09-rewrite-parent-answer-imputation`** — matching-package internal; future matching-focused milestone.
- **SQL linting / formatting tooling** — `sql-linting-formatting.md`. CI hygiene.
- **Admin App migration** — PROJECT.md §Milestones #19.
- **Settings & Configuration paradigm reorg** — PROJECT.md §Milestones #21.
- **Automated security and secrets scanning** — PROJECT.md §Milestones #20.
- **Trusted publishing for npm (OIDC)** — deferred until after initial manual publish.
- **165 pre-existing intra-package circular deps** in `@openvaa/data` / `@openvaa/matching` / `@openvaa/filters` (`internal.ts` barrel pattern) — dedicated structural refactor milestone.
- **Claude Skills: architect, components, LLM** — deferred to post-Svelte 5 stabilization.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native apps | Web-first approach (long-standing project decision) |
| Package manager migration to pnpm | High risk, low reward with Turborepo on Yarn 4 |
| Nx / Lerna adoption | Overkill for 9-package monorepo; Turborepo + Yarn 4 is sufficient |
| oxlint migration | Svelte template linting not supported; re-evaluate when Svelte support ships |
| Adding more test runners | Playwright + Vitest + pgTAP is the durable stack; v2.9 deepens this stack, doesn't replace it |
| New visual-regression baselines | `PLAYWRIGHT_VISUAL` env-gated regime is the existing convention; v2.9 does not expand visual baselines (that's a separate milestone if/when needed) |
| Performance budget expansion | `PLAYWRIGHT_PERF` env-gated regime stays as is; v2.9 does not expand perf coverage |
| Cite-and-fix WCAG violations from axe smoke | A11Y-03 wires the harness; violation triage is a follow-up phase. Keeps Phase D bounded. |
| Scope expansion to "all" `customData.*` fields | SETTINGS-02 covers `allowOpen` specifically (named gap from v2.0 notes); other `customData` fields are not currently exposed gaps and are out of scope for v2.9 |
| New E2E framework / migration | Playwright 1.58.2 is the durable stack; v2.9 is content (coverage + determinism), not infrastructure |

---

## Traceability

_Each requirement maps to exactly one phase. Filled by `/gsd-new-milestone` roadmapper at roadmap creation (2026-05-10); CLEAN-05 added 2026-05-11 post-Phase-73 close to scope review follow-ups + voter-fixture Path B. 24 requirements / 6 phases / 100% coverage._

| REQ-ID | Phase | Notes |
|--------|-------|-------|
| DETERM-01 | Phase 73 | Skip-modifier sweep — extends v2.6 Phase 64 voter-results.spec.ts pattern |
| DETERM-02 | Phase 73 | 19 data-loading races — paired with DETERM-03 (same patterns drive both) |
| DETERM-03 | Phase 73 | 98 `playwright/*` warnings — paired with DETERM-02 |
| E2E-01 | Phase 74 | Multilocale candidate translation surface |
| E2E-02 | Phase 74 | Browse-without-match results |
| E2E-03 | Phase 74 | Feedback dialog persistence |
| E2E-04 | Phase 74 | Election + constituency selector matrix (5 cells) |
| E2E-05 | Phase 74 | Voter answer in entity details (4 cases) |
| E2E-06 | Phase 74 | Skip / delete / back navigation |
| E2E-07 | Phase 74 | Per-category SubMatch breakdown |
| E2E-08 | Phase 74 | Locale switching — paired with CLEAN-04 (i18n wrapper) per Phase 78 Pairing note |
| QSPEC-01 | Phase 75 | Boolean question rendering (voter flow) |
| QSPEC-02 | Phase 75 | Categorical (single+multi) question rendering (voter flow) |
| A11Y-01 | Phase 76 | Candidate profile validation rejection paths |
| A11Y-02 | Phase 76 | Candidate profile reload-persistence (extends v2.1 CAND-12) |
| A11Y-03 | Phase 76 | `@axe-core/playwright` WCAG 2.1 AA smoke wiring (5 routes) |
| SETTINGS-01 | Phase 77 | `appSettings` / `appCustomization` per-toggle matrix — folds `2026-04-27-extend-e2e-filter-type-coverage` |
| SETTINGS-02 | Phase 77 | `customData.allowOpen` (closes v2.0 milestone-notes gap) |
| SETTINGS-03 | Phase 77 | Per-question visibility flags + must-answer enforcement |
| CLEAN-01 | Phase 78 | `dev:* → db:*` rename + `dev:clean` + `db:reset` chain |
| CLEAN-02 | Phase 78 | Voter-not-located deferred-target redirect |
| CLEAN-03 | Phase 78 | Post-71 carry-forward trio (D-04 distribution + `setStore` cleanup + CLAUDE.md anchor) |
| CLEAN-04 | Phase 78 | i18n wrapper tightening — paired with E2E-08 per Phase 78 Pairing note |
| CLEAN-05 | Phase 78 | Phase 73 review follow-ups (CR-02 + 7 WR + 5 IN from `73-REVIEW.md`) + voter-fixture race-fix Path B (`--likert-only` seed modifier per voter-fixture todo) |
