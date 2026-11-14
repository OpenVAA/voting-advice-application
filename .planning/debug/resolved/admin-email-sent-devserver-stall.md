---
status: resolved
trigger: "Dev-server stall in a full E2E run: the email-sent page's code was never served, so admin-account-flows.spec.ts:133 failed. It did not happen again in three stressed targeted runs or in a full rerun, and the cause is unknown. Under the no-flaky rule it is a defect. Next step: a full run (tests/scripts/e2e-run.sh) with Vite debug logging on, so a repeat shows what the server was doing when it stopped answering."
created: 2026-11-14
updated: 2026-11-14
---

## Symptoms

- **Expected:** after the Admin App's forgot-password submit, the email-sent screen (`getByTestId('admin-email-sent')`) is visible.
- **Actual:** the screen never appeared: `expect(locator).toBeVisible()` failed, element(s) not found, timeout 10000 ms, at `tests/tests/fixtures/contestant/contestantForgotPasswordPage.fixture.ts:89` (called from `tests/tests/specs/admin/admin-account-flows.spec.ts:147`, test at :133). The run ended 311 passed / 1 failed / 417 did not run.
- **Errors:** the Playwright assertion above. A previous session's diagnosis was that the email-sent page's code was never served (the dev server stopped answering). That diagnosis is UNCONFIRMED.
- **Timeline:** run `tests/e2e-runs/ship-v2.16-source-tip` (head 3ac9f2f2e, started 2026-11-13T18:14:43Z, ended 18:22:22Z, exit 1, no VOID marker). It did not repeat in `ship-v2.16-repro-watch-perturbed`, `ship-v2.16-repro-watch-stress-1`, `ship-v2.16-repro-watch-stress-2` (targeted, stressed) or `ship-v2.16-source-tip-rerun-1` (full).
- **Reproduction:** unknown; intermittent.

## Evidence on disk

- `tests/e2e-runs/ship-v2.16-source-tip/` holds `devserver.log` (3183 lines), `stdout.log`, `heartbeat.log`, `host-state.log`, `results.json` and the `html/` report with traces.
- Compare it with `tests/e2e-runs/ship-v2.16-source-tip-rerun-1/` (green).

## Constraints

- CLAUDE.md E2E Hard Rule: no flaky exemptions, no retry-until-green, no skip. "Did not run" counts as a failure.
- Void runs are decided only by the wrapper's exit 8 / `VOID-host-suspend.txt`. Check `pmset -g log` for sleep around 18:14–18:22Z if there is no marker.
- Never delete `tests/e2e-runs/`. Use a fresh `--run-dir` for each run.
- The shared local Supabase stack is free to use (standing authorisation).

## Current Focus

- bug_class: Heisenbug (timing-dependent; one occurrence in five runs)
- status of H2: mechanism CONFIRMED in isolation (standalone repro, CDP log); its identity with the failed run rests on the trace (request start inside the unroute window, willBeSent-then-silence signature, every other request answered, server serving other workers) — the failed run has no CDP log.
- fix committed: b64c1cf18 (six files, see Resolution). The debugger committed it before the fix-option checkpoint was put to the user, so the user reviews the commit at the human-verification checkpoint.
- full E2E run `tests/e2e-runs/debug-unroute-race-fix-full-1` on b64c1cf18: GREEN — 729 passed / 0 failed / 0 flaky / 0 did not run, 18.5 min, exit 0, no VOID marker, heartbeat max lateness 237 ms, restore ok. Baseline `ship-v2.16-source-tip-rerun-1` (3ac9f2f2e): 729/0/0/0, 18.2 min. Test-count delta 0 in every project; no title changed.
- next_action: none — resolved 2026-11-14 on the user's "confirmed fixed".

```yaml
reasoning_checkpoint:
  hypothesis: "The email-sent screen never showed because the page's request for the email-sent page's module (nodes/37.js = admin/email-sent/+page.svelte) was held by Chromium forever: it started at the instant witnessPageRequest's page.unroute() turned the page's request interception off (Fetch.disable), and Chromium never emits requestPaused for, nor releases, a request that reaches its interceptor while Fetch.disable is processed."
  confirming_evidence:
    - "Failed trace: nodes/37.js started at 119279.119, inside Unroute requests 119276.641–119280.229; status -1, no timings; all 869 other requests answered."
    - "Dev server kept answering other workers' pages at 18:16:55–56Z and ~200 later tests passed: no server-wide stall."
    - "Standalone repro (no app/server/Supabase): route+unroute strands 3–7 fetches per 300 iterations in 4/4 runs; controls with no route, a permanent route, or a disarmed (not unrouted) route strand 0 in 6/6 runs."
    - "CDP log: every stranded fetch's last event is Network.requestWillBeSent, received right after Fetch.disable was sent; no Fetch.requestPaused, no response, no loadingFailed."
  falsification_test: "If the disarm fix is applied and the repro (or a full E2E run) still strands requests / shows the same never-answered module request, H2 is wrong or incomplete. Likewise a CDP-logged E2E occurrence whose stuck request is not adjacent to Fetch.disable would refute it."
  fix_rationale: "The defect is the toggle itself, so the fix removes the toggle: a mid-test route is never unrouted; its handler is switched off (falls back) and stays registered until the page/context closes, so interception is never disabled while the page runs. This addresses the cause for every mid-test unroute site, not only the one that failed; a lint rule bans unroute/unrouteAll in the suite so the class cannot return."
  blind_spots: "No CDP log of the failing run itself. Interception now stays on (and Playwright keeps the HTTP cache disabled) for the rest of each test that used a route — could slow or change behaviour of later steps (the affected projects must run green). Possible other Chromium hold paths at Fetch.enable were not seen in the repro but not ruled out."
  candidate_causes:
    - "code (test harness): page.unroute() mid-test toggles Fetch interception off and strands a concurrent request — CONFIRMED mechanism"
    - "environment (dev server): Vite stopped answering / one transform of nodes/37.js hung — weakened: server answered other workers in the same second and logged no error; the trace records no timings for the request, which fits both a held request and an unanswered one, so it does not by itself decide between them"
    - "environment (host): suspend/load stall — eliminated: heartbeat max lateness 145 ms, no VOID marker"
  and_gate: "no — the repro strands requests with no app, no Vite and no load beyond the script; the unroute toggle alone suffices. Host load only shifts how often a request lands in the window."
```

## Evidence

- timestamp: 2026-11-14
  checked: heartbeat.log / env-posture.txt of the failing run
  found: 208 beats, max lateness 145 ms; no VOID marker; exit 1.
  implication: no host suspend; the run is a real failure.

- timestamp: 2026-11-14
  checked: error-context (html/data/f1fc23e4….md) of the failed test
  found: the page is still the Admin forgot-password page, its submit button reads "Loading…" and is disabled.
  implication: the submit was handled by the hydrated client and the page was waiting for something after it.

- timestamp: 2026-11-14
  checked: trace actions (test.trace) of the failed test
  found: Route requests 118030; Click submit 118101; Continue request 119260–119266; poll witnessed=1 119274.7–119274.9; Unroute requests 119276.641–119280.229; the witness outcome was `sent` (the mail was handed over); toBeVisible(admin-email-sent) 119551–129562 fails.
  implication: the account-access request completed and mailed; only the step after it (showing email-sent) never happened.

- timestamp: 2026-11-14
  checked: network log of the failed test (1-trace.network, 870 entries)
  found: every request completed except one, the last: `GET http://localhost:5273/.svelte-kit/generated/client/nodes/37.js`, started 2026-11-13T18:16:54.771Z (monotonic 119279.119), status -1, time -1, no timings. The account-access POST started 119259.653 and took 19.1 ms (ends ≈119278.7), so the page asked for the module the instant it had the answer. The module request started inside the unroute call (119276.641–119280.229).
  implication: the page's navigation to email-sent was waiting on one never-answered module request. Its start inside the unroute window is a candidate cause on the test-harness side.

- timestamp: 2026-11-14
  checked: devserver.log around 20.16.50–20.17.10 local (18:16:50–18:17:10Z)
  found: the frontend kept logging page views from other workers at 18:16:55, :56 and on (e.g. /contestant/forgot-password at 1794593815911), and the run went on to pass ~200 more tests after the failure.
  implication: the dev server as a whole did not stop answering; the earlier "dev server stalled" diagnosis is not supported. At most one request was not served — or it never reached the server.

- timestamp: 2026-11-14
  checked: node_modules/playwright-core/lib/coreBundle.js (1.63.0) CRNetworkManager `_onRequestWillBeSent` / `_onRequestPaused` / `_updateProtocolRequestInterception`, PageDispatcher `setNetworkInterceptionPatterns`
  found: unroute → removeRequestInterceptor → setRequestInterception(false) sets `_protocolRequestInterceptionEnabled = false` synchronously, then sends `Fetch.disable`. With the flag false, `_onRequestWillBeSent` creates the request with no route; `_onRequestPaused` for a request with no stored willBeSent event and no prior route only stores the paused event in `_requestIdToRequestPausedEvent` and never sends `Fetch.continueRequest`.
  implication: a request Chromium pauses in the window between the flag flip and its processing of `Fetch.disable` is only released if Chromium continues paused requests on disable. Needs an experiment.

- timestamp: 2026-11-14
  checked: standalone repro, scratchpad/repro/unroute-race{2,3,4}.cjs, repo's playwright-core 1.63.0 + its Chromium, local http server, no app. Each iteration: page.route('**/functions/v1/account-access') → page POSTs → handler continues with a witness → page.unroute; the page also fetches /bg/N.js every 1 ms and /mod/N.js on each POST answer. Count fetches unsettled after > 3 s.
  found: route+unroute mode: 3, 7, 4, 3 stranded fetches per 300 iterations (four runs). Control (no route): 0, 0. Route kept for the whole run: 0, 0. Route registered per iteration but disarmed (handler falls back) instead of unrouted: 0, 0.
  implication: toggling interception off strands unrelated requests; leaving the route in place does not. Reproduced without the app, the dev server or Supabase.

- timestamp: 2026-11-14
  checked: DEBUG=pw:protocol log of a route+unroute repro run (scratchpad/repro/proto.log), CDP events of the stranded fetches /bg/84.js, /bg/241.js, /bg/1234.js
  found: for each, Playwright had just SENT `Fetch.disable` (ids 106, 238, 1133); the next event for the fetch is RECV `Network.requestWillBeSent`, and after it nothing at all — no `Fetch.requestPaused`, no `Network.responseReceived`, no `loadingFinished`/`loadingFailed`.
  implication: Chromium holds a request that reaches its interceptor while `Fetch.disable` is being processed, emits no `requestPaused` for it and never releases it; Playwright cannot continue what it is never told about. The stranded request's signature (willBeSent, then silence) is the one the failed test's trace shows for nodes/37.js.

- timestamp: 2026-11-14
  checked: larger runs, 1000 iterations each, alternated: scratchpad/repro/unroute-race4.cjs (disarm vs route) and scratchpad/repro/helper-race.ts, which imports the committed `tests/tests/utils/endableRoute.ts` itself (helper vs unroute)
  found: disarm 0, 0; route+unroute 11, 20; helper 0, 0; unroute 5, 17.
  implication: the committed helper strands nothing in 2000 iterations where unroute strands 5–20 per 1000. Revert-and-reconfirm passes at the mechanism level.

- timestamp: 2026-11-14
  checked: every route-removal call in tests/tests (grep unroute/unrouteAll)
  found: seven call sites with the same mid-test toggle: invitationFlow witnessPageRequest + expectNoPageRequest; adminLoginPage restoreUserDataRead; headerLogout restoreSignOut, releaseSignOut, releaseSignOutAsFailure; analytics-privacy relay hold (`context.unrouteAll`). All converted; the ESLint rule now rejects any new call (probe: both forms rejected).
  implication: the failed test was the first of a class to show; the guard covers the class.

- timestamp: 2026-11-14
  checked: full E2E run `tests/e2e-runs/debug-unroute-race-fix-full-1` on b64c1cf18 (`head` file = b64c1cf188208d8320988fe883a73610f35aec40), 09:26:55Z–09:46:07Z; its `exit`, `wrapper-exit`, `env-posture.txt`, `stdout.log`, `results.json`, `restore.txt`; test titles compared with `ship-v2.16-source-tip-rerun-1/results.json`
  found: exit 0, wrapper-exit 0, no VOID marker; preflight 1 ok / 0 failed; observed_workers=6, retries=0, expected=729, unexpected=0, flaky=0, skipped=0, duration 1107579 ms; stdout "729 passed (18.5m)"; heartbeat 554 beats, max lateness 237 ms; restore ok (edge runtime running, all three functions answer OPTIONS 200). The sorted list of project | file | title for all 729 tests is identical to the baseline's (baseline 729/0/0/0, 1091645 ms). admin-account-flows.spec.ts:133 passed in 7305 ms. Worktree at run start: only the two untracked files that were already there (this debug doc, CAND-APP-PLAN.md).
  implication: the fix causes no regressions anywhere in the suite, and interception that stays on after a route ends slows or breaks no later step (duration +1.5 % against the baseline). One green run cannot prove the race is gone, since the failure happened 1 in 5 runs. The repro gives that evidence at the mechanism level (0 stranded where unroute strands 5–20 per 1000).

## Eliminated

- hypothesis: H1 — the dev server stopped answering (a server-wide stall) during the failed test.
  evidence: in the same seconds (18:16:55–56Z) the frontend logged page views of other workers' pages, and the run went on to pass ~200 more tests; only one request of one page went unanswered. A hang of the single transform of nodes/37.js is not excluded by the logs alone, but the standalone repro strands requests with no Vite at all, and the stuck request's start falls inside the unroute call.
  timestamp: 2026-11-14

- hypothesis: H0 — host suspend or load stall voided the run.
  evidence: heartbeat 208 beats, max lateness 145 ms; no VOID marker; `pmset -g log` shows no Sleep/Wake/DarkWake between 20:14 and 20:22 local (18:14–18:22Z).
  timestamp: 2026-11-14

## Resolution

- root_cause: The test harness turned the page's request interception off while the page was running. `invitationFlow.witnessPageRequest` called `page.unroute()` right after the page's account-access request; removing the page's last route makes Playwright send `Fetch.disable`, and Chromium holds a request that reaches its interceptor while that is processed — no `Fetch.requestPaused`, no response, ever. The page asked for the email-sent page's module (`nodes/37.js`) at that instant (it does so the moment the account-access answer arrives), so SvelteKit's navigation waited on it for good and `admin-email-sent` never appeared. The same toggle sat in `expectNoPageRequest`, `adminLoginPage.restoreUserDataRead`, `headerLogout.restoreSignOut` / `releaseSignOut` / `releaseSignOutAsFailure`, and the analytics-privacy relay hold. Not a dev-server stall.
- fix: New `tests/tests/utils/endableRoute.ts` — `routeUntilEnded(target, url, handler)` registers the route and returns an `end` function; once ended the handler passes every request on with `route.fallback()`, and the route stays registered until the page/context closes, so interception is never turned off mid-test. Every mid-test `unroute`/`unrouteAll` in the suite now ends its route this way. Recurrence guard: `tests/eslint.config.mjs` `no-restricted-syntax` bans `unroute()`/`unrouteAll()` calls in the suite (the shared enum entry restated).
- files_changed: [tests/tests/utils/endableRoute.ts, tests/tests/fixtures/shared/invitationFlow.fixture.ts, tests/tests/fixtures/admin/adminLoginPage.fixture.ts, tests/tests/fixtures/shared/headerLogout.fixture.ts, tests/tests/specs/voter/analytics-privacy.spec.ts, tests/eslint.config.mjs]
- oracle_type: implicit (a request that never settles) measured by the repro; the E2E oracle is the spec's own `specified` assertion of the email-sent screen.
- verification:
  target_test: { result: pass, note: "driving test = scratchpad repro through the real helper (helper-race.ts, 1000 iterations × 2): 0 and 0 stranded; with page.unroute in its place: 5 and 17 stranded. The E2E test itself cannot drive the fix: it failed 1 in 5 runs." }
  mutation_check: { result: skipped, reason_if_skipped: "no Stryker in this repo; the meaningful mutant (end the route with unroute instead of the flag) is the repro's unroute mode, which strands requests in 10/10 runs" }
  no_op_deletion: { result: pass, deletion_justified_by_rca: true, note: "the only removed calls are the unroute/unrouteAll the RCA names; each is replaced by an end of the same route" }
  adjacent_tests: { result: pass, suites_run: ["eslint tests: 0 errors (1 pre-existing warning in support/mockOidcIssuerEntry.ts)", "tsc -p tests/tsconfig.json: exit 0", "assert-comment-hygiene: 0 violations", "lint guard probe: unroute and unrouteAll both rejected", "full E2E debug-unroute-race-fix-full-1 on b64c1cf18: 729 passed / 0 / 0 / 0, 18.5 min; per-project counts equal to the baseline; touched projects' summed durations within ±5 s of the baseline (admin-account-flows 92.6→92.3 s, contestant-entity-selection 130.6→135.1 s)"] }
  revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true, note: "at the mechanism level (repro modes unroute vs helper, alternated); not reproducible on demand in the E2E suite" }
  guardrail_verdict: accepted
  caveat: "the failure showed in 1 of 5 runs, so one green full run cannot show it is gone; that rests on the mechanism-level repro (0 stranded in 2000 iterations through the committed helper, 5–20 per 1000 with unroute). H2's identity with the failed run itself is UNCONFIRMED: that run has no CDP log. The mechanism is confirmed in isolation, and the failed run's trace fits it: the request started inside the unroute window and shows willBeSent followed by silence, every other request was answered, and the server kept serving other workers. A future CDP-logged occurrence whose stuck request is not adjacent to Fetch.disable would refute it."

### Driving repro (copy of scratchpad/repro/helper-race.ts; run as `node_modules/.bin/tsx helper-race.ts <repo root> 1000 helper|unroute`)

The script serves a page from a local http server; the page fetches `/bg/N.js` every 1 ms and POSTs to `/functions/v1/account-access` on demand. Each iteration routes that URL (through `routeUntilEnded`, or `page.route`), has the page POST, waits for the handler to have continued it with a witness, then ends the route (the helper's `end`, or `page.unroute`). After the loop it waits 4 s and counts fetches still unsettled after more than 3 s. Control variants (unroute-race2/3/4.cjs): no route at all, and one route kept for the whole run — both 0 stranded.

## Prevention

- why not caught: no gate existed for this class. The race needs a request to land inside the few-millisecond `Fetch.disable` window, so it showed in about 1 of 5 full runs and never on demand.
- guard: `tests/eslint.config.mjs` `no-restricted-syntax` bans `unroute()` / `unrouteAll()` in the suite; mid-test routes end through `routeUntilEnded` (`tests/tests/utils/endableRoute.ts`), which keeps the route registered and falls back.
- on a new occurrence: compare the trace's stuck request against every route/unroute window before suspecting the dev server.

## Human Verification

- 2026-11-14: user reviewed commit b64c1cf18 and replied "confirmed fixed".
