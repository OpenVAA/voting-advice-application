---
phase: 165-results-navigation-redraw
plan: 04
subsystem: frontend
tags: [sveltekit, routing, optional-params, layout-split, route-matchers, context-reactivity, guard-test, regression]

# Dependency graph
requires:
  - phase: 165-02
    provides: "The root-level drawer host and the render-nothing `EntityDrawerOpener`, which is what makes the results tree's source order irrelevant and collapses RESEARCH Pitfall 2's two-move migration into one"
  - phase: 165-03
    provides: "The `voter-results-redraw` Playwright project, the `voter-results-list-container` testid and the node-identity technique this plan's new cases extend"
  - phase: 165-01
    provides: "Finding C — the derived verdict that no live emitter produces the cross-type URL shape — and the evidence-ledger discipline this plan's § 2d follows"
provides:
  - "A three-level results route tree: an election-tab layout owning the chrome, picker, page-entry analytics and both popup countdowns; an entity-tab layout owning the type tabs, the implied-type gate and the tab-change handler; and ONE innermost page owning the list and the drawer opener"
  - "`results/[[electionTab]]/resultsRoutes.ts` — `buildListRoute`, `narrowEntityPlural` and `pluralForEntityType` as the single source of the list URL for all three levels, carrying the no-force-fill comment that three copies would have lost"
  - "`results/statistics/` — the statistics page re-homed out of the results layout chain with `ROUTE.Statistics` moved in the same commit (D-25)"
  - "`page.guards.test.ts` — the unit half of D-10, asserting STATUS CODES rather than the fact of a throw, proven necessary by a positive control"
  - "Two new E2E cases: the four emitted URL shapes each resolving to one list, and the implied-tab → explicit-tab switch asserted not to remount the container"
  - "A recorded pre-existing defect (`165-NEGATIVE-CONTROL.md` § 2d) and a recorded pre-existing URL-shape defect (`deferred-items.md`) that this plan found, contained, and deliberately did not fix"
affects: [165-05, 165-06, 165-07, 165-08]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 18868          # chars/4 over the realized apps+tests diff (75,475 bytes). Estimate was 42,500 — this came in at ~44% of it. The reason is D-07's CORRECTED reversibility rating being right: no route id changed, so route.ts, DEFAULT_PARAMS, buildListRoute's shape, routeConsistency.test.ts and both leaf guards needed no structural work. What the estimate could not have priced is the regression hunt, which cost three full E2E runs of wall-clock but almost no diff.
  tasks: 3
  commits: 3             # MEASURED: git rev-list --count 260a3ffe4..HEAD at SUMMARY-write time.
                         # 3 task commits (dcca8cfe3, 611399452, 4c637bce2). The SUMMARY commit and the
                         # STATE/ROADMAP commit land after this line is written, so a later re-measure
                         # returns 5; that increment is the fixed point, not drift.
plan_head_before: 260a3ffe486c4c1e8111964fda814fe86ac8e0ce

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nested optional-param layouts: `[[a]]/[[b=matcher]]/…` with ONE page node at the leaf. Every URL shape resolves to the same page component instance, so navigation between shapes updates rather than remounts. Verified against SvelteKit's own generated `$types.d.ts` — the new layout's `LayoutRouteId` union contains the leaf route id and `LayoutParams` declares all four params optional"
    - "Each route level RE-DERIVES what it needs from `page.params` plus the context rather than receiving it prop-drilled from the level above. That is what keeps 'the URL is the single source of truth' true across three files instead of one"
    - "An OVERLAY keyed on its own params is not a child of the list hierarchy: the entity-tab layout renders children on `activeEntityType || drawerVisible`, so a drawer deeplink survives a state in which no entity type can be resolved"
    - "Verify a new SvelteKit route file through `.svelte-kit/types/**/$types.d.ts`, NEVER through `.svelte-kit/generated/client/app.js` — `sync` writes the former and leaves the latter stale (RESEARCH Pitfall 4, honoured here)"
    - "A guard test asserts the STATUS CODE, never the fact of a throw. Proven necessary rather than asserted: disabling the 404 guard still produced a throw (a 307 from the sibling coupling guard), so `toThrow()` would have passed"

key-files:
  created:
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/resultsRoutes.ts
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts
    - apps/frontend/src/routes/(voters)/(located)/results/statistics/+page.svelte
  modified:
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte
    - apps/frontend/src/lib/routes/route.ts
    - tests/tests/specs/voter/voter-results-redraw.spec.ts
    - .planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md
    - .planning/phases/165-results-navigation-redraw/deferred-items.md

key-decisions:
  - "The entity-tab layout renders children on `activeEntityType || drawerVisible` rather than on `activeEntityType` alone. D-08's literal shape ('render the chooser INSTEAD of children') would have nested the drawer opener behind the implied-type gate, where the pre-split layout had rendered it ABOVE — and that silently broke drawer deeplinks whose election cannot be resolved. The carve-out preserves D-08's intent (children render only when there is something for them to render) while keeping the pre-split behaviour the restructure promised to preserve."
  - "The statistics move was verified by `yarn workspace @openvaa/frontend check` plus direct path assertions, NOT by the route-consistency test the plan named. That test walks only `(protected)` group directories and mentions results solely as an `isProtectedRoute` negative control, so it cannot catch a half-applied results move. The criterion was satisfied on its intent; the drift is recorded in § 2d."
  - "`resultsRoutes.ts` also carries `narrowEntityPlural` and `pluralForEntityType`, not just `buildListRoute`. The plan asked for the plural narrowing to move; the entity-type→plural mapping is the same kind of duplicated knowledge and was needed by two of the three levels, so keeping it in the layout would have reintroduced exactly the triplication the module exists to prevent."
  - "The innermost page keeps a `{#if activeEntityType}` around its list even though the entity-tab layout already gates on the same value. It is a TYPE NARROWING, not a duplicate gate — `activeMatches` being defined does not narrow `activeEntityType` for TypeScript — and it is what makes the drawer-only case render the opener and no list. The file says so in place."
  - "The E2E gate was widened from the plan's two projects to the WHOLE suite. This plan restructures the route tree every voter-side spec navigates through, so a two-project run could not have shown the restructure left the suite intact — and in fact the full suite is what caught the drawer regression."
  - "The picker shape asserts ZERO lists and a visible picker, not 'exactly one list' as the plan's uniform wording asked. Derived: the base dataset seeds two elections and the walk selects both, so no single-election fallback and no loader canonicalization apply and the bare `/results` genuinely renders D-08's picker branch. Asserting a list there would have asserted the opposite of the decision under test."

patterns-established:
  - "Stage before you trust a tracked-file guard (carried from 165-02 and 165-03, applied again): `scripts/assert-comment-hygiene.mjs` intersects its glob with `git ls-files`. The scanned-file count moved 1721 → 1723 → 1724 as each new file was staged, which is the positive control that the gate examined the new work rather than skipping it"
  - "A/B the regression against the baseline commit before accepting any root-cause story: the localisation failure was reproduced in isolation, then run at `260a3ffe4` (green, 70 passed) and mid-plan (red). Only then was a mechanism proposed. Project memory records the cost of accepting an unverified diagnosis"
  - "Park work in a WIP commit, never the shared stash, when a bisect needs the working tree. The stash stack is shared across worktrees; a temporary commit plus `git reset --soft` is reversible and private"

requirements-completed: [RNAV-04]

coverage:
  - id: D1
    description: "The results routes are three levels — election-tab layout (chrome, picker, entry analytics, countdowns), entity-tab layout (type tabs, implied-type gate, tab handler), and ONE innermost page (list, drawer opener) — with no page file at the entity-tab level (criterion 4 / RNAV-04, D-07, D-08)"
    requirement: RNAV-04
    verification:
      - kind: automated_ui
        ref: "test -f '<L2>/+layout.svelte' && test ! -e '<L2>/+page.svelte' && grep -q '@render children()' '<L1>' && test \"$(grep -c '_children' '<L1>')\" = 0 (exit 0)"
        status: pass
      - kind: command
        ref: "SvelteKit generated types: .svelte-kit/types/.../[[entityTab=etPl]]/$types.d.ts — LayoutRouteId union contains the leaf route id; LayoutParams declares electionTab/entityTab/entity/id all optional"
        status: pass
    human_judgment: false
  - id: D2
    description: "All four params stay OPTIONAL and no redirect is introduced, so every emitted URL shape resolves to the same single page node and the list stays one component instance — including the implied-default-tab case (D-08)"
    requirement: RNAV-04
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-results-redraw.spec.ts#the picker, election, election+plural and full entity shapes each render exactly one list"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-results-redraw.spec.ts#switching from the IMPLIED default tab to an explicit tab does not remount the list container"
        status: pass
      - kind: command
        ref: "git diff --name-status integration/ship-12-squash...HEAD -- '.../results' — the leaf page path does not appear, i.e. no route id changed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both leaf guards survive the split with their doc-comments — the matcher-fallthrough 404 and the entity-without-id / id-without-entity 307 — and are pinned by a unit test that asserts status codes (D-10, T-165-02, T-165-03)"
    requirement: RNAV-04
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts (8 passed, exit 0)"
        status: pass
      - kind: command
        ref: "Positive control: disabling the 404 guard turned the file red (1 failed) on the status-code assertion; reverted and proven three ways (git diff --exit-code 0, hash-object 3c018bf684b5c936c335930612eba94a48cc5e8f, git status clean); restored baseline green"
        status: pass
    human_judgment: false
  - id: D4
    description: "The statistics route stops silently rendering the results page: it is re-homed out of the results layout chain, its route constant moves in the same commit, and the pre-existing swallow is recorded as a finding of this phase with both rejected dispositions named (D-25)"
    requirement: RNAV-04
    verification:
      - kind: automated_ui
        ref: "test -f 'results/statistics/+page.svelte' && test ! -e 'results/[[electionTab]]/statistics' && grep -q 'results/statistics' route.ts && grep -c 'electionTab.*statistics' route.ts == 0 (exit 0)"
        status: pass
      - kind: command
        ref: "git log --diff-filter=R -1 --name-status → R100 rename, not a delete+add; 165-NEGATIVE-CONTROL.md § 2d present with both rejected dispositions"
        status: pass
    human_judgment: false
  - id: D5
    description: "The route test enumerates only the shapes the application itself emits; the cross-type shape is dropped per 165-01's derived verdict, with the drop recorded and the shape proven still routable (D-09)"
    requirement: RNAV-04
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-results-redraw.spec.ts — four shapes enumerated (picker, election, election+plural, full same-type entity); cross-type absent, with the describe's doc-comment stating the drop"
        status: pass
      - kind: unit
        ref: "page.guards.test.ts#the cross-type shape stays routable, because D-09 forbids canonicalisation"
        status: pass
    human_judgment: false
  - id: D6
    description: "The restructure changed no behaviour the phase did not intend to change, measured across the whole browser suite rather than the two named projects"
    requirement: RNAV-04
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-04-full-2 --no-db-reset (exit 0, preflight confirmed, 170 passed / 0 failed / 0 did-not-run)"
        status: pass
      - kind: command
        ref: "yarn workspace @openvaa/frontend check (exit 0, 2195 files, 0 errors 0 warnings); TURBO_FORCE=true yarn test:unit (exit 0, frontend 105 files/1846 tests, dev-seed 60/795); yarn lint:check (exit 0)"
        status: pass
    human_judgment: false

# Metrics
duration: 58 min
completed: 2026-09-23
tasks: 3
files: 10
---

# Phase 165 Plan 04: The three-level results route tree — Summary

The single 401-line results layout is now three route files under four still-optional params, with one
page node at the leaf, and the statistics route no longer silently renders the results page.

## Performance

- **Started:** 2026-09-23T09:48:17Z
- **Ended:** 2026-09-23T10:46:23Z
- **Duration:** 58 min
- **Tasks:** 3
- **Files created/modified:** 10 (4 created, 6 modified)

## Accomplishments

1. **The statistics route is re-homed and the swallow is on the record (D-25).** `git mv` to
   `results/statistics/` with `ROUTE.Statistics` moved in the same commit, recorded as an `R100`
   rename. `165-NEGATIVE-CONTROL.md` § 2d derives the defect from the compiled manifest (statistics
   and the results leaf shared layout chain `[2,3,5]`; node 5 is the results layout, which renamed
   `children` to `_children` and never rendered it) and from a zero-consumer scan, names both
   rejected dispositions with D-25's reasons, and states plainly that the defect predates the phase.

2. **The route tree is three levels with one page node (D-07, D-08).** The election-tab layout keeps
   the chrome, picker, both empty states, the page-entry event and both popup countdowns, and now
   renders `{@render children()}` INSIDE its `fullWidth` snippet so the descendant-owned list stays
   in the full-width region. A new entity-tab layout at the OPTIONAL `[[entityTab=etPl]]` path owns
   the tab strip, the implied-type gate and the tab-change handler with all three `noScroll` branches.
   No `+page.svelte` sits beside it — that second page node is what produced spike 033's remount.

3. **`resultsRoutes.ts` is the single source of the list URL.** `buildListRoute` moved whole with its
   name-disjointness doc-comment and the no-force-fill comment, joined by `narrowEntityPlural` and
   `pluralForEntityType`. All three levels emit through it, so the Post-88-02 loop fix cannot be lost
   in one of three copies.

4. **The innermost page owns the list and the drawer opener.** Every inventory row moved with its
   comments intact — the tie-break rationale, the `{#key}` scope-tuple note, the silent-degradation
   catch, the close handler's `noScroll` note. Its doc-comment is rewritten (it had claimed the page
   is "deliberately empty"), and the drawer-first source-order comment is NOT carried across.

5. **Both leaf guards are pinned by status code (D-10).** `page.guards.test.ts` covers the four rows
   plus the bare list shapes and the cross-type shape. A positive control proved the design necessary:
   with the 404 guard disabled the URL STILL throws — a 307 from the sibling coupling guard — so a
   bare `toThrow()` would have passed.

6. **The emitted URL shapes are enumerated and the implied-tab remount is asserted against (D-08, D-09).**
   Four shapes, cross-type dropped per 165-01's derived verdict with the drop recorded both in the
   spec and in § 6 of the evidence doc, and the shape proven still routable by a guard-test row.

## Task Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Re-home statistics, record the swallow (D-25) | `dcca8cfe3` | statistics page (renamed), `route.ts`, `165-NEGATIVE-CONTROL.md` |
| 2 | Extract the route builder, add the entity-tab level (D-07, D-08) | `611399452` | `resultsRoutes.ts`, `[[entityTab=etPl]]/+layout.svelte`, `[[electionTab]]/+layout.svelte` |
| 3 | Innermost page owns list + opener; pin guards and shapes (D-08, D-09, D-10) | `4c637bce2` | leaf `+page.svelte`, `page.guards.test.ts`, redraw spec, `[[entityTab=etPl]]/+layout.svelte`, both planning docs |

## Files Created/Modified

**Created**
- `.../results/[[electionTab]]/resultsRoutes.ts` — the shared route builder and the two narrowings
- `.../results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte` — the entity-tab level
- `.../results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts` — D-10's unit half
- `.../results/statistics/+page.svelte` — re-homed (recorded as a rename)

**Modified**
- `.../results/[[electionTab]]/+layout.svelte` — split down to chrome + picker + lifecycle; renders children
- `.../results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte` — empty → list + opener
- `apps/frontend/src/lib/routes/route.ts` — `ROUTE.Statistics`
- `tests/tests/specs/voter/voter-results-redraw.spec.ts` — two new describes
- `165-NEGATIVE-CONTROL.md` — § 2d added; § 6 closed out with the applied verdict
- `deferred-items.md` — three out-of-scope findings recorded

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one is the first: the entity-tab layout gates
children on `activeEntityType || drawerVisible` rather than on `activeEntityType` alone, which departs
from D-08's literal wording in order to keep D-08's promise that the restructure is behaviour-equivalent.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Regression I introduced] The drawer stopped opening when no entity type could be resolved**

- **Found during:** Task 3, by the full E2E suite (`perm-localisation-positive`).
- **Issue:** Nesting the drawer opener in the innermost page put it behind the entity-tab layout's
  implied-type gate. The pre-split layout rendered the opener ABOVE that gate. On a bare `/results`
  (reached with no `?electionId=` search params, which is what `resultsPage.goToPage()` does), entity
  card links carry no election segment; SvelteKit then slots the PLURAL into the freeform
  `[[electionTab]]`, no election resolves, `currentResultsEntityType` goes `undefined`, and the drawer
  never mounted — a blank page where a deeplink used to work.
- **Diagnosis discipline:** reproduced in isolation, then A/B'd — green at the pre-plan baseline
  `260a3ffe4` (70 passed) and red mid-plan — before any mechanism was proposed. The captured page
  snapshot showed the no-nominations warning and no dialog, which is exactly the gate's else-branch.
- **Fix:** the entity-tab layout renders children on `activeEntityType || drawerVisible`, with a comment
  explaining that an overlay keyed on `entity` + `id` is not part of the list hierarchy. The innermost
  page's own narrowing gate keeps the list out of the drawer-only case.
- **Files modified:** `.../[[entityTab=etPl]]/+layout.svelte`
- **Verification:** `perm-localisation-positive` 70 passed exit 0; full suite 170 passed exit 0.
- **Commit:** `4c637bce2`

**2. [Rule 1 — Bug in my own new test] `openEntityDetailsForCard` cannot reach a no-subcard card**

- **Found during:** Task 3, first E2E run. The fixture does a DESCENDANT lookup for
  `entity-card-action`, but for a card with no subcards that anchor is the card's ANCESTOR — the same
  inversion this spec already documents at its entity-open step, and the same one carried forward in
  this plan's briefing. The candidates tab has no subcards, so the click timed out.
- **Fix:** click the card title, the technique the rest of the file already uses, with a comment saying why.
- **Commit:** `4c637bce2`

**3. [Rule 1 — Bug in my own new test] A one-shot URL read raced a client-side navigation**

- **Found during:** Task 3, second E2E run. I read `page.url()` immediately after the card click, which
  measured the PREVIOUS URL. The spec's own header requires waiting assertions throughout.
- **Fix:** `await expect(page).toHaveURL(...)`, which polls and doubles as the shape assertion.
- **Commit:** `4c637bce2`

**4. [Rule 3 — Blocking] The route-constant comment tripped its own acceptance criterion**

- **Found during:** Task 1. The criterion forbids any line in `route.ts` containing both the statistics
  and election-tab tokens; my explanatory comment necessarily contained both, and the repo's
  comment-hygiene guard separately forbids forced line breaks mid-sentence.
- **Fix:** rewrote the comment as complete sentences per line that avoid the token pairing — satisfying
  the criterion as written rather than weakening the gate to fit the comment.
- **Commit:** `dcca8cfe3`

### Non-fixes — plan anchors reported rather than bent

- **The route-consistency test does not guard this move.** The plan names it as "the guard that will
  catch a half-applied move". Measured: its filesystem walk is scoped to `(protected)` groups and its
  only results reference is an `isProtectedRoute` negative control. It passes across this move for
  reasons unrelated to the move. Recorded in § 2d; the move was verified by `check` plus direct path
  assertions instead.
- **The picker shape cannot assert "exactly one list".** The plan's uniform wording asks every
  enumerated shape to render the list. Derived: with two seeded elections both selected, the bare
  `/results` renders D-08's picker branch and there is correctly NO list. The case asserts a visible
  picker and zero lists, which is the decision under test.
- **The cross-type drop was already recorded by 165-01.** § 6 of the evidence doc had derived the
  verdict and stated the consequence for this plan. Rather than duplicate it, § 6 gained an APPLIED
  paragraph closing the loop from derivation to application.

## Issues Encountered

None outstanding. The one regression found is fixed and covered; the two pre-existing defects found
are recorded in `deferred-items.md` with evidence and follow-up options, and deliberately not fixed
(D-09 forbids the redirect that would fix the URL defect, and both live outside this plan's files).

## Verification

Every status read directly from the command, never through a pipe (project memory records two commits
of hidden lint violations caused by piping `lint:check` through `grep`).

| Gate | Result |
|---|---|
| `yarn workspace @openvaa/frontend check` | exit 0 — 2195 files, **0 errors, 0 warnings** |
| `TURBO_FORCE=true yarn test:unit` | exit 0 — frontend 105 files / 1846 tests, dev-seed 60 / 795 |
| `yarn workspace @openvaa/frontend test:unit page.guards` | exit 0 — **8 passed** |
| `yarn workspace @openvaa/frontend test:unit routeConsistency` | exit 0 — 46 passed |
| `yarn lint:check` | exit 0 — comment hygiene 1724 files scanned, 0 violations |
| E2E `voter-results-redraw` | exit 0 — 7 passed |
| E2E `voter-journey` | exit 0 — 4 passed |
| E2E `perm-localisation-positive` | exit 0 — 70 passed |
| **E2E FULL SUITE** | **exit 0 — 170 passed / 0 failed / 0 did-not-run** (baseline 168 + this plan's 2) |

Non-vacuity controls actually run, not assumed:
- Comment-hygiene scanned-file count moved 1721 → 1723 → 1724 as new files were staged.
- The guard test was proven live by disabling the 404 guard (red), then reverted and proven three ways.
- The regression was A/B'd against the pre-plan baseline before a cause was proposed.
- The new layout was confirmed accepted via generated `$types.d.ts`, never the stale client manifest.

## Known Stubs

None. A scan of the results tree for `TODO`, `FIXME`, placeholder text and hardcoded empty values
returned nothing.

## Next Phase Readiness

Ready for `165-05`. The three-level tree, the shared route module and the pinned guards are in place;
`165-05`'s deletions of `EntityDetailsDrawer` / `QuestionExtendedInfoDrawer` are unaffected by the
split, since the results tree already routes its drawer through the 165-02 host and opener.

One inherited constraint for later plans: the entity-tab layout's `activeEntityType || drawerVisible`
gate is load-bearing. Simplifying it back to `activeEntityType` alone reintroduces the drawer
regression documented above, and `perm-localisation-positive` is the spec that catches it.

## Self-Check: PASSED

- All four created files exist on disk (`[ -f ]` each): `resultsRoutes.ts`, the entity-tab layout,
  `page.guards.test.ts`, `results/statistics/+page.svelte`.
- The old statistics path is absent; no `+page.svelte` exists at the entity-tab level.
- All three task commits found in `git log --oneline --all`: `dcca8cfe3`, `611399452`, `4c637bce2`.
- Working tree clean, no unexpected deletions in any commit, no untracked files left behind.
