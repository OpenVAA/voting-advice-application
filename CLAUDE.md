# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

OpenVAA is a framework for building Voting Advice Applications (VAAs). It's a monorepo containing frontend (SvelteKit), backend (Supabase), and shared packages for matching algorithms, filters, and data management.

## Development Commands

### Setup

```bash
yarn install                    # Install all workspace dependencies
yarn dev                        # Full stack: start local Supabase + package watcher + Vite dev server
yarn db:stop                    # Stop local Supabase
yarn db:reset                   # Reset the database only (drops + recreates from migrations + seed.sql)
yarn db:status                  # Show Supabase service status
```

### Building

```bash
yarn build                     # Build all packages (Turborepo - cached, parallel)
yarn build --filter=@openvaa/core  # Build a specific package and its dependencies
```

Turborepo handles dependency ordering and caching automatically. Second builds with no changes complete in under 5 seconds.

### Testing

```bash
yarn test:unit                 # Run all unit tests (vitest)
yarn test:unit:watch          # Run unit tests in watch mode
yarn test:e2e                 # Run Playwright E2E tests (requires yarn dev running)
yarn playwright install       # Install Playwright browsers
```

### Linting & Formatting

```bash
yarn lint:check               # Check linting without fixing
yarn lint:fix                 # Fix linting issues
yarn format:check             # Check formatting without fixing
yarn format                   # Format all files with Prettier
```

### Running Individual Workspaces

```bash
yarn workspace @openvaa/frontend dev
```

### Database & Stack Commands

**Harmonised naming:** `db:*` scripts touch **only the database/Supabase**; `dev:*` scripts drive the **full stack** (DB + shared-package watcher + frontend). There are no `supabase:*` scripts and no deprecated `dev:*` aliases — those were removed at v2.10 close.

```bash
# --- Database only (Supabase + dev-seed; never touches the vite cache or frontend) ---
yarn db:start                 # Start local Supabase (Postgres, Auth, Storage, Edge Functions, Inbucket)
yarn db:stop                  # Stop local Supabase
yarn db:status                # Show Supabase service status
yarn db:reset                 # Reset the DB only: ensure Supabase is up, then `supabase db reset` (migrations + seed.sql)
yarn db:reset-with-data       # db:reset, then db:seed --template default
yarn db:seed                  # Run @openvaa/dev-seed (accepts --template <name>, --likert-only, --seed <int>, --external-id-prefix <str>)
yarn db:seed:default          # db:seed --template default
yarn db:seed:teardown         # Remove all seed_-prefixed rows + portraits
yarn db:types                 # Regenerate TypeScript types from schema
yarn db:lint:sql              # Run SQL linter on all migrations (sqlfluff + Splinter advisors)

# --- Full stack (DB + watcher + frontend) ---
yarn dev                      # Start Supabase + package watcher + Vite dev server
yarn dev:clean                # Wipe apps/frontend/.svelte-kit + apps/frontend/node_modules/.vite (vite-cache reset)
yarn dev:reset                # db:reset, then launch the full stack (yarn dev)
yarn dev:reset-with-data      # db:reset-with-data, then launch the full stack (yarn dev)
```

### Single Test Development

For packages (packages/\*\*):

```bash
cd packages/matching
yarn test:unit                # Run tests for this package only
```

For frontend:

```bash
cd apps/frontend
yarn test:unit                # Run frontend tests only
```

## Architecture

### Monorepo Structure

The project uses Yarn 4 workspaces with these modules:

**Core Logic Packages** (`packages/`):

- `@openvaa/core` - Shared types, interfaces, and utilities for all modules (Entity, Id, Serializable, matching types)
- `@openvaa/data` - Universal data model for VAAs (elections, candidates, questions, answers). Provides hierarchical object model with single source of truth
- `@openvaa/matching` - Generic matching algorithms supporting multiple distance metrics (Manhattan, Euclidean, directional). Maps entities/voters to positions in multidimensional space
- `@openvaa/filters` - Entity filtering by properties/answers (candidates, parties, etc.)
- `@openvaa/app-shared` - Shared between frontend and backend (application settings, extended data types, utilities). Builds to both ESM (frontend) and CommonJS (backend)

**Experimental** (`packages/`):

- `@openvaa/llm` - LLM integrations
- `@openvaa/argument-condensation` - Argument processing
- `@openvaa/question-info` - Question metadata

**Applications** (`apps/`):

- `@openvaa/supabase` - Supabase backend at `apps/supabase/`. Schema, migrations, Edge Functions, pgTAP tests. Local dev via `supabase start`
- `@openvaa/frontend` - SvelteKit 2 frontend at `apps/frontend/`. Uses Tailwind + DaisyUI for styling
- `@openvaa/docs` - Documentation site (SvelteKit) at `apps/docs/`

**Development**:

- `@openvaa/shared-config` - Shared ESLint, TypeScript, and build configs

### Module Resolution & Dependencies

**IDE Resolution**: Uses TypeScript project references in `tsconfig.json` files. You don't need to build dependencies for IDE to resolve imports.

**Runtime Resolution**: NPM/Node requires built `.js` files. Always build dependee packages before running dependent packages. The `yarn dev` script builds packages before starting the dev server.

**Dependency Flow**: `core` -> `data`/`matching`/`filters` -> `app-shared` -> `frontend`/`supabase`

When adding interdependencies:

1. Add to `package.json`: `"@openvaa/core": "workspace:^"`
2. Add TypeScript reference: `"references": [{ "path": "../core/tsconfig.json" }]`

**Canonical package paradigm:** New `packages/<name>/` workspaces follow the shape of `@openvaa/core` (lowest in the dep graph; tiebreaker per the canonical-paradigm doc). Same `package.json` scripts + `exports`, `tsconfig.json` extends `@openvaa/shared-config/ts`, `tsup.config.ts`, flat `src/index.ts` barrel, no `.js` extensions on TS-internal relative imports. See `packages/README.md` for the full reference.

### Build System

The project uses [Turborepo](https://turbo.build) for build orchestration. Configuration is in `turbo.json` at the project root. Turborepo provides:

- Dependency-aware builds (packages build in topological order)
- Local caching (unchanged packages are skipped on rebuild)
- Parallel execution (independent packages build simultaneously)

The `.turbo/` directory contains the local cache and should not be committed to git.

### Key Architectural Patterns

**Data Model Philosophy** (`@openvaa/data`):

- Single source of truth - all objects accessed by reference, never copied
- Smart default values - missing values become empty literals (empty strings, arrays, etc.)
- `MISSING_VALUE` constant from `@openvaa/core` for explicitly missing matching values
- Hierarchical model with `root` getter on all objects
- Questions and Entities implement interfaces required by `@openvaa/matching`

**Matching Algorithm Paradigm** (`@openvaa/matching`):

- Treats voters and candidates as positions in multidimensional space
- Each question creates 1+ dimensions (e.g., categorical questions create subdimensions)
- Distance measured and normalized to 0-100% of maximum possible distance
- Supports projection to lower-dimensional spaces (e.g., 2D political compass)
- `Match` objects contain entity reference, distance, and optional subMatches for categories
- Only matches questions the voter has answered

**Instance Checks**: When using `instanceof` with custom classes (especially in `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters`), be aware this was problematic in the past (see commit 87efe19a). Ensure classes are properly exported and imported.

**Frontend Data Flow**:

- Supabase adapter in `apps/frontend/src/lib/api/adapters/supabase/` provides all data access
- No adapter switch -- Supabase is the only production adapter (local adapter available for static data)
- Universal adapter pattern in `apps/frontend/src/lib/api/base/universalAdapter.ts`
- Route structure uses optional locale param: `apps/frontend/src/routes/[[lang=locale]]/`
- Separate apps for voters (`apps/frontend/src/routes/[[lang=locale]]/(voters)/`) and candidates (`apps/frontend/src/routes/[[lang=locale]]/candidate/`)

**Settings Architecture**:

- `StaticSettings` - hardcoded in `packages/app-shared/src/settings/staticSettings.ts` (colors, locales, fonts, admin email). Edit these to customize your VAA instance
- `DynamicSettings` - loaded from backend (election data, feature flags)

## Development Environment

The development stack uses Supabase CLI for backend services:

1. `supabase start` - Launches local Supabase (Postgres, Auth, Storage, Edge Functions, Inbucket email)
2. `yarn dev` - Starts Vite dev server for the frontend (port 5173)

**Supabase Dashboard**: http://127.0.0.1:54323 (local admin UI)
**Inbucket**: http://127.0.0.1:54324 (email testing)
**Supabase API**: http://127.0.0.1:54321

**Docker Compose** (`docker-compose.dev.yml`) is only used for production build testing, not development.

**Environment variables**: Edit the root `.env` file (copied from `.env.example`).

**Seed data**: The database is seeded automatically on `supabase start` via `apps/supabase/seed.sql`.

## Frontend (SvelteKit)

**Framework**: SvelteKit 2 with adapter-node for production

**Routing**:

- Optional locale in all routes: `[[lang=locale]]`
- Voters app: `apps/frontend/src/routes/[[lang=locale]]/(voters)/`
- Candidate app: `apps/frontend/src/routes/[[lang=locale]]/candidate/`
- Candidate protected routes: `apps/frontend/src/routes/[[lang=locale]]/candidate/(protected)/`

**Styling**: Tailwind CSS + DaisyUI components. Theme colors defined in `packages/app-shared/src/settings/staticSettings.ts`.

**Path aliases** (defined in `apps/frontend/svelte.config.js`):

- `$types` -> `apps/frontend/src/lib/types`
- `$voter` -> `apps/frontend/src/lib/voter`
- `$candidate` -> `apps/frontend/src/lib/candidate`

**Key directories**:

- `apps/frontend/src/lib/api/` - Data adapters (Supabase, local)
- `apps/frontend/src/lib/components/` - Reusable Svelte components
- `apps/frontend/src/lib/contexts/` - Svelte context providers
- `apps/frontend/src/lib/i18n/` - Internationalization (sveltekit-i18n)
- `apps/frontend/src/lib/utils/` - Helper functions
- `apps/frontend/src/hooks.server.ts` - SvelteKit hooks (Supabase session, locale handling)

**Build**: `yarn workspace @openvaa/frontend build` (also copies `apps/frontend/data/` folder if present for local adapter)

## Backend (Supabase)

**Database**: PostgreSQL managed by Supabase (local via `supabase start`, production via Supabase Cloud)

**Authentication**:

- Cookie-based sessions with PKCE
- Candidates authenticate via Supabase Auth
- Pre-registration via Supabase Edge Function
- Bank authentication via OpenID Connect (Signicat) - see `.env` for IdP settings

**Schema**: See `apps/supabase/migrations/` for the database schema

**Edge Functions**: See `apps/supabase/functions/` for serverless functions (preregister, send-email, admin)

**Tests**: pgTAP tests in `apps/supabase/tests/`

**Type generation**: Run `yarn db:types` after schema changes to update `packages/supabase-types/`

## Common Workflows

### Starting a new feature

1. `yarn build` (builds all packages with caching -- fast if already built)
2. Understand the feature scope - read relevant package READMEs
3. For frontend work: check existing components in `apps/frontend/src/lib/components/`, `apps/frontend/src/lib/dynamic-components` and `apps/frontend/src/lib/candidate/components`
4. For backend work: check schema in `apps/supabase/migrations/` and Edge Functions in `apps/supabase/functions/`

### Running tests after changes

```bash
# Quick check
yarn test:unit

# Full E2E (requires Supabase running)
yarn db:reset
yarn dev
# Wait for services to be healthy
yarn test:e2e
```

### Debugging matching algorithm

See `packages/matching/examples/example.ts` for usage:

```bash
cd packages/matching
tsx examples/example.ts
```

### Fixing "module not found" errors

```bash
yarn build             # Rebuilds all packages (cached -- only changed packages rebuild)
```

### Seeding local data

```bash
yarn db:reset-with-data                        # db:reset + default template (Finnish demo, 4 locales); DB only — does not touch the vite cache
yarn db:seed --template e2e/base               # E2E test data for manual Playwright runs (canonical base dataset; bare `e2e` retired in Phase 93)
yarn db:seed --template e2e/base --likert-only # E2E voter-fixture-compatible seed: restricts opinion questions to singleChoiceOrdinal, keeps all info questions
yarn db:seed --template ./my-template.ts       # custom templates from filesystem
yarn db:seed:teardown                          # remove all seed_-prefixed rows + portraits
```

**Note on `--likert-only`:** the voter-fixture `answeredVoterPage` (`tests/tests/fixtures/voter.fixture.ts`) iterates Likert-only opinion questions and races against non-ordinal opinion questions (boolean / categorical / number) introduced by Phase 74+. Pass `--likert-only` to drop those non-ordinal opinion questions before running voter-app E2E specs. The flag is a no-op for templates without a `questions.fixed[]` array.

**Yarn arg-forwarding caveat:** `yarn db:reset-with-data` seeds the **`default`** template, not the e2e dataset — it is not the e2e path. Passing `--likert-only` to it (`yarn db:reset-with-data --likert-only`) attaches the flag to the trailing `default`-template seed, not to `e2e/base`. For a Likert-only e2e seed, use the explicit chain so the flag lands on the `db:seed` invocation: `yarn db:reset && yarn db:seed --template e2e/base --likert-only`. (`db:reset` no longer touches the vite cache; if you need a clean Vite cache too, `yarn dev` wipes it on startup, or run `yarn dev:clean`.)

See `packages/dev-seed/README.md` for authoring custom templates (mixing
`fixed[]` hand-authored rows with synthetic `count`, 4-locale expansion,
latent-factor answer model overrides).

## Important Implementation Notes

- **Never** commit sensitive data (API keys, tokens, .env files)
- **Test accessibility** - app must be WCAG 2.1 AA compliant
- **Use TypeScript strictly** - avoid `any`, prefer explicit types
- **Matching algorithms** - questions creating subdimensions (like categorical) need special handling
- **Missing values** - use `MISSING_VALUE` from `@openvaa/core` in matching contexts, `undefined` or empty literals elsewhere
- **Localization** - all user-facing strings must support multiple locales (see `packages/app-shared/src/settings/staticSettings.ts` for `supportedLocales`)
- **Always** check your code against the [Code review checklist](/.agents/code-review-checklist.md)

### Context Destructuring Rule (Svelte 5)

OpenVAA's Svelte 5 contexts (`getCandidateContext()`, `getVoterContext()`, `getAppContext()`, plus generic `getContext()` consumers) expose two property classes that have **different reactivity semantics under destructuring**:

1. **Stable references** — translation function `t`, route helper `getRoute` (still a `{ current }` handle), `darkMode`, `answers`, the `userData` object (whose internal `$state` getters are accessed by property), lifecycle functions (`logout`, `register`, `preregister`, `startEvent`, `*Countdown`). These can be safely destructured:
   ```ts
   const { t, getRoute } = getVoterContext();
   ```

2. **Reactive accessors** — getters returning `$state`- or `$derived`-backed values that change over time. `appSettings`, `dataRoot`, and `locale` (which became reactive accessors in v2.13 Phase 113 — the handle flatten; previously stable `{ current }` handles, now bare reactive fields). Plus: `selectedElections`, `selectedConstituencies`, `opinionQuestions`, `infoQuestions`, `infoQuestionCategories`, `opinionQuestionCategories`, `questionBlocks`, `unansweredOpinionQuestions`, `unansweredRequiredInfoQuestions`, `requiredInfoQuestions`, `answersLocked`, `profileComplete`, `electionsSelectable`, `constituenciesSelectable`, `matches`, `nominationsAvailable`, `resultsAvailable`, `idTokenClaims`, `isPreregistered`, `isAuthenticated`, `preregistrationElections`, `preregistrationNominations`, `newUserEmail`. These **MUST** be read via direct property access:

   ```ts
   const ctx = getCandidateContext();
   const opinionQuestions = $derived(ctx.opinionQuestions); //  correct
   // const { opinionQuestions } = ctx;                     //  captures initial empty array
   ```

   **Why:** Destructuring invokes the getter ONCE at component-init time and binds the captured value (the initial empty `$state` array) to a local var. Subsequent reads of the local var are reads of a static binding — not getter calls — and do not propagate dependency invalidation. Reads via `ctx.X` re-invoke the getter inside the tracking scope each time, preserving the reactive edge.

**Canonical pattern** (`apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-79`):

```ts
const ctx = getVoterContext();
// Stable: destructure ok.
const { t, getRoute, answers } = ctx;
// Reactive: read via ctx.X (aliased through $derived for template readability).
// appSettings/dataRoot/locale are reactive accessors post Phase 113 — never destructure them.
const appSettings = $derived(ctx.appSettings);
const dataRoot = $derived(ctx.dataRoot);
const elections = $derived(ctx.selectedElections);
const constituencies = $derived(ctx.selectedConstituencies);
```

<!-- Updated v2.13 Phase 113: appSettings/dataRoot/locale flattened from { current } handles to bare reactive fields; reclassified stable→reactive. -->

For a one-time, non-reactive init read (e.g. building a `const mailto` or a `topBarSettings.use({...})` call at component setup), read the value off `ctx` directly (`ctx.appSettings.current` — or post-plan-04 `ctx.appSettings`) rather than aliasing through `$derived`; the `$derived` alias is for values consumed reactively in the template / `$derived` / `$effect`, and aliasing it for a one-shot init read triggers a `state_referenced_locally` warning.

**Diagnostic origin:** v2.6 Phase 61 Plan 03 — see `.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md`. The `candidateContext` `$derived` chain captured initial empty arrays at component init and never re-evaluated after the data layer populated, because consumers destructured reactive properties out of the context object. The fix landed by switching consumers to `ctx.X` reads. The in-tree explanation lives at `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:106-123`.

**Caveat — genuinely store-shaped stable members:** A few context members are still `{ current }` rune handles (e.g. `getRoute`) and are STABLE — they remain safe to destructure. NOTE: as of v2.13 Phase 113, `appSettings`/`dataRoot`/`locale` are NO LONGER stores nor `{ current }` handles — they are bare reactive fields and **must NOT be destructured** (destructuring captures the value once at init and stops updating on navigation — the Phase-61 destructure-trap). Read them via `ctx.appSettings` (and during the Phase-113 transition window, `ctx.appSettings.current`). Only the genuinely-handle-shaped stable members (like `getRoute`) stay destructurable.

**Lint enforcement** is currently a guideline, not an automated rule. A future phase may add a custom svelte-eslint rule if violations recur.

### Svelte Warning-Accepted Format

When a Svelte / vite-plugin-svelte / SvelteKit warning is intentionally accepted (rather than fixed at the source), use this inline format:

```
// svelte-warning: accepted — <one-sentence-rationale>
```

Place the comment IMMEDIATELY ABOVE the warning-triggering line. The rationale should explain WHY the warning is accepted (e.g., "framework-emitted false positive for prop reassignment in init phase"; "intentional non-reactive read at mount per design"). Per v2.8 Phase 70 Cat A `// reason:` block convention; the `svelte-warning: accepted` prefix scopes the comment to vite-plugin-svelte / SvelteKit / Svelte-compiler-emitted warnings specifically (vs. ESLint `// reason:` which scopes to lint-rule acceptances).

Use sparingly — preferred outcome is to FIX the warning at the source. Acceptance is the fallback when the warning is a framework false-positive OR a design tradeoff that can't be cleanly fixed.

## Deployment

Frontend is deployed as a Docker container. Backend uses Supabase Cloud.

See `render.example.yaml` for Render deployment configuration:

- Frontend service with Supabase environment variables (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`)
- No backend service needed on Render -- Supabase Cloud handles the database and auth
- Domain and cache disk configuration

## Troubleshooting

**Database issues**: Run `yarn db:reset` to reset the database only (drops and recreates all tables from migrations + `seed.sql`). For a full-stack reset that also wipes the vite cache and relaunches, use `yarn dev:reset`.

**Port conflicts**: Check ports 54321 (Supabase API), 54323 (Supabase Studio), 5173 (frontend) are free.

**TypeScript errors in IDE**: Run `yarn build` to rebuild all packages.

**Frontend can't reach backend**: Verify `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in `.env`.

## Roadmap

**2025 H2**: Documentation site, AI features, application manager UI, first production release

**2026**: Plugins/customization, multi-tenant model, Svelte 5 upgrade

## Code Review

When performing code review or developing new features, make sure to check all the items in the [Code Review Checklist](/.agents/code-review-checklist.md).

## Skill Routing

- **Spike findings for voting-advice-application-gsd** — two domains:
  - Svelte 5 rune migration (spikes 001–012): reactive context shapes, `runeLocalStorage` helper, `untrack()` write-after-read invariant, token-keyed overlay registry, SSR-aware synchronous-init for appSettings, voterContext/candidateContext orchestration, destructure-trap reproduction, consumer-migration codemod, 4-wave migration order, HMR DX, `$derived.by` over per-field `page` reads for getRoute.
  - Page navigation + View Transitions + a11y (spikes 013–016): SvelteKit already reuses `+page.svelte` across param-only URL changes (production: 9/25 ≈ 36% element survival); the user-perceived "redraw" is reactive content-node regeneration, fixed via `onNavigate(navigation => Promise(startViewTransition))` with per-element `view-transition-name`; unified-layout-with-empty-leaf shape (matches results pattern) + `{#key question.type}` for variant remount; WCAG 2.1 AA gate via `afterNavigate(focus({preventScroll: true}))` + `aria-live="polite"` route announcer + reduced-motion belt-and-braces.
  → `Skill("spike-findings-voting-advice-application-gsd")`
