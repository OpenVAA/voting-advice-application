---
phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
plan: 03
subsystem: testing
tags: [playwright, e2e, triage, stale-closure, cold-deeplink, dataroot-version-bridge, party-drawer, supabase-storage]

# Dependency graph
requires:
  - phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
    plan: 01
    provides: proven todo-triage loop (evidence 3x -> parity -> stamp -> git mv -> ledger)
  - phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
    plan: 02
    provides: corrected cold-start recipe (dev-server-up gate + bare db:reset + bucket-ready gate)
  - phase: 117-dataroot-version-bridge
    provides: dataRoot #version-bridge fix that resolves the shared cold-deeplink /intro hydration race
provides:
  - "Todos #1 (party-drawer boundary) and #2 (qspec cold-start) CLOSED-AS-STALE with this-phase 3x evidence + D-02 parity"
  - "cold-entry-dataroot (Phase-117 COLD-03 resolver) cited as the shared cluster proof for the voter-journey-family todos"
  - "Storage-502-wedge full-recovery recipe (supabase stop/start + db:reset) when bare db:reset leaves buckets empty"
affects: [131-04, 131-05, phase-132-full-suite-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cold-start 3x with storage-502-wedge auto-recovery: db:reset -> if public-assets bucket empty => supabase stop/start + db:reset (NOT a storage-container restart, which does not re-provision buckets)"
    - "Shared-spec dedup (D-01): run cold-entry-dataroot + voter-journey 3x ONCE, cite for every todo the spec covers"

key-files:
  created:
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-cold-entry-dataroot-3x.txt
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-voter-journey-3x.txt
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-party-drawer-3x.txt
  modified:
    - .planning/todos/completed/2026-05-14-qspec-walkToQuestion-cold-start-race.md
    - .planning/todos/completed/2026-05-14-party-drawer-boundary-flake-residual.md
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/131-DISCUSSION-POINTS.md

key-decisions:
  - "Both todos closed CLOSED-AS-STALE on pass/pass/pass cold-start evidence; parity CONFIRMED by reading the current covering specs (no assertion added)"
  - "cold-entry-dataroot (Phase-117 gate) run 3x ONCE as the canonical shared cold-deeplink resolver for the cluster (D-01 dedup)"
  - "Full supabase stop/start is the correct storage-502-wedge recovery when bare db:reset leaves buckets empty; a storage-container restart does NOT re-provision config.toml buckets (confirms 131-02)"

patterns-established:
  - "Shared-cluster resolver evidence: one 3x run of the Phase-117 negative-control gate cited across every cold-deeplink-family todo it covers"
  - "Storage-wedge full recovery: supabase stop/start re-provisions config.toml buckets on the next db:reset; a bare container restart does not"

requirements-completed: [HARDN-01]

coverage:
  - id: D-01
    description: "Shared cold-deeplink resolver (cold-entry-dataroot Phase-117 COLD-03 gate) proven green once and cited for todos #2/#1"
    requirement: HARDN-01
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/cold-entry-dataroot.spec.ts (3x cold-start, 4 each) -> post-fix/131-cold-entry-dataroot-3x.txt"
        status: pass
    human_judgment: false
  - id: D-02-todo2
    description: "Todo #2 (qspec cold-start #7/#8) CLOSED-AS-STALE: boolean + categorical render parity confirmed in voter-journey; 3x green"
    requirement: HARDN-01
    verification:
      - kind: e2e
        ref: "voter-journey.spec.ts (boolean :845/:883, categorical :807; 3x cold-start, 4 each) -> post-fix/131-voter-journey-3x.txt"
        status: pass
    human_judgment: false
  - id: D-02-todo1
    description: "Todo #1 (party-drawer boundary) CLOSED-AS-STALE: org drawer info/children/opinions tab parity confirmed; 3x green"
    requirement: HARDN-01
    verification:
      - kind: e2e
        ref: "voter-alliance.spec.ts + voter-journey-mobile.spec.ts (3x cold-start, 4 each) -> post-fix/131-party-drawer-3x.txt; tab assertion voter-journey.spec.ts:1337 + voter-alliance.spec.ts:127"
        status: pass
    human_judgment: false

# Metrics
duration: ~45min
completed: 2026-07-22
status: complete
---

# Phase 131 Plan 03: Cold-Deeplink Cluster voter-journey-family Todos (#1 + #2) Summary

**Closed the two voter-journey-family cold-deeplink todos — #2 (qspec cold-start #7/#8) and #1 (party-drawer boundary) — as CLOSED-AS-STALE, each on pass/pass/pass this-phase cold-start evidence with D-02 parity confirmed against the current covering specs, citing the Phase-117 `cold-entry-dataroot` gate (run 3x once) as the shared cluster resolver plus a full storage-502-wedge recovery when bare db:reset left the buckets empty.**

## Performance

- **Duration:** ~45 min (dominated by cold-start E2E: cold-entry ~6s/run, voter-journey ~1.1m/run, alliance+mobile ~27s/run, plus one storage-wedge recovery cycle)
- **Completed:** 2026-07-22
- **Tasks:** 3
- **Files:** 6 (3 created evidence artifacts, 2 todos moved+stamped, 1 DISCUSSION-POINTS)

## Accomplishments

- **Shared cold-deeplink resolver proven once (D-01 dedup).** `cold-entry-dataroot.spec.ts` (the Phase-117 COLD-03 negative-control gate — bare `page.goto('/en/elections')` / `/en/info` cold entry renders the populated region) ran **3× cold-start: pass/pass/pass** (4 tests each incl. base setup/teardown), cited as the "resolved by prior work" proof for the voter-journey-family. `post-fix/131-cold-entry-dataroot-3x.txt`.
- **voter-journey 3× green.** `post-fix/131-voter-journey-3x.txt` — pass/pass/pass (4 each), the shared journey evidence carrying both todos' parity assertions.
- **Todo #2 (qspec cold-start) CLOSED-AS-STALE.** Parity CONFIRMED (D-02 / §3.5): `voter-journey.spec.ts` hard-asserts the boolean (`baseOpinion5Boolean` heading, `:845`/`:883`) AND categorical (`baseOpinion4Categorical` render, `:807`) question paths — the old `voter-question-rendering` cells #7/#8 contract — plus the `{#key question.type}` boundary remount (`:868`). No gap → no assertion added. Stamped citing both cold-entry-dataroot + voter-journey evidence; `git mv`'d to `completed/`.
- **Todo #1 (party-drawer boundary) CLOSED-AS-STALE.** `voter-alliance` + `voter-journey-mobile` ran **3× cold-start: pass/pass/pass** (4 each, 0 did-not-run; `post-fix/131-party-drawer-3x.txt`). Parity CONFIRMED (D-02 / §3.4): the org/party drawer's info/candidates(children)/opinions tab-open contract is asserted at `voter-journey.spec.ts:1337` (`expectTabs(['info','children','opinions'])`) + the alliance per-type tab-control at `voter-alliance.spec.ts:127` (`['info','children']`). Stamped, moved to `completed/`.
- **DISCUSSION-POINTS ledger filled.** §6 rows #1 and #2 completed (no `____` placeholders); §3.4 / §3.5 checkboxes ticked.

## Task Commits

1. **Task 1: cold-entry-dataroot + voter-journey 3x evidence** — `1356bffb0` (test)
2. **Task 2: close todo #2 (qspec cold-start) CLOSED-AS-STALE** — `41531ad3f` (docs)
3. **Task 3: close todo #1 (party-drawer boundary) CLOSED-AS-STALE + 3x evidence** — `b3219544a` (docs)

_No product or spec code changed this plan — triage only; both parity contracts were already covered, so no assertion was added._

## Files Created/Modified

- `post-fix/131-cold-entry-dataroot-3x.txt` — 3x cold-start evidence (4 each); one intermediate run-3 block annotated CONTAMINATED (dev-server death during wedge recovery) + REDONE clean
- `post-fix/131-voter-journey-3x.txt` — 3x cold-start (4 each)
- `post-fix/131-party-drawer-3x.txt` — voter-alliance + voter-journey-mobile 3x cold-start (4 each, 0 did-not-run)
- `.planning/todos/completed/2026-05-14-qspec-walkToQuestion-cold-start-race.md` — stamped CLOSED-AS-STALE, moved from pending/
- `.planning/todos/completed/2026-05-14-party-drawer-boundary-flake-residual.md` — stamped CLOSED-AS-STALE, moved from pending/
- `131-DISCUSSION-POINTS.md` — §6 rows #1/#2 filled; §3.4/§3.5 ticked

## Decisions Made

- **Closed both todos on 3-of-3 pass/pass/pass** (D-07): each run is a first-and-only attempt on a freshly-cold DB — no retry-until-green. Both dispositions terminal (CLOSED-AS-STALE), neither left deferred.
- **Parity confirmed by reading the current covering specs** — todo #2 (boolean+categorical render) and todo #1 (org drawer info/children/opinions + alliance info/children tab set) both fully covered today; no assertion added.
- **cold-entry-dataroot run 3x ONCE, cited for the cluster** (D-01 dedup) — the Phase-117 gate is the canonical shared resolver; did NOT hand-roll a bespoke cold-entry spec (Don't-Hand-Roll).
- **Evidence artifacts are this-phase-dated only** — neither disposition cites a `phases/130-` path (grep = 0).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Storage-502-wedge recovery via full supabase stop/start (bare db:reset left buckets empty)**
- **Found during:** Task 1 (cold-entry-dataroot run 3)
- **Issue:** On the 3rd db:reset, the Supabase CLI's end-of-reset "Restarting containers" step hit `Error status 502 (invalid response from upstream)` (the Kong storage-502-wedge), leaving `storage.buckets` EMPTY — a portrait-upload "Bucket not found" cascade / did-not-run risk. The 131-01 storage-container restart and the 131-02 bare-db:reset recipe BOTH failed to re-provision buckets in this wedged state (confirmed: `docker restart supabase_storage/kong/rest` did NOT recreate the buckets).
- **Fix:** Full `supabase stop && supabase start` cleanly re-initializes storage, and the next `yarn db:reset` re-provisions BOTH config.toml buckets (`Creating Storage bucket: public-assets`). Built this into the run loop as auto-recovery: `db:reset -> if public-assets bucket empty => stop/start + db:reset`. No wedge recurred in Tasks 2-3.
- **Files modified:** run recipe only (scratchpad harness); documented in each `post-fix/*.txt` preamble. No repo code.
- **Verification:** All subsequent runs reported `public-assets bucket ready` with zero bucket-not-found failures.

**2. [Rule 3 - Blocking] Restarted the vite dev server (died during the storage-wedge stop/start recovery)**
- **Found during:** Task 1 (cold-entry-dataroot run 3, first attempt)
- **Issue:** The pre-existing `:5173` vite dev server went down during the supabase stop/start recovery; the first run-3 attempt recorded `dev-gate:000` and 2 false test failures (harness contamination per 131-02 Deviation 1, not a real spec failure).
- **Fix:** Started a fresh `yarn workspace @openvaa/frontend dev` server (up in ~1s, http=200; packages already built), annotated the contaminated run-3 block in the artifact as invalid, and REDID run 3 clean (4 passed). Added a post-recovery dev-gate re-confirm to the run loop.
- **Files modified:** run recipe + the cold-entry artifact annotation only; no repo code.
- **Verification:** Every subsequent run reported `dev-gate:200 ok` before AND after any stop/start; zero ERR_CONNECTION_REFUSED.

**Total deviations:** 2 auto-fixed (both blocking — evidence-harness environment). Neither altered the specs, the contracts under test, or product code. No scope creep.

## Issues Encountered

- **Storage-502-wedge under repeated db:reset** (Kong upstream orphaned when the CLI restarts storage at end-of-reset). Recovery: `supabase stop/start` + db:reset (a storage-container restart alone does NOT re-provision config.toml buckets). Recommend Plans 04-05 fold the stop/start branch into their bucket-ready gate.
- **Vite dev server death during stop/start** (false `dev-gate:000` failures). Mitigated by a fresh server + a dev-gate re-confirm after any stop/start.

## User Setup Required

None. A `:5173` dev server (`yarn dev` / frontend vite) and local Supabase must be running for later plans' E2E evidence — a fresh frontend vite server was started this plan and is left running.

## Next Phase Readiness

- Todos #1 and #2 terminally CLOSED-AS-STALE; only 2 deferred todos remain for Plans 04-05 (#3 popup-hydration LAYOUT-03, #4 feedback-persistence parity gap).
- Storage-wedge full-recovery recipe (stop/start + db:reset) documented in all three evidence artifacts — reuse when bare db:reset leaves buckets empty.
- No new `test.skip` introduced; both dispositions terminal; no product/spec code changed.

## Self-Check: PASSED

- All 3 evidence artifacts + both moved todos + DISCUSSION-POINTS verified present on disk.
- All 3 task commits (`1356bffb0`, `41531ad3f`, `b3219544a`) verified in git log.
- Both todos confirmed moved (not copied): neither remains in `.planning/todos/pending/`.

---
*Phase: 131-e2e-reliability-hardening-deferred-flake-race-triage*
*Completed: 2026-07-22*
