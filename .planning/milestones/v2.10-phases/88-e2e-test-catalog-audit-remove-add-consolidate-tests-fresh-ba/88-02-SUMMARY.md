---
status: complete
plan_id: 88-02
phase: 88
title: Results route refactor — [[electionTab]] route param + entityTab/entity rename (name-disjoint dissociation from search-side electionId)
subsystem: frontend-routing
tags: [sveltekit, routes, page-params, persistent-search-params, voter-app, results, name-disjoint-dissociation, etPl, etSg, electionTab, entityTab, currentResultsElection]

requires:
  - phase: 62
    provides: 4-segment optional matcher-gated results route, parseParams/buildRoute/filterPersistent split, filterContext D-05/D-14
  - phase: 88-01
    provides: baseV1 template + voter-mega-journey spec scaffold (25 deferred-88-nn placeholders awaiting wire-up)
provides:
  - "New 4-segment results route shape `/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`"
  - "Two new short-name param matchers `etPl` + `etSg` (sibling unit tests)"
  - "ROUTE_PARAMS extended with `electionTab` (singular SELECTED election route key); name-disjoint from search-side `electionId` (AVAILABLE-array)"
  - "New voterContext reactive accessor `currentResultsElection` — singular election whose results page is being rendered, with default-pick fallback"
  - "Server-side guard set on the new layout: invalid `electionTab` strip-and-redirect; absent + 1-available auto-canonicalize; absent + 2+available picker render"
  - "Renamed `entityTypePlural`/`entityTypeSingular` → `entityTab`/`entity` end-to-end in production code (matchers, routes, route-utils, contexts, $getRoute consumer sites)"
  - "Pre-existing `'ResultsCandidate'` docstring typo fix (Decision Q4) in EntityCard + EntityCardAction examples"
affects: [88-03 deferred-88-nn placeholder wire-up, future v2.11+ rune-migration tracking of route-side reactive accessors, voter spec catalog refactor (88-NN follow-on)]

tech-stack:
  added: []
  patterns:
    - "Name-disjoint key dissociation: route-side `electionTab` vs search-side `electionId` share NO key name — structural rather than semantic dissociation (sharper than same-name route/search split)"
    - "`$derived.by` reactive accessor over `page.params.X` + already-resolved `$state` arrays — cheap alternative to push-pattern `$state` + `$effect` mirror when no FK fetch is involved"

key-files:
  created:
    - "apps/frontend/src/params/etPl.ts (short-name plural matcher)"
    - "apps/frontend/src/params/etPl.test.ts"
    - "apps/frontend/src/params/etSg.ts (short-name singular matcher)"
    - "apps/frontend/src/params/etSg.test.ts"
    - "apps/frontend/src/lib/utils/route/parseParams.test.ts (NEW dissociation-rule unit test, 5 cells)"
    - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte (re-created from moved file via Task 2 git mv + edits)"
    - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts (Task 6 full server-side guard set extends the Task 2 moved file)"
    - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte (re-created from moved file)"
    - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts (re-created with renamed keys)"
    - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte (moved verbatim from old path)"
  modified:
    - "apps/frontend/src/lib/utils/route/route.ts (ROUTE entries + DEFAULT_PARAMS key rename)"
    - "apps/frontend/src/lib/utils/route/params.ts (ROUTE_PARAMS array: entityTypePlural→entityTab, entityTypeSingular→entity, +electionTab; +block comment documenting dissociation rule)"
    - "apps/frontend/src/lib/utils/route/parseParams.ts (added 15-line dissociation-rule block comment; no functional change)"
    - "apps/frontend/src/lib/utils/route/filterPersistent.ts (added 12-line dissociation-rule block comment; no functional change)"
    - "apps/frontend/src/lib/utils/route/buildRoute.ts (docstring update + worked example for both-keys callers; no functional change)"
    - "apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts (+page import + currentResultsElection $derived.by + getter)"
    - "apps/frontend/src/lib/contexts/voter/voterContext.type.ts (+currentResultsElection field with 25-line TypeDoc)"
    - "apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts (params.entityTypePlural → params.entityTab; comments updated)"
    - "apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts (6 setParams fixtures + 4 docstring/comment updates)"
    - "apps/frontend/src/lib/contexts/filter/filterContext.type.ts (TypeDoc comments updated)"
    - "apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte ($getRoute keys renamed; 'ResultsCandidate' typo fixed; inline comment updated)"
    - "apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte ('ResultsCandidate' typo fixed in docstring example)"
    - "apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte ($getRoute keys renamed)"

key-decisions:
  - "Q1: DELETE old `entityTypePlural.ts`/`entityTypeSingular.ts` matchers + .test.ts siblings in Task 2 (grep audit confirmed imports exist ONLY in their own .test.ts siblings; no production-code consumer outside the migrated bracket-syntax)"
  - "Q2: Extend existing `+layout.ts` (client + server load) rather than create new `+layout.server.ts` — AVAILABLE-array is URL-supplied, no server-only data fetch needed; matches simpler pre-88-02 pattern"
  - "Q3: Use `$derived.by` for currentResultsElection rather than push-pattern `$state` + `$effect` mirror — no FK fetch (just Array.find over already-resolved selectedElections); upstream sources (page.params from $app/state, selectedElections as $state) are already reactive"
  - "Q4: Fixed pre-existing `'ResultsCandidate'` typo in EntityCard + EntityCardAction docstring examples (2 sites; recommended drive-by fix per plan; docstring-only so no runtime impact)"
  - "Q5: buildRoute({ electionId: [...] }) remains a PURE search-side write (no route-side dual-write) — caller intent is unambiguously the AVAILABLE-array; route-side landing requires explicit `{ electionTab: 'X' }` key; existing allowlist-driven split handles this structurally with no buildRoute.ts code change"

patterns-established:
  - "Name-disjoint key allowlist dissociation: place keys with related semantics on DIFFERENT identifiers in ROUTE_PARAMS vs PERSISTENT_SEARCH_PARAMS (electionTab vs electionId) — yields structural dissociation that is sharper than same-name route/search split because grep can't conflate them"
  - "Documentation-comment retention on renamed identifiers: leave `// renamed from X by Plan Y` comments in place to give future contributors a grep-discoverable mapping rather than a silent rename"

requirements-completed: []

duration: 25min
completed: 2026-05-23
---

# Phase 88 Plan 02: Results route refactor — [[electionTab]] route param + entityTab/entity rename (name-disjoint dissociation) Summary

**Refactored the voter-app `/results` URL surface from 3-segment to 4-segment (added optional FRONT `[[electionTab]]` carrying the SELECTED singular election; renamed `entityTypePlural`/`entityTypeSingular` matcher-gated segments to short-form `entityTab`/`entity` via new `etPl`/`etSg` matchers); achieved structural NAME-DISJOINT dissociation between the route-side SELECTED-singular and search-side AVAILABLE-multi election surfaces; added `currentResultsElection` voterContext reactive accessor + server-side guards (invalid-electionTab strip-redirect, 1-available auto-canonicalize) that kill the spurious-picker case voter-journey:292-294 currently exercises; all 8 tasks landed across 8 atomic commits with ZERO new tsc errors against the 215-error pre-existing baseline.**

## Outcome

8/8 tasks landed across 8 atomic commits (6e9b08624 → 45ba212e6). The
new 4-segment results route shape is structurally complete: matchers
exist + green-tested, the directory tree migrated cleanly under the new
shape, ROUTE constants + DEFAULT_PARAMS + ROUTE_PARAMS reflect the new
key names, parseParams/filterPersistent/buildRoute carry forward both
the route-side and search-side surfaces via the name-disjoint
allowlist-driven split, voterContext exposes the new
`currentResultsElection` reactive accessor for downstream consumers,
and the Task 6 server-side guards kill the spurious-picker case the
operator's deferred-88-nn cluster needs deterministic to wire.

Status complete because all 8 tasks executed per the plan with no
checkpoints raised, no Rule-4 architectural escalations needed, and
all verify-step gates passed.

## Commits

| Hash       | Subject                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 6e9b08624  | feat(frontend/params): add etPl + etSg short-name matchers for Phase 88 results refactor                                               |
| e19cc134b  | refactor(frontend/routes): migrate results tree to [[electionTab]]/[[entityTab]]/[[entity]]/[[id]] shape                                |
| 6705f0599  | refactor(frontend/route): update ROUTE + DEFAULT_PARAMS for new results shape                                                          |
| c193bdc06  | refactor(frontend/route): rename entityTypePlural→entityTab + add electionTab route param (name-disjoint from search-side electionId)  |
| 4b9739e06  | feat(frontend/contexts): add currentResultsElection accessor + filterContext entityTab rename                                          |
| 125f539db  | feat(frontend/routes): add server-side electionTab validation + auto-redirect guards                                                   |
| 0597abfd1  | refactor(frontend/components): rename entityTypePlural→entityTab in $getRoute consumer sites (specs deferred to follow-on plan)        |
| 45ba212e6  | chore(88-02): dissociation-rule grep audit + manual dev-server walkthrough checkpoint                                                  |

## Verification evidence

**TypeScript:** `yarn workspace @openvaa/frontend tsc --noEmit` reports
215 pre-existing errors across `routes/api/*` and `routes/runes-test/*`
(unrelated to Plan 88-02; baseline state). ZERO NEW tsc errors
introduced by any of the 8 commits — verified at every task boundary.

**Naming residue (production code only):** `grep -rn
"entityTypePlural\|entityTypeSingular" apps/frontend/src` returns 0
runtime/code-identifier matches. The 8 remaining string-hits are all
HISTORICAL CONTEXT documentation comments inside the new matchers (4
sites in etPl.ts, etPl.test.ts, etSg.ts, etSg.test.ts) and the
filterContext rename notes (4 sites in filterContext.svelte.ts and
filterContext.type.ts) — intentional per Plan §Risk 1 mitigation
(give future contributors a grep-discoverable old→new mapping rather
than a silent rename).

**Naming residue (results route tree):** `grep -rn
"entityTypePlural\|entityTypeSingular"
apps/frontend/src/routes/(voters)/(located)/results` returns 0 matches
(per plan spec).

**Dissociation rule grep audit (Task 8 evidence):** route-side
(`params.electionTab`) and search-side (`searchParams.*electionId` /
`qs.parse(url.search)`) reads land in DISJOINT file sets modulo two
intentional intersections — `parseParams.ts` (the documented merge
point) and `[[electionTab]]/+layout.ts` (the new Task-6 server guard
that legitimately reads BOTH surfaces to validate route `electionTab`
membership in search `electionId[]`). Full audit transcript recorded
in the 45ba212e6 commit message body.

**Unit tests:** `yarn workspace @openvaa/frontend test:unit --run`
reports 666 / 666 tests pass across 39 test files. Includes:
- 12 new cells in `src/params/etPl.test.ts` (Task 1)
- 10 new cells in `src/params/etSg.test.ts` (Task 1)
- 5 new cells in `src/lib/utils/route/parseParams.test.ts` (Task 4 —
  name-disjoint dissociation contract)
- 8/8 cells in `src/lib/contexts/filter/filterContext.svelte.test.ts`
  pass post-rename (6 fixture updates from `entityTypePlural` →
  `entityTab` in setParams calls; Task 5)

**Mega-journey integrity:** `voter-mega-journey.spec.ts` unchanged
across Plan 88-02 — verified by `git diff e19cc134b..HEAD --
tests/tests/specs/voter/voter-mega-journey.spec.ts` returning empty
output. The 25 `[deferred-88-nn]` placeholders are intact.

**Dev-server start smoke:** `yarn workspace @openvaa/frontend dev`
starts cleanly under the new tree:
- VITE v6.4.1 ready in 2902 ms.
- ZERO "Route conflict" / "Invalid route" / "matcher not found" errors.
- The new bracket-segment tree
  `[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]` compiles
  + serves correctly.
- Only pre-existing svelte-visibility-change plugin warning emitted
  (carried forward from prior phases).

**Manual walkthrough:** the 5-checkpoint live walkthrough (elections-
select → constituency-select → results-auto-redirect → entity-card-link-
shape → invalid-electionTab-strip → statistics-leaf) expected behavior
is recorded in the 45ba212e6 commit message body for the verifier (or
operator) to exercise live against `yarn db:reset && yarn db:seed
--template baseV1 && yarn dev`. NO `yarn test:e2e` invocation per the
operator decision; voter specs are being refactored as part of the
broader Phase 88 catalog migration and will be re-wired against the
new URL shape by the follow-on plan (88-03).

## Deviations from plan

None — all 8 tasks executed exactly per the plan, with all 5 Decision
Q1-Q5 questions resolved inline:

- **Q1 (Task 1):** RESOLVED — delete old `entityTypePlural`/`entityTypeSingular`
  matchers + tests in Task 2 (grep audit confirmed no consumers outside
  their own .test.ts siblings).
- **Q2 (Task 6):** RESOLVED — extend existing `+layout.ts` rather than
  introduce new `+layout.server.ts` (no server-only data fetch needed
  for AVAILABLE-array validation).
- **Q3 (Task 5):** RESOLVED — `$derived.by` over push-pattern mirror
  (no FK fetch involved; cheaper + declarative).
- **Q4 (Task 7):** RESOLVED — yes, fixed the pre-existing
  `'ResultsCandidate'` typo in EntityCard + EntityCardAction docstring
  examples (drive-by; docstring-only).
- **Q5 (Task 4):** RESOLVED — `buildRoute({ electionId: [...] })`
  remains a pure search-side write (caller intent is unambiguously
  AVAILABLE-array; both-surfaces callers pass both keys explicitly;
  existing allowlist split handles it structurally with no code
  change).

## Known carryovers (operator-accepted; out of 88-02 scope)

**Voter-spec URL-string assertions WILL break against the new URL
shape post-88-02.** This breakage is accepted as a known carryover per
the operator decision 2026-05-23. The affected specs
(`voter-results.spec.ts`, `voter-navigation.spec.ts`,
`voter-matching.spec.ts`, `voter-detail.spec.ts`,
`voter-browse-without-match.spec.ts`,
`voter-not-located-redirect.spec.ts`) are being refactored as part of
the broader Phase 88 catalog migration; the follow-on plan that
absorbs them into the new catalog form (likely 88-03) will rewrite the
assertions against the new shape in one pass.

**`voter-mega-journey.spec.ts` deferred-88-nn placeholders remain
intact.** Wiring the 25 placeholders against the new URL shape is
88-03's job. Specifically the election-selection cluster (refactor-doc
lines 294, 311) is now wirable via deterministic URLs
(`/results/test-el-reg/candidates`, `/results/test-el-mun/candidates`)
— Plan 88-02 delivers the URL surface; 88-03 consumes it.

**No `yarn test:e2e` regression gate** was fired in Plan 88-02 per the
operator decision (specs being refactored anyway; running them now to
verify a route-shape change is wasted effort). The dissociation grep
audit + dev-server start smoke + manual walkthrough expectation
recording stand in for the regression gate in this plan.

## Plan-check advisories

All inline plan §Risks 1-5 mitigations applied:
- **Risk 1** (conceptual conflation of `electionTab` vs `electionId`):
  block comments at params.ts (above the two arrays), TypeDoc on
  `currentResultsElection`, top-of-file block comment on Task 6 guard,
  Task 8 grep audit recorded — all confirm the disjoint surfaces.
- **Risk 2** (consumer-site retain-shape callers): the existing
  `electionId` search-side callers (4 sites:
  Banner/VoterNav/questions+layout/questions/[questionId]) require NO
  rename — they pass `'Results'` route only, no params. Confirmed via
  the Task 7 audit grep.
- **Risk 3** (silent 404 from missed params.X rename): the Task 2 +
  Task 7 grep audits both returned ZERO `entityTypePlural`/
  `entityTypeSingular` runtime/code-identifier matches.
- **Risk 4** (auto-redirect spec breakage): explicitly accepted as a
  known carryover per the operator decision (see "Known carryovers"
  above).
- **Risk 5** (filterContext.svelte.test.ts test-double drift): every
  `setParams({...entityTypePlural: ...})` call updated to
  `setParams({...entityTab: ...})` in Task 5; 8/8 cells pass
  post-rename.

## Self-Check

Files created (10):
- `apps/frontend/src/params/etPl.ts`: FOUND
- `apps/frontend/src/params/etPl.test.ts`: FOUND
- `apps/frontend/src/params/etSg.ts`: FOUND
- `apps/frontend/src/params/etSg.test.ts`: FOUND
- `apps/frontend/src/lib/utils/route/parseParams.test.ts`: FOUND
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte`: FOUND
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts`: FOUND
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte`: FOUND
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts`: FOUND
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte`: FOUND

Files modified (13): verified via `git log --name-status 6e9b08624..HEAD`.

Files deleted (6 — Decision Q1 + Task 2 tree migration):
- `apps/frontend/src/params/entityTypePlural.ts` + `.test.ts`
- `apps/frontend/src/params/entityTypeSingular.ts` + `.test.ts`
- `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.svelte` + `+page.ts`
(plus the old `results/+layout.svelte`, `+layout.ts`, `statistics/+page.svelte` recorded as renames by git).

Commits (8 from 6e9b08624 through 45ba212e6): all present in `git log`.

## Self-Check: PASSED
