---
phase: 130-e2e-specs-new-feature-coverage
reviewed: 2026-07-19T00:49:29Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - tests/playwright.config.ts
  - tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts
  - tests/tests/fixtures/voter/entityDetails.fixture.ts
  - tests/tests/fixtures/voter/voter-journey.fixture.ts
  - tests/tests/specs/_probes/numberScale.probe.spec.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - tests/tests/specs/voter/voter-alliance.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/voter/voter-nominations.spec.ts
  - tests/tests/utils/candidateJourneyConstants.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 130: Code Review Report

**Reviewed:** 2026-07-19T00:49:29Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 130 is a specs-only phase adding E2E coverage for new opinion/info question types (number scale, multi-choice categorical, multipleText), alliance results depth, and the unscoped all-nominations route. I reviewed only the changes since `ef8301ce8`. I verified that every referenced fixture method and testid exists (no dangling references / compile errors), that the removed commented-out skipped step was superseded by a hard-assertion dedicated spec (E2E hard-rule compliant), that `openMobileNav()` is valid on the desktop `voter-journey` project (the `nav-menu-toggle` hamburger is unconditional chrome in `Header.svelte`, not breakpoint-gated), and that `multiple-text-row` is a fillable `<input>` (so `fillMultipleTextQuestion`'s `.fill()` is sound).

No BLOCKER-class defect is provable: the code is test-only, and every logic issue I traced surfaces as a loud test failure rather than a silently-passing false negative. The findings are quality/robustness/isolation concerns — the most consequential being a data-setup race that the phase widens against the project's zero-flake cardinal rule.

Note: the diff's own inline `BLOCKER-130-05` comment (candidate step 18.5) documents a *product* i18n gap (multiChoice helper key not in the Paraglide runtime catalog). That is out of scope for this specs-only review and is deliberately not asserted; flagging only that it remains an unverified product bug.

## Warnings

### WR-01: New base-only leaf projects race the perm-family `test-` preclear (zero-flake exposure)

**File:** `tests/playwright.config.ts:322-343` (new `voter-alliance` / `voter-nominations` projects) vs `tests/playwright.config.ts:411-416` (`data-setup-perm-1e1cg1co`)
**Issue:** `data-setup-perm-1e1cg1co` runs `setupFromTemplate(..., { extraTeardownPrefix: ['test-', 'e2e-perm-'] })` (`tests/setup/perm/perm-1e1cg1co.setup.ts:13`). The bare `test-` prefix deletes the base dataset's `test-e2e-base-%` rows (the config comment at line 405 states this explicitly). Its dependency edge — `dependencies: ['voter-journey', 'candidate-journey']` — is the ONLY mechanism serializing that destructive preclear after base-reading specs. The two new projects depend solely on `data-setup-base` and are NOT in that list. `voter-alliance` in particular consumes `answeredVoterPage` (the full heavy `max` walk — `voter-journey.fixture.ts:513`), so its runtime overlaps the journeys' runtime, i.e. precisely the window in which the perm setup becomes eligible to fire and wipe base rows out from under an in-flight `voter-alliance` read. There is no Playwright scheduling barrier preventing two independent `data-setup-base` dependents from running concurrently.

This mirrors the pre-existing `voter-journey-mobile` leaf (also a heavy base-only walk not gating the perm setup), which reportedly runs green — so the race is empirically masked by scheduling/timing today. But the phase adds another heavy base-only leaf that relies on that same implicit timing rather than a declared dependency, and the project's E2E Hard Rule forbids any race that *can* clobber a running spec.

**Fix:** Add the new base-reading leaves to the perm setup's gate so the isolation is declared, not timing-dependent:
```ts
// data-setup-perm-1e1cg1co
dependencies: ['voter-journey', 'candidate-journey', 'voter-alliance', 'voter-nominations']
```
(Ideally fold in the other heavy base-only leaves — `voter-journey-mobile`, `cold-entry-dataroot` — too, and/or scope the perm preclear to `test-perm-` instead of bare `test-` so it can never match `test-e2e-base-`.)

### WR-02: Duplicate, divergent `advanceToNumberSlider` helpers

**File:** `tests/tests/specs/_probes/numberScale.probe.spec.ts:40-77` and `tests/tests/specs/voter/voter-journey.spec.ts:419-441`
**Issue:** Two module-scope functions share the exact name `advanceToNumberSlider` but have different implementations — the probe version drives category-intros via `page.goto(href)` (full reload), while the spec version is deliberately client-side (`settleAndAdvance`) because "a full `page.goto('/questions')` reload drops the in-memory election scope." Same name + opposite navigation strategy is a maintenance trap: a future edit to "the" helper can be applied to the wrong copy, and the divergence encodes a non-obvious scope-preservation invariant only in one of them. Violates the checklist "no code repeated within the PR" item.
**Fix:** Rename to disambiguate intent (e.g. `advanceToNumberSliderViaReload` in the probe vs `advanceToNumberSliderClientSide` in the spec), or extract a single shared helper parameterized on the navigation mode into `voter-journey.fixture.ts` and import it in both.

### WR-03: `expectNumberQuestionDisplay` marker-position regex is fragile for non-integer percentages

**File:** `tests/tests/fixtures/voter/entityDetails.fixture.ts:224-247`
**Issue:** The expected marker offset is built as `new RegExp(\`left:\\s*${pct(voterValue)}%\`)` where `pct` returns a raw JS float. Two latent problems: (1) for a non-integer percent (e.g. value 3 on a 0..10 scale → `30`, fine, but value 1 on a 0..3 scale → `33.33333333333333`) the interpolated dot is an unescaped regex wildcard AND the exact JS float string is unlikely to byte-match the DOM's rounded `left:` value; (2) even for integers the pattern is unanchored. Today every caller passes 0/10-range integer values (10 → `100`, 5 → `50`), so it passes — but the helper advertises arbitrary `min`/`max` params, so the first caller that uses a non-round scale gets a silently-wrong or spuriously-failing assertion.
**Fix:** Round and escape, or compare with tolerance:
```ts
const expected = Math.round(pct(voterValue));
await expect(marker).toHaveAttribute('style', new RegExp(`left:\\s*${expected}(\\.\\d+)?%`));
```

### WR-04: `voterAnswer` union widens the locator but the assertion assumes a single element

**File:** `tests/tests/fixtures/voter/entityDetails.fixture.ts:186-190`
**Issue:** The `voterAnswer` branch was changed to union checked radios with checked checkboxes, then calls `toHaveAccessibleName(options.voterAnswer)`. `toHaveAccessibleName` requires the locator to resolve to exactly one element (Playwright strict mode). For today's single-select callers the union is a no-op (0 checkboxes). But the union now makes it *possible* for a multi-select display (≥2 checked checkboxes) to be passed via `voterAnswer`, which would fail with a strict-mode multiple-element error rather than a meaningful assertion. The new `voterSelectedCount` path is the correct API for multi-select; `voterAnswer` should stay single-select-only.
**Fix:** Either keep `voterAnswer` scoped to radios only (multi-select callers use `voterSelectedCount`), or document/guard that `voterAnswer` asserts against `.first()` / single-select displays exclusively.

### WR-05: `expectNumberQuestionDisplay` only half-verifies the "dual" marker

**File:** `tests/tests/fixtures/voter/entityDetails.fixture.ts:234-246`
**Issue:** In the non-equal branch the helper asserts the total marker count and the VOTER marker's position (`.marker.text-primary`), but never asserts the ENTITY marker's position. The helper's docstring advertises a dual-marker read ("one marker per present value"), yet a mispositioned entity marker would pass. Currently every caller passes equal voter/entity values (the `bothEqual` single-marker branch), so the entity-position path is untested and the gap is latent — but it weakens the contract the fixture claims to enforce.
**Fix:** In the non-equal branch, also assert the entity marker's `left:` offset (scope it via its own class, mirroring the `.marker.text-primary` voter selector), so both markers are positionally verified.

## Info

### IN-01: New candidate fixture `fillMultipleTextQuestion` bypasses the phase's fixtures-first (SC4) convention

**File:** `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:198-227`
**Issue:** `numberScale.probe.spec.ts` documents an SC4/Pitfall-3 convention: net-new fixture capabilities are proven in an isolated probe before any spec consumes them. That probe covers only the voter-side helpers (`answerNumberScale`, `expectNumberQuestionDisplay`, checkbox counting). The new candidate-side `fillMultipleTextQuestion` is first exercised directly inside the candidate journey (step 13) with no probe. Not a defect (the `.fill()` target is a real `<input>`), but it is an inconsistent application of the phase's own stated discipline.
**Fix:** Add a candidate-side probe covering `fillMultipleTextQuestion`, or note in the fixture why a probe was deemed unnecessary.

### IN-02: `voter-nominations.spec` hardcodes the `/en/` locale prefix

**File:** `tests/tests/specs/voter/voter-nominations.spec.ts:39`
**Issue:** `page.goto('/en/nominations')` hardcodes the locale, whereas the codebase's convention is `buildRoute({ route: 'Nominations', locale: 'en' })` (used by the removed journey step it replaces). Minor inconsistency; harmless while `en` is the default locale.
**Fix:** Use `buildRoute` for consistency with the rest of the voter specs.

### IN-03: Redundant post-visibility count assertion

**File:** `tests/tests/specs/voter/voter-nominations.spec.ts:47-49`
**Issue:** `await expect(cards.first()).toBeVisible(...)` already proves ≥1 card exists; the following `expect(await cards.count()).toBeGreaterThan(0)` is redundant (and a non-auto-retrying snapshot `count()`). Not wrong, just belt-and-suspenders noise.
**Fix:** Drop the `count()` line, or replace both with `await expect(cards).not.toHaveCount(0)`.

---

_Reviewed: 2026-07-19T00:49:29Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
