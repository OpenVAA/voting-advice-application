---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 02
subsystem: infra
tags: [supabase, management-api, conformance-probe, vitest, auth-settings, edge-functions, key-model]

requires:
  - phase: 184-01
    provides: "probe entry, readExpected/ProbeInputError, collect/SourceError, CHECKS/runChecks/pasteSafe, api.max-rows"
provides:
  - "Twelve more management-source checks: nine auth.*, api.schemas, functions.deployed, functions.verify-jwt (thirteen with api.max-rows)"
  - "readExpected: publicOrigin, hooks, smtp (tfvars), auth/authHook/authSendEmailHook/redirectPaths/api (JSON), oauthServer and per-function verify_jwt (config.toml), function slugs (directories with index.ts)"
  - "Management reads of /config/auth, /functions, /api-keys?reveal=false and /api-keys/legacy"
  - "keyModelNote and the probe's NOTE key-model: line, outside the verdict"
  - "Spec: correctResponses() builder, BATCHED_BREAK markers and batchedBreak() fixture"
affects: [184-03, 184-17, 184-18, 184-19, 184-23]

tech-stack:
  added: []
  patterns:
    - "JSON-type-aware comparison: a string served for a boolean or number is a finding that names both types"
    - "Findings name numbers, booleans and plain-alphabet strings; address, user-name and credential fields are named by field only"
    - "Reads that only feed a note record their failure in the note and never throw"
    - "config.toml line read records an unreadable key as UNREADABLE; only a reader that needs it fails"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/184-02-SUMMARY.md
  modified:
    - infra/scripts/probe-hosted.mjs
    - infra/scripts/probe/expected.mjs
    - infra/scripts/probe/sources.mjs
    - infra/scripts/probe/checks.mjs
    - infra/scripts/probe-hosted.test.ts

key-decisions:
  - "Findings show plain strings (URLs, ports, schemas, slugs, statuses) so each planted marker is visible; smtp_admin_email, smtp_sender_name and smtp_user are named by field only"
  - "A failed key-model read is printed in the NOTE line as not read and never changes the exit status; a 404 from /api-keys/legacy is 'endpoint gone'"
  - "The batched break also plants hook_send_email_enabled false, since RESEARCH Item 10 lists no fault for auth.send-email-hook"
  - "A field missing from /config/auth stays a SourceError (could not run), as 184-01 set for every named field"

patterns-established:
  - "getJson options: query (in the URL, never in a reason), each (array of objects), presence (<field>_present boolean), notFound (404 returns null)"
  - "A check is a verdict over clauses; each non-null clause is one fault, joined by '; '"

requirements-completed: []

coverage:
  - id: D1
    description: "Each auth fault fails exactly its own check, and the correct responses pass every check"
    requirement: "SUPA-02"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#the auth checks"
        status: pass
    human_judgment: false
  - id: D2
    description: "auth.redirects compares the exact string the module builds; one entry, another order and a space after the comma each fail it"
    requirement: "SUPA-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#fails auth.redirects for one entry, the two in the other order, and a space after the comma"
        status: pass
    human_judgment: false
  - id: D3
    description: "A value of another JSON type than the expected one is a finding (disable_signup \"true\", jwt_exp \"3600\", smtp_port 2587, verify_jwt \"true\")"
    requirement: "SUPA-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#fails auth.signup-closed when sign-up is open, and when true is served as a string"
        status: pass
    human_judgment: false
  - id: D4
    description: "functions.deployed fails on a missing slug, an extra slug and a non-ACTIVE status; an empty list fails only functions.deployed naming all slugs; another order passes; findings are sorted"
    requirement: "SUPA-05"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#the API and function checks"
        status: pass
    human_judgment: false
  - id: D5
    description: "The batched break fails all thirteen checks, each finding holding its marker; the spawned entry exits 1 with thirteen FAIL lines, no COULD NOT RUN, every line paste-safe"
    requirement: "SUPA-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#runs the batched break to exit 1 with thirteen FAIL lines, no COULD NOT RUN and every line paste-safe"
        status: pass
    human_judgment: false
  - id: D6
    description: "The SMTP password, the SMTP user name, the JWT secret and every stub key value never reach stdout or stderr"
    requirement: "SUPA-03"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#expectNoSecret (every entry case) and keeps only the named auth fields"
        status: pass
    human_judgment: false
  - id: D7
    description: "NOTE key-model reads legacy keys enabled / disabled / endpoint gone, and not read on a refused read; the exit status is the checks' alone"
    requirement: "OBS-01"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#prints the legacy keys as enabled, disabled or gone, with the exit status the checks give"
        status: pass
    human_judgment: false

actuals:
  tokens: 22300
  tasks: 2
  commits: 4
plan_head_before: 311dba45eae83c61ec3858139a443ffa04ab1c11
plan_head_after: f88d6661361df011a6532e9efe331982281a4107

duration: 12min
completed: 2026-10-26
status: complete
---

# Phase 184 Plan 02: Management-source checks of the conformance probe Summary

**The probe now runs thirteen checks against the Management API:**

- `api.max-rows`, then nine auth checks: both hooks, site URL, the exact redirect string, sign-up, autoconfirm, SMTP, the oauth flags, and every other key of the JSON `auth` group.
- `api.schemas`, and the deployed functions with their `verify_jwt`.

Every expected value comes from the root's `terraform.tfvars`, `hosted-settings.json`, `config.toml` and the function directories. Each comparison takes the JSON type into account. A batched break of thirteen planted faults fails all thirteen checks, each finding naming its own fault. After the checks, one `NOTE key-model:` line reports the key model without affecting the verdict.

## Performance

- **Duration:** about 12 min
- **Started:** 2026-10-26T13:20:38Z
- **Completed:** 2026-10-26T13:32:08Z
- **Tasks:** 2 (each run as RED then GREEN)
- **Files modified:** 5

## Checks in registry order, with the batched-break planted values and markers (for plan 184-18)

| # | Check | Planted value (batched break) | Marker the finding holds |
|---|-------|-------------------------------|--------------------------|
| 1 | `api.max-rows` | `max_rows` 500 | `500` |
| 2 | `auth.access-token-hook` | `hook_custom_access_token_enabled` false | `hook_custom_access_token_enabled is false` |
| 3 | `auth.send-email-hook` | `hook_send_email_enabled` false | `hook_send_email_enabled is false` |
| 4 | `auth.site-url` | `site_url` `https://planted.invalid` | `planted.invalid` |
| 5 | `auth.redirects` | `uri_allow_list` with only the first entry | `1 entry` |
| 6 | `auth.signup-closed` | `disable_signup` false | `disable_signup is false` |
| 7 | `auth.email-confirm` | `mailer_autoconfirm` true | `mailer_autoconfirm is true` |
| 8 | `auth.smtp` | `smtp_port` "2465" | `2465` |
| 9 | `auth.oauth-server` | `oauth_server_enabled` and `oauth_server_allow_dynamic_registration` true | `oauth_server_enabled is true` |
| 10 | `auth.other-settings` | `password_min_length` 12 | `password_min_length is 12` |
| 11 | `api.schemas` | `db_schema` "public" | `db_schema is "public"` |
| 12 | `functions.deployed` | `send-email` deleted | `send-email` |
| 13 | `functions.verify-jwt` | `identity-callback` served with `verify_jwt` true | `identity-callback` |

Example finding forms:

- `site_url is "https://planted.invalid", expected "https://staging.openvaa.org" from the root's public_origin`
- `disable_signup is the string "true", expected the boolean true from hosted-settings.json`
- `not deployed: send-email; deployed but without a directory in the repository: header-echo`
- `verify_jwt of identity-callback is true, expected false from config.toml`

**Live note for 184-18:**

- `auth.smtp` fails on any root without an `smtp` object ("the root declares no smtp object ..."). The staging root has none today, so a staging run fails `auth.smtp` until that object is added. The plan asks for this behaviour.
- The batched break for `auth.send-email-hook` needs `hook_send_email_enabled = false` in the scratch fault resource. RESEARCH Item 10 lists no fault for this check.

## Accomplishments

- **Expected values (`expected.mjs`):**
  - Reads from `terraform.tfvars`: `public_origin`, the two hook switches (each required) and the multi-line `smtp` object. Comment lines inside the object are allowed; the object may also be absent, which is recorded as null.
  - Reads from the hosted-settings JSON: the `auth`, `auth_hook` and `auth_send_email_hook` groups, `redirect_callback_paths` and the `api` group.
  - Reads from `config.toml`, by a line read in the parity guard's manner: `[auth.oauth_server]`, and the `[functions.<slug>]` `verify_jwt`, which is `true` when absent.
  - Takes the function set to be the directories under `apps/supabase/supabase/functions/` that hold an `index.ts`, sorted.
- **Management reads (`sources.mjs`):**
  - `/config/auth` keeps named fields only. Of `smtp_user` it keeps only the presence boolean `smtp_user_present`, and it never names the password field.
  - `/functions` keeps `slug`, `status` and `verify_jwt` per entry.
  - The key model reads `type` and `name` from `/api-keys?reveal=false`, and `enabled` from `/api-keys/legacy`; a 404 there is recorded as gone.
- **Checks (`checks.mjs`):** twelve new checks with JSON-type-aware `compare`, and `keyModelNote`.
- **Entry (`probe-hosted.mjs`):** the header lists every check and the note, and the entry prints the note after the check lines.
- **Spec:** grows from 17 to 57 tests:
  - one case per behaviour bullet;
  - a fake repository root for the function-directory and `verify_jwt` default rules;
  - the batched break, both as pure functions and through the spawned entry;
  - the key-model cases.

## Task Commits

1. **Task 1: The auth checks**
   - RED `c550cd55c` (test)
   - GREEN `ac917648b` (feat)
2. **Task 2: The API and function checks, and the batched-break fixture**
   - RED `826b66105` (test)
   - GREEN `f88d66613` (feat)

## TDD Gate Compliance

- **Task 1 RED:**
  - Command: `node_modules/.bin/vitest run --config infra/vitest.config.ts --reporter=tap-flat -t "reads the fixture root"`, exit 1.
  - Target: `readExpected > reads the fixture root's origin, hook switches and smtp object`.
  - Classifier: `RED_EVIDENCE_OK` (`target_test_failed`).
  - Semantic assessment: the target ran and failed on `AssertionError: expected undefined to be 'https://probe.example.org'`. This is the planned behaviour, since `readExpected` did not yet return `publicOrigin`. Committed as `c550cd55c`, before any production edit.
- **Task 2 RED:**
  - Command: `... -t "reads the API settings"`, exit 1.
  - Target: `readExpected > reads the API settings, and the functions from the directories that hold an index.ts`.
  - Classifier: `RED_EVIDENCE_OK`.
  - Semantic assessment: the target failed on `expected undefined to be 'public,graphql_public'`, the planned missing `api` group. Committed as `826b66105`, before any production edit.
- **Reporter note:** a whole-suite TAP run is rejected as `invalid_record`, because Vitest's `tap-flat` writes multi-line YAML for object diffs. The target was therefore rerun alone, as the TDD reference allows. One object `toEqual` in the Task 2 target was split into two scalar `toBe` assertions so that its report stays single-line.
- The RED records were kept outside the repository (the session scratchpad) and are not committed.

## Decisions Made

- **Which values a finding may show.** 184-01 allowed numbers only. Findings now also show booleans, and strings that are short, written in a plain alphabet and pass the paste screen. This makes each planted marker visible: `planted.invalid`, `"2465"`, `"public"`, slugs, `"REMOVED"`. The sender address, the sender name and the SMTP user name are named by field only.
- **The key model never decides the exit status.** A refused `/api-keys` read and an unreadable `enabled` both appear in the note as `not read (<reason>)`. The query string `?reveal=false` is kept out of every reason, because its `=` would fail the screen.
- **Missing auth fields.** A field missing from `/config/auth` remains a `SourceError` (COULD NOT RUN), following 184-01's rule for every named field.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] A failed key-model read is recorded in the note, not thrown**
- **Found during:** Task 2
- **Issue:** The plan made only a 404 from `/api-keys/legacy` a non-failure. A 403 or timeout on either key read would have turned a complete check run into COULD NOT RUN, which contradicts "never changes the exit status".
- **Fix:** `readKeyModel` catches `SourceError` from both reads and records `issuedError`/`legacyError`, which the note prints as `not read (...)`. Tested with a stub that answers 403.
- **Files modified:** `infra/scripts/probe/sources.mjs`, `infra/scripts/probe/checks.mjs`
- **Commit:** `f88d66613`

**2. [Rule 3 - Blocking] The config.toml reader tolerates keys it does not need**
- **Found during:** Task 2
- **Issue:** A strict line read over every `[functions.*]` key would fail the whole probe on any future key whose value is not a plain scalar, such as an array.
- **Fix:** `readConfigTables` records such a key, or one written twice, as `UNREADABLE`. Only `readOauthServer`/`readFunctions` raise a `ProbeInputError`, and only when the key they need is unreadable.
- **Files modified:** `infra/scripts/probe/expected.mjs`
- **Commit:** `f88d66613`

**3. [Rule 2 - Missing critical] A planted value for `auth.send-email-hook` in the batched break**
- **Found during:** Task 2
- **Issue:** RESEARCH Item 10 lists no fault for this check, but the plan requires all thirteen checks to fail in the batched break.
- **Fix:** The fixture plants `hook_send_email_enabled` false.
- **Commit:** `826b66105`

**4. [Rule 3 - Lint] ESLint `func-style`**
- Inner arrow functions became function declarations (`origin`, `get`, `plainLabel`).
- **Commits:** `ac917648b`, `f88d66613`

**Total deviations:** 4 auto-fixed (2 missing critical, 1 blocking, 1 lint).
**Impact on plan:** None on the interfaces named in the plan. Each change is additive.

## Issues Encountered

- Vitest's `tap-flat` reporter output is not accepted by the RED classifier when a diff spans several lines. This was resolved by rerunning the target test alone (see TDD Gate Compliance).

## Deferred to orchestrator (stack busy)

- The full `yarn test:unit` was not run, under the shared-stack rule. The plan's gate is the infra Vitest suite alone, and it is green. This plan changes only `infra/scripts/probe*`, which `yarn test:unit` reaches through `test:unit:infra`.

## Verification

- `node_modules/.bin/vitest run --config infra/vitest.config.ts`: exit 0, 57 passed.
- `eslint` over `infra/scripts/probe`, `probe-hosted.mjs` and `probe-hosted.test.ts`: exit 0.
- `prettier --check` over the same files: clean.
- Acceptance greps:
  - auth check names in `checks.mjs`: 9;
  - `smtp_pass` in `sources.mjs`: 0;
  - `oauth_server` in `expected.mjs`: 5;
  - api/functions check names: 3;
  - `index.ts` in `expected.mjs`: 4;
  - the spec holds the batched-break case and its spawned run (exit 1, thirteen FAIL lines).
- Comment-hygiene scan of the added lines under `infra/`: no planning references or history narrative.

## Known Stubs

None.

## User Setup Required

None. The probe contacts no hosted project; live runs are later plans.

## Next Phase Readiness

- 184-03 adds the public-API and catalog sources to `SOURCES` and their checks to `CHECKS`. The entry already prints the key-model note only when the management source was read.
- 184-18 can take the table above as its planted-fault list for the management checks.

---
*Phase: 184-hosted-supabase-measurement-and-conformance-probe*
*Completed: 2026-10-26*

## Self-Check: PASSED

All five modified files exist; commits c550cd55c, ac917648b, 826b66105 and f88d66613 are ancestors of HEAD.
