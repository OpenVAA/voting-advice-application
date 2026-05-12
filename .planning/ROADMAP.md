# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- ✅ **v2.6 Svelte 5 Migration Cleanup** — Phases 60-64 (shipped 2026-04-28)
- ✅ **v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends** — Phases 65-68 (shipped 2026-05-08)
- ✅ **v2.8 Alliance Card + Frontend Hygiene Sweep** — Phases 69-72 (shipped 2026-05-10)
- ✅ **v2.9 E2E Coverage + Suite Determinism** — Phases 73-78 (shipped 2026-05-12)
- 🆕 **v2.10 Test Reliability + A11y Compliance** — Phases 79-82 (planning, framed 2026-05-12)

See `.planning/MILESTONES.md` for cumulative history and `.planning/milestones/` for archived roadmaps + requirements.

## Phases

<details>
<summary>✅ v2.5 Dev Data Seeding Toolkit (Phases 56-59) — SHIPPED 2026-04-24</summary>

- [x] Phase 56: Generator Foundations & Plumbing (10/10 plans) — completed 2026-04-23
- [x] Phase 57: Latent-Factor Answer Model (7/7 plans) — completed 2026-04-23
- [x] Phase 58: Templates, CLI & Default Dataset (10/10 plans) — completed 2026-04-23
- [x] Phase 59: E2E Fixture Migration (7/7 plans) — completed 2026-04-24

Full details: `.planning/milestones/v2.5-ROADMAP.md`

</details>

<details>
<summary>✅ v2.6 Svelte 5 Migration Cleanup (Phases 60-64) — SHIPPED 2026-04-28</summary>

- [x] Phase 60: Layout Runes Migration & Hydration Fix (5/5 plans) — completed 2026-04-24
- [x] Phase 61: Voter-App Question Flow (3/3 plans) — completed 2026-04-25
- [x] Phase 62: Results Page Consolidation (3/3 plans) — completed 2026-04-26
- [x] Phase 63: E2E Template Extension & Greening (3/3 plans) — completed 2026-04-27
- [x] Phase 64: Voter Results Reactivity Completion (Phase 62-bis) (4/4 plans) — completed 2026-04-28

Full details: `.planning/milestones/v2.6-ROADMAP.md`

</details>

<details>
<summary>✅ v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (Phases 65-68) — SHIPPED 2026-05-08</summary>

- [x] Phase 65: Svelte 5 Audit Sweeps (3/3 plans) — completed 2026-04-29
- [x] Phase 66: Adapter Type Cleanup (1/1 plan) — completed 2026-04-29
- [x] Phase 67: Default Seed Alliances (2/2 plans) — completed 2026-04-30
- [x] Phase 68: Dev-Tooling Trio (3/3 plans) — completed 2026-05-08 _(95 pre-existing frontend lint errors deferred per Option C)_

Full details: `.planning/milestones/v2.7-ROADMAP.md`
Audit: `.planning/milestones/v2.7-MILESTONE-AUDIT.md` (status: tech_debt — 8/8 reqs wired; 3 documented deferrals)

</details>

<details>
<summary>✅ v2.8 Alliance Card + Frontend Hygiene Sweep (Phases 69-72) — SHIPPED 2026-05-10</summary>

- [x] Phase 69: Alliance Card Lane A (2/2 plans) — completed 2026-05-09
- [x] Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup (5/5 plans) — completed 2026-05-09
- [x] Phase 71: Frontend Strict-Typing Cleanup (3/3 plans) — completed 2026-05-09
- [x] Phase 72: Package Hygiene Trio (3/3 plans) — completed 2026-05-09

Full details: `.planning/milestones/v2.8-ROADMAP.md`
Audit: `.planning/milestones/v2.8-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ v2.9 E2E Coverage + Suite Determinism (Phases 73-78) — SHIPPED 2026-05-12</summary>

- [x] Phase 73: Determinism Baseline (6/6 plans) — completed 2026-05-11
- [x] Phase 74: High-Leverage E2E Coverage (7/7 plans) — completed 2026-05-11
- [x] Phase 75: Question-Rendering Specs (3/3 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; multi-choice deferred)_
- [x] Phase 76: Profile + A11y (4/4 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; PRODUCT-GAP cells + axe cite-and-fix routed to v2.10)_
- [x] Phase 77: Settings Matrix + Question-Customization Gap-Fills (5/5 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; 4 PRODUCT-GAP follow-ups; cold-start gate deferred)_
- [x] Phase 78: Cleanup Hygiene Phase (7/7 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; CLEAN-05 inherited candidate-profile race routed to v2.10; constants regen DEFERRED)_

Full details: `.planning/milestones/v2.9-ROADMAP.md`
Audit: `.planning/milestones/v2.9-MILESTONE-AUDIT.md` (status: tech_debt — 24/24 reqs satisfied; 12 PASS + 12 PASS-WITH-DEFERRAL; 8 v2.10+ candidate todos filed)

</details>

### 🆕 v2.10 Test Reliability + A11y Compliance — PLANNING (framed 2026-05-12)

**Milestone Goal:** Restore Playwright suite parity-regen capability and reach WCAG 2.1 AA on the 2 axe-baselined routes by closing v2.9's HIGH/MEDIUM a11y + test-determinism deferrals. 3-item focused scope: (1) HIGH candidate-profile cascading race fix + parity-script constants regen; (2) MEDIUM A11Y axe cite-and-fix; (3) MEDIUM A11Y-01 PRODUCT-GAP cells (email-format / url-format / required-empty).

**Strategy: race-first, then a11y in parallel waves.** DETERM-04 (cascading race) is the unlock condition for parity-script regen — every verification gate in v2.10 benefits from a non-cascading suite. Once DETERM-04 is green, A11Y-04 (axe cite-and-fix) + A11Y-05/06 (email/url cells) + A11Y-07 (required-empty cell) are structurally independent and can run in parallel waves.

**Gating + parallelism map:**

```
Phase 79 (DETERM-04 + DETERM-05)
  │
  └─ DETERM-04 green unblocks Phases 80-82 (clean assertion runs)
        │
        ├── Phase 80 (A11Y-04 axe cite-and-fix)     ← parallel-eligible
        │
        ├── Phase 81 (A11Y-05 + A11Y-06 email + url) ← parallel-eligible
        │
        └── Phase 82 (A11Y-07 required-empty)        ← parallel-eligible
                                                      (embedded product decision)
```

- [ ] **Phase 79: Determinism Recovery (Cascading-Race Fix + Constants Regen)** — Fix the `candidate-profile.spec.ts:85-145` registration → set-password → ToU race (or restructure the test out of cascade-prone serial mode); regenerate parity-script constants from a clean 3-run cold-start baseline. Sequential REQs (DETERM-04 → DETERM-05). Unlock condition for Phases 80-82.
- [ ] **Phase 80: A11Y Axe Cite-and-Fix** — Resolve the 5 first-run WCAG 2.1 AA violations across `/results` + voter-detail-drawer (`aria-required-parent` × 4, `list` × 2, `button-name` × 1). Re-run axe smoke verifies 0 violations; per-rule regression assertions added.
- [ ] **Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format** — Schema + component + i18n additions to close the email-format (A11Y-05) and URL-format (A11Y-06) candidate-profile validation cells. Shared `customData.format` / `Question.subtype` dispatch decision picked at phase discussion time.
- [ ] **Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty** — Phase-discussion product decision (REJECT-with-error vs SOFT-WARN-ONLY) for empty-required save behavior; spec assertions reflect chosen mechanism. Closes A11Y-07.

## Phase Details

### Phase 79: Determinism Recovery (Cascading-Race Fix + Constants Regen)
**Goal**: The candidate-profile test surface stops cascade-skipping downstream tests, and the parity-script constants (47/15/33 anchor preserved through v2.9 Phases 75 → 76 → 77 → 78) are regenerated from a clean 3-run cold-start baseline that reflects the post-fix suite. After Phase 79, the v2.10 verification anchor (~63 PASS_LOCKED — 47 v2.9 anchor + ~16 cascade-unblocked tests) is committed and becomes the binding parity gate for all future phases.
**Depends on**: Nothing (first phase of v2.10; runs over the v2.9-close baseline at HEAD post-Phase-78). DETERM-04 is the unlock condition for DETERM-05 — DETERM-05 cannot capture a clean baseline until the race is resolved.
**Requirements**: DETERM-04, DETERM-05
**Success Criteria** (what must be TRUE):
  1. `tests/tests/specs/candidate/candidate-profile.spec.ts` runs to completion in cold-start mode without "did not run" cascade-skipping downstream tests in the same `serial` describe block — either the underlying frontend race (auth session propagation OR ToU hydration timing) is fixed OR the test is restructured to bypass the cascade-prone serial mode.
  2. Three consecutive `yarn test:e2e` cold-start runs show identical pass/fail sets across the full `auth-setup → candidate-app → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password` dependency chain.
  3. The parity-script constants reflect the post-DETERM-04 baseline (expected ~63 PASS_LOCKED — 47 v2.9 anchor + ~16 cascade-unblocked tests); regenerated constants committed via the v2.9 in-place path OR the archived `regen-constants.mjs` script.
  4. The regenerated baseline is wired as the v2.10 verification anchor for downstream Phases 80-82.
**Plans**: 4 plans
- [ ] 79-01-PLAN.md — DETERM-04 RCA: dual-hypothesis instrumentation (H1 auth session propagation + H2 ToU hydration timing); committed trace artifacts; RCA-FINDINGS.md verdict
- [ ] 79-02-PLAN.md — DETERM-04 fix: targeted frontend-race fix per RCA verdict; D-12 1-run cold-start smoke (run-0.json)
- [ ] 79-02F-PLAN.md — DETERM-04 fallback (contingent, XOR with 79-02): restructure registration into register-fresh-candidate.setup.ts setup project per D-03
- [ ] 79-03-PLAN.md — DETERM-05 3-run cold-start gate + SHA-256 identity + IMGPROXY audit + constants regen + atomic commit (long-running, ~3-4h unattended)

### Phase 80: A11Y Axe Cite-and-Fix
**Goal**: The 5 first-run WCAG 2.1 AA violations surfaced by the Phase 76 A11Y-03 axe smoke baseline are all resolved. After Phase 80, `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` reports 0 violations across all 6 baselined routes, and per-rule regression assertions guard against recurrence.
**Depends on**: Phase 79 (DETERM-04 green required for clean assertion runs — A11Y verification gates benefit from a non-cascading suite). Structurally independent of DETERM-05 constants regen.
**Requirements**: A11Y-04
**Success Criteria** (what must be TRUE):
  1. `aria-required-parent` × 4 violations resolved across `/results` + voter-detail-drawer (likely shared-component fix in entity-card / voter-list).
  2. `list` × 2 violations resolved (likely same shared-component fix as `aria-required-parent`).
  3. `button-name` × 1 violation on voter-detail-drawer resolved via `aria-label` (i18n-aware) on the drawer's icon-button.
  4. Re-run of the axe smoke reports 0 violations across all 6 routes (home + elections-selector + constituencies-selector + questions + results + voter-detail-drawer); per-rule regression assertions added to `tests/tests/specs/a11y/a11y-smoke.spec.ts`.
  5. Successor baseline artifact (or in-place update to `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md`) documents the 0-violation post-fix state.
**Plans**: TBD
**UI hint**: yes

### Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format
**Goal**: Candidate profile rejects malformed email AND malformed URL input via inline validation errors that mirror the existing URL-validation surface in `Input.svelte:286-296`. After Phase 81, the candidate profile route has end-to-end email + URL format-rejection coverage (schema + render-path + i18n + fixture + spec) that exercises validation paths reachable from real candidate-profile editable info questions.
**Depends on**: Phase 79 (DETERM-04 green required — A11Y-01 cells extend `candidate-profile-validation.spec.ts` which the cascade blocked). Structurally independent of Phase 80.
**Requirements**: A11Y-05, A11Y-06
**Success Criteria** (what must be TRUE):
  1. A candidate typing a bad email into an email-format info question sees an inline `components.input.error.invalidEmail` error AND the input value is preserved.
  2. A candidate typing a bad URL into a URL-format / social-link info question sees an inline `components.input.error.invalidUrl` error AND the input value is preserved.
  3. Schema dispatch decision (likely `customData.format?: 'email' | 'url' | 'tel' | ...` enum on `CustomData.Question`, OR restored `Question.subtype` field — phase-discussion-time pick) covers both email + URL paths via a single mechanism; `INPUT_TYPES` in `QuestionInput.svelte` adds the `'email'` branch + the URL dispatch becomes reachable.
  4. e2e fixture extended at `packages/dev-seed/src/templates/e2e.ts` with 1 email-format info question (sort 22) + 1 URL dispatch (sort 21 promoted OR new sort 23) + Alpha answer cells.
  5. `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` extended with A11Y-01 cell 5 (email) + cell 6 (URL) assertions; per-plan smoke PASS × 3 in isolation; Phase 76 P01 cells (image-type / image-size / name-too-long) continue to pass.
**Plans**: TBD
**UI hint**: yes

### Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty
**Goal**: Candidate profile required-empty save behavior is decided product-side and enforced consistently across the save path + the spec assertion. Phase 82 surfaces the embedded product decision at discuss-phase, lands the chosen implementation (REJECT-with-inline-error OR SOFT-WARN-ONLY-confirmed), and closes A11Y-01 cell 4.
**Depends on**: Phase 79 (DETERM-04 green required — same `candidate-profile-validation.spec.ts` surface as Phase 81). Structurally independent of Phases 80 + 81.
**Requirements**: A11Y-07
**Success Criteria** (what must be TRUE):
  1. Product decision recorded at phase discussion time: empty-required save REJECTED with inline error OR SOFT-WARN-ONLY (badge + submit-button gating remains the only enforcement).
  2. If REJECT: save-path validation lands in `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:125-143`; `Input.svelte` emits `components.input.error.required` (or `tooShort`) on submit-time validation failure; `required` i18n key added to all 4 locales' `input.error` blocks. If SOFT-WARN-ONLY: cell closes as PRODUCT-CONFIRMED — existing badge + submit-button gating documented as the enforcement (no code changes).
  3. A11Y-01 cell 4 added to `candidate-profile-validation.spec.ts`: empty input → click submit → assert chosen behavior (error UI rendered + value preserved IF REJECT; submit-button disabled + no error UI IF SOFT-WARN).
  4. Per-plan smoke PASS × 3 in isolation; existing Phase 76 P01 cells + Phase 81 cells 5+6 continue to pass.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phase 79 (sequential REQs DETERM-04 → DETERM-05) → Phases 80, 81, 82 (parallel-eligible after Phase 79 DETERM-04 green).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 56. Generator Foundations & Plumbing | v2.5 | 10/10 | Complete | 2026-04-23 |
| 57. Latent-Factor Answer Model | v2.5 | 7/7 | Complete | 2026-04-23 |
| 58. Templates, CLI & Default Dataset | v2.5 | 10/10 | Complete | 2026-04-23 |
| 59. E2E Fixture Migration | v2.5 | 7/7 | Complete | 2026-04-24 |
| 60. Layout Runes Migration & Hydration Fix | v2.6 | 5/5 | Complete | 2026-04-24 |
| 61. Voter-App Question Flow | v2.6 | 3/3 | Complete | 2026-04-25 |
| 62. Results Page Consolidation | v2.6 | 3/3 | Complete | 2026-04-26 |
| 63. E2E Template Extension & Greening | v2.6 | 3/3 | Complete | 2026-04-27 |
| 64. Voter Results Reactivity Completion | v2.6 | 4/4 | Complete | 2026-04-28 |
| 65. Svelte 5 Audit Sweeps | v2.7 | 3/3 | Complete | 2026-04-29 |
| 66. Adapter Type Cleanup | v2.7 | 1/1 | Complete | 2026-04-29 |
| 67. Default Seed Alliances | v2.7 | 2/2 | Complete | 2026-04-30 |
| 68. Dev-Tooling Trio | v2.7 | 3/3 | Complete | 2026-05-08 |
| 69. Alliance Card Lane A | v2.8 | 2/2 | Complete | 2026-05-09 |
| 70. Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup | v2.8 | 5/5 | Complete | 2026-05-09 |
| 71. Frontend Strict-Typing Cleanup | v2.8 | 3/3 | Complete | 2026-05-09 |
| 72. Package Hygiene Trio | v2.8 | 3/3 | Complete | 2026-05-09 |
| 73. Determinism Baseline | v2.9 | 6/6 | Complete | 2026-05-11 |
| 74. High-Leverage E2E Coverage | v2.9 | 7/7 | Complete | 2026-05-11 |
| 75. Question-Rendering Specs | v2.9 | 3/3 | Complete | 2026-05-12 |
| 76. Profile + A11y | v2.9 | 4/4 | Complete | 2026-05-12 |
| 77. Settings Matrix + Question-Customization Gap-Fills | v2.9 | 5/5 | Complete | 2026-05-12 |
| 78. Cleanup Hygiene Phase | v2.9 | 7/7 | Complete | 2026-05-12 |
| 79. Determinism Recovery (Cascading-Race Fix + Constants Regen) | v2.10 | 0/4 | Not started | - |
| 80. A11Y Axe Cite-and-Fix | v2.10 | 0/TBD | Not started | - |
| 81. A11Y-01 PRODUCT-GAP Cells — Email + URL Format | v2.10 | 0/TBD | Not started | - |
| 82. A11Y-01 PRODUCT-GAP Cell — Required-Empty | v2.10 | 0/TBD | Not started | - |
