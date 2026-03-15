# CLAUDE.md

This file provides guidance to Claude Code when working with this repository. Domain-specific package knowledge is in `.claude/skills/`.

## Overview

OpenVAA is a framework for building Voting Advice Applications (VAAs). Monorepo with SvelteKit frontend, Supabase backend, and shared packages for matching algorithms, filters, and data management.

> Legacy Strapi backend at `backend/vaa-strapi/`. Being sunset after frontend adapter migration (v3.0). See its README for details.

## Development Commands

### Setup

```bash
yarn install                    # Install all workspace dependencies
yarn dev                        # Start full Docker stack (frontend, backend, postgres, localstack)
yarn dev:down                   # Clean shutdown (removes containers, volumes, images)
yarn dev:stop                   # Stop without removing volumes
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
yarn workspace @openvaa/strapi dev
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

**Application**: `frontend` (SvelteKit 2), `strapi` (legacy backend at `backend/vaa-strapi/`)

**Development**: `shared-config` (ESLint, TypeScript, build configs)

### Module Resolution & Dependencies

**IDE Resolution**: Uses TypeScript project references in `tsconfig.json` files. You don't need to build dependencies for IDE to resolve imports.

**Runtime Resolution**: NPM/Node requires built `.js` files. Always build dependee packages before running dependent packages. The `yarn dev` script watches packages and rebuilds automatically.

**Dependency Flow**: `core` -> `data`/`matching`/`filters` -> `app-shared` -> `frontend`/`strapi`

When adding interdependencies:

1. Add to `package.json`: `"@openvaa/core": "workspace:^"`
2. Add TypeScript reference: `"references": [{ "path": "../core/tsconfig.json" }]`

### Settings

`StaticSettings` in `packages/app-shared/src/settings/staticSettings.ts`, `DynamicSettings` loaded from backend.

## Docker Development

The stack runs four services:

1. `frontend` - SvelteKit on port 5173
2. `strapi` - Backend on port 1337 (admin at /admin, default admin/admin)
3. `postgres` - Database on port 5432
4. `awslocal` - LocalStack for S3/SES on port 4566

**Port conflicts**: Ensure 1337, 5173, 5432, 4566 are free. Change in `.env` if needed.

**Environment variables**: When using Docker, only edit the root `.env` file (not `frontend/.env` or `backend/vaa-strapi/.env`).

**Mock data**: Set `GENERATE_MOCK_DATA_ON_INITIALISE=true` in `.env` to seed dev data.

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

# Full E2E (requires clean docker stack)
yarn dev:down
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

Fully containerized with Docker. See `docs/README.md` for Render setup, environment variables, and domain configuration.

## Troubleshooting

**Docker issues**: Run `yarn dev:down` to clean everything and start fresh.

**Port conflicts**: Check ports 1337, 5173, 5432, 4566 are free. Edit `.env` to change.

**TypeScript errors in IDE**: Run `yarn build:shared` to rebuild all packages.

**Mock data not generating**: Check `GENERATE_MOCK_DATA_ON_INITIALISE=true` in root `.env` and ensure database is empty.

**Frontend can't reach backend**: Verify `PUBLIC_BROWSER_BACKEND_URL` and `PUBLIC_SERVER_BACKEND_URL` in `.env`.

## Roadmap

**Current:** v5.0 Claude Skills -- domain-expert skills for each major framework area. **Next:** v3.0 Frontend Adapter Migration (Strapi to Supabase), v4.0 Svelte 5 Upgrade

## Code Review

When performing code review or developing new features, make sure to check all the items in the [Code Review Checklist](/.agents/code-review-checklist.md).
