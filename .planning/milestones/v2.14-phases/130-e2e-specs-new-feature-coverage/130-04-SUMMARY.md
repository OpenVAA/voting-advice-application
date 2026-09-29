---
phase: 130-e2e-specs-new-feature-coverage
plan: 04
subsystem: testing
tags: [playwright, e2e, voter, alliance, nominations, leaf-spec, entity-drawer]

# Dependency graph
requires:
  - phase: 130-01
    provides: "e2e/base alliance wiring (Alliance A + members OR-AA/OR-AB, results.sections['candidate','organization','alliance'], entityDetails.contents.alliance ['info','children']) verified at 129 close; resultsPage/entityDetails fixture surface"
provides:
  - "voter-alliance leaf spec + project — EFLOW-02 member-orgs drawer + clickable in-card children + EPERM-03 presence rider + EPERM-04 tab-control rider (all HARD)"
  - "voter-nominations leaf spec + project — UNBLK-04 all-nominations render (raw goto, list + >=1 card)"
affects: [130-05, 130-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Read-only leaf spec on data-setup-base consuming the shared answeredVoterPage 'max' walk via voterJourneyTest + create* factory composition (views.ts test lacks answeredVoterPage)"
    - "Drawer-identity assertion: clickable in-card child proven by opening THAT member org's own drawer (heading name-scoped, plus zero-count assertion that it is NOT the parent alliance)"
    - "Per-type tab-control contract made unmistakable: expectTabs exact set/order PLUS explicit zero-count on the absent tab role"

key-files:
  created:
    - tests/tests/specs/voter/voter-alliance.spec.ts
    - tests/tests/specs/voter/voter-nominations.spec.ts
  modified:
    - tests/playwright.config.ts

key-decisions:
  - "Alliance click-through proven by a drawer-identity assertion (member ORG heading present + alliance heading count 0), not merely dialog-opened"
  - "Generic openEntityDetailsForCard/getMemberCards worked for alliances UNMODIFIED — RESEARCH A2 flagged assumption resolved, no fixture accommodation, no deviation"
  - "voter-nominations kept a conservative HARD >=1-card assertion (not an exact count) — the all-nominations roster spans the full seed and its size is scope-dependent"

patterns-established:
  - "Two new leaf projects each with an exactly-scoped testMatch + dependencies ['data-setup-base'], both proven to RUN via --list (Pitfall 2 avoided)"

requirements-completed: [EFLOW-02]

coverage:
  - id: A1
    description: "voter-alliance green end-to-end: alliance section present (EPERM-03), Alliance A card + gauge + both member subcards by name, member subcard click opens the member org's own drawer, alliance drawer exposes EXACTLY [info,children] with no opinions tab (EPERM-04), member-orgs drawer lists both members (EFLOW-02)"
    requirement: "EFLOW-02"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-alliance.spec.ts (project voter-alliance)"
        status: pass
    human_judgment: false
  - id: A2
    description: "voter-nominations green: raw goto /en/nominations renders the all-nominations entity list with >=1 nomination card (UNBLK-04 rider)"
    requirement: "EFLOW-02"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-nominations.spec.ts (project voter-nominations)"
        status: pass
    human_judgment: false

# Metrics
duration: ~40min
completed: 2026-07-19
status: complete
---

# Phase 130 Plan 04: Alliance + Nominations Leaf Specs Summary

**Two new read-only leaf specs — voter-alliance (EFLOW-02 member-orgs drawer + clickable in-card children + EPERM-03/04 riders) and voter-nominations (UNBLK-04 all-nominations render) — each with its own proven-to-run Playwright project, assert-only on the frozen e2e/base seed.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-07-19
- **Tasks:** 3
- **Files created:** 2; **modified:** 1

## Accomplishments

- **voter-alliance.spec.ts** (1 test, 5 semantic steps) deepens the voter-journey D-10 alliance-PRESENCE step with the DEPTH it lacks:
  - EPERM-03 presence rider made self-contained: `expectEntityTabs(['cands','orgs','alliances'])` + alliance section visible.
  - Alliance A card asserts a match-score gauge plus BOTH member-org subcards ([or-aa] Party AA, [or-ab] Party AB) BY NAME (deeper than D-10's `nth(1)` visibility).
  - Clickable in-card children proven by a **drawer-identity** assertion: clicking the Party AA subcard opens THAT org's own entity-detail drawer (member-org heading visible; alliance heading count 0).
  - EPERM-04 tab-control rider: the alliance drawer exposes EXACTLY `['info','children']` (exact count + order) PLUS an explicit zero-count assertion for the opinions tab role.
  - EFLOW-02 member-orgs drawer: the children/Members tab lists exactly 2 member cards, one Party AA + one Party AB.
- **voter-nominations.spec.ts** (1 test) closes the UNBLK-04 rider as a dedicated D-01 spec (NOT a journey step): raw `goto('/en/nominations')` on the unscoped route (showAllNominations=true in base) then HARD-asserts the `voter-nominations-list` visible + >=1 nomination entity card.
- Both specs got their own leaf Playwright project entries (`voter-alliance`, `voter-nominations`) with exactly-scoped `testMatch` and `dependencies: ['data-setup-base']`, and both were proven to RUN via `--list` (Pitfall 2: a spec with no project entry silently never runs — avoided).
- Every assertion is HARD (rigidity contract): 0 `expect.soft`, no try/catch around expect, no skip/flaky/retry.

## Task Commits

1. **Task 1: voter-alliance presence rider + card + clickable member children (+ project entry)** — `ab1b0a03a` (test)
2. **Task 2: alliance drawer depth — member-orgs drawer + EPERM-04 tab control** — `f426d8af6` (test)
3. **Task 3: voter-nominations dedicated leaf spec + project entry** — `67ccb58a9` (test)

## Files Created/Modified

- `tests/tests/specs/voter/voter-alliance.spec.ts` (NEW) — alliance results-surface depth spec; imports `voterJourneyTest as test` (answeredVoterPage) + composes resultsPage/entityDetails via factories (views.ts `test` lacks answeredVoterPage).
- `tests/tests/specs/voter/voter-nominations.spec.ts` (NEW) — dedicated all-nominations render leaf; imports `{ test, expect }` from `views.ts` for consistency (uses only `page`).
- `tests/playwright.config.ts` (MODIFIED) — added the `voter-alliance` and `voter-nominations` leaf project entries in the base chain region, adjacent to voter-dark-mode / voter-journey-mobile.

## Decisions Made

- **Drawer-identity assertion** over a bare dialog-opened check for the clickable-children criterion: the member subcard is wrapped by the member org's own `EntityCardAction <a>` (EntityCard.svelte:220), so clicking the subcard navigates to the ORG drawer — asserted by a name-scoped heading present + alliance heading count 0.
- **No fixture accommodation needed** (RESEARCH A2): `resultsPage.openEntityDetailsForCard` (clicks the FIRST entity-card-action = the parent card's primary action) and `entityDetails.getMemberCards` are entity-type-generic and worked for the alliance unmodified. `entityDetails.fixture.ts` was NOT touched — no ownership overlap with plan 130-03.
- **Conservative HARD >=1-card assertion** for voter-nominations rather than an exact count — the all-nominations roster spans the full seed and its size is scope-dependent (same rationale the removed soft journey step cited), kept as a HARD assertion.

## Deviations from Plan

None — plan executed exactly as written. No product code, no seed changes (D-04), no new testIds, no fixture edits. The RESEARCH A2 fixture-accommodation contingency did not trigger.

## Verification

- `voter-alliance` project: **3 passed** (data-setup-base + spec + teardown), 0 failed, 0 skipped — presence, card, click-through, tab control, member-orgs drawer all green on a fresh stack.
- `voter-nominations` project: **3 passed**, 0 failed, 0 skipped.
- `yarn typecheck:tests` exits 0.
- Both projects appear in `npx playwright test --list` (Pitfall 2 proof).
- Soft-assertion grep across both new specs returns 0.

## Environment Note (for later plans in this wave)

- A wedged `yarn db:reset` (storage 502 on container restart) was recovered via `yarn db:stop && yarn db:start`, but the stack came back with storage buckets absent (`Bucket not found` on base-setup portrait upload). Re-running `yarn db:reset` on the fresh stack recreated `public-assets` / `private-assets` and unblocked seeding. Verification ran against the live dev server on :5174 via `FRONTEND_PORT=5174`.

## Self-Check: PASSED

- All 3 declared files (2 created + 1 modified) exist on disk.
- All 3 task commits (`ab1b0a03a`, `f426d8af6`, `67ccb58a9`) present in git history.
- Both new projects listed by the runner and green on fresh :5174 + clean DB; `yarn typecheck:tests` exits 0; 0 soft assertions.

---
*Phase: 130-e2e-specs-new-feature-coverage*
*Completed: 2026-07-19*
