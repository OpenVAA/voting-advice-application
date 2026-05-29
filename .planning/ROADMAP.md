# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- ✅ **v2.6 Svelte 5 Migration Cleanup** — Phases 60-64 (shipped 2026-04-28)
- ✅ **v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends** — Phases 65-68 (shipped 2026-05-08)
- ✅ **v2.8 Alliance Card + Frontend Hygiene Sweep** — Phases 69-72 (shipped 2026-05-10)
- ✅ **v2.9 E2E Coverage + Suite Determinism** — Phases 73-78 (shipped 2026-05-12)
- 🆕 **v2.10 Test Reliability + A11y Compliance + All-Green Suite** — Phases 79-87 (in progress; framed 2026-05-12, extended 2026-05-13 to absorb the All-Green Suite work — Phases 84-87 added 2026-05-13 post-Phase-83-close)

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

### 🆕 v2.10 Test Reliability + A11y Compliance + All-Green Suite — SHIPPABLE (closed 2026-05-21 — Phase 87 PASSED-WITH-DEFERRAL; v2.10 ship anchor `bc1c94957b…`; audit-milestone verdict tech_debt operator-accepted; operator next step: `/gsd-complete-milestone v2.10`)

**Milestone Goal (extended 2026-05-13):** Restore Playwright suite parity-regen capability, reach WCAG 2.1 AA on the 2 axe-baselined routes, AND reach an All-Green deterministic e2e suite with no DATA_RACE flakes, no CASCADE skips, no FAILURE-CLASS deterministic failures. 8-item scope: (1) HIGH candidate-profile cascading race fix + parity-script constants regen; (2) MEDIUM A11Y axe cite-and-fix; (3) MEDIUM A11Y-01 PRODUCT-GAP cells (email-format / url-format / required-empty); (4) MEDIUM image-upload cascade + (5) MEDIUM voter-app flakes; (6) Imgproxy structural decoupling (DATA_RACE 15 → 3); (7) Variant-project cascade RCA + fix (CASCADE 47 → 0); (8) Voter-app FAILURE-CLASS cleanup (~10 → 0). Final v2.10-ship anchor captured in Phase 87.

**Strategy: race-first → a11y parallel → test-reliability gap closure → All-Green Suite expansion.** Phases 79-83 (now COMPLETE) restored parity-regen + closed v2.9-deferred a11y + test-reliability follow-ups; new anchor at SHA `d6bfeebdb0…` (94 PASS_LOCKED + 15 DATA_RACE + 47 CASCADE). Phases 84-87 close the remaining non-green pools by (a) decoupling non-image tests from imgproxy (Phase 84 unlock condition for cleaner regens downstream), (b) diagnosing + fixing 9 variant-project cascade chains in parallel with (c) cleaning up the ~10 deterministic voter-app fails, then (d) capturing the final all-green ship anchor in Phase 87.

**Gating + parallelism map:**

```
Phase 79 (DETERM-04 + DETERM-05) ✓ COMPLETE
  │
  └─ DETERM-04 green unblocked Phases 80, 81, 82, 83
        │
        ├── Phase 80 (A11Y-04 axe cite-and-fix)             ✓ COMPLETE
        ├── Phase 81 (A11Y-05 + A11Y-06 email + url)        ✓ COMPLETE
        ├── Phase 82 (A11Y-07 required-empty)               ✓ COMPLETE
        └── Phase 83 (DETERM-06 image-upload + DETERM-07)   ✓ COMPLETE
                                                              (anchor: d6bfeebdb0…
                                                               94 PASS_LOCKED + 15 DATA_RACE + 47 CASCADE)
                  │
                  └─ Phase 83 anchor unlocks Phases 84-87 (All-Green Suite extension)
                        │
                        └── Phase 84 (DETERM-08 + DETERM-09: imgproxy structural decoupling)
                              │                              (DATA_RACE 15 → 3; sequential precondition)
                              │
                              ├── Phase 85 (DETERM-10 + DETERM-11: variant-cascade RCA + close)  ← parallel-eligible
                              │                              (CASCADE 47 → 0)
                              │
                              └── Phase 86 (DETERM-12/13/14: voter-app FAILURE-CLASS cleanup)    ← parallel-eligible
                                                              (FAILURE-CLASS ~10 → 0)
                                                                          │
                                                                          └── Phase 87 (DETERM-15: final all-green anchor)
                                                                                (sequential after 85 + 86;
                                                                                 fresh 3-run cold-start gate;
                                                                                 milestone-ship anchor)
```

- [x] **Phase 79: Determinism Recovery (Cascading-Race Fix + Constants Regen)** — Fix the `candidate-profile.spec.ts:85-145` registration → set-password → ToU race (or restructure the test out of cascade-prone serial mode); regenerate parity-script constants from a clean 3-run cold-start baseline. Sequential REQs (DETERM-04 → DETERM-05). Unlock condition for Phases 80-83. (completed 2026-05-13, passed-with-deferral; 80/15/57 anchor locked at SHA `ff0334f856…`)
- [x] **Phase 80: A11Y Axe Cite-and-Fix** — Resolve the 5 first-run WCAG 2.1 AA violations across `/results` + voter-detail-drawer (`aria-required-parent` × 4, `list` × 2, `button-name` × 1). Re-run axe smoke verifies 0 violations; per-rule regression assertions added. (completed 2026-05-13, GREEN; 5/5 SCs PASS; A11Y-04 closed; Phase 79 v2.10 anchor SHA `ff0334f856…` preserved)
- [x] **Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format** — Schema + component + i18n additions to close the email-format (A11Y-05) and URL-format (A11Y-06) candidate-profile validation cells. Shared `customData.format` / `Question.subtype` dispatch decision picked at phase discussion time. (completed 2026-05-13)
- [x] **Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty** — Phase-discussion product decision (REJECT-with-error vs SOFT-WARN-ONLY) for empty-required save behavior; spec assertions reflect chosen mechanism. Closes A11Y-07. (completed 2026-05-13)
- [x] **Phase 83: Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) + v2.10 Milestone-Close Hygiene** — Close DETERM-06 (image-upload CAND-03 cascade resolution; mitigations from todo §"Recommended approach": selector-drift fix / pre-filechooser delay / imgproxy re-enable) + DETERM-07 (voter-matching + voter-detail flakes stabilization to deterministic PASS or FAILURE-CLASS with rationale) + 3 Phase 82 advisory follow-ups folded 2026-05-13 (WR-01 variant-hidden-required hygiene comment; IN-01 docstring count fix; IN-02 Phase 81 deferred +2 PASS_LOCKED backfill for A11Y-05+A11Y-06). May trigger a fresh constants regen if PASS_LOCKED shifts. (completed 2026-05-13)
- [x] **Phase 84: Imgproxy Decoupling** — Decouple non-image tests from the imgproxy infrastructure flake. Gate portrait rendering behind a test-fixture flag (or below-fold lazy-load) so `re-auth.setup.ts` + 11 `candidate-app-settings` pages stop awaiting imgproxy on initial paint. Parallel lever: tune `apps/supabase/supabase/config.toml [storage.image_transformation]` (worker count, timeout, connection pool). Closes the structural DATA_RACE pool from 15 → 3 (only CAND-03 image-upload + CAND-12 readback + CAND-03 readback remain). Unlock condition for Phase 85 + Phase 86. (completed 2026-05-14)
- [x] **Phase 85: Variant-Project Cascade RCA & Fix** — Investigate + close the 47 CASCADE entries across 9 `data-setup-*` projects + 9 paired `variant-*` spec projects. Phase entrypoint is a single RCA plan to identify the shared root cause (likely yarn-arg-forwarding LANDMINE-9-style or setup-overlay-ordering); follow-up plans implement targeted fixes. Closes CASCADE pool from 47 → 0 (or near 0). Parallel-eligible with Phase 86 after Phase 84 lands. (completed 2026-05-14)
- [x] **Phase 86: Voter-App FAILURE-CLASS Cleanup** — Investigate + resolve the ~10 deterministic voter-app failures currently in the FAILURE-CLASS narrative block. Likely 3 plans grouped by surface: (1) popups + hydration cluster, (2) filter + feedback cluster, (3) visibility + edge-case cluster. Closes FAILURE-CLASS pool ~10 → 0. Parallel-eligible with Phase 85 after Phase 84 lands. (completed 2026-05-14)
- [x] **Phase 87: v2.10 All-Green Milestone-Close Anchor** — Path A verbal-accept v2.10 ship-close anchor pin (operator's 2026-05-21 verbal verification at commit 9ad802ec0 as audit basis); operator-amended D-05 carried forward from 86.3 D-06 RE-PLAN recommendation. Final anchor: `bc1c94957b8dcadfd79ff7464b39db42685387ae27dc24d69f417a32cfd03cee` (114 PASS_LOCKED + 3 DATA_RACE + 36 CASCADE + 4 SKIPPED = 157 tracked; honest post-86.3-v2 count below the original ROADMAP target ~150-160). /gsd-audit-milestone v2.10 verdict: tech_debt operator-accepted. v2.10 SHIPPABLE — operator next step: `/gsd-complete-milestone v2.10`. (completed 2026-05-21, PASSED-WITH-DEFERRAL)

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

- [x] 79-01-PLAN.md — DETERM-04 RCA: dual-hypothesis instrumentation (H1 auth session propagation + H2 ToU hydration timing); committed trace artifacts; RCA-FINDINGS.md verdict
- [x] 79-02-PLAN.md — DETERM-04 fix: targeted frontend-race fix per RCA verdict; D-12 1-run cold-start smoke (run-0.json)
- [x] 79-02F-PLAN.md — DETERM-04 fallback (contingent, XOR with 79-02): restructure registration into register-fresh-candidate.setup.ts setup project per D-03
- [x] 79-03-PLAN.md — DETERM-05 3-run cold-start gate + SHA-256 identity + IMGPROXY audit + constants regen + atomic commit (long-running, ~3-4h unattended)

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

**Plans**: 1 plan

- [x] 80-01-PLAN.md — A11Y-04 cite-and-fix: NavGroup/NavItem context-detect + Tabs.svelte role=tablist (Rule 4 deviation root-cause fix) + Button floating-icon aria-label + Drawer i18n + a11y-smoke per-rule + global-zero regression gate + post-fix 80-A11Y-BASELINE.md (0 violations × 6 routes) + 3-run cold-start parity gate (PASS × 4) (completed 2026-05-13; 5/5 SCs GREEN; Phase 79 v2.10 anchor preserved)

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

**Plans**: 1 plan

- [x] 81-01-PLAN.md — Schema dispatch (`Question.subtype` reuse) + Input.svelte email validation branch + `EMAIL_REGEX` const + Input.type.ts `email` variant + QuestionInput.svelte dispatch line + i18n `invalidEmail` key across 14 locale files (7 Paraglide + 7 legacy translations) + TranslationKey regen + e2e.ts sort-21 retrofit (subtype:'link') + new sort-23 email row + Alpha answer cells + plain-string migration for sort-21 + candidate-profile-validation.spec.ts `TEXT_CELLS` refactor with `kind` discriminant + 2 new cells (5 email + 6 URL) + 3-run cold-start determinism gate + parity-script self-identity smoke + 81-VERIFICATION.md

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

**Plans**: 1 plan

- [x] 82-01-PLAN.md — TIGHTEN-SOFT: wire allRequiredFilled into canSubmit + sort-24 fixture row + Alpha LocalizedString answer + A11Y-01 cell 4 spec + docstring update + 3-run cold-start determinism gate + additive +1 PASS_LOCKED constants regen

**UI hint**: yes (SKIPPED per D-15 — structural save-gate phase with no visual redesign, per Phase 76 / Phase 80 / Phase 81 precedent in feedback_skip_ui_spec_for_a11y_only_phases.md memory)

### Phase 83: Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) + v2.10 Milestone-Close Hygiene

**Goal**: Close the 2 test-reliability surfaces that Phase 79's DETERM-04 fix exposed AND clear the 3 advisory follow-ups from Phase 82's code review (folded 2026-05-13 post-Phase-82-close as v2.10 milestone-close hygiene). After Phase 83, (1) `should upload a profile image (CAND-03)` no longer cascade-skips its 5 downstream tests in `candidate-profile.spec.ts`'s serial describe block; (2) the 2 voter-app intermittent flakes (`voter-matching > should show worst match candidate as last result` + `voter-detail > should open party detail drawer`) are stabilized to deterministic PASS or moved to FAILURE-CLASS with rationale; AND (3) the 3 Phase 82 advisory items are resolved (cross-spec hygiene comment in `variant-hidden-required.ts`, docstring count fix in `candidate-profile-validation.spec.ts`, Phase 81 deferred +2 PASS_LOCKED backfill of A11Y-05+A11Y-06 into `tests/scripts/diff-playwright-reports.ts`). The v2.10 verification anchor at SHA `ff0334f856…` is preserved unless the closures shift PASS_LOCKED (in which case Phase 83 ends with a fresh constants regen via the archived `regen-constants.mjs` script).
**Depends on**: Phase 79 (DETERM-04 green required — same `candidate-profile.spec.ts` surface as Phase 81; cold-start gates need a non-cascading registration path). Structurally independent of Phases 80 + 81 + 82. The Phase 82 advisory follow-ups (folded 2026-05-13) require Phase 82 closed — which it is at HEAD `0fa3dbb2e`.
**Requirements**: DETERM-06, DETERM-07
**Success Criteria** (what must be TRUE):

  1. DETERM-06 closed: `tests/tests/specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03)` runs to completion in cold-start without `waitForEvent('filechooser')` TIMEOUT; 5 downstream tests in the serial describe block (`A11Y-02` × 3 + `CAND-12` × 1 + `CAND-03` × 1) cascade-skip count drops to 0. Mitigation picked at discuss-phase from the 3 candidates in the todo (selector-drift fix / pre-filechooser delay / imgproxy re-enable).
  2. DETERM-07 closed: 3 consecutive cold-start runs SHA-identical on the FIRST try (no D-09 instability protocol required). Both flake surfaces are either (a) deterministically passing, (b) deterministically skipped with `test.skip()` + rationale comment, or (c) moved to FAILURE-CLASS in `regen-constants.mjs` with explicit Phase 75 QSPEC-01/02-style rationale.
  3. If either closure shifts PASS_LOCKED, fresh constants regen runs via `node .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` (against a Phase-83-captured `run-3.json`) and updates `tests/scripts/diff-playwright-reports.ts`. Otherwise: the v2.10 anchor at SHA `ff0334f856…` is preserved verbatim.
  4. The 2 follow-up todos (`2026-05-13-candidate-profile-image-upload-cascade.md` + `2026-05-13-voter-matching-detail-flakes.md`) move to `.planning/todos/done/` at phase close.
  5. **Phase 82 advisory follow-up WR-01 closed:** `tests/tests/setup/templates/variant-hidden-required.ts` gets a maintainer-facing inline comment (option-(a) hygiene fix per Phase 82 REVIEW.md §WR-01) noting that Phase 82 added `test-question-required-empty-1` to the base seed; the SETTINGS-03 overlay must NOT delete Alpha's `required-empty-1` answer without first updating `candidate-required-info.spec.ts` (or the InfoBadge count assertion at `apps/frontend/src/routes/candidate/(protected)/+page.svelte:121` will silently shift). Concrete location: after `variant-hidden-required.ts:156`, before the `return row;` catch-all in the candidate-row mapper.
  6. **Phase 82 advisory follow-up IN-01 closed:** `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` docstring count corrected — line 6 "Covers 3 reliably-renderable cells" → "Covers 6 reliably-renderable cells (3 original + 2 Phase 81 lifts + 1 Phase 82 standalone)"; line 51 "all 3 test titles are PREFIXED `A11Y-01 `" → "all 6 test titles". Purely cosmetic; updates the lead-in count to match post-Phase-81+82 reality.
  7. **Phase 82 advisory follow-up IN-02 closed (v2.10 milestone-close binding):** Phase 81's deferred +2 PASS_LOCKED entries (A11Y-05 email-format + A11Y-06 url-format from `tests/tests/specs/candidate/candidate-profile-validation.spec.ts`) are backfilled into the `PASS_LOCKED_TESTS` array at `tests/scripts/diff-playwright-reports.ts:111-193` in alphabetical position, jsdoc count updated 81 → 83 (or → 83 + N if DETERM-06/07 also shift PASS_LOCKED). Verified by a fresh 3-run cold-start at phase close (folded into SC #3's regen if PASS_LOCKED otherwise shifts; otherwise standalone additive regen).

**Plans**: 1 plan

- [x] 83-01-PLAN.md — DETERM-06 image-upload cascade selector-drift fix (D-01a ladder) + DETERM-07a/b hydration-completeness guards (worst-match + party-drawer) + WR-01 variant overlay extend + IN-01 docstring count fix + IN-02 +2 PASS_LOCKED backfill + 3-run cold-start gate + atomic constants regen for v2.10 milestone-close anchor

**UI hint**: no

### Phase 84: Imgproxy Decoupling

**Goal**: Decouple non-image tests from the Supabase imgproxy infrastructure flake so the DATA_RACE pool shrinks from 15 to ≤3 (only CAND-03 image-upload + CAND-12 image-readback + CAND-03 image-rendered-on-page). After Phase 84, `re-auth.setup.ts` and 11 `candidate-app-settings` pages no longer synchronously await imgproxy on initial paint; the dual-project `re-authenticate as candidate` entry vanishes from DATA_RACE; and the post-login candidate-home + settings render paths are determined by test-controllable fixtures rather than image-transformation infrastructure. The parity-script jsdoc + DATA_RACE_TESTS array reflect the new pool size; the Phase 73 D-09 binding contract is renegotiated (pool size constant updated from 15 → 3 at this phase; new structural binding is "image-rendering tests only").
**Depends on**: Phase 83 ✓ COMPLETE (v2.10-close anchor at SHA `d6bfeebdb0…` is the binding gate Phase 84 measures against).
**Requirements**: DETERM-08, DETERM-09
**Success Criteria** (what must be TRUE):

  1. DETERM-08 closed: Portrait rendering on candidate-home + candidate-app-settings pages is gated behind a test-fixture mechanism (e.g., `?skipImages=1` query param, settings flag, or below-fold IntersectionObserver lazy-load). Post-login pages do NOT block on imgproxy fetches on initial paint.
  2. DETERM-09 closed: `apps/supabase/supabase/config.toml [storage.image_transformation]` config tuned (worker count / timeout / connection pool) for cold-start resilience. Documented rationale per knob.
  3. DATA_RACE pool: 15 → ≤3. Surviving entries are EXACTLY the tests that explicitly load/persist images (CAND-03 image-upload + CAND-12 readback + CAND-03 image-rendered-on-page). The dual-project `re-authenticate as candidate` entries (auth-setup + re-auth-setup) are removed.
  4. Phase 73 D-09 structural binding renegotiated: IMGPROXY_TIED_TITLES list shrinks to only the 3 image-rendering test titles; `regen-constants.mjs` partition contract updated to match.
  5. Fresh 3-run cold-start gate SHA-identical FIRST attempt; new anchor reflects the shrunken DATA_RACE pool (≥+12 net PASS_LOCKED expected from the 11 candidate-app-settings + 1 dual-project re-auth promotions).

**Plans**: 2 plans

- [x] 84-01-PLAN.md — DETERM-08 project-graph repoint (re-auth-setup → candidate-app) + 1-run cold-start smoke (D-03 gate) + IMGPROXY_TIED_TITLES shrink 14 → 3 + 3-run cold-start gate (D-08) + atomic constants regen (D-06 exception) for new Phase 84 anchor
- [x] 84-02-PLAN.md — DETERM-09 contingent fallback (atomic 4-knob [storage.image_transformation] tune per D-04; only executes if Plan 01 Task 3 escalates with DATA_RACE > 3)

**UI hint**: no

### Phase 85: Variant-Project Cascade RCA & Fix

**Goal**: Diagnose + close the 47 CASCADE entries spread across 9 `data-setup-*` projects (1e-Nc, allowopen, constituency, hidden-required, low-minimum-answers, multi-election, Ne-Nc, results-sections, startfromcg) + their paired 9 `variant-*` spec projects. After Phase 85, all 9 variant data-setup chains run to completion and their dependent variant-spec projects either pass or surface deterministic failures that are addressable by Phase 86's voter-FAILURE-CLASS path. The CASCADE pool shrinks from 47 → 0 (or near 0 — any residual entries are explicitly documented as v2.11+ deferrals with rationale).
**Depends on**: Phase 84 (cleaner DATA_RACE baseline so the variant cascades are diagnosed against a non-imgproxy-flaky suite). Parallel-eligible with Phase 86.
**Requirements**: DETERM-10, DETERM-11
**Success Criteria** (what must be TRUE):

  1. DETERM-10 closed: RCA plan identifies the shared root cause of the 9 data-setup chain failures (likely yarn-arg-forwarding LANDMINE-9-style, fixture-overlay-ordering, or shared bootstrap state). RCA-FINDINGS.md committed with diagnostic evidence (per-project run logs + the convergent failure pattern).
  2. DETERM-11 closed: Targeted fix(es) implemented for the identified root cause. All 9 `data-setup-*` projects run to completion in cold-start.
  3. CASCADE pool: 47 → ≤5 (residual entries documented as v2.11+ deferrals if any remain).
  4. Variant spec runs surface their own deterministic verdicts (pass / fail) — any new failures join the FAILURE-CLASS cohort for Phase 86 attention.
  5. Fresh 3-run cold-start gate SHA-identical FIRST attempt; new anchor reflects the CASCADE shrinkage.

**Plans**: 2 plans

- [x] 85-01-PLAN.md — DETERM-10 RCA: chain-head failure capture (run-{1,2,3}.json walk) + H1 architectural disproof + 47-entry CASCADE classification + 85-RCA-FINDINGS.md verdict with Path A/B/C analysis (Path B recommended per RESEARCH)
- [x] 85-02-PLAN.md — DETERM-11 Path B structural decouple: 1-line playwright.config.ts:236 edit (remove voter-app-popups from data-setup-multi-election deps) + 1-run cold-start smoke + 3-run cold-start gate + atomic constants regen (Phase 79 D-10 bundle) for v2.10 All-Green Suite anchor

**UI hint**: no

### Phase 86: Voter-App FAILURE-CLASS Cleanup

**Goal**: Investigate + resolve the ~10 deterministic voter-app failures currently in the FAILURE-CLASS narrative block at `tests/scripts/diff-playwright-reports.ts:87-101`. Items grouped by surface cluster: (1) popups + hydration (voter-app-popups dismissal-after-reload, voter-popup-hydration full-page-load), (2) navigation + redirects (voter-navigation results-CTA threshold, voter-not-located-redirect /results deeplink), (3) question-rendering (voter-question-rendering boolean + categorical / QSPEC-01/02), (4) filter + feedback (voter-results filter-toggle no-effect-update-depth, voter-feedback-persistence), (5) visibility + edge-cases (voter-visibility-required SETTINGS-03 hidden absent, voter-detail case-d both-missing). After Phase 86, all are deterministically passing OR explicitly demoted via `test.skip()` with rationale OR documented as v2.11+ product-decision deferrals.
**Depends on**: Phase 84 (cleaner DATA_RACE baseline). Parallel-eligible with Phase 85.
**Requirements**: DETERM-12, DETERM-13, DETERM-14
**Success Criteria** (what must be TRUE):

  1. DETERM-12 closed: Popups + hydration cluster (~2 tests) deterministically pass OR `test.skip()`+rationale.
  2. DETERM-13 closed: Filter + feedback cluster (~3 tests) deterministically pass OR `test.skip()`+rationale.
  3. DETERM-14 closed: Visibility + edge-cases cluster (~3 tests) + navigation/redirects (~2 tests) + question-rendering (~2 tests) deterministically pass OR `test.skip()`+rationale.
  4. FAILURE-CLASS narrative block at `diff-playwright-reports.ts:87-101` shrinks to ≤2 entries (residual = explicit v2.11+ deferrals); the structural "FAILURE-CLASS" classification is renegotiated.
  5. Fresh 3-run cold-start gate SHA-identical FIRST attempt; new anchor reflects ~+10 net PASS_LOCKED.

**Plans**: 4 plans

- [x] 86-01-PLAN.md — DETERM-12 popups + hydration + navigation/redirects cluster (5 tests: voter-popups dismissal, voter-popup-hydration LAYOUT-03, voter-navigation results-CTA, voter-not-located-redirect chain-head, voter-detail party-drawer boundary harden)
- [x] 86-02-PLAN.md — DETERM-13 filter + feedback cluster (2 tests + contained 3-component reactivity audit)
- [x] 86-03-PLAN.md — DETERM-14 visibility + edge-cases + question-rendering cluster (4 tests: QSPEC-01/02, voter-visibility-required project-config exclusion, voter-detail case (d))
- [x] 86-04-PLAN.md — Close: 3-run cold-start gate (ALMOST-STRICT — party-drawer boundary flake; run-3 canonical) + anchor regen at SHA `9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9` (113 PASS_LOCKED / 3 DATA_RACE / 40 CASCADE / 2 SKIPPED) + SKIPPED_TESTS const introduced + FAILURE-CLASS narrative shrunk + STATE/ROADMAP update + atomic close commit (completed 2026-05-14)

**UI hint**: maybe (popup + hydration cluster may surface UI work)

### Phase 86.3: Implement skipped tests — close 8 source-skipped voter-app/candidate-app/variant-project tests (SETTINGS-01 wave A/B + E2E-03 + LAYOUT-03 regression gate + QSPEC-01/02) so Phase 87 anchor captures maximum coverage (INSERTED)

**Goal:** Close all 8 currently always-skipped (`test.skip(true, '…')`) voter-app / candidate-app / variant-project tests inherited from Phases 75 / 77 / 86 / 86.1 so the Phase 87 final v2.10-ship anchor captures maximum coverage. Cells: #1/#2/#3 SETTINGS-01 wave A `(voters)/+layout.svelte` Svelte 5 reactivity (production-code fix per D-10); #4 SETTINGS-01 wave B constituency-filter PRODUCT-GAP (Path-A/B/C operator decision); #5 E2E-03 voter-feedback-persistence H2/H3 trace-driven RCA; #6 LAYOUT-03 voter-popup-hydration fixture pre-hook; #7+#8 QSPEC-01/02 walkToQuestion helper-resilience fix. Per-cell 1h cap (D-08) + skip-fallback (D-02) protocol; final 3-run cold-start SHA-identity gate satisfies Phase 87 Task 0 pre-gate (CASCADE ≤ 5).
**Requirements**: SETTINGS-01, E2E-03, LAYOUT-03, QSPEC-01, QSPEC-02 (no new REQ-IDs)
**Depends on:** Phase 86.2 (sequential predecessor — helper layer source; 86 → 86.1 → 86.2 → 86.3 → 87)
**Plans:** 5/5 plans complete

Plans:

- [x] 86.3-01-PLAN.md — SETTINGS-01 wave A — fix `(voters)/+layout.svelte` reactivity for cells #1/#2/#3 (shared root cause; one atomic production-code commit) + per-cell smokes (3 tasks; Wave 1) — FIX-PASS on all 3 cells (commit 0312ae4af)
- [x] 86.3-02-PLAN.md — SETTINGS-01 wave B — cell #4 constituency-filter RCA + Path-A/B/C `checkpoint:decision` (Task 0 1h RCA + Task 1 operator decision + Task 2 execution; Wave 1) — original disposition: SKIP-FALLBACK Path-C. **SUPERSEDED 2026-05-20:** operator decided WONT-IMPLEMENT (constituency is navigation/scope, not a filter). Spec block deleted; v2.11+ todo moved to done/ with WONT-FIX close note; SKIPPED_TESTS entry removed.
- [x] 86.3-03-PLAN.md — E2E-03 cell #5 voter-feedback-persistence — trace-driven H2/H3 disambiguation (3 tasks; Wave 1) — SKIP-FALLBACK (verdict: NEITHER — upstream `answeredVoterPage` fixture race blocks H2/H3 disambiguation; commits cc8b609b9 + d261fd07c + Task 3 atomic). v2.11+ todo `2026-05-16-voter-feedback-persistence-second-pass.md` augmented with REVISED next-action ordering. ModalContainer.svelte UNCHANGED.
- [x] 86.3-04-PLAN.md — LAYOUT-03 cell #6 voter-popup-hydration — Path 2 `page.context().addInitScript` 1-line swap OR Path 1 fixture `storageState` OR SKIP-FALLBACK (2 tasks; Wave 1) — SKIP-FALLBACK (Path 2 verified-applied + empirically disproved; /results stuck at Loading… — same upstream loader race as 86.3-03 /questions; commits 1bc691aa3 + Task 2 atomic). Path 2 swap LEFT IN PLACE as evidence-of-attempt. v2.11+ todo `2026-05-16-voter-popup-hydration-layout-03-deeplink.md` augmented 44 → 72 lines with Phase 86.3-04 attempt section. Production loader (`(voters)/(located)/+layout.ts`) UNCHANGED per D-10 STRICT gate.
- [x] 86.3-05-PLAN.md — QSPEC-01/02 cells #7+#8 walkToQuestion helper-resilience fix + 3-run cold-start SHA-identity gate + SKIPPED_TESTS const update + 86.3-SUMMARY (8-cell disposition table + D-06 Phase 87 disposition recommendation) + STATE/ROADMAP close (5 tasks; Wave 2 — depends on 86.3-01..04) — SKIP-FALLBACK on cells #7+#8 (walkToQuestion helper-resilience fix LANDED but EMPIRICALLY INSUFFICIENT — same upstream voter-app cold-deeplink loader race as cells #5/#6; helper fix LEFT IN PLACE as evidence-of-attempt in voterNavigation.ts:308-329). 3-run gate ALMOST-STRICT per Phase 86 D-06 precedent (8 diverging cells share ONE boundary-class cascade ancestor). Anchor SHA `bc1c94957b8dcadfd79ff7464b39db42685387ae27dc24d69f417a32cfd03cee`. SKIPPED_TESTS const 2 → 5 entries. PHASE 86.3 ANCHOR jsdoc added to diff-playwright-reports.ts. D-06 Phase 87 disposition recommendation: RE-PLAN.

### Phase 86.2: E2E suite refactor pass — extract helpers, dedup assertions, propagate Phase 86.1 post-fix patterns across all relevant specs (INSERTED)

**Goal:** Extract 6 reusable helpers from the 15 Phase 86.1 post-fix annotations into `tests/tests/helpers/` and propagate them across the rest of the Playwright suite so Phase 86.3 + subsequent maintenance can re-use the patterns instead of re-inventing them inline. Verified by a 3-run cold-start SHA-identity gate against the post-86.2 codebase (no test outcomes change — helper-only refactor).
**Requirements**: none (introduces no new REQ-IDs; supports DETERM-15 Phase 87 final anchor downstream)
**Depends on:** Phase 86 (predecessor sequential chain: 86 → 86.1 → 86.2 → 86.3 → 87)
**Plans:** 3/3 plans complete

Plans:

- [x] 86.2-01-PLAN.md — Extract 6 helpers (settleNetworkIdle, gotoAndSettle, expectLandedOn, clickAndRaceSettle, iterateSelectOptions, assertDbRowCount, walkVoterIteration) into `tests/tests/helpers/` + refactor 4 anchor spec files + voter.fixture.ts internal refactor (3 tasks)
- [x] 86.2-02-PLAN.md — Propagate ~33 site replacements across ~10 spec files (helper #2 ×27 + helper #1 ×6) + per-spec smokes + disposition table + full-suite cascade-victim audit (3 tasks)
- [x] 86.2-03-PLAN.md — 3-run cold-start SHA-identity gate + regen-output + SUMMARY + STATE/ROADMAP close (4 tasks; Task 1 = non-autonomous operator decision on anchor-mode Option B/C/D per RESEARCH Q1)

### Phase 86.1: Pre-Phase-87 Convergence Sweep — drive v2.10 e2e suite to all-green-or-explicit-deferral so Phase 87's CASCADE ≤ 5 pre-gate fires cleanly (INSERTED)

**Goal:** Drive the v2.10 e2e suite from its current post-85-04 state (`110 PASS · 13 FAIL · 6 SOURCE-SKIP · 36 CASCADE`) to an all-green-or-explicit-deferral state (`PASS_LOCKED ≥ 130`; `DATA_RACE = 3`; `CASCADE ≤ 5`; `SKIPPED_TESTS = 2 + per-cell Phase-86.1-03 deferrals`) that satisfies Phase 87 Task 0's pre-gate so the Phase 87 216-min 3-run identity gate fires cleanly without an in-flight Phase-85/86 reopen.
**Requirements**: DETERM-12, DETERM-13, DETERM-14 (inherited from Phase 85/86)
**Depends on:** Phase 86
**Plans:** 4 plans

Plans:

- [ ] 86.1-01-PLAN.md — Extend `applyLikertOnlyFilter` coverage via fixture-helper bump (sub-option b2): raise `voter.fixture.ts` post-Likert Skip-Next budget from 3 → 6 iterations so the answeredVoterPage fixture walks past all 3 non-Likert opinion-question types (singleChoiceCategorical / boolean / number). Closes 85-04 cluster #2 (8 FAIL + 5 CASCADE) + likely cluster #1 (variant-constituency:226 + 22 cascades). DETERM-12/13/14.
- [ ] 86.1-02-PLAN.md — `voter-feedback-persistence:43` second-pass RCA: apply H4 close-transition mitigation (replace dialog-wrapper `toHaveCount(0)` with direct `feedback-form` testId absence assertion per RESEARCH §5.4); 1h investigation cap; skip-fallback with 3-element protocol + v2.11+ todo if budget exceeded. DETERM-13.
- [ ] 86.1-03-PLAN.md — Per-cell Phase-86 deferral reconciliation (3 cells, 1h budget each per CONTEXT D-04): Cell 1 voter-popup-hydration:122 LAYOUT-03 → SKIPPED (PASS-WITH-DEFERRAL inheritance per CONTEXT D-05); Cell 2 voter-not-located-redirect:75 CLEAN-02 → storage-isolation fix-attempt then SKIP-FALLBACK; Cell 3 candidate-profile-validation:178 A11Y-01 image-type → networkidle settle fix-attempt then chain-head-only SKIP-FALLBACK (preserve 5 PASS_LOCKED siblings per RESEARCH §6.3 landmine). DETERM-12 + DETERM-14.
- [x] 86.1-04-PLAN.md — Post-86.1 3-run cold-start identity gate + Phase 87 handoff: fork sha-identity.mjs from Phase 86; run 3-run gate (~216 min unattended); update `regen-constants.mjs` reportPath to Phase 86.1 run-3.json; emit regen-output.txt; update `tests/scripts/diff-playwright-reports.ts` PHASE 86.1 ANCHOR jsdoc + 4 const arrays with manual SKIPPED_TESTS filter (RESEARCH §7 LANDMINE); SUMMARY + STATE + ROADMAP atomic close. Phase 87 Task 0 pre-gate (CASCADE ≤ 5) satisfied. DETERM-12/13/14. (completed 2026-05-21)

### Phase 87: v2.10 All-Green Milestone-Close Anchor

**Goal**: Capture the final v2.10-ship anchor after Phases 84-86 land. Run a fresh 3-run cold-start gate; confirm all-green deterministic state (target: ~150-160 PASS_LOCKED + ≤3 DATA_RACE + 0 CASCADE + 0 FAILURE-CLASS); produce the binding v2.10-ship anchor via `regen-constants.mjs`; run `/gsd-audit-milestone` for shippability sign-off. The v2.10 milestone is shippable post-Phase-87.
**Depends on**: Phase 84 + Phase 85 + Phase 86 ALL COMPLETE.
**Requirements**: DETERM-15
**Success Criteria** (what must be TRUE):

  1. DETERM-15 closed: Fresh 3-run cold-start gate SHA-identical FIRST attempt against the post-84+85+86 codebase.
  2. Final v2.10-ship anchor: ~150-160 PASS_LOCKED + ≤3 DATA_RACE + 0 CASCADE + ≤2 FAILURE-CLASS (residual = explicit v2.11+ deferrals). Anchor SHA committed to `tests/scripts/diff-playwright-reports.ts` jsdoc.
  3. Phase 87 SUMMARY documents the all-green achievement + lists any explicit v2.11+ deferrals.
  4. `/gsd-audit-milestone v2.10` runs cleanly; status = shippable.

**Plans**: 1 plan

- [x] 87-01-PLAN.md — DETERM-15 final v2.10-ship anchor: fresh 3-run cold-start identity gate (strict, no D-09 fallback) + atomic constants regen (regen-constants.mjs reportPath + diff-playwright-reports.ts jsdoc + 4 const arrays) + comprehensive SUMMARY + /gsd-audit-milestone v2.10 invocation + atomic close commit

**UI hint**: no

## Progress

**Execution Order:**
Phase 79 (sequential REQs DETERM-04 → DETERM-05) → Phases 80, 81, 82, 83 (parallel-eligible after Phase 79 DETERM-04 green) → Phase 84 (sequential precondition for All-Green Suite) → Phases 85 + 86 (parallel-eligible after Phase 84) → Phase 87 (sequential after 85 + 86) → Phase 88 (sequential after 87 — operator-driven catalog audit + forward-looking baseline; gates milestone close + v2.11 start).

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
| 79. Determinism Recovery (Cascading-Race Fix + Constants Regen) | v2.10 | 4/4 | Complete (passed-with-deferral) | 2026-05-13 |
| 80. A11Y Axe Cite-and-Fix | v2.10 | 1/1 | Complete | 2026-05-13 |
| 81. A11Y-01 PRODUCT-GAP Cells — Email + URL Format | v2.10 | 1/1 | Complete    | 2026-05-13 |
| 82. A11Y-01 PRODUCT-GAP Cell — Required-Empty | v2.10 | 1/1 | Complete    | 2026-05-13 |
| 83. Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) | v2.10 | 1/1 | Complete   | 2026-05-13 |
| 84. Imgproxy Decoupling | v2.10 | 2/2 | Complete   | 2026-05-14 |
| 85. Variant-Project Cascade RCA & Fix | v2.10 | 2/2 | Complete   | 2026-05-14 |
| 86. Voter-App FAILURE-CLASS Cleanup | v2.10 | 4/4 | Complete   | 2026-05-14 |
| 86.1. Pre-Phase-87 Convergence Sweep | v2.10 | 0/4 | Planned | - |
| 86.2. E2E Suite Refactor Pass | v2.10 | 3/3 | Complete    | 2026-05-20 |
| 86.3. Implement Skipped Tests (8 cells) | v2.10 | 5/5 | Complete    | 2026-05-20 |
| 87. v2.10 All-Green Milestone-Close Anchor | v2.10 | 1/1 | Complete    | 2026-05-21 |
| 88. E2E Test Catalog Audit + Forward-Looking Baseline | v2.10 | 4/4 | Complete   | 2026-05-28 |

### Phase 88: E2E Test Catalog Audit + Forward-Looking Baseline

**Goal:** Operator-driven audit of the entire e2e test catalog — remove obsolete tests, add coverage gaps, consolidate redundant/overlapping specs — then capture a NEW v2.10-close anchor against the mutated catalog. This baseline replaces Phase 87's anchor as the gate against which ALL future development is verified (starting with v2.11 spike-tested rune migration). Phase 87's anchor becomes historical (last gate against the pre-audit catalog).

**Why this is the v2.10 final phase, not v2.11 prep:** v2.10's stated milestone goal is "Test Reliability + A11y Compliance + All-Green Suite." Phase 87 captured an all-green anchor against the *existing* catalog, but the operator now wants the catalog itself audited before treating the baseline as durable. Doing the audit + re-anchor inside v2.10 means the milestone closes against the catalog the team intends to live with, not against a catalog scheduled for immediate revision.

**Gating role:**

- BLOCKS `/gsd-complete-milestone v2.10` until the new baseline is committed.
- BLOCKS the v2.11 rune migration start (per spike-findings: Wave 1 leaf-context migrations need a deterministic baseline to regression-test against).

**Depends on:** Phase 87 (final pre-audit anchor must exist as historical reference).
**Requirements**: Operator-driven — Plan 88-01 derives its scope directly from `./TEST-INVENTORY-REFACTOR-1.md` (817 lines, of which lines 1-378 are 88-01-scoped; lines 379+ are deferred to subsequent 88-NN plans); Plan 88-03 derives from `./TEST-INVENTORY-REFACTOR-2.md`; Plan 88-04 derives from `./TEST-INVENTORY-REFACTOR-3.md` lines 21–194 (T3–T9 deferred from quick task `260527-nat`; T1+T2 already shipped). Discuss-phase room is plan-by-plan: skipped for 88-01/02/03 because the refactor doc IS the design spec; REQUIRED for 88-04 because the T3 settings-resolution ADR needs explicit operator decision.
**Plans:** 4/4 plans complete

Plans:

- [x] 88-01-PLAN.md — Parallel landing Wave 1: new BUILT_IN `baseV1` template + generic `setupFromTemplate` helper + sibling voter fixture (`answerMode: 'min'|'max'`) + voter-mega-journey spec (refactor-doc:204-378) + 3 appended playwright projects (`data-setup-baseV1 → voter-mega-journey → data-teardown-baseV1`) + full-suite regression + optional migration map. Parallel-only (existing surface untouched except for ONE testIgnore extension at `playwright.config.ts:252` to prevent double-pickup of the new spec by `voter-app`). 7 atomic tasks (6 mandatory + 1 optional). **EXECUTED PARTIAL** 2026-05-23 — scaffolding green; 25 mega-journey steps deferred to 88-NN pending baseV1 UI inspection.
- [x] 88-02-PLAN.md — Results route refactor: rename `entityTypePlural`/`entityTypeSingular` → `entityTab`/`entity` (with `etPl`/`etSg` matchers) + introduce new `[[electionTab]]` route segment that is NAME-DISJOINT from the search-side `?electionId=…` AVAILABLE-array surface. New voterContext `currentResultsElection` reactive accessor; server-side guards (invalid→strip+redirect; 1-available→auto-redirect; 2+→render existing picker). 8 atomic tasks. Unblocks ~5 of 88-01's deferred-88-nn placeholders (election-selection cluster) for the immediate follow-on plan to wire.
- [x] 88-03-PLAN.md — Voter election + constituency permutations: 8 minimal-data templates + voterIntro shared helpers (9 exports) + 8 perm-* spec files (15 hard-asserted tests under new `tests/tests/specs/perm/` directory) + 24 appended playwright projects (8 setup + 8 spec + 8 teardown). Sequential within the perm-* family (HIGH-2 chain-not-parallel resolution); parallel with default + variant + mega-journey + baseV1 chains via per-template `externalIdPrefix` decoupling. 5 atomic tasks.
- [x] 88-04-PLAN.md — TIR3 fixtures-and-spec-refactor: absorbs T3–T9 deferred from quick `260527-nat` (T1+T2 already shipped via `caf6ee931`/`accfba54f`). **EXECUTED PASS 2026-05-28** (initial wave PARTIAL → flipped to PASS later same day via post-SUMMARY operator-driven Gate B fix at `aaffe7d11`) — ADR + Option B (seed-time) resolver landed; 12 frontend testids added; 3-file fixtures library + views.ts composition root; 6 cell migrations (T5-T8) + TEXT_RE cleanup (T9). 14 atomic plan-execution commits + 1 post-SUMMARY Gate B fix (`aaffe7d11`). Gate B (cold-start mega-journey): 34/34 sub-tasks pass; mega-journey test passes T5/T6/T7-matrix/T7-org-details/T8-filters:text + T8-filters:dialog all 7 stages cold-start in ~57s. 8 Rule 1 fixes uncovered + applied (7 during initial plan, 1 post-SUMMARY for T8 stage 4+ — fixture-level role-based dialog button lookups + reset() acknowledges side-effect close + filter-badge assertion scoped to button text; Modal.svelte UNCHANGED). **Follow-up TODO surfaced for v2.11+ (Gate A.4):** refactor `QuestionInCardContent` and other results-cards settings to be election-specific (per-election overrides OR attach to questions/elections in `@openvaa/data`); when this lands, the dev-seed Writer's seed-time resolver may be retired. SUMMARY: `88-04-SUMMARY.md`. VERIFY scratch: `88-04-VERIFY.txt`.
- [ ] 88-NN — TBD: absorb refactor-doc-1 lines 379+ specs into the new template/helper/mega-journey shape; retire `--likert-only` flag once last consumer migrates
- [ ] 88-NN — TBD: retire per-variant setup files once the generic helper consumes them all
- [ ] 88-NN — TBD: refactor `QuestionInCardContent` and other results-cards settings to be election-specific (v2.11+ candidate; per Gate A.4 of 88-04 ADR-88-04-01)
- [ ] 88-LAST — TBD: final v2.10-close anchor capture against the audited catalog (3-run cold-start gate + atomic regen-constants); replaces Phase 87 anchor `b2ad76e5…`

### Phase 89: Continuing test refactoring — implement the new candidate journey (and related edits) per TEST-INVENTORY-REFACTOR-4.md

**Goal:** Apply Phase 88's mega-journey + parallel-landing + strict-fixtures pattern to the candidate app per TEST-INVENTORY-REFACTOR-4.md. Five deliverables: (1) baseV1 dataset extensions (hero on Q1/Q2/QG-base, info on Q1, unregistered candidate with "999" symbol, required test-qu-info-text, 3 filtered info questions); (2) voter-mega-journey absorbs hero/info/narrowed-candidate-details assertions in lockstep; (3) 12-file candidate fixture library (11 function-fixtures + composition root sibling to voter-mega.fixture.ts); (4) candidate-mega-journey spec walking TIR4:101-257 (22 steps from static-pages → registration via Inbucket → password → ToU → home → logout-with-dialog → forgot-password reset → login with submit-disabled + wrong-password + new-password branches → profile fill → opinion walk → preview → final logout-without-dialog); (5) 3 settings permutations (voterApp disabled / candidateApp disabled / per-app notifications). Phase ends with legacy retirement: delete 5 fully-absorbed specs + excise 7.1.2/3/4 from candidate-settings.spec.ts + prune unused PageObject classes.
**Requirements**: TIR4:17-32 (baseV1 data), TIR4:25-32 + 99 (voter-mega absorption), TIR4:58-80 (fixture library surface), TIR4:101-257 (candidate-mega flow), TIR4:34-54 (3 perms), D-89-04 (legacy retirement scope)
**Depends on:** Phase 88
**Plans:** 5/5 plans complete

Plans:
**Wave 1**

- [x] 89-01-PLAN.md — baseV1 dataset extensions + voter-mega-journey absorption (Wave 1; self-contained data PR; voter-mega absorbs hero/info/narrowed-candidate-details in lockstep)
- [x] 89-02-PLAN.md — Candidate fixture library: 11 function-fixtures + candidate-mega.ts composition root + N new testids (Wave 1; parallel-safe with 89-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 89-03-PLAN.md — Candidate mega-journey spec: 22-step serial walk of TIR4:101-257 + new playwright project chain data-setup-candidate-mega → candidate-mega-journey → data-teardown-candidate-mega (Wave 2; depends on 89-01 + 89-02)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 89-04-PLAN.md — 3 settings permutations: 3 perm templates + 3 specs + 6 setup/teardown wrappers + 9 playwright project entries (Wave 3; depends on 89-01 + 89-03; sequenced after 89-03 to avoid playwright.config.ts merge conflict and to allow perm chains to depend on the candidate-mega-journey Playwright project entry landed by 89-03)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 89-LAST-PLAN.md — Legacy retirement: delete 5 absorbed specs + excise 7.1.2/3/4 from candidate-settings.spec.ts + prune PageObjects per audit + clean playwright.config.ts (Wave 4; depends on 89-03 + 89-04)

**UI hint**: no (test-refactor + dataset mutation phase; no visual redesign)

### Phase 90: TIR5 permutations — missing-nominations warning + localisation negative/positive

Apply Phase 89's strict-fixtures, [id]-desc, serial-only, minimal-data permutation pattern (per TEST-INVENTORY-REFACTOR-5.md at repo root) to add 3 new candidate-app permutation specs: (1) missing-nominations warning (2 elections, shared CG with 1 CO, 1 org, 1 candidate, 1 nomination only in el-1 — both elections selected, expect warning for el-2); (2) localisation negative (1 supportedLanguage, 4 questions with disableMultilingual variants — expect no language selector, no translation-options surface); (3) localisation positive (2 supportedLanguages en+fi, same dataset — expect language selector, switch en↔fi, add Finnish answers, verify voter-side detail panel reflects per-locale answers). Adds lang-selector fixture + multilingual-text-field fixture. Depends on Phase 89. UI hint: no.

**Goal:** Apply Phase 89-04's strict-fixtures + minimal-data perm pattern to add 3 TIR5 permutation chains (missing-nominations / localisation-negative / localisation-positive) AND close the runtime-locale-override PRODUCT-GAP (Phase 74 D-04 carry-forward) by extending DynamicSettings with an optional `i18n.supportedLocales` override threaded through the frontend i18n init. The override unblocks single-locale permutation testing (the negative perm) without mutating Paraglide compile-time bundles. Each perm gets its own dev-seed template + setup/teardown wrapper + Playwright project triplet. Adds 2 new function-fixtures (langSelector + multilingualTextField) + 1 perm-l10n composition root sibling to candidate-mega.ts + 2 new testids on LanguageSelection.svelte / Input.svelte.
**Requirements**: I18N-RUNTIME-01 (Stage A runtime locale override, D-90-10), PERM-MN-01 (TIR5:15-26 missing-nominations modal), PERM-L10N-NEG-01..03 (TIR5:28-50 single-locale assertions), PERM-L10N-POS-01..07 (TIR5:52-95 dual-locale walk + voter-side cross-check), FIX-LANG-SEL-01 + FIX-ML-TEXT-01 (new function-fixtures per D-90-04)
**Depends on:** Phase 89
**Plans:** 4 plans

Plans:
**Wave 1**

- [ ] 90-01-PLAN.md — Stage A: runtime supportedLocales override wiring (extend DynamicSettings.i18n.supportedLocales? + thread through i18n init.ts override-or-fallback resolution + filter exported `locales` array; preserves Paraglide compile-time bundles). Code-only plan; no test perms.
- [ ] 90-02-PLAN.md — perm-missing-nominations: 2-election asymmetric-nominations template + setup/teardown + spec + 3 playwright project entries (chain anchor: perm-per-app-notifications from 89-04). Independent of 90-01.

**Wave 2** *(blocked on 90-01 + 90-02)*

- [ ] 90-03-PLAN.md — perm-localisation-negative: template w/ single-locale i18n override (consumes 90-01 surface) + 2 new function-fixtures (langSelectorFixture + multilingualTextFieldFixture) + perm-l10n composition root + 2 testid additions on LanguageSelection/Input + spec asserting no-langSelector + no-translation-toggles + 3 playwright project entries (chain anchor: perm-missing-nominations).

**Wave 3** *(blocked on 90-03)*

- [ ] 90-04-PLAN.md — perm-localisation-positive: template w/ [en,fi] i18n override + spec walking TIR5:52-95 (langSelector visibility + switch en↔fi + candidate-side Finnish authoring on q1/q3 + q2/q4 no-toggle + voter-side cross-check per D-90-07) + 3 playwright project entries (chain anchor: perm-localisation-negative). Consumes 90-03 fixtures + composition root.
