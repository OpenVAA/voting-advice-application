---
phase: 151-ship-v0-2-akita-review-stack
plan: 05
subsystem: infra
tags: [pr-stack, partition, pathspec, criterion-6, git-plumbing, shell-portability]

requires:
  - phase: 151-01
    provides: build-rename-commit.sh, build-slice.sh, verify-identity.sh, the catch-all tripwire discipline, and the two partition corrections (bare `docs` pathspec; slice 10 as the weakest boundary)
  - phase: 151-02
    provides: verify-commit-taxonomy.sh and the binding commit-subject constraint (planning has no conventional-commit type)
  - phase: 151-03
    provides: hygiene-grep-report.sh and the corrected greps
  - phase: 151-04
    provides: slice-overlap-matrix.sh, the re-measured slice anatomy, the enumerated residual buckets, and the hooks.server.ts / jest.config.json corrections
provides:
  - slices.tsv — the single machine-readable partition every later slice-cutting plan reads its pathspec from
  - 151-STACK-MANIFEST.md — the canonical human record, shaped so later plans fill in SHAs and PR numbers without changing it
  - a dry-run-proven, operator-approved twelve-slice partition (catch-all 0, off-diagonal 0, gap 0, trees identical)
  - the zsh/IFS consumption trap and a verified canonical reader for slices.tsv
  - two standing instructions — the dropped-finding class for 151-06, and the 4.4-proxy range for 151-17
affects: [151-06, 151-13, 151-14, 151-15, 151-16, 151-17, 151-18, ship-review-stack skill]

actuals:
  tokens: 5908
  tasks: 4
  commits: 3

tech-stack:
  added: []
  patterns:
    - "the partition lives in one TSV that scripts consume; no plan hard-codes a pathspec"
    - "residual paths are enumerated by name, never absorbed by an exclusion-shaped complement"
    - "gap and overlap are proven by two different measurements (catch-all + pairwise matrix), because either alone passes on a stack that is wrong"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/slices.tsv
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
  modified: []

key-decisions:
  - "Slice 07 absorbs the seven-file SvelteKit app shell, enumerated by name, so hooks.server.ts — Supabase session + locale resolution, the most auth-relevant frontend file — is reviewed with the request path instead of beside turbo.json and yarn.lock."
  - "CLAUDE.md rides slice 11, not slice 09: D-15 makes it agent-facing planning infrastructure, overriding 151-MEASUREMENTS' 'root *.md' grouping."
  - "The E2E fixture image moves to slice 04 because its only consumer is the dev-seed E2E template; slice 10 keeps README.md, the two dead codemods and tsbuildinfo under an explicit 'repo plumbing' framing."
  - "All non-planning documentation is one slice because criterion 4.2 requires exactly one docs: commit — the grouping is forced by the criterion, not chosen for taste."
  - "Criterion 4.4's disjoint-path proxy cannot hold across a D-11 rename base by construction; the gate's honest range is C1..TIP, with the whole-stack run recorded beside it."

patterns-established:
  - "Any bash/zsh consumer of slices.tsv must split the pathspec field explicitly (IFS=' ' read -r -a) and run under bash — zsh does not word-split, and in bash the read's IFS assignment persists into the loop body"
  - "A byte-identical file that only moves is invisible to every slice diff: the catch-all catches a dropped PATH, never a dropped FINDING, so such files must be dispositioned against the target tree"

requirements-completed: [criterion-4, criterion-6]

coverage:
  - id: D1
    description: "A slice definition file maps every slice to a pathspec, a branch and a commit message, and the full partition against it produces an empty catch-all"
    requirement: criterion-6
    verification:
      - kind: integration
        ref: "12 well-formed TSV lines (awk NF!=4 empty, 12 unique ship/v0.2-akita- branches); full stack built on throwaway refs, catch-all with pathspec '.' → files=0 / EMPTY"
        status: pass
    human_judgment: false
  - id: D2
    description: "The pairwise slice overlap matrix has every off-diagonal cell equal to 0"
    requirement: criterion-6
    verification:
      - kind: integration
        ref: "slice-overlap-matrix.sh --union over the 11 pathspec slices → 11x11 matrix, every off-diagonal 0, union 4255 == comparable total 4255, gap 0, DISJOINT, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The stack is between 8 and 12 PRs inclusive"
    requirement: criterion-6
    verification:
      - kind: automated_ui
        ref: "grep -c . slices.tsv → 12; slice_count: 12 in the manifest frontmatter"
        status: pass
    human_judgment: false
  - id: D4
    description: "The partition reproduces the merge target byte for byte"
    requirement: criterion-7
    verification:
      - kind: integration
        ref: "verify-identity.sh aa9e899c1 6fce3391f → exit 0, changed files 0, both trees e424d633e"
        status: pass
    human_judgment: false
  - id: D5
    description: "The number of files touched by both the pre-v2.4 prefix and the post-v2.4 tail is stated in the manifest and was shown to the operator before the partition was accepted"
    requirement: criterion-6
    verification:
      - kind: manual
        ref: "segment_overlap_files: 459 in frontmatter, 459 in body prose and in the checkpoint text; operator replied 'approved' having been shown it"
        status: pass
    human_judgment: true
  - id: D6
    description: "Each slice title describes every file in it without needing an 'and also'"
    requirement: criterion-6
    verification:
      - kind: manual
        ref: "checkpoint:human-verify Task 4 — operator read the 12-row table and approved with nothing re-opened; slice 10 noted as the challengeable row, approved as-is with the obligation moved to its PR body"
        status: pass
    human_judgment: true
  - id: D7
    description: "The slice commit subjects satisfy criterion 4's taxonomy"
    requirement: criterion-4
    verification:
      - kind: integration
        ref: "verify-commit-taxonomy.sh over C1..TIP → CONFORMING, exit 0 (planning 1, docs 1, test 1, style 0, [db] gaps 0, unplaced 0, shared paths 0)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Nothing real was mutated — no branch, no remote, no worktree, no PR"
    requirement: criterion-7
    verification:
      - kind: integration
        ref: "git branch --list 'ship/*' empty; git ls-remote --heads origin 'ship/*' empty; git status --porcelain empty; git for-each-ref --contains on C1, TIP and TARGET → no refs"
        status: pass
    human_judgment: false

duration: 45min (across a 7h51m checkpoint pause)
completed: 2026-08-17
status: complete
---

# Phase 151 Plan 05: Slice Partition Summary

**The v0.2 review stack is now a proven, operator-approved partition rather than a candidate table: twelve slices in `slices.tsv` build the merge target with a catch-all of exactly 0 files, every off-diagonal overlap cell at 0, a union gap of 0, and an identical tree hash — and the one tradeoff the split forces was put in front of the operator with its number attached before anything was built on it.**

## Performance

- **Duration:** ~45 min of execution, split by a 7h51m checkpoint pause (00:23–00:37 and 08:22–08:30 +03:00)
- **Tasks:** 4 of 4
- **Files created:** 2

## Accomplishments

- **Criterion 6 is decided and provable before any branch is cut.** The partition is proven in both directions by two independent measurements, because either one alone passes on a stack that is wrong: the catch-all (`files=0`) closes the *gap* direction, the pairwise matrix (all off-diagonal `0`, union 4255 = total 4255) closes the *overlap* direction. `verify-identity.sh` then confirms the union reconstructs the target's tree `e424d633e` exactly.
- **The commit subjects were proven against criterion 4 here rather than deferred.** `verify-commit-taxonomy.sh` over `C1..TIP` reports **CONFORMING**: planning 1, docs 1, test 1, style 0, `[db]` gaps 0, unplaced 0. The binding constraint 151-02 discovered — that `planning` has no conventional-commit type — is honoured by slice 11's `docs[planning]:` subject.
- **All four wave-0 partition corrections were resolved, not inherited.** Slice 09 carries the bare `docs` pathspec; slice 10's boundary was decided deliberately and shrunk to 37 files under an explicit framing; `hooks.server.ts` was pulled out of the config PR into slice 07 with the rest of the app shell; and the `jest.config.json` case was confirmed and generalised into a standing instruction.
- **The stack is 12 PRs — the top of D-10's 8–12 band**, which is what the 01a/01b split costs and what the frontend three-way sub-split buys.
- **Nothing real was touched.** No branch, no ref, no remote, no worktree file. All four OIDs are unreferenced throwaway objects, confirmed by `git for-each-ref --contains`.

## Task Commits

1. **Task 1: Author `slices.tsv`** — `faf55161b` (feat)
2. **Task 2: Dry-run the partition until the catch-all is empty** — *no file delta; the catch-all was empty on the first correct run, so `slices.tsv` needed no amendment. Evidence recorded in Task 3's commit* (see Deviations)
3. **Task 3: Write `151-STACK-MANIFEST.md`** — `f5150498f` (docs)
4. **Task 4: Operator review of the split** — `15c19db99` (docs) — approved 2026-08-17

## Files Created/Modified

- `.planning/phases/151-ship-v0-2-akita-review-stack/slices.tsv` — 12 tab-separated lines, columns `slice_id`, `branch`, `subject`, `pathspec`. The single machine-readable source every later slice-cutting plan reads column 4 from. Slice 01a carries the sentinel `RENAME-COMMIT` because it is built by `build-rename-commit.sh`, not by `build-slice.sh`.
- `.planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md` — YAML frontmatter carrying the structured verdict (`slice_count: 12`, `catchall_files: 0`, `max_offdiagonal_overlap: 0`, `segment_overlap_files: 459`, base/target refs and SHAs, `operator_approved: true`), then the 12-row slice table with per-slice file and line counts, render-budget flags, and `pending` commit-SHA and PR-number columns whose *shape* will not change as later plans fill them.

## The partition

| slice | files | render flag |
|---|---:|---|
| 01a layout-move | 1316 | files > 300 — renames, **0 lines** |
| 01b strapi-removal | 252 | lines > 20k (deletions only) |
| 02 shared-packages | 97 | ok |
| 03 supabase `[db]` | 118 | ok |
| 04 dev-seed | 162 | ok (19,560 lines) |
| 05 e2e-tests | 195 | lines > 20k |
| 06 frontend-lib | 526 | files > 300 **and** lines > 20k |
| 07 frontend-routes + shell | 213 | ok |
| 08 i18n-messages | 329 | files > 300 |
| 09 docs | 39 | ok |
| 10 root-config | 37 | lines > 20k (`yarn.lock`) |
| 11 planning | 2287 | files > 300 **and** lines > 20k — by design (D-12) |

## Decisions Made

**The 459-file tradeoff was chosen, not inherited.** 459 code files — 51.0% of the 901-file tail — are touched by both the pre-v2.4 prefix and the post-v2.4 tail. A literally chronological prefix PR would show the reviewer 459 files in a version a later PR rewrites, which is what criterion 4.4.1 forbids at the commit level. The adopted resolution path-partitions *within* the chronological framing: the chronological axis is carried by the **position** of slices 01a and 01b at the bottom of the stack — the layout move and the Strapi removal, a pure-rename set and a pure-deletion set — and every other file lands in the subsystem slice that owns its path, in its final state. **D-09 was not re-opened.** 459 is a property of the history; in the stack as defined, the number of files a reviewer sees in two different content versions is **zero**, proven by the all-zero off-diagonal.

**`hooks.server.ts` was pulled out of the config PR.** All seven `apps/frontend/src/` files outside `lib/`, `routes/` and `params/` are enumerated by name in slice 07. The SvelteKit server hook doing Supabase session handling and locale resolution is an OWASP-review surface under checklist item 2; it was scheduled to ship inside a PR whose other contents are `turbo.json` and `yarn.lock`. It now sits with the routes it wraps.

**Slice 10's boundary was decided rather than defaulted.** It is 37 files framed as *repo plumbing* — everything outside `src/` that decides how the monorepo and the frontend app build, lint, test, containerise, release and deploy. Two files were moved out rather than defended in it: the E2E fixture image to slice 04 (its only consumer is `packages/dev-seed/src/templates/e2e/base.ts`), and the `src/` shell to slice 07. Three contested files were kept with named reasons: `apps/frontend/README.md` on the standing rule that **a README is reviewed with the thing it documents** (which is also why `packages/*/README.md` ride in slice 02), and the two dead codemods plus `tsconfig.tsbuildinfo` as tooling, which is what findings F-03 and F-08 will dispose of.

**`CLAUDE.md` rides slice 11.** D-15 makes it agent-facing planning infrastructure that rides in the top-of-stack planning PR. `151-MEASUREMENTS.md` § 2.1 had classified it under area A09 as "root `*.md`"; the decision overrides the measurement's convenience grouping. Slice 09's root markdown is therefore `ROADMAP.md` alone.

**Non-planning documentation is one slice because criterion 4.2 requires exactly one `docs:` commit.** The docs site, `docs/key-generation.md` and the root `ROADMAP.md` are one PR by rule, not by taste — worth stating because it is the one grouping that would otherwise look arbitrary.

**Slice 10 was not written as a complement**, and neither was anything else. `cut -f4 slices.tsv | grep -c '^:(exclude)'` returns 0; the only exclusions in the file are slice 02's two, which carve out subtrees that are themselves slices. Slice 10 names all 31 of its pathspecs, so a forgotten path surfaces in the catch-all instead of being absorbed.

## Findings carried forward

**1. The dropped-*finding* class, generalised from `jest.config.json`.** The blob is identical at `origin/main:frontend/jest.config.json` and `TARGET:apps/frontend/jest.config.json` (`81f341fce`), so slice 01a moves it and **no later slice's diff contains it**. The catch-all tripwire catches a dropped **path**; it cannot catch a dropped **finding**. A reviewer of 01a sees a rename list, and a reviewer of every later slice never sees the file. The manifest carries a standing instruction for 151-06 with an enumerating command for the whole class, and notes that `jest.config.json` is itself a live finding — the repo tests with vitest.

**2. Criterion 4.4's proxy cannot hold across the rename base.** `verify-commit-taxonomy.sh` asserts 4.4 by *disjoint modified-path sets*. Over `origin/main..TIP` it reports 420 shared paths and exits 1; over `C1..TIP` it is CONFORMING with 0. Every shared path is a file slice 01a moved and a later slice edits (474 under the `--no-renames` set comparison, 100% under `apps/`). That is D-11's design stated in path terms — *paths change in 01a, contents change later* — not a partition defect. 151-17 must run the gate over `C1..TIP` and record the whole-stack run beside it with the explanation; suppressing the whole-stack run would hide a real number, and presenting it as a violation would misreport a designed property.

**3. The tool shell is zsh, which corrects a wave-0 carry-forward.** 151-02 established the host shell as bash 3.2.57 — true of the *scripts*, which carry a bash shebang. The shell an agent's inline commands run in is a different thing and it is **zsh**, where unquoted parameter expansions are not word-split.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two independent shell traps silently built every multi-pathspec slice empty**

- **Found during:** Task 2
- **Issue:** The first dry run reported `files=0` / `EMPTY:` for slices 01b, 02, 03, 04, 07, 09, 10 and 11 — every slice with more than one pathspec — while 05, 06 and 08 built correctly. The run *looked* healthy: `build-slice.sh` behaved exactly as specified, echoing its parent for an empty slice, and the loop marched on. Two independent causes, one symptom: (a) the tool shell is **zsh**, which does not word-split `$pathspec`, so the entire field was passed as ONE literal pathspec matching nothing; (b) after switching to bash, `IFS=$'\t' read` and `IFS= read` **both persist into the loop body**, reproducing the same collapse. Cause (b) was confirmed with an isolated probe (`set -- $two` → `argc=1`).
- **Fix:** The driver was rewritten as a bash script with an explicit array split (`IFS=' ' read -r -a SPECS <<< "$pathspec"`) and invoked with `bash`, never inherited from the tool shell. No phase script was changed — `build-slice.sh` was correct throughout; the defect was entirely in the consumer.
- **Files modified:** none in-tree (the driver is a dry-run artifact); the verified canonical reader is recorded verbatim in `151-STACK-MANIFEST.md` so no later plan repeats it, together with a standing sum-check (`Σ files= must equal 4255`).
- **Verification:** the corrected run produced the full 12-slice table and a catch-all of `files=0`.
- **Committed in:** `f5150498f` (the manifest section that records it)

**This is the catch-all tripwire's first live save in this phase.** Both broken runs reported `files=3205` from the catch-all — loud, immediate, and impossible to mistake for success. Without it, the run would have produced eleven plausible-looking commits, three of them real, and a byte-identical tree.

### Documented interpretations (not code changes)

**2. Task 1's `<verify>` one-liner is broken on macOS and was run in its corrected form**

The plan's automated verify ends `awk -F'\t' 'NF!=4' slices.tsv | wc -l | grep -qx '0'`. BSD `wc -l` pads its output with leading spaces, so `grep -qx '0'` never matches and the check fails on a correct file. Confirmed: the literal form exits 1, the corrected form (`test "$(… | wc -l | tr -d ' ')" = "0"`) exits 0. The corrected form was applied; the artifact satisfies the criterion the one-liner was written to express.

**3. Task 2's `<verify>` invocation does not match the script's interface**

The plan's automated verify is `slice-overlap-matrix.sh slices.tsv` — one argument. The script requires three (`<slice-def-file> <PARENT> <TARGET>`) and expects a *different file shape* (`<id><TAB><pathspec>…`, no `branch`/`subject` columns), so as written it would exit 2 on usage. The executed equivalent derives the def file from `slices.tsv` with a one-line `awk`, excludes slice 01a (the stack's *base*, not a pathspec slice, marked with the `RENAME-COMMIT` sentinel), and passes `C1` and `TARGET`. Both the derivation and the invocation are recorded verbatim in the manifest so the check is reproducible by anyone.

**4. Task 2 produced no file delta, so it has no standalone commit**

Task 2 amends `slices.tsv` only when the catch-all is non-empty. After the Rule 3 fix above, the catch-all was empty on the first correct run and the partition needed no amendment, so there was nothing to commit. Its evidence — catch-all, overlap matrix, union, identity and taxonomy output — is recorded in `151-STACK-MANIFEST.md` § "The dry run — evidence, not claim" and lands in `f5150498f`. Same shape as 151-01's Task 2.

---

**Total deviations:** 1 auto-fixed (Rule 3), 3 documented interpretations.
**Impact on plan:** None on scope. No architectural change, no package installed, no decision re-opened.

## Self-Check: PASSED

- `FOUND: .planning/phases/151-ship-v0-2-akita-review-stack/slices.tsv`
- `FOUND: .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md`
- `FOUND: faf55161b` · `FOUND: f5150498f` · `FOUND: 15c19db99`
