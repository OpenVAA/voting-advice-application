---
phase: 90-tir5-permutations-missing-nominations-warning-localisation-n
verified: 2026-05-30T10:30:00Z
status: passed
score: 5/5 must-haves verified (revised scope after Stage A reversal)
overrides_applied: 0
notes: >
  Supersedes the 2026-05-29 `gaps_found` verification record. The user-directed
  reversal on 2026-05-30 removed the runtime-override scope entirely (Plan 90-01
  + Plan 90-03 + gap-closure plans 90-05/06) and retargeted Phase 90 at a
  reduced scope: (a) reduce staticSettings.supportedLocales from 4 to 3
  (drop `da`), (b) ship perm-missing-nominations (90-02 unchanged), (c) ship
  perm-localisation-positive against the 3-locale static base (90-04 rewritten
  with no runtime override). Both BLOCKER gaps from the prior verification
  (Gap #1 / CR-01 `applyDynamicOverride()` wiring + Gap #2 / CR-02 langSelector
  switchTo regex) are mooted by the reversal: Gap #1 no longer applies because
  `applyDynamicOverride` no longer exists; Gap #2 is fixed inline in the
  langSelector fixture as part of 90-04's rewrite.
---

# Phase 90 Verification — Post-Reversal (2026-05-30)

## Revised goal (effective 2026-05-30)

Apply Phase 89-04's strict-fixtures + minimal-data perm pattern to add 2 TIR5 permutation chains (missing-nominations + localisation-positive) AND retarget the canonical user-facing locale base from 4 (en/fi/sv/da) to 3 (en/fi/sv) by editing `staticSettings.supportedLocales` directly — no runtime override mechanism. The single-locale variant (perm-localisation-negative) + the runtime override path are explicitly deferred to a future Stage B i18n phase.

## Verified Must-Haves (5/5)

1. **STATIC-LOCALES-3 — `staticSettings.supportedLocales` reduced to `[en, fi, sv]`.** Confirmed at `packages/app-shared/src/settings/staticSettings.ts:46-60`. Dev-seed fan-out updated in lockstep (`packages/dev-seed/src/locales.ts:62` `LOCALES = ['en', 'fi', 'sv']`; `packages/dev-seed/src/templates/defaults/candidates-override.ts` 109 candidates/block × 3 = 327 total).

2. **PERM-MN-01 — `perm-missing-nominations` template + spec ship and enumerate correctly.** Template at `packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts`; setup/teardown at `tests/tests/setup/perm-missing-nominations.{setup,teardown}.ts`; spec at `tests/tests/specs/perm/perm-missing-nominations.spec.ts`; 3 playwright project entries registered. Playwright `--list` confirms enumeration. Spec asserts el-2 surfaces in the missing-nominations modal.

3. **PERM-L10N-POS-01..07 — `perm-localisation-positive` adapted to 3-locale static base.** Template at `packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts` spreads `MINIMAL_BASE_APP_SETTINGS` verbatim (no i18n override). Spec at `tests/tests/specs/perm/perm-localisation-positive.spec.ts:115` asserts `langSelector.expectVisible(['en', 'fi', 'sv'])`; en↔fi authoring walk + voter cross-check structurally unchanged. 3 playwright project entries chain after `perm-missing-nominations`.

4. **FIX-LANG-SEL-01 + FIX-ML-TEXT-01 — new function-fixtures + perm-l10n composition root.** `langSelectorFixture.fixture.ts` + `multilingualTextFieldFixture.fixture.ts` + `perm-l10n.ts` composition root present in `tests/tests/fixtures/candidate/`. 2 new testids on `LanguageSelection.svelte` + `Input.svelte` present. `langSelector.switchTo` regex is baseLocale-aware inline (the gap-#2 fix from the original 90-06 plan, applied directly to the fixture rather than via the abandoned helper-extraction approach).

5. **Static gates green.** `yarn workspace @openvaa/app-shared test:unit` → 21/21 pass; `yarn workspace @openvaa/frontend test:unit` → 666/666 pass; `yarn workspace @openvaa/dev-seed test:unit` → 504/505 pass (1 pre-existing unrelated failure in `baseV1.ts` — `questions.fixed.length === 18` expected, got 25; uncommitted before phase 90 began per HANDOFF.json `uncommitted_files`). `npx playwright test --list` enumerates 4 new Phase 90 projects (data-setup-perm-missing-nominations, perm-missing-nominations, data-setup-perm-localisation-positive, perm-localisation-positive) plus their data-teardown siblings.

## Mooted gaps (from the 2026-05-29 superseded verification)

The two BLOCKER gaps in the prior record are no longer applicable:

- **Mooted Gap #1 (CR-01 — applyDynamicOverride wiring):** `applyDynamicOverride()` no longer exists. `apps/frontend/src/lib/i18n/init.ts` was restored to its pre-90-01 shape (`b4712f380` baseline). No production caller is needed.
- **Mooted Gap #2 (CR-02 — langSelector switchTo regex):** Fixed inline in `tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts` `switchTo()` (baseLocale-aware regex: `en` matches prefix-less URLs; non-baseLocale matches `/<locale>/`). Helper extraction + standalone unit tests (the original 90-06 approach) are not needed for this reduced scope.

## Deferred to Stage B i18n phase

- **I18N-RUNTIME-01** (runtime supportedLocales override surface) — preserved in `.planning/todos/pending/2026-05-11-e2e-01-single-locale-runtime-override.md` with recoverable Stage A code snippets + a pre-condition that the Paraglide baseLocale-vs-defaultLocale divergence (see `.planning/todos/pending/2026-05-30-paraglide-baselocale-vs-runtime-default-divergence.md`) be addressed first.
- **PERM-L10N-NEG-01..03** (single-locale perm) — preserved in the same todo. Dataset shape documented.

## Reversal commits (audit trail)

- `8faa9b08c refactor(90): drop da — staticSettings + dev-seed now 3-locale (en, fi, sv)`
- `f09412c05 todo(90): preserve Stage A artifacts + single-locale perm requirement in i18n stage-b todo`
- `1578ce8e4 revert(90): drop Stage A i18n override + perm-l10n-negative; retarget perm-l10n-positive at 3-locale base + fix baseLocale switchTo regex`
- `(this commit) docs(90): supersede 90-VERIFICATION + ROADMAP after Stage A reversal`

## Status

`status: passed` — Phase 90 may be marked complete.
