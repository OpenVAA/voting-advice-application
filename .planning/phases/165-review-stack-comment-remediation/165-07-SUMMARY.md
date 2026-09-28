---
phase: 165-review-stack-comment-remediation
plan: 07
subsystem: tooling
tags: [comment-hygiene, project-scoping-guard, code-identity, gate-spec]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs, ledger-check.sh)
provides:
  - Hygiene-clean comments throughout scripts/assert-project-scoped-queries.mjs, ready for the behaviour edits in 165-11 and 165-26
  - A hygiene read record for the guard's final blob
affects: [165-11, 165-26, 165-24, 165-36]

actuals:
  tokens: 28700
  tasks: 3
  commits: 5
plan_head_before: c45105f6169cca5b6a80f971c605a7a9949d7eb6
plan_head_after: f8760e3e71bfde2eb3ebf218c11a24d87045c697

tech-stack:
  added: []
  patterns:
    - "Large comment rewrites are applied as anchored block swaps (exact first and last line, first line unique), then proven with code-identity.mjs, so no code line can be touched by accident"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-07.tsv
  modified:
    - scripts/assert-project-scoped-queries.mjs
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md

key-decisions:
  - "The one planning reference in a code string (CR-05 in the owner-count self-test failure message) was rewritten in its own fix commit, not allowlisted: hygiene-allow/README.md says a planning reference is rewritten, never excepted. code-identity --report shows that literal as the only code difference from the phase base"
  - "The gate spec was left unchanged: every pinned residual phrase and the eleven-bullet STATED RESIDUALS shape were kept, so no pin needed updating and the 2,349-line spec stayed out of this plan's hygiene scope"
  - "The pre-existing prettier drift on the user_can disposition line was logged to deferred-items.md for 165-26 (which edits that map) rather than reformatted here, because the plan was restricted to comments"

patterns-established:
  - "When a gate spec reads a script's docblock as text, rewrite around the pinned phrases and bullet shapes, and re-run the spec after each block"

requirements-completed: [165-SC3]

coverage:
  - id: D1
    description: "The guard's comments pass the per-file hygiene gate and have a read record for the final blob"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --check-reads --files scripts/assert-project-scoped-queries.mjs (exit 0, VERDICT: CLEAN, 0 items)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No code changed except the one message literal; the guard's behaviour is unchanged"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "code-identity.mjs ship/v2.15-12-planning WORKTREE scripts/assert-project-scoped-queries.mjs exit 0 at each of the three comment commits; --report after d4c9f9449 shows only the message literal"
        status: pass
      - kind: other
        ref: "node scripts/assert-project-scoped-queries.mjs (exit 0, summary byte-identical to baseline) and --self-test (exit 0, output byte-identical)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The gate spec that reads the guard as text still passes with the baseline count"
    requirement: "165-SC3"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit projectScopingGate (121 passed, same as baseline)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rewritten comments are accurate, concise and free of historical narrative"
    human_judgment: true
    rationale: "Prose quality and technical accuracy of the rewritten comments are a reader's judgement; the gates only prove the absence of pattern-level residue"

duration: 13min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 07: Project-Scoped Query Guard Comment Hygiene Summary

**The project-scoped query guard's comments go from 996 lines to 718, with the review ids, the history of how each gap was found and the out-of-date fixture counts removed. The code is proven unchanged except for one failure-message literal, and the guard's summary, its self-test and the 121-test gate spec are unchanged.**

## Performance

- **Duration:** about 13 min
- **Started:** 2026-09-27T18:32:20Z
- **Completed:** 2026-09-27T18:45:32Z
- **Tasks:** 3 of 3
- **Files changed:** 3 (the guard, the read record, deferred-items.md)

## Baseline and final numbers

All statuses were read directly, never through a pipe.

| Measure | Phase base / plan start | Final |
|---|---|---|
| `node scripts/assert-project-scoped-queries.mjs` | exit 0 | exit 0, summary byte-identical (`diff` of captured output empty) |
| `node scripts/assert-project-scoped-queries.mjs --self-test` | exit 0 | exit 0, output byte-identical |
| `yarn workspace @openvaa/dev-seed test:unit projectScopingGate` | 121 passed (121) | 121 passed (121) |
| `hygiene-changed-files.sh --files` on the guard | exit 1, 14 items (7 strip, 7 narrative) | exit 0, 0 items, `--check-reads` exit 0 |
| Comment lines (`grep -cE '^\s*(//\|/\*\|\*)'`) | 996 | 718 |
| File size | 114,429 bytes | 87,050 bytes |
| `grep -c ' \* STATED RESIDUALS'` | 1 | 1 |

The guard's summary line, unchanged throughout:

```text
Project-scoped query guard — 13 guarded source(s), 0 deferred, 13 adapter source(s) on disk, 7 raw client call(s) examined, 2 Edge Function invocation(s), 9 client-touching site(s) in all, 555 source(s) outside the adapter directory walked, 1 outside site(s) examined, 0 violation(s); self-test flagged 41 line(s) in scripts/fixtures/project-scoped-queries/violation.fixture.ts (41 access(es)) and 0 in scripts/fixtures/project-scoped-queries/clean.fixture.ts (8 access(es)), plus 13 line(s) in scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts (13 site(s)) and 0 in scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts (2 site(s)), matching the committed expectation.
```

## Accomplishments

- **Module docblock (Task 1, tracer).** It now covers the inverted predicate, the reach of the two corpora, punctuator coverage, the stated residuals, the nine checks and the self-proof, without review history. The `STATED RESIDUALS` heading, all eleven ` *   - ` bullets with their ` *     ` continuations, and every phrase in the spec's `RESIDUAL_PHRASES` are kept. The deletion case's phrase is still on its bullet's first line, and that bullet still wraps.
- **Declaration and matcher comments (Task 2).** The disposition maps no longer carry the `162.1 D-06` and `162-REVIEW WR-03` citations or the `get_questions` history. The check 6 docblock is roughly half its old length and no longer states "EIGHT shapes", "five `.rpc(` sites" or the four measured lookahead readings. The owner-rule docblock no longer cites CR-01, CR-04 or CR-05, and its lookahead description was corrected: the old text said the `?` exclusion was two characters wide, but the pattern excludes a bare `?`, and the module docblock's residual list already says so. The schema-hop docblock lost its "second round" narrative and its "54 live occurrences" count.
- **Check, self-test and walker comments (Task 3).** The self-test comments cited counts the adjacent `expect` calls no longer assert ("thirty-two", "the five", "eleven" against 41, 6 and 13). These now say why each count is exact without restating the number. The two enumerator docblocks describe the current walk and the reason for each exclusion, without the story of how the `utils/` hole was found. The `ACCESS_RE` note said "the two member" punctuators; it now names the three the pattern reads (`.`, `?.`, `!.`).

## Task Commits

1. **Task 1: module docblock (tracer)** — `6f48b2795` (docs)
2. **Task 2: declaration and matcher comments** — `7a7afe0ee` (docs)
3. **Task 3: check, self-test and walker comments** — `1d93a9cf8` (docs)
4. **Task 3: the one code literal** — `d4c9f9449` (fix)
5. **Task 3: read record and deferred item** — `f8760e3e7` (chore)

Every commit carries the `Hygiene: D-04` trailer.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 / D-04 precedence] One non-comment character range changed: a review id in a string literal**
- **Found during:** Task 1 baseline (hygiene gate hit at the `'half of CR-05 this rule closes ...'` line inside `selfTest`)
- **Issue:** The plan's rewrite rules say "NEVER change a non-comment character", but D-04 requires every changed file to end clean. `hygiene-allow/README.md` rules out allowlisting a planning reference ("If the text is a planning reference or historical narrative, rewrite the text"). The planning reference sat in the failure message of the owner-count self-test expectation.
- **Fix:** `'half of CR-05 this rule closes — ...'` became `'terminating non-null half this rule closes — ...'`. This was done in its own commit, after the three comment-only commits. Each of those commits had exited 0 on `code-identity.mjs`.
- **Verification:** `code-identity.mjs --report ship/v2.15-12-planning WORKTREE scripts/assert-project-scoped-queries.mjs` exits 1 and shows exactly this `-`/`+` pair and no other difference. The message prints only when that expectation fails, so the guard summary, `--self-test` output and the spec's 121 passes were unchanged. The spec pins no part of this literal.
- **Consequence for later verification:** the plan's acceptance criterion "`code-identity.mjs ship/v2.15-12-planning WORKTREE scripts/assert-project-scoped-queries.mjs` exits 0" now reads exit 1 with that single literal. To check identity for the comment commits alone, compare `ship/v2.15-12-planning` against `1d93a9cf8` (exit 0).
- **Files modified:** scripts/assert-project-scoped-queries.mjs
- **Commit:** d4c9f9449

**2. [Rule 1 - accuracy] Two comments contradicted the code they describe**
- **Found during:** Tasks 2 and 3
- **Issue:** The owner-rule docblock said its lookahead tells `?.` from `??`, but `OWNER_BINDING_RE` excludes a bare `?`. The module docblock's residual bullet about `this ?? other` depends on that bare exclusion. Separately, the `ACCESS_RE` note said "the two member" punctuators, but the pattern admits three.
- **Fix:** Both comments now describe the pattern as written. These are comment-only changes (identity exit 0).
- **Commits:** 7a7afe0ee, 1d93a9cf8

**3. [Plan anchor] Task 2 / Task 3 boundary taken by content, not by the named anchor**
- **Issue:** Task 2 was to stop "before the enumerator functions (`function enumerateAdapterSources`)", and Task 3 was to cover "the check runner, `selfTest`, `main`". In the file, however, the check functions and `selfTest` sit between the matchers and `enumerateAdapterSources`, so following both anchors literally would put the check runner in Task 2.
- **Fix:** Task 2 ran through the `BOUNDARY_ACCESS_RE` declaration (every declaration and matcher). Task 3 ran from `collectAccesses` to the end (the checks, the self-test, the enumerators and `main`). This matches each task's stated subject.

**Total deviations:** 3 (1 D-04-driven literal change, 1 accuracy fix across two comments, 1 anchor interpretation). **Impact:** the guard's behaviour is unchanged. The only code difference from the phase base is one failure-message string.

## Issues Encountered

- **The guard fails `prettier --check` at the phase base.** Prettier wants the `user_can:` disposition string of `PROJECT_SCOPED_RPCS` on its own line, and the base blob fails the same way. This plan did not reformat code. The finding was logged to `deferred-items.md` for 165-26, which edits that map, with the phase-wide `format:check` gate (165-24 / 165-36) as fallback. After this plan's changes, prettier's diff on the file is still only that one line.
- **The gate spec's text readers restrict comment wording inside function bodies.** The spec's `functionBodyOf` balances braces naively, and `readsConstant` treats `MATCHER_NAME.` anywhere in a body as a read. The rewritten comments inside `selfTest` and `main` therefore keep braces balanced and never spell a matcher name followed by a dot. The spec passing 121/121 after each block confirms this.

## Known Stubs

None.

## Next Phase Readiness

- 165-11 can register new adapter sources in `GUARDED_SOURCES`, and 165-26 can change the `upsert_answers` disposition, without first cleaning the comments. Each of those edits voids this plan's read record through the blob change, so each plan must record its own read.
- No ledger rows are owned by this plan (`review_comments_owned: []`). `ledger-check.sh` exits 0, and 165-05's seven rows were already filled.

## Self-Check: PASSED

- `scripts/assert-project-scoped-queries.mjs` and `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-07.tsv` exist on disk.
- Commits `6f48b2795`, `7a7afe0ee`, `1d93a9cf8`, `d4c9f9449` and `f8760e3e7` are in `git log`. `git rev-list --count c45105f61..HEAD` is 5 before this SUMMARY commit.
- Re-run at the end: the guard exits 0 with a byte-identical summary, `--self-test` exits 0, the spec passes 121/121, `hygiene-changed-files.sh --check-reads --files scripts/assert-project-scoped-queries.mjs` exits 0, and `grep -c ' \* STATED RESIDUALS'` is 1.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` edit and the untracked `.planning/milestone.lock`, and neither was staged.
