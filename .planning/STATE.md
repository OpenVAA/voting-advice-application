---
gsd_state_version: 1.0
milestone: v2.9
milestone_name: E2E Coverage + Suite Determinism — PLANNING
status: executing
stopped_at: Phase 75 context gathered
last_updated: "2026-05-11T17:22:12.578Z"
last_activity: 2026-05-11
progress:
  total_phases: 10
  completed_phases: 2
  total_plans: 16
  completed_plans: 14
  percent: 88
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-10)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Phase 75 — question-rendering-specs

## Current Position

Phase: 75 (question-rendering-specs) — EXECUTING
Plan: 2 of 3
Status: Ready to execute
Last activity: 2026-05-11

## Performance Metrics

**Cumulative:**

- Milestones shipped: 13 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1, v2.3, v2.4, v2.5, v2.6, v2.7, v2.8) + 1 paused (v2.2)
- Total plans completed: 229 + 6 tasks (v2.8 added 13 plans)
- Timeline: 43 days across 6 work windows (2026-03-01 → 2026-03-28 + v2.5 2026-04-23→24 + v2.6 2026-04-24→28 + v2.7 2026-04-29→05-08 + v2.8 2026-05-08→10)
- v2.7 specifically: 4 phases (65-68), 9 plans, 28 tasks across 9 days
- v2.8 specifically: 4 phases (69-72), 13 plans, ~37 tasks across 3 days (uniformly low risk — 1 small UI feature + 4 hygiene phases)

## Deferred Items

Snapshot taken at v2.8 milestone close on 2026-05-10. v2.9 requirements consume nine of the listed pending todos directly (skip-modifier sweep, playwright-hygiene-sweep, filter-type coverage, dev:* → db:* rename, voter-not-located redirect, D-04 distribution, setStore cast cleanup, CLAUDE.md warning-accepted anchor, i18n wrapper tightening) — those will be removed from `.planning/todos/pending/` (or marked resolved) at v2.9 milestone close.

| Category | Item | Status / Notes |
|----------|------|----------------|
| todo | 2026-04-27-extend-e2e-filter-type-coverage.md | **v2.9 Phase 77 / SETTINGS-01** — folded into the toggle matrix |
| todo | 2026-04-27-remove-e2e-skip-modifiers.md | **v2.9 Phase 73 / DETERM-01** — mapped |
| todo | 2026-05-10-tests-playwright-hygiene-sweep.md | **v2.9 Phase 73 / DETERM-03** — mapped (paired with DETERM-02) |
| todo | 2026-05-10-rename-package-scripts-dev-to-db.md | **v2.9 Phase 78 / CLEAN-01** — mapped |
| todo | 2026-05-10-redirect-unlocated-voter-to-selectors.md | **v2.9 Phase 78 / CLEAN-02** — mapped |
| todo | 2026-05-10-d04-per-cast-reason-distribution.md | **v2.9 Phase 78 / CLEAN-03** (sub-finding 1) — mapped |
| todo | 2026-05-10-getroute-setstore-cast-cleanup.md | **v2.9 Phase 78 / CLEAN-03** (sub-finding 2) — mapped |
| todo | 2026-05-09-claude-md-svelte-warning-accepted-format.md | **v2.9 Phase 78 / CLEAN-03** (sub-finding 3) — mapped |
| todo | 2026-05-09-tighten-i18n-wrapper.md | **v2.9 Phase 78 / CLEAN-04** — mapped (paired with E2E-08) |
| todo | 2026-05-10-incorporate-luxembourg-and-danish-vaa-changes.md | Deferred to a separate milestone — deltas unscoped |
| todo | 2026-04-28-cleanup-nominations-table.md | DB-01 — deferred 2026-04-29; user opted to keep table as is |
| todo | 2026-03-28-generalize-candidate-app-to-party-app.md | future party-app variant; not v2.9 |
| todo | 2026-03-28-investigate-migrating-candidate-answer-store.md | architectural investigation; not v2.9 |
| todo | adapter-package-loading.md | medium — tsconfig-based importable adapter; not v2.9 |
| todo | check-candidate-distribution.md | low — default seed candidate spread follow-up |
| todo | configurable-mock-data.md | medium — Supabase GENERATE_MOCK_DATA env replacement |
| todo | frontend-project-id-scoping.md | architecture — multi-tenant prep; v2.10 candidate (paired with results-url-refactor-followups) |
| todo | password-reset-code-method.md | candidate-app auth flow; Strapi-era leftover |
| todo | register-page-registrationkey-method.md | candidate-app auth flow; Strapi-era leftover |
| todo | rename-admin-writer.md | dev-seed internal API hygiene; low priority |
| todo | results-url-refactor-followups.md | architecture — sharable URLs; v2.10 candidate |
| todo | session-storage-election-constituency.md | partly mitigated by v2.6 Phase 62 URL-based election scoping |
| todo | sql-linting-formatting.md | CI hygiene; not v2.9 |
| todo | 2026-05-09-rewrite-parent-answer-imputation.md | matching-package internal; future matching-focused milestone |
| carry-forward | 19 pre-existing data-loading race E2E failures (PROJECT.md "Future") | **v2.9 Phase 73 / DETERM-02** — mapped |
| carry-forward | 165 pre-existing intra-package circular deps (data/matching/filters internal.ts barrel pattern) | Out of v2.9 scope; dedicated structural refactor milestone |
| carry-forward | Cite-and-fix WCAG violations from v2.9 A11Y-03 axe smoke first-run | Tracked as follow-up todo at A11Y-03 close; not v2.9 scope |
| infrastructure | Local imgproxy Docker container 502 on image upload (intermittent) | Not a code issue; fix with `supabase stop && supabase start`. Carried forward. |

**Pending todo count at v2.9 planning start:** 18 (v2.9 will resolve 9 of these — see "v2.9 maps to" rows above; 1 deferred to a separate milestone; 8 remain pending into v2.10+ or backlog).
| Phase 73 P01 | 18min | 3 tasks | 5 files |
| Phase 74 P03 | 45min | 2 tasks | 2 files |
| Phase 74 P01 | 2134 | 1 tasks | 3 files |
| Phase 74 P02 | 37min | 3 tasks | 4 files |
| Phase 74 P05 | 120min | 2 tasks | 5 files |
| Phase 74 P04 | 85min | 4 tasks | 9 files |
| Phase 74 P07 | 25200 | 5 tasks | 13 files |
| Phase 75 P01 | 18min | - tasks | - files |

## Accumulated Context

### Roadmap Evolution

- 2026-04-28: v2.6 Svelte 5 Migration Cleanup shipped. 5 phases (60-64), 18 plans, 48 tasks, 4 days. Tagged `v2.6` and archived to `.planning/milestones/v2.6-*`. Phase directories archived under `.planning/milestones/v2.6-phases/`.
- 2026-04-29: v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends roadmap drafted. Phase 66 scope narrowed mid-discussion (DB-01 deferred per user; `nominations` table kept as is). Final shape: 4 phases (65-68), 9 plans.
- 2026-05-08: v2.7 shipped. 4 phases (65-68), 9 plans, 28 tasks across 9 days. Audit verdict `tech_debt` (8/8 reqs wired; 3 documented deferrals: alliance card render, 95 frontend lint errors via Option C, `@openvaa/supabase` lint-script rename). Tagged `v2.7` and archived to `.planning/milestones/v2.7-*`.
- 2026-05-08: v2.8 Alliance Card + Frontend Hygiene Sweep scoped. 7 requirements across 6 categories (ALLIANCE / WARN / BIND / TYPING / SHARED ×2 / LINT). E2E coverage workstream and sharable-URLs / multi-tenant pair both deferred to v2.9 candidates.
- 2026-05-08: v2.8 ROADMAP.md drafted. 4 phases (69-72), 7 requirements mapped 1:1 (no orphans, no duplicates).
- 2026-05-10: v2.8 shipped. 4 phases (69-72), 13 plans, ~37 tasks across 3 days. Bundled parity gate PASSED. Phase numbering continues from 72 → v2.9 starts at 73. v2.9 framing inputs captured (E2E coverage inventory + 6 new pending todos + 3 carry-forward todos).
- 2026-05-10: v2.9 E2E Coverage + Suite Determinism roadmap drafted. **6 phases (73-78), 23 requirements mapped 1:1 across 6 categories (DETERM ×3 / E2E ×8 / QSPEC ×2 / A11Y ×3 / SETTINGS ×3 / CLEAN ×4):**
  - **Phase 73 — Determinism Baseline** (DETERM-01, DETERM-02, DETERM-03): hard prerequisite for Phases 74-77. Skip-modifier sweep + 19 data-loading races + 98 playwright/* warnings.
  - **Phase 74 — High-Leverage E2E Coverage** (E2E-01..E2E-08): 8 high-leverage gaps in one phase, content-heavy. Depends on Phase 73 GREEN.
  - **Phase 75 — Question-Rendering Specs** (QSPEC-01, QSPEC-02): 2 focused user-story specs. Parallel with 74 after 73.
  - **Phase 76 — Profile + A11y** (A11Y-01, A11Y-02, A11Y-03): profile validation + reload-persistence + axe wiring. Parallel with 74 after 73.
  - **Phase 77 — Settings Matrix + Question-Customization Gap-Fills** (SETTINGS-01, SETTINGS-02, SETTINGS-03): toggle matrix + allowOpen + visibility/required. Parallel with 74 after 73.
  - **Phase 78 — Cleanup Hygiene Phase** (CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04): bundled like v2.7 P68 / v2.8 P72 trio. Independent of 73 — may run in parallel with 74-77. CLEAN-04 ↔ E2E-08 i18n pairing recorded with two valid orderings.
- Phase numbering continues from v2.8 (last phase: 72); v2.9 starts at 73. No reset.
- Plan count is TBD per phase (filled by `/gsd-plan-phase`); estimates per phase below.

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key cross-milestone reference points carried forward into v2.9:

- v2.6 parity baseline `67p / 1f / 34c` at HEAD `2c7ad2dea` carries forward through v2.7 + v2.8. v2.9 Phase 73 / DETERM-02 either lifts this to a stable green count or explicitly re-baselines (whichever is honest given what investigation surfaces).
- `@openvaa/dev-seed` is the canonical data path for both dev and E2E. v2.9 coverage phases will likely add new variant fixtures (multilocale, single-locale, low-minimum-answers, allowOpen-enabled, hidden-questions) on top of the existing default + e2e templates.
- `test.skip(true, …)` sweep extends the v2.6 Phase 64 voter-results.spec.ts pattern (6 silent skips converted to `expect.poll().toBeGreaterThan(0)`). Protocol documented in `.planning/todos/pending/2026-04-27-remove-e2e-skip-modifiers.md`.
- 98 `playwright/*` warnings are NOT auto-fixable; each requires manual rewriting (`no-conditional-in-test`, `no-raw-locators`, `no-networkidle`). Pairing DETERM-03 with DETERM-02 forces the rewrite of conditional / `networkidle` patterns that are the actual flakiness drivers.
- E2E-08 (locale switching) and CLEAN-04 (i18n wrapper tightening) are deliberately paired — locale-switching coverage exercises the i18n wrapper improvements. Two valid orderings recorded in Phase 78 Pairing note (Order A: 78 first, then 74; Order B: 74 first, then 78). Either honest at planning time.
- Phase 78 follows the v2.7 P68 / v2.8 P72 hygiene-trio bundling pattern — 4 small reqs in one phase, NOT split into 4 phases. Project convention for residual cleanup work.
- A11Y-03 wiring + first-run baseline ONLY — cite-and-fix of WCAG violations surfaced is explicitly out of scope for v2.9, tracked as a follow-up todo at A11Y-03 close. Keeps Phase 76 bounded.
- Phase 73 is the highest-risk phase of v2.9 (19 race-failure investigations, some may surface real product bugs requiring code fixes). Phases 74-77 are content-heavy (writing new Playwright specs against a now-stable suite). Phase 78 is low-risk hygiene.
- All v2.9 work is testing + frontend / package-level — NO Supabase migrations, NO new test runners, NO E2E framework migration (Playwright 1.58.2 is the durable stack).
- [Phase 73 Plan 01]: Locked 101 playwright/* warnings as the binding baseline (vs 103 in CONTEXT D-03; small downward drift accepted)
- [Phase 73 Plan 01]: Surfaced data.setup.ts:61-64 HEAD blocker via INVENTORY.md (recommended Plan 02 Task 0 hotfix path, within CONTEXT D-05 cap)
- [Phase ?]: Plan 74-03: Open Question 3 resolved to text-toggle path (results/browse) per VoterNav.svelte:87 voterCtx.resultsAvailable
- [Phase ?]: Plan 74-03: 2 new specs inherit Phase-73-locked DATA_RACE for answeredVoterPage fixture; 3 tests added to DATA_RACE pool — Plan 07 must regenerate parity constants per CONTEXT D-10
- [Phase ?]: Plan 74-01 (E2E-01): multilocale-only path covered via Playwright spec; single-locale deferred per D-04; lang.<locale> i18n keys discovered unwired (surfaced for Phase 78 CLEAN-04)
- [Phase ?]: Phase 74-02 — Ingress assertion via content discriminator (browse-vs-results phrase) instead of translation-key probing; survives copy edits on either side.
- [Phase ?]: Phase 74 Plan 05 — Card filter uses display name (e.g. 'CaseA Both') not external_id
- [Phase ?]: Phase 74 Plan 05 — E2E-07 SubMatch locator: getByRole('meter', { name }) replaces inline-style [style*=grid-template-columns] which matched multiple non-SubMatch containers
- [Phase ?]: Phase 74 Plan 05 — Cross-spec impact: adding categorical question at sort 17 required Skip-Next fallback in voter-matching navigateToResults + out-of-range guard in voter-journey answerRemainingUntilResults
- [Phase 74]: Plan 04: constituency-selector locator strategy uses outer voter-constituencies-list + inner getByRole('combobox', {name}) due to {...concatClass(restProps, ...)} testId-overwrite at ConstituencySelector.svelte:177 — Open Question 2 resolution; documented as inline // reason: in both new specs
- [Phase 74]: Plan 04: Ne-Nc cross-bleed assertion uses symmetric for-of expect().not.toContain in both directions — for-of iteration is NOT a playwright/no-conditional-in-test violation; defense-in-depth even if option names ever overlap
- [Phase ?]: Phase 74 closes GREEN-WITH-DEFERRAL — 8 PASS + 1 PASS-WITH-DEFERRAL (E2E-01 single-locale per D-04) + 0 FAIL across 9 ROADMAP SCs; 3-run SHA-identity ec349269...; 3 PARITY GATE PASS; DATA_RACE pool preserved at 15
- [Phase ?]: Order B (CONTEXT D-06) confirmed for Phase 74 close: E2E-08 spec re-validates against tightened wrapper at Phase 78 close
- [Phase ?]: Parity-script constants regenerated for Phase 74: CASCADE 55→65 (+10 with per-test rationale); PASS_LOCKED+DATA_RACE unchanged per D-09
- [Phase ?]: Phase 75 Plan 01: Option A applied for Skip-Next fallback at sort 18 (3-iter loop); role 'radio' used (not 'button'); literal EN strings per W-03 deferred-todo

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue; carry-forward infrastructure debt. May affect Phase 76 A11Y-01 image-upload validation cells if it crashes during the run.
- 165 pre-existing intra-package circular deps in `@openvaa/data` / `matching` / `filters` — deferred to a dedicated structural refactor milestone.
- [Phase 73 → Phase 78 CLEAN-05] All Phase 73 follow-ups scoped into Phase 78 CLEAN-05 (2026-05-11). Covers CR-02 voter-popups race-tolerance regression + 7 WR + 5 IN review findings + voter-fixture heterogeneous-question-types race (Path B locked in with `--likert-only` seed modifier). See `.planning/REQUIREMENTS.md §CLEAN-05`, `.planning/ROADMAP.md §"Phase 78"` SC #5, `.planning/phases/73-determinism-baseline/73-REVIEW.md`, and `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md`. No longer dangling — scheduled.

## Session Continuity

Last session: 2026-05-11T17:22:12.573Z
Stopped at: Phase 75 context gathered
Resume file: None
Next action: Run `/gsd-plan-phase 73` to start planning the determinism baseline. Phase 73 is gating for Phases 74-77 — plan it first; Phase 78 (CLEAN) may be planned in parallel since it's independent of Phase 73.

### Plan-count estimate (drafted 2026-05-10)

| Phase | Likely plan count | Notes |
|-------|-------------------|-------|
| 73 — Determinism Baseline | 4-6 plans | (1) skip-modifier classification + sweep; (2-4) data-loading race investigations clustered by failure type (initial-fetch race / subscription-not-flushed / auth-cookie / hydration-timing); (5) playwright/* warning sweep paired with the conditional/networkidle rewrites; (6) verification + parity gate. Range depends on how many of the 19 races cluster into a shared root cause. |
| 74 — High-Leverage E2E Coverage | 6-8 plans | Likely 1 plan per E2E-0X requirement; E2E-04 the largest given the 5-cell selector matrix; E2E-05 + E2E-07 may bundle since both extend voter-detail.spec.ts. |
| 75 — Question-Rendering Specs | 2 plans | (1) QSPEC-01 Boolean spec; (2) QSPEC-02 categorical spec. Small + focused. |
| 76 — Profile + A11y | 3-4 plans | (1) A11Y-01 profile validation; (2) A11Y-02 profile reload-persistence; (3) A11Y-03 axe wiring; potentially (4) split A11Y-03 into "wire harness" + "first-run baseline + follow-up todo capture". |
| 77 — Settings Matrix | 3-5 plans | SETTINGS-01 likely 2-3 plans (toggle matrix breadth); SETTINGS-02 + SETTINGS-03 likely 1 plan each. |
| 78 — Cleanup Hygiene Phase | 4-5 plans | 1 per CLEAN-0X requirement, with CLEAN-03 potentially splitting into 1 plan per sub-finding given the 3-pack shape; matches the v2.8 Phase 72 trio plan-count cadence. |

**Total v2.9 estimate:** ~22-30 plans across 6 phases. Risk: high on Phase 73 (race investigations may surface code-level bugs); moderate on Phases 74-77 (content-heavy spec authoring against a now-stable suite); low on Phase 78 (hygiene bundle).

## Operator Next Steps

- v2.9 ROADMAP.md drafted (2026-05-10). Phase 73 is the gating prerequisite for Phases 74-77; Phase 78 is independent and may run in parallel.
- Run `/gsd-plan-phase 73` to begin planning the determinism baseline. Optionally run `/gsd-plan-phase 78` in parallel since it's independent of Phase 73.
- After Phase 73 verification passes (3-run-stable, 0 skipped, 0 warnings), Phases 74, 75, 76, 77 may be planned concurrently — they share the determinism prerequisite but are independent of each other.
- Reminder: Commits in this repo must use `git -c core.hooksPath=/dev/null` until global config is fixed (`project_gsd_repo_hook_workaround.md`).
- Reminder: Discuss multiple independent phases together so planning can run autonomously (`feedback_batch_discussions.md`). Phases 74, 75, 76, 77, 78 are all independent of each other (74-77 share Phase 73 prerequisite; 78 is fully independent) — natural batch candidates once Phase 73 is mid-flight.
