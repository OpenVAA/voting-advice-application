---
phase: 165-results-navigation-redraw
plan: 06
subsystem: testing
tags: [vitest, playwright, negative-control, svelte-boundary, view-transitions, guard, filesystem-walk]

requires:
  - phase: 165-02
    provides: the drawer host, its `<svelte:boundary>`, the opener's last-defined-value convention, `isOverlayNavigation` and the name-strip rule
  - phase: 165-03
    provides: the `voter-results-redraw` Playwright project and the view-transition capture fixture
  - phase: 165-04
    provides: the entity-tab layout whose `{ noScroll: true }` navigations NC-6 mutates
  - phase: 165-05.1
    provides: the green tree (171/0) every measurement here is anchored against, and sections 7-8 of the evidence document
provides:
  - "A standing filesystem-walking guard that keeps criterion 6 (RNAV-06) true after the phase ends, observed failing against four distinct realistic reintroductions"
  - "Five more negative-control rows in 165-NEGATIVE-CONTROL.md (sections 9-13), closing D-17 for every fix the phase ships"
  - "A measured verdict on RESEARCH assumption A1: the host's <svelte:boundary> FIRES, proven with a discriminating control"
  - "The closed evidence document: a seven-row summary table, a verdict mapped to all six ROADMAP criteria, an explicit not-discharged section, and a non-contamination accounting of all eleven injections"
affects: [165-07, 165-08, results-navigation, drawer-host, spike-scaffolding, ship-gates]

actuals:
  tokens: 19132          # chars/4 over the realized diff (76,531 bytes, 7621fbce0..HEAD plus the then-uncommitted working tree). The estimate was 35,000; this came in at ~55% of it. The estimate was not wrong about the work — the plan's cost is wall-clock, not diff: ten preflight-confirmed E2E wrapper runs (one of them the 11.1-minute full suite) plus four vitest injection cycles.
  tasks: 3
  commits: 3             # MEASURED: git rev-list --count 7621fbce09d3e5de6fb2e0a4f4fd8091e55793b0..HEAD at SUMMARY-write time, i.e. the three task commits, before the metadata commit that carries this file.
plan_head_before: 7621fbce09d3e5de6fb2e0a4f4fd8091e55793b0

tech-stack:
  added: []
  patterns:
    - "Filesystem-walking vitest guard with a non-vacuity floor derived at write time and an asserted self-exclusion"
    - "Manifest-hash pre-capture (find | sort | git hash-object --stdin) as the creation-injection analog of a per-file blob hash"
    - "Boundary-firing observed through the forensicCapture console attachment in the run's own results.json, with control runs proving the signal is not a constant"

key-files:
  created:
    - apps/frontend/src/lib/_guards/spike-scaffolding.test.ts
  modified:
    - .planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md
    - .planning/phases/165-results-navigation-redraw/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "Evidence-document rows continue this document's own section AND row-id sequence (sections 9-13 as NC-3..NC-7) rather than taking the plan's literal `## 5. NC-2` .. `## 9. NC-6` headings, which collide with the already-committed sections 4-8; a crosswalk table maps every planning-document id to its section instead of renumbering a committed document"
  - "The guard carries FOUR injections rather than the two the plan required: the import, the marker-only file (which an import-only guard misses), the layered-route directory, and a mis-rooted walk that makes all three absence checks pass over 7 files"
  - "The guard scans for the marker text as well as for the module import, prunes the generated `paraglide` directory so the floor does not depend on whether the dev server ever ran, and excludes exactly itself with that exclusion asserted so it cannot silently widen"
  - "The title-getter gap found by NC-7 is filed as deferred item D-165-06-01 and windows entry 279 rather than fixed inside a negative-control row whose contract is to leave the tree byte-identical"

patterns-established:
  - "Pattern 1: a negative control's green is worthless without a discriminating control — NC-7 proves the boundary fires by showing 6 error lines under the injection against 0 in two un-mutated baselines AND 0 under an unrelated mutation"
  - "Pattern 2: a creation-type injection is pre-captured with a manifest hash over the scanned population, which is the same three-way revert proof applied to a set rather than a file"
  - "Pattern 3: a pairing half is DEMONSTRATED with commands against the base ref (ls-tree with a positive control, a zero-match grep) rather than asserted in prose"

requirements-completed: [RNAV-01, RNAV-02, RNAV-03, RNAV-05, RNAV-06]

coverage:
  - id: D1
    description: "A standing guard keeps criterion 6 true after the phase ends: no scaffolding import, no marker comment, no layered-results route directory, under a non-vacuity floor derived at write time"
    requirement: RNAV-06
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/_guards/spike-scaffolding.test.ts (5 tests, 5 passed, exit 0)"
        status: pass
      - kind: unit
        ref: "165-NEGATIVE-CONTROL.md section 9 — four injections, each RED exit 1, each reverted and proven three ways"
        status: pass
    human_judgment: false
  - id: D2
    description: "The overlay view-transition skip is a real guard: deleting the isOverlayNavigation early return reddens the committed spec"
    requirement: RNAV-03
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/165-06-nc4-overlay-skip (exit 1, 1 failed / 6 passed) vs tests/e2e-runs/165-06-nc4-baseline (exit 0, 7 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The name-strip rule's `!important` is load-bearing: dropping it alone returns five inline view-transition names while the strip class is still applied"
    requirement: RNAV-03
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/165-06-nc5-name-strip (exit 1, noNames:true with 5 names) vs tests/e2e-runs/165-06-nc5-baseline (exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The `{ noScroll: true }` option is what preserves scroll on an entity-tab switch, and the base branch would have been green through its removal"
    requirement: RNAV-02
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/165-06-nc6-noscroll (exit 1, offset 171 -> 0) vs tests/e2e-runs/165-06-baseline (exit 0, 7 expected / 0 unexpected)"
        status: pass
      - kind: other
        ref: "git grep -cE 'scrollY|readScroll|noScroll' integration/ship-12-squash -- 'tests/tests/specs/' → exit 1 (no matches), with an ls-tree positive control"
        status: pass
    human_judgment: false
  - id: D5
    description: "RESEARCH assumption A1 settled by measurement: the host's <svelte:boundary> catches a throw raised in the payload's render flush and force-closes the dialog"
    requirement: RNAV-05
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/165-06-nc7-boundary — close case GREEN with 6 boundary/pageerror lines in the console attachments; 0 such lines in 165-06-pre-baseline, 165-06-baseline and 165-06-nc4-overlay-skip"
        status: pass
    human_judgment: false
  - id: D6
    description: "The loader-untrack guard (RNAV-01) carries its measured pair; this plan re-anchors it by re-running the full gate set on the restored tree"
    requirement: RNAV-01
    verification:
      - kind: unit
        ref: "TURBO_FORCE=true yarn test:unit — 25/25 tasks, 1851 frontend tests passed, exit 0"
        status: pass
      - kind: other
        ref: "165-NEGATIVE-CONTROL.md section 7 (NC-1, recorded by 165-02) — RED exit 1, 4 failed / 1 passed"
        status: pass
    human_judgment: false
  - id: D7
    description: "Nothing this plan injected survives it: eleven injections applied and reverted, the tree proven clean three ways per row and re-proven by the full gate set"
    verification:
      - kind: other
        ref: "git diff --stat 7621fbce0..HEAD -- apps packages tests → 1 file changed (the new guard only); git status --porcelain → empty"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/165-06-full-suite — 171 expected / 0 unexpected / 0 flaky / 0 skipped, exit 0"
        status: pass
    human_judgment: false

duration: 39min
completed: 2026-09-23
status: complete
---

# Phase 165 Plan 06: Negative Controls and the Standing Scaffolding Guard Summary

**Every guard this phase ships has now been observed failing against a realistic injected regression — including the `<svelte:boundary>` that had only ever been proven to compile, whose firing is now a measured, discriminating signal — and criterion 6 is kept true by a filesystem guard that was itself observed red four ways.**

## Performance

- **Duration:** 39 min
- **Started:** 2026-09-23T17:27:00Z
- **Completed:** 2026-09-23T18:06:00Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- **The standing scaffolding guard exists and is a guard, not a decoration.** `spike-scaffolding.test.ts` walks `apps/frontend/src`, clears a non-vacuity floor of 700 against 823 files measured at write time, and asserts three absences. It was observed RED against **four** distinct injections — a scaffolding import, a marker comment with *no* import, a `results-layered` route directory, and a mis-rooted walk. The marker-only run is the one that matters: the import check reported ✓ in the same run, which is direct evidence that the import-only guard D-20's wording alone would have produced is green on a tree that still carries the markers.
- **The three behavioural pairs are measured, each with a verbatim red and a baseline green.** The overlay skip (a transition recorded for an `entity`+`id` navigation with four named groups), the name strip (`noNames: true` while five names come back), and `noScroll` (offset 0 where the baseline was 171).
- **The name-strip measurement corrected its own source.** `165-RESEARCH.md` Pitfall 3 predicts two names return; five do. The other three are inline as well, set through Svelte's `style:` directive. The pitfall's reasoning is confirmed and its population was understated — the `!important` is load-bearing for the header and main-content wrapper too, not only the results layout.
- **A1 is CONFIRMED, not assumed.** Reverting D-12's opener convention reproduced spike 034's crash exactly; the close case stayed green **and** the boundary's own `onerror` handler was observed to have run, six times across three tests. The control is what makes it evidence: **zero** such lines in two un-mutated baselines and zero under an unrelated injected regression.
- **A second throw that ESCAPES the boundary was found and recorded rather than buried.** The payload's `title()` getter is read in the dialog's own `aria-label` binding, outside `<svelte:boundary>`; it surfaced as an uncaught `pageerror` in the same run. Not a live defect, but a named gap in the net.
- **The evidence document is closed** to phase 164's structure: seven rows side by side, a verdict mapped to all six ROADMAP criteria (including the honest statement that **criterion 4 has no negative control**), an explicit not-discharged section, and a reproducibility/non-contamination accounting.
- **No regression.** Full default E2E suite: **171 expected / 0 unexpected / 0 flaky / 0 skipped**, exactly the number the phase entered this plan with.

## Task Commits

1. **Task 1: The standing scaffolding guard, with its non-vacuity block and its own negative control (D-20)** — `df1b7ff21` (test)
2. **Task 2: NC-2, NC-3 and NC-4 — observe the three behavioural guards fail against realistic injections (D-17)** — `c37111b5e` (docs)
3. **Task 3: NC-5 — prove the host's boundary FIRES, and close the evidence document (D-12, D-17)** — `26511e739` (docs)

**Plan metadata:** see the final `docs(165-06)` commit.

## Files Created/Modified

- `apps/frontend/src/lib/_guards/spike-scaffolding.test.ts` — **created.** The `_guards` directory's first filesystem-walking guard (the other four are ESLint-driven), taking its mechanism from `lib/routes/routeConsistency.test.ts`. Five assertions in two describe blocks: non-vacuity first (file count over a write-time floor; self-exclusion covers exactly this one file), then the three absences.
- `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` — **modified.** Sections 9-17 appended: five negative-control rows, the id crosswalk, the seven-row summary table, the criteria verdict, the not-discharged section, and the non-contamination accounting. Nothing above section 9 was renumbered or edited.
- `.planning/phases/165-results-navigation-redraw/deferred-items.md` — **modified.** `D-165-06-01`, the title-getter gap in the host's boundary.
- `.planning/WINDOWS.md` — **modified.** Entry `274` (the `unrun-verify` for the unproven boundary) marked **fixed**; entry `279` opened for the title-getter gap.

## Decisions Made

1. **Section and row numbering continues this document's own sequence; the plan's literal headings were not used.** The plan asks for `## 5. NC-2` through `## 9. NC-6`. Sections 4-6 are `165-01`'s three findings, cited by number in `165-01-SUMMARY.md`; section 7 is NC-1 and section 8 is NC-2 (the AccordionSelect reconciliation, added by the interpolated `165-05.1` and cited by its summary). Writing the plan's headings would have required renumbering a committed document, or issuing a second row with the id `NC-2`. The rows are therefore sections **9-13** with ids **NC-3..NC-7**, and section 9 opens with a crosswalk table mapping every planning-document id (`165-VALIDATION.md`'s NC-1..NC-4 and the plan's NC-5/NC-6) to its section here. This follows the handling section 2b and section 7 already established for anchor drift: record the disagreement, do not reconcile it silently.
2. **Four injections for the guard instead of two.** The two the plan named prove two of the three absence assertions. The third (the layered-route directory) and the non-vacuity block — the thing the whole file rests on, and the one the plan calls "the hard part" — would otherwise have been claimed without being observed, which is exactly what the standing acceptance rule forbids.
3. **The guard prunes `paraglide` and excludes exactly itself.** `src/lib/paraglide/` is generated and gitignored, so including it would make the floor depend on whether the dev server had ever run. The self-exclusion is necessary (the file names all three forbidden literals as its subject) and is therefore *asserted* — a self-exclusion that silently widened would hide the next reintroduction behind the check meant to catch it.
4. **The NC-7 finding was filed, not fixed.** A negative-control row's contract is to leave the tree byte-identical; changing product source inside one invalidates the row.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] The plan's evidence-document headings collide with already-committed sections**

- **Found during:** Task 1 (and every subsequent task)
- **Issue:** The plan's `<action>` blocks and three `<verify>` commands name headings `## 5. NC-2`, `## 6. NC-3`, `## 7. NC-4`, `## 8. NC-5` and `## 9. NC-6`. On disk, section 5 is `165-01`'s Finding B, section 7 is NC-1 and section 8 is NC-2 (the AccordionSelect row added by `165-05.1`, which was interpolated after `165-06-PLAN.md` was written). Writing the plan's headings verbatim was impossible without renumbering committed, already-cited sections — which the phase's standing rule forbids in terms — or duplicating the id `NC-2`.
- **Fix:** Rows written as sections 9-13 with ids NC-3..NC-7, continuing both sequences; a crosswalk table at the head of section 9 maps every planning-document id to its section. The three affected `<verify>` commands were run with the heading literal adapted (`^## 9\. NC-3`, `## 10. NC-4`, `## 11. NC-5`, `## 12. NC-6`, `^## 13\. NC-7`) and every other clause of each command left exactly as written; all three passed. The count clause `grep -cE '^## [0-9]+\. NC-' >= 6` passed unadapted, returning **7**.
- **Files modified:** `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md`
- **Verification:** `grep -cE '^## [0-9]+\. NC-'` → 7; each adapted verify command exit 0
- **Committed in:** `df1b7ff21`, `c37111b5e`, `26511e739`

**2. [Rule 2 - Missing critical coverage] The guard's third absence assertion and its non-vacuity block had no negative control**

- **Found during:** Task 1
- **Issue:** The plan requires two injections (import, marker). That leaves the `results-layered` directory assertion and both non-vacuity assertions claimed-but-unobserved — the exact failure mode the standing acceptance rule exists to prevent, and the non-vacuity block is the one the plan itself calls the hard part.
- **Fix:** Two further injections added: a `results-layered` route directory, and a one-line mis-rooting of `SOURCE_ROOT`. The mis-rooted run is the most informative of the four: all three absence assertions report ✓ over a population of **7 files**, which is the false pass demonstrated rather than reasoned about.
- **Files modified:** `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` (section 9c, 9d)
- **Verification:** both injections RED exit 1; both reverted and proven three ways
- **Committed in:** `df1b7ff21`

**3. [Rule 2 - Missing critical documentation] A second, uncaught throw found by NC-7**

- **Found during:** Task 3
- **Issue:** The NC-7 injection produced **two** errors, not one. The boundary caught and logged the payload render throw; a second throw — the payload's `title()` getter, read in the host dialog's own `aria-label` binding, outside the boundary — escaped as an uncaught `pageerror`. Recording only "the boundary fired" would have overstated the net's reach.
- **Fix:** Recorded in full at section 13c with the structural reason, filed as deferred item `D-165-06-01` and windows entry `279`, and named in the not-discharged section. Product source deliberately untouched.
- **Files modified:** `165-NEGATIVE-CONTROL.md`, `deferred-items.md`, `.planning/WINDOWS.md`
- **Verification:** `git diff --stat 7621fbce0..HEAD -- apps` → the new guard file only
- **Committed in:** `26511e739`

**4. [Rule 2 - Ledger hygiene] `.planning/WINDOWS.md` entry 274 closed**

- **Found during:** Task 3
- **Issue:** Entry 274 records the boundary as never observed firing, naming this plan's negative control as the falsification. It was left `open`, so the ship gate would still have counted a discharged debt.
- **Fix:** `gsd-tools windows fixed 274`. `fixed_count` 31 → 32.
- **Files modified:** `.planning/WINDOWS.md`
- **Verification:** entry 274 status reads `fixed` with a `resolved_at` stamp
- **Committed in:** the plan metadata commit

---

**Total deviations:** 4 auto-fixed (1 × Rule 3 blocker, 3 × Rule 2 missing-critical).
**Impact on plan:** None negative. Deviation 1 was forced by a collision the plan could not have foreseen (`165-05.1` was interpolated after it was written) and is resolved by the phase's own recorded-drift convention rather than by renumbering. Deviations 2-4 strictly increase the evidence the plan set out to gather. No scope creep: no product source was changed beyond the one new test file the plan specifies.

## Issues Encountered

**The guard's own commit had to precede its evidence, so the commit was amended.** The evidence document's three-way revert proof includes `git status --porcelain apps packages tests` being empty, which cannot hold while the guard file is itself uncommitted. The guard was therefore committed first, the four injections measured against a genuinely clean tree, and the commit then amended to fold in the evidence section under the message the plan specifies. One commit, exactly the content the plan asks for, and no proof weakened to accommodate the ordering.

**Nine project-scoped wrapper runs and one full-suite run, all preflight-confirmed.** Every invocation carried `--no-db-reset` per the standing instruction, so one Supabase stack served the whole plan. No run returned an exit code outside {0, 1}; the "not measured" branch of the plan (codes 3/4/5/6/7/130) never fired.

**Free space was checked inside the container runtime, not on the host alone** — 15G of 103G available inside `supabase_db_openvaa-local`, against the project's recorded ENOSPC-voids-a-run hazard.

## Verification

| Gate | Result |
|---|---|
| `yarn workspace @openvaa/frontend test:unit spike-scaffolding` | exit 0 — 5 tests, 5 passed, **0 skipped** (a non-zero passing count under the filter) |
| `TURBO_FORCE=true yarn test:unit` | exit 0 — 25/25 tasks; frontend 106 files / 1851 tests passed |
| `yarn workspace @openvaa/frontend check` | exit 0 — 2780 files, **0 errors, 0 warnings** |
| `yarn lint:check` | exit 0 — comment-hygiene scanned **1721** files (positive control: 1720 → 1721 for the new guard), 0 violations |
| `tests/scripts/e2e-run.sh … --project voter-results-redraw` (`165-06-final`) | exit 0 — 7 expected / 0 unexpected / 0 flaky / 0 skipped |
| `tests/scripts/e2e-run.sh … --no-db-reset` (full default suite, `165-06-full-suite`) | exit 0 — **171 expected / 0 unexpected / 0 flaky / 0 skipped** |
| `git diff --stat 7621fbce0..HEAD -- apps packages tests` | 1 file changed — the new guard only |
| `git status --porcelain` | empty |

## Known Stubs

None. No placeholder, no `TODO`, no skipped test, and no unrun `<verify>` was introduced by this plan. The four `<verify>` clauses whose heading literals were adapted (deviation 1) were each **run**, not skipped, with every other clause intact.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for `165-07`.** D-17 is discharged for every fix the phase ships, D-20's standing assertion exists and has been proven, and D-12's untested half has a measured verdict.

**Three things `165-07` should carry forward:**

1. **The visual and accessibility gates are the next plan's instruments** and are explicitly not discharged here (section 16, item 1). D-19 requires the visual project to run **first**, in `mcr.microsoft.com/playwright:v1.58.2-noble --platform linux/amd64`, never on this Mac — and the ENOSPC precondition it names is not discharged either. 15G free inside the container runtime is enough for a Supabase stack plus a Playwright run; it is **not** obviously enough for a linux/amd64 visual-regression image plus baselines. Reclaim before starting, or the run is void rather than red.
2. **Criterion 4 has no negative control**, stated as a gap in section 15 rather than papered over. If `165-07` or `165-08` wants criterion 4 held to the same bar as 1, 2, 3, 5 and 6, that is an unbudgeted row.
3. **Two live residues are named and unfixed** and will still be there: the document View Transition's ~235-256 ms pointer interception on `<html>` (windows 278), and the title-getter gap in the host's boundary (windows 279, `D-165-06-01`). Neither reddens anything today.

**No blockers.**

---
*Phase: 165-results-navigation-redraw*
*Completed: 2026-09-23*

## Self-Check: PASSED

- `apps/frontend/src/lib/_guards/spike-scaffolding.test.ts` — FOUND on disk
- `165-06-SUMMARY.md`, `165-NEGATIVE-CONTROL.md`, `deferred-items.md` — FOUND on disk
- Commits `df1b7ff21`, `c37111b5e`, `26511e739`, `89c21bfa4` — all FOUND in `git log --oneline --all`
- `git status --porcelain` — empty
- `requirements.mark-complete RNAV-01..RNAV-06` returned `applied: false` for every id: the RNAV requirement ids are registered by `165-08` (D-22) and do not yet exist in `REQUIREMENTS.md`. Expected, not a failure; `165-08` owns the registration and the tick.
