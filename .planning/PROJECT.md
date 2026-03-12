# OpenVAA Framework Evolution

## What This Is

OpenVAA is an open-source framework for building Voting Advice Applications (VAAs). It's a monorepo with a SvelteKit frontend, Strapi CMS backend, and shared packages for matching algorithms, filters, and data management. This project covers the next phase of framework evolution: hardening test infrastructure, building Claude development skills, modernizing the frontend stack, and migrating to a new backend.

## Core Value

A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## Requirements

### Validated

- ✓ SvelteKit 2 frontend with voter and candidate apps — existing
- ✓ Strapi v5 backend with Postgres — existing
- ✓ Matching algorithm package with multiple distance metrics — existing
- ✓ Entity filtering package — existing
- ✓ Shared data model package — existing
- ✓ App-shared settings and utilities package — existing
- ✓ Docker-based development environment — existing
- ✓ Internationalization support — existing
- ✓ Admin tools plugin (import/delete data) — existing
- ✓ Extensible, modular E2E testing framework with full coverage — v1.0 (56 requirements, 7 phases, 31 plans)

### Active

- [ ] Claude Code skills for architecture, components, data, matching, filters, and LLM packages
- [ ] Monorepo version management workflow
- [ ] Svelte 5 migration with Tailwind, DaisyUI, and i18n updates
- [ ] Deno compatibility investigation
- [ ] Strapi to Supabase backend migration
- [ ] Admin functions migration to frontend Admin App

### Out of Scope

- Mobile native apps — web-first approach
- New feature development — this roadmap focuses on infrastructure, testing, and migrations
- Strapi plugin development — backend is being migrated away from Strapi

## Context

The project is a mature monorepo used for real election deployments. As of v1.0, the codebase has a comprehensive E2E test suite covering both voter and candidate apps with 56 requirements satisfied across infrastructure, candidate flows, voter journeys, configuration variants, CI integration, and advanced capabilities (visual regression + performance benchmarks).

The backend will eventually move from Strapi to Supabase, so backend-heavy investments should be minimal. The frontend may later move from Node to Deno.

Documentation exists in `/docs/src/routes` and package READMEs that can be mined for user stories and Claude skill content.

Key technical details:

- E2E tests use API-based data management via Admin Tools `/import-data` and `/delete-data` endpoints
- Test datasets use base+overlay composition pattern for configuration variants
- Playwright 1.58.2 with project dependencies pattern, 17+ projects, ESLint plugin enforcement
- CI pipeline with GitHub Actions, HTML reports, @smoke/@voter/@candidate/@variant tagging
- Visual regression and performance tests gated behind env vars (PLAYWRIGHT_VISUAL, PLAYWRIGHT_PERF)

## Constraints

- **Tech stack (current)**: SvelteKit 2, Svelte 4, Strapi v5, Postgres, Yarn 4 workspaces
- **Tech stack (target)**: Svelte 5, Supabase, potentially Deno
- **Testing**: Playwright 1.58.2 for E2E, Vitest for unit tests
- **Backward compatibility**: Framework is used by external deployers — changes must not break deployment patterns
- **Backend transition**: Strapi investment should be minimal given planned Supabase migration

## Milestones

Each major initiative is a separate milestone, executed in order:

1. ~~**E2E Testing Framework**~~ — Shipped v1.0 (2026-03-12)
2. **Claude Skills** — Domain-expert skills for architecture, components, data, matching, filters, LLM
3. **Monorepo Refresh** — Version management workflow, package organization review
4. **Svelte 5 Migration** — Framework upgrade including Tailwind, DaisyUI, i18n rewrites
5. **Deno Investigation** — Feasibility study for Node → Deno transition
6. **Supabase Migration** — Backend migration from Strapi with schema planning, auth, RLS, storage
7. **Admin App Migration** — Move admin functions from Strapi plugin to frontend Admin App

For further details about the milestones, see [ROADMAP](../ROADMAP.md).

## Key Decisions

| Decision                          | Rationale                                                                    | Outcome     |
| --------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| Separate milestones per H2        | Each initiative is independent enough to plan and complete separately         | ✓ Good      |
| E2E first                         | Need test coverage before making breaking changes in migrations              | ✓ Good      |
| Playwright-driven data management | Direct API calls to Admin Tools (not UI automation)                          | ✓ Good      |
| Test IDs over text selectors      | More resilient to content/i18n changes, 53+ testIds across voter/candidate   | ✓ Good      |
| User stories as test basis        | Mine existing tests and docs for comprehensive coverage                      | ✓ Good      |
| Infrastructure before coverage    | Phase 1 foundations before any spec files written                            | ✓ Good      |
| Base+overlay dataset composition  | Shared default dataset with variant overlays for multi-config testing        | ✓ Good      |
| Env-gated visual/perf tests       | PLAYWRIGHT_VISUAL and PLAYWRIGHT_PERF flags to exclude from default runs     | ✓ Good      |

---

_Last updated: 2026-03-12 after v1.0 milestone_
