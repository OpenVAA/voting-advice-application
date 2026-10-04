---
phase: quick-260930-gjv
plan: 01
quick_id: 260930-gjv
status: complete
subsystem: frontend results routes, drawer host, Playwright results-redraw suite (comments only)
tags: [comment-hygiene, results-redraw, pr-888, comments-only]
requires: ["260930-gjx", "260930-gk0"]
provides: "PR #888 comment population free of planning references and historical narrative"
affects: [apps/frontend, apps/docs, tests]
tech-stack:
  added: []
  patterns: ["comment-only rewrite proven by compiler-normalised equivalence (comment-only-check.mjs)"]
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte
    - apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
    - apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/lib/utils/viewTransition.ts
    - apps/frontend/src/lib/utils/viewTransition.test.ts
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/drawerHost/DrawerHost/+page.md
    - apps/frontend/src/lib/_guards/spike-scaffolding.test.ts
    - apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts
    - tests/playwright.config.ts
    - tests/tests/fixtures/voter/views.ts
    - tests/tests/specs/perm/perm-interactive-info.spec.ts
    - tests/tests/specs/voter/voter-results-redraw.spec.ts
    - tests/tests/utils/testIds.ts
decisions:
  - "Surviving planning pointers use only the bare `see spike 031..034` form; no `see phase 165.1` pointer was needed (every rewritten comment stands on its mechanism)"
  - "Stale factual claims met while rewriting were corrected rather than carried forward (testIds `{#key}` location; the E2E teardown step no longer credits a boundary negative control that is not in the suite)"
metrics:
  duration: ~13 min
  completed: 2026-09-30
  tasks: 3
  files: 18
actuals:
  tasks: 3
  commits: 3
plan_head_before: 77e429e9cbdb64db25480786cddb9bf4829524d6
plan_head_after: a9ad4ba05dddd4bcde48e69e0d35b67ad4163e78
---

# Quick 260930-gjv: Revalidate, then fix, CLAUDE.md comment-hygiene violations in PR #888's comments — Summary

**The results-redraw comments, test titles and assertion messages PR #888 added under `apps/` and `tests/` now describe the code as it is now. They carry no phase, decision, threat, requirement, plan or criterion ids, planning-document paths or anchors, milestone tags or run provenance. Three comment-only commits, 88 lines rewritten in 18 files. The compiler-normalised check shows every code file SAME.**

## Revalidation (before any edit)

- Item base: `77e429e9cbdb64db25480786cddb9bf4829524d6` (`item-base.rev`). Siblings 260930-gjx (`f8769eb97`) and 260930-gk0 (`a29f7e310`, `0ff348c57`) were already on the branch, so the precondition was met.
- The finding still held. `scoped-hygiene-gate.sh` (full population) printed **HITS=123** and exited 1, the same count as at planning time. The full output is in `gate-start.txt` in this directory.
- The item's two quoted examples were verbatim in `AccordionSelect.svelte`'s reconcile comment.
- The reading pass also found narrative the gate cannot see: DrawerHost's close bullet, the past tense in `layout.tracking.test.ts`, the "Open Question 4 RESOLVED / former clause is gone" list-container comment, and the leaf page's moved "debug session", "UI-SPEC" and "legacy" comments.

Per-file hits at the start:

| Hits | File |
|---:|---|
| 45 | tests/tests/specs/voter/voter-results-redraw.spec.ts |
| 24 | apps/frontend/src/lib/_guards/spike-scaffolding.test.ts |
| 15 | results/…/[[id]]/page.guards.test.ts |
| 8 | results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte |
| 7 | apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte |
| 6 | results/…/[[id]]/+page.svelte |
| 5 | apps/frontend/src/lib/routes/route.ts |
| 4 | results/[[electionTab]]/+layout.svelte |
| 3 | tests/playwright.config.ts |
| 1 | drawerHostState.svelte.ts, viewTransition.ts, viewTransition.test.ts, views.ts, perm-interactive-info.spec.ts, testIds.ts (each) |

(`results/` = `apps/frontend/src/routes/(voters)/(located)/results/`.)

Start-of-item hits by line: see `gate-start.txt`. They cover phase refs (`phase 165`, `phase-165`), decision ids (D-03/07/08/09/10/12/15/16/18/20/21/25), threat ids (T-165-02/03/04), requirement ids (RNAV-02..06), `criterion 6` / `criteria 2`, `Post-88-02`, `165-NEGATIVE-CONTROL.md` / `165-RESEARCH.md` / `165-BASE-FLAKE-MEASUREMENT.md`, `§`, `.planning/`, `v2.16`, `e2e-runs/`, and spike citations not in the bare form.

## Per-file changes

**Task 1: $lib slice (`9143a631c`)**
- `AccordionSelect.svelte`:
  - Collapse-timer comment: removed the `tests/e2e-runs/…` measurement sentence and kept the orphaned-timer mechanism.
  - Correction comment: removed "which is literally what the remount used to deliver".
  - Reconcile comment: rewritten as the present-tense reason. The initialiser runs once, the results subtree persists, a `-1` mount stays mounted, and without this effect the ~450 ms timer window plus a late click re-opens the widget permanently. The release, phase, D-03, run-tally and planning-path text is gone.
  - "Switching…" paragraph: "is untouched" became "is not handled here", "fold this back" became "fold this", and "that is the entire defect" became "that transition is what this effect exists to catch".
- `DrawerHost.svelte` `@component` close bullet: the host closes after the out-animation (immediately under reduced motion) instead of being compared with the per-route `Drawer`. The generated DrawerHost `+page.md` was mirrored byte-for-byte, and `diff -B` of the two extracts is empty.
- `drawerHostState.svelte.ts`: dropped "(threat T-165-04)". The comment still states the cross-request payload-leak risk in words.
- `route.ts` (statistics): says the route sits beside the election-tab segment, because under it the page would inherit the results layout chain (hero, ingress, election picker) and gain a second `<h1>`. Keeps "this constant and the directory move together or the route 404s". Both claims were checked against `[[electionTab]]/+layout.svelte` (MainContent renders the title `<h1>`) and the `results/statistics/` directory.
- `viewTransition.ts` / `viewTransition.test.ts`: the symptoms are stated as present-tense consequences, with a `see spike 031` pointer.

**Task 2: routes and guard (`10c2548a3`)**
- `[[electionTab]]/+layout.svelte`:
  - Dropped the phase/decision parenthetical and "where the tabs-and-list markup used to sit".
  - The D-08 bullet is renamed "Chooser instead of children".
  - List-container comment: "Open Question 4 RESOLVED / former clause is gone" became the present-tense fact that the drawer is a top-layer dialog in the root layout, so source order does not decide paint order.
- `[[entityTab=etPl]]/+layout.svelte`:
  - Dropped the parenthetical.
  - Post-88-02 became the no-force-fill invariant, checked against `buildListRoute`'s doc and the leaf `+page.ts`.
  - The spike-measured alternative became the present-tense reason there is no `+page.svelte`, with `see spike 033`.
  - The D-08 heading and template comment became "Chooser instead of children at this level".
  - The `drawerVisible` comment now states the carve-out guarantee instead of the pre-split history. `perm-localisation-positive` is named as the spec that opens a drawer from a bare `/results`; its step 10 was checked.
  - The "coupling the split exists to remove" clause is gone.
- `[[id]]/+page.svelte`:
  - Dropped the parenthetical.
  - The no-canonicalisation rule is stated plainly, and the `165-NEGATIVE-CONTROL.md` citation is deleted.
  - Spike 033 is cited in the bare form.
  - Moved comments: "debug session" became a present-tense rationale (the `dev-seed` pipeline's `sort_order` write was checked), the "UI-SPEC Empty State Inventory" reference became a plain statement, and "legacy" is gone.
- `page.guards.test.ts`:
  - Header: states why both guards exist. The params are optional, so SvelteKit's 404 never answers the malformed shapes. The guards are the second layer of input validation over the `etPl` / `etSg` matchers. A force-filled redirect would be a navigation loop.
  - Invariant 2 describes the loop, not Post-88-02. Invariants 1–5 keep their numbers.
  - The describe title is now "the entity-type and id guards".
  - The cross-type `it` title and comment state the rule. The D-08, D-09 and D-10 comments are restated, and "measured truth" became "one row per guard branch".
- `layout.tracking.test.ts`: the module doc's tracked-read consequence is now in the present tense.
- `spike-scaffolding.test.ts`:
  - The module doc says what is asserted (no import of the lab module path, no upper-case marker, no parallel route directory) and why a standing guard is needed. Phase, criterion, RNAV, D-20 and D-21 are gone, and so is the "on this branch never existed" story.
  - Invariant 5 no longer carries the history.
  - The "does not do" section now says it scans nothing outside `apps/frontend/src`.
  - The `NON_VACUITY_FLOOR` doc keeps the re-derivation command and the reason for the floor, without the date or commit hash.
  - The marker doc cites the "see spike 034" form. The describe titles and the three failure messages carry no ids.

**Task 3: Playwright suite (`a9ad4ba05`)**
- `voter-results-redraw.spec.ts`:
  - Module doc: the purpose is stated by mechanism, without criteria, RNAV/D ids or "the defect this phase fixes".
  - Bullet headings and the four describe titles lost their id lists; the titles are still distinct.
  - Spike 032/033/034 are cited as `see spike 03N`.
  - Provenance ("Measured, not assumed", "an early run", "the first run timed out", "recorded in this plan's summary", "Investigation Trail item 5", "Pitfall 6/7") became present-tense facts.
  - The Post-88-02 comments describe the loop, and the negative-control citation is deleted.
  - The `// reason:` prose was edited after `reason:` only.
  - The teardown-step comment and its message no longer name spike 034's verdict or the D-12 negative control.
- `testIds.ts` `listContainer`: dropped D-18 and 165-RESEARCH, and corrected the `{#key}` location (see Deviations).
- `playwright.config.ts`: dropped "(phase 165, D-16/D-18)" from the voter-results-redraw project comment only.
- `views.ts`: dropped D-16. The NOTE now says this is the only registration that awaits its factory.
- `perm-interactive-info.spec.ts`: "the path spike 034 found could hang the dialog" became "where a throw inside the host's render flush can leave the dialog hung (see spike 034)". The line sibling 260930-gjx added in this file is clean.

## Reviewed and left unchanged

- `QuestionExtendedInfoButton.svelte` and `openEntityDrawer.svelte.ts`: already use the allowed `see spike 034` form and the present tense. No sibling item added a violation.
- `(voters)/(located)/+layout.ts`: clean. `see spike 031` is allowed, and the `next=` open-redirect allowlist rationale is intact.
- Sibling 260930-gk0's DrawerHost comments (the two-frame reveal, the dismissal key guard and the timer re-check) are present tense with no references, so they were left alone. 260930-gjx's line in `perm-interactive-info.spec.ts` is also clean.

## Verification evidence

- **Scoped gate, whole population, end of item:** `HITS=0`, exit 0 (`gate-end.txt`).
- **comment-only-check** `--changed apps/ packages/ tests/` against the item base: exit 0.
  - 17 code files are SAME (strict for production files; strings blanked for 6 test/spec files).
  - The one SKIP is the generated DrawerHost `+page.md`.
  - No FAIL, and no file outside `files_modified` (`comment-only-check.txt`).
- **Other gates:**
  - `yarn assert:comment-hygiene`: 0 violations.
  - Frontend unit suite: 128 files / 2054 tests passed.
  - Frontend lint: 0 errors, plus 1 pre-existing warning in `candidateContext.svelte.test.ts`.
  - Frontend `typecheck` (svelte-check): 0 errors, 0 warnings.
  - `yarn typecheck:tests`: exit 0.
  - `eslint tests`: exit 0, with 0 errors and 2 pre-existing warnings in files this item did not touch.
  - `prettier --check` on every changed file: clean.
- **Playwright `--list`:** before `Total: 173 tests in 100 files`, after `Total: 173 tests in 100 files` (identical).
- **Repo-wide `hygiene-grep-report.sh` against `hygiene-baseline.tsv`:** no row grew. The delta column format was checked first (plain signed integer in the last column). The awk filter parsed all 9 rows and exited 0.

| pattern | baseline occ | final occ | delta |
|---|---:|---:|---:|
| phase-ref | 75 | 62 | -13 |
| spike-ref | 34 | 33 | -1 |
| decision-id-long | 0 | 0 | 0 |
| decision-id-bare | 201 | 149 | -52 |
| section-anchor | 49 | 45 | -4 |
| planning-path | 14 | 12 | -2 |
| plan-number | 1 | 1 | 0 |
| milestone-ver (report-only) | 15 | 14 | -1 |
| task-id | 105 | 94 | -11 |

Union of files touched by any row: 153 at baseline, 147 at the end.

- **`hygiene-grep-report.sh --assert-clean`: exit 1 (red), 7 gate rows failing.**
  - **Cause:** pre-existing planning references in about 147 files across `apps/`, `packages/` and `tests/` that PR #888 never added, or that sit on lines outside this item's population.
  - The scoped gate at HITS=0 shows that none of the remaining hits are on lines this item owns.
  - Out of scope by the plan; the scope was not widened.

## Deviations from Plan

1. **[Rule 1: stale claim] testIds.ts `listContainer` comment.** It said the scope-tuple `{#key}` remount lives in `results/[[electionTab]]/+layout.svelte`. It actually lives in the results leaf `+page.svelte`. The rewritten comment names the leaf page. For the same reason, voter-results-redraw.spec.ts:164 now says "the results page remounts" instead of "the results layout remounts".
2. **[Rule 1: stale claim] voter-results-redraw teardown step.** It credited "D-12's negative control in 165-06" with proving the `<svelte:boundary>` fires. No such test exists in the suite (`DrawerHost.svelte.test.ts` has no boundary case), so the comment now says the step proves the OUTCOME, not that the boundary fires. This is a test-coverage gap for the verifier to weigh, not a code change.
3. **[Reading pass beyond the plan's bullet list, same files]** Four narrative comments in listed files that the plan did not itemise were also rewritten:
   - the `[[electionTab]]` list-container comment ("Open Question 4 RESOLVED / former clause is gone");
   - the leaf page's moved "debug session `tied-match-order-churn`", "UI-SPEC Empty State Inventory" and "legacy" comments;
   - the entity-tab layout's "coupling the split exists to remove" clause;
   - AccordionSelect's "is untouched" and "that is the entire defect" (the plan said to keep that paragraph apart from "back", but those phrases narrate the change).

Beyond these, the plan was executed as written.

## Residual (out of scope, not changed)

- `apps/frontend/src/routes/(voters)/(located)/results/statistics/+page.svelte` (in PR #888's population but not in this plan's `files_modified`): the heading comment says `text-base` "holds the rendered size at the former h4". That is mild narrative ("keeps the rendered size of an h4" would be enough). It was left alone because the plan's comment-only acceptance forbids any changed file it does not list.
- The leaf `+page.ts` still says "Post-88-02 loop fix". That line predates PR #888, so it is outside this item's population and the scoped gate; the repo-wide report counts it.

## Known Stubs

None.

## Self-Check: PASSED

- Commits `9143a631c`, `10c2548a3` and `a9ad4ba05` exist on `fix/888-review-findings`. `git rev-list --count 77e429e9c..HEAD` = 3.
- All 18 modified files exist; none was added, deleted or renamed.
- Planning artifacts are in this directory: `item-base.rev`, `gate-start.txt`, `gate-end.txt`, `hygiene-baseline.tsv`, `hygiene-baseline-report.txt`, `hygiene-final-report.txt`, `hygiene-assert-clean.txt`, `comment-only-check.txt`, `playwright-list.before`, `playwright-list.after`. None is committed; the orchestrator commits this directory.
