---
phase: 82
slug: a11y-01-product-gap-cell-required-empty
status: has-issues
reviewed: 2026-05-13
depth: standard
files_reviewed: 4
findings:
  critical: 0
  warning: 1
  info: 2
---

# Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty — Code Review Report

**Reviewed:** 2026-05-13
**Depth:** standard
**Files Reviewed:** 4
**Status:** has-issues (1 WARNING, 2 INFO) — all advisory, none blocking

## Summary

The Phase 82 implementation faithfully executes the locked CONTEXT D-01..D-17 decisions and the RESEARCH LANDMINE-1/2 corrections that supersede CONTEXT D-03/D-04. The `canSubmit` gate is correctly extended with `&& allRequiredFilled`; the e2e fixture row uses `custom_data: { required: true }` (LANDMINE-1 honored) and the Alpha answer uses the LocalizedString shape (LANDMINE-2 honored); the spec cell honors the BLUR INVARIANT and uses the `testIds.candidate.profile.submit` anchor; and the PASS_LOCKED additive regen preserves the Phase 79 v2.10 anchor.

No BLOCKER issues found. One WARNING relates to a downstream cross-spec invariant that the executor did not flag in the SUMMARY's deviations. Two INFO items relate to stale docstring counts and a stale Phase 81 deferral.

## Warnings

### WR-01: variant-hidden-required SETTINGS-03 overlay does not strip new required row's answer

**File:** `tests/tests/setup/templates/variant-hidden-required.ts:142-179`
**Issue:** Phase 82 adds `test-question-required-empty-1` with `custom_data: { required: true }` to the base seed (`packages/dev-seed/src/templates/e2e.ts:731-740`). The SETTINGS-03 variant-hidden-required overlay maps `baseFixed('questions')` and propagates the base row verbatim (lines 144-158, no transform on `test-question-required-empty-1`). The overlay's candidate-row mapper (lines 169-179) deletes only `test-question-displayname` from Alpha's `answersByExternalId`, NOT `test-question-required-empty-1`. Result: in the SETTINGS-03 variant, Alpha now has TWO required info questions (displayname + required-empty-1) where displayname is unanswered (intended) and required-empty-1 is answered (Alpha-completeness preserved via the inherited sentinel). The SETTINGS-03 spec at `candidate-required-info.spec.ts:129-145` only asserts `unansweredRequiredInfoQuestions.length !== 0`, which still holds, but the unansweredCount InfoBadge at `+page.svelte:121` now renders `1` where it previously rendered `1` — coincidentally still correct because Alpha keeps required-empty-1 answered. Risk: if a future maintainer changes Alpha's required-empty-1 answer, or deletes it as a base-level fixture cleanup, the SETTINGS-03 spec will quietly break in a way Phase 82 didn't capture. Phase 82's CONTEXT D-14 invariant explicitly called for this verification ("verify no existing spec relies on `requiredInfoQuestions.length === 0`"); RESEARCH §LANDMINE-3 confirmed the COUNT contract is not asserted, but did not surface the implicit additive coupling. The CASCADE pool status of this spec means it doesn't run in the determinism baseline today, but it WILL run when DETERM-06 unblocks variant-hidden-required-candidate.
**Fix:** Either (a) add an inline comment to `variant-hidden-required.ts` noting that Phase 82 added a second `customData.required:true` question whose Alpha answer is intentionally preserved (so a future maintainer doesn't delete it); or (b) extend the overlay's candidate-row mapper to also delete `'test-question-required-empty-1'` from Alpha's answers and assert `unansweredRequiredInfoQuestions.length === 2` in the SETTINGS-03 spec. Option (a) is the minimum-diff hygiene fix:
```typescript
// In variant-hidden-required.ts after line 156, before the `return row;` catch-all:
// NOTE: Phase 82 added test-question-required-empty-1 (custom_data.required:true) to
// the base seed. This overlay does NOT mutate or delete it — Alpha keeps the seeded
// answer 'sentinel-82-required', so the variant's `unansweredRequiredInfoQuestions`
// count remains 1 (just displayname). DO NOT delete Alpha's required-empty-1 answer
// without first updating candidate-required-info.spec.ts (or the InfoBadge assertion
// at apps/frontend/src/routes/candidate/(protected)/+page.svelte:121 will count 2).
```

## Info

### IN-01: Stale "3 reliably-renderable cells" count in spec docstring

**File:** `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:6,51`
**Issue:** Line 6 states "Covers 3 reliably-renderable cells against the existing product surface" and line 51 states "all 3 test titles are PREFIXED `A11Y-01 `". After Phase 81 (cells A11Y-05 + A11Y-06) and Phase 82 (cell A11Y-07), the file now has 6 cells (3 IMAGE/TEXT loop iterations + 1 maxlength loop + 2 format loop + 1 standalone Phase 82 test). The Phase 81 lift and Phase 82 lift paragraphs below DO mention the additions correctly, but the lead-in count is stale and could confuse a future reader scanning the docstring.
**Fix:** Update line 6 from "3 reliably-renderable cells" to "6 reliably-renderable cells (3 original + 2 Phase 81 lifts + 1 Phase 82 standalone)" and line 51 from "all 3 test titles" to "all 6 test titles". Optional cosmetic; the Phase 82 lift paragraph at lines 32-38 already accurately describes the addition.

### IN-02: Phase 81 deferred PASS_LOCKED entries (A11Y-05 + A11Y-06) still missing from anchor

**File:** `tests/scripts/diff-playwright-reports.ts:110-193`
**Issue:** The PASS_LOCKED jsdoc at line 110 explicitly documents that Phase 81's +2 cells (A11Y-05 + A11Y-06) were deferred from Phase 81 P01 close ("the v2.10 milestone-close pre-release regen is the canonical home for backfilling both"). The Phase 82 SUMMARY at §"Deviations from Plan / Scope Reductions Documented #2" reaffirms this deferral as plan-conformant. However, the actual PASS_LOCKED list at lines 111-193 includes A11Y-07 (line 124) but NOT A11Y-05 / A11Y-06 — meaning the anchor now drifts from reality (5 A11Y-01 cells PASS in the candidate-app-mutation project per the SUMMARY's regression result, but only 4 are anchored: image-type, image-size, name-too-long, A11Y-07). This is documented as intentional and matches the Phase 82 plan acceptance criteria, but the longer the gap persists, the more risk that a future change to A11Y-05 / A11Y-06 silently regresses without triggering a parity violation. The note is correctly preserved; the deferred-backfill belongs in a v2.10-close phase.
**Fix:** No code change in Phase 82 — the deferral is plan-conformant. Surface as a follow-up reminder: ensure the v2.10 milestone-close pre-release verification (Phase 82 SUMMARY §"Follow-up Reminders" item 3) actually executes the +2 backfill into PASS_LOCKED at that gate, OR file a tracked todo if it slips again.

---

## Reviewed

- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` (lines 92-103, 132-150, 295-326) — verified the `allRequiredFilled` declaration was correctly moved ABOVE `canSubmit` (svelte-check TS-strict use-before-declaration fix); confirmed `canSubmit = $derived(status !== 'loading' && allRequiredFilled)` extension matches CONTEXT D-01; confirmed `handleSubmit` defense-in-depth guard at line 132-137 unchanged (Pitfall 5 contract preserved); confirmed `<Button disabled={!canSubmit}>` at line 311 unchanged; confirmed the `class:opacity-0={status === 'loading' || allRequiredFilled}` notice toggle at line 295 unchanged.
- `packages/dev-seed/src/templates/e2e.ts` (lines 702-740 new row, lines 849-855 Alpha answer) — verified LANDMINE-1 compliance (`custom_data: { required: true }` inside object, NOT top-level `required: true`); verified LANDMINE-2 compliance (Alpha answer is `{ value: { en: 'sentinel-82-required' } }` LocalizedString); verified sort_order: 24 is unique (no collision with sort 16-23); verified VALUE-DISJOINTNESS invariant (no 'alpha' substring); verified row has no `subtype` (correct text-multilingual dispatch); verified ALPHA-COMPLETENESS invariant preserved.
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (lines 23-41 docstring update + lines 323-369 new test block) — verified test title prefix `A11Y-01 A11Y-07 ` honors scope-marked-test-title convention; verified IMGPROXY_TIED_TITLES safety (title does not end with any of the 14 bound patterns); verified BLUR INVARIANT (`input.fill('')` followed by `input.blur()`); verified `getByTestId(testIds.candidate.profile.submit)` is used (not raw locator); verified `getByLabel(...).first()` mandatory disambiguation for multilingual rendering; verified `expect(submit).toBeEnabled()` sanity gate precedes the disable assertion; verified `expect(input).toHaveValue('')` value-preservation assertion.
- `tests/scripts/diff-playwright-reports.ts` (lines 110-124) — verified `PASS_LOCKED_TESTS` array gained exactly 1 new entry (`A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate`) in alphabetical position; verified jsdoc count updated 80 → 81; verified `DATA_RACE_TESTS` (15 entries) unchanged; verified `CASCADE_TESTS` (57 entries) unchanged; verified IMGPROXY_TIED_TITLES list untouched.
- Cross-spec scout: confirmed `tests/tests/specs/candidate/candidate-required-info.spec.ts` (SETTINGS-03 spec) still asserts `unansweredRequiredInfoQuestions.length !== 0` (not `=== N`) so it tolerates the +1 row, but raised WR-01 about the implicit cross-spec coupling not surfaced in the SUMMARY.
- Project conventions: confirmed Svelte 5 reactive accessor rule honored (`candCtx.requiredInfoQuestions`, `candCtx.unansweredOpinionQuestions`, `candCtx.answersLocked`, `candCtx.profileComplete` all read via `candCtx.X`, not destructured); confirmed TypeScript strict compliance (the `&& allRequiredFilled` change keeps `canSubmit` typed as boolean); confirmed no new i18n keys introduced; confirmed `playwright/no-raw-locators` compliance.

_Reviewed: 2026-05-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
