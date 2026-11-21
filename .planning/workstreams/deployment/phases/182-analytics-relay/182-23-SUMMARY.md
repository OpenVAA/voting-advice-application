---
phase: 182-analytics-relay
plan: 23
subsystem: testing
tags: [e2e, playwright, privacy, relay, keepalive, log-provider, green-control, supabase-local]
status: complete

requires:
  - phase: 182-11
    provides: the red control of the two privacy assertions (evidence/11-red-unchanged.txt) and the stack-window attempt protocol
  - phase: 182-16
    provides: the rewritten tracking spec (five serial tests) and the keepalive page-leave test with its three forms
  - phase: 182-17
    provides: the voter consent surfaces on the analytics gate
  - phase: 182-26
    provides: the root layout's relay tracking (view start, flush on navigation, hidden and pagehide)
provides:
  - the green half of the RELAY-12 device-store and origin controls, on the tree after the cutover (evidence/23-green-cutover.txt)
  - the tracking spec green in default mode in a browser, against the relay and the log provider
  - the keepalive form measured (direct form) and the no-keepalive control recorded (necessity not observed)
  - log-provider pageview lines for the voter, Contestant and Admin apps, none with a session id
  - the root layout fix that counts the first page of every document (bfeb9e18c)
affects: [182-18, 182-24, 182-28, 182-29, 182-31]

estimate:
  tokens: 75000
  tasks: 3
actuals:
  tokens: 6965      # chars/4 over the plan's realized diff: 21903 chars of code (06de21b10..e97a38ccf, outside .planning) + 5955 chars of the three records
  tasks: 3
  commits: 1        # MEASURED: git rev-list --count e97a38ccf..HEAD at SUMMARY write (this attempt's records commit); the plan as a whole spans 6 commits, ab4dd5822..1070c0e8e
plan_head_before: e97a38ccfd5dedb8eed213a71b15ac15ff968056
plan_head_after: 1070c0e8eca917c788ba029c1026a4640c6a86b8

tech-stack:
  added: []
  patterns:
    - "A view is started from SvelteKit's `page` state in afterNavigate, never from the navigation's `to`: on the hydration (enter) navigation `to.route.id` is null"
    - "An E2E journey leaves each page only after it has hydrated (settleNetworkIdle) and by a navigation, so the page-hide flush happens"
    - "A consent prompt that would cover the walk is closed without a choice, and the test asserts that no choice is stored"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/23-keepalive-control.txt
    - apps/frontend/src/routes/layout.tracking.svelte.test.ts
  modified:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/23-window.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/23-green-cutover.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/deferred-items.md
    - apps/frontend/src/routes/+layout.svelte
    - tests/tests/specs/voter/voter-prefs-tracking.spec.ts
    - tests/tests/specs/voter/analytics-privacy.spec.ts

key-decisions:
  - "The keepalive test proves arrival in its direct form (UNLOAD_FORM=direct form); the route form was not needed"
  - "The direct-no-keepalive control passed, so keepalive necessity is not observed. The kept test shows capture and arrival, not that the flag is necessary."
  - "The root layout starts the analytics view from page.route.id/page.params, not from afterNavigate's to (bfeb9e18c). This intentionally breaks 182-26's grep for `startPageview(to?.route?.id ?? null, to?.params ?? null)` and its key-link pattern `startPageview\\(to\\?\\.route`."

requirements-completed: []   # left to the orchestrator: RELAY-12 also needs the 182-24/182-28/182-31 runs; RELAY-02/05/14 are observed green here but not marked by this executor

duration: ~12 min for this attempt (19:10Z to 19:22Z); the two E2E runs took about 2 min each
completed: 2026-10-19
---

# Phase 182 Plan 23: The green window after the cutover Summary

**On e97a38ccf, the stand-alone analytics project is green in a browser: 10 of 10 tests pass, with wrapper 0 and verdict 0, on a database the wrapper reset from this worktree.** The two privacy assertions that were red in plan 182-11 now pass: the device store holds no identifier, and every request and script is same-origin. The five relay tracking tests pass, and the keepalive test passes in its direct form. The log provider shows pageviews for all three apps, none with a session id. The no-keepalive control also passed.

**Start sha of this attempt:** `e97a38ccfd5dedb8eed213a71b15ac15ff968056`. Both runs were made on this commit. HEAD did not move until the records commit `1070c0e8e`.

## Results

| Run | Run directory | Wrapper | Verdict | Passed | Failed | Flaky | Skipped | Did not run | db-reset | Probe |
|-----|---------------|---------|---------|--------|--------|-------|---------|-------------|----------|-------|
| Green, direct form (`23-green`) | `tests/e2e-runs/182-23-direct-20261019T191004Z.e97a38ccfd5d` | 0 | 0 | 10 | 0 | 0 | 0 | 0 | yes | t |
| Control, `direct-no-keepalive` (`23-control`) | `tests/e2e-runs/182-23-control-20261019T191004Z.e97a38ccfd5d` | 0 | (not judged) | 10 | 0 | 0 | 0 | 0 | yes | t |

- **Keepalive form:** `UNLOAD_FORM=direct form`.
- **Control:** `CONTROL_KEEPALIVE_TEST=passed` and `KEEPALIVE_NECESSITY=not observed`. This is the plan's accepted outcome. A send made with `keepalive` off as the page was left was still captured and answered with 204.
- **Red and green pair (RELAY-12):** `evidence/11-red-unchanged.txt` recorded these two tests as failing:
  - "every request went to the app or to Supabase, and every script was same-origin", which failed on `cloud.umami.is`;
  - "the device holds only allow-listed state after the journey", which failed on `appContext-sessionId`.

  Both pass here.
- **Log observations** (from the green run's `devserver.log`):
  - There are 21 `pageview` lines: 18 voter, 2 Contestant (`/contestant/login`, `/contestant/privacy`) and 1 Admin (`/admin/login`).
  - `LOG_PAGEVIEW_VOTER`, `LOG_PAGEVIEW_CONTESTANT` and `LOG_PAGEVIEW_ADMIN` are all `yes`.
  - `LOG_PAGEVIEW_WITH_SESSION_ID=0` and `LOG_VAA_SESSION_ID=0`.
- **Schema probe:** `select public.contestant_app_public_config(gen_random_uuid()) ? 'analytics'` printed `t`, via `psql -At` on `127.0.0.1:54322`. It was taken while the wrapper's stack was still up, after each run.

## Window (attempt `20261019T191004Z.e97a38ccfd5d`)

- **Before Task 1:** `yarn db:start`, with no reset, so that the unit gate could reach the stack. The root `.env` sets `SUPABASE_URL`.
- **Task 1:**
  - Local gates on e97a38ccf: `LOCAL_BUILD_EXIT=0`, `LOCAL_UNIT_EXIT=0` and `LOCAL_LINT_EXIT=0`, run in the background with a private `TURBO_CACHE_DIR=tmp/turbo-182-23b`.
  - `PLAYWRIGHT_INSTALL_EXIT=0`, `ENV_FILE=present`, `PORT_FREE=yes` and `SHARED_STACK_RUNNING=yes`, the last checked against the healthy `supabase_db_openvaa-local` container.
  - Task 1's verify exits 0.
  - The earlier attempt `20261019T181232Z.ab4dd582275c` had no `ANSWER_VOIDED=`, so nothing was carried over.
- **Task 2:** The question line `CHECKPOINT_PRESENTED attempt=20261019T191004Z.e97a38ccfd5d head=e97a38ccf…` comes first. Then the operator's standing words, quoted, with the relay note: "standing authorisation given 2026-10-19 for the remaining phase-182 stack windows, relayed by the orchestrator for attempt 20261019T191004Z.e97a38ccfd5d". Then the answer line `OPERATOR_CONFIRMED_STACK_FREE=yes` for the same attempt and head.
- **Task 3:**
  - The answer check exited 0, and `TASK3_STARTED=2026-10-19T19:13:29Z` was appended at once.
  - The tree was clean, and there was no code difference from `LOCAL_GATES_HEAD`.
  - `yarn db:stop` ran at the start and at the end, exiting 0 both times.
  - The records were copied with `cp` after the last tree sample and committed alone in `1070c0e8e`.
  - Task 3's full automated verify, run verbatim after that commit, exits 0.
- **Stack at the end:** stopped. `STACK_STOPPED_AT_END=yes` and `SHARED_DB_RESET_BY_THIS_SESSION=yes`. No dev server, Playwright or Supabase container from this plan is still running.
- **Last line of the window record:** "The v2.16 session must run `yarn db:reset` from its own worktree before it uses the local stack again."

## Previous attempt (red, recorded in `31e4ab8df`)

Window attempt `20261019T181232Z.ab4dd582275c` on `ab4dd5822` ended red, with wrapper 1 and verdict 1. "the relay is active" captured no request to `/api/usage`, the four later serial tests were skipped, and the log provider showed pageviews for the voter app only. A debug session found the causes and fixed them in the four commits below. Diagnostic runs on e97a38ccf were then green 10 out of 10 times.

## Deviations from Plan

### Fixes between the red attempt and this one (each a commit after the red records, as the plan requires)

1. **[Rule 1 - Bug] The first page of every document was never counted.** Commits: `06de21b10` (test), `bfeb9e18c` (fix).
   - **Cause:** On hydration, SvelteKit 2.70.3 calls `afterNavigate` with an `enter` navigation whose `to.route.id` is `null` and which carries no params. So `startPageview(to?.route?.id ?? null, to?.params ?? null)` started no view. The first page's pageview was never sent, and the events buffered on that page were dropped at its first flush. That is why "the relay is active" saw nothing. This was confirmed by a browser probe.
   - **Test (`06de21b10`):** `apps/frontend/src/routes/layout.tracking.svelte.test.ts` mounts the real root layout with the real tracking service and replays the enter navigation. It was red before the fix.
   - **Fix (`bfeb9e18c`):** the layout now calls `startPageview(page.route.id, page.params)`, with `page` from `$app/state`. SvelteKit sets `page` before every `afterNavigate` callback, including enter. The `pageshow` handler already used `page` this way.
   - **Consequence for 182-26:** this commit intentionally breaks 182-26's verify grep for `startPageview(to?.route?.id ?? null, to?.params ?? null)`. It also breaks 182-26's key link "afterNavigate passes to.route.id and to.params to startPageview" (pattern `startPageview\(to\?\.route`). Both are now stale by design. The property they protected still holds and is now tested: a route id and params, never a URL.
2. **[Rule 1 - Bug, spec] "before consent only pageviews are sent, with no id" depended on the viewport.** Commit: `ec1908f2a`.
   - **Cause:** The test relied on a 1280x1600 viewport to keep the consent alert away from the walk. The alert is fixed to the bottom of the viewport, and the intro keeps its Continue button at the bottom too, so the alert's info button took the click whatever the height.
   - **Fix:** the test now closes the prompt with its close button, which records no choice. It asserts that no consent choice is stored, both right after closing and again at the end of the walk.
   - **Free mode** (`ANALYTICS_CONSENT_MODE=free`, the 182-31 red control): the test requires the prompt to be absent once the page has hydrated, and fails with a message that names the variable if a prompt shows. Every earlier assertion is kept.
3. **[Rule 1 - Bug, spec] The privacy journey left Contestant and Admin pages before they had hydrated.** Commit: `e97a38ccf`.
   - **Cause:** The journey moved on as soon as each page's server-rendered test id showed. The Admin login page was left only when the context closed. Neither case sends a pageview, so the log showed no Contestant or Admin pageview.
   - **Fix:** each Contestant and Admin page is now settled with `settleNetworkIdle` before it is left. The Admin login page is loaded twice, so that its page-hide flush happens. The journey still ends on that page.
   - **Not asserted in the spec:** these pageviews. Playwright does not report a keepalive request sent at page hide. The log provider records them, and this window observed them.

### Deviations in this attempt

4. **[Environment] `yarn db:start` before Task 1.** Task 1 says it runs no `yarn db:*`. The orchestrator started the stack first (no reset), because the root `.env` sets `SUPABASE_URL` and the dev-seed integration test in the unit gate fails without a running stack (182-11 deviation 1). `SHARED_STACK_RUNNING=yes` is recorded truthfully.
5. **[Hook] `ENV_FILE` was taken from a directory listing.** The secret-read hook refused `test -f .env` with "Secret read guard: Bash would read '.env' …". Presence was taken from a plain `ls -A` of the worktree root, which reads no content, and the window record says so in an indented line.
6. **[Orchestrator] The answer was relayed, not typed per attempt.** The protocol's resume signal is "stack is free <attempt id>". This attempt instead records the operator's standing words, "I'll keep the stack free, so just continue w the rest of the steps at will", quoted. It adds the note that this is a standing authorisation for the remaining phase-182 windows, relayed by the orchestrator for this attempt id. The `yes` line follows, as the orchestrator instructed. The question, answer and start order, and the binding of the answer to its attempt and head, are unchanged, and the verify checks them.
7. **[Acceptance] `git grep -n -i umami -- tests apps/frontend/src` prints one line.** The hit is `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts:439`. It is a deliberate stray-member fixture (`platform: { name: 'umami', … }`) added in `87ae648f6`, in a file owned by plan 182-19. It is out of scope and not edited here. It is logged in `deferred-items.md` for 182-19.
8. **[Bookkeeping] Extra keys.** The window record also holds `DB_STOP_AT_START_EXIT`, `DB_STOP_AT_END_EXIT`, `SHARED_STACK_RUNNING` and a one-line `GREEN_RUN=`. The control record also holds `COMMAND=`. Each key is written once.

## Notes for later plans

- **182-18 (Contestant opt-out):** its dependency 182-23 is now green. Contestant pageviews reach the log provider only when a page is left after hydration. A spec that observes Contestant analytics should settle each page (`settleNetworkIdle`) before it navigates away. Do not rely on Playwright capturing the page-hide request: it does not report it.
- **182-24 (new specs alone, both modes):**
  - The command form that works is in `evidence/23-green-cutover.txt`: export the variables in the wrapper's background command, then `bash tests/scripts/e2e-run.sh …` on its own line, without `--no-db-reset`.
  - Run Task 1 with the stack up (`yarn db:start` first).
  - The green run took about 20 s of test time, plus the reset and the dev-server start.
  - The tracking spec now closes the consent prompt without a choice in default mode.
- **182-31 (mode red controls):**
  - In free mode, "before consent only pageviews are sent, with no id" first asserts that the prompt is absent after hydration (`ec1908f2a`). It then walks and must fail on "non-pageview events were sent before consent", naming `answer`. That control has not been observed yet.
  - If a prompt does show under `ANALYTICS_CONSENT_MODE=free`, the test fails earlier, with "the consent prompt is shown although ANALYTICS_CONSENT_MODE=free", and that is not the control.
  - Pass `ANALYTICS_CONSENT_MODE` exported in the same wrapper command. The spec reads it from the Playwright process environment.
- **182-26:** its grep and key-link wording for `startPageview(to?.route…)` is intentionally stale after `bfeb9e18c` (deviation 1).
- **v2.16 session:** it must run `yarn db:reset` from its own worktree before it uses the local stack again. The stack is stopped now.

## Known Stubs

None.

## Threat Flags

None. The code change (`bfeb9e18c`) changes where the route id and params of a view are read from and adds no new surface. The view still carries a route id and params only, never a URL.

## Self-Check: PASSED

- FOUND: evidence/23-window.txt, evidence/23-green-cutover.txt, evidence/23-keepalive-control.txt. Each is `cmp`-equal to its current attempt, and Task 3's verify checks this.
- FOUND: commits 31e4ab8df, 06de21b10, bfeb9e18c, ec1908f2a, e97a38ccf and 1070c0e8e on HEAD.
- FOUND: run directories `tests/e2e-runs/182-23-direct-20261019T191004Z.e97a38ccfd5d` and `tests/e2e-runs/182-23-control-20261019T191004Z.e97a38ccfd5d`.

## Correction (182-24, 2026-10-20)

As of `0e343a40d` the keepalive page-leave test in `tests/tests/specs/voter/analytics-privacy.spec.ts` is in the proxy form: its title ends with `(proxy form)`, and it reads the relay's 204 through `startRelayRecordingProxy()`, not as the captured request's own response (the direct form). The reason is a race, confirmed in the 182-24 debug session. Playwright resolves `request.response()` only when the answer arrives before the page is left, never for one that arrives after. In a probe, an answer 50 ms after the leave was reported in 0 of 6 tries; the direct-form test failed 11 of 30 repeats with no response reported, and the proxy form passed 30 of 30. A direct-form pass therefore only shows an answer that came before the leave. For the same reason, the reading of `evidence/23-keepalive-control.txt` is void as a measure of necessity: its values (`CONTROL_KEEPALIVE_TEST=passed`, `KEEPALIVE_NECESSITY=not observed`) still hold as observed, but the direct form cannot see an answer that arrives after the leave, so that control measured nothing about whether a send outlives the page. The evidence files are byte copies of attempt files and are not edited; this paragraph supersedes the statements about the direct form above.
