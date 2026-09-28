---
phase: 165-review-stack-comment-remediation
plan: 36
subsystem: release
tags: [ledger, push, pull-request, ci-evidence, secret-scan, trufflehog]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-35's green final gate on e51a48b28, the fix commits with Review-Comment trailers, tip-proofs.sh and ledger-check.sh
provides:
  - The final 165-LEDGER.md (78 rows, trailer-derived commit cells, PR and CI record in the header)
  - PR #889 (13/13) open on ship/v2.15-12-planning
  - CI evidence run 36429830379 on a tree byte-identical to the PR head, with every red job root-caused
affects: [phase-165-verification, v2.15-stack-merge, ci-e2e]

actuals:
  tokens: 16330
  tasks: 3
  commits: 3
plan_head_before: 4d44386b44e7b6cbb2f4828e2b2ed419cacf2945
plan_head_after: 45d4cf7c0fadc6f06537f625fb73a1f7c7dda999

tech-stack:
  added: []
  patterns:
    - "CI evidence for a branch whose tip commit touches only markdown: commit-tree the PR head's tree onto origin/main and push it to a new ci-evidence/** branch (tree-identical, no force)"
    - "trufflehog on a linked worktree: point it at the main repository path and a LOCAL branch; a remote-tracking ref gives a 0-chunk scan that reads as clean"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/165-36-SUMMARY.md
  modified:
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "Commit cells list every trailer-cited commit in commit order; a related commit the reply cites without a trailer is kept after 'also'"
  - "CI evidence used the PR head's full tree (including .planning/), parented on origin/main, so the run tests exactly what PR #889 holds; the 163 recipe strips .planning/ and would have hidden the secret-scan findings"
  - "The five red CI jobs are not fixed in this plan: none was caused by a phase-165 change, and two need maintainer decisions (a dependency upgrade or a reviewed baseline entry; changing #887's planning content or the scanner's exclusions)"

patterns-established:
  - "Read the trufflehog chunk count before trusting a clean scan"

requirements-completed: [165-SC1, 165-SC5]

coverage:
  - id: D1
    description: "Every one of the 78 comments has a disposition, evidence, a trailer-derived commit or ledger reference and a one-line draft reply; appendix of 12 review bodies"
    requirement: "165-SC1"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/ledger-check.sh --final (50 fix / 25 split-artifact / 1 already-fixed / 1 deferred / 1 wont-fix; appendix 12; VERDICT: PASSED)"
        status: pass
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/tip-proofs.sh (27 PASS, 0 FAIL)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Branch pushed without force, remote equals local, PR #889 open with base ship/v2.15-12-planning, title 13/13, body linking the ledger and ending with the attribution lines; publication surface scanned clean"
    requirement: "165-SC5"
    verification:
      - kind: other
        ref: "test \"$(git rev-parse origin/ship/v2.15-13-review-fixes)\" = \"$(git rev-parse HEAD)\"; gh pr view ship/v2.15-13-review-fixes --json baseRefName,title"
        status: pass
    human_judgment: false
  - id: D3
    description: "PR CI observed to green"
    verification:
      - kind: other
        ref: "gh pr checks ship/v2.15-13-review-fixes (no checks reported); evidence run 36429830379 (5 of 11 jobs red)"
        status: fail
    human_judgment: true
    rationale: "Not green. The red jobs need maintainer decisions on a dependency advisory, on #887's planning content under the secret scan, and on changing the CI environment."

duration: 26min
completed: 2026-09-28
status: halted
---

# Phase 165 Plan 36: Final Ledger, Push, PR 13/13 and CI Summary

**All 78 review threads have a disposition in the ledger, with trailer-derived commit links and ready replies. The branch is pushed and PR #889 (13/13) is open on #887. The first observed CI run of the PR's tree is not green: 5 of 11 jobs are red. Every red job was root-caused, none was caused by a phase-165 change, and they are handed to the maintainer as decisions.**

## Performance

- **Duration:** about 26 min (2026-09-28T13:22:10Z to 13:48Z)
- **Tasks:** 3 of 3 executed; Task 3's "every check green" is not met (status `halted`)
- **Files modified:** 3 (`165-LEDGER.md`, `deferred-items.md`, `WINDOWS.md`), plus this summary

## Accomplishments

- **Task 1: ledger (tracer).** Every `fix` row's Commit cell is now derived from `git log --reverse ship/v2.15-12-planning..HEAD -F --grep='Review-Comment: C-<id>'`.
  - Five rows had been missing some of their trailer-cited commits: C-4080520167 (+1), C-4094555940 (+3, the 165-18 seed-data commits), C-4105374348 (+6), C-4106561819 (+2) and C-4106826598 (+1).
  - Three commits the replies cite without a trailer are kept after `also`: fcab6fd04, 385363a9f, and df30baed5 with c51d24cfd.
  - Three rows (C-4105374348, C-4106561819, C-4106666404) had unescaped `|` inside Evidence code spans, which shifted their columns and made `--final` report "fix row names no commit". They are now escaped.
  - C-4080508426 now records the admin-access result from `tests/e2e-runs/165-close/results.json`: `specs/admin/admin-access.spec.ts` passed on its first attempt, and its teardown passed.
  - `tip-proofs.sh` shows 27 PASS, and no proof needed re-targeting. `ledger-check.sh --final` passes with 50 / 25 / 1 / 1 / 1, the plan's expected counts. The tracer gate re-ran both checks at the committed tip, and both exited 0.
- **Task 2: push and PR.** The pre-push checks all came back clean:
  - `git log --name-only e51a48b28..HEAD` lists only `.planning/`, and `git diff --quiet e51a48b28 HEAD -- . ':(exclude).planning'` exits 0.
  - `MainContent.svelte` is not in the branch diff and is still unstaged.
  - The secret sweep (commands below) found nothing.

  The push used `git push -u origin ship/v2.15-13-review-fixes` without force, and remote equals local. PR [#889](https://github.com/OpenVAA/voting-advice-application/pull/889) was opened with base `ship/v2.15-12-planning` and the plan's title. Its body links the ledger and ends with the two attribution lines. The PR number went into the ledger header, which was then pushed again.
- **Task 3: CI.** The PR itself gets no checks: `main.yaml`'s `pull_request` trigger covers only PRs into `main`. An observed run came from the `ci-evidence/**` channel on a tree byte-identical to the PR head, [run 36429830379](https://github.com/OpenVAA/voting-advice-application/actions/runs/36429830379). Six jobs are green and five are red, and each red job is root-caused below. The ledger header and the PR body state this result, and neither claims green.

## Secret sweep record (Task 2)

| Surface | Command / pattern | Result |
|---|---|---|
| Net diff, added lines (29657) | `git diff ship/v2.15-12-planning...HEAD`, `^+` lines: `eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}`, `sb_(secret\|publishable)_…`, `-----BEGIN [A-Z ]*PRIVATE KEY-----` | 0 / 0 / 0 |
| Same | `(SUPABASE_SERVICE_ROLE_KEY\|SUPABASE_ANON_KEY)=` | only `$ANON_KEY` / `$SERVICE_ROLE_KEY` expansions in `main.yaml` and quoted `.env.example` placeholders |
| Every commit's patch (30389 added lines, lesson 16) | the patterns above, plus `ghp_`, `AKIA`, `sk-` and `service_role…eyJ` | 0 hits for each |
| `.env.example`, `functions/.env.example` diffs | read | placeholders and comments only |
| History scan | `trufflehog git file://<main repo> --branch ship/v2.15-13-review-fixes --since-commit ship/v2.15-12-planning --fail` (3.95.2) | exit 0; 2903 chunks, 0 verified, 0 unverified |
| Same, with CI's config (lesson 17) | `+ --config=.github/trufflehog-openvaa.yml --exclude-paths=.github/trufflehog-exclude-paths.txt` | exit 0; 2905 chunks, 0 verified, 0 unverified |

trufflehog did run. Pointed at the worktree path, it fails because `.git` is a file there, so it was pointed at the main repository, which shares the refs.

## CI result (Task 3), run 36429830379

| Job | Result | Root cause | Caused by phase 165? |
|---|---|---|---|
| skill-drift-check, frontend-and-shared-module-validation, supabase-tests, sql-lint, supabase-types-drift, node-engine-range-negative-control | success | — | — |
| secret-scan | failure | 12 unverified findings in `.planning/` files inherited unchanged from #887. 11 are JWTs in two v2.10 RCA Playwright trace zips (expired one-hour `authenticated` tokens from `127.0.0.1:54321`). 1 is the `OPENVAA_CI_EVIDENCE` example in `163-RESEARCH.md:320`, marked "NOT A REAL CREDENTIAL". The local reproduction with the same config and range matches 12 for 12 | No. The files are identical at `ship/v2.15-12-planning` |
| dependency-audit | failure | `[NEW]` `js-yaml` GHSA-2883-xcg3-v3hh (high), published after the 2026-09-03 baseline | No. There is no lockfile or `package.json` change on the branch |
| dev-seed-integration | failure | `projectScopingGate.test.ts` expects generated Paraglide `.js` under `apps/frontend/src`, and that job builds only dev-seed | No. The test came in slice 03/12, and no `.js` file is tracked there at the base or the tip |
| e2e-tests, e2e-visual | failure | The key step passed and the preflight printed `E2E PREFLIGHT OK` (the HTTP 500 of every earlier CI run is gone). The project preflight then aborts: observed `…0001`, expected `…00e2`. The CI "Start frontend" step sets no `PUBLIC_PROJECT_ID` | No. The preflight came in 04/12 and the step in 11/12. 165-14's key fix is what let the jobs reach this check |

## Task Commits

1. **Task 1: ledger commit cells, pipe escapes, admin-access result** - `6f63f3ef4` (docs)
2. **Task 2: PR #889 recorded in the ledger header** - `1570012ec` (docs)
3. **Task 3: the CI evidence run and its root causes (ledger header, the C-4080504623/-664 evidence, deferred-items)** - `45d4cf7c0` (docs)

**Plan metadata:** the commit that contains this SUMMARY (docs).

Outward actions, all authorised by D-12:
- pushed `ship/v2.15-13-review-fixes` (3 normal pushes);
- opened PR #889 and edited its body (this plan's own PR);
- pushed `ci-evidence/165-review-fixes-tree` (`7588b8483`, a new branch);
- pushed and then deleted `ci-evidence/165-review-fixes`, which pointed at the already-public `1570012ec` and produced no run.

No reply was posted, no thread was resolved, no other PR was touched and nothing was force-pushed.

## Files Created/Modified

- `.planning/phases/165-review-stack-comment-remediation/165-LEDGER.md`: trailer-derived commit cells; the PR and CI records in the header; the observed CI key step in C-4080504623/-664.
- `.planning/phases/165-review-stack-comment-remediation/deferred-items.md`: the "From 165-36" section, with each red job and its options.
- `.planning/WINDOWS.md`: an `unmet-truth` entry (CI not green) and an `unrun-verify` entry (`gh pr checks` has no checks to report).

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

**1. [Rule 1 - Bug] Unescaped pipes broke three ledger rows (Task 1).** Found by `ledger-check.sh --final`. The fix escapes `|` inside the code spans only, and the check then passes. Commit `6f63f3ef4`.

**2. [Method] CI evidence through a tree-identical commit (Task 3).** The PR gets no `main.yaml` run. A push of the PR head to a new `ci-evidence/**` branch produced no run either, because the tip commit touches only `.md` and `paths-ignore: '**.md'` applied. So `git commit-tree <PR head tree> -p origin/main` went to a second new branch. A normal push was enough, and the run tests exactly the PR's tree.

**3. [Scope] Five red CI jobs not fixed.** The plan asks for each red job to be fixed "per convention 4", in the file of the plan whose change caused it. No phase-165 change caused any of them (attribution in the CI table). Two of them cannot be fixed by an executor at all: a dependency upgrade is excluded from auto-fix, and #887's planning content or the secret-scanner exclusions are the maintainer's call. The E2E fix candidate would run the CI suite for the first time ever, a debugging effort of unknown depth. So everything is logged with options in `deferred-items.md` and returned as a decision checkpoint, not partially fixed.

**Total deviations:** 1 auto-fixed bug, 1 method note, 1 scope halt.

## Issues Encountered

- trufflehog: pointed at a linked worktree it errors, and pointed at a remote-tracking ref it scans 0 chunks and still exits 0. Both happened here and were caught by reading the chunk count.
- zsh does not word-split unquoted variables and treats `$VAR:r` as a modifier. Loops ran under `bash -c`, and refspecs use `${VAR}`.

## User Setup Required

None.

## Maintainer follow-ups

- The four CI decisions in `deferred-items.md` § From 165-36.
- The root `.env` lacks `SUPABASE_URL`, so `yarn check:env-local` fails. This is unrelated to the phase.
- Two style decisions were kept as rendered:
  - The voter's "Your answer" labels and markers render grey (`text-secondary`) rather than primary (165-32).
  - Disabled navigation items render neutral rather than secondary (165-33).
- The draft thread replies in the ledger are for the maintainer to post.

## Next Phase Readiness

The ledger is final and PR #889 is open. Phase 165 is not closable as "CI green" until the maintainer decides on the four CI items. After any fix, re-run the evidence push, with a new `ci-evidence/**` branch per tree or a non-`.md` change.

## Self-Check: PASSED

- `165-LEDGER.md`, `deferred-items.md` and this summary exist. The ledger contains `C-4080520234`, `#889` and `36429830379`.
- Commits `6f63f3ef4`, `1570012ec` and `45d4cf7c0` are in `git log`, and `git rev-list --count 4d44386b4..45d4cf7c0` = 3. None deletes a file.
- `ledger-check.sh --final` exits 0 and `tip-proofs.sh` exits 0. `origin/ship/v2.15-13-review-fixes` equals the local branch.
- `gh pr view 889`: base `ship/v2.15-12-planning`, title `13/13 …`, and the body contains `165-LEDGER.md` and ends with the session line.
- `MainContent.svelte` and `.planning/milestone.lock` were never staged.
- Task 3's acceptance ("every check passing") is **not** met. It is recorded as `status: halted`, not claimed.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-28 (halted at the CI criterion)*
