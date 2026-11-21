---
phase: 182-analytics-relay
plan: 20
subsystem: e2e-tracking
tags: [analytics, relay, e2e, playwright, privacy, gpc, keepalive, proxy, default-run]
status: complete

requires:
  - phase: 182-10
    provides: createRelayCapture, expectOnlyAllowedDeviceState, the request-origin fixtures, the privacy journey and the stand-alone projects
  - phase: 182-16
    provides: the keepalive page-leave test with its three forms, and the tracking spec's flush helpers
  - phase: 182-19
    provides: trackEvents as a dynamic setting with the shipped default false
  - phase: 182-23
    provides: UNLOAD_FORM=direct form, and the finding that Playwright does not report a send made at page hide
provides:
  - analytics-privacy.spec.ts in the default run (project voter-prefs-tracking), six tests
  - tests/tests/fixtures/shared/relayProxy.fixture.ts (startRelayRecordingProxy), which sees page-hide sends and the relay's answer
  - tests/tests/specs/voter/analytics-gpc.spec.ts (Global Privacy Control, with a control describe)
  - tests/tests/specs/voter/voter-pageview-only.spec.ts and the leaf project voter-pageview-only
  - evidence/20-gates.txt (tests typecheck, tests lint and a11y wiring green on 88284585f)
affects: [182-21, 182-24, 182-27, 182-28, 182-31]

estimate:
  tokens: 85000
  tasks: 3
actuals:
  tokens: 15100     # chars/4 over the plan's code diff d973ebbda..88284585f outside .planning (60367 chars)
  tasks: 3
  commits: 4        # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write; the SUMMARY and roadmap commits follow
plan_head_before: d973ebbda7a966c97f2cb1fb7fe533e6c83c60f0
plan_head_after: 073bda65f42945323a73b2073053809c0b91b404

tech-stack:
  added: []
  patterns:
    - "A send made at page hide is observed through a per-context recording HTTP proxy, never through context request events, context.route or a page CDP session, none of which report it"
    - "In a beforeAll journey, flush until a batch is captured without asserting, so that the test that needs the batch fails alone"
    - "A zero-request assertion under a signal is paired with a control describe that shows the prompt and a captured request without the signal"

key-files:
  created:
    - tests/tests/fixtures/shared/relayProxy.fixture.ts
    - tests/tests/specs/voter/analytics-gpc.spec.ts
    - tests/tests/specs/voter/voter-pageview-only.spec.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/20-gates.txt
  modified:
    - tests/tests/specs/voter/analytics-privacy.spec.ts
    - tests/playwright.config.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/deferred-items.md

key-decisions:
  - "The keepalive test keeps only the direct form (the record of plan 182-23), and its title ends with (direct form); PLAYWRIGHT_UNLOAD_FORM and the route and no-keepalive variants are gone"
  - "The application's own send at page leave is observed through a recording forward proxy on its own context, because a probe showed that Playwright reports no page-hide send in any form; the plan's 'proven in the direct form' cannot see it"
  - "The three-app pageview test reads the journey's relay capture; the journey flushes by hand on the Contestant and Admin login pages before leaving them, since their page-hide sends are not reported"
  - "voter-pageview-only is a base leaf and is named in the anchor of data-setup-perm-1e1cg1co"

requirements-completed: []   # left to the orchestrator: these specs are observed only by the runs of 182-24 and 182-28

duration: about 10 min from the start-sha record (19:52Z) to the gate record (20:02Z); the reading and the browser probes came before
completed: 2026-10-19
---

# Phase 182 Plan 20: Default-mode E2E coverage of the relay Summary

**The privacy journey now runs in the default suite inside `voter-prefs-tracking`. It gains three tests: pageviews from all three apps, the application's own send at page leave answered 204, and a results page that renders while relay requests are held open. A Global Privacy Control spec with its own control and a `trackEvents`-off spec in a new base leaf complete the coverage. The keepalive test keeps only its direct form. Tests typecheck, tests lint and the a11y wiring guard are green on `88284585f`. No E2E run was made.**

**Start sha:** `d973ebbda7a966c97f2cb1fb7fe533e6c83c60f0`.

## Accomplishments

### Task 1: the privacy journey in the gate suite (`76932fb4c`)

`analytics-privacy.spec.ts` now holds six tests.

**The journey describe, with three tests that read one journey:**
- The two tests it already had: origins, and device state.
- The new test "pageviews are sent for all three apps":
  - The journey's `beforeAll` attaches `createRelayCapture` before the first navigation.
  - The test asserts at least one captured `pageview` under `VOTER`, one under `CONTESTANT` and one under `ADMIN`, all three constants imported from `route.ts`. No pageview may carry an id.
  - The voter pageviews come from the walk's client navigations.
  - On the Contestant login page and on the Admin login page, the journey reaches the hidden flush point by hand once the page has settled. It does so with `flushTrackingBuffer`, in a bounded loop that asserts nothing, until that app's pageview is captured. Only then does it leave the page.
  - 182-23's settle and reload steps are kept.

**"the relay at page leave":** the keepalive test now has one form.
- Its title ends with `(direct form)`, as recorded in `evidence/23-green-cutover.txt`. The record was checked with `cmp` against the current `23-green` attempt.
- `PLAYWRIGHT_UNLOAD_FORM`, `UNLOAD_FORMS`, the `route` branch and the `direct-no-keepalive` init are deleted. `git grep PLAYWRIGHT_UNLOAD_FORM -- tests` exits 1.

**"the application's own send at page leave arrives":** this test runs on its own context, which goes through `startRelayRecordingProxy()` (see deviation 1). Its steps:
1. Grant consent and answer the dataset's one question. The answer's auto-advance sends the batch with `answer`, and the test asserts it is answered `[204]`. The poll message names `ANALYTICS_PROVIDER=log`.
2. Assert that no batch of the results view was sent before leaving.
3. Call `page.goto('about:blank')`, with no flush by hand.
4. Poll until a results-view batch arrives, then assert that it holds the `pageview` and that every such batch was answered 204.

**"the interface does not wait for the relay":** a `context.route` on `RELAY_PATH` holds every request.
- The test grants consent, answers, and asserts that the results list is visible.
- It then polls until the held batches include the one with `answer`, and checks that the page is still on `/results`.
- At the end it calls `route.continue()` on every held request, then `context.unrouteAll({ behavior: 'wait' })`.

**Config:**
- `voter-prefs-tracking`'s `testMatch` now also collects `analytics-privacy.spec.ts`. Name, `fullyParallel: false`, device and dependency are unchanged.
- A new comment above the project says what it holds. The perm-analytics-tracking comment now speaks of "the specs of the project".

### Task 2: the Global Privacy Control spec (`fce51d5d5`)

**`describe('under Global Privacy Control')`.** It is serial, with `test.use({ extraHTTPHeaders: { 'Sec-GPC': '1' } })` and a `beforeEach` that calls `context.addInitScript` to define `navigator.globalPrivacyControl` as `true`.
- **"no prompt and no send under the signal".**
  - Steps: the front page (hydrated), the first question, the answer that leads to the results, and `/en/privacy` (hydrated). It flushes after each step and asserts that no prompt and no granting control is shown at each one.
  - Then it asserts:
    - the capture holds no batch (`toHaveLength(0)`, and the message lists any batch);
    - `expectOnlyAllowedDeviceState` passes;
    - the stored `appContext-userPreferences` data has no `dataCollection` member.
- **"the privacy page says so".**
  - The privacy content contains the English `privacy.analytics.gpc` text, read from `messages/en/privacy.json` as `perm-closed-project.spec.ts` reads its messages.
  - The page has no "Collecting Usage Data" heading and no granting button.

**`describe('without the signal (control)')`.** It opens the front page and asserts that the prompt dialog's granting button is visible. It then flushes until at least one relay batch is captured, with a message that names `ANALYTICS_PROVIDER=log`.

**Config:** the file is added to the `testMatch` of `voter-prefs-tracking` and of `analytics-default-standalone`. The comment of the stand-alone section names it too.

### Task 3: the trackEvents-off spec and the gates (`88284585f`, `073bda65f`)

**`voter-pageview-only.spec.ts`.** It runs on the base dataset, whose stored settings have no `analytics` member, so `trackEvents` is the shipped default `false`. The spec writes nothing to the database. Its steps:
1. `navigateToFirstQuestion`, then flush until the question's pageview is captured. This first wait carries the `ANALYTICS_PROVIDER` message.
2. Answer by clicking the last choice, which auto-advances, and flush until a new pageview arrives.
3. Skip with `question-next`, and flush until a new pageview arrives.

At each step it asserts that no consent prompt and no granting control is shown. At the end it asserts:
- the capture holds at least 2 events, with the `ANALYTICS_PROVIDER` message;
- every event is a `pageview`, and the failure message lists the others;
- no event has an id.

**Config.** A new leaf project `voter-pageview-only` follows `eperm07-term-trigger`. It uses the voter directory, a `testMatch` on the one file, Desktop Chrome, and a dependency on `data-setup-base`. It is named in the dependency list of `data-setup-perm-1e1cg1co`, and the anchor comment gives the reason. The terminal closed-project node derives its leaf list, so it needs no edit. `voter-pageview-only` is no longer a leaf there, because the perm head depends on it.

## Verification

| Check | Result |
|-------|--------|
| `--list --project voter-prefs-tracking` | exit 0; lists 6 analytics-privacy, 3 analytics-gpc and 5 voter-prefs-tracking tests |
| `yarn eslint` on the Task 1 files | exit 0; the only warning is that the config is in the ignore pattern |
| `git grep -n -e PLAYWRIGHT_UNLOAD_FORM -- tests; test $? -eq 1` | exit 0 |
| Task 1 form verify (the `23-green` pointer, `cmp`, `(direct form)` kept, `(route form)` absent) | exit 0 |
| `PLAYWRIGHT_ANALYTICS_STANDALONE=1 … --list --project analytics-default-standalone` | exit 0; 16 tests in 5 files; analytics-gpc is named |
| `yarn eslint tests/tests/specs/voter/analytics-gpc.spec.ts` | exit 0 (after the fix noted under deviation 4) |
| `--list --project voter-pageview-only` | exit 0; the one test, plus base setup and teardown |
| `--list --grep-invert @probe` (the default run) | exit 0; 542 tests in 126 files. It names analytics-privacy (6), analytics-gpc (3) and voter-pageview-only (1) |
| Comment hygiene, Prettier check on the changed files | 0 violations; clean |
| No `(182-20):` commit lists `tests/scripts/e2e-run.sh` | confirmed, 0 for each of the three code commits |
| Closing gates, attempt `20261019T200054Z.88284585f` on `88284585f`, tree clean before and after, HEAD unchanged | `TYPECHECK_TESTS_EXIT=0`, `ESLINT_TESTS_EXIT=0`, `A11Y_WIRING_EXIT=0` |
| Task 3 record verify (slot `20-gates`) | exit 0, run again after the record commit |

`yarn eslint tests` printed one warning that was already there: an unused `no-console` disable in `tests/tests/support/mockOidcIssuerEntry.ts`. The exit was 0.

The default listing is 542 tests. Plan 182-11's baseline was 530. This plan adds 10. The other 2 come from commits made after 182-11 (the tracking spec went from three tests to five in plan 182-16).

No E2E run was made, and no stack or dev server was started. The shared stack stayed stopped. The browser probes below ran against throwaway Node servers on loopback ports.

## Deviations from Plan

### 1. [Rule 3 - Blocking, plan text stale] The application's own page-leave send is observed through a recording proxy, not in the direct form

- **Found during:** Task 1.
- **The plan's design:** the plan asks for the unload test's 204 to be "proven in the form `evidence/23-green-cutover.txt` records" (the direct form: the captured request's own response).
- **Why it cannot work:** 182-23 recorded that Playwright misses page-hide keepalive sends. A probe here confirmed it, on Playwright 1.63 with Chromium 153 headless shell, using a page that sends a keepalive `fetch` to `/api/usage` on `pagehide` and on `visibilitychange` to hidden:
  - Leaving by `goto('about:blank')`, by a same-origin `goto`, or by `close({ runBeforeUnload: true })`, the context `request` event saw nothing.
  - A `context.route` was never called.
  - A raw page CDP session with `Network.enable` saw no `requestWillBeSent`.
  - The server received every send.
  - So a direct-form test of the app's own page-leave send would always fail.
- **What was done instead:** a per-context forward proxy (`relayProxy.fixture.ts`).
  - It saw the page-hide send and the upstream 204, for both `127.0.0.1` and `localhost` (Playwright proxies loopback).
  - It tunnels `CONNECT`, so a WebSocket such as Vite's live reload opens through it.
  - A cross-origin `fetch` with a preflight passed through it.
  - It records only `POST`s to `RELAY_PATH`, with body and status.
  - All of this was checked in a probe against the fixture file itself.
- **Kept as planned:** the plan's direct-form record still governs the keepalive test, which is the one test that has forms.
- **Commit:** `76932fb4c`.

### 2. [Plan intent] The page-leave batch carries the results view's pageview, not the answer

- **Where:** the new unload test.
- **Why:** in the voter app, a single-choice answer auto-advances by client navigation. That navigation flushes the `answer` together with the question view's pageview while the document is still alive. So the answer can never be left in the buffer until page leave without a timing race.
- **What the test does instead:** it asserts the answer's batch and its 204 first. It then asserts that nothing of the results view was sent before the leave. After the leave, it asserts that the results view's batch, holding its `pageview`, arrived with 204.

### 3. [Plan intent] The journey flushes by hand on the Contestant and Admin login pages

- **Why:** the plan's three-app test reads the journey's relay capture. Contestant and Admin pages are left by full navigations, and those page-hide sends are never captured.
- **What was done:** the journey reaches the hidden flush point on those two pages before leaving them. It uses a bounded loop that asserts nothing, so that a missing pageview fails only the three-app test and not the origin and device tests.

### 4. [Lint] The GPC text is read from the privacy content's test id

- `getByText` is forbidden by `playwright/no-restricted-locators`.
- The privacy page's `voter-privacy-content` is asserted with `toContainText(GPC_TEXT)` instead.
- The zero-capture assertion uses `toHaveLength(0)`, per `playwright/prefer-to-have-length`.

### 5. [Plan scope] A new fixture file outside `files_modified`

`tests/tests/fixtures/shared/relayProxy.fixture.ts` was added for deviation 1. Comment hygiene and lint are green on it.

### 6. [Shared-checkout] The worktree allow-list was not applied

This checkout is a linked worktree whose branch is the operator's integration branch, `feat/deployment-terraform-supabase`, not an `agent-*` branch. The orchestrator directed the work here. The protected-branch check passed: the branch is not protected.

### 7. [Orchestrator instruction] State was not advanced

`state.advance-plan` and `state.record-session` were not run, STATE.md was not edited, and no requirement was ticked.

## Known Stubs

None.

## Deferred Issues

- `relayCapture.fixture.ts` (plan 182-10's file): its header says a context listener sees requests sent on the way out. That is false for page-hide sends. It is logged in `deferred-items.md`; the fix is a comment change only.

## Threat Flags

None for product surface: no product file changed.

The proxy fixture listens on a random port on `127.0.0.1`, only for the length of one test, and forwards only that test's context. It is consistent with T-182-83 to T-182-85:
- **T-182-83:** the GPC control describe, and the `ANALYTICS_PROVIDER` messages.
- **T-182-84:** the leaf is in the perm anchor.
- **T-182-85:** `--list` of the default run names all three files.

## Notes for later plans

- **182-24 (the runs):**
  - `analytics-default-standalone` now collects 3 analytics-gpc tests and 6 analytics-privacy tests. Plan 182-21 adds the Contestant terms spec.
  - `voter-pageview-only` needs `ANALYTICS_PROVIDER=log`, as in the plan's command.
  - **First-run risks, all UNCONFIRMED in a real app run:**
    1. The proxied context goes through Vite dev and Supabase. In the probe, WebSocket `CONNECT` worked.
    2. The assertion "a batch of the results view was sent before the page was left". It assumes nothing flushes the results view before the leave. That holds unless the results page makes a client navigation by itself, and a single-election dataset has none in the code read here.
    3. The Admin login pageview reached by a hand flush.
    4. `navigateToFirstQuestion` on the base dataset, which lands on a single-choice question (Base-1, as in eperm07).
  - In free mode (182-31's `analytics-default-standalone` run), the GPC control fails, because there is no prompt. 182-31's verdict allows other failures.
- **182-21:** the stand-alone `testMatch` is now `/(analytics-privacy|voter-prefs-tracking|analytics-gpc)\.spec\.ts$/`. Add the Contestant terms spec to that alternation, and to `voter-prefs-tracking`'s if it belongs in the default run. `relayProxy.fixture.ts` is available if a Contestant send at page leave must be observed.
- **182-27:** any spec that must observe a send made at page hide needs `startRelayRecordingProxy()`. `createRelayCapture` will not see it.
- **182-28 (full suite):** the default run lists 542 tests. Compare skips with the empty `11-skipped-baseline.txt`; this plan declares no skip.

## Self-Check: PASSED

- FOUND: `tests/tests/fixtures/shared/relayProxy.fixture.ts`, `tests/tests/specs/voter/analytics-gpc.spec.ts`, `tests/tests/specs/voter/voter-pageview-only.spec.ts` and `evidence/20-gates.txt`. The record is `cmp`-equal to the current attempt file.
- FOUND: commits `76932fb4c`, `fce51d5d5`, `88284585f` and `073bda65f`, each an ancestor of HEAD.

## Correction (182-24, 2026-10-20)

As of `0e343a40d` the keepalive page-leave test in `tests/tests/specs/voter/analytics-privacy.spec.ts` is in the proxy form: its title ends with `(proxy form)`, and it reads the relay's 204 through `startRelayRecordingProxy()`, not as the captured request's own response (the direct form). The reason is a race, confirmed in the 182-24 debug session. Playwright resolves `request.response()` only when the answer arrives before the page is left, never for one that arrives after. In a probe, an answer 50 ms after the leave was reported in 0 of 6 tries; the direct-form test failed 11 of 30 repeats with no response reported, and the proxy form passed 30 of 30. A direct-form pass therefore only shows an answer that came before the leave. For the same reason, the reading of `evidence/23-keepalive-control.txt` is void as a measure of necessity: its values (`CONTROL_KEEPALIVE_TEST=passed`, `KEEPALIVE_NECESSITY=not observed`) still hold as observed, but the direct form cannot see an answer that arrives after the leave, so that control measured nothing about whether a send outlives the page. The evidence files are byte copies of attempt files and are not edited; this paragraph supersedes the statements about the direct form above.
