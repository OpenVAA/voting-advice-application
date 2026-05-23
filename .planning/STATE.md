---
gsd_state_version: 1.0
milestone: v2.10
milestone_name: Test Reliability + A11y Compliance + All-Green Suite — IN PROGRESS
status: in_progress
stopped_at: "Phase 87 SHIPPED. Phase 88 ADDED 2026-05-22 (operator-driven e2e catalog audit + forward-looking baseline; gates both /gsd-complete-milestone v2.10 AND v2.11 rune-migration start). Phase 87 anchor (b2ad76e5…) becomes historical; Phase 88 produces the new gating anchor. Operator next step: /gsd-discuss-phase 88"
last_updated: 2026-05-22T00:00:00.000Z
last_activity: "2026-05-23 -- Plan 88-02 planned: results route refactor ([[electionTab]] new route segment + entityTab/entity rename; NAME-DISJOINT from search-side electionId AVAILABLE-array surface); 8 atomic tasks; unblocks ~5 deferred-88-nn mega-journey placeholders"
progress:
  total_phases: 13
  completed_phases: 11
  total_plans: 33
  completed_plans: 30
  percent: 79
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-12)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Milestone complete

## Current Position

Phase: 88
Plan: 88-02 (planned 2026-05-23; 88-01 executed PARTIAL earlier same day)
Status: 88-02 ready to execute — `/gsd-execute-phase 88` will pick up 88-02; 88-01's deferred-88-nn cluster waits on the follow-on plan after 88-02 lands.
Last activity: 2026-05-23

## Performance Metrics

**Cumulative:**

- Milestones shipped: 14 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1, v2.3, v2.4, v2.5, v2.6, v2.7, v2.8, v2.9) + 1 paused (v2.2)
- Total plans completed: 272 + 6 tasks (v2.9 added 32 plans)
- Timeline: 46 days across 7 work windows (2026-03-01 → 2026-03-28 + v2.5 2026-04-23→24 + v2.6 2026-04-24→28 + v2.7 2026-04-29→05-08 + v2.8 2026-05-08→10 + v2.9 2026-05-10→12)
- v2.9 specifically: 6 phases (73-78), 32 plans, 89 tasks across 3 days

## Deferred Items

Snapshot at v2.10 planning start (2026-05-12), updated 2026-05-13 after Phase 79 close added Phase 83 + 2 follow-up todos, updated 2026-05-20 after constituency-filter WONT-IMPLEMENT decision. v2.10 now consumes 5 in-milestone candidates (3 v2.9-routed originals + 2 Phase-79-surfaced follow-ups absorbed in-milestone rather than re-deferred). 4 other v2.9-routed v2.10+ candidates remain re-deferred to v2.11+ (SETTINGS-02 / SETTINGS-03 / FilterGroup OR-mode / voters-layout non-reactive topbar). Constituency-filter PRODUCT-GAP has since been CLOSED as WONT-IMPLEMENT (out of contract — constituency is a navigation/scope concept, not a filter).

| Category | Item | Status / Notes |
|----------|------|----------------|
| todo | 2026-05-12-candidate-profile-cascading-race.md | **v2.10 Phase 79 / DETERM-04** — Complete (passed-with-deferral 2026-05-13) |
| todo | 2026-05-12-a11y-axe-first-run-violations.md | **v2.10 Phase 80 / A11Y-04** — mapped |
| todo | 2026-05-12-a11y-01-product-gap-cells.md | **v2.10 Phase 81 / A11Y-05+06 + Phase 82 / A11Y-07** — mapped (split across email/url shared-dispatch + required-empty product-decision phase) |
| todo | 2026-05-13-candidate-profile-image-upload-cascade.md | **v2.10 Phase 83 / DETERM-06** — promoted 2026-05-13 from v2.11+ to in-milestone gap closure |
| todo | 2026-05-13-voter-matching-detail-flakes.md | **v2.10 Phase 83 / DETERM-07** — promoted 2026-05-13 from v2.11+ to in-milestone gap closure |
| todo | 2026-05-12-settings-02-voter-authoring-product-gap.md | Re-deferred to v2.11+ — voter-app PRODUCT-GAP, out of v2.10 focused scope |
| todo | 2026-05-12-settings-03-voter-required-product-gap.md | Re-deferred to v2.11+ — voter-app PRODUCT-GAP, out of v2.10 focused scope; Phase 86 Plan 03 Task 3 confirmed via testIgnore project-config exclusion (no fix) |
| todo | 2026-05-12-voters-layout-non-reactive-appsettings.md | **CLOSED 2026-05-20** by Phase 86.3 Plan 01 — moved to .planning/todos/done/ |
| todo | 2026-05-14-qspec-walkToQuestion-cold-start-race.md | **v2.11+** — Phase 86 Plan 03 Tasks 1+2 source-skip (QSPEC-01 + QSPEC-02 boolean+categorical share root cause: walkToQuestion intro-start CTA wait races full-suite settings overlay; 10s timeout on voter-questions-start) |
| todo | 2026-05-14-party-drawer-boundary-flake-residual.md | **v2.11+** — Phase 86 Plan 04 Task 2 PASSED-WITH-DEFERRAL on strict 3-run SHA identity (Phase-83-DETERM-07b boundary graduate; Plan 01 Task 5 hardening reduced but did not eliminate boundary classification) |
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
| Phase 86 P01 | 15min | 5 tasks | 5 files |
| Phase 86 P02 | 10min | 3 tasks | 2 files |
| Phase 86 P03 | 25min | 5 tasks | 5 files |
| Phase 86 P04 | ~190min (~162min unattended 3-run gate + ~28min orchestration) | 7 tasks | 9 files |
| Phase 86.2 P01 | 210min | 3 tasks | 12 files |
| Phase 86.2 P02 | 90min | 3 tasks | 23 files |
| Phase 86.3 P01 | 75min | 3 tasks | 7 files (+ 1 todo rename) |
| Phase 86.3 P03 | 50min | 3 tasks | 5 files (1 spec + 1 trace-analysis + 1 smoke + 1 augmented todo + 1 SUMMARY) |
| Phase 86.3 P04 | ~15min | 2 tasks | 4 files (1 spec + 1 augmented todo + 1 smoke + 1 SUMMARY) |
| Phase 86.3 P02 | 30min | 3 tasks tasks | 5 files files |
| Phase 87 P01 | 30min (Path A verbal-accept; ~216 min saved vs Path B) | 5 tasks (0/1a/1b/2/3/4) | ~20 files |

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
- 2026-05-13: Phases 81-82 SHIPPED. A11Y-05/06/07 closed. v2.10 anchor preserved through Phase 81; Phase 82 +1 PASS_LOCKED additive regen.
- 2026-05-13: Phase 83 SHIPPED GREEN. DETERM-06 closed via 4-rung ladder (D-01a selector fix → D-01b 500ms settle → D-01c imgproxy re-enable → Rule-2 fill-required-empty). DETERM-07a/b closed via hydration-completeness guards. 3-run cold-start SHA-256 identity FIRST-attempt at hash `d6bfeebdb0…`. **New v2.10-close anchor: 94 PASS_LOCKED + 15 DATA_RACE + 47 CASCADE** (+13 net PASS_LOCKED; DATA_RACE Phase 73 D-09 binding preserved verbatim). 3 Phase 82 advisory follow-ups closed (WR-01 overlay-extend, IN-01 docstring, IN-02 +2 PASS_LOCKED backfill).
- 2026-05-13: **v2.10 scope expanded from 5 phases / 8 REQs to 9 phases / 16 REQs.** Phases 84-87 added as the **All-Green Suite extension** — directive from operator: get ALL e2e tests passing (no DATA_RACE flakes, no CASCADE skips, no FAILURE-CLASS deterministic fails). Phase 84 = imgproxy structural decoupling (DATA_RACE 15→≤3); Phase 85 = variant-project cascade RCA + fix (CASCADE 47→0); Phase 86 = voter-app FAILURE-CLASS cleanup (~10→0); Phase 87 = final v2.10-ship anchor capture. Phase 84 is the sequential precondition; 85+86 parallel-eligible after; 87 sequential after 85+86. New REQ IDs: DETERM-08..15 (8 new REQs).
- 2026-05-14: Phase 86 SHIPPED PASSED-WITH-DEFERRAL. DETERM-12/13/14 closed via 3-plan cluster RCA. Plan 01 (popups + hydration + navigation/redirects + party-drawer harden): 5 deterministic fixes. Plan 02 (filter + feedback): 2 deterministic fixes; CLAUDE.md Svelte 5 destructuring audit on 3 components DISPROVED. Plan 03 (visibility + edge-cases + question-rendering): 1 hydration-guard fix (voter-detail case-d) + 1 project-config testIgnore exclusion (voter-visibility-required) + 2 test.skip()+rationale entries (QSPEC-01/02 — Phase 75 inheritance, shared v2.11+ todo). 3-run cold-start SHA-identity ALMOST-STRICT verdict (run-1 invalidated by operator; run-2 vs run-3 differ by exactly 1 cell — party-drawer boundary flake per Phase 83 DETERM-07b classification; canonical regen source = run-3). **New v2.10 All-Green Suite anchor: 9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9** — 113 PASS_LOCKED (+4 net vs Phase 85 109) + 3 DATA_RACE (UNCHANGED per D-09) + 40 CASCADE (-2 from QSPEC source-skip migration to SKIPPED_TESTS) + 2 SKIPPED (new bucket) = 158 tracked. Phase 85 anchor `411e09f5ff…` ABSORBED. SKIPPED_TESTS const introduced in `tests/scripts/diff-playwright-reports.ts` (per CONTEXT.md D-05). 2 new v2.11+ todos filed (qspec-walkToQuestion cold-start race + party-drawer boundary flake residual). FAILURE-CLASS narrative block shrunk from ~100 lines to 40-line shrunken header. Phase 87 entry condition (strict-identity 3-run gate) is PASSED-WITH-DEFERRAL; residual party-drawer boundary flake explicitly carried forward.
- Phase numbering continues from v2.9 (last phase: 78); v2.10 starts at 79 and extends through 87. No reset.
- Plan count is TBD per phase (filled by `/gsd-plan-phase`).
- Phase 86.1 inserted after Phase 86: Pre-Phase-87 Convergence Sweep — drive v2.10 e2e suite to all-green-or-explicit-deferral so Phase 87's CASCADE ≤ 5 pre-gate fires cleanly. Originally drafted as orphaned Phase 88 in commit bf286df76; renumbered to 86.1 to match execution order. (URGENT)
- Phase 86.2 inserted after Phase 86: E2E suite refactor pass (extract helpers, dedup assertions, propagate Phase 86.1 post-fix patterns); inserted after green-baseline 2026-05-19 supersedes HANDOFF.json CASCADE=40 blocker; depends on Phase 86.1; gates Phase 86.3 (URGENT)
- Phase 86.3 inserted after Phase 86: Implement 7 source-skipped tests (SETTINGS-01 wave A×3 + SETTINGS-01 wave B constituency-filter + E2E-03 feedback persistence + LAYOUT-03 popup regression gate + QSPEC-01/02 boolean+categorical); discuss-phase first answers 'is this all?' by reconciling with grep of test.skip() across tree; depends on Phase 86.2 (URGENT)
- 2026-05-21 (cont.): **Phase 87 Path B promoted** at operator request. Fresh 3-run cold-start gate executed against post-86.3-v2 codebase HEAD `bd0f92b90`: runs 1+2 SHA-identical at `b2ad76e5de4f5b435db536bb5d5d05c81c5bd4c8e007a5f0c25078e2ed74ef2e` (159 pass / 0 fail / 4 skipped); run-3 differs by exactly 2 boundary-class cells (`voter-app :: voter-results.spec.ts > coupling-rule redirect: singular without id → list view (D-11)` + `> deeplink edge case: organizations list + candidate drawer (D-08 shape 4)`) — same documented voter-app cold-deeplink loader race as v2.11+-deferred cells #5/#7/#8. Operator-promoted ALMOST-STRICT verdict per Phase 86 D-06 precedent extension (in fact stronger — runs 1+2 100% identical vs Phase 86 v1 1-cell run-2/run-3 diff). v2.10 ship anchor UPGRADED: `bc1c94957b…` (Path A re-derivation from 86.3-v1 raw) → `b2ad76e5…` (Path B PASS-state pair, fresh raw artifacts post-86.3-v2). Path A captures preserved at `.planning/phases/87-…/post-fix/path-a/` for audit-trail continuity. Const arrays preserved verbatim (114/3/36/4 = 157 tracked); the 2 boundary-flake cells are NEW tests not in PASS_LOCKED_TESTS — documentary only, NOT promoted per CONTEXT D-08 (folded into existing v2.11+ navigation-from-home redesign closure). regen-constants.mjs reportPath repointed to run-2.json (PASS-state canonical per Phase 86 D-06). IMGPROXY match-count assertion preserved 3/3 ✓. Imgproxy 502 recovery applied between run-2 and run-3 (`supabase stop && supabase start`) per Phase 79 D-14. /gsd-audit-milestone v2.10 verdict unchanged (tech_debt operator-accepted).
- 2026-05-22: **Phase 88 added to v2.10 roadmap** as the new final phase. Scope: operator-driven audit of the entire e2e test catalog (remove obsolete tests, add coverage gaps, consolidate redundant specs) followed by a fresh 3-run cold-start baseline capture against the mutated catalog. The Phase 88 anchor REPLACES Phase 87's anchor (`b2ad76e5…`) as the gate against which all future development is verified, starting with v2.11 rune-migration Wave 1. Phase 87's anchor becomes historical (last gate against the pre-audit catalog). **Gating semantics:** Phase 88 blocks both `/gsd-complete-milestone v2.10` AND the v2.11 spike-tested rune migration kickoff — v2.10 closes against the catalog the team intends to live with, and v2.11 Wave 1 needs a deterministic post-audit baseline to regression-test against. Plan count + REQ IDs TBD via `/gsd-discuss-phase 88`. Spike findings (001-012) already provide the migration shape for v2.11; the audit-and-rebaseline phase is the bridge that makes those findings safely actionable.
- 2026-05-21: **Phase 87 SHIPPED PASSED-WITH-DEFERRAL.** DETERM-15 closed via Path A verbal-accept v2.10 ship-close anchor pin. Operator selected Path A (verbal-accept) at execute-phase Task 1a checkpoint based on autonomous-directive + 2026-05-21 operator verbal verification at commit 9ad802ec0 (3 runs, 0 fails + 4 hard-coded skips). Phase 87 ship anchor `bc1c94957b8dcadfd79ff7464b39db42685387ae27dc24d69f417a32cfd03cee` re-binds the same raw SHA as 86.3-v1 (Path A re-uses 86.3-v1 raw run-3.json) to the v2.10 ship narrative — v2 classification deltas (cells #1/#2/#6 PASS_LOCKED promotions + cell #3 → SKIPPED + VOTE-05 removal) live in `diff-playwright-reports.ts` const arrays as the binding contract. Pool counts: 114 PASS_LOCKED + 3 DATA_RACE + 36 CASCADE + 4 SKIPPED = 157 tracked (operator-amended D-05 carried forward from Phase 86.3 D-06 RE-PLAN). Atomic constants regen: regen-constants.mjs reportPath repointed Phase 86 → Phase 87; PHASE 87 v2.10 SHIP ANCHOR jsdoc replaces PHASE 86.3 v2 ANCHOR block; IMGPROXY_TIED_TITLES match-count assertion 3 titles, 3 total matches ✓; CONTEXT.md D-04 stale const names corrected + v2-reshape note appended. /gsd-audit-milestone v2.10 verdict: tech_debt operator-accepted (`.planning/v2.10-MILESTONE-AUDIT.md`). 5 new v2.11+ todos filed: cell #3 mount-lifecycle, Phase 86/86.1/86.2 VERIFICATION.md backfill (the other 3 — qspec / party-drawer / voter-feedback — were pre-existing). KNOWN PATH A DEVIATION: parity-gate self-identity smoke FAILs structurally because 86.3-v1 raw data predates v2 classification promotions; documented in run-mode-decision.txt + audit doc. Phase 86 anchor 9a6d74a3088e… and Phase 86.3-v1 anchor bc1c94957b… both marked ABSORBED. **v2.10 milestone is SHIPPABLE** — operator next step: `/gsd-complete-milestone v2.10`.
- 2026-05-20 → 2026-05-21: Phase 86.3 v2 baseline reached. Original 2026-05-20 close (8-cell disposition: 3 FIX-PASS + 1 WONT-IMPLEMENT + 4 SKIP-FALLBACK) surfaced 3 downstream regressions during operator verification: voter-results fixture popup re-queue blocked by cell #3 reactive $effect; voter-matching helper drift (maxSteps:3 vs fixture's 6); voter-popup-hydration cold-deeplink race. Resolved 2026-05-20 → 2026-05-21 via four follow-up commits (`6d0914b22` untrack patch on cells #1+#2 topBar $effect; `0a34dfbc7` revert cell #3 reactive → onMount + restore skipReason; `52a2f077a` rewrite voter-popup-hydration via answeredVoterPage fixture, landing v2.11+ Recommendation #3 early; user-removed VOTE-05 partial-negative test from voter-matching helper). New 8-cell v2 disposition: 3 FIX-PASS (cells #1/#2/#6) + 1 WONT-IMPLEMENT (cell #4) + 4 PASS-WITH-DEFERRAL (cell #3 onMount-revert) + SKIP-FALLBACK (cells #5/#7/#8 — voter-app cold-deeplink race remains). Operator-verified 3 test suite runs: 0 fails + 4 hard-coded skips (cells #3, #5, #7, #8). 3-run cold-start gate ALMOST-STRICT (Phase 86 D-06 precedent extension; 8 diverging cells share ONE boundary-class cascade ancestor = DETERM-06 imgproxy + candidate-registration email-link timing). Anchor SHA: bc1c94957b8dcadfd79ff7464b39db42685387ae27dc24d69f417a32cfd03cee. SKIPPED_TESTS const composition on v2 baseline (2026-05-21): 4 entries — cell #3 candidate-settings notifications.voterApp (ADDED post-revert), cell #5 voter-feedback-persistence (kept), cell #7/#8 QSPEC-01/02 (kept). Cell #4 entry removed alongside spec deletion 2026-05-20. Cell #6 entry removed 2026-05-21 (test rewritten to use answeredVoterPage fixture — FIX-PASS). PASS_LOCKED 113 → 116 (+3 SETTINGS-01 wave A FIX-PASS). PHASE 86.3 ANCHOR jsdoc added to diff-playwright-reports.ts. D-06 Phase 87 disposition recommendation: **RE-PLAN** (CASCADE >> 5 hard fails Phase 87 Task 0 pre-gate; upstream voter-app cold-deeplink race materially changes anchor target; v2.11+ navigation-from-home redesign closes 4 cells in single fix paired with 86.3-04 Recommendation #3). Wave 1 SKIP-FALLBACK plans (02/03/04) + Wave 2 SKIP-FALLBACK on cells #7/#8 (Plan 05) demonstrate consistent SHIP-WITH-DEFERRAL pattern preserving gap-signals for v2.11+ pickup.

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
- [Phase ?]: Phase 86 Plan 01 (DETERM-12 popups+hydration+navigation cluster): 5/5 tests fixed (0 skips, 0 todos); cluster RCA lens (hydration timing + nav state propagation) held; CASCADE-unblock predicted for 4 CLEAN-02 sibling cells at Plan 04 gate
- [Phase 86]: Plan 02 (DETERM-13 filter+feedback cluster): 2/2 tests fixed (0 skips, 0 todos); 3-component CLAUDE.md Svelte 5 audit DISPROVED H2; Phase-64 close-race pattern toHaveCount(0) closed both surfaces
- [Phase ?]: Phase 86 Plan 03 (DETERM-14) closed: QSPEC-01+02 skip+rationale (Phase 75 inherit), voter-visibility-required project-config exclusion, voter-detail case (d) hydration guard. 4 commits, 1 new todo.
- [Phase 86]: Plan 04 (close orchestration) closed PASSED-WITH-DEFERRAL: 3-run cold-start gate ALMOST-STRICT (party-drawer boundary flake — 1 cell differs run-2 vs run-3); run-3 canonical regen source per Phase 85 precedent; new anchor `9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9` (113/3/40 + 2 SKIPPED); IMGPROXY_TIED_TITLES D-09 binding preserved (3 entries unchanged); SKIPPED_TESTS const introduced; FAILURE-CLASS narrative shrunk to 40-line header; 2 v2.11+ todos filed (qspec + party-drawer).
- [Phase ?]: Phase 86.2 Plan 01: 6 helpers extracted into tests/tests/helpers/; barrel + README; voter.fixture.ts public API preserved (internal swap to walkVoterIteration)
- [Phase ?]: Phase 86.2 Plan 01: Pitfall enforcement confirmed — #1 caller-side .catch on helper #1, internal on #3; #2 Select.svelte ARIA contract cited in helper #4 docstring; #3 default maxSteps=6 documented in helper #6 (Pitfall regression guard)
- [Phase ?]: Helpers #3-#6 propagation explicitly deferred to v2.11+ per RESEARCH (9 sites): different pattern shape (helper #3 — no destination predicate; helper #4 — named-combobox variants; helper #5 — non-count findData; helper #6 — answer-loop not Skip-Next-only).
- [Phase ?]: Negative-landing assertions (expect.not.toHaveURL) stay inline with // reason: comments — expectLandedOn is positive-only by design per helper Pitfall #1 docstring.
- [Phase ?]: Single-run full-suite smoke (NOT 3-run SHA-identity gate) is Plan 86.2-02 audit charter; Plan 86.2-03 owns the canonical 3-run gate against fresh post-86.2 anchor.
- [Phase 86.3 P01]: SETTINGS-01 wave A cells #1/#2/#3 closed via reactive $effect-driven `topBarSettings.revert(baseIdx)+push(next)` (Pitfall 1 guard) + $effect with `notificationQueued = $state(false)` fire-once guard (Pitfall 2 guard) on (voters)/+layout.svelte. +27 LOC; mirrors canonical pattern at appContext.svelte.ts:93-100. All 3 per-cell smokes OUTCOME: FIX-PASS. v2.11+ todo `2026-05-12-voters-layout-non-reactive-appsettings.md` CLOSED (moved to .planning/todos/done/).
- [Phase 86.3 P03]: E2E-03 / DETERM-13 cell #5 voter-feedback-persistence H2/H3 trace-driven disambiguation attempted per Phase 86.1-02 recommended-next-action #1. Trace shows verdict NEITHER — upstream `answeredVoterPage` fixture race (CASCADE-class, separate from DETERM-13) blocks H2/H3 disambiguation entirely (/questions intro page stuck at `Loading…` despite seeded data + clean Supabase REST 200/304/307). SKIP-FALLBACK applied per CONTEXT D-06; test signature surgically swapped `({ answeredVoterPage })` → `({ page })` to make `test.skip(true, …)` report as `1 skipped` instead of `1 failed`. ModalContainer.svelte UNCHANGED. v2.11+ todo augmented with REVISED recommended-next-action ordering (FIRST fix fixture race, THEN re-attempt H2/H3).
- [Phase 86.3 P04]: LAYOUT-03 / DETERM-12 cell #6 voter-popup-hydration Path 2 (`page.context().addInitScript`) attempted per RESEARCH §"Cell #6 Fix shapes §2". 1-line swap verified-applied but EMPIRICALLY DISPROVED: /results stalls at `Loading…` (15s timeout on voter-results-list testid; Supabase REST all-200; canonical /results/candidates frame URL; same upstream loader-race symptom as 86.3-03 /questions). Path 1 (`test.use({ storageState })`) abandoned at RESEARCH §"Pitfall 4" (static config vs runtime-discovered question UUIDs; alternative resolutions out of D-08 1h cap). SKIP-FALLBACK applied per CONTEXT D-06; Path 2 swap LEFT IN PLACE as evidence-of-attempt (Phase 86.1-03 cell 2 storage-clear pattern). v2.11+ todo voter-popup-hydration-layout-03-deeplink.md augmented 44 → 72 lines with Phase 86.3-04 attempt section + cross-ref to 86.3-03 trace; Recommendation #3 (navigation-from-home test) elevated to strongest v2.11+ next action. Production loader UNCHANGED per D-10 STRICT gate.
- [Phase 86.3 P02]: cell #4 SETTINGS-01 wave B constituency-filter — SUPERSEDED 2026-05-20 by operator WONT-IMPLEMENT decision. Constituency is navigation/scope, not a per-list filter. Spec block deleted from `tests/tests/specs/variants/constituency.spec.ts`; v2.11+ todo moved to `.planning/todos/done/2026-05-13-constituency-filter-product-gap.md` with WONT-FIX close note; SKIPPED_TESTS const entry removed; anchor jsdoc + cell #4 row marked WONT-IMPLEMENT in `diff-playwright-reports.ts`. (Original disposition: SKIP-FALLBACK via Path-C, Path-B rejected on reviewer-drift; that disposition is now historical.)
- [Phase 87]: Path A verbal-accept run-mode selected at Task 1a checkpoint (autonomous directive + commit 9ad802ec0 verbal verification audit basis); saves ~216 min vs Path B fresh 3-run gate. v2.10 ship anchor pinned at `bc1c94957b8dcadfd79ff7464b39db42685387ae27dc24d69f417a32cfd03cee` re-bound from 86.3-v1 raw data to v2.10 ship narrative. Operator-amended D-05 carried forward (CASCADE=36 + 4 SKIPPED accepted as documented v2.11+ deferrals). Audit-milestone v2.10 verdict: tech_debt operator-accepted; v2.10 SHIPPABLE; Phase 86/86.1/86.2 VERIFICATION.md backfill folded into v2.11+ tech_debt with new todo file. Cell #3 candidate-settings notifications.voterApp mount-lifecycle todo filed proactively per plan §6 expected new todo. KNOWN DEVIATION: parity-gate self-identity smoke FAILs structurally on Path A (76 regressions reported because 86.3-v1 raw data predates v2 classification promotions); const arrays correctly reflect v2 baseline (114/3/36/4 ✓); operator-accepted as known limitation of verbal-accept audit basis.
- [Phase 86.3 P05]: QSPEC-01/02 cells #7+#8 SKIP-FALLBACK — walkToQuestion helper-resilience fix LANDED in voterNavigation.ts:308-329 (defensive isVisible probe + conditional intro-CTA click; +13 LOC) but EMPIRICALLY INSUFFICIENT — cells #7/#8 fail at upstream `advanceVoterFlow` line 149 (5s race-checkpoint timeout) because /intro itself never paints (page renders only `Loading…`). Same upstream voter-app cold-deeplink loader race as Phase 86.3-03 cell #5 (/questions Loading…) + Phase 86.3-04 cell #6 (/results Loading…); 4-cell finding characterizes the race as SHARED voter-app cold-deeplink (NOT route-specific). Helper fix LEFT IN PLACE as evidence-of-attempt (mirrors 86.3-04 Path-2 pattern). 3-run cold-start gate: raw FAIL (3 hashes differ); operator-approved ALMOST-STRICT per Phase 86 D-06 precedent (8 diverging cells share ONE documented boundary-class cascade ancestor — DETERM-06 imgproxy CAND-03 + candidate-registration email-link timing); canonical run-3.json; anchor SHA bc1c94957b8dcadfd79ff7464b39db42685387ae27dc24d69f417a32cfd03cee. SKIPPED_TESTS const 2 → 5 entries (added cells #4/#5/#6; kept cells #7/#8); 3 SETTINGS-01 wave A cells moved CASCADE → PASS_LOCKED. PHASE 86.3 ANCHOR jsdoc added to diff-playwright-reports.ts. D-06 Phase 87 disposition recommendation: RE-PLAN (CASCADE >> 5 hard fails Phase 87 Task 0 pre-gate; upstream cold-deeplink race materially changes anchor target; v2.11+ navigation-from-home redesign closes 4 cells in single fix paired with 86.3-04 Recommendation #3).

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260522-mps | Generate e2e test catalog inventory for Phase 88 audit (38 specs, 173 tests in execution order) | 2026-05-22 | 7f11a2c25 | [260522-mps-generate-e2e-test-catalog-inventory-for-](./quick/260522-mps-generate-e2e-test-catalog-inventory-for-/) |

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue; carry-forward infrastructure debt. May affect any image-upload-touching E2E re-runs during Phase 79 verification (cold-start full-suite gate).
- 165 pre-existing intra-package circular deps in `@openvaa/data` / `matching` / `filters` — deferred to a dedicated structural refactor milestone.
- The candidate-profile cascading race (DETERM-04) is the v2.10 critical path — if root-cause investigation surfaces a deeper Svelte 5 hydration OR Supabase auth-session race that needs upstream framework work, fallback is the test-restructure path (split registration assertion into a setup project so downstream tests don't depend on the redirect succeeding). Both paths are documented in `.planning/todos/pending/2026-05-12-candidate-profile-cascading-race.md` §"Recommended approach".
- Phase 83 DETERM-06 image-upload (CAND-03) cascade blocks 3/4 Plan 86.2-01 per-spec smokes (candidate-profile-validation, voter-not-located-redirect, results-sections); refactors verified clean via grep + lint + tsc instead. Plan 86.2-03 3-run gate will surface true post-86.2 state.

## Session Continuity

Last session: 2026-05-23T (Plan 88-01 executed — status: partial)
Stopped at: **Plan 88-01 executed PARTIAL.** All 7 task commits landed (c713acf3e → 63ed2813d); scaffolding is structurally complete (baseV1 template @ 135 rows / setupFromTemplate helper / voter-mega fixture / mega-journey spec / 3 playwright projects / migration README). **BUT** the mega-journey spec has only 5 of ~30 refactor-doc:204-378 steps executing REAL assertions; 25 steps are `[deferred-88-nn]` placeholders pending empirical UI inspection of the baseV1 constituency-selection cluster (the `voter-missing-nominations-modal` intercepts naive "select first option" clicks; hierarchical-CG combobox ordering + nomination-availability gating need observation before lock-in). Plan Risks #2 + #7 sanctioned this fallback. **Parallel-only contract was breached during T5 — required a Rule-1 fix** (533c2bd42): `data-setup-baseV1` had to be chained `dependencies: ['variant-hidden-required-candidate']` because the shared `'test-'` row prefix collides with the existing chain mid-run. The fully-parallel goal moves to 88-NN via per-template prefix decoupling (`'test-baseV1-'` vs `'test-e2e-'`). Task 6 full-suite: isolated `--project=voter-mega-journey` (full graph) = **97/97 pass in 4.0 min**; full-suite `yarn test:e2e` = 87 pass / 1 fail / 3 skipped / 75 did_not_run (the 1 fail is `candidate-profile.spec.ts:130` pre-existing terms-checkbox flake, NOT caused by 88-01; per operator memory `feedback_e2e_did_not_run.md`, did_not_run counts as failure — so the cascade-skipped 75 are blocked by the pre-existing flake's cascade). 5 deviations + all 5 plan-check advisories documented in 88-01-SUMMARY.md. v2.10 milestone close + v2.11 rune migration kickoff remain BLOCKED behind Phase 88's final plan (which is now further out: 88-NN must close the deferred-88-nn cluster first).
Resume file: None
Next action: Operator decides Phase 87 disposition per Phase 86.3-05 D-06 recommendation:
  (a) **RE-PLAN (Claude's recommendation):** Re-plan Phase 87 to absorb v2.11+ voter-app cold-deeplink deferrals (4 cells #5/#6/#7/#8 closure-paired via navigation-from-home redesign) + boundary-class flake deferrals (DETERM-06 imgproxy + email-link timing) BEFORE firing the v2.10-ship anchor capture. Plan 87-01 needs a new Plan 01a (deferral inventory) + Plan 01b (anchor capture WITH explicit deferrals documented).
  (b) **DELAYED-FIRING (alternative):** Run Phase 87 against the ALMOST-STRICT post-86.3 anchor with explicit v2.11+ deferral documentation; accept that "all-green deterministic" is satisfied for SKIPPED + DATA_RACE pools but NOT for CASCADE pool (Phase 87 Task 0 pre-gate CASCADE ≤ 5 unsatisfied at CASCADE = 37 selective-regen-preserved OR 90 raw).
Reference: `.planning/phases/86.3-…/86.3-SUMMARY.md` §"D-06 Phase 87 Disposition Recommendation" for full rationale + suggested re-plan shape.

### Plan-count estimate (drafted 2026-05-12)

| Phase | Likely plan count | Notes |
|-------|-------------------|-------|
| 79 — Determinism Recovery | 2-4 plans | (1) DETERM-04 root-cause investigation + fix-or-restructure decision + implementation; (2) DETERM-04 verification (3-run cold-start identity); (3) DETERM-05 constants regen + commit; potentially (4) split if investigation surfaces a deeper Svelte 5 hydration OR Supabase auth-session race requiring its own plan. |
| 80 — A11Y Axe Cite-and-Fix | 1-2 plans | (1) shared-component fix for `aria-required-parent` + `list` (likely entity-card list); (2) drawer `button-name` aria-label additions. Could collapse into a single plan if surfaces are co-located. |
| 81 — A11Y-01 Email + URL Format Cells | 2-3 plans | (1) schema decision + `customData.format` enum + `INPUT_TYPES` email branch + i18n `invalidEmail`; (2) URL dispatch (subtype OR `customData.format='url'`) + fixture extension + spec cell 6; potentially (3) split if URL schema restoration requires more than a customData enum extension. |
| 82 — A11Y-01 Required-Empty Cell | 1 plan | Product decision at discuss-phase + (if REJECT) save-path validation + `required` i18n key + spec cell 4; lighter if decision is SOFT-WARN-ONLY (spec only). |

**Total v2.10 estimate:** ~6-10 plans across 4 phases. Risk: high on Phase 79 (race investigation may surface code-level bugs requiring framework or auth work); moderate on Phase 81 (schema decision drives implementation shape); low on Phases 80 + 82 (small focused fixes + product-decision-gated cell).

## Operator Next Steps

### Phase 88 status (Plan 88-02 ready)

**Plan 88-02 planned 2026-05-23**: Results route refactor (operator-driven, scoped from `88-02-SCOPE.md`). Introduces:
- New OPTIONAL route segment `[[electionTab]]` at the front of `/results/...` carrying the SELECTED singular election.
- Rename of `entityTypePlural`/`entityTypeSingular` directory segments to `entityTab`/`entity` (backed by `etPl`/`etSg` matchers).
- New voterContext reactive accessor `currentResultsElection` reading `page.params.electionTab` with first-available default-pick.
- Server-side guards (invalid `electionTab` → strip+redirect; 1-available → auto-redirect deterministic URL; 2+ → render existing picker).
- **NAME-DISJOINT dissociation** from the search-side `?electionId=…` / `electionId[]` AVAILABLE-array surface — `electionTab` (route key) and `electionId` (search key) are literally different identifiers throughout the codebase. Operator amended the original route-segment name from `electionId` to `electionTab` mid-planning to achieve structural (not just semantic) disjointness.
- 8 atomic tasks.

**88-01 carryover (still open):** 25 `[deferred-88-nn]` placeholders in `voter-mega-journey.spec.ts` await a follow-on plan (probably 88-03) that wires them against the NEW URL surface. Plan 88-02 unblocks ~5 of those placeholders (election-selection cluster) by making election selection URL-driven, but does NOT modify the mega-journey spec itself.

### Recommended next action

`/gsd-execute-phase 88` → runs Plan 88-02. Expected duration: significant (8 tasks; full route refactor + voterContext + server-guards + spec URL audits + full-suite regression). Atomic commits per task; existing suite must stay green at every commit. The known Plan 88-01 deviation T5 (sequential baseV1 chain dep on `variant-hidden-required-candidate`) was already manually unwound by operator earlier in the session.

### Other Phase 88 backlog (after 88-02 closes)

- **88-NN parallel-decoupling**: per-template prefix (`'test-baseV1-'` vs `'test-e2e-'`) so baseV1 chain can run truly in parallel without the current sequential dep on `variant-hidden-required-candidate` (Deviation T5).
- **88-NN absorb refactor-doc lines 379+** (specs not yet organized into the mega-journey).
- **88-NN retire `--likert-only` flag** once last consumer migrates.
- **88-NN retire per-variant setup files** once `setupFromTemplate` consumes them all.
- **88-LAST final v2.10-close anchor capture** against the post-audit catalog (3-run cold-start gate); replaces Phase 87 anchor.

### Cross-milestone holds (unchanged)

- **v2.10 milestone close** (`/gsd-complete-milestone v2.10`) remains BLOCKED behind Phase 88 final plan.
- **v2.11 rune migration kickoff** (Wave 1 leaf-context migrations) remains BLOCKED behind Phase 88 final plan.

### Pre-existing flake to surface separately

`candidate-profile.spec.ts:130` (terms-checkbox visibility race) is the primary cascade driver in full-suite runs (75 did_not_run in Plan 88-01's Task 6 Run #3). NOT caused by 88-01. Operator memory `project_all_green_suite_priority.md` flags this as v2.10 priority — likely a follow-up plan within Phase 88 or a sibling phase. Consider whether 88-02 absorbs it or if it gets its own plan.
