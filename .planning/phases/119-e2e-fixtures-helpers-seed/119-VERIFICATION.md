---
phase: 119-e2e-fixtures-helpers-seed
verified: 2026-06-15T12:25:00Z
status: human_needed
score: 3.5/4
overrides_applied: 0
human_verification:
  - test: "Run the 4 deferred perm-seeded probes (video, questionInfo, popupNotice, orgMatching) green once in true isolation"
    expected: "Each probe passes cleanly once against a fresh Vite dev server + clean local Supabase, seeded with its respective perm template"
    why_human: "Operator explicitly deferred these 4 probes to Phase 120 via DEF-119-08-01. The evidence gathered in Phase 119 was in a contaminated multi-run degraded-env session. SC2 is PARTIAL (4/8 live-proven). Phase 119 closes on author + static-verify (SC1 green) + 4/8-live; the remaining 4 live-greens carry forward. This checkpoint is the binding Phase-120 carry-forward, not a Phase-119 blocker per operator decision."
---

# Phase 119: E2E Fixtures & Helpers + Seed — Verification Report

**Phase Goal:** The fixtures and helpers that the existing-feature specs depend on are built and self-tested before any spec consumes them (fixtures-first), and the default-seed tooling bug is fixed alongside the seed-data changes those specs need.
**Verified:** 2026-06-15T12:25:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | `yarn typecheck:tests` + `no-restricted-locators` guard stay green with all 8 probes present | VERIFIED | `yarn typecheck:tests` exits 0 (confirmed live). ESLint locator guard exits 0 on `tests/tests/specs/_probes/`. All 8 probe files import `test`/`expect` from `views.ts` and contain zero raw `.locator()`/`getByText()`/`getByRole()` on assertion paths. |
| SC2 | Each new Phase-119 fixture is exercised by at least one smoke/probe (fixtures-first / A8) — **OPERATOR-SANCTIONED PARTIAL** | VERIFIED (override-by-operator) | All 8 probe files exist on disk (`tests/tests/specs/_probes/*.probe.spec.ts`). 4/8 probes (theme, trackingIntercept, navMenu, entityFilters) confirmed green live. 4/8 (video, popupNotice, orgMatching, questionInfo) authored + statically verified (SC1 green) but live-run deferred to Phase 120 by explicit operator decision (2026-06-15), recorded as DEF-119-08-01 in `deferred-items.md`. Both conditions are documented: (1) isolation-first re-diagnosis required; (2) root-cause is UNCONFIRMED. |
| SC3 | `yarn db:seed:default` produces valid dataset — parties present, candidates tab populated, consistent naming (UNBLK-03) | VERIFIED | `default.ts` commit `49a23512e`: docstrings reconciled (5 constituencies / 327 candidates, was stale "13/100") + `entities.hideIfMissingAnswers.candidate:false` defensive posture applied. Operator ran the app on 2026-06-15 and confirmed parties render, candidates tab populated, naming consistent at `/results`. Recorded in `119-02-SUMMARY.md`. |
| SC4 | `@openvaa/dev-seed` unit suite passes green | VERIFIED | Confirmed live: `yarn workspace @openvaa/dev-seed test:unit` — 42 test files, **441 passed** (including `default-template.integration.test.ts` at 6.9s, within NF-01 <10s budget). |

**Score:** 3.5/4 truths verified (SC2 partially verified — 4/8 live-proven, 4/8 operator-deferred)

### Deferred Items

Items not yet live-proven but explicitly addressed in Phase 120.

| # | Item | Addressed In | Evidence |
|---|------|-------------|---------|
| 1 | 4 perm-seeded probes live-green (video, popupNotice, orgMatching, questionInfo) — SC2 carry-forward | Phase 120 | DEF-119-08-01 in `deferred-items.md`; operator decision 2026-06-15; Phase 120 adds `_probes` project wiring per ROADMAP.md |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dev-seed/src/cli/seed.ts` | `--likert-only` fully removed; `parseArgs` retained | VERIFIED | No `likert` references. `parseArgs` present. `likert-only.ts` deleted. |
| `packages/dev-seed/src/cli/likert-only.ts` | Deleted | VERIFIED | File does not exist (`ls` returns nothing). |
| `tests/tests/utils/voterNavigation.ts` | 4 dead helpers deleted; `navigateToFirstQuestion` retained | VERIFIED | `walkToQuestion`, `waitForNextQuestion`, `clickThroughIntroPages`, `walkToQuestionsIntro` — all absent. `navigateToFirstQuestion` present at line 282. |
| `packages/dev-seed/src/templates/default.ts` | Docstring reconciled; `hideIfMissingAnswers.candidate:false` | VERIFIED | Confirmed at lines 5, 7, 234-242. Commit `49a23512e`. |
| `packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts` | New perm template | VERIFIED | File exists; registered as `perm-question-video` in `templates/index.ts:102`. |
| `packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts` | New perm template | VERIFIED | File exists; registered as `perm-interactive-info` in `templates/index.ts:103`. |
| `packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts` | New perm template | VERIFIED | File exists; registered as `perm-org-matching` in `templates/index.ts:104`. |
| `packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts` | Renamed/extended perm template | VERIFIED | File exists; registered as `show-feedback-survey` in `templates/index.ts:89`. |
| `tests/tests/utils/testIds.ts` | Extended with Phase-119 keys | VERIFIED | Contains `video`, `feedbackPopup`, `surveyPopup`, `popupInfoButton`, `popupInfoModal`, `entity-filter-select-all-toggle`, etc. |
| `tests/tests/fixtures/shared/video.fixture.ts` | `expectVideo(present)` reader | VERIFIED | `expectVideo` defined at line 46/62. Anchored through testIds. |
| `tests/tests/fixtures/voter/questionInfo.fixture.ts` | `expectInfoMode`, `expectInfoSections`, `expectArguments` | VERIFIED | All three functions defined and exported. |
| `tests/tests/fixtures/shared/popupNotice.fixture.ts` | `expectVisible`, `dismissAndReload` | VERIFIED | Both defined and exported. |
| `tests/tests/fixtures/voter/resultsPage.fixture.ts` | `expectOrgMatchScore` | VERIFIED | Defined at line 228. |
| `tests/tests/fixtures/voter/aboutPage.fixture.ts` | `expectOrgMatchingDisclosure` | VERIFIED | Defined at line 66. |
| `tests/tests/fixtures/voter/entityFilters.fixture.ts` | `selectAll`, `selectNone` | VERIFIED | Both defined at lines 147, 164. |
| `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` | `getTrackCalls` | VERIFIED | Defined at line 67/105. |
| `tests/tests/fixtures/shared/theme.fixture.ts` | `setColorScheme`, `expectTheme` (emulateMedia) | VERIFIED | Both defined at lines 55, 57. |
| `tests/tests/fixtures/shared/navMenu.fixture.ts` | `openMobileNav`, `expectNavMenuItems` | VERIFIED | Both defined at lines 39, 45. Hydration-race fix applied in commit `939066319`. |
| `tests/tests/specs/_probes/video.probe.spec.ts` | Smoke/probe for `expectVideo` | VERIFIED | File exists; imports from `views.ts`; seeds `perm-question-video`; `expectVideo` referenced. |
| `tests/tests/specs/_probes/questionInfo.probe.spec.ts` | Smoke/probe for `expectInfoMode`, `expectArguments` | VERIFIED | File exists; contains `expectInfoMode`, `expectArguments`, `expectInfoSections`. |
| `tests/tests/specs/_probes/popupNotice.probe.spec.ts` | Smoke/probe for `dismissAndReload` | VERIFIED | File exists; `dismissAndReload` referenced. |
| `tests/tests/specs/_probes/orgMatching.probe.spec.ts` | Smoke/probe for `expectOrgMatchingDisclosure` | VERIFIED | File exists; `expectOrgMatchingDisclosure` referenced. |
| `tests/tests/specs/_probes/entityFilters.probe.spec.ts` | Smoke/probe for `selectAll`/`selectNone` | VERIFIED | File exists; `selectAll` referenced. LIVE GREEN. |
| `tests/tests/specs/_probes/trackingIntercept.probe.spec.ts` | Smoke/probe for `getTrackCalls` | VERIFIED | File exists; `getTrackCalls` referenced. LIVE GREEN. |
| `tests/tests/specs/_probes/theme.probe.spec.ts` | Smoke/probe for `setColorScheme`, `expectTheme` | VERIFIED | File exists; `emulateMedia`/`setColorScheme` referenced. LIVE GREEN. |
| `tests/tests/specs/_probes/navMenu.probe.spec.ts` | Smoke/probe for `openMobileNav`, `expectNavMenuItems` | VERIFIED | File exists; `expectNavMenuItems` referenced. LIVE GREEN. |
| `.planning/phases/119-e2e-fixtures-helpers-seed/deferred-items.md` | DEF-119-08-01 carry-forward | VERIFIED | File exists; DEF-119-08-01 entry at line 29 with two binding conditions, 4 probe table, and Phase 120 handoff. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| All 8 probe files | `tests/tests/fixtures/voter/views.ts` | `import { test, expect } from '../../fixtures/voter/views'` | VERIFIED | Confirmed in all 8 probe files. |
| Probe files | Dev-seed CLI | CLI-seed out-of-band (`yarn db:seed --template <name>`) | VERIFIED | Probe convention documented in SUMMARY; seed commands in each probe header comment. |
| `perm-question-video`, `perm-interactive-info`, `perm-org-matching`, `show-feedback-survey` | `packages/dev-seed/src/templates/index.ts` | `BUILT_IN_TEMPLATES` map | VERIFIED | Registered at lines 89, 102-104 of `index.ts`. |
| `default.ts` `entities.hideIfMissingAnswers.candidate:false` | `yarn db:seed:default` / running app | `mergeAppSettings` shallow-by-root-key | VERIFIED | Operator confirmed running-app rendering in SUMMARY; defensive flag present in `default.ts:242`. |
| Production svelte files | `testIds` registry | `data-testid` attributes | VERIFIED | `Video.svelte` (line 656), `FeedbackPopup.svelte` (line 55), `SurveyPopup.svelte` (line 43), `QuestionExtendedInfoButton.svelte` (line 56), `QuestionExtendedInfo.svelte` (line 58), `EnumeratedEntityFilter.svelte` (lines 198, 223). |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `yarn typecheck:tests` — SC1 | `yarn typecheck:tests` | exit 0, no output | PASS |
| No-restricted-locators guard on probe files | `yarn eslint --flag v10_config_lookup_from_file tests/tests/specs/_probes/` | exit 0, no errors | PASS |
| `@openvaa/dev-seed` unit suite — SC4 | `yarn workspace @openvaa/dev-seed test:unit` | 42 test files, 441 passed | PASS |
| 4 live-green probes (theme, trackingIntercept, navMenu, entityFilters) | Per-probe CLI-seed + isolated Playwright run (documented in 119-08 SUMMARY) | All 4 PASS (operator-observed 2026-06-15) | PASS |
| 4 deferred probes (video, popupNotice, orgMatching, questionInfo) | Same CLI-seed + isolated run pattern (see DEF-119-08-01 setup steps) | NOT RUN in clean env — contaminated-env evidence; deferred per operator decision | SKIP (human verification required) |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| UNBLK-03 | 119-02-PLAN.md | `yarn db:seed:default` produces valid dataset — parties present, candidates tab populated, consistent naming | SATISFIED | `default.ts` reconciled + `hideIfMissingAnswers.candidate:false`; operator confirmed running-app; dev-seed unit suite green. REQUIREMENTS.md tracking row still shows "Pending" (documentation-tracking lag, not a code gap — the implementation is in place and operator-verified). |

**Note on REQUIREMENTS.md tracking:** The `UNBLK-03` row in `.planning/REQUIREMENTS.md` line 180 still reads `| UNBLK-03 | Phase 119 | Pending |` and the checkbox at line 78 is still `[ ]`. The implementation is complete and operator-verified, but the tracking document was not updated during Phase 119 execution. This is a documentation artifact gap, not a code gap — the work is done. Recommend updating to `[x]` and `Complete` as part of Phase 120 onboarding or a docs pass.

---

### Anti-Patterns Found

The code review (119-REVIEW.md, 0 critical / 6 warnings / 5 info) identified the following. The verifier independently assessed each:

| File | Finding | Severity | Assessment |
|------|---------|----------|------------|
| `packages/dev-seed/src/cli/help.ts:26-30` | WR-01: Stale `e2e` template listed; `e2e/base` + perm templates absent from help text | WARNING | Pre-existing issue (stale since Phase 93 retired the bare `e2e` name). Phase 119 added new templates without updating help.ts, contrary to the file's own header contract. Does NOT block the phase goal (cli `--template` resolution is separate from help text). Unit test suite green. |
| `packages/dev-seed/tests/cli/help.test.ts:33-35` | WR-02: Test pins the stale `e2e` template name — locks in WR-01 | WARNING | Passes because help.ts still lists stale `e2e`. A correct future fix to help.ts will need this test updated simultaneously. Not a phase-goal blocker. |
| `packages/dev-seed/src/cli/seed.ts:84-91` | WR-04: `--seed` validation uses `Number.isFinite` (wrong predicate — only rejects NaN, not `12abc` silently accepted as `12`) | WARNING | Pre-existing code path (Phase 119 edited the surrounding region); not introduced by this phase. Does not affect SC1-SC4. Noted for follow-up. |
| `tests/tests/fixtures/shared/popupNotice.fixture.ts:78` | WR-05: `dismiss()` regex is English-only (`/close|dismiss|cancel/i`); locale-resilience claim in docstring is inaccurate | WARNING | Real documentation/reliability gap; `dismiss()` will fail under non-English locales. Not a blocker for Phase 119's fixtures-first goal — the deferred probes that exercise `dismissAndReload` target English seed data. |
| `packages/dev-seed/src/templates/default.ts:251-260` | WR-06: `results` block replaces the whole `results` object by shallow-merge semantics; if future `dynamicSettings.ts` adds a `results.*` key, it will be silently absent from the `default` dataset | WARNING | Latent future regression vector. Not a current defect — confirmed no missing keys today. The 441-test suite (including `default-template.integration.test.ts`) passes. |

**Debt markers (TBD/FIXME/XXX):** Zero found in any Phase-119-modified file. No blockers.

---

### Human Verification Required

#### 1. 4 Deferred Perm-Seeded Probes (DEF-119-08-01 carry-forward — Phase 120)

**Test:** Run each of the following probes in true isolation against a fresh clean environment:
- `video.probe.spec.ts` (seed: `perm-question-video`)
- `popupNotice.probe.spec.ts` (seed: `show-feedback-survey`)
- `orgMatching.probe.spec.ts` (seed: `perm-org-matching`)
- `questionInfo.probe.spec.ts` (seed: `perm-interactive-info`)

Per DEF-119-08-01 binding conditions:
1. **Isolation-first** — minimal mixing with other tests, fresh Vite dev server, clean Supabase.
2. **Re-diagnose independently** — the "perm-seed reactive churn" root-cause hypothesis is UNCONFIRMED; do not apply the `voter-journey.fixture.ts` intro-start hardening until isolation-first diagnosis confirms the cause.

**Expected:** Each probe passes cleanly once (not to the 3× determinism bar — that is Phase 120/121 spec's requirement).

**Why human:** Operator explicitly deferred these 4 probes on 2026-06-15. The Phase 119 evidence came from a degraded multi-run session (stale Vite server, repeated perm re-seeds, env confounds). Phase 120 adds the proper `_probes` Playwright project wiring; these probes are Phase 120's opening gate item.

---

### Gaps Summary

No blocking gaps found in Phase 119's core deliverables. All four Success Criteria are addressed:

- **SC1 (typecheck:tests + locator guard):** VERIFIED live — exit 0.
- **SC2 (fixtures-first probes):** PARTIAL — 4/8 live-green; 4/8 operator-deferred to Phase 120 with binding conditions. Per operator direction, this is NOT scored as a phase-goal failure; it is an honest documented partial.
- **SC3 (UNBLK-03 — default seed valid):** VERIFIED — code fix in `default.ts`, operator confirmed running-app, dev-seed suite green.
- **SC4 (dev-seed unit suite green):** VERIFIED live — 441 passed.

The `human_needed` status reflects the 4 deferred probes that must be re-run in isolation in Phase 120, not a code defect in Phase 119.

**Documentation tracking note:** REQUIREMENTS.md line 180 still shows `UNBLK-03 | Phase 119 | Pending`. The implementation is complete; only the tracking document needs a status update.

**Code review warnings (WR-01 through WR-06):** None are blockers for the phase goal. WR-01/WR-02 (stale `e2e` help text + test) should be fixed when `help.ts` is next touched. WR-05 (locale-only `dismiss()` regex) should be addressed before multi-locale probe/spec work.

---

_Verified: 2026-06-15T12:25:00Z_
_Verifier: Claude (gsd-verifier)_
