---
gsd_state_version: 1.0
milestone: v2.8
milestone_name: Alliance Card + Frontend Hygiene Sweep
status: executing
stopped_at: Phase 70 context confirmed (already gathered 2026-05-09)
last_updated: "2026-05-09T19:36:17.839Z"
last_activity: 2026-05-09
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 10
  completed_plans: 7
  percent: 70
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-08)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Phase 70 — svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup

## Current Position

Phase: 70 (svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup) — EXECUTING
Plan: 3 of 5
Status: Ready to execute
Last activity: 2026-05-09

## Performance Metrics

**Cumulative:**

- Milestones shipped: 12 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1, v2.3, v2.4, v2.5, v2.6, v2.7) + 1 paused (v2.2)
- Total plans completed: 210 + 6 tasks (v2.7 added 9 plans)
- Timeline: 41 days across 5 work windows (2026-03-01 → 2026-03-28 + v2.5 2026-04-23→24 + v2.6 2026-04-24→28 + v2.7 2026-04-29→05-08)
- v2.7 specifically: 4 phases (65-68), 9 plans, 28 tasks across 9 days

## Deferred Items

Snapshot taken at v2.7 milestone close on 2026-05-08. v2.8 requirements consume four of the listed pending todos directly (alliance card render, warning sweep, app-shared paradigm, mergeSettings shim, bind-rationale cleanup) plus the 95-error frontend lint deferral and the supabase lint-script rename — those will be removed from `.planning/todos/pending/` (or marked resolved) at v2.8 milestone close.

| Category | Item | Status / Notes |
|----------|------|----------------|
| todo | 2026-03-28-generalize-candidate-app-to-party-app.md | ui — future party-app variant; not v2.8 |
| todo | 2026-03-28-investigate-migrating-candidate-answer-store.md | ui — architectural investigation; not v2.8 |
| todo | 2026-04-25-normalise-app-shared-paradigm.md | **v2.8 Phase 72 / SHARED-01** — mapped |
| todo | 2026-04-25-remove-mergesettings-reexports.md | **v2.8 Phase 72 / SHARED-02** — mapped |
| todo | 2026-04-27-extend-e2e-filter-type-coverage.md | medium — v2.9 E2E coverage milestone |
| todo | 2026-04-27-remove-e2e-skip-modifiers.md | medium — v2.9 E2E coverage milestone |
| todo | 2026-04-28-cleanup-nominations-table.md | DB-01 — deferred 2026-04-29; user opted to keep table as is |
| todo | 2026-04-30-alliance-tab-rendering-and-sections-config.md | **v2.8 Phase 69 / ALLIANCE-01** (Lane A) — mapped |
| todo | 2026-05-08-cleanup-65-01-bind-rationale-comments.md | **v2.8 Phase 70 / BIND-01** — mapped |
| todo | 2026-05-08-expander-state-referenced-locally.md | superseded by `2026-05-08-results-layout-missing-slot-render-tag.md` (kept for history) |
| todo | 2026-05-08-results-layout-missing-slot-render-tag.md | **v2.8 Phase 70 / WARN-01** (Categories A/B/C) — mapped |
| todo | adapter-package-loading.md | medium — tsconfig-based importable adapter; not v2.8 |
| todo | check-candidate-distribution.md | low — default seed candidate spread follow-up |
| todo | configurable-mock-data.md | medium — Supabase GENERATE_MOCK_DATA env replacement |
| todo | frontend-project-id-scoping.md | architecture — multi-tenant prep; v2.9 candidate (paired with results-url-refactor-followups) |
| todo | password-reset-code-method.md | candidate-app auth flow; Strapi-era leftover |
| todo | register-page-registrationkey-method.md | candidate-app auth flow; Strapi-era leftover |
| todo | rename-admin-writer.md | dev-seed internal API hygiene; low priority |
| todo | results-url-refactor-followups.md | architecture — sharable URLs; v2.9 candidate (paired with frontend-project-id-scoping) |
| todo | session-storage-election-constituency.md | partly mitigated by v2.6 Phase 62 URL-based election scoping |
| todo | sql-linting-formatting.md | CI hygiene; not v2.8 (LINT-01 is the supabase-package script rename, not the linter itself) |
| carry-forward | 95 pre-existing apps/frontend ESLint errors (Option C deferral from v2.7 Phase 68) | **v2.8 Phase 71 / TYPING-01** — mapped (source: `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md`) |
| carry-forward | @openvaa/supabase lint-script rename | **v2.8 Phase 72 / LINT-01** — mapped |
| carry-forward | 165 pre-existing intra-package circular deps (data/matching/filters internal.ts barrel pattern) | Out of v2.8 scope; dedicated structural refactor milestone |
| infrastructure | Local imgproxy Docker container 502 on image upload (intermittent) | Not a code issue; fix with `supabase stop && supabase start`. Carried forward. |

**Pending todo count at v2.7 close:** 18 (v2.8 will resolve 5 of these — 2026-04-25-normalise-app-shared-paradigm, 2026-04-25-remove-mergesettings-reexports, 2026-04-30-alliance-tab-rendering-and-sections-config, 2026-05-08-cleanup-65-01-bind-rationale-comments, 2026-05-08-results-layout-missing-slot-render-tag — plus the supersedes-relationship retire of 2026-05-08-expander-state-referenced-locally).
| Phase 72 P01 | 25 | 3 tasks | 8 files |
| Phase 72 P02 | 3 | 3 tasks | 3 files |
| Phase 72 P03 | 3 | 3 tasks | 3 files |
| Phase 69 P1 | 75 | 9 tasks | 32 files |
| Phase 70 P01 | 9min | 5 tasks | 5 files |
| Phase 70 P02 | 4min | 2 tasks | 1 files |

## Accumulated Context

### Roadmap Evolution

- 2026-04-28: v2.6 Svelte 5 Migration Cleanup shipped. 5 phases (60-64), 18 plans, 48 tasks, 4 days. Tagged `v2.6` and archived to `.planning/milestones/v2.6-*`. Phase directories archived under `.planning/milestones/v2.6-phases/`.
- 2026-04-29: v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends roadmap drafted. Phase 66 scope narrowed mid-discussion (DB-01 deferred per user; `nominations` table kept as is). Final shape: 4 phases (65-68), 9 plans.
- 2026-05-08: v2.7 shipped. 4 phases (65-68), 9 plans, 28 tasks across 9 days. Audit verdict `tech_debt` (8/8 reqs wired; 3 documented deferrals: alliance card render, 95 frontend lint errors via Option C, `@openvaa/supabase` lint-script rename). Tagged `v2.7` and archived to `.planning/milestones/v2.7-*`.
- 2026-05-08: v2.8 Alliance Card + Frontend Hygiene Sweep scoped. 7 requirements across 6 categories (ALLIANCE / WARN / BIND / TYPING / SHARED ×2 / LINT). E2E coverage workstream and sharable-URLs / multi-tenant pair both deferred to v2.9 candidates. E2E test inventory captured at `.planning/notes/2026-05-08-e2e-test-inventory.md` for v2.9 user-led audit.
- 2026-05-08: v2.8 ROADMAP.md drafted. 4 phases (69-72), 7 requirements mapped 1:1 (no orphans, no duplicates):
  - **Phase 69 — Alliance Card Lane A** (ALLIANCE-01): single small UI feature; reconciles v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS
  - **Phase 70 — Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup** (WARN-01, BIND-01): two requirements paired per cohesion guidance — both touch `apps/frontend/src/lib/**/*.svelte`, both are Svelte 5 hygiene
  - **Phase 71 — Frontend Strict-Typing Cleanup** (TYPING-01): standalone — 95 ESLint errors warrant phase isolation from the warning sweep that touches the same files
  - **Phase 72 — Package Hygiene Trio** (SHARED-01, SHARED-02, LINT-01): three package-level cleanups bundled — mirrors v2.7 Phase 68 Dev-Tooling Trio pattern
- Phase numbering continues from v2.7 (last phase: 68); v2.8 starts at 69. No reset.
- Plan count is TBD per phase (filled by `/gsd-plan-phase`); estimate ~2-4 plans per phase, ~10-14 plans total across the milestone.

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key cross-milestone reference points carried forward into v2.8:

- `@openvaa/dev-seed` is the canonical data path for both dev and E2E. The default seed at v2.7-close ships 2 alliances + 10 alliance-noms + 30/10 org-nom parent split — v2.8 Phase 69 consumes this directly.
- Playwright parity baseline at v2.7 close: `67p / 1f / 34c` carrying forward from the v2.6 anchor at HEAD `2c7ad2dea`. v2.8 must not regress this baseline.
- Supabase adapter reverse-fills `organizationNominationIds` on `Alliance` parents (the v2.6 P64 Plan 01 path) — empirically exercised since v2.7 SEED-01 but the *render path* is what Phase 69 actually closes.
- CLAUDE.md "Context Destructuring Rule (Svelte 5)" subsection (codified in v2.7 Phase 65) is the permanent reference that BIND-01 (Phase 70) relies on — the inline rationale comments are removable precisely because the rule is documented structurally.
- v2.7 Phase 68 Option C: 95 pre-existing `apps/frontend/` ESLint errors deferred to v2.8 with the explicit handoff in `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md`. v2.8 Phase 71 / TYPING-01 owns this resolution.
- v2.6 Phase 63 Plan 01 hoisted `mergeSettings` + `DeepPartial` to `@openvaa/app-shared`; the `apps/frontend/src/lib/utils/merge.ts` re-export shim was added as a transitional measure. v2.8 Phase 72 / SHARED-02 retires that shim.
- `@openvaa/app-shared` divergence from the canonical core/data/matching/filters paradigm has been on the pending-todo list since 2026-04-25; v2.8 Phase 72 / SHARED-01 normalises it.
- `@openvaa/supabase` `yarn supabase:lint` script semantics are SQL-only (sqlfluff) but the script name conflates with the monorepo's JS/TS `lint:check` convention. v2.8 Phase 72 / LINT-01 disambiguates.
- All v2.8 work is frontend / package-level — NO Supabase migrations, NO E2E coverage expansion (E2E is v2.9 anchor).
- [Phase ?]: Phase 72 Plan 01 — Option A taken for CLAUDE.md anchor (D-03 default). Net +2 lines in CLAUDE.md.
- [Phase ?]: Phase 72 Plan 01 — Dual-build justification rewritten to 'future-compatibility hedge' language per RESEARCH A1 flag.
- [Phase 72 Plan 02]: Cosmetic import merge applied — combined `DeepPartial` with existing `VideoContent` type-import (both from `@openvaa/app-shared`) in both `layoutContext.svelte.ts` and `layoutContext.type.ts`. Auto-sorted by `simple-import-sort/imports` during eslint --fix.
- [Phase 72 Plan 02]: D-07 audit confirmed only `apps/frontend/src/lib/utils/merge.ts` qualified as a shape-equivalent re-export shim; no follow-up todo needed.
- [Phase 72 Plan 03]: D-02 hard rename completed — `yarn supabase:lint` now errors with "Couldn't find a script named 'supabase:lint'" (no deprecated alias). New target: `yarn supabase:lint:sql`.
- [Phase 72 Plan 03]: RESEARCH-verified non-edits held — zero changes to `turbo.json` or `.github/workflows/`. Turborepo's lint task is script-existence-driven; supabase workspace drops out of the JS lint fan-out cleanly with `<NONEXISTENT>` placeholder (no failing task).
- [Phase 72 Plan 03]: ROADMAP SC-3 satisfied — `yarn lint:check` no longer invokes `supabase db lint` (verified by output grep returning 0).
- [Phase 70 Plan 01]: Option A applied uniformly to all 9 Cat A state_referenced_locally sites — no Option B flips. Default per RESEARCH.md verdict held.
- [Phase 70 Plan 01]: Diff is comment-only — every offending line preserved verbatim, only preceded by a 2-3 line prose+ignore preamble. Manual reactivity smoke deferred to /gsd-verify-work 70 cold-start protocol.
- [Phase 70]: Plan 02 — Pattern 2 (3-part Snippet patch) applied verbatim to WithPolling.svelte; Cat B surface fully resolved (1 site → 0 warnings).
- [Phase 70]: Plan 02 — Did NOT touch startPolling()/onDestroy() lifecycle; Plan-70-04 (Wave 2) owns the SSR fetch-eagerness fix per RESEARCH.md wave-1/wave-2 sequencing.
- [Phase 70]: Plan 02 — Manual children-render smoke deferred to phase-close /gsd-verify-work 70 cold-start protocol per CONTEXT.md D-04 (same handling as Plan 70-01).

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue; carry-forward infrastructure debt.
- 165 pre-existing intra-package circular deps in `@openvaa/data` / `matching` / `filters` — deferred to a dedicated structural refactor milestone.
- v2.8 risk profile is uniformly low: 1 small UI feature + 4 hygiene phases. No DB migrations, no public-API changes, no upstream dependencies. Phases can be discussed and planned in parallel per the v2.8 PROJECT.md note.

## Session Continuity

Last session: 2026-05-09T19:32:52.889Z
Stopped at: Phase 70 context confirmed (already gathered 2026-05-09)
Resume file: None
Next action: Run `/gsd-verify-work 69` to confirm phase verification. Outstanding follow-ups: (a) Playwright parity-gate capture (deferred from Plan 02 Task 6 because user's `yarn dev` was active during smoke; tracked at `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md`), (b) broader imputation-paradigm refactor (v2.9+ candidate; tracked at `.planning/todos/pending/2026-05-09-rewrite-parent-answer-imputation.md`). Then proceed to `/gsd-plan-phase 70`.

### Plan-count estimate (drafted 2026-05-08)

| Phase | Likely plan count | Notes |
|-------|-------------------|-------|
| 69 — Alliance Card Lane A | 2 plans | (1) EntityCard subentities branch + cardContents widening; (2) drawer wiring + manual smoke + parity verification |
| 70 — Warning Sweep + bind-rationale Cleanup | 2-3 plans | (1) Category A — `state_referenced_locally` rewrites; (2) Categories B + C — missing-render + a11y; (3) bind-comment strip + verification (may collapse 1+3 if scope is small) |
| 71 — Frontend Strict-Typing Cleanup | 2-3 plans | (1) `no-explicit-any` 67-error sweep; (2) `naming-convention` + `func-style` + long-tail; (3) verification (may collapse 2+3) |
| 72 — Package Hygiene Trio | 3 plans | (1) SHARED-01 — `@openvaa/app-shared` paradigm; (2) SHARED-02 — `mergeSettings` shim retire; (3) LINT-01 — `@openvaa/supabase` lint-script rename — same shape as v2.7 Phase 68 trio |

**Total v2.8 estimate:** ~9-11 plans across 4 phases. Risk: low (uniformly small phases, no DB migration, no breaking-API change).

## Operator Next Steps

- Run `/gsd-verify-work 69` to confirm phase verification, then proceed to `/gsd-plan-phase 70`.
- Outstanding Phase 69 follow-ups (do not block Phase 69 close; tracked in `.planning/todos/pending/`):
  - Playwright parity-gate capture (deferred during Plan 02 Task 6 because `yarn dev` was running for the smoke).
  - Broader imputation-paradigm refactor (v2.9+ candidate; Phase 69's proxy-children extension is a partial step).
- Reminder: Commits in this repo must use `git -c core.hooksPath=/dev/null` until global config is fixed (`project_gsd_repo_hook_workaround.md`).
