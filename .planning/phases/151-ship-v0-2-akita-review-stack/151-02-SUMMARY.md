---
phase: 151-ship-v0-2-akita-review-stack
plan: 02
subsystem: infra
tags: [shell, bash-3.2, git-plumbing, pcre, git-grep, verification-gates, criterion-3, criterion-4, criterion-6]

requires:
  - phase: 151-01
    provides: the phase-local scripts/ directory, the house shell style, and the merge-tree/python3.9 host findings
provides:
  - verify-commit-taxonomy.sh — criterion 4.1–4.6 as an exit code, with 4.4 asserted by a named structural proxy
  - hygiene-grep-report.sh — criterion 3 as a nine-row before/after occurrence table plus an --assert-clean gate
  - slice-overlap-matrix.sh — criterion 6 as an N×N overlap matrix with a hard zero-off-diagonal gate and a --union gap check
  - a measured, disjoint hygiene pattern set (1,866 comparable occurrences / 366 union files)
  - the 4.1-vs-4.2 subject-prefix constraint that binds the planning slice's commit message
affects: [151-03, 151-05, 151-07, 151-08, 151-17, 151-18, 151-DISPOSITION.md, D-14, D-16]

actuals:
  tokens: 8940
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "scope-as-argument: the security-relevant pathspec is written at every call site and forwarded verbatim, never hidden behind a reassignable variable"
    - "two-stage report scripts: python3 owns NUL-safe parsing and emits TSV; bash owns the printf table, the counter and the exit code"
    - "self-test flag that runs its own negative + positive + union controls, so the gate's ability to fail is re-provable at any later plan"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/scripts/verify-commit-taxonomy.sh
    - .planning/phases/151-ship-v0-2-akita-review-stack/scripts/hygiene-grep-report.sh
    - .planning/phases/151-ship-v0-2-akita-review-stack/scripts/slice-overlap-matrix.sh
  modified: []

key-decisions:
  - "Criteria 4.1 and 4.2 are two different single-commit classes, so the planning slice may NOT be subjected as a bare `docs:`. Research's candidate message `docs: planning artifacts` would make 4.2 read as two commits and 4.1 as zero. The script recognises `planning:`, `docs[planning]:` and `docs(planning):` — this is now a hard constraint on 151-05/151-17."
  - "C-5 is corrected: 725 is the COMBINED decision-ID count, not the bare `D-NN` form. Measured 540 bare-only + 185 long = 725. `\\bD-\\d{2}\\b` matches the `D-13` prefix inside `D-137-11` because `-` is a word boundary, so the naive two-row split double-counts every long-form ID."
  - "Two totals, not one. The 1,984 research figure comes from a loop with no task-ID pattern, so the task-id row is printed as a labelled supplementary subtotal (535) outside the comparable 8-row total (1,866). Folding it in gives 2,401 and silently changes what 1,984 means."
  - "The --union total carries --no-renames too. The rename-detected total is 5,105 against a rename-suppressed union of 6,240 — comparing them would report a 1,135-file phantom gap on every run."
  - "Off-diagonal zero is the bar, not 'small'. For a path-partitioned stack any non-zero cell is a partition bug, not a criterion-6 quality judgement."

patterns-established:
  - "Pattern 5: the pathspec that scopes a security-relevant grep is passed as trailing arguments at each call site and forwarded with \"$@\", so scope is auditable per row and cannot be widened in one edit"
  - "Pattern 6: a verify script that asserts a proxy PRINTS THE PROXY'S NAME on every run, so no downstream record can overclaim what was measured"
  - "Pattern 7: gates ship with a --self-test (or documented control pair) that re-proves their ability to fail, because a gate that cannot fail is decoration"

requirements-completed: [criterion-3, criterion-4, criterion-6]

coverage:
  - id: D1
    description: "Criterion 4's six sub-clauses are encoded as a script that classifies every commit into exactly one class and fails loudly on the un-restructured branch"
    requirement: criterion-4
    verification:
      - kind: integration
        ref: "verify-commit-taxonomy.sh origin/main..feat-gsd-roadmap → exit 1; 2,564 commits classified; docs=1434, test=271, style=3 all over cardinality; 30 unplaced named; 11 [db] gaps named with sha + triggering path"
        status: pass
    human_judgment: false
  - id: D2
    description: "The taxonomy gate passes on a conforming range — it is not permanently red"
    requirement: criterion-4
    verification:
      - kind: integration
        ref: "synthetic 3-commit range (docs[planning]: / docs: / test:, disjoint paths) → exit 0, CONFORMING; adding an unmarked apps/supabase/migrations/*.sql commit → exit 1 naming b69a43258 and the path; re-subjecting it feat[db]: → exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Criterion 3 has a runnable occurrence table scoped to shipped source only, reproducing the corrected surface"
    requirement: criterion-3
    verification:
      - kind: integration
        ref: "hygiene-grep-report.sh → comparable total 1,866 (5.9% from research's 1,984); union files 366 (2.2% from 358); grep -c -- '-- apps/ packages/ tests/' = 12 ≥ 9 pattern rows"
        status: pass
    human_judgment: false
  - id: D4
    description: "The hygiene gate fails on the un-swept tree and passes on a clean one, and the collapsed survivor form is exempt rather than counted as a violation"
    requirement: criterion-3
    verification:
      - kind: integration
        ref: "--assert-clean on the current tree → exit 1, 8 gate rows failing; same flag in a scratch repo containing only `see phase 55` / `see spike 16` / `playwright:v1.58.2-noble` → exit 0 HYGIENE CLEAN with phase-ref occ=1 bare=0"
        status: pass
    human_judgment: false
  - id: D5
    description: "Criterion 6's overlap claim is measurable as an N×N matrix with a hard zero-off-diagonal gate, and the gap direction is covered too"
    requirement: criterion-6
    verification:
      - kind: integration
        ref: "slice-overlap-matrix.sh --self-test → exit 0 with all three controls PASS; negative (lib × lib/api) exit 1 naming both ids and 87 shared files; positive (dev-seed × tests) exit 0; union on a complete partition 161 + 6079 = 6240 == comparable total, gap 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "Nothing real was mutated — no branch, no remote, no PR, no source file"
    requirement: criterion-6
    verification:
      - kind: integration
        ref: "git branch --list 'ship/*' → 0; no push/gh invocation; git status --porcelain -- . ':(exclude).planning' empty; synthetic control commits created by commit-tree only, unreferenced"
        status: pass
    human_judgment: false

duration: 48min
completed: 2026-08-16
status: complete
---

# Phase 151 Plan 02: Wave-0 Verification and Report Tooling Summary

**Criteria 3, 4.1–4.6 and 6 stopped being prose and became three exit codes: a commit-taxonomy
gate that places all 2,564 commits and fails on 6 counts against the un-restructured branch, a
nine-row hygiene occurrence table that reproduces the corrected 366-file surface and fails its
own assert mode, and an overlap matrix whose built-in self-test proves it can fail before anyone
trusts it.**

## Performance

- **Duration:** 48 min
- **Started:** 2026-08-16T22:56:00+03:00
- **Completed:** 2026-08-16T23:44:00+03:00
- **Tasks:** 3 of 3
- **Files created:** 3 scripts (35,760 bytes)

## Accomplishments

- **Three ❌ Wave-0 rows in `151-VALIDATION.md` now have a runnable command each**, and every
  one of them was *demonstrated failing* before being accepted. A gate that has never failed is
  an assumption wearing a script's clothes.
- **`verify-commit-taxonomy.sh` places every commit or names it.** On the current branch it
  classifies 2,564 commits, reports `docs=1434 / test=271 / style=3` against their single-commit
  ceilings, names **30 unplaced commits** (`wip` 10, `spike` 9, `plan` 7, `todo` 3, `roadmap` 1 —
  C-9 predicted four extra classes; five type tokens beyond the recognised set were measured),
  names **11 commits touching database paths with no `[db]` marker** together with the triggering
  path, and reports **6,372 shared-path pairs** against criterion 4.4's structural proxy.
- **The hygiene surface was re-measured and one of research's own corrections was corrected.**
  The comparable eight-row total is **1,866 occurrences across 366 union files**, both inside 10%
  of research's 1,984 / 358 despite the branch having advanced. See Deviations for the C-5
  arithmetic.
- **The overlap matrix carries its own controls.** `--self-test` builds an overlapping pair, a
  disjoint pair and a complete partition against the live repo and asserts each behaves as
  specified; any later plan can re-prove the gate's honesty in under a second.
- **A new host constraint was measured and worked around**, the sibling of plan 01's Python 3.9
  finding: the host shell is **GNU bash 3.2.57** (macOS), which has **no associative arrays**.
  The matrix uses a flat `i*N+j` cell array. Any later plan writing `declare -A` will break here.

## Task Commits

1. **Task 1: `verify-commit-taxonomy.sh`** — `b9570dc6c` (feat)
2. **Task 2: `hygiene-grep-report.sh`** — `5816cac31` (feat)
3. **Task 3: `slice-overlap-matrix.sh`** — `e4cf979f9` (feat)

## Files Created/Modified

- `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/verify-commit-taxonomy.sh` — one
  `git log --format='%x01%H%x00%s' --name-only -z` pass supplies subjects and file lists; a
  Python 3.9-compatible parser emits TSV; bash owns the printf table, the counter and the exit
  code. `%x01` starts each record and `%x00` separates sha from subject, so neither a subject
  containing whitespace nor a path containing a space can shift a field.
- `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/hygiene-grep-report.sh` — nine
  disjoint pattern rows with `occ`/`files`/`bare` columns, `--assert-clean`, `--save-baseline`
  and an optional baseline file yielding `base`/`delta` columns. The `-- apps/ packages/ tests/`
  pathspec is written at all nine call sites and forwarded with `"$@"`.
- `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/slice-overlap-matrix.sh` — TAB-separated
  slice definitions → per-slice NUL-split, `LC_ALL=C`-sorted file sets → pairwise `comm -12`
  matrix, with `--union` for the gap direction and `--self-test` for the controls.

## Decisions Made

**The planning slice's commit subject is now constrained, and it was not before.** Criterion 4.1
(planning → one commit) and 4.2 (other docs → one commit) are two different single-commit classes,
but `planning` has no conventional-commit type. Research's candidate message for the planning slice
is `docs: planning artifacts` — which lands in the `docs` class, making 4.2 read as two commits and
4.1 as zero, so the gate would fail on a stack that actually satisfies the criterion. The script
recognises `planning:`, `docs[planning]:` and `docs(planning):` as class `planning`, and the header
says so in capitals. **Plans 151-05 and 151-17 must use one of those three forms.**

Amusingly, the un-restructured branch already reports `planning = 1` and passes 4.1 — there is
exactly one historical `docs(planning): add quick-260531-x5s PLAN.md + pending todos` commit
(`4a94f261c`). A coincidence, and a good illustration of why a gate is judged on the rows it
fails, not the ones it happens to pass.

**4.4 is asserted by proxy and the output says so on every run.** "Feature/fix commits touching
the same files or features are squashed such that the PR contains no fixes of itself" is not
decidable from subjects — whether commit B fixes commit A is semantic. The proxy is *disjoint
modified-path sets*: stronger than the criterion on a path-partitioned stack, weaker as a general
statement about intent. The proxy's name is printed unconditionally so no record built from this
output can quietly promote it to the full claim.

**`[db]` non-vacuity was checked, which the plan did not ask for.** A marker check that never
passes is indistinguishable from a broken one. The synthetic db commit was re-subjected
`feat[db]: supabase schema and types` and the script returned exit 0 — the gate discriminates.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Overlap detail line printed its fields in the wrong order**

- **Found during:** Task 1, reading the negative-control output.
- **Issue:** the parser emits `SHARED <path> <first-owner-sha> <later-sha>`, but the awk
  formatter printed `$2, $3, $4`, producing `".planning/ROADMAP.md and c83472e65 both modify
  ca10b9736"` — a path named as a commit and a commit named as a path.
- **Fix:** print `$3, $4, $2`, with a comment at the awk line recording the emitted field order.
- **Files modified:** `verify-commit-taxonomy.sh` (fixed before the task's commit).
- **Verification:** re-ran the negative control; rows now read `<sha> and <sha> both modify <path>`.
- **Committed in:** `b9570dc6c`

**2. [Rule 2 - Missing critical functionality] The baseline column had no producer**

- **Found during:** Task 2.
- **Issue:** the plan specifies *consuming* a baseline file as `$1` so 151-03's pre-codemod run
  and 151-08's post-codemod run form one before/after record, but names no way to *create* one.
  Without a producer the feature is dead code and the key link in this plan's `must_haves` —
  "the two runs are the before/after record for criterion 3" — cannot be honoured.
- **Fix:** added `--save-baseline <path>`, writing the machine-readable `id / occ / files` TSV the
  `$1` consumer reads. Verified round-trip: saved a baseline, re-ran with it, `delta` column all 0.
- **Files modified:** `hygiene-grep-report.sh`
- **Committed in:** `5816cac31`

**3. [Rule 1 - Measurement error in an inherited correction] C-5 mis-attributes the 725**

- **Found during:** Task 2, while checking that the pattern rows do not double-count.
- **Issue:** C-5 states the bare `D-NN` form is "725 occurrences across 183 files". Measured:
  `\bD-\d{2,3}(-\d{2})?\b` (research's own combined pattern) = **725**; the long form alone =
  **185**; the bare form with the long form excluded = **540**. 540 + 185 = 725. The bare pattern
  also matches the `D-13` prefix *inside* `D-137-11`, because `-` is a word boundary — so a naive
  two-row split double-counts every long-form ID and inflates the total by 185.
- **Fix:** the bare row carries `(?!-\d{2})`, making all rows disjoint and the printed total a
  true occurrence count. The arithmetic is recorded in the script header so the next reader does
  not re-derive it.
- **Files modified:** `hygiene-grep-report.sh`
- **Committed in:** `5816cac31`

### Documented interpretations (not code changes)

**4. The 1,984 acceptance number and the task-ID row instruction are mutually inconsistent**

Task 2 asks for a `SWEEP-03`-shaped task-ID row *and* for the total across all rows to be within
10% of 1,984. Research's proof loop has **no task-ID pattern**, so 1,984 was measured without that
class; the class is worth 535 occurrences here, and folding it in gives **2,401 — 21% over**.
Rather than drop the row (losing a real class) or silently redefine 1,984 (corrupting the
before/after comparison), the report prints **two totals**: the eight-row *planning-reference
total* (**1,866**, 5.9% from 1,984, the comparable number) and the *task-id supplementary*
subtotal (**535**), each labelled with why it is separate. Union files — 366 vs 358, 2.2% — needs
no such treatment and is reported once.

**5. `--union` compares like-for-like, which the criterion's literal wording would not**

Task 3's criterion says the union count must equal "the plain `git diff --name-only` count".
Measured on `origin/main..HEAD`: plain (rename-detected) = **5,105**; `--no-renames` = **6,240**.
The slices are computed with `--no-renames` per the plan's own command, so comparing against the
rename-detected total would report a **1,135-file phantom gap on every run**. The comparable total
carries the same flags and is the one asserted; the rename-detected total is printed beside it,
labelled informational. On the complete two-slice partition: 161 + 6,079 = 6,240 = total, gap 0.

**6. The self-test's negative-control assertion was tightened after first passing**

The first version asserted `grep -q 'lib'` on the negative control's output — satisfiable by
almost any output, making the control decorative. It now asserts the exact pair line
`[1] lib  x  [2] libapi` and an indented `apps/frontend/src/lib/api/` shared path. Caught by
reading the control rather than by the control failing, which is the point of reading it.

---

**Total deviations:** 3 auto-fixed (Rules 1, 1, 2), 3 documented interpretations.
**Impact on plan:** None on scope. No architectural change, no package installed, no plan task
skipped or added.

## Issues Encountered

**The host shell is bash 3.2.57, not 4.x.** macOS ships the last GPLv2 bash. No associative
arrays (`declare -A`), no `${var,,}`, no `mapfile`. The matrix therefore uses a flat `i*N+j`
indexed array. This is the shell-side sibling of plan 01's Python 3.9 finding and belongs in the
same carry-forward list: **any later plan writing `declare -A` will fail on this host.**

**`git grep` no-match exits 1, and `set -o pipefail` turns that into a fatal error.** Every count
in the hygiene report is wrapped as `{ git grep ... || true; } | wc -l`. Without it the script
dies the moment a pattern reaches zero — i.e. exactly when the codemod starts succeeding, which
would be a spectacular way for the post-codemod run to fail.

**PCRE lookbehind is available and load-bearing.** `(?i)(?<!see\s)\bphases?\s+\d+` is what
separates an authorised `see phase 55` survivor from an unauthorised bare reference. Confirmed
working in this git build; the collapsed-form baseline reproduces research's figure exactly
(4 occurrences in 3 files, and 704 − 4 = 700 bare).

## Safety Posture

| Constraint | Evidence |
|---|---|
| No push to any remote | no `git push` run; no `gh` invocation |
| No PR opened | none |
| No force-push / reset / branch deletion | none run; `git branch --list 'ship/*'` → 0 |
| No `git clean` / `git stash` | none run |
| No worktree created | none; sequential execution on `feat-gsd-roadmap` as briefed |
| Source tree untouched | `git status --porcelain -- . ':(exclude).planning'` empty |
| Controls left no refs | synthetic commits built with `commit-tree` only, unreferenced; the clean-tree control ran in a throwaway repo under the scratch directory |

## Known Stubs

None. All three scripts are complete and exercised end to end; no placeholder branches, no
unwired flags. `--save-baseline` and the baseline-column path were both round-tripped.

## What This Does NOT Prove

- **Not that the criteria are met.** All three gates are currently RED against the branch, which
  is correct — the sweep, codemod and restructure have not happened. `151-VALIDATION.md`'s three
  ❌ rows flip only when the gates run green in later plans, not because the gates now exist.
- **Not that 4.4's real claim holds.** Only its structural proxy is checked, and the output says
  so on every run.
- **Not that the slice partition is right.** The matrix measures whatever definition file it is
  handed; choosing the review boundaries is D-09/D-10's job in 151-05.
- **Nothing about the milestone-version class.** It is report-only by construction (Pitfall 6) and
  routes to the Stage-2 agent pass in 151-08.

## Self-Check: PASSED

Files verified present on disk:

- FOUND: `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/verify-commit-taxonomy.sh`
- FOUND: `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/hygiene-grep-report.sh`
- FOUND: `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/slice-overlap-matrix.sh`

Commits verified in `git log`:

- FOUND: `b9570dc6c` — feat(151-02): encode criterion 4.1-4.6 as verify-commit-taxonomy.sh
- FOUND: `5816cac31` — feat(151-02): add hygiene-grep-report.sh for criterion 3
- FOUND: `e4cf979f9` — feat(151-02): add slice-overlap-matrix.sh for criterion 6

Estimate calibration: the plan estimated 50,000 tokens (confidence `low`); the realized diff is
35,760 chars ≈ **8,940 estimateTokens** — a 5.6× overestimate, the same direction and rough
magnitude as plan 01's 7× miss. Two data points now say this phase's estimates price *deriving*
mechanisms that research has already derived. Recorded unrounded.
