---
phase: 182-analytics-relay
plan: 10
subsystem: e2e-privacy-harness
tags: [analytics, relay, e2e, playwright, privacy, allowlist, storage, origins]
status: complete

requires:
  - phase: 182-03
    provides: RELAY_PATH in apps/frontend/src/lib/analytics/constants.ts (imported by relative path)
  - phase: 182-05
    provides: the analytics projection the later cutover arms; nothing here reads it
provides:
  - tests/tests/utils/privacyAllowlists.ts (ALLOWED_DEVICE_STATE, findUnexpectedDeviceState, ALLOWED_PREFERENCE_MEMBERS, findUnexpectedPreferenceMembers, findThirdPartyRequests, DeviceState, ObservedRequest)
  - tests/tests/fixtures/shared/relayCapture.fixture.ts (createRelayCapture → getBatches/getEvents/getEventNames/clear)
  - tests/tests/fixtures/shared/deviceStores.fixture.ts (readDeviceState, expectOnlyAllowedDeviceState)
  - tests/tests/fixtures/shared/requestOrigins.fixture.ts (attachRequestRecorder, blockForeignOrigins, expectOnlyAllowedOrigins)
  - tests/tests/specs/voter/analytics-privacy.spec.ts (one journey through three apps, two independent tests)
  - three opt-in Playwright projects under PLAYWRIGHT_ANALYTICS_STANDALONE, refused without --project
affects: [182-11 red runs, 182-14 tracking-spec rewrite, 182-20 gate-suite enrolment, 182-30 verdict script]

actuals:
  tokens: 11500     # chars/4 over the three code commits' diff (45961 chars)
  tasks: 2
  commits: 3        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the docs commits follow
plan_head_before: cda43cfb32c8358fc5ee11663150dc02362508f6
plan_head_after: 1d683bd27ff36236de64d94b2f68e7ecc9b87250

tech-stack:
  added: []
  patterns:
    - "Pure privacy cores in tests/tests/utils with vitest specs; thin Playwright fixtures assert their result with toStrictEqual([]) and a message naming offenders"
    - "Context-level request listeners (not page-level) so sends made while a document is left are seen"
    - "Record-then-abort: a context.route aborts third-origin requests while the request listener still records them"
    - "Opt-in projects hoisted out of BASE_PROJECTS so the terminal closed-project node's derived leaf list never includes them"

key-files:
  created:
    - tests/tests/utils/privacyAllowlists.ts
    - tests/tests/utils/privacyAllowlists.test.ts
    - tests/tests/fixtures/shared/relayCapture.fixture.ts
    - tests/tests/fixtures/shared/deviceStores.fixture.ts
    - tests/tests/fixtures/shared/requestOrigins.fixture.ts
    - tests/tests/specs/voter/analytics-privacy.spec.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/10-gates.txt
  modified:
    - tests/playwright.config.ts

key-decisions:
  - "The standalone setup and teardown projects point at the existing perm-analytics-tracking setup/teardown files through testMatch; no analytics-standalone.setup.ts/.teardown.ts was created (no config guard requires one project per file, and the teardown-prefix guard sees no new file)"
  - "The Supabase auth cookies are allowed by shape (^sb-<label>-auth-token(-code-verifier)?(.N)?$), not by a bare sb- prefix, because the label depends on the Supabase URL"
  - "The user-preferences member check is a pure, unit-tested function (findUnexpectedPreferenceMembers), not inline fixture logic"
  - "The standalone guard also refuses a --project value containing a wildcard, since --project '*' would schedule the whole suite beside the standalone setup"

requirements-completed: []

duration: 12min
completed: 2026-10-19
---

# Phase 182 Plan 10: E2E privacy groundwork (relay capture, device-store and origin allowlists, journey spec, standalone projects) Summary

**Pure, unit-tested device-state and origin allowlists (the tracking session id and a third-party script are the two reported violations), a context-level relay-batch capture keyed on the imported `RELAY_PATH`, a record-then-abort origin fixture, a three-app privacy journey spec, and three opt-in standalone Playwright projects that the config refuses in a run that names no project.**

Start sha: `cda43cfb32c8358fc5ee11663150dc02362508f6`

## Performance

- **Duration:** ~12 min
- **Started:** 2026-10-19T10:39:53Z
- **Completed:** 2026-10-19T10:52Z
- **Tasks:** 2
- **Files:** 7 created, 1 modified (plus the gate record)

## Accomplishments

- `findUnexpectedDeviceState` reports `sessionStorage: appContext-sessionId` (and the key in any store), any unknown cookie / localStorage key, and every IndexedDB database; the allowlist is built from `localStorageState(` / `sessionStorageState(` writes, the cookie module, Paraglide's `PARAGLIDE_LOCALE`, SvelteKit's three `sveltekit:*` keys and the `@supabase/ssr` cookie shape.
- `findThirdPartyRequests` reports any origin outside {app, Supabase} and any `script` not from the app origin (a Supabase-origin script is reported); `data:`/`blob:` pass; an unparsable URL is reported; duplicates are listed once. 23 unit tests.
- `createRelayCapture(context)` listens on `context.on('request')`, keeps `POST`s whose path equals the imported `RELAY_PATH`, stores the body at once, and parses lazily (a non-JSON body throws by index). It never routes.
- `readDeviceState` uses `context.storageState({ indexedDB: true })` plus the page's sessionStorage keys; keys of any origin other than the page's are reported with the origin in front. `expectOnlyAllowedDeviceState` also checks the `{ version, data }` envelope of `appContext-userPreferences`.
- `blockForeignOrigins` continues the two origins (and `data:`/`blob:`) and aborts every other request; the recorder still records the aborted ones.
- `analytics-privacy.spec.ts`: journey in `beforeAll` on its own context (voter consent via popup → first question → results; Contestant login and privacy; Admin login), not serial, two independent tests.
- Config: `PLAYWRIGHT_ANALYTICS_STANDALONE` adds `data-setup-analytics-standalone` (no dependencies), `data-teardown-analytics-standalone` (`retries: 0`), `analytics-default-standalone` (voter dir, the two spec files, `fullyParallel: false`, Desktop Chrome). The runner (not workers: `TEST_WORKER_INDEX` unset) throws when the variable is set and no project, or a wildcard project, is named.

## Task Commits

1. **Task 1 RED: the allowlists' specification** - `da7ec9377` (test)
2. **Task 1 GREEN: allowlists + three fixtures** - `2c7d04e86` (feat)
3. **Task 2: journey spec + standalone projects** - `1d683bd27` (feat)

## Verification

| Check | Result |
|-------|--------|
| `yarn test:unit:tests privacyAllowlists` | exit 0, 23 passed |
| `yarn eslint tests/tests/fixtures/shared tests/tests/utils/privacyAllowlists.ts tests/tests/utils/privacyAllowlists.test.ts` | exit 0 |
| `PLAYWRIGHT_ANALYTICS_STANDALONE=1 … --list --project analytics-default-standalone` | exit 0; lists the 2 analytics-privacy tests and the 3 voter-prefs-tracking tests, plus the standalone setup/teardown; no perm spec |
| `PLAYWRIGHT_ANALYTICS_STANDALONE=1 … --list` (no project) | exit 1, prints the guard message |
| `… --list --grep-invert @probe` (default) | exit 0, 530 tests in 123 files, no `analytics-privacy.spec.ts` |
| Closing gates (attempt `20261019T104515Z.1d683bd27`, HEAD `1d683bd27`, tree clean before and after) | `TYPECHECK_TESTS_EXIT=0`, `ESLINT_TESTS_EXIT=0`, `A11Y_WIRING_EXIT=0`; record `evidence/10-gates.txt`; the plan's record verify exits 0 |
| No `(182-10):` commit lists `tests/scripts/e2e-run.sh` | confirmed |

`yarn eslint tests` prints one pre-existing warning (unused `no-console` disable in `tests/tests/support/mockOidcIssuerEntry.ts`); exit 0, not this plan's file.

## Deviations from Plan

1. **[Rule 2 - Correctness] Rigidity-contract wording.** The fixtures' header says "no soft assertion" rather than quoting the `expect.soft` token, so the acceptance criterion "none of the new files contains `expect.soft`" holds literally. Commit `2c7d04e86`.
2. **[Plan intent] The spread lives in a hoisted const appended after `CLOSED_PROJECT_TRIO`, not inside `BASE_PROJECTS`.** Inside `BASE_PROJECTS`, `analytics-default-standalone` would become a derived leaf and the terminal `data-setup-perm-closed-project` would depend on it whenever the variable is set. The guard sits directly above that const. Commit `1d683bd27`.
3. **[Rule 2 - Correctness] The guard also refuses a wildcard `--project`.** `--project '*'` names a project but schedules the whole suite. Commit `1d683bd27`.
4. **[Plan intent, stricter] Device-state reading covers every origin of the storage state.** Keys held by an origin other than the page's are reported as `<origin> <key>`, so they can never be allowed. The plan read "for the app's origin" only. Commit `2c7d04e86`.
5. **[Plan intent] The Supabase origin comes from `process.env.PUBLIC_SUPABASE_URL`, falling back to `SUPABASE_URL`, and the spec throws if neither is set.** The existing harness clients read `SUPABASE_URL` with a literal fallback. The browser uses `PUBLIC_SUPABASE_URL`, and no literal URL is written.
6. **[Plan intent] `grantConsentViaPopup` is a local copy in the new spec.** It is not imported from `voter-prefs-tracking.spec.ts`: importing a spec would register its tests, and that file is not this plan's.

## Notes for later plans / operator

- **182-11 (red runs):** run `PLAYWRIGHT_ANALYTICS_STANDALONE=1 tests/scripts/e2e-run.sh … --project analytics-default-standalone`. Expected reds on the unchanged tree:
  - `sessionStorage: appContext-sessionId` in the device test.
  - `script https://cloud.umami.is/script.js: origin https://cloud.umami.is is not allowed` in the origin test. The request is aborted locally.
- The worker-process guard test (`TEST_WORKER_INDEX`) has not been observed in a real run yet. If a worker throws the guard error, adjust the process test there.
- **IndexedDB is `[ASSUMED]` empty.** If the Supabase client creates a database, the first run names it.
- **Context routing disables the HTTP cache for that context.** This only affects the privacy spec's context.
- **Popup condition:** the journey relies on the voter popup opening on `/en/`. The popup currently keys on `analytics.platform`. Once the cutover changes that condition to the projection, the popup must still open in consent-gated mode with a provider configured, or `grantConsentViaPopup` fails in `beforeAll`.
- **Relay batch type:** `createRelayCapture` types batches locally (`RelayBatch`, `RelayEvent`) to the wire shape `{ routeId, locale, events: [{ name, ago, id?, attributes }] }`. If 182-04's schema changes the wire shape, update these types.
- **Default run:** `analytics-privacy.spec.ts` stays out of the default run until 182-20 enrols it.

## Known Stubs

None.

## Threat Flags

None. The new route handler only aborts or continues inside a test context, and the capture only listens. This is consistent with T-182-41 and T-182-43.

## Self-Check: PASSED

- FOUND: tests/tests/utils/privacyAllowlists.ts, privacyAllowlists.test.ts, fixtures/shared/{relayCapture,deviceStores,requestOrigins}.fixture.ts, specs/voter/analytics-privacy.spec.ts, evidence/10-gates.txt
- FOUND commits: da7ec9377, 2c7d04e86, 1d683bd27 (ancestors of HEAD)
