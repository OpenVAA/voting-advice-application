---
phase: 189-documentation-and-closure
plan: "04"
subsystem: docs
tags: [docs, navigation, generator, vitest, sveltekit]
status: complete

requires:
  - phase: 189 (CONTEXT A-01, A-02; RESEARCH Pitfall 1, assumption A5)
    provides: the documentation subtree, its titles, and the rule that the deployment overview stays at its own path with no redirect
provides:
  - "Three pages with final titles and an opening paragraph: deployment/hosted-settings (Hosted Supabase settings), deployment/operations (Operations), configuration/analytics (Analytics)"
  - "navigation.config.ts regenerated: Analytics under Configuration; Deployment a section whose first child is Overview (/developers-guide/deployment, fixedTitle), then Hosted Supabase settings and Operations"
  - "The nav generator lists a subsection's own page as its Overview child and puts a new such child first, so the overview stays a link and a rerun changes nothing"
affects: [189-08, 189-10, 189-11, 189-12, 189-13, 189-14, 189-15, 189-16]

actuals:
  tokens: 4486
  tasks: 3
  commits: 5
plan_head_before: 1329dd52e242150536b7e1c4ec139f32c413f95b
plan_head_after: 70e971af74106113c5608d116937d5e77cbb9e10

tech-stack:
  added: []
  patterns:
    - "A nav section with a page of its own gets an Overview child from the generator, never from a hand edit the generator would undo"

key-files:
  created:
    - apps/docs/src/routes/(content)/developers-guide/deployment/hosted-settings/+page.md
    - apps/docs/src/routes/(content)/developers-guide/deployment/operations/+page.md
    - apps/docs/src/routes/(content)/developers-guide/configuration/analytics/+page.md
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-04-navigation.md
  modified:
    - apps/docs/scripts/generate-navigation-config.ts
    - apps/docs/scripts/generate-navigation-config.test.ts
    - apps/docs/src/lib/navigation.config.ts

key-decisions:
  - "NAV_DECISION=generator-overview (operator, bound under attempt 20261120T124525Z.addfc700f): the generator lists a subsection's own page as its Overview child; the overview stays at /developers-guide/deployment with no redirect stub and no inbound link change"
  - "compareSection puts a new child whose route is the section's own route first, so the Overview child leads its section in a generated config rather than through a hand reorder"

patterns-established:
  - "Run Prettier on the nav config from apps/docs: the root .prettierignore lists docs, so a root-run check proves nothing"

requirements-completed: [DOCS-01, DOCS-02, DOCS-05, DOCS-06]

coverage:
  - id: D1
    description: "Three pages exist with their final titles; no deployment/render page"
    requirement: DOCS-01
    verification:
      - kind: other
        ref: "Task 1 automated verify (head -1 of each page; test -e deployment/render exits 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The deployment overview is a link in the generated nav through an Overview child, and the generator keeps it"
    requirement: DOCS-01
    verification:
      - kind: unit
        ref: "apps/docs/scripts/generate-navigation-config.test.ts#a nested section with a page of its own"
        status: pass
      - kind: other
        ref: "Task 3 automated verify (docs test:unit, validate:links --check, Deployment entry holds Overview at its own route)"
        status: pass
    human_judgment: false

duration: 41min
completed: 2026-11-20
---

# Phase 189 Plan 04: The deployment subtree and the nav's Overview child Summary

NAV_OVERVIEW_KEPT=no
NAV_DECISION=generator-overview

**The nav generator now gives a section that has its own page an Overview child, listed first, so `/developers-guide/deployment` stays a nav link once Deployment has the hosted-settings and operations pages under it. The analytics page sits under Configuration, and running the generator again on the committed config changes nothing.**

## Performance

- **Duration:** 41 min of wall-clock time from plan start to Task 3's commit, including the wait at the Task 2 checkpoint
- **Started:** 2026-11-20T12:43:20Z
- **Completed:** 2026-11-20T13:24:50Z
- **Tasks:** 3
- **Files modified:** 7 (6 under `apps/docs`, plus the evidence file)

## Accomplishments

- Three pages with final titles and an opening paragraph: Hosted Supabase settings, Operations, Analytics.
- Measured that the generator dropped a hand-added Overview child, writing `// Removed: /developers-guide/deployment` instead (`NAV_OVERVIEW_KEPT=no`). The operator chose `generator-overview`.
- `buildSubsectionChildren` now starts the children of any subsection that has its own page with `{ title: 'Overview', route, fixedTitle: true }`. `compareSection` puts a new child of that kind first.
- The regenerated config changed only the Deployment entry (`1 file changed, 6 insertions(+)`). A rerun on the committed file changes nothing (`NAV_IDEMPOTENT_AFTER=yes`).
- Gates: docs unit tests exit 0, 37 -> 41 tests (`DOCS_UNIT_DELTA=+4`). `validate:links --check` reports 0 findings. `yarn workspace @openvaa/docs check` reports 0 errors and 0 warnings. ESLint and Prettier are clean.

## Task Commits

1. **Task 1: Three pages, the nav regenerated, and the generator's handling of an Overview child measured** - `addfc700f` (docs; previous executor)
2. **Task 2: The decision** - no commit. The operator's reply is stored under attempt key `189-04-2`, and its binding is recorded in the evidence (committed in `70e971af7`).
3. **Task 3: The chosen way implemented**, TDD:
   - `204b1a89e` (test) three cases, two red for the behaviour under test, plus the `buildNavigationStructure` export
   - `c7ce359f4` (feat) `buildSubsectionChildren` adds the Overview child
   - `06de9125f` (test) a fourth case, red: a new Overview child must come first
   - `70e971af7` (feat) `compareSection` ordering, the regenerated config and the evidence

## Files Created/Modified

- `apps/docs/scripts/generate-navigation-config.ts`: Overview child in `buildSubsectionChildren`; a new self-route child goes first in `compareSection`; `buildNavigationStructure` exported, with TSDoc.
- `apps/docs/scripts/generate-navigation-config.test.ts`: `describe('a nested section with a page of its own')`, four cases.
- `apps/docs/src/lib/navigation.config.ts`: regenerated; Deployment starts with Overview.
- `evidence/189-04-navigation.md`: Task 2 binding and Task 3 runs, with `NAV_IDEMPOTENT_AFTER`, `NAV_DECISION`, `DOCS_UNIT_EXIT` and `DOCS_UNIT_DELTA`.

## Decisions Made

- `generator-overview`, chosen by the operator. The binding was checked with `attempt.sh bound` and `has`; both exited 0.
- The Overview child is placed first by the generator, not by a hand reorder, so the config stays generated (T-189-07).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A new Overview child was appended last instead of first**
- **Found during:** Task 3, on the first regeneration after `buildSubsectionChildren` changed
- **Issue:** `compareSection` appends every child it finds new, so on the real config the Overview child landed after Hosted Supabase settings and Operations. The plan requires it first.
- **Fix:** a red test (`06de9125f`), then `compareSection` unshifts a new child whose route equals the section's route (`70e971af7`).
- **Files modified:** `apps/docs/scripts/generate-navigation-config.ts`, `apps/docs/scripts/generate-navigation-config.test.ts`
- **Verification:** 41/41 unit tests pass; the regenerated Deployment entry starts with Overview.

---

**Total deviations:** 1 auto-fixed (Rule 1). One extra test and one extra branch, no scope beyond the plan's behaviours.

## Issues Encountered

- The "no page, no Overview" case passed before the change. It guards against the change reaching too far, so it was never expected to go red. The two behaviour cases were red for the right reason (see evidence).
- The run that adds the child also writes a `// New` comment, and the next run removes it. The committed config is the settled output, and a run on it changes nothing.

## Known Stubs

The three new pages each hold only a title and an opening paragraph, by design. Later plans fill them: hosted-settings in 189-08, analytics in 189-10, operations in 189-13 and 189-14. That fill is the plan's stated output, so these are not defects.

## User Setup Required

None.

## Next Phase Readiness

Later docs plans can link to `/developers-guide/deployment` and its two child pages. The path is final, and the nav reaches all three.

---
*Phase: 189-documentation-and-closure*
*Completed: 2026-11-20*

## Self-Check: PASSED
