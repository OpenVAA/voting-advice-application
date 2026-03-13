# Phase 11: Load Testing - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve the answer storage design decision (JSONB vs relational) with benchmark data comparing both schemas at realistic candidate volumes. Produce k6 and pgbench scripts, run benchmarks at multiple scale tiers, and write a decision document with supporting data. Frontend adapter, schema cleanup, and production optimization are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Decision thresholds
- Relational wins ties — if both approaches perform within 20% of each other, relational is preferred (better query flexibility, normalization)
- JSONB only wins if it is measurably faster with a clear margin (>20% advantage)
- Voter bulk-read latency must be under 1 second (constituency-scoped, max ~3K candidates per query)
- Candidate single-answer write p95 must be under 500ms
- Full-form save (all answers at once) can be slower — relaxed latency target
- Total candidates per project can reach 10K-30K, but voter-facing reads are always constituency-filtered (max ~3K results)

### Test data realism
- 50 opinion questions per election (upper-end realistic VAA)
- Multi-tenant: 3-5 projects sharing the database
- 80-90% answer completion rate per candidate (realistic gaps — some candidates skip questions)
- Multi-locale data: fi, sv, en (3 languages for question labels, candidate names)
- Scale tiers: 1K, 5K, and 10K candidates per project

### Query patterns to benchmark
- **Voter bulk-read (primary):** Constituency-filtered read of all candidates + answers. Single constituency scope, not full-project
- **Candidate single-answer update:** One answer changed at a time (JSONB: read-modify-write; relational: single upsert)
- **Candidate full-form save:** All 50 answers saved at once (JSONB: one UPDATE; relational: 50 upserts in transaction). Relaxed latency target
- **Concurrent voter reads:** 100 and 500 simultaneous readers loading constituency results. Tests read contention under load
- **Answer aggregation:** Count/average answers per question across all candidates (statistics/charts use case). Tests GROUP BY performance
- **Concurrent writes:** 100 simultaneous candidate writers (from requirements LOAD-03)

### Decision document format
- Internal audience (core team reference)
- Summary + conclusion at top, then markdown tables with p50/p95/p99 latencies per scenario and scale tier
- Includes concrete follow-up next steps (which schema file to keep, which to delete, migration changes)
- No charts or polished presentation needed — data tables suffice

### Benchmark scripts
- Keep scripts in the repo after decision is made (useful for re-running if schema changes)
- Place in a benchmarks/ or tests/ directory under the supabase workspace

### Claude's Discretion
- k6 vs pgbench split — which tool for which benchmark pattern
- Data generation approach (SQL scripts, k6 setup phase, or separate generator)
- Exact directory structure for benchmark scripts
- Whether to use Supabase local or a separate Postgres instance for benchmarks
- How to swap between JSONB and relational schemas for A/B comparison

</decisions>

<specifics>
## Specific Ideas

- Voter reads are always constituency-scoped in production — even with 30K+ total candidates, a single voter only sees their constituency's candidates (max ~3K). Benchmark the realistic query, not the full table scan
- Both answer storage schemas already have identical trigger validation via shared `validate_answer_value()` — the benchmark isolates storage format as the only variable
- Full-form save can tolerate higher latency since it's a less frequent operation (candidate submits once, not repeatedly)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/supabase/supabase/schema/006-answers-jsonb.sql` — JSONB answer storage with trigger validation (default schema)
- `apps/supabase/supabase/schema/alternatives/answers-relational.sql` — Relational answer storage with separate `answers` table, trigger validation, indexes, and deny-all RLS
- `apps/supabase/supabase/schema/000-functions.sql` — Shared `validate_answer_value()` function used by both schemas
- `apps/supabase/supabase/seed.sql` — Seed data pattern with fixed UUIDs, auth users, role assignments (108 lines)
- `apps/supabase/supabase/schema/` — Full schema with 13 SQL files covering tenancy, entities, questions, nominations, indexes, RLS, auth

### Established Patterns
- Schema uses declarative SQL files in `schema/` folder, concatenated to produce migrations
- Alternatives stored in `schema/alternatives/` directory — swap mechanism documented in relational SQL file comments
- Postgres 15 with Supabase local stack (Phase 8 decision)
- RLS policies reference JWT claims via `(SELECT auth.jwt())` pattern (79 policies from Phase 10)
- Constituency-based data filtering via `nominations` table (candidates → nominations → constituencies)

### Integration Points
- `apps/supabase/` workspace — benchmark scripts should live here
- Schema swap: remove `006-answers-jsonb.sql`, copy `alternatives/answers-relational.sql` to `006-answers-relational.sql`, regenerate migration
- `supabase db reset` runs all migrations + seed — benchmark setup can extend this pattern
- Type generation in `packages/supabase-types/` — regenerated after schema changes

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-load-testing*
*Context gathered: 2026-03-13*
