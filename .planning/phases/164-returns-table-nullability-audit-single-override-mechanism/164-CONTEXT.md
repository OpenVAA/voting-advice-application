# Phase 164: `RETURNS TABLE` Nullability — Audit + Single Override Mechanism - Context


> ⚠ **Line anchors corrected 2026-09-03.** Every `supabaseDataProvider.ts:300` citation in this file was wrong: the Phase-126 cast was measured at **`:360`** and has since been removed by `164-01`. ROADMAP criterion 3 carried the same error and was corrected in the same pass. Anchor this cast by content, never by line.

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Source of decisions:** `.planning/v2.15-DISCUSSION-POINTS.md` § M (M1–M3) + § N (cross-cutting),
filled by the operator and read at HEAD `e1ab15f71`, branch `integration/ship-12-squash`.

<domain>
## Phase Boundary

Every `RETURNS TABLE` RPC in `apps/supabase/supabase/schema/**` is enumerated against its
semantically-nullable output columns, a remedy is recorded **per RPC** (including "no change needed,
and here is why"), and the nullability that the Supabase type generator throws away is restored
through **one documented mechanism** — not through a cast at each consumer. A null-guard written
against a column that really is null must not read as dead code to TypeScript, and the next
consumer must not have to know a folk rule to write one.

Satisfies **CIGATE-04** (`.planning/REQUIREMENTS.md:78`) and **CIGATE-05** (`:79`).

**Delivers:** (1) a script-derived enumeration of the three `RETURNS TABLE` RPCs and their
semantically-nullable columns with a per-RPC disposition; (2) a single override locus in
`packages/supabase-types`; (3) removal of the Phase-126 ad-hoc cast at
`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts (cast was at :360, not :300; removed by 164-01)` plus an empty
grep for ad-hoc nullability casts on RPC returns; (4) a live-guard test that fails when the null
guard is removed; (5) a CI gate proving `yarn db:types` regeneration does not silently revert the
guarantee.

**Not in scope:** the `RETURNS jsonb` / `RETURNS SETOF` / scalar-returning functions (M1(b)
rejected — `Json` already includes `null`, so there is no nullability guarantee to lose); the
`Json`→domain-type casts in the same adapter file (`:106`, `:162`, `:376`, `:378`, `:484`, `:517`,
…) — those are **Phase 157's** validated-JSONB work, not this phase's nullability work; changing any
RPC's SQL body or column list; the `party` → `organization` rename (Phase 156).

</domain>

<decisions>
## Implementation Decisions

**Checkbox reading.** `.planning/v2.15-DISCUSSION-POINTS.md` §"How to read / fill" states: exactly
one option per decision is `★ RECOMMENDED`; **leaving every box unchecked = choosing the ★ option**
(identical to ticking it, not "undecided"); a ticked non-`★` box overrules the `★`; free text
(`**EDIT:**` / `**NOTE:**` / `**NOTES**:`) beats every box.

**Measured for this phase:** § M contains **no ticked box and no free text**. All three of M1, M2,
M3 therefore resolve **by default to their ★ RECOMMENDED option**. The same holds for the § N
cross-cutting decisions (N1, N2, N3) — all default. The only ticked box anywhere that reaches this
phase is **§ 0.1 (c)**, which is a milestone-wide instruction, recorded under D-N0 below.

### D-M1 — Is the enumeration exactly three RPCs, and how is it produced?

**Won by default (no tick, no free text): option (a).**

> **(a) Accept 3 as the complete set; generate the enumeration by script from the schema files so a
> future RPC cannot be missed** — ★ RECOMMENDED — criterion 1 requires the enumeration be "derived
> from the schema files", and the script is what makes that true rather than a prose list of three.

Rejected: **(b)** also enumerating `RETURNS jsonb` / `RETURNS SETOF` functions — those return
`Json`, which is already nullable-by-type, so there is no nullability guarantee to lose.

**⚑ This is the fact-31 correction, and it is the reason M1 exists.** The roadmap's criterion 1
originally said "at minimum `get_nominations` … and `get_candidate_user_data`" — implying a longer
list waiting to be found. There is no longer list, **and there is a third RPC the roadmap did not
name**. The complete set (verified this session, see `<facts>` F1):

| # | RPC | `CREATE OR REPLACE FUNCTION` at | `RETURNS TABLE` at | Roadmap named it? |
|---|---|---|---|---|
| 1 | `resolve_email_variables` | `502-email-helpers.sql:22` | `:27` | **NO — the missing third** |
| 2 | `get_nominations` | `503-entity-rpcs.sql:11` | `:16` | yes |
| 3 | `get_candidate_user_data` | `503-entity-rpcs.sql:97` | `:100` | yes |

**Binding consequence for the planner:** `resolve_email_variables` **must be enumerated and
dispositioned like the other two** — its `email` and `preferred_locale` columns are declared
`string` in the generated types (`database.ts:1270-1281`) and both are semantically nullable
(`auth.users.email` is nullable; `preferred_locale` is a user-profile column). "No change needed"
is an allowed disposition **only if it is written down with its reason** (criterion 1's words: a
remedy chosen and recorded per RPC, "including the ones where 'no change needed' is the answer and
why"). It is not permitted to be silently absent because the roadmap forgot it.

**On "derived from the schema files":** the enumeration script must read
`apps/supabase/supabase/schema/**`, not `apps/supabase/supabase/migrations/**`. The migrations tree
contains **four** `RETURNS TABLE` occurrences for these same three functions, because
`00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql:39` redefines `get_nominations`
(see `<facts>` F2). A migrations-scoped script would report four and double-count one RPC. The
schema tree is the authoring source of truth and is what criterion 1 names.

### D-M2 ⚠ DECIDE — The single override mechanism (criterion 3)

**Won by default (no tick, no free text): option (a).** This is the decision the whole phase hangs
on.

> **(a) A hand-maintained `database.overrides.ts` in `packages/supabase-types`, merged into the
> exported `Database` type, with the three RPC return shapes declared there** — ★ RECOMMENDED — it
> is one documented locus (the criterion's word), it survives `db:types` regeneration because
> regeneration only rewrites `database.ts`, and the barrel at `src/index.ts` already re-exports the
> merged type, so no consumer changes.

Rejected, with the operator-facing reasons recorded verbatim from the fill document:

- **(b) Restructure `get_nominations` to return `jsonb`** — "no type layer at all; loses
  column-level typing for the RPC entirely and pushes the parsing into the adapter that Phase 157
  just spent a phase cleaning."
- **(c) Post-process the `db:types` output in the `db:types` script** — "fully automatic; a codegen
  post-processor is invisible to anyone reading `database.ts` and breaks on the next Supabase CLI
  output change."

**Verified support for (a)'s survival claim (F5):** `packages/supabase-types/package.json:14` —
`"generate": "supabase gen types typescript --local --workdir ../../apps/supabase > src/database.ts && prettier --write src/database.ts"`.
The generator writes **only** `src/database.ts`. A sibling `src/database.overrides.ts` is therefore
untouched by regeneration. This is the mechanical basis for choosing (a) over (c), and it holds.

**⚠ One clause of (a)'s rationale is imprecise, and the planner must not act on it as written.**
"the barrel at `src/index.ts` already re-exports the merged type" is **not true today** — there is
no merged type yet. Measured, `packages/supabase-types/src/index.ts:1` is:

```ts
export type { CompositeTypes, Database, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database.js';
```

The barrel re-exports `Database` **straight out of `database.ts`**. Implementing (a) requires
editing that line (or introducing a `database.merged.ts` the barrel points at instead). What the
rationale gets right — and what matters — is the **consumer-facing** claim: every downstream import
is `from '@openvaa/supabase-types'`, so **no consumer changes**. Recorded here so the planner budgets
the one-line barrel change and does not report the criterion vacuously met.

**Criterion 3 has two halves; both are this decision's responsibility:**

1. The Phase-126 ad-hoc cast is **removed**. Its real location is
   `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts (cast was at :360, not :300; removed by 164-01)` —
   `const parentNominationId = row.parent_nomination_id as string | null | undefined;`
   **⚑ Note the path.** Both the roadmap and § 0 fact 32 write it as
   `apps/frontend/src/lib/api/adapters/supabase/supabaseDataProvider.ts (cast was at :360, not :300; removed by 164-01)`, omitting the
   `dataProvider/` directory segment. The line number (`:300`) is correct; the path is not.
2. A **grep for ad-hoc nullability casts on RPC returns comes back empty.** The planner must define
   that grep's shape before running it — see `<open>` O-2. Naïvely grepping `as .* | null` in the
   adapter returns ~30 hits, almost all of which are Phase-157-owned `Json`→domain-type casts on
   JSONB columns, not nullability casts on RPC scalar returns. Conflating the two makes this
   criterion either unsatisfiable here or falsely satisfied.

### D-M3 — Proving regeneration does not silently revert (criterion 4)

**Won by default (no tick, no free text): option (a).**

> **(a) A CI job that runs `yarn db:types` and fails if the working tree changes** — ★ RECOMMENDED
> — catches both the reversion and the ordinary "someone forgot to regenerate" drift, in the gate
> rather than in a reviewer's head.

Rejected: **(b)** a type-level unit test asserting `parent_nomination_id` is nullable at the
consumer — "cheaper and closer to the guarantee; passes happily if the override file is deleted and
the assertion is rewritten with it." **(c)** both — "the CI job subsumes the type test's coverage,
so the second is redundant maintenance."

**⚠⚠ FILE-LEVEL COLLISION WITH PHASE 163 — flagged because M3(a) is a CI change.** The winning
option adds a job to `.github/workflows/main.yaml`, which is **exactly Phase 163's deliverable
surface**: 163 adds a `db:lint:sql` job, a secret-scan job and a dependency-audit job to the same
file (roadmap Phase 163 criteria 1, 3, 4; § 0 fact 33). **Phases 163 and 164 must not be executed
concurrently without coordination** — two agents editing `main.yaml`'s `jobs:` block in parallel
will conflict. Recommended sequencing for the executor: run 163 first and let 164 add its job to the
settled file, or execute them serially in either order — but never in the same wave.

**Measured facts that shape the M3(a) implementation (F6):**

- `yarn db:types` → `yarn workspace @openvaa/supabase-types generate` → `supabase gen types
  typescript **--local**`. It requires a **running local Supabase**. A CI job implementing M3(a)
  must therefore `supabase start` (and stop) — it is not a cheap lint-shaped step.
- The existing **`supabase-tests` job** (`.github/workflows/main.yaml:106-138`) already does
  `supabase/setup-cli@v1` → `supabase start` → `supabase test db` → `supabase stop`, and its
  `dorny/paths-filter` already watches `apps/supabase/**` and `packages/supabase-types/**`
  (`:116-118`). It is the obvious host.
- **But** that job's every step is `if: steps.changes.outputs.supabase == 'true'`. A drift check
  placed behind that filter **does not run** when neither path changed. The file's own comment at
  `:158-160` (on `dev-seed-integration`) states the project's position on precisely this: "There is
  deliberately NO `paths-filter` here … a conditional guard is how F5 happened in the first place."
  The planner must decide explicitly — reuse `supabase-tests` and accept the filter, or add an
  unfiltered job — and record the choice. See `<open>` O-3.
- The generate script pipes through `prettier --write src/database.ts`, so a
  "regenerate → `git diff --exit-code`" check is not defeated by formatting noise.

**Criterion 2 is adjacent to M3 and is not covered by any M decision.** It requires
`parent_nomination_id` to read as `string | null` at the consumer **and** a root nomination (value
IS null) to be exercised by a test that **fails if the null-guard is removed**. Measured (F7): the
fixture half already exists — `supabaseDataProvider.test.ts:1507` (`orgNomRow`) has
`parent_nomination_id: null`, and `:1464` / `:1485` carry the non-null child rows. What does **not**
exist is the proof that removing the guard reddens the suite. That negative control is this phase's
work, and it is the milestone's standing acceptance rule (prove the guard fails before claiming it
guards). See `<open>` O-1.

### Cross-cutting decisions inherited by this phase

- **D-N0 (§ 0.1, option (c) — TICKED, the only ticked box reaching this phase):** "Also correct
  `.planning/ROADMAP.md:1003-1217` in place — the nine ⚑ rows are edited into the phase entries now,
  so the roadmap stops carrying false premises." **This has already been applied to the Phase 164
  entry**: it now carries a "**Corrected 2026-08-28** … fact 31" note and criterion 1 names all
  three RPCs including `resolve_email_variables`. Roadmap and fact 31 therefore **agree** as of this
  reading — the one place they still disagree is `**Depends on**: Nothing` (see `<open>` O-4). Per
  the task's standing rule: **where the roadmap and a § 0 fact disagree, the fact wins.**
- **D-N1 (default, (a)):** Phase 152 stays first and lands its comment-hygiene scan in
  `yarn lint:check`. **Consequence for 164:** any comment this phase writes — in
  `database.overrides.ts`, in the enumeration script, in the CI job — is authored **after** the
  purge and **under** the enforced convention. No `.planning/**` references in source comments.
- **D-N2 (default, (a)):** follow-up items are filed as `.planning/todos/pending/` entries during
  the owning phase. Anything this phase declines (e.g. a nullable column dispositioned "no change
  needed" that later proves wrong) is filed there, not left in a comment.
- **D-N3 (default, (a)):** one `<padded>-CONTEXT.md` per phase generated from the shared decision
  document, plus a shared `<padded>-DISCUSSION-LOG.md` pointing back to it. **This file is the
  CONTEXT half.** The `164-DISCUSSION-LOG.md` pointer was out of scope for the task that produced
  this file — see `<open>` O-6.

### Claude's Discretion

- Language and location of the enumeration script (M1(a)) — a Node script under `.claude/scripts/`
  alongside `audit-skill-drift.sh`, a `scripts/` entry, or a vitest-hosted assertion — provided it
  reads `apps/supabase/supabase/schema/**` and its output is committed.
- Exact shape of the type merge in `packages/supabase-types` (`database.overrides.ts` +
  `database.merged.ts`, or an inline `Omit`/`&` in the barrel), provided there is exactly **one**
  documented locus and consumers still import `Database` from `@openvaa/supabase-types`.
- Which of the semantically-nullable columns beyond `parent_nomination_id` are overridden versus
  dispositioned "no change needed" — provided every one in the F3/F4 tables gets a written
  disposition.
- The exact CI job name and whether it is a new job or a step in `supabase-tests`, subject to O-3.


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-M1:** Is the enumeration exactly three RPCs, and how is it produced
- **D-M2:** The single override mechanism (criterion 3)
- **D-M3:** Proving regeneration does not silently revert (criterion 4)

</decisions>

<facts>
## Measured Facts (re-verified this session, 2026-08-28, HEAD `e1ab15f71`)

Every line number below was measured by this agent, not carried over. Where the fill document or
the roadmap differs, the difference is stated.

### F1 — `RETURNS TABLE` count: my own count agrees with fact 31 (three RPCs), with one path caveat

`grep -rni "returns table" --include="*.sql"` over the whole repo (excluding `node_modules`) returns
**7 raw occurrences across 4 files**, resolving to **3 distinct RPCs**:

| File:line | Function | Tree |
|---|---|---|
| `apps/supabase/supabase/schema/502-email-helpers.sql:27` | `resolve_email_variables` (def at `:22`) | schema — **authoritative** |
| `apps/supabase/supabase/schema/503-entity-rpcs.sql:16` | `get_nominations` (def at `:11`) | schema — **authoritative** |
| `apps/supabase/supabase/schema/503-entity-rpcs.sql:100` | `get_candidate_user_data` (def at `:97`) | schema — **authoritative** |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql:2967` | `resolve_email_variables` (def at `:2962`) | migrations — duplicate |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql:3113` | `get_nominations` (def at `:3108`) | migrations — duplicate |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql:3190` | `get_candidate_user_data` (def at `:3187`) | migrations — duplicate |
| `apps/supabase/supabase/migrations/00002_…_rls_guard.sql:44` | `get_nominations` (def at `:39`) | migrations — **re**definition |

**Fact 31's three schema-tree line numbers (`502:22`, `503:11`, `503:97`) are correct** — they cite
the `CREATE OR REPLACE FUNCTION` line, not the `RETURNS TABLE` line (`:27`, `:16`, `:100`). Both
sets are given above so the enumeration script can be written against either.

### F2 — The migrations tree carries a *fourth* occurrence, and it is a redefinition

`00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql:39` redefines `get_nominations`.
Diffed against `schema/503-entity-rpcs.sql:11-92`, the two bodies are identical **except** that the
schema copy carries six extra comment lines (the `260524-l1t D7` SECURITY-INVOKER/RLS explanation)
and the migration copy ends with `COMMIT;`. Column list and nullability semantics are identical, so
the generated types are unaffected — but the enumeration script must be schema-scoped or it will
double-count (D-M1).

### F3 — Fact 32 verified exactly: the defect is real, and both cited line numbers are right

- `packages/supabase-types/src/database.ts:1226` — `parent_nomination_id: string;` inside
  `Functions.get_nominations.Returns` ✅ **exact**
- `packages/supabase-types/src/database.ts:705` — `parent_nomination_id: string | null;` inside
  `Tables.nominations.Row` ✅ **exact**
- The ad-hoc cast: `row.parent_nomination_id as string | null | undefined` at **line 300** of
  `apps/frontend/src/lib/api/adapters/supabase/**dataProvider/**supabaseDataProvider.ts`.
  **Line correct; path in fact 32 and in the roadmap omits the `dataProvider/` segment.**

### F4 — The defect is not one column. Every scalar column of all three RPC returns is declared non-null

Read from `packages/supabase-types/src/database.ts:1167-1281`. The generator declares **no** RPC
return column nullable. Semantically-nullable ones, cross-checked against the `nominations` table
Row block (`:688-712`) where applicable:

**`get_nominations` (`:1191-1229`)** — the four mutually-exclusive entity-id columns are the
sharpest case: at most one is ever non-null, yet all four are declared `string`.
`candidate_id` (table Row `:688` = `string | null`) · `organization_id` (`:704` = `string | null`) ·
`faction_id` (`:698` = `string | null`) · `alliance_id` (`:687` = `string | null`) ·
`parent_nomination_id` (`:705` = `string | null`) · `election_symbol` (`:692` = `string | null`) ·
`election_round` (`:691` = `number | null`) · `sort_order` / `subtype` (`:709`, `:710` =
`… | null`) · `entity_first_name`, `entity_last_name`, `entity_organization_id`, `entity_subtype`,
`entity_sort_order` (all null for an organization nomination — proven by the test fixture in F7,
which sets each of them to `null`).

**`get_candidate_user_data` (`:1167-1186`)** — `organization_id`, `first_name`, `last_name`,
`subtype`, `sort_order`, `terms_of_use_accepted` are all declared non-null and are all semantically
nullable.

**`resolve_email_variables` (`:1270-1281`)** — `email` and `preferred_locale` declared `string`;
both semantically nullable. **This is the RPC the roadmap did not name.**

`Json`-typed columns (`name`, `info`, `color`, `image`, `custom_data`, `answers`, `variables`, …)
are already nullable-by-type — `database.ts:1` defines `Json` as including `null`. That is the
measured basis for rejecting M1(b).

### F5 — `db:types` writes only `database.ts` (this is what makes M2(a) work)

`package.json:23` → `"db:types": "yarn workspace @openvaa/supabase-types generate"`
`packages/supabase-types/package.json:14` → `"generate": "supabase gen types typescript --local --workdir ../../apps/supabase > src/database.ts && prettier --write src/database.ts"`
`packages/supabase-types/src/` contains exactly `column-map.ts`, `database.ts`, `index.ts`.
`src/index.ts:1` re-exports `Database` **directly from `./database.js`** — the merged type M2(a)'s
rationale assumes already exists does **not** exist yet (see D-M2).

### F6 — CI surface as it stands (the M3(a) target, and the Phase-163 collision)

`.github/workflows/main.yaml` — 383 lines, 4 jobs: `skill-drift-check` (`:25`),
`frontend-and-shared-module-validation` (`:36`, runs `yarn format:check` at `:64`),
`supabase-tests` (`:106`), `dev-seed-integration` (`:163`). **No `db:types` check, no
`db:lint:sql` job, no secret scan, no dependency audit exist** (agrees with § 0 fact 33).
`supabase-tests` already runs `supabase start` / `supabase test db` / `supabase stop`, gated by a
`dorny/paths-filter` on `apps/supabase/**` + `packages/supabase-types/**` (`:116-118`).

### F7 — Criterion 2's fixture half already exists; its proof half does not

`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`:
`:1464` and `:1485` — child nominations with `parent_nomination_id: 'n3'`; **`:1507`** — `orgNomRow`,
a **root** nomination with `parent_nomination_id: null` (and `candidate_id`, `faction_id`,
`alliance_id`, `entity_first_name`, `entity_last_name`, `entity_organization_id` all `null`). The
guard under test is at `supabaseDataProvider.ts (root-nomination guard; anchor by content)`. No test currently demonstrates that
deleting the guard reddens the suite.

### F8 — The `:300` cast's surrounding intent (do not remove the behaviour with the cast)

`supabaseDataProvider.ts:282-320` — the `parent_nomination_id` read feeds a `nominationTypeById`
lookup that populates `parentNominationType`, because
`packages/data/src/objects/nominations/base/nomination.ts:38-45` throws if `parentNominationId` is
set without a matching `parentNominationType`. Removing the **cast** must not disturb the
`parentNominationId != null` guard at `:301` or the `?? null` at `:317` — those are the live
behaviour criterion 2 requires proven.

</facts>

<open>
## Open Questions & Uncovered Requirements

- **O-1 — Criterion 2 has no owning decision.** M1–M3 cover criteria 1, 3 and 4. Criterion 2 ("a
  root nomination is exercised by a test that **fails if the null-guard is removed**") is
  uncovered by any filled decision. The fixture exists (F7); the *mutation proof* does not. The
  planner must choose the form: a temporary guard-removal run recorded as evidence (the
  `137-NEGATIVE-CONTROL.md` precedent), or a committed test that pins the behaviour. Flagged
  because the milestone carries a standing rule that a guard is not claimed until it has been
  shown to fail.

- **O-2 — Criterion 3's grep is undefined, and the naïve version is wrong.** "a grep for ad-hoc
  nullability casts on RPC returns comes back empty" needs a written pattern before it can be run.
  Measured, `grep " as .*| null"` over `apps/frontend/src/lib/api/adapters/supabase/` returns ~30
  hits, of which the great majority are `Json`→domain-type casts (`:106`, `:108`, `:110`, `:162`,
  `:196`, `:220`, `:333`, `:376`, `:378`, `:484`, `:486`, `:517`) that belong to **Phase 157**, and
  a further block (`:368-374`) that casts an already-mapped `entityObj`, not a raw RPC column. Only
  `:300` is an RPC-return nullability cast. The planner must state the pattern's scope (RPC-return
  scalar columns only) so the criterion is neither falsely satisfied nor made to swallow 157's work.

- **O-3 — Where the M3(a) job lives, given the paths-filter trap.** Reusing `supabase-tests`
  (`main.yaml:106`) is cheap — it already starts Supabase — but every step there is conditional on
  `dorny/paths-filter`, so the drift check would not run for changes outside `apps/supabase/**` and
  `packages/supabase-types/**`. The file's own `dev-seed-integration` comment (`:158-160`) records
  the project's stance that "a conditional guard is how F5 happened in the first place". Decide and
  record: accept the filter (arguing that types can only drift when those paths change) or add an
  unfiltered job and pay a second `supabase start`.

- **O-4 — `Depends on: Nothing` is understated; two upstream phases touch this phase's surface.**
  The roadmap's Phase 164 entry says `**Depends on**: Nothing`. Measured, that is wrong in two ways,
  and a planner should assume **164 runs after 156 and 157**, or plan explicitly for a merge:

  - **Phase 156 (Supabase Schema Corrections)** rewrites migrations *and* schema and renames
    `party` → `organization` throughout (`ROADMAP.md` Phase 156 criterion 1; § 0 fact 15: 17 schema
    + 17 migration + 84 dev-seed + 5 frontend sites), then observes `yarn db:reset-with-data` end to
    end — which means **`packages/supabase-types` is regenerated**. If 164's override mechanism is a
    generated-types override (and per D-M2 it is), **156's regeneration is precisely the event that
    must not silently revert it**. Running 164 first means its override must survive a large,
    imminent, known regeneration; running 164 after 156 means it is written against the settled
    column names. 156 also touches `503-entity-rpcs.sql` directly (its criterion 6, at `:147`) —
    the same file as two of 164's three RPCs.
  - **Phase 157 (Adapter Boundary & Typing)** removes typecasts at
    `supabaseDataProvider.ts:60`, `:92`, `:361`, `:511` and validates JSONB on read (its criterion
    1). **164 removes the cast at `:300` in the same file.** Same-file collision: both phases edit
    `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`, and 157's
    criterion 1 ends with "A grep for casts on adapter reads returns empty", which overlaps 164's
    criterion 3 grep (see O-2). Do not execute 157 and 164 in the same wave. 157 also depends on
    156, which orders the whole chain 156 → 157 → 164.

  Recorded here rather than fixed: **this file must not edit `ROADMAP.md`.** A separate correction
  to the Phase 164 entry's `Depends on:` line is warranted under the D-N0 (§ 0.1 (c)) instruction.

- **O-5 — Phase 163 shares `main.yaml`'s `jobs:` block** (restated from D-M3 so it is not lost):
  163 adds three jobs to `.github/workflows/main.yaml`; 164's M3(a) adds a fourth. The roadmap gives
  neither a dependency on the other and both say `Depends on: Nothing`. **Do not run 163 and 164
  concurrently.**

- **O-6 — The `164-DISCUSSION-LOG.md` pointer file required by D-N3(a) has not been written.**
  N3(a) specifies "one `<padded>-CONTEXT.md` per phase … plus a shared `<padded>-DISCUSSION-LOG.md`
  pointer back here". Only the CONTEXT half exists. Until it does, the canonical pointer is:
  `.planning/v2.15-DISCUSSION-POINTS.md` § M (lines 829-869) and § N (lines 871-905).

*(An earlier draft listed `alliance_id` as unverified. It has since been read directly:
`packages/supabase-types/src/database.ts:687` — `alliance_id: string | null` on
`Tables.nominations.Row`, against `string` on the RPC return at `:1192`. All four
mutually-exclusive entity-id columns in F4 are now measured, not inferred. No open item remains.)*

## Canonical References

- `.planning/v2.15-DISCUSSION-POINTS.md` — § "How to read / fill" (`:11-29`, the checkbox
  semantics), § 0 facts **31** and **32**, § 0.1 (the one ticked box), § **M** (`:829-869`),
  § **N** (`:871-905`). **The primary input for this phase.**
- `.planning/ROADMAP.md` § "Phase 164" — the four success criteria verbatim, already carrying the
  fact-31 correction.
- `.planning/REQUIREMENTS.md:78-79` — CIGATE-04, CIGATE-05. (Note `:164-165` and `:185` still map
  these to "Phase 150", the pre-renumber id.)
- `apps/supabase/supabase/schema/502-email-helpers.sql:22-31` and
  `apps/supabase/supabase/schema/503-entity-rpcs.sql:11-16`, `:97-100` — the three RPCs.
- `packages/supabase-types/src/database.ts:1167-1281` (the three RPC return types), `:688-712`
  (the `nominations` table Row, the ground truth for nullability), `:1` (the `Json` definition).
- `packages/supabase-types/src/index.ts` and `packages/supabase-types/package.json:14` — the barrel
  and the generate script (F5).
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:282-320` — the
  cast, its guard, and the invariant it serves (F8).
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts:1444-1520`
  — the existing nomination fixtures (F7).
- `.github/workflows/main.yaml:106-161` — `supabase-tests` and the `dev-seed-integration`
  paths-filter comment (F6, O-3).
- `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-CONTEXT.md` — the
  house format and rigour bar this file is written to.

</open>

---

*Phase: 164-returns-table-nullability-audit-single-override-mechanism*
*Context gathered: 2026-08-28*