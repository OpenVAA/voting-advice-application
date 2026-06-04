---
phase: 91
slug: tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
---

# Phase 91 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `91-RESEARCH.md` §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (workspace-pinned) + Vitest (unit tests in dev-seed package) |
| **Config file** | `tests/playwright.config.ts` + `packages/dev-seed/vitest.config.ts` |
| **Quick run command** | `yarn test:e2e --project=perm-{name}` (single perm chain) OR `yarn test:e2e --project={voter\|candidate}-mega-journey` |
| **Full suite command** | `yarn test:e2e` (default chain — perm + mega-journey + voter/candidate spec chains, sequential) |
| **Estimated runtime** | Single perm: ~30-60s. Mega-journey: ~3-5min. Full default suite: ~30-45min (post-91). Opt-in (visual/perf/a11y/bank-auth) adds ~5-10min each. |

---

## Sampling Rate

- **After every task commit:** Run the matching perm project (`yarn test:e2e --project=perm-X`) or mega-journey project (`yarn test:e2e --project=voter-mega-journey` / `candidate-mega-journey`).
- **After every plan wave:** Run all perm projects authored in that plan + the mega-journey projects if Group B touched.
- **Before `/gsd:verify-work`:** Full default `yarn test:e2e` green + the four opt-in projects (`PLAYWRIGHT_VISUAL=1`, `PLAYWRIGHT_PERF=1`, `PLAYWRIGHT_A11Y=1`, `PLAYWRIGHT_BANK_AUTH=1`) green individually.
- **Max feedback latency:** Single perm task → ~60s. Mega-journey task → ~5min. Plan wave → ~10min. Phase gate → ~50min (parallelizable across opt-in suites).

---

## Per-Task Verification Map

> Requirements use synthetic IDs derived from CONTEXT.md groups (Group A / B / C / D) — phase has no `phase_req_ids` in ROADMAP.md. Planner expands per-plan task IDs.

| Req ID | Plan | Wave | Behavior | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|--------|------|------|----------|------------|-----------------|-----------|-------------------|-------------|--------|
| 91-A1 | 91-02 | 1 | answersLocked perm: candidate sees read-only warning + disabled inputs/radios | — | N/A | e2e (perm) | `yarn test:e2e --project=perm-answers-locked` | ❌ W0 | ⬜ pending |
| 91-A2 | 91-02 | 1 | hideHero perm: hero element absent on candidate opinion Q | — | N/A | e2e (perm) | `yarn test:e2e --project=perm-hide-hero` | ❌ W0 | ⬜ pending |
| 91-A3 | 91-02 | 1 | header.showFeedback perm: header feedback button + feedbackDialog opens | — | N/A | e2e (perm) | `yarn test:e2e --project=perm-header-show-feedback` | ❌ W0 | ⬜ pending |
| 91-A4 | 91-02 | 1 | header.showHelp perm: header help button + Help URL navigation | — | N/A | e2e (perm) | `yarn test:e2e --project=perm-header-show-help` | ❌ W0 | ⬜ pending |
| 91-A5 | 91-02 | 1 | showAllNominations=false perm: `/nominations` redirects to Home | — | N/A | e2e (perm) | `yarn test:e2e --project=perm-hide-all-nominations` | ❌ W0 | ⬜ pending |
| 91-A6 | 91-02 | 1 | hideIfMissingAnswers perm: cand-2 filtered from results list | — | N/A | e2e (perm) | `yarn test:e2e --project=perm-hide-if-missing-answers` | ❌ W0 | ⬜ pending |
| 91-A7 | 91-02 | 1 | showElectionTags=false perm: no election-tag on questions view | — | N/A | e2e (perm) | `yarn test:e2e --project=perm-hide-election-tags` | ❌ W0 | ⬜ pending |
| 91-A8 | 91-02 | 1 | showCategoryTags=false perm: no category-tag on questions view | — | N/A | e2e (perm) | `yarn test:e2e --project=perm-hide-category-tags` | ❌ W0 | ⬜ pending |
| 91-A9 | 91-02 | 1 | allowOpen=false perm: candidate Q2 no info input + voter Q2 info hidden | — | N/A | e2e (perm) | `yarn test:e2e --project=perm-disable-allow-open` | ❌ W0 | ⬜ pending |
| 91-B1 | 91-03 | 1 | invalidUrl edit-step on candidate profile Link Q | — | N/A | e2e (mega) | `yarn test:e2e --project=candidate-mega-journey` | ✅ (extended) | ⬜ pending |
| 91-B2 | 91-03 | 1 | feedbackDialog edit-step on voter nav | — | N/A | e2e (mega) | `yarn test:e2e --project=voter-mega-journey` | ✅ (extended) | ⬜ pending |
| 91-B3 | 91-03 | 1 | all-nominations edit-step on voter `/nominations` | — | N/A | e2e (mega) | `yarn test:e2e --project=voter-mega-journey` | ✅ (extended) | ⬜ pending |
| 91-C1 | 91-04 | 1 | Visual regression rebaseline + candidatePreviewPage fixture wrap | — | N/A | e2e (visual) | `PLAYWRIGHT_VISUAL=1 npx playwright test --project=visual-regression -c tests/playwright.config.ts` | ✅ (refactored) | ⬜ pending |
| 91-C2 | 91-04 | 1 | Perf budget migrated to voter-mega.fixture answeredVoterPage | — | N/A | e2e (perf) | `PLAYWRIGHT_PERF=1 npx playwright test --project=performance -c tests/playwright.config.ts` | ✅ (refactored) | ⬜ pending |
| 91-C3 | 91-04 | 1 | A11Y axe smoke migrated + locatedVoterPage extension | — | N/A | e2e (a11y) | `PLAYWRIGHT_A11Y=1 npx playwright test --project=a11y-smoke -c tests/playwright.config.ts` | ✅ (refactored) | ⬜ pending |
| 91-C4 | 91-04 | 1 | Bank-auth minimal pass (import swap + strictness audit) | — | N/A | e2e (bank-auth) | `PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth -c tests/playwright.config.ts` | ✅ (refactored) | ⬜ pending |
| 91-D1 | 91-03 | 1 | voter-feedback-persistence.spec.ts deletion | — | N/A | static | `! test -f tests/tests/specs/voter/voter-feedback-persistence.spec.ts` | ✅ (deletion target) | ⬜ pending |
| 91-D2 | 91-04 | 1 | voter.fixture.ts @deprecated banner | — | N/A | static | `grep -q "@deprecated" tests/tests/fixtures/voter.fixture.ts` | ✅ (banner target) | ⬜ pending |
| 91-Helper | 91-01 | 1 | buildMinimal helper authored + unit-tested | — | N/A | unit (vitest) | `yarn workspace @openvaa/dev-seed test:unit` | ❌ W0 | ⬜ pending |
| 91-Port | 91-01 | 2 | Existing minimal perms ported to helper without regression | — | N/A | e2e (per perm) | `yarn test:e2e --project=perm-1e1cg1co` etc. (per-port verification) | ✅ (existing) | ⬜ pending |
| 91-Audit | 91-04 | 1 | New tests (mega-journeys + perm specs) audited for legacy-fixture imports + refactored | — | N/A | static | `! grep -rE "from '../../fixtures/voter.fixture'" tests/tests/specs/perm/ tests/tests/specs/voter/voter-mega-journey.spec.ts tests/tests/specs/candidate/candidate-mega-journey.spec.ts` | (audit may surface 0 hits) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity:** Plan 91-01 (helper + ports) and Plan 91-04 (refactor + deprecation banner) each have ≥1 automated task per wave. Plan 91-02 (9 perms) has 9 sequential automated tasks. Plan 91-03 (3 edit-steps + fixture + deletion) has 4 automated tasks. No 3 consecutive tasks lack automated verification.

---

## Wave 0 Requirements

- [ ] 9 new perm spec files under `tests/tests/specs/perm/perm-{name}.spec.ts`
- [ ] 9 new perm template files under `packages/dev-seed/src/templates/permutations/perm-{name}.ts`
- [ ] 9 new setup/teardown pairs under `tests/tests/setup/perm-{name}.setup.ts` + `perm-{name}.teardown.ts`
- [ ] `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` — helper authored (Plan 91-01)
- [ ] `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` — shared fixture authored (Plan 91-03)
- [ ] `tests/tests/utils/testIds.ts` extensions — 9 new testid entries per RESEARCH §"New TestId Inventory"
- [ ] 9 testid additions to Svelte components (`Banner.svelte`, `ElectionTag.svelte`, `CategoryTag.svelte`, `Input.svelte`, `Feedback.svelte`, candidate login + answers-locked-warning components)
- [ ] Playwright config 27 new entries appended in `tests/playwright.config.ts` (Plan 91-02, after templates exist)
- [ ] `voter-mega.fixture.ts` `locatedVoterPage` variant extension (Plan 91-04, before a11y refactor)
- [ ] No framework install needed — all dependencies already wired.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual rebaseline review | 91-C1 | Screenshot baselines change requires human eye on diff before commit. CI captures; reviewer approves. | After `PLAYWRIGHT_VISUAL=1 ... --update-snapshots` runs in CI, manually inspect updated `tests/tests/__screenshots__/*.png` diff against prior baselines before merging. |
| Bank-auth full identity-callback flow | 91-C4 | Env-gated, requires Edge Function `serve --no-verify-jwt` + service-role keys. Synthesized JWE tokens but real Edge Function. | Operator runs `PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 npx playwright test --project=bank-auth -c tests/playwright.config.ts` with Edge Functions serving. |

All other phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (validated in §"Per-Task Verification Map")
- [ ] Wave 0 covers all MISSING references (9 perm files × 3 + helper + fixture + testIds + Svelte testids + playwright config + voter-mega extension)
- [ ] No watch-mode flags (Playwright + Vitest run single-shot per task)
- [ ] Feedback latency < 5min per task, < 10min per wave, < 50min phase gate
- [ ] `nyquist_compliant: true` set in frontmatter (after planner verifies all per-task automated commands resolve)

**Approval:** pending
