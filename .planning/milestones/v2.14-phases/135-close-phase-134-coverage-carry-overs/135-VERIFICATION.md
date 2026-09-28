---
phase: 135-close-phase-134-coverage-carry-overs
verified: 2026-08-11T12:06:46Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 135: Close the Three Phase-134 Coverage Carry-Overs — Verification Report

**Phase Goal:** Convert the three coverage limits Phase 134 recorded-but-did-not-close into real guards, so v2.14 ships without a known untested branch, without a theme-blind a11y gate, and without a load-dependent wall-clock assertion sitting in a blocking CI step.

**Verified:** 2026-08-11T12:06:46Z
**Status:** PASS
**Re-verification:** No — initial verification

## Goal Achievement

This phase is unusual in that all three deliverables are *guards* — code whose entire
value is that it can fail. Verification therefore checked not just "does the artifact
exist" but "does it discriminate" (does a real regression make it red), using the
negative-control evidence recorded in the SUMMARYs plus independent inspection of the
actual test/seed files and live command runs. All claims held up.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GUARD-01: a seeded question with `minSelections === maxSelections === 1` exists, and `qu-opin-base-7-multichoice` keeps its 2..3 window | ✓ VERIFIED | `packages/dev-seed/src/templates/e2e/base.ts:899-933` — base-7 unchanged at `{minSelections: 2, maxSelections: 3}`, base-8 added at `{minSelections: 1, maxSelections: 1}`, explicit in-file comment states it is an addition, not a repurposing |
| 2 | GUARD-01: the voter-journey assertion checks the resolved English string exactly, and a raw-key value would NOT satisfy it | ✓ VERIFIED | `tests/tests/specs/voter/voter-journey.spec.ts:351,394` — `const SELECT_EXACT_ONE_EN = 'Select 1 option.'`, asserted via `toHaveText(SELECT_EXACT_ONE_EN)`, an exact-equality matcher; `apps/frontend/messages/en/questions.json:66-73` confirms this is the literal resolved MF2 `countPlural=one` output. `i18n/wrapper.ts` falls through to painting the raw dotted key on a lookup miss, which `toHaveText('Select 1 option.')` cannot match — confirmed by inspection, and independently proven live by SUMMARY 135-02's negative control B (`Received: "questions.multiChoice.selectExact"`, 1 failed) |
| 3 | GUARD-02: the four fixture-driven axe entries scan in a genuinely dark DOM via a born-dark browser context, not a post-walk `emulateMedia` flip | ✓ VERIFIED | `tests/tests/specs/a11y/a11y-smoke.spec.ts:521-528,541-548` — both `LOCATED_ROUTES` and `ANSWERED_ROUTES` dark twins use `voterJourneyTest.use({ colorScheme: 'dark' })` (context-level), not `page.emulateMedia`. `grep -c 'emulateMedia'` returns 3, but only 1 is a real call (line 492, the pre-existing raw-route twin); the other 2 are docblock prose explaining why the flip was rejected — confirmed by reading each hit |
| 4 | GUARD-02: the stale "known coverage gap" comment is gone | ✓ VERIFIED | `grep -c 'known coverage gap'` → 0, `grep -ci 'light only'` → 0 in `a11y-smoke.spec.ts`; header docblock (lines 53-57) and the comment above the runners (lines 465-473) now state coverage is complete |
| 5 | GUARD-03: `toBeLessThan(10_000)` is gone, the deterministic row-count/portrait assertions survive, and the replacement is an operation budget, not a bigger number | ✓ VERIFIED | `grep -c 'toBeLessThan(10_000)'` → 0 in `default-template.integration.test.ts`; `expect(rows.candidates.length).toBe(327)` (line 236) and `expect(portraits).toBe(327)` (line 247) both present; replacement is `expect(ops.bulkImport).toBe(1)` etc. plus a closed unbudgeted-calls check (lines 211-221) — an operation-count budget, not a wall-clock number |
| 6 | GUARD-03: the per-test timeout was re-derived and labelled as a hang guard, not a resurrected performance gate | ✓ VERIFIED | `default-template.integration.test.ts:153,370` — both the `beforeAll` and the test itself now carry `}, 300_000);`, matching the SUMMARY's account of measuring 68-78s at full saturation and re-deriving with ~4x headroom |
| 7 | All three guards are proven to discriminate by negative control (not merely asserted to pass) | ✓ VERIFIED | GUARD-01: two independent controls quoted in 135-02-SUMMARY (corrupted string, deleted key), both `1 failed / 3 passed`. GUARD-03: two independent controls quoted in 135-03-SUMMARY (unbudgeted call injected, N+1 injected — `+937ms`, invisible to the deleted 10s gate but caught instantly as `expected 328 to be 1`). GUARD-02: `assertDarkThemeApplied` validated against both the broken flip mechanism (fails) and the fixed born-dark mechanism (passes), per the two-row table in `a11y-smoke.spec.ts:377-381`. All controls are consistent with the reverts (`git status --porcelain` empty after each per the SUMMARYs, and the current working tree is clean of anything but `supabase/.temp/cli-latest`) |

**Score:** 7/7 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dev-seed/src/templates/e2e/base.ts` | equal min/max multi-choice question added, base-7 untouched | ✓ VERIFIED | Confirmed by direct read; `custom_data: {minSelections:1, maxSelections:1}` at sort_order 107 |
| `tests/tests/specs/voter/voter-journey.spec.ts` | exact-string `selectExact` assertion | ✓ VERIFIED | `expectExactOneMultiChoiceQuestionAndAdvance` calls the guard twice per journey (first paint + post-delete remount, per SUMMARY) |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | dark twins for located/answered runners, stale comment removed | ✓ VERIFIED | Confirmed by direct read of the full file |
| `packages/dev-seed/tests/integration/default-template.integration.test.ts` | load-independent NF-01 treatment | ✓ VERIFIED | Confirmed by direct read; operation budget + closed unbudgeted check + re-derived 300s timeout |
| `.planning/REQUIREMENTS.md` | GUARD-01/02/03 ticked with evidence, carry-forward caveats in requirement TEXT | ✓ VERIFIED | All three ticked `[x]`, mapping rows 211-213 read `Complete (2026-08-11)`, and the four carry-forward caveats (visual-regression re-baseline, DEF-135-04, DEF-135-01, `en`-only lock) are inline in the requirement prose, not only in SUMMARYs |
| `.planning/phases/135-close-phase-134-coverage-carry-overs/deferred-items.md` | DEF-135-01..05 recorded, DEF-135-04 gate update present | ✓ VERIFIED | All 5 sections present; DEF-135-04 carries the Plan-04 "did NOT recur" update, still marked OPEN |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| Dark browser context | fixture-driven axe scan | `voterJourneyTest.use({ colorScheme: 'dark' })` wraps the fixture's whole walk | ✓ WIRED | Confirmed: the `.describe()` block wrapping `use()` precedes the fixture-consuming test, so the fixture itself executes inside the dark context |
| `assertDarkThemeApplied` | axe scan | called before `assertAxeScan` in both dark-twin loops | ✓ WIRED | Lines 525, 545 |
| Seeded base-8 question | `QuestionChoices.svelte` `selectExact` branch | `effectiveMin === effectiveMax` | ✓ WIRED | `QuestionChoices.svelte:420-425` confirmed: `multiConstraints.effectiveMin === multiConstraints.effectiveMax ? t('...selectExact', ...) : t('...selectRange', ...)` — base-8's 1/1 window drives this exactly |
| `selectSmallestValidMultiChoice` | voter + candidate walk fixtures | replaces hard-coded `click 2` | ✓ WIRED | `tests/tests/utils/multiChoice.ts` — validity-signal-driven, ends on a hard `toBeEnabled()` assertion if no prefix is ever valid; strictly stricter than a fixed click count that never verified persistence |
| Operation-budget spies | `default-template.integration.test.ts` | `vi.spyOn` on `SupabaseAdminClient.prototype`, asserted counts | ✓ WIRED | Confirmed present at lines 211-221; closed via the `unbudgeted` check |

### Behavioral / Live Command Verification

| Check | Command | Result |
|-------|---------|--------|
| svelte-check | `yarn workspace @openvaa/frontend check` | **0 ERRORS 0 WARNINGS** |
| Lint | `yarn lint:check` | **exit 0** — tests-scope: exactly 1 `playwright/prefer-to-have-length` + 1 `Unused eslint-disable directive` (confirms the SUMMARY's correction of the original "2× Unused eslint-disable" baseline, not the original claim) |
| Format | `yarn format:check` | **exit 0** |
| Test typecheck | `yarn typecheck:tests` | **exit 0** |
| a11y-smoke list | `npx playwright test --project=a11y-smoke --list` | **18 tests** — decomposed as 14 axe scans (7 surfaces × light/dark) + 2 navigation-a11y + 2 setup/teardown, matching Plan 04's corrected accounting exactly |
| dev-seed unit tests (isolated) | `cd packages/dev-seed && yarn test:unit` | **exit 0, 444/444 passed**, seed step ~5.9-9.1s |
| Working tree | `git status --porcelain` | only `supabase/.temp/cli-latest` (permitted, unrelated to this phase) |
| Referenced commits | `git log --oneline` | all commit hashes cited in 135-01..04 SUMMARYs present in history |

Per the verification-task instruction, the full 3× E2E gate was NOT re-run (Plan 04 already ran it; ~10.5 min/run); its recorded evidence (134/134 passed × 3, fresh server + clean DB each time, with pid/listener-identity/DB-emptiness provenance) was inspected rather than reproduced, which is reasonable given it is Plan 04's own primary deliverable and re-running would not add discriminating information beyond what was already independently spot-checked above (list count, unit tests, static gates).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| GUARD-01 | 135-02 | Standing `selectExact` regression guard, negative-control proven | ✓ SATISFIED | base-8 seed + exact-string assertion + two negative controls, all inspected directly |
| GUARD-02 | 135-01 | Dark-theme axe parity, mechanism corrected mid-plan | ✓ SATISFIED | born-dark context confirmed in the shipped file (not the flip the plan originally specified — a documented, justified deviation, not a shortfall) |
| GUARD-03 | 135-03 | Load-independent NF-01 | ✓ SATISFIED | operation budget confirmed, wall-clock assertion gone, timeout re-derived |

No orphaned requirements found for this phase.

### Anti-Patterns Found

None. Searched all phase-touched files (`a11y-smoke.spec.ts`, `voter-journey.spec.ts`, `base.ts`, `default-template.integration.test.ts`, `multiChoice.ts`, `numberScale.probe.spec.ts`) for `TBD`/`FIXME`/`XXX`, `.skip`/`.fixme`/`.only`, and `exclude(` — zero hits. `WCAG_TAGS` is unchanged (still the 4-tag WCAG 2.1 AA superset). No `expect.soft`/`.catch(() => null)` added to the guard assertions.

### Carry-Forward Items (honestly scrutinized, not gaps)

These four items are correctly NOT closed by this phase, and — critically — the phase does not
claim they are closed. Each is present in `.planning/REQUIREMENTS.md`'s GUARD-01/02 prose (not
only in SUMMARYs), satisfying the verification task's explicit check:

1. **DEF-135-04 (EPERM-07 one-off)** — did not recur in the 3× gate, but this is explicitly
   recorded as "evidence of low frequency, not proof of absence"; status stays OPEN. Correctly
   not oversold.
2. **Visual-regression baselines** — `@visual`/`visual-regression` is opt-in
   (`PLAYWRIGHT_VISUAL`), confirmed excluded from the default `test:e2e` script
   (`playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe`, no visual
   opt-in flag). The 4 PNG baselines genuinely are not re-verified by the green gate; flagged
   honestly rather than silently assumed clean.
3. **DEF-135-01 (`[data-theme='dark']` dead CSS)** — pre-existing, correctly scoped out of this
   phase's `files_modified`, and correctly not a WCAG failure (border-only, higher not lower
   contrast). Stays OPEN.
4. **`selectExact` guard locks only `en`** — confirmed true; the guard is
   `toHaveText(SELECT_EXACT_ONE_EN)` where `SELECT_EXACT_ONE_EN` is the English string only.
   D-18's non-English native-speaker review remains open. This does not undermine the phase
   goal, which was runtime coverage of the branch, not multi-locale correctness review.

None of these four undermines the phase goal: the phase goal was to convert three *coverage
limits* into *real guards*, and all three guards are real, wired, and demonstrated (by negative
control) to discriminate. The carry-forwards are pre-existing or explicitly out-of-scope
findings, correctly logged rather than either silently fixed (scope creep) or silently dropped
(dishonesty).

### Human Verification Required

None. All must-haves were verifiable by direct code inspection and live command execution.

### Gaps Summary

No gaps found. All three GUARD requirements are implemented as genuine, discriminating guards:
verified by direct inspection of the shipped code (not the SUMMARY narrative), by running the
static gates and the isolated dev-seed unit suite live, and by cross-checking every quoted
negative-control claim against the actual assertion code that would have to produce it. The one
deviation from plan (GUARD-02's mechanism corrected from `emulateMedia` flip to a born-dark
context) is a documented improvement discovered and applied within the same plan, not a shortfall
against the phase goal.

---

_Verified: 2026-08-11T12:06:46Z_
_Verifier: Claude (gsd-verifier)_
