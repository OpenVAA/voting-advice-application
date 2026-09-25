---
phase: 165-results-navigation-redraw
plan: 05
subsystem: frontend
tags: [svelte5, drawer-host, context-bridge, view-transitions, playwright, e2e, dead-code-removal, testid]

# Dependency graph
requires:
  - phase: 165-02
    provides: "The root-mounted `DrawerHost`, the `drawerHost` singleton with its browser guard and `newKey`, the `ContextBridge`, and `EntityDrawerOpener` as the reference opener shape (last-defined value + close-by-key teardown)"
  - phase: 165-04
    provides: "The three-level results route tree whose surviving entity opener this plan's deletions had to leave working, and the `165-NEGATIVE-CONTROL.md` § 2b/2d discipline this plan's § 2e follows"
  - phase: 165-01
    provides: "The evidence-ledger sections this plan appends to, and the run-time-derivation rule that every anchor is re-measured before it is cited"
provides:
  - "The extended-question-info overlay served by the SAME app-wide host as the entity overlay, opened from a different route subtree — which is what makes the host app-wide rather than results-scoped (criterion 5 / RNAV-05, D-11, D-13)"
  - "A committed spec that EXERCISES the question-info path through the host: containment inside an open dialog, nothing open after dismissal, nothing open after a question → question navigation — discharging the standing obligation spike 034's PARTIAL verdict left on D-11"
  - "A settled testid disposition: `voter-questions-popup-info-modal` stays on the info BODY inside the payload and is NOT the payload's `testId`, which preserves the meaning of BOTH existing fixture branches (visible in popup mode, absent in expander mode)"
  - "No second drawer implementation survives: `QuestionExtendedInfoDrawer` and `EntityDetailsDrawer`, their prop-type modules and all four barrel lines are deleted, and a repository-wide search for either name returns zero"
  - "`165-NEGATIVE-CONTROL.md` § 2e — all six of research's open questions collected in one place with the derivation that answered each — plus one new § 2b anchor-drift row"
  - "A measured, blocking phase-level defect recorded rather than absorbed: `voter-journey` EQTYP-02 fails at ~43% in the results election picker, with eight run dirs as evidence and a hypothesis flagged UNCONFIRMED"
affects: [165-06, 165-07, 165-08]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 4684           # chars/4 over the realized apps+tests diff (18,735 bytes); 6,686 if the NEGATIVE-CONTROL.md prose is counted too (26,745 bytes). The estimate was 30,000, so this came in at ~16% of it on the production scale. The estimate was not wrong about the WORK — it was wrong about where the work sat: the migration is a 60-line component rewrite and four deletions, while the cost of the plan was eight E2E runs of wall-clock (≈47 minutes of gate time) chasing a defect this plan did not introduce.
  tasks: 3
  commits: 3             # MEASURED: git rev-list --count 083bf383a2832814fce1ee56de5636ce0906ef3d..HEAD at SUMMARY-write time.
plan_head_before: 083bf383a2832814fce1ee56de5636ce0906ef3d

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Second consumer of the app-wide drawer host, from a route subtree that is not the results tree"
    - "Opener-side close-by-key effect that READS the subject's identity, so the teardown fires on an in-place subject change as well as on destroy"
    - "Through-the-host E2E assertion shape: `getByRole('dialog')` counted for uniqueness, and the payload body asserted INSIDE it, rather than merely visible on the page"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
    - apps/frontend/src/lib/components/questions/index.ts
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/index.ts
    - tests/tests/fixtures/voter/questionInfo.fixture.ts
    - tests/tests/specs/perm/perm-interactive-info.spec.ts
    - .planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md
    - .planning/phases/165-results-navigation-redraw/deferred-items.md

key-decisions:
  - "Testid disposition: keep `voter-questions-popup-info-modal` on the info BODY inside the host payload and pass NO payload `testId`. Settled by reading both fixture branches line by line, not by inference — the expander branch asserts the SAME locator hidden, and on a persistent host dialog that would have measured a dialog that exists but is closed rather than one that was never mounted."
  - "The close-by-key effect reads `question?.id` rather than being a bare destroy-only teardown. The plan's stated mechanism ('the control can go away on a question-to-question navigation') does not hold on this route: the questions layout keeps the button mounted across that navigation, so a destroy-only teardown would have left the previous question's body on screen — the exact behaviour the plan's own `<behavior>` block forbids."
  - "Open question 3 disposition: DELETE both per-route drawers, their prop types and their barrel entries — derived at run time immediately before deleting, not assumed from the plan."
  - "The `voter-journey` EQTYP-02 failure is recorded as a BLOCKING phase-level defect and deliberately NOT fixed here: the fix would land in a shared component or in the root layout's View-Transition coupling, both outside this plan's files and both behaviour changes to shared surfaces (deviation Rule 4)."

patterns-established:
  - "Testid placement is a decision with an evidentiary cost: before moving one, read every consumer's BOTH branches — the assertion that something is ABSENT changes meaning when the carrier becomes persistent."
  - "A teardown that must fire on an in-place subject change has to READ that subject inside the effect; component destruction is not the only end of a payload's validity."

requirements-completed: [RNAV-05]

coverage:
  - id: D1
    description: "The extended-question-info overlay is served by the app-wide drawer host, opened from the questions route subtree, with the popup testid still on the info body where the existing fixture reads it"
    requirement: RNAV-05
    verification:
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-interactive-info.spec.ts#popup mode: modal info disclosure + infoSections + per-type arguments"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-interactive-info.spec.ts#popup info disclosure opens on mobile"
        status: pass
      - kind: other
        ref: "B=apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte; test -f \"$B\" && grep -q 'drawerHost' \"$B\" && test \"$(grep -c 'QuestionExtendedInfoDrawer' \"$B\")\" = 0 && grep -qF 'voter-questions-popup-info-modal' \"$B\" && D=$(git diff --name-only integration/ship-12-squash...HEAD -- packages/dev-seed); test -z \"$D\""
        status: pass
    human_judgment: false
  - id: D2
    description: "The question-info path is exercised THROUGH THE HOST: the info body is contained in exactly one open dialog, nothing remains open after dismissal, and nothing remains open after a question → question navigation"
    requirement: RNAV-05
    verification:
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-interactive-info.spec.ts#the info overlay opens inside the app-wide host, closes on dismissal, and closes on a question → question navigation"
        status: pass
    human_judgment: false
  - id: D3
    description: "No second drawer implementation survives: both per-route drawer components, their prop types and their barrel entries are gone, with zero surviving references in source or tests"
    verification:
      - kind: other
        ref: "test ! -e …/QuestionExtendedInfoDrawer.svelte && … && test \"$(grep -rn 'QuestionExtendedInfoDrawer\\|EntityDetailsDrawer' apps/frontend/src tests --include='*.svelte' --include='*.ts' | grep -c .)\" = 0"
        status: pass
      - kind: unit
        ref: "TURBO_FORCE=true yarn test:unit (25/25 tasks, 0 cached)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/165-05-alliance — voter-alliance, 3/3, exit 0 (drives the surviving entity opener end to end)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/165-05-redraw — voter-results-redraw, 7/7, exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Research's three named open questions have recorded dispositions, findable in one place alongside the other three"
    verification:
      - kind: other
        ref: "grep -c '^### 2e\\. Dispositions taken on research.s open questions' .planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md → 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The phase's E2E suite is NOT clean: voter-journey EQTYP-02 fails intermittently at ~43% in the results election picker, recorded as a blocking defect with eight run dirs of evidence and an explicitly unconfirmed hypothesis"
    verification: []
    human_judgment: true
    rationale: "A measured defect this plan deliberately did not fix. Whether the phase may proceed with it open, and who fixes it, is an operator call — the plan's scope rule says escalate, the project's E2E hard rule says nothing ships red, and those two point in different directions."

# Metrics
duration: 58 min
completed: 2026-09-23
status: complete
---

# Phase 165 Plan 05: Question info on the app-wide host Summary

**The extended-question-info overlay now opens in the same root-layout `<dialog>` as the entity overlay, from a different route subtree, with a committed spec that asserts containment on open and emptiness on both close paths — and the two per-route drawer components it replaced are deleted rather than left in their barrels.**

## Performance

- **Duration:** 58 min
- **Started:** 2026-09-23T10:54:00Z
- **Completed:** 2026-09-23T11:52:00Z
- **Tasks:** 3 of 3
- **Files modified:** 11 (6 source/test, 4 deleted, 2 planning docs)

## Accomplishments

- **One host, both overlays, both exercised.** `QuestionExtendedInfoButton` hands the `drawerHost` singleton a payload — title getter, content snippet, `getAllContexts()` map — instead of rendering its own `Drawer`. The questions route subtree is not the results tree, so this is the proof that the host is app-wide rather than results-scoped. The `ContextBridge` is what makes it work: the payload renders in the root layout and would otherwise lose every context `QuestionExtendedInfo` reads.
- **The standing obligation from spike 034's `PARTIAL` verdict is discharged with an assertion, not an assurance.** A new committed case in `perm-interactive-info.spec.ts` asserts the page holds exactly ONE element in the open-dialog state and that the info body is INSIDE it; then that nothing remains open after dismissal; then that nothing remains open after a question → question navigation. Containment is the load-bearing half — asserting only that the body is visible somewhere cannot tell the host apart from any other overlay that might render it.
- **The testid hazard was settled by reading, not by guessing** (assumption A4, below). Both fixture branches keep their exact meaning.
- **Four files deleted, four barrel lines removed, zero surviving references.** Callerlessness was re-derived at run time immediately before deleting.
- **A defect this plan found and did not cause is recorded as blocking**, with eight run dirs, two distinct symptoms and a hypothesis marked UNCONFIRMED so the next reader re-tests it rather than inherits it.

## Task Commits

1. **Task 1: Open the extended question info through the app-wide host** — `5e455e2d5` (feat)
2. **Task 2: Assert the question-info overlay opens AND closes through the host** — `c84e3b6b4` (test)
3. **Task 3: Delete the two now-callerless per-route drawers** — `08674c8b1` (refactor)

**Plan metadata:** see the `docs(165-05)` commit that follows this file.

## A4 settled: the fixture's two branches, read line by line

The plan required this to be settled by reading rather than inference, and the reading recorded here:

| Fixture line | Code | What it asserts | Under the body option |
|---|---|---|---|
| `questionInfo.fixture.ts:80` | `const popupModal = page.getByTestId(testIds.voter.questions.popupInfoModal);` | Binds the locator once for both branches | Resolves to the info body inside the host payload |
| `questionInfo.fixture.ts:87` (popup branch) | `await expect(nthOrFirst(popupModal, question)).toBeVisible();` | The modal body is VISIBLE after clicking the popup button | Unchanged: the body renders inside the host's open dialog |
| `questionInfo.fixture.ts:91` (expander branch) | `await expect(popupModal).toBeHidden();` | The modal body is absent/hidden when the inline expander is used | Unchanged, and for the SAME reason as before: in expander mode the popup button never renders, so nothing carrying this testid is ever mounted (count 0) |

**Verdict: the body option preserves both assertions' meaning, so the fixture's assertions were NOT changed.** Had the testid moved onto the host's persistent `<dialog>` — which is what the spike branch does — line 91 would have measured a dialog that exists but is closed rather than one that was never mounted: a different claim wearing the same code. Only comments changed in the fixture, both re-worded to name the host and to state why the zero count still holds.

## The two dataset facts the D-13 ruling rests on, re-derived at run time

Both confirmed before anything was built on them (task 1 step 4):

| Fact | Command | Result |
|---|---|---|
| `perm-interactive-info` still ships the flag ENABLED | `grep -n -A3 'interactiveInfo' packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts` | `300: interactiveInfo:` / `301: enabled: true` — unchanged |
| …over at least one question carrying extended info | same file, `grep -n 'info:\|infoSections'` | `160: info: { en: '[QU-POPUP-INFO] …' }` plus `infoSections` at 164, 201, 218, 239 |
| `e2e/base` still ships the flag DISABLED | `grep -n -A3 'interactiveInfo' packages/dev-seed/src/templates/e2e/base.ts` | `169: interactiveInfo:` / `170: enabled: false` — unchanged |
| No seed template touched anywhere in this phase | `git diff --name-only integration/ship-12-squash...HEAD -- packages/dev-seed` | empty |

## Callerlessness, derived at run time before deleting

| Component | Search (own file and type file excluded) | Matches | Disposition |
|---|---|---|---|
| `QuestionExtendedInfoDrawer` | `grep -rn 'QuestionExtendedInfoDrawer' apps/frontend/src tests --include='*.svelte' --include='*.ts'` | **2** — both its own barrel lines (`lib/components/questions/index.ts:17-18`) | DELETE |
| `EntityDetailsDrawer` | same, for its name | **3** — two barrel lines (`lib/dynamic-components/entityDetails/index.ts:5-6`) and **one prose mention** in `EntityDrawerOpener.svelte:51`'s comment, which is not a caller | DELETE, and the prose mention re-worded so the post-deletion search returns zero |

After deletion the same repository-wide search returns **0**, with both barrels still present — the non-vacuity half, which is what makes the zero mean "observed absent" rather than "the directories were never there".

## Gates, every exit status read directly and never through a pipe

| Gate | Result |
|---|---|
| `yarn workspace @openvaa/frontend check` | exit **0**, `svelte-check found 0 errors and 0 warnings` |
| `yarn lint:check` | exit **0**, **0** `[ERROR]` lines across all assert gates |
| Comment-hygiene scanned-file count | **1724** after tasks 1–2 (unchanged: both files were already tracked), **1720** after task 3 — moved DOWN by exactly the four deleted files, which is the positive control in the deletion direction |
| `TURBO_FORCE=true yarn test:unit` | exit **0**, 25/25 tasks, **0 cached** (a measurement, not a replay) |
| `tests/e2e-runs/165-05-qinfo` — `perm-interactive-info` chain, task 1 | exit **0**, 117 expected / 0 unexpected / 0 flaky / 0 skipped, preflight 1/0; `perm-interactive-info` executed **3** |
| `tests/e2e-runs/165-05-qinfo-assert-2` — same, task 2 | exit **0**, 118 / 0 / 0 / 0, preflight 1/0; `perm-interactive-info` executed **4** — higher than task 1's run, as the criterion requires |
| `tests/e2e-runs/165-05-redraw` — `voter-results-redraw`, task 3 | exit **0**, 7/7, preflight 1/0 |
| `tests/e2e-runs/165-05-alliance` — `voter-alliance`, task 3 | exit **0**, 3/3, preflight 1/0 |
| `tests/e2e-runs/165-05-qinfo-post-delete-2` — `perm-interactive-info` chain, post-deletion | exit **0**, 118 / 0 / 0 / 0, preflight 1/0 |

## Files Created/Modified

- `apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte` — hands the host a payload; carries the last-defined-question convention, the close-by-key effect and the comment stating why no payload `testId` is passed
- `apps/frontend/src/lib/components/questions/index.ts` — two barrel lines removed
- `apps/frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte` / `.type.ts` — **deleted**
- `apps/frontend/src/lib/dynamic-components/entityDetails/index.ts` — two barrel lines removed
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetailsDrawer.svelte` / `.type.ts` — **deleted**
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte` — comment re-worded so no reference to the deleted component survives
- `tests/tests/fixtures/voter/questionInfo.fixture.ts` — comments only; both branches' assertions unchanged
- `tests/tests/specs/perm/perm-interactive-info.spec.ts` — one new desktop case, one re-worded helper doc-comment, one new `openDialogs` helper; no existing assertion removed (`git diff integration/ship-12-squash...HEAD` shows **0** removed `expect(` lines)
- `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` — new § 2e, one new § 2b drift row
- `.planning/phases/165-results-navigation-redraw/deferred-items.md` — the blocking defect below

## Decisions Made

See `key-decisions` in the frontmatter. The two that cost something:

1. **The testid stays on the body.** Cheapest disposition AND the only one that preserves both fixture branches — established by reading, and recorded in the table above so the next reader does not have to re-derive it.
2. **The close-by-key effect reads the question id.** See deviation 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's close-by-key teardown could not produce the behaviour the plan's own `<behavior>` block required**

- **Found during:** Task 1
- **Issue:** The plan (and PATTERNS § B5) prescribe `$effect(() => () => drawerHost.close(hostKey))` — a destroy-only teardown — with the stated reason "the control can go away on a question-to-question navigation". Measured on this tree, it does not go away: the questions layout's popup gate is `appSettings.questions.interactiveInfo?.enabled && (info || customData.infoSections?.length)` (`questions/+layout.svelte:243`), and every info-carrying question in `perm-interactive-info` satisfies it, so the `{#if}` stays true and Svelte keeps the same component instance across the navigation. A destroy-only teardown therefore never fires on a question → question move, and the host would keep the overlay open showing the newly-arrived question's body — contradicting the plan's own behaviour bullet, *"Navigating from one question to the next while the info overlay is open closes it rather than leaving a stale question's body on screen."*
- **Fix:** The effect reads `question?.id` before returning its teardown, so it re-runs — and therefore tears down — on an in-place question change as well as on destroy. A comment states the mechanism and why the destroy-only form is insufficient.
- **Files modified:** `apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte`
- **Verification:** the new spec case navigates question → question with the overlay open and asserts `toHaveCount(0)` on the open-dialog locator — green in `165-05-qinfo-assert-2` and `165-05-qinfo-post-delete-2`. This case is exactly the control for the defect: with the prescribed destroy-only teardown it would read 1.
- **Committed in:** `5e455e2d5`

**2. [Rule 3 - Blocker] The comment-hygiene guard rejected the component's multi-line comments**

- **Found during:** Task 1
- **Issue:** `scripts/assert-comment-hygiene.mjs` rule 2 (D-A4) reports every comment line that ends without terminal punctuation and is continued at the same indent — 13 violations across the new doc-block and the three new inline comments, `lint:check` exit 1.
- **Fix:** each affected comment joined into a single line, which is the repository's own convention for these blocks.
- **Files modified:** same file
- **Verification:** `yarn lint:check` exit **0**, guard reports `0 violation(s)` over **1724** scanned files — and the scanned count is the positive control that the guard actually saw the file (the carried-forward note from waves 1–4: the guard intersects its glob with `git ls-files`, so the file was `git add`ed before the gate was trusted).
- **Committed in:** `5e455e2d5`

**3. [Rule 2 - Missing critical] `EntityDrawerOpener`'s comment named a component the plan required to be unreferenced**

- **Found during:** Task 3
- **Issue:** The task's own acceptance criterion requires a repository-wide search for `EntityDetailsDrawer` to return **zero** across `apps/frontend/src` and `tests`. One prose mention survived in `EntityDrawerOpener.svelte:51` — not a caller, but a match, and a name a future contributor could search for and find nothing behind.
- **Fix:** re-worded to describe the deleted component without naming it, and to say explicitly why the name is not written there.
- **Files modified:** `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte`
- **Verification:** the task's own verify clause, exit **0**
- **Committed in:** `08674c8b1`

### Anchor drift (recorded, not worked around)

**Task 2's verify clause `test "$(grep -c 'expect.soft' …)" = 0` is unsatisfiable as written.** Measured **1**, and it was already 1 at the plan's base commit: the single match is the spec's own rigidity-contract doc-comment, *"HARD assertions only (no expect.soft / try-catch / .catch)"* (`perm-interactive-info.spec.ts:12`). The criterion it stands for is satisfied — there is no soft assertion — so the instrument was corrected to count call sites (`grep -c 'expect\.soft('` → **0**, exit 0) and the drift recorded as a new row in `165-NEGATIVE-CONTROL.md` § 2b. The spec was **not** edited to suit the instrument: deleting the sentence that states the contract in order to make a grep pass is exactly the bend-the-code-to-the-count failure the phase's § 2b discipline exists to catch.

---

**Total deviations:** 3 auto-fixed (1 × Rule 1, 1 × Rule 2, 1 × Rule 3) + 1 recorded anchor drift.
**Impact on plan:** No scope creep. Deviation 1 is the only one that changed the shipped mechanism, and it changed it towards the plan's own stated behaviour rather than away from it.

## Issues Encountered

### ⚠ BLOCKING, phase-level, NOT fixed here: `voter-journey` EQTYP-02 fails at ~43%

Measured across **seven executions** of the `voter-journey` project during this plan: **4 green, 3 red**. Always the same test — `voter-journey.spec.ts:1415`, *"all-min ranks POLAR_MIN above POLAR_MAX…"* — always inside `expectElectionOptionAndSelect` (`voter-journey.spec.ts:376-385`), which drives the results election `AccordionSelect`. Two symptoms: (a) `expect(visibleOptions).toHaveCount(1)` reads **2** for the full 2 s window — the accordion never collapses, though the error-context snapshot shows the selection DID take; (b) `locator.click` times out with `<html lang="en">…</html> intercepts pointer events`, the document View-Transition signature. Under this project's E2E hard rule that is a CARDINAL failure, and it is recorded as blocking rather than absorbed.

**Not caused by this plan, and that is provable rather than asserted:** the failing run uses `e2e/base`, which ships `questions.interactiveInfo.enabled: false` (re-derived above), so `QuestionExtendedInfoButton` — the only production component this plan changed — never mounts in `voter-journey` at all. The other two changed files are a comment-only fixture edit and a different spec.

**Not fixed here, deliberately.** The suspected cause (UNCONFIRMED, stated so the next reader re-tests it) is `AccordionSelect.svelte:48` initialising `expanded` once from `activeIndex` and never reconciling it, combined with the results layout computing `activeIndex` by `findIndex` over an array that can be momentarily unresolved — plus the root layout's VT coupling holding the page non-interactive for the whole of `navigation.complete`. A fix lands in a component shared with the candidate app, or in VT behaviour that `voter-results-redraw.spec.ts` asserts: outside this plan's `files_modified`, and a behaviour change to a shared surface rather than a bug local to a task. That is deviation Rule 4 — escalate, not fix.

The full evidence — all eight run dirs with their verdicts, both symptoms, the hypothesis and the ten-consecutive-run bar a fix must clear — is in `deferred-items.md`, and the defect is on the cross-phase `WINDOWS.md` ledger.

### Playwright's `--project` selector is not a filter here

`--project perm-interactive-info` executes **118** tests, not 4: the perm projects form a linear dependency chain rooted at the base/auth/journey setups, and Playwright runs the whole transitive closure. Consequence worth carrying: a plan's per-project E2E gate in this repo is effectively a near-full-suite run, so an unrelated upstream failure cascades (72 did-not-run in each red run above), and "did not run" counts as failure.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

RNAV-05 is complete: one host, both overlays, both exercised by committed specs, and no second drawer implementation left for a future caller to reach for. 165-06 (the scaffolding guard) and 165-08 (skill + requirements) are unblocked by this plan's artifacts.

**One blocker stands in front of the phase, not in front of 165-06:** the `voter-journey` EQTYP-02 flake above. It is an operator call — the plan's scope rule says escalate, the project's E2E hard rule says nothing ships red, and those two point in different directions. It should be resolved before the phase's closing full-suite run is treated as evidence of anything, because at a 43% per-run failure rate a single green full-suite run cannot distinguish a clean tree from a lucky one.

---
*Phase: 165-results-navigation-redraw*
*Completed: 2026-09-23*

## Self-Check: PASSED

All four key files present on disk; all three task commits present in `git log --oneline --all`; both deleted components confirmed absent.
