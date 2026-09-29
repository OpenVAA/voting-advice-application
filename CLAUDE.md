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
yarn playwright install       # Install Playwright browsers

# One preflight-confirmed E2E run. The wrapper starts Supabase AND the dev server itself, on the
# project the suite seeds, and writes every artifact of the run into --run-dir.
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset

# The same specs against a server you started yourself. That server MUST be scoped to the
# project the suite seeds, or the preflight aborts the run and names both ids.
yarn test:e2e                 # Run Playwright E2E tests; EXCLUDES the @probe specs
```

#### E2E Hard Rule (cardinal failure)

> **Failing E2E tests are a CARDINAL FAILURE. No task may proceed, complete, or be marked done while any E2E test is failing — the tests must pass first, full stop.**

- **No "known-flaky" exemptions.** There is no such thing as an acceptable flaky test in this project. A test that fails intermittently is a real defect (in the test or the code) and MUST be ironed out — not skipped, retried-until-green, or annotated as flaky. Diagnose the root cause and fix it.
- **Prefer E2E for interim verification.** When checking work-in-progress results, prefer running the E2E suite over ad-hoc manual checks. The recommended method is to **run the whole suite** (`yarn test:e2e`) — it does not take long, and a full-suite run is the trusted signal.
- A "did not run" E2E test counts as a failure (e.g. cascade failures from an upstream dependency), not a pass.

#### E2E preflight (served-application gate)

Every E2E run begins with a preflight in Playwright's global setup. It aborts the run with exit 1 before any spec body executes, and there is no flag and no environment variable that skips it.

- **What it asserts:** that the served application's own HTTP response proves the page under test came from **this** checkout — the server must serve, and echo back, this working tree's absolute path via Vite's `/@fs` endpoint — not merely that something answered on the port.
- **What it asserts second:** that the served application queries the same project the harness seeds. The server publishes its configured project id on the HTML root, and global setup compares it with the id the suite owns; a disagreement, an absent attribute or an unsubstituted placeholder each abort the run naming both ids. Without it, a server on the wrong project produces a wall of assertion failures about missing content and no line naming the cause.
- **Alternate port:** `FRONTEND_PORT` is the escape hatch, in two working forms. Put `FRONTEND_PORT=<port>` in the root `.env` for a persistent alternate port used by both the dev server and the suite, or prefix a single command (`FRONTEND_PORT=5273 yarn dev`) for a one-off override, which wins over the file.
- **`strictPort`:** `yarn dev` now fails loudly (`Error: Port <port> is already in use`) instead of quietly moving to the next port. That closes same-address drift — the mechanism behind the original incident. It does **not** close a wildcard shadow-bind, where another process holds `*:<port>` and our server still binds `[::1]:<port>` without a bind error (measured); that case is what the preflight catches.

See [`tests/README.md`](/tests/README.md) § Run for the fuller treatment, including how to read a preflight failure message field by field.

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
yarn db:seed                  # Run @openvaa/dev-seed (accepts --template <name>, --seed <int>, --external-id-prefix <str>)
yarn db:seed:default          # db:seed --template default
yarn db:seed:teardown         # Remove all seed_-prefixed rows + portraits
yarn db:types                 # Regenerate TypeScript types from schema
yarn db:lint:sql              # Lint the APPLIED database, not the migration files: `supabase db lint --schema public --fail-on warning` (plpgsql_check) + the two Splinter-derived advisors in apps/supabase/scripts/lint-schema.mjs. Both halves need a running local Postgres (lint-schema.mjs connects to DATABASE_URL, default 127.0.0.1:54322), so `yarn db:start` first — in CI too

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
- `@openvaa/app-shared` - Shared between frontend and backend (application settings, extended data types, utilities). **ESM-only** — `packages/app-shared/tsup.config.ts` declares `format: ['esm']` and the `exports` map carries only an `import` condition; every consumer is `type: module`, so nothing requires a second module format

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

**Canonical package paradigm:** New `packages/<name>/` workspaces follow the shape of `@openvaa/core` (lowest in the dep graph; tiebreaker per the canonical-paradigm doc). Same `package.json` scripts + `exports`, a `tsconfig.json` extending `@openvaa/shared-config/ts`, a `tsup.config.ts`, a flat top-level barrel (as in `packages/core/src/index.ts`), no `.js` extensions on TS-internal relative imports. See `packages/README.md` for the full reference.

### Build System

[Turborepo](https://turbo.build) orchestrates builds from `turbo.json` at the repo root: topological ordering, local caching, parallel execution. The `.turbo/` cache directory must not be committed.

### Key Architectural Patterns

**Data model** (`@openvaa/data`): a hierarchical object model with a single source of truth — every object is accessed by reference and never copied, missing values become empty literals, and every object carries a `root` getter. Entity variants, question types, the nomination system and the smart-default rules are in `.claude/skills/data/object-model.md` — `Skill("data")`.

**Matching** (`@openvaa/matching`): voters and entities are positions in a multidimensional space; each question contributes one or more dimensions, and distance is normalised to 0-100% of the maximum possible. Distance metrics, subdimension handling for categorical questions, missing-value imputation and the `Match`/`SubMatch` result shape are in `.claude/skills/matching/algorithm-reference.md` — `Skill("matching")`.

**Instance Checks**: When using `instanceof` with custom classes (especially in `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters`), be aware this was problematic in the past (see commit 87efe19a). Ensure classes are properly exported and imported.

**Frontend Data Flow**:

- Supabase adapter in `apps/frontend/src/lib/api/adapters/supabase/` provides all client-side data access
- No client-side adapter switch -- `apps/frontend/src/lib/api/adapters/` holds only `apiRoute` and `supabase`, and `apps/frontend/src/lib/api/dataProvider.ts` reaches unconditionally for the Supabase one. There is **no client-side local adapter**. A local adapter for static data does still exist on the **server** side, under `apps/frontend/src/lib/server/api/adapters/local/`, selected at runtime by `staticSettings.dataAdapter.type === 'local'` in `apps/frontend/src/lib/server/api/dataProvider.ts`
- Universal adapter pattern in `apps/frontend/src/lib/api/base/universalAdapter.ts`

**Settings Architecture**:

- `StaticSettings` - hardcoded in `packages/app-shared/src/settings/staticSettings.ts` (colors, locales, fonts, admin email). Edit these to customize your VAA instance
- `DynamicSettings` - loaded from the backend (election data, feature flags)

## Development Environment

The development stack uses Supabase CLI for backend services:

1. `supabase start` - Launches local Supabase (Postgres, Auth, Storage, Edge Functions, Inbucket email)
2. `yarn dev` - Starts Vite dev server for the frontend (port 5173)

**Supabase Dashboard**: http://127.0.0.1:54323 (local admin UI)
**Inbucket**: http://127.0.0.1:54324 (email testing)
**Supabase API**: http://127.0.0.1:54321

**Docker Compose** (`docker-compose.dev.yml`) is only used for production build testing, not development.

**Environment variables**: Edit the root `.env` file (copied from `.env.example`).

**Project scoping (`PUBLIC_PROJECT_ID`)**: names the project every query the application issues is scoped to. For a normal local stack the value is the project `apps/supabase/supabase/seed.sql` creates, `00000000-0000-0000-0000-000000000001`. There is deliberately **no fallback**: an unset, empty or non-canonical value throws when the Supabase adapter is constructed — naming the variable and the remedy — rather than letting queries succeed against some other project's rows. The `identity-callback` Edge Function reads the same variable under the same name; the local edge runtime resolves it from the **process environment** rather than from the root `.env`, so export it in the shell that starts the stack when you need that function locally.

**Seed data**: The database is seeded automatically on `supabase start` via `apps/supabase/supabase/seed.sql`.

## Frontend (SvelteKit)

**Framework**: SvelteKit 2 with adapter-node for production. Svelte 5 runes are forced on for every file outside `node_modules` (`apps/frontend/svelte.config.js`).

**Routing**:

- No locale route param: locale is resolved by Paraglide's `url` strategy (`strategy: ['url', 'cookie', 'baseLocale']`), so no `ROUTE` constant carries a locale segment
- Voters app: `apps/frontend/src/routes/(voters)/`
- Candidate app: `apps/frontend/src/routes/candidate/`, protected routes under `apps/frontend/src/routes/candidate/(protected)/`
- Route constants, the route builder and the app gates live in `apps/frontend/src/lib/routes/` and are imported as `$lib/routes`

**Styling**: Tailwind CSS + DaisyUI components. Theme colors defined in `packages/app-shared/src/settings/staticSettings.ts`.

**Path aliases** — all four declared in `apps/frontend/svelte.config.js`, and there are only four; everything else under `apps/frontend/src/lib/` is reached through SvelteKit's built-in `$lib`:

- `$types` -> `apps/frontend/src/lib/types`
- `$candidate` -> `apps/frontend/src/lib/candidate`
- `$layouts` -> `apps/frontend/src/lib/layouts`
- `$voter` -> declared in `svelte.config.js`, but its target directory (src/lib/voter) does not exist and no source file imports the alias. Voter-side code lives under `apps/frontend/src/lib/contexts/voter/` and `apps/frontend/src/routes/(voters)/`.

**Key directories**:

- `apps/frontend/src/lib/api/` - Client-side data adapters, `apiRoute` and `supabase` only; the local adapter is server-side, under `apps/frontend/src/lib/server/api/adapters/local/`
- `apps/frontend/src/lib/components/` - Base, presentational components
- `apps/frontend/src/lib/dynamic-components/` - Data-aware components, reading `@openvaa/data` objects and the contexts
- `apps/frontend/src/lib/candidate/` - Candidate-app code, including its own component library
- `apps/frontend/src/lib/contexts/` - Svelte context providers (app, voter, candidate, data, filter, layout, i18n)
- `apps/frontend/src/lib/layouts/` - Route-root layout components, imported as `$layouts`
- `apps/frontend/src/lib/routes/` - Route constants, route building and app gates, imported as `$lib/routes`
- `apps/frontend/src/lib/server/` - Server-only code (admin, server-side API adapters, LLM)
- `apps/frontend/src/lib/i18n/` - The `t()` wrapper over Paraglide messages, plus runtime translation overrides
- `apps/frontend/src/lib/utils/` - Helper functions
- `apps/frontend/src/hooks.server.ts` - SvelteKit hooks (Supabase session, locale, route gating)

**Build**: `yarn workspace @openvaa/frontend build` (also copies `apps/frontend/data/` into the build output when that folder is present)

## Backend (Supabase)

- **Database**: PostgreSQL managed by Supabase — local via `yarn db:start`, production via Supabase Cloud. Migrations in `apps/supabase/supabase/migrations/`, pgTAP tests in `apps/supabase/supabase/tests/`
- **Edge Functions**: `apps/supabase/supabase/functions/` — `identity-callback`, `invite-candidate`, `send-email`
- **Auth**: cookie-based sessions with PKCE; candidates authenticate via Supabase Auth; candidate pre-registration goes through the `invite-candidate` Edge Function; bank authentication via OpenID Connect (Signicat), IdP settings in `.env`, completed by the `identity-callback` Edge Function
- **After a schema change**: `yarn db:types` regenerates `packages/supabase-types/`, and `yarn db:lint:sql` lints the applied database

The schema itself — tables, RLS policies, JWT claims, the bulk import/delete RPCs and the storage buckets — is documented in `.claude/skills/database/schema-reference.md` and `.claude/skills/database/rls-policy-map.md` — `Skill("database")`.

## Common Workflows

**Starting a feature**: `yarn build` first (cached, fast if already built), then read the relevant package README. Frontend components live in the three directories listed under § _Frontend_; backend schema in `apps/supabase/supabase/migrations/`.

**Running tests**: `yarn test:unit` for the quick check, `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` for the full E2E run. The wrapper starts Supabase and one fresh dev server with `PUBLIC_PROJECT_ID` set to the project the suite seeds; a plain `yarn dev` serves the **default** project instead, so the specs would drive an application with no elections, no questions and no nominations. The suite creates and owns its own project, so clearing the database is **not** a precondition of a run — and doing it while a run is in flight destroys the state that run depends on.

**Debugging the matching algorithm**: `cd packages/matching && tsx examples/example.ts` — see `packages/matching/examples/example.ts`.

**Fixing "module not found" errors**: `yarn build`.

**Seeding local data**:

```bash
yarn db:reset-with-data                        # db:reset + default template (Finnish demo, 4 locales); DB only
yarn db:seed --template e2e/base               # E2E test data for manual Playwright runs (canonical base dataset)
yarn db:seed --template ./my-template.ts       # custom templates from filesystem
yarn db:seed:teardown                          # remove all seed_-prefixed rows + portraits
```

See `packages/dev-seed/README.md` for authoring custom templates (mixing `fixed[]` hand-authored rows with synthetic `count`, 4-locale expansion, latent-factor answer model overrides).

## Important Implementation Notes

- **Never** commit sensitive data (API keys, tokens, .env files)
- **Test accessibility** - app must be WCAG 2.1 AA compliant
- **Use TypeScript strictly** - avoid `any`, prefer explicit types
- **Matching algorithms** - questions creating subdimensions (like categorical) need special handling
- **Missing values** - use `MISSING_VALUE` from `@openvaa/core` in matching contexts, `undefined` or empty literals elsewhere
- **Localization** - all user-facing strings must support multiple locales (see `packages/app-shared/src/settings/staticSettings.ts` for `supportedLocales`)
- **Always** check your code against the [Code review checklist](/.agents/code-review-checklist.md)

### Context Destructuring Rule (Svelte 5)

**Two property classes, two prohibitions.** OpenVAA's Svelte 5 contexts (`getVoterContext()`, `getCandidateContext()`, `getAppContext()`) expose _stable references_ — `t`, `getRoute`, `darkMode`, `answers`, `userData`, the lifecycle functions — which are safe to destructure, and _reactive accessors_ — `appSettings`, `dataRoot`, `locale`, `selectedElections`, `opinionQuestions`, `matches` and some twenty more — which are not.

- **NEVER destructure a reactive accessor.** Destructuring invokes the getter once at component-init and binds the captured value — usually the initial empty array — as a static local that never updates again. Read `ctx.X` instead, so the getter is re-invoked inside the tracking scope on every read.
- **NEVER bind `dataRoot` to an intermediate read alias.** It is identity-stable behind a private `#version` counter, so `const dataRoot = $derived(ctx.dataRoot)` recomputes but yields the same reference, Svelte 5 skips downstream notification, and the consumer keeps its pre-mount snapshot on cold / direct-URL entry. Read `ctx.dataRoot.<prop>` directly inside the consuming tracking scope.

Both defects have shipped and been diagnosed in this codebase — the destructure trap in v2.6 Phase 61, the alias-indirection hole in v2.13 Phase 117 — and the source comments across `apps/frontend/src` that cite this rule by name land here. See `.claude/skills/components/context-reactivity.md` for the full reference: the mechanism, the canonical pattern, the complete accessor list and the spike and debug references behind it.

### Svelte Warning-Accepted Format

When a Svelte / vite-plugin-svelte / SvelteKit warning is intentionally accepted (rather than fixed at the source), use this inline format:

```
// svelte-warning: accepted — <one-sentence-rationale>
```

Place the comment IMMEDIATELY ABOVE the warning-triggering line. The rationale should explain WHY the warning is accepted (e.g., "framework-emitted false positive for prop reassignment in init phase"; "intentional non-reactive read at mount per design"). Per v2.8 Phase 70 Cat A `// reason:` block convention; the `svelte-warning: accepted` prefix scopes the comment to vite-plugin-svelte / SvelteKit / Svelte-compiler-emitted warnings specifically (vs. ESLint `// reason:` which scopes to lint-rule acceptances).

Use sparingly — preferred outcome is to FIX the warning at the source. Acceptance is the fallback when the warning is a framework false-positive OR a design tradeoff that can't be cleanly fixed.

## Deployment

Frontend ships as a Docker container; the backend is Supabase Cloud, so no backend service is needed on Render. `render.example.yaml` is the reference deployment: the frontend service with its `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` environment variables, the domain, and the cache disk. `docker-compose.dev.yml` is for production build testing only, not development.

## Troubleshooting

- **Database issues**: `yarn db:reset` resets the database only; `yarn dev:reset` resets it and relaunches the full stack.
- **Port conflicts**: 54321 (Supabase API), 54323 (Supabase Studio) and the frontend port (5173 by default) must be free. `yarn dev` uses `strictPort` and fails loudly rather than silently moving to the next port.
- **TypeScript errors in the IDE**: `yarn build` to rebuild all packages.
- **Frontend can't reach the backend**: verify `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` and `PUBLIC_PROJECT_ID` in `.env`.

## Code Review

When performing code review or developing new features, make sure to check all the items in the [Code Review Checklist](/.agents/code-review-checklist.md).

## Skill Routing

Every entry here is one hop: it reaches either this file's own content or a skill that exists. There is no second index — an entry that sends you onward sends you to the file that holds the answer.

- **Application architecture — no skill; the answer is in this file.** Cross-cutting architectural questions — how the monorepo fits together, the cross-package dependency flow, frontend routing and the context system, the data adapter pattern, the server/client boundary, settings architecture, how the packages connect — are answered above by § _Architecture_ (the package list, the `core` -> `data`/`matching`/`filters` -> `app-shared` -> `frontend`/`supabase` dependency flow, the adapter map, the `StaticSettings`/`DynamicSettings` split) and § _Frontend (SvelteKit)_ (routing, path aliases, key directories). For one subsystem rather than the whole, use that subsystem's skill below: `components`, `data`, `matching`, `filters` or `database`. There is deliberately no architecture skill: a stub whose entire body is a pointer back to this file routes nothing, so this entry carries its content directly instead.
- **Svelte components and context reactivity** — creating, modifying or reviewing a `.svelte` component under `apps/frontend/src/lib/components`, `apps/frontend/src/lib/dynamic-components` or `apps/frontend/src/lib/candidate/components`; the runes-era prop and snippet API, `concatClass` styling, the WCAG 2.1 AA axe gate; and above all the context destructure trap and the `dataRoot` carve-out — a context value that renders empty, or that goes stale on cold / direct-URL entry. This is the second route to the rule stated in § _Context Destructuring Rule_ above.
  → `Skill("components")`
- **The package domains** — one skill each, chosen by which package the file is in:
  - `packages/data` — the `DataRoot`/`DataObject` hierarchy, entity variants, question types and their matching interfaces, the nomination system, smart defaults, `MISSING_VALUE`.
    → `Skill("data")`
  - `packages/matching` — `MatchingAlgorithm` and `MatchingSpace`, the distance metrics, subdimensions for categorical questions, missing-value imputation, `Match`/`SubMatch` results.
    → `Skill("matching")`
  - `packages/filters` — the `Filter` hierarchy and its `filterType` discriminant, `FilterGroup` AND/OR composition, the exclude/include/min/max rules, `MISSING_FILTER_VALUE`.
    → `Skill("filters")`
  - `apps/supabase` and `packages/supabase-types` — schema and migrations, RLS policies, JWT claims via the access-token hook, Edge Functions, the bulk import/delete RPCs, pgTAP tests, storage buckets.
    → `Skill("database")`
- **Restructuring a long-lived branch into a reviewable stack of PRs** — index-level tree surgery, pure-rename commit reconstruction, path-partition dry runs, byte-identity and commit-taxonomy proofs. Not for ordinary feature branches, which need none of it.
  → `Skill("ship-review-stack")`
- **Why the skill corpus is shaped the way it is** — `.claude/skills/README.md` records the corpus measurement and the below-threshold verdict it produced, the judgements behind the current shape, the one-level routing rule every entry in this section obeys, and the conventions for adding a skill. Read it before writing a new skill — not to find an existing one, which is what the entries above are for.
- **Spike findings for voting-advice-application-gsd** — two domains:
  - Svelte 5 rune migration (spikes 001–012): reactive context shapes, `runeLocalStorage` helper, `untrack()` write-after-read invariant, token-keyed overlay registry, SSR-aware synchronous-init for appSettings, voterContext/candidateContext orchestration, destructure-trap reproduction, consumer-migration codemod, 4-wave migration order, HMR DX, `$derived.by` over per-field `page` reads for getRoute.
  - Page navigation + View Transitions + a11y (spikes 013–016): SvelteKit already reuses `+page.svelte` across param-only URL changes (production: 9/25 ≈ 36% element survival); the user-perceived "redraw" is reactive content-node regeneration, fixed via `onNavigate(navigation => Promise(startViewTransition))` with per-element `view-transition-name`; unified-layout-with-empty-leaf shape (matches results pattern) + `{#key question.type}` for variant remount; WCAG 2.1 AA gate via `afterNavigate(focus({preventScroll: true}))` + `aria-live="polite"` route announcer + reduced-motion belt-and-braces.
    → `Skill("spike-findings-voting-advice-application-gsd")`
