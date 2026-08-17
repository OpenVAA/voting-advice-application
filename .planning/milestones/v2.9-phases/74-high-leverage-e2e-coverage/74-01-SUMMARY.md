---
phase: 74-high-leverage-e2e-coverage
plan: 01
subsystem: e2e-tests
tags: [playwright, e2e, candidate, translations, i18n]
dependency_graph:
  requires:
    - 73-determinism-baseline (closed 2026-05-11 — Phase 73 lint-gate at 'error', 3-run --workers=1 cold-start contract)
  provides:
    - E2E-01 multilocale translation surface assertion (permanent Playwright gate)
  affects:
    - tests/playwright.config.ts (candidate-app project testMatch regex extended)
tech_stack:
  added: []
  patterns:
    - "role/aria-locator-only spec (no testId additions) — Phase 73 D-11 + v2.8 P70 convention"
    - "explicit goto-back to questions-list before reload to give stable post-reload landing"
key_files:
  created:
    - "tests/tests/specs/candidate/candidate-translation.spec.ts"
    - ".planning/phases/74-high-leverage-e2e-coverage/deferred-items.md"
  modified:
    - "tests/playwright.config.ts (candidate-app project testMatch extended to include candidate-translation.spec.ts)"
decisions:
  - "Locator: getByRole('textbox', { name: /lang\\.fi$/i }) — NOT getByLabel(/Suomi/i). Reason: t('lang.<locale>') keys are unwired in the current i18n setup; the rendered per-locale label is the literal string 'lang.fi'. Documented in deferred-items.md."
  - "Reload sequence: goto questions-list THEN reload (Plan-text suggested reload from current page, but saveAnswer() may navigate to the next-question OR the list; explicit goto-back gives a stable post-reload landing for expandAllCategories()'s waitForLoad)."
metrics:
  duration_seconds: 2134
  duration_human: "35m34s"
  completed_at: "2026-05-11T07:42:02Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 1
---

# Phase 74 Plan 01: Candidate Translation Surface E2E (E2E-01) Summary

**One-liner:** New Playwright spec asserts the multilocale candidate translation Button at `Input.svelte:641-647` expands to per-locale inputs, the Finnish-locale value is fillable, and the value persists across reload — closing the v2.8-deferred coverage gap. Single-locale absence path deferred per CONTEXT D-04.

## Acceptance Criteria

| Criterion | Status | Note |
|-----------|--------|------|
| New spec `tests/tests/specs/candidate/candidate-translation.spec.ts` exists | PASS | 86 lines |
| Spec line count within 40-90 | PASS | 86 lines (after trim from initial 94) |
| Exactly ONE `test.describe('candidate translation surface (E2E-01)', ...)` block | PASS | confirmed via `grep -c "test.describe"` |
| Exactly ONE `test('multilocale candidate authors a translation and the value persists across reload', ...)` | PASS | confirmed |
| `yarn lint:check` (npx eslint) on new spec exits 0 with 0 warnings | PASS | exit 0, 0 warnings |
| `yarn test:e2e --workers=1 --grep "multilocale candidate authors a translation"` exits 0 | PASS | 6 passed |
| 3-run cold-start `--workers=1` smoke yields identical PASS on all 3 runs | PASS | 14.2s / 13.6s / 13.4s — all 3 runs `6 passed` |
| Test title does NOT end with any of the 14 `IMGPROXY_TIED_TITLES` patterns | PASS | grep-verified against `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs:64-79` |
| Spec uses `getByRole('button', { name: /^Translations$/i })` (multilocale-surface canonical locator) | PASS | per PATTERNS entry 8 + RESEARCH Pitfall 2 |
| No new testIds added; no new translation keys added | PASS | only existing fixtures/roles used |

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author candidate-translation.spec.ts (multilocale Button + expand + persist) | `b3bf17f73` | `tests/tests/specs/candidate/candidate-translation.spec.ts` (new); `tests/playwright.config.ts` (testMatch regex extended); `.planning/phases/74-high-leverage-e2e-coverage/deferred-items.md` (new) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated playwright.config.ts candidate-app project testMatch to include candidate-translation.spec.ts**
- **Found during:** Task 1 execution (initial test run)
- **Issue:** The `candidate-app` Playwright project's `testMatch: /candidate-(auth|questions)\.spec\.ts/` would NOT match the new `candidate-translation.spec.ts` file, so the test would never run. The plan listed `files_modified: tests/tests/specs/candidate/candidate-translation.spec.ts` only — missing the config update.
- **Fix:** Extended the regex to `/candidate-(auth|questions|translation)\.spec\.ts/` (1-line change at `tests/playwright.config.ts:111`).
- **Files modified:** `tests/playwright.config.ts`
- **Commit:** `b3bf17f73`

**2. [Rule 1 - Bug] Locator pivot from `getByLabel(/Suomi/i)` to `getByRole('textbox', { name: /lang\.fi$/i })`**
- **Found during:** Task 1 first test run (error-context page snapshot)
- **Issue:** The Plan text and PATTERNS entry 8 expect the per-locale label to render as `"Suomi"` (the `t('lang.fi')` translation). The actual runtime behavior is that the `lang.<locale>` translation keys are NOT registered in `apps/frontend/src/lib/i18n/translations/` — they fall through to literal text `"lang.fi"`. The page snapshot shows `textbox "Arguments lang.fi"` as the accessible name.
- **Fix:** Locator pivoted to match the actual rendered accessible name. Still role/aria-based (`getByRole('textbox', ...)`), still lint-compliant — NOT a testId or CSS locator.
- **Out-of-scope work documented in:** `.planning/phases/74-high-leverage-e2e-coverage/deferred-items.md` (Plan 01 entry 1).
- **Files modified:** `tests/tests/specs/candidate/candidate-translation.spec.ts`
- **Commit:** `b3bf17f73` (rolled into Task 1)

**3. [Rule 1 - Bug] Post-save reload sequence: explicit goto-back to questions-list before reload**
- **Found during:** Task 1 second test run (timeout at QuestionsPage.waitForLoad)
- **Issue:** The Plan text said `await page.reload()` directly after `saveAnswer()`. In practice, `saveAnswer()` navigates to the next-unanswered-question OR back to the questions-list (depending on candidate state). Reloading from an unstable destination caused `expandAllCategories()`'s `waitForLoad()` (which looks for `candidate-questions-list` testId) to time out at 15s.
- **Fix:** Added explicit `await page.goto(buildRoute({ route: 'CandAppQuestions', locale: 'en' }))` before `page.reload()`. Gives a deterministic post-reload landing.
- **Files modified:** `tests/tests/specs/candidate/candidate-translation.spec.ts`
- **Commit:** `b3bf17f73` (rolled into Task 1)

## Deferred Items Surfaced (Out-of-Scope for Plan 01)

Documented in `.planning/phases/74-high-leverage-e2e-coverage/deferred-items.md` for Phase 74 close routing:

1. **`lang.<locale>` translation keys are unwired** — Input.svelte uses `t('lang.<locale>')` for the per-locale label but the keys are NOT registered in any `translations/{locale}/*.json` nor in the `keys` array at `apps/frontend/src/lib/i18n/translations/index.ts:7-54`. Fix is multi-locale i18n work; route to Phase 78 CLEAN-04 (i18n wrapper tightening) at Phase 74 close.

2. **`staticSettings.supportedLocales` is unused by the input surface** — Input.svelte's `locales` come from Paraglide (`apps/frontend/src/lib/i18n/init.ts:42`), NOT from `staticSettings.supportedLocales`. The deferred single-locale variant (CONTEXT D-04) needs to target Paraglide, not `staticSettings`. Updates the framing of the follow-up todo at phase close.

## Authentication Gates

None — spec runs under the pre-authenticated `candidate-app` Playwright project storageState (mock.candidate.2@openvaa.org from `auth-setup`).

## Test Title (for Plan 07 IMGPROXY collision audit)

```
multilocale candidate authors a translation and the value persists across reload
```

Grep-verified against the 14 `IMGPROXY_TIED_TITLES` at `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs:64-79` — no collision (none of the 14 bound titles is a suffix of the new title).

## Inline `// reason:` Annotations Added

**None.** The spec uses role/aria/label locators exclusively; no testId additions; no per-cast lint-disable preambles required. The post-Phase-73 `playwright/*` lint rules at `'error'` (per `tests/eslint.config.mjs:18-34`) pass cleanly with 0 warnings.

## DATA_RACE / PASS_LOCKED Classification Recommendation for Plan 07

**Recommendation: PASS_LOCKED.**

Rationale: The new test passed 3 consecutive cold-start `--workers=1` runs identically (14.2s / 13.6s / 13.4s) without retry. It does NOT touch imgproxy-tied paths (no profile-image upload, no `cardContents.image` rendering, no entity-detail drawer). It runs under the `candidate-app` project, which has imgproxy-tied entries (3 CAND-03 tests + several others — see the 14 IMGPROXY_TIED_TITLES list), but the translation surface specifically asserts text-input behavior, not image rendering.

Caveat for Plan 07: during initial development, the underlying Supabase containers exhibited two transient infrastructure-level flake modes:
- `data.setup.ts` failures with `ENOENT: ... .playwright-artifacts-N/<hash>.zip` (intermittent, recovered after clearing the artifacts dir).
- PostgREST schema-cache staleness (`Could not find the function public.bulk_import in the schema cache`), resolved by a full `yarn supabase stop --no-backup && yarn supabase:start` cycle.

Neither flake is caused by the new spec; both pre-date Phase 74 (Phase 73 D-09 explicitly catalogs the imgproxy-tied infrastructure flake pool). Plan 07 should expect the new test to land in PASS_LOCKED; if a cold-start run lands it in DATA_RACE/CASCADE downstream of one of the two infrastructure modes above, that classification is a UPSTREAM cascade — NOT a spec-internal flake — and should be documented in `74-VERIFICATION.md` accordingly.

## 3-Run Cold-Start Determinism Smoke

| Run | Result | Wall-clock |
|-----|--------|------------|
| 1 | 6 passed (data-setup ✓ → auth-setup ✓ → re-auth-setup ✓ → **candidate-translation ✓** → data-teardown ×2 ✓) | 14.2s |
| 2 | 6 passed (identical pass set) | 13.6s |
| 3 | 6 passed (identical pass set) | 13.4s |

Identical pass set across all 3 runs — the Phase 73 D-09 determinism contract is preserved.

## Decisions Made

1. **Locator strategy** — role/aria/label only (NO testId additions per CONTEXT D-11). `getByRole('button', { name: /^Translations$/i })` and `getByRole('textbox', { name: /lang\.fi$/i })` carry the assertion shape.
2. **Question index** — `navigateToQuestion(0)` (test-question-1 — first opinion question with `customData.allowOpen = true`, verified at `packages/dev-seed/src/templates/e2e.ts:294-303`).
3. **Save-then-reload sequence** — explicit goto-back to questions-list before reload to give a deterministic post-reload landing (the only structural deviation from Plan text).
4. **Single-locale variant** — DEFERRED per CONTEXT D-04. No spurious test stub added.

## Self-Check: PASSED

Verified before writing this Summary:

- [x] `tests/tests/specs/candidate/candidate-translation.spec.ts` exists (86 lines).
- [x] `.planning/phases/74-high-leverage-e2e-coverage/deferred-items.md` exists.
- [x] `tests/playwright.config.ts` has the extended testMatch regex (`candidate-(auth|questions|translation)\.spec\.ts`).
- [x] Commit `b3bf17f73` is in the git log (`git log --oneline | grep "b3bf17f73"`).
- [x] 3-run cold-start smoke: PASS PASS PASS.
- [x] Lint: 0 errors / 0 warnings on the new spec via `npx eslint`.
- [x] IMGPROXY_TIED_TITLES collision check: NONE.

## Known Stubs

None.

## Threat Flags

None — Plan 01 adds Playwright spec authoring only; no new product code, no new API surface, no new auth path (per `<threat_model>` in the plan).
