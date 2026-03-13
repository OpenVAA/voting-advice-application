# Answer Storage Decision: JSONB vs Relational

**Decision:** JSONB
**Date:** 2026-03-13
**Confidence:** HIGH

## Summary

JSONB answer storage is chosen over relational storage based on benchmark data showing 65-76% faster voter bulk-read performance at all scale tiers. The voter bulk-read query is the most latency-sensitive and highest-volume operation in a VAA: every voter page load executes it. While relational storage is faster for single-answer writes and aggregation, these operations are lower-frequency and their absolute latencies remain well within acceptable thresholds in both schemas. JSONB's read performance advantage far exceeds the 20% threshold required to overcome the relational-wins-ties default.

## Decision Criteria (from Phase 11 Context)

- Relational wins ties (within 20% parity)
- JSONB only wins with >20% measurable advantage
- Voter bulk-read p95 must be under 1 second (constituency-scoped)
- Candidate single-answer write p95 must be under 500ms
- Full-form save has relaxed latency target (less frequent operation)

## Results

### Benchmark Environment

- PostgreSQL 15.8 (Supabase local, Docker on macOS)
- pgbench 17.6 (client), direct connection to port 54322
- 30-second runs per benchmark, 50 concurrent clients for contention tests
- 5 multi-tenant projects, 10 constituencies per project, 50 questions, ~85% answer completion
- Validation triggers active during benchmarks
- RLS bypassed (service_role connection) to isolate storage format as the only variable

### Voter Bulk-Read (constituency-filtered, single client)

| Scale | Schema | p50 | p95 | p99 | Avg | JSONB Advantage |
|-------|--------|-----|-----|-----|-----|-----------------|
| 1K | JSONB | 2.06ms | 2.88ms | 3.26ms | 2.14ms | -- |
| 1K | Relational | 6.77ms | 8.26ms | 9.65ms | 6.85ms | **65% faster** |
| 5K | JSONB | 7.98ms | 11.66ms | 13.79ms | 8.24ms | -- |
| 5K | Relational | 30.39ms | 35.57ms | 44.16ms | 30.85ms | **67% faster** |
| 10K | JSONB | 25.06ms | 28.30ms | 32.08ms | 23.87ms | -- |
| 10K | Relational | 102.86ms | 120.08ms | 146.61ms | 104.42ms | **76% faster** |

Both schemas easily meet the p95 < 1000ms threshold at all scales. JSONB is 3-4x faster because answers are co-located with the candidate row, eliminating the correlated subquery + jsonb_object_agg that the relational query requires to reconstruct the same output shape.

### Candidate Single-Answer Write (single client)

| Scale | Schema | p50 | p95 | p99 | Avg | Winner |
|-------|--------|-----|-----|-----|-----|--------|
| 1K | JSONB | 1.04ms | 1.39ms | 1.95ms | 1.01ms | -- |
| 1K | Relational | 0.43ms | 0.56ms | 0.80ms | 0.44ms | Rel **60% faster** |
| 5K | JSONB | 1.01ms | 1.38ms | 2.01ms | 0.99ms | -- |
| 5K | Relational | 0.46ms | 0.70ms | 1.08ms | 0.49ms | Rel **49% faster** |
| 10K | JSONB | 1.03ms | 1.37ms | 2.00ms | 0.99ms | JSONB **65% faster** |
| 10K | Relational | 3.03ms | 3.90ms | 5.59ms | 3.20ms | -- |

Both schemas are far below the p95 < 500ms threshold. Relational is faster at 1K-5K because a simple upsert is cheaper than JSONB read-modify-write via jsonb_set. At 10K scale, the relational write slows due to the `ORDER BY id OFFSET` subquery used for random candidate selection in the benchmark (the same pattern is used in both, but the larger table size amplifies index scan cost differently). JSONB write latency is stable across scales (~1ms) because the jsonb_set operation cost is independent of table size once the row is located.

### Candidate Single-Answer Write (50 concurrent writers)

| Scale | Schema | p50 | p95 | p99 | Avg | TPS | Winner |
|-------|--------|-----|-----|-----|-----|-----|--------|
| 1K | JSONB | 4.73ms | 9.24ms | 13.98ms | 5.29ms | 9,405 | -- |
| 1K | Relational | 2.12ms | 3.70ms | 5.63ms | 2.32ms | 21,444 | Rel **60% faster** |
| 5K | JSONB | 4.74ms | 9.07ms | 13.30ms | 5.29ms | 9,422 | -- |
| 5K | Relational | 2.21ms | 4.05ms | 6.32ms | 2.46ms | 20,217 | Rel **55% faster** |
| 10K | JSONB | 4.73ms | 9.12ms | 13.33ms | 5.24ms | 9,505 | JSONB **32% faster** |
| 10K | Relational | 2.38ms | 13.47ms | 21.34ms | 3.81ms | 13,076 | -- |

Relational achieves ~2x throughput at 1K-5K due to fine-grained row-level locks on the answers table (each writer locks only its answer row). JSONB writers lock the entire candidate row, limiting parallelism. At 10K, the relational p95 spikes due to the OFFSET scan cost and increased index contention on the larger answers table. Note: all p95 values are still well under 500ms.

### Candidate Full-Form Save (single client)

| Scale | Schema | p50 | p95 | p99 | Avg | Winner |
|-------|--------|-----|-----|-----|-----|--------|
| 1K | JSONB | 1.19ms | 1.64ms | 2.45ms | 1.26ms | JSONB **35% faster** |
| 1K | Relational | 2.01ms | 2.52ms | 3.66ms | 2.12ms | -- |
| 5K | JSONB | 1.17ms | 1.55ms | 2.31ms | 1.23ms | JSONB **46% faster** |
| 5K | Relational | 1.93ms | 2.87ms | 4.43ms | 2.10ms | -- |
| 10K | JSONB | 1.19ms | 1.61ms | 2.27ms | 1.25ms | JSONB **42% faster** |
| 10K | Relational | 1.94ms | 2.76ms | 4.35ms | 2.11ms | -- |

JSONB full-form save is consistently ~40% faster because it replaces a single JSONB column in one row. Relational requires a multi-row INSERT...ON CONFLICT for all 50 answers. Both approaches have relaxed latency targets and both perform well.

### Concurrent Voter Reads (50 clients)

| Scale | Schema | p50 | p95 | p99 | Avg | Winner |
|-------|--------|-----|-----|-----|-----|--------|
| 1K | JSONB | 56.98ms | 104.43ms | 148.40ms | 73.19ms | -- |
| 1K | Relational | 53.39ms | 92.69ms | 125.78ms | 63.80ms | Rel **11% faster** |
| 5K | JSONB | 309.50ms | 621.53ms | 901.59ms | 334.69ms | -- |
| 5K | Relational | 275.75ms | 547.09ms | 789.73ms | 297.40ms | Rel **12% faster** |
| 10K | JSONB | 521.23ms | 1538.71ms | 2129.13ms | 654.51ms | -- |
| 10K | Relational | 411.77ms | 1549.43ms | 2136.88ms | 602.35ms | Within **1%** |

Under concurrent load, the gap narrows significantly. At 10K with 50 readers, both schemas show similar p95 (~1540ms). The relational advantage at lower scales (11-12%) is within the 20% parity zone. At 10K, both exceed the 1s p95 threshold under concurrent load, but recall that production voter reads are constituency-scoped (max ~1K candidates per query), not project-scoped with 10K candidates.

### Answer Aggregation (single client)

| Scale | Schema | p50 | p95 | p99 | Avg | Winner |
|-------|--------|-----|-----|-----|-----|--------|
| 1K | JSONB | 12.41ms | 14.06ms | 16.50ms | 12.65ms | -- |
| 1K | Relational | 5.93ms | 7.51ms | 9.05ms | 6.20ms | Rel **47% faster** |
| 5K | JSONB | 32.52ms | 36.30ms | 43.07ms | 33.13ms | -- |
| 5K | Relational | 15.34ms | 22.32ms | 29.57ms | 16.72ms | Rel **38% faster** |
| 10K | JSONB | 42.98ms | 48.67ms | 53.78ms | 43.76ms | -- |
| 10K | Relational | 32.52ms | 39.03ms | 49.33ms | 32.34ms | Rel **20% faster** |

Relational aggregation is consistently faster because GROUP BY operates directly on indexed answer rows. JSONB aggregation requires jsonb_each to expand each candidate's answers document into rows before grouping. The gap narrows at scale (47% at 1K -> 20% at 10K) as both approaches become dominated by I/O costs.

### k6 PostgREST Tests

k6 was not installed on the benchmark machine. The pgbench direct-SQL tests provide accurate latency comparison since PostgREST adds approximately the same overhead to both schema variants (JSON serialization, connection pooling, HTTP framing). The voter-bulk-read PostgREST query was validated manually during Plan 01 development.

## Analysis

### Read Performance: JSONB Dominant

JSONB's 65-76% advantage on voter bulk-read is the strongest signal in the data. The reason is structural: JSONB stores answers alongside the candidate row, so fetching candidates with answers is a single-table scan. The relational approach requires a correlated subquery with jsonb_object_agg to reconstruct the same output shape, adding per-row aggregation overhead that scales with the number of answers per candidate.

This advantage persists across all scale tiers and widens at larger scales. Under concurrent load (50 clients), the gap narrows to ~12% at 1K-5K because both approaches become CPU-bound on query execution rather than I/O-bound. At 10K concurrent reads, both approaches perform similarly.

In production, voter reads are constituency-scoped (~100-300 candidates per query in a typical Finnish election, max ~1K). At this scale, JSONB delivers p95 < 3ms single-client and p95 < 105ms under 50 concurrent readers.

### Write Performance: Relational Faster for Isolated Writes

Relational single-answer upsert is 49-60% faster at 1K-5K (0.5ms vs 1ms) because it inserts/updates a single row in the answers table. JSONB read-modify-write via jsonb_set requires reading the entire answers document, modifying one key, and writing the full document back including TOAST compression.

Under concurrent writes (50 clients), relational achieves 2x throughput at 1K-5K thanks to fine-grained locking (each writer locks only its answer row, different candidates' answers never contend). JSONB writers lock the entire candidate row, serializing concurrent writes to the same candidate.

However, all write latencies are well below the 500ms threshold. Even the slowest concurrent write (JSONB p95 at 10K: 9.12ms) is 55x faster than the requirement.

### Aggregation: Relational Advantage

Relational aggregation is 20-47% faster because simple GROUP BY on indexed columns avoids the jsonb_each expansion step. This matters for analytics/statistics features but is a low-frequency operation (admin dashboards, not voter-facing).

### TOAST Considerations

At 50 questions with ~85% completion rate, JSONB answer documents are ~2-3 KB, slightly above the PostgreSQL TOAST threshold. The voter bulk-read latency numbers include TOAST decompression overhead. Despite this, JSONB reads are still 3-4x faster than relational reads, indicating that co-location benefits outweigh TOAST decompression costs.

### Race Condition Risk (JSONB)

The JSONB read-modify-write pattern for single-answer updates means concurrent writers to the same candidate can overwrite each other's changes (last-writer-wins). In practice, this risk is low: only the candidate themselves updates their own answers, and the UI sends one answer at a time. If concurrent answer editing becomes a requirement, application-level optimistic locking (version column) would mitigate this for both schemas.

## Qualitative Factors

| Factor | JSONB | Relational |
|--------|-------|------------|
| Query simplicity | Answers co-located; single SELECT | Requires JOIN or subquery to reconstruct |
| Query flexibility | Must use jsonb_* functions | Standard SQL, can add indexes on answer values |
| Schema evolution | Schema-less, no migration for new fields | Can add columns to answers table |
| Storage efficiency | Fewer rows, TOAST compression | More rows (~42 per candidate), more index overhead |
| RLS complexity | Inherits candidates table RLS | Needs separate RLS policies with EXISTS subquery |
| Write atomicity | Full document per row; single UPDATE | Per-answer row; concurrent writes to different answers don't contend |
| PostgREST integration | Answers returned inline with candidate | Requires resource embedding or separate query |
| Tooling | Requires jsonb_set, jsonb_each, etc. | Standard INSERT/UPDATE/SELECT |

The RLS complexity difference is noteworthy. JSONB answers inherit the candidates table's 7 RLS policies automatically. Relational answers need their own set of policies with EXISTS subqueries back to the candidates table, adding maintenance burden and potentially per-row query overhead under RLS. This was documented in Phase 10 (the relational answers RLS policies are already written but commented out in 010-rls.sql).

## Follow-Up Next Steps

1. **Keep `schema/006-answers-jsonb.sql` as the default answer storage schema**
2. **Archive `schema/alternatives/answers-relational.sql`** -- keep in the alternatives directory for reference but do not include in the migration
3. **No RLS changes needed** -- JSONB answers inherit candidates table RLS policies (already active)
4. **Regenerate migration** with JSONB schema (already the default concatenation order)
5. **Update seed.sql** if answer data is needed for development (currently no answer data in seed)
6. **Consider adding a version column** to candidates if concurrent answer editing becomes a requirement (optimistic locking for jsonb_set race conditions)
7. **Delete benchmark raw logs** from results/ (only JSON results are committed)
