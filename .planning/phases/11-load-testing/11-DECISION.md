# Answer Storage Decision: JSONB vs Relational

**Decision:** JSONB
**Date:** 2026-03-14 (updated from 2026-03-13 with caching analysis and concurrency scaling)
**Confidence:** HIGH

## Summary

JSONB answer storage is chosen over relational storage. While initial benchmarks showed JSONB 65-76% faster for single-client voter reads, the decision was refined by modeling a realistic 100K-voter launch scenario with caching analysis. The key finding: with effective caching (30-min TTL), the database handles at most ~50 concurrent queries during cache refresh — a level where both schemas perform nearly identically. The decision therefore rests on **architectural simplicity**, where JSONB wins on every dimension: simpler queries, simpler cache structure, simpler API surface, and inherits entity-level RLS without additional policies.

Locale selection will be performed on the client side — all locales returned in API responses, filtered in the browser. This simplifies caching (50 entries vs 150 per project) and allows locale switching without refetching.

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

Both schemas easily meet the p95 < 1000ms threshold at all scales. JSONB is 3-4x faster because answers are co-located with the candidate row, eliminating the correlated subquery + jsonb_object_agg that the relational query requires.

### Concurrency Scaling (5K candidates, voter bulk-read)

Tests at 1–1000 concurrent pgbench clients with max_connections=1100:

| Clients | JSONB avg | REL avg | JSONB p95 | REL p95 | Winner | Ratio |
|---------|-----------|---------|-----------|---------|--------|-------|
| 1 | 10.5ms | 37.5ms | 14.6ms | 47.1ms | **JSONB** | 3.6x |
| 50 | 330ms | 303ms | 620ms | 522ms | **REL** | 1.1x |
| 100 | 650ms | 641ms | 1410ms | 1305ms | ~tied | 1.0x |
| 200 | 1307ms | 1411ms | 2453ms | 2299ms | ~tied | 1.1x |
| 500 | 3313ms | 5239ms | 5272ms | 7078ms | **JSONB** | 1.6x |
| 1000 | 6260ms | 10770ms | 10032ms | 17601ms | **JSONB** | 1.7x |

Throughput (transactions per second):

| Clients | JSONB TPS | REL TPS | Winner |
|---------|-----------|---------|--------|
| 1 | 95 | 27 | JSONB |
| 50 | 151 | 165 | REL |
| 100 | 154 | 156 | REL |
| 200 | 153 | 141 | JSONB |
| 500 | 147 | 95 | JSONB |
| 1000 | 148 | 98 | JSONB |

**Scaling pattern:**
- **1-30 clients**: JSONB wins 3.6x (single-table read, no JOIN overhead)
- **30-150 clients**: Relational marginally better (~10%) (JSONB TOAST CPU decompression competes for cores)
- **200+ clients**: JSONB wins 1.6-1.7x (relational correlated subqueries create I/O contention)
- JSONB sustains ~148 TPS regardless of client count; relational peaks at 165 then collapses to 95

### Optimized Relational Read Queries (5K candidates)

Four alternative relational query patterns were benchmarked to test whether the relational read gap could be closed:

| Query Pattern | 1c avg | 50c avg | Notes |
|---|---|---|---|
| Original (correlated subquery) | 37.5ms | 291ms | Baseline |
| CTE + GROUP BY | 43.2ms | 299ms | 15% slower (optimizer can't push predicates) |
| LATERAL JOIN | 37.7ms | 292ms | Same plan as original |
| Two-query (no aggregation) | 28.4ms | 530ms | Best 1c but worst at 50c (2x round trips) |
| RPC function wrapper | 37.1ms | 294ms | Same plan as original |

**Conclusion:** No query optimization closes the relational read gap. The bottleneck is fundamental — fetching and aggregating ~42 answer rows per candidate from a separate table.

### Smart JSONB Validation Trigger (5K candidates)

A trigger that validates only changed answer keys (diff-based, like relational per-row validation) was benchmarked against the original full-scan trigger:

| Trigger | 1c avg | 50c avg | TPS (50c) |
|---|---|---|---|
| Original (validates all keys) | 5.25ms | 48.05ms | 1,039 |
| Smart (validates only changes) | 2.90ms | 26.47ms | 1,886 |
| **Improvement** | **44%** | **45%** | **82% more TPS** |

The smart trigger is adopted in the schema (see `006-answers-jsonb.sql`).

### Candidate Single-Answer Write (single client)

| Scale | Schema | p50 | p95 | p99 | Avg | Winner |
|-------|--------|-----|-----|-----|-----|--------|
| 1K | JSONB | 1.04ms | 1.39ms | 1.95ms | 1.01ms | -- |
| 1K | Relational | 0.43ms | 0.56ms | 0.80ms | 0.44ms | Rel **60% faster** |
| 5K | JSONB | 1.01ms | 1.38ms | 2.01ms | 0.99ms | -- |
| 5K | Relational | 0.46ms | 0.70ms | 1.08ms | 0.49ms | Rel **49% faster** |

Both are far below the 500ms threshold. Relational is faster for isolated writes, but writes are infrequent during the voter phase when load matters most.

### Candidate Single-Answer Write (50 concurrent writers)

| Scale | Schema | p50 | p95 | p99 | Avg | TPS | Winner |
|-------|--------|-----|-----|-----|-----|-----|--------|
| 1K | JSONB | 4.73ms | 9.24ms | 13.98ms | 5.29ms | 9,405 | -- |
| 1K | Relational | 2.12ms | 3.70ms | 5.63ms | 2.32ms | 21,444 | Rel **60% faster** |
| 5K | JSONB | 4.74ms | 9.07ms | 13.30ms | 5.29ms | 9,422 | -- |
| 5K | Relational | 2.21ms | 4.05ms | 6.32ms | 2.46ms | 20,217 | Rel **55% faster** |

Relational achieves ~2x write throughput due to fine-grained row-level locking. JSONB writers lock the entire candidate row. The smart trigger reduces JSONB write latency by ~44%, partially closing this gap. All write latencies remain well below the 500ms threshold.

### Answer Aggregation (single client)

| Scale | Schema | p50 | p95 | p99 | Avg | Winner |
|-------|--------|-----|-----|-----|-----|--------|
| 1K | JSONB | 12.41ms | 14.06ms | 16.50ms | 12.65ms | -- |
| 1K | Relational | 5.93ms | 7.51ms | 9.05ms | 6.20ms | Rel **47% faster** |
| 5K | JSONB | 32.52ms | 36.30ms | 43.07ms | 33.13ms | -- |
| 5K | Relational | 15.34ms | 22.32ms | 29.57ms | 16.72ms | Rel **38% faster** |

Relational aggregation is faster because GROUP BY operates directly on indexed rows. This matters for admin dashboards, not voter-facing operations.

## Realistic Scenario: 100K Voters on Launch Day

### Traffic Model

100K voters, Pareto-distributed after launch time:

| Time Window | Users | % of Total |
|---|---|---|
| Hour 0-1 (launch) | ~30,000 | 30% |
| Hour 1-2 | ~15,000 | 15% |
| Hour 2-4 | ~15,000 | 15% |
| Hour 4-8 | ~15,000 | 15% |
| Hour 8-24 | ~25,000 | 25% |

Peak 5-minute window: ~3,000-5,000 concurrent users. Average session: ~5-15 minutes (mostly answering questions with no DB load).

### API Call Pattern Per Session

```
Phase 1 (Initial load) — ALL users, same data:
  ┌─ app_settings       ← identical for everyone
  ├─ elections           ← identical for everyone
  ├─ constituency_groups ← identical for everyone
  └─ constituencies      ← identical for everyone

Phase 2 (After selection) — per election:
  ┌─ question_categories ← same per project (5 unique)
  ├─ questions           ← same per project (5 unique)
  └─ nomination_counts   ← same per constituency (50 unique)

Phase 3 (Candidate loading) — per constituency:
  └─ candidates + answers ← same per constituency (50 unique)
```

With 50 constituencies, there are only **~55 unique query results** across all 100K users.

### Caching Impact

Data changes at most every 30 minutes, enabling aggressive caching:

| Phase | Unique cache entries | Cache hit rate | DB queries per 30 min |
|---|---|---|---|
| Phase 1 (global) | 1 | ~100% | 1 |
| Phase 2 (per project) | 5 | ~100% | 5 |
| Phase 3 (per constituency) | 50 | ~100% | 50 |
| **Total** | **56** | | **~1.9 queries/minute** |

**With caching, the database is essentially idle during steady state.**

Worst case — thundering herd after cache invalidation: ~56 concurrent queries (with single-flight protection), which is exactly the concurrency level where JSONB and relational perform identically (~300ms).

### Supabase Cloud Translation

| Compute Tier | CPU | RAM | Max DB Connections | Pooler Clients | Price |
|---|---|---|---|---|---|
| Small | 2-core ARM shared | 2GB | 90 | 400 | ~$25/mo |
| Medium | 2-core ARM shared | 4GB | 120 | 600 | ~$50/mo |
| Large | 2-core ARM dedicated | 8GB | 160 | 800 | ~$100/mo |

Supavisor (connection pooler) in transaction mode means 500 concurrent users map to ~90 actual database connections. With caching, the database sees at most ~50 concurrent queries during cache refresh — well within even the Small tier.

Estimated cloud latency (Small tier, typical Finnish VAA, ~2K candidates):

| Concurrent Users | JSONB end-to-end | Relational end-to-end |
|---|---|---|
| 100 | ~50-80ms | ~100-150ms |
| 500 | ~100-200ms | ~200-400ms |
| 5,000 | ~300-600ms | ~500-1,000ms |
| 50,000 (peak) | ~2-4s (need Medium+) | ~4-8s (need Large+) |

These estimates assume no caching. **With caching, all users after the first ~56 get cached responses regardless of concurrency.**

## Locale Strategy: Client-Side Selection

All locales will be returned in API responses; locale filtering happens in the browser.

| Strategy | Cache entries | Payload per constituency | Pros | Cons |
|----------|--------------|------------------------|------|------|
| **All locales (client-side)** | 50 | ~400-500KB | Simple cache, locale switch without refetch | Slightly larger payloads |
| Server-side filter | 150 (50 × 3 locales) | ~150-200KB | Smaller payloads | 3x cache entries, refetch on locale switch |

**Rationale:**
- 50 cache entries vs 150 — simpler cache management and faster warming
- User can switch locale without re-fetching (better UX during session)
- Payload difference is modest and compresses well (JSONB locale objects have repetitive structure)
- Zipf/Pareto locale distribution (e.g. 80% Finnish, 15% Swedish, 5% English) means server-side filtering saves bandwidth for the majority, but at the cost of 3x cache complexity — not worth it

## Analysis

### With Caching, Schema Performance is Nearly Irrelevant

The realistic worst-case database load is ~50 concurrent queries during cache refresh. At this concurrency level, JSONB and relational perform within 10% of each other. The decision therefore shifts from raw performance to architectural factors:

| Factor | JSONB | Relational | Impact with Caching |
|--------|-------|------------|-------------------|
| Read speed | 3.6x faster (1c) | Tied at 50c | **Low** — cache handles reads |
| Write safety | `jsonb_set()` read-modify-write | Row-level independence | **Low** — writes rare during voter phase |
| Schema simplicity | Single table, no JOINs | JOIN + aggregation needed | **Medium** — simpler API, cache keys |
| Cache invalidation | Watch `candidates.updated_at` | Watch `answers` table changes | **Tie** |
| Payload efficiency | Answers embedded, one fetch | Requires JOIN or 2nd query | **Medium** — simpler API response |
| Smart trigger | Validates only changed keys (44% faster) | Per-row validation inherent | **Low** — writes rare in voter phase |
| RLS complexity | Inherits candidates table policies | Needs separate policies with EXISTS | **Medium** — less maintenance |
| Transaction count per session | 1 query for candidates+answers | 1-2 queries (complex JOIN or two-query) | **Low with caching** |

### TOAST Considerations

At 50 questions with ~85% completion, JSONB answer documents are ~2-3 KB (slightly above the PostgreSQL TOAST threshold). Under high concurrency (50-100 clients), TOAST CPU decompression creates a marginal bottleneck — but this only matters for cache misses, which occur ~56 times per 30-minute window.

### Race Condition Risk (JSONB)

The JSONB `jsonb_set()` read-modify-write pattern means concurrent writers to the same candidate can overwrite each other's changes. Mitigation: an RPC function that performs atomic single-key updates server-side (see Follow-Up Items). In practice, only the candidate themselves updates their own answers, and the UI sends one answer at a time.

## Follow-Up Items

### Immediate (applied to schema)

1. **Smart JSONB validation trigger** — validates only changed answer keys on UPDATE (44% write improvement). Applied to `006-answers-jsonb.sql`.
2. **Question delete cascade** — trigger on `questions` that removes orphaned answer keys from `candidates.answers` and `organizations.answers` when a question is deleted. Applied to `006-answers-jsonb.sql`.
3. **Question type change protection** — trigger on `questions` that prevents type/choices changes if existing answers would become invalid. Applied to `006-answers-jsonb.sql`.

### TODO: Safe Concurrent Answer Upsert (RPC Function)

Create a PostgreSQL RPC function for atomic single-answer upsert that avoids the client-side read-modify-write race condition:

```sql
-- Example: upsert_candidate_answer(candidate_id, question_id, answer_value)
-- Uses server-side jsonb_set with row-level lock to prevent concurrent overwrites
```

This is needed before the Supabase frontend adapter is written (v3+ milestone).

### TODO: Thundering Herd Cache Protection

Implement single-flight cache pattern in the SvelteKit server to prevent cache stampede after invalidation. Options:
- In-memory single-flight with `Map<string, Promise>` per SvelteKit process
- Redis/Upstash-based distributed lock for multi-process deployments
- Supabase Edge Function with KV store

Defer to Svelte 5 migration milestone — current frontend still uses Strapi adapter.

### TODO: Image Question Type ("Avatar" Question)

Replace the `image` JSONB column on entity tables (candidates, organizations, factions, alliances) with a dedicated "Avatar" question type:
- Add an `avatar` or `photo` question subtype that uses Supabase Storage
- Remove the `image` column from entity tables (or deprecate)
- Avatar becomes a regular question answer, inheriting all question infrastructure (categories, templates, validation)
- Benefits: unified data model, no special-case image handling, consistent with questionnaire-based data collection

### Archive

4. **Keep `schema/006-answers-jsonb.sql`** as the default answer storage schema
5. **Archive `schema/alternatives/answers-relational.sql`** — keep for reference, do not include in migration
6. **No RLS changes needed** — JSONB answers inherit candidates table policies
7. **Delete benchmark raw logs** from results/ (only JSON results committed)
