---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "09"
subsystem: infra
tags: [posthog, analytics, billing, privacy, keychain, operator-inputs]

requires:
  - phase: 188 (plan 08)
    provides: the closed local half (E2E_TREE_SHA, now d523abcd5) and posthog-read.sh with its self-test
  - phase: 185 (plan 11)
    provides: the stored ANALYTICS_POSTHOG_KEY parameter's version and date
provides:
  - "The PostHog project 347462 confirmed as EU, dedicated to staging and owned by the operator (A-01)"
  - "BILLING_LIMIT_RECORDED=yes: a Product analytics limit of 20 USD, set 2026-11-18 (A-02 as overruled)"
  - "PH_ANONYMIZE_IPS=true read back through the API; GeoIP transformation off (B-02)"
  - "A read-only personal API key in keychain item openvaa-staging-posthog-read; all four posthog-read.sh modes answer against the real project (A-04)"
  - "SUPABASE_PLAN=pro, SUPABASE_STEP_CAP=40, SUPABASE_NOTICE_NEEDED=no for plan 188-18 (D-06)"
affects: [188-10, 188-18, 188-19]

actuals:
  tokens: 1650
  tasks: 3
  commits: 9
plan_head_before: 87c2e182464a8956851b9ee953fca017892b3d52
plan_head_after: e0df92e3ce6688a72e11c6a0dc74acc1b60ffce8

tech-stack:
  added: []
  patterns:
    - "Check a keychain secret's format by its prefix inside one command, printing only the prefix class, never a character of the key"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-09-posthog-setup.md
  modified: []

key-decisions:
  - "The Product analytics billing limit is 20 USD, the operator's setting; the plan asked for about 10"
  - "Other PostHog products are left above their lowest levels by the operator's choice (overrule of A-02, 2026-11-19, recorded in 188-CONTEXT.md A-02); the record holds BILLING_OTHER_PRODUCTS=operator-set and the plan's enum check fails on it by design"
  - "The read-back key is a personal API key (phx_, query read and project read, project 347462); the project secret key first stored got 401"

requirements-completed: []

coverage:
  - id: D1
    description: "G1 to G5 and the fill on the record"
    verification:
      - kind: other
        ref: "evidence/188-09-posthog-setup.md; plan Task 3 verify, every check except BILLING_OTHER_PRODUCTS enum"
        status: pass
    human_judgment: true
    rationale: "The answers are the operator's readings of the PostHog and Supabase dashboards; BILLING_OTHER_PRODUCTS=operator-set fails the plan's enum by the operator's overrule, which the verifier must judge against 188-CONTEXT.md A-02"
  - id: D2
    description: "The project discards client IP data, read back through the API"
    verification:
      - kind: other
        ref: "POSTHOG_PERSONAL_API_KEY=<keychain> infra/scripts/posthog-read.sh --project 347462 --mode settings -> ph_anonymize_ips=true, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every read mode answers against the real project before any event is sent"
    verification:
      - kind: other
        ref: "posthog-read.sh --mode window-count / probe-count --probe p188none / privacy over 2026-11-19T07:09:48Z..08:09:48Z, each exit 0, all counts 0"
        status: pass
      - kind: unit
        ref: "yarn test:unit:infra posthog-read (5 tests) and posthog-read.sh --self-test (19 cases)"
        status: pass
    human_judgment: false

duration: 8 min (continuation; the plan spans 2026-11-18T20:17Z to 2026-11-19T08:12Z with the operator checkpoint)
completed: 2026-11-19
status: complete
---

# Phase 188 Plan 09: The PostHog project, its billing limit and the read-back Summary

**PostHog EU project 347462 confirmed dedicated and owned, a 20 USD Product analytics limit recorded, `ph_anonymize_ips=true` read back with a personal API key, and all four `posthog-read.sh` modes answering 0 against the real project before any event is sent.**

## Performance

- **Duration:** about 8 min for this continuation; the plan ran from 2026-11-18T20:17Z (Task 1) to 2026-11-19T08:12Z, most of it the operator checkpoint
- **Tasks:** 3 of 3
- **Files modified:** 1 (the evidence file); `infra/scripts/posthog-read.sh` unchanged

## Accomplishments

- Task 1 (465a2d4ef): the stored key's parameter is the one 185-11 recorded (SecureString, version 1, 2026-11-12T19:36:16.802Z), staging sends nothing (`ANALYTICS_PROVIDER = "none"`), staging health 200, the read script's self-test passes. No parameter value was read.
- Task 2: the operator's answers, bound under attempt `20261118T201819Z.465a2d4ef`. `attempt.sh bound 188-09-2 OPERATOR_REPLY plan=188-09 task=2` exited 0 again before this continuation's reads.
- Task 3 (010f7588b, e0df92e3c): the answers on the record, and the read-back:

| Mode | Exit | Lines |
|------|------|-------|
| `settings` | 0 | `ph_anonymize_ips=true` |
| `window-count` | 0 | `ph_window_events=0` |
| `probe-count --probe p188none` | 0 | `ph_probe_events=0` |
| `privacy` | 0 | all thirteen `ph_*` counts 0 |

The window was the last hour, 2026-11-19T07:09:48Z to 08:09:48Z. Every read's stderr was empty. No HogQL error and no `ph_result=unexpected_shape` was returned, so the query text needed no fix.

## The billing record (A-02)

- **The limit is 20 USD.** The plan asked for about 10 a month. 20 USD is the operator's setting, recorded as given (`BILLING_LIMIT=20`, `BILLING_CURRENCY=USD`, `BILLING_UPGRADE=not-needed`, `PH_PLAN=paid`, `BILLING_SET_ON=2026-11-18`). The raw answer read "0 to 20"; the operator's 2026-11-19 clarification fixed it at 20 USD.
- **`BILLING_TEXT=none found`.** The billing page carries no sentence about what happens at the limit, and the operator found none. The record holds that verbatim, so the plan's "quote the billing page" is met by stating that the page has nothing to quote.
- **Other products: `BILLING_OTHER_PRODUCTS=operator-set`.** The operator deliberately left some other products above their lowest levels (clarification of 2026-11-19). This overrules A-02's "every other product off or at the lowest amount", and the overrule is recorded in 188-CONTEXT.md A-02. The plan's verify checks `^BILLING_OTHER_PRODUCTS=(off|lowest)$` and fails on this line. That failure is expected, and the verify was not edited.

## The read key: a 401, then a personal key

The first read, at 2026-11-19T06:48:26Z, stopped at `ph_query_status=401` on `--mode settings`. Keychain item `openvaa-staging-posthog-read` held a project secret API key (prefix `phs_`), which cannot authenticate PostHog's private API. The other three modes were not run. The operator replaced the item with a personal API key: query read and project read, scoped to project 347462. A prefix-only check found the `phx_` format, and every read then answered. The evidence keeps a dated note of the first read, and `PH_READ_KEY_KIND=personal` replaces `project`. The `READ_MODE_settings_EXIT=1` and `READ_MODE_settings_STATUS=401` lines are gone, so each `grep -qx` finds only the current value. The key was never printed or written. The evidence holds no key and no event content.

## Operator rulings recorded alongside this plan

- **Code sign-in, option (a).** The operator ruled that `code-sign-in` stays outside the per-caller take (188-CONTEXT.md E-03, 6e0aafd67; deferred item 188-05 #2, resolved). The change was built as a deviation recorded under 188-08: 2ee346c83 (the function takes a caller slot for three operations only), c7dc1f32b (the docs) and d523abcd5 (the record). A new full E2E run, `tests/e2e-runs/188-close2-20261119T071844Z`, is green on d523abcd5: 729 passed, 0 failed, 0 did not run. `E2E_TREE_SHA` moved to d523abcd5 in 774d8801f, which 95ba1dd3e marks in 188-08-SUMMARY.md. These six commits fall inside this plan's measured commit range, but they are not this plan's work.
- **The red 188-05 targeted run.** The operator accepted the red targeted run of 188-05 (`tests/e2e-runs/188-05-contestant-identity-provider-20261118T182838Z`). It went red because of `net::ERR_NETWORK_CHANGED` host network aborts, and the same tree then ran green in `...-r2-20261118T183748Z`. The orchestrator relayed this acceptance in the dispatch for this continuation. It is not yet written into `deferred-items.md` item 1, which still reads as open.

## Task Commits

1. **Task 1: Readiness** - `465a2d4ef` (docs)
2. **Task 2: Operator inputs** - checkpoint; no commit of its own
3. **Task 3: Read-back and record** - `010f7588b` (docs, the answers, stopped at 401) and `e0df92e3c` (docs, the read-back with the personal key)

`commits: 9` is measured as `git rev-list --count 87c2e1824..HEAD`. It counts the six deviation commits listed above, from 6e0aafd67 to 95ba1dd3e, which landed between this plan's Task 3 commits.

## Plan Task 3 verify

Run verbatim, the verify exits 1 at `^BILLING_OTHER_PRODUCTS=(off|lowest)$`, as expected. Every other check passes when run one by one:

- The eleven `grep -qx` lines: `PH_REGION=eu`, `PH_DEDICATED=yes`, `PH_OWNER=yes`, `BILLING_LIMIT_RECORDED=yes`, `GEOIP_TRANSFORMATION=off`, `PH_ANONYMIZE_IPS=true`, `FILL=unchanged` and the four `READ_MODE_*_EXIT=0`.
- `PH_PROJECT=347462`, `SUPABASE_PLAN=pro`, `SUPABASE_STEP_CAP=40`, `BILLING_SET_ON=2026-11-18`, `BILLING_SETTING_TEXT` and `BILLING_TEXT`.
- The amount branch of the billing check: 20, not zero, USD, `not-needed`.
- `yarn test:unit:infra posthog-read` (exit 0, 5 tests) and `posthog-read.sh --self-test` (exit 0, 19 cases).

## Deviations from Plan

**1. [Operator overrule] Other products not off or lowest.** Recorded as `BILLING_OTHER_PRODUCTS=operator-set`, under 188-CONTEXT.md A-02. The plan's enum check fails on it. Neither the verify nor the record was changed to hide that.

**2. [Operator setting] The billing limit is 20 USD, not about 10.** The plan allowed for this ("an amount other than about 10 is recorded as given and named in the SUMMARY").

**3. [Auth gate, resolved] Project secret key instead of a personal key.** See § The read key. The operator replaced the key, and no script change was needed.

**Total deviations:** 2 operator rulings and 1 auth gate, no code change. **Impact:** plan 188-10 has `PH_ANONYMIZE_IPS=true` and `BILLING_LIMIT_RECORDED=yes`, which it needs before the provider is switched on.

## Authentication Gates

- Task 3: `--mode settings` answered 401 with a project secret key. The operator stored a personal API key, and the reads then succeeded.

## Issues Encountered

- My first invocation of the three event modes passed `--since`/`--until` as one zsh word, and the script refused it with a usage error (exit 2). This was a fault in how I called it, not in the script. The modes were re-run with separate arguments, and the evidence records only the successful reads.

## User Setup Required

None remaining. The operator did the PostHog and Supabase dashboard steps and stored the keychain item. Plan 188-19 asks whether the personal key is revoked at the end of the phase.

## Next Phase Readiness

Ready for 188-10. The provider may be switched on: the project discards addresses, a billing limit is recorded, and every read the deployed sittings make is known to work. Open for the verifier: the expected enum failure on `BILLING_OTHER_PRODUCTS`, and whether `deferred-items.md` 188-05 item 1 should record the operator's acceptance.

## Self-Check: PASSED

- FOUND: evidence/188-09-posthog-setup.md
- FOUND: 465a2d4ef, 010f7588b, e0df92e3c (ancestors of HEAD)
