---
phase: 182-analytics-relay
plan: 03
subsystem: frontend-analytics
tags: [analytics, relay, uuidv7, pageview, allowlist, route-tree, vitest]
status: complete

requires:
  - phase: 182-02
    provides: D-13 landed (the closed-project analytics member); nothing in this plan reads it
provides:
  - apps/frontend/src/lib/analytics/constants.ts (RELAY_PATH, batch/body caps, age/skew/duration limits, ID_PATTERN; no import)
  - apps/frontend/src/lib/analytics/modes.ts (CONSENT_MODES, VISIT_ID_MODES, ANALYTICS_APPS with derived types, AnalyticsProjection, INACTIVE_PROJECTION)
  - apps/frontend/src/lib/analytics/analyticsEvent.type.ts (AnalyticsEvent)
  - apps/frontend/src/lib/analytics/uuidv7.ts (uuidv7, createUuidV7, isUuidV7, uuidV7TimestampMs)
  - apps/frontend/src/lib/analytics/appOfRoute.ts (appOfRoute)
  - apps/frontend/src/lib/analytics/pageviewRoutes.ts (ParamValidator, PAGEVIEW_ROUTES, isPageviewRoute, allowedPageviewParams)
affects: [182-04 and later: vocabulary, relay, browser service, E2E fixtures]

actuals:
  tokens: 8100      # chars/4 over the two code commits' diff (32414 chars)
  tasks: 2
  commits: 2        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the docs commit follows
plan_head_before: 12c2e96d1ca02a6fb6e3a0ac0e37cb85a73d09b8
plan_head_after: 0f5c2b2bbb6ca269cb557410f0f7faf5e091b9ef

tech-stack:
  added: []
  patterns:
    - "A pageview allowlist keyed by SvelteKit route id, checked against a filesystem walk of src/routes in both directions"
    - "Closed-set parameter values validated by the route matchers' own exported match functions, imported by relative path"

key-files:
  created:
    - apps/frontend/src/lib/analytics/constants.ts
    - apps/frontend/src/lib/analytics/modes.ts
    - apps/frontend/src/lib/analytics/analyticsEvent.type.ts
    - apps/frontend/src/lib/analytics/uuidv7.ts
    - apps/frontend/src/lib/analytics/uuidv7.test.ts
    - apps/frontend/src/lib/analytics/appOfRoute.ts
    - apps/frontend/src/lib/analytics/appOfRoute.test.ts
    - apps/frontend/src/lib/analytics/pageviewRoutes.ts
    - apps/frontend/src/lib/analytics/pageviewRoutes.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/03-gates.txt
  modified: []

key-decisions:
  - "The allowlist covers the 45 page routes the walk finds today, including the nomination-editor steps (elections, constituencies, details) the research table predates; each gets entityType only"
  - "uuidv7 also throws a RangeError for a time that is not whole milliseconds in the 48-bit range; uuidV7TimestampMs returns NaN for a non-UUIDv7 rather than throwing"
  - "isPageviewRoute and allowedPageviewParams use Object.hasOwn, so inherited names such as constructor or __proto__ are never routes or parameters"

requirements-completed: [RELAY-08, RELAY-15, RELAY-16, RELAY-19]

duration: 5min
completed: 2026-10-19
---

# Phase 182 Plan 03: Analytics foundation (constants, modes, event, UUIDv7, route app, pageview allowlist) Summary

**Nine pure modules under `apps/frontend/src/lib/analytics/` declare the relay path, caps, consent/visit-id modes, app names and the canonical `AnalyticsEvent` once. A crypto-only UUIDv7 helper is tested on fixed inputs. A per-route pageview parameter allowlist is checked against a filesystem walk of the route tree, and `id`, `entityId` and `page` are on no list.**

## Performance

- **Start sha:** `12c2e96d1ca02a6fb6e3a0ac0e37cb85a73d09b8`
- **Started:** 2026-10-19T09:53:23Z
- **Completed:** 2026-10-19T09:58Z
- **Tasks:** 2 (both auto, TDD)
- **Files:** 9 created, plus 1 evidence record

## Accomplishments

- **Task 1.** `constants.ts` has no import statement. `modes.ts` derives each type from its `as const` array. `uuidv7` packs 48 bits of time, version `7`, variant `10` and 74 random bits. Fixed inputs give `01234567-89ab-7001-8203-040506070809`, and all-ones bytes give `…-7fff-bfff-ffffffffffff`, which shows the masks. `createUuidV7` uses only `Date.now()` and `crypto.getRandomValues`, with no `Math.random` and no device store. Red: module missing, exit 1. Green: 13/13.
- **Task 2.** `appOfRoute` compares whole segments against `VOTER`, `CONTESTANT` and `ADMIN`, imported from `$lib/routes/route`. `PAGEVIEW_ROUTES` lists all 45 page routes. A key uses its `ROUTE` constant where one exists, and the literal id otherwise (`/contestant/(protected)`, `/admin/(protected)` and the three `preregister/(authenticated)/…` steps). The validators for `entityTab`, `entity` and `entityType` are the `match` exports of `etPl`, `etSg` and `servedEntityType`, imported unchanged. Every other name is checked against `ID_PATTERN`. The tests cover:
  - the walk, with a non-vacuity check before coverage
  - coverage in both directions through one `compareCoverage` function, with a control case for each direction
  - every key maps to an app
  - no `id`, `entityId` or `page` on any list
  - every listed name is a parameter its route id declares
  - the `allowedPageviewParams` keep and drop cases

  Red: 2 files failed on missing modules. Green: 3 files, 38/38.
- **Gates** (attempt `20261019T095647Z.0f5c2b2bb`, tree clean before and after, HEAD `0f5c2b2bb` before and after): `TYPECHECK_EXIT=0` (3008 files, 0 errors, 0 warnings) and `LINT_EXIT=0`. The record at `evidence/03-gates.txt` is a `cmp`-equal copy, and the plan's pointer verify exits 0.

## Task Commits

1. **Task 1:** `23d86b646` feat(182-03): analytics constants, modes, event type and UUIDv7 helper
2. **Task 2:** `0f5c2b2bb` feat(182-03): app of a route and the per-route pageview parameter allowlist

No commit touches `apps/frontend/src/params/`.

## Deviations from Plan

**1. [Rule 1 - Stale research table] The route list came from the walk, not from the table.** The research table in § 2 predates the nomination-editor routes (`…/nominations/(edit)/elections`, `/constituencies`, `/details`), `/contestant/email-sent`, `/contestant/login/email`, `/contestant/register/email` and `/contestant/register/sign-in`. As the plan instructs, the list was derived by the walk. The editor steps follow the table's rule for routes under the entity prefix (`entityType` only). The others carry no parameter.

**2. [Rule 2 - Correctness] Extra guards beyond the interface.**
- `uuidv7` also rejects a time that is not whole milliseconds in `[0, 2^48)`.
- `uuidV7TimestampMs` returns `NaN` for a non-UUIDv7.
- Lookups use `Object.hasOwn`, so `__proto__` and `constructor` are not routes.
- Each test asserts that every listed parameter name is declared by its route id.

The signatures are unchanged.

## Notes for later plans and the operator

- **v2.16 merge:** the tree-walk test passes now because the nomination-editor routes are already on this branch. Any page route that v2.16 or another stream adds still turns `pageviewRoutes.test.ts` red, by design, until it is listed.
- `ROUTE.AdminAppJob` (`jobs/[jobId]`) and `AdminAppFactorAnalysis` have no page directory, so they are not listed. If one is built, the walk forces an entry. `jobId` would need an explicit decision, because it is not an entity id.
- `electionTab` is validated with `ID_PATTERN` (an election id is a uuid).

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: all 9 source files and `evidence/03-gates.txt`
- FOUND: `23d86b646` and `0f5c2b2bb` are ancestors of HEAD
- `yarn workspace @openvaa/frontend test:unit src/lib/analytics` exits 0 (3 files, 38 tests); the gate pointer verify exits 0
