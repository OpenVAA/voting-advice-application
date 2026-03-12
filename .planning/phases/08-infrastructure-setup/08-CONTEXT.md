# Phase 8: Infrastructure Setup - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Supabase CLI initialized, local dev stack running, type generation pipeline, linting configured, and seed data mechanism in place. Developers can run `supabase start` and have a complete local backend visible in Studio. Schema design, auth, RLS policies, and load testing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Monorepo placement
- Supabase project lives at `apps/supabase/` — the monorepo is being reorganized to use turborepo with an `apps/` directory (frontend, vaa-strapi, docs, supabase)
- Supabase CLI commands need `--workdir apps/supabase` or root scripts that cd into it

### Scripts
- Primary scripts live in `apps/supabase/package.json` (the Supabase workspace owns its own commands)
- Root package.json has aliases that delegate to the workspace (e.g., `yarn supabase:start` → `yarn workspace @openvaa/supabase start`)
- Fully separate from existing Strapi commands — no combined dev command needed

### Cloud and initialization
- Local-only for now — just `supabase init`, no cloud project linked
- Cloud linking deferred until deployment decisions are made

### Naming conventions
- Supabase defaults: timestamped migration filenames (e.g., `20260312000000_create_tables.sql`)
- Edge Functions in standard `supabase/functions/function-name/index.ts` structure

### Ports
- Keep Supabase default ports (Studio: 54323, API: 54321, DB: 54322, Inbucket: 54324)
- No conflicts with existing Strapi stack ports (1337, 5173, 5432, 4566)

### Seed data
- SQL seed file (`seed.sql`) — Supabase's native mechanism
- Minimal viable dataset: 1 account, 1 project, 1 election with 2 constituencies, 3 parties, ~10 candidates, ~15 questions (mix of types), answers for all candidates, 1 set of app_settings
- Single-tenant only — multi-tenant seed data deferred to Phase 9/13
- Realistic but fictional content (plausible election names, party names, question texts) — not generic placeholders
- Synthetic volume data generation (for load testing) is a separate concern handled by Phase 11 scripts, not part of seeding

### Type generation
- Dedicated `@openvaa/supabase-types` package in `packages/supabase-types/` with its own package.json and tsconfig
- Type generation script outputs to this package; frontend and other packages import via `@openvaa/supabase-types` workspace dependency
- Follows existing `@openvaa/*` package conventions with TypeScript project references

### Claude's Discretion
- Type regeneration strategy (manual vs auto on reset)
- Exact linting rules for `supabase db lint` configuration
- config.toml specifics beyond what's needed for local dev

</decisions>

<specifics>
## Specific Ideas

- Monorepo is being reorganized on another branch to use turborepo — Strapi, docs, and frontend move to `/apps`. Supabase should use this new structure from the start (`apps/supabase/`), not the current flat layout.
- Strapi coexistence is not a concern for this phase — focus purely on getting Supabase working.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing Strapi content types (15 types in `backend/vaa-strapi/src/api/`) serve as reference for what entities the seed data needs to cover
- `@openvaa/data` package defines the canonical entity model that the database schema will eventually mirror
- Existing `@openvaa/shared-config` package provides ESLint/TypeScript config patterns to follow for the new types package

### Established Patterns
- Yarn 4 workspaces with `workspace:^` dependencies — new `@openvaa/supabase-types` package follows this
- TypeScript project references between packages — types package needs to be added to consuming tsconfigs
- Root package.json alias pattern — Supabase scripts owned by workspace, root aliases for convenience

### Integration Points
- Root package.json — alias scripts delegating to `@openvaa/supabase` workspace
- `packages/supabase-types/` — new workspace package
- `apps/supabase/` — new Supabase project directory (turborepo layout)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-infrastructure-setup*
*Context gathered: 2026-03-12*
