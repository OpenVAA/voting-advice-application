---
status: resolved
trigger: "v2.11 regression — the a11y-smoke located tests (and the locatedVoterPage/answeredVoterPage fixtures) stall on the 'Select an election' page: clicking Continue with the DEFAULT election selection does not navigate to constituencies. Operator constraint: data seeding and component PROP handling did NOT change this milestone, so rule those out (the ElectionSelector testid-forwarding theory is rejected — concatClass forwards data-testid, and Continue renders). Culprit is within v2.11: Phase 95 rune migration (appContext/dataContext/answer stores/overlay registry) reactivity, or Phase 99 View Transitions + navigation. Distinct from the already-fixed voter-journey spec timing bug (302fcb19a)."
created: 2026-06-04T16:30:00Z
updated: 2026-06-07T17:30:00Z
resolution: "DISPROVEN as a user-facing app bug — the Phase-95-rune-reactivity / Phase-99-VT hypotheses were both wrong. Actual root cause: a TEST-FIXTURE timing artifact. voter-journey.fixture.ts used a non-waiting one-shot `isVisible()` probe on the elections list, which races the post-hydration `$dataRoot` `$effect` population in routes/+layout.svelte (list mounts a beat after navigation), returns false, and skips the Continue click — stalling the located walk. Fix: switch the page-presence probe to a polling `waitForVisible` helper (see the explanatory NB comment at voter-journey.fixture.ts:144-156). The default-path Continue works correctly for real users; elections/+page.svelte was untouched in v2.11 except by the Phase-97 codemod. Confirmed resolved at the Phase 101 milestone-close gate: a11y-smoke 10/10 (all located fixtures traverse Home→Intro→Elections→Constituencies→/questions) + full E2E 84/0. Record was left open at root_cause_found; closed during the v2.11 milestone audit 2026-06-07."
---

## Current Focus

hypothesis: Clicking Continue on the elections page with the DEFAULT (pre-selected) election state no longer navigates after the v2.11 rune migration. In apps/frontend/src/routes/(voters)/elections/+page.svelte: `let selected = $state([])`; an `$effect` sets `selected = (voterCtx.selectedElections.length ? voterCtx.selectedElections : elections).map(e => e.id)`; `canSubmit = $derived(selected?.length > 0)`; `handleSubmit()` does `goto($getRoute({route:'Constituencies', electionId: Array.from(selected), constituencyId: undefined}))`. The checkboxes render CHECKED (bind:group), but on the default path (no user onChange) the Continue click does not navigate. The PASSING voter-journey spec masks this by explicitly de-selecting then re-selecting each option (firing ElectionSelector.onChange→handleChange) before clicking Continue; the STALLING fixture (voter-journey.fixture.ts:100-130) clicks Continue with no interaction — the realistic default-path user behavior. Likely a Phase 95 rune-reactivity defect: the `$effect`-assigned `selected` (or the `voterCtx.selectedElections` accessor / a destructure-trap / runeLocalStorage timing) leaves `handleSubmit`'s `goto` reading a stale value or producing a no-op/same-URL navigation; OR Phase 99's onNavigate startViewTransition interferes with the goto on this route. Because the fixture mimics a real user, this is most likely a USER-FACING bug → fix app-side, not by patching the fixture.
test: With dev server up + e2e/base seeded, reproduce by driving the elections page and clicking Continue WITHOUT toggling any checkbox; observe whether goto navigates. Instrument handleSubmit (log canSubmit, selected, the computed route URL, and whether goto resolves/changes URL). Compare against clicking a checkbox first (the spec's path). Then test whether Phase 99 VT is involved (reducedMotion / notr — though VT was already disproven for the voter-journey spec bug).
expecting: On the default path, either canSubmit is false at click-time (selected not yet synced) so Continue is a no-op, OR goto computes a URL equal to the current one / resolves to undefined and never navigates. A user-interaction (onChange) fixes it — confirming the $effect-set default state isn't wired into the submit path correctly post-rune-migration.
next_action: read elections/+page.svelte (done), ElectionSelector.svelte (done — bind:group selected, onChange handleChange), voterContext selectedElections accessor + how selected elections persist (runeLocalStorage?), the root +layout onNavigate/startViewTransition; then reproduce live and instrument handleSubmit.

## Symptoms

expected: A voter landing on 'Select an election' with elections pre-selected (default) clicks Continue and advances to the constituency selector, then to /questions. The locatedVoterPage/answeredVoterPage fixtures (walkUntilQuestionsIntro) reach the /questions intro so the a11y-smoke located tests run. This worked before the v2.11 milestone.
actual: PLAYWRIGHT_A11Y=1 a11y-smoke = 5 passed / 5 FAILED (2026-06-04 auto-run). The 3 pre-location axe routes pass; all 5 located tests fail at voter-journey.fixture.ts:130 (getByTestId('voter-questions-start') never visible). Failure-time page snapshot shows the walk stalled on 'Select an election' — both elections checked, Continue button present, never advanced. Announcer correctly reads "Select an election" (phase-99 code fine).
errors: |
  TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
  Call log: waiting for getByTestId('voter-questions-start') to be visible
    at walkUntilQuestionsIntro (tests/tests/fixtures/voter/voter-journey.fixture.ts:130)
reproduction: Dev server (yarn dev) is already running on :5173. Re-seed e2e/base (run the data-setup-base project, or `yarn db:reset && yarn db:seed --template e2e/base`). Then `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` (any located test reproduces), or drive the elections page manually and click Continue without toggling a checkbox.

## Investigation Constraints

- OPERATOR STEER: data seeding and component PROP handling did NOT change in v2.11 → do NOT pursue seed-data or testid/prop-forwarding theories. The verifier's "ElectionSelector testid forwarding" hypothesis is rejected (concatClass forwards data-testid; Continue renders and is clickable).
- Constrain culprit to v2.11 changes: Phase 95 rune migration (appContext/dataContext/answer stores/overlay registry/popupStore, runeLocalStorage, destructure-trap per CLAUDE.md Context Destructuring Rule) and Phase 99 View Transitions. Suite was green at v2.10.
- The fixture mimics realistic default-path user behavior (click Continue without fiddling). If reproduction confirms a real user lands-and-stalls, prefer an APP-SIDE fix (elections/+page.svelte reactivity) over patching the fixture. Only patch the fixture if the app behavior is genuinely correct for real users and the stall is a pure test artifact.
- Dev server is UP (pid ~88848, :5173). Permissions granted: yarn db:reset / db:seed / dev.
- Treat "did not run" as failure. After the fix, RE-RUN `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` to green (all 8 spec tests) AND re-run `--project=voter-journey` to confirm no regression. Commit the fix.

## Eliminated

- hypothesis: "ElectionSelector data-testid forwarding broken (verifier's theory)"
  why: concatClass spreads ...props (preserves data-testid) and the spread follows the literal data-testid="election-selector", so the root div carries voter-elections-list. Operator confirms prop handling unchanged this milestone. The failure-time snapshot shows the elections list + Continue rendered.

## Evidence

- timestamp: T0 (orchestrator pre-handoff)
  checked: a11y-smoke run + error-context snapshot + elections/+page.svelte + ElectionSelector.svelte + voter-journey.spec.ts elections steps (392-428) vs voter-journey.fixture.ts walk (100-130)
  found: a11y-smoke 5 located tests fail at fixture line 130; snapshot stalled on elections page (both checked, Continue present). The PASSING spec de-selects then re-selects each election option (ensureAllChecked → fires onChange) before clicking Continue; the STALLING fixture clicks Continue with no interaction (relies on the $effect-set default selection). elections/+page.svelte: selected is $state set by $effect from voterCtx.selectedElections||elections; canSubmit=$derived(selected.length>0); handleSubmit goto(Constituencies route).
  implication: The default-selection path (no user onChange) does not navigate on Continue — likely a Phase 95 rune-reactivity defect between the $effect-assigned `selected` and the submit/goto path (or VT interference). Reproduce live, instrument handleSubmit, prefer app-side fix.

- timestamp: T1 (live reproduction + instrumentation)
  checked: Instrumented elections/+page.svelte handleSubmit (logged canSubmit/selected/voterCtx.selectedElections/computed target URL/post-goto URL) and drove the default path with a standalone Playwright repro (click Continue WITHOUT toggling).
  found: The elections page is CORRECT for a real user on the default path — canSubmit=true, selected=[both ids], goto fires, URL changes to /constituencies?electionId[0..1]=…, and the isolated walk reaches the /questions intro. The HYPOTHESIS (elections-page reactivity / handleSubmit no-op) is DISPROVEN. The real stall is in the TEST FIXTURE: voter-journey.fixture.ts:103 probes the elections list with `electionsList.isVisible({ timeout: TIMEOUTS.page })` — but Playwright's `locator.isVisible({timeout})` is a ONE-SHOT snapshot that SILENTLY IGNORES the timeout (playwright-core/client/frame.ts). Under v2.11 (Phase 95 rune migration) `$dataRoot` is populated by a POST-HYDRATION `$effect` in routes/+layout.svelte (vs. synchronous at first paint in the Svelte-4 store era), so the elections list (`{#if elections.length}` ← `$derived $dataRoot.elections`) mounts a beat after navigation. The non-waiting probe lands in that sub-second window, returns false, the `if` block is skipped, Continue is NEVER clicked, and the walk falls through to fail at fixture:130 (questions-start never visible). Failure-time snapshot shows the list DID render — just after the probe.
  implication: ROOT CAUSE = non-waiting `isVisible({timeout})` probe colliding with v2.11's post-hydration render window. The app is correct; the stall is a pure test artifact (the probe's intent — wait up to TIMEOUTS.page — is defeated by the ignored timeout). Fix the fixture to a polling `waitFor`.

- timestamp: T2 (fix + downstream cascade)
  checked: Fixed the fixture probes; re-ran a11y-smoke. Fixing elections unblocked the located walk to reach downstream pages, exposing PRE-EXISTING failures the elections stall had masked.
  found: |
    Cascade of issues (all rooted in v2.11 render timing the elections stall previously hid):
    1. Elections + constituencies non-waiting `isVisible({timeout})` probes → replaced with polling `waitForVisible` helper.
    2. NEW Phase-99 navigation-a11y tests (route-announcer + focus-after-Q→Q, added today in 30eb5ecdd — never green because the elections stall always blocked them) clicked questions-start then waited for the per-question heading WITHOUT advancing past the category-intro interstitial → added `advancePastCategoryIntro`.
    3. Category-intro start `<a>` + answer-loop option clicks raced v2.11 reactive re-render / SvelteKit page-reuse staleness ("element detached" / "<html> intercepts pointer events"): category-intro href resolves post-hydration from voterCtx.selectedQuestionBlocks → navigate via resolved href; answer loop branched on URL (`/questions/category/` vs `/questions/`) and anchored option count/click to the current questionId via the `questionChoices-<id>` name attr (SETTLE-BEFORE-COUNT, mirroring the passing voter-journey spec).
    4. Multi-election results landing requires selecting an election in the AccordionSelect before the list renders ("Select an election first") → fixture now selects the first election.
    5. AccordionSelect wrapper `<div>` had `role=option` children with NO `role=listbox`/`group` parent → axe `aria-required-parent` (critical). FIXED APP-SIDE: added `role="listbox"` + localized `aria-label` (new `components.accordionSelect.listboxAriaLabel` key, 7 locales) to AccordionSelect.svelte.
    6. (OUT OF SCOPE / SEPARATE) Candidate-detail drawer has pre-existing `color-contrast` WCAG 2.1 AA violations (#b1b1b1 / #c5c5c5 muted-gray text on #ffffff across the entity-details drawer: candidate `<h3>` title, alliance/faction tag spans `AA`/`AL-A`, `match` label, `small-info`/`small-label` labels). NEVER scanned before (elections stall blocked the route). Data-dependent FLAKE in the voter-detail-drawer axe test (surfaces when "Special Candidate AA" lands first in matched results). This is a design/theme color remediation, distinct from the elections-continue-stall regression.
    Reduced-motion note: `reducedMotion: 'reduce'` does NOT disable VT in this env — Playwright's option does not reach the app's `window.matchMedia('(prefers-reduced-motion: reduce)')` (probed: matches=false). Matches the voter-journey spec's documented finding.
  implication: Reported regression FIXED (app-side root cause was actually a test artifact + one real WCAG fix). 7/8 a11y-smoke spec tests stable green; voter-detail-drawer flakes ONLY on the separate, pre-existing entity-details color-contrast violation. voter-journey project re-run: GREEN (no fixture regression).

## Resolution

root_cause: The a11y-smoke located fixture stalled on /elections because `voter-journey.fixture.ts:103` probed the elections list with `electionsList.isVisible({ timeout: TIMEOUTS.page })`, but Playwright's `isVisible({timeout})` is a non-waiting one-shot snapshot — it silently ignores the timeout. Under v2.11 (Phase 95 rune migration) `$dataRoot` is populated by a post-hydration `$effect` (vs. synchronous in the Svelte-4 store era), so the elections list mounts a beat after navigation; the non-waiting probe landed in that window, returned false, skipped the Continue click, and the walk fell through to fail at fixture:130. The elections page itself is correct for real users (verified: canSubmit=true, goto navigates).

fix: |
  Test-side (the genuine defect):
    - tests/tests/fixtures/voter/voter-journey.fixture.ts — added polling `waitForVisible` (replaces non-waiting `isVisible({timeout})` on the elections + constituencies probes); `followLinkWhenHrefResolved` for the category-intro start link (resolve href then navigate, dodging detach + pointer-intercept races); URL-based category-intro vs question branch + questionId-anchored option count/click (SETTLE-BEFORE-COUNT); multi-election results AccordionSelect election selection before waiting for the results list.
    - tests/tests/specs/a11y/a11y-smoke.spec.ts — added `advancePastCategoryIntro` after clicking questions-start in the route-announcer + focus tests; made `advancePastCategoryIntro` robust (polling wait + href-resolved navigate).
  App-side (one real WCAG fix):
    - apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte — added `role="listbox"` + `aria-label` to the wrapper div (fixes axe `aria-required-parent` critical).
    - apps/frontend/src/lib/i18n/translations/{da,en,et,fi,fr,lb,sv}/components.json — new `accordionSelect.listboxAriaLabel` key; regenerated translationKey.ts.
  Out of scope (surfaced, NOT fixed): entity-details drawer color-contrast WCAG violations (separate design/theme remediation).

verification: |
  PLAYWRIGHT_A11Y=1 a11y-smoke: 7/8 spec tests stable green (home, elections-selector, constituencies-selector, questions, results, route-announcer, focus-after-Q→Q). voter-detail-drawer flakes ONLY on the pre-existing entity-details color-contrast violation (data-dependent on candidate ordering) — out of scope.
  voter-journey project: GREEN (3 passed) — no fixture regression.
