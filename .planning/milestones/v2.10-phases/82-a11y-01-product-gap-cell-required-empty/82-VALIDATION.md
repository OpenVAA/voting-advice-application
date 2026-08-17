---
phase: 82
slug: a11y-01-product-gap-cell-required-empty
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-13
---

# Phase 82 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. TIGHTEN-SOFT save-gate landing for A11Y-07.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 (catalog) — `@playwright/test` |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-07"` |
| **Full A11Y-01 regression** | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~30s (single cell), ~3min (A11Y-01 regression), ~25min (full suite, cold-start) |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:e2e --project=candidate-app-mutation -g "A11Y-07 required-empty"` (single-cell smoke).
- **After every plan wave:** Run `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` (full 6-cell regression: image-type, image-size, name-too-long, A11Y-05, A11Y-06, NEW A11Y-07).
- **Before `/gsd-verify-work`:** `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` (vite-cache wipe per Phase 81 D-13) then 3 consecutive `yarn test:e2e --workers=1` cold-start runs must show SHA-identical pass/fail sets (Phase 79 determinism contract).
- **Max feedback latency:** 30 seconds (single-cell smoke).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 82-01-01 | 01 | 1 | A11Y-07 | — | N/A (save-gate UX, not a security boundary) | manual | `git diff packages/dev-seed/src/templates/e2e.ts` shows `+ custom_data: { required: true }` on sort-24 row + `+ { value: { en: 'sentinel-82-required' } }` on Alpha entry | ✅ | ⬜ pending |
| 82-01-02 | 01 | 1 | A11Y-07 | — | Submit button disables when required-empty | manual | `git diff apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` shows `&& allRequiredFilled` on line 92 | ✅ | ⬜ pending |
| 82-01-03 | 01 | 2 | A11Y-07 | — | Spec asserts button-disable gate | e2e | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-07 required-empty"` exits 0 | ✅ | ⬜ pending |
| 82-01-04 | 01 | 2 | A11Y-07 | — | Phase 76+81 cells continue to pass | e2e | `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` exits 0 (6 cells PASS) | ✅ | ⬜ pending |
| 82-01-05 | 01 | 3 | — | — | 3-run cold-start SHA-identical (+1 PASS_LOCKED additive) | e2e | `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` then 3 × `yarn test:e2e --workers=1` SHA-identical | ✅ | ⬜ pending |
| 82-01-06 | 01 | 3 | — | — | Constants regen folded (if +1 PASS_LOCKED surfaces) | manual | `npx tsx tests/scripts/diff-playwright-reports.ts` outputs 81 PASS_LOCKED (was 80) OR no regen needed | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — exists (Phase 76 / Phase 81 lineage); Phase 82 extends with cell 4.
- [x] `tests/tests/utils/testIds.ts` — `candidate.profile.submit = 'profile-submit'` registered (verified by researcher at line 20).
- [x] `tests/playwright.config.ts:124` — `candidate-(registration|profile|profile-validation)\.spec\.ts` regex already includes `profile-validation`. NO config change needed.
- [x] `packages/dev-seed/src/templates/e2e.ts` — exists; Phase 82 adds sort-24 row + Alpha answer cell.
- [x] `packages/dev-seed/src/generators/QuestionsGenerator.ts:100-106` — fixed[] row pass-through verified verbatim by researcher.

*Existing infrastructure covers all Phase 82 requirements; no Wave 0 gaps.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pre-baseline confirmation: existing 5 A11Y-01 cells PASS at HEAD pre-changes | All | Verifies Phase 81 close left the spec green before Phase 82 extends it (per CONTEXT specifics §"Planner re-baseline") | Run `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` at HEAD-pre-changes; expect 5 PASS. If any fail, file as Phase 82 blocker before authoring cell 4. |
| Local smoke: visit candidate profile, verify "Required" notice + sr-only badge render on the new sort-24 question | A11Y-07 | Verifies dispatch wiring (Question.subtype-style + customData.required propagation) before authoring the spec | (1) `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean`; (2) `yarn dev`; (3) login as Alpha (e2e credentials); (4) navigate to `/candidate/profile`; (5) confirm "Required-empty (Phase 82 A11Y-07 anchor)" question renders with a "Required" badge (sr-only); (6) confirm submit button is ENABLED (Alpha is profileComplete by default — answer is seeded). |
| Local smoke: clear the field manually, verify submit button disables | A11Y-07 | Visual confirmation of the TIGHTEN-SOFT gate before relying on the spec assertion | After the previous smoke: clear the "Required-empty" question's input, click outside (blur), observe the submit button becomes disabled, observe the "Required" notice's opacity flips from 0 to 1. |
| 3-run cold-start SHA-identity gate | All (Phase 79 contract) | Cannot be reliably automated in CI under current setup; must be operator-verified | Operator runs `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` then 3 × `yarn test:e2e --workers=1`. Compare the 3 `playwright/playwright-report-*.json` SHA-256 hashes; require all 3 IDENTICAL. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (manual gates are operator-only by design — 3-run cold-start, vite-cache wipe recipe, local smoke).
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (cell 4 e2e test fires on every task commit + every wave merge).
- [x] Wave 0 covers all MISSING references (none missing).
- [x] No watch-mode flags (Playwright `--workers=1` cold-start is the deterministic gate; no `--watch`).
- [x] Feedback latency < 30s (single-cell smoke).
- [x] Security domain: no ASVS categories newly apply (save-gate UX, not security boundary — backend `userData.save()` already rejects empty-required).
- [ ] `nyquist_compliant: true` set in frontmatter (pending planner sign-off after PLAN.md authoring).

**Approval:** pending — planner reviews + signs after PLAN.md is authored.
