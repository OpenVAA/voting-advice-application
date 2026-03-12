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
- ✓ Extensible, modular E2E testing framework with full coverage — v1.0

### Active

- [ ] Supabase schema design with multi-tenant data isolation
- [ ] Candidate answer storage strategy (JSON vs relational, validated via load tests)
- [ ] Multilingual content storage pattern for Supabase
- [ ] Authentication migration (candidate + admin) to Supabase Auth
- [ ] Email service integration (replacing Strapi SES plugin)
- [ ] Storage integration (replacing Strapi S3 plugin)
- [ ] Application settings migration to Supabase
- [ ] Admin CRUD operations with Row Level Security policies
- [ ] Working local Supabase Docker development environment
- [ ] Load testing infrastructure for schema validation

### Out of Scope

- Mobile native apps — web-first approach
- New feature development — this roadmap focuses on infrastructure, testing, and migrations
- Strapi plugin development — backend is being migrated away from Strapi

## Context

The project is a mature monorepo used for real election deployments. The codebase has existing E2E tests for the candidate app but they lack modularity — they use text-based selectors, don't reset state, and don't cover the voter app. The framework needs robust test coverage before undertaking major migrations (Svelte 5, Supabase).

The backend will eventually move from Strapi to Supabase, so backend-heavy investments should be minimal. The frontend may later move from Node to Deno.

Documentation exists in `/docs/src/routes` and package READMEs that can be mined for user stories and Claude skill content.

Key technical details:

- Data management for tests can use existing Admin Tools (Import/Delete Data) via Playwright-driven UI automation or direct API calls
- App settings can be changed via `dynamicSettings.ts` file modifications or Strapi Content Manager
- Multiple test datasets needed for different configurations (single vs. multiple elections, etc.)
- Test IDs should be used for element selection instead of text content

## Constraints

- **Tech stack (current)**: SvelteKit 2, Svelte 4, Strapi v5, Postgres, Yarn 4 workspaces
- **Tech stack (target)**: Svelte 5, Supabase, potentially Deno
- **Testing**: Playwright for E2E, Vitest for unit tests
- **Backward compatibility**: Framework is used by external deployers — changes must not break deployment patterns
- **Backend transition**: Strapi investment should be minimal given planned Supabase migration

## Milestones

Each major initiative is a separate milestone, executed in order:

1. **E2E Testing Framework** — Modular test infrastructure with full candidate and voter app coverage
2. **Claude Skills** — Domain-expert skills for architecture, components, data, matching, filters, LLM
3. **Monorepo Refresh** — Version management workflow, package organization review
4. **Svelte 5 Migration** — Framework upgrade including Tailwind, DaisyUI, i18n rewrites
5. **Deno Investigation** — Feasibility study for Node → Deno transition
6. **Supabase Migration** — Backend migration from Strapi with schema planning, auth, RLS, storage
7. **Admin App Migration** — Move admin functions from Strapi plugin to frontend Admin App

For further details about the milestones, see [ROADMAP](../ROADMAP.md).

## Current Milestone: v2.0 Supabase Migration

**Goal:** Migrate the backend from Strapi v5 to Supabase with a working schema, auth, RLS, and supporting services — validated by load tests to resolve key design decisions (answer storage, localization).

**Target features:**
- Supabase schema with multi-tenant support (shared infrastructure, data isolated by organization)
- Candidate answer storage evaluated via load tests (JSON vs relational)
- Multilingual content storage pattern
- Candidate and admin authentication via Supabase Auth
- Email and storage service integration (replacing Strapi SES/S3 plugins)
- Application settings migration
- Admin CRUD with Row Level Security
- Local Docker dev environment + cloud-ready configuration
- Reusable migration artifacts for production use

## Key Decisions

| Decision                          | Rationale                                                                    | Outcome   |
| --------------------------------- | ---------------------------------------------------------------------------- | --------- |
| Separate milestones per H2        | Each initiative is independent enough to plan and complete separately        | — Pending |
| E2E first                         | Need test coverage before making breaking changes in migrations              | — Pending |
| Playwright-driven data management | Use existing Admin Tools UI via Playwright, or direct API if straightforward | — Pending |
| Test IDs over text selectors      | More resilient to content/i18n changes                                       | — Pending |
| User stories as test basis        | Mine existing tests and docs for comprehensive coverage                      | — Pending |

---

_Last updated: 2026-03-12 after milestone v2.0 Supabase Migration started_
