# OpenVAA Framework Evolution

## What This Is

OpenVAA is an open-source framework for building Voting Advice Applications (VAAs). It's a monorepo with a SvelteKit frontend, Supabase backend, and shared packages for matching algorithms, filters, and data management. The monorepo uses Turborepo for cached builds, Changesets for versioning, and publishes core packages to npm. This project covers framework evolution: modernizing infrastructure, building Claude development skills, upgrading the frontend stack, and stabilizing the Supabase backend.

## Core Value

A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## Current Milestone: v2.5 Dev Data Seeding Toolkit

**Goal:** Ship a template-driven, modular data generator in `@openvaa/dev-tools` that populates a freshly-reset local database with realistic OpenVAA data in one command, and retire the hand-maintained E2E JSON fixtures in favor of generator-produced data.

**Target features:**
- Modular per-entity generator architecture (one small generator per non-system public table, independently overridable)
- Unified template model — declarative config with smart defaults; hand-authored + synthetic rows mix freely in any collection
- Built-in default and E2E templates; custom templates load from any file path
- `generateTranslationsForAllLocales` flag honoring `staticSettings.supportedLocales`
- CLI surface — `seed`, `seed:teardown`, root-level `yarn dev:reset-with-data`
- `tests/seed-test-data.ts` rewritten on top of the new generator; legacy JSON fixtures retired
- Matching-realistic synthetic candidate positions (party-axis clustering, not uniform random)
- Optional deterministic seed (`seed: number`) for reproducible faker output

## Current State

v2.4 shipped 2026-03-28. Full Svelte 5 rewrite complete — context system migrated end-to-end ($state/$derived), global runes mode enabled (compilerOptions.runes + dynamicCompileOptions node_modules exclusion), all 167 per-file runes directives removed, 10 admin route files + root layout migrated. 613 unit tests pass; E2E suite runs with 15 passed / 19 pre-existing data-loading race failures / 55 cascade — deferred to the "Svelte 5 Migration Cleanup" backlog milestone.

v2.3 delivered Idura FTN bank authentication with the IdentityProvider abstraction layer; deployments switch between Signicat and Idura via `PUBLIC_IDENTITY_PROVIDER_TYPE`. v2.2 paused (Deno feasibility validated, evaluation deferred).

Post-v2.4 housekeeping on `feat-gsd-roadmap`: `@openvaa/dev-tools` workspace added with `keygen` and `pem-to-jwk` CLIs (see `docs/key-generation.md`); `*.pem` patterns added to `.gitignore`; legacy `apps/frontend/README.md` removed.

Known infrastructure issue: local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue, fix with `supabase stop && supabase start`.

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
- ✓ Candidate registration email flow end-to-end (invite, Mailpit, session) — v2.1
- ✓ Candidate password reset email flow end-to-end (request, Mailpit, new password) — v2.1
- ✓ Fresh candidate registration with protected route access — v2.1
- ✓ Feedback popup reliable timing on results page — v2.1
- ✓ Provider abstraction layer (IdentityProvider interface, configurable claim mapping) — v2.3
- ✓ Idura FTN bank auth (server-side JAR, private_key_jwt token exchange) — v2.3
- ✓ Provider-agnostic /api/oidc/{authorize,token,callback} routes — v2.3
- ✓ identity-callback Edge Function with configurable identityMatchProp/extractClaims — v2.3
- ✓ Signicat backward compatibility (PKCE + client_secret flow unchanged) — v2.3
- ✓ 71 new unit tests for provider abstraction, JWE, JAR, Edge Function claims — v2.3
- ✓ Bank-auth E2E tests with @bank-auth tag (disabled by default) — v2.3
- ✓ Context system rewrite with Svelte 5 native reactivity ($state/$derived) — v2.4
- ✓ All remaining Svelte 4 route files migrated to runes (admin app + root layout) — v2.4
- ✓ Global runes mode enabled (compilerOptions.runes: true + dynamicCompileOptions for node_modules) — v2.4
- ✓ All 167 per-file runes opt-ins removed — v2.4
- ✓ 141 consumer components migrated to direct property access — v2.4
- ✓ @openvaa/dev-tools workspace with keygen + pem-to-jwk CLIs — post-v2.4

### Active
- [ ] Modular per-entity generator architecture (`@openvaa/dev-tools/src/seed/`)
- [ ] Unified template model with smart defaults and mixed hand-authored + synthetic rows
- [ ] Built-in default template and E2E template; custom templates loadable from any path
- [ ] `generateTranslationsForAllLocales` flag honoring `staticSettings.supportedLocales`
- [ ] CLI surface — `seed`, `seed:teardown`, root-level `yarn dev:reset-with-data`
- [ ] `tests/seed-test-data.ts` rewritten on top of the new generator; legacy JSON fixtures retired
- [ ] Matching-realistic synthetic candidate positions (party-axis clustering)
- [ ] Optional deterministic `seed: number` for reproducible faker output

### Future
- [ ] Claude Skills: architect, components, LLM (deferred to post-Svelte 5 stabilization)
- [ ] Deno full evaluation and go/no-go report (runtime validated in v2.2, evaluation/report deferred)
- [ ] Admin app migration (frontend Admin App)
- [ ] Merge app_settings and app_customization tables
- [ ] WithAuth interface refactoring
- [ ] TSConfig-based importable adapter loading
- [ ] Automated security and secrets scanning and testing
- [ ] Trusted publishing for npm (OIDC, deferred until after initial manual publish)
- [ ] Changeset bot for PR reminders (deferred from v1.1)
- [ ] SQL linting and formatting tooling
- [ ] Svelte 5 migration cleanup — resolve 19 pre-existing data-loading race E2E failures; retire toStore/fromStore bridges
- [ ] Settings & configuration paradigm reorganization
- [ ] Generalize candidate app to support parties (organizations) as first-class registrants
- [ ] AdminWriter rename (naming cleanup, carried from v2.4)

### Out of Scope

- Mobile native apps — web-first approach
- Package manager migration (pnpm) — high risk, low reward with Turborepo on Yarn 4
- Nx adoption — overkill for 9-package monorepo
- Lerna adoption — legacy tool, Nx wrapper
- semantic-release — poor monorepo support vs explicit-intent Changesets
- Publishing all packages — only core/data/matching/filters are general-purpose
- oxlint migration — Svelte template linting not supported; re-evaluate when Svelte support ships

## Context

The project is a mature monorepo used for real election deployments. As of v2.1:

- **Codebase:** 138 plans + 6 tasks completed across 9 milestones (27 days, 2026-03-01 to 2026-03-27)
- **Tech stack:** SvelteKit 2, Svelte 5 (fully runes-idiomatic), Tailwind 4, DaisyUI 5, Paraglide JS, Node 22, Supabase, Postgres, Yarn 4.13, Turborepo 2.8, Changesets
- **Backend:** Supabase with 17-table schema, 269 pgTAP tests, 79 RLS policies, 3 Edge Functions (identity-callback, invite-candidate, send-email)
- **Auth:** Provider abstraction layer supporting Signicat (PKCE + client_secret) and Idura (JAR + private_key_jwt) via env config
- **Build system:** Turborepo with content-based caching, tsup for publishable packages, @tailwindcss/vite
- **Testing:** Playwright E2E (597 unit tests, 50 E2E specs), Vitest unit tests, pgTAP database tests, bank-auth E2E (opt-in)
- **CI:** GitHub Actions with pgTAP, E2E via supabase CLI, skill-drift-check, Turborepo remote caching
- **Publishing:** 4 packages (@openvaa/core, data, matching, filters) ready for npm with ESM output
- **Deno validated:** Runtime works (SvelteKit, auth, E2E), evaluation deferred — research in `.planning/phases/42-runtime-validation-and-poc/`
- **Known issues:** Svelte 5 pushState reactivity bug (10 E2E tests skipped); context system uses Svelte 4 store patterns (CTX-01 deferred); local imgproxy crashes intermittently

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
7. ~~**E2E Test Stabilization**~~ — Shipped v2.1 (2026-03-26)
8. ~~**Deno Feasibility Study**~~ — Paused v2.2 (2026-03-27, feasibility validated, evaluation deferred)
9. ~~**Idura FTN Auth**~~ — Shipped v2.3 (2026-03-27)
10. ~~**Full Svelte 5 Rewrite**~~ — Shipped v2.4 (2026-03-28)
11. **Dev Data Seeding Toolkit** — v2.5 (in progress)
12. **Claude Skills (remaining)** — Architect, components, LLM skills
13. **Admin App Migration** — Move admin functions from Strapi plugin to frontend Admin App
14. **Security Scanning** — Automated security, secrets scanning, and testing
15. **Svelte 5 Migration Cleanup** — Resolve deferred data-loading race condition, clear remaining runes-mode TODOs, retire toStore/fromStore bridges, re-enable the 19 skipped E2E tests
16. **Settings & Configuration Reorg** — Rationalize the split between StaticSettings, DynamicSettings, env vars, and the `app_settings` / `app_customization` tables; unify the customization paradigm across voter, candidate, and admin apps
17. **Parties in Candidate App** — Generalize the candidate-app preregistration and profile flows so party organizations (not just individual candidates) can onboard, manage members, and maintain their public-facing data

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
| Single layoutState enum over separate $state vars | Svelte 5 hydration bug: multiple $state writes in .then() from $effect don't trigger re-renders | ✓ Good (v2.1) |
| PopupRenderer runes-mode wrapper | Svelte 5 legacy-mode root layout can't detect store changes from async callbacks | ✓ Good (v2.1) |
| Invite flow redirects to login page | Session from verifyOtp doesn't reliably persist through client-side navigation | ✓ Good (v2.1) |
| Session-based password reset (no code param) | Auth callback verifyOtp establishes session; code param was Strapi-era legacy | ✓ Good (v2.1) |
| Deno as runtime only (not toolchain replacement) | Yarn 4 workspaces, Turborepo, ESLint unsupported on Deno; adapter-node works | ✓ Good (v2.2) |
| Pause v2.2 after feasibility validation | No forcing function (CI/production) to maintain Deno configs; avoid drift | ✓ Good (v2.2) |
| Roll back Deno code, preserve research | Code changes would rot without enforcement; research artifacts have lasting value | ✓ Good (v2.2) |
| --unstable-bare-node-builtins for Paraglide JS | async_hooks import without node: prefix; Deno plans to stabilize this flag | — Pending (v2.2) |
| Provider abstraction over direct replacement | IdentityProvider interface lets deployments switch providers via env var | ✓ Good (v2.3) |
| Configurable claim mapping (identityMatchProp) | Provider-agnostic identity matching — no code changes needed for new providers | ✓ Good (v2.3) |
| /api/oidc/* route grouping | Callback, token, authorize all under /api/oidc/ — clean API boundary | ✓ Good (v2.3) |
| Rename signicat-callback → identity-callback | Single provider-agnostic Edge Function vs parallel functions | ✓ Good (v2.3) |
| No existing user migration on provider switch | Clean break — simpler than dual-lookup, no code maintaining legacy paths | ✓ Good (v2.3) |
| Unit tests only for OIDC flow (no mock server) | jose generates synthetic tokens; real provider testing is manual | ✓ Good (v2.3) |

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

_Last updated: 2026-04-22 at milestone v2.5 Dev Data Seeding Toolkit start_
