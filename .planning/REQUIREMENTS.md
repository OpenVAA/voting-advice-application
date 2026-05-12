# Milestone v2.10: Test Reliability + A11y Compliance — Requirements

**Defined:** 2026-05-12
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

**Goal:** Restore Playwright suite parity-regen capability and reach WCAG 2.1 AA on the 2 axe-baselined routes by closing v2.9's HIGH/MEDIUM a11y + test-determinism deferrals — 3 carry-forwards from v2.9 close (candidate-profile cascading race + axe cite-and-fix + A11Y-01 PRODUCT-GAP cells closure).

**Strategy: race-first, then a11y.** The HIGH candidate-profile cascading race is the unlock condition for parity-script regen; A11Y axe cite-and-fix + A11Y-01 cells are independent of the race and can run in parallel waves once DETERM is green.

**Context sources:**

- `.planning/todos/pending/2026-05-12-candidate-profile-cascading-race.md` — cascading-race root-cause hypothesis + Phase 76/77/78 deferred-items lineage
- `.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md` — 5-violation per-rule baseline + cite-and-fix scope
- `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` — schema/component/i18n gap analysis per cell (email/url/required-empty)
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md` — per-route per-rule axe baseline (single source of truth)
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-CONTEXT.md` D-03 — PRODUCT-GAP cells rationale
- `.planning/milestones/v2.9-phases/76-profile-a11y/deferred-items.md` #2 — cascading-race recommendation
- `.planning/milestones/v2.9-phases/77-settings-matrix-question-customization-gap-fills/77-VERIFICATION.md` §"3-Run Determinism Record" — DEFERRED-WITH-RATIONALE lineage
- `.planning/milestones/v2.9-phases/78-cleanup-hygiene-phase/78-VERIFICATION.md` §"Out-of-Scope Items (Filed as Follow-up Todos)" — third-phase deferral lineage
- PROJECT.md "Current Milestone: v2.10 Test Reliability + A11y Compliance" — full goal + key context

---

## v2.10 Requirements

### DETERM — Determinism recovery (gating prerequisite for parity-regen capability)

- [ ] **DETERM-04**: The `candidate-profile.spec.ts:85-145` registration → set-password → ToU race is resolved. After the fix, `tests/tests/specs/candidate/candidate-profile.spec.ts` runs to completion in cold-start mode without `did not run` cascade-skipping the downstream tests in the same `serial` describe block. Either the underlying frontend race is fixed (auth session propagation OR ToU hydration timing — see todo §"Root-cause hypothesis") OR the test is restructured to bypass the cascade-prone serial mode (split the registration assertion into a setup project so downstream tests no longer depend on the redirect succeeding). Post-resolution: 3 consecutive `yarn test:e2e` cold-start runs show identical pass/fail sets across the candidate-profile + all dependent projects (`auth-setup → candidate-app → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password` chain).

- [ ] **DETERM-05**: The parity-script constants (47/15/33 PASS_LOCKED / SKIP / CASCADE-SKIP anchor preserved through Phases 75 → 76 → 77 → 78) are regenerated from a clean 3-run cold-start baseline. After DETERM-04 is green, capture 3 sequential cold-start full-suite runs and verify SHA-identical pass-sets across all 3; regen the parity-script constants via the v2.9 in-place path (or the archived `node .planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs <run-3.json>` script). Post-regen: the parity-script constants reflect the post-DETERM-04 baseline (expected ~63 PASS_LOCKED — 47 v2.9 anchor + ~16 cascade-unblocked tests); the regenerated baseline is committed and becomes the v2.10 verification anchor for all future phases.

### A11Y — Accessibility compliance (parallel with DETERM after gating)

- [ ] **A11Y-04**: The 5 first-run WCAG 2.1 AA violations surfaced by the Phase 76 A11Y-03 axe smoke baseline (`76-A11Y-BASELINE.md`) are resolved: `aria-required-parent` × 4 nodes (results × 2 + voter-detail-drawer × 2), `list` × 2 nodes (results × 1 + voter-detail-drawer × 1), `button-name` × 1 node (voter-detail-drawer). Per-rule fix: `aria-required-parent` + `list` resolved together via entity-card/voter-list DOM restructure (likely same shared component); `button-name` resolved via `aria-label` addition on the drawer's icon-button(s). Post-fix: `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` reports 0 violations across all 6 baselined routes; per-rule regression assertions added to `tests/tests/specs/a11y/a11y-smoke.spec.ts`; a successor baseline artifact (or in-place update to `76-A11Y-BASELINE.md`) documents the 0-violation post-fix state.

- [ ] **A11Y-05**: Candidate profile rejects malformed email input via inline validation error. Schema: `customData.format?: 'email' | 'url' | 'tel' | ...` enum added to `CustomData.Question` at `packages/app-shared/src/data/customData.type.ts`. Component: `'email'` branch added to `INPUT_TYPES` in `apps/frontend/src/lib/components/input/QuestionInput.svelte` (with `customData.format → Input.type` bridge); `Input.svelte` emits `components.input.error.invalidEmail` on bad input mirroring the existing URL-validation branch at `:286-296`. i18n: `invalidEmail` key added to all 4 locales (`en`/`fi`/`sv`/`da` `components.json` under `input.error`). Seed: 1 new info question with `custom_data.format='email'` added to `packages/dev-seed/src/templates/e2e.ts` (sort 22, next available after Phase 76 sort 21 social-link) + Alpha email answer cell. Spec: A11Y-01 cell 5 added to `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — type bad email → assert error UI + input value preserved.

- [ ] **A11Y-06**: Candidate profile rejects malformed URL input on social-link fields via inline validation error. Schema: `Question.subtype` (or equivalent `customData.format='url'` dispatch — decision deferred to phase discussion) restored or plumbed through so the existing `QuestionInput.svelte:65` `subtype === 'link'` branch + `Input.svelte:286-296` URL-validation branch become reachable from the profile route. Seed: 1 new info question with the chosen dispatch (subtype OR `customData.format='url'`) — the Phase 76 P01 `test-question-social-1` slot (sort 21) MAY be promoted to carry the dispatch once the schema lands. Spec: A11Y-01 cell 6 added — type bad URL → assert `components.input.error.invalidUrl` + input value preserved.

- [ ] **A11Y-07**: Candidate profile required-empty save behavior is decided and enforced consistently. **Phase-time product decision:** should empty-required save be REJECTED with an inline error (current behavior is soft — `required` attribute renders an sr-only "Required" badge + submit-button gating via `allRequiredFilled` at `profile/+page.svelte:94`, but the empty save is not blocked). If REJECT: add save-path validation in `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:125-143` AND `Input.svelte` emits `components.input.error.required` (or `tooShort`) on submit-time validation failure; `required` i18n key added to 4-locale `input.error` blocks. If SOFT-WARN-ONLY (no change): the cell is closed as PRODUCT-CONFIRMED with the existing badge + button-gating documented as the enforcement. Spec: A11Y-01 cell 4 added to `candidate-profile-validation.spec.ts` — empty input → click submit → assert chosen behavior (error UI rendered + value preserved IF REJECT; submit-button disabled + no error UI IF SOFT-WARN).

---

## Out of Scope (re-deferred to v2.11+)

| Feature | Reason |
|---------|--------|
| SETTINGS-02 voter-side `answer.info` authoring | PRODUCT-GAP — voter context exposes neither open-comment input nor `answerStore.setAnswer(info)` support; requires new voter-side UI affordance + answerStore schema work. Out of v2.10 scope (3-item focused milestone); routed to a future voter-app-features milestone. |
| SETTINGS-03 voter-side `customData.required` enforcement | PRODUCT-GAP — voter context exposes neither the `requiredInfoQuestions` derivation nor the `profileComplete` symbol the candidate context exposes at `candidateContext.svelte.ts:347-368`. Requires context-API symmetry work + voter-side gating UI. Same routing as SETTINGS-02. |
| FilterGroup OR-mode UI | PRODUCT-GAP — `FilterGroup` backend supports `LOGIC_OP.Or` setter but no `EntityFilters.svelte` UI emits it. Requires new toggle component + i18n. Routed to a future filter-features milestone. |
| (voters)/+layout.svelte non-reactive topbar / popup | Refactor mount-time `$appSettings` reads in `apps/frontend/src/routes/(voters)/+layout.svelte` topBarSettings/popupQueue.push to reactive — ~30-60 LOC. Routed to a future Svelte 5 reactivity hardening pass (the 3 SETTINGS-01 wave A cells that surface this are PASS-WITH-DEFERRAL; non-blocker). |
| Constituency filter UI PRODUCT-GAP | `buildParentFilters` doesn't dispatch a constituency filter shape today. LOW severity; routed to a future filter-features milestone alongside FilterGroup OR-mode. |
| Expander state-referenced-locally / results-layout missing slot | Already resolved in v2.8 Phase 70 via accept-with-rationale (`// svelte-ignore` + `// reason:` comments). Stale pending todos moved → done at v2.10 start. |

---

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DETERM-04   | Phase 79 | In Progress (RCA done @ Plan 01; fix pending @ Plan 02) |
| DETERM-05   | Phase 79 | Pending |
| A11Y-04     | Phase 80 | Pending |
| A11Y-05     | Phase 81 | Pending |
| A11Y-06     | Phase 81 | Pending |
| A11Y-07     | Phase 82 | Pending |

**Coverage:**
- v2.10 requirements: 6 total
- Mapped to phases: 6 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-12*
*Last updated: 2026-05-12 after v2.10 roadmap creation (4 phases, 6 REQs mapped 1:1)*
