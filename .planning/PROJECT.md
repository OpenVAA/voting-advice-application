# OpenVAA Framework Evolution

## What This Is

OpenVAA is an open-source framework for building Voting Advice Applications (VAAs). It's a monorepo with a SvelteKit frontend, Strapi CMS backend, and shared packages for matching algorithms, filters, and data management. The monorepo uses Turborepo for cached builds, Changesets for versioning, and publishes core packages to npm. This project covers framework evolution: modernizing infrastructure, building Claude development skills, upgrading the frontend stack, and migrating to a new backend.

## Core Value

A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## Current State

v1.4 shipped 2026-03-22. The entire Svelte 5 migration is complete — both voter app (v1.3) and candidate app (v1.4) are fully runes-idiomatic with zero legacy Svelte 4 patterns. All E2E tests pass. The frontend infrastructure (Tailwind 4, DaisyUI 5, Paraglide JS) was modernized in v1.2. The monorepo (Turborepo, Changesets, npm publishing) was refreshed in v1.1. E2E testing was established in v1.0.

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
- ✓ Svelte 5 frontend infrastructure (fresh scaffold, Tailwind 4, DaisyUI 5) — v1.2
- ✓ Full dependency bump across monorepo (Node 22, Yarn catalog 30 entries) — v1.2
- ✓ Paraglide JS i18n with compile-time type safety and runtime override wrapper — v1.2
- ✓ OXC toolchain evaluation (deferred — Svelte template linting not supported) — v1.2
- ✓ Svelte 5 content migration — voter app and shared components fully runes-idiomatic — v1.3
- ✓ All leaf/container/route components use $props(), $derived, $effect, $bindable, snippet props — v1.3
- ✓ Zero legacy Svelte 4 patterns in voter app (no $:, on:event, <slot>, createEventDispatcher) — v1.3
- ✓ 26 voter-app E2E tests passing after migration — v1.3
- ✓ Svelte 5 candidate app migration — all 25 route files runes-idiomatic — v1.4
- ✓ Zero legacy Svelte 4 patterns in candidate app — v1.4
- ✓ Zero TypeScript errors in candidate app — v1.4
- ✓ All candidate-app E2E tests passing (20 tests across 5 files) — v1.4

### Active
- [ ] Context system rewrite with Svelte 5 native reactivity ($state/$derived)
- [ ] Claude development skills for architecture, components, data, matching, filters, LLM
- [ ] Deno feasibility study (Node → Deno transition)
- [ ] Supabase migration (Strapi → Supabase with schema, auth, RLS, storage)
- [ ] Admin app migration (Strapi plugin → frontend Admin App)
- [ ] Automated security and secrets scanning and testing
- [ ] Trusted publishing for npm (OIDC, deferred until after initial manual publish)
- [ ] Changeset bot for PR reminders (deferred from v1.1)

### Out of Scope

- Mobile native apps — web-first approach
- Package manager migration (pnpm) — high risk, low reward with Turborepo on Yarn 4
- Nx adoption — overkill for 9-package monorepo
- Lerna adoption — legacy tool, Nx wrapper
- semantic-release — poor monorepo support vs explicit-intent Changesets
- Publishing all packages — only core/data/matching/filters are general-purpose
- oxlint migration — Svelte template linting not supported; re-evaluate when Svelte support ships

## Context

The project is a mature monorepo used for real election deployments. As of v1.4:

- **Codebase:** 86 plans completed across 5 milestones (22 days, 2026-03-01 to 2026-03-22)
- **Tech stack:** SvelteKit 2, Svelte 5 (fully runes-idiomatic — voter + candidate apps), Tailwind 4, DaisyUI 5, Paraglide JS, Node 22, Strapi v5, Postgres, Yarn 4.13, Turborepo 2.8, Changesets
- **Build system:** Turborepo with content-based caching, tsup for publishable packages, @tailwindcss/vite
- **Testing:** Playwright 1.58.2 E2E (26 voter-app tests, 20 candidate-app tests), Vitest unit tests
- **CI:** GitHub Actions with Turborepo remote caching, HTML test reports, Node 22
- **Publishing:** 4 packages (@openvaa/core, data, matching, filters) ready for npm with ESM output
- **Known issues:** Strapi vitest pinned to ^2.1.8 (CJS/ESM incompatibility); Strapi has TS errors in mock data generation; Svelte 5 snippet reactivity bug (deferred); TODO[Svelte 5] markers remain in context system (deferred to future milestone)

The backend will eventually move from Strapi to Supabase. The frontend may later move from Node to Deno. Context system rewrite and Claude development skills are the next milestones.

## Constraints

- **Tech stack (current)**: SvelteKit 2, Svelte 5, Tailwind 4, DaisyUI 5, Paraglide JS, Node 22, Strapi v5, Postgres, Yarn 4.13, Turborepo 2.8
- **Tech stack (target)**: Svelte 5 runes (content migration), Supabase, potentially Deno
- **Publishing**: @openvaa/core, data, matching, filters publishable to npm; app-shared retains CJS for Strapi
- **Testing**: Playwright 1.58.2 for E2E, Vitest for unit tests
- **Backward compatibility**: Framework is used by external deployers — changes must not break deployment patterns
- **Backend transition**: Strapi investment should be minimal given planned Supabase migration

## Milestones

Each major initiative is a separate milestone, executed in order:

1. ~~**E2E Testing Framework**~~ — Shipped v1.0 (2026-03-12)
2. ~~**Monorepo Refresh**~~ — Shipped v1.1 (2026-03-15)
3. ~~**Svelte 5 Migration (Infrastructure)**~~ — Shipped v1.2 (2026-03-18)
4. ~~**Svelte 5 Migration (Content — Voter App)**~~ — Shipped v1.3 (2026-03-20)
5. ~~**Svelte 5 Migration (Content — Candidate App)**~~ — Shipped v1.4 (2026-03-22)
6. **Claude Skills** — Domain-expert skills for architecture, components, data, matching, filters, LLM
7. **Deno Investigation** — Feasibility study for Node → Deno transition
8. **Supabase Migration** — Backend migration from Strapi with schema planning, auth, RLS, storage
9. **Admin App Migration** — Move admin functions from Strapi plugin to frontend Admin App
10. **Security Scanning** — Automated security, secrets scanning, and testing

### Claude Skills — Scope Notes (for milestone #5)

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

| Fresh Svelte 5 scaffold in-place  | Clean install over in-place upgrade — leverage recommended Svelte 5 infra    | ✓ Good      |
| Svelte 5 infra before content     | Validate scaffold + deps before migrating components and routes              | ✓ Good      |
| Paraglide JS over sveltekit-i18n  | Compile-time type safety, active maintenance, runtime override wrapper for backend translations | ✓ Good |
| DaisyUI 5 via @plugin directive   | CSS-first config, auto-registered colors, eliminated manual @theme color block | ✓ Good     |
| Node 22 monorepo-wide             | Consistent engine across CI, Docker, dev; aligns with LTS schedule           | ✓ Good      |
| Defer oxlint migration            | Svelte template linting not supported — dealbreaker for monorepo with .svelte files | ✓ Good |
| Yarn catalog expansion (30 entries) | Single source of truth for shared deps across workspaces                    | ✓ Good      |
| Voter app first for content migration | Scope v1.3 to voter app + shared components; candidate app deferred to v1.4 | ✓ Good      |
| Zero legacy patterns bar             | No `$:`, `on:event`, `<slot>` — fully idiomatic Svelte 5 after migration    | ✓ Good      |
| All E2E tests as regression gate      | Migration isn't done until voter-app E2E suite passes (26 tests)            | ✓ Good      |

| Leaf components migrated first    | 98 leaf files before containers — validates runes patterns at scale          | ✓ Good      |
| bind:this for exported functions  | `bind:functionName` incompatible with runes mode — use `bind:this` refs      | ✓ Good      |
| HTMLAttributes for Select restProps | `SvelteHTMLElements['select']` too narrow when spread onto div/input        | ✓ Good      |
| $derived.by() for multi-branch logic | Complex nextAction/submitRouting computations in candidate routes           | ✓ Good      |
| $state() for bind: variables      | Variables used with bind: in runes mode require $state() for reactivity     | ✓ Good      |
| API-based ToU workaround in E2E   | Vite dev-mode streaming bug blocks client-side ToU acceptance; use admin API | ✓ Good      |
| Cookie domain transfer in E2E     | SvelteKit use:enhance redirects to localhost; Playwright uses 127.0.0.1     | ✓ Good      |
| Auth cookie caching in E2E        | Strapi rate limiter (~7/min) exhausted by serial test logins                | ✓ Good      |

---

---

_Last updated: 2026-03-22 after v1.4 milestone_
