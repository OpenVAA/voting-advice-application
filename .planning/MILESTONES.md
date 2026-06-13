# Milestones

## v2.13 Context-as-Class Migration (Shipped: 2026-06-13)

**Phases completed:** 12 phases (106-117), 35 plans, 50 tasks
**Requirements:** 15/15 v1 satisfied (CLASS-01..07, FLATTEN-01/02, RENAME-01/02, SWEEP-01/02/03, GATE-01)
**Milestone-close gate:** full E2E **95/95 to the 3× determinism standard** (fresh server, clean DB) + unit (frontend 766 + dev-seed 450) + typecheck (0 net-new over the 151 baseline) + lint — all green
**Branch:** feat-gsd-roadmap. Phase numbering continued from the superseded v2.12 (last phase 105) → started at Phase 106 (no reset).

**Delivered:** Every remaining Svelte 5 reactive context in `apps/frontend/src/lib/contexts/` is now an idiomatic class — completing the runes transition that v2.11 began and superseding v2.12's handle-idiom approach.

**Key accomplishments:**

- **Context-as-class conversion (CLASS-01..07, Phases 106-112)** — converted every remaining context to a Svelte 5 class lowest-blast-radius-first: Group F helpers (`PopupStore`/`VideoController`/`SettingsOverlay`/`persistedState`) → leaf contexts (`authContext`/`componentContext` + reconciled the 3 landed `darkMode`/`dataContext`/`filterContext` proofs) → app producers (`getRoute`/`survey`/`trackingService`/`popupStore`) → the `appContext` orchestrator (with the `{ ...ctx }` spread-of-context fix → explicit own-enumerable getter forwarding + Phase-102 `_poc*` removal) → the `voterContext`/`candidateContext`/`adminContext` orchestrators. Destructure-trap contract preserved; SSR-correct appSettings/appCustomization synchronous-init merge intact; v2.11 admin auth-forwarding fix preserved.
- **Handle flatten + de-duplication (FLATTEN-01/02, Phase 113)** — collapsed every `reactiveFoo`/`Foo` duplicate handle pair to a single reactive class field, removed the spike-017 `{ current, instance }` dataRoot split, and flattened ~189 consumer `.current` reads to bare class-field reads via an idempotent codemod; `appSettings`/`dataRoot`/`locale` are now bare reactive accessors. Grep gate: zero `reactive*` duplicate handles.
- **Store → State rename (RENAME-01/02, Phase 114)** — renamed all rune-native `*Store` symbols/files/types/tests to `*State` (`answerState`, `filterState`, `matchState`, `popupState`, `candidateUserDataState`, `question*`/`param`/`nomination` clusters, client admin `jobStores`→`jobStates`); the server `jobStore` + `cookieStore` test mock documented as intentional exclusions. Grep gate: zero rune-context `*Store` identifiers.
- **Straggler clearance (SWEEP-01/02/03, Phase 115)** — converted the last real `svelte/store` (`videoPreferences`) to a `$state` rune, removed the stray `$: console.info` Svelte-4 reactive statement, and widened the `svelte/store` ESLint guard from `lib/contexts/**`+`routes/**` to the whole `apps/frontend/src/**` tree.
- **dataRoot cold-entry reactivity fix (Phase 117)** — root-caused + fixed a real `$derived(ctx.dataRoot)` intermediate-alias staleness on direct-URL (cold) entry (Svelte 5 referential-equality downstream-skip over the identity-stable `#version`-bridge accessor): 12-site direct-read codemod, CLAUDE.md carve-out, new `cold-entry-dataroot` E2E project + negative control; validated by Spike 024 (4/4). This unblocked the full-E2E half of the gate.
- **Milestone-close green gate (GATE-01, Phase 116)** — full E2E 95/95 to the 3× determinism standard + unit + typecheck + lint green; recorded as `116-MILESTONE-CLOSE-ANCHOR.md`. Two environmental preconditions documented (clean DB + fresh server per run).

**Known deferred items at close:** 6 (see STATE.md "Deferred Items" → Acknowledged at v2.13 close) — 1 verified-done quick-task with an unflipped status flag + ~52 standing-backlog todos (incl. CAND-STORE-01, deferred to v2). The 2 🔴 audit items (debug `dataroot-stale-direct-nav` + Phase 113 verification gap) were **resolved** at close, not deferred.

---

## v2.12 Runes-Native Cleanup (⊘ SUPERSEDED: 2026-06-12)

**Status:** Superseded mid-flight by **v2.13 Context-as-Class Migration** — not shipped. Started 2026-06-08, halted 2026-06-09 (~25%: 1 of 4 phases complete).

**What happened:** Phase 102 (Handle-Idiom Spike) locked a get/set-accessor + plain-getter idiom for the 40 `{ readonly current }` context handles, and Phase 103 began the `.current` codemod. A follow-on spike line (017–023) + `CONTEXT-MEMBER-AUDIT.md` then proved the deeper move — **turn each context into a Svelte 5 class** — and LOCKED it 2026-06-12 (validated on 3 real production contexts, zero consumer churn, full green). The class field subsumes the handle idiom, so the Phase 103 codemod was abandoned and the migration restarted as v2.13. The still-valid Store→State rename (Phase 104) + straggler clearance + green gate (Phase 105) carried forward into v2.13.

**Phases:** 102 ✅ (spike, decision later superseded) · 103 ~ (1/2 plans, codemod authored but never applied) · 104 ⬜ → v2.13 · 105 ⬜ → v2.13. Full disposition: `milestones/v2.12-MILESTONE-AUDIT.md`. Artifacts: `milestones/v2.12-phases/`, `milestones/v2.12-ROADMAP.md`, `milestones/v2.12-REQUIREMENTS.md`.

---

## v2.11 Svelte 5 Runes Migration + View Transitions (Shipped: 2026-06-07)

**Phases completed:** 7 phases (95-101), 22 plans, 42 tasks

**Delivered:** Retired every remaining legacy `svelte/store` bridge in the frontend for idiomatic Svelte 5 runes (Domain A, 4 waves: contexts → bridges → consumer codemod → cleanup), shipped the View Transitions cross-fade + WCAG 2.1 AA navigation-a11y that closes the perceived "redraw on Q→Q" (Domain B, 2 waves), and re-enabled the 2 quarantined `perm-per-app-notifications` E2E tests. Milestone-close green gate: full E2E **84/0**, full unit green, a11y-smoke 10/10, 3× targeted determinism clean.

**Audit:** `tech_debt` — no blockers. **22/22 requirements satisfied + 18/18 cross-phase integration seams wired + 3/3 E2E flows complete.** tech_debt reflects close-out paperwork only — resolved before close (authored 101-VERIFICATION.md, flipped the stale NAVA11Y-03 traceability note, backfilled 4 SUMMARY frontmatter REQ-IDs, closed the elections-continue-stall debug record); carried (6/7 Nyquist VALIDATION draft flags — coverage proven by the green suite). Full audit: `milestones/v2.11-MILESTONE-AUDIT.md`.

**Timeline:** 4 days (2026-06-04 → 2026-06-07).

**Known deferred at close:** 11 non-blocker items acknowledged — 4 deferred-to-Phase-101 verification markers (closed by the green gate) + 1 Phase-99 UAT (0 pending scenarios) + 1 done-but-unflagged quick task + 5 counted backlog todos (~51 more standing). See STATE.md → Deferred Items; triage via `/gsd-review-backlog`.

**Key accomplishments:**

- new typed `export const load: LayoutLoad = async () => ({})` mirroring `results/[[electionTab]]/+layout.ts`'s const-form + return-`{}` shape, with the `// eslint-disable-next-line func-style` reason and a doc-comment noting data flows via `voterCtx` (load is a parity stub establishing the unified-layout pattern; no server guard). Ran `yarn build` so `.svelte-kit` regenerates `./$types` with the new `LayoutLoad`.
- Re-enabled the 2 quarantined perm-per-app-notifications cross-route isolation tests (the load-bearing one-line change of SUITE-01) and verified they pass 2/0; fixed two D-02 regressions surfaced during verification.
- Resolved the carried-in voter-detail-drawer color-contrast failure as a scan-timing false positive — axe was scanning mid drawer fly-in; the fix is a transition-settle wait, with NO theme change — and fixed an EntityList rune-migration crash that blocked the results render entirely.
- v2.11 milestone-close green gate PASSED — full E2E 84/0, full unit green, a11y-smoke 10/10, and a 3x targeted determinism pass — after fixing several rune-migration regressions and one test-fixture flake the gate surfaced.
- appContext's appSettings + appCustomization DB override now merges at `$state` init (SSR-correct, no post-hydration flash) and `mergeAppSettings` is a pure spread that no longer mutates the shared `staticSettings` module reference.
- Rune-native dataContext — dropped the internal `writable(dataRoot)` + `get(dataRootStore)` infinite-loop workaround, added a `current`/`instance` Pattern-2 handle split with `untrack()`, and kept a hand-rolled Readable bridge for the 23 un-migrated `$dataRoot` consumers.
- Introduced the shared rune-native `localStorageState<T>(key, default)` helper (versioned-payload core reusing `getItemFromStorage`/`saveItemToStorage`, no migration shim) and migrated BOTH the voter `answerStore` and the candidate `candidateUserDataStore` off the three-layer `$state → localStorageWritable → fromStore` bridge onto a single handle — zero `svelte/store` import at either callsite.
- popupStore migrated to the pure-rune queue-shaped Pattern-1 (`get current()` getter, zero `svelte/store` imports); the single `fromStore(popupQueue)` consumer in `routes/+layout.svelte` migrated to `popupQueue.current` and the `Readable<T>` surface dropped from the type.
- sessionStorageState rune helper + pure-rune survey/trackingService producers with the appContext seam owning their store-shaped bridges and exposing new reactiveAppSettings/reactiveLocale .current getters that unblock Plan B.
- voterContext is now a fully `svelte/store`-free rune-native factory and candidateContext is rune-native except the one tolerated `fromStore(getRoute)` bridge — both compose Tier-1 via `getAppContext()`'s `reactiveAppSettings.current`/`reactiveLocale.current` getters, with `firstQuestionId` + candidate preregistration ids on the rune-native `sessionStorageState`/`localStorageState` helpers; all 18+/30+ reactive accessors and the destructure-trap preserved.
- Removed the `...authContext` spread from the `adminContext` object literal. Replaced it with an explicit `get isAuthenticated() { return authContext.isAuthenticated; }` (re-reads the live $derived on every access) plus direct reference forwards of the four stable auth functions (`logout`, `requestForgotPasswordEmail`, `resetPassword`, `setPassword`). The `...appContext` spread was PRESERVED (its surface has no top-level reactive getter — see audit). A code comment above the getter explains the de-reactivation rationale (CONS-03 / Pitfall 2).
- `getRoute` is now a pure rune-native `$derived.by` producer and the entire frontend (~278 sites) is migrated off the legacy store bridges in a single atomic commit — with no red build at any commit boundary.
- Phase 98 Wave-4 cleanup: drove the `svelte/store` mechanical-acceptance grep to zero across `lib/contexts/**` + `routes/**` and added the ESLint guard (CLEAN-02) blocking reintroduction.
- Reshaped every store-shaped `appContext` export (appType/appSettings/appCustomization/openFeedbackModal/locale/locales/darkMode/userPreferences/surveyLink + tracking handles) from `toStore`/`fromStore` wrappers to pure `{ current, set?, update? }` rune handles, and migrated all 22 consumers (the 5 named `fromStore` route consumers plus ~17 latent `$store` auto-subscribe components) to direct `.current` reads — closing the app-layer half of CLEAN-01 with zero `svelte/store` in `lib/contexts/app/
- Completed CLEAN-01's deletion half: removed `StackedState.svelte.ts` (+test), `dataCollectionStore.ts`, and the entire 60-file `routes/runes-test/` spike tree, then slimmed `persistedState.svelte.ts` to its rune-only core (dropping the `svelte/store` import + the legacy `localStorageWritable`/`sessionStorageWritable`/`storageWritable` helpers while keeping `localStorageState`/`sessionStorageState`/`storageState` verbatim) — driving the CLEAN-01 acceptance grep (`from 'svelte/store'` across `lib/contexts/
- Landed the View-Transitions cross-fade coupling + WCAG-compliant navigation a11y (aria-live route announcer, focus reset, dual-layer reduced-motion) in the real SvelteKit root layout, backed by a shared, `any`-free `viewTransition.ts` helper.
- Assigned `view-transition-name`s across the expanded VT-02 surface set (chrome, question hero/heading/actions on both apps, results election-switch + entity tabs, entity-detail drawer tabs) so Plan 01's onNavigate coupling produces element-stable cross-fades instead of a perceived full-page redraw, added the `data-focus-on-nav`/`tabindex=-1` heading markers that the root focus hook lands on (NAVA11Y-02 per-route half), and gave the shared `Tabs` an opt-in local-state cross-fade wrapper for the drawer tabs (O-1).
- Extended the existing `a11y-smoke` Playwright spec with a route-announcer assertion (NAVA11Y-01) and a focus-on-nav assertion (NAVA11Y-02), both driven deterministically via the `?notr=1` escape hatch, while preserving the per-rule + global axe 0-violation gate verbatim (NAVA11Y-03). The spec typechecks and lints clean and the unit suite is green; the live a11y-smoke located-route run is currently blocked by a pre-existing, out-of-scope shared-fixture/seed issue that fails the baseline located axe tests identically — recorded honestly as a human-verification item, NOT a fabricated green run.

---

## v2.10 Test Reliability + A11y Compliance + All-Green Suite (Shipped: 2026-06-04)

**Phases completed:** 19 phases (79-94, incl. 86.1/86.2/86.3), 66 plans, 140 tasks

**Delivered:** Restored Playwright parity-regen capability + WCAG 2.1 AA compliance + drove the E2E suite to all-green, then audited / refactored / reorganised the entire E2E catalog into a clean, typechecked, deterministically-green suite. Final suite human-verified **82 passed / 2 skipped** (2026-06-04); the 2 skipped are the intentional `perm-per-app-notifications` quarantine (re-enable after the Svelte 5 runes migration).

**Audit:** `tech_debt` — no blockers. 13/16 formal requirements satisfied + 3 partial (DETERM-12/13/14 documentary debt: missing VERIFICATION.md, substantively complete) + 0 unsatisfied. Full re-audit (79-94): `milestones/v2.10-MILESTONE-AUDIT.md`.

**Timeline:** ~23 days (2026-05-12 → 2026-06-04).

**Known deferred at close:** 49 standing backlog todos carried forward to v2.11+ (see STATE.md → Deferred Items). All v2.10 phase / quick-task / debug / UAT artifacts were resolved at close.

**Highlights:**

- **Determinism recovery (DETERM-04..15):** candidate-profile cascading-race RCA + one-line URL-predicate fix; imgproxy decouple (DATA_RACE 15 → 3); variant-project-cascade proven single-source + decoupled; parity-script constants regenerated; v2.10 ship anchor pinned.
- **WCAG 2.1 AA (A11Y-04..07):** 5 first-run axe violations fixed at root (Tabs `role=tablist` + Drawer/Button aria-label i18n); email / URL / required-empty candidate-profile validation cells; per-rule + global-zero a11y regression gate.
- **E2E catalog overhaul (88-94):** mega-journey pattern + parallel-landing; 22-step candidate-journey reimplementation; 12-file candidate fixture library; TIR5/TIR6 permutation specs; `typecheck:tests` gate + `no-restricted-locators` guard; results-route 4-segment refactor; role-based fixture/setup reorg + `e2e/base` seed consolidation; final de-planning polish (suite reads as a clean product artifact).

**Detailed per-phase one-liners:**

- Empirical Root-Cause Analysis of the candidate-profile cascading race converged on a spec-side URL-predicate bug — frontend session-propagation race is defensively redirected to a login flow that the buggy spec helper fails to enter, NOT a hydration race in the protected layout.
- One-line URL-predicate tightening in `loginIfRedirectedToLoginPage` resolves the registration cascade documented in Plan 01's RCA; verified across 3 isolated runs + 1 full mutation project run + 1 cold-start smoke. A previously cascade-masked image-upload test failure surfaces as a new, structurally unrelated cascade source; documented for follow-up.
- XOR contingency fallback for Plan 02. Plan 02 closed PASS-with-deferral on 2026-05-13T00:32Z resolving DETERM-04 via a single-line URL-predicate fix in tests/; the XOR contract `xor_with: [79-02]` makes 02F a no-op. Task 0's trigger gate confirmed `RCA pivot-to-restructure trigger: N` and the agent short-circuited per the plan's explicit short-circuit logic. No restructure tasks executed; no modifications to tests/tests/setup/, tests/playwright.config.ts, or tests/tests/specs/candidate/candidate-profile.spec.ts.
- DETERM-05 GREEN.
- 5 WCAG 2.1 AA violations resolved via Tabs.svelte role=tablist root-cause fix + Drawer/Button aria-label i18n; per-rule + global-zero a11y regression gate landed; Phase 79 v2.10 anchor preserved across 3-run cold-start full suite.
- 1. [Rule 1 — Bug] blur-after-fill missing in initial Task 8 format cells
- `ff0334f856…` (Phase 79 close — 80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE).
- Image-upload cascade unblocked via 4-rung ladder, voter-app flakes stabilized via hydration-completeness guards, v2.10-close anchor regenerated at SHA d6bfeebdb0… (94 PASS_LOCKED + 15 DATA_RACE + 47 CASCADE).
- DETERM-08 cascade-decouple — repointed Playwright re-auth-setup dependency from candidate-app-mutation → candidate-app to break the imgproxy-502 cascade-path that previously pooled 12 non-image-intrinsic tests into DATA_RACE; result is 15 → 3 DATA_RACE shrinkage + 94 → 106 PASS_LOCKED grow + new v2.10 All-Green Suite anchor `04ddfdd85c…`.
- Empirically proves the 47-entry CASCADE pool is **single-source**, rooted in the `voter-app-popups :: should remember dismissal after page reload` deterministic FAIL (3/3 across Phase 84 binding anchor); recommends Path B 1-line `playwright.config.ts:236` decouple for Plan 02.
- Task 4 Step B execution
- Phase 80 A11Y-04 Drawer aria-label landed a second `<button>` matching the locale-resilient regex `/close|sulje|stäng|luk/i` inside the dialog, producing a strict-mode locator collision (2 elements). The Phase 85 run-3 error message was dispositive.
- Widens the post-Likert Skip-Next tail loop in `tests/tests/fixtures/voter.fixture.ts` from 3 → 6 iterations to walk past all 3 non-Likert opinion-question types in the e2e seed (singleChoiceCategorical sort 17, boolean sort 18, number sort 19), closing 5 of 6 cluster #2 voter-detail cells without mutating seed shape — preserves 5 PASS_LOCKED tests requiring test-question-directional-1 by construction.
- OUTCOME: SKIP-FALLBACK. H4 close-transition mitigation (RESEARCH §5.4 form-element direct testId absence assertion) was applied at both close-assertion sites and EMPIRICALLY DISPROVED via per-spec smoke (`9 × locator resolved to 1 element` — form element persists across close-transition because Feedback.svelte is kept mounted via bind:this by design). Both H1 (Phase 86-02 dialog-wrapper count) and H4 (Phase 86.1-02 form-element count) ruled out empirically. 3-element skip protocol applied per CONTEXT D-06; todo filed for v2.11+ pickup recommending capture-trace + close-signal contract redesign.
- 3 Phase-86 deferral cells reconciled per CONTEXT D-05 disposition matrix: Cell 1 LAYOUT-03 → SKIPPED (PASS-WITH-DEFERRAL inheritance); Cell 2 CLEAN-02 → SKIP-FALLBACK (storage-clear empirically insufficient — new hypothesis surfaced); Cell 3 A11Y-01 image-type → FIX-PASS via networkidle settle (5 PASS_LOCKED siblings preserved). Hands off ≤ 2 new SKIPPED_TESTS entries to 86.1-04 for manual filter.
- Extracted 6 thin generic Playwright wrappers (`settleNetworkIdle`, `gotoAndSettle`, `expectLandedOn`, `clickAndRaceSettle`, `iterateSelectOptions`, `assertDbRowCount`, `walkVoterIteration`) into a new `tests/tests/helpers/` layer with `index.ts` barrel + design-rationale README, internally refactored `voter.fixture.ts` to call `walkVoterIteration` (PUBLIC API unchanged), and refactored 4 anchor spec files to call the new helpers.
- Propagated `expectLandedOn` (helper #2) across 27 sites in 7 spec files and `settleNetworkIdle` (helper #1) across 6 sites in 3 spec files (30 total REPLACE), kept 3 negative-landing assertions inline with `// reason:` comments, and explicitly deferred 9 helpers #3-#6 propagation surfaces to v2.11+ per RESEARCH; full-suite smoke confirms zero new failures introduced.
- Helper extraction + propagation refactor verified zero-impact; root-caused and fixed the long-standing candidate-profile test isolation bug; locked 157 passed / 0 failed / 0 cascade / 8 skipped as the v2.10 deterministic baseline.
- `apps/frontend/src/routes/(voters)/+layout.svelte` (89 → 116 lines; +27 LOC delta, within the 25-45 budget and well under CONTEXT D-10's ≤ 60 LOC small-fix gate)
- Chosen path: Path-C (SKIP-FALLBACK). Auto-routed Path-B → Path-C per operator pre-decision after the 1h RCA confirmed Path-B was technically feasible but explicitly rejected on reviewer-drift grounds (asserts filter primitive in isolation; does not regression-gate the voter-app PRODUCT-GAP). Path-A (ship UI) NOT ATTEMPTED per RESEARCH 'DO NOT ATTEMPT in 86.3' guard + D-08 1h cap. THIRD consecutive Wave 1 SKIP-FALLBACK after 86.3-03 (cell #5) + 86.3-04 (cell #6); preserves PRODUCT-GAP signal for v2.11+ pickup.
- OUTCOME: SKIP-FALLBACK. H2 (multi-dialog collision) + H3 (Svelte 5 dialog reset semantics) trace-driven disambiguation per Phase 86.3-03 PLAN was ATTEMPTED but BLOCKED by an upstream `answeredVoterPage` fixture race (CASCADE-class, separate from DETERM-13). Trace shows the /questions intro page renders only `Loading…` despite seeded Supabase data — none of the 6 `advanceVoterFlow` checkpoint testIds appear. H2 + H3 both remain UNVERIFIED; v2.11+ pickup must fix the fixture race FIRST. Test signature surgically swapped from `({ answeredVoterPage })` to `({ page })` so the `test.skip(true, …)` reports as `1 skipped` instead of `1 failed`. ModalContainer.svelte UNCHANGED.
- LAYOUT-03 / DETERM-12 cell #6 dispositioned SKIP-FALLBACK after empirical Path 2 (`page.context().addInitScript`) fix-attempt failed. Path 2 swap LEFT IN PLACE as evidence-of-attempt; Path 1 abandoned at RESEARCH §"Pitfall 4" (static storageState vs runtime-discovered question UUIDs); production-code loader UNCHANGED per D-10 STRICT gate. v2.11+ todo augmented with cross-reference to Phase 86.3-03 trace finding — characterizes the upstream Loading… symptom as shared across voter-app cold-deeplink surface (`/questions` AND `/results`).
- Phase 86.3 v2 baseline (2026-05-21) — operator-verified 3-run all-pass.
- `tech_debt` — operator-accepted v2.10 ship close.
- Task 1 (baseV1 template)
- Refactored the voter-app `/results` URL surface from 3-segment to 4-segment (added optional FRONT `[[electionTab]]` carrying the SELECTED singular election; renamed `entityTypePlural`/`entityTypeSingular` matcher-gated segments to short-form `entityTab`/`entity` via new `etPl`/`etSg` matchers); achieved structural NAME-DISJOINT dissociation between the route-side SELECTED-singular and search-side AVAILABLE-multi election surfaces; added `currentResultsElection` voterContext reactive accessor + server-side guards (invalid-electionTab strip-redirect, 1-available auto-canonicalize) that kill the spurious-picker case voter-journey:292-294 currently exercises; all 8 tasks landed across 8 atomic commits with ZERO new tsc errors against the 215-error pre-existing baseline.
- NOT VERIFIED (infra blocker).
- TIR4:17-32 + 82-100 baseV1 mutations (hero emoji+image, info content, required-flag flip, unregistered candidate with election_symbol "999", 3 filtered info questions mun/north/south) landed in-place plus 3 voter testids + 4 voter-mega-journey assertion groups + 8 deferred items surfaced.
- 12-file candidate fixture library shipped per D-89-02 — 11 fresh function-fixtures + 1 composition root + 7 new testids landing on 4 candidate-app Svelte files; legacy PageObject classes UNTOUCHED; library unwired by design (89-03 wires it).
- 22-step single serial candidate-mega-journey spec landed end-to-end per TIR4:101-257 (registration via Inbucket → password set → ToU → home three-task → mid-flow logout-with-dialog → forgot-password reset → wrong-password branch → return-from-static → profile fill (filtered partition + required gate + portrait error paths) → opinion walk → preview → final logout-without-dialog) + 3 new playwright project entries + setup/teardown pair with auth.users cleanup + constants single-source-of-truth. Static verification clean; 3-run cold-start gate deferred to operator runbook per environment cascade.
- 3 perm templates + 3 setup/teardown pairs + 3 spec files + 9 playwright project entries landed end-to-end per TIR4-PERM-01..03 (voterApp disabled, candidateApp disabled, per-app notifications). Each template uses a distinct externalIdPrefix ('e2e-perm-novapp-' / 'e2e-perm-nocand-' / 'e2e-perm-notif-') per D-89-03 enabling cross-chain parallel safety. Sequential perm chain appended after candidate-mega-journey. Static verification clean; runtime gate deferred to operator runbook per environment cascade carry-forward from 89-01/02/03.
- 5 absorbed candidate specs deleted from disk + 3 candidate-settings test blocks excised (CAND-10/11/13) + 4 zero-consumer PageObject classes pruned + tests/playwright.config.ts cleaned of 2 defunct project entries + 1 testMatch regex narrowed per project + 1 dependency rerouted. Static verification GREEN in both default + legacy modes; dynamic full-suite gate deferred to operator runbook per the established 89-01/02/03/04 environment-cascade precedent.
- TIR5:15-26 missing-nominations modal E2E perm — 2 elections sharing 1 CG/CO, 1 candidate, 1 nomination in el-1 only; voter selects both elections and the modal surfaces el-2 with the "not available" marker.
- 1. [Rule 3 — Blocking issue] buildMinimal needed single-org nomination support
- 1. [Rule 1 — Bug] login-answers-locked-info testid would mark the wrong branch if applied unconditionally
- Replaces synthetic-session perm authentication with real `forceRegister` + UI login, swaps 2 hand-rolled voter walks for the voter-mega answeredVoterPage fixture, and scopes the cycle-3 feedback drawer locator to eliminate the cycle-2-close race.
- tests/ now typechecks green via a committed --noEmit tsconfig wired into lint:check, the locator guard is upgraded to no-restricted-locators (errors on bare page.locator, chained .locator, and getByText while keeping getByRole/getByTestId), and all 5 raw-locator sites are guarded — `yarn lint:check` exits 0.
- 1. [Rule 3 - Path correction] Frontend route paths
- 1. [Rule 3 - Blocking lint] Import sort after adding TIMEOUTS imports
- 1. [Rule 3 - Blocking lint] Import sort in perm-l10n.ts
- Completed the role-based fixture taxonomy: moved all 5 root voter-app fixtures (voter-journey/views/resultsPage/entityDetails/entityFilters) into `fixtures/voter/`, the 3 cross-app fixtures (emailBucket/langSelector/multilingualText) into `fixtures/shared/`, `voterNavFixture` into `fixtures/voter/`, extracted `minimalVoterResultsPage` into its own `voter/` fixture, renamed the candidate composition root + constants file off the `mega` token (`candidate-journey.ts` / `candidateJourneyConstants.ts`) and the export `voterMegaTest` -> `voterJourneyTest` — each move landed with ALL its importer rewires in the same commit, keeping `yarn typecheck:tests` + `eslint tests` green at every commit.
- Renamed the journey specs (`voter-mega-journey.spec.ts`/`candidate-mega-journey.spec.ts` -> `voter-journey.spec.ts`/`candidate-journey.spec.ts` + their READMEs) to re-attach the Plan 04 `voter-journey`/`candidate-journey` testMatch set — restoring `playwright test --list` to the Wave 1 baseline (84 tests / 72 files) from the 82/70 transient orphan — aligned the a11y spec's comment refs to the base `voter-journey` fixture (imports already repointed in Plan 03), fully rewrote the stale `tests/README.md` project graph to the new `data-setup-base` + journey + perm + opt-in families, updated `CLAUDE.md` `--template e2e` -> `e2e/base`, and drove `mega`/`baseV1` tokens to ZERO across `tests/` + `packages/dev-seed/src/`. `yarn typecheck:tests` + `eslint tests` + dev-seed `test:unit` + `playwright test --list` all green.
- Rewrote the canonical base dataset external_id prefix from the divergent `test-`/`test-baseV1-`/`test-e2e-` set to `test-e2e-base-` across all 505 literals in `e2e/base.ts` (mechanism B — rewrite-in-place, writer writes fixed[] ids verbatim) plus the internal `_elections`/`_constituencies` sentinels, retargeted the base teardown PREFIX + the `setupFromTemplate` freshness-guard fallback, updated the dev-seed base test assertions, then ran the single EXPENSIVE `yarn test:e2e` phase gate. The first gate run surfaced two latent regressions from earlier waves (base-data consumers in `tests/utils/` outside the plan's file list, and a 3-election isolation leak from Plan 04's FLAG-6 decoupling); both were root-caused + fixed mid-checkpoint and the operator re-ran the full suite GREEN end-to-end.
- WR-01..04 + D-02 landed: husk + diff tool deleted, fail-loud empty-prefix teardown guard, data-driven median ordinal default, perm-per-app-notifications re-enable TODO; two infra files de-planned; playwright --list baseline pinned at 84/72.
- De-archaeologized the 10 voter fixtures + 4 shared fixtures, reformatted the highest-title-density spec (voter-journey) to plain language, and deleted the redundant voter-journey README — typecheck green, scoped residual grep empty.
- De-archaeologized the 6 test utils, 5 helper-source files, 3 shared setup files, and 3 root config files (incl. eslint.config.mjs), rewrote the seed-test-data throw message to drop Phase 93 archaeology while keeping the e2e/base literal — typecheck green, scoped residual grep empty.

---

## v2.9 E2E Coverage + Suite Determinism (Shipped: 2026-05-12)

**Phases completed:** 6 phases (73-78), 32 plans, 89 tasks
**Timeline:** 3 days (2026-05-10 → 2026-05-12)
**Audit:** `tech_debt` — 24/24 requirements satisfied; 12 PASS + 12 PASS-WITH-DEFERRAL; 8 v2.10+ candidate todos filed.

**Key accomplishments:**

- **Phase 73 — Determinism Baseline.** Reduced the Playwright suite to a hard pass/fail signal: 0 `test.skip(true, …)` modifiers (DETERM-01); 19 data-loading races diagnosed and fixed (DETERM-02 — 3-run cold-start SHA-identical at `e2e56e73fa42…`); 98 `playwright/*` ESLint warnings resolved with no-conditional-in-test / no-raw-locators / no-networkidle sweeps (DETERM-03); lint-gate bumped warn→error.
- **Phase 74 — High-Leverage E2E Coverage.** 8 new spec surfaces in one phase: multilocale translation surface (E2E-01), browse-without-match (E2E-02 + new `variant-low-minimum-answers` Playwright project), feedback persistence (E2E-03), 5-cell selector matrix (E2E-04 + 2 new variant projects `1e-Nc` + `Ne-Nc`), 4-case voter-vs-entity answer rendering (E2E-05), skip/delete/back CTA toggle (E2E-06), per-category SubMatch breakdown (E2E-07), locale switching (E2E-08).
- **Phase 75 — Question-Rendering Specs.** Permanent E2E user-story gates for Boolean opinion question (QSPEC-01, v2.6 P61 2-button radio) and single-choice categorical opinion question (QSPEC-02), deduplicated against existing matching tests via unified dedup audit; `walkToQuestion(page, sortOrder)` helper extracted.
- **Phase 76 — Profile + A11y.** Candidate profile validation rejection paths (A11Y-01: image-type / image-size / name-too-long); reload-persistence extension covering displayName + bio + social link (A11Y-02); `@axe-core/playwright@4.11.3` integrated with `PLAYWRIGHT_A11Y` env-gated 6-route smoke (A11Y-03) — first-run baseline captures 5 WCAG 2.1 AA violations across results + voter-detail-drawer routes (cite-and-fix routed to v2.10+).
- **Phase 77 — Settings Matrix + Q-Custom Gap-Fills.** Per-toggle `appSettings`/`appCustomization` matrix (SETTINGS-01 wave A 10 cells + wave B 6 filter-type cells folding the filter-type coverage todo); `customData.allowOpen` display-side coverage via new `variant-allowopen` project (SETTINGS-02 LANDMINE-1 reframing); per-question visibility + must-answer via new `variant-hidden-required` project chain (SETTINGS-03 voter-hidden + candidate-required cells).
- **Phase 78 — Cleanup Hygiene.** 5 residual workstreams closed in one bundled phase: `dev:* → db:*` Supabase script rename + new `dev:clean` cache wipe + `db:reset`/`db:reset-with-data` chain (CLEAN-01); voter-not-located `?next=` deferred-target redirect with URL-whitelist guard + 5-cell E2E spec (CLEAN-02); 13 per-cast `// reason:` blocks + `setStore` cast elimination + CLAUDE.md Svelte warning-accepted format anchor (CLEAN-03); i18n wrapper tightened to `TranslationKey` union + `t.get` alias retired + `@ts-expect-error` regression-locker (CLEAN-04, Order B paired with E2E-08); `--likert-only` CLI flag added to `@openvaa/dev-seed` (Path B operator-locked-in for voter-fixture race) + 13 Phase 73 review findings + bonus CR-01 closed (CLEAN-05).

**Cross-phase contracts:** Phase 73 DATA_RACE pool (15 IMGPROXY-tied) preserved structurally through 78. Phase 75 PASS_LOCKED constants (47/15/33) preserved across 76 → 77 → 78 via three consecutive architectural-deferral decisions; constants-regen and 3-run cold-start gate DEFERRED-WITH-RATIONALE at Phases 76/77/78 close due to inherited candidate-profile cascading race (routed to v2.10+).

**Known Deferrals (routed to v2.10+):**

- HIGH: candidate-profile cascading race (`candidate-profile.spec.ts:85-145`) — cascade-skips 43+ downstream tests; blocks parity-script regen at every gate
- MEDIUM: 5 PRODUCT-GAP discoveries (A11Y-01 email/url/required-empty cells; SETTINGS-02 voter-authoring; SETTINGS-03 voter-required; FilterGroup OR-mode UI; voters-layout non-reactive topbar)
- MEDIUM: A11Y axe cite-and-fix (5 first-run violations across 2 routes)
- LOW: constituency-filter PRODUCT-GAP

Tag: `v2.9` | Archive: `.planning/milestones/v2.9-*` | Audit: `.planning/milestones/v2.9-MILESTONE-AUDIT.md`

---

## v2.8 Alliance Card + Frontend Hygiene Sweep (Shipped: 2026-05-10)

**Phases completed:** 4 phases (69-72), 13 plans, ~37 tasks
**Timeline:** 3 days (2026-05-08 → 2026-05-10)
**Audit:** `.planning/milestones/v2.8-MILESTONE-AUDIT.md`

**Key accomplishments:**

- **Phase 69 — Alliance Card Lane A.** Type rename (`'candidates' → 'children'`) + alliance render path through EntityCard + EntityDetails + cascading-impute pipeline (imputeParentAnswers childProxies generalisation + matchStore Alliance branch). Voters can now navigate the Alliances tab on results and see populated cards with member organizations + "X candidates across N parties" summary; alliance detail drawer renders member-orgs.
- **Phase 70 — Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup.** 3 warning categories surfaced during v2.7 Phase 67 UAT closed: Cat A `state_referenced_locally` rewrites (5 files / 9 sites), Cat B `<slot />` → `{@render children?.()}` (WithPolling.svelte), Cat C a11y fix (Input.svelte:521 `<label>` → `<button>`), Cat D SSR fetch-eagerness `onMount` wrap. 26 `// bind: keep —` rationale comments stripped across 24 files (BIND-01).
- **Phase 71 — Frontend Strict-Typing Cleanup.** 95 pre-existing frontend ESLint errors resolved at source: `no-explicit-any` sweep (67 errors); `naming-convention` sweep (13 errors — type-parameter `T → TX` renames + 1 `_Unused` deletion); `func-style` + long-tail (15 errors). Frontend now matches the lint-clean baseline of `@openvaa/core`/`data`/`matching`/`filters`/`app-shared`.
- **Phase 72 — Package Hygiene Trio.** `@openvaa/app-shared` paradigm normalised against canonical reference packages (SHARED-01); `mergeSettings` re-export shim retired from `apps/frontend/src/lib/utils/merge.ts` (SHARED-02); `@openvaa/supabase` lint-script disambiguated to `lint:sql` vs `lint:js` (LINT-01).

Tag: `v2.8` | Archive: `.planning/milestones/v2.8-*`

---

## v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (Shipped: 2026-05-08)

**Phases completed:** 4 phases, 9 plans, 28 tasks

**Key accomplishments:**

- Pattern 1 fix (1 file):
- Closed SVELTE5-02 (2 `{#key}` annotations + 1 Pattern B keyed each conversion) and SVELTE5-03 (6 reactive-accessor destructure rewrites + new CLAUDE.md rule subsection). Also fixed a stray broken `docs/code-review-checklist.md` link in CLAUDE.md.
- Phase 65 verification: PASS.
- Replaced 2 inline `as unknown as { ... }` casts in `supabaseDataProvider.ts` with a single named `InternalFlatNomination` type defined in a sibling `.type.ts` file; svelte-check baseline preserved at 160 err / 12 warn; vitest 646/646 green; v2.6 parity gate `67p / 1f / 34c` identical to Phase 64 anchor (PARITY GATE: PASS).
- 2 alliances + 10 alliance noms + 30/10 org-nom parent_nomination split land in the default seed; the v2.6 P64 supabase-adapter alliance reverse-fill is empirically exercised end-to-end.
- Live seed pipeline + integration test + manual UI smoke + Playwright parity gate landed; the v2.6 P64 supabase-adapter alliance reverse-fill is now empirically exercised end-to-end; 3 cross-cutting bugs surfaced + fixed before the verification report closed.
- One-liner:
- One-liner:
- One-liner:

---

## v2.6 Svelte 5 Migration Cleanup (Shipped: 2026-04-28)

**Phases completed:** 5 phases, 17 plans, 48 tasks

**Key accomplishments:**

- Restored the Phase 59 parity gate tooling + baseline from SHA `3c57949c8`, preflighted the diff script against three structural invariants (identity smoke PASS, B-3 out-of-baseline PASS, W-5 constant-count DRIFT observed), and scaffolded the D-09 setTimeout-popup E2E skeleton with test.skip handoff to Plan 60-04 Task 1.
- Refactored root `+layout.svelte` from the hydration-unsafe `$effect + Promise.all(...).then(...)` pattern to a pure `$derived.by` discriminated-union validation + a dedicated `$effect` for `$dataRoot` batching, satisfying LAYOUT-01 SC-1 and eliminating the SSR microtask race on the root layer. Uncovered and auto-fixed (Rule 3) a pre-existing latent SSR crash in `getEmailUrl` that the new synchronous `ready` timing surfaced.
- Refactored `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` from the hydration-unsafe `$effect + Promise.all().then() + await tick()` pattern to a pure `$derived.by` discriminated-union validity + `$derived` 4-way layoutState + dedicated `$effect` for `$dataRoot` batching and `userData.init`. Surfaced and fixed a NEW Svelte 5 runes-mode pitfall — `$storeName.update()` inside `$effect` triggers `effect_update_depth_exceeded` — via `get(store)` + `untrack(...)`. Demonstrably unblocks auth-setup and the post-login dashboard render.
- D-14 outcome: deleted — inline popup rendering via `{@const Component = item.component}` + `<Component ...>` works correctly under Svelte 5 runes on full-page SSR+hydration, confirmed by the new D-09 E2E test. PopupRenderer wrapper + barrel deleted atomically; retention-with-rationale path NOT invoked. Two Rule-1/Rule-3 auto-fixes surfaced en route: `dataRoot.current.update()` inside the root-layout $effect (`effect_update_depth_exceeded`) and AccordionSelect's auto-select $effect (same shape, pre-existing).
- Phase 60 structural work is complete and verified via alternative evidence (LAYOUT-01 grep PASS on root; LAYOUT-02 Plan-60-03 indirect E2E proof on auth-setup + valid-login; LAYOUT-03 D-09 empirical pass). The SC-4 parity gate literal is FAIL — 24 PASS_LOCKED regressions — but all 24 are classified Category A (orthogonal, surfaced-not-introduced, handoff to Phase 61) with zero Category B (Phase 60 genuine). The root cause is a single testId timeout signature (`candidate-questions-list` / `candidate-questions-start`) in the candidate question-flow surface, previously masked in the baseline by LAYOUT-02's stuck-at-Loading symptom, now visible because the layout hydration is fixed. pending_review: true is set for user verification of the classification before phase close.
- isBooleanQuestion type guard + QuestionChoices choices-override prop + OpinionQuestionInput boolean branch closes QUESTION-01 (voters can answer boolean questions) and QUESTION-02 (candidate result-detail renders boolean match-breakdown) via shared dispatch.
- Migrated `voterContext.selectedQuestionCategoryIds` from `sessionStorageWritable` + `fromStore` bridge to pure Svelte 5 `$state<Array<Id>>` with context-level default-all-checked seeding via a guarded `$effect`, simplified the `/questions` page `onMount` to keep only the stale-ID filter + redirect, and added a Playwright regression gate for the "Answer 0 Questions" first-paint symptom. Closes QUESTION-03.
- Compound reactivity + destructuring fix restores candidate-questions page visibility — 8/8 direct candidate-questions.spec.ts tests pass, previously cascade-blocked 18 tests now run (success_criteria contract met).
- FilterGroup.onChange → $state version counter bridge enables $derived filter flow, eliminating the EntityListControls.svelte:56-73 effect_update_depth_exceeded loop and establishing the consumer-side filter-state surface that Plan 62-03 will wire into the results layout.
- Single 4-segment optional-param /results route shape (`[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]`) with typed American-spelled param matchers and a `+page.ts` coupling-guard that 307-redirects invalid singular-without-id URLs — unblocking Plan 62-03's URL-driven Tabs + drawer wiring.
- URL-driven results layout with EntityListWithControls swap, drawer-first paint (source-order + content-visibility: auto), canonical redirect, and 10 new Playwright E2E tests — all Phase 62 behavioural contracts covered; Task 3 manual smoke deferred to phase verification.
- Hoisted the deep-merge utility (`mergeSettings` + `DeepPartial`) from `apps/frontend/src/lib/utils/merge.ts` into `@openvaa/app-shared` as a shared, tested utility and wired `@openvaa/dev-seed` as a consumer — unblocks Plan 63-02's base+overlay `app_settings` template composition.
- 1. [Rule 3 — Blocking] Adjusted doc-comment wording to make `grep -c "toMatchObject" ... = 1`
- Script:
- Closed 3 voter-results E2E failures by converting 6 silent `test.skip(true)` paths to `expect.poll` hard assertions, then fixing the two latent defects (e2e seed missing `parent_nomination` chains; supabase adapter not deriving `parentNominationType`) that the new hard assertions surfaced. Phase 62 Option B reactivity bridge preserved verbatim.
- Empirically disambiguated D-08 shapes 3+4 via fixture-bypass independent reproduction; both shapes PASS deterministically (5/5 runs at ~3s each) without the answeredVoterPage fixture, AND the standard fixture-driven targeted Playwright invocation also passes 5/5. Plan 64-01's downstream fixes (e2e seed parent_nomination wiring + Supabase adapter parentNominationType derivation + spec interaction-race hardening) transitively close shapes 3+4. Plan 64-02 production code unchanged — Branch NONE per CONTEXT D-13 prediction.
- Closes the v2.6 milestone-anchor parity gate via a single canonical Playwright capture (Task 1, attempt 4) once the seed-protocol mismatch was diagnosed; regenerates parity-script constants from that anchor (Task 2); clears the Phase 62-deferred 9-step manual smoke checklist (Task 3) — surfacing five live-UAT reactivity bugs that the smoke session diagnosed and fixed in flight, plus a default-seed densification user-requested mid-session that made the parties tab and categorical-question filters realistically exercisable.
- Closed 50+ pre-existing `vite-plugin-svelte` warnings across 5 categories (a11y rule rename, self-closing non-void HTML, `let` -> `$state`, `state_referenced_locally`, genuine a11y violations) AND applied the Path A voter.fixture.ts timeout bumps that the seed-cascade investigation isolated as the immediate fix for the full-suite voter-app cascade. ElectionSelector auto-select short-circuit converted from init-time to `$effect` so it reacts to async-arriving elections (the empirically-linked critical case from the canonical Playwright capture).

---

## v2.5 Dev Data Seeding Toolkit (Shipped: 2026-04-24)

**Phases completed:** 4 phases, 34 plans, 63 tasks

**Key accomplishments:**

- Scaffolded @openvaa/dev-seed as a private Yarn 4 workspace — package manifest, tsconfig, vitest marker, and placeholder src/index.ts — linked into root devDependencies and amended REQUIREMENTS.md GEN-03 per D-25.
- One-liner:
- Zod v4 TemplateSchema + `Template` (via z.infer<>) + seeded-faker Ctx factory + `defaultRandomValidEmit` across all 9 question_type variants + AnswerEmitter seam for Phase 57 — Wave 3 generators can now import their type surface from one place.
- Eight foundation-layer generator classes (6 real + 2 pass-through per D-11) implementing the canonical D-04/D-08/D-26 pattern that Plans 05/06/07 extend.
- 5 content generators — question_categories, questions (shape-valid LIKERT/categorical choices), candidates (D-27 answerEmitter seam), app_settings (updateAppSettings routing), feedback (stub)
- Polymorphic nomination generator with client-side FK validation; emits exactly one of {candidate,organization,faction,alliance} per row, drops the legacy "emit both, strip one" workaround, and fails fast with a descriptive error when upstream refs are empty. 14 of 14 generators now in place — Wave 3 complete.
- Status:
- 14 per-generator vitest suites + shared `makeCtx` factory — 96 tests covering D-22 pure I/O, GEN-04 external_id prefix, GEN-08 ref validation, D-27 answerEmitter seam, and RESEARCH §4.13/§9 invariants.
- 4 cross-cutting test files (33 tests) covering pipeline orchestration, writer env-enforcement + call-shape, seeded determinism, and template validation — the behaviors no single generator owns. Brings the Phase 56 test file count to 18 (14 per-generator + 4 cross-cutting) and test count to 129 total.
- D-24 admin-client split complete: tests/tests/utils/supabaseAdminClient.ts is now a 486-line subclass of @openvaa/dev-seed's SupabaseAdminClient base, inheriting bulk-write methods while preserving auth/email + legacy E2E query helpers in tests/.
- Box-Muller helper (Pitfall-1-safe, D-57-11 short-circuit) + LatentHooks type barrel + Ctx/TemplateSchema `.latent?` extension — ships the Wave 1 foundation that every downstream Plan 57-02..57-07 file imports.
- Pure sub-step defaults for `LatentHooks.dimensions` (GEN-06a) and `LatentHooks.spread` (GEN-06c) — zero RNG, zero I/O, <80 lines across two files. Wave-2 parallel-safe (no overlap with Plans 03-06).
- `defaultCentroids(dims, eigenvalues, parties, ctx, tplCentroids?)` — farthest-point greedy max-min sampler with eigenvalue-scaled Gaussian pool, D-57-05 partial-anchor merge, and T-57-14/T-57-15 defense-in-depth. Ships GEN-06b / GEN-06g.
- `defaultPositions(partyIdx, centroids, spread, ctx)` — per-candidate isotropic Gaussian draw around a party centroid (`N(centroid, spread² · I)`). The ONLY sub-step that runs per-candidate (D-57-13); delegates to Plan 57-01's `boxMuller` for both the draw and the `spread=0` short-circuit.
- `defaultLoadings(questions, dims, ctx, tplLoadings?)` — the GEN-06e Wave-2 sub-step default that produces a dense `(|questions| × dims)` loading matrix keyed by question `external_id`, sampled iid from N(0, 1) via Plan 01's `boxMuller`, with D-57-07 per-question template overrides (copy-safe, wrong-length fallback), a Pitfall-3 empty-questions guard, and a Phase-56-style missing-external_id skip.
- defaultProject (GEN-06f) dispatches all 8 question_type enum variants via per-type switch: ordinal via COORDINATE inverse-normalize (D-57-08), single/multi categorical via per-choice N(0,1) argmax with ≥1 guardrail (D-57-09), non-choice types via defaultRandomValidEmit passthrough (D-57-10); per-pipeline-run choice-loading cache via WeakMap<Ctx, …>; A2 fix applied to QuestionsGenerator.LIKERT_5 so the ordinal mapping no longer needs the parseInt(id) fallback.
- The Wave 3 capstone — assembles Plans 01-06 into `latentAnswerEmitter(template)`, wires it through the pipeline via `ctx.answerEmitter ??= …`, and proves end-to-end clustering on 4 parties × 10 candidates × 12 Likert-5 questions. Measured clustering ratio at defaults (seed 42): 0.0713 (threshold < 0.5 — ~7× headroom). Measured inter-question `|r|`: 0.993 (threshold > 0.1).
- Grep-verified Playwright spec inventory — 21 spec files, 34 runtime external_id references catalogued, 17 relational triangles mapped, and 25 fixture-only items flagged for omission from the forthcoming e2e template (D-58-15).
- TMPL-07 template flag + `fanOutLocales()` utility that expands `{ en: '...' }` JSONB fields to `{ en, fi, sv, da }` using per-locale Faker instances with hardcoded iteration order (NF-04 Pitfall #1 compliance)
- Pitfall #2 (schema wording drift).
- Node-builtin parseArgs CLI that loads a template (built-in name or filesystem path), runs the Phase 56/57 pipeline, fans out locales (Plan 03), writes to Supabase via the Writer, and prints a D-58-14 aligned-table summary — exit 0 on success, exit 1 with D-58-12 actionable messages on failure
- TMPL-04 default template — 1 election × 13 constituencies × 8 invented parties × 100 candidates (non-uniformly distributed via PARTY_WEIGHTS [20,18,15,12,10,10,8,7]) × 24 questions (18 ordinal / 4 categorical / 1 multi-choice / 1 boolean) × 4 categories, with generateTranslationsForAllLocales: true. Registered in BUILT_IN_TEMPLATES for CLI resolution; paired Overrides wired through runPipeline.
- `yarn workspace @openvaa/dev-seed seed:teardown` removes every row with `external_id LIKE ${prefix}%` from the 10 allowed_collections content tables (Pitfall #6 guardrail — excludes accounts/projects/feedback/app_settings), then deterministically reclaims candidate portrait objects from Storage via Path 2 list+remove (Pitfall #5 — doesn't rely on the async pg_net trigger). Three root aliases wire `dev:seed`, `dev:seed:teardown`, and `dev:reset-with-data` (= `yarn supabase:reset && yarn dev:seed --template default` per D-58-11).
- TMPL-05 e2e template authored from 58-E2E-AUDIT.md (D-58-15 audit-driven, no mechanical JSON port) — 2 elections × 2 constituencies × 2 constituency_groups × 4 organizations × 5 question_categories × 17 questions × 14 candidates × 18 nominations × generateTranslationsForAllLocales: false (D-58-16). Registered in BUILT_IN_TEMPLATES.e2e; `--template e2e` resolves to this template. Every fixed[] entry carries an inline audit citation; 99 parity tests gate against drift.
- DX-03 integration test against live local Supabase asserts 1 election × 13 constituencies × 8 organizations × 100 candidates × 24 questions × 4 categories × 100 nominations with all 4 locale keys on elections.name, 100 portraits uploaded, and elapsed < 10_000 ms (NF-01). Determinism suite extended with 3 new cases covering Pitfall #1 locale fan-out end-to-end (NF-04).
- Total (89) matches exactly
- 1. [Rule 3 - Blocking] Plan-specified tsc verification gate referenced a nonexistent tests/ tsconfig
- Chose approach (b)
- 1. [Rule 2 — Missing critical functionality] Preserved legacy `updateAppSettings` calls in all 4 setup files
- PARITY GATE: FAIL. 22 surface regressions across 3 real root causes — candidate-questions CAND-12 comment-persistence timeout (cascades into 18 tests), runTeardown('test-') deleting zero rows in both teardowns, and a cosmetic baseline ID drift from the Plan 59-02 snake_case migration. Phase 59 remains OPEN; Plan 06 (fixture deletion) is BLOCKED until parity flips green.
- 7 legacy files deleted (3 core JSON fixtures + 3 orphan overlays + mergeDatasets.ts), D-59-09 three-gate verification green, repo now has zero references to the retired filenames outside .planning/
- Phase 59 completion gate authored — 4/4 success criteria verified (including PARITY GATE: PASS carry-forward from Plan 05 and E2E-04 dep-graph evidence), D-24 public-surface table fully enumerated from source, deps-check.txt proves zero cycles at the tests/ ↔ @openvaa/dev-seed boundary. Milestone v2.5 (Phases 56-59) closeable.

---

## v2.3 Idura FTN Auth (Shipped: 2026-03-27)

**Phases completed:** 4 phases, 8 plans, 14 tasks

**Key accomplishments:**

- Commit:
- Signicat OIDC provider wrapping existing PKCE+client_secret auth, Idura provider with working JWE claims and Phase 46 stubs, and factory dispatching on PUBLIC_IDENTITY_PROVIDER_TYPE
- RS256-signed JAR authorization requests and private_key_jwt token exchange for Idura FTN, with provider-abstracted server-side authorize and token endpoints
- Provider-agnostic /api/oidc/callback with CSRF state verification, dual-provider preregister page, and cookie-based code_verifier replacing localStorage
- Provider-agnostic identity-callback Edge Function with PROVIDER_CONFIGS mapping Signicat (birthdate) and Idura (sub) claim-based identity matching, full audit metadata in app_metadata
- Shared JWE/JWT test fixtures with jose v6 and 36 unit tests covering both Signicat and Idura provider compliance plus RSA-OAEP/RSA-OAEP-256 decryption
- JAR construction, private_key_jwt assertion, and Edge Function claim extraction tests with 35 new tests across 4 test files and extracted claimConfig.ts pure functions
- Partial

---

## v2.2 Deno Feasibility Study (Paused: 2026-03-27)

**Phases completed:** 1 of 3 phases (Phase 42), 2 plans, 5 tasks
**Timeline:** 1 day (2026-03-26)
**Requirements:** 8/14 satisfied (6 EVAL/RPT deferred)

**Key accomplishments:**

- Deno 2.7.8 validated as runtime for full OpenVAA monorepo (SvelteKit, Supabase auth, E2E tests)
- SvelteKit production build serves under Deno with zero code changes and zero Deno-specific failures
- 54/67 E2E tests pass against Deno-served frontend; Supabase PKCE auth works end-to-end
- Hybrid deno.json+package.json workspace coexists with Turborepo/Changesets/tsup
- @openvaa/core 17 tests pass via deno test with vitest compatibility shim
- Code rolled back to avoid maintenance burden; research artifacts preserved

### Known Gaps

- EVAL-01: Toolchain comparison not completed (Phase 43 paused)
- EVAL-02: Build performance benchmarks not completed (Phase 43 paused)
- EVAL-03: Security model assessment not completed (Phase 43 paused)
- RPT-01: Go/no-go recommendation not produced (Phase 44 paused)
- RPT-02: Migration/cherry-pick plan not produced (Phase 44 paused)
- RPT-03: Performance benchmarks not produced (Phase 44 paused)

---

## v2.1 E2E Test Stabilization (Shipped: 2026-03-26)

**Phases completed:** 1 combined phase (40-41), 6 tasks
**Timeline:** 4 days (2026-03-23 → 2026-03-26)
**Requirements:** 4/4 satisfied

**Key accomplishments:**

- Fixed protected layout hydration — root-caused two interacting Svelte 5 bugs (multiple $state writes in $effect .then() + $bindable props_invalid_value on undefined)
- Fixed candidate registration invite flow — session-based redirect to login after password set
- Fixed password reset — session-based flow without legacy Strapi-era code param
- Fixed feedback popup timing — PopupRenderer runes-mode wrapper component with countdown restart logic
- Fixed E2E test reliability — fresh login over stale storageState, constituency test data, popup setting isolation

---

## v2.0 Branch Integration (Shipped: 2026-03-22)

**Phases completed:** 11 phases, 42 plans
**Timeline:** 1 day (2026-03-22)

**Key accomplishments:**

- Integrated Supabase backend (17 tables, 269 pgTAP tests, 3 Edge Functions) from parallel branch
- Built frontend Supabase adapter (DataProvider, DataWriter, AdminWriter, FeedbackWriter) with 85 unit tests
- Migrated auth from Strapi JWT to Supabase cookie-based PKCE sessions with Paraglide i18n preserved
- Migrated E2E test infrastructure (SupabaseAdminClient, Mailpit email, Supabase-format datasets)
- Removed Strapi entirely (262 files, 47,524 lines deleted) with thorough codebase cleanup
- Updated CI pipeline (pgTAP job, skill-drift-check, Supabase CLI E2E) and documentation
- Integrated 15 Claude Skills files and merged planning artifacts from parallel branch

### Known Gaps

- 10 E2E tests skipped due to Svelte 5 `pushState` reactivity bug (framework-level issue)
- Phase 37 Plan 03 (FIXME/TODO audit) not formally executed
- `candidate-questions` test dataset lacks `customData.allowOpen = true`

---

## v1.4 Svelte 5 Migration (Candidate App) (Shipped: 2026-03-22)

**Phases completed:** 2 phases, 7 plans, 14 tasks

**Key accomplishments:**

- 10 candidate route files migrated to Svelte 5 runes mode: 3 layouts with snippet children, forgot-password with native onsubmit, questions page with $derived, and 5 simple page runes opt-ins
- 7 candidate auth/preregister pages migrated to Svelte 5 runes with $derived, $effect, $state, and page from $app/state
- Migrated 4 candidate route files (root layout, home, preview, settings) to Svelte 5 runes with $effect, $derived.by(), $state, and snippet children
- 4 most complex candidate route files migrated: profile ($derived.by submit routing), questions layout ($effect redirect/progress), [questionId] (D-07 derivation/effect split), protected layout (D-10 async $effect data-loading)
- Zero legacy Svelte 4 patterns across all 25 candidate route files confirmed; svelte-check reports zero TypeScript errors (120 warnings non-blocking)
- Diagnosed SES email tests as environment issue (conflicting Vite server), fixed hooks.server.ts locale bug, achieved 18/20 candidate E2E tests passing with 2 remaining Vite dev mode streaming issues
- Fixed 2 failing candidate E2E registration tests via API-based ToU workaround, cookie domain transfer, and auth rate limit mitigation -- all 20 candidate tests now pass

---

## v1.3 Svelte 5 Migration (Content) (Shipped: 2026-03-20)

**Phases completed:** 5 phases, 19 plans
**Timeline:** 3 days (2026-03-18 → 2026-03-20)
**Branch:** feat-gsd-roadmap (99 commits, 334 files, +18.2k/-4.3k lines)
**Requirements:** 20/20 satisfied

**Key accomplishments:**

- 98 shared and voter-app leaf components migrated to Svelte 5 runes mode ($props, $derived, $effect, $bindable)
- All container components converted from named slots to snippet props with 39+ route consumer updates
- All voter route pages and layouts migrated from $: reactive statements to $derived/$effect runes
- All TODO[Svelte 5] markers resolved in v1.3 scope; candidate app call sites updated for API changes
- Zero legacy Svelte 4 patterns remaining in voter app routes and shared components
- All 26 voter-app E2E tests passing after full migration with zero TypeScript errors

### Known Gaps

- **Nyquist validation:** Partial across phases 23-26 (phase 24 missing VALIDATION.md)
- **Snippet reactivity bug:** $state mutations in event handlers don't trigger re-render in {#snippet} blocks (likely Svelte 5 core issue)
- **E2E test count:** Requirement stated "92 tests" but voter-app scope is 26 tests (all passing)
- **2 pre-existing test failures:** auth-setup (Strapi timeout), voter-settings category intros (data configuration)

---

## v1.2 Svelte 5 Migration (Infrastructure) (Shipped: 2026-03-18)

**Phases completed:** 7 phases, 14 plans
**Timeline:** 3 days (2026-03-15 → 2026-03-18)
**Branch:** feat-gsd-roadmap (96 commits, 861 files, +29.5k/-6.3k lines)
**Requirements:** 31/31 satisfied

**Key accomplishments:**

- Fresh SvelteKit 2 + Svelte 5 scaffold with native TypeScript, @tailwindcss/vite replacing PostCSS
- Tailwind 4 CSS-first configuration with DaisyUI 5 and full theme token migration from JS to CSS
- Migrated i18n from sveltekit-i18n to Paraglide JS — 740 call sites, compile-time type safety, runtime override wrapper
- Full monorepo dependency bump with Yarn catalog expansion (13 → 30 entries)
- Node 22 migration with Docker, CI, and 92 E2E tests validated end-to-end
- OXC toolchain evaluated and deferred (Svelte template linting not supported)
- Migration cleanup: dead code removal and TypeScript error fixes

### Known Gaps

- **Nyquist validation:** Incomplete across phases (draft/missing VALIDATION.md files)
- **Human testing debt:** Language switching and runtime overrides need live Docker stack testing
- **Svelte 5 runes:** 13 TODO[Svelte 5] markers deferred to content migration milestone

---

## v1.1 Monorepo Refresh (Shipped: 2026-03-15)

**Phases completed:** 6 phases, 15 plans
**Timeline:** 4 days (2026-03-12 → 2026-03-15)
**Branch:** feat-gsd-roadmap (87 commits, 1,717 files, +14.7k/-3.2k lines)
**Requirements:** 23/24 satisfied (VER-04 deferred by user)

**Key accomplishments:**

- Turborepo integration with cached parallel builds and dependency-aware task orchestration
- Monorepo restructured to apps/ + packages/ convention with full Docker/CI/E2E updates
- Changesets for automated versioning, changelogs, and release PRs
- npm publishing readiness — tsup builds, metadata, fresh install verified for 4 packages (@openvaa/core, data, matching, filters)
- Yarn 4.13 with dependency catalogs and Vercel remote caching in CI
- Tech debt cleanup — 9 audit items resolved across pre-commit hooks, version strings, docs

### Known Gaps

- **VER-04**: Changeset bot for PRs — deferred by user (can be installed later via GitHub App)
- **PUB-01**: @openvaa npm org — partial (registry check passed, human must confirm access credentials)
- **Phase 14**: Trusted publishing postponed until after initial manual npm publish

---

## v1.0 E2E Testing Framework (Shipped: 2026-03-12)

**Phases completed:** 7 phases, 31 plans
**Timeline:** 11 days (2026-03-01 → 2026-03-11)
**Branch:** feat-gsd-roadmap (147 commits, 268 files, +31k/-889 lines)
**Requirements:** 56/56 satisfied

**Key accomplishments:**

- Rebuilt Playwright infrastructure: upgrade to 1.58.2, project dependencies, API data management, 53+ testId attributes
- Complete candidate app coverage: auth, registration, profile, questions, settings, app modes (15 requirements)
- Complete voter app journey: landing through results, matching verification, entity details (19 requirements)
- Configuration variant testing: multi-election, constituency, results sections via overlay datasets
- CI pipeline with GitHub Actions, HTML reports, @smoke/@voter/@candidate tagging
- Visual regression and performance benchmarks as opt-in test capabilities

---
