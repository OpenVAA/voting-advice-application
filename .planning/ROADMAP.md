# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- ✅ **v2.6 Svelte 5 Migration Cleanup** — Phases 60-64 (shipped 2026-04-28)
- ✅ **v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends** — Phases 65-68 (shipped 2026-05-08)
- ✅ **v2.8 Alliance Card + Frontend Hygiene Sweep** — Phases 69-72 (shipped 2026-05-10)
- ✅ **v2.9 E2E Coverage + Suite Determinism** — Phases 73-78 (shipped 2026-05-12)
- 🆕 **v2.10** — Not yet planned (candidate-profile cascading race fix + PRODUCT-GAP closures + sharable URLs / multi-tenant pair are leading candidates)

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
- [x] Phase 76: Profile + A11y (4/4 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; PRODUCT-GAP cells + axe cite-and-fix routed to v2.10+)_
- [x] Phase 77: Settings Matrix + Question-Customization Gap-Fills (5/5 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; 4 PRODUCT-GAP follow-ups; cold-start gate deferred)_
- [x] Phase 78: Cleanup Hygiene Phase (7/7 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; CLEAN-05 inherited candidate-profile race routed to v2.10+; constants regen DEFERRED)_

Full details: `.planning/milestones/v2.9-ROADMAP.md`
Audit: `.planning/milestones/v2.9-MILESTONE-AUDIT.md` (status: tech_debt — 24/24 reqs satisfied; 12 PASS + 12 PASS-WITH-DEFERRAL; 8 v2.10+ candidate todos filed)

</details>

### 🆕 Next milestone — Not yet planned

After v2.9 shipped, run `/gsd-new-milestone` to frame v2.10. Leading candidates captured from v2.9 close + earlier deferrals:

**v2.10+ candidates (HIGH severity first):**
- Candidate-profile cascading race fix (`candidate-profile.spec.ts:85-145` cascade-skips 43+ downstream tests; blocks parity-script regen at every gate)
- A11Y-01 PRODUCT-GAP cells (email-format / url-format / required-empty — schema + component + i18n work, ~3-5 plans)
- A11Y axe cite-and-fix (5 first-run WCAG 2.1 AA violations across 2 routes)
- SETTINGS-02 voter-authoring (voter app needs open-comment input + answerStore.setAnswer(info) support)
- SETTINGS-03 voter-required derivation (voter context needs requiredInfoQuestions / profileComplete symbols)
- FilterGroup OR-mode UI (EntityFilters.svelte AND/OR toggle — setter exists, no UI emits LOGIC_OP.Or)
- Voters-layout non-reactive topbar refactor
- Sharable URLs + multi-tenant pair (`results-url-refactor-followups` + `frontend-project-id-scoping`)
- Luxembourg + Danish VAA reconciliation (deltas unscoped)

## Progress

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
