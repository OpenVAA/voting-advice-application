# Phase 156 — Dispositions

**Created:** 2026-08-29, by plan 01 (the tracer). **Completed:** 2026-08-30, by plan 10.
**Authority:** `156-CONTEXT.md` § D-E5 ("each answered on the record in a committed
`156-DISPOSITIONS.md`") and roadmap criterion 6's own wording, *"with the choice recorded"*.

This document carries **six numbered entries** — the five record items roadmap criterion 8 lists,
plus criterion 6's `merge_custom_data` rename-vs-generalise choice, which is last by number and by
position. Three further decisions that plans 05, 06 and 09 made in passing are recorded below the
six as **lettered records**, deliberately outside the numbering so the count of criterion items
stays unambiguous.

| Entry | Item | Disposition | Carrier |
|---|---|---|---|
| 1 | Benchmark results → Supabase README, scripts archived behind a named commit | **IMPLEMENTED** (plan 09) | — |
| 2 | `lint-schema.mjs` evaluated for re-expression as pgTAP | **ANSWERED-ON-THE-RECORD** | `.planning/todos/pending/2026-08-28-lint-schema-as-pgtap.md` |
| 3 | `config.toml` hard-coded ports — env-resolved or documented caveat | **IMPLEMENTED** as the caveat (plan 09) | — |
| 4 | The id-JSONB foreign-key linkage question | **ANSWERED-ON-THE-RECORD** | `.planning/todos/pending/2026-08-28-id-jsonb-foreign-key-linkage.md` |
| 5 | Feedback IP-address encryption (D-E6) | **ANSWERED-ON-THE-RECORD**, implementing nothing | `.planning/todos/pending/2026-08-28-feedback-ip-salted-hash.md` |
| 6 | **Criterion 6 — `merge_custom_data` rename vs. generalise (Contract C3)** | **ANSWERED-ON-THE-RECORD**, implemented by plan 08 | — |

| Record | Item | Added by |
|---|---|---|
| A | Criterion 2 — what a stale JWT claim does once role/scope are compared as enums | plan 05 |
| B | Criterion 3 — the new `election_round` CHECK bounds the value but does not require it | plan 06 |
| C | The `app_settings` → `projects` cascade: a non-criterion fix ADOPTED into this phase | plan 06 |

> **Reader in a hurry — Phase 157's planner wants Entry 6.** It publishes the RPC's post-156 name
> and states exactly what changes at the two call sites. It is the last of the six because the
> numbering follows criterion 8's item order with the criterion-6 choice appended; nothing about its
> position reduces its priority. A fourth passing decision — the schema↔migration drift check that
> plan 01 adopted, and the migration fold it declined — is recorded *inside* Entry 6, because it was
> written there before this document had a records section; the index below points at it.

Under **D-N2** this is a planning artifact, not SQL — citing phase numbers and `.planning/` paths
here is correct and expected. D-N1's no-citation rule binds SQL and dev-seed comments only.

---

## Entry 1 — the answer-storage benchmark suite: conclusion kept, apparatus archived

**Item.** Roadmap criterion 8, item 1: *benchmark results moved to the Supabase README with the
scripts archived behind a named commit*.

**Measured anchor.** `apps/supabase/benchmarks/` — six subtrees, **62 files, 288 KB, 2323 lines**, of
which **36** were parsed result JSON. (`156-RESEARCH.md` § "Criterion 8" says "38 `.json`"; measured
at removal time it is 36, or 37 entries in `results/` counting the `.gitignore`. Neither reading
gives 38.)

**Disposition: IMPLEMENTED.** Plan 09 did the work; this entry records it rather than deferring it,
so no `.planning/todos/pending/` item carries it.

### What shipped

- **The conclusion outlived the apparatus.** `apps/supabase/README.md` § `## Why answers are a JSONB
  column` states what was compared, the p95 figures, which design won, and where that design lives
  in the schema (`105-answers.sql`). The numbers were read out of the 36 result JSON files, not
  paraphrased from the runbook — the runbook contains no conclusion at all; it is a pure runbook.
- **Two limits are stated in the README rather than buried:** at 50 concurrent connections the
  bulk-read gap closes entirely, and at 10 000 rows *neither* design meets the suite's own 1000 ms
  p95 target for that pattern (JSONB 1538.71 ms, relational 1549.43 ms) — so at that scale the
  binding constraint is concurrency, not storage shape.
- **The tree was removed in its own commit**, whose message names it as the archive point.

### The archival SHAs, and which is which

> - **The tree still EXISTS at `714d1e1885b091af95b86d2b497b3e2bff76f031`** — this is the SHA to
>   `git show`, and it needs no caret. Recover one file with
>   `git show 714d1e1885b091af95b86d2b497b3e2bff76f031:apps/supabase/benchmarks/README.md`, or the
>   whole tree with `git checkout 714d1e1885b091af95b86d2b497b3e2bff76f031 -- apps/supabase/benchmarks`.
> - **The removal commit is `0c1b876f6721d18457dccdff44941284b7c51e5e`** — the findable archive point,
>   also reachable as `git log --diff-filter=D -- apps/supabase/benchmarks`. Note the `^`: recovery
>   from this SHA needs `git show 0c1b876f6721d18457dccdff44941284b7c51e5e^:<path>`.
> - Both commands were **executed after the deletion** and observed to return the original content
>   (the runbook's `# Benchmark Suite: JSONB vs Relational Answer Storage` heading and the full
>   `jsonb-10000-voter-bulk-read.json` body). The archive is demonstrated, not asserted.

Both SHAs and the caret-free recovery command are also published in `apps/supabase/README.md`
(`:85`, `:89`, `:92`, `:98`), so a reader who never opens this planning directory can still recover
the tree.

### The one thing a reader should not over-read

`benchmarks/README.md:77` annotated `results/` as "(gitignored)". It was not: `results/.gitignore`
ignored everything *except* `*.json`, and all 36 JSON files were tracked. Had the runbook's claim
been true, the evidence base would not have been recoverable from history at all and this archival
design would have silently lost it. The tracked-ness is what makes the archive work.

---

## Entry 2 — `lint-schema.mjs` as pgTAP: the question is answered, the script stays

**Item.** Roadmap criterion 8, item 2: *`lint-schema.mjs` evaluated for expression as pgTAP tests*.

**Measured anchor.** `apps/supabase/scripts/lint-schema.mjs` — **182 lines**, read this session.
(`156-RESEARCH.md` says 185; `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md`
says 174. The file says 182. Both other figures are stale; neither is load-bearing.)

**Disposition: ANSWERED-ON-THE-RECORD.** No edit made. Carried forward by
`.planning/todos/pending/2026-08-28-lint-schema-as-pgtap.md`, whose `related_phase` is **163**, the
CI-gates phase.

### What the script actually is

Two advisors derived from Supabase's Splinter set, run as raw SQL against a live local Postgres via
`psql` over `DATABASE_URL` (defaulting to `postgresql://postgres:postgres@127.0.0.1:54322/postgres`):

| Advisor | Check | Level |
|---|---|---|
| 0013 | tables in `public` with row-level security disabled, excluding `schema_migrations` / `supabase_migrations` and anything matching `\_%` | **ERROR** — exit 1 |
| 0001 | foreign keys whose referencing columns have no covering index | **WARNING** — exit 0 unless `--strict` |

Wired as `"lint:schema": "node scripts/lint-schema.mjs"` in `apps/supabase/package.json:13`, chained
into `"lint:all": "yarn lint:sql && yarn lint:schema"` (`:14`), which the repository root reaches as
`"db:lint:sql": "yarn workspace @openvaa/supabase lint:all"` (`package.json:24`).

### The answer, stated on both sides

> **The re-expression is worth doing and is not free. It belongs in the CI-gates phase, alongside the
> decision about where the pgTAP job runs — not here, where it would be a refactor with no gate
> attached to it.**

**For pgTAP.** The advisors would live in the same suite as everything else, gated by the same
`npx supabase test db` invocation the CI-gates phase is already standing up, and their findings would
enter the assertion count instead of being a side channel. Today a passing `db:lint:sql` and a
passing pgTAP run are two separate facts a reader has to remember to check; one of them (`db:lint:sql`)
has exited 1 continuously since phase 151 on four pre-existing PL/pgSQL advisories, which is exactly
the condition under which a second signal gets ignored.

**Against.** The script's shape is not the suite's shape. It queries the whole schema at once and
reports a *set* — "these three tables have RLS disabled" — whereas pgTAP asserts per named object,
in a per-file `plan(N)`. Expressing "no table in `public` lacks RLS" as pgTAP means either one
catch-all assertion (which tells you a count, not which table) or a hand-maintained enumeration of
every table (which silently stops covering tables added later — the precise failure mode a schema
advisor exists to prevent). There is a third form — `results_eq` against an empty expected set — that
keeps the whole-schema shape inside pgTAP; it is the shape the todo should evaluate first.

**And the practical constraint either way:** both halves need a live Postgres, so any CI job must
`supabase start` before invoking them. A bare step fails on connection and reads as a false gate.

---

## Entry 3 — `config.toml` hard-coded ports: the caveat, and the correction that it is TEN

**Item.** Roadmap criterion 8, item 3: *the `config.toml` hard-coded ports resolved from env or
documented as a caveat*. D-E5 selected the caveat.

**Measured anchor.** `apps/supabase/supabase/config.toml`. **Ten** port literals, not the nine
`156-CONTEXT.md` § D-E5 item 3 and `156-RESEARCH.md` both list: the omitted one is
`[analytics] port = 54327`. The CONTEXT list is also line-stale — it cites the inspector port at
`:375`; it is at `:374`.

**Disposition: IMPLEMENTED as the caveat** (plan 09). No `.planning/todos/pending/` item carries it
forward; the pre-existing hand-off todo
`.planning/todos/pending/2026-08-29-config-toml-hard-coded-ports-phase-156.md`, filed by Phase 155,
is discharged by this entry and by the README section it points at.

### What shipped

`apps/supabase/README.md` § `## Local ports` documents all ten with what each serves, plus the
consequence that matters: two checkouts of this repository cannot run their Supabase stacks
simultaneously, because changing a port means editing a tracked file. `config.toml` itself carries a
two-line pointer comment naming `../README.md`. **No port value was changed** — asserted by a
zero-diff check on every port assignment line, and by `yarn db:status` still resolving the stack.

### Why the caveat rather than env resolution — and the finding that makes that a choice

`env()` interpolation on port fields **works** in the pinned CLI. That was measured, not inferred:

| `[api] port = …` | Environment | Result against `supabase` v2.83.0 |
|---|---|---|
| `"notaport"` | — | **REJECTED** — `cannot parse value as 'uint16'` |
| `"env(TEST_API_PORT)"` | `TEST_API_PORT=54399` | **ACCEPTED** — parsing succeeds, execution proceeds |
| `"env(NOPE_UNSET)"` | unset | **REJECTED** with the *identical* uint16 error |

Row 1 proves the decoder is strict, so row 2's acceptance is meaningful; row 3 proves the expansion
actually happened (the unset variable resolved to empty and *then* failed uint16 parsing). The
resolved value is also used, not merely parsed: `db.port = "env(TEST_DB_PORT)"` at `55999` produced
`dial tcp 127.0.0.1:55999: connect: connection refused`, at `54322` a real connection.

The CLI's own configuration reference — the page `config.toml`'s opening comment links to — is
**silent** on the question. Every `env(...)` it shows is the default of a string-typed secret field.
That is an absence of documentation, not a documented prohibition, which is why the question was
settled against the binary.

**So the ports are literals by choice, not by limitation.** D-E5 chose the caveat because changing a
port breaks every developer's running stack and every hard-coded local URL in the test and
documentation surface — `config.toml:164` `site_url` and `:166` `additional_redirect_urls` both pin
`http://127.0.0.1:5173`, which is the value `FRONTEND_PORT` is documented as overriding for the dev
server and the E2E preflight. An operator on an alternate port today has a working frontend and a
broken auth redirect, and nothing notices. The caveat is worded to say the option exists and is
unused, so a future reader is not sent down a "the CLI can't do this" dead end.

---

## Entry 4 — the id-JSONB foreign-key linkage: answerable only after the filter exists

**Item.** Roadmap criterion 8, item 4: *the id-JSONB foreign-key linkage question answered against
the three-option election-filter requirement*.

**Measured anchor, and a correction to the context document's narrower framing.**
`156-CONTEXT.md` § D-E5 item 4 cites `103-questions.sql:20-23` only, i.e. one table. Measured, the
same four linkage columns exist as `jsonb` on **both** question tables:

| Table | Columns | Location |
|---|---|---|
| `public.question_categories` | `election_ids`, `election_rounds`, `constituency_ids`, `entity_type` | `apps/supabase/supabase/schema/103-questions.sql:20-23` |
| `public.questions` | `election_ids`, `election_rounds`, `constituency_ids`, `entity_type` | `apps/supabase/supabase/schema/103-questions.sql:48-51` |

**The disposition answers for both.** Anything that linked only `questions` would leave
`question_categories` carrying the identical defect.

**Disposition: ANSWERED-ON-THE-RECORD.** Carried forward by
`.planning/todos/pending/2026-08-28-id-jsonb-foreign-key-linkage.md`, whose `related_phase` is
**157** — the phase whose criterion 3 builds the `get_questions` RPC with filtering by election,
constituency and election round.

### The answer

> **The defect is real and is stated here in full; the *shape* of the fix is not decidable today,
> because the structure a linkage would take is determined by the query shape of a filtering
> capability that has not been built. Choosing a structure now is guessing at that capability's
> requirements, and a guessed schema is harder to remove than an absent one.**

**What is wrong.** Eight columns across two tables hold arrays of ids for elections and
constituencies with no referential integrity of any kind. Deleting an election or a constituency
leaves dangling ids inside JSONB that no foreign key, no trigger and no check detects. Every other
reference to `public.projects` in this schema cascades (see Record C); these do not, because they are
not references at all — they are opaque documents that happen to contain identifiers.

**Why it is blocked rather than merely deferred.** The three candidate structures — junction tables
with real foreign keys, a validating trigger, or keeping the JSONB and adding a periodic consistency
check — have materially different costs depending on how the filter reads them. A junction table is
the right answer if the filter joins; it is an expensive detour if the filter does a containment test
on the JSONB and never joins. Phase 157 writes that query. After it exists, the question is a
measurement rather than a forecast.

**What this entry does not claim.** It does not claim the columns are unused or the defect
theoretical. It claims only that the *remedy* is underdetermined, and it names the fact that will
determine it.

---

## Entry 5 — the feedback client IP at rest: the recommendation, and nothing implemented

**Item.** Roadmap criterion 8, item 5: *the feedback IP-address encryption investigated*. D-E6
selected answering over implementing; because D-E5 landed as the record-plus-todo option rather than
the implement-all-five option, **this entry implements nothing by construction.**

**Measured anchor.** `apps/supabase/supabase/schema/107-feedback.sql` — the whole rate-limit
mechanism, read this session:

| Line | What is there |
|---|---|
| `:14` | `ip_address   text        PRIMARY KEY` in `private.feedback_rate_limits` |
| `:52-58` | the client address extracted by `SPLIT_PART` from the `x-forwarded-for` header |
| `:55` | the `'unknown'` fallback when the header is absent |
| `:59` | `TRIM` on the extracted value |
| `:62` | `pg_advisory_xact_lock(hashtext('feedback_rate:' \|\| p_client_ip))` |
| `:65` | the `INSERT … ON CONFLICT (ip_address) DO UPDATE` that maintains the 5-per-5-minutes counter |

**Disposition: ANSWERED-ON-THE-RECORD.** Carried forward by
`.planning/todos/pending/2026-08-28-feedback-ip-salted-hash.md`, `area: security`,
`related_phase: 162`.

### The recommendation

> **Replace the raw address as the rate-limit key with a salted hash — the salt being a
> per-deployment secret held in the deployment's own secret store and injected as a database setting
> or a Vault entry, never written into a migration, a seed file or any tracked file.** The stored
> value then identifies a bucket without being personal data at rest, and the 5-per-5-minutes
> behaviour is preserved because hashing is deterministic within a deployment.

**No candidate salt value appears in this document or in the todo, and none may be written into
either.** The repository forbids committing secrets; a "example" salt in a planning artifact is the
value someone copies.

### Why it is not the one-line change it looks like

The raw address is not incidental storage — it is the mechanism:

1. **It is the primary key.** Changing what is stored changes the table's identity column, so the
   change is a data migration, not a column edit.
2. **It flows through an unknown-address fallback.** When `x-forwarded-for` is absent the value is
   the literal `'unknown'`, so *every* header-less client already shares one bucket. Hashing does not
   fix that and must not be described as if it does.
3. **It is trimmed.** Whitespace normalisation has to happen *before* hashing or two spellings of one
   address become two buckets.
4. **An advisory lock is derived from it.** `hashtext('feedback_rate:' || p_client_ip)` serialises
   concurrent inserts. Hash the input and the lock key changes too — correct, but it means the
   serialisation and the counter must be changed together or the lock stops protecting the row it
   was meant to protect.

Each of those is a semantic change to the rate-limit bucket, which is why D-E6's rationale says the
change "wants its own test". Two alternatives were considered and are recorded in the todo:
**truncation of the last octet** — rejected, still PII-adjacent and it collapses more distinct
clients into shared buckets, worsening the finding rather than closing it — and a **retention window**
deleting rows past the rate-limit horizon, which is complementary rather than alternative and is
cheap enough to do regardless.

---

## Entry 6 — `merge_custom_data`: RENAME, not generalise

**Item.** Roadmap criterion 6 offers two mutually exclusive treatments of
`public.merge_custom_data(uuid, jsonb)` and requires the choice be recorded. `156-CONTEXT.md`
§ "Claude's Discretion" delegates the choice explicitly; § O-1 records it as undecided at planning
time.

**Measured anchor.** `apps/supabase/supabase/schema/504-admin-rpcs.sql` — the whole file, 35 lines,
read in full on 2026-08-29. Its `migrations/00001_initial_schema.sql` twin.

**Disposition: ANSWERED-ON-THE-RECORD.** Not deferred past this phase — the rename is implemented by
**plan 08**, so no `.planning/todos/pending/` item carries it. This entry exists to publish the name
before 157 is planned, not to defer the work.

**Confirmed against what shipped, 2026-08-30 by plan 10:** `504-admin-rpcs.sql:11` declares
`CREATE OR REPLACE FUNCTION public.merge_question_custom_data(`, `:35` grants EXECUTE on
`public.merge_question_custom_data(uuid, jsonb)`, and `10-schema-migrations.test.sql:648-649`
asserts that **no** function named `merge_custom_data` survives in `public`. Plan 08 did not diverge
from this entry; no correction was needed.

### The answer

> **`public.merge_custom_data(uuid, jsonb)` is RENAMED to
> `public.merge_question_custom_data(uuid, jsonb)`. Its parameter list does not change.**

### The derivation — every element measured, none inherited

Every element of the function except its name is *already* question-specific. This is not a judgement
call about future direction; it is a reading of what the function is:

| Element | Measured value |
|---|---|
| Parameter | `p_question_id uuid` |
| Target | `UPDATE public.questions` — hard-coded, no discriminator |
| Returning clause | `RETURNING public.questions.custom_data` |
| Error message | `'Question not found or access denied: %'` |
| File header | `merge_custom_data() - shallow JSONB merge on questions.custom_data` |
| `SECURITY INVOKER` rationale comment | names one policy, `admin_update_questions`, and the `can_access_project()` predicate it enforces |
| Grant | `GRANT EXECUTE ON FUNCTION public.merge_custom_data(uuid, jsonb) TO authenticated;` |

The name is the only part of the function that claims generality. Correcting the name is therefore a
**no-change to the shape** — nothing is generalised, so nothing is promoted.

**What generalising would cost, and buy.** Ten columns named `custom_data` exist across the schema
(`101-elections.sql:13,38,58`; `102-entities.sql:14,33,60,80`; `103-questions.sql:15,40`;
`104-nominations.sql:24`). Serving them from one function requires a table discriminator, therefore
dynamic SQL inside a `SECURITY INVOKER` function, therefore a table allow-list to avoid an injection
surface, plus a per-table restatement of the RLS rationale the current one-line comment gets away
with. And it would ship with **zero consumers**: both production call sites pass a question id, both
derived from a `SetQuestionOptions`.

**The two call sites 157 must rewrite,** verbatim paths, both passing
`{ p_question_id: id, p_patch: customData }`:

- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` — in
  `updateQuestion`, plus the two doc-comment mentions above it.
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — in
  `_updateQuestion`.

One test site also asserts the RPC name and moves with them:
`apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts`.

**Consequence for 157's planner, stated plainly:** the RPC name changes; the parameter list does
not; the two call sites above are the whole production surface; the change is a string swap in each,
not a signature migration.

> **And a knock-on 157's planner must not miss:** the rename invalidated acceptance criteria already
> written into `157-12-PLAN.md` and `161-04-PLAN.md`, both of which still grep for the retired name.
> Recorded as `.planning/WINDOWS.md` entry 188; this phase did not edit another phase's plan files.

### Companion — `upsert_answers` is PROMOTED, and the asymmetry is deliberate

Recorded here in the same entry because the two decisions look contradictory until the deciding fact
is named.

`public.upsert_answers` is **promoted** from a candidates-only writer to an entity-generic one
covering every table that carries an `answers` column. Measured, that is **exactly two tables —
`public.candidates` and `public.organizations`** (`105-answers.sql:10-11`); factions and alliances
carry no `answers` column, so this is a two-table widening, not a four-table one. Today both the
overwrite branch and the merge branch write `UPDATE public.candidates`.

Its **signature and its three parameters do not change**, so its call site in
`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` stays
source-compatible. `SECURITY INVOKER` means RLS gates each branch, so the widening grants no new
authority.

**The deciding fact, and the whole asymmetry:** `upsert_answers` generalises because organizations
answer questions in this product — a second entity type genuinely carries an `answers` column
(`105-answers.sql:10-11`). `merge_custom_data` does not generalise, because no second `custom_data`
consumer is coming. Neither decision leaves a second representation standing, so neither is accepted
debt.

> **Correction, 2026-08-30 (code review WR-05).** As first written this paragraph said the
> generalisation was justified because *"a second real consumer exists"*. Measured against the tree,
> **it does not**. `_setAnswers` in
> `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:258` is the only
> production caller of `upsert_answers`, and it hard-rejects every entity type but `Candidate`
> before the RPC is reached. The organization branch has **no consumer in application code today**,
> and no phase on the roadmap currently plans one. The consumer is **prospective, not existing**.
>
> The decision itself stands, but on the narrower ground stated above: the widening follows the
> schema (two tables carry `answers`, so a candidates-only writer was already the anomaly), it grants
> no new authority because `SECURITY INVOKER` leaves each branch gated by its own table's RLS, and it
> is covered on both the positive and the negative path in
> `10-schema-migrations.test.sql`. That is a weaker justification than the one originally recorded,
> and it is the true one.
>
> **A note for whoever adds the consumer:** the fix is *not* the one-line guard widening the review
> suggested. Everything after that guard in `_setAnswers` is candidates-specific — the project-id
> lookup selects from `.from('candidates')`, and the upload path is built as
> `${projectId}/candidates/${id}/…`. Lifting the type check alone would send an organization write
> to a candidates lookup that cannot find the row, or to a candidate-shaped storage path. The guard
> is load-bearing until those two are generalised with it.

### Two amendments to Contract C3 as `156-CONTEXT.md` states it

`156-CONTEXT.md` § C3 lists both of these RPCs as **"none in 156"**. That is now false in both rows.
Criterion 7 (plan 01, commit `79f798d41`) touched each:

| RPC | What changed | Contract impact |
|---|---|---|
| `get_nominations` | the `entity_name` COALESCE lost its candidate term; it now reads `COALESCE(o.name, f.name, a.name)`. Applied in all **three** copies — `schema/503-entity-rpcs.sql`, `migrations/00001`, and `migrations/00002`, which recreates the function. | **`RETURNS TABLE` unchanged.** For a candidate nomination `entity_name` is now NULL. Harmless and already the de-facto behaviour: `candidates.name` was never written by `seed.sql` or by dev-seed's `CandidatesGenerator`, and the frontend's candidate branch in `dataProvider/supabaseDataProvider.ts` never reads `entity_name` — it reads `entity_first_name` / `entity_last_name`. Only the organization branch reads it, and organizations keep their `name`. |
| `get_candidate_user_data` | the candidate `SELECT` branch returns `NULL::jsonb` in the `name` ordinal, the same typed-NULL padding its organization branch already used for four columns. | **`RETURNS TABLE` unchanged — still 15 columns, `name jsonb` among them.** Confirmed in the regenerated `packages/supabase-types/src/database.ts`, whose `get_candidate_user_data.Returns` still declares all 15 fields. A `RETURNS TABLE` shape change is Phase 164's territory and would break the adapter's generic row mapping; it was explicitly not done. |

**157's planner must not read "none in 156" for these two rows.** Both remain source-compatible, but
the premise behind that phrase is stale.

### The schema↔migration drift check — adopted, in its non-destructive form

`156-CONTEXT.md` § O-3 files "nothing verifies that `schema/` and `migrations/` agree" as open and
uncovered by any criterion. Plan 01 closes it (commit `cee2084b6`).

**Adopted:** `scripts/assert-schema-migration-parity.mjs`, a dependency-free normalised
golden-signature comparison, wired as the **twelfth** link of `yarn lint:check` with its reviewed
fixture at `apps/supabase/scripts/schema-migration-parity.expected.txt`.

**Declined:** the variant `156-RESEARCH.md` surfaced — folding `00002` and `00003` into `00001` so
the check collapses to a one-line `cmp`. It is the cleaner end state, and it deletes migration files,
which is the most history-destructive act available in this phase. **D-E2 authorises rewriting this
phase's own edits into migration history; it does not authorise collapsing unrelated migrations.**
Plan 10 filed `.planning/todos/pending/2026-08-28-fold-migrations-for-byte-parity.md`, naming Phase
163 as the place that option can be taken up deliberately.

**Known limit of the adopted form, stated so no one over-reads a green run:** it catches
one-sidedness, which is the measured hazard. It cannot catch a change made *identically wrong* in
both copies.

---

# Decisions recorded in passing by earlier plans

Three plans had to make a recorded choice while implementing a criterion. Those choices are **not**
criterion-8 record items and are lettered rather than numbered, so the count of six above stays
unambiguous. A fourth — the drift-check adoption and the declined migration fold — lives at the end
of Entry 6, where plan 01 wrote it before this section existed.

| Where to find it | What it decides |
|---|---|
| Record A, below | A JWT carrying a role or scope label the enum does not have now RAISES `22P02` instead of comparing false |
| Record B, below | `nominations.election_round` is bounded at `>= 1` but stays nullable — the gap is deliberate and visible in the suite |
| Record C, below | `app_settings.project_id` gained `ON DELETE CASCADE`; a non-criterion fix adopted rather than deferred |
| Entry 6 § "The schema↔migration drift check" | The parity gate was adopted in its non-destructive form; folding migrations for byte parity was declined and carried forward as a todo |

---

## Record A — criterion 2: a stale claim label RAISES `22P02`, and that is the chosen shape

**Added by:** plan 05.

**Item.** Roadmap criterion 2 requires `has_role` / `can_access_project` to compare enums instead of
strings. `role_entry->>'role'` yields `text`, and `text = public.user_role_type` is an operator that
does not exist, so the rewrite is forced to pick a direction for the cast. The two directions are not
equivalent, and the one that satisfies the criterion changes an observable failure shape. `156-RESEARCH.md`
§ A5 files the choice as needing to be recorded; `156-CONTEXT.md` § O-1 records criterion 2 as
undiscussed, so the planner resolves it. This record is that resolution.

### The answer

> **The CLAIM VALUE is cast UP to the enum — `(role_entry->>'role')::public.user_role_type` — not the
> parameter down to `text`. A JWT carrying a role or scope label the enum does not have therefore
> RAISES SQLSTATE `22P02` (`invalid_text_representation`) inside the predicate, instead of comparing
> false and returning no rows.**

### Why the other direction was rejected

Casting the parameter down (`p_check_role::text`) also compiles, and leaves every call site working.
But the comparison stays a string comparison — the enum would then be decoration on the signature and
nothing more, and the criterion's own words are "uses enums in place of string comparison". A change
that satisfies the letter of a criterion by defeating its mechanism is worse than not making it, because
it also removes the reason to look again.

### The consequence, stated rather than buried

| | Before this plan | After |
|---|---|---|
| claim carries a label the enum has | matches | matches — identical |
| claim carries a label the enum does NOT have | compares false; the predicate returns `false`; the query returns zero rows | the cast raises `22P02`; the query ERRORS |

Both outcomes are **fail-closed** — neither grants access, and an unknown label can never match a
predicate. What changes is the *shape* of the denial: a silent zero-row result becomes a visible error.
That is the strictly more honest of the two, and it is the point of the criterion: today an unknown
label "looks like a legitimate denial", which is exactly how a stale vocabulary survives unnoticed.

### The exposure, measured rather than assumed

A `22P02` can only be reached by a token minted BEFORE the vocabulary changed. Measured at this commit:

- There is **no deployed database** for this branch; `apps/supabase/supabase/migrations/` is replayed
  by `supabase db reset` and nothing else applies it.
- `yarn db:reset` drops and recreates `auth.users`, invalidating every local session — so the reset
  that lands this change is also what clears any token that could carry a stale label.
- The whole remaining surface is therefore **a developer's own browser tab left open across a reset**.
  The recovery is to sign out and back in, or to reset again.

### What this record does NOT claim

It does not claim the pgTAP suite proves the new comparison behaves. `.planning/WINDOWS.md` entry 183
records that the 14 role-scope assertions in `05-organization-admin.test.sql` are BLIND to the role
vocabulary — every policy they exercise is satisfied by its ownership or `published` disjunct alone.
What actually catches a wrong label in this area is **Postgres's own enum type check on the
`user_roles` INSERT** in `00-helpers.test.sql`, plus the `col_type_is` / `has_function` /
`enum_has_labels` catalogue assertions plan 05 adds. Those are shape proofs, not behaviour proofs.
Anyone reading a green suite as evidence that role scoping is behaviourally covered is over-reading it.

---

## Record B — criterion 3: the `election_round` CHECK bounds the value, it does not require it

**Added by:** plan 06 (criterion 3 / REVIEW-DB-03), 2026-08-30.

### The answer

`public.nominations.election_round` now carries `CHECK (election_round >= 1)` and nothing more. The
column keeps `DEFAULT 1` and remains **nullable**. A CHECK constraint evaluates to `UNKNOWN` on a
NULL input and Postgres admits the row, so `INSERT ... (election_round) VALUES (NULL)` still
succeeds after this change. That is a real gap in the invariant and it is recorded here rather than
left to be discovered later.

### Why the plain form, and not `NOT NULL` as well

The criterion asks for "the missing `>= 1` constraint". Adding `NOT NULL` is a strictly wider
change: it rewrites the column's contract for every existing writer, and any caller that omits
`election_round` today relies on the default rather than on the column accepting NULL — but any
caller that passes an explicit NULL would start failing. That is a different decision needing its
own justification, and it is not what the criterion asks for. The narrow change ships; the wider one
is not smuggled in beside it.

### What was measured

Run against the local database after the constraint landed, at the seeded dataset:

| Insert | Outcome |
|---|---|
| `election_round = 0` | rejected, SQLSTATE `23514`, constraint `nominations_election_round_check` |
| `election_round = -1` | rejected, SQLSTATE `23514`, same constraint |
| `election_round = 1` | accepted |
| `election_round = NULL` | **accepted** — the gap this record notes |

### Where the gap is visible without reading this document

`10-schema-migrations.test.sql` assertion 77 is a `lives_ok` on the NULL insert whose description
states the limit in words. Anyone reading the suite sees the hole; it is not only written down in a
planning artifact.

---

## Record C — the `app_settings` cascade: ADOPTED into phase 156, not deferred

**Added by:** plan 06, 2026-08-30.

### The answer

`app_settings.project_id` now reads `REFERENCES public.projects(id) ON DELETE CASCADE` in both SQL
copies. **The fix lands in phase 156.** It is not one of the eight roadmap criteria, and adopting
non-criterion scope in the phase with the widest blast radius has a real cost, so the reasoning is
stated rather than assumed.

### Why adopt rather than defer

1. **The failure is measured, not theoretical.** Against the local database before the change,
   `confdeltype` on `app_settings_project_id_fkey` read `a` (NO ACTION), and
   `DELETE FROM projects WHERE id = <the seeded project>` raised
   `update or delete on table "projects" violates foreign key constraint
   "app_settings_project_id_fkey" on table "app_settings"`.
2. **It is one token in two files this plan already had open.** `schema/106-app-settings.sql` and
   the twin in `migrations/00001_initial_schema.sql` were both already being edited by this plan for
   criterion 3, so the marginal cost of the edit and of its parity check is close to zero.
3. **It is the only exception among thirteen.** Every other foreign key referencing `public.projects`
   already carried `ON DELETE CASCADE`; this one was the odd one out, so the change moves the schema
   toward its own stated convention rather than introducing a new one.
4. **The alternative pushes discovery into a phase whose plan is already written.** A later phase's
   project teardown is what breaks without it, and it would find the defect after its own plan was
   fixed.

### What was declined

Widening the fix into a general audit of referential actions across the schema. Only the single
measured exception is corrected. The other twelve were read from the catalogue and already cascade;
tables that reference something other than `projects` were not examined and are not claimed correct.

### The index question, checked rather than assumed

A cascade with no index on the referencing column table-scans on every parent delete.
`idx_app_settings_project_id` already exists in `200-indexes.sql`, and `yarn db:lint:schema` after
the change still reports only its two pre-existing unindexed-foreign-key warnings, neither of which
is `app_settings`.

### The pending-todo obligation

The plan required that, had this been declined, a pending todo naming the consuming phase be filed
so the defect could not silently vanish. It was adopted, so this record discharges that obligation
instead.

---

## Measurement corrections for plans 02–10 of this phase

Not dispositions. Recorded here because this is the document the remaining plans read, and each
of these was measured after being found false as written. Items 1–6 were measured at commit
`79f798d41`; items 7–9 were added by plan 10.

1. **The `156-PATTERNS.md` per-file twin-line map is stale, and was already stale before plan 01
   ran.** Phase 152's comment sweep joined multi-line SQL comments into single lines, shifting every
   offset below each joined comment. Measured examples, all *pre*-plan-01: `schema/503-entity-rpcs.sql`
   `entity_name` is at `:60`, not the mapped `:62`; its `get_candidate_user_data` candidate branch is
   at `:114`, not `:121`; the `00001` twins are `:3051` and `:3103`, not `:3159` and `:3211`; the
   third copy in `00002` is at `:82`, not `:90`; `00001`'s candidates `CREATE TABLE` begins at
   `:496`. **Navigate by symbol, table name and constraint name. Every line number in PATTERNS and
   RESEARCH should be treated as a locator for the pair, never as a seek target** — which is what
   PATTERNS itself warns, one paragraph below the map.

2. **The measured `schema/` ↔ `00001` difference is 4 hunks / 11 signature lines, not the
   "3 hunks / 26 diff lines" `156-RESEARCH.md` § "Drift check" records.** Same three *semantic*
   deltas; the 00002 terms-of-use tightening now presents as two hunks because 152's sweep inserted a
   standalone comment line between its two parts, and the line totals fell because multi-line comments
   became single lines. Concatenated `schema/` is 3279 lines and `00001` is 3271, not 3409 / 3390.

3. **`packages/dev-seed/src/template/permittedKeys.ts` does NOT "narrow automatically" from the
   regenerated types**, as `156-RESEARCH.md` § "Criterion 7" item 9 claims. It is a hand-written
   literal key array; dropping `candidates.name` made `'name'` an invalid member and `yarn typecheck`
   failed at `packages/dev-seed/src/template/permittedKeys.ts:223` until the key was removed by hand.
   **Every plan in this phase that drops or renames a column must expect a matching hand edit in that
   file.** The `party` → `organization` rename (criterion 1) and the grants narrowing (criterion 5)
   are the next two that will hit it.

4. **`yarn lint:check` is a twelve-link chain as of commit `cee2084b6`** — `turbo run lint`, `eslint
   … tests`, `typecheck:tests`, `typecheck`, then the guards `assert:i18n-catalog-namespaces`,
   `assert:a11y-scan-wiring`, `assert:comment-hygiene`, `assert:edge-env-defaults`,
   `assert:declared-binaries`, `assert:node-engine`, `assert:env-pair-registry`,
   `assert:schema-migration-parity`. **`assert:comment-hygiene` is live**, contrary to
   `156-PATTERNS.md` § Pattern S5 and `156-RESEARCH.md` § Pitfall 7, which both record Phase 152 as
   not landed and D-N1 as enforced "by discipline". It is enforced by a gate: 1,584 files scanned,
   2 rules live, 0 violations.

5. **The pgTAP suite reports 275 tests, not 267.** 267 is the sum of the `plan(N)` literals across
   the ten planned files; `00-helpers.test.sql` uses `no_plan()` and contributes a further 8. Any
   plan asserting a suite total should assert the planned sum it controls, and expect
   `prove`'s `Tests=` line to read 8 higher. *(Plans 07 and 08 then added assertions; the figure at
   the phase's final HEAD is recorded in `156-10-SUMMARY.md`.)*

6. **`yarn db:reset-with-data` takes ~36 seconds** on this machine (measured twice: 35.95 s and
   35.86 s wall clock), seeding 752 rows. It is not a slow gate and can be run per-plan.

7. **`config.toml` pins TEN ports, not nine.** `156-CONTEXT.md` § D-E5 item 3 and `156-RESEARCH.md`
   § "Criterion 8" both enumerate nine and both omit `[analytics] port = 54327`. The CONTEXT list
   also cites the inspector port at `:375`; it is at `:374`. See Entry 3.

8. **`apps/supabase/scripts/lint-schema.mjs` is 182 lines.** `156-RESEARCH.md` says 185;
   `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md` says 174. Neither matches
   the file. See Entry 2.

9. **The four JSONB linkage columns exist on TWO tables, not one.** `156-CONTEXT.md` § D-E5 item 4
   cites `103-questions.sql:20-23` alone, which is `question_categories`; the identical four columns
   are on `questions` at `:48-51`. `156-RESEARCH.md` already carries this correction as a note; the
   CONTEXT table does not. See Entry 4.
