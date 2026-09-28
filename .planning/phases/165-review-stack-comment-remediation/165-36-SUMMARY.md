---
phase: 165-review-stack-comment-remediation
plan: 36
subsystem: release
tags: [ledger, push, pull-request, ci-evidence, secret-scan, trufflehog, js-yaml, paraglide, e2e-run]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-35's green final gate on e51a48b28, the fix commits with Review-Comment trailers, tip-proofs.sh and ledger-check.sh
provides:
  - The final 165-LEDGER.md (78 rows, trailer-derived commit cells, PR and CI record in the header)
  - PR #889 (13/13) open on ship/v2.15-12-planning
  - The D-13 CI fixes, green in CI run 36442680412 - secret-scan (trace zips deleted, one exact-path exclusion), dependency-audit (js-yaml 4.3.2 / 3.15.2), dev-seed-integration (Paraglide compile step)
  - Both CI E2E jobs on tests/scripts/e2e-run.sh, running the suite in CI for the first time
affects: [phase-165-verification, v2.15-stack-merge, ci-e2e]

actuals:
  tokens: 31149
  tasks: 3
  commits: 12
plan_head_before: 4d44386b44e7b6cbb2f4828e2b2ed419cacf2945
plan_head_after: 79ee02194

tech-stack:
  added: []
  patterns:
    - "CI evidence for a branch whose tip commit touches only markdown: commit-tree the PR head's tree onto origin/main and push it to a new ci-evidence/** branch (tree-identical, no force)"
    - "trufflehog on a linked worktree: point it at the main repository path and a LOCAL branch; a remote-tracking ref gives a 0-chunk scan that reads as clean"
    - "A lockfile-only security refresh: yarn up -R <pkg> when every dependent's declared range already admits the patched release"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/165-36-SUMMARY.md
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-allow/165-36.tsv
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-36.tsv
  modified:
    - .github/workflows/main.yaml
    - .github/trufflehog-exclude-paths.txt
    - tests/scripts/visual-container.sh
    - yarn.lock
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "Commit cells list every trailer-cited commit in commit order; a related commit the reply cites without a trailer is kept after 'also'"
  - "CI evidence uses the PR head's full tree (including .planning/), so the run tests exactly what PR #889 holds"
  - "js-yaml is refreshed in the lockfile only: every dependent's range (^4.1.0, ^4.1.1, ^3.6.1) already admits the patched 4.3.2 / 3.15.2"
  - "The dev-seed Paraglide step uses the standalone CLI with the Vite plugin's options (the production-build output structure); the test itself is unchanged"
  - "visual-container.sh --ci-literal follows CI to --project visual-regression with CI unset, so the script stays the executable description of CI's visual run"
  - "The E2E jobs' remaining red is a CI performance posture (6 workers on a 4-vCPU runner, dev-server hydration of 5-6 s against 5 s harness probes), returned to the maintainer rather than fixed by guessing a worker count or timeout"

patterns-established:
  - "Read the trufflehog chunk count before trusting a clean scan"
  - "Reading a Playwright trace's network log shows full document loads (GET /route plus /@vite/client) where client-side navigation was expected: a hydration race"

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
    description: "The D-13 CI fixes: secret-scan, dependency-audit and dev-seed-integration green in CI"
    verification:
      - kind: other
        ref: "https://github.com/OpenVAA/voting-advice-application/actions/runs/36442680412 (secret-scan, dependency-audit, dev-seed-integration: success)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every CI check green for the PR's tree"
    verification:
      - kind: e2e
        ref: "run 36442680412 e2e-tests (69 passed / 9 failed / 87 did-not-run) and e2e-visual (5 passed / 2 failed)"
        status: fail
      - kind: e2e
        ref: "local tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-36 --no-db-reset (165/0/0/0, GREEN)"
        status: pass
    human_judgment: true
    rationale: "Not green in CI. The remaining red is dev-server latency on the 4-vCPU runner under 6 workers, and fixing it is a CI-posture choice (worker count, warm-up, harness waits, runner size) that needs the maintainer."

duration: 135min
completed: 2026-09-28
status: halted
---

# Phase 165 Plan 36: Final Ledger, Push, PR 13/13 and CI Summary

**The ledger is final (78 rows) and PR #889 (13/13) is open on #887. Under the maintainer's D-13 rulings, three of the four CI failures are fixed and green in CI: secret-scan, dependency-audit and dev-seed-integration. Both E2E jobs now run the suite in CI for the first time. They are still red, because the dev server is too slow on the 4-vCPU runner under 6 workers. The same command is 165/0/0/0 green locally, and the choice of fix is returned to the maintainer.**

## Performance

- **Duration:** about 135 min in total (2026-09-28T13:22:10Z onward), including the D-13 continuation and two CI runs
- **Tasks:** 3 of 3 executed. Task 3's "every check green" is not met, so the status is `halted`.
- **Files modified:**
  - code and CI: 4 (`main.yaml`, `trufflehog-exclude-paths.txt`, `visual-container.sh`, `yarn.lock`), plus the two deleted trace zips;
  - planning: 5.

## Accomplishments

- **Task 1: ledger.** Every `fix` row's Commit cell comes from `git log --reverse ship/v2.15-12-planning..HEAD -F --grep='Review-Comment: C-<id>'`.
  - Five rows gained trailer-cited commits they had been missing.
  - Three Evidence cells had unescaped `|` characters, which shifted their columns. These are now escaped.
  - C-4080508426 records the admin-access pass in `165-close`.
  - `ledger-check.sh --final` passes with 50 / 25 / 1 / 1 / 1, and `tip-proofs.sh` reports 27 PASS.
- **Task 2: push and PR.** The pre-push checks came back clean:
  - only `.planning/` changed since `e51a48b28`;
  - `MainContent.svelte` is absent from the diff and still unstaged;
  - the pattern sweep over the net diff and over every commit's patch found nothing;
  - trufflehog found nothing.

  PR [#889](https://github.com/OpenVAA/voting-advice-application/pull/889) is open with base `ship/v2.15-12-planning`.
- **Task 3: CI, run 1.** The PR itself gets no `main.yaml` run, so I used the `ci-evidence/**` channel with a tree-identical commit.
  - [Run 36429830379](https://github.com/OpenVAA/voting-advice-application/actions/runs/36429830379): 6 jobs green and 5 red, none caused by a phase-165 change.
  - I returned a decision checkpoint, and the maintainer ruled D-13.
- **D-13 continuation.** Each ruling was applied as written:
  - `dependency-audit`: `yarn up -R js-yaml` moved 4.1.0 / 4.1.1 to 4.3.2, and 3.14.2 to 3.15.2, in the lockfile only. `yarn audit:deps` reports `[NEW] 0`. `yarn install --immutable` exits 0, and the two `js-yaml` consumers' suites pass. (`66974e29f`)
  - `secret-scan`: the two v2.10 trace zips are deleted. `163-RESEARCH.md` is the one exact-path exclusion, with its evidence in the file's own convention. Its line 320 is 32 `a` characters under a "NOT A REAL CREDENTIAL" comment. (`ff98fd22a`, `dbfb12af2`)
  - `dev-seed-integration`: the job compiles the frontend's Paraglide messages with the Vite plugin's options before its tests. Reproduced locally: the test is red without the step and 121/121 with it. (`8432291b3`)
  - `e2e-tests` / `e2e-visual`: both jobs run `tests/scripts/e2e-run.sh --no-db-reset` and keep the key step. (`8432291b3`)
    - The two wiring guards `yarn test:e2e` ran are now a step of their own.
    - Each job uploads its run directory.
    - The visual job uses `PLAYWRIGHT_VISUAL=1 … --project visual-regression`.
    - `visual-container.sh --ci-literal` follows the new CI invocation. The script joined the changed set, so its planning references, historical narrative and collapsed usage and exit-code lists were cleaned up in the forms the repo's rule-2 lint accepts.
- **Local re-gate on the final code tree (`a60182821`):**
  - build, lint, format and unit: forced with `TURBO_FORCE=true`, 0 cached, and each exits 0;
  - E2E through the wrapper: GREEN at 165/0/0/0, preflight 0/1 (`tests/e2e-runs/165-36`);
  - hygiene gate: CLEAN over 233 files, in a detached worktree;
  - `assert-comment-hygiene.mjs`: 0 violations.

  There were no schema changes, so 165-35's pgTAP, SQL lint and types-drift results stand.
- **CI run 2**, [run 36442680412](https://github.com/OpenVAA/voting-advice-application/actions/runs/36442680412), tree identical to `a60182821`:
  - 9 of 11 jobs are green, including the three D-13 fixes. The `secret-scan` job scanned the full `main..tip` range and found 0.
  - `e2e-tests`: 69 passed, 9 failed, 87 did not run. `e2e-visual`: 5 passed, 2 failed.

## Root cause of the remaining E2E red (from the traces)

- **Every step is a full page load.** In the network logs, each step is a full document load (`GET /intro`, `GET /elections`, each followed by `/@vite/client`), not a client-side navigation: the test clicks SSR-rendered links before the page has hydrated.
- **Each full load hydrates in 5-6 s on the runner.** For `/elections`, the route modules arrived at 15:25:41.2 and the first Supabase query went out at 15:25:46.5. The first server render of `/candidate/preview` took 5153 ms, and no REST call followed inside the assertion window.
- **The harness probes expire first.**
  - `walkUntilQuestionsIntro` probes `voter-elections-list` for 5 s (`TIMEOUTS.page`), takes the no-elections branch and then waits for a questions start that never comes. The final snapshot shows the elections page rendered late.
  - The visual Candidate Preview's `expectPortraitVisible` is a default 5 s expect.
- **Why only in CI:** `cpu_count=4` there against 14 locally, with 6 workers, 13 Supabase containers and a cold on-demand Vite compile. Locally the same command is green at 165/0/0/0, and the local visual run passes `expectPortraitVisible`; only its macOS screenshots differ, as expected.
- **Options for the maintainer (`deferred-items.md` § From 165-36):**
  - (a) a CI worker override;
  - (b) a dev-server warm-up before Playwright;
  - (c) hydration-aware harness waits, plus racing page-state resolution instead of timed branch probes;
  - (d) a larger runner.

  I did not change worker counts or timeouts. A guessed number would either break "as it runs locally" or massage the harness's timeouts, which the E2E hard rule forbids.

## Secret sweep record

| Surface | Command / pattern | Result |
|---|---|---|
| Net diff, added lines | `git diff ship/v2.15-12-planning...HEAD`, `^+` lines: JWT shape, `sb_(secret\|publishable)_`, private-key blocks, `SUPABASE_*_KEY=` | 0 hits for each; the key lines are only `$VAR` expansions and quoted placeholders |
| Every commit's patch | the patterns above, plus `ghp_`, `AKIA`, `sk-` and `service_role…eyJ` | 0 hits for each (re-run over the D-13 commits: 0) |
| This PR's commits, CI config | `trufflehog git … --since-commit ship/v2.15-12-planning --config=.github/trufflehog-openvaa.yml --exclude-paths=…` | 2955 chunks, 0 verified, 0 unverified |
| Full `main..tree` range, CI config | the same, over the evidence commit | 11990 chunks, 0 verified, 0 unverified (run 1's range had 12) |

## Task Commits

1. **Task 1: ledger commit cells** - `6f63f3ef4` (docs)
2. **Task 2: PR #889 in the ledger header** - `1570012ec` (docs)
3. **Task 3: CI run 1 recorded** - `45d4cf7c0` (docs); first summary `6c913e570` and state `3f8ef59cf` (docs)
4. **The maintainer's D-13 rulings** - `40f6f91b8` (docs, orchestrator's commit)
5. **D-13: js-yaml refresh** - `66974e29f` (fix)
6. **D-13: secret-scan findings cleared** - `ff98fd22a` (fix)
7. **D-13: E2E jobs on the wrapper, Paraglide compile for dev-seed** - `8432291b3` (fix)
8. **Exclude-list wording, the allowlist entry and hygiene reads** - `dbfb12af2`, `a60182821` (chore)
9. **CI run 2 recorded** - `79ee02194` (docs)

**Plan metadata:** the commit that contains this SUMMARY (docs).

`commits: 12` is measured from `4d44386b4` and includes the orchestrator's D-13 commit.

**Outward actions** (all authorised by D-12 and D-13):
- normal pushes of `ship/v2.15-13-review-fixes`;
- opened PR #889 and edited its body twice;
- new branches `ci-evidence/165-review-fixes-tree` (run 1) and `ci-evidence/165-review-fixes-tree-2` (run 2);
- `ci-evidence/165-review-fixes`, which produced no run, was deleted.

No thread reply, no thread resolution, no other PR touched, no force-push.

## Deviations from Plan

**1. [Rule 1 - Bug] Unescaped pipes broke three ledger rows (Task 1).** They are now escaped inside the code spans only. (`6f63f3ef4`)

**2. [Method] CI evidence through tree-identical commits.** The PR gets no `main.yaml` run, and a push of a markdown-only tip commit triggers none either.

**3. [Rule 2 - D-04] `visual-container.sh` hygiene.** The file entered the changed set, so the whole file was brought to the hygiene rules:
- two ids;
- three narrative phrasings;
- four research-item citations;
- a line-number "incident" anchor;
- three swallowed section comments;
- collapsed lists, fixed with a fence, `N:` table rows and blank lines.

It is still valid bash; the usage-error path exits 2 and `--help` prints.

**4. [Rule 1] `main.yaml` sentence.** The dev-seed job comment named `yarn test:e2e`, which the E2E job no longer calls.

**5. [Scope] E2E red not fixed.** This is the checkpoint below.

**Total deviations:** 2 bug fixes, 1 hygiene sweep, 1 method note, 1 scope halt.

## Issues Encountered

- trufflehog errors on a linked worktree, and scans 0 chunks against a remote-tracking ref while still exiting 0. Reading the chunk count caught both.
- zsh doesn't word-split variables, and it reads `$VAR:r` as a modifier. Loops ran under `bash -c`, and refspecs use `${VAR}`.
- The repo's rule-2 lint is what produced the collapsed comment lists. Its accepted forms are fences, `\S+:` followed by two or more spaces for table rows, and paragraph breaks.

## Maintainer follow-ups

- **Decide the CI E2E posture:** (a), (b), (c) or (d) above.
- The root `.env` lacks `SUPABASE_URL`, so `yarn check:env-local` fails. This is unrelated to the phase.
- Two style decisions were kept as rendered:
  - the voter's "Your answer" labels and markers render grey (`text-secondary`) rather than primary (165-32);
  - disabled nav items render neutral rather than secondary (165-33).
- Post the draft thread replies from the ledger.

## Next Phase Readiness

Phase 165 is complete apart from the CI E2E posture. The ledger is final, PR #889 is open, and every non-E2E CI job is green on the PR's tree.

## Self-Check: PASSED

- The summary, ledger and deferred-items files exist.
- The ledger contains `C-4080520234`, `#889`, `36429830379` and `36442680412`.
- The commits listed above are in `git log`. `git rev-list --count 4d44386b4..79ee02194` = 12.
- The only deletions are the two trace zips, which D-13 ordered.
- `ledger-check.sh --final` exits 0 and `tip-proofs.sh` exits 0.
- `MainContent.svelte` and `.planning/milestone.lock` were never staged.
- Task 3's "every check passing" is **not** met. It is recorded as `status: halted`, not claimed.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-28 (halted at the CI E2E criterion)*
