# Roadmap: OpenVAA Framework Evolution

## Milestones

- ✅ **v1.0 E2E Testing Framework** — Phases 1-7 (shipped 2026-03-12)
- ✅ **v1.1 Monorepo Refresh** — Phases 8-13 (shipped 2026-03-15)
- ✅ **v1.2 Svelte 5 Migration (Infrastructure)** — Phases 15-21 (shipped 2026-03-18)
- ✅ **v1.3 Svelte 5 Migration (Content)** — Phases 22-26 (shipped 2026-03-20)

## Phases

<details>
<summary>✅ v1.0 E2E Testing Framework (Phases 1-7) — SHIPPED 2026-03-12</summary>

- [x] Phase 1: Infrastructure Foundation (11/11 plans) — Playwright 1.58.2, project dependencies, API data management, testIds, fixtures, ESLint
- [x] Phase 2: Candidate App Coverage (4/4 plans) — Auth, registration, profile, questions, settings, app modes
- [x] Phase 3: Voter App Core Journey (4/4 plans) — Landing through results, matching verification, entity details
- [x] Phase 4: Voter App Settings and Edge Cases (5/5 plans) — Category selection, popups, static pages, nominations
- [x] Phase 5: Configuration Variants (3/3 plans) — Multi-election, constituency, results sections via overlay datasets
- [x] Phase 6: CI Integration and Test Organization (2/2 plans) — GitHub Actions, HTML reports, test tagging
- [x] Phase 7: Advanced Test Capabilities (2/2 plans) — Visual regression, performance benchmarks

</details>

<details>
<summary>✅ v1.1 Monorepo Refresh (Phases 8-13) — SHIPPED 2026-03-15</summary>

- [x] Phase 8: Build Orchestration (2/2 plans) — Turborepo with cached parallel builds, Deno evaluation
- [x] Phase 9: Directory Restructure (2/2 plans) — apps/ + packages/ convention, Docker/CI/E2E updates
- [x] Phase 10: Version Management (2/2 plans) — Changesets for versioning, changelogs, release PRs
- [x] Phase 11: Package Publishing (3/3 plans) — tsup builds, npm metadata, fresh install verification
- [x] Phase 12: Polish and Optimization (3/3 plans) — Yarn 4.13, catalogs, remote caching, per-workspace tooling
- [x] Phase 13: Tech Debt Cleanup (3/3 plans) — 9 audit items resolved (hooks, versions, docs)

</details>

<details>
<summary>✅ v1.2 Svelte 5 Migration — Infrastructure (Phases 15-21) — SHIPPED 2026-03-18</summary>

- [x] Phase 15: Scaffold and Build (2/2 plans) — Fresh SvelteKit 2 + Svelte 5 scaffold with native TS, Vite plugin, path aliases
- [x] Phase 16: CSS Architecture (2/2 plans) — Tailwind 4 CSS-first config + DaisyUI 5 with theme migration
- [x] Phase 17: Internationalization (4/4 plans) — sveltekit-i18n to Paraglide JS with runtime override wrapper
- [x] Phase 18: Dependency Modernization (2/2 plans) — Full monorepo dependency bump and cleanup
- [x] Phase 19: Integration Validation (2/2 plans) — Node 22, Docker, CI, and E2E verification
- [x] Phase 20: OXC Toolchain Exploration (1/1 plan) — Evaluated and deferred (Svelte template linting not supported)
- [x] Phase 21: Migration Cleanup (1/1 plan) — Dead code removal and migration TS error fixes

</details>

<details>
<summary>✅ v1.3 Svelte 5 Migration — Content (Phases 22-26) — SHIPPED 2026-03-20</summary>

- [x] Phase 22: Leaf Component Migration (7/7 plans) — 98 components to $props(), runes mode, callback props, $bindable()
- [x] Phase 23: Container Components and Layouts (4/4 plans) — Snippet props, callback props, Layout/MainContent migration
- [x] Phase 24: Voter Route Migration (4/4 plans) — $: → $derived/$effect, on:event → native attributes, slot → @render
- [x] Phase 25: Cleanup (1/1 plan) — TODO[Svelte 5] markers resolved, candidate app call sites updated
- [x] Phase 26: Validation Gate (3/3 plans) — 26 E2E tests passing, zero TS errors, zero legacy patterns

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Infrastructure Foundation | v1.0 | 11/11 | Complete | 2026-03-07 |
| 2. Candidate App Coverage | v1.0 | 4/4 | Complete | 2026-03-08 |
| 3. Voter App Core Journey | v1.0 | 4/4 | Complete | 2026-03-08 |
| 4. Voter App Settings and Edge Cases | v1.0 | 5/5 | Complete | 2026-03-09 |
| 5. Configuration Variants | v1.0 | 3/3 | Complete | 2026-03-09 |
| 6. CI Integration and Test Organization | v1.0 | 2/2 | Complete | 2026-03-10 |
| 7. Advanced Test Capabilities | v1.0 | 2/2 | Complete | 2026-03-11 |
| 8. Build Orchestration | v1.1 | 2/2 | Complete | 2026-03-12 |
| 9. Directory Restructure | v1.1 | 2/2 | Complete | 2026-03-13 |
| 10. Version Management | v1.1 | 2/2 | Complete | 2026-03-13 |
| 11. Package Publishing | v1.1 | 3/3 | Complete | 2026-03-13 |
| 12. Polish and Optimization | v1.1 | 3/3 | Complete | 2026-03-14 |
| 13. Tech Debt Cleanup | v1.1 | 3/3 | Complete | 2026-03-15 |
| 15. Scaffold and Build | v1.2 | 2/2 | Complete | 2026-03-15 |
| 16. CSS Architecture | v1.2 | 2/2 | Complete | 2026-03-15 |
| 17. Internationalization | v1.2 | 4/4 | Complete | 2026-03-16 |
| 18. Dependency Modernization | v1.2 | 2/2 | Complete | 2026-03-16 |
| 19. Integration Validation | v1.2 | 2/2 | Complete | 2026-03-18 |
| 20. OXC Toolchain Exploration | v1.2 | 1/1 | Complete | 2026-03-18 |
| 21. Migration Cleanup | v1.2 | 1/1 | Complete | 2026-03-18 |
| 22. Leaf Component Migration | v1.3 | 7/7 | Complete | 2026-03-18 |
| 23. Container Components and Layouts | v1.3 | 4/4 | Complete | 2026-03-19 |
| 24. Voter Route Migration | v1.3 | 4/4 | Complete | 2026-03-19 |
| 25. Cleanup | v1.3 | 1/1 | Complete | 2026-03-19 |
| 26. Validation Gate | v1.3 | 3/3 | Complete | 2026-03-20 |
