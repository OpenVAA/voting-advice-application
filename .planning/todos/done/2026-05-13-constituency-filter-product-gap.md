---
title: Constituency filter UI PRODUCT-GAP — voter results filter dialog does not render a constituency filter
severity: low
surfaced-in: phase 77 / SETTINGS-01 wave B / Plan 02 OQ-5 resolution
target-milestone: v2.10+ (filter UX — depends on product decision)
status: wont-fix
created: 2026-05-13
closed: 2026-05-20
close-reason: WONT-IMPLEMENT — constituency is a navigation/scope concept (election → constituency → results), not a per-list filter. Voter is already scoped to a single constituency by selection, so a constituency filter would be no-op. The corresponding test block in `tests/tests/specs/variants/constituency.spec.ts` was deleted 2026-05-20.
---

## CLOSE NOTE (2026-05-20) — WONT-FIX

Closed by operator decision. Constituency-filter is **not** going to be implemented in any
form: ship UI, API-level assertion, or test stub. Phase 77 Plan 02 + Phase 86.3-02 RCA
both reached the same PRODUCT-GAP conclusion, but the underlying decision is that the
gap is a category error rather than a missing feature.

If a future request arises ("can voters filter by constituency?"), the canonical answer
is: voters change constituency via election selection. Constituency is a scope, not a
filter dimension.

Audit trail: cell #4 spec block deleted in same commit set; SKIPPED_TESTS const updated
in `tests/scripts/diff-playwright-reports.ts`; Phase 86.3-02 Path-C disposition
SUPERSEDED. v2.11+ navigation-from-home redesign for cells #5/#6/#7/#8 (LAYOUT-03 +
QSPEC-01/02) is **unrelated** to this closure — that remains open.

---

---
# Constituency filter UI PRODUCT-GAP

## Problem

`apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts:9-13` emits
filters ONLY for the following parent-nomination types:

```typescript
const PARENT_GETTER: Record<Exclude<EntityType, 'candidate'>, string> = {
  alliance: 'allianceNomination',
  faction: 'factionList',
  organization: 'list'
};
```

`constituency` is NOT in this map. The voter results filter dialog therefore
renders zero constituency-level filtering UI today. Constituency is treated as
a navigation/scope concern (election → constituency selector → questions →
constituency-scoped results), not as a per-list filter.

This was surfaced during Phase 77 Plan 02 OQ-5 (filter-type matrix scope
audit). Phase 77 Plan 02 captured the cell as PASS-WITH-DEFERRAL via
`test.skip(true, ...)` in `tests/tests/specs/variants/constituency.spec.ts`.

## Evidence

- `grep -rn "constituency" apps/frontend/src/lib/contexts/voter/filters/`
  returns 0 hits for filter-building paths (the constituency name appears only
  in the e2e-fixture file references, not in filter logic).
- `buildParentFilters` only iterates `PARENT_GETTER` keys; constituency is not
  a parent-nomination type — it is a scope.
- `EntityFilters.svelte` renders whatever `FilterGroup.filters` contains; the
  current `FilterGroup` only includes parent-nomination filters + filterable
  question filters.

## Acceptance (if surfaced)

If constituency should become a top-level voter-results filter:

1. Extend `buildParentFilters` (or add a sibling `buildConstituencyFilter`) to
   emit an `EnumeratedFilter` keyed on entity.constituency.id (or whatever
   constituency association exists on the nomination chain).
2. Surface the filter in `EntityFilters.svelte` with an appropriate locale
   key (`entityFilters.constituencyLabel` or similar).
3. Add a top-level wave B cell in `voter-results.spec.ts` or
   `constituency.spec.ts` that toggles the constituency filter and asserts
   narrowing.

## Notes

- This is conditional on a product decision: in many VAAs the voter has already
  selected their constituency upstream, so an additional constituency filter
  inside results may be redundant. The PRODUCT-GAP framing here is "the filter
  type listed in the original `2026-04-27-extend-e2e-filter-type-coverage.md`
  cannot be asserted today" — not necessarily "this filter type SHOULD exist".
- See `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-02-SUMMARY.md`
  for the Plan 02 close context.
- Source todo (now resolved): `.planning/todos/completed/2026-04-27-extend-e2e-filter-type-coverage.md`.

## Phase 86.3-02 investigation outcome (2026-05-20 — augmented)

Phase 86.3-02 ran the CONTEXT D-08 1h RCA on cell #4 (`tests/tests/specs/variants/constituency.spec.ts:466-485`).
Total time consumed: ~15 min, well under cap. Full RCA at
`.planning/phases/86.3-implement-skipped-tests-close-7-source-skipped-voter-app-can/86.3-02-RCA.md`.

### Empirical findings

1. **PRODUCT-GAP RE-CONFIRMED.** Read-only verification of `buildParentFilters.ts:9-13`:
   - `PARENT_GETTER` literal contains exactly 3 keys (`alliance`, `faction`, `organization`);
     `constituency` is structurally absent.
   - Grep cross-check on `apps/frontend/src/lib/contexts/voter/filters/` and
     `apps/frontend/src/lib/voter/` returned 6 hits — all in
     `filterStore.svelte.ts` + `buildParentFilters.ts`; zero constituency-flavored
     siblings (no `buildConstituencyFilter.ts`, no `ConstituencyFilter` consumer).
   - `filterStore.svelte.ts:43-67` confirms the voter-app filter dispatch only
     iterates `PARENT_GETTER` keys; no constituency-scoped FilterGroup is ever
     emitted.

2. **Path-A (ship UI) — NOT ATTEMPTED.** Per RESEARCH "Anti-pattern: DO NOT ship
   constituency-filter UI in 86.3" + CONTEXT D-08 1h cap. LOC budget 100-200
   (touches `buildParentFilters.ts` + new `buildConstituencyFilter.ts` +
   `EntityFilters.svelte` wiring + 4-locale i18n + new top-level spec cell +
   product decision) — unbounded; structurally out of cap. v2.11+ deferral
   preserved here.

3. **Path-B (test-only `@openvaa/filters` API-level `ObjectFilter` assertion) —
   technically feasible, EXPLICITLY NOT EXECUTED.**
   - API shape verified: `packages/filters/src/index.ts` barrel exports
     `ObjectFilter` (88 LOC, `getMatches` inherited from `EnumeratedFilter`);
     LOC budget 30-60 fits within the 1h cap.
   - **Disposition reason: reviewer-drift cost.** Cell #4's stated intent is to
     assert the voter-app filter dialog *renders* a constituency filter and
     toggling narrows results. A Path-B test asserting on the @openvaa/filters
     package's `ObjectFilter.getMatches` correctness against in-test fixture
     data silently re-scopes the test to "the filter primitive works in
     isolation" — which is already covered by `packages/filters/` unit tests
     (if any) and does NOT regression-gate the voter-app PRODUCT-GAP at all.
   - **If the UI ships in v2.11+,** a passing Path-B test would NOT catch a
     regression in the voter-app wiring (`buildParentFilters` +
     `EntityFilters.svelte` + i18n) — net-negative coverage signal.
   - Per RESEARCH §"Cell #4 Path-B Cons" verbatim: "Tests a different
     abstraction level than the original spec intent (UI surface vs filter
     primitive); reviewer may consider this test-coverage drift."

4. **Path-C (SKIP-FALLBACK) — SELECTED.** Skip rationale extended in spec
   (10-element array, ~600 chars joined) + block comment augmented (≥3-line
   Phase 86.3-02 section above test() declaration); 3-element skip protocol
   verified.

5. **D-10 STRICT gate held.** `git diff -- apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts`
   returns EMPTY. Cell #4 is NOT in the D-10 production-code allowlist
   (only SETTINGS-01 wave A cells #1/#2/#3 are); production-code path
   forbidden.

6. **LANDMINE-NOTE.** cell #4 has no within-spec cascade dependents — single
   test in single `test.describe('SETTINGS-01 wave B — constituency-filter', …)`
   block per RESEARCH §"Pattern 3"; SKIP-FALLBACK is safe on CONTEXT D-09
   cascade-probe grounds. Pre-skip cascade-probe protocol NOT triggered
   (no siblings to probe).

### Sibling-plan precedent

Phase 86.3-02 SKIP-FALLBACK is the THIRD consecutive Wave 1 SKIP-FALLBACK
(after 86.3-03 cell #5 voter-feedback-persistence + 86.3-04 cell #6
voter-popup-hydration). All three preserve PRODUCT-GAP / deterministic-race
signals for v2.11+ pickup rather than silently substituting different
assertions.

### Revised v2.11+ next-action recommendation

Original Acceptance criteria (above) still applies if/when the product
decision lands. **No revision to recommended path-to-resolution is needed —**
the Acceptance section's 3-step flow (extend `buildParentFilters` → surface in
`EntityFilters.svelte` + i18n → add spec cell) remains the canonical fix
shape. Phase 86.3-02 only ADDS evidence that the PRODUCT-GAP is structural,
not coverage-debt.

### Cross-references

- 86.3-CONTEXT D-01 (cell #4 in scope) + D-02 (per-cell disposition) +
  D-08 (1h cap) + D-09 (pre-skip cascade-probe) + D-10 (production-code path
  forbidden for cell #4)
- 86.3-RESEARCH.md §"Cell #4 Root cause" + §"Cell #4 Fix paths (3 options)" +
  §"Cell #4 Recommendation" (operator handoff payload)
- 86.3-PATTERNS.md §"tests/tests/specs/variants/constituency.spec.ts:466-485"
  (Path-B + Path-C analog references)
- `.planning/phases/86.3-…/86.3-02-RCA.md` (full 1h RCA — 112 lines)
- `.planning/phases/86.3-…/post-fix/86.3-02-cell4-smoke.txt` (per-cell smoke
  with OUTCOME: SKIP-FALLBACK + LANDMINE-NOTE)
- Sibling-plan SKIP-FALLBACKs: 86.3-03 cell #5 SUMMARY + 86.3-04 cell #6
  SUMMARY (shared "preserve gap signal; augment todo; do not substitute
  assertion" pattern)
