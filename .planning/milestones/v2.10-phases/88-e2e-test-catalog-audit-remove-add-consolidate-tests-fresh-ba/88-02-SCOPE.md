# Plan 88-02 — Scope memo

**Drafted:** 2026-05-23
**For:** `/gsd-plan-phase 88` (Plan 88-02)
**Operator request:** routing change to make e2e tests pass; specifically to support the deferred-88-nn results/election-selection cluster in the voter mega-journey.

## Operator's words (verbatim)

> As part of making the e2e tests pass, make this change to election selection in results. Add a route param before entityTypePlural = `[[electionId]]` which governs the selected election to show. It's important to dissociate this from the electionId[] search params which control the AVAILABLE elections. In order to make the folder names more readable change them to:
>
> `[[electionId]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`

## Operator amendment (2026-05-23, post-planner-spawn)

> Actually, let's call the first param `[[electionTab]]`

This is a strict win for clarity: `electionTab` (route key) and `electionId` (search key) are now NAME-DISJOINT. The route-vs-search dissociation becomes structural — different keys, never aliased — rather than a same-name semantic split. All discussion below was originally drafted with `electionId` as the route key; substitute `electionTab` for route-side references and keep `electionId` for search-side references throughout. The PLAN file (`88-02-PLAN.md`) has been updated accordingly; this SCOPE memo retains the original wording for historical fidelity with the operator-amendment block above as the binding override.

## What this plan changes

**Today** (`apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/`):

```
results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]
```

- Folder names long & verbose.
- The *selected* election whose results are being shown is read from the persistent search-param tuple `?electionId=…` (or `?electionId[]=…` array form) via `voterContext.selectedElections`.
- The list of *available* elections (what the voter is choosing among) lives in the same search-param surface — no separation.

**After Plan 88-02:**

```
results/[[electionId]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]
```

- Optional `[[electionId]]` segment at the FRONT, identifying the singular election whose results are being shown.
- `[[entityTab]]` matched by `etPl` (renamed from `entityTypePlural`).
- `[[entity]]` matched by `etSg` (renamed from `entityTypeSingular`).
- `[[id]]` unchanged.

## Critical dissociation rule (operator's emphasis)

| Concern | Location | Meaning |
|---|---|---|
| *Selected* election (singular) — whose results page is being rendered | Route param `[[electionId]]` | One election at a time; missing = "auto-pick first available" or "show election picker." |
| *Available* elections (zero-or-more) — what the voter chose at `/elections` | Search param `?electionId=…` (existing persistent-param surface; per `apps/frontend/src/lib/utils/route/params.ts`) | The voter's scope choice; survives navigation; drives nomination/question filtering via `voterContext.selectedElections`. |

These MUST stay dissociated. The voterContext continues to expose `selectedElections` as the AVAILABLE-array; results pages read the *selected* election from the new route param (and validate it's a member of the available array; redirect if not).

## Probable scope (planner refines)

1. **New param matcher files:**
   - `apps/frontend/src/params/etPl.ts` — accepts `'candidates' | 'organizations' | 'alliances'` (body identical to existing `entityTypePlural.ts`; just a short-name alias).
   - `apps/frontend/src/params/etSg.ts` — accepts `'candidate' | 'organization' | 'alliance'` (body identical to existing `entityTypeSingular.ts`).
   - Tests sibling each (mirror existing `entityTypePlural.test.ts` / `entityTypeSingular.test.ts`).
   - **Decision for the planner:** keep both new + old matcher files during the transition OR delete the old ones in the same plan (depends on whether any other route still uses the long-name matchers — grep first).

2. **Directory rename + new front segment:**
   - From: `results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/`
   - To:   `results/[[electionId]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/`
   - `+page.svelte` / `+page.server.ts` / `+layout.svelte` / `+layout.server.ts` MIGRATE INTO the new tree.
   - `params.electionId` is FREEFORM (no matcher) — accepts any non-empty string; runtime validation happens in `+page.server.ts` (or `+layout.ts`) against the available-elections list from `voterContext`, with redirect-to-self-with-stripped-segment when invalid.
   - `params.entityTab` and `params.entity` typing inherits from the matchers.

3. **Route map (`apps/frontend/src/lib/utils/route/route.ts`) — `ROUTE` entries that change:**
   - `Results: '/results/[[electionId]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]'`
   - `ResultCandidate`, `ResultEntity`, `ResultParty` — same skeleton; `DEFAULT_PARAMS` block for the latter two needs review (the existing `entityTypePlural: 'candidates'` etc. defaults must map to `entityTab` / `entity` keys instead).
   - `Statistics: '/results/[[electionId]]/statistics'` — preserved at the leaf.

4. **`buildRoute` + `Params` + `parseParams` + `filterPersistent`:**
   - `Params` type adds `electionId` (already exists as string-or-array; the route-param vs search-param distinction is now key — see `params.ts`'s persistent-param list).
   - `parseParams(current)` must extract `current.params.electionId` (route side) WITHOUT also pulling it from `current.url.searchParams` (search side). The two are semantically different post-refactor; `buildRoute` callers that pass `{ electionId: 'foo' }` need to land it on the ROUTE segment by default and only on the search side when explicitly tagged.
   - `filterPersistent` — keep `electionId` in the persistent search-param list (so the available-array still survives navigation), but the route-param value is OUT of the persistent surface.

5. **Voter-context dissociation:**
   - `voterContext.selectedElections` keeps its current semantics (= AVAILABLE array, read from search params via the existing persistent surface).
   - A NEW getter `voterContext.currentResultsElection` (or similar — planner picks) returns the election matching `page.params.electionId` (the *selected* one), with a default-pick fallback to first-available when the route param is absent.
   - Note the spike-findings destructure rule: the new getter is a reactive accessor; consumers must read via `ctx.currentResultsElection`, never destructure.

6. **Server-side guards (`+page.server.ts` / `+layout.server.ts` under the new tree):**
   - If `params.electionId` is set but doesn't exist in the loader's election list → redirect to `/results` with the param stripped, preserving search params (the available array).
   - If `params.electionId` is set but NOT a member of `voterContext.selectedElections` (= available array) → redirect or 404 (planner picks; default-redirect is gentler).
   - If `params.electionId` is absent AND there are 2+ available elections → render the existing election-picker shape (no change from today).
   - If `params.electionId` is absent AND there's exactly 1 available → auto-redirect to `/results/{thatElectionId}` (avoids the spurious-picker case voter-journey lines 292-294 currently exercise; this is the e2e-determinism win the operator is after).

7. **Existing routing-related specs to update:**
   - Per `TEST-INVENTORY.md`, sections 9.5 (voter-results) + 9.5.4 / 9.5.8 / 9.5.9 / 9.5.11 / 9.5.12 / 9.5.13 are the route-shape tests (refactor-doc:387-397 — explicitly OUT OF SCOPE for 88-01, but they DO live within Phase 88's broader audit). Plan 88-02 should NOT migrate them into the mega-journey (that's 88-NN's job per Plan 88-01 deferred cluster) — but they DO need URL-shape updates to match the new tree.
   - `tests/playwright.config.ts` `voter-app` testIgnore regex extension (Plan 88-01 Task 5) — should not need changes; `voter-results.spec.ts` stays under voter-app, just with new URLs.

8. **Voter mega-journey hookup (the actual operator-stated motive):**
   - Some of the 25 `[deferred-88-nn]` placeholders in `voter-mega-journey.spec.ts` become wirable AFTER this refactor lands:
     - The "select election (Reg)" step (refactor-doc:294) can now use a deterministic URL `/results/test-el-reg/candidates` instead of clicking the in-page election picker (which is flaky under cold-start cascades).
     - The "switch election (Mun)" step (refactor-doc:311) becomes `goto('/results/test-el-mun/candidates')` — deterministic.
     - The "switch entity type" / "switch back" steps become URL changes on the second segment.
   - Plan 88-02 itself does NOT wire these — that's the next plan after 88-02 (probably 88-03 or a renamed 88-02 follow-on). But the planner should NOTE which deferred placeholders this refactor unblocks so 88-03 has a clear backlog.

## Out of scope (do NOT do in 88-02)

- Migrating the deferred-88-nn voter-mega-journey steps to real assertions (that's a sibling/follow-on plan after 88-02 lands).
- Migrating refactor-doc lines 379+ (still deferred to subsequent 88-NN plans).
- Retiring `--likert-only` flag (already in the 88-NN backlog).
- Retiring per-variant setup files.
- Final v2.10 anchor capture.
- Modifying ROADMAP.md / STATE.md (orchestrator handles state).

## Gating constraints

- Existing test suite (current 86 / 87 / 88-01 pass state) MUST stay green at every commit.
- The change is **invasive on the URL surface** (every result-page link in every spec changes form). Run the relevant projects after each task; full suite at the end.
- The `voter-app` project's `testIgnore` extension from 88-01 stays as-is. The mega-journey spec MAY benefit but is NOT modified in 88-02 (intentional — keep the deferred-88-nn placeholders intact for the follow-on plan).
- The dissociation rule is load-bearing — the planner must produce a verification step that asserts `params.electionId` (route) and `url.searchParams.electionId` (search) are read by DIFFERENT code paths, with a concrete test or grep audit.

## Why this is Plan 88-02 (not a sibling phase or a 88-01 amendment)

- 88-01 is closed (status: partial; 7/7 commits landed; 25/30 mega-journey steps deferred). Amending 88-01 retroactively would muddy the boundary.
- This change directly serves Phase 88's mission ("make the e2e tests pass with a forward-looking baseline"). Sibling phase would force a parallel-execution context unnecessarily.
- The dependency direction is: 88-02 (route refactor) → 88-03+ (wire deferred mega-journey steps) → 88-LAST (final v2.10 anchor). Linear.

## Authoritative inputs the planner should read

1. This memo (`88-02-SCOPE.md`).
2. `apps/frontend/src/lib/utils/route/route.ts` — ROUTE constants + DEFAULT_PARAMS.
3. `apps/frontend/src/lib/utils/route/buildRoute.ts` — the builder that all 134 consumer sites use.
4. `apps/frontend/src/lib/utils/route/parseParams.ts` + `params.ts` — persistent-param logic + the existing electionId search-param surface.
5. `apps/frontend/src/params/entityTypePlural.ts` + `entityTypeSingular.ts` — matcher precedents.
6. `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/**` — the current page tree (the files that MIGRATE).
7. `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — `selectedElections` and where it's read; planner identifies the right place to add the new `currentResultsElection` getter (or equivalent).
8. `tests/tests/specs/voter/voter-results.spec.ts` — primary spec under voter-app that tests results URL shapes (sections 9.5.4 / 9.5.8 / 9.5.9 / 9.5.11 / 9.5.12 / 9.5.13 per TEST-INVENTORY.md).
9. CLAUDE.md "Context Destructuring Rule (Svelte 5)" — applies to the new reactive getter on voterContext.
10. `tests/TEST-INVENTORY.md` sections 9.5.x — for cross-referencing which existing tests assert URL shapes.

## Planner's deliverable

`.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-02-PLAN.md` with the usual frontmatter, must_haves, Approach, Task Breakdown, Verification, Risks & Mitigations, Out-of-scope, and Deferred-to-subsequent-plans sections.
