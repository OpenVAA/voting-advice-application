---
phase: 165-review-stack-comment-remediation
plan: 02
subsystem: testing
tags: [review-ledger, tip-proofs, split-artifact, bash-3.2, pcre, git-pathspec]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments: assert-absent.sh, ledger-check.sh (its --final runs tip-proofs.sh), 165-LEDGER.md skeleton"
provides:
  - "tip-proofs.sh: 27 proof_C_<id> functions that re-derive each no-code disposition from the tree, a runner with per-proof subshells, -v / -l flags, and exit 0/1/2"
  - "165-LEDGER.md: 28 rows filled (25 split-artifact, 1 already-fixed, 1 wont-fix, 1 deferred) with Evidence, Commit and a one-line Draft reply"
  - ".planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md: the D-03 deferred follow-up with six requirements"
affects: [165-06, 165-08, 165-10, 165-11, 165-14, 165-16, 165-18, 165-19, 165-20, 165-21, 165-23, 165-25, 165-26, 165-27, 165-29, 165-30, 165-34, 165-35, 165-36]

actuals:
  tokens: 18818
  tasks: 3
  commits: 4
plan_head_before: 9473d0fc3058cd26b9352689e15dc0606cfabc89
plan_head_after: 50b484686dadce5dc1343d4d3ec123a6d8ea215e

tech-stack:
  added: []
  patterns:
    - "Proofs match code, not comments: a string-aware perl tokenizer strips // and /* */ comments while keeping string and template literals, so a /** inside a // comment or a glob literal cannot swallow code"
    - "Each proof runs as `set +e; ( set -e; proof ); st=$?`, so errexit is honoured inside the proof; helpers still return explicit statuses because errexit is suspended in any function called from an || list"
    - "Slice attribution by commit id (the twelve slice heads are pinned in the script), so the proofs survive the ship branches being deleted after merge"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/tip-proofs.sh
    - .planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md
  modified:
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "Test files are excluded with the directory-anchored `:(exclude)<dir>/*.test.ts`; the short form `:!*.test.ts` next to a positive pathspec makes `git ls-files` 2.50.1 list no file, which assert-absent.sh refuses as exit 2"
  - "Adapter call proofs search the whole Supabase adapter directory, not one file, and require every call of the RPC to pass p_project_id, because plan 165-11 moves helpers into sibling files"
  - "The wont-fix proof for C-4080520062 re-derives the D-07 premise: origin/main still holds the Strapi backend and no apps/supabase tree, seed.sql states no database has been published, and no non-test provider config keys on birthdate"

patterns-established:
  - "LATER PLAN: comment inside a proof names the later 165 plan that edits a file the proof reads, and the property that plan must preserve"
  - "Every draft reply names the slice that carries the other half, attributed with `git log -1 -S <token> -- <file>` against the pinned slice heads, not assumed"

requirements-completed: [165-SC1, 165-SC5, C-4080507248, C-4080507280, C-4080520022, C-4080520062, C-4080520123, C-4080520206, C-4080520279, C-4080520322, C-4080520354, C-4080520386, C-4080520413, C-4080520453, C-4080515718, C-4080508297, C-4080508343, C-4080508426, C-4080508462, C-4080508490, C-4080508533, C-4080514940, C-4080514990, C-4080515025, C-4080515081, C-4080515115, C-4105438045, C-4080520522, C-4080520561, C-4080502788]

coverage:
  - id: D1
    description: "tip-proofs.sh proves 27 no-code dispositions at the tip, each seen red once under a scratch perturbation"
    requirement: "165-SC5"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/tip-proofs.sh (exit 0, 27 lines, all PASS)"
        status: pass
      - kind: other
        ref: "grep -c '^proof_C_' .planning/phases/165-review-stack-comment-remediation/scripts/tip-proofs.sh (27)"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/routes/(voters)/(located)/layout.load.test.ts (run inside proof_C_4080515115, 4 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "28 ledger rows carry Evidence, Commit and a one-line Draft reply; ledger-check stays green"
    requirement: "165-SC1"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/ledger-check.sh (exit 0)"
        status: pass
      - kind: other
        ref: "grep -E '\\| 165-02 \\|' 165-LEDGER.md | grep -c '| pending |' (0 of 28 rows)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The deferred adapter-selection item is a pending todo with all six requirements, and no code was written for it"
    verification:
      - kind: other
        ref: "test -f .planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md && grep -q SUPABASE_COOKIE_PREFIX (pass); git diff --stat 9473d0fc3 HEAD -- apps packages tests (empty)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Draft replies answer what each reviewer said and are fit to post"
    verification: []
    human_judgment: true
    rationale: "Replies are outward-facing text on GitHub threads; the maintainer posts them or authorises posting (D-05, D-12), so their tone and sufficiency are a human call"

duration: 22min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 02: No-code Review Dispositions Summary

**A 27-function tip-proof runner that re-derives every split-artifact, already-fixed and wont-fix disposition from the tree. Each proof was seen red. 28 ledger rows are filled with evidence and slice-attributed draft replies, and the D-03 adapter-selection follow-up is recorded as a six-item pending todo.**

## Performance

- **Duration:** about 22 min
- **Started:** 2026-09-27T17:03:54Z
- **Completed:** 2026-09-27T17:25:45Z
- **Tasks:** 3 of 3
- **Files:** 2 created, 1 modified

## Accomplishments

- `scripts/tip-proofs.sh` has one `proof_C_<id>` per no-code row. Each proof checks a tip property: a call passes an argument, an import resolves to a tracked module, an alias is registered, a unit test passes. None checks the comment's wording (D-01). `ledger-check.sh --final` now runs it, and it passes there. That run still exits 1 for another reason: the 50 `fix` rows owned by later plans are still pending.
- 28 ledger rows are filled. Each reply names the slice that carries the other half. The slice was attributed with `git log -1 -S` against the pinned slice heads, not taken from the comment. For example, C-4080502788's root `PUBLIC_PROJECT_ID` arrives in #886, not #882.
- The D-03 todo lists the comment's five requirements plus the D-08 client move, and cross-links the four related todos (all present) and `adapter-package-loading.md`.

## Task Commits

1. **Task 1: runner and the first proof (tracer)**: `c1c6aea0d` (feat)
2. **Task 2: the remaining 26 no-code proofs and rows**: `1f984350a` (feat)
3. **Task 3: deferred todo**: `e8c0d97f9` (docs); **its ledger row**: `50b484686` (docs)

Each commit carries one `Review-Comment: C-<id>` trailer per row it dispositions (1 + 26 + 1 + 1).

## The 28 rows

`S=.planning/phases/165-review-stack-comment-remediation/scripts`. Every result below was read from `bash $S/tip-proofs.sh` at 17:25Z, with exit status 0 and 27 PASS lines. The "Later plan" column lists the plans whose edits the proof reads through. Plan 165-36's re-run is the check that those plans kept the property.

| Comment | PR | Disposition | Proof result | Other half in | Later plan the proof depends on |
|---|---|---|---|---|---|
| C-4080507248 | #876 | split-artifact | PASS | #877 | — |
| C-4080507280 | #876 | split-artifact | PASS | #882 | — |
| C-4080520022 | #877 | split-artifact | PASS | #881 | — |
| C-4080520062 | #877 | wont-fix (D-07) | PASS | — | 165-21, 165-27 (seed.sql); 165-30 (claimConfig.ts) |
| C-4080520123 | #877 | split-artifact | PASS | #880 | 165-23 (supabaseAdminWriter.ts) |
| C-4080520206 | #877 | split-artifact | PASS | #880, #881 | 165-06 (roles.ts); 165-08/25/26 (301-auth-functions.sql); 165-19 (passwordLogin.ts); 165-26 (supabaseDataWriter.ts) |
| C-4080520279 | #877 | split-artifact | PASS | #880 | 165-11 (provider helpers move); 165-16/25/26/27 (503-entity-rpcs.sql) |
| C-4080520322 | #877 | already-fixed | PASS | #877 itself | 165-16/25/26/27 (503-entity-rpcs.sql) |
| C-4080520354 | #877 | split-artifact | PASS | #880 | 165-26 (supabaseDataWriter.ts) |
| C-4080520386 | #877 | split-artifact | PASS | #876 (types), #880 | 165-23 (supabaseAdminWriter.ts) |
| C-4080520413 | #877 | split-artifact | PASS | #878 | 165-16 (000-enums.sql); 165-10, 165-18 (ElectionsGenerator.ts, templates/default.ts) |
| C-4080520453 | #877 | split-artifact | PASS | #878 | 165-10/18/27 (permittedKeys.ts) |
| C-4080515718 | #878 | split-artifact | PASS | #879 | — |
| C-4080508297 | #879 | split-artifact | PASS | #881 | — |
| C-4080508343 | #879 | split-artifact | PASS | #880, #881 | 165-19 (passwordLogin.ts); 165-26 (supabaseDataWriter.ts); 165-06 (tests supabaseAdminClient.ts, roles.ts) |
| C-4080508426 | #879 | split-artifact | PASS (static); behavioural proof is 165-35's E2E run | #881 | 165-19 (+layout.server.ts); 165-35/36 (admin-access.spec.ts result) |
| C-4080508462 | #879 | split-artifact | PASS | #880 | — |
| C-4080508490 | #879 | split-artifact | PASS | #880 | — |
| C-4080508533 | #879 | split-artifact | PASS | #880 | 165-06 (roles.ts must keep `ADMIN_GRANTS`) |
| C-4080514940 | #880 | split-artifact | PASS | #881 | — |
| C-4080514990 | #880 | split-artifact | PASS | #881 | 165-29 (PasswordSetter) |
| C-4080515025 | #880 | split-artifact | PASS | #881 | — |
| C-4080515081 | #880 | split-artifact | PASS | #881 | — |
| C-4080515115 | #880 | split-artifact | PASS (runs layout.load.test.ts, 4 passed) | #881 | 165-19 (+layout.ts, layout.load.test.ts) |
| C-4105438045 | #880 | deferred (D-03) | n/a: todo `e8c0d97f9` | follow-up phase | — |
| C-4080520522 | #881 | split-artifact | PASS | #882 | 165-19/20/30 (svelte.config.js); 165-06 (vitest.config.ts) |
| C-4080520561 | #881 | split-artifact | PASS | #882 | 165-19/20/30 (svelte.config.js); 165-06 (vitest.config.ts) |
| C-4080502788 | #882 | split-artifact | PASS | #886 | 165-14/30/34/36 (.env.example) |

## Seen red (scratch perturbations, each reverted and `cmp`-checked before the commit)

| Perturbation | Proof | Result |
|---|---|---|
| compare `max_rows` with `1000` instead of `pageSize` | C-4080507248 | FAIL, exit 1 |
| pin slice 01 to `5f2ffe900` (so the setting is "already in #876") | C-4080507248 | FAIL: `max_rows = 50000 is already set in #876`, exit 1 |
| drop the comment-line exclusion from the `user_roles` pattern | C-4080520206 | FAIL: the `requireAdminIdentity.ts:18` docblock matches. This shows the exclusion is doing work, and that exactly one comment mention exists |
| require `p_projectid` on `get_nominations` calls | C-4080520279 | FAIL: `1 1` (one call, one without the argument) |
| check `election_type` values against an empty enum | C-4080520413 | FAIL: `candidate_only` is not a member |
| point vitest at a nonexistent test file | C-4080515115 | FAIL: `vitest ... exited 1` |

The first run of the Task 2 proofs was also red on real defects in the proofs, not in the tree. These were fixed before commit (see Deviations).

## Decisions Made

See `key-decisions` in the frontmatter. The consequence for later plans: any `assert-absent.sh` call that needs to exclude test files must use `':(exclude)<dir>/*.test.ts'`. The `':!*.test.ts'` form makes it exit 2.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The comment stripper swallowed code after a `/**` inside a `//` comment**
- **Found during:** Task 2, first full run (C-4080520354 read 0 `get_candidate_user_data` calls)
- **Issue:** Stripping `/* */` blocks before `//` lines let the `/api/admin/jobs/**` text in a `//` comment in `supabaseDataWriter.ts` open a block that ran to the next `*/`. That deleted real code.
- **Fix:** A single-pass perl tokenizer that matches string, template and comment tokens left to right, and keeps only the strings. It was checked on a sample with a glob literal, a URL, an apostrophe in a docblock and a `/* */` inside a template literal.
- **Commit:** 1f984350a

**2. [Rule 3 - Blocking] `':!*.test.ts'` makes `git ls-files` list nothing**
- **Found during:** Task 2 (C-4080520206, C-4080508343 exited 2 from assert-absent.sh)
- **Issue:** On git 2.50.1, a positive pathspec plus `:!*.test.ts` lists 0 files, while `git grep` honours the same pathspecs. assert-absent.sh correctly treats an empty file set as exit 2.
- **Fix:** `':(exclude)apps/frontend/src/*.test.ts'`. It lists 1054 of 1152 files, excluding the 98 test files. assert-absent.sh is unchanged, because it belongs to 165-01.
- **Commit:** 1f984350a

**3. [Rule 1 - Bug] Two proof regexes were too narrow for the real code shape**
- `passwordLogin({ context: { ... }, ..., allowedGrants: ... })` has a nested object, so the argument regex now admits one level of braces.
- `COLLECTION_NON_COLUMNS: Record<...> = Object.fromEntries(...)` has a type annotation, so the regex now allows text between the name and `=`.
- The C-4080520062 birthdate check first matched a docblock in `claimConfig.test.ts`. It now excludes test files and comment lines, like the claim check does.
- **Commit:** 1f984350a

**4. [Rule 2 - Missing critical] `set -f` for the whole script**
- Route paths such as `[jobId]` and `(protected)` are passed unquoted into file-list helpers, and bash would glob-expand `[jobId]`. The script uses no globs, so globbing is disabled at the top.
- **Commit:** 1f984350a

**5. [Rule 2 - Missing critical] Proofs strengthened beyond the evidence table, in the fail-closed direction**
- The RPC proofs require **every** call in the adapter directory to pass `p_project_id`, not just one.
- C-4080520322 asserts that #877's parent is #876's head, and that `c.name` is present at #876, so the "removed line" reading is proven rather than assumed.
- C-4080520062 adds a positive control: `backend/vaa-strapi` must exist on `origin/main`, so an unresolvable tree cannot read as "no apps/supabase".
- Commit ids are pinned instead of branch names.
- **Commit:** 1f984350a

**6. [Rule 1 - Bug] One draft-reply clause was not proven**
- The C-4080515718 reply first said teardown was unchanged. No proof checks that, so the clause was removed before filling.

**Total deviations:** 6 auto-fixed (2 bugs, 1 blocking, 2 missing-critical, 1 unproven claim). **Impact:** none on scope. Every change makes a proof stricter or makes it read the real code.

## Issues Encountered

- The interactive shell is zsh, whose arrays are 1-based. A first slice-attribution loop run in zsh reported every slice one PR too high. It was re-run under `bash`, and every PR number in the ledger comes from the bash run. `tip-proofs.sh` itself is bash, so it is not affected.
- `git diff --stat ship/v2.15-12-planning -- apps packages tests` shows only the maintainer's uncommitted `MainContent.svelte`. `git diff --stat 9473d0fc3 HEAD -- apps packages tests` is empty, so this plan changed no shipped source.

## Known Stubs

None. `ledger-check.sh --final` still exits 1 because the 50 `fix` rows owned by later plans are pending. That is the designed state until plan 165-36. The tip-proof leg of `--final` is green.

## Next Phase Readiness

- Plan 165-36 runs `ledger-check.sh --final`, which re-runs all 27 proofs at the final tip. The "Later plan" column above names the proofs most likely to need attention.
- C-4080508426's row stays open to one behavioural fact: plan 165-35's full E2E run must pass `admin-access.spec.ts`, and 165-36 records it.
- No reply was posted to GitHub.

## Self-Check: PASSED

- Files exist: `scripts/tip-proofs.sh`, `.planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md`, and `165-LEDGER.md` (modified).
- Commits `c1c6aea0d`, `1f984350a`, `e8c0d97f9` and `50b484686` are in `git log`. `git rev-list --count 9473d0fc3..HEAD` is 4 before this SUMMARY commit.
- `tip-proofs.sh` exits 0 with 27 PASS lines. `grep -c '^proof_C_'` is 27. `ledger-check.sh` exits 0. None of the 28 owned rows has a `pending` cell. The todo lists requirements 1-6 and names `SUPABASE_COOKIE_PREFIX`.
