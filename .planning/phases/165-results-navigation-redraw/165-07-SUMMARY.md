---
phase: 165-results-navigation-redraw
plan: 07
subsystem: testing
tags: [phase-gate, e2e, playwright, axe, visual-regression, turbo, prettier, docker, negative-control]

requires:
  - phase: 165-06
    provides: "the closed evidence document (§§ 1-17) this plan appends § 18 to, and the seven negative-control rows whose claims the gate run does not restate"
  - phase: 165-05.1
    provides: "the 171/0 green tree this gate re-measures at a later head"
  - phase: 165-04
    provides: "the split results layout whose rendered output the visual baselines test"
  - phase: 165-02
    provides: "the drawer host whose accessibility contract the axe scan measures"
provides:
  - "§ 18 of 165-NEGATIVE-CONTROL.md: nine gate rows (G-1..G-9), each with its verbatim command, its exit code read from the command itself, and its counts"
  - "The cardinal E2E rule discharged for the phase as a whole: 171 expected / 0 unexpected / 0 flaky / 0 skipped / 0 did-not-run, with the did-not-run figure DERIVED rather than assumed absent"
  - "D-19 discharged: the visual project run first in the pinned amd64 container, 4 of 4 baselines matched, zero baselines re-captured, provenance recorded verbatim"
  - "A repo-wide format gate that was already red at the phase base, found and fixed (13 files, 11 of them pre-existing v2.15 debt)"
  - "D-165-07-01: the visual gate has no baseline of an open drawer, so this phase's headline change is visually unmeasured — filed rather than papered over"
affects: [165-08, ship-gates, visual-regression-coverage, v2.15-close]

actuals:
  tokens: 12628          # chars/4 over the realized diff (50,513 bytes, 5b9cb3d3a..HEAD). Estimate was 25,000; this came in at ~51%. The estimate was not wrong about the work — a gate plan's cost is wall-clock, not diff: THREE full static chains (the first two came back red), an 11.1-minute full suite, the a11y scan, and a container visual run.
  tasks: 3
  commits: 7             # MEASURED: git rev-list --count 5b9cb3d3a9f05bc326fee4291e0ca6e6cac400a8..HEAD at SUMMARY-write time, i.e. the seven task/fix/doc commits, before the metadata commit that carries this file.
plan_head_before: 5b9cb3d3a9f05bc326fee4291e0ca6e6cac400a8

tech-stack:
  added: []
  patterns:
    - "Partition a repo-wide gate failure before acting on it: separate 'the gate is red' from 'this phase broke the gate' by testing the base blob, so the fix is scoped honestly and the finding is not mis-attributed"
    - "Prove a mechanical reformat semantics-preserving BEFORE writing it, by comparing the file and its formatter output with all whitespace stripped"
    - "Derive the did-not-run count from the report's own structure (specs enumerated vs. test objects carrying a non-empty results array) rather than treating a missing field as a zero"
    - "Record a container run's architecture as OBSERVED INSIDE the container (uname_m), not as the flag that was passed — the flag is the intent, the observation is the evidence"

key-files:
  created:
    - .planning/phases/165-results-navigation-redraw/165-07-SUMMARY.md
    - tests/e2e-runs/165-07-full-suite/
    - tests/e2e-runs/165-07-a11y/
    - tests/e2e-runs/165-07-visual/
  modified:
    - .planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md
    - .planning/phases/165-results-navigation-redraw/deferred-items.md
    - .planning/WINDOWS.md
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql

key-decisions:
  - "The repo-wide format failure was fixed rather than deferred, against the executor's default scope boundary, because format:check is repo-wide and CI runs it globally — the branch cannot ship with it red. The 11 pre-existing files were committed SEPARATELY from the 2 that are this phase's, with a message stating they are not phase-165 changes."
  - "Every one of the 13 reformats was proven semantics-preserving before being written; the four .sql files, which no gate in this chain executes, additionally had their diffs read line by line."
  - "The full suite was run with --no-db-reset rather than the plan's reset, on the operator's instruction for this host. The substitution is sound: data-setup-base/data-teardown-base are INSIDE the 171 and supply the known state, and CLAUDE.md states a reset is not a precondition of a correct run."
  - "G-8 is recorded as an ISOLATING RE-RUN of a default-on project already inside G-7's 171, not as a second instrument — a11y-smoke is not opt-in, and presenting it as extra coverage would overstate it."
  - "No new negative control was taken for the visual gate. VGATE-01/VGATE-03 established its sensitivity by measurement in Phase 146 (injection caught at 23.9x/24.2x the cap; 0 noise in all 40 cells), and D-17 scoped this phase's pairs to the four fixes."
  - "The visual coverage gap the run exposed (no baseline captures an open drawer) was FILED, not closed. Authoring a new baseline inside the gate plan would mean the gate blessed an image it had just written — the opposite of D-19."

patterns-established:
  - "Gate section carries the literal heading the acceptance check greps for AND continues the document's own section numbering, via a compound heading — never renumber a committed document"
  - "A gate run's red attempts are reported in the record, not deleted: § 18a carries both failed chains and what each taught"

requirements-completed: [RNAV-01, RNAV-02, RNAV-03, RNAV-04, RNAV-05, RNAV-06]

coverage:
  - id: D1
    description: "Every static gate this repository ships is green at one head with the cache forced: unit, lint, format, build, svelte type-check and workspace typecheck, each recorded with its verbatim command, exit code and counts"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn test:unit (257 files / 3319 tests, Cached: 0 of 25)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check (11 standing guards at 0 violations, Cached: 0 of 11 and of 23)"
        status: pass
      - kind: other
        ref: "yarn format:check (all matched files conform)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn build (14 tasks, Cached: 0)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check (2780 files, 0 errors, 0 warnings, --fail-on-warnings)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true npx turbo run typecheck (23 tasks, Cached: 0, svelte-check 0/0 twice)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The full E2E suite is green under the project's cardinal rule, with all five counts recorded and zero in the four that must be zero"
    requirement: RNAV-01
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-07-full-suite --no-db-reset — exit 0, preflight successes 1, 171/0/0/0/0 over 100 projects"
        status: pass
    human_judgment: false
  - id: D3
    description: "No new accessibility violation on the routes this phase changed — the drawer host, the split results route and the route announcer scanned by axe in both themes"
    requirement: RNAV-05
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-07-a11y --no-db-reset --project a11y-smoke — exit 0, 18/0/0/0/0, of which 16 are the scan's own"
        status: pass
    human_judgment: false
  - id: D4
    description: "The visual regression project run first in the pinned container on the pinned platform, with every difference explained before any baseline is blessed (D-19)"
    verification:
      - kind: e2e
        ref: "tests/scripts/visual-container.sh --run-dir tests/e2e-runs/165-07-visual — exit 0, 7/0/0/0/0, 4 of 4 baselines matched, 0 re-captured"
        status: pass
    human_judgment: true
    rationale: "D-19 makes the baseline disposition an operator judgement, not a pixel count. This run produced NO differing baseline, so the judgement has no subject and nothing was re-captured — but the operator should confirm that reading, and should see D-165-07-01: the run's green says nothing about how the drawer host LOOKS, because no baseline captures an open drawer."
  - id: D5
    description: "The repo-wide format gate, found already red at the phase base, returned to green — 13 files, 11 of them pre-existing v2.15 debt, every reformat proven semantics-preserving"
    verification:
      - kind: other
        ref: "yarn format:check exit 0 at 1718a2d30; yarn lint:check exit 0 at the same head after yarn schema:regenerate"
        status: pass
    human_judgment: false

duration: 38 min
completed: 2026-09-23
status: complete
---

# Phase 165 Plan 07: The Phase Gate Summary

**Nine instruments run at one tree — 171/0/0/0/0 on the full E2E suite, 0 axe violations on the replaced drawer, 4 of 4 visual baselines matched in the pinned amd64 container with none re-captured — and a repo-wide format gate that turned out to have been red since before this phase began.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-09-23T18:11:00Z
- **Completed:** 2026-09-23T18:49:02Z
- **Tasks:** 3
- **Files modified:** 17 (2 product/schema, 1 generated migration, 13 formatted, plus the planning documents)

## Accomplishments

- **The cardinal E2E rule is discharged for the phase as a whole.** 171 expected, **0 unexpected, 0 flaky, 0 skipped, 0 did-not-run**, across 100 Playwright projects including the whole serial `perm-*` dependency chain, at exit 0 with a positively-confirmed preflight. The did-not-run figure is **derived**, not assumed: 171 specs enumerated, 171 test objects, 0 carrying an empty `results` array. Playwright has no such field, and the cardinal rule turns on exactly that number.
- **D-19 is discharged with its provenance recorded and nothing blessed.** The visual project ran **first**, in `mcr.microsoft.com/playwright@sha256:6446946a…` (= `v1.58.2-noble`) under `--platform linux/amd64`, with `uname_m=x86_64` observed *inside* the container on an arm64 Mac host — the positive proof the platform flag took effect rather than being silently ignored. 4 of 4 baselines matched. **No baseline was re-captured, and none needed an operator disposition, because none differed.** `git status --porcelain tests/tests/specs/visual/` is empty afterwards.
- **The drawer host's accessibility contract is measured, not assumed.** The axe scan covers `voter-detail-drawer` and `results-filter-drawer` in *both* themes, plus the `results` route and the two navigation-a11y tests — 16 tests, 0 violations. Neither the spec nor the shared `axeScan.ts` core was touched by this phase, so the scan returning zero is the same scan at the same strictness that held the contract before the drawer was replaced.
- **Every turbo-backed gate is provably forced, not replayed.** All four carry `Cached: 0 cached` beside their `TURBO_FORCE=true`. The flag is the intent; the `0 cached` line is the evidence it took effect. `Tasks: 0 successful` — a run that matched nothing — was checked for and did not occur.
- **A repo-wide format gate that had been red since before this phase was found and fixed.** 13 unformatted files, of which **11 were untouched by phase 165 and already unformatted at the phase base** `4d023c587`. CI runs `format:check` globally, so the branch could not have shipped.
- **The gate's own red attempts are in the record.** § 18a reports both failed chains — the format red, then the schema-migration parity guard the format fix itself tripped — rather than presenting only the third, green run.

## Task Commits

1. **Task 1: Every static gate, forced, at one head** — `e204b2c1a` (style), `605689fa3` (style), `1718a2d30` (chore), `9536af4e7` (chore)
2. **Task 2: The full E2E suite under the cardinal rule, plus the accessibility scan** — `712930ccf` (chore)
3. **Task 3: Visual baselines in the pinned container (D-19)** — `8a5af3c92` (chore)

Plus `63601c3d9` (docs) filing the run's two residues and the format-debt finding.

## Files Created/Modified

- `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` — gains **§ 18 "Gates"**: the two red attempts and what each taught (18a), rows G-1…G-6 (18b), the two-heads-one-tree note (18c), G-7 the full suite (18d), G-8 the a11y scan (18e), what a green suite does NOT mean (18f), G-9 the container visual run (18g), and a nine-row gate verdict.
- `.planning/phases/165-results-navigation-redraw/deferred-items.md` — D-165-07-01 (no visual baseline of an open drawer) and D-165-07-02 (a stale comment naming the pre-165 drawer mechanism).
- `.planning/WINDOWS.md` — entry **280 open** (the visual coverage gap), entry **281 recorded and marked fixed** (the pre-existing format debt).
- `apps/supabase/supabase/schema/300-auth-tables.sql` and 12 other files — prettier reformat.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — regenerated after the schema reformat, per the parity guard's own remedy and D-17.
- `tests/e2e-runs/165-07-full-suite/`, `165-07-a11y/`, `165-07-visual/` — the three run directories, cited by path in the evidence document.

## Decisions Made

Recorded in the frontmatter `key-decisions`. The two that most shape how this record should be read:

1. **G-8 is an isolating re-run, not a second instrument.** `a11y-smoke` is default-on and is already one of the 100 projects inside G-7's 171. Its value here is that it reports its own counts separately, and it is labelled that way rather than presented as extra coverage.
2. **The visual gap was filed, not closed.** Authoring a fifth baseline inside the gate plan would have meant the gate blessing an image it had just written — the exact inversion of D-19.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `yarn format:check` was already red at the phase base**

- **Found during:** Task 1, first run of the static chain at `5b9cb3d3a`.
- **Issue:** Exit 1, **13 unformatted files**. Partitioned before acting: **2** were introduced by this phase (`page.guards.test.ts` from 165-04, `voter-results-redraw.spec.ts` from 165-03); **11** were untouched by this phase and already unformatted at the phase base `4d023c587`, verified per file by running prettier against the base blob. None of the 11 exists on `main`. So the gate was red *before* phase 165 began.
- **Why fixed rather than deferred** (this overrides the executor's default scope boundary, deliberately): `format:check` is repo-wide and **CI runs it globally**, so the branch cannot ship with it red and the plan's acceptance criterion "every gate exit code recorded is 0" cannot be met truthfully while it stands.
- **Fix:** Two separate commits — `e204b2c1a` for the two that are ours, `605689fa3` for the eleven that are not, whose message states in terms that they are not phase-165 changes. Every reformat was proven semantics-preserving **before** being written, by comparing the file and its prettier output with all whitespace stripped: 11 of 13 byte-identical, 2 switching one test-description literal each from an escaped single-quoted string to a double-quoted one with an identical value. The four `.sql` files, which no gate in this chain executes, had their diffs read line by line as well.
- **Verification:** `yarn format:check` exit 0 at `1718a2d30`.

**2. [Rule 1 - Bug] The schema reformat desynced the generated migration**

- **Found during:** Task 1, second full run of the chain.
- **Issue:** `yarn lint:check` exit 1. Prettier's reflow of one `GRANT SELECT` statement in `apps/supabase/supabase/schema/300-auth-tables.sql` left `apps/supabase/supabase/migrations/00001_initial_schema.sql` stale. The schema-migration parity guard caught it by name and printed the first differing line (1509) with both sides.
- **Fix:** `yarn schema:regenerate`, its diff read as a diff per D-17 and committed in the commit following the schema edit. The whole diff is the same three-line reflow of the same one statement.
- **Verification:** `yarn lint:check` exit 0 at `1718a2d30`.
- **Committed in:** `1718a2d30`.
- **Note:** this is the concrete justification for the plan's "re-run the whole chain from the top" rule. Had only `format:check` been re-run after the fix, the chain would have been recorded green with a stale generated migration in the tree.

**3. [Rule 3 - Blocking] `--no-db-reset` substituted for the plan's database reset**

- **Found during:** Task 2.
- **Issue:** The plan's action text asks for a reset; the operator's environment brief for this host instructs `--no-db-reset` on every wrapper invocation, two Supabase stacks are live on the host, and the project has a recorded storage-502 wedge behind `db:reset`.
- **Fix:** Ran with `--no-db-reset`. The substitution does not weaken the run: `data-setup-base` and `data-teardown-base` are *inside* the 171 and both passed, so the known state is supplied by the dependency graph; `CLAUDE.md` states a reset is not a precondition of a correct run; and all nine earlier wrapper runs in this document used the same form, so this one is consistent with the instrument rather than a lone variant.
- **Verification:** exit 0, preflight successes 1, `e2e_project_id=00000000-0000-0000-0000-0000000000e2`, `dirty_files=0`.

---

**Total deviations:** 3 auto-fixed (2× Rule 3 blocking, 1× Rule 1 bug).
**Impact on plan:** No scope creep in the phase's own subject matter — no product source under `apps/frontend` was modified, which the plan's own `<verify>` blocks assert and which held at every commit. Deviations 1 and 2 touched files outside this phase, and are labelled as such in their commit messages rather than absorbed into the phase's narrative.

## Issues Encountered

**The visual gate cannot see this phase's headline change.** G-9 returned 4 of 4 baselines matched — correct, and also silent about the drawer host, because all four baselines screenshot a page with **no overlay showing**. G-8's axe scans open the drawer and cover its *conformance* in both themes; nothing covers its *appearance*. Filed as **D-165-07-01** and **WINDOWS 280 (open)** rather than closed here, for the reason given above.

**A stale comment survives in the a11y spec** (`a11y-smoke.spec.ts`, the `voter-detail-drawer` entry) still naming `results/+layout.svelte beforeNavigate` as the interception point. Filed as **D-165-07-02**. Not fixed: this plan asserts an empty `git status --porcelain apps packages tests`, so editing it would have reddened the gate it was running.

## Self-Check: PASSED

- **Key files on disk:** all 7 checked paths FOUND (the evidence document, deferred-items, WINDOWS, and the three run directories' `results.json` plus the visual run's `provenance.txt`).
- **Commits:** all 7 hashes FOUND in `git log --oneline --all`.
- **Task acceptance criteria re-run at close:** Task 1 → exit 0; Task 2 → exit 0; Task 3 → exit 0.
- **Plan-level verification:** every static gate green at one head with counts recorded; full suite exit 0 with zero in all four non-passed counts; accessibility scan exit 0 with a non-zero executed count; visual project run in the pinned container with provenance recorded and no difference to dispose of.
- **Tree:** `git status --porcelain` empty; `git diff --name-only 1718a2d30 HEAD` lists only `.planning/` paths, so the tree the gates measured is the tree that stands.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Ready for 165-08** (the requirement registration and findings-skill documentation plan). Nothing this plan produced blocks it.

Three things 165-08 and the verifier should carry forward rather than read past:

1. **The visual judgement is nominally a `<human-check>` and it has no subject.** No baseline differed, so there is nothing to approve or investigate. The thing worth the operator's attention instead is **D-165-07-01** — the gate's blind spot on the drawer host.
2. **§ 16's not-discharged list survives the green run intact.** The ~235-256 ms pointer interception on `<html>` (WINDOWS 278) is still live; the `title()` throw still escapes the host boundary (WINDOWS 279); the view-transition **skip path has still never been taken** by any run in this phase; and **criterion 4 has no negative control**. A nine-row green gate does not retire any of these, and § 18f restates all four so a reader arriving at the verdict cannot miss them.
3. **The format gate's history is now on the record.** WINDOWS 281 (recorded, fixed) notes that the v2.15 branch carried unformatted files across multiple phases before this gate surfaced them. Whatever runs the next repo-wide gate should not be surprised to find the same class again.

---
*Phase: 165-results-navigation-redraw*
*Completed: 2026-09-23*
