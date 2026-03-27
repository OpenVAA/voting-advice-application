# Roadmap: OpenVAA Framework Evolution

## Milestones

- ✅ **v1.0 E2E Testing Framework** — Phases 1-7 (shipped 2026-03-12)
- ✅ **v1.1 Monorepo Refresh** — Phases 8-13 (shipped 2026-03-15)
- ✅ **v1.2 Svelte 5 Migration (Infrastructure)** — Phases 15-21 (shipped 2026-03-18)
- ✅ **v1.3 Svelte 5 Migration (Content)** — Phases 22-26 (shipped 2026-03-20)
- ✅ **v1.4 Svelte 5 Migration (Candidate App)** — Phases 27-28 (shipped 2026-03-22)
- ✅ **v2.0 Branch Integration** — Phases 29-39 (shipped 2026-03-22)
- ✅ **v2.1 E2E Test Stabilization** — Phases 40-41 (shipped 2026-03-26)
- ⏸️ **v2.2 Deno Feasibility Study** — Phases 42-44 (paused 2026-03-27 — feasibility validated, code rolled back, research preserved)

## Phases

<details>
<summary>v1.0 E2E Testing Framework (Phases 1-7) -- SHIPPED 2026-03-12</summary>

- [x] Phase 1: Infrastructure Foundation (11/11 plans) — Playwright 1.58.2, project dependencies, API data management, testIds, fixtures, ESLint
- [x] Phase 2: Candidate App Coverage (4/4 plans) — Auth, registration, profile, questions, settings, app modes
- [x] Phase 3: Voter App Core Journey (4/4 plans) — Landing through results, matching verification, entity details
- [x] Phase 4: Voter App Settings and Edge Cases (5/5 plans) — Category selection, popups, static pages, nominations
- [x] Phase 5: Configuration Variants (3/3 plans) — Multi-election, constituency, results sections via overlay datasets
- [x] Phase 6: CI Integration and Test Organization (2/2 plans) — GitHub Actions, HTML reports, test tagging
- [x] Phase 7: Advanced Test Capabilities (2/2 plans) — Visual regression, performance benchmarks

</details>

<details>
<summary>v1.1 Monorepo Refresh (Phases 8-13) -- SHIPPED 2026-03-15</summary>

- [x] Phase 8: Build Orchestration (2/2 plans) — Turborepo with cached parallel builds, Deno evaluation
- [x] Phase 9: Directory Restructure (2/2 plans) — apps/ + packages/ convention, Docker/CI/E2E updates
- [x] Phase 10: Version Management (2/2 plans) — Changesets for versioning, changelogs, release PRs
- [x] Phase 11: Package Publishing (3/3 plans) — tsup builds, npm metadata, fresh install verification
- [x] Phase 12: Polish and Optimization (3/3 plans) — Yarn 4.13, catalogs, remote caching, per-workspace tooling
- [x] Phase 13: Tech Debt Cleanup (3/3 plans) — 9 audit items resolved (hooks, versions, docs)

</details>

<details>
<summary>v1.2 Svelte 5 Migration -- Infrastructure (Phases 15-21) -- SHIPPED 2026-03-18</summary>

- [x] Phase 15: Scaffold and Build (2/2 plans) — Fresh SvelteKit 2 + Svelte 5 scaffold with native TS, Vite plugin, path aliases
- [x] Phase 16: CSS Architecture (2/2 plans) — Tailwind 4 CSS-first config + DaisyUI 5 with theme migration
- [x] Phase 17: Internationalization (4/4 plans) — sveltekit-i18n to Paraglide JS with runtime override wrapper
- [x] Phase 18: Dependency Modernization (2/2 plans) — Full monorepo dependency bump and cleanup
- [x] Phase 19: Integration Validation (2/2 plans) — Node 22, Docker, CI, and E2E verification
- [x] Phase 20: OXC Toolchain Exploration (1/1 plan) — Evaluated and deferred (Svelte template linting not supported)
- [x] Phase 21: Migration Cleanup (1/1 plan) — Dead code removal and migration TS error fixes

</details>

<details>
<summary>v1.3 Svelte 5 Migration -- Content (Phases 22-26) -- SHIPPED 2026-03-20</summary>

- [x] Phase 22: Leaf Component Migration (7/7 plans) — 98 components to $props(), runes mode, callback props, $bindable()
- [x] Phase 23: Container Components and Layouts (4/4 plans) — Snippet props, callback props, Layout/MainContent migration
- [x] Phase 24: Voter Route Migration (4/4 plans) — $: to $derived/$effect, on:event to native attributes, slot to @render
- [x] Phase 25: Cleanup (1/1 plan) — TODO[Svelte 5] markers resolved, candidate app call sites updated
- [x] Phase 26: Validation Gate (3/3 plans) — 26 E2E tests passing, zero TS errors, zero legacy patterns

</details>

<details>
<summary>v1.4 Svelte 5 Migration -- Candidate App (Phases 27-28) -- SHIPPED 2026-03-22</summary>

- [x] Phase 27: Candidate Route Migration (4/4 plans) — All 25 candidate route files to Svelte 5 runes ($derived/$effect, native events, $effect lifecycle)
- [x] Phase 28: Validation Gate (3/3 plans) — Zero legacy patterns, zero TypeScript errors, all candidate-app E2E tests passing

</details>

<details>
<summary>v2.0 Branch Integration (Phases 29-39) -- SHIPPED 2026-03-22</summary>

- [x] Phase 29: Skills and Planning Documents (4/4 plans) — Claude Skills, code review checklist, Key Decisions merge, retrospective/archives
- [x] Phase 30: Supabase Backend Foundation (4/4 plans) — apps/supabase/ workspace, supabase-types package, Yarn catalog
- [x] Phase 31: Schema Reorganization (1/1 plan) — Verification-only, one public. qualifier fix
- [x] Phase 32: Auth Infrastructure (3/3 plans) — Supabase clients, hooks.server.ts with sequence(), auth routes
- [x] Phase 33: Auth Integration (4/4 plans) — Auth context, preregister Edge Function, protected layout guards
- [x] Phase 34: Adapter Foundation (3/3 plans) — Supabase adapter mixin, 5 utilities, dynamic adapter switch
- [x] Phase 35: Adapter Providers and Writers (4/4 plans) — DataProvider, DataWriter, AdminWriter, FeedbackWriter
- [x] Phase 36: E2E Test Migration (8/8 plans) — SupabaseAdminClient, datasets, specs, Mailpit, Playwright config
- [x] Phase 37: E2E Failure Resolution (3/3 plans) — Auth cascade fixed, 10 tests skipped (Svelte 5 pushState bug)
- [x] Phase 38: Strapi Removal and Cleanup (4/4 plans) — 262 files deleted, Docker/env/CLAUDE.md rewritten
- [x] Phase 39: CI/CD and Documentation (4/4 plans) — pgTAP job, skill-drift-check, docs updated

</details>

<details>
<summary>v2.1 E2E Test Stabilization (Phases 40-41) -- SHIPPED 2026-03-26</summary>

- [x] Phase 40-41: E2E Test Stabilization (6 tasks) — Protected layout hydration fix, registration/password email flows, popup timing with PopupRenderer runes wrapper

</details>

<details>
<summary>v2.2 Deno Feasibility Study (Phases 42-44) -- PAUSED 2026-03-27</summary>

- [x] Phase 42: Runtime Validation and PoC (2/2 plans) — Deno 2.7.8 validated: SvelteKit serves, 54/67 E2E pass, Supabase auth works, code rolled back
- [ ] Phase 43: Evaluation and Benchmarking (paused) — Toolchain comparison, benchmarks, security model
- [ ] Phase 44: Findings Report (paused) — Go/no-go recommendation with migration plan

Key findings: SvelteKit adapter-node runs on Deno with zero code changes, Turborepo/Changesets/tsup unaffected, vitest shim enables dual-runtime tests. See `milestones/v2.2-ROADMAP.md` for full details.

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-7 | v1.0 | 31/31 | Complete | 2026-03-12 |
| 8-13 | v1.1 | 15/15 | Complete | 2026-03-15 |
| 15-21 | v1.2 | 14/14 | Complete | 2026-03-18 |
| 22-26 | v1.3 | 19/19 | Complete | 2026-03-20 |
| 27-28 | v1.4 | 7/7 | Complete | 2026-03-22 |
| 29-39 | v2.0 | 42/42 | Complete | 2026-03-22 |
| 40-41 | v2.1 | 6 tasks | Complete | 2026-03-26 |
| 42-44 | v2.2 | 2/2 + 2 paused | Paused | 2026-03-27 |
