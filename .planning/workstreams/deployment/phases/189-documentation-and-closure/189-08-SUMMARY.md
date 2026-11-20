---
phase: 189-documentation-and-closure
plan: "08"
subsystem: docs
tags: [docs, supabase, hosted-settings, vitest, guard, probe]
status: complete

requires:
  - phase: 189 (plan 189-04)
    provides: the hosted-settings page with its final title and opening paragraph, in the nav under Deployment
  - phase: 189 (plan 189-05)
    provides: the 2026-11-20 probe row on the persistent project (22 PASS, functions.verify-jwt PASS)
provides:
  - "deployment/hosted-settings: one row per hosted setting the Supabase module writes (52 rows), each with group, setting, value, where the repository sets it, parity class and how to verify it"
  - "infra/scripts/hosted-settings-reference.test.ts: hostedSettingsReferenceProblems, red when a module name is not a backticked token on the page or when the page cites a probe check checks.mjs does not define"
affects: [189-12, 189-20]

actuals:
  tokens: 11730
  tasks: 2
  commits: 5
plan_head_before: 22cfd5bd0e11721b77c69f37be937f7ef0f10ef1
plan_head_after: 094fe0240cba0202f70981b3c8aa708026d79b8a

tech-stack:
  added: []
  patterns:
    - "A docs-completeness guard in the infra suite: names read structurally from the sources (recursive Object.entries over the JSON, one block-scoped regex per HCL source), each block's absence a problem, the page's backticked tokens compared as a set"

key-files:
  created:
    - infra/scripts/hosted-settings-reference.test.ts
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/deferred-items.md
  modified:
    - apps/docs/src/routes/(content)/developers-guide/deployment/hosted-settings/+page.md

key-decisions:
  - "The guard takes the probe's check names from the imported CHECKS registry of checks.mjs rather than a text read of its name: lines; an empty list is a problem naming checks.mjs"
  - "The page does not cite functions.identity-callback-unverified: the plan's recorded-search grep forbids the word unverified on the page, so the 2026-11-20 row names functions.verify-jwt and the 22-check total"
  - "Rate-limit values are given as bare numbers; only rate_limit_email_sent says 'an hour', the one unit the module's own description states"

patterns-established:
  - "A probe check is cited in docs as a backticked token, so the hosted-settings guard catches a renamed or removed check"

requirements-completed: [DOCS-02]

coverage:
  - id: D1
    description: "Every hosted setting the module writes is a row of the reference, and the guard fails the day one is added without a row"
    requirement: DOCS-02
    verification:
      - kind: unit
        ref: "infra/scripts/hosted-settings-reference.test.ts#the hosted-settings reference page in the repository"
        status: pass
      - kind: unit
        ref: "infra/scripts/hosted-settings-reference.test.ts#hostedSettingsReferenceProblems > names mailer_autoconfirm, a false leaf, when the page leaves it out"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each row has its parity class and a how-to-verify cell; every cited probe check exists"
    requirement: DOCS-02
    verification:
      - kind: unit
        ref: "infra/scripts/hosted-settings-reference.test.ts#hostedSettingsReferenceProblems > names a cited probe check that the registry does not define"
        status: pass
      - kind: other
        ref: "Task 2 automated verify (class labels, functions.verify-jwt, IDENTITY_CALLBACK_SERVER_SECRET, prettier, validate:links --check 0 findings, no recorded-search word)"
        status: pass
    human_judgment: false

duration: 21min
completed: 2026-11-20
---

# Phase 189 Plan 08: The hosted-settings reference and its guard Summary

RED_FIRST_MISSING=api, db_schema, db_extra_search_path, max_rows, auth, disable_signup, mailer_autoconfirm, ... (56 names)
INFRA_UNIT_DELTA=+16 (436 -> 452 tests, 16 -> 17 files)
E2E_DELTA=0 (no project affected)

**`deployment/hosted-settings` now has one row for each of the 52 hosted settings the Supabase module writes. Each row gives the setting's group, value, where the repository sets it, its parity-guard class and the probe check or other read that verifies it. A new infra unit test fails if a name the module writes is missing from the page as a backticked token, or if the page cites a probe check that `checks.mjs` does not define.**

## Performance

- **Duration:** about 21 min
- **Started:** 2026-11-20T14:41:18Z
- **Completed:** 2026-11-20T15:02:06Z
- **Tasks:** 2
- **Files modified:** 2 (plus `deferred-items.md`)

## Accomplishments

- **Red run first.** The repository case failed on the page as plan 189-04 left it, naming 56 missing names in source order. They begin `api`, `db_schema`, `db_extra_search_path`, `max_rows`, `auth`, `disable_signup` and `mailer_autoconfirm`. The 56 are the 34 keys of `hosted-settings.json` (five group keys and 29 settings), the 6 keys of `settings.tf`, the 7 rate limits, the 2 SMTP secret keys and the 7 function secrets. The 12 fixture cases passed in the same run.
- **The guard.** `hostedSettingsReferenceProblems` is a pure function:
  - `jsonKeys` walks the JSON with a recursive `Object.entries`, so `false` leaves and `redirect_callback_paths` count and array items do not.
  - One block-scoped reader per HCL source: `auth_origin` and `auth_smtp`, the `auth_rate_limits` object type, the `smtp_secret` `jsonencode`, and `function_secret_names`.
  - An absent page, an absent source, invalid JSON, a missing block or an empty check registry is each a problem that names its file.
  - Names are compared as whole backticked tokens, as a set. Problems are listed in source order.
- **Probe citations.** Every backticked token shaped like a check name (`api.`, `auth.`, `functions.`, `rows.`, `storage.`, `db.` or `no-seed`) must be a `name` in the probe's `CHECKS`.
- **The page.**
  - The table: 52 rows with six columns.
  - Sections under it: the four parity classes; what the module writes and that each resource is the only writer of its settings; what the repository does not set (the project itself, `IDENTITY_CALLBACK_SERVER_SECRET` and the AWS task environment that does not carry it, the identity-provider settings, the platform's `SUPABASE_` secrets, dashboard changes); how to run the probe (Step 23) and the reads it does not cover (a plan reading `No changes`, the Step 18 read-back).
  - The staging instance as observed: 2026-10-23, 2026-11-11, 2026-11-14 and 2026-11-20, each linked to the runbook's Observations.
- **Gates:**
  - Guard 16/16.
  - Infra suite 452/452, exit 0.
  - `validate:links --check`: 0 findings.
  - Prettier, run from `apps/docs`: clean.
  - ESLint on the test file: clean.
  - The rest of `lint:check` after the comment-hygiene guard, run by hand: exit 0. See Issues.

## Task Commits

1. **Task 1: The guard, red on its fixtures and on the page, green with every name** (tracer). TDD:
   - `70ef2f19e` (test): the guard. Its repository case is red, naming 56 names. RED evidence: JUnit, `RED_EVIDENCE_OK`.
   - `9469f0053` (docs): the table with group, setting, value and where-set columns. The guard is green.
   - Tracer gate: interactive mode, `human_verify_mode=end-of-phase`, an automated-only `<verify>`. The verify was re-run after the commit and exited 0, so execution continued.
2. **Task 2: Parity class and how to verify, with the cited checks guarded.** TDD:
   - `580fa7219` (test): the fixture cases for `auth.made-up`, for a page citing only defined checks, and for an empty registry. Red on the intended two cases. RED evidence: JUnit, `RED_EVIDENCE_OK`.
   - `26d34295c` (feat): the check-citation rule in the problems function. Green, 16/16.
   - `094fe0240` (docs): the parity and verify columns, and the sections under the table.

## TDD Gate Compliance

- **RED 1.** Target: `the hosted-settings reference page in the repository > lists every hosted setting the Supabase module writes`. It failed on its `toEqual([])` assertion with 56 problems, each naming a name and its source file. This is the intended reason: the page held only its opening paragraph. Semantic assessment: valid RED.
- **RED 2.** Target: `hostedSettingsReferenceProblems > names a cited probe check that the registry does not define`. It failed with `expected [] to deeply equal [ StringContaining "auth.made-up" ]`, because the function did not yet read check citations. The empty-registry case failed for the same reason. Semantic assessment: valid RED.
- **Reporter.** The TAP reporters were rejected as malformed: vitest writes a multi-line `actual:` string into the YAML block. A JUnit rerun of the same project test command was used instead. The evidence is under `.gsd/tdd-evidence/189-08/`, which is ignored.

## Decisions Made

- Check names come from the imported `CHECKS` array, which is structural and also exercises the module. The plan's text-read alternative was not needed.
- `functions.identity-callback-unverified` is not cited on the page. The Task 2 verify forbids the word `unverified` there, and C-02 lists the check name only as a classified hit.
- Only the email rate limit is given a unit. `variables.tf` states "2 an hour" for that default and no unit for the others.

## Deviations from Plan

None to the plan's behaviour. Two choices within it:

- The `smtp_pass` row's how-to-verify cell says no read prints the value and points to a plan reading `No changes`. Neither the probe nor the Step 18 read-back prints it, and the plan names no read for it.
- The function-secret rows name the Step 18 read-back by name, as the plan says, and also a plan reading `No changes`.

## Issues Encountered

- `yarn lint:check` exits 1 at `yarn assert:comment-hygiene` on a file this plan does not touch: `apps/docs/scripts/generate-navigation-config.ts:432`, a rule 2 forced line break in the TSDoc of `buildSubsectionChildren`, from commit `70e971af7` of plan 189-04. Under the scope rule it was not fixed here and is recorded in `deferred-items.md`. The 18 steps of the chain after the hygiene guard were run by hand and exited 0. Every step before it passed in the same run: turbo lint, the type checks and the i18n and a11y guards.

## Known Stubs

None. Every row's cells are filled; the table has no empty how-to-verify cell.

## Threat Flags

None. The page lists secrets (`smtp_user`, `smtp_pass`, `SMTP_USER`, `SMTP_PASS`, `IDENTITY_CALLBACK_SERVER_SECRET`) by name and source only (T-189-17). It gives no SMTP host, sender address or project ref. The test file reads tracked files and adds no surface.

## User Setup Required

None.

## Next Phase Readiness

Plan 189-12 can point the auth-settings section of other pages to `/developers-guide/deployment/hosted-settings` for every row. The page's path, its 52 rows and the anchors of its sections are final.

---
*Phase: 189-documentation-and-closure*
*Completed: 2026-11-20*

## Self-Check: PASSED

- FOUND: `infra/scripts/hosted-settings-reference.test.ts`, the reference page, `deferred-items.md`
- FOUND: `70ef2f19e`, `9469f0053`, `580fa7219`, `26d34295c`, `094fe0240` are ancestors of HEAD; no commit of the plan deletes a file
