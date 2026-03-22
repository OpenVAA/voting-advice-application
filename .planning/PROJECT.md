# OpenVAA Framework Evolution

## What This Is

OpenVAA is an open-source framework for building Voting Advice Applications (VAAs). It's a monorepo with a SvelteKit frontend, Strapi CMS backend, and shared packages for matching algorithms, filters, and data management. The monorepo uses Turborepo for cached builds, Changesets for versioning, and publishes core packages to npm. This project covers framework evolution: modernizing infrastructure, building Claude development skills, upgrading the frontend stack, and migrating to a new backend.

## Core Value

A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## Current State

v2.0 shipped 2026-03-22. The Supabase backend integration is complete — Strapi has been fully removed and replaced with Supabase (17 tables, 269 pgTAP tests, 79 RLS policies, 3 Edge Functions). The frontend uses Supabase adapters for all data access, and auth uses cookie-based PKCE sessions. CI runs pgTAP tests and E2E tests against supabase CLI. Claude Skills for data, matching, filters, and database domains are integrated.

The entire codebase is Svelte 5 runes-idiomatic with Supabase as the sole backend. 10 E2E tests are skipped due to a Svelte 5 `pushState` reactivity bug (framework-level issue). The context system still uses Svelte 4 store patterns (deferred to CTX-01).

v2.0 integration complete: Phase 29 (Skills + Planning), Phase 30 (Supabase Backend Foundation), Phase 31 (Schema Reorganization), Phase 32 (Auth Infrastructure), and Phase 34 (Adapter Foundation) completed. Supabase adapter infrastructure is in place: mixin, 5 utility functions (mapRow, getLocalized, localizeRow, toDataObject, storageUrl) with 40 tests, dynamic adapter switch wired for 'supabase' type. Default remains 'strapi' until Phase 38 cleanup. Phase 35 builds DataProvider/DataWriter/FeedbackWriter on this foundation.

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
- ✓ Supabase backend integrated (17 tables, 269 pgTAP tests, 3 Edge Functions) — v2.0
- ✓ Frontend Supabase adapter (DataProvider, DataWriter, AdminWriter, FeedbackWriter) — v2.0
- ✓ Auth migrated to Supabase cookie-based PKCE sessions — v2.0
- ✓ E2E tests migrated to SupabaseAdminClient and Mailpit — v2.0
- ✓ Schema reorganization verified (numbered files, p_ prefixes, public. qualifiers) — v2.0
- ✓ Strapi fully removed (262 files, 47,524 lines) — v2.0
- ✓ CI/CD updated (pgTAP, skill-drift-check, Supabase CLI E2E) — v2.0
- ✓ Claude Skills integrated (data, matching, filters, database) — v2.0
- ✓ Planning documents merged from parallel branch — v2.0

### Active
- [ ] Resolve 10 skipped E2E tests (Svelte 5 pushState reactivity bug workaround needed)
- [ ] Context system rewrite with Svelte 5 native reactivity ($state/$derived)
- [ ] AdminWriter rename (naming cleanup)

### Future
- [ ] Claude Skills: architect, components, LLM (deferred to post-Svelte 5 stabilization)
- [ ] Deno feasibility study (Node → Deno transition)
- [ ] Admin app migration (frontend Admin App)
- [ ] Merge app_settings and app_customization tables
- [ ] WithAuth interface refactoring
- [ ] TSConfig-based importable adapter loading
- [ ] Automated security and secrets scanning and testing
- [ ] Trusted publishing for npm (OIDC, deferred until after initial manual publish)
- [ ] Changeset bot for PR reminders (deferred from v1.1)
- [ ] SQL linting and formatting tooling

### Out of Scope

- Mobile native apps — web-first approach
- Package manager migration (pnpm) — high risk, low reward with Turborepo on Yarn 4
- Nx adoption — overkill for 9-package monorepo
- Lerna adoption — legacy tool, Nx wrapper
- semantic-release — poor monorepo support vs explicit-intent Changesets
- Publishing all packages — only core/data/matching/filters are general-purpose
- oxlint migration — Svelte template linting not supported; re-evaluate when Svelte support ships

## Context

The project is a mature monorepo used for real election deployments. As of v2.0:

- **Codebase:** 128 plans completed across 6 milestones (22 days, 2026-03-01 to 2026-03-22)
- **Tech stack:** SvelteKit 2, Svelte 5 (fully runes-idiomatic), Tailwind 4, DaisyUI 5, Paraglide JS, Node 22, Supabase, Postgres, Yarn 4.13, Turborepo 2.8, Changesets
- **Backend:** Supabase with 17-table schema, 269 pgTAP tests, 79 RLS policies, 3 Edge Functions
- **Build system:** Turborepo with content-based caching, tsup for publishable packages, @tailwindcss/vite
- **Testing:** Playwright E2E (542 unit tests, 46 E2E specs), Vitest unit tests, pgTAP database tests
- **CI:** GitHub Actions with pgTAP, E2E via supabase CLI, skill-drift-check, Turborepo remote caching
- **Publishing:** 4 packages (@openvaa/core, data, matching, filters) ready for npm with ESM output
- **Known issues:** Svelte 5 pushState reactivity bug (10 E2E tests skipped); context system uses Svelte 4 store patterns (CTX-01 deferred)

## Constraints

- **Tech stack**: SvelteKit 2, Svelte 5, Tailwind 4, DaisyUI 5, Paraglide JS, Node 22, Supabase, Postgres, Yarn 4.13, Turborepo 2.8
- **Publishing**: @openvaa/core, data, matching, filters publishable to npm
- **Testing**: Playwright 1.58.2 for E2E, Vitest for unit tests, pgTAP for Supabase database
- **Backward compatibility**: Framework is used by external deployers — changes must not break deployment patterns
- **Strapi removed**: Backend is Supabase-only as of v2.0

## Milestones

Each major initiative is a separate milestone, executed in order:

1. ~~**E2E Testing Framework**~~ — Shipped v1.0 (2026-03-12)
2. ~~**Monorepo Refresh**~~ — Shipped v1.1 (2026-03-15)
3. ~~**Svelte 5 Migration (Infrastructure)**~~ — Shipped v1.2 (2026-03-18)
4. ~~**Svelte 5 Migration (Content — Voter App)**~~ — Shipped v1.3 (2026-03-20)
5. ~~**Svelte 5 Migration (Content — Candidate App)**~~ — Shipped v1.4 (2026-03-22)
6. ~~**Branch Integration**~~ — Shipped v2.0 (2026-03-22)
7. **Claude Skills (remaining)** — Architect, components, LLM skills (deferred from parallel branch)
8. **Deno Investigation** — Feasibility study for Node → Deno transition
9. **Admin App Migration** — Move admin functions from Strapi plugin to frontend Admin App
10. **Security Scanning** — Automated security, secrets scanning, and testing

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

| JSONB answer storage over relational | 2-10x faster reads at all scales; simpler schema; concurrent writes adequate | ✓ Good (sb-v2.0) |
| JSONB localization with get_localized() | 3-tier fallback (requested→default→first key); avoids translation table joins | ✓ Good (sb-v2.0) |
| Custom Access Token Hook for JWT roles | Roles injected at auth time; no per-query role lookups | ✓ Good (sb-v2.0) |
| 79 per-operation RLS policies | Granular control; pgTAP-testable; clear security boundaries | ✓ Good (sb-v2.0) |
| Remove question_templates table | Admin tooling will handle templates at project creation; avoids runtime merge complexity | ✓ Good (sb-v2.0) |
| external_id for bulk import/export | Enables idempotent data sync without exposing internal UUIDs | ✓ Good (sb-v2.0) |
| Edge Functions for auth flows | Candidate invite + Signicat bank auth run server-side in Deno | ✓ Good (sb-v2.0) |
| Inline skills over subagent skills | Domain knowledge loaded in context, not forked; lower latency, better for reference | ✓ Good (sb-v5.0) |
| Defer architect/components/LLM skills | Frontend architecture will change with Svelte 5; skills would be immediately outdated | ✓ Good (sb-v5.0) |
| Skill drift CI check | Automated detection of stale skills when source targets change | — Pending (sb-v5.0) |
| Supabase adapter mixin pattern | Shared typed client across DataProvider/DataWriter/AdminWriter; init({ fetch }) for SSR | ✓ Good (sb-v3.0) |
| Cookie-based sessions over JWT tokens | Supabase PKCE flow with httpOnly cookies; no client-side token management | ✓ Good (sb-v3.0) |
| Keep jose and qs packages | Verified used outside Strapi adapter (identity provider, route utils) | ✓ Good (sb-v3.0) |
| Docker Compose as production test tool | Rewritten from 4-service dev stack to single-service frontend build verifier | ✓ Good (sb-v3.0) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

\_Last updated: 2026-03-22 after Phase 39 (CI/CD and Documentation) completed — v2.0 milestone complete_
