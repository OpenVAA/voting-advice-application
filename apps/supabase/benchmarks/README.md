# Benchmark Suite: JSONB vs Relational Answer Storage

Compares two answer storage approaches for the OpenVAA Supabase schema:

- **JSONB**: Answers stored as a JSONB column on the `candidates` table
- **Relational**: Answers stored in a separate `answers` table (one row per entity-question pair)

## Prerequisites

- **Supabase CLI** running locally (`npx supabase start` from `apps/supabase/`)
- **pgbench** installed (`brew install postgresql@15` and ensure it's in PATH)
- **psql** installed (comes with postgresql)
- **k6** installed (`brew install k6`) -- optional, only for HTTP load tests
- **Python 3** -- for parsing pgbench log output

## Quick Start

```bash
# From the repo root:
cd apps/supabase

# Start Supabase local (if not already running)
npx supabase start

# Run quick benchmarks (1K candidates, 10s per test, both schemas)
bash benchmarks/scripts/run-benchmarks.sh --quick

# Run full benchmarks (1K/5K/10K candidates, 30s per test, includes k6)
bash benchmarks/scripts/run-benchmarks.sh --full
```

## Options

```
--quick              1K scale, 10s runs (default)
--full               1K/5K/10K scales, 30s runs, k6 HTTP tests
--scale N            Specific candidate scale (e.g., 5000)
--schema S           Schema variant: jsonb, relational, or both (default: both)
--duration N         pgbench run duration in seconds
--k6                 Also run k6 HTTP tests
```

Examples:

```bash
# Only test JSONB at 5K scale with 20s runs
bash benchmarks/scripts/run-benchmarks.sh --scale 5000 --schema jsonb --duration 20

# Only test relational with k6 HTTP tests
bash benchmarks/scripts/run-benchmarks.sh --schema relational --k6
```

## Directory Structure

```
benchmarks/
  data/
    generate-shared-data.sql           # Accounts, projects, elections, constituencies, questions
    generate-candidates-jsonb.sql      # Candidates + JSONB answers
    generate-candidates-relational.sql # Candidates + relational answers rows
  pgbench/
    voter-bulk-read-jsonb.sql          # Constituency-filtered read (JSONB)
    voter-bulk-read-relational.sql     # Constituency-filtered read (relational, JSON aggregation)
    candidate-write-jsonb.sql          # Single answer update (jsonb_set)
    candidate-write-relational.sql     # Single answer upsert (INSERT...ON CONFLICT)
    candidate-full-save-jsonb.sql      # Full form save (single UPDATE)
    candidate-full-save-relational.sql # Full form save (multi-row upsert)
    aggregation-jsonb.sql              # Answer stats per question (jsonb_each)
    aggregation-relational.sql         # Answer stats per question (GROUP BY)
  k6/
    config.js                          # Shared k6 config (URLs, keys, UUID constants)
    voter-bulk-read.js                 # HTTP load test against PostgREST
  scripts/
    run-benchmarks.sh                  # Master orchestration script
    swap-schema.sh                     # Switch between JSONB and relational schemas
    parse-pgbench-log.py               # Extract p50/p95/p99 from pgbench logs
  results/                             # Raw benchmark output (gitignored)
```

## Query Patterns Tested

| Pattern | What it tests | Concurrency levels |
|---------|--------------|-------------------|
| **Voter bulk-read** | Load all candidates in a constituency with answers | 1, 100, 500 |
| **Candidate write** | Update a single answer for one candidate | 1, 100 |
| **Candidate full-save** | Save all 50 answers at once | 1 |
| **Aggregation** | Count/average answers per question | 1 |

## Test Data

- **5 projects** (multi-tenant) with **1 election** and **10 constituencies** each
- **50 questions** per project (singleChoiceOrdinal, Likert 1-5)
- **~85% answer completion** rate per candidate
- **Multi-locale** names (fi, sv, en)
- Scale tiers: **1K, 5K, 10K** candidates per project

## How It Works

1. **Schema swap**: `swap-schema.sh` switches between JSONB and relational by swapping schema files, regenerating the migration, and running `supabase db reset`
2. **Data generation**: SQL scripts use `generate_series()` with predictable UUIDs for pgbench variable binding
3. **pgbench**: Connects directly to PostgreSQL (port 54322), bypassing PostgREST. Produces raw per-transaction latencies via `--log`
4. **k6**: Tests the voter bulk-read through the PostgREST HTTP API (port 54321) for end-to-end validation
5. **Results parsing**: `parse-pgbench-log.py` computes p50/p95/p99 percentiles from pgbench logs

## Interpreting Results

Results are saved as JSON in `results/`:

```json
{
  "transactions": 1234,
  "p50_ms": 2.34,
  "p95_ms": 5.67,
  "p99_ms": 12.34,
  "avg_ms": 3.45,
  "min_ms": 0.89,
  "max_ms": 45.67
}
```

Key thresholds (from CONTEXT.md):

- **Voter bulk-read p95 < 1000ms** (must be under 1 second)
- **Candidate single-write p95 < 500ms**
- **Relational wins ties** (if within 20% of each other, prefer relational)
- **JSONB only wins** with > 20% advantage

## Adding New Benchmark Patterns

1. Create a new `.sql` file in `pgbench/` with pgbench `\set` variable syntax
2. Add the pattern to `run_pgbench()` calls in `run-benchmarks.sh`
3. For HTTP tests, add a new k6 script in `k6/` importing from `config.js`

## Schema Swap Details

The `swap-schema.sh` script:

- Backs up `006-answers-jsonb.sql` to `.bak`
- Copies `alternatives/answers-relational.sql` to `006-answers-relational.sql`
- Regenerates the migration by concatenating schema files
- Runs `supabase db reset`
- Restores JSONB schema with `swap-schema.sh restore`

Validation triggers remain active during benchmarks (intentional -- measures real-world configuration).
