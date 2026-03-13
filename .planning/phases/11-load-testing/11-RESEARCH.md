# Phase 11: Load Testing - Research

**Researched:** 2026-03-13
**Domain:** PostgreSQL benchmarking (JSONB vs relational), k6 load testing, pgbench
**Confidence:** HIGH

## Summary

This phase resolves the answer storage design decision by benchmarking two already-implemented schemas -- JSONB answers column on the `candidates` table vs a separate relational `answers` table -- at 1K, 5K, and 10K candidate scale tiers. The benchmarks must produce p50/p95/p99 latency data for voter bulk-read (constituency-filtered), candidate single-answer write, full-form save, concurrent reads, concurrent writes, and answer aggregation patterns.

The recommended approach splits benchmarking into two tiers: **pgbench for raw PostgreSQL query performance** (bypasses PostgREST/Auth overhead, isolates storage format as the only variable) and **k6 HTTP tests against the local Supabase REST API** for end-to-end validation of the voter bulk-read pattern through the real PostgREST stack. Data generation should use standalone SQL scripts executed via `psql` during a setup phase before benchmarks run.

**Primary recommendation:** Use pgbench with custom SQL scripts for all six query patterns, supplemented by k6 HTTP tests for the voter bulk-read to validate PostgREST behavior. Run benchmarks against the Supabase local Postgres instance (port 54322) with RLS bypassed (service_role) to isolate storage format performance.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Relational wins ties -- if both approaches perform within 20% of each other, relational is preferred (better query flexibility, normalization)
- JSONB only wins if it is measurably faster with a clear margin (>20% advantage)
- Voter bulk-read latency must be under 1 second (constituency-scoped, max ~3K candidates per query)
- Candidate single-answer write p95 must be under 500ms
- Full-form save (all answers at once) can be slower -- relaxed latency target
- Total candidates per project can reach 10K-30K, but voter-facing reads are always constituency-filtered (max ~3K results)
- 50 opinion questions per election (upper-end realistic VAA)
- Multi-tenant: 3-5 projects sharing the database
- 80-90% answer completion rate per candidate (realistic gaps)
- Multi-locale data: fi, sv, en (3 languages for question labels, candidate names)
- Scale tiers: 1K, 5K, and 10K candidates per project
- Query patterns: voter bulk-read, candidate single-answer update, full-form save, concurrent voter reads (100/500), answer aggregation, concurrent writes (100)
- Decision document: internal audience, summary + conclusion at top, markdown tables with p50/p95/p99
- Keep benchmark scripts in the repo after decision is made
- Place scripts in a benchmarks/ or tests/ directory under the supabase workspace

### Claude's Discretion
- k6 vs pgbench split -- which tool for which benchmark pattern
- Data generation approach (SQL scripts, k6 setup phase, or separate generator)
- Exact directory structure for benchmark scripts
- Whether to use Supabase local or a separate Postgres instance for benchmarks
- How to swap between JSONB and relational schemas for A/B comparison

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LOAD-01 | k6 load test scripts comparing JSONB vs relational answer storage at 1K, 5K, and 10K candidates | k6 HTTP tests against PostgREST API for voter bulk-read pattern; custom k6 Trend metrics for latency measurement; xk6-sql for direct SQL if needed |
| LOAD-02 | pgbench scripts measuring bulk-read latency (voter pattern: all candidates with answers) | pgbench custom scripts with `\set` variables for constituency filtering; `--log` output for percentile calculation; exact SQL queries documented |
| LOAD-03 | pgbench scripts measuring write latency (candidate updates one answer) at 100 concurrent writers | pgbench `-c 100` for concurrent clients; custom scripts for both JSONB read-modify-write and relational upsert patterns |
| LOAD-04 | Answer storage decision documented with supporting benchmark data | Decision document template with markdown tables, threshold criteria from CONTEXT.md, follow-up next steps |

</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| pgbench | Ships with PostgreSQL 15 | Raw SQL query benchmarking with concurrency control | Native PostgreSQL tool; directly connects to DB; accurate per-transaction latency; supports custom SQL scripts; built into Supabase local Postgres |
| k6 | Latest (v0.55+) | HTTP load testing against PostgREST API | Industry standard load testing; JavaScript test scripts; built-in percentile reporting (p50/p90/p95/p99); scenario/stage support |
| psql | Ships with PostgreSQL 15 | Data generation, schema swaps, direct queries | Direct SQL execution for setup/teardown scripts |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| xk6-sql + xk6-sql-driver-postgres | v1.0.6 | Direct SQL from k6 (if HTTP path insufficient) | Only if pgbench cannot produce needed metrics; requires building custom k6 binary with Go |
| Python/Node script | Any | Post-processing pgbench log files for percentiles | pgbench `--log` produces raw transaction times; need script to compute p50/p95/p99 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pgbench for SQL | xk6-sql for all benchmarks | xk6-sql does NOT emit query duration metrics natively (open issue #23); would need manual Trend timing in JS which is imprecise; pgbench is more accurate for raw SQL |
| k6 for HTTP | pgbench for everything | Misses the PostgREST serialization layer which affects real voter read latency; k6 captures the actual API response shape |
| Separate Postgres instance | Supabase local Postgres | Extra setup complexity for no benefit; Supabase local Postgres is real Postgres 15; benchmarks bypass RLS anyway |

**Installation:**
```bash
# k6 (macOS)
brew install k6

# pgbench is already available inside the Supabase Postgres container
# Access via: docker exec -it supabase_db_openvaa-local pgbench ...
# Or install locally: brew install postgresql@15

# For psql (if not already installed)
brew install libpq
```

## Architecture Patterns

### Recommended Directory Structure
```
apps/supabase/
  benchmarks/
    README.md                          # How to run benchmarks
    data/
      generate-test-data.sql           # Shared data generation (accounts, projects, elections, constituencies, questions, question_templates)
      generate-candidates-jsonb.sql    # Generate candidates with JSONB answers
      generate-candidates-relational.sql # Generate candidates + relational answers rows
    pgbench/
      voter-bulk-read-jsonb.sql        # Constituency-filtered SELECT with JSONB answers
      voter-bulk-read-relational.sql   # Constituency-filtered SELECT with JOIN to answers table
      candidate-write-jsonb.sql        # Single answer update (read-modify-write)
      candidate-write-relational.sql   # Single answer upsert
      candidate-full-save-jsonb.sql    # Full form save (one UPDATE)
      candidate-full-save-relational.sql # Full form save (50 upserts in transaction)
      concurrent-read.sql              # Same as voter-bulk-read (used with -c 100/500)
      aggregation-jsonb.sql            # GROUP BY answers per question (JSONB extraction)
      aggregation-relational.sql       # GROUP BY answers per question (simple SQL)
    k6/
      voter-bulk-read.js               # HTTP test against PostgREST for voter pattern
      config.js                        # Shared config (Supabase URL, anon key, etc.)
    scripts/
      run-benchmarks.sh                # Orchestrates: reset DB, generate data, run pgbench, run k6
      swap-schema.sh                   # Switches between JSONB and relational schemas
      parse-pgbench-log.py             # Extracts p50/p95/p99 from pgbench --log output
    results/                           # Raw results (gitignored or committed for reference)
```

### Pattern 1: Schema Swap for A/B Comparison
**What:** Switch between JSONB and relational answer storage by swapping schema files and resetting the database.
**When to use:** Before each benchmark run to ensure clean comparison.
**Approach:**
```bash
# For JSONB schema (default):
# schema/006-answers-jsonb.sql is already in place
# Run: supabase db reset (applies migrations + seed)

# For relational schema:
# 1. Move 006-answers-jsonb.sql aside
# 2. Copy alternatives/answers-relational.sql to 006-answers-relational.sql
# 3. Regenerate migration by concatenating schema/*.sql
# 4. Run: supabase db reset
# 5. Uncomment relational RLS policies in 010-rls.sql (if testing with RLS)
```

The swap script should automate this so each benchmark run starts from a clean state. The migration concatenation pattern is already established (Phase 10 decision).

### Pattern 2: Data Generation via SQL
**What:** Generate realistic test data using pure SQL `INSERT` statements with `generate_series()`.
**When to use:** Before each benchmark run, after schema reset.
**Example:**
```sql
-- Generate 1000 candidates with realistic JSONB answers
-- 50 questions, 85% completion rate, singleChoiceOrdinal values 1-5
INSERT INTO candidates (project_id, first_name, last_name, name, published)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Candidate',
  n::text,
  jsonb_build_object('fi', 'Ehdokas ' || n, 'sv', 'Kandidat ' || n, 'en', 'Candidate ' || n),
  true
FROM generate_series(1, 1000) AS n;

-- Generate JSONB answers for each candidate
UPDATE candidates SET answers = (
  SELECT jsonb_object_agg(
    q.id::text,
    jsonb_build_object('value', (floor(random() * 5) + 1)::int)
  )
  FROM questions q
  WHERE q.project_id = candidates.project_id
    AND random() < 0.85  -- 85% completion rate
)
WHERE project_id = '00000000-0000-0000-0000-000000000001'::uuid;
```

### Pattern 3: pgbench Custom Script with Variable Binding
**What:** pgbench scripts that simulate realistic query patterns with randomized parameters.
**When to use:** All six benchmark patterns.
**Example:**
```sql
-- voter-bulk-read-jsonb.sql
-- Simulates: voter loads all candidates in their constituency with answers
\set constituency_id random(1, :num_constituencies)
SELECT c.id, c.first_name, c.last_name, c.name, c.answers
FROM candidates c
JOIN nominations n ON n.candidate_id = c.id
WHERE n.constituency_id = :'constituency_uuid_' || :constituency_id
  AND n.project_id = :'project_id'
  AND c.published = true;
```

### Pattern 4: k6 HTTP Test Against PostgREST
**What:** Test the actual Supabase REST API endpoint that voters would use.
**When to use:** Voter bulk-read validation through the real stack.
**Example:**
```javascript
import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

const bulkReadDuration = new Trend('voter_bulk_read_duration', true);

const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
  scenarios: {
    voter_reads: {
      executor: 'constant-vus',
      vus: 100,
      duration: '60s',
    },
  },
  thresholds: {
    'voter_bulk_read_duration': ['p(95)<1000'], // p95 < 1s
  },
};

export default function () {
  const constituencyId = CONSTITUENCY_IDS[Math.floor(Math.random() * CONSTITUENCY_IDS.length)];
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/candidates?select=id,first_name,last_name,name,answers&nominations.constituency_id=eq.${constituencyId}&published=eq.true`,
    {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    }
  );
  bulkReadDuration.add(res.timings.duration);
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

### Anti-Patterns to Avoid
- **Running benchmarks with RLS enabled for raw comparison:** RLS adds overhead that is the same for both schemas. Benchmark without RLS first to isolate storage format, then optionally re-run with RLS as a sanity check.
- **Using `SELECT *` in JSONB benchmarks:** This forces TOAST decompression for all JSONB columns. The voter query specifically needs `answers`, so it must be included, but don't add unnecessary columns.
- **Testing without answer data:** Empty `answers` column (`'{}'`) will not trigger TOAST and gives misleadingly fast JSONB reads. Always populate realistic answer data.
- **Ignoring warm-up:** First queries are slower due to cold caches. Use pgbench's built-in warm-up (`-T` with extra seconds, or discard first N transactions).
- **Running concurrent benchmarks on a laptop without CPU pinning:** Results will be noisy. Run benchmarks sequentially, close other applications, repeat each benchmark 3+ times.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQL benchmarking with concurrency | Custom connection pool + timer in Node/Python | pgbench with `-c` and `-j` flags | pgbench handles connection management, timing, warm-up, and reporting; tested for decades |
| HTTP load testing | Custom concurrent HTTP client | k6 with scenarios | k6 handles VU scheduling, connection reuse, metric collection, percentile calculation |
| Percentile calculation | Manual sorting and indexing in bash | Python script with `numpy.percentile()` or simple sort-based calculation | Edge cases in percentile interpolation; one-liner in Python |
| Test data generation | Hand-crafted INSERT statements for each candidate | `generate_series()` + `random()` in SQL | Orders of magnitude faster; PostgreSQL does the heavy lifting |
| Schema swap automation | Manual file copying | Shell script that automates the 5-step swap process | Human error in manual process will invalidate benchmark results |

**Key insight:** The benchmark tooling (pgbench, k6) is battle-tested and handles the hard parts (connection pooling, timing accuracy, warm-up, reporting). The implementation effort should focus on writing realistic SQL queries and data generation, not building infrastructure.

## Common Pitfalls

### Pitfall 1: JSONB TOAST Decompression Overhead
**What goes wrong:** JSONB answer documents for 50 questions exceed PostgreSQL's TOAST threshold (~2 KB). Even minimal numeric-only answers for 45 questions produce ~2.4 KB of JSON text. With multi-locale open answers, documents reach 3+ KB. Every row read requires TOAST decompression.
**Why it happens:** PostgreSQL stores JSONB values exceeding ~2 KB in a separate TOAST table with compression. Reading the column requires extra I/O + CPU for decompression per row.
**How to avoid:** This is not avoidable for the JSONB approach -- it IS the thing being benchmarked. But ensure the relational approach does NOT have TOAST overhead (answer values are small individual JSONB scalars like `3` or `"text"`, well under 2 KB).
**Warning signs:** If JSONB results look suspiciously fast, check that answer data was actually populated. Empty `'{}'` answers won't trigger TOAST.

### Pitfall 2: pgbench Variable Limitations for UUIDs
**What goes wrong:** pgbench `\set` generates integers, not UUIDs. The schema uses UUID primary keys everywhere.
**Why it happens:** pgbench's built-in `random()` function returns integers. You cannot directly generate random UUIDs.
**How to avoid:** Pre-compute a lookup table or use numbered variables. Generate the test data with known constituency UUIDs (e.g., `00000000-0000-0000-0001-000000000001` through `00000000-0000-0000-0001-00000000000N`), then use pgbench `\set` to pick a random integer index and construct the UUID in the SQL query: `WHERE constituency_id = ('00000000-0000-0000-0001-' || lpad(:cid::text, 12, '0'))::uuid`.
**Warning signs:** pgbench scripts failing with "invalid UUID" errors.

### Pitfall 3: JSONB Read-Modify-Write Race Conditions
**What goes wrong:** The JSONB single-answer update pattern requires reading the full JSONB document, modifying one key, and writing back. Under concurrent writes, the last writer wins and can overwrite other writers' changes.
**Why it happens:** JSONB columns don't support partial updates. `jsonb_set()` operates on the full document.
**How to avoid:** This is actually an inherent limitation of JSONB storage that should be documented in the decision. For benchmarking, use `UPDATE candidates SET answers = jsonb_set(answers, ARRAY['question-uuid', 'value'], '3'::jsonb) WHERE id = :candidate_id` -- this is atomic at the SQL level but still reads/writes the full document.
**Warning signs:** Under 100 concurrent writers, watch for higher retry rates or lock contention on the JSONB approach vs relational.

### Pitfall 4: PostgREST Query Syntax for Joins
**What goes wrong:** The voter bulk-read query needs to filter candidates by constituency through the nominations table. PostgREST has specific syntax for resource embedding and filtering through relationships.
**Why it happens:** PostgREST is not a general SQL proxy; it has its own query syntax for joins and filters.
**How to avoid:** For the k6 HTTP tests, use PostgREST resource embedding syntax: `GET /candidates?select=*,nominations!inner(constituency_id)&nominations.constituency_id=eq.{uuid}`. Test the query manually first via curl before encoding it in k6 scripts.
**Warning signs:** k6 tests returning all candidates instead of constituency-filtered results; 400 errors from PostgREST.

### Pitfall 5: Connection Limits in Supabase Local
**What goes wrong:** Running 500 concurrent pgbench clients or k6 VUs against local Supabase exhausts the default connection pool.
**Why it happens:** Supabase local default_pool_size is 20 (config.toml). Even direct Postgres has `max_connections` defaults around 100.
**How to avoid:** For pgbench, connect directly to Postgres (port 54322) bypassing the pooler. For k6 HTTP tests (through PostgREST), the connection pool matters -- test at 100 VUs first, then consider increasing pool_size in config.toml for the 500 VU test. Document any config changes needed.
**Warning signs:** "too many connections" errors; pgbench hanging at startup.

### Pitfall 6: Relational Answers RLS Overhead
**What goes wrong:** The relational answers table has commented-out RLS policies in 010-rls.sql that use `EXISTS` subqueries to check entity ownership. These add per-row overhead for reads.
**Why it happens:** JSONB answers are protected by the candidates table's RLS (one policy check per candidate row). Relational answers need their own RLS with a JOIN back to candidates for ownership verification.
**How to avoid:** Benchmark first without RLS (both schemas), then optionally test with RLS enabled to measure the differential. The RLS overhead for relational answers is a real production concern that should be noted in the decision document even if raw benchmarks bypass it.
**Warning signs:** Relational reads being disproportionately slow WITH RLS vs WITHOUT -- this indicates the EXISTS subquery pattern is expensive at scale.

## Code Examples

### Voter Bulk-Read Query: JSONB
```sql
-- Source: Derived from existing schema (006-answers-jsonb.sql, 005-nominations.sql)
-- Returns all candidates in a constituency with their answers
SELECT c.id, c.first_name, c.last_name, c.name, c.answers
FROM candidates c
INNER JOIN nominations n ON n.candidate_id = c.id
WHERE n.constituency_id = :constituency_id
  AND n.project_id = :project_id
  AND c.published = true;
```

### Voter Bulk-Read Query: Relational
```sql
-- Source: Derived from existing schema (alternatives/answers-relational.sql)
-- Returns all candidates in a constituency, then answers as separate query or with lateral join
-- Option A: Two queries (candidate list + answers batch)
-- Query 1: Get candidate IDs
SELECT c.id, c.first_name, c.last_name, c.name
FROM candidates c
INNER JOIN nominations n ON n.candidate_id = c.id
WHERE n.constituency_id = :constituency_id
  AND n.project_id = :project_id
  AND c.published = true;

-- Query 2: Batch-fetch answers for those candidates
SELECT entity_id, question_id, value
FROM answers
WHERE entity_id = ANY(:candidate_ids)
  AND entity_type = 'candidate';

-- Option B: Single query with JSON aggregation (closer to JSONB output shape)
SELECT c.id, c.first_name, c.last_name, c.name,
  COALESCE(
    (SELECT jsonb_object_agg(a.question_id::text, jsonb_build_object('value', a.value))
     FROM answers a
     WHERE a.entity_id = c.id AND a.entity_type = 'candidate'),
    '{}'::jsonb
  ) AS answers
FROM candidates c
INNER JOIN nominations n ON n.candidate_id = c.id
WHERE n.constituency_id = :constituency_id
  AND n.project_id = :project_id
  AND c.published = true;
```

### Candidate Single-Answer Write: JSONB (read-modify-write)
```sql
-- Source: Standard PostgreSQL jsonb_set pattern
UPDATE candidates
SET answers = jsonb_set(
  COALESCE(answers, '{}'::jsonb),
  ARRAY[:question_id],
  jsonb_build_object('value', :answer_value)
)
WHERE id = :candidate_id;
```

### Candidate Single-Answer Write: Relational (upsert)
```sql
-- Source: Standard PostgreSQL ON CONFLICT upsert
INSERT INTO answers (project_id, entity_id, entity_type, question_id, value)
VALUES (:project_id, :candidate_id, 'candidate', :question_id, :answer_value::jsonb)
ON CONFLICT (entity_id, question_id)
DO UPDATE SET value = EXCLUDED.value;
```

### Full-Form Save: JSONB (single UPDATE)
```sql
-- Source: Replaces entire answers document
UPDATE candidates
SET answers = :full_answers_jsonb
WHERE id = :candidate_id;
```

### Full-Form Save: Relational (50 upserts in transaction)
```sql
BEGIN;
INSERT INTO answers (project_id, entity_id, entity_type, question_id, value)
VALUES
  (:project_id, :candidate_id, 'candidate', :q1, :v1::jsonb),
  (:project_id, :candidate_id, 'candidate', :q2, :v2::jsonb),
  -- ... repeat for all 50 questions
  (:project_id, :candidate_id, 'candidate', :q50, :v50::jsonb)
ON CONFLICT (entity_id, question_id)
DO UPDATE SET value = EXCLUDED.value;
COMMIT;
```

### Answer Aggregation: JSONB
```sql
-- Count answers per question (requires JSONB key extraction)
SELECT key AS question_id, count(*) AS answer_count,
  avg((value->>'value')::numeric) AS avg_value
FROM candidates c,
  jsonb_each(c.answers) AS kv(key, value)
WHERE c.project_id = :project_id
  AND c.published = true
GROUP BY key;
```

### Answer Aggregation: Relational
```sql
-- Count answers per question (simple GROUP BY)
SELECT question_id, count(*) AS answer_count,
  avg((value->>'value')::numeric) AS avg_value
FROM answers
WHERE project_id = :project_id
  AND entity_type = 'candidate'
GROUP BY question_id;
```

### pgbench Percentile Extraction Script
```python
#!/usr/bin/env python3
"""Parse pgbench --log output and compute p50/p95/p99 latencies."""
import sys

latencies = []
for line in sys.stdin:
    parts = line.strip().split()
    if len(parts) >= 3:
        # pgbench log format: client_id transaction_no time_epoch time_us [schedule_lag]
        latency_us = int(parts[2])  # microseconds
        latencies.append(latency_us / 1000.0)  # convert to ms

latencies.sort()
n = len(latencies)
if n == 0:
    print("No data")
    sys.exit(1)

def percentile(data, p):
    idx = int(p / 100.0 * len(data))
    return data[min(idx, len(data) - 1)]

print(f"Transactions: {n}")
print(f"p50: {percentile(latencies, 50):.2f} ms")
print(f"p95: {percentile(latencies, 95):.2f} ms")
print(f"p99: {percentile(latencies, 99):.2f} ms")
print(f"avg: {sum(latencies)/n:.2f} ms")
print(f"min: {min(latencies):.2f} ms")
print(f"max: {max(latencies):.2f} ms")
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pgbench only for benchmarks | pgbench + k6 for layered benchmarks | ~2023 | k6 tests the actual API layer (PostgREST) that applications use; pgbench tests raw SQL |
| JSONB as always-fast for reads | JSONB TOAST awareness | Ongoing | Documents exceeding 2 KB trigger TOAST decompression; 50-question VAA answers will TOAST (~2.4-3+ KB) |
| `SELECT *` patterns | Explicit column selection | Ongoing | Avoiding unnecessary TOAST decompression for columns not needed |
| pgbench native percentiles only | pgbench `--log` + post-processing | Always available | pgbench reports averages and stddev natively; percentiles require `--log` flag and external processing |

**Key TOAST Finding:**
Estimated JSONB answer document sizes for this project:
- 45 numeric-only answers: ~2.4 KB (exceeds 2 KB TOAST threshold)
- 47 answers with some multi-locale open answers: ~3.1 KB
- This means EVERY voter bulk-read row will require TOAST decompression for the JSONB approach
- The relational approach stores individual answer values (a few bytes each) -- no TOAST

## Tool Split Recommendation (Claude's Discretion)

### pgbench: Primary benchmark tool for all six query patterns
**Rationale:** pgbench connects directly to PostgreSQL, provides accurate per-transaction timing, supports custom SQL scripts, handles concurrency natively (`-c` for clients, `-j` for threads), and produces raw latency logs (`--log`) for percentile calculation. It bypasses PostgREST/Auth overhead, which is correct for isolating storage format as the variable.

### k6: Supplementary tool for voter bulk-read HTTP validation
**Rationale:** The voter app reads data through PostgREST, not direct SQL. k6 validates that the PostgREST serialization layer doesn't introduce unexpected behavior (e.g., JSONB serialization vs relational JSON aggregation). k6 provides built-in p50/p95/p99 reporting for HTTP request duration. Use for the voter bulk-read pattern only -- the other patterns (candidate writes, aggregation) are internal operations that don't go through PostgREST in production.

### Data generation: Standalone SQL scripts via psql
**Rationale:** `generate_series()` + `random()` in PostgreSQL is the fastest way to create realistic test data. One script generates the shared infrastructure (accounts, projects, elections, constituencies, questions), and separate scripts generate candidate data appropriate for each schema variant.

### Supabase local for benchmarks (not a separate Postgres)
**Rationale:** The Supabase local stack runs real PostgreSQL 15 (the same version specified in config.toml). Using it means benchmarks run against the actual deployment target with all extensions and configuration. For pgbench, connect directly to port 54322 (bypassing pooler). For k6, hit the PostgREST API on port 54321.

### Schema swap: Shell script automating file swap + migration regeneration
**Rationale:** The schema concatenation pattern is established (Phase 10). The swap script automates: (1) backup current 006 file, (2) copy alternative, (3) regenerate migration, (4) `supabase db reset`, (5) run data generation. This ensures each benchmark starts from identical state.

## Open Questions

1. **PostgREST query syntax for constituency-filtered candidate reads**
   - What we know: PostgREST supports resource embedding with `!inner` for inner joins
   - What's unclear: Exact query syntax for filtering candidates through nominations table to constituency; whether PostgREST can do this efficiently or needs an RPC function
   - Recommendation: Test the PostgREST query manually before encoding in k6 scripts; fall back to an RPC function if PostgREST syntax is too limited

2. **pgbench inside Docker vs host**
   - What we know: pgbench ships with PostgreSQL in the Supabase Docker container; can also install on macOS host
   - What's unclear: Whether running pgbench from inside the Docker container vs from the host significantly affects latency results
   - Recommendation: Run pgbench from the host (connecting to localhost:54322) for consistency with k6 tests which also run from the host; install via `brew install postgresql@15` if not available

3. **Answer validation trigger impact on write benchmarks**
   - What we know: Both schemas have validation triggers (`validate_answers_jsonb` and `validate_answer_relational`) that check answer values against question types
   - What's unclear: How much overhead the triggers add, especially the JSONB trigger which iterates all answers on every update
   - Recommendation: Benchmark with triggers enabled (this is the real-world configuration); note if trigger overhead is significant in results

## Validation Architecture

> nyquist_validation not explicitly configured -- including this section.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pgbench (PostgreSQL 15) + k6 (latest) |
| Config file | `apps/supabase/benchmarks/scripts/run-benchmarks.sh` (to be created) |
| Quick run command | `bash apps/supabase/benchmarks/scripts/run-benchmarks.sh --quick` (single scale tier) |
| Full suite command | `bash apps/supabase/benchmarks/scripts/run-benchmarks.sh --full` (all scale tiers) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOAD-01 | k6 scripts compare JSONB vs relational at 1K/5K/10K | benchmark | `k6 run apps/supabase/benchmarks/k6/voter-bulk-read.js` | Wave 0 |
| LOAD-02 | pgbench bulk-read latency | benchmark | `pgbench -f apps/supabase/benchmarks/pgbench/voter-bulk-read-jsonb.sql -c 1 -T 30 ...` | Wave 0 |
| LOAD-03 | pgbench write latency at 100 concurrent writers | benchmark | `pgbench -f apps/supabase/benchmarks/pgbench/candidate-write-jsonb.sql -c 100 -T 30 ...` | Wave 0 |
| LOAD-04 | Decision document with benchmark data | document | Manual review of `.planning/phases/11-load-testing/11-DECISION.md` | Wave 0 |

### Sampling Rate
- **Per task commit:** Run quick benchmark (1K candidates, 10-second runs)
- **Per wave merge:** Full benchmark suite (all scale tiers, 30-60 second runs)
- **Phase gate:** Decision document completed with all latency data

### Wave 0 Gaps
- [ ] `apps/supabase/benchmarks/` directory -- entire benchmark infrastructure
- [ ] `apps/supabase/benchmarks/data/generate-test-data.sql` -- shared data generation
- [ ] `apps/supabase/benchmarks/scripts/run-benchmarks.sh` -- orchestration script
- [ ] `apps/supabase/benchmarks/scripts/swap-schema.sh` -- schema swap automation
- [ ] `apps/supabase/benchmarks/scripts/parse-pgbench-log.py` -- percentile extraction
- [ ] k6 installation on dev machine (`brew install k6`)
- [ ] pgbench availability verification (inside Docker or host)

## Sources

### Primary (HIGH confidence)
- PostgreSQL 18 pgbench documentation (https://www.postgresql.org/docs/current/pgbench.html) -- custom script syntax, CLI options, `--log` format
- Existing schema files in `apps/supabase/supabase/schema/` -- actual table definitions, triggers, RLS policies, indexes
- Grafana xk6-sql GitHub (https://github.com/grafana/xk6-sql) -- v1.0.6 API, driver model, missing query duration metric (issue #23)
- Supabase config.toml -- port 54322 for direct Postgres, port 54321 for API, PostgreSQL 15 major version

### Secondary (MEDIUM confidence)
- JSONB TOAST performance analysis (https://pganalyze.com/blog/5mins-postgres-jsonb-toast, https://www.evanjones.ca/postgres-large-json-performance.html) -- 2-10x slowdown for values >2 KB, TOAST decompression overhead
- k6 documentation (https://k6.io/docs/) -- thresholds, scenarios, Trend custom metrics, percentile reporting
- Supabase local development connection strings (https://supabase.com/docs/guides/database/connecting-to-postgres) -- `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### Tertiary (LOW confidence)
- JSONB vs relational performance comparison claims (various Medium articles) -- general guidance but no project-specific benchmarks; this is exactly what Phase 11 will produce

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- pgbench and k6 are well-documented, mature tools; the schema files are already written and reviewed
- Architecture: HIGH -- directory structure follows established patterns from the project; SQL queries derived directly from existing schema
- Pitfalls: HIGH -- TOAST behavior is well-documented; pgbench UUID limitation is a known pattern; connection limits are documented in config.toml
- JSONB size estimate: HIGH -- calculated from actual schema (UUID keys + integer/text values for 50 questions)

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable domain -- PostgreSQL and k6 APIs don't change frequently)
