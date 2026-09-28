---
slug: tied-match-order-churn
status: resolved
created: 2026-08-26
updated: 2026-08-26
next_action: Operator decision on the product-level tie-break (see CHECKPOINT at the end of this file); then phase 146 plan 07 re-baselines the two voter PNGs
severity: high
---

# Tied-match candidates render in a different order on each run

## Symptom (measured, not reported)

On `/results`, candidates that **tie at exactly 47% match** render in a **different order on each
run**. Candidates at any other score are pixel-stable across runs.

Discovered by Phase 146's D-04 noise measurement: 10 consecutive in-container captures per baseline
at `maxDiffPixels: 0`.

## Evidence

| Baseline | 10-run diff range vs a fixed expected PNG |
|---|---|
| `voter-results-desktop` (1280×3684) | **11,749 – 15,928 px** |
| `voter-results-mobile` (390×4152) | **11,748 – 15,905 px** |
| `candidate-preview-desktop` (1280×821) | **0 px, all 10 runs** |
| `candidate-preview-mobile` (390×924) | **0 px, all 10 runs** |

The two voter baselines move **in lockstep to within 28 px**, which is consistent with one shared
cause rather than rendering noise. The `candidate-preview` pair at exactly 0 across 20 cells proves
the measurement instrument is sound.

**Full-page diff (run08, the max cell):** rows at 100%, 82%, 76% and 12% match are pixel-clean.
**Every one of the ten rows at 47% is red** — name, portrait, and party/list badge.

**Same 1000px band, baseline vs run08 actual:**

| Row | Baseline | run08 actual |
|---|---|---|
| 1 | Generic AA Four (6) | Free Independent (14) |
| 2 | Generic AB One (7) | Generic C One (12) |
| 3 | Generic AA One (3) | Generic AA Four (6) |
| 4 | Generic AA Three (5) | Generic C Two (13) |
| 5 | Generic AA Two | Generic AA One |

Every card reads **47% match** with **identical sub-scores: 46 / 50 / 50 / 50**. Same pool, same
scores, different order. Page height is identical (1280×3684 both), so nothing shifted vertically —
only the row contents permuted.

## What has already been ruled out

- **The matching algorithm is deterministic.** It computes the same distances every run — the tie is
  genuine and reproducible (identical sub-scores on every tied card). This is NOT a scoring bug.
- **`get_nominations` is deterministically ordered.** `apps/supabase/supabase/schema/503-entity-rpcs.sql:86`
  — `ORDER BY n.sort_order NULLS LAST, n.id`. `n.id` is unique, so this is a total order.
- **The dataset is deterministic.** `packages/dev-seed/src/templates/e2e/base.ts:405` — `seed: 42`.
- **Not a re-baselining problem.** Re-capturing would freeze one arbitrary tie order into the
  committed baseline; the churn would continue against it.

## The lead (unconfirmed)

`packages/matching/src/algorithms/matchingAlgorithm.ts:122`:

```
matches.sort((a, b) => a.distance - b.distance);
```

No tie-break. `Array.prototype.sort` is stable, so equal distances **preserve input order** — the
displayed order of tied candidates is inherited from whatever order the entities arrived in. Since
the RPC's order IS deterministic, **something between the RPC and the matcher's input is not
preserving it.**

That "something" is what this session must find. Candidates worth checking: keyed collections /
`Object.values()` / `Map` or `Set` iteration in the `DataRoot` construction, per-entity async
resolution that completes out of order, or a second sort downstream
(`apps/frontend/src/lib/utils/matches.ts` uses `compareMaybeWrappedEntities`,
`apps/frontend/src/lib/utils/sorting.ts:53`).

## Why it matters beyond the visual gate

`voter-results-mobile`'s clean-tree churn reached **15,905 px against a 16,192.8 px budget — 98.2%,
a margin of 288 px**. The **blocking** `e2e-visual` CI job on `main` is therefore ~288 px from a
spurious red caused by tie churn rather than by any regression. This has never been measured before.

## Blocked work

Phase 146 is **halted at 146-04**. `max(noise) = 15,928` is 31.9× the 500 px incompatibility
threshold D-05 named in advance, and no cap value exists: it would need to be `> 15,928` (quiet on
its own churn) and `< 16,650` (catching the v2.14 injection) — a 722 px window narrower than the
measurement's own standard deviation.

## Artifacts

- Ledger: `.planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-VISUAL-NOISE-LEDGER.md` (40-cell matrix + derivation)
- Halted summary: `.planning/phases/146-.../146-03-SUMMARY.md` (`status: halted`)
- Run artifacts: `tests/e2e-runs/146-noise-run01` … `run10` (gitignored)

## Current Focus

ROOT CAUSE CONFIRMED (verified in isolation — see Attempts A4).

The order is **not lost between the RPC and the render**. It is lost **before the row ever reaches
the database**: the seeder never persists the template's declaration order, so the RPC's only
effective sort key is a random primary key that is regenerated on every reseed. The premise
"the dataset is deterministic (`seed: 42`)" was true of the *content* and FALSE of the *row ids*.

reasoning_checkpoint:
  hypothesis: "`get_nominations` orders `ORDER BY n.sort_order NULLS LAST, n.id`; every seeded
    nomination has `sort_order = NULL`, so the order collapses to `ORDER BY n.id`, a
    `gen_random_uuid()` PK. The `visual-regression` project depends on `data-setup-base`, which
    tears the dataset DOWN and re-seeds it on EVERY run, minting fresh uuids — so the RPC returns
    the same rows in a fresh random order every run. That random order flows unchanged into
    `matchingAlgorithm.match()`'s `targets`; the stable `sort((a,b) => a.distance - b.distance)`
    then re-orders every distinct score deterministically and leaves TIED entries in their random
    input order."
  confirming_evidence:
    - "Trace evidence from the 10 REAL failing runs: the `get_nominations` response for the same
      (election, constituency) pair returns the same 13 candidates in 7 mutually different
      permutations across runs 01/03/04/05/06/07/09 (Attempts A3)."
    - "Every election/constituency UUID differs in every one of the 10 noise runs — proof the DB
      was torn down and re-seeded between runs (Attempts A3)."
    - "Direct isolation test: 3 consecutive teardown+reseed cycles of `e2e/base` produce 3
      different `ORDER BY n.sort_order NULLS LAST, n.id` orderings of the same 15 candidate
      nominations (Attempts A4)."
    - "`select entity_type, count(*), count(sort_order) from nominations group by 1` returns
      with_sort_order = 0 for all 61 rows; `e2e/base`'s `nominations.fixed[]` declares no
      `sort_order` on any row."
    - "Control: 8 repeated COLD loads of /results against ONE un-reseeded DB produce a byte-identical
      card order (Attempts A2) — the churn requires a reseed, exactly as the mechanism predicts."
  falsification_test: "If the RPC's per-(election,constituency) response order were identical across
    two different seedings of the same template, the hypothesis is dead. Measured: it is not."
  fix_rationale: "The template's `nominations.fixed[]` array IS a deliberate, documented,
    deterministic order (`base.ts:1389-1396` — alliance, then organization, then candidate per
    election x constituency triangle). The seeder discards it by never writing `sort_order`, which
    forces the DB to fall back to a random surrogate key. Persisting the declaration index as
    `sort_order` restores the order AT THE POINT IT IS LOST and makes the RPC's existing ORDER BY a
    genuine total order on stable, content-derived data."
  blind_spots: "This fixes the churn SOURCE for every dev-seed template. It does NOT make the
    PRODUCT immune: any deployment importing nominations without `sort_order` still gets a
    uuid-arbitrary (though per-DB stable) tie order, and `matchingAlgorithm.match()` still has no
    tie-break. That second fix is a product-visible ordering decision — raised as a CHECKPOINT, not
    taken silently."
  candidate_causes:
    - "data: seeded `nominations.sort_order` is NULL on every row, so the RPC's tiebreak is a random uuid PK"
    - "environment/test-harness: `data-setup-base` tears down + re-seeds before EVERY visual run, minting fresh uuids"
    - "code: `packages/matching/src/algorithms/matchingAlgorithm.ts:122` sorts with no tie-break, so the random order becomes user-visible for ties"
  and_gate: "YES — three conditions must hold simultaneously. Stable `sort_order` alone would make
    the missing tie-break invisible; a tie-break alone would make the random uuids invisible; and
    without the per-run reseed the uuids would be stable and neither would matter. `root_cause`
    below therefore names a SET, not a single cause."

## Hypotheses

- **H1 — RPC row order is not stable.** `ORDER BY n.sort_order NULLS LAST, n.id` is a total order
  ON PAPER, but SQL-function inlining + PostgREST's CTE wrapper could drop the sort. If the input
  order is fully shuffled, that is INVISIBLE at every distinct score (the distance sort fixes those)
  and visible ONLY inside a tie group — which is exactly the observed signature.
  Status: partially probed. `EXPLAIN (COSTS OFF) SELECT * FROM public.get_nominations(NULL,NULL,false)`
  shows the function IS inlined but the `Sort (Sort Key: n.sort_order, n.id)` node SURVIVES at the
  plan top, and `pg_proc.proparallel = 'u'` for `get_nominations`, so no parallel-scan reordering is
  possible. NOT yet measured against real rows.
- **H2 — multi-provide merge order.** `DataRoot.provideData` (packages/data/src/root/dataRoot.ts:766-774)
  does `this.children[collection] ??= new Map()` then `collObject.set(obj.id, obj)` — it MERGES; the
  JSDoc claim "Existing data will be reset" is FALSE. Map slot order is fixed by FIRST insertion.
  `(voters)/(located)/+layout.svelte:95-96` re-provides on every `(located)` navigation, and
  `(voters)/nominations/+layout.svelte:56-57` provides too. If the first provide of a run carries a
  different (election, constituency) fan-out composition than another run, the merged order differs.
- **H3 — a second sort downstream.** ELIMINATED by static trace (see Evidence).

## Evidence

- checked: `packages/matching/src/algorithms/matchingAlgorithm.ts:44-123`
  found: `match()` builds `matches` by `for (let i = 0; i < targets.length; i++) matches.push(...)`,
  then a single stable `sort((a,b) => a.distance - b.distance)`.
  implication: match output order == `targets` input order within each tie group. The sort is the
  AMPLIFIER, not the source.
- checked: `apps/frontend/src/lib/contexts/voter/matchState.svelte.ts:128-137`
  found: `targets: proxies ?? nominations` — for `candidate` there are no proxies, so targets are
  exactly the `nominations` array from `nominationAndQuestionState`.
- checked: `apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts:73-95`
  found: `election.getNominations(entityType, constituency)` then `.filter(...)` for
  `hideIfMissingAnswers`. `Array.filter` preserves order.
- checked: `packages/data/src/objects/election/election.ts:76-87` -> `dataRoot.ts:486-497` ->
  `dataRoot.ts:426-449`
  found: `findNominations` returns `[...collection.values()].filter(...)`. `collection` is a
  `MappedCollection = Map<Id, T>`; `[...map.values()]` is INSERTION order. Note this path does NOT
  call `.sort(order)` — `getCollectionAsArray` (dataRoot.ts:190-196) does, but `findNominations`
  does not.
  implication: nomination order == DataRoot Map insertion order.
- checked: `packages/data/src/root/dataRoot.ts:664-701` + `766-780`
  found: `provideNominationData` -> `provideData` inserts in ARRAY order, one `Map.set` per item,
  with NO reset of the existing Map.
- checked: `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:255-446`
  found: fan-out via `electionIds.flatMap(eid => constituencyIds.map(cid => rpc(...)))`,
  `await Promise.all(calls)` (order-preserving by contract), `results.flatMap(r => r.data ?? [])`,
  then a single `for (const row of data)` push loop. The `entityMap`/`seenNominationIds` Map+Set are
  first-seen-wins, so they preserve order too. The parent/child reverse-fill mutates in place and
  reorders nothing.
- checked: `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte:120-127`
  + `EntityListWithControls.helpers.ts:14-21` + `packages/filters/src/group/filterGroup.ts:46-52`
  + `packages/filters/src/group/combineResults.ts:21-32`
  found: the render path applies `FilterGroup.apply` then the search filter; both are
  `Array.filter`-shaped and order-preserving, and `combineResults` under `And` is
  `out.filter(e => list.includes(e))`.
  implication: **H3 eliminated.** `compareMaybeWrappedEntities` (`sorting.ts:53`) is NOT applied on
  the `/results` list at all — it is only used by `findCandidateNominations` /
  `findOrganizationNominations` in `matches.ts` for the CHILD lists inside an entity detail view.
  The baseline row order (symbols 6, 7, 3, 5) is not name-sorted or symbol-sorted, which
  independently confirms no downstream comparator runs.
- checked: `pg_proc` for `get_nominations` + `EXPLAIN (COSTS OFF)`
  found: `provolatile='s'`, `proparallel='u'`, `prokind='f'`, `lanname='sql'`. The plan shows the
  body inlined with a top-level `Sort  Sort Key: n.sort_order, n.id`.
  implication: parallel-worker row-order nondeterminism is impossible for this function; the sort
  survives inlining at least on an empty table.
- checked: local DB row counts
  found: `nominations=0, candidates=1, organizations=0, elections=0, constituencies=0, questions=0`.
  implication: the environment note "DB seeded e2e/base (143 rows)" is STALE — the DB was emptied
  after that note was written. Reproduction requires a reseed.

## Attempts

- **A1 — RPC id-order stability against ONE seeded DB.** 15 consecutive `POST /rest/v1/rpc/get_nominations`
  calls (unfiltered) returned 59 rows with a byte-identical id sequence every time
  (`md5(ids)=f36c61353404` x15). Also `EXPLAIN (COSTS OFF)` shows the SQL function inlined with the
  `Sort (Sort Key: n.sort_order, n.id)` node intact, and `pg_proc.proparallel='u'` rules out
  parallel-worker reordering. => H1 as originally stated (RPC unstable WITHIN one DB) ELIMINATED.
- **A2 — Rendered /results order across 8 cold loads, same DB.** Drove headless Chromium 8x:
  restore a captured `VoterContext-answerStore`, `goto /results/{regionalId}?electionId[]=...`,
  read `[data-testid="entity-card"]` order. Card order hash identical in all 8 runs
  (`cardHash=bf84b315`). The tie group reproduced verbatim by NAME (Generic AB One, Generic C Two,
  Generic AA One, Generic AA Three, Generic C One, Free Independent, Generic AA Two, Generic AA
  Four — the same names the run08 report lists), but it did NOT churn. => the browser path is NOT
  the source; the churn needs something that changes BETWEEN runs.
  (Incidental: the `page.on('response')` arrival order of the 4 fan-out RPCs DOES vary run to run,
  but `await Promise.all(calls)` restores call order, and the card order stayed constant — so the
  fan-out race is a red herring.)
- **A3 — Trace forensics on the 10 REAL failing runs.** Unzipped every Playwright trace under
  `tests/e2e-runs/146-noise-run01..10/html/data/*.zip`, parsed `0-trace.network`, and read the
  `get_nominations` response bodies out of `resources/<sha1>`.
  Two decisive findings:
  1. The election + constituency UUIDs are DIFFERENT in all ten runs (run01 `952272d1`/`ab4d725f`,
     run02 `1c28645e`/`d0626134`, run03 `1a44e94d`/`75981244`, ...). The dataset is torn down and
     re-seeded before every run.
  2. The candidate order INSIDE one (election, constituency) response permutes completely between
     runs. Same 13 candidates, 7 different orders:
     - run01: Near-Max BA Two | Polar-Min BA One | Generic AB One | Generic C One | Polar-Max BB One | ...
     - run03: Special Candidate AA | Generic AA Two | Polar-Max BB One | Generic AA Three | ...
     - run05: Generic AA Three | Generic AA One | Generic C One | Polar-Max BB One | ...
     - run07: Special Candidate AA | Generic AA Two | Generic AB One | Free Independent | ...
     Within a single run the per-pair id-hash is constant across all 84 RPC calls.
- **A4 — Isolation test (the confirmation).** 3 x (`seed:teardown --prefix test-e2e-base-` then
  `db:seed --template e2e/base`), reading
  `... order by n.sort_order nulls last, n.id` for EL-Reg / CO-Reg-N candidate nominations:
  - reseed 1: aa-1 bb-1 ba-1 bb-2 c-2 ba-2 aa-4 c-1 aa-hidden aa-2 ab-1 aa-unregistered aa-3 independent aa-special
  - reseed 2: ba-1 aa-hidden c-2 independent c-1 aa-2 ba-2 aa-special aa-1 aa-3 ab-1 aa-unregistered aa-4 bb-1 bb-2
  - reseed 3: ab-1 aa-1 aa-4 bb-2 bb-1 aa-3 c-2 aa-special aa-2 c-1 ba-1 aa-unregistered ba-2 independent aa-hidden
  Identical content (`seed: 42`), three different orders. **Root cause reproduced deterministically
  on demand.**
- **A5 — Harness confirmation.** `tests/playwright.config.ts:387-390` gives the `visual-regression`
  project `dependencies: ['data-setup-base', 'auth-setup']`; `tests/tests/setup/shared/base.setup.ts`
  calls `setupFromTemplate('e2e/base', ...)`, which tears down (DELETE) and re-seeds. `nominations.id`
  is `uuid NOT NULL DEFAULT gen_random_uuid()`, so every run mints new ids.


## Resolution

root_cause: >
  A SET of three conditions that must hold simultaneously (AND-gate fired):
  (1) DATA — every nomination `e2e/base` (and every other dev-seed template) writes leaves
      `nominations.sort_order` NULL, so `get_nominations`'s
      `ORDER BY n.sort_order NULLS LAST, n.id`
      (`apps/supabase/supabase/schema/503-entity-rpcs.sql:88`) degenerates to `ORDER BY n.id` — and
      `nominations.id` is `uuid NOT NULL DEFAULT gen_random_uuid()`. The template's deliberate,
      documented declaration order (`packages/dev-seed/src/templates/e2e/base.ts:1389-1396`) was
      never persisted, so the DB had no content-derived key to sort on.
  (2) ENVIRONMENT — the `visual-regression` project declares
      `dependencies: ['data-setup-base', 'auth-setup']` (`tests/playwright.config.ts:387-390`), and
      `data-setup-base` (`tests/tests/setup/shared/base.setup.ts` -> `setupFromTemplate('e2e/base')`)
      TEARS DOWN and RE-SEEDS before every run. Each reseed mints fresh uuids, so condition (1)
      produced a NEW random row order on every single visual run.
  (3) CODE — `packages/matching/src/algorithms/matchingAlgorithm.ts:122`
      (`matches.sort((a, b) => a.distance - b.distance)`) has no tie-break. `Array.prototype.sort`
      is stable, so every DISTINCT score is re-ordered deterministically and DISTANCE-TIED entries
      retain their random arrival order. This is why a fully-shuffled input was invisible at
      100% / 82% / 76% / 12% and visible only across the ten rows tied at 47%.
  The original premise "the dataset is deterministic (`seed: 42`)" was true of the CONTENT and
  false of the ROW IDS, which is the only key the RPC could sort on.

fix: >
  Fixed at the source — the point where the deterministic order is discarded.
  `packages/dev-seed/src/pipeline.ts` now runs `assignNominationSortOrder(output)` as a post-topo
  pass (beside `attachSentinels`), persisting each nomination's emission index as its `sort_order`
  when the row does not already declare one. Placed in `runPipeline` rather than in
  `NominationsGenerator` so it covers BOTH the built-in generator and `overrides.nominations`
  (which fully replaces generator output). A row that declares its own `sort_order` keeps it
  verbatim, including the falsy `0`.
  NOT fixed here (deliberately, raised as a CHECKPOINT): the product-level tie-break in
  `matchingAlgorithm.match()`. Choosing a tie-break key changes which candidate a voter sees first
  and is an operator decision.

verification:
  signal_regression_test:
    status: pass
    detail: >
      7 new cases in `packages/dev-seed/tests/pipeline.test.ts`
      (`runPipeline — nomination sort_order (tied-match-order-churn regression)`).
      Oracle type: DERIVED (contract = "the emitted sort_order sequence is a total order that is a
      pure function of the template"), not implicit. Boundary neighbours covered: first index 0
      (a truthiness guard instead of `== null` would skip it), author-supplied falsy `0`,
      singleton, empty set, and the override path.
      RED PHASE PROVEN: with `assignNominationSortOrder` commented out, 5 of the 7 fail
      (`expected [ undefined ] to deeply equal [ +0 ]`); the two that passed were then hardened so
      the "byte-identical across runs" case also asserts `[0, 1, 2]` rather than two equal
      all-undefined sequences.
  signal_original_repro:
    status: pass
    detail: >
      The exact isolation test that reproduced the bug (A4) now passes. 4 consecutive
      `seed:teardown --prefix test-e2e-base-` + `db:seed --template e2e/base` cycles, reading
      `... ORDER BY n.sort_order NULLS LAST, n.id` for EL-Reg / CO-Reg-N candidate nominations,
      return a BYTE-IDENTICAL sequence all four times:
      `aa-special aa-hidden aa-1 aa-2 aa-3 aa-4 ab-1 ba-1 ba-2 bb-1 bb-2 c-1 c-2 independent aa-unregistered`
      (before the fix the same test produced 3 different orders in 3 cycles).
      The persisted values are an exact 1:1 match with the template's declaration order —
      al-a=0, al-b=1, or-aa=2 ... ca-aa-special=7 ... ca-aa-unregistered=21 — confirming the fix
      restores the intended order rather than inventing a new one.
  signal_suite:
    status: pass
    detail: >
      Full `yarn test:e2e` against the live host dev server (:5173) on a `yarn db:reset` DB:
      **135 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run** in 11.1m, exit 0. Cardinal-clean.
  signal_end_to_end:
    status: pass
    detail: >
      The ORIGINAL SYMPTOM re-tested under the exact condition that produced it. 3 x
      (teardown + reseed `e2e/base` -> full headless voter walk -> pin the Regional election ->
      read `[data-testid="entity-card"]` order). All three runs produce a BYTE-IDENTICAL card
      order (`hash=f0d166c1`):
      `BB One(86%) | Special Candidate AA(71%) | Near-Max BA Two(71%) | AA One | AA Two | AA Three |
       AA Four | AB One | BB Two | C One | C Two | Free Independent | Polar-Min BA One(14%)`
      The tie group now renders in the template's declaration order instead of a fresh uuid
      permutation. Pre-fix, the same 13 candidates arrived in 7 mutually different orders across
      the 10 archived phase-146 runs.
  signal_typecheck_lint:
    status: pass
    detail: >
      `yarn workspace @openvaa/dev-seed typecheck` clean; `yarn lint` 0 errors
      (15 pre-existing warnings, none in the changed files); full `yarn test:unit` for dev-seed
      569/569 pass.
  guardrail_verdict: accepted

files_changed:
  - packages/dev-seed/src/pipeline.ts (assignNominationSortOrder post-topo pass + rationale docblock)
  - packages/dev-seed/tests/pipeline.test.ts (7-case regression describe block)

## Known consequence for phase 146

The committed baselines under `tests/tests/specs/visual/__screenshots__/` were captured with the
OLD random tie order. After this fix the tie order becomes DETERMINISTIC but DIFFERENT from
whichever arbitrary permutation happened to be frozen into those PNGs, so the two voter baselines
will now diff by a FIXED amount instead of a random 11,748–15,928 px.
That is the expected and desired end state: the churn is gone, and the remaining diff is a
one-time re-baseline, which is phase 146 plan 07's job. No file under `__screenshots__/` was
touched by this session.

## CHECKPOINT — product-level tie-break (operator decision)

The source fix above makes the TEST datasets deterministic. It does not make the PRODUCT immune:
any deployment that imports nominations without `sort_order` still gets a uuid-arbitrary order,
and `matchingAlgorithm.match()` still leaves distance-tied entities in arrival order.

Constraint on the fix surface: `@openvaa/matching` targets are typed `HasAnswers`
(`packages/core/src/matching/hasAnswers.type.ts:6`), which carries ONLY `answers` — no `id`, no
`name`, no `electionSymbol`. The matching package therefore CANNOT tie-break generically without
either a new caller-supplied comparator option or a widened contract.

Relevant precedent: the app already owns a canonical entity comparator —
`compareMaybeWrappedEntities` (`apps/frontend/src/lib/utils/sorting.ts:53`) = match score DESC,
then election symbol ASC, then name ASC. It is applied to the CHILD lists inside an entity detail
view (`apps/frontend/src/lib/utils/matches.ts`) but NOT to the `/results` list, which renders raw
matcher order. Adopting it on `/results` would be internally consistent — and would change which
tied candidate a voter sees first.


---

## Orchestrator verification + operator decision (2026-08-26)

**Operator chose option (a): adopt `compareMaybeWrappedEntities` on `/results`.** Committed as
`dbb704bd4` — `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte`
now sorts with that comparator (`toSorted`, NOT `sort` — `voterCtx.matches[...]` is reactive context
state). Its primary key is match score DESC, identical to the matcher's ascending distance, so the
visible ranking is unchanged; what it adds is the tie-break (election symbol asc → name asc).

Recorded consequence, surfaced to the operator before the choice and accepted: among exactly-tied
candidates this systematically favours names that sort early. Chosen over a matcher comparator option
and over a scoped follow-up phase, for consistency with the detail-drawer child lists this comparator
already governs.

The seed-side fix is `53002b6a9`.

### Independent verification — 5 in-container runs, shipped config

| Run | Result |
|---|---|
| 1 | **16,883 px** |
| 2 | **16,883 px** |
| 3 | ✗ `TimeoutError: locator.waitFor` 10 s — `Voter Results - Mobile` |
| 4 | **16,883 px** |
| 5 | **16,883 px** |

Four byte-identical counts where previously **every** run differed (11,748–15,928 px). **Churn
eliminated.** `voter-results-desktop` now passes outright. The residual fixed 16,883 px on mobile is
the delta between the committed baseline's old arbitrary permutation and the new stable order — a
one-time re-baseline, which is phase 146 plan 07's job.

Also re-verified by the orchestrator: dev-seed unit **569/569**; `yarn lint:check` (incl. typecheck)
**22/22 clean**; `yarn format:check` clean; live DB shows all **61 nominations numbered 0–60, 0 NULLs**.
Pre-fix `pipeline.ts` contained **zero** occurrences of `sort_order`, confirming the NULL premise.

### ~~OPEN~~ CLOSED 2026-08-26 → `.planning/debug/answer-surface-wait-timeout.md`

**This item is no longer open.** Both sightings below were diagnosed in a dedicated session; the
record is `.planning/debug/answer-surface-wait-timeout.md`. Summary of the finding, so a reader
of this file does not have to open that one to know the outcome:

- `voter-journey.fixture.ts:336` is **not** the fault site. The fault is that the emulated
  container's outbound TCP SYN to `host.docker.internal` is intermittently DROPPED, so the
  connection waits out Linux's SYN-retransmission backoff (measured 36 s and 68 s, on ~0.8 % of
  fresh connections). When the stalled connection carries an asset the app is blocked on — a
  SvelteKit route-node module, or the hydration entry `app.js` — the voter journey cannot advance.
- The fixture then MIS-ATTRIBUTED it, because every `waitForURL` in the answer loop swallowed its
  timeout and retried, spinning for up to 70 s before blaming line 336. Worse, the retries
  re-toggled multi-choice CHECKBOXES and silently rewrote the answer set the visual baseline is
  captured from.
- **The Vite-HMR-staleness hypothesis that phase 146 decision D-16 was chartered around is
  FALSIFIED** (see that record for the evidence).
- **A second, independent finding came out of it** that phase 146 needs on its own terms: the
  swallowed `waitForURL` retries silently REWROTE the answer set (multi-choice choices are
  checkboxes, which toggle), so a run could screenshot `/results` computed from answers the walk
  never intended — with no error reported. That is a determinism hazard for the voter baselines,
  independent of the SYN defect. See FINDING 2 in that record.
- The v2.14 "run-4 anomaly" linkage is **INFERRED and cannot be established** — v2.14 did not
  retain which test failed.
- Fixed in `tests/scripts/tcp-forward.mjs` (bounded re-dial) and
  `tests/tests/fixtures/voter/voter-journey.fixture.ts` (`requireNavigation` fails at the fault
  site). Verified: >= 5 s stalls went from 37/4 328 to 0/6 240.

The original wording is kept below for provenance.

### OPEN — carried out of this session, NOT closed

**Run 3's timeout is unexplained and is not dismissed.** One failure in five runs, on
`Voter Results - Mobile`, `locator.waitFor` 10 s exceeded. This is **the same shape as the v2.14
"run-4 anomaly"** that phase 146's D-16 is chartered to reproduce ("1 unexplained failure in 5 clean
runs"). It may be that anomaly, reproduced here. Recorded **UNCONFIRMED and still open** — never "did
not recur, so presumed gone", the reasoning this milestone rejected for DEF-135-04.
Artifacts: `tests/e2e-runs/146-verify-tiebreak-3/`.

**UPDATE 2026-08-26 — it RECURRED, and it is the same defect at the same source line.** During the
`146-03` re-measurement, `tests/e2e-runs/146-noise-run07` failed with
`Test timeout of 90000ms exceeded while setting up "answeredVoterPage"` →
`locator.waitFor` at **`fixtures/voter/voter-journey.fixture.ts:336`**, waiting on the same three-way
`getByTestId('voter-questions-category-start').or(question-choice).or(question-number-slider)` locator,
in the same `answerAndAdvanceToResults` → `answeredVoterPage` call path as run 3 above. Only the budget
that expired differs (there the locator's own `TIMEOUTS.slowPage`; here the whole 90 s test budget).
So this is not merely "the same shape" — it is the same wait, at the same line, failing the same way.
**Two sightings, both in this environment, roughly 1-in-6 to 1-in-10.** Still **UNCONFIRMED and OPEN**;
`146-07`'s D-16 now has a concrete first suspect rather than only a frequency.
Artifacts: `tests/e2e-runs/146-noise-run07/`.

### Consequences for phase 146

- **`146-03` Tasks 2–3 must be re-run.** The 40-cell noise matrix and the cap derivation are **void** —
  they measured this bug, not noise. `max(noise)` should now be ~0, which should put the D-05
  arithmetic back inside its `< 5,000` ceiling.
  **DONE 2026-08-26 (`6fb65a583`).** Re-measured at HEAD `e5ff31740`: **all forty cells read 0**, on all
  four baselines, across ten completed in-container runs at `maxDiffPixels: 0`. The prediction held
  exactly — `max(noise) = 0`, so D-05 takes its **floor** branch and terminates at **`cap = 200`**,
  25× below the ceiling. The void matrix's evidence is retained at
  `tests/e2e-runs/146-noise-VOID-run01`…`-VOID-run10`.
  *One deviation, operator-approved and disclosed in the ledger:* the committed voter baselines still
  encode the old permutation, so a diff against them reports a **fixed 16,883 px stale-baseline delta**,
  not noise. One snapshot refresh was taken **strictly before** the matrix (working tree only, reverted
  and proven byte-identical afterwards) so the ten runs measured against a fixed, current expected.
  `146-07` still owns the committed re-baseline.
- **`146-03` Task 1's blindness half (`B1-OLD` / `B2-OLD`) still stands.** It was a verdict comparison
  under the shipped config and is unaffected by tie ordering.
- **The dev server was restarted** (frontend source changed): old PID **41925** → new PID **82314**,
  port 5173, bound `--host 0.0.0.0`, rebuilt at `dbb704bd4`. Recorded here per `146-02`'s contract
  that any restart is itself recorded. D-16's continuous-uptime requirement applies from PID 82314
  forward.
