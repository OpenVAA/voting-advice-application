---
phase: 189-documentation-and-closure
plan: "09"
subsystem: docs
tags: [docs, env, vitest, guard, proxy, analytics, bootstrap]
status: complete

requires:
  - phase: 189 (plan 189-02)
    provides: the two frontend-URL variables removed from code, so the page drops them
  - phase: 189 (plan 189-08)
    provides: the sibling guard shape (backticked-token set, each absent source a problem)
provides:
  - "configuration/environmental-variables grouped by role (required at start, `PUBLIC_PROJECT_ID`, proxy, timeouts, analytics, logging and diagnostics, identity provider, Edge Functions, bootstrap, admin app, local only), a table or line per variable with reader, default when unset and where a deployment sets it"
  - "apps/frontend/src/lib/server/startup/environmentReference.test.ts: environmentReferenceProblems, red when a name of task-environment.json, REQUIRED_ENV, ANALYTICS_ENV or a \\getenv read of bootstrap.sql is not a whole backticked token on the page"
affects: [189-12, 189-20]

actuals:
  tokens: 10368
  tasks: 2
  commits: 2
plan_head_before: 45b0f2fb25f40dca37aac58889b187c5591c7657
plan_head_after: bcf71cba99de80c8285e27b66a6f423405e4f197

tech-stack:
  added: []
  patterns:
    - "A docs-completeness guard in the frontend suite: names from a JSON list, two imported constants and a script's \\getenv lines; the page's backticked tokens compared as a set; each absent source file a problem naming it"

key-files:
  created:
    - apps/frontend/src/lib/server/startup/environmentReference.test.ts
  modified:
    - apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md

key-decisions:
  - "The guard also requires the eight \\getenv names of bootstrap.sql (PUBLIC_PROJECT_ID, SUPABASE_SERVICE_ROLE_KEY and six BOOTSTRAP_*), read from the script's \\getenv lines rather than its header comment"
  - "Two role sections beyond the plan's list, Edge Functions (SITE_URL, SMTP_*) and Admin app (LLM_OPENAI_API_KEY), so no variable the page listed before loses its place; SMTP_USER and SMTP_PASS are added, which the Supabase module writes as function secrets"
  - "The `## PUBLIC_PROJECT_ID` heading is kept at level 2 (troubleshooting links #public_project_id); it lists three readers: the frontend, send-email, the bootstrap script"
  - "DOCS-04 is marked complete: the page covers the proxy variables, the analytics variables and PUBLIC_PROJECT_ID, and the guard keeps it in step with the task environment"

patterns-established:
  - "The env page says where a deployment sets each variable: task environment value or parameter, a Supabase function secret, or the operator's shell"

requirements-completed: [DOCS-04]

coverage:
  - id: D1
    description: "Every variable the task, the start-up check, the analytics config and the bootstrap script read is on the page, and the guard fails the day one is added without a line"
    requirement: DOCS-04
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/server/startup/environmentReference.test.ts#the environment-variable reference in the repository"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/server/startup/environmentReference.test.ts#environmentReferenceProblems > names ORIGIN when a copy of the page has it removed"
        status: pass
    human_judgment: false
  - id: D2
    description: "Proxy depth measurement, the corrected PUBLIC_PROJECT_ID reader, the AWS identity-provider gap and the service-role warning are on the page; links and anchors resolve"
    requirement: DOCS-04
    verification:
      - kind: other
        ref: "Task 2 automated verify (send-email, IDENTITY_CALLBACK_SERVER_SECRET, analytics link, prettier, validate:links --check 0 findings, startup tests, no recorded-search word)"
        status: pass
    human_judgment: true

duration: 27min
completed: 2026-11-20
---

# Phase 189 Plan 09: The environment-variable reference by role, and its guard Summary

RED_FIRST_MISSING=ORIGIN, ADDRESS_HEADER, XFF_DEPTH, KEEP_ALIVE_TIMEOUT, HEADERS_TIMEOUT, SHUTDOWN_TIMEOUT, ANALYTICS_PROVIDER, ANALYTICS_CONSENT_MODE, ANALYTICS_VISIT_ID_MODE, ANALYTICS_POSTHOG_HOST, ANALYTICS_FLUSH_INTERVAL_MS, ANALYTICS_POSTHOG_KEY, DEPLOYMENT_DIAGNOSTICS, BOOTSTRAP_STORAGE_URL, BOOTSTRAP_BEHIND_CLOUDFLARE, BOOTSTRAP_ACCOUNT_NAME, BOOTSTRAP_PROJECT_NAME, BOOTSTRAP_DEFAULT_LOCALE, BOOTSTRAP_OPEN_FOR_VOTERS (19 names)
FRONTEND_UNIT_DELTA=+12 (src/lib/server/startup: 39 -> 51 tests, 2 -> 3 files)
E2E_DELTA=0 (a test file and a docs page only; no project affected)

**`configuration/environmental-variables` is now grouped by role. Each variable has a line or table row saying what it does, who reads it, what happens when it is unset and where a deployment sets it. The proxy section explains how `XFF_DEPTH` is measured and links Step 9 of the staging AWS runbook. The page now says that `send-email`, not `identity-callback`, reads `PUBLIC_PROJECT_ID`. It also says that bank authentication is not wired on the AWS path and that `SUPABASE_SERVICE_ROLE_KEY` never goes on the frontend. A new frontend unit test fails when a variable the task, the start-up check, the analytics config or the bootstrap script reads is missing from the page.**

## Performance

- **Duration:** about 27 min (one stream-watchdog stall and resume inside it)
- **Started:** 2026-11-20T15:17:52Z
- **Completed:** 2026-11-20T15:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `environmentReferenceProblems(input)` is a pure function. It takes the page text, the parsed task list, the bootstrap script text and the two name sets, and returns one problem per name that is not a whole backticked token on the page. An absent page, an absent or malformed list, or a script with no `\getenv` line is a problem naming that file.
- The guard has 12 cases: a local-contract case (`REQUIRED_NAMES` equals `REQUIRED_ENV`, `ANALYTICS_NAMES` equals `Object.values(ANALYTICS_ENV)`), 10 fixture cases and the repository case.
- The page is grouped into Required at start, `PUBLIC_PROJECT_ID`, Proxy, Timeouts, Analytics, Logging and diagnostics, Identity provider, Edge Functions, Bootstrap, Admin app and Local only. The sections on the two `.env` files, the variables that exist twice and reading variables in the frontend are kept, and a new "Where a deployment sets them" section comes before the role groups.
- The defaults when unset come from the code: adapter-node's `XFF_DEPTH` `1`, `SHUTDOWN_TIMEOUT` `30`, and Node's own keep-alive and headers timeouts when those two are unset. The analytics defaults come from `config.ts`. The bootstrap required/default table comes from the script's header.

## Red-first evidence

1. **Repository case red on today's page** (`environmentReference` alone): 1 failed, 11 passed. The 19 names in `RED_FIRST_MISSING` above were reported missing. The old page wrote `ORIGIN` and the proxy, timeout, analytics and diagnostics variables nowhere, and none of the `BOOTSTRAP_*` names.
2. **Fixture cases red against a do-nothing mutant.** A temporary copy with `return []` at the top of `environmentReferenceProblems` gave 9 failed and 3 passed: the 9 fault-planting fixtures went red, and the sound-page, contract and repository cases stayed green. The copy was deleted and never staged.
3. The first red run also showed one fixture's own bug: it assumed the problem order and expected `ANALYTICS_POSTHOG_HOST` first. It now asserts the two problems as an unordered set. This was fixed before the commit.

## Task Commits

1. **Task 1: the guard, red on its fixtures and on today's page, green with every name grouped by role** - `5ebb42c85` (feat)
2. **Task 2: what each group means, how the proxy depth is measured, and the corrected reader** - `bcf71cba9` (docs)

## Files Created/Modified

- `apps/frontend/src/lib/server/startup/environmentReference.test.ts` - the guard (new, 280 lines)
- `apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md` - rewritten by role

## Verification

- Task 1 verify: startup tests exit 0 (51 passed); the page has `` `DEPLOYMENT_DIAGNOSTICS` `` and no `FRONTEND_URL`.
- Task 2 verify: exit 0. It covers `send-email`, `IDENTITY_CALLBACK_SERVER_SECRET`, the analytics link, Prettier, `validate:links --check` with 0 findings in every class, the startup tests and no recorded-search word.
- ``sed -n '/^## `PUBLIC_PROJECT_ID`$/,/^## /p' <page> | grep -c send-email`` prints 1 (expected >= 1).
- `grep -c environmentReferenceProblems <test>` prints 5 (expected >= 1).
- `yarn lint:check` exit 0, including `assert:comment-hygiene` with 0 violations. `yarn workspace @openvaa/docs build` exit 0.
- Tracer gate (auto chain active): the Task 1 verify was re-run end to end and passed before Task 2 expanded the page.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

**1. [Rule 3 - Blocking] Task 1 verify needs the verbose reporter**
- **Found during:** Task 1
- **Issue:** `vitest run` in a non-TTY shell prints no per-file lines for passing files, so the verify's `grep -q 'environmentReference'` on the log fails even when the file ran.
- **Fix:** The verify was re-run with `--reporter=verbose`, and exited 0 with 12 matching lines. The test count going from 39 to 51 shows the same thing.
- **Files modified:** none
- **Commit:** n/a

**2. [Rule 2 - Completeness] Edge Functions and Admin app sections, and SMTP_USER/SMTP_PASS**
- **Found during:** Task 1 and Task 2
- **Issue:** The plan's list of roles has no place for `SITE_URL`, `SMTP_*` or `LLM_OPENAI_API_KEY`, which the old page listed. The Supabase module writes `SMTP_USER` and `SMTP_PASS` as function secrets, but the old page did not list them.
- **Fix:** Two extra role sections, and the two SMTP credentials listed in them.
- **Commit:** `5ebb42c85`, `bcf71cba9`

**Total deviations:** 2 (one verify mechanics, one completeness). No scope creep beyond the page and the test.

## Issues Encountered

The session stalled once (stream watchdog) after the test file was written. The coordinator resumed it, and no work was lost.

## Known Stubs

None.

## Threat Flags

None. T-189-18: the Bootstrap section says the service-role key belongs to the bootstrap run and the Supabase project only, and is never set on the frontend. T-189-19: the Proxy section explains what a wrong depth trusts and how to measure the right one, linking Step 9. T-189-SC: no package was installed. The page prints no key, token or password; the only literal values are the local project ids, local URLs and the `openssl rand` command.

## Next Phase Readiness

DOCS-04 is met by the page and its guard. The phase's verification still needs one read of the page as a deployer would read it (D2 `human_judgment: true`).

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/server/startup/environmentReference.test.ts
- FOUND: apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md
- FOUND: 5ebb42c85
- FOUND: bcf71cba9
