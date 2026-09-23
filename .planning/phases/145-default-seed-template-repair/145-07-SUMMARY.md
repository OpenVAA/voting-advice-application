---
phase: 145-default-seed-template-repair
plan: "07"
subsystem: testing
tags: [dev-seed, external-id, teardown, upsert-key, negative-control, ledger, playwright, postgrest]

# Dependency graph
requires:
  - phase: 145-default-seed-template-repair
    provides: "145-06 — the `external_id` idiom rename (`3bf417c83`) whose one durability risk this plan measures, and the pre-rename parent commit `ef1834410` it named as the transient-checkout source"
  - phase: 145-default-seed-template-repair
    provides: "145-05 — the per-injection restore-target rule, met here for the third consecutive plan"
  - phase: 145-default-seed-template-repair
    provides: "145-03 — the unchanged `defaultTemplateResults.probe.spec.ts` re-run here as the app-level regression check on the rename"
  - phase: 145-default-seed-template-repair
    provides: "145-01 — the 30-row ledger with `S1`…`S4` pre-written, and the HYGIENE-LOOP"
provides:
  - "D-05's durability concern discharged by measurement rather than argument: the strand was produced deliberately, counted per idiom, and shown fully reachable by the prefix-keyed teardown"
  - "Ledger rows `S1`…`S4` filled from four PostgREST queries against the live database — 8/5 old, 16/10 split 8+8 and 5+5, 0/0, 8/5 all new"
  - "A `## Strand proof` section: the four-step procedure as run, the `ef1834410` blob source, a per-step count table, and what step 3 discharges"
  - "A `## Strand proof — conclusion` paragraph naming the `seed_` prefix's invariance as the mechanism that makes teardown's reach independent of the identifier idiom"
  - "A third criterion-1 observation at `1c7bdfa6d` — the unchanged probe, exit 0, `[\"Candidates\",\"Parties\",\"Alliances\"]`, 48 candidate cards, 8 party cards — matching the after half on every measured value"
  - "Register placeholder count 55 → 35; a clean tree and a freshly `db:reset-with-data` database handed to `145-08`"
affects: [145-08]

actuals:
  tokens: 7852
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Strand proof: prove a rename of a durable upsert key cannot orphan rows by PRODUCING the orphan deliberately (seed old idiom → seed new idiom with NO intervening reset), counting per idiom so survival is visible rather than implied by a total, then measuring teardown against it"
    - "Decomposing `db:reset-with-data` into `db:reset` + transient checkout + `db:seed:default` so an injected blob can land BETWEEN the reset and the seed"
    - "Per-idiom count classifier with a third `other` bucket, so an unclassified row is counted rather than silently absorbed into either half"

key-files:
  created: []
  modified:
    - .planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "Columns 1–4 of rows `S1`…`S3` were left byte-untouched even where the pre-written command cell reads `db:reset-with-data` and the run decomposed it into `db:reset` + `db:seed:default`; the divergence (and its single reason — the injection must land between the two) is recorded in the measurement cells and in § Strand proof rather than by rewriting a creation-time cell"
  - "The post-rename probe re-run is recorded as a NOTE beneath § Criterion 1, not as a new register row: it re-measures an already-closed pair at a later HEAD, and the corpus is asserted at exactly 30 rows"
  - "The teardown's 814-row total is recorded with its limit — 13 of the 63 excess rows are measured directly by `S2`, the other 50 were not measured per-table, and the arithmetic is labelled consistent-with rather than counted"
  - "The one screenshot difference (`app-rename-parties.png` vs `app-after-parties.png`, same dimensions, different bytes) is recorded as an undiagnosed observation rather than smoothed over, since the party-card assertion — the actual measurement — reads 8 in both runs"

patterns-established:
  - "A projection stated in advance is reported as agreeing with the run, never as the reason to believe it — the ledger records the query output and would have recorded a divergence"
  - "Restore targets are re-derived at the injection's own HEAD by `git hash-object` and written into the injecting row BEFORE the file is touched; the creation-time table is not trusted once a behaviour-changing commit has touched the path"

requirements-completed: [TMPL-04]

coverage:
  - id: D1
    description: "The `external_id` rename is proven not to strand rows: after `yarn db:seed:teardown` over a database carrying BOTH idioms, zero rows of either idiom remain in `organizations` and `constituencies`"
    requirement: TMPL-04
    verification:
      - kind: integration
        ref: "PostgREST count query at row S3 — ${TMPDIR}/gsd-145/count-S3-1.json (organizations 0/0/0, constituencies 0/0/0), against ${TMPDIR}/gsd-145/teardown-S3-1.log (exit 0, 814 rows deleted, prefix seed_)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The strand is real and was made visible: seeding the renamed template over the old idiom with no intervening reset doubles both counts, per-idiom split 8+8 and 5+5"
    requirement: TMPL-04
    verification:
      - kind: integration
        ref: "PostgREST count queries at rows S1 and S2 — ${TMPDIR}/gsd-145/count-S1-1.json (8/0/8, 5/0/5) and count-S2-1.json (8/8/16, 5/5/10)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The developer-facing end state after `yarn db:reset-with-data`: declared sizes (8 organizations, 5 constituencies), all new idiom, zero old-idiom residue"
    requirement: TMPL-04
    verification:
      - kind: integration
        ref: "PostgREST count query at row S4 — ${TMPDIR}/gsd-145/count-S4-1.json (organizations 0 old / 8 new / 8 total; constituencies 0 old / 5 new / 5 total)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The renamed dataset still renders in the running app — the rename did not break the nomination tree the entity tabs derive from"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts#parties list is non-empty @probe + #entity tabs include candidates @probe — GSD_145_HALF=rename, ${TMPDIR}/gsd-145/pw-A-rename-1.log, exit 0, 2 passed"
        status: pass
      - kind: automated_ui
        ref: "playwright:${TMPDIR}/gsd-145/app-rename-tabs.png (925,576 B, byte-identical to app-after-tabs.png) + app-rename-parties.png (374,280 B)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The injection was hygienic: `145-04`'s fix survived it, both transiently-checked-out files are back at their restore targets by blob hash, and no product byte changed in this plan"
    verification:
      - kind: other
        ref: "git hash-object of default.ts = 054e32824a75d4afa4a7c98cdb0a20e929c2eb9c and alliances-override.ts = 041912ae8c98ac60f0ae4dd659b002c7f8531524; retired-family occurrence count under packages/dev-seed = 0; acceptance-timestamp literal present in candidates-override.ts; git status --porcelain -- packages apps tests .github empty; git diff --name-only over both plan commits touches .planning only"
        status: pass
    human_judgment: false

# Metrics
duration: 15min
completed: 2026-08-24
status: complete
---

# Phase 145 Plan 07: Strand Proof and the Post-Rename App Check Summary

**The `external_id` rename's one durability risk is now a measured fact: the strand was produced on purpose (16 organizations / 10 constituencies, split 8+8 and 5+5), then shown to be fully cleared by the prefix-keyed teardown — 0 rows of either idiom — with the renamed dataset still rendering a Candidates tab and 48 candidate cards in the running app.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-24T15:52:00Z
- **Completed:** 2026-08-24T16:06:40Z
- **Tasks:** 2
- **Files modified:** 1 (`145-NEGATIVE-CONTROL-LEDGER.md`) — plus 11 artifacts written outside the repository

## Accomplishments

- **D-05's durability concern discharged by measurement.** D-05 rated the rename *costly* because `external_id` is a durable upsert key and stranding was plausible but unproven. Four counts and a teardown settle it: after `yarn db:seed:teardown` over a database carrying **both** idioms, **zero** old-idiom and **zero** new-idiom rows remain in both `organizations` and `constituencies`.
- **The strand was produced deliberately and counted per idiom.** Seeding the renamed template over the old idiom with no intervening reset yielded 16 organizations (8 old + 8 new) and 10 constituencies (5 old + 5 new). The split is what shows the old rows *survived* rather than were matched and replaced — "16 rows" alone would not.
- **The mechanism named from source, not assumed.** `runTeardown` builds `collections[table] = { prefix }` over `ALLOWED_TEARDOWN_TABLES` (ten tables) with default prefix `seed_`, applied by the `bulk_delete` RPC as `LIKE prefix%` on `external_id`. The rename changed only base names *beneath* that prefix, so teardown's reach is independent of the identifier idiom.
- **The end state a developer actually gets, measured.** After `yarn db:reset-with-data`: 8 organizations and 5 constituencies — equal to `S1`'s totals — **all** new idiom, old-idiom count zero, unclassified zero.
- **The app-level regression check passed against the renamed seed.** The unchanged `145-03` probe (`git hash-object` `30d2b00c9d…`, byte-identical to the after half's blob) returned exit 0, `["Candidates","Parties","Alliances"]`, 48 candidate cards, 8 party cards. `app-rename-tabs.png` is byte-identical (`sha256 5c3acae6…`) to `app-after-tabs.png`.
- **The injection was hygienic.** Exactly two files were transiently checked out from `ef1834410`; `candidates-override.ts` was never touched and its acceptance-timestamp literal was confirmed present before and after; both files hash back to targets recorded *before* the injection; no product byte changed in either commit.

## Task Commits

1. **Task 1: Strand proof steps 1–3** — `1c7bdfa6d` (docs)
2. **Task 2: Step 4 and the app-level regression check** — `5d7bb0346` (docs)

## Files Created/Modified

- `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` — rows `S1`…`S4` filled; new `## Strand proof` and `## Strand proof — conclusion` sections; a third observation appended beneath `## Criterion 1 — before and after`.

Artifacts written outside the repository, under the resolved `${TMPDIR}/gsd-145/`: `reset-S1-1.log`, `seed-S1-old-1.log`, `seed-S2-new-1.log`, `teardown-S3-1.log`, `seed-S4-reset-1.log`, `count-S1-1.json` … `count-S4-1.json`, `pw-A-rename-1.log`, `app-rename-parties.png`, `app-rename-tabs.png`, plus the reusable `count-idioms.mjs` counter.

## The four measurements

| Step | Row | Database action | `organizations` — old / new / total | `constituencies` — old / new / total |
| --- | --- | --- | --- | --- |
| 1 | `S1` | reset, then seed the **old** idiom | **8** / 0 / **8** | **5** / 0 / **5** |
| 2 | `S2` | seed the **renamed** idiom, ⚠ **no reset** | **8** / **8** / **16** | **5** / **5** / **10** |
| 3 | `S3` | `yarn db:seed:teardown` | **0** / **0** / **0** | **0** / **0** / **0** |
| 4 | `S4` | `yarn db:reset-with-data` | **0** / **8** / **8** | **0** / **5** / **5** |

Every count came from a PostgREST query issued against the live database at that step (`GET /rest/v1/{organizations,constituencies}?select=external_id&external_id=like.seed_*`, service_role), saved raw as JSON. Every observed number equals the projection `145-07-PLAN.md` § polarity stated in advance — reported as an outcome of the run, not as the reason to believe it.

## Decisions Made

- **Creation-time cells left byte-untouched.** Rows `S1`…`S3`'s pre-written command cell reads `db:reset-with-data`; the run decomposed it into `db:reset` + transient checkout + `db:seed:default`, because the old-idiom blobs must land *between* the reset and the seed. `db:reset-with-data` is literally `db:reset && db:seed:default`, so the database effect is identical. The divergence is recorded in the measurement cells and in § Strand proof rather than by rewriting a creation-time cell.
- **The probe re-run is a note, not a row.** It re-measures an already-closed pair (`A1-GREEN` / `A2-POST`) at a later HEAD rather than opening a new one, and the register's corpus is asserted at exactly 30 rows.
- **The 814-row teardown total is recorded with its limit.** 63 rows in excess of the 751 a single seed places in teardown's ten tables; 13 of them (8 organizations + 5 constituencies) are measured directly by `S2`, the other 50 were **not** measured per-table. The arithmetic is labelled consistent-with, not counted.
- **One undiagnosed pixel difference is stated, not smoothed.** `app-rename-parties.png` differs byte-wise from `app-after-parties.png` at identical 1280 × 3466 dimensions. The party-card assertion — the actual measurement — reads 8 in both runs, so the difference is recorded as an unexplained observation rather than dismissed or investigated.

## Deviations from Plan

None — plan executed exactly as written. No auto-fix rule fired; no product byte changed; no `<precondition>` was unmet.

Two clarifications, neither a deviation:

- The plan's step 1 says "reset with `yarn db:reset`" while row `S1`'s creation-time command cell says `yarn db:reset-with-data`. These are the same sequence (`db:reset-with-data` = `db:reset && db:seed:default`); the plan's decomposition is what allows the injection to land between them, and the ledger says so explicitly.
- `reset-S1-1.log` is an artifact the plan did not name. It was kept because step 1's exit code is part of `S1`'s Exit cell and a reset that failed would void the row.

## Issues Encountered

None. The known kong/storage 502 race did not fire on any of the three resets in this plan; all completed with `Finished supabase db reset on branch main`.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern or schema change. This plan wrote no source byte.

## Environment left behind (for `145-08`)

Stated explicitly, since `145-08` runs the milestone's seven standing gates immediately after this plan:

- **Git:** branch `feat-gsd-roadmap`, HEAD `5d7bb0346`, `git status --porcelain -- packages apps tests .github` prints nothing. The only untracked path repo-wide is `.planning/milestone.lock`, which predates this plan.
- **Database:** freshly rebuilt by `yarn db:reset-with-data` (`seed-S4-reset-1.log`, exit 0, 752 rows across 14 tables, 327 portraits) and **then read-only** — the probe run does not write. It holds the `default` template at the **renamed** idiom, verified by `count-S4-1.json`. ⚠ It is **not** the `e2e/base` dataset the cardinal gate suite needs; `145-08` must reset/seed for the gate as planned.
- **Dev server:** the wave-3 Vite dev server is still running on `http://localhost:5173`, single listener on `[::1]:5173`, HTTP 200, preflight-verified against this checkout during the probe run.
- **Supabase:** local stack running and healthy at `http://127.0.0.1:54321`.
- **Ledger:** register placeholder count is **35** — exactly the seven standing gate rows `G1`…`G7` at five cells each, which are `145-08`'s to fill.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **TMPL-04 is fully discharged**: the rename landed in `145-06` and its one durability risk is measured here. Nothing about the idiom is left as an expectation.
- `145-08` inherits a clean tree, a green app-level probe, and the last 35 placeholders in the register.
- **No blockers.**

## Self-Check: PASSED

- `145-07-SUMMARY.md` written to `.planning/phases/145-default-seed-template-repair/`.
- Commits `1c7bdfa6d` and `5d7bb0346` exist on `feat-gsd-roadmap`.
- Both task `<verify><automated>` blocks re-run and returned PASS.
- Both transiently-checked-out files verified back at their restore targets by blob hash (`054e3282…` / `041912ae…`).

---

_Phase: 145-default-seed-template-repair_
_Completed: 2026-08-24_
