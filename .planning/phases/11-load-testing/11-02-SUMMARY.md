---
phase: 11-load-testing
plan: 02
subsystem: testing
tags: [benchmarking, jsonb, relational, decision, postgresql, pgbench]

# Dependency graph
requires:
  - phase: 11-load-testing
    plan: 01
    provides: Benchmark infrastructure, data generation, pgbench scripts, orchestration
provides:
  - Empirical benchmark data for JSONB vs relational answer storage at 1K/5K/10K scale
  - Answer storage design decision document with HIGH confidence JSONB recommendation
  - Concurrency scaling data from 1 to 1000 concurrent clients
  - Optimized relational query comparison (CTE, LATERAL, two-query, RPC)
  - Smart JSONB validation trigger (44% write improvement)
  - Realistic 100K voter launch scenario with caching analysis
affects: [schema-decision, 12-services, frontend-adapter]

# Tech tracking
tech-stack:
  added: []
  patterns: [smart JSONB trigger for diff-based validation, client-side locale selection, caching-aware capacity planning]

key-files:
  created:
    - .planning/phases/11-load-testing/11-DECISION.md
    - apps/supabase/benchmarks/results/jsonb-1000-voter-bulk-read.json
    - apps/supabase/benchmarks/results/jsonb-5000-voter-bulk-read.json
    - apps/supabase/benchmarks/results/jsonb-10000-voter-bulk-read.json
    - apps/supabase/benchmarks/results/relational-1000-voter-bulk-read.json
    - apps/supabase/benchmarks/results/relational-5000-voter-bulk-read.json
    - apps/supabase/benchmarks/results/relational-10000-voter-bulk-read.json
    - apps/supabase/benchmarks/pgbench/voter-bulk-read-relational-cte.sql
    - apps/supabase/benchmarks/pgbench/voter-bulk-read-relational-lateral.sql
    - apps/supabase/benchmarks/pgbench/voter-bulk-read-relational-rpc.sql
    - apps/supabase/benchmarks/pgbench/voter-bulk-read-relational-two-query.sql
    - apps/supabase/benchmarks/scripts/install-smart-jsonb-trigger.sql
    - apps/supabase/benchmarks/scripts/restore-original-jsonb-trigger.sql
    - apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh
    - apps/supabase/benchmarks/scripts/run-optimization-benchmarks.sh
  modified:
    - apps/supabase/benchmarks/data/generate-candidates-jsonb.sql
    - apps/supabase/benchmarks/data/generate-candidates-relational.sql
    - apps/supabase/benchmarks/data/generate-shared-data.sql
    - apps/supabase/benchmarks/scripts/swap-schema.sh
    - apps/supabase/benchmarks/results/.gitignore
    - apps/supabase/supabase/schema/006-answers-jsonb.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql

key-decisions:
  - "JSONB chosen over relational for answer storage (HIGH confidence)"
  - "Client-side locale selection — all locales returned, filtered in browser (simplifies caching 50 vs 150 entries)"
  - "Smart JSONB validation trigger validates only changed keys (44% write improvement, adopted in schema)"
  - "With caching (30-min TTL), DB sees at most ~50 concurrent queries — both schemas perform identically at this level"
  - "Decision rests on architectural simplicity: simpler queries, cache, API surface, inherits entity-level RLS"

patterns-established:
  - "Concurrency scaling benchmarks: 1/50/100/200/500/1000 client sweep"
  - "Optimized query comparison: test multiple SQL patterns before concluding bottleneck is fundamental"
  - "Caching-aware capacity planning: model real traffic with cache hit rates before raw DB performance"

requirements-completed: [LOAD-01, LOAD-02, LOAD-03, LOAD-04]

# Metrics
duration: 8min
completed: 2026-03-13
---

# Phase 11 Plan 02: Benchmark Execution & Decision Document Summary

**Executed JSONB vs relational benchmarks at 1K/5K/10K scale with concurrency scaling, wrote answer storage decision document choosing JSONB with HIGH confidence**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-13T17:35:00Z
- **Completed:** 2026-03-13T17:43:00Z
- **Tasks:** 3 (2 auto + 1 human checkpoint)
- **Files created/modified:** 43

## Accomplishments

- Executed full benchmark suite for both JSONB and relational schemas at 1K, 5K, and 10K candidate scale tiers (36 result JSON files)
- Ran concurrency scaling tests from 1 to 1000 concurrent clients revealing JSONB wins at low and high concurrency, relational marginally better at 50-100
- Benchmarked 4 optimized relational query patterns (CTE, LATERAL, two-query, RPC) — none closed the read gap, confirming bottleneck is fundamental
- Developed and benchmarked smart JSONB trigger that validates only changed keys (44% write improvement, 82% more TPS) — adopted into schema
- Wrote comprehensive decision document with realistic 100K-voter launch scenario, caching analysis, and Supabase cloud cost translation
- Decision: JSONB chosen on architectural simplicity grounds — with caching, both schemas perform identically at realistic concurrency (~50 queries)

## Task Commits

1. **Task 1: Execute benchmarks** - `eb861474a` (feat)
2. **Task 2: Write decision document** - `b9ab2ee7f` (docs)
3. **Task 3: Human review** - Approved (decision document reviewed and updated with caching analysis)

## Key Results

### Voter Bulk-Read (single client)
- JSONB 65-76% faster across all scales (3-4x due to co-located answers)
- Both well under p95 < 1000ms threshold

### Concurrency Scaling (5K, voter bulk-read)
- 1 client: JSONB 3.6x faster
- 50-100 clients: ~tied (TOAST decompression vs JOIN overhead)
- 500-1000 clients: JSONB 1.6-1.7x faster (relational correlated subqueries create I/O contention)

### Candidate Writes
- Relational 49-60% faster (row-level locking vs whole-row JSONB lock)
- Both well under p95 < 500ms threshold
- Smart trigger closes gap by 44%

### Critical Insight
With 30-min cache TTL and ~56 unique cache entries across all 100K voters, the database sees at most ~50 concurrent queries during cache refresh — where both schemas perform identically.

## Deviations from Plan

- Added concurrency scaling tests (1-1000 clients) beyond original plan scope
- Added optimized relational query comparison (4 alternative patterns)
- Added smart JSONB trigger development and benchmarking
- Added realistic scenario modeling with caching analysis
- k6 HTTP tests skipped in favor of more comprehensive pgbench concurrency scaling

## Follow-Up Items (from Decision Document)

- TODO: Safe concurrent answer upsert RPC function (before frontend adapter, v3+)
- TODO: Thundering herd cache protection (defer to Svelte 5 migration)
- TODO: Image/avatar question type replacing image JSONB column
- Smart JSONB trigger applied to `006-answers-jsonb.sql` (immediate)
- Question delete cascade trigger applied (immediate)
- Question type change protection trigger applied (immediate)

## Self-Check: PASSED

All 36 benchmark result JSON files present. Decision document contains benchmark data tables with p50/p95/p99 latencies. JSONB schema restored as default.

---
*Phase: 11-load-testing*
*Completed: 2026-03-13*
