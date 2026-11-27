---
phase: 186-deployed-smoke-entry
plan: "02"
subsystem: testing
tags: [playwright, deployed-smoke, staging, gate, voter, contestant]
status: complete

requires:
  - phase: 186-deployed-smoke-entry
    provides: "186-01: tests/tests/utils/deployedTarget.ts (runDeployedGate, gateFailureMessage, assertSmokeProjects, requireSmokeInputs, DEFAULT_SMOKE_BASE_URL, SMOKE_PROJECT_NAME)"
provides:
  - "tests/playwright.deployed.config.ts: the second Playwright entry (one project deployed-smoke, no env file, retries 0, html open never, json only with an output file, assertSmokeProjects at load)"
  - "tests/deployed-global-setup.ts: the thin adapter that runs the gate on the resolved baseURL before any spec"
  - "tests/tests/deployed/smokeContent.ts: SMOKE_STATEMENTS and SMOKE_ELECTION_COUNT from the smoke template, imported by path"
  - "tests/tests/deployed/voter.smoke.ts: first hosted question to candidate results, green on staging"
  - "tests/tests/deployed/contestant.smoke.ts: password sign-in, complete home, sign-out; fails by name until its inputs exist"
  - "evidence/186-02-entry.md: the voter run, the contestant no-input run, both list totals"
affects: [186-03 import lock, 186-05 controls, 186-06 docs, 186-07 full suite, 186-08 hosted contestant run, 187 pipeline smoke]

actuals:
  tokens: 3706
  tasks: 2
  commits: 2
plan_head_before: c96dfadf23af6ab915fba4fe859eb43c31d7534b
plan_head_after: 5867d1ffd5caaa4e3e2cd77a8d59207ab43a1a06

tech-stack:
  added: []
  patterns:
    - "A second Playwright entry that loads no environment file and needs no input to load; the gate runs in globalSetup and reads baseURL off the resolved config"
    - "Smoke specs compose existing helpers (navigateToFirstQuestion, answerAndAdvanceToResults, the contestant page objects) and import nothing that loads the admin client"
    - "Missing spec inputs fail the one test by name (requireSmokeInputs), never a skip and never a gate check"

key-files:
  created:
    - tests/playwright.deployed.config.ts
    - tests/deployed-global-setup.ts
    - tests/tests/deployed/smokeContent.ts
    - tests/tests/deployed/voter.smoke.ts
    - tests/tests/deployed/contestant.smoke.ts
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-02-entry.md
  modified: []

key-decisions:
  - "The deployed config's JSON reporter is added only when PLAYWRIGHT_JSON_OUTPUT_FILE is set, so a plain --list never prints a JSON report to standard output"
  - "The OK line's build value is the passing sha check's observed value (the served build), the ref and project from the committed tfvars identity"
  - "SMOKE_ELECTION_COUNT and the constituency count are each a fragment's count plus its fixed rows, so a template that moved to fixed rows is still counted"
  - "SUPA-09 stays Pending: the contestant half needs the account of 186-08"

patterns-established:
  - "Smoke run directories are tests/e2e-runs/186-02-<name>-<UTC stamp>, with smoke.log, results.json, html/ and results/ inside"

requirements-completed: []

coverage:
  - id: D1
    description: "The deployed entry loads with no input and lists the smoke specs only"
    requirement: SUPA-09
    verification:
      - kind: other
        ref: "playwright test --list -c tests/playwright.deployed.config.ts --reporter=list -> Total: 2 tests in 2 files"
        status: pass
  - id: D2
    description: "The voter walk on staging, behind four PASS gate lines"
    requirement: SUPA-09
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/186-02-voter-20261114T230211Z; e2e-spec-verdict --passed voter.smoke.ts --no-flaky; evidence/186-02-entry.md"
        status: pass
  - id: D3
    description: "The contestant spec fails by name without its inputs, after the gate"
    requirement: SUPA-09
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/186-02-contestant-noinput-20261114T230317Z; e2e-spec-verdict --failed-test ... --no-other-failures; evidence/186-02-entry.md"
        status: pass
  - id: D4
    description: "The local suite's list is unchanged"
    requirement: SUPA-09
    verification:
      - kind: other
        ref: "playwright test --list -c tests/playwright.config.ts ./tests --grep-invert @probe -> Total: 548 tests in 127 files"
        status: pass

duration: 12min
completed: 2026-11-14
---

# Phase 186 Plan 02: The deployed smoke entry Summary

**A second Playwright entry with a gate in its global setup that proved staging's build SHA, Supabase ref and project id before a voter walked from the first hosted `smoke` question to candidate results (green); and a contestant spec that fails by name, `SMOKE INPUT MISSING`, until 186-08 creates its account.**

## The record

```
VOTER_SMOKE_EXIT=0
PASS service-role-key-absent
PASS sha
PASS ref
PASS project-id
DEPLOYED SMOKE GATE OK build=712947a1bd44a735f66ee8f51610f4748d76cd30 ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001
VOTER_VERDICT_EXIT=0
CONTESTANT_NOINPUT_EXIT=1
CONTESTANT_NOINPUT_VERDICT_EXIT=0
DEPLOYED_LIST=Total: 2 tests in 2 files
LOCAL_LIST=Total: 548 tests in 127 files
```

The checkout's `apps/` and `packages/` equal the deployed tree `712947a1b` (`DEPLOYED_TREE_DIFF=empty`), and staging's `/api/health` served that build. Full record: `evidence/186-02-entry.md`.

## Performance

- **Duration:** about 12 min
- **Completed:** 2026-11-14 (UTC)
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

- `tests/playwright.deployed.config.ts`: `testDir` `tests/tests/deployed`, `testMatch` `.smoke.ts`, one `deployed-smoke` project on Desktop Chrome, `workers: 1`, `fullyParallel: false`, `retries: 0`, trace `retain-on-failure`, html `open: 'never'`, json only with an output file, `assertSmokeProjects` at load. No `dotenv`.
- `tests/deployed-global-setup.ts`: reads `baseURL` off `config.projects[0].use`, runs `runDeployedGate` with `process.env` and the repository root, prints every line, and throws `gateFailureMessage` when a check failed. It creates no client.
- `smokeContent.ts`: the six English statements by `sort_order`, with a `SMOKE CONTENT UNREADABLE` throw at load if the template stops having one election and one constituency or a row loses its English name.
- `voter.smoke.ts`: green on staging in 6.3 s.
- `contestant.smoke.ts`: trace, screenshot and video off for the file. With no inputs it fails in 144 ms, before any page action, naming both variables.

## Task Commits

1. **Task 1: deployed entry, voter walk on staging** - `eef84ccd1` (feat)
2. **Task 2: contestant spec failing by name; both lists** - `5867d1ffd` (feat)

## Deviations from Plan

None. The plan was executed as written.

## Issues Encountered

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information-disclosure | tests/tests/deployed/contestant.smoke.ts | Turning trace, screenshot and video off does not stop Playwright 1.63 from writing `error-context.md` for a failed test. In `node_modules/playwright/lib/index.js`, `_takePageSnapshot` adds an aria snapshot (`page.ariaSnapshot({ mode: "ai" })`) of the open page to that file unless the process environment sets `PLAYWRIGHT_NO_COPY_PROMPT`. If the contestant test fails with credentials while the sign-in form is filled in, the snapshot can include the field values (at least the address). This file sits in the run directory, which is ignored and local tonight but would be a CI artifact in 187. The no-input run here wrote one `error-context.md` that holds only the error and the source, because no page had opened. Not observed with a filled form. For 186-08 and 187: set `PLAYWRIGHT_NO_COPY_PROMPT=1` in the credentialed run form, or check the run's `error-context.md` files for an address before keeping or uploading them. This was not mitigated here because `PLAYWRIGHT_NO_COPY_PROMPT` is an undocumented internal of Playwright. |

## Known Stubs

None.

## Next Phase Readiness

- 186-03 can lock the imports of `tests/tests/deployed/**`, `tests/deployed-global-setup.ts` and the config.
- 186-08 runs `contestant.smoke.ts` with `SMOKE_CONTESTANT_EMAIL` and `SMOKE_CONTESTANT_PASSWORD` from the keychain, after it has created the account. See the threat flag above about `error-context.md`.
- No `test:e2e:deployed` root script was added. The plan's `files_modified` does not include `package.json`. The runs used `node_modules/.bin/playwright test -c tests/playwright.deployed.config.ts`.

## Self-Check: PASSED

All six created files exist; commits `eef84ccd1` and `5867d1ffd` are ancestors of HEAD.
