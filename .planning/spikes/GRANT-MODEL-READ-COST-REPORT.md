# Grant-Model Read Cost: Consolidated Report (Phase 162.1, Item 1)

**Date:** 2026-09-18 · **Spikes:** 025, 026, 027, 028 · **Idea key:** `grant-model-read-cost`
**Tree:** `b10329d90` → `14ddcae02` (spike docs only; no schema or application change was committed)
**Database state after the spikes:** restored by `yarn db:reset`, verified on the shipped fingerprints.

---

## The Two Answers

| Residual | What Phase 162 measured | Verdict | One-line reason |
|---|---|---|---|
| **(a) authenticated entity read** | 4.47x | **FIX: reorder the five authenticated policies' disjuncts (variant B, operator decision)** | It matters only on whole-project reads (candidate 7.15 s against an 8 s hard timeout); variant B brings it to 4.65 s with zero row differences and leaves admins unchanged |
| **(b) anon storage-bucket read** | 6.4x | **ACCEPT** | No path the app uses ever evaluates it: public-bucket downloads bypass RLS entirely |

## And Three Things the Operator Should See First

These were found while measuring. **None is a Phase 162 regression. Two of them are bigger than either
residual.**

| # | Finding | Severity | Spike |
|---|---|---|---|
| **F1** | **The voter app silently drops data above 1,000 rows.** PostgREST's `max_rows = 1000` (also Supabase Cloud's default) caps every response, and `supabaseDataProvider` does not paginate. A Helsinki-sized constituency returns **1,000 of 1,510** nominations with HTTP 200. The default-on "All nominations" page shows **1,000 of 2,552** even for a parliamentary election. | **High, wrong results** | 026 |
| **F2** | **The anonymous "All nominations" page is at its timeout at municipal scale.** 3.21 s of database work against anon's 3 s `statement_timeout`; one observed HTTP 500. The cost is the anon nominations policy, unchanged since before Phase 162. | **High** at municipal scale | 026 |
| **F4** | **Storage cleanup has never worked.** `delete_storage_object` POSTs to a DELETE-only route (pg_net logs `404 Route POST:/object/public-assets not found`), and entity cleanup passes folder prefixes that Storage does not expand. Every replaced or deleted photo is still stored **and still public**. Verified fix: single-object `DELETE /object/{bucket}/{path}` via `net.http_delete`. | **High, privacy** | 029 |
| **F3** | **The `public-assets` visibility rule does not protect downloads.** Any object in the bucket is served to anyone with its URL, including unconfirmed candidates' photos and closed projects' assets. `storage_path_is_public` only governs *listing*. Making the bucket private would enforce it, **and would make residual (b) hot**. | **Product/privacy decision** | 027 |

---

## Who Pays the Authenticated Cost (Spike 025)

The voter app builds its Supabase client **from the session cookies** (`routes/+layout.ts` →
`createSupabaseUniversalClient`). Observed on the wire: with no cookies, requests carry `role: anon`; with a
signed-in user's cookies, `role: authenticated`.

→ **Every signed-in person who opens the voter app reads through the authenticated policies.** In practice
that means candidates previewing their public profile and admins checking the published app. Anonymous voters,
nearly all traffic, stay on the anon path, which Phase 162 closed at 0.99x.

## What It Costs at Real Scale (Spike 026)

Fixture shaped on Statistics Finland counts: **municipal 36,056 candidates** (2021: 35,627; 2025: 29,950),
293 constituencies, largest **1,500**; **parliamentary 2,422** (2023: 2,424), largest **430**; plus a
10,000-candidate other tenant. Measured twice: over **HTTP through the real PostgREST** (as deployed) and in
**SQL on PostgREST's own query shape** (full, uncapped result).

**Median ms, full result:**

| Query | anon | no-grant | **candidate** | admin |
|---|---|---|---|---|
| Voter's main read, Helsinki-sized (1,510 rows) | 115 | 164 | **255** | 51 |
| Voter's main read, Uusimaa-sized (440 rows) | 33 | 45 | **85** | 77 |
| "All nominations", municipal (38,986 rows) | **3,207** ⚠ | 4,293 | **6,960** ⚠ | 1,213 |
| Candidates table, municipal (36,056 rows) | 423 | 1,047 | **2,499** | 567 |

**Hard limits:** anon 3 s, authenticated 8 s (`statement_timeout`); 1,000 rows per response (`max_rows`).
**Voter main read at 10 concurrent clients, p95:** anon 251 ms, candidate 363 ms.

- On the **voter's main read** the candidate pays about **+140 ms**. It **does not matter**.
- On **"All nominations"** the candidate is at **87% of the hard limit**. It **matters**, on that page, for
  signed-in readers, at municipal scale.
- **Scoping holds:** every plan index-scans `project_id`, so other tenants' rows cost nothing.

## The Fix for (a) (Spike 028)

The authenticated policies evaluate three `SECURITY DEFINER` `user_can` calls **before** the public
check, on every row, including rows that are public anyway. Reordering the `OR` changes no answer and
skips those calls for public rows.

| Proof | Result |
|---|---|
| Visible rows, 5 readers × 5 tables, `EXCEPT ALL` both directions | **0 / 0** |
| Truth grid: 106 ids × 4 tables × 5 readers = **2,120 probes** (110 true, 2,010 false), both directions | **0 / 0** |
| Grid covers: open and closed project, confirmed/unconfirmed, nominated/not/other-project, terms of use, child-nominee reach (window 267) | yes |
| pgTAP estate with the fix applied | **PASS, 1,086 / 1,086** |
| 162-17's guard perturbations G8A and G8B on top of the fix | **both RED, on exactly the recorded assertions** |

| "All nominations", municipal | shipped | A: public first | **B: project → public → entity (CHOSEN)** |
|---|---|---|---|
| candidate | 7.15 s | **3.32 s** | 4.65 s |
| no-grant | 4.32 s | **3.27 s** | 3.81 s |
| admin | 1.30 s | 3.34 s | **1.30 s** |
| **worst reader** | 7.15 s | **3.34 s** | 4.65 s |

Both are proved correct. A minimises the worst case; B keeps admins unchanged.

**Operator decision 2026-09-18: variant B (project authority → public → entity).** The "All nominations" route is not important, and even less so for signed-in candidates; admins may more often need whole-project data, so their early exit on `user_can(project)` is kept. Candidate whole-municipal read 7.15 s → 4.65 s (42% headroom to the 8 s timeout); admin unchanged at 1.30 s.

## The Storage Residual (b) (Spike 027)

With the anon SELECT policy forced to `USING (false)`:

| Endpoint (anon) | shipped | policy = false |
|---|---|---|
| `GET /object/public/…`, **what the voter app uses** | 200 | **200** |
| `GET /object/authenticated/…` | 200 | **200** |
| `POST /object/list` | 1 object | **0 objects** |
| control: private bucket | 400 | 400 |

Caching was ruled out with never-seen objects, including paths the shipped policy denies. **The 6.4x policy
runs only on anon `list`, which no code calls.** Image loads cost 3.0 ms median either way. → **Accept.**

---

## What Phase 162.1 Planning Should Take From This

1. **Item 1(a):** one plan that reorders five quals in `302-rls.sql` to **variant B** (operator decision 2026-09-18).
   Gates: `schema:regenerate` → `db:types` → `test:db`, Spike 028's `run.sh` as the row-identity proof,
   Spike 026's cells as the timing evidence. Plus a timing monitor, so a future policy edit that puts
   `user_can` back in front shows up as a number.
2. **Item 1(b):** record **accept**, with Spike 027's evidence. Couple it explicitly to F3: if the bucket
   ever goes private, (b) becomes hot and must be re-measured.
3. **Decide where F1 and F2 go.** They are not grant-model regressions, but F1 gives voters wrong answers
   today in any constituency over ~990 nominations, and F2 fails the default "All nominations" page for
   anonymous voters at municipal scale. Both are closer to Item 2 (what a voter sees) than to Item 1.
4. **Decide F3** (public bucket semantics). It is a product/privacy question, not a performance one.

## Follow-up, same day (operator decisions on F1–F3)

| Finding | Decision | Status |
|---|---|---|
| F1 row cap | raise `max_rows` to 50,000 locally; todo for hosted projects; investigate auto-pagination | **done**: `config.toml`; todo `2026-09-18-document-supabase-api-limits-for-deployments.md`; spike 030 = feasible, needs `id` tie-breakers and a last-page guard (decision pending: option (c) recommended) |
| F2 anon timeout | raise to 8 s, same caveat | **done**: `schema/001-role-settings.sql`, migration regenerated; verified over HTTP (a 3.47 s anon read now succeeds) |
| F3 public bucket | spike solutions, random UUID names as a candidate | **spike 029**: random names are already the status quo and protect never-public files; recommended C1+ = fix F4 + cleanup for answer photos + accept once-public URLs |

Gates after the F1/F2 change: E2E **155 passed / 0 skipped / 0 unexpected / 0 flaky** (`tests/e2e-runs/api-limits-01`, preflight 1/0); pgTAP **1,086 PASS**; `lint:check`, `format:check`, `db:lint:sql` exit 0 (3 pre-existing FK-index warnings).

## Mistakes Made During the Spikes, Recorded So They Are Not Repeated

- **Decimal-comma misread.** psql printed `12,481 ms` (12.5 ms, Finnish locale), which was read as
  12 seconds and briefly produced a wrong "helpers cost milliseconds" claim. Corrected the same hour;
  scripts now force `LC_NUMERIC=C`.
- **Instrument artefact.** A `SELECT count(*) FROM (get_nominations(...))` wrapper produces a nested-loop
  plan that ran for more than 80 s. The app never issues that shape. All measurements use PostgREST's
  `json_agg` form.
- **Host load.** An unrelated process pushed the load average to 24–33 during one run (candidate read
  15.4 s). That run was discarded for the affected cells and re-run gated on load < 8 (6.96 s).

## Where Everything Is

| Spike | README | Key scripts |
|---|---|---|
| 025 | `025-who-reads-as-authenticated/README.md` | `probe.mjs` |
| 026 | `026-election-scale-entity-read/README.md` | `fixture.sql`, `bench.sh`, `load.sh`, `http-bench.mjs` |
| 027 | `027-storage-public-endpoint-bypass/README.md` | `probe.mjs`, `probe-fresh.mjs` |
| 028 | `028-disjunct-order-fix/README.md` | `grid.sql`, `run.sh`, `apply-reorder.sql`, `estate.sh`, `perturb.sh` |

Raw outputs (`*-output.txt`, `*.log`) sit beside each script.
