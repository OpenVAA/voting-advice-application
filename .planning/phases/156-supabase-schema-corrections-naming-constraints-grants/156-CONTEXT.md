# Phase 156: Supabase Schema Corrections — naming, constraints, grants - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Source of decisions:** `.planning/v2.15-DISCUSSION-POINTS.md` § E (E1–E6), § 0 facts 15/16/17, § N (N1–N3), § F3.
**Generated per** decision **N3(a)** — one `<padded>-CONTEXT.md` per phase, pointing back at the shared
discussion document rather than restating all thirteen phases' decisions.

> **This is the widest-blast-radius phase in the v2.15 run.** Three other phases declare
> `Depends on: 156` — **157** (Adapter Boundary), **161** (`PROJECT_ID` Scoping) and **162**
> (Permissions Refactor, marked *blocking ship*). The § "Downstream contract" below states what they
> consume, so their planners are written against a stated interface rather than a guess.

<domain>
## Phase Boundary

The schema says what it means: the names are right, the constraints exist, and no role can edit a
column it has no business editing.

**In scope** (roadmap criteria 1–8):

1. `party` → `organization` across enums, schema, **migrations** and dev-seed, with
   `yarn db:reset-with-data` observed green end to end.
2. Auth-table role/scope prefixes expressed as an enum matching `user_role_type` instead of free
   strings; `301-auth-functions.sql` compares enums, not strings.
3. The missing `>= 1` CHECK on `nominations.election_round`, proven by a rejected insert.
4. The image validation at `011-validation-functions.sql:165` extracted into an `is_image` utility
   with its own pgTAP coverage.
5. `303-column-grants.sql` stops granting `authenticated` UPDATE on `sort_order`, `created_at`,
   `updated_at`; a PostgREST-shaped tamper attempt is observed to fail for each.
6. `upsert_answers` (`503-entity-rpcs.sql:147`) covers every entity carrying answers, organizations
   included; `merge_custom_data` (`504-admin-rpcs.sql:12`) renamed or generalised, **with the choice
   recorded**.
7. The `name` / `short_name` conflict at `102-entities.sql:27` resolved.
8. The five record items dispositioned rather than silently dropped.

**Not in scope:**

- The `get_questions` RPC. Per **D-F3**, its SQL *and* its wiring land together in **Phase 157** — it
  is not a 156 deliverable (see Downstream contract).
- The permissions/grants-matrix rewrite, `can_edit_project`, `is_child_nominee`, the `grants` table —
  all **Phase 162**. 156 is explicitly *independent of* 162 per the roadmap's own "Depends on" line;
  156 renames within today's 97-policy model and does not restructure it.
- `PROJECT_ID` parameterisation — **Phase 161**.
- Implementing the salted-hash IP change (D-E6), the pgTAP re-expression of `lint-schema.mjs`, or the
  id-JSONB FK linkage (D-E5) — those are dispositioned in writing, not built.

## Downstream contract

What 157, 161 and 162 consume from this phase. **A planner for those phases may treat these as
settled interface, and must not re-derive them.**

### Contract C1 — the renamed enum value (consumed by 157, 162)

`public.user_role_type` (`000-enums.sql:24-26`) currently reads
`'candidate' | 'party' | 'project_admin' | 'account_admin' | 'super_admin'`. After 156 the second
member is **`'organization'`**. Every consumer of the literal `'party'` changes with it:

- `packages/supabase-types/src/database.ts:1313` and `:1449` (generated — must be regenerated via
  `yarn db:types`, not hand-edited).
- The five frontend identifier sites (enumerated under `<facts>` F-15b) — notably
  `supabaseDataWriter.ts:180` and `candidate/login/+page.server.ts:41`, both of which 157 also
  rewrites. **157's planner must assume `r.role === 'organization'`.**
- `has_role('party','party', …)` in `302-rls.sql:230,239,242,246,279` — **162 rewrites these
  policies wholesale**; 162's planner should expect `has_role('organization','organization', …)` as
  the pre-refactor state it replaces, not `'party'`.

### Contract C2 — the `scope_type` enum (consumed by 162)

Criterion 2 converts `user_roles.scope_type` (`300-auth-tables.sql:14`, today `text NOT NULL` with a
comment listing `'candidate','party','project','account','global'`) to an enum. **162's `grants`
table is keyed `user_id × scope × target_id × role` with scopes `global`/`account`/`project`/`entity`**
— a different scope vocabulary. 156 must therefore *not* assume its enum is the final one; 162 will
supersede it. 156 delivers a well-typed pre-refactor state, and 162 inherits an enum rather than a
free-text column to migrate.

### Contract C3 — RPC signatures (consumed by 157)

The frontend calls exactly five RPCs (measured):

| RPC | Definition | Frontend call site | 156 change |
|---|---|---|---|
| `get_nominations` | `503-entity-rpcs.sql:11` | `supabaseDataProvider.ts` | none in 156 (157 extends filtering; 164 fixes its `RETURNS TABLE` nullability) |
| `get_candidate_user_data` | `503-entity-rpcs.sql:97` | `supabaseDataWriter.ts` (`p_entity_type: 'candidate'`) | none in 156 |
| `upsert_answers` | `503-entity-rpcs.sql:147` | `supabaseDataWriter.ts` | **criterion 6 — generalised beyond candidates** |
| `merge_custom_data` | `504-admin-rpcs.sql:12` | `supabaseAdminWriter.ts`, `supabaseDataWriter.ts` | **criterion 6 — renamed OR generalised; the choice is recorded** |
| *(new)* `get_questions` | — | — | **not 156** — lands whole in 157 per D-F3 |

**The one signature change 157 must be written against is `merge_custom_data`.** If 156 renames it
to `merge_question_custom_data`, two frontend call sites change name; if it generalises it, the
parameter list changes (a table/target discriminator appears). 156 **must publish that choice in
`156-DISPOSITIONS.md`** (see D-E5) before 157 is planned, or 157's planner is guessing.
`upsert_answers` keeps its name and its three parameters; only its internal entity dispatch widens —
so its call site in `supabaseDataWriter.ts` is source-compatible.

### Contract C4 — column grants (consumed by 162)

After criterion 5, `303-column-grants.sql` grants `authenticated` UPDATE on candidates and
organizations **minus** `sort_order`, `created_at`, `updated_at`. 162's criterion 6 ("storage
permission checks go through the same helpers as table access") is asserted against this narrowed
column set, not today's.

### Contract C5 — `db:reset` is the schema gate (consumed by 161)

161's criterion 3 requires `yarn test:e2e` to stop needing `yarn db:reset`. That is only meaningful
once the reset itself is known good post-rename. **156's criterion 1 gate (`db:reset-with-data` green
end to end) is the precondition 161 builds on**, and it is the reason 161 declares `Depends on: 156`.

</domain>

<decisions>
## Implementation Decisions

Captured in `.planning/v2.15-DISCUSSION-POINTS.md` § E. **The operator ticked no box and wrote no
free text anywhere in § E** (verified: `grep -n '\[x\]\|\*\*EDIT:\*\*\|\*\*NOTE'` returns no hit in
lines 342–417). Per that document's stated rule — *"Leaving every box in a decision unchecked =
choosing the ★ RECOMMENDED option. Identical to ticking it."* — **all six of E1–E6 are decided, by
default, on their ★ RECOMMENDED option.** None is undecided; none is overruled.

Cross-cutting decisions N1–N3 are likewise unticked → ★ RECOMMENDED. The § 0.1 baseline decision
**is** ticked, at option **(c)**.

---

### D-E1 ⚠ DECIDE — `party` → `organization`: how far does the rename reach?

**Won: option (a) — all four surfaces in one phase. By default (no box ticked).**

> *(a) All four surfaces in one phase — enums, schema, migrations, dev-seed, frontend.*

**Rationale (verbatim from § E1):** "criterion 1 names migrations and dev-seed explicitly, and a
rename that stops at the schema leaves `yarn db:reset-with-data` (the criterion's own gate) broken."

**Rejected:** (b) schema + migrations now, dev-seed and frontend follow-up — "the phase cannot then
satisfy its own end-to-end gate, so it would ship red." (c) rename + keep a `party` enum alias for one
release — "the reviewer stated in terms that no backward compatibility is owed, so the alias is pure
carrying cost." **No compatibility alias is to be created.**

**Operator free text:** none.

**The chosen reach, recorded per tree against fact 15's numbers** (so the planner can size waves —
see `<facts>` F-15 for the measurement caveat on the last two columns):

| Tree | Fact-15 figure | Re-measured `\bparty\b` | Identifier-level `'party'` | In the chosen reach? |
|---|---:|---:|---:|---|
| `apps/supabase/supabase/schema/` | **17** | 17 ✅ reproduces | 9 | **Yes** — enum `000-enums.sql:25`, `302-rls.sql` policies, `502-email-helpers.sql`, `300-auth-tables.sql:14` comment, `303-column-grants.sql` comments |
| `apps/supabase/supabase/migrations/` | **17** | 17 ✅ reproduces (all in `00001_initial_schema.sql`) | 9 | **Yes** — criterion 1 names migrations explicitly |
| `packages/dev-seed/src/` | **84** | 84 ✅ reproduces | 0 | **Yes** — mostly prose/comments; zero identifier hits, so this wave is a comment/doc rename, not a code rename |
| `apps/frontend/src` | **5** | 40 (prose incl. i18n JSON) | **5** ✅ reproduces | **Yes** — the 5 identifier sites (F-15b) |
| `packages/data/src` | **0** | 21 (all prose/test fixtures) | **0** ✅ reproduces | **No code change**; prose is Phase 152's comment sweep, not 156's |

**Two trees fact 15 does not enumerate, and they are in the blast radius:**

- **pgTAP tests** — `apps/supabase/supabase/tests/database/`: **56** `party` occurrences, **8** of them
  quoted literals, and a whole file named **`05-party-admin.test.sql`**. The rename breaks these tests
  unless renamed with the schema. **The planner must size a pgTAP wave**, including the file rename.
- **Generated types** — `packages/supabase-types/src/database.ts:1313` and `:1449`. Regenerate via
  `yarn db:types`; do not hand-edit.

Clean (0 hits, no wave needed): `apps/supabase/supabase/seed.sql`, `apps/supabase/supabase/functions/`.
`tests/` (E2E) has 29 prose hits and **0** quoted literals — no code change.

### D-E2 ⚠ DECIDE — Rewrite migrations in place, or add a new migration?

**Won: option (a) — rewrite the existing migrations in place. By default (no box ticked).**

> *(a) Rewrite the existing migrations in place.*

**Rationale (verbatim from § E2):** "explicitly authorised, leaves a clean single-source history, and
the local-only DB means no deployed database is invalidated. Verified by `yarn db:reset-with-data`
running green end to end."

The authorisation is the reviewer's own words, quoted in § E2: *"we can rewrite both migrations and
schemata and not care about bwd compat."*

**Rejected:** (b) an additive `ALTER TYPE` / `ALTER TABLE … RENAME` migration — "standard practice and
safe if a cloud database ever replayed history; permanently doubles the reading surface for every
future schema reader, which is the cost the reviewer chose to avoid."

**Operator free text:** none.

**Consequence — this is the single most consequential decision in the phase.** Option (a) makes
`yarn db:reset-with-data` **the** verification: there is no forward migration to prove, because the
history is rewritten to be already-correct. Had (b) won, the phase would additionally have had to
prove a forward migration applies cleanly to an existing populated database. **The planner must not
add a `00004_*` rename migration**; it must edit `migrations/00001_initial_schema.sql` in place, in
lockstep with `schema/`.

**⚠ The structural trap that makes (a) harder than it reads** — measured this session, and documented
in-tree at `apps/supabase/README.md:8-27`:

- `config.toml` sets `[db.migrations] schema_paths = []`, so **the CLI never reads `supabase/schema/`.**
  `supabase db reset` applies `migrations/` and nothing else.
- `schema/*.sql` concatenated in filename order *equals* `migrations/00001_initial_schema.sql` with the
  two later migrations applied. The two directories are hand-kept duplicates.
- **"Nothing verifies that they agree"** (README's own words). An edit to `schema/` alone never reaches
  any database; an edit to `migrations/` alone leaves the readable copy wrong.

That is why fact 15 reports 17 hits in *each* directory: **the same 17 lines, twice.** Every one of
this phase's eight criteria must be applied to **both** copies in the same commit. A rename applied
only to `schema/` produces a green-looking diff and an unrenamed database.

### D-E3 — Column grants: both tables, or candidates only?

**Won: option (a) — remove from both tables. By default (no box ticked).**

> *(a) Remove from both tables.*

**Rationale (verbatim from § E3):** "the Copilot comment says 'also appears on line 52'; the tamper
vector is identical and leaving one open makes the criterion's PostgREST-denial proof pass on a
half-fixed surface."

**Rejected:** (b) candidates only — "matches the kaljarv comment's literal line; organizations keep an
auditability hole the same phase just closed next door."

**Operator free text:** none.

**This resolves roadmap criterion 5's ambiguity.** The criterion names the *columns*
(`sort_order`, `created_at`, `updated_at`) but not the *tables*; fact 16 shows both tables grant all
three. The answer is **both**, and the PostgREST-denial proof must be run against **both** tables —
six denial assertions, not three.

### D-E4 — `102-entities.sql:27` — remove `name` from candidates, organizations, or both?

**Won: option (a) — remove `name` from `candidates` only; keep `short_name` on both. By default (no box ticked).**

> *(a) Remove `name` from `candidates` only; keep `short_name` on both as the initials override.*

**Rationale (verbatim from § E4):** "the stated conflict is first/last-name-derived names, which only
candidates have."

**Rejected:** (b) remove `name` from both tables — "more uniform; organizations then have no name at
all, which breaks every organization display path."

**Operator free text:** none.

**This is the explicit answer roadmap criterion 7 leaves as "the field conflicting with
first/last-name-derived names":** it is **`public.candidates.name`** and only that column.
`public.organizations.name` (`102-entities.sql:7`) **stays**. `short_name` stays on both
(`:8` organizations, `:28` candidates) as the generated-initials override.

Knock-on the planner must carry: `candidates.name` also appears in the `303-column-grants.sql` GRANT
list (`:33`) and its preceding comment (`:28`); dropping the column requires dropping it from the
grant.

### D-E5 — The five "investigate" items in criterion 8

**Won: option (a) — each answered on the record in a committed `156-DISPOSITIONS.md`; implement only
the benchmarks-move and the `config.toml` caveat. By default (no box ticked).**

**Rationale (verbatim from § E5):** "criterion 8's own words are 'dispositioned rather than silently
dropped'. The two cheap ones land; the three that are design questions get a written answer and a
todo, which is what 'dispositioned' means."

**Rejected:** (b) implement all five — "the id-JSONB FK question depends on the unbuilt three-option
election filter, so it cannot be answered by implementing anything today." (c) defer all five to the
backlog — "five reviewer questions get no answer, which is exactly the 'silently dropped' outcome the
criterion forbids."

**Operator free text:** none.

**All five, each with its recorded disposition** (none may be silently dropped):

| # | Item | Measured anchor | Disposition under (a) |
|---|---|---|---|
| 1 | Benchmark results → Supabase README, scripts archived behind a named commit | `apps/supabase/benchmarks/{data,k6,pgbench,results,scripts,README.md}` — exists | **IMPLEMENT** (one of the two cheap ones) |
| 2 | `lint-schema.mjs` evaluated for expression as pgTAP tests | `apps/supabase/scripts/lint-schema.mjs` — exists; wired as `yarn lint:schema` in `apps/supabase/package.json` | **ANSWER ON THE RECORD + todo**; design question, no edit |
| 3 | `config.toml` hard-coded ports resolved from env or documented as a caveat | `apps/supabase/supabase/config.toml:10,29,31,41,91,102,104,105,375` — all nine verified present | **IMPLEMENT the caveat** (the second cheap one) |
| 4 | id-JSONB foreign-key linkage question | `103-questions.sql:20-23` — `election_ids`, `election_rounds`, `constituency_ids`, `entity_type`, all `jsonb`, verified | **ANSWER ON THE RECORD + todo**; blocked on the unbuilt three-option election filter |
| 5 | Feedback IP-address encryption | `107-feedback.sql:14` | **ANSWER ON THE RECORD + todo** — see D-E6 |

**Deliverable:** a committed `156-DISPOSITIONS.md` in this phase directory carrying all five answers.
It is also where criterion 6's *"with the choice recorded"* (`merge_custom_data` rename vs.
generalise) belongs — and Contract C3 makes that entry a hard prerequisite for planning 157.
Todos are filed per **D-N2** into `.planning/todos/pending/`.

### D-E6 — Feedback IP address (`107-feedback.sql:14`, plain-text PRIMARY KEY)

**Won: option (a) — answer on the record, recommending a salted hash with a per-deployment secret;
implement only if E5 lands as (b). By default (no box ticked).**

**E5 landed as (a), not (b) — therefore D-E6 implements nothing.** The recommendation is written into
`156-DISPOSITIONS.md` and filed as a todo.

**Rationale (verbatim from § E6):** "the reviewer asked for an *investigation in a follow-up task*, and
hashing changes the rate-limit key semantics (`:55-63` `'unknown'` fallback and the advisory lock) in a
way that wants its own test."

**Rejected:** (b) implement the salted hash now — "closes a real PII exposure immediately; changes the
primary key of a live table and the advisory-lock derivation inside a phase already renaming an enum."
(c) truncate the last octet — "still PII-adjacent and collapses more distinct clients into shared
rate-limit buckets, worsening the Copilot finding at `:59`."

**Operator free text:** none.

Verified anchors: `private.feedback_rate_limits.ip_address text PRIMARY KEY` at `107-feedback.sql:14`;
the `'unknown'` fallback at `:55` inside the `x-forwarded-for` `SPLIT_PART` at `:52-58`; the
`TRIM` at `:59`; the advisory lock `pg_advisory_xact_lock(hashtext('feedback_rate:' || p_client_ip))`
at `:62`; the upsert at `:65`. (§ E6 cites the fallback block as `:55-63` — measured, it is `:51-62`
inclusive of the comment lines; the substance is identical.)

---

### Cross-cutting decisions that bind this phase

- **D-0.1 (c) — TICKED, an overrule of the ★.** The § 0 fact table is the run's factual baseline **and**
  `.planning/ROADMAP.md:1003-1217` is being corrected in place so the phase entries stop carrying false
  premises. **Consequence for this phase:** another agent is editing the roadmap's Phase 156 entry
  concurrently. **Where the roadmap and a § 0 fact disagree, the fact wins** — the facts were measured
  at HEAD `bff94f382` this session, the roadmap's numbers were not. This CONTEXT.md is written against
  the roadmap entry as read at `ROADMAP.md:1076-1093` on 2026-08-28, which carried **no**
  "Corrected 2026-08-28" block at read time (Phase 157's entry did). If the corrected entry differs
  from what is restated in `<domain>`, prefer the corrected entry for *criterion wording* and this
  document for *decisions and measurements*.
- **D-N1 (a)** — Phase 152's comment purge runs first, with its scan landed in `yarn lint:check`.
  **Consequence:** every comment 156 writes or rewrites must satisfy that scan — **no phase numbers, no
  planning-artifact paths, no decision ids in SQL or dev-seed comments.** The `party`-bearing comments
  156 touches (`303-column-grants.sql:3,22,48`, `502-email-helpers.sql:72,132`, `300-auth-tables.sql:14`)
  are rewritten to describe current behaviour, not to cite this phase.
- **D-N2 (a)** — the three D-E5 todos and the D-E6 IP-hash todo are filed as
  `.planning/todos/pending/` items **during this phase**, not as roadmap backlog entries and not as
  GitHub issues. That register is the project's existing mechanism and `/gsd-discuss-phase`
  cross-references it automatically on future phases.
- **D-N3 (a)** — this document is the per-phase CONTEXT; `.planning/v2.15-DISCUSSION-POINTS.md` is the
  shared discussion log and the authority on anything not restated here.
- **D-F3 (a)** — the `get_questions` RPC lands **whole in 157**, SQL and wiring together. Rationale
  verbatim: "the RPC's shape is driven by the adapter's needs (election / constituency / election-round
  filtering), and splitting it means 156 ships an RPC with no consumer and no way to verify its
  signature is right." **156 must not create `get_questions`.**

### Claude's Discretion

- The wave decomposition of the rename (schema+migrations / pgTAP / dev-seed / frontend / generated
  types) and their ordering, provided both SQL copies move in the same commit per D-E2.
- The concrete enum name and member list for criterion 2's `scope_type`, subject to Contract C2.
- Whether criterion 6's `merge_custom_data` is renamed or generalised — **but the choice must be
  written into `156-DISPOSITIONS.md`**, per criterion 6's own wording and Contract C3.
- The mechanical form of the PostgREST-denial proof for criterion 5 (pgTAP vs. an HTTP-shaped check),
  provided it covers both tables × three columns.
- The exact structure of `156-DISPOSITIONS.md`.


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-E1:** `party` → `organization`: how far does the rename reach
- **D-E2:** Rewrite migrations in place, or add a new migration
- **D-E3:** Column grants: both tables, or candidates only
- **D-E4:** `102-entities.sql:27` — remove `name` from candidates, organizations, or both
- **D-E5:** The five "investigate" items in criterion 8
- **D-E6:** Feedback IP address (`107-feedback.sql:14`, plain-text PRIMARY KEY)

</decisions>

<facts>
## Measured Facts

All file paths below were opened and the cited lines read on **2026-08-28**, branch
`integration/ship-12-squash`. § 0 facts are quoted with their numbers; anything labelled
**"re-verified"** was independently re-measured this session and agreed; anything labelled
**"new this session"** is not in § 0.

### F-15 — `party` blast radius (§ 0 fact 15)

> "`party` blast radius: schema **17** · migrations **17** · dev-seed **84** · frontend **5** ·
> packages/data **0** — `grep -rn '\bparty\b'` per tree"

**Re-verified, with a measurement caveat the planner needs.** Three of the five figures reproduce
exactly under a raw `\bparty\b` grep; two do not, because they are **identifier-level** counts:

| Tree | Fact 15 | Raw `\bparty\b` | Quoted `'party'` | Verdict |
|---|---:|---:|---:|---|
| `apps/supabase/supabase/schema/` | 17 | **17** | 9 | reproduces on the raw grep |
| `apps/supabase/supabase/migrations/` | 17 | **17** | 9 | reproduces; **all 17 are in `00001_initial_schema.sql`** (00002 and 00003 have zero) |
| `packages/dev-seed/src/` | 84 | **84** | 0 | reproduces on `src/` **only** — whole-package (incl. `tests/`, `README.md`) is 103 |
| `apps/frontend/src` | 5 | 40 | **5** | fact 15's 5 = the identifier hits; the other 35 are prose and i18n JSON |
| `packages/data/src` | 0 | 21 | **0** | fact 15's 0 = identifier hits; the 21 are JSDoc prose and test fixtures |

**F-15b — the five frontend identifier sites, enumerated:**

- `apps/frontend/src/params/etSg.test.ts:23` — `['party', false]`
- `apps/frontend/src/params/etPl.test.ts:24` — `['party', false]`
- `apps/frontend/src/lib/components/entityTag/EntityTag.svelte:39` — `organization: 'party'`
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:180` —
  `r.role === 'candidate' || r.role === 'party'`
- `apps/frontend/src/routes/candidate/login/+page.server.ts:41` — same predicate

**F-15c — new this session, not in § 0:** the pgTAP suite carries **56** `party` occurrences
(**8** quoted literals) across `apps/supabase/supabase/tests/database/`, including the filename
`05-party-admin.test.sql`. `packages/supabase-types/src/database.ts:1313` and `:1449` carry the enum
value in generated output. `apps/supabase/supabase/seed.sql` and `apps/supabase/supabase/functions/`
are clean (0). `tests/` (E2E) has 29 raw hits and **0** quoted literals.

**F-15d — new this session:** the enum is `public.user_role_type` at `000-enums.sql:24-26`:
`'candidate', 'party', 'project_admin', 'account_admin', 'super_admin'`. A separate
`public.entity_type` at `:16-18` already reads `'candidate', 'organization', 'faction', 'alliance'` —
i.e. **the codebase already uses `organization` as the entity vocabulary**; only the *role* vocabulary
still says `party`. That asymmetry is the defect.

### F-16 — column grants (§ 0 fact 16)

> "`303-column-grants.sql` grants `sort_order, created_at, updated_at` on **both** candidates
> (`:31-36`) and organizations (`:52-55`)"

**Re-verified.** Exact statement boundaries measured:

- candidates — `REVOKE UPDATE` at **`:31`**, `GRANT UPDATE (` at **`:32`**, column list `:33-35`,
  `) ON public.candidates TO authenticated;` at **`:36`**. All three columns present at `:34`.
- organizations — `REVOKE UPDATE` at **`:52`**, `GRANT UPDATE (` at **`:53`**, column list `:54-55`,
  `) ON public.organizations TO authenticated;` at **`:56`**. All three columns present at `:55`.

§ 0's "`:52-55`" is the span up to the last column line; the closing line is `:56`. Substance is
identical — **both tables grant all three columns**, which is what D-E3 resolves.

Also in this file and in the rename's reach: `party` appears in the comments at `:3` ("candidates,
party admins"), `:22` ("`organization_id` - party assignment") and `:48` ("Allowed columns for party
admins").

### F-17 — the missing `>= 1` CHECK (§ 0 fact 17)

> "`104-nominations.sql:46` — `election_round integer DEFAULT 1`, no `>= 1` CHECK. The
> `num_nonnulls(...) = 1` CHECK at `:52` is a *different* constraint and is present"

**Re-verified verbatim.** `104-nominations.sql:46` reads
`election_round       integer     DEFAULT 1,` — no CHECK. `:52` reads
`CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)` — the
exactly-one-entity-FK constraint, unrelated.

> **⚠ Planner warning.** These are two different constraints that both contain the token `= 1`.
> **Do not conflate them.** Criterion 3 is satisfied only by a **new** `CHECK (election_round >= 1)`
> on `nominations`, proven by an insert with `election_round = 0` being rejected. Observing the
> `num_nonnulls` CHECK and declaring the criterion met is a false pass.

### Other measured anchors for the remaining criteria

- **Criterion 2** — `300-auth-tables.sql:13` is already `role user_role_type NOT NULL` (typed);
  `:14` is `scope_type text NOT NULL,  -- 'candidate', 'party', 'project', 'account', 'global'` —
  **this is the free-string column**. The string comparisons in `301-auth-functions.sql` are at
  `:78` (`p_check_role = 'super_admin'`), `:83`, `:118`, `:120-122`, `:126`, `:128-129` — all
  `role_entry->>'role'` / `->>'scope_type'` JSONB text extractions compared to string literals.
- **Criterion 4** — `011-validation-functions.sql:164` is `WHEN 'image' THEN`; the block to extract
  runs `:165-176+` (`jsonb_typeof(p_answer_value) != 'object'` at `:165`, the `path` presence check at
  `:169`, its type check at `:172`, `pathDark` at `:175`).
- **Criterion 6 — new this session:** exactly **two** entity tables carry an `answers` column —
  `105-answers.sql:11` (`candidates`) and `:12` (`organizations`). Factions and alliances do **not**.
  So "all entities carrying answers, organizations included" = **candidates + organizations**, a
  two-table generalisation, not a four-table one. Today `upsert_answers` writes
  `UPDATE public.candidates` in **both** branches (`503-entity-rpcs.sql:160` overwrite branch,
  `:169` merge branch) and raises `'Entity not found or access denied: %'` when `NOT FOUND` (`:182`).
- **Criterion 7** — `102-entities.sql`: organizations `name` at `:7`, `short_name` at `:8`;
  candidates `name` at **`:27`**, `short_name` at `:28`, `first_name` at `:38`, `last_name` at `:39`.
  Confirms D-E4's premise exactly: only candidates carry first/last name columns.
- **Criterion 8 anchors** — all verified present: `apps/supabase/benchmarks/` (with `results/`),
  `apps/supabase/scripts/lint-schema.mjs`, `config.toml` ports at `:10,29,31,41,91,102,104,105,375`,
  `103-questions.sql:20-23`, `107-feedback.sql:14`.

### F-NEW — the two-copies-of-the-schema structure (not in § 0; load-bearing for D-E2)

Measured, and documented in-tree at `apps/supabase/README.md:8-27`:

- `apps/supabase/supabase/config.toml` — `[db.migrations] schema_paths = []`. The CLI **never** reads
  `supabase/schema/`.
- `supabase/migrations/` holds three files: `00001_initial_schema.sql` (132,934 B),
  `00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql`,
  `00003_authenticated_insert_feedback.sql`. `supabase db reset` runs these and nothing else.
- `schema/*.sql` concatenated in filename order equals `00001` with 00002/00003 applied. Verified by
  sampling: `CREATE TYPE public.user_role_type` at `schema/000-enums.sql:24` ↔ `00001:24`;
  `election_round integer DEFAULT 1` at `schema/104-nominations.sql:46` ↔ `00001:735`;
  `REVOKE UPDATE ON public.organizations` at `schema/303-column-grants.sql:52` ↔ `00001:1850`.
- There is **no build or codegen script** producing one from the other (`apps/supabase/package.json`
  has `start/stop/reset/diff/status/lint:sql/lint:schema/lint:all/test:unit` and nothing else). The
  README states plainly: **"Nothing verifies that they agree."**

**Every one of criteria 1–7 must therefore be applied twice, in the same commit.** This is the
principal execution hazard of the phase.

</facts>

<open>
## Open — uncovered by any decision, or unresolved

### O-1 — Roadmap criteria 2, 3, 4 and 6 have no discussion decision

§ E resolves criteria 1 (E1/E2), 5 (E3), 7 (E4) and 8 (E5/E6). **Criteria 2, 3, 4 and 6 were not
discussed** — the roadmap text governs them, and their targets are measured under `<facts>`. Two of
them carry a real sub-question the planner must resolve and record:

- **Criterion 2** — what enum, with what members, replaces `user_roles.scope_type text`? The comment's
  vocabulary is `'candidate','party','project','account','global'`, which is neither `entity_type` nor
  the scope vocabulary Phase 162 will introduce (`global`/`account`/`project`/`entity`). **Contract C2
  applies:** 156 should not paint 162 into a corner. Not decided here.
- **Criterion 6** — `merge_custom_data`: **rename** to `merge_question_custom_data`, or **generalise**
  to other tables? The roadmap offers both and requires "the choice recorded". **Undecided.** It is
  the one 156 output whose shape 157 cannot proceed without (Contract C3), so it should be settled
  early in planning and written to `156-DISPOSITIONS.md`.
- Criteria 3 and 4 are mechanically determined by the measured anchors; no open question beyond the
  F-17 conflation warning.

### O-2 — `REVIEW-DB-01..08` are not defined anywhere

`ROADMAP.md:1080` cites `REVIEW-DB-01..08` as this phase's requirements, but
`.planning/REQUIREMENTS.md` contains **no `REVIEW-*` and no `PRESHIP-*` identifier at all** (grep
returns nothing across an 83,932 B file). The same gap affects Phases 157–164. A verifier tracing
requirement coverage will find dangling ids. Either the ids need adding to REQUIREMENTS.md, or the
roadmap's requirement line needs to point at `.planning/PRE-SHIP-REVIEW-TRIAGE.md` (the stated source
of the 18 review comments). **Not resolvable inside this phase's scope; flagged for the milestone.**

### O-3 — no drift check exists between `schema/` and `migrations/`

Per F-NEW, "nothing verifies that they agree" — and this phase is about to edit both copies across
eight criteria. A mechanical equality check (concatenate `schema/*.sql`, compare against `00001` +
later migrations) would convert the phase's principal hazard into a test. **Not in any criterion and
not decided.** Candidates for where it could land: `apps/supabase/scripts/lint-schema.mjs` (already
wired as `yarn lint:schema`, and itself item 2 of criterion 8), or Phase 163's CI gates. Raised, not
chosen.

### O-4 — the `party` → `organization` rename's effect on live JWT claims

`301-auth-functions.sql:30` emits `'role', ur.role::text` into the access-token claims, and
`302-rls.sql` reads `role_entry->>'role'`. After the rename, **any session issued before the reset
carries a stale `'party'` claim**. In local development this is a non-issue (`db:reset` invalidates
everything). It is recorded here so no planner writes a migration note claiming zero session impact,
and so 162 — which rewrites this predicate surface — inherits the observation.

### O-5 — how criterion 5's "PostgREST-shaped attempt" is to be observed

The criterion asks for an observed failure, not merely a revoked grant. With D-E3 that is **six**
assertions (2 tables × 3 columns). Whether they are expressed as pgTAP (the suite already has
`09-column-restrictions.test.sql`) or as a real HTTP request against the local PostgREST is left to
the planner — noted here so it is not discovered late.

</open>

---

*Phase: 156-supabase-schema-corrections-naming-constraints-grants*
*Context gathered: 2026-08-28*
*Decision source: `.planning/v2.15-DISCUSSION-POINTS.md` § E, § 0 (facts 15–17), § F3, § N — all § E options resolved to ★ RECOMMENDED by the unticked-means-accepted rule*