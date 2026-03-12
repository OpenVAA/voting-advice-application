# Phase 8: Infrastructure Setup - Research

**Researched:** 2026-03-12
**Domain:** Supabase CLI local development, monorepo integration, type generation, linting, seed data
**Confidence:** HIGH

## Summary

Phase 8 bootstraps the Supabase local development stack within the OpenVAA monorepo. The core deliverables are: initializing the Supabase CLI project in `apps/supabase/`, ensuring `supabase start` launches all backend services, setting up a `@openvaa/supabase-types` package for generated TypeScript types, configuring database linting, and creating a seed data mechanism that replaces Strapi's mock data generation.

The Supabase CLI (v2.78+) provides a well-documented local development workflow. The `supabase` npm package installs a Go binary via postinstall script. This project uses Yarn 4 with `nodeLinker: node-modules`, which is the most compatible configuration. The CLI commands (`start`, `stop`, `db reset`, `gen types`, `db lint`) operate on a `supabase/` directory within the workspace. For monorepo placement at `apps/supabase/`, the supabase project directory lives at `apps/supabase/supabase/` (the inner `supabase/` is created by `supabase init`).

**Critical finding on INFRA-05:** The `supabase db lint` command only runs `plpgsql_check`, which checks PL/pgSQL function code for errors. It does NOT check for missing RLS policies or unindexed columns -- those checks are performed by Splinter, which is only available in the Supabase Dashboard. To satisfy INFRA-05 for local development, we need a custom lint script that runs Splinter's SQL queries directly against the local Postgres instance, or the requirement should be reinterpreted to mean: (a) `supabase db lint` configured with `--fail-on warning` for function linting, and (b) a separate script running Splinter-derived SQL queries to check RLS and index coverage.

**Primary recommendation:** Install the `supabase` npm package as a devDependency of the `@openvaa/supabase` workspace at `apps/supabase/`. Use `supabase init` to scaffold the project, configure `config.toml` for local development, create a `@openvaa/supabase-types` package at `packages/supabase-types/`, and write a custom lint script that combines plpgsql_check (via `supabase db lint`) with Splinter SQL queries for schema advisors.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Supabase project lives at `apps/supabase/` -- the monorepo is being reorganized to use turborepo with an `apps/` directory (frontend, vaa-strapi, docs, supabase)
- Supabase CLI commands need `--workdir apps/supabase` or root scripts that cd into it
- Primary scripts live in `apps/supabase/package.json` (the Supabase workspace owns its own commands)
- Root package.json has aliases that delegate to the workspace (e.g., `yarn supabase:start` -> `yarn workspace @openvaa/supabase start`)
- Fully separate from existing Strapi commands -- no combined dev command needed
- Local-only for now -- just `supabase init`, no cloud project linked
- Cloud linking deferred until deployment decisions are made
- Supabase defaults: timestamped migration filenames (e.g., `20260312000000_create_tables.sql`)
- Edge Functions in standard `supabase/functions/function-name/index.ts` structure
- Keep Supabase default ports (Studio: 54323, API: 54321, DB: 54322, Inbucket: 54324)
- No conflicts with existing Strapi stack ports (1337, 5173, 5432, 4566)
- SQL seed file (`seed.sql`) -- Supabase's native mechanism
- Minimal viable dataset: 1 account, 1 project, 1 election with 2 constituencies, 3 parties, ~10 candidates, ~15 questions (mix of types), answers for all candidates, 1 set of app_settings
- Single-tenant only -- multi-tenant seed data deferred to Phase 9/13
- Realistic but fictional content (plausible election names, party names, question texts) -- not generic placeholders
- Synthetic volume data generation (for load testing) is a separate concern handled by Phase 11 scripts, not part of seeding
- Dedicated `@openvaa/supabase-types` package in `packages/supabase-types/` with its own package.json and tsconfig
- Type generation script outputs to this package; frontend and other packages import via `@openvaa/supabase-types` workspace dependency
- Follows existing `@openvaa/*` package conventions with TypeScript project references
- Monorepo is being reorganized on another branch to use turborepo -- Strapi, docs, and frontend move to `/apps`. Supabase should use this new structure from the start (`apps/supabase/`), not the current flat layout
- Strapi coexistence is not a concern for this phase -- focus purely on getting Supabase working

### Claude's Discretion
- Type regeneration strategy (manual vs auto on reset)
- Exact linting rules for `supabase db lint` configuration
- config.toml specifics beyond what's needed for local dev

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Supabase CLI initialized in monorepo with `config.toml` configured for local development | `supabase init` creates config.toml; project_id required; all port/auth/storage/seed settings documented; `--workdir` flag for monorepo |
| INFRA-02 | `supabase start` launches all backend services (Postgres, GoTrue, PostgREST, Storage, Mailpit, Studio) | Default config enables all services; Mailpit at port 54324; Studio at 54323; verified no port conflicts with existing stack |
| INFRA-03 | Seed data replaces Strapi's `GENERATE_MOCK_DATA_ON_INITIALISE` mechanism | `[db.seed]` config with `sql_paths`; runs on first `start` and every `db reset`; SQL-only format; execution order is lexicographic |
| INFRA-04 | Type generation script produces TypeScript types from Supabase schema | `supabase gen types typescript --local` generates Row/Insert/Update interfaces; output to `packages/supabase-types/` package |
| INFRA-05 | `supabase db lint` configured to block on missing RLS and unindexed columns | **CRITICAL**: `db lint` only runs plpgsql_check (function linting), NOT Splinter (RLS/index checks). Custom script needed to run Splinter SQL queries locally |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `supabase` (npm) | ^2.78.1 | Supabase CLI binary via npm wrapper | Official CLI distribution for npm-based projects; installed as workspace devDependency |
| PostgreSQL | 15 (bundled) | Database engine | Bundled with Supabase CLI's Docker images; no separate install needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `typescript` | ^5.7.3 | TypeScript compiler for types package | Match existing monorepo version for the `@openvaa/supabase-types` package |
| `prettier` | ^3.4.2 | Format generated type files | Match existing monorepo version; auto-format after type generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm `supabase` package | Homebrew `supabase` | Homebrew requires global install; npm keeps it in the monorepo lockfile and CI-reproducible |
| Manual Splinter SQL | Dashboard advisors | Dashboard requires cloud project; local SQL script works offline and in CI |

**Installation:**
```bash
# In apps/supabase/ workspace:
yarn add --dev supabase

# If Yarn 4 postinstall fails (known issue on some setups):
NODE_OPTIONS=--no-experimental-fetch yarn add --dev supabase
```

## Architecture Patterns

### Recommended Project Structure
```
apps/
  supabase/
    package.json              # @openvaa/supabase workspace
    supabase/                 # Created by `supabase init`
      config.toml             # Local dev configuration
      migrations/             # Timestamped SQL migrations
      seed.sql                # Seed data (or seeds/ directory)
      functions/              # Edge Functions (future)
      tests/                  # pgTAP tests (future, Phase 13)
packages/
  supabase-types/
    package.json              # @openvaa/supabase-types workspace
    tsconfig.json             # Extends @openvaa/shared-config/ts
    src/
      database.ts             # Generated types (output of gen types)
      index.ts                # Re-export for clean imports
```

### Pattern 1: Workspace Script Delegation
**What:** Root package.json aliases that delegate to the Supabase workspace.
**When to use:** Always -- developers should be able to run commands from the monorepo root.
**Example:**
```json
// Root package.json
{
  "scripts": {
    "supabase:start": "yarn workspace @openvaa/supabase start",
    "supabase:stop": "yarn workspace @openvaa/supabase stop",
    "supabase:reset": "yarn workspace @openvaa/supabase reset",
    "supabase:types": "yarn workspace @openvaa/supabase-types generate",
    "supabase:lint": "yarn workspace @openvaa/supabase lint"
  }
}
```

```json
// apps/supabase/package.json
{
  "name": "@openvaa/supabase",
  "private": true,
  "scripts": {
    "start": "supabase start",
    "stop": "supabase stop",
    "reset": "supabase db reset",
    "lint": "supabase db lint --local --schema public --fail-on warning",
    "lint:schema": "node scripts/lint-schema.mjs",
    "lint:all": "yarn lint && yarn lint:schema"
  },
  "devDependencies": {
    "supabase": "^2.78.1"
  }
}
```

### Pattern 2: Type Generation with Workspace Package
**What:** Generated types live in a dedicated `@openvaa/supabase-types` package that other workspaces import.
**When to use:** Whenever the database schema changes and types need updating.
**Example:**
```json
// packages/supabase-types/package.json
{
  "name": "@openvaa/supabase-types",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    "import": "./src/index.ts"
  },
  "scripts": {
    "generate": "supabase gen types typescript --local --workdir ../../apps/supabase > src/database.ts && prettier --write src/database.ts"
  },
  "devDependencies": {
    "@openvaa/shared-config": "workspace:^",
    "supabase": "^2.78.1",
    "prettier": "^3.4.2"
  }
}
```

Note: Because this package exports raw `.ts` source (not compiled `.js`), consuming packages must be able to handle TypeScript imports directly. This is fine for the SvelteKit frontend (which uses `vite` and handles TS natively) and for any package using `tsx`. If downstream consumers need compiled output, add a build step.

```typescript
// packages/supabase-types/src/index.ts
export type { Database } from './database.js';
```

```typescript
// packages/supabase-types/src/database.ts
// AUTO-GENERATED by `supabase gen types typescript --local`
// Do not edit manually. Run `yarn supabase:types` to regenerate.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // ... generated table types with Row, Insert, Update interfaces
    }
    Views: { /* ... */ }
    Functions: { /* ... */ }
    Enums: { /* ... */ }
    CompositeTypes: { /* ... */ }
  }
}
```

### Pattern 3: Seed Data as SQL
**What:** A `seed.sql` file in the supabase directory that inserts the minimal viable dataset.
**When to use:** Runs automatically on first `supabase start` and on every `supabase db reset`.
**Example:**
```sql
-- supabase/seed.sql
-- Seed data for local development
-- Runs after all migrations on `supabase start` (first run) and `supabase db reset`

-- Note: Since Phase 8 has no schema yet (schema comes in Phase 9),
-- the initial seed.sql will be a placeholder that inserts into
-- whatever minimal tables exist after init. The full seed data
-- (accounts, projects, elections, candidates, questions, answers)
-- will be populated in Phase 9 when tables are created.

-- Placeholder: verify seed mechanism works
-- INSERT INTO ... VALUES ...;
```

### Pattern 4: Custom Splinter Lint Script
**What:** A Node.js script that runs Splinter's SQL queries against the local Postgres database to check for missing RLS and index issues.
**When to use:** As part of the lint workflow, complementing `supabase db lint`.
**Example:**
```javascript
// apps/supabase/scripts/lint-schema.mjs
// Runs Splinter-derived SQL queries against local Supabase Postgres
// to check for missing RLS policies, unindexed foreign keys, etc.
//
// Usage: node scripts/lint-schema.mjs
// Requires: supabase start (local stack must be running)

import { execSync } from 'node:child_process';

const DB_URL = 'postgresql://postgres:postgres@localhost:54322/postgres';

const SPLINTER_CHECKS = [
  {
    name: '0013_rls_disabled_in_public',
    description: 'Tables in public schema with RLS disabled',
    severity: 'ERROR',
    sql: `SELECT schemaname, tablename FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename NOT LIKE 'pg_%'
          AND tablename NOT IN (
            SELECT tablename FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE c.relrowsecurity = true
          );`
  },
  {
    name: '0001_unindexed_foreign_keys',
    description: 'Foreign keys without indexes',
    severity: 'WARNING',
    sql: `/* Splinter rule 0001 query */`
  }
];

// Execute each check via psql and report results
// Exit with non-zero if any ERROR severity issues found
```

### Anti-Patterns to Avoid
- **Running `supabase init` in the monorepo root:** The `supabase/` directory must be inside the `apps/supabase/` workspace, not at the repo root. Use `cd apps/supabase && supabase init` or `supabase init --workdir apps/supabase`.
- **Committing generated types without regenerating:** The `database.ts` file should be regenerated whenever the schema changes. Add a comment at the top warning against manual edits.
- **Putting seed data logic in migrations:** Migrations are for schema changes only. Seed data goes in `seed.sql` (or `seeds/*.sql`).
- **Using `supabase db lint` alone for INFRA-05:** It only checks PL/pgSQL function code, not schema-level issues like missing RLS or indexes. A custom script is needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript types from DB schema | Manual type definitions matching tables | `supabase gen types typescript --local` | Auto-generated types stay in sync with schema; includes Row/Insert/Update variants |
| Local Postgres + Auth + Storage stack | Docker Compose for individual services | `supabase start` | One command starts all services with correct configuration and inter-service wiring |
| Database reset with migrations + seed | Custom reset scripts | `supabase db reset` | Applies all migrations in order then seeds; handles dependency ordering |
| PL/pgSQL function linting | Custom SQL validators | `supabase db lint` | Uses Postgres internal parser; catches runtime errors statically |
| Schema advisor (RLS/index checks) | Nothing -- but also don't skip | Splinter SQL queries run via psql | Splinter is the official Supabase tool; reusing their SQL queries is better than writing custom checks |

**Key insight:** The Supabase CLI handles all infrastructure orchestration. The only custom code needed is (a) the types package wrapper, (b) the Splinter-based schema lint script, and (c) the seed data SQL.

## Common Pitfalls

### Pitfall 1: Yarn 4 + Supabase CLI Postinstall Failure
**What goes wrong:** The `supabase` npm package downloads a Go binary during postinstall. On Yarn Berry (v4) with certain configurations, the download can fail with `ECONNRESET` or `FetchError`.
**Why it happens:** Yarn 4's experimental fetch implementation conflicts with the postinstall script's download mechanism.
**How to avoid:** Use `NODE_OPTIONS=--no-experimental-fetch` when running `yarn add`. The project already uses `nodeLinker: node-modules` which is the most compatible mode. If postinstall still fails, fall back to Homebrew installation (`brew install supabase/tap/supabase`) and reference the global binary.
**Warning signs:** `FetchError: request to https://github.com/supabase/cli/releases/download/...` errors during yarn install.

### Pitfall 2: Confusing `supabase db lint` with Splinter Schema Advisors
**What goes wrong:** Assuming `supabase db lint` checks for missing RLS policies and unindexed columns. It does not.
**Why it happens:** The requirement (INFRA-05) says "supabase db lint configured to block on missing RLS and unindexed columns" but the command only runs plpgsql_check for PL/pgSQL function linting.
**How to avoid:** Implement a separate schema lint script that runs Splinter SQL queries via psql. Combine both into a single `lint:all` script.
**Warning signs:** `supabase db lint` returns "No schema errors found" even when tables lack RLS or indexes.

### Pitfall 3: supabase init Creates Nested Directory
**What goes wrong:** Running `supabase init` inside `apps/supabase/` creates `apps/supabase/supabase/config.toml`, not `apps/supabase/config.toml`. This is correct and expected -- the `supabase/` subdirectory is the Supabase project directory.
**Why it happens:** The CLI always creates a `supabase/` directory relative to the working directory.
**How to avoid:** Accept the nesting: `apps/supabase/` is the npm workspace, `apps/supabase/supabase/` is the Supabase project. Scripts in `apps/supabase/package.json` run from `apps/supabase/` which is correct for the CLI (it looks for `./supabase/config.toml`).
**Warning signs:** "Config not found" errors when running supabase commands.

### Pitfall 4: Docker Must Be Running
**What goes wrong:** `supabase start` fails silently or with cryptic errors if Docker is not running.
**Why it happens:** All Supabase local services run as Docker containers.
**How to avoid:** Document the Docker requirement clearly. The `start` script could check Docker availability first.
**Warning signs:** `Cannot connect to the Docker daemon` errors.

### Pitfall 5: Type Generation Requires Running Stack
**What goes wrong:** `supabase gen types typescript --local` fails if the local stack is not running.
**Why it happens:** The command introspects the live database to generate types.
**How to avoid:** The type generation script should either (a) check if the stack is running first and start it if needed, or (b) document the dependency clearly. The turborepo blog post pattern uses `supabase status || supabase start` before operations.
**Warning signs:** Connection refused errors during type generation.

### Pitfall 6: workspaces Array Not Updated
**What goes wrong:** New workspace directories (`apps/supabase`, `packages/supabase-types`) are not recognized by Yarn.
**Why it happens:** The root `package.json` `workspaces` array must include glob patterns matching the new directories.
**How to avoid:** Update `workspaces` to include `"apps/*"` (or specifically `"apps/supabase"`) and ensure `"packages/*"` already covers `supabase-types`.
**Warning signs:** `yarn workspace @openvaa/supabase start` fails with "workspace not found".

### Pitfall 7: Seed Data Without Schema
**What goes wrong:** Attempting to write meaningful seed data before schema tables exist (Phase 9).
**Why it happens:** Phase 8 sets up the seed mechanism, but the actual database tables are created in Phase 9.
**How to avoid:** Phase 8's seed.sql should be a minimal placeholder that validates the mechanism works. The substantive seed data (elections, candidates, questions, etc.) must be written in Phase 9 after tables exist. However, the seed.sql file can be created now with the structure and comments describing what will be seeded.
**Warning signs:** `relation "X" does not exist` errors in seed.sql.

## Code Examples

### config.toml for Local Development
```toml
# Source: https://supabase.com/docs/guides/local-development/cli/config
# + https://github.com/supabase/cli/blob/develop/pkg/config/templates/config.toml

[project]
id = "openvaa-local"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[db.seed]
enabled = true
sql_paths = ["./seed.sql"]

[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
site_url = "http://127.0.0.1:5173"
additional_redirect_urls = ["https://127.0.0.1:5173"]
jwt_expiry = 3600
enable_signup = true
enable_anonymous_sign_ins = false

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[edge_runtime]
enabled = true
policy = "oneshot"
```

### Type Generation Script Output
```typescript
// Source: https://supabase.com/docs/guides/api/rest/generating-types
// Generated by: supabase gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: Array<{
          foreignKeyName: string
          columns: string[]
          isOneToOne: boolean
          referencedRelation: string
          referencedColumns: string[]
        }>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
```

### Consuming Generated Types
```typescript
// Source: https://supabase.com/docs/reference/javascript/typescript-support
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@openvaa/supabase-types';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Type-safe queries
const { data, error } = await supabase
  .from('elections')
  .select('*');
// data is typed as Database['public']['Tables']['elections']['Row'][]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `supabase db lint` for all checks | `supabase db lint` (plpgsql_check) + Splinter (dashboard only) | Always separate | Must use custom script for RLS/index checks locally |
| Single seed.sql file | `[db.seed]` config with `sql_paths` array + glob patterns | CLI v1.x -> v2.x | Can organize seeds into multiple files with ordering control |
| `supabase login` required for type gen | `--local` flag for local type generation | Early 2023 | No cloud account needed for local dev type generation |
| InBucket for email | Mailpit (called InBucket in CLI config) | Recent CLI versions | Same interface, `inbucket` key in config.toml still used |

**Deprecated/outdated:**
- The `supabase-cli` npm package name is deprecated; use `supabase` instead
- Node.js 18 support dropped in CLI v2.79.0; Node.js 20+ required (project uses Node.js 22)

## Open Questions

1. **Splinter SQL queries for local lint script**
   - What we know: Splinter maintains a `splinter.sql` file with all rules. Key rules for INFRA-05: `0013_rls_disabled_in_public` (RLS check) and `0001_unindexed_foreign_keys` (index check).
   - What's unclear: The exact SQL for each rule is in the Splinter repo but was rate-limited during research. The lint script needs the specific queries extracted or the full `splinter.sql` downloaded.
   - Recommendation: During implementation, fetch `splinter.sql` from the Splinter GitHub repo and extract rules 0001 and 0013 (plus 0007 and 0008 for RLS policy checks). Alternatively, write simpler custom SQL checks for the specific concerns (tables without RLS enabled, foreign keys without indexes).

2. **Type regeneration strategy (Claude's Discretion)**
   - What we know: Types must be regenerated when schema changes. Can be manual or triggered automatically.
   - Recommendation: **Manual regeneration via script.** Auto-regeneration on `db reset` adds complexity and slows down the reset cycle. The `generate` script in `@openvaa/supabase-types` is explicit and fast. Developers run `yarn supabase:types` after schema changes. A post-reset hook could be added later if needed.

3. **Minimal seed data without schema tables**
   - What we know: Phase 8 creates the seed mechanism, but actual tables are defined in Phase 9.
   - What's unclear: How to validate the seed mechanism works without tables.
   - Recommendation: Create `seed.sql` with a SQL comment header and a simple validation query (e.g., `SELECT 'seed executed' AS status;`). The substantive INSERT statements will be added in Phase 9 after tables exist. The mechanism (config.toml `[db.seed]` section + file) is what Phase 8 validates.

4. **apps/ directory creation and workspace registration**
   - What we know: The `apps/` directory does not yet exist in the repo. The monorepo is being reorganized on another branch. Current `workspaces` in root package.json do not include `apps/*`.
   - Recommendation: Create `apps/supabase/` and add `"apps/*"` to the root `workspaces` array. This is forward-compatible with the turborepo reorganization. Do NOT move frontend/strapi/docs in this phase -- that is the other branch's concern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Supabase CLI built-in (`supabase start`, `supabase db lint`, `supabase db reset`) + shell scripts |
| Config file | `apps/supabase/supabase/config.toml` |
| Quick run command | `yarn supabase:start` (idempotent if already running) |
| Full suite command | `yarn supabase:reset && yarn supabase:lint` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | CLI initialized with config.toml | smoke | `test -f apps/supabase/supabase/config.toml && echo OK` | Wave 0 |
| INFRA-02 | All services launch | smoke | `cd apps/supabase && supabase status` (verifies running services) | Wave 0 |
| INFRA-03 | Seed data loads on reset | smoke | `cd apps/supabase && supabase db reset` (check exit code 0) | Wave 0 |
| INFRA-04 | Type generation produces TS file | smoke | `yarn supabase:types && test -f packages/supabase-types/src/database.ts && echo OK` | Wave 0 |
| INFRA-05 | Lint reports RLS/index issues | smoke | `cd apps/supabase && yarn lint:all` (check exit code + output) | Wave 0 |

### Sampling Rate
- **Per task commit:** Verify affected service starts and relevant command succeeds
- **Per wave merge:** Full `supabase db reset` + `supabase status` + type generation + lint
- **Phase gate:** All 5 smoke tests pass; Studio accessible at localhost:54323

### Wave 0 Gaps
- [ ] `apps/supabase/` directory and package.json -- workspace creation
- [ ] `apps/supabase/supabase/config.toml` -- CLI initialization
- [ ] `packages/supabase-types/` directory and package.json -- types package creation
- [ ] `apps/supabase/scripts/lint-schema.mjs` -- custom Splinter lint script
- [ ] Root package.json `workspaces` update to include `apps/*`
- [ ] Root package.json alias scripts for Supabase commands

## Sources

### Primary (HIGH confidence)
- [Supabase CLI Config Reference](https://supabase.com/docs/guides/local-development/cli/config) -- all config.toml settings, defaults, and port assignments
- [Supabase CLI Getting Started](https://supabase.com/docs/guides/local-development/cli/getting-started) -- installation, init, start, stop, Docker requirements
- [Supabase Type Generation](https://supabase.com/docs/guides/api/rest/generating-types) -- `gen types typescript --local` command, output format, usage with supabase-js
- [Supabase Seeding Guide](https://supabase.com/docs/guides/local-development/seeding-your-database) -- `[db.seed]` config, sql_paths, execution timing, glob patterns
- [Supabase CLI Reference: db lint](https://supabase.com/docs/reference/cli/supabase-db-lint) -- flags (--fail-on, --level, --schema, --local), plpgsql_check only
- [Supabase Testing and Linting](https://supabase.com/docs/guides/local-development/cli/testing-and-linting) -- db lint and db test overview
- [Supabase CLI Reference: Global Flags](https://supabase.com/docs/reference/cli/usage) -- --workdir, SUPABASE_WORKDIR env var

### Secondary (MEDIUM confidence)
- [Splinter GitHub](https://github.com/supabase/splinter) -- lint rules list, SQL query approach, rule IDs and categories
- [Splinter Documentation](https://supabase.github.io/splinter/) -- 15 rules enumerated with IDs and descriptions
- [Supabase + Turborepo Monorepo Guide](https://philipp.steinroetter.com/posts/supabase-turborepo) -- workspace setup, type generation in monorepo, script patterns
- [Supabase Database Advisors](https://supabase.com/docs/guides/database/database-advisors) -- dashboard-only Splinter access confirmed

### Tertiary (LOW confidence)
- [Supabase CLI Yarn 4 Issue #1769](https://github.com/supabase/cli/issues/1769) -- postinstall failure on Yarn Berry; NODE_OPTIONS workaround. May be resolved in recent versions but not confirmed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- supabase npm package and CLI commands are well-documented and stable
- Architecture: HIGH -- monorepo patterns well-established; workspace delegation is a common pattern
- Pitfalls: HIGH -- Yarn 4 issues documented; `db lint` vs Splinter distinction verified through multiple sources
- INFRA-05 implementation: MEDIUM -- custom Splinter script approach is sound but exact SQL queries need to be fetched during implementation

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain; Supabase CLI releases are incremental)
