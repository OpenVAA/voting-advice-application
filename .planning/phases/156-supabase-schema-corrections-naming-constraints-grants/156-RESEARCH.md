# Phase 156: Supabase Schema Corrections — naming, constraints, grants — Research

**Researched:** 2026-08-28
**Domain:** PostgreSQL / Supabase schema surgery — enum rename, CHECK constraints, column privileges, RPC generalisation; plus pgTAP proof design
**Confidence:** HIGH (every load-bearing claim was measured this session against the tree *and*, where possible, against the running local Postgres at `127.0.0.1:54322`)

> **Method note.** The local Supabase stack was already running (`supabase_db_openvaa-local`). Every
> privilege / FK / trigger claim below marked `[VERIFIED: live DB]` was executed as a read-only query
> or inside an explicitly `ROLLBACK`-ed transaction. **No source file was modified and nothing was
> committed.** The user's database state is unchanged.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `156-CONTEXT.md` § `<decisions>`. All six § E decisions resolved to their
★ RECOMMENDED option by the unticked-means-accepted rule. **Do not re-litigate any of these.**

- **D-E1 — won: option (a) — all four surfaces in one phase.**
  > *(a) All four surfaces in one phase — enums, schema, migrations, dev-seed, frontend.*
  > Rejected (c) rename + keep a `party` enum alias for one release — "the reviewer stated in terms
  > that no backward compatibility is owed, so the alias is pure carrying cost." **No compatibility
  > alias is to be created.**

- **D-E2 — won: option (a) — rewrite the existing migrations in place.**
  > **The planner must not add a `00004_*` rename migration**; it must edit
  > `migrations/00001_initial_schema.sql` in place, in lockstep with `schema/`.
  > Option (a) makes `yarn db:reset-with-data` **the** verification.

- **D-E3 — won: option (a) — remove from both tables.**
  > The answer is **both**, and the PostgREST-denial proof must be run against **both** tables —
  > six denial assertions, not three.

- **D-E4 — won: option (a) — remove `name` from `candidates` only; keep `short_name` on both.**
  > it is **`public.candidates.name`** and only that column. `public.organizations.name`
  > (`102-entities.sql:7`) **stays**. `short_name` stays on both.

- **D-E5 — won: option (a) — each answered on the record in a committed `156-DISPOSITIONS.md`;
  implement only the benchmarks-move and the `config.toml` caveat.**
  > **All five, each with its recorded disposition** (none may be silently dropped).

- **D-E6 — won: option (a) — answer on the record, recommending a salted hash with a
  per-deployment secret; implement only if E5 lands as (b).**
  > **E5 landed as (a), not (b) — therefore D-E6 implements nothing.**

Cross-cutting:

- **D-N1 (a)** — Phase 152's comment purge runs first, with its scan landed in `yarn lint:check`.
  **every comment 156 writes or rewrites must satisfy that scan — no phase numbers, no
  planning-artifact paths, no decision ids in SQL or dev-seed comments.**
- **D-N2 (a)** — the three D-E5 todos and the D-E6 IP-hash todo are filed as
  `.planning/todos/pending/` items **during this phase**.
- **D-N3 (a)** — `156-CONTEXT.md` is the per-phase CONTEXT; `.planning/v2.15-DISCUSSION-POINTS.md`
  is the authority on anything not restated there.
- **D-F3 (a)** — `get_questions` lands **whole in 157**. **156 must not create `get_questions`.**
- **D-0.1 (c)** — the § 0 fact table is the factual baseline; where the roadmap and a § 0 fact
  disagree, **the fact wins**.

### Claude's Discretion

Copied verbatim from `156-CONTEXT.md`:

- The wave decomposition of the rename (schema+migrations / pgTAP / dev-seed / frontend / generated
  types) and their ordering, provided both SQL copies move in the same commit per D-E2.
- The concrete enum name and member list for criterion 2's `scope_type`, subject to Contract C2.
- Whether criterion 6's `merge_custom_data` is renamed or generalised — **but the choice must be
  written into `156-DISPOSITIONS.md`**, per criterion 6's own wording and Contract C3.
- The mechanical form of the PostgREST-denial proof for criterion 5 (pgTAP vs. an HTTP-shaped check),
  provided it covers both tables × three columns.
- The exact structure of `156-DISPOSITIONS.md`.

### Deferred Ideas (OUT OF SCOPE)

From `156-CONTEXT.md` § "Not in scope":

- The `get_questions` RPC — Phase 157.
- The permissions/grants-matrix rewrite, `can_edit_project`, `is_child_nominee`, the `grants`
  table — Phase 162.
- `PROJECT_ID` parameterisation — Phase 161.
- Implementing the salted-hash IP change (D-E6), the pgTAP re-expression of `lint-schema.mjs`, or the
  id-JSONB FK linkage (D-E5) — dispositioned in writing, not built.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REVIEW-DB-01..08 | **Not defined anywhere.** `.planning/REQUIREMENTS.md` contains no `REVIEW-*` identifier. | **Do not invent definitions.** `156-CONTEXT.md` § O-2 files this as an unresolved milestone-level gap. The eight roadmap **Success Criteria** (ROADMAP.md:1087-1094) are the operative requirement set for this phase; this research is organised against those, criterion 1 through criterion 8. A verifier tracing `REVIEW-DB-0N` will find a dangling id — that is a known, filed defect, not a 156 deliverable. |

**Verified:** `grep -rn 'REVIEW-DB' .planning/REQUIREMENTS.md` returns nothing. `[VERIFIED: measured this session]`

</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directives that bind this phase specifically:

1. **E2E hard rule (cardinal failure).** "Failing E2E tests are a CARDINAL FAILURE. No task may
   proceed, complete, or be marked done while any E2E test is failing." No known-flaky exemptions.
   A "did not run" test counts as a failure. **The recommended interim check is the whole suite
   (`yarn test:e2e`), not ad-hoc manual checks.**
2. **E2E preflight.** Playwright global setup asserts the served app came from *this* checkout via
   Vite's `/@fs` endpoint. No flag or env var skips it. `FRONTEND_PORT` is the only escape hatch.
3. **`db:*` touches only the database; `dev:*` drives the full stack.** `yarn db:reset-with-data`
   is DB-only — it does **not** restart the frontend or clear the vite cache.
4. **Use TypeScript strictly — avoid `any`, prefer explicit types.** Relevant to the
   `packages/supabase-types` regeneration and any dev-seed template edits.
5. **Never commit sensitive data.** Relevant to D-E6's per-deployment secret recommendation — the
   disposition must recommend a secret-management path, not an inline literal.
6. **Always check code against `/.agents/code-review-checklist.md`.**
7. **`yarn db:types` regenerates `packages/supabase-types` — never hand-edit generated output.**

---

## Summary

This phase is **not eight independent fixes**. It is one edit applied to **two hand-maintained copies
of the same schema**, eight times over, plus a fan-out into pgTAP, dev-seed, the frontend and
generated types. The dominant risk is not any individual criterion — every one of them is mechanically
small — it is that a criterion lands in `schema/` and not `migrations/` (or the reverse), producing a
green-looking diff and an unchanged database. `apps/supabase/README.md:26` states the hazard in the
repo's own words: **"Nothing verifies that they agree."**

The good news, measured this session: **the two copies are in an exactly characterisable
relationship**. `cat schema/*.sql` differs from `migrations/00001_initial_schema.sql` by precisely
**26 diff lines in 3 hunks**, and all three hunks are exactly the deltas that migrations `00002` and
`00003` later applied. That yields a **closed-form line-offset map** (below) letting the planner write
per-file line anchors for *both* copies, and it makes a mechanical drift check cheap enough to
recommend.

The second-order finding: **rewrite-in-place (D-E2) makes the hard parts free.** Criterion 2 changes
`has_role`'s parameter types — normally a `DROP FUNCTION … CASCADE` that would take 9 RLS policies
with it. Under rewrite-in-place there is no `DROP`: the function is simply *created* with the new
signature before the policies that call it, and `supabase db reset` replays a history that was never
wrong. The same applies to criterion 7's `RETURNS TABLE` shapes and criterion 6's rename.

Three cross-cutting findings the CONTEXT does not carry, each verified live:

- **The `app_settings` FK claim holds exactly.** 13 FKs reference `public.projects`; 12 are
  `ON DELETE CASCADE`, one is `NO ACTION` — `app_settings_project_id_fkey`. Deleting a project
  raises a live FK violation, measured. Recommendation: **fix it in 156.**
- **Criterion 5 is safe.** Revoking `updated_at` from the `authenticated` grant does **not** break
  candidate self-edit: the `set_updated_at` trigger writes the column regardless of the caller's
  column privileges. Proven in a rolled-back transaction.
- **Criterion 7 reaches two RPCs the CONTEXT lists as "none in 156".** `candidates.name` is read by
  `get_nominations` *and* `get_candidate_user_data` (which declares `name jsonb` in its
  `RETURNS TABLE`), and `get_nominations` exists in a **third** copy inside
  `migrations/00002_*.sql`. Contract C3 needs amending.

**Primary recommendation:** decompose into waves by *surface*, not by criterion — Wave A applies all
seven SQL criteria to **both** SQL copies in one commit and adds a concatenation drift check; Wave B
moves pgTAP (including the `05-party-admin.test.sql` file rename); Wave C does dev-seed + frontend +
`yarn db:types`; Wave D writes `156-DISPOSITIONS.md`, files the four todos, and moves the benchmark
results. Gate on `yarn db:reset-with-data` → `npx supabase test db` → `yarn lint:check` →
`yarn test:e2e`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Enum vocabulary (`user_role_type`, new scope enum) | Database / Storage | — | The enum is the source of truth; generated types and frontend literals are downstream projections |
| Column-level write authorisation | Database / Storage | — | `GRANT UPDATE (cols)` is enforced by Postgres; PostgREST is a pass-through. No application-tier check is possible or wanted |
| Value constraints (`election_round >= 1`) | Database / Storage | — | A CHECK is the only place the invariant cannot be bypassed |
| Image-shape validation (`is_image`) | Database / Storage | Frontend (`parseStoredImage`) | DB owns the *rejection*; the frontend already has a runtime guard for reads (`apps/frontend/src/lib/api/adapters/supabase/utils/…parseStoredImage`) |
| Entity answer writes (`upsert_answers`) | Database / Storage (RPC) | API/Adapter (call site) | RPC widens internally; the adapter call site stays source-compatible |
| Question custom-data merge (`merge_custom_data`) | Database / Storage (RPC) | API/Adapter (2 call sites) | Name/shape is an interface consumed by 157 — Contract C3 |
| Display name for candidates | Frontend | Database | Candidates' display name is derived from `first_name`/`last_name` in the frontend; the DB `name` column is the redundant duplicate criterion 7 removes |
| Schema↔migration agreement | Repo tooling (`lint-schema.mjs` / CI) | — | Not enforceable in Postgres; must be a repo-level check |
| Disposition record (`156-DISPOSITIONS.md`) | Planning artifacts | — | Not code. Criterion 8's deliverable is a document |

---

## Standard Stack

**This phase introduces no new packages.** Every tool it needs is already installed and wired.

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Supabase CLI | `catalog:` pin in `apps/supabase/package.json` | `supabase db reset`, `supabase test db` | Already the project's migration + pgTAP runner `[VERIFIED: apps/supabase/package.json]` |
| PostgreSQL | 15 (`config.toml:36` — `major_version = 15`) | The schema itself | `[VERIFIED: apps/supabase/supabase/config.toml:36]` |
| pgTAP | bundled with `supabase test db` | 10 planned test files, 264 planned assertions | `[VERIFIED: measured — see plan() table below]` |
| `@openvaa/dev-seed` | workspace | `yarn db:seed --template default` | The criterion-1 gate's second half `[VERIFIED: package.json db:reset-with-data]` |
| `packages/supabase-types` | workspace | `yarn db:types` regeneration | `[VERIFIED: package.json:"db:types": "yarn workspace @openvaa/supabase-types generate"]` |
| Playwright | installed | `yarn test:e2e` — 42 spec files | `[VERIFIED: find tests -name '*.spec.ts' \| wc -l` → 42]` |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `psql` (`/usr/local/opt/postgresql@17/bin/psql`) | Ad-hoc verification against `127.0.0.1:54322` | Confirming a grant/FK/trigger claim without a full reset. **Read-only or `ROLLBACK`.** `[VERIFIED: command -v psql]` |
| `node apps/supabase/scripts/lint-schema.mjs` | `yarn db:lint:sql` → `lint:all` → `lint:sql && lint:schema` | RLS-disabled + unindexed-FK advisors. Candidate home for a drift check `[VERIFIED: apps/supabase/scripts/lint-schema.mjs:1-70, 185 lines]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pgTAP `throws_ok(…, '42501', …)` for criterion 5 | Real HTTP `PATCH` against local PostgREST (`:54321`) | See § "Criterion 5" — the HTTP form needs a minted JWT, a live Kong, and adds a network dependency to a suite that runs in-transaction. The pgTAP form reproduces the *same* privilege check. **Recommend pgTAP.** |
| Byte-`cmp` drift check | `pg_dump --schema-only` comparison of two scratch DBs | `cmp` is free and runs offline but is defeated by the 3 known hunks; `pg_dump` is semantically exact but needs two databases. See § "Drift check". |

**Installation:** none. `yarn install` already satisfies this phase.

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** No `npm install` / `pip install` /
`cargo add` appears in any criterion, and no new dependency is required by any recommendation in this
document. `[VERIFIED: measured — all eight criteria are edits to existing SQL, TS, and Markdown]`

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

---

## Architecture Patterns

### The two-copy structure — and the closed-form offset map

`config.toml:53-58` reads verbatim:

```
[db.migrations]
# If disabled, migrations will be skipped during a db push or reset.
enabled = true
# Specifies an ordered list of schema files that describe your database.
# Supports glob patterns relative to supabase directory: "./schemas/*.sql"
schema_paths = []
```

`[VERIFIED: apps/supabase/supabase/config.toml:53-58]` — `schema_paths = []`, so **the CLI never
reads `supabase/schema/`.** `supabase db reset` applies `migrations/` and nothing else.

**Measured relationship** `[VERIFIED: measured this session]`:

```
$ diff <(cat schema/*.sql) migrations/00001_initial_schema.sql | wc -l
26
```

Exactly **3 hunks**, and all three are the 00002/00003 deltas:

| Hunk | concat lines | 00001 line | What it is |
|---|---|---|---|
| `1578,1583d1577` + `1585c1579` | 1578-1585 | 1577-1579 | The `anon_select_candidates` ToU tightening from **00002** |
| `1776,1781d1769` | 1776-1781 | 1769 | The `authenticated_insert_feedback` policy from **00003** |
| `3191,3197d3178` | 3191-3197 | 3178 | The `COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` guard in `get_nominations` from **00002** |

**Line-offset map — `schema/<file>:<n>` → `migrations/00001_initial_schema.sql:<m>`**

Step 1, file base offsets (`concat_start` = 1 + sum of preceding files' line counts)
`[VERIFIED: measured via per-file wc -l this session]`:

| schema file | lines | concat_start |
|---|---:|---:|
| `000-enums.sql` | 26 | 1 |
| `010-utility-functions.sql` | 54 | 27 |
| `011-validation-functions.sql` | 298 | 81 |
| `100-tenancy.sql` | 27 | 379 |
| `101-elections.sql` | 80 | 406 |
| `102-entities.sql` | 90 | 486 |
| `103-questions.sql` | 114 | 576 |
| `104-nominations.sql` | 61 | 690 |
| `105-answers.sql` | 158 | 751 |
| `106-app-settings.sql` | 19 | 909 |
| `107-feedback.sql` | 94 | 928 |
| `108-admin-jobs.sql` | 27 | 1022 |
| `200-indexes.sql` | 48 | 1049 |
| `300-auth-tables.sql` | 67 | 1097 |
| `301-auth-functions.sql` | 150 | 1164 |
| `302-rls.sql` | 497 | 1314 |
| `303-column-grants.sql` | 56 | 1811 |
| `400-storage.sql` | 531 | 1867 |
| `500-external-id.sql` | 122 | 2398 |
| `501-bulk-operations.sql` | 433 | 2520 |
| `502-email-helpers.sql` | 157 | 2953 |
| `503-entity-rpcs.sql` | 189 | 3110 |
| `504-admin-rpcs.sql` | 36 | 3299 |
| `900-test-helpers.sql` | 75 | 3335 |

Step 2, `concat = concat_start + n - 1`. Step 3, apply the hunk offset:

| concat range | subtract |
|---|---:|
| 1 – 1577 | 0 |
| 1584 – 1775 | 6 |
| 1782 – 3190 | 12 |
| 3198 – 3409 | 19 |

**Validated on 6 independent anchors** `[VERIFIED: cross-checked against grep line numbers in
migrations/00001_initial_schema.sql this session]`:

| schema anchor | concat | predicted 00001 | actual grep hit |
|---|---:|---:|---:|
| `000-enums.sql:25` (`'candidate', 'party', …`) | 25 | 25 | 25 ✓ |
| `300-auth-tables.sql:14` (`scope_type text`) | 1110 | 1110 | 1110 ✓ |
| `302-rls.sql:230` (`has_role('party','party',id)`) | 1543 | 1543 | 1543 ✓ |
| `303-column-grants.sql:3` (comment) | 1813 | 1801 | 1801 ✓ |
| `501-bulk-operations.sql:215` (comment) | 2734 | 2722 | 2722 ✓ |
| `502-email-helpers.sql:72` (comment) | 3024 | 3012 | 3012 ✓ |

`migrations/00001_initial_schema.sql` is **3390 lines**; concat is **3409**; 3409 − 19 = 3390 ✓
`[VERIFIED: wc -l this session]`

> **Caveat for the planner:** the offsets are valid *only until the first edit*. Once Wave A inserts
> a CHECK line into `104-nominations.sql`, everything downstream shifts. **Anchor tasks on
> content-matched strings, not on line numbers, for anything after the first edit.** The map exists
> so the planner can *locate* the pairs, not so the executor can seek to a fixed offset.

### Recommended wave structure

```
Wave A — SQL (schema/ + migrations/ in ONE commit)
├── criterion 1  party → organization  (17 lines × 2 copies)
├── criterion 2  scope_type enum + has_role/can_access_project enum params
├── criterion 3  CHECK (election_round >= 1)
├── criterion 4  extract is_image / validate_image
├── criterion 5  drop sort_order/created_at/updated_at from both GRANT lists
├── criterion 6  upsert_answers widened; merge_custom_data renamed
├── criterion 7  drop candidates.name (+ 2 RPCs + 00002)
└── (recommended) app_settings FK → ON DELETE CASCADE
Wave B — pgTAP  (05-party-admin.test.sql rename + 56 party hits + new assertions)
Wave C — dev-seed comments (84 hits) + frontend 5 identifier sites + yarn db:types
Wave D — 156-DISPOSITIONS.md, 4 todos, benchmarks move, config.toml port caveat
Gate    — db:reset-with-data → supabase test db → lint:check → test:e2e
```

**Why Wave A must be one commit, not seven.** The two SQL copies must move together (D-E2). Splitting
by criterion means seven chances for one copy to be forgotten. Splitting by *copy* is worse. One
commit whose diff shows each change twice is the shape that makes the omission visible in review.

### Pattern: criterion 2 under rewrite-in-place

`has_role`'s current signature `[VERIFIED: apps/supabase/supabase/schema/301-auth-functions.sql:58-62]`:

```sql
CREATE OR REPLACE FUNCTION public.has_role(
  p_check_role text,
  p_check_scope_type text DEFAULT NULL,
  p_check_scope_id uuid DEFAULT NULL
)
```

The string comparisons `[VERIFIED: 301-auth-functions.sql:76-83, 118-129]`:

```sql
    IF role_entry->>'role' = p_check_role THEN
      -- super_admin has global access, no scope check needed
      IF p_check_role = 'super_admin' THEN RETURN true; END IF;
      -- If no scope filter requested, any matching role suffices
      IF p_check_scope_type IS NULL THEN RETURN true; END IF;
      -- Check exact scope match
      IF role_entry->>'scope_type' = p_check_scope_type
         AND role_entry->>'scope_id' = p_check_scope_id::text THEN
```

and in `can_access_project` `[VERIFIED: 301-auth-functions.sql:118-129]`:

```sql
    IF role_entry->>'role' = 'super_admin' THEN RETURN true; END IF;

    IF role_entry->>'role' = 'project_admin'
       AND role_entry->>'scope_type' = 'project'
       AND role_entry->>'scope_id' = p_project_id::text THEN
```

**Call-site inventory** `[VERIFIED: grep across schema/ this session]` — 14 `has_role(` calls in
`302-rls.sql` at `:26, :27, :32, :36, :37, :41, :53, :54, :60, :61, :230, :242, :246, :279` (plus a
doc comment at `:6`). Live DB confirms **9 policies** carry a `has_role` reference in their
qual/with_check `[VERIFIED: live DB — pg_policies query]`; total policies in `public` = **82**
`[VERIFIED: live DB]` (note: `.claude/skills/database/SKILL.md` says 97 — that figure is stale).

Scope vocabulary in use, measured across all 14 calls: `account`, `project`, `party`, and
(implicitly) `candidate` + `global` from the column comment. The full member set for the new enum is
therefore `'candidate', 'organization', 'project', 'account', 'global'` — the column comment at
`300-auth-tables.sql:14` verbatim with `party` renamed:

```sql
  scope_type text           NOT NULL,  -- 'candidate', 'party', 'project', 'account', 'global'
```
`[VERIFIED: apps/supabase/supabase/schema/300-auth-tables.sql:14]`

**Naming recommendation: `public.role_scope_type`, not `public.scope_type`.** A type named
`scope_type` and a column named `scope_type` on the same table is legal but reads ambiguously in
`SET search_path = ''` contexts where the type must be written `public.scope_type` and the column
`ur.scope_type`. `role_scope_type` also signals to Phase 162 that this is the *role*-scoped
vocabulary its `grants` table supersedes (Contract C2).

**Two mechanical facts that de-risk this** `[VERIFIED: live DB]`:

1. Enums serialise into JSONB as JSON strings:
   `jsonb_build_object('role','candidate'::public.user_role_type)` → `{"role": "candidate"}`, and
   `jsonb_typeof(…)` → `string`. So `custom_access_token_hook`'s claim payload
   (`301-auth-functions.sql:28-34`) keeps its wire shape after `scope_type` becomes an enum, and the
   `role_entry->>'scope_type'` reads in `has_role`/`can_access_project` keep working.
2. Under rewrite-in-place there is **no `DROP FUNCTION … CASCADE`**. In `00001` the function is
   created at line ~1221 and the policies at 1327+; changing the parameter types in place means
   `supabase db reset` simply builds the new signature first. This is the single biggest reason
   D-E2(a) is cheaper than it reads for criterion 2.

**Careful:** with `p_check_role public.user_role_type`, the comparison `role_entry->>'role' = p_check_role`
becomes `text = user_role_type` — an operator that does not exist. It must become
`role_entry->>'role' = p_check_role::text` **or**, better and truer to the criterion,
`(role_entry->>'role')::public.user_role_type = p_check_role`. The latter is what "uses enums in
place of string comparison" means; it also makes an unknown role value in a stale JWT raise rather
than silently miss. Weigh that: a stale `'party'` claim (§ O-4) would then **error** rather than
return false. In local dev `db:reset` invalidates every session, so this is safe — but the choice
should be recorded.

### Anti-Patterns to Avoid

- **Editing `schema/` only.** Never reaches a database. The README says so at `:26-27`.
- **Editing `migrations/` only.** Leaves the readable copy wrong; the next reader plans against
  fiction.
- **Adding a `00004_*` rename migration.** Explicitly forbidden by D-E2(a).
- **Creating a `party` enum alias.** Explicitly forbidden by D-E1's rejection of option (c).
- **Creating `get_questions`.** Explicitly forbidden by D-F3.
- **Treating `num_nonnulls(...) = 1` as the missing constraint.** See criterion 3 below — false pass.
- **Anchoring a later task on a line number computed before an earlier task edited the file.**

---

## Criterion-by-criterion findings

### Criterion 1 — `party` → `organization`

**All 17 schema hits, with their migration twins** `[VERIFIED: grep -rn '\bparty\b' this session; migration line numbers from the same grep against migrations/00001_initial_schema.sql]`:

| `schema/` | `00001` | Line content (verbatim) |
|---|---:|---|
| `000-enums.sql:25` | 25 | `    'candidate', 'party', 'project_admin', 'account_admin', 'super_admin'` |
| `300-auth-tables.sql:14` | 1110 | `  scope_type text           NOT NULL,  -- 'candidate', 'party', 'project', 'account', 'global'` |
| `302-rls.sql:230` | 1543 | `    OR (SELECT has_role('party', 'party', id))` |
| `302-rls.sql:238` | 1551 | `-- Party admin self-update: party role holder can update their party` |
| `302-rls.sql:242` | 1555 | `    OR (SELECT has_role('party', 'party', id))` |
| `302-rls.sql:246` | 1559 | `    OR (SELECT has_role('party', 'party', id))` |
| `302-rls.sql:274` | 1581 | `-- Authenticated: project access, own record, party admin for their party's candidates, or published` |
| `302-rls.sql:279` | 1586 | `    OR (SELECT has_role('party', 'party', organization_id))` |
| `303-column-grants.sql:3` | 1801 | `-- Prevents authenticated users (candidates, party admins) from modifying` |
| `303-column-grants.sql:22` | 1820 | `--   organization_id - party assignment` |
| `303-column-grants.sql:48` | 1846 | `-- Allowed columns for party admins (self-edit):` |
| `501-bulk-operations.sql:215` | 2722 | `--   "candidates": [{"external_id": "cand-001", "organization": {"external_id": "party-sdp"}, ...}],` |
| `502-email-helpers.sql:72` | 3012 | `    -- Get the first relevant role (candidate or party) for this user` |
| `502-email-helpers.sql:77` | 3017 | `      AND ur.role IN ('candidate', 'party')` |
| `502-email-helpers.sql:81` | 3021 | `        WHEN 'party' THEN 2` |
| `502-email-helpers.sql:131` | 3071 | `    ELSIF u_role = 'party' AND u_scope_id IS NOT NULL THEN` |
| `502-email-helpers.sql:132` | 3072 | `      -- Resolve organization fields for party role` |

17 in each copy — **the same 17 lines, twice**, exactly as CONTEXT F-15 predicts. ✓

**Two hits the CONTEXT list does not separate out, and both are subtly different work:**

- `501-bulk-operations.sql:215` is a **doc-comment example payload** containing the string
  `"party-sdp"` as an `external_id`. That is sample data, not the enum. Renaming it to
  `"organization-sdp"` is a comment change with no code effect — but leaving it makes the comment
  the only surviving `party` in the file. Recommend renaming for consistency; flag it as
  *not* an identifier so the executor does not go looking for a code site.
- `502-email-helpers.sql:81` `WHEN 'party' THEN 2` sits inside an `ORDER BY CASE` priority ladder,
  not a predicate. Renaming it is mechanical but the surrounding `ORDER BY` must not be reordered.

**One DB object carries `party` in its NAME** `[VERIFIED: live DB — pg_policies WHERE policyname LIKE '%party%']`:

```
   tablename   |           policyname
---------------+--------------------------------
 organizations | party_update_own_organizations
```

No function and no relation in `public`/`private` carries `party` in its name (both queries returned
0 rows) `[VERIFIED: live DB]`. So the rename's *object-name* surface is exactly one policy.
`302-rls.sql:238-246` is that policy's definition block.

**Downstream trees** (measured, agreeing with CONTEXT F-15):

| Tree | raw `\bparty\b` | quoted `'party'` | Work |
|---|---:|---:|---|
| `packages/dev-seed/src/` | **84** | **0** | comment/prose only `[VERIFIED: measured]` |
| `apps/supabase/supabase/tests/database/` | **56** | **8** | code + file rename `[VERIFIED: measured]` |
| `apps/frontend/src` | 40 | **5** | the 5 identifier sites |
| `packages/supabase-types/src/database.ts` | — | 2 (`:1313`, `:1449`) | `yarn db:types` |

dev-seed's 84 hits by file `[VERIFIED: grep -rc this session]` — the top five are
`templates/defaults/nominations-override.ts` (33), `templates/defaults/alliances-override.ts` (12),
`templates/defaults/candidates-override.ts` (10), `generators/CandidatesGenerator.ts` (9),
`emitters/latent/positions.ts` (9). **Zero quoted literals** — this wave cannot break a test by
changing behaviour, only by a careless find-replace inside a string that happens to be display text
(e.g. `'[or-aa] Party AA'` in `templates/e2e/base.ts:521`, which is a *dataset label* an E2E spec may
assert on). **Recommend: restrict dev-seed's rename to comments and identifiers; leave display
strings alone** and say so in the plan, because `tests/` E2E specs match on those labels.

### Criterion 2 — the `scope_type` enum

Covered under § "Pattern: criterion 2" above. Additional anchor: `300-auth-tables.sql:13` is already
typed `[VERIFIED: apps/supabase/supabase/schema/300-auth-tables.sql:13]`:

```sql
  role       user_role_type NOT NULL,
```

so criterion 2's work is entirely (a) `scope_type text` → enum at `:14`, and (b) the enum-ising of
`301-auth-functions.sql`'s comparisons.

**pgTAP fan-out:** `tests/database/00-helpers.test.sql:312` inserts into `user_roles` with literal
scope strings `[VERIFIED: apps/supabase/supabase/tests/database/00-helpers.test.sql:312]`:

```sql
    (test_user_id('party_a'),         'party',         'party',     test_id('org_a')),
```

and `:196-197` builds the JWT claim `[VERIFIED: 00-helpers.test.sql:196-197]`:

```sql
        'role', 'party',
        'scope_type', 'party',
```

Both become `'organization'`. Unknown-typed literals coerce to the enum on INSERT, so no cast is
needed at `:312`.

### Criterion 3 — the missing `>= 1` CHECK ⚠

**Both lines, read and quoted verbatim** `[VERIFIED: apps/supabase/supabase/schema/104-nominations.sql:46 and :52]`:

```sql
  election_round       integer     DEFAULT 1,
```
```sql
  CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)
```

`:46` has a `DEFAULT 1` and **no CHECK**. `:52` is the *exactly-one-entity-FK* constraint and is
**present**. Both contain the token `= 1`. **Do not conflate them.** Criterion 3 is satisfied only by
a **new** `CHECK (election_round >= 1)`, proven by an `INSERT … election_round = 0` being rejected.
Observing `:52` and declaring the criterion met is a false pass.

Migration twin: `104-nominations.sql:46` → concat 735 → **`00001:735`**; `:52` → concat 741 →
**`00001:741`**.

**Nullability caveat:** the column is nullable (`DEFAULT 1` with no `NOT NULL`). `CHECK (election_round >= 1)`
is satisfied by `NULL` (a CHECK passes on NULL). If the intent is "never zero or negative *and* never
absent", the constraint must be `CHECK (election_round IS NOT NULL AND election_round >= 1)` or the
column made `NOT NULL`. The roadmap says only "the missing `>= 1` constraint" — recommend the plain
`>= 1` form (matching the criterion's literal words) and record the NULL-passes caveat in
`156-DISPOSITIONS.md` so it is not discovered later as a hole. `[ASSUMED: intent — the criterion does not say]`

### Criterion 4 — extract `is_image`

**The block, read verbatim** `[VERIFIED: apps/supabase/supabase/schema/011-validation-functions.sql:164-200]`:

```sql
    WHEN 'image' THEN
      IF jsonb_typeof(p_answer_value) != 'object' THEN
        RAISE EXCEPTION 'Answer for image question must be an object';
      END IF;
      -- Validate StoredImage structure: {path, pathDark?, alt?, width?, height?, focalPoint?}
      IF NOT (p_answer_value ? 'path') THEN
        RAISE EXCEPTION 'StoredImage must have a "path" property';
      END IF;
```

…continuing through nine distinct `RAISE EXCEPTION` messages (`path` presence `:169`, `path` type
`:172`, `pathDark` `:175`, `alt` `:178`, `width` `:181`, `height` `:184`, `focalPoint` object `:188`,
`focalPoint` x/y presence `:191`, `focalPoint.x` `:194`, `focalPoint.y` `:197`) and ending at `:200`
`END IF;` — immediately before `:201 END CASE;`. The enclosing function's `CASE` opens at `:115` and
the function body ends `:202 END; :203 $$;`.

**⚠ Design tension the planner must resolve and record.** The criterion says *"extracted into an
`is_image` utility"*. The file's existing utility convention is a **boolean predicate**:
`is_localized_string(p_val JSONB) RETURNS BOOLEAN` `[VERIFIED: 011-validation-functions.sql:16-18]`:

```sql
CREATE OR REPLACE FUNCTION public.is_localized_string(p_val JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
```

But the extracted block does not return a boolean — it **raises nine distinct, informative errors**.
Two shapes:

| Shape | Keeps the 9 messages? | Matches the name `is_image`? | Notes |
|---|---|---|---|
| (a) `is_image(jsonb) RETURNS boolean` + a single generic `RAISE` at the call site | ✗ — collapses to one message | ✓ | Matches `is_localized_string`'s convention exactly. Loses diagnostic value. |
| (b) `is_image(jsonb) RETURNS boolean` **plus** `validate_image(jsonb) RETURNS void` that raises | ✓ | ✓ | Two functions; the predicate is the reusable utility, the validator preserves messages. More surface. |
| (c) `validate_image(jsonb) RETURNS void`, named as the criterion says (`is_image`) but raising | ✓ | ✗ — an `is_*` function that raises is a naming lie | Cheapest, worst name. |

**Recommendation: (b).** It satisfies the criterion's literal name, keeps the existing convention
honest, and keeps every existing error message — which matters because `08-triggers.test.sql`
already exercises `validate_answer_value` rejections (`:44` "Section 2: validate_answer_value --
invalid type rejected") `[VERIFIED: apps/supabase/supabase/tests/database/08-triggers.test.sql:44]`.
No pgTAP test currently asserts an image-specific message (grep for `StoredImage` in `tests/` returns
0 hits `[VERIFIED: measured]`), so (a) would not break a test today — but it would silently reduce
the API's diagnostics. Record the choice in `156-DISPOSITIONS.md`.

### Criterion 5 — column grants ⚠ *the most de-riskable criterion*

**The two GRANT statements, verbatim** `[VERIFIED: apps/supabase/supabase/schema/303-column-grants.sql:31-36 and :52-56]`:

```sql
REVOKE UPDATE ON public.candidates FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, first_name, last_name, answers, created_at, updated_at,
  terms_of_use_accepted
) ON public.candidates TO authenticated;
```

```sql
REVOKE UPDATE ON public.organizations FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, answers, created_at, updated_at
) ON public.organizations TO authenticated;
```

Live DB agrees: 25 column grants for `authenticated` UPDATE across the two tables, including
`sort_order`, `created_at`, `updated_at` on both `[VERIFIED: live DB — information_schema.column_privileges]`.

Migration twins: `303-column-grants.sql:31` → concat 1841 → **`00001:1829`**; `:52` → concat 1862 →
**`00001:1850`**.

**Two findings that make this criterion safe:**

1. **The `updated_at` trigger survives the revoke.** Proven in a rolled-back transaction: with
   `updated_at` **absent** from the `authenticated` grant, an `authenticated` `UPDATE candidates SET
   first_name=…` succeeded and `updated_at` moved from `2000-01-01` to `now()`.
   `[VERIFIED: live DB — rolled-back transaction, trigger_fired_despite_revoked_grant = t]`
   Column privileges are checked against the columns *named in the statement*, not against what a
   `BEFORE UPDATE` trigger assigns. **Removing `updated_at`/`created_at` from the grant cannot break
   candidate self-edit.** This is the objection a reviewer will raise; it is answered.
2. **No application code writes any of the three as `authenticated`.** `sort_order` appears in the
   Supabase adapter only in `.order('sort_order')` reads and row→object mappings
   (`dataProvider/supabaseDataProvider.ts:142, 182, 207, 310, 354, 471, 507, 539`); `created_at` and
   `updated_at` appear nowhere in the adapter. `[VERIFIED: grep over apps/frontend/src/lib/api/adapters/supabase/ this session]`
   The only `authenticated` write path,
   `dataWriter/supabaseDataWriter.ts:_updateEntityProperties`, builds `updateFields` from exactly
   `terms_of_use_accepted` and `image` `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:320-357]`.
   dev-seed writes as `service_role`, which bypasses column grants.

**How the denial is observed — O-5 answered.** `09-column-restrictions.test.sql` already has the
exact pattern `[VERIFIED: apps/supabase/supabase/tests/database/09-column-restrictions.test.sql:29-43]`:

```sql
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT throws_ok(
  format(
    $$UPDATE candidates SET published = true WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  '42501',
  NULL,
  'Candidate cannot update published on own record'
);
```

`set_test_user` sets `role` **and** the full `request.jwt.claims` payload
`[VERIFIED: 00-helpers.test.sql:215-222 docstring: "For 'authenticated': sets role to authenticated,
builds full JWT claims with sub, role, and user_roles fields"]` — which is precisely what PostgREST
does per request. Measured live, a denied column update raises SQLSTATE **42501** with message
`permission denied for table candidates` `[VERIFIED: live DB]`. That is the same error PostgREST
surfaces as HTTP 403.

**Recommendation: express all six assertions as pgTAP in `09-column-restrictions.test.sql`.**
The HTTP alternative needs a minted JWT, a live Kong on `:54321`, and would put a network dependency
inside a suite that today runs entirely in-transaction under `supabase test db`. It would observe the
identical privilege check one layer further out. If the planner wants belt-and-braces, the *E2E*
suite already exercises the real HTTP path end to end — a green `yarn test:e2e` after the revoke is
the HTTP-level evidence, at zero new cost.

`SELECT plan(15);` at `:20` becomes `SELECT plan(21);` — **six** new `throws_ok` assertions
(candidates × {sort_order, created_at, updated_at} + organizations × the same three).
The org-side fixture is already present: `set_test_user('authenticated', test_user_id('party_a'),
test_user_roles('party_a'))` at `:124-128`, and `test_id('org_a')` is the target used at `:132`.

### Criterion 6 — `upsert_answers` + `merge_custom_data`

**`upsert_answers` today** `[VERIFIED: apps/supabase/supabase/schema/503-entity-rpcs.sql:147-187]` —
signature `(p_entity_id uuid, p_answers jsonb, p_overwrite boolean DEFAULT false) RETURNS jsonb`,
`SECURITY INVOKER`, with `UPDATE public.candidates` in **both** branches:

```sql
  IF p_overwrite THEN
    UPDATE public.candidates
```
```sql
  ELSE
    UPDATE public.candidates
```

and `:181-183`:

```sql
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', p_entity_id;
  END IF;
```

Only two tables carry an `answers` column, so "all entities carrying answers" = candidates +
organizations, a **two**-branch widening. The natural shape: try candidates, and if `NOT FOUND`, try
organizations, raising only if both miss. `SECURITY INVOKER` means RLS still gates each attempt, so
the widening grants no new authority. **Signature unchanged → the adapter call site at
`dataWriter/supabaseDataWriter.ts:310` is source-compatible**, exactly as Contract C3 states.

**`merge_custom_data` today** `[VERIFIED: apps/supabase/supabase/schema/504-admin-rpcs.sql:1-36]` —
the whole file, quoted in the material part:

```sql
-- Admin RPC functions
--
-- Functions:
--   merge_custom_data() - shallow JSONB merge on questions.custom_data
```
```sql
CREATE OR REPLACE FUNCTION public.merge_custom_data(
  p_question_id uuid,
  p_patch       jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  p_updated_data jsonb;
BEGIN
  UPDATE public.questions
  SET custom_data = COALESCE(custom_data, '{}'::jsonb) || p_patch
  WHERE id = p_question_id
  RETURNING public.questions.custom_data INTO p_updated_data;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found or access denied: %', p_question_id;
  END IF;

  RETURN p_updated_data;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_custom_data(uuid, jsonb) TO authenticated;
```

**The evidence, and which option it favours.** *Everything except the function's name is already
question-specific*: the parameter is literally `p_question_id`, the target is hard-coded
`public.questions`, the `RETURNING` is `public.questions.custom_data`, the error message says
"Question not found", the file's own header comment says "shallow JSONB merge on
questions.custom_data", and the SECURITY-INVOKER rationale at `:9-10` names the specific policy it
relies on:

```sql
-- SECURITY INVOKER: the existing admin_update_questions RLS policy enforces
-- that only admins with can_access_project() can update questions.
```

A generalisation would require a table discriminator, therefore dynamic SQL (`EXECUTE format(…)`) in
a `SECURITY INVOKER` function, therefore an allow-list of table names to avoid an injection surface —
and, critically, **it would need a per-table restatement of that RLS rationale**, because
`admin_update_questions` gates only `questions`. It would also ship with **no consumer**: both call
sites pass a question id.

**Call sites, measured** `[VERIFIED: grep this session]`:

| Site | Line |
|---|---|
| `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` | `:26` — `await this.supabase.rpc('merge_custom_data', {` |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | `:388` — same |

> ⚠ **Path correction for the planner.** The orchestrator brief cites
> `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseAdminWriter.ts:26`. The measured
> path is `.../adapters/supabase/**adminWriter**/supabaseAdminWriter.ts:26` — a sibling directory,
> not `dataWriter/`. `[VERIFIED: measured]`

Plus **7 pgTAP assertions** naming the function
`[VERIFIED: apps/supabase/supabase/tests/database/10-schema-migrations.test.sql:489, 490, 495, 496, 507, 508, 526, 527, 539, 544, 556, 561, 575, 576]`, including a `has_function`-style shape assertion:

```sql
  'public', 'merge_custom_data', ARRAY['uuid', 'jsonb'],
  'merge_custom_data(uuid, jsonb) function exists'
```

and 4 unit-test references in `adminWriter/supabaseAdminWriter.test.ts:65,74` and
`dataWriter/supabaseDataWriter.test.ts` (the `upsert_answers` block).

**The evidence favours the RENAME to `merge_question_custom_data`.** It is a 1-line signature change
plus 2 call sites, 2 unit-test expectations, ~7 pgTAP strings, and a regenerated
`packages/supabase-types`. Generalisation buys an unused capability at the cost of dynamic SQL inside
an invoker-security function. **The decision is the planner's** (Claude's Discretion) — but the
recommendation is unambiguous, and it must be written into `156-DISPOSITIONS.md` **before Phase 157
is planned** (Contract C3).

### Criterion 7 — remove `public.candidates.name` ⚠ *wider than CONTEXT states*

**The two columns, verbatim** `[VERIFIED: apps/supabase/supabase/schema/102-entities.sql:7-8 and :27-28]`:

```sql
  name         jsonb,
  short_name   jsonb,
```
(organizations, `:7-8` — **both stay**)

```sql
  name            jsonb,
  short_name      jsonb,
```
(candidates, `:27-28` — **`:27` goes, `:28` stays**)

and the first/last-name columns that make it redundant, `102-entities.sql:38-39`:

```sql
  first_name      text        NOT NULL,
  last_name       text        NOT NULL,
```

**Complete knock-on inventory** (every site, with path:line) `[VERIFIED: grep + Read this session]`:

| # | Site | What changes |
|---|---|---|
| 1 | `schema/102-entities.sql:27` → `00001:512` | drop the column |
| 2 | `schema/303-column-grants.sql:33` → `00001:1831` | remove `name,` from the candidates GRANT list |
| 3 | `schema/303-column-grants.sql:28` → `00001:1826` | the comment `--   name, short_name, info, color, image, sort_order, subtype,` must lose `name` |
| 4 | `schema/503-entity-rpcs.sql:62` → `00001:3159` | `COALESCE(c.name, o.name, f.name, a.name) AS entity_name` in `get_nominations` → drop `c.name` |
| 5 | **`migrations/00002_…rls_guard.sql:90`** | **a THIRD copy** — 00002 recreates `get_nominations` with the same `COALESCE(c.name, o.name, f.name, a.name) AS entity_name` line |
| 6 | `schema/503-entity-rpcs.sql:103` → `00001:3193` | `get_candidate_user_data`'s `RETURNS TABLE (… name jsonb, …)` |
| 7 | `schema/503-entity-rpcs.sql:121` → `00001:3211` | `SELECT c.id, c.project_id, c.name, c.short_name, c.info,` — the candidate branch |
| 8 | `packages/supabase-types/src/database.ts` | regenerate via `yarn db:types` |
| 9 | `packages/dev-seed/src/template/permittedKeys.ts:1036` (`export type CandidatesFixedRow = FixedRow<'candidates'>;`) | narrows automatically from the regenerated types; `yarn typecheck` will flag any template still setting `name` |
| 10 | pgTAP | **no site** — grep for a `candidates`-scoped bare `name` in `tests/database/` returns 0 hits |
| 11 | dev-seed templates | **no site** — `CandidatesGenerator.ts` writes only `first_name`/`last_name` (`:111-112`, `:144-145`); `templates/e2e/base.ts` candidate rows carry `first_name`/`last_name` only |
| 12 | frontend | **no required change** if the RPC keeps its column (see below) |

> ⚠ **Contract C3 needs amending.** `156-CONTEXT.md` § C3 records `get_candidate_user_data` as
> "none in 156" and `get_nominations` as "none in 156". **Criterion 7 touches both.** 157's planner
> must be told.

**The minimal, contract-preserving shape** (recommended): keep the RPC output columns and fill the
candidate branch with `NULL::jsonb`.

`get_candidate_user_data` `[VERIFIED: schema/503-entity-rpcs.sql:97-137]` is a `UNION ALL` whose
second branch already reads `o.name` for organizations:

```sql
  SELECT c.id, c.project_id, c.name, c.short_name, c.info,
```
```sql
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
```

So `c.name` → `NULL::jsonb` keeps the `RETURNS TABLE` shape intact and keeps organization rows
returning a real name. `get_nominations`'s `COALESCE(c.name, o.name, f.name, a.name)` simply drops
`c.name` — for a candidate nomination the COALESCE already fell through to whatever the nomination
row itself carried, and the frontend derives a candidate's display name from `first_name`/`last_name`
regardless (`dataProvider/supabaseDataProvider.ts:349` maps `name: row.entity_name`, `:368`
`name: entityObj.name as string | null | undefined` — both tolerate null).
`[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:349,368]`

**Do NOT drop the `name` output column from either RPC in 156.** That is a `RETURNS TABLE` shape
change, which is Phase 164's declared territory ("`RETURNS TABLE` nullability audit"), and it would
break `supabaseDataWriter.ts:214`'s `toDataObject(entityRow…)` generic mapping in a way 157 has not
been planned for.

### Criterion 8 — the five dispositions

| # | Item | Measured anchor | Disposition |
|---|---|---|---|
| 1 | Benchmarks → README, scripts archived | `apps/supabase/benchmarks/` — **7 subtrees**: `README.md` (144 lines, 8 KB), `results/` (148 KB, 38 `.json` + a `.gitignore`), `scripts/` (48 KB, 7 files), `pgbench/` (48 KB), `data/` (28 KB), `k6/` (8 KB) `[VERIFIED: find + du this session]` | **IMPLEMENT** |
| 2 | `lint-schema.mjs` as pgTAP | `apps/supabase/scripts/lint-schema.mjs`, 185 lines, 2 checks (Splinter 0013 RLS-disabled ERROR, 0001 unindexed-FK WARNING), wired `"lint:schema": "node scripts/lint-schema.mjs"` and `"lint:all": "yarn lint:sql && yarn lint:schema"` `[VERIFIED: apps/supabase/package.json + scripts/lint-schema.mjs:1-20]` | **ANSWER + todo** |
| 3 | `config.toml` hard-coded ports | 9 sites verified present: `:10` `port = 54321`, `:29` `port = 54322`, `:31` `shadow_port = 54320`, `:41` `port = 54329`, `:91` `port = 54323`, `:102` `port = 54324`, `:104` `smtp_port = 54325`, `:105` `pop3_port = 54326`, `:375` `inspector_port = 8083` `[VERIFIED: apps/supabase/supabase/config.toml — each line read this session]` | **IMPLEMENT the caveat** |
| 4 | id-JSONB FK linkage | `103-questions.sql:20-23` on **`question_categories`**: `  election_ids    jsonb,` / `  election_rounds jsonb,` / `  constituency_ids jsonb,` / `  entity_type     jsonb`; **and the same four on `questions` at `:48-51`** `[VERIFIED: apps/supabase/supabase/schema/103-questions.sql:20-23, 48-51]` | **ANSWER + todo** |
| 5 | Feedback IP encryption | `107-feedback.sql:14` — `  ip_address   text        PRIMARY KEY,` `[VERIFIED: apps/supabase/supabase/schema/107-feedback.sql:14]` | **ANSWER + todo (D-E6)** |

> **Item 4 note the planner needs:** CONTEXT cites `103-questions.sql:20-23` only. Measured, the same
> four JSONB "linkage" columns exist on **both** `question_categories` (`:20-23`) and `questions`
> (`:48-51`). The disposition should answer for both, or say explicitly it answers for
> `question_categories` only.

**Item 1 — what "moved to the Supabase README" and "archived behind a named commit" concretely mean.**
`apps/supabase/README.md` is 116 lines and has no benchmarks section
`[VERIFIED: wc -l + read this session]`. `apps/supabase/benchmarks/README.md` is a 144-line runbook
whose first heading is `# Benchmark Suite: JSONB vs Relational Answer Storage`. The measured shape of
the work: (i) distil the **results narrative** (the JSONB-vs-relational conclusion) into a short
section of `apps/supabase/README.md`; (ii) `git rm` the `benchmarks/` tree in a commit whose message
names it as the archive point (so `git log --diff-filter=D -- apps/supabase/benchmarks` finds it and
`git show <sha>^:apps/supabase/benchmarks/...` restores it). **The commit SHA must then be quoted in
the README section and in `156-DISPOSITIONS.md`** — an archive nobody can find is a deletion.
Note the repo's commit conventions and the `-gsd` worktree's `core.hooksPath=/dev/null` override
apply; nothing here needs `--no-verify` beyond the project's usual practice.

**Item 3 — where the caveat goes.** `apps/supabase/README.md` already states the ports in prose
("Local ports come from `supabase/config.toml`: API `54321`, Postgres `54322`, Studio `54323`,
Mailpit `54324`") `[VERIFIED: apps/supabase/README.md, § Commands]`. That paragraph is the natural
home: extend it to name **all nine** ports and state the caveat — the Supabase CLI's `config.toml`
does support `env(VAR)` interpolation for *some* fields, but the port fields here are literals and
changing them requires editing the file, so two checkouts of this repo cannot run their stacks
simultaneously. A second, cheaper site is a comment block at the head of `config.toml` itself — but
that comment must satisfy D-N1's scan. Recommend **both**: one sentence in `config.toml`, the full
caveat in `apps/supabase/README.md`.
*(Whether `env()` interpolation covers port fields in the pinned CLI version is `[ASSUMED]` — the
planner should have the executor confirm against the CLI's own config reference before writing the
caveat's wording.)*

---

## The recommended additional fix: `app_settings` FK

**The claim holds, exactly, and is confirmed live.**

Enumeration of all FKs referencing `public.projects` `[VERIFIED: live DB — pg_constraint query]`:

```
         tbl         |               conname               | confdeltype
---------------------+-------------------------------------+-------------
 app_settings        | app_settings_project_id_fkey        | a
 admin_jobs          | admin_jobs_project_id_fkey          | c
 alliances           | alliances_project_id_fkey           | c
 candidates          | candidates_project_id_fkey          | c
 constituencies      | constituencies_project_id_fkey      | c
 constituency_groups | constituency_groups_project_id_fkey | c
 elections           | elections_project_id_fkey           | c
 factions            | factions_project_id_fkey            | c
 feedback            | feedback_project_id_fkey            | c
 nominations         | nominations_project_id_fkey         | c
 organizations       | organizations_project_id_fkey       | c
 question_categories | question_categories_project_id_fkey | c
 questions           | questions_project_id_fkey           | c
(13 rows)
```

`confdeltype` `c` = CASCADE, `a` = NO ACTION. **13 FKs; 12 cascade; `app_settings` is the sole
exception.**

Source line, read verbatim `[VERIFIED: apps/supabase/supabase/schema/106-app-settings.sql:8]`:

```sql
  project_id uuid        NOT NULL UNIQUE REFERENCES public.projects(id),
```

Its migration twin: concat 916 → **`00001:916`** (validated — grep for `REFERENCES public.projects`
in `00001` returns `916:  project_id uuid        NOT NULL UNIQUE REFERENCES public.projects(id),`,
the only one of the 13 lacking `ON DELETE CASCADE`) `[VERIFIED: measured]`.

**The failure is observable, not theoretical** `[VERIFIED: live DB — rolled-back transaction]`:

```
ERROR:  update or delete on table "projects" violates foreign key constraint "app_settings_project_id_fkey" on table "app_settings"
DETAIL:  Key (id)=(00000000-0000-0000-0000-000000000001) is still referenced from table "app_settings".
```

**Recommendation: fix it in Phase 156.** Reasons: (1) it is a one-token edit
(`REFERENCES public.projects(id)` → `REFERENCES public.projects(id) ON DELETE CASCADE`) applied to
the *same two files this phase already opens in the same commit* — the marginal cost is near zero and
the marginal risk of *not* doing it is that Phase 161 discovers it after its plan is written;
(2) under D-E2's rewrite-in-place there is no `ALTER TABLE … DROP CONSTRAINT … ADD CONSTRAINT` dance,
just the literal edit; (3) the index already exists
(`200-indexes.sql:16` — `CREATE INDEX IF NOT EXISTS idx_app_settings_project_id ON public.app_settings (project_id);`
`[VERIFIED: apps/supabase/supabase/schema/200-indexes.sql:16]`), so the cascade will not table-scan.

**Counter-argument the planner should weigh:** it is not one of the eight criteria, and adding
uncommitted scope to the widest-blast-radius phase in the run has its own cost. If the planner
declines, it must be filed as a `.planning/todos/pending/` item **naming Phase 161 as the consumer**,
because 161's E2E project teardown is the thing that breaks. **Do not silently drop it either way.**

A related, out-of-scope observation for the record: `103-questions.sql:45` —
`  category_id     uuid          NOT NULL REFERENCES public.question_categories(id),` — likewise
carries no `ON DELETE` action `[VERIFIED: apps/supabase/supabase/schema/103-questions.sql:45]`. Not a
`project_id` FK, so outside the verified claim; mention only.

---

## Drift check between `schema/` and `migrations/` (O-3) — measured answer

**Is a mechanical equality check feasible today? Yes, but not as byte-equality.**

Measured `[VERIFIED: this session]`: `cat schema/*.sql` is **134,160 bytes / 3,409 lines**;
`migrations/00001_initial_schema.sql` is **132,934 bytes / 3,390 lines**. They differ by **26 diff
lines in 3 hunks**, and each hunk is exactly a 00002/00003 delta. So:

- **`cmp` / `diff --brief` of concat vs `00001` → FAILS today.** Not usable as-is.
- **A "golden diff" check → works today.** `diff <(cat schema/*.sql) migrations/00001_initial_schema.sql`
  must produce exactly the 3 known hunks; any fourth hunk is drift. Cheap (offline, ~30 ms), but
  brittle: it re-fails legitimately every time 00002/00003's content is touched, and it cannot detect
  a change made *identically wrong* in both copies.
- **A semantic check → exact, but needs a database.** Apply `migrations/` to one scratch DB, apply
  `cat schema/*.sql` to another, `pg_dump --schema-only` both, normalise, `diff`. Detects everything
  the golden-diff misses. Cost: two databases and ~30–60 s. `supabase db diff` exists in the
  workspace scripts (`"diff": "supabase db diff"`) `[VERIFIED: apps/supabase/package.json]` and is the
  natural primitive.

**A fourth option this phase uniquely enables, and the one worth naming.** D-E2(a) authorises
rewriting migration history with no backward compatibility. If Wave A **folds 00002 and 00003 into
00001** (they are 4,462 B and 787 B respectively, and their entire effect is the 3 hunks above), then
`cat schema/*.sql` becomes **byte-identical** to `migrations/00001_initial_schema.sql`, and the drift
check collapses to:

```bash
cmp -s <(cat apps/supabase/supabase/schema/*.sql) apps/supabase/supabase/migrations/00001_initial_schema.sql
```

— one line, no database, no golden diff to maintain, and structurally impossible to get wrong.

> ⚠ This is **a recommendation, not a decision**, and it is **beyond the eight criteria**. It deletes
> two migration files, which is the most history-destructive thing in the phase, and it would need
> the operator's assent even under D-E2's "no bwd compat" authorisation — D-E2 authorises rewriting
> *this* rename into history, not necessarily collapsing unrelated migrations. The planner should
> surface it as an explicit choice, with the golden-diff check as the fallback if it is declined.

**Where it lands.** `apps/supabase/scripts/lint-schema.mjs` is the obvious home — it is already wired
as `yarn lint:schema` → `yarn lint:all` → root `yarn db:lint:sql`. But note: the existing script's two
checks both **query a live database** (`DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'`)
`[VERIFIED: apps/supabase/scripts/lint-schema.mjs:29]`. A file-level `cmp` needs no DB, so adding it
there makes the script partly runnable offline and partly not — worth a comment, or a separate
`scripts/assert-schema-migration-parity.mjs` alongside the three existing root-level asserts
(`assert-unit-coverage`, `assert-i18n-catalog-namespaces`, `assert-a11y-scan-wiring`)
`[VERIFIED: root package.json + ls scripts/]`. The root asserts are chained into `lint:check` /
`test:e2e`, which is where a drift gate belongs. **CI already runs `supabase test db` under a
`paths-filter` on `apps/supabase/**`** `[VERIFIED: .github/workflows/main.yaml:106-138]`, so a
pgTAP-expressed check would also be gated — but the file-level `cmp` is cheaper and catches the
failure earlier.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Proving a column-grant denial | A bespoke HTTP harness against PostgREST | `throws_ok(…, '42501', NULL, …)` in `09-column-restrictions.test.sql` | The pattern exists at `:35-43`; PostgREST's 403 *is* SQLSTATE 42501 raised by the same privilege check |
| Simulating a PostgREST-authenticated session | Hand-crafting `SET request.jwt.claims` per test | `set_test_user('authenticated', test_user_id(x), test_user_roles(x))` | Already builds `sub`, `role` and `user_roles` (`00-helpers.test.sql:215-222`) |
| Renaming the enum in generated types | Hand-editing `packages/supabase-types/src/database.ts:1313,1449` | `yarn db:types` | CLAUDE.md forbids hand-editing generated output; the file is regenerated wholesale |
| Keeping `updated_at` writable for the trigger | Leaving `updated_at` in the GRANT list "just in case" | Remove it — the trigger is privilege-independent | Proven live; see criterion 5 |
| A forward `ALTER TYPE … RENAME VALUE` migration | A `00004_*` file | Editing `00001` in place | D-E2(a) forbids the forward migration |
| Discovering pgTAP tests | A manifest file | The Supabase CLI's own glob of `supabase/tests/**` | No manifest exists; see below |

**Key insight:** in a rewrite-in-place regime the expensive PostgreSQL manoeuvres — `DROP FUNCTION
CASCADE` then re-create 9 policies, `ALTER TYPE … RENAME VALUE`, `ALTER TABLE … DROP CONSTRAINT` —
all evaporate. The correct mental model is **"edit the schema's source text, then rebuild the
database from zero"**, not "migrate a live database". Every task that reasons about a live `ALTER` is
solving a problem this phase does not have.

---

## Runtime State Inventory

*(Required — this is a rename/refactor phase.)*

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | **`public.user_roles.role` and `.scope_type` rows** holding the literal `'party'` in the live local DB. `db:reset` drops and recreates from `migrations/`, so no data migration is owed — but any developer who does *not* reset will hit an enum-value-not-found error on the first query. **Also: `packages/dev-seed` writes `user_roles` rows** via `service_role`. No Mem0/Chroma/Redis analogue exists in this repo. | **Code edit only + a stated reset requirement.** The plan must instruct: after Wave A, `yarn db:reset-with-data` is mandatory, not optional. |
| **Live service config** | **None.** There is no n8n, Datadog, Tailscale or Cloudflare surface in this repo. The only externally-configured service is Supabase local, and its entire configuration is the in-git `apps/supabase/supabase/config.toml`. `[VERIFIED: measured — repo has no such integrations]` | none |
| **OS-registered state** | **None.** No Task Scheduler, pm2, launchd or systemd registration references `party` or the renamed columns. The dev stack is `yarn dev` → Docker containers named `supabase_*_openvaa-local`, whose names derive from `config.toml:5 project_id = "openvaa-local"` — untouched by this phase. `[VERIFIED: docker ps + config.toml:5]` | none |
| **Secrets / env vars** | **None affected.** No env var name contains `party` or the renamed columns. `lint-schema.mjs` reads `DATABASE_URL` (`:29`); Playwright reads `FRONTEND_PORT`; neither changes. `[VERIFIED: grep + read this session]` | none |
| **Build artifacts / installed packages** | **`packages/supabase-types/src/database.ts`** — generated, carries `'party'` at `:1313` and `:1449` and the `candidates.name` column and the `merge_custom_data` function signature at `:1257`, `upsert_answers` at `:1287`. **`apps/frontend/tsconfig.tsbuildinfo`** and `.turbo/` caches will be stale but self-heal. `[VERIFIED: grep this session]` | **`yarn db:types`** after Wave A + a `yarn build` before typechecking downstream |

**The canonical question — after every file in the repo is updated, what runtime systems still hold
the old string?** Answer: **only the developer's own local Postgres**, and only until `db:reset`.
That is a materially smaller runtime surface than a typical rename phase, and it is entirely because
this project has no deployed database. Say so explicitly in the plan so nobody writes a data-migration
task that has no target.

**Session-claim caveat (CONTEXT § O-4), re-verified:** `301-auth-functions.sql:30` emits
`      'role', ur.role::text` into the token; `302-rls.sql` reads `role_entry->>'role'`. Any JWT
issued before the reset carries a stale `'party'`. `db:reset` invalidates every local session.
**Do not write a note claiming zero session impact.**

---

## Common Pitfalls

### Pitfall 1: the one-copy edit
**What goes wrong:** a criterion lands in `schema/` and not `migrations/`, or vice versa.
**Why it happens:** the two files look like the same file; `grep` finds both, and it is easy to fix
"the" hit and move on. Nothing verifies agreement (`apps/supabase/README.md:26`).
**How to avoid:** every Wave A task states **both** paths and both line anchors. The commit diff must
show each change twice. Add the drift check.
**Warning signs:** a Wave A diff with an odd number of changed SQL hunks; `db:reset` green but
`grep party schema/` still hitting.

### Pitfall 2: conflating the two `= 1` constraints
**What goes wrong:** the executor reads `104-nominations.sql:52`'s
`CHECK (num_nonnulls(...) = 1)`, concludes the constraint exists, and marks criterion 3 met.
**How to avoid:** criterion 3's verification is an **insert with `election_round = 0` being
rejected**, not a grep. Both lines are quoted above; the plan must quote them too.

### Pitfall 3: the third copy of `get_nominations`
**What goes wrong:** criterion 7 drops `candidates.name`, the executor fixes
`schema/503-entity-rpcs.sql:62` and `00001:3159`, and `migrations/00002_…:90` still says
`COALESCE(c.name, o.name, f.name, a.name)`. `db:reset` then fails at 00002 with
"column c.name does not exist".
**Warning signs:** `supabase db reset` failing on migration 00002 specifically.

### Pitfall 4: renaming `05-party-admin.test.sql` and losing discovery
**What goes wrong:** the file rename silently drops the test from the run.
**Measured reality:** there is **no manifest**. `apps/supabase/package.json` has no pgTAP script at
all — its `"test:unit": "vitest run"` runs Edge Function helpers, not pgTAP. pgTAP runs via
`cd apps/supabase && npx supabase test db` (documented in `apps/supabase/README.md` § Tests) and in
CI at `.github/workflows/main.yaml:133` (`run: supabase test db`), both of which glob the
`supabase/tests/` tree. `[VERIFIED: apps/supabase/package.json, apps/supabase/README.md, .github/workflows/main.yaml:120-138]`
**So a rename is safe for discovery** — provided the `NN-` numeric prefix is preserved, since the
files run in filename order and `00-helpers.test.sql` must run first (it defines `set_test_user`,
`test_id`, `test_user_roles`, `create_test_data`; each later file's header says
"Depends on: 00-helpers.test.sql"). Rename `05-party-admin.test.sql` →
**`05-organization-admin.test.sql`**, keeping the `05-`.
**How to detect a silent skip anyway:** the run's total assertion count. Measured baseline
`[VERIFIED: grep 'SELECT plan(' this session]`:

| file | plan |
|---|---:|
| `01-tenant-isolation` | 26 |
| `02-candidate-self-edit` | 15 |
| `03-anon-read` | 59 |
| `04-admin-crud` | 30 |
| `05-party-admin` | 14 |
| `06-storage-rls` | 15 |
| `07-rpc-security` | 9 |
| `08-triggers` | 16 |
| `09-column-restrictions` | 15 |
| `10-schema-migrations` | 65 |
| **total** | **264** |

(`00-helpers.test.sql` declares no `plan()` — it is a fixture file.) After this phase the total must
be **≥ 264 + 6 (criterion 5) + N (criterion 3's rejected insert) + M (criterion 4's `is_image`
coverage)**. A total that *drops* means a file stopped being discovered.

> Note: `.claude/skills/database/SKILL.md:338` says "11 files, `00-helpers` through
> `10-schema-migrations`" and elsewhere claims "204 pgTAP tests" and "97 RLS policies". Measured this
> session: **264 planned assertions** and **82 policies** in `public`. The skill's counts are stale —
> Phase 160 (Agent Docs & Skills Refresh) is the natural place to correct them; **do not plan
> against the skill's numbers.** `[VERIFIED: live DB + measured plan() counts]`

### Pitfall 5: the dev-seed find-replace that eats a fixture label
**What goes wrong:** a blanket `party` → `organization` across `packages/dev-seed/src/` rewrites
display strings like `templates/e2e/base.ts:521` `name: { en: '[or-aa] Party AA' }`, and an E2E spec
that asserts on the visible text fails.
**Measured:** dev-seed has **0** quoted `'party'` identifiers, so no code depends on the literal —
but it has many capital-P `Party` display labels. **Restrict the dev-seed wave to comments and
identifiers.**

### Pitfall 6: planning against a pre-edit line number
**What goes wrong:** Wave A task 3 inserts a CHECK at `104-nominations.sql:52`; Wave A task 5's
anchor `303-column-grants.sql:33` is unaffected (different file) but every `00001` anchor after
line 741 shifts by +1.
**How to avoid:** in `migrations/00001_initial_schema.sql`, anchor on **content**, not line number,
for any task after the first. The offset map is for *locating*, not for seeking.

### Pitfall 7: writing a comment that fails Phase 152's scan
**Measured status:** **Phase 152 has NOT landed.** Its directory holds 8 PLAN files, a CONTEXT, a
RESEARCH and a VALIDATION, but `ROADMAP.md:281` still reads `- [ ] **Phase 152: …**`, and **no
comment-hygiene scan exists in the tree**: `scripts/` holds only
`assert-a11y-scan-wiring.mjs`, `assert-i18n-catalog-namespaces.mjs`, `assert-unit-test-coverage.mjs`,
and `yarn lint:check` chains `turbo run lint && eslint … tests && yarn typecheck:tests && yarn
typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring` — no hygiene link.
`[VERIFIED: ls scripts/ + root package.json + .planning/ROADMAP.md:281 + ls .planning/phases/152-comment-naming-hygiene-sweep/]`
**Consequence:** D-N1's rule must be honoured **by discipline**, not by a gate, unless 152 lands
first. The plan should state the rule inline in every comment-writing task: *no phase numbers, no
`.planning/` paths, no decision ids in SQL or dev-seed comments; comments describe current behaviour.*
If 152 lands before 156 executes, re-run `yarn lint:check` and expect the scan to be live.
The house style for the *style* of those comments is visible in the tree — see
`packages/dev-seed/src/supabaseAdminClient.ts:195-205`, which is a long behavioural caution with no
phase citation in its body (though it does cite "Phase 145" — precisely the pattern 152 removes).

### Pitfall 8: assuming `db:reset-with-data` is the whole gate
**What goes wrong:** the phase declares victory on a green seed and skips E2E.
**Why it matters:** CLAUDE.md's cardinal rule. And the seed runs as `service_role`, which **bypasses
every column grant and most RLS** — so a green `db:reset-with-data` says nothing at all about
criterion 5 or the RLS renames. Only pgTAP (role-simulated) and E2E (real anon/authenticated HTTP)
exercise those.

---

## Code Examples

### Criterion 3 — the CHECK and its rejection proof

```sql
-- schema/104-nominations.sql (and the twin in migrations/00001_initial_schema.sql)
-- Source: existing table body, apps/supabase/supabase/schema/104-nominations.sql:46,52
  election_round       integer     DEFAULT 1,
  ...
  -- Exactly one entity FK must be set
  CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1),
  -- Election rounds are 1-based
  CHECK (election_round >= 1)
```

pgTAP proof, following the file's existing `throws_ok` shape
(`Source: apps/supabase/supabase/tests/database/09-column-restrictions.test.sql:35-43`):

```sql
SELECT throws_ok(
  format(
    $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 0)$$,
    test_id('project_a'), test_id('candidate_a'), test_id('election_a'), test_id('constituency_a')
  ),
  '23514',                       -- check_violation
  NULL,
  'nominations rejects election_round = 0'
);
```

### Criterion 5 — the six denial assertions

```sql
-- Source: pattern from apps/supabase/supabase/tests/database/09-column-restrictions.test.sql:29-43
SELECT set_test_user('authenticated', test_user_id('candidate_a'), test_user_roles('candidate_a'));

SELECT throws_ok(
  format($$UPDATE candidates SET sort_order = 99 WHERE id = '%s'$$, test_id('candidate_a')),
  '42501', NULL, 'Candidate cannot update sort_order on own record'
);
-- … likewise created_at, updated_at

SELECT set_test_user('authenticated', test_user_id('party_a'), test_user_roles('party_a'));
-- (renamed to 'organization_a' by criterion 1)

SELECT throws_ok(
  format($$UPDATE organizations SET sort_order = 99 WHERE id = '%s'$$, test_id('org_a')),
  '42501', NULL, 'Organization admin cannot update sort_order on own organization'
);
-- … likewise created_at, updated_at
```

Measured live: the raised message is `permission denied for table candidates` — table-scoped, not
column-scoped, which is why the existing assertions pass `NULL` for the message argument.
`[VERIFIED: live DB]`

### Criterion 4 — the `is_image` / `validate_image` pair

```sql
-- Source: convention from apps/supabase/supabase/schema/011-validation-functions.sql:16-19
CREATE OR REPLACE FUNCTION public.is_image(p_val JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  PERFORM public.validate_image(p_val);
  RETURN TRUE;
EXCEPTION WHEN others THEN
  RETURN FALSE;
END;
$$;
```
*(Shape only — whether the predicate wraps the validator or duplicates its logic is the planner's
call. Wrapping keeps one source of truth; the `EXCEPTION` block makes the function non-`IMMUTABLE`-safe
in the strict sense, so verify the volatility label against the actual body.
`[ASSUMED: volatility interaction — not executed this session]`)*

### The drift check, if the fold-into-00001 option is taken

```bash
# apps/supabase/scripts/… or scripts/assert-schema-migration-parity.mjs
if ! cmp -s <(cat apps/supabase/supabase/schema/*.sql) \
            apps/supabase/supabase/migrations/00001_initial_schema.sql; then
  echo "::error::schema/ and migrations/00001 have drifted"
  diff <(cat apps/supabase/supabase/schema/*.sql) \
       apps/supabase/supabase/migrations/00001_initial_schema.sql | head -50
  exit 1
fi
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| DB framework | pgTAP via Supabase CLI |
| Config file | `apps/supabase/supabase/config.toml` (`[db] major_version = 15`) |
| pgTAP run command | `cd apps/supabase && npx supabase test db` — **11 files, 264 planned assertions** `[VERIFIED]` |
| pgTAP root alias | **none exists.** `apps/supabase/package.json` `"test:unit": "vitest run"` is Edge-Function unit tests, not pgTAP. `[VERIFIED]` |
| Unit framework | vitest (`yarn test:unit` → `yarn assert:unit-coverage && turbo run test:unit`) |
| E2E framework | Playwright, **42 spec files** (`yarn test:e2e`) `[VERIFIED]` |
| Lint/typecheck | `yarn lint:check` (chains `turbo run lint`, eslint on `tests`, `typecheck:tests`, `typecheck`, 2 asserts) |
| Schema advisors | `yarn db:lint:sql` → `lint:sql && lint:schema` (needs a live DB) |
| Seed gate | `yarn db:reset-with-data` = `yarn db:reset && yarn db:seed:default`; `db:reset` = `yarn db:start && supabase db reset` `[VERIFIED: root package.json]` |
| CI | `.github/workflows/main.yaml:106-138` — `supabase-tests` job, `paths-filter` on `apps/supabase/**` and `packages/supabase-types/**`, runs `supabase start` → `supabase test db` → `supabase stop` `[VERIFIED]` |

### What "observed working end to end" concretely means for criterion 1

`yarn db:reset-with-data` expands to `yarn db:start && yarn workspace @openvaa/supabase reset` then
`yarn db:seed --template default` `[VERIFIED: root package.json]`. Concretely:

1. `supabase start` — brings up 15 containers if down; no-op if already running.
2. `supabase db reset` — drops the database, replays `migrations/00001`, `00002`, `00003` in order,
   then runs `supabase/seed.sql` (`config.toml:60-62` — `[db.seed] enabled = true`).
3. `tsx packages/dev-seed/src/cli/seed.ts --template default` — seeds the Finnish demo: 1 election,
   1 constituency group, 13 constituencies, 8 organizations, 100 candidates, 4 locales, plus portrait
   uploads to Storage `[VERIFIED: packages/dev-seed/README.md § Built-in Templates]`.

**Failure modes, in the order they bite:**

| Stage | Failure | Signal |
|---|---|---|
| migration replay | a rename applied to `schema/` only → nothing happens (silent green) | **the pass that means nothing** — guard with the drift check + a pgTAP enum-shape assertion |
| migration replay | `00002` still references `c.name` after criterion 7 | `supabase db reset` errors on migration 00002 |
| migration replay | enum member missing / `has_role` signature mismatch | `db reset` errors mid-`00001` |
| seed | dev-seed template writes a column dropped by criterion 7 | PostgREST 400 from `supabaseAdminClient` |
| seed | dev-seed writes `role: 'party'` | enum input error `invalid input value for enum` |
| seed | portrait upload | Storage 502 wedge — a known local flake (see the project memory on `db:reset`/storage) |

**Duration is not measured here.** The stack was left running deliberately (a reset would destroy the
user's DB state), so no timing was taken. `[ASSUMED: reset+seed is on the order of a minute or two]`
The planner should have the executor time it once and record the figure.

**Yes, `yarn test:e2e` must also run.** CLAUDE.md's cardinal rule makes a failing or not-run E2E test
a blocking failure, and criterion 5 + the RLS renames are only exercised end-to-end by anon/
authenticated HTTP — `db:reset-with-data` seeds as `service_role` and proves nothing about them.
Prerequisites from the project memory: one fresh dev server on `:5173` (no Playwright `webServer`;
a stale server steals the port) and a clean DB. Disk space is a live risk in this repo (ENOSPC voids
full-suite runs).

### Phase Requirements → Test Map

| Criterion | Behaviour | Test type | Automated command | File exists? |
|---|---|---|---|---|
| **1** `party`→`organization` | enum member is `'organization'`; no `'party'` anywhere in SQL | schema-shape pgTAP + grep | `npx supabase test db` (`10-schema-migrations.test.sql`); `grep -rn "'party'" apps/supabase/supabase/{schema,migrations}` → 0 | ✅ file exists; ❌ **Wave 0**: add an enum-members assertion |
| **1** (gate) | seed runs clean on the renamed schema | integration | `yarn db:reset-with-data` | ✅ |
| **1** (fanout) | generated types carry `organization` | typecheck | `yarn db:types && yarn typecheck` | ✅ |
| **2** scope enum | `user_roles.scope_type` is an enum; `has_role` params are enums | schema-shape pgTAP | `col_type_is('public','user_roles','scope_type','role_scope_type',…)` + `has_function(…, ARRAY['user_role_type','role_scope_type','uuid'])` | ✅ `10-schema-migrations.test.sql`; ❌ **Wave 0**: new assertions |
| **2** (behaviour) | existing role checks still gate correctly | pgTAP | `05-organization-admin.test.sql` (14 assertions) must stay green | ✅ |
| **3** `>= 1` CHECK | insert with `election_round = 0` is rejected | pgTAP `throws_ok '23514'` | `08-triggers.test.sql` or `10-schema-migrations.test.sql` | ✅ files; ❌ **Wave 0**: 1–2 new assertions |
| **4** `is_image` | function exists; valid image accepted; each malformed shape rejected | pgTAP | `has_function('public','is_image',ARRAY['jsonb'])` + `lives_ok`/`throws_ok` set | ❌ **Wave 0** — no image-shape coverage exists today (`grep StoredImage tests/` → 0) |
| **5** column grants | 6 `authenticated` tamper attempts denied (2 tables × 3 cols) | pgTAP `throws_ok '42501'` | `09-column-restrictions.test.sql`, `plan(15)` → `plan(21)` | ✅ file + exact pattern at `:35-43`; ❌ **Wave 0**: 6 assertions |
| **5** (HTTP corroboration) | real PostgREST path unbroken | E2E | `yarn test:e2e` | ✅ |
| **6** `upsert_answers` | an organization's answers can be upserted by its own role | pgTAP | extend `10-schema-migrations.test.sql` (`upsert_answers` block at `:299-408`) | ✅ file; ❌ **Wave 0**: org-branch assertions |
| **6** `merge_custom_data` | renamed function exists at the new name; old name gone | pgTAP `has_function` + unit | `10-schema-migrations.test.sql:489-576` (7 strings to update) + `adminWriter/supabaseAdminWriter.test.ts:74`, `dataWriter/supabaseDataWriter.test.ts` | ✅ |
| **7** `candidates.name` | column absent; `get_candidate_user_data` still returns its declared shape | pgTAP `hasnt_column` + `has_function` | `10-schema-migrations.test.sql` | ✅ file; ❌ **Wave 0**: `hasnt_column('public','candidates','name',…)` |
| **7** (fanout) | frontend/dev-seed compile against the narrowed type | typecheck | `yarn db:types && yarn lint:check` | ✅ |
| **8** dispositions | five answers on the record; two implemented | **inspection** | `156-DISPOSITIONS.md` exists with 5 entries + the `merge_custom_data` choice; 4 files in `.planning/todos/pending/`; `apps/supabase/benchmarks/` gone with its SHA quoted; port caveat in `apps/supabase/README.md` | n/a — document review |
| *(recommended)* `app_settings` FK | deleting a project cascades | pgTAP `lives_ok` on a project DELETE | `10-schema-migrations.test.sql` | ❌ **Wave 0** if adopted |
| *(recommended)* drift check | `schema/` and `migrations/` agree | script | `node scripts/assert-schema-migration-parity.mjs` (or `cmp` one-liner) | ❌ **Wave 0** if adopted |

### Sampling Rate

- **Per task commit (SQL waves):** `cd apps/supabase && npx supabase test db` — in-transaction, fast.
- **Per Wave A merge:** `yarn db:reset-with-data` **then** `npx supabase test db`. (Order matters:
  the reset is what makes the pgTAP run test the *edited* schema rather than the old one.)
- **Per Wave C merge:** `yarn db:types && yarn lint:check && yarn test:unit`.
- **Phase gate:** `yarn db:reset-with-data` → `npx supabase test db` (≥ 264+N green) →
  `yarn db:lint:sql` → `yarn lint:check` → `yarn test:unit` → **`yarn test:e2e` fully green** before
  `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `09-column-restrictions.test.sql` — 6 new `throws_ok '42501'` assertions; `plan(15)`→`plan(21)` — covers criterion 5
- [ ] `10-schema-migrations.test.sql` — enum-members assertion for `user_role_type`; `col_type_is` for `user_roles.scope_type`; `has_function` signature update for `has_role`; `hasnt_column` for `candidates.name`; renamed `merge_custom_data` strings (7 sites) — covers criteria 1, 2, 6, 7
- [ ] `08-triggers.test.sql` (or `10-`) — `throws_ok '23514'` for `election_round = 0` — covers criterion 3
- [ ] **New coverage for `is_image`** — no image-shape assertions exist anywhere today — covers criterion 4
- [ ] `05-party-admin.test.sql` → `05-organization-admin.test.sql` — file rename + 44 in-file `party` occurrences
- [ ] `00-helpers.test.sql` — `:196-197` claim values, `:312` `user_roles` insert row, and the `party_a` fixture key
- [ ] *(if adopted)* `scripts/assert-schema-migration-parity.mjs` + a root `package.json` link into `lint:check`
- [ ] Framework install: **none needed** — pgTAP, vitest and Playwright are all present

---

## Security Domain

Criterion 5 is a security control, so this section is required.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 156 does not touch auth flows (Phase 155/162 do) |
| V3 Session Management | **partly** | O-4: the rename invalidates the semantic of in-flight JWT `role` claims. Control: `db:reset` invalidates all local sessions; **record, do not claim zero impact** |
| V4 Access Control | **yes** | RLS policies (`302-rls.sql`) + column grants (`303-column-grants.sql`) + `has_role`/`can_access_project`. **Criterion 2 strengthens this** by making an invalid role/scope a type error rather than a silently-false comparison. Criterion 5 removes an audit-field tamper vector |
| V5 Input Validation | **yes** | `011-validation-functions.sql` — criterion 4's `is_image` is an input-validation extraction. Criterion 3's CHECK is a domain constraint |
| V6 Cryptography | **deferred** | D-E6's salted-hash IP recommendation. **Not implemented in 156**; answered on the record |

### Known Threat Patterns

| Pattern | STRIDE | Standard mitigation | Status in 156 |
|---|---|---|---|
| Audit-field tampering (`created_at`/`updated_at` rewritten by the record's own owner) | **Repudiation** | Column-level `GRANT UPDATE` excluding audit fields | **Criterion 5 closes it on both tables**; the `set_updated_at` trigger keeps the field correct — verified |
| Presentation-order tampering (`sort_order`) | Tampering | Same | Criterion 5 |
| SQL injection via a generalised RPC's table discriminator | **Tampering / Elevation** | Avoid dynamic SQL; if unavoidable, allow-list + `quote_ident` | **This is the strongest argument against generalising `merge_custom_data`** — see criterion 6 |
| `search_path` hijack in SECURITY DEFINER functions | Elevation | `SET search_path = ''` + fully-qualified names | Already applied at `301-auth-functions.sql:65,106,147`; **criterion 2's edits must preserve it** and schema-qualify the new enum as `public.role_scope_type` |
| Malformed image JSONB reaching storage/render paths | Tampering | Server-side shape validation | Criterion 4 |
| Stale enum value in a replayed JWT | Spoofing (weak) | Session invalidation on reset | O-4; local-only |
| PII at rest (raw client IP as a PRIMARY KEY) | **Information disclosure** | Salted hash with a per-deployment secret | **Answered on the record only (D-E6).** Must appear in `156-DISPOSITIONS.md` **and** as a `.planning/todos/pending/` item — CLAUDE.md forbids committing the secret itself |

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Docker + Supabase local stack | criterion 1 gate, pgTAP, lint:schema | ✓ **running** (`supabase_db_openvaa-local` + 14 siblings) | — | none |
| `psql` | ad-hoc verification | ✓ | PostgreSQL 17 client (`/usr/local/opt/postgresql@17/bin/psql`) | `supabase db reset` output |
| Supabase CLI | migrations + `supabase test db` | ✓ via workspace dep (`catalog:` pin); **not on PATH as a bare `supabase`** — invoke as `npx supabase` from `apps/supabase` or via the workspace scripts | — | — |
| Node | tooling | ✓ | v24.14.1 | — |
| Yarn | workspaces | ✓ | 4.13.0 | — |
| Playwright browsers | `yarn test:e2e` | **unverified this session** | — | `yarn playwright install` |
| Disk space | full E2E suite | **at risk** | — | project memory records ENOSPC voiding full-suite runs in this worktree; ~52 GiB reclaimable Docker.raw bloat needs a user-run `fstrim`. **`tests/e2e-runs/` is cited by registers and must not be deleted.** |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Playwright browsers (install on demand).
**Blocking-risk item:** disk space before the E2E gate. **The planner should put a disk-space check
ahead of the E2E gate task**, because an ENOSPC failure mid-suite is indistinguishable from a real
failure and burns a full run.

---

## `.planning/todos/pending/` format (D-N2)

**Two formats coexist in the register**; the newer, dominant one is YAML frontmatter + prose.
`[VERIFIED: read two files this session]`

Canonical, from `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md:1-13`,
quoted verbatim:

```
---
created: "2026-08-28T00:00:00.000Z"
title: CLAUDE.md carries two stale factual claims that misdirect planners
area: docs
files:
  - CLAUDE.md
  - packages/app-shared/tsup.config.ts
  - package.json
  - apps/supabase/scripts/lint-schema.mjs
resolves_phase: 160
related_phase: 163
---

## Problem
```

A second, near-identical shape adds `severity:` and `source:`
(`.planning/todos/pending/2026-08-27-147-tou-gate-modal-unscanned.md:1-11`):

```
---
created: 2026-08-27T16:00:00.000Z
title: The candidate ToU gate modal is reachable but unscanned — and the dataset to reach it already ships
area: E2E / a11y
severity: minor
source: Phase 147 (147-SCOUT-INVENTORY.md § 6 "Reachable-but-not-scanned states"; filed by 147-05)
files:
  - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
  - packages/dev-seed/src/templates/e2e/base.ts
---
```

Older files (e.g. the "Intro step list" one) use no frontmatter and a `**Captured:** / **Source:** /
**Type:**` block instead. **Recommend the frontmatter form** with keys
`created`, `title`, `area`, `severity`, `source`, `files`, and `related_phase` (pointing at the phase
that would consume the answer), plus `## Problem` / `## Solution` bodies. Filenames follow
`YYYY-MM-DD-kebab-slug.md`.

**The four todos this phase must file** (D-N2):

1. `lint-schema.mjs` as pgTAP tests — `related_phase: 163` (CI gates)
2. id-JSONB foreign-key linkage — blocked on the three-option election filter; `related_phase:` the
   filter's phase
3. Feedback IP salted hash — `area: security`, `related_phase: 162` or a security backlog phase
4. *(if the FK fix is declined)* `app_settings` `ON DELETE CASCADE` — `related_phase: 161`

> **⚠ These todos' `source:` field is where D-N1 does NOT apply.** D-N1 bans phase citations in *SQL
> and dev-seed comments*. `.planning/todos/` is a planning artifact — citing Phase 156 there is
> correct and expected.

---

## State of the Art

| Old approach | Current approach | When changed | Impact |
|---|---|---|---|
| `party` as the *role* vocabulary | `organization` as the *entity* vocabulary (`public.entity_type` at `000-enums.sql:16-18` already reads `'candidate', 'organization', 'faction', 'alliance'`) | already true in-tree | **The asymmetry IS the defect.** 156 aligns the role vocabulary to the entity vocabulary that already exists. `[VERIFIED: apps/supabase/supabase/schema/000-enums.sql:16-18]` |
| `text` columns with a comment listing legal values | enum types | criterion 2 | Makes an illegal value a type error at insert rather than a silently-false predicate |
| Migration-per-change | Rewrite-in-place, single-source history | D-E2(a), this phase | Only viable because no deployed database replays this history |
| `supabase/schema/` as an unverified mirror | (proposed) a mechanical drift check | O-3, undecided | Converts the phase's principal hazard into a test |

**Deprecated/outdated in the tree:**

- `.claude/skills/database/SKILL.md` — "97 RLS policies" (measured: **82**), "204 pgTAP tests"
  (measured: **264** planned assertions). Phase 160's territory; **do not plan against these.**
- `303-column-grants.sql:11-14`'s `-- Depends on:` block cites `003-entities.sql`,
  `006-answers-jsonb.sql`, `011-auth-tables.sql`, `010-rls.sql` — **none of those filenames exist**;
  the current names are `102-entities.sql`, `105-answers.sql`, `300-auth-tables.sql`, `302-rls.sql`.
  Same class of staleness in `301-auth-functions.sql:3-4` (`011-auth-tables.sql`, `001-tenancy.sql`),
  `300-auth-tables.sql:3-4`, `011-validation-functions.sql` references in
  `08-triggers.test.sql:13` (`000-functions.sql`), and `09-column-restrictions.test.sql:11`
  (`013-auth-rls.sql`). `[VERIFIED: read + ls this session]`
  **156 rewrites the comments in three of these files anyway (criterion 1's `party` comments).**
  Fixing the stale `Depends on:` lines in the same pass is nearly free and is exactly the kind of
  comment-correctness Phase 152 targets — but it is **not a 156 criterion**. Recommend: fix the ones
  in files 156 already edits; leave the rest to 152.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | `yarn db:reset-with-data` takes "on the order of a minute or two" | Validation Architecture | Wave-gate time estimates off; no correctness risk. **Time it once and record.** |
| A2 | Criterion 3's intent is the plain `CHECK (election_round >= 1)`, which passes on NULL, rather than a NOT-NULL-and-≥1 form | Criterion 3 | A NULL `election_round` slips through the new constraint. **Ask, or record the caveat in DISPOSITIONS.** |
| A3 | The Supabase CLI's `config.toml` `env()` interpolation does not cover port fields | Criterion 8 item 3 | The caveat's wording would be wrong ("cannot be resolved from env" vs "can"). **Confirm against the pinned CLI's config reference before writing.** |
| A4 | An `is_image` predicate that wraps a raising `validate_image` in an `EXCEPTION` block can still be labelled correctly for volatility | Code Examples | A wrong volatility label degrades planner behaviour or errors at create time. **Executor must run it.** |
| A5 | `(role_entry->>'role')::public.user_role_type` raising on an unknown stale claim value is acceptable (vs. silently returning false) | Criterion 2 | A stale JWT would error rather than deny. Local-only per O-4, but **the choice should be recorded.** |
| A6 | Phase 152 will land before 156 executes | Pitfall 7 | If it does not, D-N1 is unenforced by tooling and must be honoured by discipline. **Measured today: 152 has not landed.** |
| A7 | The `party` → `organization` rename of the `party_update_own_organizations` policy has no external consumer keyed on the policy *name* | Criterion 1 | A tool or test asserting on `pg_policies.policyname` would break. Grep found no such assertion, but the search was over the repo, not over CI config. |
| A8 | dev-seed's capital-`P` `Party` display labels (e.g. `'[or-aa] Party AA'`) are asserted on by E2E specs and must not be renamed | Pitfall 5 | If they are *not* asserted on, leaving them is merely inconsistent; if they are, renaming breaks E2E. **Cheap to check: grep `tests/` for the labels before the dev-seed wave.** |

---

## Open Questions

1. **Should the `app_settings` `ON DELETE CASCADE` fix land in 156?**
   - What we know: the claim is confirmed live; the fix is one token in two files this phase already
     opens; the index already exists; Phase 161's teardown is the consumer.
   - What's unclear: whether adding non-criterion scope to the widest-blast-radius phase is wanted.
   - **Recommendation: yes, land it in 156.** If declined, file it as a todo naming 161. Either way,
     it must be dispositioned in writing.

2. **Should Wave A fold `00002`/`00003` into `00001`?**
   - What we know: it makes the drift check a one-line `cmp`; the two files total 5,249 B and their
     entire effect is 3 hunks; D-E2 authorises rewriting history for the rename.
   - What's unclear: whether D-E2's authorisation extends to collapsing *unrelated* migrations.
   - **Recommendation: surface it as an explicit operator choice.** Fallback is the golden-diff check.

3. **`merge_custom_data`: rename or generalise?** (Claude's Discretion, Contract C3.)
   - What we know: everything but the name is question-specific; both call sites pass a question id;
     generalisation implies dynamic SQL in a SECURITY INVOKER function and a per-table RLS rationale.
   - **Recommendation: rename to `merge_question_custom_data`.** Must be written to
     `156-DISPOSITIONS.md` **before 157 is planned.**

4. **Which `is_image` shape?** — recommendation (b), predicate + validator; record in DISPOSITIONS.

5. **What is the new scope enum called, and does 162 accept it?** Contract C2 says 162 supersedes it.
   Recommendation `public.role_scope_type` with members
   `'candidate','organization','project','account','global'`. Not decided here.

6. **`REVIEW-DB-01..08` remain undefined** (O-2). Not resolvable in this phase. The eight roadmap
   criteria are the operative requirement set. Flag to the milestone.

---

## Sources

### Primary (HIGH confidence)

- **Live local PostgreSQL** `127.0.0.1:54322` (`supabase_db_openvaa-local`) — FK `confdeltype`
  enumeration, project-DELETE failure, `information_schema.column_privileges`, `pg_policies` counts
  and name search, enum→JSONB serialisation, 42501 denial, `set_updated_at`-survives-revoke proof.
  All read-only or `ROLLBACK`-ed.
- **Files read this session** (with line ranges cited inline): `apps/supabase/README.md:1-60`,
  `apps/supabase/supabase/config.toml:1-62,91,102,104,105,375`,
  `apps/supabase/supabase/schema/{000,011,102,103,104,106,107,200,300,301,302,303,503,504}-*.sql`,
  `apps/supabase/supabase/migrations/{00001,00002,00003}*.sql`,
  `apps/supabase/supabase/tests/database/{00-helpers,09-column-restrictions,10-schema-migrations}.test.sql`,
  `apps/supabase/scripts/lint-schema.mjs:1-80`, `apps/supabase/package.json`, root `package.json`,
  `.github/workflows/main.yaml` (grep), `packages/dev-seed/README.md:1-80`,
  `packages/dev-seed/src/supabaseAdminClient.ts:195-235`,
  `packages/dev-seed/src/generators/CandidatesGenerator.ts` (grep),
  `apps/frontend/src/lib/api/adapters/supabase/{dataWriter,adminWriter,dataProvider,utils}/*.ts`,
  `.planning/todos/pending/{2026-08-28-claude-md-stale-factual-claims,2026-08-27-147-tou-gate-modal-unscanned}.md`,
  `.planning/phases/156-.../156-CONTEXT.md`, `.planning/ROADMAP.md:1060-1110,281`.
- **Measurements**: `diff`/`wc`/`grep -c` counts reproduced inline throughout.

### Secondary (MEDIUM confidence)

- `.planning/phases/156-.../156-CONTEXT.md` — facts F-15/F-15b/F-15c/F-15d, F-16, F-17, F-NEW, all
  re-verified this session and all reproduced.
- `apps/supabase/README.md` — the two-directory doctrine; independently reproduced by the diff.

### Tertiary (LOW confidence)

- `.claude/skills/database/SKILL.md` — **contradicted on two counts** (97 policies vs 82; 204 tests
  vs 264 planned assertions). Cited only to flag the staleness.
- No external web sources were consulted; every question this phase raises is answerable in-tree or
  against the running database, and was.

---

## Metadata

**Confidence breakdown:**

- Standard stack — **HIGH**. No new packages; every tool verified present and its invocation read
  from `package.json`.
- Architecture (the two-copy structure + offset map) — **HIGH**. Derived by measurement, validated on
  6 independent anchors, and arithmetically closed (3409 − 19 = 3390).
- Criterion-level anchors — **HIGH**. Every cited line was opened and quoted verbatim.
- Criterion 5 safety (trigger survives revoke) — **HIGH**. Executed live.
- `app_settings` FK claim — **HIGH**. Enumerated and the failure reproduced live.
- `merge_custom_data` recommendation — **HIGH** on evidence, **the decision is the planner's**.
- Criterion 4 shape recommendation — **MEDIUM**. The criterion's wording admits three readings; no
  existing test constrains the choice.
- Timing of `db:reset-with-data` — **LOW**. Not measured (would have destroyed the user's DB state).

**Research date:** 2026-08-28
**Valid until:** 2026-09-27 (stable domain — but **invalid the moment Phase 152 or any other phase
edits `apps/supabase/supabase/`**, which would shift every line anchor above)
