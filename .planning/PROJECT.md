# OpenVAA Framework Evolution

## What This Is

OpenVAA is an open-source framework for building Voting Advice Applications (VAAs). It's a monorepo with a SvelteKit frontend, Strapi CMS backend, and shared packages for matching algorithms, filters, and data management. The monorepo uses Turborepo for cached builds, Changesets for versioning, and publishes core packages to npm. This project covers framework evolution: modernizing infrastructure, building Claude development skills, upgrading the frontend stack, and migrating to a new backend.

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
- ✓ Extensible, modular E2E testing framework with full coverage — v1.0
- ✓ Turborepo for cached, dependency-aware parallel builds — v1.1
- ✓ apps/ + packages/ monorepo directory convention — v1.1
- ✓ Changesets for automated versioning, changelogs, and release PRs — v1.1
- ✓ npm publishing readiness for core, data, matching, filters (tsup builds, metadata, verified) — v1.1
- ✓ Yarn 4.13 with dependency catalogs — v1.1
- ✓ Vercel remote caching in CI — v1.1
- ✓ Per-workspace lint/typecheck via Turborepo — v1.1

### Active

- [ ] Claude development skills for architecture, components, data, matching, filters, LLM
- [ ] Svelte 5 migration (framework upgrade, Tailwind, DaisyUI, i18n)
- [ ] Deno feasibility study (Node → Deno transition)
- [ ] Supabase migration (Strapi → Supabase with schema, auth, RLS, storage)
- [ ] Admin app migration (Strapi plugin → frontend Admin App)
- [ ] Trusted publishing for npm (OIDC, deferred until after initial manual publish)
- [ ] Changeset bot for PR reminders (deferred from v1.1)

### Out of Scope

- Mobile native apps — web-first approach
- Package manager migration (pnpm) — high risk, low reward with Turborepo on Yarn 4
- Nx adoption — overkill for 9-package monorepo
- Lerna adoption — legacy tool, Nx wrapper
- semantic-release — poor monorepo support vs explicit-intent Changesets
- Publishing all packages — only core/data/matching/filters are general-purpose

## Context

The project is a mature monorepo used for real election deployments. As of v1.1:

- **Codebase:** ~1,717 files across apps and packages
- **Tech stack:** SvelteKit 2, Strapi v5, Postgres, Yarn 4.13, Turborepo 2.8, Changesets
- **Build system:** Turborepo with content-based caching, tsup for publishable packages
- **Testing:** Playwright 1.58.2 E2E (56 requirements), Vitest unit tests
- **CI:** GitHub Actions with Turborepo remote caching, HTML test reports
- **Publishing:** 4 packages (@openvaa/core, data, matching, filters) ready for npm with ESM output
- **Known issues:** Frontend build has pre-existing ai dependency failure; Strapi has TS errors in mock data generation

The backend will eventually move from Strapi to Supabase. The frontend may later move from Node to Deno (Turborepo impact evaluated in Phase 8).

## Constraints

- **Tech stack (current)**: SvelteKit 2, Svelte 4, Strapi v5, Postgres, Yarn 4.13, Turborepo 2.8
- **Tech stack (target)**: Svelte 5, Supabase, potentially Deno
- **Publishing**: @openvaa/core, data, matching, filters publishable to npm; app-shared retains CJS for Strapi
- **Testing**: Playwright 1.58.2 for E2E, Vitest for unit tests
- **Backward compatibility**: Framework is used by external deployers — changes must not break deployment patterns
- **Backend transition**: Strapi investment should be minimal given planned Supabase migration

## Milestones

Each major initiative is a separate milestone, executed in order:

1. ~~**E2E Testing Framework**~~ — Shipped v1.0 (2026-03-12)
2. ~~**Monorepo Refresh**~~ — Shipped v1.1 (2026-03-15)
3. **Claude Skills** — Domain-expert skills for architecture, components, data, matching, filters, LLM
4. **Svelte 5 Migration** — Framework upgrade including Tailwind, DaisyUI, i18n rewrites
5. **Deno Investigation** — Feasibility study for Node → Deno transition
6. **Supabase Migration** — Backend migration from Strapi with schema planning, auth, RLS, storage
7. **Admin App Migration** — Move admin functions from Strapi plugin to frontend Admin App

### Claude Skills — Scope Notes (for milestone #3)

Each skill covers: extending the target, reviewing changes, helping other agents use it, understanding data models, maintaining conventions, syncing with docs.

- **Architect** — Whole app + monorepo knowledge, frontend internals (data API, contexts, routes, API routes, server/client separation, voter/candidate/admin apps)
- **Components** — Frontend component library
- **Data** — `@openvaa/data` package
- **Matching** — `@openvaa/matching` package
- **Filters** — `@openvaa/filters` package
- **LLM** — `@openvaa/llm` package

Build using skill-builder skill where beneficial.

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
| Turborepo over alternatives       | Layers on Yarn 4 without replacement; Deno impact evaluated and acceptable   | ✓ Good      |
| apps/ + packages/ restructure     | Industry convention, cleaner boundaries, required for Turborepo conventions  | ✓ Good      |
| Changesets over semantic-release   | Explicit intent vs commit-message parsing; better monorepo support           | ✓ Good      |
| tsup for publishable packages     | Replaces tsc + tsc-esm-fix; clean ESM+CJS output, simpler config            | ✓ Good      |
| Independent versioning            | Each package versions independently via Changesets (not fixed/locked)        | ✓ Good      |
| Defer changeset-bot               | User chose to skip; can install later via GitHub App                         | — Pending   |
| Defer trusted publishing          | Requires initial manual npm publish before OIDC can be configured            | — Pending   |
| Yarn catalogs for deps            | Single source of truth for shared dependency versions across workspaces      | ✓ Good      |

---

_Last updated: 2026-03-15 after v1.1 milestone_
