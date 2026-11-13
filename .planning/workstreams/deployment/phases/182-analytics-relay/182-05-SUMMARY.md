---
phase: 182-analytics-relay
plan: 05
subsystem: frontend-analytics
tags: [analytics, relay, configuration, private-env, root-load, projection, vitest]
status: complete

requires:
  - phase: 182-03
    provides: CONSENT_MODES, VISIT_ID_MODES, AnalyticsProjection, INACTIVE_PROJECTION (modes.ts)
  - phase: 182-04
    provides: nothing read here; listed as a wave dependency only
provides:
  - apps/frontend/src/lib/server/analytics/config.ts (PROVIDERS, ProviderName, ANALYTICS_ENV, DEFAULT_POSTHOG_HOST, AnalyticsConfig, AnalyticsConfigProblem, resolveAnalyticsConfig, toProjection, analyticsStartupProblems)
  - apps/frontend/src/lib/server/analytics/env.ts (analyticsConfig, analyticsConfigProblems, analyticsProjection; the one analytics reader of $env/dynamic/private)
  - page.data.analytics (three members) on every route, via both root loads; App.PageData.analytics
affects: [182-06, 182-07, 182-08, 182-13, 182-19]

actuals:
  tokens: 6700      # chars/4 over the four code commits' diff (26802 chars)
  tasks: 2
  commits: 4        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the docs commit follows
plan_head_before: 26539778f834fa115c7de07861637e8941753906
plan_head_after: 5b01a25e34ab06c636172fb009804509afc8a233

tech-stack:
  added: []
  patterns:
    - "A pure resolver over the environment record, read by one thin module at module scope; any problem resolves the provider to none"
    - "A start-up rule of type (env) => Array<string> that returns variable names only, so phase 181's check can hold it unchanged"

key-files:
  created:
    - apps/frontend/src/lib/server/analytics/config.ts
    - apps/frontend/src/lib/server/analytics/config.test.ts
    - apps/frontend/src/lib/server/analytics/env.ts
    - apps/frontend/src/routes/layout.server.test.ts
    - apps/frontend/src/routes/layout.load.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/05-gates.txt
  modified:
    - apps/frontend/src/routes/+layout.server.ts
    - apps/frontend/src/routes/+layout.ts
    - apps/frontend/src/app.d.ts

key-decisions:
  - "Problems are ordered provider, consent mode, visit-id mode, key, host; analyticsStartupProblems keeps that order and deduplicates"
  - "provided is set only for the three vocabulary variables (normalised value); never for the key or the host"
  - "The PostHog key is trimmed but not lower-cased; the host is trimmed, parsed with URL and reduced to url.origin (drops path, query, credentials, trailing slash)"
  - "Loopback http: is accepted only for the hostnames localhost and 127.0.0.1 ([::1] is not)"
  - "App.PageData.analytics is optional, like the other root members"

requirements-completed: [RELAY-03, RELAY-10, RELAY-11, RELAY-16]

duration: 8min
completed: 2026-10-19
---

# Phase 182 Plan 05: Analytics configuration and the root-load projection Summary

**`resolveAnalyticsConfig(env)` is pure and reads only its argument. With nothing set it gives provider `none`, consent mode `gated` and visit-id mode `memory`. Values are trimmed and lower-cased before the vocabulary check, and a blank or non-string value counts as unset. Any problem (a value outside a vocabulary, `posthog` with no key, or a host that is neither `https:` nor loopback `http:`) resolves the provider to `none`, so a misconfigured deployment sends nothing. `env.ts` is the only analytics module that imports `$env/dynamic/private`. The root server load returns `analytics: analyticsProjection` (`{ active, consentMode, visitIdMode }`) beside `supabaseCookies`, and the root universal load forwards `analytics: data.analytics`.**

Start sha: `26539778f834fa115c7de07861637e8941753906`.

## Tasks

| Task | Name | Commits | Files |
|------|------|---------|-------|
| 1 | The pure configuration resolver and the one module that reads the environment | cf971320f (RED), e01d237e5 (GREEN) | config.ts, config.test.ts, env.ts |
| 2 | The projection in both root loads | c2dae39ad (RED), 5b01a25e3 (GREEN) | +layout.server.ts, +layout.ts, app.d.ts, layout.server.test.ts, layout.load.test.ts |

## Verification

- `test:unit src/lib/server/analytics/config.test.ts`: 21 passed. Together with the two load tests: 3 files and 25 tests passed, exit 0.
- RED was observed for both tasks before the implementation: the resolver module was missing, and all 4 load cases failed on `analytics` being `undefined`.
- `yarn assert:env-pair-registry`: exit 0. None of the five variables is `PUBLIC_`.
- `yarn assert:no-session-in-loads`: exit 0 (21 modules, 0 violations).
- `git grep -n "url\." -- apps/frontend/src/routes/+layout.server.ts`: no match.
- Closing gates on `5b01a25e3` with a clean tree before and after (record `evidence/05-gates.txt`, attempt `20261019T102037Z.5b01a25e3`): `TYPECHECK_EXIT=0` (svelte-check: 3026 files, 0 errors, 0 warnings) and `LINT_EXIT=0`. The plan's record verify exits 0.

## TDD Gate Compliance

Both tasks followed RED then GREEN: a `test(182-05)` commit came before each `feat(182-05)` commit, and each test was seen failing for the expected reason. No refactor commit was needed.

## Deviations from Plan

**1. [Rule 3 - Blocking] `src/app.d.ts` edited although it is not in `files_modified`**
- The task action asks for this edit when `App.PageData` lists the root members, and it does. `analytics?: AnalyticsProjection` was added. ESLint's simple-import-sort then needed an autofix of the import order.
- Commit: 5b01a25e3

**2. [Formatting] `config.test.ts` reformatted by Prettier after its RED commit**
- The reformatted file went into the GREEN commit e01d237e5 with the implementation. It has no behaviour change.

## Notes for later plans

- 182-06: `analyticsStartupProblems` already has the `StartupRule` signature of `lib/server/startup/requiredEnv.ts`, so it can go straight into `STARTUP_RULES`. `analyticsConfigProblems` (from `env.ts`) carries `variable`, `reason` and, for vocabulary variables only, `provided`, for the error record logged after `configureLogger`. `env.ts` logs nothing.
- 182-07/08: `analyticsConfig.posthog` is present only when the provider is `posthog` and nothing has a problem. Its `host` is already an origin.
- Tests that import `env.ts` must `vi.resetModules()` and `vi.doMock('$env/dynamic/private', …)` before a dynamic import, because the configuration resolves at module scope. `layout.server.test.ts` shows the pattern.

## Known Stubs

None.

## Self-Check: PASSED
