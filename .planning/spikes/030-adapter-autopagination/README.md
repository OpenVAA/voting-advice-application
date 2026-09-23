---
spike: 030
idea: grant-model-read-cost
name: adapter-autopagination
type: standard
validates: "Given PostgREST caps each response (max_rows), when the Supabase adapter pages through every multi-row read with limit/offset, then it returns every row exactly once, at a cost we know"
verdict: VALIDATED
related: [026]
tags: [postgrest, pagination, adapter, correctness, performance, phase-162.1]
---

# Spike 030: Can the Adapter Auto-Paginate?

## RESULT IN ONE PARAGRAPH

**Yes, and it is correct, with two conditions.** Paging every multi-row read through PostgREST's own
`limit`/`offset` (what supabase-js `.range()` sends) returned **every row exactly once** at every page size
tried. The conditions: **(1) every paged read must sort on a unique key.** The adapter's table reads sort
by `sort_order` alone, and paging that **silently swapped 768 of 36,056 candidates for duplicates**; adding
`id` as a tie-breaker fixes it. **(2) The page size must be large.** Each page re-runs the whole
policy-evaluated query, because the sort needs every row before it can return any. So 1,000-row pages turn
the whole-municipal read into **39 × 2.9 s = 115 s**. That is why this pairs with raising `max_rows` to 50,000
(item 1): at that size every Finnish election is one page (3.47 s), and the pager only works on a larger or
misconfigured deployment.

## Measurements (HTTP, real PostgREST, anon, municipal fixture from spike 026)

| Read | page 1,000 | page 10,000 | page 50,000 |
|---|---|---|---|
| Helsinki-sized constituency (1,510 nominations) | 2 pages, **0.31 s** | 1 page, 0.18 s | 1 page, **0.16 s** |
| whole municipal project (38,986) | 39 pages × 2.9 s = **114.9 s** | 4 × 2.95 s = **11.8 s** | 1 page, **3.47 s** |
| candidates table (36,056, `order=sort_order,id`) | 37 pages, **12.3 s** | 4 pages, 1.5 s | 1 page, **0.60 s** |
| rows returned = rows that exist, 0 duplicates | ✓ all | ✓ all | ✓ all |

The 3.47 s single page also **confirms item 2 over HTTP**: it is above the old 3 s anon timeout and now succeeds.

### Tie-breaker (`tiebreak.mjs`, pages of 1,000)

| order | fetched | unique | duplicates | missing |
|---|---|---|---|---|
| `sort_order` (the adapter today) | 36,056 | 35,288 | **768** | **768** |
| `sort_order,id` | 36,056 | 36,056 | 0 | 0 |

`get_nominations` already orders `sort_order NULLS LAST, id` and is safe. `get_questions` returns one
aggregated row and needs no paging.

### Instrument note

The first attempt timed pages in SQL (`LIMIT … OFFSET …` around the RPC). `OFFSET 0` blocks inlining of
`get_nominations` and flipped it to the pathological nested-loop plan (> 70 s even unpaged), the same trap
as spike 026 F3. It was abandoned. PostgREST's own paging does not hit that plan, as the HTTP numbers show.

## What the Adapter Change Would Be

| Read in `supabaseDataProvider.ts` | Today | Needs |
|---|---|---|
| `elections` | `.order('sort_order')` | pager + `id` tie-breaker |
| `constituency_groups`, `constituencies` | `.order('sort_order')` | pager + `id` tie-breaker |
| `get_nominations` RPC (per election × constituency fan-out) | one call each | pager (already uniquely ordered) |
| `candidates`, `organizations` (`getEntityData`) | `.order('sort_order')` | pager + `id` tie-breaker |
| `get_questions` RPC | one aggregated row | nothing |
| `app_settings` | `.single()` | nothing |

One helper, e.g. `fetchAllRows(build: (from, to) => query.range(from, to), pageSize)`: request pages, append,
stop at the last page. Unit-testable with a fake query builder; the existing E2E data is far below any page
size, so E2E exercises the one-page path only.

## ⚠ Decision Needed: How Does the Pager Know a Page Is the Last One?

PostgREST does not say when it truncated. A page shorter than requested is either **the end** or **the
server's cap**. If the adapter asks for 50,000 and a hosted project still has Supabase's default 1,000, the
first page returns 1,000 rows, looks final, and **the data is silently truncated again**. That is the
original bug in a new place.

| Option | Correct when | Cost |
|---|---|---|
| **(a) page size = one shared setting**, documented to equal the server's `max_rows` | the two are kept equal | none; a mismatch in the unsafe direction truncates silently |
| **(b) confirm every short page** with one more request | always | **doubles every large read** (the confirming request re-runs the full query: +3.4 s on whole-municipal) |
| **(c) (a) + a guard:** a short page whose length is a **multiple of 1,000** (what every Supabase cap looks like) triggers one confirming request and a console warning | the server cap is a multiple of 1,000 | nothing normally; one extra request in the rare suspicious case |

**Recommendation: (c).** The page size is a static setting (50,000 here, matching `config.toml`), and the
guard catches the realistic misconfiguration, a hosted project left at 1,000, without doubling every
read. The deployment todo (`2026-09-18-document-supabase-api-limits-for-deployments.md`) already says to set
both.

## How to Run

```bash
.planning/spikes/026-election-scale-entity-read/load.sh
eval "$(yarn workspace @openvaa/supabase exec supabase status -o env | grep -E '^(API_URL|ANON_KEY|JWT_SECRET)=')"
export API_URL ANON_KEY JWT_SECRET
node .planning/spikes/030-adapter-autopagination/http-pages.mjs 1000      # works at the default cap
node .planning/spikes/030-adapter-autopagination/http-pages.mjs 50000     # needs max_rows >= 50000 (config.toml) + stack restart
node .planning/spikes/030-adapter-autopagination/tiebreak.mjs
yarn db:reset
```
