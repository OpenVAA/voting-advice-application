# CLAUDE.md

This file provides guidance to Claude Code when working with this repository. Domain-specific package knowledge is in `.claude/skills/`.

## Overview

OpenVAA is a framework for building Voting Advice Applications (VAAs). Monorepo with SvelteKit frontend, Supabase backend, and shared packages for matching algorithms, filters, and data management.

## Development Commands

### Setup

```bash
yarn install                    # Install all workspace dependencies
yarn dev                        # Start Supabase backend + SvelteKit frontend dev server
yarn dev:down                   # Stop Supabase backend services
yarn dev:stop                   # Stop Supabase backend services
yarn dev:reset                  # Reset database and re-seed dev data
yarn dev:status                 # Show Supabase service status
```

### Building

```bash
yarn build:app-shared          # Build @openvaa/app-shared (required before most dev work)
yarn build:shared              # Build all packages in /packages
```

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
yarn workspace @openvaa/app-shared build
```

### Single Test Development

For packages (packages/\*\*):

```bash
cd packages/matching
yarn test:unit                # Run tests for this package only
```

For frontend:

```bash
cd frontend
yarn test:unit                # Run frontend tests only
```

## Architecture

### Monorepo Structure

The project uses Yarn 4 workspaces:

**Core Logic** (`packages/`): `core`, `data`, `matching`, `filters`, `app-shared` (builds to ESM + CJS)

**Experimental** (`packages/`): `llm`, `argument-condensation`, `question-info`

**Application**: `frontend` (SvelteKit 2)

**Backend**: `apps/supabase` (Supabase CLI project with migrations, Edge Functions, seed data)

**Development**: `shared-config` (ESLint, TypeScript, build configs)

### Module Resolution & Dependencies

**IDE Resolution**: Uses TypeScript project references in `tsconfig.json` files. You don't need to build dependencies for IDE to resolve imports.

**Runtime Resolution**: NPM/Node requires built `.js` files. Always build dependee packages before running dependent packages. The `yarn dev` script watches packages and rebuilds automatically.

**Dependency Flow**: `core` -> `data`/`matching`/`filters` -> `app-shared` -> `frontend`

When adding interdependencies:

1. Add to `package.json`: `"@openvaa/core": "workspace:^"`
2. Add TypeScript reference: `"references": [{ "path": "../core/tsconfig.json" }]`

### Settings

`StaticSettings` in `packages/app-shared/src/settings/staticSettings.ts`, `DynamicSettings` loaded from backend.

## Local Development

The development stack uses Supabase CLI + SvelteKit dev server:

1. `supabase` - Backend services on ports 54321-54324 (API, DB, Inbucket, Studio)
2. `frontend` - SvelteKit on port 5173

**Starting development**: `yarn dev` (runs `supabase start` then SvelteKit dev server)

**Database reset**: `yarn dev:reset` runs `supabase db reset` which applies all migrations and seed data.

**Email testing**: Inbucket at http://127.0.0.1:54323 captures all emails sent by GoTrue.

**Database Studio**: Supabase Studio at http://127.0.0.1:54324 for visual database management.

**Environment variables**: The `.env.example` file contains Supabase local dev defaults. Copy to `.env` for local development. Supabase service configuration is in `apps/supabase/supabase/config.toml`.

## Frontend (SvelteKit)

**Framework**: SvelteKit 2 with adapter-node for production

**Routing**:

- Optional locale in all routes: `[[lang=locale]]`
- Voters app: `frontend/src/routes/[[lang=locale]]/(voters)/`
- Candidate app: `frontend/src/routes/[[lang=locale]]/candidate/`
- Candidate protected routes: `frontend/src/routes/[[lang=locale]]/candidate/(protected)/`

**Styling**: Tailwind CSS + DaisyUI components. Theme colors defined in `packages/app-shared/src/settings/staticSettings.ts`.

**Path aliases** (defined in `frontend/svelte.config.js`):

- `$types` -> `frontend/src/lib/types`
- `$voter` -> `frontend/src/lib/voter`
- `$candidate` -> `frontend/src/lib/candidate`

## Common Workflows

### Starting a new feature

1. `yarn build:app-shared` (if not already built)
2. Understand the feature scope - read relevant package READMEs
3. Check existing components in `frontend/src/lib/components/` and `frontend/src/lib/candidate/components`

### Running tests after changes

```bash
# Quick check
yarn test:unit

# Full E2E (requires running dev stack)
yarn dev:reset
yarn dev
# Wait for stack to be healthy
yarn test:e2e
```

### Translation updates

```bash
yarn sync:translations          # Sync dynamic translations from frontend to backend
```

### Fixing "module not found" errors

```bash
yarn build:app-shared  # Most common fix
yarn build:shared      # If core/data/matching/filters are involved
```

## Implementation Rules

- **Never** commit sensitive data (API keys, tokens, .env files)
- **Test accessibility** - app must be WCAG 2.1 AA compliant
- **Use TypeScript strictly** - avoid `any`, prefer explicit types
- **Localization** - all user-facing strings must support multiple locales (see `packages/app-shared/src/settings/staticSettings.ts` for `supportedLocales`)
- **Always** check your code against the [Code review checklist](/.agents/code-review-checklist.md)

## Deployment

The frontend is containerized with Docker. The backend uses Supabase (cloud-hosted or self-hosted). See `docs/README.md` for setup, environment variables, and domain configuration.

## Troubleshooting

**Supabase issues**: Run `yarn dev:reset` to reset database, or `yarn supabase:stop` then `yarn supabase:start` to restart services.

**Port conflicts**: Check ports 5173, 54321-54324 are free. Supabase ports are configured in `apps/supabase/supabase/config.toml`.

**TypeScript errors in IDE**: Run `yarn build:shared` to rebuild all packages.

**Dev data**: Run `yarn dev:reset` to reset and re-seed the database with `apps/supabase/supabase/seed.sql`.

**Frontend can't reach Supabase**: Verify `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in `.env` match `supabase status` output.

## Roadmap

**Current:** v3.0 Frontend Adapter Migration (Supabase backend) -- nearing completion. **Next:** v4.0 Svelte 5 Upgrade

## Code Review

When performing code review or developing new features, make sure to check all the items in the [Code Review Checklist](/.agents/code-review-checklist.md).
