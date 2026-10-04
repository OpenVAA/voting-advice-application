---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 11
subsystem: infra
tags: [ci, github-actions, checkout, setup-node, upload-artifact, paths-filter, setup-cli, changesets-action, pages, trufflehog, ci-evidence, playwright-trace, e2e-race]

requires:
  - phase: 169-10
    provides: "small majors landed, 12/12 gates at 5017d4a17; HEAD 64065412f"
  - phase: 169-02
    provides: "the ci-evidence procedure and the group-1 CI run 37115289953 (tree of 8d91d37f8)"
provides:
  - "actions/checkout v7 (17 steps), setup-node v7 (11), upload-artifact v7 (2), dorny/paths-filter v4, supabase/setup-cli v3 (6, version: 2.118.0 kept), changesets/action v2 (github-token input, v2 input names, push-with-git-cli), configure-pages v6, upload-pages-artifact v5, deploy-pages v5 — one commit each"
  - "trufflehog 3.97.9 in both the uses: tag and the version: input"
  - "the CI-shape test literal (actions/checkout@v7) and every comment/docblock that named an old major rewritten"
  - "the first CI observation of groups 2-9: run 37144076939, 12/12 jobs success, E2E 171 passed, pgTAP 1335 on Postgres 17"
  - "the performance project records no trace (Playwright 1.63's trace recording sat inside the measured window)"
  - "voter-journey keyboard steps wait for the post-navigation focus reset (waitForNavigationFocusReset)"
affects: [169-12, 169-13]

actuals:
  tokens: 18000    # chars/4 over the realized diff 64065412f..551157daa (50641 chars) plus this summary
  tasks: 3
  commits: 14      # git rev-list --count 64065412f..HEAD at SUMMARY time (the SUMMARY/state commits follow)
plan_head_before: 64065412fd73cdfea8f6e6f003418eeb274a0fcc
plan_head_after: 551157daafc0709b696048dee1576f32dba5de7e

tech-stack:
  added: ["actions/checkout v7.0.1", "actions/setup-node v7.0.0", "actions/upload-artifact v7.0.1", "dorny/paths-filter v4.0.3", "supabase/setup-cli v3.0.1", "changesets/action v2.1.2", "actions/configure-pages v6.0.0", "actions/upload-pages-artifact v5.0.0", "actions/deploy-pages v5.0.1", "trufflehog 3.97.9"]
  removed: ["actions/checkout v4", "actions/setup-node v4", "actions/upload-artifact v4", "dorny/paths-filter v3", "supabase/setup-cli v1", "changesets/action v1", "actions/configure-pages v4", "actions/upload-pages-artifact v3", "actions/deploy-pages v4", "trufflehog 3.97.2"]
  patterns:
    - "Measure Action age from the releases API and resolve each floating major tag to its commit, so @vN is known to run the release measured"
    - "Bisect a performance-budget regression on an isolated git clone with the shared stack untouched (db:start neutralised in the clone's runner, --no-db-reset), 3 runs per point, then discriminate harness from app with --trace=off"
    - "After a client navigation, take keyboard/focus steps only once the app's focus reset has landed; clicks already wait out a View Transition through Playwright's hit-target retry, focus() and keyboard.press() do not"

key-files:
  created:
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-11-SUMMARY.md
  modified:
    - .github/workflows/main.yaml
    - .github/workflows/release.yml
    - .github/workflows/docs.yml
    - .github/workflows/claude.yml
    - .github/workflows/claude-code-review.yml
    - .github/workflows/claude-solve-issue.yml
    - packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
    - packages/dev-seed/tests/rpcNullabilityGate.test.ts
    - packages/dev-seed/tests/ciSecretScanFlags.test.ts
    - tests/playwright.config.ts
    - tests/README.md
    - tests/tests/specs/voter/voter-journey.spec.ts
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/deferred-items.md

key-decisions:
  - "Age rule measured live at 2026-10-03T17:09:32Z from the GitHub releases API: every target major's x.0.0 is 53-219 days old and every newest release at least 9.3 days old; nothing held. Each floating major tag resolves to the same commit as the newest release of that major."
  - "changesets/action v2: github-token passed as the input and the step's GITHUB_TOKEN env removed (v2 ignores it, warns on a mismatch, and itself exports the input as GITHUB_TOKEN to changeset version and the publish script, which the GitHub changelog generator reads); push-with-git-cli: true keeps v1's default git-cli commit mode; job permissions and NPM_CONFIG_PROVENANCE unchanged."
  - "CI red 1 (performance 5901 ms > 5000 ms) is Playwright 1.63's trace recording inside the measured window, not an app regression: bisect step at 34670ea56 (no app change), HEAD untraced 241-244 ms = 1.58 traced 213-243 ms. Fixed by trace: 'off' for the performance project only; budget, window and assertions unchanged."
  - "CI reds 2 and 3 (term popup never shown; Base-6 slider answer not stored) are keyboard/focus steps taken inside the View Transition window, before the root layout's post-navigation focus reset. Fixed by one helper, waitForNavigationFocusReset (TIMEOUTS.page), plus a stored-answer check before Next. The term mechanism is confirmed from the trace; why the slider press was lost is UNCONFIRMED."
  - "DEPS-13 marked complete: every Action and trufflehog moved, CI-shape tests updated, run 37144076939 12/12 success at job level, release.yml/docs.yml recorded as unobservable until merge."

patterns-established:
  - "waitForNavigationFocusReset(page) before any focus()/keyboard.press() that follows a client navigation in voter-journey"

requirements-completed: [DEPS-13]

coverage:
  - id: D1
    description: "actions/checkout at its newest safe major in every workflow; the docker-image-build shape test agrees"
    requirement: DEPS-13
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed vitest run (5 CI-shape files, 38 tests) after every commit; js-yaml parse of all 6 workflows (tests/e2e-runs/169-gates/11/t*-shape.log)"
        status: pass
      - kind: other
        ref: "git grep 'actions/checkout@v4' -- .github packages/dev-seed/tests -> no match"
        status: pass
    human_judgment: false
  - id: D2
    description: "setup-node, upload-artifact, paths-filter, setup-cli, changesets/action and the three Pages actions on their newest safe majors, one commit each, inputs valid for each target action.yml"
    requirement: DEPS-13
    verification:
      - kind: other
        ref: "target inputs read from each action.yml at its tag (tests/e2e-runs/169-gates/11/t0-action-inputs.txt); the acceptance grep for old pins exits 1; grep -c 'github-token:' release.yml = 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "trufflehog 3.97.9 in both literals; secret-scan shape test and the CI job green"
    requirement: DEPS-13
    verification:
      - kind: unit
        ref: "ciSecretScanFlags.test.ts pass"
        status: pass
      - kind: other
        ref: "local trufflehog 3.97.9 over the evidence range: 0 verified / 0 unverified; CI secret-scan success in all three runs"
        status: pass
    human_judgment: false
  - id: D4
    description: "One observed CI run of HEAD through ci-evidence, every job success at job level"
    requirement: DEPS-13
    verification:
      - kind: e2e
        ref: "run 37144076939 (59607e5cd = tree of edaa28205): 12/12 jobs success; e2e-tests 171 passed, e2e-visual 7 passed; plan verify command -> '12 jobs read', exit 0 (tests/e2e-runs/169-gates/11-t3-ci.json)"
        status: pass
    human_judgment: false
  - id: D5
    description: "release.yml and docs.yml recorded as unobservable until merge, with an operator follow-up"
    requirement: DEPS-13
    verification:
      - kind: other
        ref: "169-EVIDENCE.md section 7, 'Watch the first main run of release.yml and docs.yml after merge'"
        status: pass
    human_judgment: true
  - id: D6
    description: ".github/dependabot.yml unchanged"
    verification:
      - kind: other
        ref: "git diff --quiet 64065412f HEAD -- .github/dependabot.yml -> exit 0"
        status: pass
    human_judgment: false

duration: 100min
completed: 2026-10-03
status: complete
---

# Phase 169 Plan 11: GitHub Actions majors, the Pages actions and trufflehog 3.97.9, observed green in CI after three fixes to E2E reds that the Actions bumps did not cause

**All nine Actions and trufflehog moved, one commit each. `checkout`, `setup-node` and `upload-artifact` went to v7,
`paths-filter` to v4, `setup-cli` to v3 and `changesets/action` to v2, with the token passed as an input, the v2 input
names and the git-cli push mode kept. The Pages actions went to `configure-pages` v6, `upload-pages-artifact` v5 and
`deploy-pages` v5. This was the first CI run of everything since group 1. Its E2E job went red twice before it went
green, and none of the reds came from the Actions bumps. Playwright 1.63's trace recording inflated the performance
spec's measured window. Separately, two voter-journey keyboard steps raced the View Transition. Run 37144076939 is
12/12 `success`, with E2E 171 passed and pgTAP 1335 passing on Postgres 17.**

## Performance

- **Duration:** ~100 min (2026-10-03T17:09Z–18:50Z)
- **Tasks:** 3 of 3
- **Commits:** 14 before this summary (10 Action commits, 3 test fixes, 1 evidence)

## Accomplishments

- **Age rule, measured live** from the releases API (§ 1 of the ledger). Every target major's `x.0.0` is 53–219 days
  old, and every newest release is at least 9.3 days old. Each floating major tag resolves to the commit of the
  newest release in its major. Nothing was held. No workflow uses `pull_request_target` or `workflow_run`, so
  checkout v7's fork-PR block changes nothing.
- **One commit per Action.** Each was checked against the target `action.yml`:
  - `checkout`: no input changes.
  - `setup-node`: no input changes. The v6+ automatic cache is npm-only, and v7 drops the dummy `NODE_AUTH_TOKEN`.
  - `upload-artifact`: no input changes.
  - `paths-filter`: no input changes.
  - `setup-cli`: every `version: 2.118.0` pin kept. v3 installs from npm into a `$RUNNER_TEMP` prefix.
  - `changesets/action`: the inputs were renamed to `pr-title`, `commit-message` and `publish-script`.
    `github-token` is now an input, the env token was dropped, and `push-with-git-cli: true` was added.
  - Pages actions: no input changes. `upload-pages-artifact` v4+ excludes dotfiles, and the docs build has none.
  - trufflehog: both literals moved, and the `action.yml` is byte-identical between the two tags.
- **CI-shape tests and comments match the new pins.** The `ciDockerImageBuildGate` literal now reads
  `actions/checkout@v7`. The three comments that named `setup-cli@v1` now describe the pinned CLI `version:`. The
  trufflehog tag examples are 3.97.9 (ghcr.io answers 200 for `3.97.9` and 404 for `v3.97.9`).
- **CI observed at job level** (ledger § 4, "169-11 CI evidence"):
  - Run 1 `37139970902`: 11/12 jobs passed, `e2e-tests` red.
  - Run 2 `37142651706`: 11/12 jobs passed, `e2e-tests` red.
  - Run 3 `37144076939`: **12/12 jobs passed**.
  - Every pushed tree had 0 `.planning/` paths. The lease chain on `ci-evidence/169-deps` was 2cf0e8416 → 3a27c98fc
    → d69c5d62a → 59607e5cd.

## Task Commits

1. **Task 1 (tracer): checkout v7.** `ca501461c`. The tracer gate re-ran the parse and the five shape files: green.
2. **Task 2: the other Actions and trufflehog.** `0f366de0a` setup-node v7, `242c5d1a7` upload-artifact v7,
   `810083443` paths-filter v4, `32c9336ea` setup-cli v3, `2e9f5d343` changesets/action v2, `8fe98ace5`
   configure-pages v6, `bba6dc891` upload-pages-artifact v5, `82f0991fb` deploy-pages v5, `70c397a8c` trufflehog 3.97.9.
3. **Task 3: CI evidence, with the fix-forward commits.**
   - `f6bbc68ab` performance project untraced.
   - `549f6a60d` term-trigger waits for the focus reset.
   - `edaa28205` Base-6 slider press after the focus reset, plus a stored-answer check; also extracts the
     `waitForNavigationFocusReset` helper.
   - `551157daa` evidence, deferred-items.

## Files Created/Modified

- `.github/workflows/{main.yaml,release.yml,docs.yml,claude.yml,claude-code-review.yml,claude-solve-issue.yml}`: the
  new pins. `release.yml` also gets the v2 inputs.
- `packages/dev-seed/tests/{ciDockerImageBuildGate,rpcNullabilityGate,ciSecretScanFlags}.test.ts`: literal and
  docblocks.
- `tests/playwright.config.ts`: `trace: 'off'` on the `performance` project, with the measurements in the comment.
- `tests/README.md`: notes the one untraced project.
- `tests/tests/specs/voter/voter-journey.spec.ts`: `waitForNavigationFocusReset`, used in the term step and in
  `expectNumberQuestionAndAdvance`.
- `169-EVIDENCE.md`: §§ 1, 4, 6, 7. `deferred-items.md`: the Base-6 entry is now marked addressed.

## Decisions Made

See `key-decisions` in the frontmatter. In short:
- **changesets v2.** The token is passed as an input, and the env token was dropped because v2 re-exports the input
  as `GITHUB_TOKEN`. The v1 git-cli push mode is kept.
- **The performance red.** It is fixed by recording no trace for that one project, with the budget unchanged.
- **The two voter-journey reds.** They are fixed by waiting for the app's own post-navigation focus reset before any
  keyboard step.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, test harness] The performance budget was measuring Playwright's trace recorder**
- **Found during:** Task 3, CI run 1.
- **Issue:** `timeToMatches` was 5901 ms against a budget of 5000 ms.
- **Diagnosis:** A clone-based bisect (3 runs per point) put the step at `34670ea56`, the Playwright 1.63 commit,
  which changes no app code.
- **Measurements:**

  | Build | `timeToMatches` (ms) |
  |---|---|
  | Playwright 1.58, traced | 213–243 |
  | Playwright 1.63, traced | 584–611 |
  | Playwright 1.63, untraced | 241–244 |

- **Fix:** `trace: 'off'` for the `performance` project. The assertion and the budget are unchanged.
- **Files:** `tests/playwright.config.ts`, `tests/README.md`. **Commit:** `f6bbc68ab`.

**2. [Rule 1 - Bug, test race] The term popup step focused the trigger inside the View Transition window**
- **Found during:** Task 3, CI run 1.
- **Issue:** The trace and frames show the Base-3 DOM swapped while the screen still showed Base-2, and the trigger
  was focused at that point. The root layout's focus reset runs after the transition and moves focus to the heading.
  `Term.svelte` hides the popup on `focusout`.
- **Fix:** The step now polls until focus is on `[data-focus-on-nav] ?? h1` (with `TIMEOUTS.page`), then focuses the
  trigger. **Commit:** `549f6a60d`.

**3. [Rule 1 - Bug, test race] The Base-6 slider `End` press landed in the same window**
- **Found during:** Task 3, CI run 2. This is the intermittent recorded in `deferred-items.md` since 169-07.
- **Issue:** The press landed 13 ms before a frame that still shows Base-5. The answer was not stored, and the later
  delete on Base-6 timed out after 240 s.
- **Fix:** The shared helper is now called before the press, and the step checks the answer is stored
  (`question-delete` enabled) before it clicks Next. **Commit:** `edaa28205`.
- **Still UNCONFIRMED:** why a press in that window is lost. CI run 3 passed.

**Attribution.** The three reds came from earlier groups, or from earlier timing that those groups exposed. None came
from the Actions bumps:
- Red 1: group 4 (Playwright).
- Reds 2 and 3: test races that the slower runner exposed.

**Total deviations:** 3 auto-fixed (all test-side), using 2 of the 2 allowed fix iterations. **Impact:** the
assertions are stronger or unchanged, and no budget was raised.

## Issues Encountered

- **The performance spec passed in run 3 with a thin margin: 4603 ms (ttfb 707 ms) against 5000 ms.**
  - Before group 2, CI measured 1329 ms (ttfb 51 ms).
  - Locally the untraced window is back at pre-group-4 values, so the remaining gap is on the CI server side. Why is
    UNCONFIRMED; the Vite 8 dev server under parallel load is a candidate.
  - Recorded as an operator follow-up (§ 7). It is the likeliest next CI flake.
- **The scratch bisect had no lasting side effects on the host.**
  - It pulled `ghcr.io/trufflesecurity/trufflehog:3.97.9` (61.5 MB), which is kept, since pruning images is an
    operator task.
  - Playwright 1.63's own install garbage-collected the temporary Chromium 145 download.
  - The scratch clone was deleted.

## User Setup Required

None.

## Known Stubs

None.

## Threat Flags

None. T-169-34: `changesets/action` v2 receives the token through the documented input, and the job permissions are
unchanged. T-169-36: every evidence tree had 0 `.planning/` paths. No new trust-boundary surface was added.

## Next Phase Readiness

- **169-12 (Kit 3):** still held to 2026-10-31 by the age rule.
- **169-13:**
  - Files the dependabot-widening todo (`.github/dependabot.yml` is untouched here, D-31).
  - Reconciles the baseline.
  - Picks up the stale `braces` row and the 169-10 residue.
- **The Playwright trace cost and the thin CI performance margin** are operator decisions (§ 7). Options include
  global `retain-on-failure` versus `on-first-retry` in CI, and per-stage measurement before any budget discussion.
- **After merge:** watch the first `main` run of `release.yml`, and dispatch `docs.yml` once (§ 7).
- **nodemailer 10:** held until 2026-10-04T07:51Z. Not this plan's.
- **Local state:**
  - Stack on PG17.6, left after the last `db:reset` with the voter-journey teardown done.
  - No dev server, Playwright or turbo process is running.
  - Remote `ci-evidence/169-deps` = `59607e5cd`.

## Self-Check: PASSED

- Files exist: `169-11-SUMMARY.md`, `tests/e2e-runs/169-gates/11-t3-ci.json` (12 jobs, all `success`),
  `11-t3-ci-run1.json`, `11-t3-ci-run2.json`, `tests/e2e-runs/169-gates/11/t0-action-releases.tsv`,
  `11/t0-action-inputs.txt`, `11/fix1-lint-norm.txt` (identical to `10/lint-norm-after.txt`).
- Commits exist: `ca501461c` `0f366de0a` `242c5d1a7` `810083443` `32c9336ea` `2e9f5d343` `8fe98ace5` `bba6dc891`
  `82f0991fb` `70c397a8c` `f6bbc68ab` `549f6a60d` `edaa28205` `551157daa`.
- Remote: `origin/ci-evidence/169-deps` = `59607e5cd6b55ed9bc94563ad9a29dd1a31662d0`. No other ref was pushed.
