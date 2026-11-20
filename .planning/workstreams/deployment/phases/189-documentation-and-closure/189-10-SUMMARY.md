---
phase: 189-documentation-and-closure
plan: "10"
subsystem: docs
tags: [docs, analytics, privacy, vitest, guard, posthog, consent]
status: complete

requires:
  - phase: 189 (plan 189-04)
    provides: the `configuration/analytics` page with its `# Analytics` heading and intro, in the nav
  - phase: 189 (plan 189-09)
    provides: the env page's `## Analytics` section the page links to
provides:
  - "configuration/analytics: How it works, Event catalogue (30 rows), Adding a provider, Privacy mechanism, The deployer's checklist (11 items)"
  - "apps/frontend/src/lib/analytics/eventCatalogue.test.ts: eventCatalogueProblems, red when the catalogue table's first column is not exactly EVENT_NAMES"
  - "publishers-guide/preparing/what-data-should-be-collected points to /developers-guide/configuration/analytics#the-deployers-checklist"
  - ".planning/todos/pending/2026-11-20-189-feedback-limit-address-retention.md"
affects: [189-20]

actuals:
  tokens: 11400
  tasks: 3
  commits: 3
plan_head_before: 6ff4c410037781e3b3e5f48cfe52178dacea706d
plan_head_after: f326996dc176562c5c43917f1b1cb980ff3ce2e8

tech-stack:
  added: []
  patterns:
    - "A docs-table guard compared both ways: the first cell of each row under one heading against an exported name list, missing names in the schema's order, extra names in the page's order"

key-files:
  created:
    - apps/frontend/src/lib/analytics/eventCatalogue.test.ts
    - .planning/todos/pending/2026-11-20-189-feedback-limit-address-retention.md
  modified:
    - apps/docs/src/routes/(content)/developers-guide/configuration/analytics/+page.md
    - apps/docs/src/routes/(content)/publishers-guide/preparing/what-data-should-be-collected/+page.md

key-decisions:
  - "The pageview row says it is sent before consent: gates.ts maySendPageview sends it whenever a provider is configured and the browser sends no Global Privacy Control, whatever trackEvents and consent are. The plan's 'no for every event' holds for the other 29"
  - "The page describes trackEvents as the tree has it: it governs every event but the pageview (gates.ts; dynamicSettings.type.ts 'other than the identifier-free page-view count'). The v2.17 B7 reading 1 had trackEvents off stopping the server pageview too; the tree does not, and the page does not claim it"
  - "A configuration problem is described as the tree has it: a production server refuses to start naming the variable (hooks.server.ts init, STARTUP_RULES); in development the provider resolves to none"
  - "Staging PostHog values are stated with their dates and cited as 'phase 188 record' (the 188-09 evidence is not published); the event-content read links the staging AWS runbook's Observations"
  - "DOCS-05 is marked complete: catalogue (guarded), adding a provider, privacy mechanism, the 11-item checklist, the consent determination stated as the deployer's, and the consent grep finds nothing in apps/docs"

patterns-established:
  - "Each checklist item is a question to the deployer, then what the repository does by default and where it is changed, never what is required"

requirements-completed: [DOCS-05]

coverage:
  - id: D1
    description: "The catalogue names exactly the schema's events, and the guard fails the day one is added or removed without its row"
    requirement: DOCS-05
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/analytics/eventCatalogue.test.ts#the event catalogue in the repository"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/analytics/eventCatalogue.test.ts#eventCatalogueProblems > names made_up as not in the schema when a copy of the page has an extra row for it"
        status: pass
    human_judgment: false
  - id: D2
    description: "No docs line says no consent is required; the checklist leaves every determination to the deployer"
    requirement: DOCS-05
    verification:
      - kind: other
        ref: "Task 3 automated verify (checklist heading, pointer, todo, prettier, validate:links --check 0 findings, consent git grep empty)"
        status: pass
    human_judgment: true

duration: 20min
completed: 2026-11-20
---

# Phase 189 Plan 10: The analytics page, its guarded event catalogue and the deployer's checklist Summary

RED_RUNS:
- stub run (function body `return []`, scratch copy, never committed): 7 of 9 fixture cases failed; the two that passed assert an empty result
- red 1, the page as 189-04 left it: repository case failed with `...analytics/+page.md: has no table under ## Event catalogue`
- red 2, heading and table header only: repository case failed with 30 problems, one `<name>: is in EventSchema and has no row in the catalogue` per event
- green: the 30 rows written, `src/lib/analytics` 401 passed (401)

FRONTEND_UNIT_DELTA=+10 (src/lib/analytics: 391 -> 401 tests, 7 -> 8 files)
E2E_DELTA=0 (a test file, two docs pages and a todo; no project affected)

**`configuration/analytics` now has five sections. How it works covers the relay at `/api/usage`, the bounded queue, the providers in `PROVIDERS`, consent mode `gated` by default, visit-id mode `memory` by default, the server pageview recorded in any case and `analytics.trackEvents` (false by default, respected). The event catalogue has one row per schema event, and a new unit test keeps it equal to `EVENT_NAMES`. Adding a provider gives the file under `providers/`, `PROVIDERS`, the switch of `providers/index.ts`, `ANALYTICS_ENV` and `task-environment.json`, and the guards that then apply. Privacy mechanism covers what the relay reads and keeps, the pageview with no id, the visit id's scope and what PostHog sees, plus the staging project's IP setting as read on 2026-11-19. The deployer's checklist has eleven items, each the deployer's own determination. The publishers' guide links to the checklist, and a todo records that the feedback limit keeps addresses with no expiry.**

## Performance

- **Duration:** about 20 min (start recorded 2026-11-20T15:49:25Z; last task commit 15:57:27Z)
- **Tasks:** 3 of 3
- **Files:** 2 created, 2 modified

## Accomplishments

- `eventCatalogueProblems(page, names)` reads the first cell of each row under `## Event catalogue`, counting only one backticked name per cell. It returns one problem per schema name with no row and one per row name not in the schema, and names the page when it is absent or has no table there. 10 tests: 9 fixture cases and 1 repository case.
- The catalogue gives, per event, when it is sent (taken from the call sites under `apps/frontend/src`), its fields (taken from its schema member, with the shared envelope described once above the table), and whether it is sent before consent in `gated` mode. The six `SENSITIVE_EVENTS` are marked "sensitive".
- The checklist has one item per D-03 entry. The `account-access` item covers the 10-minute key in `private.invitation_throttle` and `cf-connecting-ip`. The feedback item says the address stays in `private.feedback_rate_limits` with no expiry.

## Task Commits

1. **Task 1: catalogue guard, red first, then green** - `c04d32bfb` (test). Tracer gate: the verify was re-run end to end with `--reporter=verbose` and passed.
2. **Task 2: how it works, adding a provider, privacy mechanism** - `db940f197` (docs)
3. **Task 3: deployer's checklist, publishers' pointer, retention todo** - `f326996dc` (docs)

## Verification

- Task 1 verify: exit 0 with `--reporter=verbose`. `grep -c eventCatalogueProblems` gives 14.
- Task 2 verify: run verbatim, exit 0. Prettier is clean and `validate:links --check` gives `Total findings: 0`. `grep -c 'server pageview'` gives 1.
- Task 3 verify: run verbatim, exit 0. The consent `git grep` over `apps/docs` is empty. The checklist has 11 `- ` items, and `grep -ci deployer` gives 3.
- Mutation checks:
  - The consent pattern matches the sentence "For this deployment no consent is required." (1 hit).
  - The pointer's anchor changed to `#the-deployer-s-checklist` makes `validate:links --check` exit 1 with `anchor: 1`. The anchor was then restored.
- Recorded-search words of the phase (`unverified|not yet observed|untested` and the second pattern) and `\bRender\b`: no hit on either page.
- `yarn lint:check` exited 0 and `yarn format:check` exited 0. Both ran in the background, and their status was read from a file. `yarn workspace @openvaa/docs build` exited 0. `pmset` shows no sleep in the window.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1 verify greps a file name that vitest does not print for passing files**
- **Found during:** Task 1
- **Issue:** Without `--reporter=verbose`, a non-interactive vitest run prints no line per passing file. So `grep -q 'eventCatalogue'` fails on a green run (verify exit 1, tests 401 passed).
- **Fix:** The verify was run with `--reporter=verbose` added, and passed. The plan text is unchanged.
- **Commit:** none (a command change only)

**2. [Rule 1 - Bug] The plan's pageview rule disagreed with the tree**
- **Found during:** Task 1
- **Issue:** The action says to mark "no for every event under the default gated mode". But `gates.ts` sends the pageview whatever the consent choice and `trackEvents`.
- **Fix:** The pageview row says "Yes, with no visit id", plus its conditions. The other 29 rows say "No".
- **Commit:** `c04d32bfb`

**3. [Rule 1 - Bug] "Any configuration problem resolves to `none`" holds only in development**
- **Found during:** Task 2
- **Issue:** `hooks.server.ts` `init` throws on any `STARTUP_RULES` problem, and `analyticsStartupProblems` is one of those rules. So a production server refuses to start.
- **Fix:** The page states both behaviours.
- **Commit:** `db940f197`

**4. [Rule 1 - Bug] The todo's first measurement left out the pgTAP tests' `DELETE`s**
- **Found during:** Task 3
- **Issue:** `tests/database/10-schema-migrations.test.sql` and `35-feedback-rate-limit-key.test.sql` delete from the table between their own cases.
- **Fix:** The todo now says so, and confines "no delete" to the schema and the migrations.
- **Commit:** `f326996dc`

## Flags for the verifier

- **trackEvents and the pageview.** Reading 1 of B7 in `v2.17-DISCUSSION-POINTS.md` has `trackEvents` off stopping the server pageview too. The tree sends the pageview whatever `trackEvents` is (`gates.ts` `maySendPageview`; the `dynamicSettings.type.ts` doc). The page describes the tree. If the ruling's reading is the intended behaviour, that is a code change outside this plan.
- **Unpublished record.** The staging PostHog billing limit (20 USD, set 2026-11-18) and the `anonymize_ips` read-back (2026-11-19) are cited as "phase 188 record". Their only record is `188-*/evidence/188-09-posthog-setup.md`, which is not published.

## Known Stubs

None.

## Threat Flags

None. No code path changed; one test file was added.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/analytics/eventCatalogue.test.ts
- FOUND: apps/docs/src/routes/(content)/developers-guide/configuration/analytics/+page.md
- FOUND: .planning/todos/pending/2026-11-20-189-feedback-limit-address-retention.md
- FOUND: c04d32bfb, db940f197, f326996dc (each an ancestor of HEAD)
