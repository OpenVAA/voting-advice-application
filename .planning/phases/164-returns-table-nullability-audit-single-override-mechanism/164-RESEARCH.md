# Phase 164: `RETURNS TABLE` Nullability — Audit + Single Override Mechanism — Research

**Researched:** 2026-08-28
**Domain:** TypeScript type-layer design over Supabase-generated types; PostgreSQL `RETURNS TABLE`
nullability semantics; repo-static assertion scripts; GitHub Actions drift gates
**Confidence:** HIGH (every line number below was opened with `Read`/`sed` in this session on branch
`integration/ship-12-squash`, HEAD `e1ab15f71`; the two claims that could not be executed read-only
are marked **UNVERIFIED** and named as such)

---

<user_constraints>

## User Constraints (from `164-CONTEXT.md`)

### Locked Decisions

- **D-M1 (a):** *Accept 3 as the complete set; generate the enumeration by script from the schema
  files so a future RPC cannot be missed.* The script must read `apps/supabase/supabase/schema/**`,
  **not** `apps/supabase/supabase/migrations/**` — the migrations tree redefines `get_nominations`
  at `00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql:39`, so an unscoped scan
  double-counts. `resolve_email_variables` **must** be enumerated and dispositioned like the other
  two; "no change needed" is allowed **only if written down with its reason**.
  Rejected: (b) also enumerating `RETURNS jsonb` / `RETURNS SETOF` functions.
- **D-M2 (a):** *A hand-maintained `database.overrides.ts` in `packages/supabase-types`, merged into
  the exported `Database` type, with the three RPC return shapes declared there.* Exactly **one**
  documented locus; consumers keep importing `Database` from `@openvaa/supabase-types`.
  Rejected: (b) restructuring `get_nominations` to return `jsonb`; (c) post-processing the
  `db:types` output inside the `db:types` script.
- **D-M3 (a):** *A CI job that runs `yarn db:types` and fails if the working tree changes.*
  Rejected: (b) a type-level unit test alone; (c) both.
- **D-N0 (§ 0.1 (c), the only ticked box):** the ROADMAP's nine ⚑ rows are edited in place. Already
  applied to the Phase 164 entry.
- **D-N1 (a):** Phase 152 lands its comment-hygiene scan in `yarn lint:check` first. Every comment
  this phase writes is authored **under** that convention — **no `.planning/**` references in source
  comments.**
- **D-N2 (a):** follow-ups are filed as `.planning/todos/pending/` entries during this phase, not
  left in comments. (Directory confirmed present: `.planning/todos/pending/`.)
- **D-N3 (a):** one `<padded>-CONTEXT.md` per phase plus a shared `<padded>-DISCUSSION-LOG.md`
  pointer.

### Claude's Discretion

- Language and location of the enumeration script — `.claude/scripts/`, `scripts/`, or a
  vitest-hosted assertion — provided it reads `apps/supabase/supabase/schema/**` and its output is
  committed.
- Exact shape of the type merge (`database.overrides.ts` + `database.merged.ts`, or an inline
  `Omit`/`&` in the barrel), provided there is **one** documented locus and consumers still import
  `Database` from `@openvaa/supabase-types`.
- Which semantically-nullable columns beyond `parent_nomination_id` are overridden versus
  dispositioned "no change needed" — provided **every** one gets a written disposition.
- The exact CI job name and whether it is a new job or a step in `supabase-tests`, subject to O-3.

### Deferred Ideas (OUT OF SCOPE)

- `RETURNS jsonb` / `RETURNS SETOF` / scalar-returning functions — `Json` already includes `null`.
- The `Json`→domain-type casts in `supabaseDataProvider.ts` (`:106`, `:162`, `:376`, `:378`, `:484`,
  `:517`, …) — **Phase 157's** validated-JSONB work.
- Changing any RPC's SQL body or column list.
- The `party` → `organization` rename — **Phase 156**.

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description (`.planning/REQUIREMENTS.md`) | Research Support |
|----|-------------------------------------------|------------------|
| **CIGATE-04** (`:78`) | Every `RETURNS TABLE` RPC is enumerated against its semantically-nullable output columns … with a **recorded remedy chosen per RPC**. | **R1** (the derivation script + committed artifact) and **R2** (the full per-column disposition table for all three RPCs, evidence-cited to SQL body / table Row) |
| **CIGATE-05** (`:79`) | Consumers of nullable RPC columns keep their null-guards without TypeScript flagging them as dead code — either through a single documented type-override layer or a restructured RPC, not scattered ad-hoc casts. | **R3** (the exact merge TypeScript), **R4** (the guard proven live), **R5** (the discriminating grep that returns empty) |

</phase_requirements>

---

## Summary

The phase is smaller and sharper than the roadmap makes it sound, and one measurement changes its
shape decisively: **`resolve_email_variables` needs no override at all, and its SQL body proves it.**
Its `email` column cannot be null in an emitted row because the loop `CONTINUE`s on a null email
(`502-email-helpers.sql:64-66`) before `RETURN NEXT` (`:148`), and `preferred_locale` is
`COALESCE(au.raw_user_meta_data->>'preferred_locale', 'en')` (`:59`) — a coalesce to a literal. The
CONTEXT's F4 supposition that both are "semantically nullable" reasons from the *source* columns
(`auth.users.email` is nullable) rather than from the *output* columns, and the output is what the
type describes. So the third RPC gets the textbook "no change needed, and here is why" disposition
that criterion 1 explicitly permits — backed by two line citations rather than by an omission.

Conversely, **`get_candidate_user_data` is a stronger case than the roadmap implies**: its
organization branch selects literal `NULL::timestamptz, NULL::text, NULL::text, NULL::uuid`
(`503-entity-rpcs.sql:131-132`) for `terms_of_use_accepted`, `first_name`, `last_name` and
`organization_id`. Those four are null *by construction* on every organization row, yet
`candidates.first_name` / `.last_name` are `NOT NULL` in the table (`database.ts:229`, `:234`) — so a
planner reasoning from the table Row alone would wrongly mark them non-nullable. The SQL body, not
the table, is the source of truth for an RPC's output nullability, and the enumeration artifact must
record which of the two it used per column.

The three highest-leverage findings for the plan are structural, not semantic. **(1)
`packages/supabase-types` has no `typecheck` script** (measured against all 15 workspaces: it and
`shared-config` and `apps/supabase` are the only three without one), so `turbo run typecheck` skips
the package entirely — an override file placed there is *not typechecked today*, which silently
defeats the "renamed column breaks loudly" property Phase 156 makes urgent. **(2) The generated
helper types `Tables`/`TablesInsert`/`TablesUpdate`/`Enums`/`CompositeTypes` are not generic over
`Database`** — they close over the module-local one via `DatabaseWithoutInternals` (`database.ts:1321`)
and `DefaultSchema` (`:1323`) — but because this phase's override touches **only** `Functions`, and
those helpers touch only `Tables`/`Views`/`Enums`/`CompositeTypes`, they are provably unaffected and
may keep re-exporting from `./database.js`. **(3) `packages/supabase-types/tsconfig.tsbuildinfo` is a
tracked, non-gitignored file** (`git ls-files` confirms; no `.gitignore` entry) — running `tsc` in
that workspace dirties the working tree, so the M3(a) `git diff --exit-code` **must** be path-scoped
to `packages/supabase-types/src/database.ts` or it will produce false reds.

**Primary recommendation:** build **one** Node script, `scripts/assert-rpc-return-nullability.mjs`,
following the house `scripts/assert-*.mjs` pattern (three siblings exist, wired through root
`package.json` `assert:*` scripts into `test:unit` and `lint:check`). It parses
`apps/supabase/supabase/schema/**/*.sql` for `RETURNS TABLE`, writes the committed enumeration
artifact, cross-checks it against the override file's declared keys, and greps the tree for
ad-hoc nullability casts on exactly those column names — satisfying criteria 1 and 3 with a single
standing instrument that also catches a future fourth RPC. Host the M3(a) drift job in
`dev-seed-integration`'s mould (a new, **unfiltered** job), not in `supabase-tests` — which,
measured, has no `setup-node`, no Yarn setup and no `yarn install` at all and therefore cannot run
`yarn db:types` without becoming a different job.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Truth about output nullability | Database / SQL (`apps/supabase/supabase/schema/**`) | — | The `RETURNS TABLE` declaration + function body are the only authority; the table Row is a proxy that is *wrong* for `get_candidate_user_data` (`503:131-132`) |
| Type-level restoration of that truth | Shared package (`packages/supabase-types`) | — | D-M2(a); one locus, consumed via `SupabaseClient<Database>` so it reaches every `.rpc()` call automatically |
| Null-guard behaviour | API adapter (`apps/frontend/src/lib/api/adapters/supabase/`) | Data package (`packages/data`) | `supabaseDataProvider.ts:301-302` guards; `nomination.ts:39-45` is the invariant it serves |
| Enumeration + cast-grep enforcement | Repo-root static script (`scripts/`) | CI (`.github/workflows/main.yaml`) | Same tier as `assert-unit-test-coverage.mjs` / `assert-a11y-scan-wiring.mjs`; runs locally *and* in CI via the `lint:check` / `test:unit` chains |
| Regeneration-drift detection | CI (`.github/workflows/main.yaml`) | — | D-M3(a); requires a live `supabase start`, so it cannot be a local-only lint |

---

## R1 — The enumeration script: shape, host, wiring, and where its output lives

### What already exists to host it (measured)

| Candidate host | Evidence | Verdict |
|---|---|---|
| `scripts/*.mjs` + root `assert:*` script | `scripts/assert-unit-test-coverage.mjs` (44,731 B), `scripts/assert-i18n-catalog-namespaces.mjs` (7,045 B), `scripts/assert-a11y-scan-wiring.mjs` (11,514 B); wired at `package.json:25-27` as `assert:unit-coverage` / `assert:i18n-catalog-namespaces` / `assert:a11y-scan-wiring`; consumed by `test:unit` (`:28`) and `test:e2e` (`:31`) and `lint:check` (`:36`) | ✅ **RECOMMEND** |
| `.claude/scripts/` | Contains exactly one file, `audit-skill-drift.sh` (3,394 B), run by the `skill-drift-check` job at `main.yaml:33-34` | ❌ agent-tooling namespace; a product-schema guard does not belong there |
| vitest-hosted assertion | `packages/dev-seed/tests/ciTypecheckGate.test.ts` (88 lines) reads repo-root files from `REPO_ROOT` (`:40`) and asserts `main.yaml` + root `package.json` contents textually | ✅ **RECOMMEND as a companion**, not as the primary |

**Recommendation: both, with one owning the derivation.**

1. **`scripts/assert-rpc-return-nullability.mjs`** — the derivation and the gate. Node built-ins
   only (the house style; `assert-a11y-scan-wiring.mjs:44-45` states "plain text/regex read … matching
   the house style of `scripts/assert-unit-test-coverage.mjs` (Node built-ins…)"). No SQL parser is a
   repo dependency and adding one to read three function signatures would be a worse trade — the
   same reasoning `ciTypecheckGate.test.ts:28-30` records for not adding a YAML parser.
2. **A vitest companion** in `packages/dev-seed/tests/` (the established home for repo-meta specs:
   `assertKnownRowProps.test.ts` and `permittedKeys.test.ts` already parse
   `apps/supabase/supabase/schema/501-bulk-operations.sql` from `REPO_ROOT`, per
   `ciTypecheckGate.test.ts:22-24`) that asserts the script is still a link of the `lint:check` chain
   and that the CI drift job still exists. This is the anti-vacuity half — without it, deleting the
   `assert:` link from `package.json` silently disarms criterion 1.

### Parsing shape

Scope: `apps/supabase/supabase/schema/**/*.sql` (D-M1(a) — **mandatory**; the migrations tree yields
4 occurrences for 3 RPCs, verified: `00001_initial_schema.sql:2967`, `:3113`, `:3190` and
`00002_…_rls_guard.sql:44`).

A regex over the schema tree suffices because the authoring style is uniform — measured, all three
declarations are `CREATE OR REPLACE FUNCTION public.<name>(` … `RETURNS TABLE (` … `)` with one
`<col> <type>,` per line:

```
CREATE OR REPLACE FUNCTION  →  502-email-helpers.sql:22 · 503-entity-rpcs.sql:11 · 503-entity-rpcs.sql:97
RETURNS TABLE (             →  502-email-helpers.sql:27 · 503-entity-rpcs.sql:16 · 503-entity-rpcs.sql:100
```

Algorithm (≈60 lines):

1. Walk `apps/supabase/supabase/schema/` for `*.sql`.
2. For each `RETURNS TABLE (` occurrence, scan **backwards** to the nearest
   `CREATE OR REPLACE FUNCTION public.<name>(` → capture name + its line.
3. Scan **forwards** from `RETURNS TABLE (` to the matching `)` at column 0, splitting each
   intervening line on the first whitespace run → `[column, sqlType]`.
4. Emit `{ rpc, defLine, returnsTableLine, file, columns: [{ name, sqlType }] }`.
5. **Assert the set equals the committed enumeration's set.** A 4th RPC — or a new column on an
   existing one — makes the assertion fail with a message naming the new item and pointing at the
   enumeration artifact. *This is the "so a future RPC is not missed" clause of criterion 1, and it
   is the only part of it a script can actually deliver.*
6. Run the criterion-3 grep over the harvested column names (see **R5**) and fail on any hit.
7. Cross-check the override file's declared column keys against the harvested set (belt-and-braces
   with the type-level constraint in **R3**).

### Where the committed OUTPUT lives

Criterion 1 requires the enumeration to be a **readable committed artifact**, and D-M1(a) requires it
be *derived*. These are two different files and the plan must budget both:

| Artifact | Path | Content | Who writes it |
|---|---|---|---|
| The derivation | `scripts/assert-rpc-return-nullability.mjs` | the parser + the three assertions | authored by hand |
| The enumeration | `packages/supabase-types/RPC-NULLABILITY.md` | the three tables from **R2** — one row per output column: name, SQL type, generated TS type, semantically nullable Y/N, **evidence** (schema line or `database.ts` line), **disposition** (override / no change + reason) | regenerated by the script's `--write` mode, committed, diffed by the script's default mode |

**Why `packages/supabase-types/` and not `.planning/`:** D-N1 forbids `.planning/**` references in
source comments, and the override file must point a reader at the enumeration. Colocating the
artifact with the override keeps that pointer in-tree and legal. It is also where the next
consumer will look.

### Wiring so a 4th RPC is actually caught

Both, and for different failure modes:

- **`yarn lint:check`** — append `&& yarn assert:rpc-nullability`. The precedent is exact:
  `lint:check` already chains `yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring`
  (`package.json:36`). ⚠ `packages/dev-seed/tests/ciTypecheckGate.test.ts:83-86` asserts the chain's
  **membership** (not terminal position — `:78-82` records that asserting `endsWith` broke when
  Phase 147 appended its guards). **Appending is therefore safe and requires no edit to that test.**
- **CI** — `lint:check` runs inside `frontend-and-shared-module-validation` (`main.yaml:36-105`), so
  the gate reaches CI for free. No new job needed for criteria 1 and 3.

---

## R2 — Disposition of all three RPCs

**Governing rule discovered this session:** for a `RETURNS TABLE` RPC, the **function body** — not
the underlying table's Row type — decides output nullability. Two measured cases prove it in
opposite directions:

- `resolve_email_variables.email` — source column `auth.users.email` **is** nullable, output column
  is **not** (the `CONTINUE` at `:66`).
- `get_candidate_user_data.first_name` — source column `candidates.first_name` is `NOT NULL`
  (`database.ts:229`), output column **is** nullable (the `NULL::text` at `503-entity-rpcs.sql:132`).

Every "evidence" cell below names which of the two was used.

### 2a. `resolve_email_variables` — `502-email-helpers.sql:22` (`RETURNS TABLE` at `:27`), 4 columns

| # | Column | SQL type (`:28-31`) | Generated TS (`database.ts:1270-1281`) | Semantically nullable? | Evidence | **Disposition** |
|---|---|---|---|---|---|---|
| 1 | `user_id` | `uuid` | `string` | **No** | `:145` region — assigned `uid`, the `FOREACH` loop variable over the non-null `p_user_ids uuid[]` | **No change needed** — a loop variable over an array of non-null uuids |
| 2 | `email` | `text` | `string` | **No** | `502-email-helpers.sql:64-66` — `IF u_email IS NULL THEN … CONTINUE;` runs **before** `email := u_email` (`:145`) and `RETURN NEXT` (`:148`). A row with a null email is never emitted. | **No change needed — the body filters it.** ⚠ This CORRECTS `164-CONTEXT.md` § F4, which calls it nullable by reasoning from `auth.users.email`. |
| 3 | `preferred_locale` | `text` | `string` | **No** | `:59` — `COALESCE(au.raw_user_meta_data->>'preferred_locale', 'en')` into `u_locale`, assigned at `:146`. A coalesce to a string literal cannot be null. | **No change needed — the body coalesces it.** ⚠ Same correction. |
| 4 | `variables` | `jsonb` | `Json` | n/a | `database.ts:1` — `Json` already includes `null` | **No change needed** — nullable by type; this is the D-M1(b) rejection rationale |

**Whole-RPC disposition: NO OVERRIDE. Reason recorded, per criterion 1's explicit allowance.**

Consumer check (grepped this session): the only caller is the Deno Edge Function
`apps/supabase/supabase/functions/send-email/index.ts:134`, which imports
`createClient` from `https://esm.sh/@supabase/supabase-js@2` (`:1`) and **does not import
`@openvaa/supabase-types` at all** (`grep -n "supabase-types\|import "` returns only two `import`
lines, neither of them the types package). Its `recipient.preferred_locale` read (`:170`) and
`recipient.email` are therefore untyped by our `Database` regardless of what the override says —
a second, independent reason the override would buy nothing here. **This is worth one sentence in
the enumeration artifact**, because a future reader will otherwise assume the override reaches it.

> **File under D-N2:** `.planning/todos/pending/` — "the Deno edge functions do not consume
> `@openvaa/supabase-types`, so no type-level guarantee from `packages/supabase-types` reaches
> `apps/supabase/supabase/functions/**`." Out of scope here; real.

### 2b. `get_nominations` — `503-entity-rpcs.sql:11` (`RETURNS TABLE` at `:16`), 32 columns

Generated `Returns` at `database.ts:1191-1229`; `nominations` table Row at `database.ts:686-712`
(block opens `nominations: {` at `:685`).

⚠ **Two of `164-CONTEXT.md` § F4's citations drifted and are corrected here from a direct read:**
F4 gives `election_symbol (:692)` and `election_round (:691)`; measured, `:691` is `created_at` and
`:692` is `custom_data`. The correct lines are `election_round: number | null` at **`:694`** and
`election_symbol: string | null` at **`:695`**. Every other F4 citation for this table verified exact
(`alliance_id :687`, `candidate_id :688`, `faction_id :698`, `organization_id :704`,
`parent_nomination_id :705`, `sort_order :709`, `subtype :710`).

**Json-typed columns — 13, all "no change needed" (nullable by type, `database.ts:1`):**
`name`, `short_name`, `info`, `color`, `image`, `custom_data`, `entity_name`, `entity_short_name`,
`entity_info`, `entity_color`, `entity_image`, `entity_custom_data`, `entity_answers`.

**Scalar columns — 19, individually dispositioned:**

| # | Column | SQL type | Nullable? | Evidence | **Disposition** |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | No | `database.ts:699` `id: string` (PK) | no change |
| 2 | `sort_order` | `integer` | **Yes** | `database.ts:709` `sort_order: number \| null` | **OVERRIDE** |
| 3 | `subtype` | `text` | **Yes** | `database.ts:710` `subtype: string \| null` | **OVERRIDE** |
| 4 | `entity_type` | `public.entity_type` | No | `database.ts:696` non-null; enum values `'candidate' \| 'organization' \| 'faction' \| 'alliance'` (`database.ts:1302`, schema `000-enums.sql:16-18`) | no change |
| 5 | `candidate_id` | `uuid` | **Yes** | `database.ts:688` `\| null` | **OVERRIDE** (one of the four mutually exclusive) |
| 6 | `organization_id` | `uuid` | **Yes** | `database.ts:704` `\| null` | **OVERRIDE** |
| 7 | `faction_id` | `uuid` | **Yes** | `database.ts:698` `\| null` | **OVERRIDE** |
| 8 | `alliance_id` | `uuid` | **Yes** | `database.ts:687` `\| null` | **OVERRIDE** |
| 9 | `election_id` | `uuid` | No | `database.ts:693` `election_id: string` | no change |
| 10 | `constituency_id` | `uuid` | No | `database.ts:690` `constituency_id: string` | no change |
| 11 | `election_round` | `integer` | **Yes** | `database.ts:694` `\| null` | **OVERRIDE** |
| 12 | `election_symbol` | `text` | **Yes** | `database.ts:695` `\| null` | **OVERRIDE** |
| 13 | **`parent_nomination_id`** | `uuid` | **Yes** | `database.ts:705` `\| null` | **OVERRIDE — the criterion-2 column** |
| 14 | `entity_id` | `uuid` | **No** | SQL body: `:61` `COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id) AS entity_id` **and** the `WHERE` clause `:88` `AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` drops every row where no entity join resolved. | **no change — proven non-null by the WHERE clause.** A genuinely non-obvious disposition; record the reasoning, or the next reader will "fix" it. |
| 15 | `entity_sort_order` | `integer` | **Yes** | `COALESCE(c.sort_order, o.sort_order, f.sort_order, a.sort_order)` (`:66`) over nullable sources; `candidates.sort_order` `database.ts:240` `\| null` | **OVERRIDE** |
| 16 | `entity_subtype` | `text` | **Yes** | `:67` COALESCE over nullable sources; `candidates.subtype` `database.ts:241` `\| null` | **OVERRIDE** |
| 17 | `entity_first_name` | `text` | **Yes** | `:70` `c.first_name AS entity_first_name` through a `LEFT JOIN public.candidates c` (`:74`) — null on every organization/faction/alliance row. **Confirmed by fixture:** `supabaseDataProvider.test.ts:1516` `entity_first_name: null` on `orgNomRow`. | **OVERRIDE** |
| 18 | `entity_last_name` | `text` | **Yes** | `:71`, same LEFT JOIN; fixture `:1517` `entity_last_name: null` | **OVERRIDE** |
| 19 | `entity_organization_id` | `uuid` | **Yes** | `:72`, same LEFT JOIN **and** `candidates.organization_id` `database.ts:236` `\| null`; fixture `:1518` `entity_organization_id: null` | **OVERRIDE** |

**Whole-RPC disposition: 14 columns overridden, 5 dispositioned "no change needed."**

### 2c. `get_candidate_user_data` — `503-entity-rpcs.sql:97` (`RETURNS TABLE` at `:100`), 15 columns

Generated `Returns` at `database.ts:1167-1186`; `candidates` table Row at `database.ts:222-244`
(block opens `candidates: {` at `:221`).

**The decisive body fact:** the RPC is a `UNION ALL` of a candidate branch (`:124-129`) and an
organization branch (`:130-136`). The organization branch selects
`… o.custom_data, o.answers, NULL::timestamptz,` (`:131`) `NULL::text, NULL::text, NULL::uuid`
(`:132`) — positionally `terms_of_use_accepted`, `first_name`, `last_name`, `organization_id`.

**Json-typed — 6, no change:** `name`, `short_name`, `info`, `color`, `image`, `custom_data`,
plus `answers` (7 counting `answers`).

**Scalar columns — 8:**

| # | Column | SQL type | Nullable? | Evidence | **Disposition** |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | No | `database.ts:230` `id: string`; both branches select a PK | no change |
| 2 | `project_id` | `uuid` | No | `database.ts:237` `project_id: string`; both branches | no change |
| 3 | `sort_order` | `integer` | **Yes** | `database.ts:240` `\| null` | **OVERRIDE** |
| 4 | `subtype` | `text` | **Yes** | `database.ts:241` `\| null` | **OVERRIDE** |
| 5 | `terms_of_use_accepted` | `timestamptz` | **Yes** | `database.ts:242` `\| null` **and** `503-entity-rpcs.sql:131` `NULL::timestamptz` | **OVERRIDE** |
| 6 | `first_name` | `text` | **Yes** | ⚠ table says `NOT NULL` (`database.ts:229` `first_name: string`) — **the table is misleading here.** `503-entity-rpcs.sql:132` `NULL::text` makes the output nullable on every organization row. | **OVERRIDE — evidence is the SQL body, not the table** |
| 7 | `last_name` | `text` | **Yes** | ⚠ same: `database.ts:234` `last_name: string` is `NOT NULL`; `503-entity-rpcs.sql:132` `NULL::text` | **OVERRIDE — evidence is the SQL body** |
| 8 | `organization_id` | `uuid` | **Yes** | `database.ts:236` `\| null` **and** `503-entity-rpcs.sql:132` `NULL::uuid` | **OVERRIDE** |

**Whole-RPC disposition: 6 overridden, 2 dispositioned "no change needed."**

Consumer: `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:207` —
`.rpc('get_candidate_user_data', { p_entity_type: 'candidate' })`. ⚠ **Widening these six to
nullable may surface new type errors at that call site.** That is the *point* of the phase (a lie
becoming visible), but it is unplanned work if the plan does not budget it. **UNVERIFIED** whether
any error actually appears — proving it requires applying the override, which this read-only pass
must not do. Recommend the plan carry an explicit task: "apply override → run
`yarn workspace @openvaa/frontend check` → triage every new error as either a genuine missing guard
(add one) or a provably-unreachable branch (narrow it), never a re-cast."

---

## R3 — The `database.overrides.ts` merge, mechanically

### Measured facts about the generated file

| Fact | Evidence |
|---|---|
| `Json` includes `null` | `packages/supabase-types/src/database.ts:1` — `export type Json = string \| number \| boolean \| null \| { [key: string]: Json \| undefined } \| Json[];` |
| `Database` is a plain type alias, two schemas | `:3` `export type Database = {`, `graphql_public` at `:4`, `public` at `:29`, closes `:1319` |
| `public.Functions` block | `:1154-1299` |
| `Returns` **is** `{ … }[]` — an array of a record literal | `get_candidate_user_data` `Returns: {` at `:1169`, closes `}[];` at `:1185`; `get_nominations` `Returns: {` at `:1195`, closes `}[];` at `:1228` |
| The `Returns` record self-references `Database` | `entity_type: Database['public']['Enums']['entity_type']` at `:1216` — preserved by an `Omit`/`&` merge, since it resolves inside `database.ts` against the generated alias |
| No `__InternalSupabase` key exists | `Database`'s only members are `graphql_public` (`:4`) and `public` (`:29`), yet `:1321` Omits `'__InternalSupabase'` — harmless no-op |
| **Helper types are NOT generic over `Database`** | `:1321` `type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;` and `:1323` `type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];` — both close over the module-local `Database`. `Tables` (`:1325`), `TablesInsert` (`:1352`), `TablesUpdate` (`:1375`), `Enums` (`:1398`), `CompositeTypes` (`:1413`) are all parameterised only by *name*, never by a `Database` type parameter. |
| …but they only read `Tables`/`Views`/`Enums`/`CompositeTypes` | `Tables` resolves `(DefaultSchema['Tables'] & DefaultSchema['Views'])[…]['Row']` (`:1336-1349`); none of the five touches `Functions` |

**Therefore:** because this phase's override is confined to `Functions`, the five helper types are
**provably unaffected** and must keep being re-exported from `./database.js`. Re-pointing them would
be churn with no effect. *This answers the R3 sub-question directly: they are not generic over
`Database`, but the correct action is nonetheless to leave them alone — and to say so in a comment,
because "not generic" reads like a bug to the next reader.*

### Measured facts about the consumer surface

| Fact | Evidence |
|---|---|
| **No deep imports exist** | `grep -rn "@openvaa/supabase-types/"` across `*.ts` / `*.svelte` / `*.json` (excl. `node_modules`) → **0 hits.** Every one of the **49** importing files uses the bare barrel. |
| `Database` reaches `.rpc()` through the client generic | `apps/frontend/src/app.d.ts:12` `SupabaseClient<Database>`; `supabaseAdapter.type.ts:15`, `:23`; `supabaseAdapter.ts:28`, `:48`, `:57`; `lib/supabase/server.ts:11` `createServerClient<Database>` |
| The `get_nominations` result really is typed from `Returns` | `supabaseDataProvider.ts:259` `.rpc('get_nominations', {…})` → `:272` `const data = results.flatMap((r) => r.data ?? []);` → `:300` `row.parent_nomination_id`. **The override reaches the cast site.** |
| postgrest-js accepts an intersection-shaped function entry | `@supabase/postgrest-js@2.99.3`, `dist/index.d.mts:65-69` — `type GenericFunction = { Args: Record<string, unknown> \| never; Returns: unknown; SetofOptions?: GenericSetofOption; };` and `GenericSchema` (`:71-75`) requires `Tables`, `Views`, `Functions`. An `Omit<Fn,'Returns'> & { Returns: Array<Row> }` satisfies both and **preserves `SetofOptions`** — which a hand-written `{ Args; Returns }` literal would silently drop. |

### The exact TypeScript

**New file 1 — `packages/supabase-types/src/database.overrides.ts`**

```ts
import type { Database as GeneratedDatabase } from './database.js';

type GeneratedFunctions = GeneratedDatabase['public']['Functions'];

/** The element type of a `RETURNS TABLE` function's generated `Returns` array. */
type ReturnsRow<F extends keyof GeneratedFunctions> =
  GeneratedFunctions[F]['Returns'] extends ReadonlyArray<infer R> ? R : never;

/**
 * Widen the named columns of `F`'s return row to include `null`.
 *
 * `K extends keyof ReturnsRow<F>` is the load-bearing constraint: if a column is
 * renamed or dropped upstream, its name stops being assignable and this file is a
 * COMPILE ERROR rather than a key that quietly matches nothing.
 */
type Nullable<F extends keyof GeneratedFunctions, K extends keyof ReturnsRow<F>> = Omit<
  ReturnsRow<F>,
  K
> & { [P in K]: ReturnsRow<F>[P] | null };

/**
 * Rebuild one function entry around a new row type. `Omit<…, 'Returns'>` keeps
 * `Args` and any future postgrest-js member (e.g. `SetofOptions`) intact.
 */
type WithReturns<F extends keyof GeneratedFunctions, Row> = Omit<GeneratedFunctions[F], 'Returns'> & {
  Returns: Array<Row>;
};

export type FunctionReturnOverrides = {
  get_nominations: WithReturns<
    'get_nominations',
    Nullable<
      'get_nominations',
      | 'parent_nomination_id'
      | 'candidate_id'
      | 'organization_id'
      | 'faction_id'
      | 'alliance_id'
      | 'election_round'
      | 'election_symbol'
      | 'sort_order'
      | 'subtype'
      | 'entity_sort_order'
      | 'entity_subtype'
      | 'entity_first_name'
      | 'entity_last_name'
      | 'entity_organization_id'
    >
  >;
  get_candidate_user_data: WithReturns<
    'get_candidate_user_data',
    Nullable<
      'get_candidate_user_data',
      'organization_id' | 'first_name' | 'last_name' | 'subtype' | 'sort_order' | 'terms_of_use_accepted'
    >
  >;
};
```

`resolve_email_variables` is deliberately absent — its written disposition lives in
`RPC-NULLABILITY.md`, and a comment in this file must say so, or its absence reads as an oversight
(which is precisely how the roadmap came to omit it).

**New file 2 — `packages/supabase-types/src/database.merged.ts`**

```ts
import type { Database as GeneratedDatabase } from './database.js';
import type { FunctionReturnOverrides } from './database.overrides.js';

export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Functions'> & {
    Functions: Omit<GeneratedDatabase['public']['Functions'], keyof FunctionReturnOverrides> &
      FunctionReturnOverrides;
  };
};
```

*(Merging into one `database.overrides.ts` that exports both is equally valid under D-M2(a) and is
arguably the better reading of "exactly ONE documented locus". Two files is the shape recommended
here because it keeps the hand-maintained column list — the thing a human edits — separate from the
mechanical merge. Either is in Claude's discretion; the plan should pick one and say why.)*

**Changed file — `packages/supabase-types/src/index.ts`.** Measured, `:1` is today:

```ts
export type { CompositeTypes, Database, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database.js';
```

`:1` is replaced by two lines; `:2`, `:3`, `:4` are untouched:

```ts
export type { CompositeTypes, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database.js';
export type { Database } from './database.merged.js';
```

**That is the whole consumer-facing change: one line becomes two, and no other file in the repo
imports differently.** The `.js` extension is the house convention (present on all four existing
export lines).

### The bite test (this is what R7 asks for)

If Phase 156 renames, say, `organization_id`:

- `Nullable<'get_nominations', … | 'organization_id' | …>` → `'organization_id'` is no longer
  assignable to `keyof ReturnsRow<'get_nominations'>` → **TS2344** at the override file, naming the
  offending literal.
- If a whole RPC is renamed → `F extends keyof GeneratedFunctions` fails → **TS2344** likewise.
- A `satisfies` guard is *not* needed and would be weaker: `satisfies` checks a value, and this is a
  pure type. The generic constraint is the right instrument.

**⚠ The bite only lands if the package is typechecked, and today it is not.**

### The typecheck gap — the single most important structural finding

Measured across all 15 workspaces (`packages/*/package.json` + `apps/*/package.json`), the packages
with **no** `typecheck` script are exactly three: `@openvaa/shared-config`, `@openvaa/supabase`, and
**`@openvaa/supabase-types`**. `turbo.json` defines a `typecheck` task, and root `typecheck` is
`turbo run typecheck` (`package.json:35`) — turbo simply skips workspaces that do not declare it.
**So `packages/supabase-types` is not typechecked by `yarn typecheck` today.**

**Required addition** to `packages/supabase-types/package.json` `scripts` (between `generate` at
`:14` and `build` at `:15`):

```json
"typecheck": "tsc --noEmit",
```

This matches every other package (`packages/core`, `data`, `matching`, `filters`, `app-shared`,
`dev-seed`, `dev-tools`, `llm`, `question-info`, `argument-condensation` are all exactly
`tsc --noEmit`). Verified this session that it passes cleanly today: running
`node_modules/.bin/tsc --noEmit -p tsconfig.json` in `packages/supabase-types` exits **0**.
`tsconfig.json` already exists, extends `@openvaa/shared-config/ts`, sets `noEmit: true`, and
`include: ["src/**/*"]`; `packages/shared-config/tsconfig.base.json:15` sets `"strict": true`, so
`strictNullChecks` is on and the widened unions actually narrow.

**⚠ Side effect, measured the hard way:** running `tsc` in that workspace **modifies
`packages/supabase-types/tsconfig.tsbuildinfo`, which is a TRACKED file** (`git ls-files` lists it;
no `.gitignore` entry anywhere matches `tsbuildinfo`). This is a direct hazard for R6's
`git diff --exit-code` and is handled there.

---

## R4 — Criterion 2's negative control

### The measured code

```
supabaseDataProvider.ts:300   const parentNominationId = row.parent_nomination_id as string | null | undefined;
                     :301-302 const parentNominationType =
                                parentNominationId != null ? (nominationTypeById.get(parentNominationId) ?? null) : null;
                     :317     parent_nomination_id: parentNominationId ?? null
                     :335-341 if (parentNominationId != null && parentNominationType != null) {
                                nominationOut.parentNominationType = parentNominationType;
                              } else {
                                nominationOut.parentNominationId = null;
                              }
```

`nominationTypeById` is a `Map<string, string>` built at `:293-296`. The invariant served is
`packages/data/src/objects/nominations/base/nomination.ts:39-45`, which throws
`DataProvisionError('Either none or both parentNominationType and parentNominationId must be
defined…')`.

### Does removing the guard at `:301` redden the existing suite today? **No — and it cannot, at runtime.**

Reasoned from source (**not executed** — executing it requires mutating a tracked file, which this
pass must not do; flagged **UNVERIFIED-BY-EXECUTION** and listed as the plan's first task):

For the root nomination (`orgNomRow`, `parent_nomination_id: null` at
`supabaseDataProvider.test.ts:1507`), deleting the `parentNominationId != null ?` ternary leaves
`nominationTypeById.get(null)`. `Map.prototype.get` on a key absent from the map returns
`undefined`; `undefined ?? null` is `null`. **The guarded and unguarded expressions produce the
identical value `null`.** The `:335` guard then takes its `else` branch either way, and `:317`
yields `null` either way. There is no observable runtime difference on the null path.

**The guard's real effect is type-level**, and that is exactly what CIGATE-05 is about: once
`parent_nomination_id` is `string | null`, removing the guard makes
`nominationTypeById.get(parentNominationId)` a **type error** —
`Argument of type 'string | null' is not assignable to parameter of type 'string'` (TS2345) — under
`"strict": true` (`shared-config/tsconfig.base.json:15`).

### What already exists, and what is missing

| Path | Status | Evidence |
|---|---|---|
| Child nomination, parent present → `parentNominationId === 'n3'`, `parentNominationType === 'organization'` | ✅ exists | `supabaseDataProvider.test.ts:1625-1627` |
| Child nomination, parent absent → both cleared | ✅ exists | `:1630-1644` (`:1643` `toBeNull()`, `:1644` `toBeUndefined()`) |
| **Root nomination (`parent_nomination_id: null`) → `parentNominationId === null` and NO `parentNominationType`** | ❌ **missing** | `orgNomRow` (`:1488-1518`) is *fed* to five tests but no assertion ever reads its `parentNominationId`. The `:1666-1677` image test reads `nominations[0]` but asserts only `.image?.url`. |

`NominationTestNarrow` (`:108-119`) already declares `parentNominationId?: string \| null` (`:116`)
and `parentNominationType?: string` (`:117`), so the new assertions need no type change.

### Recommendation: **both halves, and the split matters**

**(a) A committed test — the behavioural pin.** Add one `it` in the `getNominationData` describe,
adjacent to `:1630`:

```ts
it('leaves a ROOT nomination with a null parentNominationId and no parentNominationType', async () => {
  mockSupabase._mockRpcResponses['get_nominations'] = { data: [orgNomRow], error: null };
  const result = await provider.getNominationData();
  const nom = (result.nominations as Array<NominationTestNarrow>).find((n) => n.id === 'n3');
  expect(nom?.parentNominationId).toBeNull();
  expect(nom?.parentNominationType).toBeUndefined();
});
```

This satisfies "a root nomination … is exercised by a test" and pins the null path against a future
refactor that *does* change behaviour (e.g. someone replacing `?? null` with `?? undefined`, or
setting `parentNominationType` unconditionally). **It does not, on its own, satisfy "fails if the
null-guard is removed"** — per the analysis above, it stays green under naive guard removal. Saying
otherwise in the plan would be exactly the false claim the milestone's standing rule exists to
prevent.

**(b) A recorded negative control — the load-bearing half.** Follow the house format
(`.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md`;
11 sibling files exist, `142`–`145` using the `-LEDGER` variant). The 137 document's shape,
measured: a title stating the number of runs and halves; a `**Date:** / **Plan:** / **Decisions
discharged:** / **Requirements:** / **Precedent followed:**` header block; `## 1. Why this run
existed` quoting the success criterion verbatim; `## 2. Environment` with a captured stamp (date,
repo root, git HEAD + branch, OS, Node, tool versions); then per-run sections with **exit codes and
verbatim output**, not descriptions.

The mutation to record for **164** is a **three-row ledger**, because the honest finding is that one
of the three does not fail:

| Row | Mutation | Instrument | Expected verdict |
|---|---|---|---|
| `NC-1` | delete the ternary at `:301-302`, leaving `nominationTypeById.get(parentNominationId) ?? null` | `yarn workspace @openvaa/frontend check` | **RED** — TS2345, quoted verbatim. *This is the "fails if the null-guard is removed" proof.* |
| `NC-2` | same mutation | `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` | **GREEN** — recorded as the *disclosed limitation*: the runtime path is invariant, and the reason is `Map.get(null) === undefined`. Recording a green here is what makes `NC-1`'s red mean something. |
| `NC-3` | revert the override (delete `database.merged.ts`, point the barrel back at `database.js`), guard intact | `yarn workspace @openvaa/frontend check` | **RED or GREEN — must be observed, not predicted.** If lint's `no-unnecessary-condition` is off, an un-overridden `string` type makes the guard dead-but-legal and this goes green; that green is the *original defect*, and it belongs in the record. |

Row `NC-3` is the "prove the mechanism, not just the guard" half — without it the ledger proves the
guard exists but not that the override is what keeps it honest. Each mutation must be reverted and
the revert proven three ways per the house standard (`git diff --exit-code` → 0,
`git hash-object` equal to a hash captured **before** the file was touched, `git status --porcelain`
empty), and no mutation may reach a commit.

**Which one alone would satisfy the criterion:** only **(b) row `NC-1`**. The committed test (a) is
required by the criterion's first clause ("a root nomination … is exercised by a test") and is worth
having, but it is not the failure proof. Plan both; do not conflate them.

---

## R5 — Criterion 3's grep, precisely defined

**All counts below were run this session, read-only.**

| # | Invocation | Hits | What it proves |
|---|---|---|---|
| G1 | `grep -rn " as .*\| null" apps/frontend/src/lib/api/adapters/supabase/ --include="*.ts"` | **33** | The naïve grep. (CONTEXT says "~30"; measured **33**.) Unusable — it is dominated by Phase-157 work. |
| G2 | `grep -rnE "\bas +(string\|number\|boolean)( *\| *(null\|undefined))+" <same dir>` | **8** | Scalar-only target excludes every `as Json as unknown as …` chain and every `Record<string,string> \| null`. Still catches the `entityObj` block. |
| G3 | G2 + require a **snake_case** property, scanned over `apps/frontend/src` + `apps/supabase/supabase/functions` | **2** | `:300` and `:573` only |
| G4 | G3 over `apps packages tests` (whole repo, `node_modules` excluded) | **2** | Same two — nothing elsewhere in the repo |
| **G7** | **G3 + restrict the property to the RPC-return column names harvested in R1** | **1** | **Exactly `:300`. This is the criterion-3 grep.** |

### The 33 G1 hits, attributed

| Attribution | Lines | Matched by G7? |
|---|---|---|
| **Phase 157** — `as Json as unknown as <DomainType> \| null` (JSONB→domain) | `supabaseDataProvider.ts:106`, `:108`, `:110`, `:162`, `:196`, `:220`, `:333`, `:376`, `:378`, `:484`, `:486`, `:517`, `:610`; `supabaseDataWriter.ts:223`, `:374` | **No** — `grep -vF 'as Json'` and the scalar-only target both exclude them |
| **Phase 157** — `as Record<string, string> \| null` (localized JSONB) | `localizeRow.ts:27`, `:60`; `supabaseDataProvider.ts:68`, `:69`, `:126`, `:127`, `:214` | **No** — target is not a scalar primitive |
| **Phase 157** — the already-mapped `entityObj` block (its criterion 1 names `:368-378`) | `supabaseDataProvider.ts:368`, `:369`, `:370`, `:371`, `:372`, `:373`, `:374` | **No** — `entityObj.name` etc. are **camelCase**, not DB column names |
| **Phase 157** — mapped/localized object reads | `supabaseDataProvider.ts:527`, `:604` | **No** — camelCase |
| **Not this phase, not clearly 157** — a *redundant* cast on a **table** read: `(row.allow_open as boolean \| null) ?? true`, where `row` comes from `.from('questions').select('*')` (`supabaseDataProvider.ts:545` region) and `database.ts:1011` already declares `allow_open: boolean \| null` | `supabaseDataProvider.ts:573` | **No** — `allow_open` is not an output column of any of the three RPCs |
| **THIS PHASE** — the only RPC-return nullability cast in the repo | `supabaseDataProvider.ts:300` | **YES — the single hit** |

**G7 does not swallow Phase 157's work.** Verified by construction: none of 157's criterion-1 anchors
(`:56`, `:92`, `:368-378`, `:511`) is matched by G7, and G7's one hit (`:300`) is named by 164's
criterion 3 and by no criterion of 157.

### The runnable, committable form

Scope by **(c) both** — RPC column names *and* scalar-primitive target *and* snake_case shape. The
column list is not hand-written; it is the output of R1's parse, which is what makes the grep
self-maintaining when a 4th RPC arrives:

```bash
# Inside scripts/assert-rpc-return-nullability.mjs, after harvesting columns from
# apps/supabase/supabase/schema/**. Only snake_case column names are used as the
# alternation: a camelCase property is a mapped domain field, never a raw RPC column.
COLS="$(printf '%s|' "${SNAKE_CASE_RPC_COLUMNS[@]}" | sed 's/|$//')"
grep -rnE "\.($COLS) +as +(string|number|boolean)( *\| *(null|undefined))+" \
  apps packages tests --include='*.ts' --include='*.svelte' \
| grep -v node_modules
# TODAY: 1 hit  →  apps/.../supabaseDataProvider.ts:300
# AFTER THIS PHASE: 0 hits (exit 1 from grep) → the criterion is met
```

The 32-name alternation used to obtain the "1" above (the snake_case subset of the union of all
three RPCs' output columns) is:

```
short_name|sort_order|custom_data|entity_type|candidate_id|organization_id|faction_id|alliance_id|
election_id|constituency_id|election_round|election_symbol|parent_nomination_id|entity_id|entity_name|
entity_short_name|entity_info|entity_color|entity_image|entity_sort_order|entity_subtype|
entity_custom_data|entity_answers|entity_first_name|entity_last_name|entity_organization_id|
project_id|terms_of_use_accepted|first_name|last_name|user_id|preferred_locale
```

**Committed script, not a one-shot.** A one-shot verification proves the tree at one moment; the
criterion's value is that the *next* consumer cannot reintroduce the cast. This is the same lesson
`ciTypecheckGate.test.ts:15-17` records about `144-06`'s one-off `node -e` check. The script is
already being built for criterion 1 — folding the grep into it costs ~10 lines and gives one
instrument, one failure message, one place to read why.

⚠ **The script must not match its own alternation string.** Exclude `scripts/` from the scan (or
build the pattern so the literal never appears in a scanned file) — the classic self-match failure
that `TMPL-04`'s documentation block avoided by "quoting no retired value".

---

## R6 — The M3(a) CI job's host (open question O-3)

### `.github/workflows/main.yaml` as it stands — **6 jobs, not 4**

⚠ **`164-CONTEXT.md` § F6 says "383 lines, 4 jobs". The line count is right; the job count is
wrong.** Measured by `grep -n "^  [a-z0-9-]*:$"`:

| Line | Job | `supabase start`? | `setup-node` + `yarn install`? | `paths-filter`? |
|---|---|---|---|---|
| `:25` | `skill-drift-check` | no | no | no |
| `:36` | `frontend-and-shared-module-validation` | no | yes | no |
| `:106` | `supabase-tests` | **yes** (`:125`) | **NO — none at all** | **yes** (`:113-118`) |
| `:163` | `dev-seed-integration` | **yes** (`:200`) | **yes** (`:184-194`) | **no, deliberately** (`:157-161`) |
| `:247` | `e2e-tests` | yes | yes | no |
| `:328` | `e2e-visual` | yes | yes | no |

The workflow triggers on `push` to `main` and on `pull_request` (`:3-22`), with
`paths-ignore: ["**.md", "**/*/.env.example", ".env.example"]`.

### The decisive fact CONTEXT did not have

`supabase-tests` (`:106-138`) has **five steps total**: `actions/checkout@v4`, `dorny/paths-filter@v3`,
`supabase/setup-cli@v1`, `supabase start`, `supabase test db`, `supabase stop`. There is **no
`threeal/setup-yarn-action`, no `actions/setup-node`, and no `yarn install`.** It cannot run
`yarn db:types` — that command is `yarn workspace @openvaa/supabase-types generate`
(`package.json:23`), which needs Yarn 4, Node, an install, and the `supabase` devDependency
(`packages/supabase-types/package.json:20`).

So "reuse `supabase-tests`, it already starts Supabase" is not the cheap option CONTEXT assumed: it
means adding three setup steps and an install to a job that has none, **and** inheriting the
paths-filter the file's own comment argues against.

### Recommendation: a **new, unfiltered job**, modelled on `dev-seed-integration`

Rationale, in the file's own terms. `main.yaml:158-161` states: *"There is deliberately NO
`paths-filter` here (unlike `supabase-tests`) … a conditional guard is how F5 happened in the first
place."* The M3(a) job's whole purpose is to catch a **silent** reversion. Placing it behind a filter
on `apps/supabase/**` + `packages/supabase-types/**` is defensible in the narrow case (types can
only drift when the schema or the types package changes) but it is defensible *only* if the filter's
path set is provably complete — and it is not: the schema files live under `apps/supabase/**` ✓, but
a Supabase **CLI version** change (`supabase/setup-cli@v1` pins `version: latest` — see the caution
at `:206-210`) can change the generator's output with **no repo path changing at all**. That is
exactly the silent-reversion class the criterion names, and the filter would hide it.

Cost: one extra `supabase start`. Per `:167-169`'s reasoning about `dev-seed-integration`, jobs run
in parallel with `e2e-tests`, "which does strictly more work", so this does not extend the
critical-path wall clock; the cost is runner minutes. **Runner `supabase start` cost as observed:
UNVERIFIED — the workflow sets no `timeout-minutes` on any job and no cache for the Supabase Docker
images, so the file itself carries no measurement.** The plan should not assert a number.

### The concrete YAML

Placed **after** `dev-seed-integration` (i.e. before `e2e-tests:` at `:247`), matching that job's
step vocabulary verbatim so the file stays uniform:

```yaml
  # `yarn db:types` regenerates packages/supabase-types/src/database.ts from the
  # LIVE local database, so this job must start Supabase; it is not a lint-shaped
  # step. It exists because the Supabase generator declares every RETURNS TABLE
  # output column non-null, and the hand-maintained override that corrects that
  # lie is only worth anything if a regeneration cannot silently revert it —
  # neither by a schema change nor by a generator-output change from the
  # `version: latest` CLI pin.
  #
  # There is deliberately NO paths-filter here, for the same reason
  # dev-seed-integration has none: a CLI update changes the generated output with
  # no repo path changing at all, and that is precisely the silent case this job
  # exists to catch.
  #
  # The diff is PATH-SCOPED to src/database.ts. Broadening it to the whole tree
  # would go red on packages/supabase-types/tsconfig.tsbuildinfo, which is a
  # tracked file that any tsc run in that workspace rewrites.
  supabase-types-drift:
    runs-on: ubuntu-latest

    steps:
      - name: "Checkout source code"
        uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Setup Yarn 4.13
        uses: threeal/setup-yarn-action@v2
        with:
          version: 4.13

      - name: Setup Node.js 22.22.1
        uses: actions/setup-node@v4
        with:
          node-version: 22.22.1
          cache: "yarn"

      - name: "Install all dependencies"
        run: yarn install --frozen-lockfile

      - name: "Start Supabase"
        working-directory: apps/supabase
        run: supabase start

      - name: "Regenerate Supabase types"
        run: yarn db:types

      - name: "Fail if the regenerated types differ from the committed ones"
        run: |
          git diff --exit-code -- packages/supabase-types/src/database.ts \
            || { echo "::error::yarn db:types produced a different src/database.ts. Commit the regenerated file, and re-check packages/supabase-types/src/database.overrides.ts — a renamed or dropped RPC column must be reflected there."; exit 1; }

      - name: "Stop Supabase"
        if: always()
        working-directory: apps/supabase
        run: supabase stop
```

Notes on the design, each measured:

- **`git diff --exit-code -- packages/supabase-types/src/database.ts`** — path-scoped. Unscoped
  would be poisoned by `packages/supabase-types/tsconfig.tsbuildinfo`, which `git ls-files` confirms
  is tracked and which no `.gitignore` covers. (Observed this session: a single `tsc --noEmit` run in
  that workspace produced ` M packages/supabase-types/tsconfig.tsbuildinfo`.)
- **Formatting noise is already handled** — `packages/supabase-types/package.json:14` pipes the
  generator through `prettier --write src/database.ts`, so the committed file and the regenerated
  file are formatted identically.
- **`--frozen-lockfile`** matches `dev-seed-integration:194`.
- **Node `22.22.1`** matches `dev-seed-integration:191` exactly; do not drift.
- **No `TURBO_TOKEN`/`TURBO_TEAM` env** — this job runs no turbo task.
- The job does **not** need `cp .env.example .env` (only `e2e-tests`/`e2e-visual` do).

**Add a companion assertion** in `packages/dev-seed/tests/` (the `ciTypecheckGate.test.ts` pattern):
assert `main.yaml` contains `supabase-types-drift:` exactly once and that the diff step's `run:`
contains `packages/supabase-types/src/database.ts`. Without it, deleting the job is a silent,
green-passing regression — the same failure class `main.yaml:161-166` documents as "F5".

---

## R7 — Collision management (`Depends on: Nothing` is understated)

**Assume the chain 156 → 157 → 163 → 164.** Do not execute 164 in the same wave as any of them.

### Phase 156 (Supabase Schema Corrections) — the reversion event this phase must survive

Read at `ROADMAP.md:1079-1096`. What it does that reaches 164:

| 156 criterion | Reaches 164? | Measured detail |
|---|---|---|
| **1.** `party` → `organization` throughout enums, schema, migrations, dev-seed; `yarn db:reset-with-data` observed end-to-end | **Yes — this is the regeneration** | Measured: `entity_type` **already** uses `'organization'` (`000-enums.sql:16-18`; `database.ts:1302`). The rename bites `user_role_type`, whose values are `'candidate', 'party', 'project_admin', 'account_admin', 'super_admin'` (`000-enums.sql:24-26`; `database.ts:1313`), and its consumers — including `502-email-helpers.sql:77`, `:81`, `:131`. **It does not rename any `RETURNS TABLE` output column.** |
| **6.** "`503-entity-rpcs.sql:147` covers all entities carrying answers" | **No** | Measured: `:147` is `CREATE OR REPLACE FUNCTION public.upsert_answers(` — a `RETURNS jsonb` function, explicitly out of 164's scope. |
| **7.** the `name`/`short_name` conflict at `102-entities.sql:27` is resolved, "the field conflicting with first/last-name-derived names is removed" | **Yes, indirectly** | Measured: `102-entities.sql:27` is `name jsonb,` on `public.candidates` (table opens `:24`). Removing it forces edits to `get_nominations`'s `COALESCE(c.name, o.name, f.name, a.name) AS entity_name` (`503:62`) and `get_candidate_user_data`'s `c.name` (`:124` region). The **column names** `entity_name` / `name` survive; only their sources change. |

**Net: 156 is unlikely to rename an overridden column — but "unlikely" is not a guarantee, and the
whole point of criterion 4 is that silent reversion must be impossible.** Two mechanisms, both
required:

1. **Type-level (the design in R3).** `Nullable<F, K extends keyof ReturnsRow<F>>` makes a renamed or
   dropped column **TS2344 at the override file**, naming the literal. `WithReturns<F extends keyof
   GeneratedFunctions, …>` does the same for a renamed RPC. A stale key **cannot** be a silent
   no-op, because `keyof` rejects it rather than widening.
2. **The typecheck that makes (1) observable.** `packages/supabase-types` has **no `typecheck`
   script** (measured, R3) → adding `"typecheck": "tsc --noEmit"` is a hard prerequisite, not a nice-to-have.
   **Without it, the constraint compiles nowhere and 156's regeneration reverts the guarantee
   exactly as silently as if there were no constraint at all.** This is the single highest-value
   item in this document.
3. **The CI drift job (R6)** catches the complementary case: the generated file changing at all.

⚠ **Explicitly do NOT use `Partial<Record<string, …>>`, an index signature, or a plain intersection
without `Omit` for the override.** All three make a stale key inert:
`{ parent_nomination_id: string | null } & { parent_nomination_id: string }` collapses to `never`
(silently breaking every consumer with a confusing error far from the cause) or, with an index
signature, is simply ignored. `Omit<Row, K> & { [P in K]: Row[P] | null }` with `K` constrained is
the only shape that both replaces cleanly and fails loudly.

### Phase 157 (Adapter Boundary & Typing) — same-file collision

Read at `ROADMAP.md:1098-1130`. Its criterion 1 removes casts at `supabaseDataProvider.ts` **`:56`**,
`:92`, **`:368-378`** and `:511`, and ends "A grep for casts on adapter reads returns empty." Its
criterion 3 replaces `_getQuestionData` at `:499` wholesale with a `get_questions` RPC.

**How 164's grep is kept from swallowing 157's work** — by construction, already verified in R5:

- G7 is scoped to **RPC-return column names harvested from the schema**. None of 157's anchors is an
  RPC-return column cast: `:368-374` cast **camelCase** properties of a mapped `entityObj`; `:376`,
  `:378` are `as Json as unknown as …` chains; `:56`, `:92`, `:511` are `Record<string, unknown>` /
  JSONB-shape casts.
- Measured: G7 returns **1** hit today (`:300`) and **0** after this phase — with 157 not yet run.
  So 164's criterion 3 is satisfiable **before** 157 lands, and 157's criterion 1 is unaffected by
  164's script.
- ⚠ **But 157's criterion 3 rewrites `_getQuestionData`, which is where `:573`'s
  `(row.allow_open as boolean | null) ?? true` lives — a cast on a `questions` *table* read that is
  already redundant** (`database.ts:1011` declares `allow_open: boolean | null`). 164 must **not**
  claim it; G7 does not match it (`allow_open` is not an RPC output column). Record this attribution
  in the enumeration artifact so 157's planner finds it rather than rediscovering it.

**Ordering constraint:** 157 depends on 156 (its own `Depends on:` line). 164 should run **after**
157 so its cast-removal lands on the settled file — but 164 is *correct* either way, because G7's
hit set and 157's anchor set are disjoint. **What is not safe is the same wave**: both edit
`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`.

### Phase 163 (CI Gates) — same `jobs:` block

Read at `ROADMAP.md:1220-1236`. **163 `Depends on: Phase 156` by an operator decision of 2026-08-28**
(its criterion 2 normalises SQL formatting across the same 27 schema/migration files 156 rewrites),
so the milestone order is **156 → 163**, and 164 after both.

163's three jobs, from its criteria:

| 163 criterion | Job it adds to `main.yaml` |
|---|---|
| 1 | a job that **names `db:lint:sql`** — measured, `package.json:24` `"db:lint:sql": "yarn workspace @openvaa/supabase lint:all"`, and `apps/supabase/package.json` `lint:all` = `yarn lint:sql && yarn lint:schema` (`supabase db lint --schema public --fail-on warning` + `node scripts/lint-schema.mjs`). **It needs a running Supabase**, exactly like 164's job. |
| 3 | a **secret-scan** job (a planted test secret must redden it) |
| 4 | a **dependency-vulnerability** job, running on every build, with a recorded severity baseline |

163 also adds a Prettier SQL parser (criterion 2) — a `prettier.config.mjs` + dependency change, not
a `jobs:` change.

**Ordering constraint for the planner:** run 163 first and let 164 append `supabase-types-drift:` to
a settled `jobs:` block. If they must be reordered, 164's job is a self-contained ~40-line block
appended before `e2e-tests:` (`:247`) and will merge cleanly against additions elsewhere — but
**never the same wave** (D-M3's ⚠⚠ and O-5). Note also that 163's `db:lint:sql` job will need
`supabase start` too; if both land, a future consolidation into one Supabase-hosting job is a
reasonable `.planning/todos/pending/` item under D-N2 — **not** a 164 deliverable.

---

## R8 — Verification commands

All runnable from `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`.

### Per-criterion

| Criterion | Command | Expected |
|---|---|---|
| **1** — enumeration derived + per-RPC disposition | `node scripts/assert-rpc-return-nullability.mjs` | exit **0**; prints the 3 RPCs and their column counts (**32** / **15** / **4**) |
| **1** — artifact is current | `node scripts/assert-rpc-return-nullability.mjs --write && git diff --exit-code -- packages/supabase-types/RPC-NULLABILITY.md` | exit **0** |
| **1** — a 4th RPC would be caught | negative control: add a throwaway `RETURNS TABLE` fn to a schema file, re-run, observe **exit 1** naming it, revert + prove the revert | exit **1**, then clean |
| **2** — reads as `string \| null` | `yarn workspace @openvaa/frontend check` | **0 errors, 0 warnings** (`--fail-on-warnings`, `apps/frontend/package.json` `check`) |
| **2** — root nomination exercised | `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` | the new `it` passes; whole file green |
| **2** — guard proven live | `164-NEGATIVE-CONTROL.md` rows `NC-1`/`NC-2`/`NC-3` (R4) | `NC-1` **RED** with a verbatim TS2345 |
| **3** — cast removed | `sed -n '298,304p' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | no `as string \| null \| undefined` |
| **3** — grep empty | the G7 invocation in R5 (or `node scripts/assert-rpc-return-nullability.mjs`) | **0 hits** (grep exit 1) — was **1** before |
| **4** — regeneration survives | `yarn db:start && yarn db:types && git diff --exit-code -- packages/supabase-types/src/database.ts` | exit **0** |
| **4** — the gate exists and is unfiltered | `grep -n "supabase-types-drift" .github/workflows/main.yaml` + the companion vitest | job present once; no `paths-filter` in its block |

### Command facts, measured

- **`yarn db:types` does NOT start Supabase.** `package.json:23` is
  `"db:types": "yarn workspace @openvaa/supabase-types generate"` with no `db:start` prefix —
  unlike `db:reset` (`:19`), which is `yarn db:start && yarn workspace @openvaa/supabase reset`.
  **Run `yarn db:start` first**, locally and in CI.
- **Single test file:** `apps/frontend/package.json` `test:unit` is `vitest run`, so
  `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` filters by path substring.
- **Frontend typechecks, two flavours:** `typecheck` = `svelte-kit sync && svelte-check --tsconfig
  ./tsconfig.json`; `check` = the same **plus `--fail-on-warnings`**. Use `check` — it is what
  `main.yaml:101-102` runs.
- **Repo-wide:** `yarn typecheck` = `turbo run typecheck` (`package.json:35`). ⚠ This **skips**
  `packages/supabase-types` until the `typecheck` script is added (R3).
- ⚠ **`tsc` in `packages/supabase-types` dirties a tracked file.** Observed: a `tsc --noEmit -p
  tsconfig.json` run there produced ` M packages/supabase-types/tsconfig.tsbuildinfo`. Restore with
  `git checkout -- packages/supabase-types/tsconfig.tsbuildinfo` before any `git diff --exit-code`
  gate, or scope every such gate to `src/database.ts`.

### Is a full `yarn test:e2e` run required?

**Yes — run it, last, per CLAUDE.md's cardinal rule and the house 7-gate ladder** (`TURBO_FORCE=true
yarn test:unit` → `TURBO_FORCE=true yarn lint:check` → `yarn format:check` → `TURBO_FORCE=true yarn
build` → `yarn workspace @openvaa/frontend check` → `TURBO_FORCE=true npx turbo run typecheck` →
`yarn test:e2e`, the sequence `REQUIREMENTS.md` records for Phase 145).

The engineering argument for skipping it is weak and should not be made: this phase changes the type
of the object the adapter loop reads on **every** nomination fan-out, and R2 flags that the
`get_candidate_user_data` widening may force real code changes at
`supabaseDataWriter.ts:207` — i.e. the phase may end up touching runtime code in the candidate-app
write path, not only types. Unit + typecheck is the correct **inner loop**; E2E is the gate.

Preconditions, from the standing project record: exactly one fresh dev server on `:5173` (no
Playwright `webServer`), and `yarn db:reset` **between** the unit gate and the E2E gate — the
dev-seed integration test writes the `default` template into the live DB with no teardown, while the
E2E suite asserts against `e2e/base`.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Making a stale override key fail loudly | a runtime assertion, a comment, or a `satisfies` on a value | the generic constraint `K extends keyof ReturnsRow<F>` (R3) | `satisfies` checks values; these are pure types. `keyof` is the only thing that rejects a renamed column at compile time. |
| Replacing a property's type in a record | `Original & { col: T \| null }` | `Omit<Original, K> & { [P in K]: Original[P] \| null }` | The bare intersection yields `string & (string \| null)` = `string` — the override silently does nothing. |
| Parsing SQL to find `RETURNS TABLE` | adding a SQL parser dependency | line-oriented regex over `schema/**` | Three uniform declarations; the house precedent is explicit (`ciTypecheckGate.test.ts:28-30`, `assert-a11y-scan-wiring.mjs:44-45`) |
| Reading a workflow YAML in a test | adding a YAML parser to a workspace | verbatim string matching | `ciTypecheckGate.test.ts:28-30` — "no YAML parser is a dependency of this workspace, and adding one to assert six lines would be a worse trade" |
| Detecting generated-type drift | a checksum, a comment, a review checklist | `yarn db:types` + `git diff --exit-code` on the exact path | The generator already normalises through `prettier --write` (`packages/supabase-types/package.json:14`), so the diff is signal-only |
| Proving a null path is live | asserting the guard's presence | a mutation whose removal is **observed** to fail (R4 `NC-1`) | The milestone's standing rule; and here the naive assumption ("removing the guard reddens the tests") is **false** at runtime |

---

## Common Pitfalls

### Pitfall 1 — Reasoning about RPC nullability from the table Row
**What goes wrong:** `get_candidate_user_data.first_name` is marked non-nullable because
`candidates.first_name` is `NOT NULL` (`database.ts:229`).
**Why:** the RPC's organization branch selects `NULL::text` (`503-entity-rpcs.sql:132`) — the table
never sees that row.
**Avoid:** the enumeration artifact carries an **evidence** column per row naming *which* source was
used (SQL body vs table Row). Where they disagree, the body wins.
**Warning sign:** a disposition row citing only a `database.ts` Row line for a `UNION ALL` RPC.

### Pitfall 2 — The override is not typechecked
**What goes wrong:** the constraint that was supposed to break loudly compiles nowhere.
**Why:** `packages/supabase-types` has no `typecheck` script; `turbo run typecheck` skips it.
**Avoid:** add `"typecheck": "tsc --noEmit"` **in the same plan as the override**, never later.
**Warning sign:** `yarn typecheck` output not listing `@openvaa/supabase-types`.

### Pitfall 3 — `git diff --exit-code` poisoned by `tsconfig.tsbuildinfo`
**What goes wrong:** the drift job goes red on a file nobody edited.
**Why:** `packages/supabase-types/tsconfig.tsbuildinfo` is tracked and not gitignored; any `tsc` run
rewrites it.
**Avoid:** scope every diff to `-- packages/supabase-types/src/database.ts`.
**Warning sign:** a CI failure whose diff names `tsbuildinfo`.

### Pitfall 4 — Claiming the committed test satisfies "fails if the guard is removed"
**What goes wrong:** the criterion is reported met by a test that stays green under the mutation.
**Why:** `Map.get(null) → undefined`, and `undefined ?? null === null` — the guarded and unguarded
expressions are runtime-identical on the root path (R4).
**Avoid:** the ledger's `NC-1` (typecheck) is the failure proof; `NC-2` records the green honestly.
**Warning sign:** a plan task worded "add a test that fails when the guard is removed" with no
typecheck instrument named.

### Pitfall 5 — The grep swallowing Phase 157
**What goes wrong:** criterion 3 becomes unsatisfiable (33 hits) or falsely satisfied (a grep so
narrow it matches nothing by construction).
**Avoid:** the R5 G7 form — scalar target ∧ snake_case property ∧ harvested RPC column name. Assert
the *count*: 1 before, 0 after.
**Warning sign:** a grep whose hit list includes any of `:106 :108 :110 :162 :196 :220 :333 :368-378
:484 :486 :517 :610`.

### Pitfall 6 — Scanning `migrations/**`
**What goes wrong:** 4 `RETURNS TABLE` occurrences for 3 RPCs; `get_nominations` double-counted.
**Why:** `00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql:44` redefines it.
**Avoid:** D-M1(a) — scope to `apps/supabase/supabase/schema/**`. Assert the scanned root in the
script so a future widening is a deliberate edit.

### Pitfall 7 — The enumeration script matching itself
**What goes wrong:** the grep finds its own alternation literal and never returns empty.
**Avoid:** exclude `scripts/` from the scanned roots. (`TMPL-04`'s in-repo doc block solved the same
class by quoting no retired value.)

---

## Project Constraints (from CLAUDE.md)

| Directive | Bearing on this phase |
|---|---|
| **E2E hard rule — failing E2E is a cardinal failure; no "known-flaky" exemptions; "did not run" counts as a failure** | The phase closes with a full `yarn test:e2e` (R8). A skipped suite is a failure. |
| **Prefer running the whole E2E suite for interim verification** | Do not hand-check the nominations page; run the suite. |
| **Use TypeScript strictly — avoid `any`, prefer explicit types** | The override must not use `any`; the `Nullable`/`WithReturns` design uses no assertion at all. |
| **`yarn db:types` after schema changes** | This phase does not change schema, but criterion 4 runs the regeneration deliberately. |
| **`db:*` touches only the database; `dev:*` drives the full stack** | The CI job uses `supabase start` directly (matching sibling jobs), not `yarn dev`. |
| **Always check against `/.agents/code-review-checklist.md`** | Applies to the override, the script, the test and the YAML. |
| **Never commit sensitive data** | The drift job must not echo Supabase keys; note `main.yaml:218-220`'s explicit "never echoed to stdout, and `set -x` must not be added here". |
| **Canonical package paradigm** (`packages/README.md`) | New files land in an existing package; adding a `typecheck` script brings `supabase-types` *closer* to the canonical shape. |
| Svelte-5 context / destructuring rules | **Not applicable** — this phase touches no Svelte component. |

---

## Validation Architecture

`.planning/config.json` has **no** `workflow.nyquist_validation` key → treated as **enabled**.

### Test Framework

| Property | Value |
|---|---|
| Framework | **vitest** (`catalog:` pin, root `package.json` devDependencies); Playwright `catalog:` for E2E |
| Config file | per-workspace; frontend `test:unit` = `vitest run` (`apps/frontend/package.json`) |
| Quick run command | `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` |
| Repo unit suite | `yarn test:unit` = `yarn assert:unit-coverage && turbo run test:unit` (`package.json:28`) |
| Static-assert layer | `scripts/assert-*.mjs`, wired via `assert:*` into `test:unit` / `test:e2e` / `lint:check` |
| Typecheck | `yarn typecheck` (`turbo run typecheck`) + `yarn workspace @openvaa/frontend check` |
| Full E2E | `yarn test:e2e` |

### Phase Requirements → Test Map

| Req | Behaviour | Layer | Automated command | Exists? |
|---|---|---|---|---|
| CIGATE-04 | The 3 RPCs and their columns are derived from `schema/**`, not prose | static script | `node scripts/assert-rpc-return-nullability.mjs` | ❌ **Wave 0** |
| CIGATE-04 | The committed enumeration matches the derivation | static script | same, `--write` + `git diff --exit-code -- packages/supabase-types/RPC-NULLABILITY.md` | ❌ **Wave 0** |
| CIGATE-04 | A 4th RPC / new column is caught | static script (negative control) | inject → expect exit 1 → revert | ❌ **Wave 0** |
| CIGATE-05 | `parent_nomination_id` is `string \| null` at the consumer | typecheck | `yarn workspace @openvaa/frontend check` | ✅ command exists; assertion new |
| CIGATE-05 | A root nomination yields `parentNominationId: null`, no `parentNominationType` | unit | `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` | ❌ **Wave 0** (fixture `orgNomRow` exists at `:1488`) |
| CIGATE-05 | Removing the guard **fails** | typecheck mutation | `164-NEGATIVE-CONTROL.md` `NC-1` | ❌ **Wave 0** |
| CIGATE-05 | No ad-hoc RPC-return nullability cast survives | static script | the G7 grep inside the script | ❌ **Wave 0** |
| CIGATE-05 | The override file itself is typechecked | typecheck | `yarn typecheck` after adding `"typecheck": "tsc --noEmit"` | ❌ **Wave 0** — script absent today |
| CIGATE-04/05 | Regeneration does not revert | CI + local | `yarn db:start && yarn db:types && git diff --exit-code -- packages/supabase-types/src/database.ts` | ❌ **Wave 0** |
| CIGATE-04/05 | The drift job is not silently deletable | unit (repo-meta) | vitest in `packages/dev-seed/tests/` asserting `main.yaml` | ❌ **Wave 0** |
| — | No behavioural regression in the app | E2E | `yarn test:e2e` | ✅ exists |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` +
  `node scripts/assert-rpc-return-nullability.mjs` (both < 30 s)
- **Per wave merge:** `yarn typecheck` + `yarn workspace @openvaa/frontend check` + `yarn test:unit`
- **Phase gate:** the full 7-gate ladder with `yarn test:e2e` **last**, after `yarn db:reset`

### Wave 0 Gaps

- [ ] `scripts/assert-rpc-return-nullability.mjs` — CIGATE-04 + CIGATE-05 (grep half)
- [ ] `packages/supabase-types/RPC-NULLABILITY.md` — CIGATE-04's committed artifact
- [ ] `packages/supabase-types/src/database.overrides.ts` — CIGATE-05
- [ ] `packages/supabase-types/src/database.merged.ts` — CIGATE-05
- [ ] `packages/supabase-types/package.json` — add `"typecheck": "tsc --noEmit"` **(prerequisite for the constraint to bite)**
- [ ] `packages/supabase-types/src/index.ts:1` — split into two export lines
- [ ] root `package.json` — add `assert:rpc-nullability`; append it to `lint:check`
- [ ] new `it` in `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`
- [ ] `packages/dev-seed/tests/<name>.test.ts` — repo-meta assertion for the CI job + the `lint:check` link
- [ ] `.github/workflows/main.yaml` — `supabase-types-drift` job (**after 163**)
- [ ] `.planning/phases/164-*/164-NEGATIVE-CONTROL.md` — the `NC-1`/`NC-2`/`NC-3` ledger

*No new framework install is needed — vitest, turbo and the `assert-*.mjs` pattern all exist.*

---

## Security Domain

`security_enforcement` is not disabled in `.planning/config.json` (the key is absent).

### Applicable ASVS Categories

| Category | Applies | Standard control |
|---|---|---|
| V2 Authentication | no | phase adds no auth surface |
| V3 Session Management | no | — |
| V4 Access Control | **indirectly** | `get_nominations` is `SECURITY INVOKER` (`503:52`) and its `WHERE` clause at `:88` is an **RLS leak guard** ("Drop rows where every entity-side join resolved to NULL", `:82-87`). The `entity_id` "no change needed" disposition (R2 §2b #14) **depends on that clause.** If 156 changes it, the disposition is void. Record the dependency in the artifact. |
| V5 Input Validation | **yes** | widening RPC columns to `\| null` forces guards where values really are absent — the phase's whole point. **Never** discharge a new error with a re-cast. |
| V6 Cryptography | no | — |
| V14 Configuration | **yes** | the new CI job runs `supabase start` and must not echo keys (`main.yaml:218-220`) |

### Known Threat Patterns

| Pattern | STRIDE | Mitigation |
|---|---|---|
| A type lie hides a null → `DataProvisionError` at runtime for real users | Denial of Service | the override + the live-guard proof (this phase) |
| A conditional CI guard hides a reversion (the "F5" class) | Repudiation | unfiltered job (R6), per `main.yaml:158-161` |
| Supabase credentials leaked into a job log | Information Disclosure | no `set -x`, no `echo` of keys; append to `$GITHUB_ENV` only |
| RLS-hidden entity rows leaking through the nominations fan-out | Information Disclosure | `503:88` — **preserved**; this phase changes no SQL |
| A new supply-chain dependency | Tampering | **none added** — Node built-ins only |

---

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** Every instrument recommended here
uses Node built-ins (`node:fs`, `node:path`, `node:url`), the already-present `vitest`/`turbo`
toolchain, and the already-present `typescript` compiler. `@supabase/postgrest-js@2.99.3` and
`@supabase/supabase-js@2.99.3` were *read* from `node_modules` to verify the `GenericFunction`
constraint; neither is added or changed.

**Packages removed due to `[SLOP]`:** none. **Flagged `[SUS]`:** none.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | scripts, vitest | ✓ | CI pins **22.22.1** (`main.yaml:191`); root `engine.node` `>=22` | — |
| Yarn 4 | every command | ✓ | `4.13` (`main.yaml:187-189`) | — |
| TypeScript | `tsc --noEmit` in `supabase-types` | ✓ | verified: exits **0** in that workspace today | — |
| `supabase` CLI | `yarn db:types`, `db:start` | ✓ locally; CI via `supabase/setup-cli@v1` `version: latest` | `latest` (unpinned) | ⚠ the `latest` pin is itself a drift vector — the R6 rationale |
| Docker | `supabase start` | ✓ | — | ⚠ project record notes ENOSPC risk from Docker.raw bloat on this machine; free space before the E2E gate |
| vitest / Playwright | tests | ✓ | `catalog:` pins | — |
| SQL parser (Node) | **not needed** | n/a | — | regex over `schema/**` |
| YAML parser (Node) | **not needed** | n/a | — | verbatim string match |

**Missing with no fallback:** none.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | Removing the `:301` ternary leaves the unit suite **green** (runtime-invariant) — reasoned from `Map.get(null) === undefined`, **not executed** | R4 | If it *does* redden, the plan gets a free behavioural proof and the ledger simplifies. Low risk either way; the plan's first task is to measure it. |
| A2 | Widening `get_candidate_user_data`'s six columns surfaces **UNVERIFIED** new type errors at `supabaseDataWriter.ts:207` | R2 §2c | Under-scoped plan if errors appear and no task budgets triage. **Budget the task regardless.** |
| A3 | `Omit<Fn,'Returns'> & { Returns: Array<Row> }` satisfies postgrest-js's `.rpc()` inference end-to-end | R3 | Verified structurally against `postgrest-js@2.99.3 dist/index.d.mts:65-75`; **not compiled**. If inference misbehaves, fall back to a full literal `{ Args: …; Returns: … }` and accept losing `SetofOptions`. |
| A4 | Phase 156 renames no `RETURNS TABLE` output column | R7 | Measured against 156's criteria as written; 156 is unplanned. The R3 constraint makes a surprise a compile error, so the risk is bounded to "one extra task", not "silent reversion". |
| A5 | The runner's `supabase start` cost is acceptable — **explicitly UNVERIFIED** | R6 | Longer CI. `main.yaml` sets no `timeout-minutes` anywhere, so no in-repo baseline exists. Do not assert a number. |
| A6 | `git diff --exit-code` after `yarn db:types` produces **no** diff on a clean tree | R8 | If the committed `database.ts` is already stale, criterion 4's first run is red — which is a *correct* finding, not a blocker. Run it early. |

---

## Open Questions

1. **One override file or two?**
   - Known: D-M2(a) requires exactly one *documented locus*; R3 offers both shapes.
   - Unclear: whether "one locus" is read as one file.
   - Recommendation: two files, with `database.overrides.ts` carrying the docblock and
     `database.merged.ts` a five-line mechanical merge that points at it. Either is defensible —
     the plan must state which and why.

2. **Should `RPC-NULLABILITY.md` live in `packages/supabase-types/` or `.planning/`?**
   - Known: D-N1 forbids `.planning/**` references in source comments, and the override must point
     at the artifact.
   - Recommendation: `packages/supabase-types/RPC-NULLABILITY.md`. In-tree, legal to reference,
     next to the thing it explains.

3. **Does `@typescript-eslint/no-unnecessary-condition` run here?** — **UNVERIFIED** (not read this
   session). It decides whether an un-overridden guard is *flagged* (CIGATE-05's "without TypeScript
   flagging them as dead code") or merely dead-but-silent. It determines `NC-3`'s expected verdict.
   Read `packages/shared-config/eslint.config.mjs` and `apps/frontend/eslint.config.mjs` during
   planning.

4. **Do 163 and 164 want one shared Supabase-hosting job?** — Both need `supabase start`. Out of
   scope here; file under D-N2 as a `.planning/todos/pending/` item.

5. **`Depends on: Nothing` in the ROADMAP is wrong** (O-4). Not fixable from this file. The correction
   is `Depends on: Phase 157 (transitively 156); must not share a wave with 163.`

---

## Sources

### Primary (HIGH — read directly this session)

- `apps/supabase/supabase/schema/502-email-helpers.sql` — `:22`, `:27-31`, `:39`, `:59`, `:64-66`,
  `:145-148`, `:155-157`
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` — `:11`, `:16-46`, `:52`, `:61`, `:62-72`,
  `:74-77`, `:82-88`, `:97`, `:100-115`, `:124-136`, `:147`
- `apps/supabase/supabase/schema/000-enums.sql` — `:16-18`, `:24-26`
- `apps/supabase/supabase/schema/102-entities.sql` — `:24-40`
- `packages/supabase-types/src/database.ts` — `:1`, `:3`, `:221-244`, `:685-712`, `:1011`,
  `:1154-1299`, `:1300-1318`, `:1319-1424`
- `packages/supabase-types/src/index.ts` (4 lines), `package.json` (`:14-15`), `tsconfig.json`
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — `:240-350`,
  `:495-615`
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` —
  `:100-119`, `:1444-1690`
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:207`
- `apps/supabase/supabase/functions/send-email/index.ts` — `:1-2`, `:120-175`
- `packages/data/src/objects/nominations/base/nomination.ts:20-58`
- `.github/workflows/main.yaml` — `:1-50`, `:100-265`, `:328-345`
- `packages/dev-seed/tests/ciTypecheckGate.test.ts` (88 lines, read in full)
- `scripts/assert-a11y-scan-wiring.mjs:1-45`
- root `package.json:1-80`; `turbo.json`; `packages/shared-config/tsconfig.base.json:15`
- `node_modules/@supabase/postgrest-js/dist/index.d.mts:65-75`
- `.planning/ROADMAP.md` — `:1079-1096` (156), `:1098-1130` (157), `:1220-1236` (163),
  `:1238-1256` (164)
- `.planning/phases/137-*/137-NEGATIVE-CONTROL.md:1-60`
- `164-CONTEXT.md` (read in full)

### Commands executed (read-only)

`grep`/`sed`/`awk` over the tree; `git ls-files`, `git status --porcelain`, `git diff --stat`;
`node -e` reads of `package.json` files; `tsc --noEmit -p tsconfig.json` in `packages/supabase-types`
(exit 0) — this rewrote the tracked `tsconfig.tsbuildinfo`, which was **restored with
`git checkout --`** and confirmed clean. No other tracked file was touched.

### Secondary (MEDIUM)

- `.planning/REQUIREMENTS.md:70-80` — CIGATE-01…05
- `CLAUDE.md` — E2E cardinal rule, `db:*`/`dev:*` split, strict-TypeScript directive

### Tertiary (LOW / marked)

- The `supabase start` runner cost (A5) — no in-repo measurement exists
- `no-unnecessary-condition` configuration (Open Question 3) — not read

---

## Metadata

**Confidence breakdown**

| Area | Level | Reason |
|---|---|---|
| Enumeration + per-column disposition (R1, R2) | **HIGH** | every column read from the schema declaration and the SQL body; two CONTEXT drifts corrected from direct reads |
| Type merge (R3) | **HIGH** | generated shape, helper-type closure, postgrest `GenericFunction` and the absence of deep imports all measured; the merge itself is **not compiled** (A3) |
| Negative control (R4) | **MEDIUM-HIGH** | code paths read exactly; the runtime-invariance conclusion is reasoned, not executed (A1) — deliberately, and named |
| Grep definition (R5) | **HIGH** | five variants run; counts 33 → 8 → 2 → 1 → 0 measured, and every one of the 33 attributed |
| CI host (R6) | **HIGH** | `supabase-tests`'s missing Node/Yarn setup, the tracked `tsbuildinfo` and the 6-job count all measured; runner cost **UNVERIFIED** |
| Collisions (R7) | **MEDIUM-HIGH** | 156/157/163 read from the ROADMAP and cross-checked against the schema; those phases are unplanned |
| Verification commands (R8) | **HIGH** | every script read from `package.json`; the `db:types`-needs-`db:start` gap measured |

**Research date:** 2026-08-28
**Valid until:** 2026-09-27 — or **immediately invalidated** by Phase 156 landing (it regenerates
`packages/supabase-types/src/database.ts`, which every line citation into that file depends on).
