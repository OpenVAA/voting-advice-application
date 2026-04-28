---
phase: 64-voter-results-reactivity-completion
plan: 01
subsystem: testing
tags: [playwright, e2e, svelte5, dev-seed, supabase-adapter, filter, results-page, reactivity, parent-nomination]

requires:
  - phase: 62-results-page-consolidation
    provides: "EntityListWithControls compound + filterContext Option B version-counter bridge + 4-segment optional route shape"
  - phase: 63-e2e-template-extension-greening
    provides: "v2.6 baseline parity gate + post-v2.6/playwright-report.json + diff-playwright-reports.ts constants methodology"
  - phase: 59-e2e-fixture-migration
    provides: "@openvaa/dev-seed package + e2e template + bulk_import + diff-playwright-reports.ts script"
provides:
  - "Voter-results E2E hard-assertion contract (replaces 6 silent test.skip(true) paths with expect.poll hard assertions per D-11)"
  - "e2e seed party-affiliation chains (11 visible candidate nominations linked to 4 parties via parent_nomination)"
  - "Supabase adapter parentNominationType derivation (in-memory parent lookup; no extra round-trips)"
  - "RESULTS-01/02 + D-14 + D-15 deterministic-passing contract (5/5 consecutive runs PASS)"
affects: [phase-64-02-deeplink-load-chain, phase-64-03-verification-and-close, future-multi-tenant-tests]

tech-stack:
  added: []
  patterns:
    - "expect.poll(...).toBeGreaterThan(0) for race-tolerant locator counts (Pitfall 4)"
    - "dialog[open] presence check before pointer-event-blocked next interaction"
    - "In-memory parent-type map for polymorphic FK derivation (avoids extra DB round-trips)"
    - "parent_nomination external_id refs in dev-seed templates for party-affiliation seed wiring"

key-files:
  created:
    - ".planning/phases/64-voter-results-reactivity-completion/repro/repro-notes.md"
    - ".planning/phases/64-voter-results-reactivity-completion/repro/repro-results-01-02.log"
    - ".planning/phases/64-voter-results-reactivity-completion/repro/repro-d14.log"
    - ".planning/phases/64-voter-results-reactivity-completion/repro/repro-d15.log"
    - ".planning/phases/64-voter-results-reactivity-completion/repro/repro-run-1.log"
  modified:
    - "tests/tests/specs/voter/voter-results.spec.ts"
    - "packages/dev-seed/src/templates/e2e.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts"

key-decisions:
  - "Empirical reproduction selected fix path = spec-only (Mode B deterministic, Modes A+C absent locally)"
  - "Phase 62 Option B version-counter bridge PRESERVED — no createSubscriber wrapper, no @openvaa/filters mutations"
  - "D-13 boundary honored — voterContext.svelte.ts unchanged"
  - "Rule 2 deviation: dev-seed e2e template extension (parent_nomination wiring) authorized by D-04"
  - "Rule 1 deviation: supabase adapter parentNominationType derivation (data-layer constructor invariant)"
  - "Spec hardening for race-tolerant assertions (dialog[open] gate, entity-card-action testid, pre-poll card count)"

patterns-established:
  - "Pattern: silent-skip → hard-assertion conversion via expect.poll (D-11 + Pitfall 4 codified for the rest of the suite)"
  - "Pattern: dialog[open] modal-close gate (eliminates 'pointer-events intercepted' flake on open <dialog>)"
  - "Pattern: in-memory polymorphic-FK-type derivation (apply when DB stores only id, type derives from parent join)"
  - "Pattern: dev-seed parent_nomination chains (template-level party-affiliation wiring for filter-coverage tests)"

requirements-completed: [RESULTS-01, RESULTS-02]

duration: 48m 46s
completed: 2026-04-27
---

# Phase 64 Plan 01: Voter Results Reactivity Completion (RESULTS-01/02 + D-14 + D-15) Summary

**Closed 3 voter-results E2E failures by converting 6 silent `test.skip(true)` paths to `expect.poll` hard assertions, then fixing the two latent defects (e2e seed missing `parent_nomination` chains; supabase adapter not deriving `parentNominationType`) that the new hard assertions surfaced. Phase 62 Option B reactivity bridge preserved verbatim.**

## Performance

- **Duration:** 48m 46s
- **Started:** 2026-04-27T15:37:44Z
- **Completed:** 2026-04-27T16:26:30Z
- **Tasks:** 3 (Task 1 reproduction + Task 2 spec-side replacements + Task 3 spec-only no-op)
- **Files modified:** 4 (1 spec, 1 dev-seed, 2 supabase-adapter)
- **Commits:** 5 (1 reproduction + 1 spec + 1 dev-seed + 1 adapter + 1 docs update)

## Accomplishments

- RESULTS-01/02 (`filter toggle narrows list without effect_update_depth_exceeded`) PASSES deterministically — 5/5 consecutive targeted runs.
- D-14 (`filter state resets on plural tab switch`) PASSES deterministically — no longer skipped.
- D-15 (`filter state survives drawer open/close`) PASSES deterministically — no longer skipped.
- Console-error stream contains zero `effect_update_depth_exceeded` messages (RESULTS-01 negative assertion holds).
- All 6 truthy `test.skip(true, ...)` paths replaced with `expect.poll(...).toBeGreaterThan(0)` (D-11 honored).
- D-01 acceptance gate: `grep -rn "from 'svelte" packages/filters/src/` returns 0 — UI-framework agnosticism preserved.
- 8/8 `filterContext.svelte.test.ts` unit tests stay green; 646/646 frontend unit tests pass; 45/45 supabase dataProvider tests pass.
- e2e seed gains party-affiliation chains (`parent_nomination` on 11 visible candidate nominations) — usable by future filter-coverage tests.
- Supabase adapter gains `parentNominationType` derivation — unblocks any future seed with candidate-nomination → organization-nomination chains.

## Task Commits

1. **Task 1: Reproduce + select fix path** — `407cdbd05` (docs)
2. **Task 2: Replace skip-paths with expect.poll** — `25c463449` (test)
3. **Task 2.5 deviation: dev-seed parent_nomination wiring** (Rule 2) — `1ff5d5b75` (test)
4. **Task 2.6 deviation: supabase adapter parentNominationType derivation** (Rule 1) — `cc098e69e` (fix)
5. **Repro-notes update with deviations** — `e5051e164` (docs)

Task 3 (production fixture-flake fix) is a deliberate **no-op** in this plan: per Task 1's empirical reproduction the selected fix path is `spec-only`, and the Task 3 acceptance criteria for the spec-only branch require `git diff` of `[questionId]/+page.svelte` and `voter.fixture.ts` to be empty. Both are empty. No commit was created for Task 3 because there was nothing to commit.

## Files Created/Modified

- `tests/tests/specs/voter/voter-results.spec.ts` — replaced 6 truthy `test.skip(true)` paths with `expect.poll(...).toBeGreaterThan(0)` per D-11 + Pitfall 4; hardened 4 secondary races (dialog button locator, modal-close gate, entity-card-action testid, drawer-cycle re-render poll).
- `packages/dev-seed/src/templates/e2e.ts` — added `parent_nomination` external_id refs to 11 visible candidate nominations (3-3-3-2 across 4 parties); reorganized organization triangles to top of fixed[] for self-documentation.
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — derive `parentNominationType` from an in-memory `nomination_id → entity_type` map built once per fan-out result; clear `parentNominationId` when the parent isn't in the result set to honor the Nomination "either both or neither" invariant.
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` — updated one existing test to include the parent in the mock data; added one new test for the parent-not-in-result-set fallback branch.
- `.planning/phases/64-voter-results-reactivity-completion/repro/repro-notes.md` (new) — empirical reproduction record + 3-finding cascading-deviation log + final fix-path summary.
- `.planning/phases/64-voter-results-reactivity-completion/repro/repro-{results-01-02,d14,d15,run-1}.log` (new) — Playwright invocation transcripts.

## Decisions Made

- **Selected fix path = spec-only** (per Task 1 reproduction). RESEARCH §1 was correct that the failures aren't reactivity-bridge bugs; the fixture flake (Mode A) and infinite-loop (Mode C) are absent at the Phase 64 baseline. Mode B (silent test.skip) is the deterministic local failure.
- **Phase 62 Option B preserved** verbatim — `filterContext.svelte.ts` untouched. Unit tests prove the version-counter bridge works; switching to `createSubscriber` would invalidate them without a reproduced defect to motivate the change.
- **D-13 boundary honored** — `voterContext.svelte.ts` and the voter-app `$effect` chain are out of this plan's scope.
- **D-04 invoked** — extending `@openvaa/dev-seed`'s e2e template was authorized when the consumer-side wiring inspection revealed `buildParentFilters` returns 0 for candidates without `parent_nomination`. The seed extension is the minimum-blast-radius fix; alternatives considered (consumer-side workaround that synthesizes party affiliations from `candidates.organization_id`, or marking an info question `customData.filterable: true`) were either more invasive or semantically misaligned with the test's "party filter narrows" intent.
- **D-01 hard constraint maintained** — no Svelte-specific imports leaked into `packages/filters/src/`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] e2e template lacks `parent_nomination` on candidate nominations**
- **Found during:** Task 2 verification — after spec replacements landed, all 3 named tests began FAILING with `Party filter button must render — Received: 0` (5s poll exceeded).
- **Issue:** `buildParentFilters()` in `apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts:30-62` reads `n.parentNomination` from each candidate nomination; the e2e seed had 4 organization nominations but no `parent_nomination` references on candidate nominations, so the function returned an empty filter array and the EntityListWithControls filter button never rendered.
- **Fix:** added `parent_nomination: { external_id: 'test-(voter-)nom-org-party-X' }` to the 11 visible candidate nominations in `packages/dev-seed/src/templates/e2e.ts`, distributing them 3-3-3-2 across the 4 parties. The 1 hidden + 2 addendum candidates (all `unconfirmed: true`) intentionally retain no parent_nomination.
- **Files modified:** `packages/dev-seed/src/templates/e2e.ts`
- **Verification:** `yarn dev:seed --template e2e` produces 18 nominations with 11 parent_nomination_id rows visible via direct `nominations` table query.
- **Committed in:** `1ff5d5b75`

**2. [Rule 1 - Bug] Supabase adapter doesn't derive `parentNominationType`**
- **Found during:** Task 2 verification (after deviation 1) — the voter app stuck on `Loading…` with the new seed; investigation revealed the data layer's Nomination constructor throws when `parentNominationId` is set without `parentNominationType`.
- **Issue:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:291` mapped only `parent_nomination_id` from the `get_nominations` RPC row; `parent_nomination_type` doesn't exist as a column (the schema derives type from polymorphic FK fields). The `Nomination` base class constructor (`packages/data/src/objects/nominations/base/nomination.ts:38-45`) enforces "either both or neither" and threw on every voter-results load.
- **Fix:** build a one-pass in-memory `nomination_id → entity_type` map from the same RPC fan-out result, then look up `parentNominationType` from the parent entry. If the parent isn't in the result set (cross-constituency parent the RPC's filter excluded), clear `parentNominationId` to keep the invariant intact.
- **Files modified:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`, `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` (1 test updated to include parent in mock + 1 new test for the fallback branch)
- **Verification:** 45/45 dataProvider tests pass; 646/646 frontend unit tests pass; voter app no longer stuck on Loading.
- **Committed in:** `cc098e69e`

**3. [Rule 1 - Bug] Test interaction races (4 sub-fixes in spec hardening)**
- **Found during:** Task 2 verification (after deviations 1+2) — RESULTS-01/02 PASSED but D-14 and D-15 still failed with click-intercepted-by-dialog and link-not-found errors.
- **Issue:** Four secondary races in the spec-side test code:
  - (a) `dialog.getByRole('button').first()` matched the unrelated "Select all" button inside `EnumeratedEntityFilter`, not the modal-action snippet's "Apply and close" / "Close filters" button. Result: filter wasn't actually applied / dialog didn't close.
  - (b) The next interaction (parties tab click in D-14, entity-card click in D-15) raced the modal close animation; the still-open `<dialog>` intercepted pointer events.
  - (c) `firstCard.getByRole('link').first()` returned 0 hits because the wrapping `<a data-testid="entity-card-action">` lives OUTSIDE the `<article data-testid="entity-card">` in `EntityCard.svelte:184`.
  - (d) After `goBack()` from the drawer URL, `entity-card` count briefly desyncs from steady state (drawer transition).
- **Fix:** locate the close button by label `getByRole('button', { name: /close filters/i })`; gate next interactions on `expect(page.locator('dialog[open]')).toHaveCount(0)`; use `page.getByTestId('entity-card-action').first()` for card-link clicks; replace immediate count read with `expect.poll().toEqual(beforeFilterCount)` after waiting for `DRAWER_TESTID` unmount.
- **Files modified:** `tests/tests/specs/voter/voter-results.spec.ts`
- **Verification:** 5/5 consecutive targeted Playwright runs PASS deterministically.
- **Committed in:** `25c463449` (folded into the Task 2 spec commit)

---

**Total deviations:** 3 auto-fixed (1 Rule 2 missing-critical seed wiring, 1 Rule 1 adapter bug, 1 Rule 1 test-interaction races)
**Impact on plan:** All three deviations were necessary to honor the plan's truth requirements that the 3 named tests pass deterministically. None expanded scope beyond Phase 64-01: no `@openvaa/filters` source touched, no `voterContext.svelte.ts` change, no `filterContext.svelte.ts` change, no fixture timeout change, no question-page reactivity change. The seed extension and adapter fix benefit all future tests that exercise candidate→party affiliations (a useful side effect, not scope creep).

## Issues Encountered

- **Pre-Task-2 verification surprise:** RESEARCH §1's claim that "the e2e template ALREADY ships 4 parties × candidate nominations sufficient for the party EnumeratedFilter to render checkboxes" was true at the *organizations-tab* level (party nominations populate the parties tab) but false at the *candidates-tab* level (no `parent_nomination` chains existed, so candidates had no party affiliation). Resolved by deviation 1 above. Updated `repro-notes.md` to log the contradiction with research and the corrective seed extension.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: data-completeness | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | Adapter now silently drops `parentNominationId` when the parent isn't in the RPC result set. Future deployments that filter the RPC across constituencies/elections may see candidates lose party affiliation in the UI. The behavior is correct per the data-layer invariant — but downstream consumers (filtering, matching, drawer) should be aware that parent-less candidates may appear if the RPC fan-out excludes the parent. Not a regression in this plan; surfaced because the seed now has parent chains. |

## User Setup Required

None — no external service configuration required. The dev-seed extension is internal; the supabase adapter fix is pure code; the spec changes affect only test runtime.

## Next Phase Readiness

- **Phase 64-02 (deeplink load chain):** unblocked. Plan 64-02 reproduces D-08 shapes 3+4 independently. The seed change in this plan should NOT affect the deeplink failure mode (those failures live in fixture/load-chain logic, not in filter-button rendering). Plan 64-02's reproduction can begin from the post-64-01 baseline.
- **Phase 64-03 (verification + close):** the targeted 3-test fix is in. Plan 64-03's full v2.6 parity capture will inherit this baseline and is unaffected by the changes here (the e2e seed still produces the same set of cards; the adapter fix is purely correctness; no test-count delta is expected).
- **Carry-forward considerations:** the seed-change-then-build flow surfaced a latent adapter bug. Future seed extensions touching `parent_nomination` chains will now work correctly. If a future plan needs to test cross-constituency parent_nomination behavior, the adapter's `parentNominationId` clearing branch is the relevant edge case.

## Self-Check: PASSED

- File `.planning/phases/64-voter-results-reactivity-completion/repro/repro-notes.md` exists ✓
- File `.planning/phases/64-voter-results-reactivity-completion/repro/repro-results-01-02.log` exists ✓
- File `.planning/phases/64-voter-results-reactivity-completion/repro/repro-d14.log` exists ✓
- File `.planning/phases/64-voter-results-reactivity-completion/repro/repro-d15.log` exists ✓
- Commit `407cdbd05` (Task 1 reproduction) exists in git log ✓
- Commit `25c463449` (Task 2 spec replacements) exists in git log ✓
- Commit `1ff5d5b75` (dev-seed extension deviation) exists in git log ✓
- Commit `cc098e69e` (supabase adapter fix deviation) exists in git log ✓
- Commit `e5051e164` (repro-notes update) exists in git log ✓
- D-01 acceptance gate (`grep -rn "from 'svelte" packages/filters/src/`) returns 0 ✓
- 5/5 consecutive targeted Playwright runs PASS deterministically ✓
- 646/646 frontend unit tests pass; 8/8 filterContext tests pass; 45/45 supabase dataProvider tests pass ✓
- `git diff` of `voterContext.svelte.ts`, `filterContext.svelte.ts`, `packages/filters/src/`, `[questionId]/+page.svelte`, `voter.fixture.ts` all empty ✓

---

*Phase: 64-voter-results-reactivity-completion*
*Completed: 2026-04-27*
