---
phase: 11-load-testing
plan: 01
subsystem: testing
tags: [pgbench, k6, postgresql, benchmarking, jsonb, relational, sql]

# Dependency graph
requires:
  - phase: 09-supabase-schema
    provides: JSONB and relational answer schemas, entity tables, nomination tables
  - phase: 10-authentication-and-roles
    provides: Published columns, RLS policies, auth tables
provides:
  - Complete benchmark infrastructure for JSONB vs relational answer storage comparison
  - Data generation scripts with predictable UUIDs at configurable scale tiers
  - pgbench scripts for 4 query patterns x 2 schema variants
  - k6 HTTP load test for voter bulk-read via PostgREST
  - Schema swap automation and benchmark orchestration
affects: [11-02, load-testing, schema-decision]

# Tech tracking
tech-stack:
  added: [pgbench, k6, python3]
  patterns: [predictable UUID patterns for pgbench variable binding, schema swap via file replacement + migration regeneration, trigger disable/enable for bulk data loading]

key-files:
  created:
    - apps/supabase/benchmarks/data/generate-shared-data.sql
    - apps/supabase/benchmarks/data/generate-candidates-jsonb.sql
    - apps/supabase/benchmarks/data/generate-candidates-relational.sql
    - apps/supabase/benchmarks/pgbench/voter-bulk-read-jsonb.sql
    - apps/supabase/benchmarks/pgbench/voter-bulk-read-relational.sql
    - apps/supabase/benchmarks/pgbench/candidate-write-jsonb.sql
    - apps/supabase/benchmarks/pgbench/candidate-write-relational.sql
    - apps/supabase/benchmarks/pgbench/candidate-full-save-jsonb.sql
    - apps/supabase/benchmarks/pgbench/candidate-full-save-relational.sql
    - apps/supabase/benchmarks/pgbench/aggregation-jsonb.sql
    - apps/supabase/benchmarks/pgbench/aggregation-relational.sql
    - apps/supabase/benchmarks/k6/config.js
    - apps/supabase/benchmarks/k6/voter-bulk-read.js
    - apps/supabase/benchmarks/scripts/swap-schema.sh
    - apps/supabase/benchmarks/scripts/run-benchmarks.sh
    - apps/supabase/benchmarks/scripts/parse-pgbench-log.py
    - apps/supabase/benchmarks/README.md
    - apps/supabase/benchmarks/results/.gitignore
  modified: []

key-decisions:
  - "Predictable UUID patterns (00000000-0000-0000-XXXX-*) for pgbench variable binding since pgbench cannot generate random UUIDs"
  - "OFFSET-based random candidate selection in write benchmarks (approximate but sufficient for benchmarking)"
  - "PostgREST resource embedding via nominations!inner for k6 voter bulk-read (no RPC function needed)"
  - "Trigger disable/enable for bulk data loading, triggers remain active during benchmarks"

patterns-established:
  - "UUID pattern: {type_prefix}-{lpad(n, 12, '0')} for deterministic test data IDs"
  - "Schema swap: backup 006 file, copy alternative, regenerate migration, db reset"
  - "pgbench log parsing: python3 script for p50/p95/p99 percentile extraction"
  - "Benchmark orchestration: shell script with --quick/--full modes for A/B schema comparison"

requirements-completed: [LOAD-01, LOAD-02, LOAD-03]

# Metrics
duration: 6min
completed: 2026-03-13
---

# Phase 11 Plan 01: Benchmark Infrastructure Summary

**Complete pgbench + k6 benchmark toolkit for JSONB vs relational answer storage with data generation at 1K/5K/10K scale, schema swap automation, and orchestrated A/B comparison**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-13T16:53:46Z
- **Completed:** 2026-03-13T16:59:47Z
- **Tasks:** 3
- **Files modified:** 18

## Accomplishments

- Data generation scripts create realistic multi-tenant test data (5 projects, 50 questions, multi-locale, ~85% answer completion) at configurable scale tiers with predictable UUIDs for pgbench
- 8 pgbench SQL scripts cover all 4 query patterns (voter bulk-read, candidate write, full-form save, aggregation) for both JSONB and relational schemas
- k6 HTTP test validates voter bulk-read through PostgREST API with 100/500 concurrent VU scenarios and p95<1s threshold
- Orchestration script (run-benchmarks.sh) automates full A/B comparison: schema swap, data generation, pgbench runs, result parsing, k6 tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Data generation and schema swap scripts** - `2e9735125` (feat)
2. **Task 2: pgbench benchmark scripts for all query patterns** - `25e7891da` (feat)
3. **Task 3: k6 HTTP test, orchestration script, and README** - `f8965905d` (feat)

## Files Created/Modified

- `apps/supabase/benchmarks/data/generate-shared-data.sql` - Shared infrastructure: accounts, projects, elections, constituencies, questions with predictable UUIDs
- `apps/supabase/benchmarks/data/generate-candidates-jsonb.sql` - Candidates with JSONB answers at configurable scale
- `apps/supabase/benchmarks/data/generate-candidates-relational.sql` - Candidates with relational answers rows
- `apps/supabase/benchmarks/pgbench/voter-bulk-read-jsonb.sql` - Constituency-filtered candidate+answers read (JSONB)
- `apps/supabase/benchmarks/pgbench/voter-bulk-read-relational.sql` - Constituency-filtered read with JSON aggregation (relational)
- `apps/supabase/benchmarks/pgbench/candidate-write-jsonb.sql` - Single answer update via jsonb_set
- `apps/supabase/benchmarks/pgbench/candidate-write-relational.sql` - Single answer upsert via INSERT...ON CONFLICT
- `apps/supabase/benchmarks/pgbench/candidate-full-save-jsonb.sql` - Full 50-question save as single UPDATE
- `apps/supabase/benchmarks/pgbench/candidate-full-save-relational.sql` - Full 50-question save as multi-row upsert
- `apps/supabase/benchmarks/pgbench/aggregation-jsonb.sql` - Answer stats via jsonb_each + GROUP BY
- `apps/supabase/benchmarks/pgbench/aggregation-relational.sql` - Answer stats via simple GROUP BY
- `apps/supabase/benchmarks/k6/config.js` - Shared configuration (Supabase URLs, anon key, UUID constants)
- `apps/supabase/benchmarks/k6/voter-bulk-read.js` - HTTP load test with 100/500 VU scenarios
- `apps/supabase/benchmarks/scripts/swap-schema.sh` - Schema swap automation (JSONB <-> relational)
- `apps/supabase/benchmarks/scripts/run-benchmarks.sh` - Benchmark orchestration with --quick and --full modes
- `apps/supabase/benchmarks/scripts/parse-pgbench-log.py` - Percentile extraction (p50/p95/p99) from pgbench logs
- `apps/supabase/benchmarks/README.md` - Documentation for prerequisites, usage, and result interpretation
- `apps/supabase/benchmarks/results/.gitignore` - Excludes raw benchmark output

## Decisions Made

- **Predictable UUID patterns**: Used prefix-based deterministic UUIDs (e.g., `00000000-0000-0000-0001-000000000001`) since pgbench `\set` can only generate integers, not random UUIDs. Integer indexes are used to construct UUID strings in SQL.
- **OFFSET-based random selection**: Write benchmarks select random candidates via `ORDER BY id OFFSET floor(random() * 100) LIMIT 1`. This is approximate but avoids pgbench's inability to do subquery variable assignment.
- **PostgREST resource embedding**: k6 voter bulk-read uses `nominations?select=...candidates!inner(...)` syntax for inner join filtering through PostgREST, avoiding the need for a custom RPC function.
- **Trigger management**: Validation triggers disabled during bulk data loading for speed but remain active during benchmarks to measure real-world configuration overhead.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. pgbench and k6 must be installed on the developer's machine before running benchmarks.

## Next Phase Readiness

- Benchmark infrastructure complete and ready for Plan 02 (benchmark execution and decision document)
- All scripts are reusable: `run-benchmarks.sh --quick` for fast validation, `--full` for comprehensive comparison
- Schema swap automation tested at script level; full database reset requires Supabase local stack running

## Self-Check: PASSED

All 18 created files verified present. All 3 task commits verified in git log.

---
*Phase: 11-load-testing*
*Completed: 2026-03-13*
