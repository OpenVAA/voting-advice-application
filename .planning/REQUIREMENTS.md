# Requirements: OpenVAA — v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero

**Defined:** 2026-06-14
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## Scope notes (grounding for this milestone)

Derived from a 4-agent prep audit (feature/settings inventory · E2E coverage gaps · type/svelte-check health · 52-todo backlog triage), 2026-06-13/14. Operator scope decisions:

- **E2E "as comprehensive as possible"**, Voter + Candidate apps. **Admin App is excluded** from feature/E2E coverage.
- **Close coverage-unblocking product gaps** (multi-text input, multi-choice categorical variant) + the two pure blockers (default seed, `/nominations` route). **Voter-side open-comment and voter-side required-info are NOT applicable to the voter app — out of scope entirely** (reverses the v2.9 SETTINGS-02/03 routing).
- **svelte-check → literal 0** (frontend baseline is 151; concentrated in `supabaseDataProvider.ts` = 79). Admin-related type errors (~14) ARE cleared even though Admin features are out of E2E scope.
- **Fold the ~6 deferred "v2.11+ hardening" flake/race todos in — but triage for staleness first** (suite is 95/95 green post-v2.13; some may already be resolved).
- **Svelte 5 = full idiom polish** (`onMount`→`$effect`, reactive `let`→`$state`) plus lock-in (app-wide store ESLint guard, visual verification, 2 context bugs). Hard Svelte-4 syntax is already 100% gone.

**Coverage-verification caveat:** several EPERM/EFLOW items are marked by the operator as "already covered" / "should be covered / re-audit" (see per-requirement **NOTE**s). The first E2E phase is an AUDIT that confirms or refutes each, so already-covered requirements close cheaply and net-new work targets only the true gaps. Each EPERM/EFLOW/EQTYP requirement is satisfied by the end-state "suite covers + asserts X and passes 3×", whether by confirming existing coverage, extending an existing spec, or adding a new one.

## E2E Implementation Methodology (operator-mandated ordering)

**The E2E workstream (EPERM, EFLOW, EQTYP) MUST follow this order — plan-and-approve before building:**

1. **Audit current E2E tests** — map every EPERM/EFLOW/EQTYP requirement to its actual current coverage (covered / partial / missing), resolving the per-requirement NOTEs.
2. **Plan which specs to add vs edit** — explicit list of new spec files and existing specs to extend (prefer extending an existing perm over adding a new one, per the NOTEs).
3. **Plan seed-data changes** — what `e2e/base` / perm-template changes (if any) each spec needs.
4. **Plan each new spec & edit at the semantic-step level** — e.g. "use `e2e/base` data → go to results with all questions answered polar-max → open candidate X details > opinions → expect foo". Behaviour, not selectors.
5. **Plan new/edited fixtures & helpers** — every preparatory task and view manipulation belongs in a fixture/helper.
6. **APPROVAL GATE** — the plans in steps 1–5 are approved before any test code is written.
7. **Build fixtures-first** — build and test the fixtures/helpers BEFORE the specs that consume them.

**Spec authoring principle:** specs use fixtures for all preparatory tasks and view manipulation, so that reading a spec, the `expect`s deal with **behaviour, not technicalities**.

This ordering shapes the roadmap: the E2E phases lead with an **Audit + Coverage-Plan phase** (deliverable = approved spec/seed/semantic-step/fixture plan), then **fixtures-first build phases**, then **spec build phases**. Product unblockers (UNBLK) that gate a question-type spec land before the spec that needs them.

## v1 Requirements

Requirements for this milestone. Each maps to exactly one roadmap phase.

### E2E — Settings-Permutation Coverage (EPERM)

New settings-driven branches not yet covered by the existing 19 perm specs.

- [x] **EPERM-01**: E2E covers the question-flow path matrix — combinations of `questions.questionsIntro.show` × `questions.categoryIntros.show` × `questions.categoryIntros.allowSkip` — verifying correct routing and answer-count tracking per path. **NOTE**: Already covered.
- [x] **EPERM-02**: E2E covers election/constituency sequencing variants — `elections.disallowSelection` (all-selected bypass) and `elections.startFromConstituencyGroup` (constituency-first), single- vs multi-election — verifying initial routing. **NOTE**: Re-audit, should be covered.
- [x] **EPERM-03**: E2E covers results-display permutations — `results.sections[]` (candidate/org/alliance presence) × `results.cardContents[type][]` (submatches/children/answer snippets) — verifying tabs and card content. **NOTE**: Already covered.
- [x] **EPERM-04**: E2E covers `entityDetails.contents[type][]` tab control per entity type (candidate / organization / alliance) — verifying tab presence/absence and layout stability.
- [x] **EPERM-05**: E2E covers missing-data markers — `entityDetails.showMissingElectionSymbol[type]` and `entityDetails.showMissingAnswers[type]` per entity type.
- [x] **EPERM-06**: E2E covers candidate-app question media toggles — `candidateApp.questions.hideVideo` and `hideHero` combinations. **NOTE**: HideHero covered, video not tested at all. => We need a dedicated Video test.
- [x] **EPERM-07**: E2E covers `questions.interactiveInfo.enabled` — interactive info popup modal vs static expander. **NOTE**: This test should test the interactive info functionality in full.
- [x] **EPERM-08**: E2E covers `matching.minimumAnswers` gating results availability (located voter with too few answers). **NOTE**: Already covered.
- [x] **EPERM-09**: E2E covers survey/feedback popup coordination — `survey.showIn[]` + `results.showSurveyPopup` + `results.showFeedbackPopup` + `header.showFeedback` — verifying placement, timing, no double-pop, and dismiss persistence. **NOTE**: Should be partly covered, extend the current perm, don't introduce a new one.
- [x] **EPERM-10**: E2E covers `matching.organizationMatching` (none / answersOnly / impute) disclosure text on the About page.
- [x] **EPERM-11**: E2E covers `access.underMaintenance` and `access.voterApp` / `access.candidateApp` gating (maintenance page / redirects). **NOTE**: Should be already covered.

### E2E — Flow Coverage (EFLOW)

- [x] **EFLOW-01**: E2E exercises voter-results entity filters — applying a filter updates the results list; reset and persistence behave correctly (the `entityFilters` fixture is wired into a journey). **NOTE**: Already partly covered by voter journey, but let's extend the filter coverage to: multiple filters' intersection; select all/none in categorical filter behaviour; text search; text search intersection with filters.
- [x] **EFLOW-02**: E2E asserts alliance-card rendering and the alliance member-orgs drawer in voter results. **NOTE**: Alliances currently not rendered but should be easy to implement => move to gap filling.
- [x] **EFLOW-03**: E2E asserts voter-answer-vs-entity answer comparison for all four cases (agree / disagree / voter-missing / entity-missing) in entity details. **NOTE**: Should be already covered.
- [x] **EFLOW-04**: E2E asserts per-category match breakdown (subMatches) rendering on results. **NOTE**: Partly covered, but let's extend the test to test that correct values (only voter-answered categories, correct scores) are displayed for one candidate (as part of voter flow).
- [x] **EFLOW-05**: E2E covers skip / delete / back navigation in the question flow and the resulting answer-count + results-CTA impact. **NOTE**: Should be already covered.
- [x] **EFLOW-06**: E2E covers mid-session locale switching (e.g. fi → en → fi) with UI translation and answer/selection state preserved.
- [x] **EFLOW-07**: E2E covers the dark-mode toggle — theme applied and persisted across reload.
- [x] **EFLOW-08**: E2E covers user-preferences round-trip (every persisted preference field) and tracking-event emission under consent / suppression without consent. **NOTE**: We also need a test for checking correct payloads are emitted by the tracking service by both `track` and `startEvent` methods.
- [x] **EFLOW-09**: E2E asserts navigation-menu contents for both voter and candidate apps across the relevant settings permutations. **NOTE**: And also candidate nav when logged in/out.
- [x] **EFLOW-10**: E2E covers the full bank-auth (Signicat/Idura OIDC) round-trip from initiate to authenticated session, deterministically.
- [x] **EFLOW-11**: E2E runs an interactive voter journey at a mobile viewport (not just a visual baseline).

### E2E — Question-Type Variants (EQTYP)

- [x] **EQTYP-01**: E2E covers multi-choice categorical opinion questions — voter answering, candidate answering, and matching (depends on UNBLK-02). **NOTE**: Voter answering covered, but check ig categorial and boolen opinion questions are covered for candidates.
- [x] **EQTYP-02**: E2E covers number-scale opinion questions — answering and matching boundary behavior. **NOTE**: Blocked on UNBLK-05 (number opinion input does not exist yet).
- [x] **EQTYP-03**: E2E covers text and MultipleText questions — voter/candidate rendering and answer round-trip (depends on UNBLK-01).

### Coverage-Unblocking Product Work (UNBLK)

- [x] **UNBLK-01**: The frontend `QuestionInput` renders and persists answers for `MultipleTextQuestion` (multiple-text input component).
- [x] **UNBLK-02**: The frontend supports a multi-choice categorical opinion variant — input component + matching dispatch + dev-seed authoring support.
- [x] **UNBLK-03**: The default seed template (`yarn db:seed:default`) produces a valid dataset — parties present, candidates tab populated, consistent naming. _(Complete 2026-06-15: `default.ts` docstrings reconciled (5 constituencies / 327 candidates) + defensive `entities.hideIfMissingAnswers.candidate:false`, commit `49a23512e`; operator confirmed parties render, candidates tab populated, naming consistent at `/results` per SC3's running-app gate. Tracking row flipped 2026-08-09 — see `119-VERIFICATION.md:100-102`, which recorded this as documentation lag, not a code gap.)_
- [x] **UNBLK-04**: The `/nominations` route fetches question data so all-nominations entities render correctly (unblocks the nominations journey step).
- [x] **UNBLK-05**: The frontend supports a number-scale opinion question — input component + matching dispatch + dev-seed authoring support (unblocks EQTYP-02).
- [x] **UNBLK-06**: Alliance entities render in voter results (card + member-orgs drawer) — small implementation flagged by the audit as "currently not rendered; easy to implement" (unblocks EFLOW-02).

### E2E — Reliability Hardening (HARDN)

- [x] **HARDN-01**: The ~6 deferred "v2.11+ hardening" flake/race todos (party-drawer boundary, qspec cold-start race, popup-hydration deeplink, voter-feedback-persistence locator collision, not-located-redirect chain, candidate-settings notifications mount-lifecycle) are each triaged against the current suite and either fixed (passing 3×) or closed-as-stale with documented rationale. _(Complete 2026-07-22: all 7 todos terminally disposed — #7 hide-election-tags + #4 feedback-persistence FIXED; #1, #2, #3, #5, #6 CLOSED-AS-STALE with parity checks.)_
- [x] **HARDN-02**: The full E2E suite — including every net-new v2.14 spec — passes to the 3× determinism standard (fresh server, clean DB, no flakes) at milestone close. _(Complete 2026-07-23: full `yarn test:e2e` 3× green — runs 1/2/3 each 129 passed / 0 failed / 0 did-not-run, fresh server + clean DB per run; one pre-count elections-continue-stall flake fixed in-phase (voterNavigation.ts harden, commit ad3f46e84) then the count restarted. See 132-MILESTONE-CLOSE-ANCHOR.md.)_

### Defect Closure — v2.14 Audit Carry-Over (FIX)

Surfaced by `.planning/v2.14-MILESTONE-AUDIT.md` (2026-08-09). All three are CONFIRMED user-facing defects verified against the live codebase, carried as documented deferrals from Phases 130 and the a11y debug session.

- [x] **FIX-01**: No primary-content text inherits DaisyUI `.label`'s 60%-alpha color, and settled axe scans return 0 color-contrast violations in both light and dark. _(Complete 2026-08-10: `AxeRoute` is now a discriminated union carrying a **required** `contentTestId` — the data-driven content anchor is the last gate before every scan, so a route cannot pass against a DOM that lacks its own content (`753f41a1f`, `5006599c9`). That contract immediately exposed that the `constituencies-selector` entry had never once reached a constituency selector (`/constituencies` 307-redirects without an `electionId`); repointed to `constituencies-selector-located`, it measured **1 × `color-contrast`, impact serious, 2 nodes — 1.52:1 light / 1.46:1 dark** on the `.faded` / `opacity-30` readout, closed under D-17 Option A to **0 violations in both themes**. A seventh scan entry, `results-filter-drawer` (`8f6eaede4`), covers the surface the audit named — anchored on the lazily-imported numeric body, expanding all **3** filter rows. `NumericEntityFilter.svelte:85,98,113` swapped off the dead `text-label` class onto `small-label` (`4494543ea`). The app-side contrast defect the audit reported as open was already closed by commit `0eb27c677` (2026-06-22). Gate: 3× full suite 130 passed / 0 failed / 0 did-not-run, a11y-smoke running in all three. **Coverage limit, stated rather than absorbed:** the raw scan entries run light AND dark, but the four fixture-driven entries (`questions`, `results`, `voter-detail-drawer`, `results-filter-drawer`) run **light only** — a dark-only contrast regression on those surfaces would currently go uncaught. Documented in-file at `a11y-smoke.spec.ts:396-401`.)_ _(Corrected 2026-08-10 per D-01c: the "12/12 FAIL" state this requirement originally quoted was **stale** — the app-side defect at `ElectionSelector.svelte:56` was closed by commit `0eb27c677` on 2026-06-22, and re-measurement under a settled DOM returns 0 violations in both themes. The deliverable is the settled-DOM regression gate — a required data-driven content anchor on every scan route — plus axe coverage of the results filter drawer, which no scan had ever reached, plus the dead-class cleanup at `NumericEntityFilter.svelte:85,98,113`; the numbers 84/97/112 pointed at the enclosing `<label>` elements, and `text-label` matched no CSS rule at all, so it was a dead class rather than a live violation. `EnumeratedEntityFilter.svelte:198` measures AA-clean. `ConstituencySelector` is unaffected by the `.label` mechanism but was **not** exempt from change: a separate AA failure via the `.faded` / `opacity-30` utility, 1.52:1 light and 1.46:1 dark on two nodes, was found and fixed in this phase.)_
- [x] **FIX-02**: The **seven** keys present only in the type-generation source resolve to real text in all 7 locales, added to the runtime Paraglide catalog across **both** catalog files — `apps/frontend/messages/{locale}/questions.json` (`questions.multiChoice.selectExact`, `questions.multiChoice.selectRange`) and `apps/frontend/messages/{locale}/components.json` (`components.accordionSelect.listboxAriaLabel`, `components.multipleTextInput.{add,moveUp,moveDown,remove}`) — with a cross-catalog key-set parity check and the withheld Phase-130 content assertion restored. _(Complete 2026-08-10: **7 keys × 7 locales = 49 catalog additions** across `questions.json` (`3b098a22e`) and `components.json` (`324ec8661`), values mirrored programmatically from the type-gen source so punctuation survived byte-identical. `selectExact` ships as an MF2 **plural declaration** (input `count`) — the first in-repo precedent for a non-`numX` input name — proven by importing the compiled Paraglide output in Node and rendering all **14** branches: `en` count=1 → `Select 1 option.`, count=2 → `Select 2 options.`. A per-locale key-set parity check (**14 tests**, `95f773ec8`) guards both drift directions and was proven to FIRE, not merely lint clean, by a recorded two-direction negative control. The withheld Phase-130 content assertion is restored as `toHaveText(/2.*3/)` at candidate-journey step 18.5 (`741d92693`), and `listboxAriaLabel` plus the four `multipleTextInput` controls are locked by accessible-name assertions (`4b9c5ffa2`). **Two limits, named rather than absorbed:** (1) `selectExact` has **no E2E coverage and therefore no standing regression guard** — no seeded question has an equal min/max, so the seeded journey renders `selectRange`; its only proof is the build-time render of all 14 plural branches. (2) The **six non-English singulars are constructed, not natively authored** (MEDIUM confidence) — the D-18 native-speaker wording review is **OPEN**, tracked at `134-UAT.md` and `.planning/todos/pending/2026-08-10-verify-non-english-selectexact-singulars.md`. This requirement is met because the keys resolve to real text in all 7 locales; closing it does **not** close that review.)_ _(Corrected 2026-08-10 per D-01c/D-08: originally scoped to 2 keys in one file; a full key-set diff across all 7 locales found 7.)_
- [x] **FIX-03**: A saved boolean opinion answer of `false` renders as answered on the candidate questions overview — `candidate/(protected)/questions/+page.svelte:58` guards with the canonical emptiness predicate `isEmptyValue()` from `@openvaa/data`. _(Complete 2026-08-10: the truthiness guard in `getSavedAnswer` swapped for `isEmptyValue(localizedAnswer?.value)` imported from **`@openvaa/data`** (`2b5666edc`), matching the sibling import at `candidateContext.svelte.ts:2` so the overview card and `unansweredOpinionQuestions` can no longer disagree about what "answered" means. A reproduced repo-wide sweep — **4 grep patterns over `apps/` + `packages/`, 11 distinct hits, exactly 1 genuine** — confirms no other falsy guard swallows a legitimate `false`/`0` on an answer-like value. Locked behaviourally by candidate-journey step 18.6 (`2c47d2726`), which saves the falsy choice via `selectChoice(0)`, reloads, and asserts the card renders as answered with an edit call to action — and which was run as a **negative control** against the restored pre-fix guard, where it failed at the expected step, proving the lock discriminates rather than describes.)_ _(Corrected 2026-08-10 per D-12, a deliberate and operator-approved deviation: the original wording prescribed an explicit null check, which would render a saved empty string or empty array as answered on the overview while `candidateContext.svelte.ts:233`'s completion gating — already using `isEmptyValue()` — still counted it unanswered. The audit's "and in the completion gating that reads the same helper" claim of a second defective site does not hold; a repo-wide falsy-guard sweep found exactly one.)_

### Coverage Carry-Over Closure — Phase 134 Follow-Ups (GUARD)

Three limits Phase 134 measured, recorded honestly, and deliberately did not close. Each is a *guard* gap rather than a live defect: the product is correct today, but a regression would go uncaught.

- [x] **GUARD-01**: `questions.multiChoice.selectExact` has a standing regression guard — a seeded multi-choice question with equal min/max exists in `e2e/base` so the key is rendered by the running app and asserted by the E2E suite, proven to fail by negative control. (Phase 134 proved the string correct at build time across all 14 plural branches, but every seeded question carries a 2..3 window and renders `selectRange`, so nothing would catch a regression.) _(Complete 2026-08-11: `test-e2e-base-qu-opin-base-8-multichoice-exact` seeds `{minSelections: 1, maxSelections: 1}` at `sort_order` 107 — verified against the live DB after `db:reset && db:seed --template e2e/base` — so `QuestionChoices.svelte:420` now takes the `selectExact` branch at runtime. base-7 is **unchanged** at `{2, 3}` (Phase 129 D-07 range coverage is an addition, never a repurposing); the base dataset is 26 questions. Exact-**one** is the deliberate choice: it renders the MF2 `countPlural=one` branch, which carries the six constructed non-English singulars. The guard is an EXACT-string assertion — `toHaveText('Select 1 option.')` at `voter-journey.spec.ts:394` — and fires **twice** per journey (first paint, then again on a `deleteEpoch` remount after the answer is deleted and re-entered). **Proven to discriminate by two independent negative controls, each a full `--project=voter-journey` run:** (A) corrupting the `en` singular → `Received: "Select 1 CORRUPTED option."`, **1 failed / 3 passed (46.0s)**; (B) deleting the key from all 7 locales, so `i18n/wrapper.ts:39` paints the raw key → `Received: "questions.multiChoice.selectExact"`, **1 failed / 3 passed (44.9s)**. Control B is also why the matcher is an exact string and not a regex: `/select/i` is satisfied by the literal string `questions.multiChoice.selectExact`, i.e. it would have been a guard that cannot fail. **The seed change forced a fix the plan did not anticipate:** both multi-choice walks hard-coded `click 2`, which is over-max against base-8 — leaving candidate Save permanently disabled, and, worse, silently advancing the voter with the answer **not persisted** (`questions/+layout.svelte:194-198` refuses an out-of-range value, so Next acted as Skip). `tests/tests/utils/multiChoice.ts`'s `selectSmallestValidMultiChoice` reads validity off the app instead, which is strictly stricter than the count it replaced. base-8 is matching-NEUTRAL (`['a']` in every template), adding 1 to Dmax and 0 to every candidate's D — a monotone transform, so existing ranking assertions are preserved by construction. Gate: **3× consecutive full `yarn test:e2e`, 134 passed / 0 failed / 0 did-not-run**, fresh server + `db:reset` per run. **Three limits carried forward rather than absorbed:** (1) the `@visual` project is **excluded from `yarn test:e2e`**, so this gate does **not** cover it — base-8 adds a question to the candidate preview page, and its **4 PNG baselines need a re-baseline on the canonical CI runner** (local font rendering differs by design); (2) **DEF-135-04** — a single unexplained failure of the EPERM-07 term-trigger assertion, observed once in Plan 02 with its cold-start-Vite hypothesis TESTED and DISPROVED — **did not recur** across the three gate runs (each of which restarted the dev server on a cold Vite cache, the exact named condition), but 1-in-5 full-suite runs without a diagnosis is evidence of low frequency, **not** proof of absence; it stays OPEN; (3) the guard locks the **`en`** string only — the D-18 native-speaker review of the six constructed non-English singulars remains OPEN.)_
- [x] **GUARD-02**: The four fixture-driven axe entries (`questions`, `results`, `voter-detail-drawer`, `results-filter-drawer`) scan in dark as well as light, matching the raw entries — and any violation this surfaces is fixed, not deferred. (Phase 134 deferred this as unbounded fallout across four never-measured surfaces; a dark-only contrast regression on those routes currently goes uncaught.) _(Complete 2026-08-11: all four fixture-driven entries now have dark twins, so the a11y matrix is **7 axe surfaces × 2 themes = 14 scans** (was 10) plus the 2 `navigation-a11y` tests = **16 a11y-project tests** in every full-suite run — `--project=a11y-smoke --list` reports **18**, the 14 + 2 plus the base setup/teardown pair it depends on. Evidence is the axe attachment BODIES extracted from the run traces, not a restatement of "passed": `axe-violations-questions-dark.json`, `-results-dark`, `-voter-detail-drawer-dark`, `-results-filter-drawer-dark` are each `[]`, as are the other ten. **No product fix was required — the surfaces measured clean, so the D-17 `.faded` precedent was prepared and not needed.** The measurement itself had to be corrected first, and this is the substantive finding: the plan specified `page.emulateMedia({colorScheme:'dark'})` on the fixture-supplied page, which passed 18/18 while leaving **30 elements still painting the light `#333333`** — the persistent layout chrome (header menu-toggle, hamburger `svg`/`path`, logo) that the fixture rendered before the flip. Sharpest detail: the custom property on those stale nodes already resolved to the **dark** token (`ownNeutral: #cccccc`) while their computed `color` stayed light, so `body`, `matchMedia` and every token read dark and the document was still visibly part light — a scan reporting a confident `0` about a theme it half-rendered, the same shape as the FIX-01 defect Phase 134 existed to kill. Rebuilt to take a **born-dark browser context** (`test.use({colorScheme:'dark'})`): `nav-menu-toggle` computed colour `rgb(204,204,204)` vs `rgb(51,51,51)` under the flip, and **0** stale elements. That is also strictly more faithful — it measures the real dark journey rather than a light journey wearing a dark hat. `assertDarkThemeApplied` (compares a freshly-created token consumer against the persistent chrome — token-agnostic, no hard-coded hex, no theme name) was validated against **both** mechanisms: it FAILS on the broken one and passes on the fixed one, because a guard only ever tested against the passing case is an assumption. Surfaces independently probed as genuinely dark: `prefersDark: true`, `--color-base-100: #000000`, `--color-base-content: #cccccc`, `body` background `rgb(0,0,0)` — on all four, including inside both opened drawers with every filter row expanded. No rule was disabled, `WCAG_TAGS` was not narrowed, no `exclude()` was added, and `assertAxeScan`/`assertAxeGates` are byte-for-byte unchanged. Gate: **3× consecutive full `yarn test:e2e`, 134 passed / 0 failed / 0 did-not-run**, a11y-smoke running in all three. **Carried forward: DEF-135-01 remains OPEN** — `apps/frontend/src/app.css`'s `[data-theme='dark']` block is **dead CSS** (`data-theme` is never set on any element; DaisyUI dark arrives via `prefersdark`/`@media`), so `--line-color` stays at the light `#d9d9d9` instead of `#262626` in dark. It is **not** a WCAG failure and correctly goes unflagged: `--line-color` is consumed only as a border colour, never text, and `#d9d9d9` on `#000000` is ~15.9:1 — *higher* contrast than intended. Pre-existing, already present under the Phase-134 raw dark scans, and outside this phase's files.)_
- [x] **GUARD-03**: `packages/dev-seed`'s NF-01 seed-budget assertion is load-independent — asserting on work done rather than elapsed wall-clock, or with wall-clock demoted to a pathology-level soft signal. Raising the 10000ms threshold is explicitly not an acceptable resolution. (Measured 2026-08-10: 23630ms / 11592ms under parallel load vs ~10143ms in isolation, inside the blocking `yarn test:unit` CI step.) _(Complete 2026-08-11: resolved by **asserting the work, not the time** — an operation budget over `SupabaseAdminClient` calls, counted with call-through `vi.spyOn` on every prototype method, so it required **zero production-code change**. The budget states the batching invariants (`bulkImport`/`importAnswers`/`linkJoinTables` = 1 each; one candidate lookup for the whole run; exactly **two** round-trips per candidate, expressed as `rows.candidates.length` rather than the literal 327 so it survives the next densification) and is **CLOSED** — a final assertion requires every unbudgeted admin-client operation to be zero, so a call nobody thought to list still surfaces **by name** rather than rotting into a checklist. `grep -c 'toBeLessThan(10_000)'` → **0**; nothing in the file asserts on time at all. Elapsed is still measured and logged as observability, never asserted. **The datum that settles this against any timing gate:** negative control B injected a genuine N+1 (the candidate lookup moved inside the per-candidate loop, 327 extra SELECTs) and cost **+937 ms — 5817 → 6754 ms. The deleted `toBeLessThan(10_000)` would have passed it comfortably**, i.e. the assertion that existed to catch performance regressions could not catch a textbook one while still failing whenever a colleague opened a dev server. The operation budget caught it instantly: `expected 328 to be 1`. Negative control A injected one unbudgeted call: `expected [ [ 'listCandidateIdsByPrefix', 1 ] ] to deeply equal []`. Both reverted, tree verified clean, re-run green. **Load independence, measured not asserted** — Plan 03 at 7 / 11 / 14 CPU burners with a dev server running: seed elapsed **14281 / 12793 / 62437 ms**, `yarn test:unit` exit 0 and 19/19 tasks at each (the 7-burner row is direct proof: 14281 ms > 10000 ms, so the deleted assertion would have failed that run). **Independently reproduced at the Phase-135 gate (2026-08-11)** on the same 14-core machine: quiet **6733 ms**; 7 burners **6743 ms**; **14 burners, load avg peak 34.16 → seed elapsed 69006 ms — 6.9× the deleted 10000 ms budget and 10.2× the quiet run — with `yarn test:unit` EXIT=0, 19/19 tasks, dev-seed 444/444**. The gate run also independently confirms Plan 03's second finding: at saturation the integration test took **77610 ms**, which would have blown the **old 60000 ms** per-test timeout — that timeout had been *derived from the very budget this requirement deleted*, and was re-derived from measurement to 300 s as a labelled hang guard (3.9× headroom over the worst legitimately-completing run), explicitly **not** a re-tightened performance signal. Every deterministic correctness assertion survives untouched: the 327-candidate / 327-portrait counts, the 9 DB-level `countByPrefix` checks, the 377-nomination split, the 30/10 parent-nomination split, and the TMPL-07 locale-key set. **Limit stated rather than absorbed:** the budget is measured at the admin-client boundary — where batching is actually decided — so a hypothetical N+1 buried **inside** a single `SupabaseAdminClient` method would not be caught; this is recorded in the helper's docblock. **CORRECTION, 2026-08-11 (Phase 136 plan 03, fake-guard sweep finding F5): everything above was true LOCALLY ONLY — the budget did not execute in CI at all.** The file self-skips on `describe.skipIf(!process.env.SUPABASE_URL)`, and the only CI path that reached it (`frontend-and-shared-module-validation` → `yarn test:unit`) has no Supabase and no repo-root `.env`, so it skipped green on every run. It ran on developer machines by accident of a side effect, not by design: importing `packages/dev-seed/src`'s barrel pulls `cli/teardown`, whose module scope calls `process.loadEnvFile('<repo-root>/.env')` — so the local `.env` populates `SUPABASE_URL` before `hasSupabase` is evaluated. Reproduced under CI conditions by moving the root `.env` aside: `↓ default-template.integration.test.ts (1 test | 1 skipped)`, `Test Files 41 passed | 1 skipped (42)`, **EXIT=0**. Resolved by WIRING IT IN, not by narrowing this requirement: the new blocking `dev-seed-integration` job in `.github/workflows/main.yaml` starts Supabase, exports `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` read off the running instance via `supabase status -o env`, and runs `yarn workspace @openvaa/dev-seed test:unit` — verified by simulating that job locally with the root `.env` moved aside: **444/444, integration test EXECUTES in 11570 ms, 0 skipped**. The wiring is itself guarded: the job sets `DEV_SEED_INTEGRATION_REQUIRED=1` and the test throws at module scope if that is set while `SUPABASE_URL` is not, so a future edit that drops the env cannot silently revert to a green skip — proven by negative control (same no-`.env` run with the flag set → `Test Files 1 failed | 41 passed`). Deliberately a separate job, not a step in `e2e-tests`: this test writes 327 `seed_` candidates that would contaminate the `e2e/base` dataset, and appending it after `yarn test:e2e` would make a red E2E run mask a seed-path regression. Cost: one extra parallel runner (~5-8 min, dominated by `supabase start`); no critical-path wall-clock increase, since `e2e-tests` does a strict superset of the same setup plus the full suite.)_

### Real Guards — Sweep Remediation + Visual Repair (REAL)

From `.planning/audits/2026-08-11-fake-guard-sweep.md` (20 findings, 11 blind, 0 currently noisy). The pattern: an assertion that cannot detect the failure it nominally guards, and/or fires on conditions unrelated to correctness.

- [ ] **REAL-01**: The visual-regression project runs against `e2e/base` (registered base-candidate + email contract), its baselines are generated in the CI-matching Playwright Linux container, and its CI job no longer carries `continue-on-error: true`. _(Non-functional since the base-dataset merge: baselines depict a `test-candidate-alpha` row `e2e/base` never seeds, generated on a developer Mac at v1.2, with no re-baseline process in CI.)_
- [ ] **REAL-02**: F1 and F12 are fixed and demonstrated to fail against an injected regression — the perf budget no longer asserts on a metric that closes before the page does its work, and the nine filter assertions no longer pass a filter that returns everything.
- [ ] **REAL-03**: F5 (the Phase-135 op-budget does not run in CI) and F4 (4 probe files matching no project) are each wired in and passing, or removed with rationale.
- [ ] **REAL-04**: A suite-wide raw-i18n-key scanner closes the F2 class across all 598 English keys, rather than patching 21 individual matchers.

### Svelte 5 — Idiom Polish (RUNES)

- [x] **RUNES-01**: `onMount` / `onDestroy` are migrated to `$effect` where semantically equivalent (~24 files), behavior-neutral and verified. **NOTE**: See https://svelte.dev/docs/svelte/lifecycle-hooks for recommendations.
- [x] **RUNES-02**: Reactive `let` declarations (locals mutated for reactive effect) are migrated to `$state`, per-site verified (non-reactive locals left as `let`).
- [x] **RUNES-03**: The `svelte/store` ESLint guard is extended to the entire `apps/frontend/src/**` tree (lock-in against regressions). **Met-via-Phase-115-SWEEP-03**: the guard glob was already widened to `apps/frontend/src/**/*.{ts,svelte}` in Phase 115 SWEEP-03 (see the in-file comment at `apps/frontend/eslint.config.mjs` lines 77-84); `yarn workspace @openvaa/frontend lint` reports zero `no-restricted-imports`/`svelte/store` violations across `src/**`. Phase 124 adds the permanent regression self-test `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (positive + negative control) proving the guard FIRES, not merely lints clean by accident.
- [x] **RUNES-04**: A post-runes visual verification pass confirms no regressions in app-header styling, banner images, and post-login candidate navigation. **Verified-by-`124-VISUAL-VERIFICATION.md`** (Phase 124): all three migration-risk surfaces pass present-and-correct (header light voter+candidate × en/fi + dark code-verified; banner/hero en/fi; post-login `CandidateNav` reactive — badge + step-gating populate post-mount, no Phase-61 destructure-trap). D-08 gate satisfied (lint clean for `svelte/store`, guard self-test passing, 3/3 surfaces, full E2E 125/0/0 cardinal-clean).
- [x] **RUNES-05**: The two known context bugs are fixed — `candidateContext.questionBlocks` `getApplicableQuestions` missing `entityType`; `userData.save()` silently skipping `termsOfUseAccepted: null`.

### svelte-check / TypeScript → Zero (TYPE)

- [x] **TYPE-01**: The `qs` module ambient-declaration errors (8 × TS7016) are resolved (`@types/qs` or a `declare module` shim).
- [x] **TYPE-02**: The admin-jobs `+server.ts` `cookies`/fetch-event type-drift cluster (6 errors) is resolved.
- [x] **TYPE-03**: The `_spikes-017-019` leftover spike scaffolding (4 errors) is deleted.
- [x] **TYPE-04**: `supabaseDataProvider.ts` is typed against the generated Supabase types — its 79 errors (untyped `Json`/row shapes, possibly-null) are cleared without changing runtime behavior.
- [x] **TYPE-05**: `supabaseDataWriter.ts` and the rest of the Supabase adapter layer typecheck clean.
- [x] **TYPE-06**: The context-layer type errors are resolved — `adminContext.svelte.ts` (8), `candidateContext.svelte.ts` (6), `authContext.svelte.ts` (4).
- [x] **TYPE-07**: The long-tail of scattered 1-per-file route/util/component type mismatches (~25) is resolved.
- [x] **TYPE-08**: The `.test.ts` / `.spike` type errors (~19) are resolved (fix or remove dead scaffolding).
- [x] **TYPE-09**: The `apps/docs` a11y svelte-check warning is resolved (monorepo svelte-check = 0 warnings).
- [x] **TYPE-10**: `apps/frontend` svelte-check passes with **0 errors / 0 warnings**, and the CI gate is flipped from "≤ 151 baseline" to "0 absolute". _(Complete 2026-07-23: live svelte-check 0/0 (2676 files); Plan 02 added a blocking CI step running `yarn workspace @openvaa/frontend check` with `--fail-on-warnings` (commit f70baae0d), enforcing 0-absolute for both errors and warnings. See 132-MILESTONE-CLOSE-ANCHOR.md.)_

## v2 Requirements

Deferred, tracked, not in this roadmap.

### Tooling / Typing

- **SEEDTYPE-01**: Strict per-collection row typing for dev-seed `Template` (throw on unknown props at type-check time) — an additive enhancement; dev-seed already has 0 type errors.

### Architecture

- **AUTHADP-01**: Migrate Supabase-specific auth code (login/logout/verifyOtp) from frontend routes into the Supabase adapters.
- **TENANT-01**: Per-instance `PUBLIC_PROJECT_ID` scoping in the frontend data provider (multi-tenant separation).
- **CAND-STORE-01**: Investigate migrating the candidate answer store to a more robust architecture.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Admin App feature/E2E coverage | Operator-excluded from this milestone's feature/E2E scope (Admin type errors ARE still cleared for TYPE-10). |
| Voter-side open-comment input (`customData.allowOpen`) | Not applicable to the voter app (operator decision) — removed from scope; reverses v2.9 SETTINGS-02. |
| Voter-side required-info enforcement (`customData.required`) | Not applicable to the voter app (operator decision) — removed from scope; reverses v2.9 SETTINGS-03. |
| FilterGroup OR-mode UI | Conditional on a pending product decision (no AND/OR toggle in the filter dialog). |
| Generalize candidate app → party app | Large product refactor; separate milestone. |
| i18n/Paraglide infra (baseLocale-vs-runtime divergence, per-tenant tree-shake) | i18n Stage-B infra; not a test/cleanup concern. |
| Luxembourg + Danish VAA fork reconciliation | Deltas unscoped; separate milestone. |
| `adapter-package-loading`, `configurable-mock-data`, `rename-admin-writer`, SQL linting | Dev-tooling/backend hygiene unrelated to the three themes. |
| `onMount`→`$effect` where NOT semantically equivalent | Only behavior-neutral migrations in scope; genuine lifecycle semantics retained. |

## Traceability

Each requirement maps to exactly one roadmap phase (see `.planning/ROADMAP.md` v2.14 section, Phases 118-132). New-feature work (UNBLK question inputs + alliance render + nominations fetch) and its dependent E2E are clustered at the end (Phases 129-130) per the operator directive; only UNBLK-03 (a default-seed tooling fix, not a new feature) stays in the front fixtures phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EPERM-01 | Phase 120 | Complete |
| EPERM-02 | Phase 120 | Complete |
| EPERM-03 | Phase 120 | Complete |
| EPERM-04 | Phase 120 | Complete |
| EPERM-05 | Phase 120 | Complete |
| EPERM-06 | Phase 120 | Complete |
| EPERM-07 | Phase 120 | Complete |
| EPERM-08 | Phase 120 | Complete |
| EPERM-09 | Phase 120 | Complete |
| EPERM-10 | Phase 120 | Complete |
| EPERM-11 | Phase 120 | Complete |
| EFLOW-01 | Phase 121 | Complete |
| EFLOW-03 | Phase 121 | Complete |
| EFLOW-04 | Phase 121 | Complete |
| EFLOW-05 | Phase 121 | Complete |
| EFLOW-06 | Phase 121 | Complete |
| EFLOW-07 | Phase 121 | Complete |
| EFLOW-08 | Phase 121 | Complete |
| EFLOW-09 | Phase 121 | Complete |
| EFLOW-11 | Phase 121 | Complete |
| EFLOW-10 | Phase 122 | Complete |
| RUNES-01 | Phase 123 | Complete |
| RUNES-02 | Phase 123 | Complete |
| RUNES-05 | Phase 123 | Complete |
| RUNES-03 | Phase 124 | Complete |
| RUNES-04 | Phase 124 | Complete |
| TYPE-01 | Phase 125 | Complete |
| TYPE-02 | Phase 125 | Complete |
| TYPE-03 | Phase 125 | Complete |
| TYPE-04 | Phase 126 | Complete |
| TYPE-05 | Phase 127 | Complete |
| TYPE-06 | Phase 127 | Complete |
| TYPE-07 | Phase 128 | Complete |
| TYPE-08 | Phase 128 | Complete |
| TYPE-09 | Phase 128 | Complete |
| UNBLK-03 | Phase 119 | Complete |
| UNBLK-01 | Phase 129 | Complete |
| UNBLK-02 | Phase 129 | Complete |
| UNBLK-04 | Phase 129 | Complete |
| UNBLK-05 | Phase 129 | Complete |
| UNBLK-06 | Phase 129 | Complete |
| EQTYP-01 | Phase 130 | Complete |
| EQTYP-02 | Phase 130 | Complete |
| EQTYP-03 | Phase 130 | Complete |
| EFLOW-02 | Phase 130 | Complete |
| HARDN-01 | Phase 131 | Complete (2026-07-22) |
| HARDN-02 | Phase 132 | Complete |
| TYPE-10 | Phase 132 | Complete |
| FIX-01 | Phase 134 | Complete (2026-08-10) |
| FIX-02 | Phase 134 | Complete (2026-08-10) |
| GUARD-01 | Phase 135 | Complete (2026-08-11) |
| GUARD-02 | Phase 135 | Complete (2026-08-11) |
| GUARD-03 | Phase 135 | Complete (2026-08-11) |
| FIX-03 | Phase 134 | Complete (2026-08-10) |

**Structural phase (no requirement ownership — operator-mandated E2E audit-first ordering):**

| Phase | Role |
|-------|------|
| Phase 118 — E2E Coverage Audit + Coverage Plan | Approval-gate deliverable (no test code); produces the coverage map + full spec/seed/semantic-step/fixture plan — including the deferred-build end-cluster specs (EQTYP-01/02/03, EFLOW-02, the nominations spec, the EPERM-03 alliance-presence slice) — that Phases 120-122 and 130 execute. |

**Cross-phase notes (criteria, not REQ-ID ownership — no double-mapping):**

- The **EPERM-03 alliance-presence sub-assertion** is built in Phase 130 (its REQ-ID maps to Phase 120 for the candidate/org bulk).
- The **`/nominations`-route E2E assertion** lands in Phase 130 as a success criterion tied to the UNBLK-04 feature (the UNBLK-04 REQ-ID maps to Phase 129, the build phase).

**Coverage:**

- v1 requirements: 48 total (EPERM 11 · EFLOW 11 · EQTYP 3 · UNBLK 6 · HARDN 2 · RUNES 5 · TYPE 10)
- Mapped to phases: 48 (100%) ✓
- Unmapped: 0 ✓
- No requirement maps to more than one phase ✓
- Per-phase REQ counts: 119 → 1 (UNBLK-03) · 120 → 11 (EPERM) · 121 → 9 (EFLOW) · 122 → 1 (EFLOW-10) · 123 → 3 (RUNES) · 124 → 2 (RUNES) · 125 → 3 (TYPE) · 126 → 1 (TYPE-04) · 127 → 2 (TYPE) · 128 → 3 (TYPE) · 129 → 5 (UNBLK) · 130 → 4 (EQTYP 3 + EFLOW-02) · 131 → 1 (HARDN-01) · 132 → 2 (HARDN-02 + TYPE-10). Sum = 1+11+9+1+3+2+3+1+2+3+5+4+1+2 = 48 ✓

---
*Requirements defined: 2026-06-14*
*Last updated: 2026-06-14 after roadmap revision (new-feature work + dependent E2E moved to the end cluster, Phases 129-130; UNBLK-03 folded into the front fixtures phase 119; renumbered 118-132; 48/48 requirements covered)*
