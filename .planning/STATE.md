---
gsd_state_version: 1.0
milestone: v2.6
milestone_name: Svelte 5 Migration Cleanup
status: planning
stopped_at: Phase 62 context gathered
last_updated: "2026-04-24T16:10:00.593Z"
last_activity: 2026-04-24
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-24)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Phase 60 — Layout Runes Migration & Hydration Fix

## Current Position

Phase: 61
Plan: Not started
Status: Ready to plan
Last activity: 2026-04-24

Progress: [██████████] 100%

## Performance Metrics

**Cumulative:**

- Milestones shipped: 9 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1, v2.3, v2.4, v2.5) + 1 paused (v2.2)
- Total plans completed: 177 + 6 tasks
- Timeline: 28 days (2026-03-01 to 2026-03-28) + v2.5 (2 days 2026-04-23→24)

## Deferred Items

Items acknowledged and deferred at v2.5 milestone close on 2026-04-24. v2.6 picks up most of the Svelte 5 items directly; the rest remain deferred.

| Category | Item | Status / Notes |
|----------|------|----------------|
| todo | 2026-03-28-generalize-candidate-app-to-party-app.md | ui — future party-app variant |
| todo | 2026-03-28-investigate-migrating-candidate-answer-store.md | ui — architectural investigation |
| todo | adapter-package-loading.md | medium — tsconfig-based importable adapter (v2.x) |
| todo | check-candidate-distribution.md | low — default seed candidate spread follow-up |
| todo | configurable-mock-data.md | medium — Supabase GENERATE_MOCK_DATA env replacement |
| todo | entity-list-controls-infinite-loop.md | **Active in v2.6 Phase 62 (RESULTS-01/02/03)** |
| todo | frontend-project-id-scoping.md | architecture — multi-tenant prep |
| todo | password-reset-code-method.md | candidate-app auth flow |
| todo | register-page-registrationkey-method.md | candidate-app auth flow |
| todo | rename-admin-writer.md | dev-seed internal API hygiene |
| todo | root-layout-runes-migration.md | **Active in v2.6 Phase 60 (LAYOUT-01/02/03)** |
| todo | session-storage-election-constituency.md | frontend session handling |
| todo | sql-linting-formatting.md | CI hygiene |
| todo | svelte5-cleanup.md | **Active in v2.6 Phase 61 (QUESTION-01/02/03)** |
| todo | svelte5-hydration-effect-then-bug.md | **Active in v2.6 Phase 60 (LAYOUT-02)** |
| carry-forward | 10 data-race E2E failures (post-Phase 59 baseline SHA 3c57949c8) | **Active in v2.6 Phase 63 (E2E-01)** |
| carry-forward | 38 cascade E2E failures (post-Phase 59 baseline SHA 3c57949c8) | **Active in v2.6 Phase 63 (E2E-01)** |
| carry-forward | 165 pre-existing intra-package circular deps (data/matching/filters internal.ts barrel pattern) | Out-of-scope per v2.6 REQUIREMENTS.md §Future; dedicated refactor milestone |
| Phase 60 P01 | 3m 25s | 3 tasks | 3 files |
| Phase 60 P02 | 25m 9s | 2 tasks | 2 files |
| Phase 60 P03 | 24m 16s | 3 tasks | 1 files |
| Phase 60 P04 | 35m | 3 tasks | 5 files |
| Phase 60 P05 | 9m 50s | 3 tasks | 4 files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key context for v2.6:

- Milestone scope is bug-fix + migration-cleanup only — no new features.
- Phase numbering continues from v2.5 (last phase: 59); v2.6 spans Phases 60-63.
- Phase shape: 60 = layout runes migration + hydration fix (LAYOUT trio), 61 = voter-app question flow (QUESTION trio, Phase 58 UAT surfaces), 62 = results page consolidation (RESULTS trio, single-pass refactor), 63 = E2E carry-forward greening + e2e template `app_settings` extension.
- LAYOUT-02 hydration bug is explicitly outcome-based in the success criterion ("layout renders post-hydration on full page loads") — the root-layout-runes-migration.md todo lists 6 approaches already tried that don't work, so prescribing a mechanism here would be premature; phase execution picks the working approach.
- E2E-01 success criterion cites the post-v2.5 baseline on SHA `3c57949c8` (10 data-race + 38 cascade out of 89 total) as the reference point — this is the tally carried forward from Plan 59-05 fix-forward, not the earlier SHA `f09daea34` pre-swap numbers.
- E2E-02 is low-risk template-scoped work — the e2e template shape is already locked from Phase 58, so extension is additive.
- RESULTS-01/02/03 map into one phase because entity-list-controls-infinite-loop.md explicitly describes them as a single 5-step pass (merge, $derived refactor, page.svelte removal, route params optional, filters re-enabled).
- B-3 Option A preflight: PASS — diff script treats out-of-baseline tests as neutral/additive (Plan 60-05 no re-embed needed)
- W-5 constant-count preflight: DRIFT (baseline=89 vs constants=67, 22-test gap) — Plan 60-05 should inspect gap before re-capture
- D-09 voter-popup-hydration.spec.ts scaffolded as test.skip (not test.fixme per W-2) with Plan 60-04 Task 1 handoff breadcrumb
- Discriminated-union $derived.by for loader-data validation: avoids intermediate $state flags that introduce microtask races during SSR hydration (Plan 60-02)
- SSR guards in client-only utilities: typeof window/navigator checks in getEmailUrl — pattern for any util called from a component that might render server-side after reactivity timing changes (Plan 60-02 Rule-3 fix)
- Svelte 5: `$storeName.update(() => ...)` inside `$effect` causes `effect_update_depth_exceeded` infinite loop (store auto-subscription + subscribe-notify + version++ $state cycle). Workaround: `get(store)` + `untrack(() => ...)` — discovered Plan 60-03 Task 2.
- LAYOUT-02 protected-layout hydration fix landed on primary $derived approach (no D-02 wrapper-component fallback needed) — auth-setup + candidate-auth valid-login PASS; the 2 named target tests cascade-blocked behind orthogonal candidate-questions failures handed off to Plan 60-05
- D-14 LAYOUT-03 outcome: deleted (PopupRenderer wrapper removed; inline popup rendering via fromStore + @const Component pattern passes D-09 empirical gate)
- Svelte 5 runes pitfall: fromStore-bridged store mutation (dataRoot.current.update()) inside $effect triggers effect_update_depth_exceeded. Workaround: get(storeName) + untrack(() => ...). Applied in root +layout.svelte (60-04) after 60-03 applied the same pattern to candidate protected layout.
- Phase 60 SC-4 parity gate: PARITY GATE: FAIL (24 regressions) but all Category A (orthogonal, surfaced-not-introduced by LAYOUT-02 fix); Phase 60 requirements LAYOUT-01/02/03 satisfied by alternative evidence; pending_review: true flagged for user inspection
- W-5 disposition CORRECTED in Plan 60-05: Plan 60-01's '22-test gap / DRIFT' was arithmetic error (undercounted CASCADE_TESTS as 16; actual 25); real gap is 89-76=13 which exactly matches the 13 SOURCE_SKIP tests; no drift, constants complete, no re-embed needed
- Candidate-questions testId timeout surface (6 direct failures + 18 cascade skips) handed off to Phase 61 — root cause is candidate-questions-list/candidate-questions-start testIds never becoming visible on /candidate/questions; pre-existing but previously masked by LAYOUT-02 stuck-at-Loading symptom

### Pending Todos

5 pending todos are active in v2.6 phases (see Deferred Items table); 10 others remain deferred.

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue.
- Upstream Svelte 5 hydration bug (LAYOUT-02) may not have a clean in-userland fix — REQUIREMENTS.md §Out of Scope authorises shipping the best available workaround + filing upstream if no root-cause fix exists.
- 165 pre-existing intra-package circular deps in `@openvaa/data`/`matching`/`filters` — explicitly out of v2.6 scope; deferred to a dedicated structural refactor milestone.

## Session Continuity

Last session: --stopped-at
Stopped at: Phase 62 context gathered
Resume file: --resume-file
Next action: `/gsd-plan-phase 60` — plan Phase 60 (Layout Runes Migration & Hydration Fix, LAYOUT-01/02/03)

**Planned Phase:** 60 (Layout Runes Migration & Hydration Fix) — 5 plans — 2026-04-24T10:09:52.232Z
