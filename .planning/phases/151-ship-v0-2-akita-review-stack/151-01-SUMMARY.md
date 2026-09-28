---
phase: 151-ship-v0-2-akita-review-stack
plan: 01
subsystem: infra
tags: [git-plumbing, stack-construction, byte-identity, shell, python3, merge-ort, pathspec]

requires:
  - phase: 151-research
    provides: three verbatim script bodies already executed in-repo, the pitfall register, and the candidate slice table
provides:
  - build-rename-commit.sh — re-paths a base tree by rule into a pure-rename commit (1316 R / 0 A / 0 M)
  - build-slice.sh — index-level slice construction with the empty-slice contract and the three load-bearing safeties
  - verify-identity.sh — D-23's two independent byte-identity checks with a counter-derived exit code
  - 151-BYTE-IDENTITY-PROOF.md — the dry-run record, with a Section 2 stub for plan 151-18
  - a measured, exact 12-slice partition of the current branch (4240 files, catch-all empty)
affects: [151-06, 151-07, 151-18, ship-review-stack skill, D-09, D-10]

actuals:
  tokens: 7863
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "index-level git tree surgery beside the worktree (standalone GIT_INDEX_FILE, commit-tree plumbing, zero worktree reads/writes)"
    - "path map derived BY RULE rather than by similarity rename detection"
    - "catch-all-empty tripwire as a partition gate independent of the tree-hash check"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-rename-commit.sh
    - .planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-slice.sh
    - .planning/phases/151-ship-v0-2-akita-review-stack/scripts/verify-identity.sh
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-BYTE-IDENTITY-PROOF.md
  modified: []

key-decisions:
  - "Slice 09 needs a bare `docs` pathspec alongside `apps/docs` — the target reintroduces a top-level docs/key-generation.md that the docs/ → apps/docs/ rename rule does not cover. The catch-all tripwire is what would have caught it."
  - "The rename commit drops nothing by default (dropped=0, so 0 D); the 249 backend/** deletions move to slice 01b per Q4. Research's 1316 R + 249 D becomes 1316 R here plus 252 files in 01b."
  - "Overlap is proven by arithmetic, not asserted: per-slice counts sum to exactly 4240, the independently measured total. Gap is proven by the empty catch-all. Both directions are needed."
  - "merge-tree exits 1 on a directory-rename NOTIFICATION, not an unresolved conflict — C-4 confirmed live; merge-ort already placed the logo at apps/docs/ and no manual resolution was performed."

patterns-established:
  - "Pattern 1: build scripts print their machine-readable result (a commit OID) on stdout and ALL diagnostics on stderr, so callers can chain with PARENT=$(build-slice.sh ...) in a loop"
  - "Pattern 2: an empty slice echoes its PARENT unchanged and exits 0 — the loop body needs no conditional"
  - "Pattern 3: every script cd's to `git rev-parse --show-toplevel` first, because git pathspecs are cwd-relative and the slice table must be written once"
  - "Pattern 4: the literal `run: <value>` string stays confined to frontmatter so grep-count assertions over the record stay meaningful"

requirements-completed: [criterion-6, criterion-7]

coverage:
  - id: D1
    description: "Three stack-construction scripts exist, are syntactically valid, and carry the repo's shell house style (shebang, Usage: header, exit-code table, set -euo pipefail)"
    requirement: criterion-6
    verification:
      - kind: automated_ui
        ref: "bash -n on all three scripts → exit 0; head -1 → #!/usr/bin/env bash; grep -c '^# *Usage:' → 1 each"
        status: pass
    human_judgment: false
  - id: D2
    description: "The stack-construction mechanism reconstructs the materialised merge target byte for byte, against the repository as it stands today"
    requirement: criterion-7
    verification:
      - kind: integration
        ref: "scripts/verify-identity.sh 989e3ebe2 b5ea64d81 → exit 0, changed files 0, both trees 638cbe1aa"
        status: pass
    human_judgment: false
  - id: D3
    description: "The slice partition is gap-free and overlap-free"
    requirement: criterion-7
    verification:
      - kind: integration
        ref: "catch-all build-slice.sh with pathspec '.' → files=0 / EMPTY; per-slice counts sum to 4240 == independently measured total"
        status: pass
    human_judgment: false
  - id: D4
    description: "The reconstructed rename commit renders as renames only, at the most hostile rename limit"
    requirement: criterion-7
    verification:
      - kind: integration
        ref: "git -c diff.renameLimit=1 show -M --name-status --format= 6f0c208a6 | cut -c1 | sort | uniq -c → single row '1316 R'"
        status: pass
    human_judgment: false
  - id: D5
    description: "The identity gate can fail — negative control per the standing v2.15 acceptance rule"
    requirement: criterion-7
    verification:
      - kind: integration
        ref: "verify-identity.sh b5ea64d81 feat-gsd-roadmap → exit 1, 5 changed files, unequal trees, first differing path named; matching pair → exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "Nothing real was mutated — no branch, no remote, no worktree, no PR"
    requirement: criterion-7
    verification:
      - kind: integration
        ref: "git branch --list 'ship/*' empty; git ls-remote --heads origin 'ship/*' empty; HEAD stayed on feat-gsd-roadmap at ca10b9736 through the pipeline; git status --porcelain -- . ':(exclude).planning' empty; git for-each-ref --contains on all three throwaway OIDs → 0"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-08-16
status: complete
---

# Phase 151 Plan 01: Byte-Identity Tracer Summary

**The v0.2 review-stack mechanism was lifted into three executable scripts and run end to end on throwaway refs: 12 slices rebuild the merge target to an identical tree hash (`638cbe1aa`) with an empty catch-all, and the identity gate was proven able to fail.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-08-16T23:02:00+03:00
- **Completed:** 2026-08-16T23:30:00+03:00
- **Tasks:** 3 of 3
- **Files created:** 4 (3 scripts, 1 record)

## Accomplishments

- **Criterion 7 is now a structural property, not a promise.** The pipeline — merge-target
  materialisation, rename commit, 11 slices, catch-all — ran once against the repository *as it
  stands today* and produced a stack tip whose tree is bit-for-bit the merge target's.
- **The partition is exact in both directions.** Per-slice counts sum to **4240**, which equals the
  independently measured total file count; the catch-all reported `files=0`. Gap-free *and*
  overlap-free, each proven by a different measurement.
- **The repo moved exactly as C-11 predicted, and the phase absorbed it.** Research measured 3969
  reconstructed files; today it is **4240** (+271), because Phases 141–150 advanced
  `feat-gsd-roadmap` after the research session. Nothing was hard-coded, so nothing broke — which
  is the entire argument for running the tracer on day one.
- **C-12 checked and clear.** `origin/main` re-resolved to `ac30f132a`, unchanged from research
  time, so the 2-file / 11-line D-22 delta stands and plan 151-06's re-measurement trigger does not
  fire.
- **C-4 confirmed live.** `merge-tree` exits 1, but on a directory-rename *notification*:
  `merge-ort` had already placed `youthvotes-logo.png` at `apps/docs/static/images/`, exactly where
  the operator prescribed. No manual resolution was performed.

## Task Commits

1. **Task 1: End-to-end stack pipeline on throwaway refs (tracer)** — `698ffc98d` (feat)
2. **Task 2: Negative control on verify-identity.sh** — *no file delta; evidence recorded in Task 3's commit* (see Deviations)
3. **Task 3: Record the dry-run proof and tear down** — `bb9b57941` (docs)

## Files Created/Modified

- `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-rename-commit.sh` — re-paths a
  base tree by rule (`frontend/**` → `apps/frontend/**`, `docs/**` → `apps/docs/**`, everything
  else verbatim) into a pure-rename commit. Optional repeatable `--drop-prefix`, defaulting to no
  drop. Honours an exported `GIT_INDEX_FILE` so `build-slice.sh` can chain onto the same index.
- `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-slice.sh` — syncs the index under
  one or more pathspecs from `PARENT` to `TARGET`, then `write-tree` + `commit-tree`. Echoes
  `PARENT` unchanged and prints `EMPTY:` when the slice changes nothing.
- `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/verify-identity.sh` — D-23's two
  independent checks, a summary banner, remediation prose naming the first differing path, and an
  exit code derived from a failure counter.
- `.planning/phases/151-ship-v0-2-akita-review-stack/151-BYTE-IDENTITY-PROOF.md` — YAML frontmatter
  verdict plus every command and its verbatim output, with a Section 2 stub for plan 151-18's
  `final` pass.

## Decisions Made

**The candidate slice table, made concrete.** Research's § Slice Anatomy is a table of *areas*, not
pathspecs. The mechanism needs literal pathspecs, so they were derived by measuring the actual
`C1 → merge-target` diff grouped by top-level path, then written as an explicit, disjoint table
(recorded in full in the proof record). Two findings worth carrying into D-09/D-10:

- **Slice 09 needs a bare `docs` pathspec.** The target reintroduces a top-level
  `docs/key-generation.md` (status `A`) that the `docs/ → apps/docs/` rename rule does not cover.
  Without it, that one file lands in the catch-all — a concrete instance of the tripwire earning
  its keep before any real slice exists.
- **Slice 10 is the weakest boundary.** It currently mixes root tooling with the ~25-file
  `apps/frontend` shell remainder (`vite.config.ts`, `svelte.config.js`, `static/`, `scripts/`,
  `src/app.html`…). Defensible as a *build* boundary, unexamined as a *review* boundary. Flagged
  for D-09/D-10 rather than silently kept.

**Slice 10 was deliberately NOT written as a complement.** Expressing it as "everything not owned by
01b–09" would make the catch-all trivially empty and destroy the tripwire's meaning — the catch-all
would then only prove that a complement covers the remainder, which is a tautology. It is an
explicit enumeration instead, so a forgotten path surfaces in the catch-all rather than being
absorbed silently.

**Overlap is proven by arithmetic.** The empty catch-all only proves *gap*-freedom; two slices
claiming the same path would still yield a matching tree (the later application wins). Summing the
per-slice counts and comparing to the independently measured total closes that hole. Both numbers
are 4240.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The proof record failed its own grep-count acceptance criterion**

- **Found during:** Task 3
- **Issue:** The criterion is `grep -c 'run: dry-run-tracer' … returns 1`. The first draft returned
  **3** — the literal appeared in frontmatter *and* twice in prose (a bullet explaining the two-pass
  structure, and the Section 1 heading).
- **Fix:** Prose now refers to the passes as `` `dry-run-tracer` `` / `` `final` `` without the
  `run: ` prefix, so the literal is confined to frontmatter where it is machine-readable. The same
  neutralisation was applied to `run: final` in Section 2 (count now 0), and a note was left for
  plan 151-18 warning it not to reintroduce the trap — 151-18 will want its own count-1 assertion.
- **Files modified:** `151-BYTE-IDENTITY-PROOF.md`
- **Verification:** `grep -c 'run: dry-run-tracer'` → `1`; `grep -c 'run: final'` → `0`; frontmatter
  still parses under `yaml.safe_load` with 27 keys.
- **Committed in:** `bb9b57941`

### Documented interpretations (not code changes)

**2. Task 1's `git status --porcelain` criterion, applied in its refined form**

Task 1 states the criterion as "`git status --porcelain` is empty". That is unsatisfiable by
construction: this plan's own deliverables live under `.planning/`, and `.planning/STATE.md` was
already modified by the orchestrator before execution began. Task 3 states the same criterion in
its precise form — `git status --porcelain -- . ':(exclude).planning'` — which is what the criterion
means (no *source* file touched). The refined form was applied to both tasks and **passes empty**.
The literal form's output is recorded verbatim in the proof record for transparency: the only two
entries are `.planning/STATE.md` (pre-existing) and this plan's own `scripts/` directory.

**3. Task 2 produced no file delta, so it has no standalone commit**

Task 2 is a verification run of the script Task 1 created; the script already handled both the
matching and mismatched paths correctly, so nothing needed changing. Rather than manufacture an
empty commit, its evidence — both exit codes and both stdout blocks, verbatim — is recorded in
`151-BYTE-IDENTITY-PROOF.md` § Step 5 and lands in `bb9b57941`. Task 2's own acceptance criterion
("Both exit codes are recorded verbatim in the Task 3 record") anticipates exactly this.

**4. Tracer feedback gate resolved via the autonomous path**

The tracer protocol's interactive branch would emit a `checkpoint:human-verify` after committing
Task 1. `workflow._auto_chain_active` and `workflow.auto_advance` are both unset/false, but the plan
frontmatter declares `autonomous: true` and project `mode` is `yolo`, so the autonomous path was
taken: the tracer's `<verify>` was re-run end to end and **passed** (exit 0, identical trees, empty
catch-all, clean rename taxonomy) before any expansion task. Had it failed, execution would have
halted rather than expanded. Flagged here because it is a judgment call, not a rule application.

---

**Total deviations:** 1 auto-fixed (Rule 3), 3 documented interpretations.
**Impact on plan:** None on scope. The Rule 3 fix was required to satisfy a stated acceptance
criterion. No scope creep, no architectural change, no package installed.

## Issues Encountered

**`merge-tree` exits 1 on success.** `git merge-tree --write-tree` returned status 1 with a
`CONFLICT (file location)` line. Under `set -e` this would abort a naive driver. It is *not* a
failure: `merge-ort`'s directory-rename detection had already resolved the placement, and
`git ls-tree` on the written tree confirms the logo sits at `apps/docs/static/images/` with no
`docs/static/images/` twin. C-4 predicted this. Any script in a later plan that wraps `merge-tree`
must tolerate exit 1 and inspect the tree, not the status.

**Python 3.9, not 3.10+.** The host has `Python 3.9.16`. The parsers avoid structural pattern
matching and any 3.10-only syntax; they use plain indexing on the split fields. Worth knowing before
a later plan writes `match` statements.

## Safety Posture

Every safety constraint in the execution brief held, and each was measured rather than assumed:

| Constraint | Evidence |
|---|---|
| No push to any remote | `git ls-remote --heads origin 'ship/*'` empty; no `git push` was run |
| No PR opened | no `gh` invocation |
| No force-push / reset / branch deletion | none run; `feat-gsd-roadmap` only ever advanced by this plan's own two commits |
| Throwaway refs cleaned up | scratch index deleted; `git for-each-ref --contains` returns 0 for all three throwaway OIDs — unreferenced and GC-eligible |
| No `git clean` / `git stash` | none run |
| Worktree untouched by the pipeline | HEAD stayed on `feat-gsd-roadmap` at `ca10b9736` throughout; porcelain outside `.planning` empty |

## Known Stubs

None. `151-BYTE-IDENTITY-PROOF.md` § Section 2 is an intentional, labelled placeholder for plan
151-18's `final` pass — it is a documented two-pass record structure required by the plan, not an
unwired stub, and the record states plainly in `does_not_prove` which claims remain open.

## What This Does NOT Prove

Recorded here as well as in the proof record, because it is the easiest thing for a later reader to
over-claim:

- **Not the final stack.** No sweep fix (D-04/06/07), no hygiene codemod (D-14/16), no disposition
  matrix. Every commit produced by this plan is throwaway and already unreferenced.
- **Not the right review boundaries.** The pathspec table is research's *candidate*, used because
  the mechanism needs some partition to exercise. D-09/D-10 choose the real one.
- **Nothing about CI, PR wiring, or the Copilot review path.** Entirely untouched by this plan.

## Self-Check: PASSED

Files verified present on disk:

- FOUND: `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-rename-commit.sh`
- FOUND: `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-slice.sh`
- FOUND: `.planning/phases/151-ship-v0-2-akita-review-stack/scripts/verify-identity.sh`
- FOUND: `.planning/phases/151-ship-v0-2-akita-review-stack/151-BYTE-IDENTITY-PROOF.md`

Commits verified in `git log`:

- FOUND: `698ffc98d` — feat(151-01): add stack-construction scripts and prove the pipeline end to end
- FOUND: `bb9b57941` — docs(151-01): record the dry-run byte-identity proof

Estimate calibration: the plan estimated 55,000 tokens (confidence `low`); actual realized diff is
31,450 chars ≈ **7,863 estimateTokens** — a 7× overestimate. The estimate priced deriving the
mechanism; the plan's own premise was that research had already derived it and this plan only lifts
and re-runs it. Recorded unrounded.
