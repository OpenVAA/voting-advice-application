---
phase: 182-analytics-relay
plan: 16
subsystem: e2e-tracking
tags: [analytics, relay, e2e, playwright, keepalive, umami-removal]
status: complete

requires:
  - phase: 182-26
    provides: the unmounted Umami component; the root layout's flush points (onNavigate, hidden, pagehide)
  - phase: 182-10
    provides: createRelayCapture, the analytics-privacy spec and the analytics-default-standalone project
provides:
  - the Umami browser component, its window stub fixture and the TrackingHandler type deleted
  - tests/tests/specs/voter/voter-prefs-tracking.spec.ts rewritten on relay request capture (five serial tests)
  - a keepalive page-leave test in analytics-privacy.spec.ts with three forms chosen by PLAYWRIGHT_UNLOAD_FORM
  - evidence/16-gates.txt (build, tests typecheck, tests lint and a11y wiring green on 1658c2ac2)
affects: [182-17, 182-19, 182-20, 182-22, 182-23, 182-31]

estimate:
  tokens: 80000
  tasks: 3
actuals:
  tokens: 13800     # chars/4 over the plan's diff outside .planning (55071 chars)
  tasks: 3
  commits: 5        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 7d01d410ef8a1c472151f805eb175872372eee5d
plan_head_after: f8c84f5ab07cf66fe1fa3e61357743a63f4de09a

tech-stack:
  added: []
  patterns:
    - "Flush-until poll: each poll iteration reaches the hidden flush point again, so a first flush made before hydration cannot fail a test"
    - "A distinctive pageview duration marks a test's own relay request apart from the app's batches"
    - "A measuring variable read once at spec load, refusing unknown values with a message that names the allowed ones"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/16-gates.txt
  deleted:
    - apps/frontend/src/lib/components/analytics/umami/UmamiAnalytics.svelte
    - apps/frontend/src/lib/components/analytics/umami/UmamiAnalytics.type.ts
    - apps/frontend/src/lib/components/analytics/umami/index.ts
    - tests/tests/fixtures/shared/trackingIntercept.fixture.ts
  modified:
    - tests/tests/specs/voter/voter-prefs-tracking.spec.ts
    - tests/tests/specs/voter/analytics-privacy.spec.ts
    - tests/playwright.config.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts
    - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
    - apps/frontend/src/lib/server/analytics/providers/index.test.ts
    - tests/README.md
    - tests/tests/fixtures/voter/viewTransitionLog.fixture.ts
    - tests/tests/fixtures/voter/views.ts
    - tests/tests/setup/perm/perm-analytics-tracking.setup.ts
    - tests/tests/utils/privacyAllowlists.test.ts

key-decisions:
  - "Test 2 (before consent) sets a 1280x1600 viewport instead of touching the consent popup, so the test is the same in both consent modes and plan 182-31's free-mode red control fails on the assertion sentence, not on a missing popup"
  - "The page-leave test lives in its own describe, so the three-app journey's beforeAll is not a precondition of it"
  - "The visit-id-not-stored check serialises the whole storage state (cookies, localStorage, IndexedDB with records) plus sessionStorage entries, keys and values, because readDeviceState returns names only"

requirements-completed: []   # RELAY-11/12/14/16 are proven by plan 182-23's run; left to the orchestrator

duration: 15min
completed: 2026-10-19
---

# Phase 182 Plan 16: Umami removal and the tracking spec on relay capture Summary

**The Umami component, its `window.umami` stub fixture and the `TrackingHandler` type are gone. The tracking spec now reads events as `POST` bodies sent to `/api/usage`, in five serial tests. The first test fails with a message naming `ANALYTICS_PROVIDER=log` when nothing reaches the relay. A new keepalive page-leave test has three forms, chosen by `PLAYWRIGHT_UNLOAD_FORM`. Build, tests typecheck, tests lint and the a11y wiring guard are green on 1658c2ac2.**

## Performance

- **Start sha:** `7d01d410ef8a1c472151f805eb175872372eee5d`
- **Gate attempt:** `20261019T180026Z.1658c2ac2` (one attempt, green). File: `tmp/182-evidence/16-gates.20261019T180026Z.1658c2ac2.txt`.
- **Completed:** 2026-10-19T18:02Z
- **Tasks:** 3 of 3

## Accomplishments

### Task 1: deletions, and mentions of the integration

Deleted with `git rm`:
- the three files of `lib/components/analytics/umami/` (the `analytics/` directory is gone too);
- `tests/tests/fixtures/shared/trackingIntercept.fixture.ts`.

**Mentions removed or corrected here.** These matched neither plan 182-17, 182-19 nor 182-22.

| File | What was there | Change |
|------|----------------|--------|
| `lib/contexts/app/tracking/trackingService.type.ts` | `TrackingHandler` and its doc comment | deleted (operator decision, see Deviations) |
| `lib/server/analytics/providers/index.test.ts` | `'umami'` used as the unknown provider name | changed to `'matomo'` |
| `tests/tests/utils/privacyAllowlists.test.ts` | `umami.disabled` used as the unknown localStorage key | changed to `analytics.disabled` |
| `tests/tests/fixtures/voter/viewTransitionLog.fixture.ts` | three comment references to the stub fixture and to `window.umami.track` | reworded to describe the file on its own |
| `tests/tests/fixtures/voter/views.ts` | a comment citing the stub fixture's async factory | reworded |
| `tests/tests/setup/perm/perm-analytics-tracking.setup.ts` | the docblock said events are read "via the trackingIntercept fixture" | now says from relay requests |
| `tests/README.md` | the shared-fixtures list ("All twelve", including the deleted fixture) | now lists the fifteen files present |
| `tests/playwright.config.ts` | the comment above the three `perm-analytics-tracking` projects described the Umami overlay | now says the dataset turns `analytics.trackEvents` on in the shared row, so the spec must not run while another project writes it. No name, dependency or `testMatch` changed. |
| `lib/contexts/utils/persistedState.svelte.ts` | a comment cited the removed tracking `sessionId` | reworded (deferred item) |

**Mentions left for later plans**, from `git grep -n -i umami -- apps packages tests` after the plan:
- **182-17:**
  - `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/privacy.json`, two keys each;
  - `apps/frontend/src/lib/types/generated/translationKey.ts`, two keys.
  - `(voters)/+layout.svelte` reads `analytics.platform`, which is not a textual match.
- **182-19:**
  - `packages/app-shared/src/settings/staticSettings.type.ts`;
  - `packages/app-shared/src/data/schemas/storedSettings.schema.ts` and its test;
  - `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts`;
  - `packages/dev-seed/src/templates/index.ts`: a comment. It is in 182-19's directory but not in its `files_modified`; recorded in `deferred-items.md`.
  - `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`.
- **182-22:** the three `apps/docs` pages (features, static-settings, what-data-should-be-collected).
- `git grep -n -i umami -- tests` prints nothing.

### Task 2: `voter-prefs-tracking.spec.ts`

**Structure.**
- The serial describe is unchanged, and so are its name, the project and the dataset.
- The header is rewritten: events are POST bodies to `RELAY_PATH`, the spec needs `ANALYTICS_PROVIDER=log`, and the "Flushing" section explains how batches are sent.
- `createRelayCapture(context)` is attached in each test before the first navigation.
- Route ids come from the app's own `ROUTE` constants.

**The five tests:**
1. **"the relay is active".** A bounded `expect.poll` flushes again on each iteration. Its message is "no request to the relay path /api/usage was captured: the server must run with ANALYTICS_PROVIDER=log, as .env.example sets it".
2. **"before consent only pageviews are sent, with no id".**
   - The journey is front page, first question, answer, results, flushing until each page's pageview is captured. The results pageview is captured last, so every earlier batch has arrived before the assertions.
   - Assertion: the names that are not `pageview` equal `[]`, with the message "non-pageview events were sent before consent: " followed by the names joined by ", ".
   - Assertion: no event carries an id.
   - Assertion: at least two pageviews were sent.
3. **"after consent the events are sent with the visit id, and nothing buffered before the grant is sent".**
   - Steps: open the front page, open and close the menu (this buffers `menu_open`), grant consent in the popup, start, answer, reach the results.
   - The names include `dataConsent_granted` and `answer`, and do not include `menu_open`.
   - `answer.id` passes `isUuidV7`, imported by relative path from `lib/analytics/uuidv7.ts`.
   - No pageview carries an id.
4. **"the visit id lives for one document".**
   - The grant batch and a later `menu_open` batch carry the same single UUIDv7.
   - After `page.reload()`, a `menu_open` batch carries one different UUIDv7.
   - Neither id appears anywhere in the serialised storage state with IndexedDB, or in the sessionStorage entries.
5. **The preferences round trip.** Its assertions are unchanged. Line-number citations in its helpers' comments became content anchors.

**Removed:** the bundle-key assertion, every `window` global, `__trackCalls` and the stub import.

### Task 3: the page-leave test, and the gates

**The new test.** It is in `describe('the relay at page leave')` in `analytics-privacy.spec.ts`, on the test's own `context` and `page`:
- It attaches the relay capture, arms the form's observer, and opens `/en/`.
- From page context it calls `fetch(RELAY_PATH, { method: 'POST', keepalive: true, credentials: 'omit', headers: { 'content-type': 'application/json' }, body })` without awaiting, then calls `page.goto('about:blank')`.
- The body is one pageview for `ROUTE.Home` with the marker duration 987600, so the test can tell its request from the app's own pagehide batch.
- It asserts that exactly one marked batch is captured and that it equals the body sent (`toStrictEqual`), and that the observed answer is 204.

**`PLAYWRIGHT_UNLOAD_FORM`**, read once at load:
- **Unset or `direct`:** `request.response()` of the marked request, recorded as a status or "no response: …".
- **`route`:** a `context.route` on the relay path calls `route.fetch()`, records the status for the marked body, and fulfils with that response.
- **`direct-no-keepalive`:** the same send with `keepalive: false`.
- **Any other value:** the spec throws at load: "analytics-privacy: PLAYWRIGHT_UNLOAD_FORM must be unset or one of direct, route, direct-no-keepalive; got "bogus"." This was observed with `--list`, exit 1.

## Task Commits

1. `51177cc58` chore(182-16): delete the Umami component and the window stub fixture
2. `a88f59404` test(182-16): observe the tracking spec's events as requests to the relay
3. `49d48a614` refactor(182-16): name the tracking spec's route ids by the app's route constants
4. `1658c2ac2` test(182-16): a keepalive send to the relay as the page is left is captured and answered
5. `f8c84f5ab` docs(182-16): closing build, tests typecheck, tests lint and a11y wiring gates green

## Verification

| Check | Result |
|-------|--------|
| Task 1 `git ls-files` check | exit 0 (nothing tracked) |
| Task 1 umami grep over the owned paths | `git grep` exit 1, so the test passes |
| `git grep -n TrackingHandler -- apps/frontend/src` | exit 1 |
| `yarn eslint tests/tests/specs/voter/voter-prefs-tracking.spec.ts tests/playwright.config.ts` | exit 0; one warning: the config is in the ignore pattern |
| `--list --project voter-prefs-tracking` | exit 0; the five tests listed |
| `grep -q -F 'non-pageview events were sent before consent: '` | exit 0 |
| Task 3 grep (`keepalive: true`, `credentials: 'omit'`, `PLAYWRIGHT_UNLOAD_FORM`) | exit 0 |
| `git grep -n -i umami -- tests` | exit 1 |
| `PLAYWRIGHT_ANALYTICS_STANDALONE=1 … --list --project analytics-default-standalone` | exit 0: 3 analytics-privacy tests, 5 voter-prefs-tracking tests, and the standalone setup/teardown (10 in 4 files) |
| `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics/providers/index.test.ts` | exit 0 (65 tests) |
| `yarn test:unit:tests privacyAllowlists` | exit 0 (23 tests) |
| Closing gates, attempt `20261019T180026Z.1658c2ac2`, on `1658c2ac29fa…`, tree clean before and after, HEAD unchanged | `BUILD_EXIT=0` (14/14 turbo tasks), `TYPECHECK_TESTS_EXIT=0`, `ESLINT_TESTS_EXIT=0`, `A11Y_WIRING_EXIT=0` (0 violations) |
| The plan's record verify (slot `16-gates`) | exit 0; `evidence/16-gates.txt` is `cmp`-equal to the attempt file |
| No `(182-16):` commit lists `tests/scripts/e2e-run.sh` | confirmed (0 for each of the four code commits) |

`yarn eslint tests` printed one warning, which was already there before this plan: an unused `no-console` disable in `tests/tests/support/mockOidcIssuerEntry.ts`. The exit was 0.

No E2E was run, and no stack or dev server was started. The shared stack was not touched.

## Deviations from Plan

1. **[Operator decision] `TrackingHandler` deleted from `trackingService.type.ts`.** The plan text does not name it. The handover and `deferred-items.md` asked for it to go with the Umami directory. Commit `51177cc58`.
2. **[Rule 2, trivially adjacent] The stale `persistedState.svelte.ts` comment was reworded.** This is a comment-only change. The `Object.assign` class comments in the contestant and admin contexts were left, and they stay in `deferred-items.md`: there are several of them, the auth-context one is correct, and v2.16 edits the contestant file. Commit `51177cc58`.
3. **[Plan scope, Task 1] Test values that used the integration's name were changed**, in `providers/index.test.ts` and `privacyAllowlists.test.ts`. The plan's own verifies cover `lib/server` and `tests/`, so these values would have failed them. Stale references to the deleted fixture were also corrected in `tests/README.md`, `viewTransitionLog.fixture.ts`, `views.ts` and the perm setup file. Commit `51177cc58`.
4. **[Spec robustness] `flushTrackingBuffer` now removes its `visibilityState` override and dispatches `visibilitychange` again**, so the page returns to visible. Its doc comment already said it would ("then restore visibility"), but the code never did. Leaving the override in place would have made every later view start hidden. Commit `a88f59404`.
5. **[Spec robustness] Test 2 sets the viewport to 1280x1600.** The consent popup stays open, because no choice is made, and it is a non-modal alert fixed to the bottom of the viewport. Closing it would fail in consent-free mode, where no popup exists, so plan 182-31's red control would fail for the wrong reason. **UNCONFIRMED until 182-23's run:** that a 720 px viewport would really have hidden a control behind the popup. The tall viewport is a precaution.
6. **[Interface] Test 4 does not call `readDeviceState`.** It returns names only, and the plan asks about keys *and values*. The spec serialises `context.storageState({ indexedDB: true })` together with the sessionStorage entries, and checks that neither id appears anywhere in the result.
7. **[Lint] Test 1 inlines its `expect.poll`.** The `playwright/expect-expect` rule rejected the helper form. Test 2 and later tests use the `flushUntil` helper, and each of them also has direct assertions.
8. **[Layout] The page-leave test is in its own describe after the journey describe**, not inside it. That way the journey's `beforeAll` is not a precondition of the test. The plan's wording was "after the two existing ones and on a page of its own", and the file holds three tests as required.

## Notes for 182-17

- The voter layout still pushes the consent popup on `analytics.platform && trackEvents`. When this becomes `shouldShowVoterPrompt`, the spec's assumptions are:
  - in gated mode with no stored choice, the popup opens on `/en/` (tests 3 and 4, and `grantConsentViaPopup`);
  - the granted button's name matches `/agree to share my data/i`.
- Test 2 never touches the popup.

## Notes for 182-23

**Default-mode run (needs `ANALYTICS_PROVIDER=log` on the dev server).**
- A provider-`none` run fails test 1 by name, and tests 2 to 5 do not run (serial).
- `analytics-default-standalone` now has 3 + 5 tests.

**The page-leave forms.** Run the direct form first (`PLAYWRIGHT_UNLOAD_FORM` unset). If it fails with "no response: …", or with `undefined` (no response reported), run `route`. Run `direct-no-keepalive` once as the control. Plan 182-20 then removes the variable.

**Failure texts the poll messages print:**
- direct form: `Received: "no response: …"` or `undefined`;
- route form: the relay's status, or `undefined` if `route.fetch()` threw.

**Things to watch in the first run:**
1. Test 2's tall viewport against any page where the popup still blocks a click.
2. Tests 3 and 4 open the menu through `createNavMenu(page).openMobileNav()` on Desktop Chrome. The toggle is always rendered (`Header.svelte`), and `closeNav()` clicks the first menu item.
3. The relay's same-origin check against `route.fetch()`. Playwright replays the browser's headers, which should include `Sec-Fetch-Site`/`Origin`, but this is not verified.

## Known Stubs

None.

## Threat Flags

None. No product code was added; the deletions remove surface.
- **T-182-66:** mitigated. The component is deleted and the build is green.
- **T-182-67:** mitigated. Test 1's bounded poll names `ANALYTICS_PROVIDER`.
- **T-182-68:** mitigated. Test 2 lists any non-pageview names in its failure text.

## Self-Check: PASSED

- MISSING as intended (deleted): the three Umami files and `trackingIntercept.fixture.ts`.
- FOUND: `voter-prefs-tracking.spec.ts`, `analytics-privacy.spec.ts`, `evidence/16-gates.txt`.
- FOUND commits: `51177cc58`, `a88f59404`, `49d48a614`, `1658c2ac2`, `f8c84f5ab`. Each is an ancestor of HEAD.
