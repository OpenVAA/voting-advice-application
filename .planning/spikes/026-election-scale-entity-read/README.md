---
spike: 026
idea: grant-model-read-cost
name: election-scale-entity-read
type: standard
validates: "Given realistic Finnish election scale, when the voter app's real queries run over HTTP and in SQL as anon, a no-grant user, a candidate and an admin, then we know each reader's latency against the budgets the stack enforces"
verdict: VALIDATED
related: [025, 027, 028]
tags: [rls, grant-model, performance, postgrest, scale, phase-162.1]
---

# Spike 026: What the Grant Model Costs at Real Election Scale

## RESULT IN FIVE LINES

1. **The voter's main read (one constituency) is fine for every reader.** Helsinki-sized, 1,510 nominations:
   anon 115 ms, signed-in no-grant 164 ms, **candidate 255 ms**, admin 51 ms. The 4.47x residual costs a
   candidate about **+140 ms** here, well inside any reasonable budget.
2. **The whole-project read is where the authenticated cost bites.** This is the "All nominations" page, **on by
   default**, at municipal scale (39k nominations). A candidate takes **6.96 s** against authenticated's
   **8 s** statement timeout, 13% headroom. Today the 1,000-row cap hides this; if the cap goes, the page
   breaks for candidates under any extra load.
3. **⚠ Bigger than the residual: the voter app silently loses data.** PostgREST caps every response at
   **1,000 rows** and the data provider does not paginate. A Helsinki-sized constituency returns **1,000 of
   1,510** nominations with HTTP 200 and no error. Same for any whole-project read, **including a
   parliamentary election** (1,000 of 2,552). This predates Phase 162.
4. **⚠ Also bigger: the anon whole-project read breaks the anon timeout.** Uncapped it takes **3.21 s against anon's
   3 s** `statement_timeout`. Capped, today, it takes 2.9 s and **one observed request failed with HTTP 500
   `57014`**. Anon policies are byte-identical to pre-Phase-162, so this predates the phase too.
5. **Scoping works:** every plan pushes `project_id` into an index scan, so other tenants' rows (a 10,000-candidate
   noise project) cost nothing. Cost scales with **one project's** rows, not the table.

## What Was Measured

### Scale, from real elections (Statistics Finland)

| Fixture project | Modelled on | Candidates | Constituencies | Largest constituency | Nominations |
|---|---|---|---|---|---|
| **M** municipal | 2021 municipal (35,627 cands; 2025 had 29,950) | **36,056** | 293 | **1,500** (Helsinki-sized) | 38,986 |
| **R** parliamentary | 2023 parliamentary (2,424 cands) | **2,422** | 13 | **430** (Uusimaa-sized) | 2,552 |
| **N** noise tenant | another project in the same tables | 10,000 | 1 | n/a | 10,010 |

10 parties per project; every constituency has one confirmed party nomination per party, and every candidate
nomination hangs under its party's nomination, as real data does. All candidates confirmed with accepted terms
of use. Built by `fixture.sql` with bulk `INSERT … SELECT` (validation triggers skipped for load speed only).

### Readers (JWTs shaped exactly like the access-token hook's `grants` claim)

| Reader | Who that is in real life | Claim |
|---|---|---|
| `anon` | a voter | `role: anon` |
| `auth_nogrant` | signed-in user with no grant | `grants: []` |
| `candidate` | a candidate previewing the voter app (Spike 025) | one `entity/editor/candidate` grant |
| `admin` | project admin | one `project/admin` grant |

### Queries (the voter app's real calls)

| | Call | Where the app makes it |
|---|---|---|
| Q1 | `get_nominations(project, election, largest municipal constituency)` | the voter's main read, `(located)` pages |
| Q2 | `get_nominations(project)`, whole municipal project | "All nominations" page (`showAllNominations`, **default true**), admin `loadElectionData` |
| Q3 | `candidates?project_id=eq.…&order=sort_order` | `getEntityData` |
| Q4 | `get_nominations`, largest parliamentary constituency | voter's main read, parliamentary |
| Q5 | `get_nominations`, whole parliamentary project | "All nominations", parliamentary |

### Two instruments, deliberately

- **HTTP** (`http-bench.mjs`): real requests through the real PostgREST, **as deployed**, meaning with its
  1,000-row cap and the role `statement_timeout`s. 1 warm-up + 10 runs per cell, plus a 10-client concurrency test.
- **SQL** (`bench.sh`): `EXPLAIN ANALYZE` of **PostgREST's own query shape** (`json_agg` over a subquery), the
  **full uncapped result**, inside one rolled-back transaction. This is the cost once the cap is dealt with.
  Whole-project cells were re-run gated on 1-min load < 8 (`sql-bench-quiet-output.txt`) after the first run
  was contaminated by an unrelated process on the host (load average 24–33).

Fingerprints in every run: entity+nomination SELECT quals `b3fa76a6…`; `nomination_entities_confirmed=86860ed8`
and `project_open_for_voters=94280a7e` (both equal to D-36's recorded values); `user_can=bf8fb016`,
`entity_has_confirmed_nomination=03a6f09d`, `is_child_nominee=d32702f4`, `get_nominations=30341431`.

## The Numbers

### SQL, full uncapped result, median ms (the real database cost)

| Query | rows | anon | no-grant | **candidate** | admin | candidate ÷ anon |
|---|---|---|---|---|---|---|
| Q1 voter, Helsinki-sized | 1,510 | 115 | 164 | **255** | 51 | 2.2x |
| Q2 whole municipal ✱ | 38,986 | **3,207** | 4,293 | **6,960** | 1,213 | 2.2x |
| Q3 candidates table, municipal ✱ | 36,056 | 423 | 1,047 | **2,499** | 567 | 5.9x |
| Q4 voter, Uusimaa-sized | 440 | 33 | 45 | **85** | 77 | 2.6x |
| Q5 whole parliamentary | 2,552 | 188 | 268 | **497** | 389 | 2.6x |

✱ from the load-gated re-run (5 runs, min–max spread under 3%). The other rows come from the first run
(3 runs; load 5.5 at its start, rising to 24 by its end, so its later cells may read high). They agree
with the HTTP medians below within 10–25 ms, which is the cross-check that they are not load artefacts.

### HTTP, as deployed today (capped at 1,000 rows), median / p95 ms

| Query | rows returned / exist | anon | no-grant | **candidate** | admin |
|---|---|---|---|---|---|
| Q1 voter, Helsinki-sized | **1,000 / 1,510** | 133 / 138 | 183 / 207 | **282 / 297** | 63 / 66 |
| Q2 whole municipal | **1,000 / 38,986** | 2,901 / 2,945 ⚠ | 4,250 / 5,067 | **6,701 / 6,996** | 1,095 / 1,119 |
| Q3 candidates table | **1,000 / 36,056** | 334 / 370 | 984 / 1,039 | **2,275 / 2,325** | 507 / 557 |
| Q4 voter, Uusimaa-sized | 440 / 440 | 41 / 43 | 53 / 56 | **84 / 104** | 80 / 88 |
| Q5 whole parliamentary | **1,000 / 2,552** | 196 / 207 | 282 / 302 | **428 / 489** | 423 / 468 |

⚠ The first full HTTP run **failed this cell with HTTP 500 `57014` (statement timeout)**. The second run
passed at 2.9 s, just under anon's 3 s limit.

**Note that the cap does not make whole-project reads cheap.** The query still evaluates every row's policy
to sort and filter before PostgREST applies the limit, so capped Q2 costs almost as much as uncapped Q2.

### Concurrency: 10 simultaneous clients × 5 × Q1 (HTTP)

| Reader | median | **p95** | max |
|---|---|---|---|
| anon | 158 | **251** | 255 |
| no-grant | 214 | **261** | 276 |
| candidate | 326 | **363** | 385 |
| admin | 72 | **109** | 121 |

### Budgets these numbers are judged against

| Budget | Value | Source |
|---|---|---|
| anon `statement_timeout` | **3 s**, hard failure (HTTP 500) | `pg_roles.rolconfig` |
| authenticated `statement_timeout` | **8 s**, hard failure | `pg_roles.rolconfig` |
| PostgREST `max_rows` | **1,000**, silent truncation | `config.toml:21`, also Supabase Cloud's default |
| voter main read, p95 | < 1 s, soft (a page that feels immediate) | judgement; not configured anywhere |

## Where the Candidate's Extra Time Goes (per row, measured)

| Policy | anon | candidate | why |
|---|---|---|---|
| nominations | ~67 µs | ~136 µs | the public disjunct **plus** `user_can(project…)` + `user_can(entity…, nomination.read)` |
| candidates | ~11 µs | ~76 µs | three `user_can` calls (≈15 + 13 + 25 µs; the `nomination.read` one reaches `is_child_nominee`) |

These come from `EXPLAIN ANALYZE` of the candidate's Q2 (`diag-candidate-q2.txt`) and 5,000-call
micro-timings of each disjunct (`decompose-candidate.txt`). **The three `user_can` disjuncts are evaluated
before the public disjunct on every row**, including rows that are publicly visible anyway. That is exactly
what Spike 028 tests.

## Verdict for Residual (a): authenticated entity-read, 4.47x

- **Voter's main read:** candidate +140 ms (Q1). **Does not matter.**
- **Whole-project read (All nominations, admin tooling):** candidate at 87% of the 8 s hard limit
  uncapped. **Matters**, but only on that page, for signed-in readers, at municipal scale.
- **→ FIX if a fix is cheap and provably row-identical (Spike 028); otherwise ACCEPT WITH A MONITOR**:
  a pgTAP or CI timing assertion on the candidate-reader whole-project read at municipal scale, with a
  threshold well under 8 s.

## ⚠ Findings That Are Not Residual (a) and Outrank It

| # | Finding | Severity | Pre-dates 162? |
|---|---|---|---|
| F1 | **1,000-row cap silently truncates voter data.** No pagination in `supabaseDataProvider`. Any constituency over ~990 nominations, and every whole-project read over 1,000, loses rows with HTTP 200. Helsinki-sized: 510 candidates missing. Parliamentary "All nominations": 1,552 missing. | **High**, correctness | yes |
| F2 | **anon whole-project read ≈ anon timeout.** 3.21 s uncapped against 3 s, 2.9 s capped, one observed HTTP 500. Cost is the anon nominations policy (`nomination_entities_confirmed`, ~67 µs/row). | **High** at municipal scale | yes (anon policies byte-identical to pre-162) |
| F3 | Instrument trap: a bare `SELECT count(*) FROM (get_nominations(…))` flips the planner to a nested loop that re-scans organizations per row (> 80 s, cancelled). The app never issues it: no `count: 'exact'` anywhere in `apps/frontend/src`. Recorded so nobody benchmarks with it. | note | n/a |

F1 and F2 belong to Item 2's neighbourhood (what a voter actually sees), not to the grant model. The operator
should decide whether Phase 162.1 absorbs them or they get their own phase. **F1 is the only finding in this
spike that produces a wrong answer rather than a slow one.**

## How to Run

```bash
# SQL half (self-contained; one rolled-back transaction):
.planning/spikes/026-election-scale-entity-read/bench.sh 5
QUERIES_OVERRIDE="Q2 Q3" .planning/spikes/026-election-scale-entity-read/bench.sh 5

# HTTP half (commits the fixture so PostgREST can see it; undo with yarn db:reset):
.planning/spikes/026-election-scale-entity-read/load.sh
eval "$(yarn workspace @openvaa/supabase exec supabase status -o env | grep -E '^(API_URL|ANON_KEY|JWT_SECRET)=')"
export API_URL ANON_KEY JWT_SECRET
node .planning/spikes/026-election-scale-entity-read/http-bench.mjs 10 10
yarn db:reset
```

## Investigation Trail

1. **First run hung for more than 80 s** on anon Q2. The hypothesis "a quadratic helper" led to per-helper
   timings. Then a **misread**: psql prints times with a Finnish decimal comma, and "12,481 ms" (12.5 ms)
   was read as 12 s. That produced a wrong claim that the helpers cost milliseconds per call. **Corrected**:
   they cost ~6 µs per call. The benchmark now forces `LC_NUMERIC=C`.
2. The real cause of the hang was the **instrument**: the `count(*)` wrapper chose a nested-loop plan (F3).
   Switched every measurement to PostgREST's own `json_agg` shape.
3. PostgREST passes RPC arguments as a JSON parameter, which can change plans, so SQL alone was not
   trusted. Added the HTTP half with minted JWTs, and verified the tokens are honoured (not silently
   anon): the grant-holding readers see a `projects` row that anon and no-grant do not.
4. The HTTP run returned **exactly 1,000 rows** for a 1,510-row constituency, which led to F1.
5. anon Q2 **timed out** over HTTP, which led to F2 and the role timeouts as hard budgets.
6. The first SQL run was contaminated by an unrelated process (load 24–33; candidate Q2 read 15.4 s).
   **Re-ran gated on load < 8**: candidate Q2 is 6.96 s. The loaded figure is discarded, not averaged in.
7. Per-row decomposition showed the `user_can` disjuncts run **before** the public one, which is the lever
   Spike 028 tests.

## Sources

- [Statistics Finland: 29,950 candidates in the 2025 municipal elections](https://stat.fi/en/publication/cm1hlbrft09e207w7pv561t1l)
- [Statistics Finland: 2,424 candidates in the 2023 parliamentary elections](https://stat.fi/en/publication/cl8mtc631zy620dutmo93xkoc)
