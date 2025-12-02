# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

OpenVAA is a framework for building Voting Advice Applications (VAAs). It's a monorepo containing frontend (SvelteKit), backend (Strapi CMS), and shared packages for matching algorithms, filters, and data management.

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

**Application**:

- `@openvaa/strapi` - Strapi v5 backend with Postgres at `backend/vaa-strapi/`. Custom plugins in `backend/vaa-strapi/src/plugins/`
- `@openvaa/frontend` - SvelteKit 2 frontend at `frontend/`. Uses Tailwind + DaisyUI for styling

**Development**:

- `@openvaa/shared-config` - Shared ESLint, TypeScript, and build configs

### Module Resolution & Dependencies

**IDE Resolution**: Uses TypeScript project references in `tsconfig.json` files. You don't need to build dependencies for IDE to resolve imports.

**Runtime Resolution**: NPM/Node requires built `.js` files. Always build dependee packages before running dependent packages. The `yarn dev` script watches packages and rebuilds automatically.

**Dependency Flow**: `core` → `data`/`matching`/`filters` → `app-shared` → `frontend`/`strapi`

When adding interdependencies:

1. Add to `package.json`: `"@openvaa/core": "workspace:^"`
2. Add TypeScript reference: `"references": [{ "path": "../core/tsconfig.json" }]`

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

- Data adapters in `frontend/src/lib/api/adapters/` abstract data source (Strapi vs local JSON)
- Universal adapter pattern in `frontend/src/lib/api/base/universalAdapter.ts`
- Server-side and client-side backend URLs differ when using Docker (see `.env`)
- Route structure uses optional locale param: `frontend/src/routes/[[lang=locale]]/`
- Separate apps for voters (`frontend/src/routes/[[lang=locale]]/(voters)/`) and candidates (`frontend/src/routes/[[lang=locale]]/candidate/`)

**Backend Customization** (`@openvaa/strapi`):

- Automatic data loading on init: Question Types, App Settings, Translation overrides
- Custom permissions via `backend/vaa-strapi/src/extensions/users-permissions/strapi-server.ts`
- Route policies: `restrict-populate` applied to all routes
- Mock data generation controlled by env vars (dev/test only)

**Settings Architecture**:

- `StaticSettings` - hardcoded in `packages/app-shared/src/settings/staticSettings.ts` (colors, locales, fonts, admin email). Edit these to customize your VAA instance
- `DynamicSettings` - loaded from backend (election data, feature flags)

## Docker Development

The stack runs four services:

1. `frontend` - SvelteKit on port 5173
2. `strapi` - Backend on port 1337 (admin at /admin, default admin/admin)
3. `postgres` - Database on port 5432
4. `awslocal` - LocalStack for S3/SES on port 4566

**Port conflicts**: Ensure 1337, 5173, 5432, 4566 are free. Change in `.env` if needed.

**Environment variables**: When using Docker, only edit the root `.env` file (not `frontend/.env` or `backend/vaa-strapi/.env`).

**Mock data**: Set `GENERATE_MOCK_DATA_ON_INITIALISE=true` in `.env` to seed database with fake candidates, questions, etc. Use `GENERATE_MOCK_DATA_ON_RESTART=true` to regenerate on every restart (clears database - dev only).

**Hot reloading**: Frontend hot reloads by default. Backend can hot reload if you mount `./backend/vaa-strapi:/opt` in `backend/vaa-strapi/docker-compose.dev.yml` (slow, not recommended unless actively developing backend).

## Frontend (SvelteKit)

**Framework**: SvelteKit 2 with adapter-node for production

**Routing**:

- Optional locale in all routes: `[[lang=locale]]`
- Voters app: `frontend/src/routes/[[lang=locale]]/(voters)/`
- Candidate app: `frontend/src/routes/[[lang=locale]]/candidate/`
- Candidate protected routes: `frontend/src/routes/[[lang=locale]]/candidate/(protected)/`

**Styling**: Tailwind CSS + DaisyUI components. Theme colors defined in `packages/app-shared/src/settings/staticSettings.ts`.

**Path aliases** (defined in `frontend/svelte.config.js`):

- `$types` → `frontend/src/lib/types`
- `$voter` → `frontend/src/lib/voter`
- `$candidate` → `frontend/src/lib/candidate`

**Key directories**:

- `frontend/src/lib/api/` - Data adapters (Strapi, local JSON)
- `frontend/src/lib/components/` - Reusable Svelte components
- `frontend/src/lib/contexts/` - Svelte context providers
- `frontend/src/lib/i18n/` - Internationalization (sveltekit-i18n)
- `frontend/src/lib/utils/` - Helper functions
- `frontend/src/hooks.server.ts` - SvelteKit hooks (auth, locale handling)

**Build**: `yarn workspace @openvaa/frontend build` (also copies `frontend/data/` folder if present for local adapter)

## Backend (Strapi)

**Version**: Strapi v5 with TypeScript

**Database**: Postgres (required, not SQLite in production)

**Authentication**:

- Public read access to API (configured in permissions)
- Candidates authenticate via `users-permissions` plugin
- Pre-registration requires API token with `users-permissions.candidate.preregister` permission
- Bank authentication via OpenID Connect (Signicat) - see `.env` for IdP settings

**Plugins**:

- AWS S3 for media uploads
- AWS SES for emails
- `@openvaa/strapi-admin-tools` (local plugin in `backend/vaa-strapi/src/plugins/openvaa-admin-tools/`)

**Type generation**: Run `yarn workspace @openvaa/strapi generate:types` after schema changes to update `backend/vaa-strapi/types/`.

**Adding new content types**:

1. Add to `CONTENT_API` list in `backend/vaa-strapi/src/util/api.ts`
2. Update permissions in `backend/vaa-strapi/src/extensions/users-permissions/strapi-server.ts`
3. Add route config with `restrict-populate` policy (see `backend/vaa-strapi/README.md`)

**Email**: Uses AWS SES. Control sender with `MAIL_FROM`, `MAIL_FROM_NAME`, `MAIL_REPLY_TO` env vars.

## Common Workflows

### Starting a new feature

1. `yarn build:app-shared` (if not already built)
2. Understand the feature scope - read relevant package READMEs
3. For frontend work: check existing components in `frontend/src/lib/components/`, `frontend/src/lib/dynamic-components` and `frontend/src/lib/candidate/components`
4. For backend work: check content types and custom API in Strapi admin

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

### Debugging matching algorithm

See `packages/matching/examples/example.ts` for usage:

```bash
cd packages/matching
tsx examples/example.ts
```

### Translation updates

Dynamic translations are synced from frontend to backend:

```bash
yarn sync:translations
```

### Fixing "module not found" errors

```bash
yarn build:app-shared  # Most common fix
yarn build:shared      # If core/data/matching/filters are involved
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

Fully containerized with Docker. See `docs/README.md` deployment section for:

- Render + AWS S3/SES setup
- Environment variable configuration
- Production build process
- Domain configuration

Recent costs (2024-2025): $80-350/month depending on traffic and instance sizes.

## Troubleshooting

**Docker issues**: Run `yarn dev:down` to clean everything and start fresh.

**Port conflicts**: Check ports 1337, 5173, 5432, 4566 are free. Edit `.env` to change.

**TypeScript errors in IDE**: Run `yarn build:shared` to rebuild all packages.

**Mock data not generating**: Check `GENERATE_MOCK_DATA_ON_INITIALISE=true` in root `.env` and ensure database is empty.

**Frontend can't reach backend**: Verify `PUBLIC_BROWSER_BACKEND_URL` and `PUBLIC_SERVER_BACKEND_URL` in `.env`.

## Roadmap

**2025 H2**: Documentation site, AI features, application manager UI, first production release

**2026**: Plugins/customization, multi-tenant model, migration from Strapi to Supabase, Svelte 5 upgrade
