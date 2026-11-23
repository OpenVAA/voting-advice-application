---
phase: 191-instance-overlay-upstream
plan: 06
subsystem: phase gate (build identity, repo checks, full E2E)
tags: [instance-overlay, verification, build-identity, e2e, phase-gate]
requires:
  - 191-01 … 191-05 (every source change of the phase)
provides:
  - SC-3 evidence. With no instance overlay the built output equals base 8f2bb68a7, except the AppLogo chunk pair. The complete E2E suite is green.
  - a signed-off 191-VALIDATION.md (nyquist_compliant true, wave_0_complete true)
  - deferred-items.md, listing three host-only unit/lint failures that predate the phase
affects:
  - phase 191 verification and close
tech-stack:
  added: []
  patterns:
    - build identity checked by building both trees at one absolute path and pairing files after replacing content-hash tokens
key-files:
  created:
    - .planning/workstreams/nuorten-2027/phases/191-instance-overlay-upstream/deferred-items.md
    - .planning/workstreams/nuorten-2027/phases/191-instance-overlay-upstream/191-06-SUMMARY.md
  modified:
    - .planning/workstreams/nuorten-2027/phases/191-instance-overlay-upstream/191-VALIDATION.md
decisions:
  - "The full-run reference is the --list of base 8f2bb68a7. The last full-run record (tree d5216b03, 729 tests) is on another line of history (d5216b03 is not an ancestor of 8f2bb68a7, and 160 files under tests/ differ), so it cannot be compared count for count. Base and HEAD list the same 744 tests in 140 files. The gate run is 742: the wrapper drops the 2 @probe tests, as yarn test:e2e does."
  - "The build-identity check pairs files by name and by content after replacing every 8-character content-hash token. Only one client chunk and one server chunk (with its map) differ after that, and both contain AppLogo's static logo tier. The other ~390 differing files only reference a renamed chunk."
  - "The unit and lint failures on this host are not fixed here: tcpForward's blackhole address is refused at once in this sandbox, turbo's strict env mode strips DENO_CERT, and 6 workflow-errexit cases fail. Each fails the same way at base 8f2bb68a7 and touches nothing this phase changed, so they are logged in deferred-items.md under the scope rule."
requirements: [SC-3]
metrics:
  duration: ~100min
  completed: 2026-11-23
  tasks: 2
  files: 3
---

# Phase 191 Plan 06: Phase gate Summary

SC-3 holds for the build and the E2E suite. With no instance overlay, the HEAD build equals base 8f2bb68a7 file for file: identical app-shared `dist/index.js`, Paraglide output, static copy and CSS. The only code difference is AppLogo's `staticSettings.logo` fallback tier, in one client chunk and one server chunk. The complete E2E suite is green, 742/742, with every per-project count equal to the reference. `lint:check` (with turbo forwarding the host's Deno CA variables) and `format:check` exit 0. The unit suites are not fully green on this host: 7 failures predate the phase and fail identically at base.

## Tasks

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | Build-identity comparison against 8f2bb68a7 | none (no tracked files; evidence below and in `tests/e2e-runs/191-06-identity/`) |
| 2 | Repo-wide checks and the phase's full E2E run | 9b6b6710a (191-VALIDATION.md sign-off, deferred-items.md) |

## Task 1: build identity

- `git ls-files instance` = `instance/README.md`. Nothing else is under `instance/`, and `apps/frontend/.instance` does not exist.
- Both trees were built at the same path, `$SCRATCH/identity-tree`: first `git worktree add --detach … 8f2bb68a7`, then HEAD 782a6e5c6. Each got `yarn install --immutable` and `BUILD_SHA=identity yarn build --force --filter=@openvaa/frontend` (11/11 tasks, 0 cached, about 28 s each). Both worktrees were clean after building and were removed. `git worktree list` shows only the main checkout, and `$SCRATCH` is deleted. The script, the pairing output and the diffs are kept in `tests/e2e-runs/191-06-identity/` (gitignored).
- No absolute path appears in either build, so no difference is path-only: `grep -rl identity-tree build` finds 0 files.

| Check | Result |
| ----- | ------ |
| a. `cmp` app-shared `dist/index.js` (and `index.js.map`) | **identical** |
| a′. rest of app-shared `dist` | `.d.ts` differences only: `staticSettings.type.d.ts` (+`.map`) gains the optional `*-content` colours and `logo`, plus TSDoc; `resolveStaticSettings.d.ts` and `staticSettings.schema.d.ts` are new; `tsconfig.tsbuildinfo` differs. These are Plan 01's type seams, and the frontend bundle reads none of them |
| b. `diff -r apps/frontend/src/lib/paraglide` | **identical** |
| c. `diff -r -x _app build/client` (static copy) | **identical** |
| d. `build/client/_app/immutable/assets/*.css` | **identical**: the same 4 names and the same bytes |
| `_app/version.json` (same BUILD_SHA) | identical |
| e. `diff -rq` of `build/client/_app`, `build/server`, `handler.js`, `index.js` | 790 lines: 394 base-only, 398 head-only and 2 differing (`handler.js`, `index.js`). All are explained below |

**Attribution of e** (`norm2.py`: the 934 non-compressed files on each side, paired by name and content after every 8-character content-hash token is replaced, `.js.map` included):
- **926 pairs are equal after normalisation.** These files differ only in the hash of a chunk they import, or in their own hashed filename (`.br`/`.gz` are compressed copies of these). Examples: `server/chunks/nodes/0.js` differs only in the `_layout.svelte.js-<hash>` import and the `_app/immutable/chunks/<hash>.js` list, and `handler.js` differs only in `handler-<hash>.js` and `manifest.js-<hash>.js`. The HEAD `_app/immutable/chunks/DpnDKJbt.js`, which supplies `staticSettings`, keeps its name and bytes. No pair has a different file count.
- **3 files differ in content, and all hold AppLogo:**
  - `client/_app/immutable/chunks/CJMO_eqS.js` → `BJLG0SX_.js`. AppLogo now imports `staticSettings` (`Ot as ye` from `./DpnDKJbt.js`) and gains `isStaticTier`, `logo`, the `dynamic.appName` alt fallback and the `logo.url`/`urlDark` source. Every other line of the diff renames the minifier's single-letter identifiers, which shift because one binding was added; there is no change in logic.
  - `server/chunks/chunks/main.js-Cf-6FptL.js` → `main.js-C7sqFGBC.js`, and its `.map`. The diff is exactly `import { staticSettings, mergeSettings } from "@openvaa/app-shared"` and AppLogo's derived `isStaticTier`/`logo`/`logoSrc`/`inverseSrc`/`alt`, as in Plan 02 Task 2 (1d3ca7eb1).
- No difference has any other cause, so no fix was needed.

## Task 2: repo-wide checks

Logs are in `tests/e2e-runs/191-06-checks/`.

| Command | Exit | Note |
| ------- | ---- | ---- |
| `yarn build` | 0 | |
| `yarn format:check` | 0 | |
| `yarn lint:check` | 1 | It fails only at `@openvaa/supabase#typecheck`: `deno check` gets `UnknownIssuer` from the agent proxy because turbo's strict env mode strips `DENO_CERT`. `yarn typecheck` run directly in `apps/supabase` exits 0. |
| `TURBO_ENV_MODE=loose yarn lint:check` | **0** | Everything passes, including typecheck, `assert:comment-hygiene`, `assert:hosted-settings-parity` and `assert:declared-imports`. |
| `yarn test:unit` | 1 | `assert:unit-coverage` passes and turbo `test:unit` passes all 27 tasks (every workspace, app-shared, frontend and dev-seed among them). `test:unit:tests` then fails 1 of 440: `tcpForward.test.ts` "gives up on an unreachable upstream in BOUNDED time", where elapsed was 404 ms against a lower bound of 550 ms. |
| `yarn test:unit:infra` (run on its own, since the chain above stops before it) | 1 | 6 of 530 fail, all in `infra/scripts/workflow-errexit.test.ts`. |

**Controls at base 8f2bb68a7** (a detached worktree with a fresh install, removed afterwards):
- The tcpForward test fails the same way at base. The cause is the host: `net.connect(9, '198.51.100.1')` is refused after 2 ms (`ECONNREFUSED`) instead of black-holing.
- `yarn test:unit:infra` at base gives the same 6 failures and the same 524 passes.
- No file under `tests/` or `infra/` differs between base and HEAD.

All three host-only failures are in `deferred-items.md`, under the scope-boundary rule. The 7 unit failures mean the plan's "`yarn test:unit` exits 0" is **not met on this host**. That is stated here rather than counted green. Every test this phase added or touched passes.

## Task 2: full E2E run

- **Reference:** the last full-run record (tree d5216b03: 729 passed, 129 projects) is on a different line of history. d5216b03 is not an ancestor of 8f2bb68a7, and 160 files under `tests/` differ between them. As the plan's fallback provides, the reference is therefore the listing. `npx playwright test -c tests/playwright.config.ts --list` at 8f2bb68a7 (base worktree, packages built) and at HEAD both print "Total: 744 tests in 140 files". The two outputs are identical apart from the dotenv tip line (`tests/e2e-runs/191-06-reference/`). The 2 `[_probes]` `@probe` tests drop out under the wrapper's `--grep-invert @probe`, so the gate suite is **742 tests in 129 projects**.
- **Summed deltas of Plans 01–05:** 0. No plan of the phase adds, renames or changes a spec or fixture, and `git diff 8f2bb68a7 HEAD -- tests/` is empty.
- **Slow-host support:** this branch carries it. `tests/playwright.config.ts` runs 3 workers under `E2E_SLOW_HOST=1`, and the run observed `observed_workers=3`.

| Field | Value |
| ----- | ----- |
| Command | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/191-06-full --no-db-reset --no-watch` |
| Tree | HEAD 782a6e5c6 before and after; the only dirty file was `191-VALIDATION.md` (planning), per `worktree-status.txt` |
| Started / ended | 2026-11-23T17:54:03Z / 18:32:56Z ("742 passed (37.9m)") |
| Wrapper exit | **0**; playwright exit 0; preflight failures 0, successes 1; restore ok (db:stop 0, db:start 0, edge runtime running, OPTIONS 200 ×3) |
| Void | **no**: no `VOID-host-suspend.txt`, exit not 8; heartbeat 1135 beats, max late 141 ms |
| `e2e-evidence.mjs` | total 742, passed 742, failed 0, flaky 0, skipped 0, didNotRun 0 (exit 0) |
| `e2e-spec-verdict.mjs` | `VERDICT OK: 742 tests -- passed 742, failed 0, flaky 0, skipped 0, did not run 0` (exit 0) |
| Posture | workers 3, retries 0, `e2e_project_id=00000000-0000-0000-0000-0000000000e2` |
| Title pins | every executed test, keyed (project, spec file, line), equals the reference listing's set: 742 = 742, no key added or missing |
| Red runs | 0; nothing was retried, skipped or marked flaky |

The per-project table counts each project's own tests. The counts in the 191-02..04 tables included their setup dependencies, so they differ from these.

| Project | Reference (8f2bb68a7 listing) | Run (191-06-full) | Delta |
| ------- | --------- | --- | ----- |
| a11y-smoke | 18 | 18 | 0 |
| admin-access | 17 | 17 | 0 |
| admin-account-flows | 25 | 25 | 0 |
| auth-service-contract | 2 | 2 | 0 |
| auth-setup | 2 | 2 | 0 |
| bank-auth | 14 | 14 | 0 |
| cold-entry-dataroot | 3 | 3 | 0 |
| cold-entry-dataroot-contestant | 1 | 1 | 0 |
| contestant-a11y-scan | 34 | 34 | 0 |
| contestant-code-registration | 6 | 6 | 0 |
| contestant-email-registration | 16 | 16 | 0 |
| contestant-entity-selection | 48 | 48 | 0 |
| contestant-entry-phone | 24 | 24 | 0 |
| contestant-entry-scan | 42 | 42 | 0 |
| contestant-identity-provider | 44 | 44 | 0 |
| contestant-journey | 3 | 3 | 0 |
| contestant-password-recovery | 6 | 6 | 0 |
| contestant-terms-gate-phone | 2 | 2 | 0 |
| data-setup-admin-auth | 1 | 1 | 0 |
| data-setup-base | 1 | 1 | 0 |
| data-setup-contestant-journey | 1 | 1 | 0 |
| data-setup-entity-selection | 3 | 3 | 0 |
| data-setup-identity-provider | 1 | 1 | 0 |
| data-setup-passwordless-session | 1 | 1 | 0 |
| data-setup-perm-1e1cg1co | 1 | 1 | 0 |
| data-setup-perm-2e-asymmetric | 1 | 1 | 0 |
| data-setup-perm-2e-shared | 1 | 1 | 0 |
| data-setup-perm-access-disable | 1 | 1 | 0 |
| data-setup-perm-analytics-tracking | 1 | 1 | 0 |
| data-setup-perm-answers-locked | 1 | 1 | 0 |
| data-setup-perm-closed-project | 1 | 1 | 0 |
| data-setup-perm-contestant-nominations | 1 | 1 | 0 |
| data-setup-perm-disable-allow-open | 1 | 1 | 0 |
| data-setup-perm-disable-election-1co | 1 | 1 | 0 |
| data-setup-perm-disable-election-2co | 1 | 1 | 0 |
| data-setup-perm-disjoint-1co | 1 | 1 | 0 |
| data-setup-perm-header-show-help | 1 | 1 | 0 |
| data-setup-perm-hide-all-nominations | 1 | 1 | 0 |
| data-setup-perm-hide-category-tags | 1 | 1 | 0 |
| data-setup-perm-hide-election-tags | 1 | 1 | 0 |
| data-setup-perm-hide-hero | 1 | 1 | 0 |
| data-setup-perm-hide-if-missing-answers | 1 | 1 | 0 |
| data-setup-perm-interactive-info | 1 | 1 | 0 |
| data-setup-perm-localisation-positive | 1 | 1 | 0 |
| data-setup-perm-missing-nominations | 1 | 1 | 0 |
| data-setup-perm-not-located-2e2cg | 1 | 1 | 0 |
| data-setup-perm-org-matching | 1 | 1 | 0 |
| data-setup-perm-organization-editing | 1 | 1 | 0 |
| data-setup-perm-per-app-notifications | 1 | 1 | 0 |
| data-setup-perm-question-video | 1 | 1 | 0 |
| data-setup-perm-show-feedback-survey | 1 | 1 | 0 |
| data-setup-perm-startfromcg | 1 | 1 | 0 |
| data-setup-perm-unnominated-entities | 1 | 1 | 0 |
| data-teardown-admin-access | 1 | 1 | 0 |
| data-teardown-base | 1 | 1 | 0 |
| data-teardown-contestant-journey | 1 | 1 | 0 |
| data-teardown-entity-selection | 1 | 1 | 0 |
| data-teardown-identity-provider | 1 | 1 | 0 |
| data-teardown-passwordless-session | 1 | 1 | 0 |
| data-teardown-perm-1e1cg1co | 1 | 1 | 0 |
| data-teardown-perm-2e-asymmetric | 1 | 1 | 0 |
| data-teardown-perm-2e-shared | 1 | 1 | 0 |
| data-teardown-perm-access-disable | 1 | 1 | 0 |
| data-teardown-perm-analytics-tracking | 1 | 1 | 0 |
| data-teardown-perm-answers-locked | 1 | 1 | 0 |
| data-teardown-perm-closed-project | 1 | 1 | 0 |
| data-teardown-perm-contestant-nominations | 1 | 1 | 0 |
| data-teardown-perm-disable-allow-open | 1 | 1 | 0 |
| data-teardown-perm-disable-election-1co | 1 | 1 | 0 |
| data-teardown-perm-disable-election-2co | 1 | 1 | 0 |
| data-teardown-perm-disjoint-1co | 1 | 1 | 0 |
| data-teardown-perm-header-show-help | 1 | 1 | 0 |
| data-teardown-perm-hide-all-nominations | 1 | 1 | 0 |
| data-teardown-perm-hide-category-tags | 1 | 1 | 0 |
| data-teardown-perm-hide-election-tags | 1 | 1 | 0 |
| data-teardown-perm-hide-hero | 1 | 1 | 0 |
| data-teardown-perm-hide-if-missing-answers | 1 | 1 | 0 |
| data-teardown-perm-interactive-info | 1 | 1 | 0 |
| data-teardown-perm-localisation-positive | 1 | 1 | 0 |
| data-teardown-perm-missing-nominations | 1 | 1 | 0 |
| data-teardown-perm-not-located-2e2cg | 1 | 1 | 0 |
| data-teardown-perm-org-matching | 1 | 1 | 0 |
| data-teardown-perm-organization-editing | 1 | 1 | 0 |
| data-teardown-perm-per-app-notifications | 1 | 1 | 0 |
| data-teardown-perm-question-video | 1 | 1 | 0 |
| data-teardown-perm-show-feedback-survey | 1 | 1 | 0 |
| data-teardown-perm-startfromcg | 1 | 1 | 0 |
| data-teardown-perm-unnominated-entities | 1 | 1 | 0 |
| eperm07-term-trigger | 1 | 1 | 0 |
| invitation-contract | 16 | 16 | 0 |
| invitation-landing | 8 | 8 | 0 |
| performance | 1 | 1 | 0 |
| perm-1e1cg1co | 1 | 1 | 0 |
| perm-2e-asymmetric | 1 | 1 | 0 |
| perm-2e-shared | 2 | 2 | 0 |
| perm-access-disable | 3 | 3 | 0 |
| perm-answers-locked | 6 | 6 | 0 |
| perm-closed-project | 22 | 22 | 0 |
| perm-contestant-nominations | 104 | 104 | 0 |
| perm-disable-allow-open | 3 | 3 | 0 |
| perm-disable-election-1co | 1 | 1 | 0 |
| perm-disable-election-2co | 1 | 1 | 0 |
| perm-disjoint-1co | 2 | 2 | 0 |
| perm-header-show-help | 1 | 1 | 0 |
| perm-hide-all-nominations | 1 | 1 | 0 |
| perm-hide-category-tags | 1 | 1 | 0 |
| perm-hide-election-tags | 1 | 1 | 0 |
| perm-hide-hero | 1 | 1 | 0 |
| perm-hide-if-missing-answers | 1 | 1 | 0 |
| perm-interactive-info | 4 | 4 | 0 |
| perm-localisation-positive | 2 | 2 | 0 |
| perm-missing-nominations | 1 | 1 | 0 |
| perm-not-located-2e2cg | 5 | 5 | 0 |
| perm-org-matching | 3 | 3 | 0 |
| perm-organization-editing | 47 | 47 | 0 |
| perm-per-app-notifications | 2 | 2 | 0 |
| perm-question-video | 4 | 4 | 0 |
| perm-show-feedback-survey | 6 | 6 | 0 |
| perm-startfromcg | 6 | 6 | 0 |
| perm-unnominated-entities | 70 | 70 | 0 |
| storage-cleanup | 3 | 3 | 0 |
| voter-alliance | 1 | 1 | 0 |
| voter-dark-mode | 1 | 1 | 0 |
| voter-journey | 2 | 2 | 0 |
| voter-journey-mobile | 1 | 1 | 0 |
| voter-nominations | 1 | 1 | 0 |
| voter-pageview-only | 1 | 1 | 0 |
| voter-prefs-tracking | 20 | 20 | 0 |
| voter-results-redraw | 5 | 5 | 0 |
| **total (129 projects)** | **742** | **742** | **0** |

### visual-regression (opt-in, outside the default run)

`visual-regression` needs `PLAYWRIGHT_VISUAL=1` and is not in the 742. I ran it the way 191-02 did:

| Run dir | Tree | Result |
| ------- | ---- | ------ |
| `tests/e2e-runs/191-06-visual-regression-host` | HEAD, host wrapper (`PLAYWRIGHT_VISUAL=1 … --project visual-regression`) | **RED**: wrapper exit 1, 4 failed and 4 passed. The four screenshots differ (1280x821 expected against 1280x829 received, 390x924 against 390x903; 13909, 17840, 19826 and 27101 px) |
| `tests/e2e-runs/191-06-visual-regression-control-base` | every non-planning file the phase changed reverted in the working tree to 8f2bb68a7 (24 restored, 17 added files removed), the same command | **RED, identical**: the same 4 failures with the same sizes and pixel counts, and all 12 PNGs in the two HTML reports sha256-identical. On this host the phase changes no rendered pixel. Afterwards the tree was restored with `git checkout HEAD -- …`, and `git diff HEAD` was empty apart from planning files |
| `tests/e2e-runs/191-06-visual-regression-container` | HEAD served with `PUBLIC_PROJECT_ID=…0000e2 yarn workspace @openvaa/frontend dev --host 0.0.0.0` (root `data-project-id` = the E2E id), `tests/scripts/visual-container.sh --ci-literal` in the pinned `mcr.microsoft.com/playwright@sha256:eff16c30…` | **GREEN**: exit 0, 8 passed, 0 unexpected, 0 flaky, 0 skipped, workers 4, retries 0. This is the verdict-bearing run, and the dev server was stopped afterwards |

The host result is red, and that is not counted green. The CI-literal container run is the verdict, and the reverted control shows the host red is independent of the phase.

## Deviations from Plan

### Auto-fixed Issues

None. No product code was changed.

### Other deviations

1. **[Rule 3 - Blocking] Base listing needed built packages.** The first `--list` at 8f2bb68a7 failed with `Cannot find module …/app-shared/dist/index.js`. I ran `yarn build --filter='./packages/*'` in the base worktree and listed again.
2. **Reference choice.** The d5216b03 full-run record cannot be compared with this tree, because the histories diverge. I used the plan's listing fallback and stated it above.
3. **`lint:check` was judged under `TURBO_ENV_MODE=loose`.** The default mode on this host fails only because the proxy CA env vars do not reach Deno, which is a host issue (deferred item 2).
4. **`yarn test:unit` does not exit 0 on this host.** The 1 + 6 failures predate the phase, fail identically at 8f2bb68a7, and lie outside the files the phase touches. They are logged as deferred items 1 and 3 and not fixed here, under the scope-boundary rule.
5. **Task 1 verify, `git status --porcelain` empty:** at verify time the only dirty file was Task 2's `191-VALIDATION.md` edit, which is planning-only and was committed in 9b6b6710a. The HEAD worktree was built from commit 782a6e5c6, so that edit could not affect the comparison.

## Known Stubs

None.

## Threat model

| Threat | Mitigation |
| ------ | ---------- |
| T-191-23 | Void is decided only by the wrapper's marker or exit 8: none here (exit 0, no marker). Did-not-run was 0. Counts were compared against a stated reference (the 8f2bb68a7 listing). |
| T-191-24 | Every differing built file is attributed: 926 pairs are hash-reference-only and 3 files hold AppLogo's static tier (Plan 02). Nothing was left unexplained. |
| T-191-25 | Accepted. Both worktrees lived in the session scratchpad and were removed. |

## Self-Check: PASSED

- FOUND: 191-06-SUMMARY.md, deferred-items.md, 191-VALIDATION.md (nyquist_compliant: true), tests/e2e-runs/191-06-full/results.json, 191-06-visual-regression-container/observed.txt, 191-06-identity/pairing.txt
- FOUND commit: 9b6b6710a
- No scratch worktree left (`git worktree list` shows only the main checkout)
