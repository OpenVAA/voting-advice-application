---
phase: 182-analytics-relay
plan: 06
subsystem: frontend-analytics
tags: [analytics, env-templates, startup-check, logging, vitest]
status: complete

requires:
  - phase: 182-05
    provides: analyticsConfigProblems (env.ts), analyticsStartupProblems and AnalyticsConfigProblem (config.ts)
  - phase: 181-03
    provides: StartupRule, STARTUP_RULES and missingRequiredEnv in lib/server/startup/requiredEnv.ts (already in the tree)
provides:
  - The five ANALYTICS_ variables in .env.example (provider log), render.example.yaml (provider none, key sync false) and docker-compose.dev.yml (code defaults)
  - packages/dev-seed/tests/analyticsEnvTemplates.test.ts
  - One error record per analytics configuration problem at server start (hooks.server.ts)
  - analyticsStartupProblems in STARTUP_RULES, so a production start with posthog and no key is refused naming ANALYTICS_POSTHOG_KEY
affects: [182-11, 182-22, 182-23, 182-24, 182-28, 182-31]

actuals:
  tokens: 3300      # chars/4 over the code diff outside .planning (13121 chars)
  tasks: 2
  commits: 5        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 1d1f4accd5c952a7d4f60ac78d9f187b3885a47a
plan_head_after: 91f8efe9f

tech-stack:
  added: []
  patterns:
    - "Repository-root template tests in packages/dev-seed/tests, reading the files from the repo root"
    - "Configuration problems reported after configureLogger with a constant message and the problem object as the field bag"

key-files:
  created:
    - packages/dev-seed/tests/analyticsEnvTemplates.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/06-templates-red.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/06-gates.txt
  modified:
    - .env.example
    - render.example.yaml
    - docker-compose.dev.yml
    - apps/frontend/src/hooks.server.ts
    - apps/frontend/src/lib/server/startup/requiredEnv.ts
    - apps/frontend/src/lib/server/startup/requiredEnv.test.ts

key-decisions:
  - ".env.example sets ANALYTICS_PROVIDER=log (182-R4 recommended answer, not yet confirmed by the operator); render.example.yaml sets none; docker-compose.dev.yml defaults to none"
  - "The PostHog key and host appear in .env.example only as commented lines; the key is sync: false in render.example.yaml"
  - "The analytics report in hooks.server.ts sits directly after the PUBLIC_LOG_LEVEL report and uses one constant message for every problem"

requirements-completed: [RELAY-03, RELAY-10, RELAY-11]

duration: 9min
completed: 2026-10-19
---

# Phase 182 Plan 06: Analytics variables in the templates and the start-up report Summary

**All three environment templates now name the five `ANALYTICS_` variables. `.env.example` selects `log`, so a local stack and the CI gate suite built from it see events as structured server lines. The code default and the Render blueprint stay at `none`. At server start, `hooks.server.ts` logs one `log.error` record for each entry of `analyticsConfigProblems`, after `configureLogger`. The message is constant and the fields are the problem's `variable`, `reason` and, when present, `provided`. Phase 181's start-up check now holds `analyticsStartupProblems` in `STARTUP_RULES`, so a production start with provider `posthog` and no key is refused with an error naming `ANALYTICS_POSTHOG_KEY`.**

Start sha: `1d1f4accd5c952a7d4f60ac78d9f187b3885a47a`.

The provider in `.env.example` follows the recommended answer of 182-R4, which the operator has not confirmed.

## Tasks

| Task | Name | Commits | Files |
|------|------|---------|-------|
| 1 | The ANALYTICS_ variables in the three templates, with a test seen red first | 0e5221fb1 (test), c0929e06c (red record), 038d453e0 (templates) | analyticsEnvTemplates.test.ts, .env.example, render.example.yaml, docker-compose.dev.yml, evidence/06-templates-red.txt |
| 2 | Report analytics configuration problems at server start | e314be826 (code), 91f8efe9f (gate record) | hooks.server.ts, requiredEnv.ts, requiredEnv.test.ts, evidence/06-gates.txt |

## Verification

- Red run (slot `06-t1`, attempt `20261019T105420Z.0e5221fb1`, on `0e5221fb1` with a clean tree before and after and HEAD unmoved): `TEMPLATE_TEST_RED_EXIT=1`, 18 failed and 5 passed. The passing five were the helper self-test and the three "no PUBLIC_ANALYTICS" cases, plus the "no live key value" case, all of which hold on the unchanged templates as well. The record verify exits 0.
- After the templates were edited, `yarn workspace @openvaa/dev-seed test:unit tests/analyticsEnvTemplates.test.ts` passed 23 of 23, exit 0. The whole dev-seed suite passed 77 files and 1203 tests, exit 0.
- `yarn assert:env-pair-registry`: exit 0. `yarn prettier --check .env.example render.example.yaml docker-compose.dev.yml`: exit 0. The verify comparing the templates with grep: exit 0.
- `git show --numstat` deletions: 038d453e0 deletes 0 lines in each of the three templates, and e314be826 deletes 0 lines in `hooks.server.ts`. `requiredEnv.ts` has 1 line changed: the `STARTUP_RULES` line itself.
- Frontend unit tests `requiredEnv.test.ts`, `routeConsistency.test.ts`, `eslint-adapter-boundary-guard.test.ts` and `src/lib/server/analytics`: 4 files and 190 tests passed. `routeConsistency` reads `hooks.server.ts` as text. ESLint on the three changed frontend files: exit 0.
- Closing gate (slot `06-t2`, attempt `20261019T105643Z.e314be826`, on `e314be826` with a clean tree before and after and HEAD unmoved): `TYPECHECK_EXIT=0` (svelte-check: 3026 files, 0 errors, 0 warnings). The record verify exits 0.

## Deviations from Plan

None. The plan was executed as written. Phase 181's `requiredEnv.ts` was already tracked, so the plan's wiring branch applied, and no "Open contact with phase 181" note is needed.

## Notes for later plans and the operator

- Operator: under 182-R4, a local `.env` copied from `.env.example` before this plan has no `ANALYTICS_PROVIDER` line, so it falls back to `none`. Add `ANALYTICS_PROVIDER=log` to the local `.env` by hand. The root `.env` was not read or edited here.
- The production start-up error reads "Required environment variables are not set: ..." for every rule, the analytics rule included. That means an invalid `ANALYTICS_PROVIDER` value (for example `posthgo`) refuses a production start under the "not set" wording. The plan said to leave that text to phase 181; a later wording change is phase 181's.
- 182-22: the contact with phase 181 is wired. `STARTUP_RULES` is `[unsetRequiredEnv, analyticsStartupProblems]`.

## Known Stubs

None.

## Threat Flags

None. The surfaces T-182-20, T-182-21 and T-182-22 are mitigated as the register says. The key has no value in any template, the report logs the problem object only, and the start-up rule is in the list.

## Self-Check: PASSED
