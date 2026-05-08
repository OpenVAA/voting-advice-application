---
gsd_state_version: 1.0
milestone: v2.7
milestone_name: Svelte 5 Polish + Supabase-Adapter Loose Ends
status: Awaiting next milestone
stopped_at: Phase 67 closed (UAT 10/10, security 6/6 closed with 2 accepted risks, parity gate PASS). Ready to plan Phase 68 (Dev-Tooling Trio).
last_updated: "2026-05-08T19:21:31.042Z"
last_activity: 2026-05-08 — Milestone v2.7 completed and archived
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 9
  completed_plans: 9
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-08)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Phase 68 — Dev-Tooling Trio

## Current Position

Phase: Milestone v2.7 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-05-08 — Milestone v2.7 completed and archived

## Performance Metrics

**Cumulative:**

- Milestones shipped: 11 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1, v2.3, v2.4, v2.5, v2.6) + 1 paused (v2.2)
- Total plans completed: 201 + 6 tasks
- Timeline: 32 days across 4 work windows (2026-03-01 → 2026-03-28 + v2.5 2026-04-23→24 + v2.6 2026-04-24→28)
- v2.6 specifically: 5 phases, 18 plans, 48 tasks, 137 commits, ~5,400 LOC across 146 frontend/test files in 4 days

## Deferred Items

Snapshot taken at v2.6 milestone close on 2026-04-28. The four todos that v2.6 phases addressed (entity-list-controls-infinite-loop, root-layout-runes-migration, svelte5-cleanup, svelte5-hydration-effect-then-bug) remain in `.planning/todos/pending/` because each accumulated extra audit items during execution that haven't been actioned yet (e.g. svelte5-cleanup picked up `bind:*` and `{#key}` audits during Phase 64 manual smoke).

| Category | Item | Status / Notes |
|----------|------|----------------|
| todo | 2026-03-28-generalize-candidate-app-to-party-app.md | ui — future party-app variant |
| todo | 2026-03-28-investigate-migrating-candidate-answer-store.md | ui — architectural investigation |
| todo | 2026-04-27-extend-e2e-filter-type-coverage.md | medium — added during v2.6 Phase 63 |
| todo | 2026-04-27-remove-e2e-skip-modifiers.md | medium — added during v2.6 Phase 63 |
| todo | adapter-package-loading.md | medium — tsconfig-based importable adapter |
| todo | check-candidate-distribution.md | low — default seed candidate spread follow-up (partly mitigated by v2.6 densification) |
| todo | configurable-mock-data.md | medium — Supabase GENERATE_MOCK_DATA env replacement |
| todo | entity-list-controls-infinite-loop.md | resolved by v2.6 Phase 62 RESULTS-01/02/03 — file remains for any residual audit items |
| todo | frontend-project-id-scoping.md | architecture — multi-tenant prep |
| todo | password-reset-code-method.md | candidate-app auth flow |
| todo | register-page-registrationkey-method.md | candidate-app auth flow |
| todo | rename-admin-writer.md | dev-seed internal API hygiene |
| todo | results-url-refactor-followups.md | added during v2.6 Phase 64 manual smoke — switch results detail to `/results/[entType]/[nominationId]`; drop redundant query params |
| todo | root-layout-runes-migration.md | resolved by v2.6 Phase 60 LAYOUT-01/02/03 — file remains for any residual notes |
| todo | session-storage-election-constituency.md | frontend session handling — partly mitigated by Phase 62's URL-based election scoping |
| todo | sql-linting-formatting.md | CI hygiene |
| todo | svelte5-cleanup.md | partly resolved (boolean Q + categories in Phase 61); items 4 (`bind:*` audit) and 5 (`{#key}` audit) added during Phase 64 — scheduled in v2.7 Phase 65 |
| todo | svelte5-hydration-effect-then-bug.md | resolved by v2.6 Phase 60 LAYOUT-02 — file remains for any residual notes |
| carry-forward | 165 pre-existing intra-package circular deps (data/matching/filters internal.ts barrel pattern) | Out-of-scope per v2.6 REQUIREMENTS.md §Future; dedicated refactor milestone |
| infrastructure | Local imgproxy Docker container 502 on image upload (intermittent) | Not a code issue; fix with `supabase stop && supabase start`. Out-of-scope per v2.6 closure. |

**Pending todo count at close:** 18 (full audit available via `gsd-sdk query audit-open`).
| Phase 65-svelte-5-audit-sweeps P01 | 90min | 3 tasks | 45 files |
| Phase 65 P02 | 25min | 3 tasks | 9 files |
| Phase 66 P01 | 60min | 4 tasks | 4 files |
| Phase 67 P01 | 25min | 5 tasks | 6 files |
| Phase 67 P02 | 90min | 5 tasks | 11 files |

## Accumulated Context

### Roadmap Evolution

- 2026-04-28: v2.6 Svelte 5 Migration Cleanup shipped. 5 phases (60-64), 18 plans, 48 tasks, 4 days. Tagged `v2.6` and archived to `.planning/milestones/v2.6-*`. Phase directories archived under `.planning/milestones/v2.6-phases/`.
- 2026-04-29: v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends roadmap drafted. 4 phases (65-68), 11 plans estimated:
  - Phase 65 — Svelte 5 Audit Sweeps (SVELTE5-01, 02, 03) — 3 plans
  - Phase 66 — Nominations Schema + Adapter Type Cleanup (DB-01, ADAPTER-01) — 3 plans (DB migration is the highest-risk item; adapter retype lands in the same phase to keep the integration test cycle single)
  - Phase 67 — Default Seed Alliances (SEED-01) — 2 plans (empirically exercises the v2.6 P64 alliance branch of the adapter reverse-fill that was previously dev-blind)
  - Phase 68 — Dev-Tooling Trio (DEVTOOLS-01, 02, 03) — 3 plans
- All 9 v2.7 requirements mapped 1:1 to a phase; no orphans, no duplicates.
- 2026-04-29 (later that day): CONTEXT.md captured for all 4 phases via `/gsd-discuss-phase 65 66 67 68 --chain`. **Phase 66 scope narrowed mid-discussion** — user opted to keep the `nominations` table as is (`entity_type` is a STORED GENERATED column structurally safe from drift; `name` is harmless). DB-01 requirement moved to "Future Requirements (deferred)" in REQUIREMENTS.md. Phase 66 now adapter-retype only — 1 plan instead of 3. **Total v2.7 plan count: 9 (was 11).** Phases 65, 67, 68 unchanged in scope. Decisions captured in `.planning/phases/{65,66,67,68}-*/{phase}-CONTEXT.md`.

### Decisions

Full decision log in PROJECT.md Key Decisions table (15 v2.6 entries added at close).

Key cross-milestone reference points carried forward:

- `@openvaa/dev-seed` is the canonical data path for both dev and E2E (default + e2e templates + variant overlays via `mergeSettings`).
- Playwright parity baseline at v2.6 close: HEAD `2c7ad2dea` regenerated by Plan 64-03 (PARITY GATE: PASS). v2.7 must not regress this baseline.
- All voter-flow E2E hard-asserted via `expect.poll` (no silent `test.skip(true)` paths remain in voter-results.spec.ts as of Phase 64).
- Supabase adapter reverse-fills nomination parent → children id arrays in-memory before returning to the data model — required because the DB stores flat `parent_nomination_id` while `OrganizationNomination` only auto-populates `candidateNominationIds` from inline nested data. v2.7 Phase 66 cleans up the type story over this code; v2.7 Phase 67 first exercises the alliance branch.
- Default seed densified to 5 constituencies × 8 parties × 327 candidates so dev sessions exercise parties tab + categorical-question filter axes. v2.7 Phase 67 extends this with ~2-3 alliances.
- [Phase ?]: Phase 65 Plan 01: 92 bind:* directives annotated in apps/frontend/src/lib; Pattern 1 fix on Input.svelte mainInputs (mirrors Phase 64 QuestionChoices fix); zero Pattern 2 violations or deep-chain bindings found.
- [Phase ?]: Phase 65 Plan 02: 2 {#key} annotations + 1 Pattern B keyed each + 6 reactive-accessor destructure rewrites + CLAUDE.md Context Destructuring Rule subsection (catalog includes 22 reactive-accessor names; RESEARCH draft was 18, audit added isAuthenticated, isPreregistered, preregistrationElections, preregistrationNominations).
- [Phase ?]: Phase 66: Adapter retype complete — 2 'as unknown as { ... }' casts removed via InternalFlatNomination in sibling .type.ts. PARITY GATE: PASS (67p/1f/34c identical to v2.6 anchor). svelte-check baseline preserved (160 err / 12 warn). Vitest 646/646 green. Variance fallback not needed. Id imported from @openvaa/core (deviation from plan literal which said @openvaa/data).
- [Phase ?]: Override-pair pattern: alliance entity rows in alliancesOverride (table=alliances), alliance nomination rows in nominationsOverride (table=nominations); bulk_import routes by override key
- [Phase ?]: Type-union widening before value-literal write: widen DynamicSettings.results.sections (Candidate|Organization|Alliance) before adding 'alliance' literal in seed-layer override
- [Phase 67]: Phase 64 attempt-4 protocol applies to v2.7+ parity gates: yarn supabase:reset (NOT yarn dev:reset-with-data) before Playwright capture. Mixed default+e2e seed produces a 20-test cascade-failure false-positive (40 voter questions). Anchored on Phase 66 66-VALIDATION.md:73-82.
- [Phase 67]: Dual-emission constructor pattern (nested-or-ids) is mandatory for any @openvaa/data variant whose supabase adapter populates ids on the reverse-fill path. AllianceNomination missed it (fixed in 643eea880); OrganizationNomination has it. Pattern enforced going forward.
- [Phase 67]: Full-block app_settings seed authoring: client-side mergeAppSettings is a shallow Object.assign over the persisted row vs the TS default. Partial overrides for top-level keys (e.g. results: { sections: [...] }) REPLACE the entire block. Seed must write the FULL block for any key it touches.
- [Phase 67]: SC-3 deliberately surfaces 'previously dev-blind' bugs — Phase 67 hit 3 of them (AllianceNomination crash, partial seed wipe of cardContents, missing optional-chain on cardContents reads). All 3 fixed atomically. Treating these as the deliverable, not regressions.

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue; carry-forward infrastructure debt.
- 165 pre-existing intra-package circular deps in `@openvaa/data`/`matching`/`filters` — deferred to a dedicated structural refactor milestone.
- v2.7 Phase 66 was originally the highest-risk phase (the `nominations` DB migration); after the 2026-04-29 scope reframe (migration deferred), Phase 66 narrows to a low-risk adapter retype (~1 plan, 2 cast sites). Milestone risk profile is now uniformly low.

## Session Continuity

Last session: 2026-05-08
Stopped at: Phase 67 closed (UAT 10/10, security 6/6 closed with 2 accepted risks, parity gate PASS). Ready to plan Phase 68 (Dev-Tooling Trio).
Resume file: None
Next action: /gsd-plan-phase 68 (CONTEXT.md exists from 2026-04-29 discuss-phase chain).

### Next milestone seed (selected 2026-04-29)

User selected Option C — "Svelte 5 polish + finish v2.6 supabase-adapter loose ends" — as the v2.7 scope. Cohesion: items 7 + 10 + 11 all touch `supabaseDataProvider.ts` + `@openvaa/dev-seed`, so closing them together means one round of integration testing.

Candidate scope (6 todos):

| # | Todo | Pri | Area | Why in v2.7 | Phase |
|---|------|-----|------|-------------|-------|
| 20 | `svelte5-cleanup.md` | medium | – | Mandatory — `bind:*` + `{#key}` audits left over from v2.6 P64 manual smoke | 65 |
| 4  | `2026-04-25-investigate-destructuring-contexts.md` | medium | ui | Svelte 5 sibling; pairs with item 20 audit sweeps | 65 |
| 10 | `2026-04-28-add-alliances-to-default-test-data.md` | medium | dev-seed | Exercises the 4th branch of the v2.6 P64 adapter reverse-fill (alliance → organizations) that wasn't seeded | 67 |
| 11 | `2026-04-28-cleanup-nominations-table.md` | medium | db | ~~Drop redundant `name` + `entityType` columns~~ — DEFERRED 2026-04-29 (user opted to keep table as is; `entity_type` is structurally safe via STORED GENERATED column, `name` harmless). Stays in `.planning/todos/pending/`. | ~~66~~ deferred |
| 7  | `2026-04-27-cleanup-sloppy-typing-supabaseDataProvider.md` | medium | api | Cleans up the `as unknown as { ... }` casts the v2.6 P64 reverse-fill introduced; same file as item 11 | 66 |
| 3  | `2026-04-25-dev-tooling-cleanup-trio.md` | low | dev-tooling | Small bundling of three unrelated dev-tooling cleanups (frontend autoreload, lint imports, retire Deno linting) | 68 |

**Out of scope (deferred to v2.8+):** results-url-refactor-followups (#18) + frontend-project-id-scoping (#14) — pair as a "sharable URLs + multi-tenant" milestone, benefits from the adapter cleanup landing first.

**Indefinitely deferred:** rename-admin-writer (#17), sql-linting-formatting (#19), adapter-package-loading (#12), configurable-mock-data (#13) — nice-to-haves, not blocking.

**Estimate:** ~12-15 plans across ~4-5 phases. Drafted at 11 plans across 4 phases — within the lean end of the estimate. **Revised 2026-04-29 to 9 plans** after Phase 66 scope narrow (migration deferred). Risk: low (no DB migration; uniformly small phases).

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
