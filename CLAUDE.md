# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

OpenVAA is a framework for building Voting Advice Applications (VAAs). It's a monorepo containing frontend (SvelteKit), backend (Supabase), and shared packages for matching algorithms, filters, and data management.

## Development Commands

### Setup

```bash
yarn install                    # Install all workspace dependencies
yarn dev                        # Start Supabase + Vite dev server
yarn dev:down                   # Stop Supabase services
yarn dev:stop                   # Stop Supabase services
yarn dev:reset                  # Reset database (drops and recreates)
yarn dev:status                 # Show Supabase service status
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

### Supabase Commands

```bash
yarn supabase:start           # Start local Supabase instance
yarn supabase:stop            # Stop local Supabase instance
yarn supabase:reset           # Reset database (drops and recreates)
yarn supabase:status          # Show service status
yarn supabase:types           # Regenerate TypeScript types from schema
yarn supabase:lint            # Run SQL linter on all migrations
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

**Type generation**: Run `yarn supabase:types` after schema changes to update `packages/supabase-types/`

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
yarn dev:reset
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

## Important Implementation Notes

- **Never** commit sensitive data (API keys, tokens, .env files)
- **Test accessibility** - app must be WCAG 2.1 AA compliant
- **Use TypeScript strictly** - avoid `any`, prefer explicit types
- **Matching algorithms** - questions creating subdimensions (like categorical) need special handling
- **Missing values** - use `MISSING_VALUE` from `@openvaa/core` in matching contexts, `undefined` or empty literals elsewhere
- **Localization** - all user-facing strings must support multiple locales (see `packages/app-shared/src/settings/staticSettings.ts` for `supportedLocales`)
- **Always** check that your code against the [Code review checklist](docs/code-review-checklist.md)

## Deployment

Frontend is deployed as a Docker container. Backend uses Supabase Cloud.

See `render.example.yaml` for Render deployment configuration:

- Frontend service with Supabase environment variables (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`)
- No backend service needed on Render -- Supabase Cloud handles the database and auth
- Domain and cache disk configuration

## Troubleshooting

**Database issues**: Run `yarn dev:reset` to reset the database (drops and recreates all tables with fresh seed data).

**Port conflicts**: Check ports 54321 (Supabase API), 54323 (Supabase Studio), 5173 (frontend) are free.

**TypeScript errors in IDE**: Run `yarn build` to rebuild all packages.

**Frontend can't reach backend**: Verify `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in `.env`.

## Roadmap

**2025 H2**: Documentation site, AI features, application manager UI, first production release

**2026**: Plugins/customization, multi-tenant model, Svelte 5 upgrade

## Code Review

When performing code review or developing new features, make sure to check all the items in the [Code Review Checklist](/.agents/code-review-checklist.md).
