---
gsd_state_version: 1.0
milestone: v2.10
milestone_name: Test Reliability + A11y Compliance
status: verifying
stopped_at: Phase 83 context gathered
last_updated: "2026-05-13T18:04:17.600Z"
last_activity: 2026-05-13
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-12)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Phase 83 — Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) + v2.10 Milestone-Close Hygiene

## Current Position

Phase: 83 (Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) + v2.10 Milestone-Close Hygiene) — EXECUTING
Plan: 1 of 1
Status: Phase complete — ready for verification
Last activity: 2026-05-13

## Performance Metrics

**Cumulative:**

- Milestones shipped: 14 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1, v2.3, v2.4, v2.5, v2.6, v2.7, v2.8, v2.9) + 1 paused (v2.2)
- Total plans completed: 263 + 6 tasks (v2.9 added 32 plans)
- Timeline: 46 days across 7 work windows (2026-03-01 → 2026-03-28 + v2.5 2026-04-23→24 + v2.6 2026-04-24→28 + v2.7 2026-04-29→05-08 + v2.8 2026-05-08→10 + v2.9 2026-05-10→12)
- v2.9 specifically: 6 phases (73-78), 32 plans, 89 tasks across 3 days

## Deferred Items

Snapshot at v2.10 planning start (2026-05-12), updated 2026-05-13 after Phase 79 close added Phase 83 + 2 follow-up todos. v2.10 now consumes 5 in-milestone candidates (3 v2.9-routed originals + 2 Phase-79-surfaced follow-ups absorbed in-milestone rather than re-deferred). 5 other v2.9-routed v2.10+ candidates remain re-deferred to v2.11+ (SETTINGS-02 / SETTINGS-03 / FilterGroup OR-mode / voters-layout non-reactive topbar / constituency-filter PRODUCT-GAP) — these need new UI/architecture work outside v2.10's expanded scope.

| Category | Item | Status / Notes |
|----------|------|----------------|
| todo | 2026-05-12-candidate-profile-cascading-race.md | **v2.10 Phase 79 / DETERM-04** — Complete (passed-with-deferral 2026-05-13) |
| todo | 2026-05-12-a11y-axe-first-run-violations.md | **v2.10 Phase 80 / A11Y-04** — mapped |
| todo | 2026-05-12-a11y-01-product-gap-cells.md | **v2.10 Phase 81 / A11Y-05+06 + Phase 82 / A11Y-07** — mapped (split across email/url shared-dispatch + required-empty product-decision phase) |
| todo | 2026-05-13-candidate-profile-image-upload-cascade.md | **v2.10 Phase 83 / DETERM-06** — promoted 2026-05-13 from v2.11+ to in-milestone gap closure |
| todo | 2026-05-13-voter-matching-detail-flakes.md | **v2.10 Phase 83 / DETERM-07** — promoted 2026-05-13 from v2.11+ to in-milestone gap closure |
| todo | 2026-05-12-settings-02-voter-authoring-product-gap.md | Re-deferred to v2.11+ — voter-app PRODUCT-GAP, out of v2.10 focused scope |
| todo | 2026-05-12-settings-03-voter-required-product-gap.md | Re-deferred to v2.11+ — voter-app PRODUCT-GAP, out of v2.10 focused scope |
| todo | 2026-05-12-voters-layout-non-reactive-appsettings.md | Re-deferred to v2.11+ — Svelte 5 reactivity hardening, out of v2.10 focused scope |
| todo | 2026-05-12-qspec-01-i18n-hardening.md | Backlog — small QSPEC follow-up; not v2.10 |
| todo | 2026-05-12-qspec-02-multi-choice-categorical-variant.md | Backlog — QSPEC follow-up; not v2.10 |
| todo | 2026-05-12-58-e2e-audit-addendum-qspec.md | Backlog — audit addendum hygiene; not v2.10 |
| todo | results-url-refactor-followups.md | Re-deferred to v2.11+ — sharable URLs / multi-tenant pair |
| todo | frontend-project-id-scoping.md | Re-deferred to v2.11+ — paired with results-url-refactor-followups |
| todo | 2026-05-10-incorporate-luxembourg-and-danish-vaa-changes.md | Separate future milestone — deltas unscoped |
| todo | 2026-04-28-cleanup-nominations-table.md | DB-01 — deferred 2026-04-29; user opted to keep table as is |
| todo | 2026-03-28-generalize-candidate-app-to-party-app.md | Future party-app variant |
| todo | 2026-03-28-investigate-migrating-candidate-answer-store.md | Architectural investigation |
| todo | adapter-package-loading.md | Medium — tsconfig-based importable adapter |
| todo | check-candidate-distribution.md | Low — default seed candidate spread follow-up |
| todo | configurable-mock-data.md | Medium — Supabase GENERATE_MOCK_DATA env replacement |
| todo | password-reset-code-method.md | Strapi-era leftover |
| todo | register-page-registrationkey-method.md | Strapi-era leftover |
| todo | rename-admin-writer.md | dev-seed internal API hygiene; low priority |
| todo | session-storage-election-constituency.md | Partly mitigated by v2.6 Phase 62 URL-based election scoping |
| todo | sql-linting-formatting.md | CI hygiene |
| todo | 2026-05-09-rewrite-parent-answer-imputation.md | Future matching-focused milestone |
| carry-forward | 165 pre-existing intra-package circular deps (data/matching/filters internal.ts barrel pattern) | Out of v2.10 scope; dedicated structural refactor milestone |
| infrastructure | Local imgproxy Docker container 502 on image upload (intermittent) | Not a code issue; fix with `supabase stop && supabase start`. Carried forward. |
| Phase 79 P01 | 2h | 4 tasks | 18 files |
| Phase 79 P02 | 50min | 3 tasks | 9 files |
| Phase 79 P02F | 3min | 0 tasks | 3 files |
| Phase 80 P01 | ~6h | 6 tasks + 1 deviation (Task 5b) + 1 Rule 1 fix | 8 files + 2 deviation files |
| Phase 81 P01 | 1h | 9 tasks | 24 files |
| Phase 82 P01 | 26min | 6 tasks | 4 files |
| Phase 83 P01 | 180min | 10 tasks | 8 files |

## Accumulated Context

### Roadmap Evolution

- 2026-04-28: v2.6 Svelte 5 Migration Cleanup shipped. 5 phases (60-64), 18 plans, 48 tasks, 4 days.
- 2026-05-08: v2.7 shipped. 4 phases (65-68), 9 plans, 28 tasks, 9 days. `tech_debt` verdict (8/8 reqs wired; 3 documented deferrals).
- 2026-05-10: v2.8 shipped. 4 phases (69-72), 13 plans, ~37 tasks, 3 days. Bundled parity gate PASSED.
- 2026-05-12: v2.9 shipped. 6 phases (73-78), 32 plans, 89 tasks, 3 days. `tech_debt` verdict (24/24 reqs satisfied; 12 PASS + 12 PASS-WITH-DEFERRAL; 8 v2.10+ candidate todos filed).
- 2026-05-12: v2.10 Test Reliability + A11y Compliance roadmap drafted. **4 phases (79-82), 6 requirements mapped 1:1 across 2 categories (DETERM ×2 / A11Y ×4):**
  - **Phase 79 — Determinism Recovery** (DETERM-04, DETERM-05): cascading-race fix + parity-script constants regen. Sequential — fix must land before regen captures a clean baseline. Both REQs share the candidate-profile test surface.
  - **Phase 80 — A11Y Axe Cite-and-Fix** (A11Y-04): resolve 5 first-run WCAG 2.1 AA violations across `/results` + voter-detail-drawer routes. Structurally independent of DETERM; can run in parallel with Phase 79 (benefits from DETERM-04 being green for clean assertion runs, but does not depend on DETERM-05 regen).
  - **Phase 81 — A11Y-01 PRODUCT-GAP Cells: Email + URL Format** (A11Y-05, A11Y-06): shared `customData.format` / `Question.subtype` dispatch decision; both REQs land via the same schema + component + i18n surface. Depends on Phase 79 DETERM-04 being green for clean assertion runs (assertions live in `candidate-profile-validation.spec.ts` which the cascade blocked).
  - **Phase 82 — A11Y-01 PRODUCT-GAP Cell: Required-Empty** (A11Y-07): embedded product decision (REJECT vs SOFT-WARN-ONLY) gates implementation shape — warrants its own discuss-phase gate. Depends on Phase 79 DETERM-04 being green.
- 2026-05-13: Phase 79 SHIPPED passed-with-deferral. URL-predicate fix at `candidate-profile.spec.ts:51` (RCA verdict — neither H1 auth-session nor H2 ToU-hydration was the proximate cause; the bug was in the test helper). 6 cold-start captures (D-08 strict identity failed on initial trio due to pre-existing voter-app flakes; D-09 fresh trio SHA-identical at `ff0334f856…`). v2.10 anchor locked: 80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE.
- 2026-05-13: v2.10 scope expanded from 4 phases / 6 REQs to **5 phases / 8 REQs**. **Phase 83 added** (Test Reliability Follow-ups — DETERM-06 image-upload cascade + DETERM-07 voter-app flakes) to absorb the 2 follow-up todos surfaced by Phase 79's DETERM-04 fix as in-milestone gap closure rather than re-deferring to v2.11+. Phase 83 depends only on Phase 79; structurally parallel-eligible with 80/81/82.
- 2026-05-13: Phase 80 SHIPPED GREEN. A11Y-04 closed — 5 WCAG 2.1 AA violations resolved via Tabs.svelte `role="tablist"` root-cause fix (1-line) + Drawer/Button aria-label i18n (2-line). Scout misdiagnosis corrected mid-execution via Rule 4 deviation (operator-approved Option A: add 1-line Tabs.svelte fix in-plan as Task 5b; NavGroup/NavItem context-detect retained as orthogonal a11y improvement for candidate/admin nav surfaces). Per-rule + global-zero a11y regression gate landed; Phase 79 v2.10 anchor SHA `ff0334f856…` preserved verbatim (4 parity gates PASS). Latent heading-order risk did NOT surface. 0 deferred items for Phase 80.
- Phase numbering continues from v2.9 (last phase: 78); v2.10 starts at 79 and extends through 83. No reset.
- Plan count is TBD per phase (filled by `/gsd-plan-phase`).

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key cross-milestone reference points carried forward into v2.10:

- Phase 75 PASS_LOCKED baseline (47/15/33) preserved through v2.9 Phases 76 → 77 → 78 via three architectural-deferral decisions; constants regen DEFERRED-WITH-RATIONALE at every Phase 76/77/78 close. The unlock condition is Phase 79 DETERM-04 (cascading-race fix); Phase 79 DETERM-05 (regen) executes against a clean post-fix 3-run cold-start baseline.
- Phase 79 sequencing: DETERM-04 MUST land before DETERM-05. The regen captures the post-fix baseline (expected ~63 PASS_LOCKED — 47 v2.9 anchor + ~16 cascade-unblocked tests). Regen path options: v2.9 in-place path OR the archived `node .planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs <run-3.json>` script.
- Phase 80 (A11Y-04) is the smallest phase — 5 violations across 3 rule-IDs, 2 of which are shared-component fixes that resolve both routes simultaneously. Expected ~1-2 plans (per-rule batching: `aria-required-parent` + `list` likely co-located in entity-card/list component; `button-name` independent on drawer icon-button).
- Phase 81 (A11Y-05 + A11Y-06) shares the schema dispatch question — phase discussion picks ONE mechanism (likely `customData.format` enum addition + INPUT_TYPES bridge) covering both email + URL paths. The Phase 76 P01 `test-question-social-1` slot (sort 21) MAY be promoted to carry the URL dispatch once schema lands.
- Phase 82 (A11Y-07) has the embedded product decision (REJECT-with-inline-error vs SOFT-WARN-ONLY = current badge + submit-button gating). Decision made at phase discuss time. If SOFT-WARN-ONLY: the cell closes as PRODUCT-CONFIRMED with no code changes — the spec asserts the existing badge + button-gating instead of a new error UI.
- All v2.10 work is frontend / package-level + Playwright spec authoring — NO Supabase migrations, NO new test runners, NO E2E framework migration. Same durable stack as v2.9 (Playwright 1.58.2).
- Deprecated `dev:*` script aliases scheduled for removal at v2.10 close (per Phase 78 Plan 01 SUMMARY commitment) — should be addressed as a sub-task during one of the v2.10 cleanup commits, not as a separate phase.
- [Phase ?]: Phase 79 Plan 01 (DETERM-04 RCA): H1 partially confirmed re-framed, H2 disproven by absence of exercise; proximate cause is test-spec URL-predicate bug at candidate-profile.spec.ts:51
- [Phase ?]: Phase 79 Plan 02 (DETERM-04 fix): applied one-line URL-predicate fix at candidate-profile.spec.ts:51 per Plan 01 RCA; registration cascade resolved, verified across 3 isolated runs + cold-start
- [Phase ?]: Phase 79 Plan 02: image-upload (CAND-03) cascade-skips 5 downstream tests post-fix; structurally unrelated to DETERM-04; flag 79-02F restructure trigger = N (restructure wouldn't help; image-upload investigation deferred to future plan)
- [Phase ?]: Plan 79-02F closed DONE-AS-NOOP per XOR contract — Plan 02 PASSed, so the fallback restructure short-circuits without executing Tasks 1-4.
- [Phase ?]: Phase 80 Plan 01 (A11Y-04) closes GREEN — Tabs.svelte role=tablist root-cause fix (1-line) corrects scout misdiagnosis via Rule 4 deviation; NavGroup/NavItem context-detect retained as independent a11y improvement; Phase 79 v2.10 anchor SHA ff0334f856… preserved (4 parity gates PASS)
- [Phase ?]: [Phase 81-01]: A11Y-05 + A11Y-06 closed via Question.subtype dispatch ('email' parallel to 'link'); 14-locale i18n + TranslationKey regen; e2e sort-21 retrofit + new sort-23; 3-run cold-start fingerprint identity PASS; v2.10 anchor preserved by NET-ADDITIONS construction.
- [Phase ?]: Phase 82 P01: TIGHTEN-SOFT closed A11Y-07 via canSubmit && allRequiredFilled gate at +page.svelte:103; sort-24 fixture landed with custom_data.required (LANDMINE-1); 6-cell A11Y-01 green; 3-run cold-start fingerprint identical; parity-script PASS_LOCKED 80 → 81 additive
- [Phase ?]: Phase 83 P01: DETERM-06 closed via 4-rung ladder (D-01a+D-01b+D-01c+Rule-2); DETERM-07a/b via hydration guards; v2.10-close anchor regenerated at SHA d6bfeebdb0...

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue; carry-forward infrastructure debt. May affect any image-upload-touching E2E re-runs during Phase 79 verification (cold-start full-suite gate).
- 165 pre-existing intra-package circular deps in `@openvaa/data` / `matching` / `filters` — deferred to a dedicated structural refactor milestone.
- The candidate-profile cascading race (DETERM-04) is the v2.10 critical path — if root-cause investigation surfaces a deeper Svelte 5 hydration OR Supabase auth-session race that needs upstream framework work, fallback is the test-restructure path (split registration assertion into a setup project so downstream tests don't depend on the redirect succeeding). Both paths are documented in `.planning/todos/pending/2026-05-12-candidate-profile-cascading-race.md` §"Recommended approach".

## Session Continuity

Last session: 2026-05-13T18:04:04.252Z
Stopped at: Phase 83 context gathered
Resume file: None
Next action: Run `/gsd-plan-phase 79` to plan the Determinism Recovery phase.

### Plan-count estimate (drafted 2026-05-12)

| Phase | Likely plan count | Notes |
|-------|-------------------|-------|
| 79 — Determinism Recovery | 2-4 plans | (1) DETERM-04 root-cause investigation + fix-or-restructure decision + implementation; (2) DETERM-04 verification (3-run cold-start identity); (3) DETERM-05 constants regen + commit; potentially (4) split if investigation surfaces a deeper Svelte 5 hydration OR Supabase auth-session race requiring its own plan. |
| 80 — A11Y Axe Cite-and-Fix | 1-2 plans | (1) shared-component fix for `aria-required-parent` + `list` (likely entity-card list); (2) drawer `button-name` aria-label additions. Could collapse into a single plan if surfaces are co-located. |
| 81 — A11Y-01 Email + URL Format Cells | 2-3 plans | (1) schema decision + `customData.format` enum + `INPUT_TYPES` email branch + i18n `invalidEmail`; (2) URL dispatch (subtype OR `customData.format='url'`) + fixture extension + spec cell 6; potentially (3) split if URL schema restoration requires more than a customData enum extension. |
| 82 — A11Y-01 Required-Empty Cell | 1 plan | Product decision at discuss-phase + (if REJECT) save-path validation + `required` i18n key + spec cell 4; lighter if decision is SOFT-WARN-ONLY (spec only). |

**Total v2.10 estimate:** ~6-10 plans across 4 phases. Risk: high on Phase 79 (race investigation may surface code-level bugs requiring framework or auth work); moderate on Phase 81 (schema decision drives implementation shape); low on Phases 80 + 82 (small focused fixes + product-decision-gated cell).

## Operator Next Steps

- Phase 80 (A11Y-04) closed GREEN on 2026-05-13. v2.10 progress: 2 of 5 phases complete; 5 of 5 known plans complete.
- Next phases parallel-eligible: Phase 81 (A11Y-05 + A11Y-06 email/URL format cells), Phase 82 (A11Y-07 required-empty cell — embedded product decision at discuss-time), Phase 83 (DETERM-06 image-upload cascade + DETERM-07 voter-app flakes). All 3 depend only on Phase 79 (already green); none depend on Phase 80 specifically.
- Recommended next action: Run `/gsd-discuss-phase 81` (smaller A11Y phase first) OR `/gsd-discuss-phase 82` (product-decision phase — gates Phase 81 shape if it consolidates with email/url dispatch).
- Optional UAT (operator discretion): Manual screen-reader smoke (VoiceOver / NVDA) on `/results` to confirm Tabs is announced as "tab list, N tabs"; not blocking phase close.
