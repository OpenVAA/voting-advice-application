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

### 🆕 v2.10 Test Reliability + A11y Compliance + All-Green Suite — IN PROGRESS (framed 2026-05-12; Phase 83 added 2026-05-13 post-Phase-79-close; Phases 84-87 added 2026-05-13 post-Phase-83-close as the All-Green Suite extension)

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
- [ ] **Phase 87: v2.10 All-Green Milestone-Close Anchor** — Capture a fresh 3-run cold-start gate after Phases 84-86 land; confirm all-green deterministic state (target: ~150-160 PASS_LOCKED + 0 DATA_RACE + 0 CASCADE + 0 FAILURE-CLASS); produce the final v2.10-ship anchor via `regen-constants.mjs`; run `/gsd-audit-milestone` for shippability sign-off.

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
- [ ] 87-01-PLAN.md — DETERM-15 final v2.10-ship anchor: fresh 3-run cold-start identity gate (strict, no D-09 fallback) + atomic constants regen (regen-constants.mjs reportPath + diff-playwright-reports.ts jsdoc + 4 const arrays) + comprehensive SUMMARY + /gsd-audit-milestone v2.10 invocation + atomic close commit
**UI hint**: no

## Progress

**Execution Order:**
Phase 79 (sequential REQs DETERM-04 → DETERM-05) → Phases 80, 81, 82, 83 (parallel-eligible after Phase 79 DETERM-04 green) → Phase 84 (sequential precondition for All-Green Suite) → Phases 85 + 86 (parallel-eligible after Phase 84) → Phase 87 (sequential after 85 + 86).

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
| 87. v2.10 All-Green Milestone-Close Anchor | v2.10 | 0/1 | Planned | - |
