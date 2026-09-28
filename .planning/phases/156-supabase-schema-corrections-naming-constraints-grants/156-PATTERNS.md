# Phase 156: Supabase Schema Corrections — naming, constraints, grants - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 24 (13 SQL schema files × 2 copies, 4 pgTAP files, 4 TS files, 3 doc/planning artifacts)
**Analogs found:** 22 / 24 (2 have no analog — see § No Analog Found)

> **Read this first.** This is a SQL/schema phase. The patterns that matter are Postgres / pgTAP /
> Supabase-CLI idioms. The single most load-bearing pattern in this document is **§ The Two-Copy
> Rule** — every SQL edit lands twice, and the per-file twin table below is the executor's map.

---

## § The Two-Copy Rule (applies to EVERY SQL task in this phase)

`apps/supabase/supabase/config.toml:53-58` sets `[db.migrations] schema_paths = []`. **The CLI never
reads `supabase/schema/`.** `supabase db reset` applies `migrations/` and nothing else.
`apps/supabase/README.md:26` states the hazard in the repo's own words: *"Nothing verifies that they
agree."*

**Therefore: every edit below must be applied to BOTH copies in the SAME commit.**
A `schema/`-only edit produces a green-looking diff and an unchanged database. A `migrations/`-only
edit leaves the readable copy lying to the next reader.

### Per-file twin table — `schema/<file>:<n>` → `migrations/00001_initial_schema.sql:<m>`

Derived from RESEARCH.md § "Architecture Patterns" (validated on 6 independent anchors; concat total
3409 − 19 = 3390 = `00001`'s actual line count ✓).

| # | `schema/` file | anchor line(s) | `00001` twin line(s) | Criterion |
|---|---|---|---|---|
| 1 | `000-enums.sql` | `24-26` (`user_role_type` body at `:25`) | **`24-26`** (`:25`) | 1 |
| 2 | `011-validation-functions.sql` | `16-19` (`is_localized_string` header — the *convention analog*) | **`96-99`** | 4 |
| 3 | `011-validation-functions.sql` | `164-200` (the `WHEN 'image' THEN` block) | **`244-280`** | 4 |
| 4 | `102-entities.sql` | `27` (`candidates.name`) | **`512`** | 7 |
| 5 | `104-nominations.sql` | `46` (`election_round`), `52` (`num_nonnulls` CHECK) | **`735`**, **`741`** | 3 |
| 6 | `106-app-settings.sql` | `8` (`REFERENCES public.projects(id)`, no CASCADE) | **`916`** | *(recommended extra)* |
| 7 | `300-auth-tables.sql` | `13` (typed `role`), `14` (`scope_type text`) | **`1109`**, **`1110`** | 2 |
| 8 | `301-auth-functions.sql` | `58-62` (`has_role` sig), `76-83`, `118-129` | **`1221-1225`**, **`1239-1246`**, **`1281-1292`** | 2 |
| 9 | `302-rls.sql` | `230`, `238-246`, `274`, `279` | **`1543`**, **`1551-1559`**, **`1581`**, **`1586`** | 1 |
| 10 | `303-column-grants.sql` | `3`, `22`, `28`, `31-36`, `48`, `52-56` | **`1801`**, **`1820`**, **`1826`**, **`1829-1834`**, **`1846`**, **`1850-1854`** | 1, 5, 7 |
| 11 | `501-bulk-operations.sql` | `215` (doc-comment payload `"party-sdp"`) | **`2722`** | 1 |
| 12 | `502-email-helpers.sql` | `72`, `77`, `81`, `131`, `132` | **`3012`**, **`3017`**, **`3021`**, **`3071`**, **`3072`** | 1 |
| 13 | `503-entity-rpcs.sql` | `62`, `97`, `103`, `121`, `147`, `160`, `169`, `181-183` | **`3159`**, **`3187`**, **`3193`**, **`3211`**, **`3237`**, **`3250`**, **`3259`**, **`3271-3273`** | 6, 7 |
| 14 | `504-admin-rpcs.sql` | `12` (fn header), `36` (`GRANT EXECUTE`) | **`3291`**, **`3315`** | 6 |
| 15 | **`migrations/00002_…rls_guard.sql`** | `90` — a **THIRD** copy of `COALESCE(c.name, o.name, f.name, a.name)` | *(no schema twin — 00002 IS the source)* | 7 |

> ⚠ **The map is valid only until the first edit.** Once a CHECK line is inserted into
> `104-nominations.sql`, every downstream `00001` anchor shifts. **Anchor every task after the first
> on content-matched strings, not line numbers.** The map exists to *locate* the pairs, not to seek.

> ⚠ **Entry 15 is the trap.** `migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql:90`
> recreates `get_nominations` with the same `c.name` reference. Fixing only `schema/503` + `00001`
> makes `supabase db reset` fail *on migration 00002* with "column c.name does not exist".

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `schema/000-enums.sql` (+ `00001` twin) | migration / DDL | — | `000-enums.sql:16-18` (`entity_type`, already uses `organization`) | exact — self-analog |
| `schema/300-auth-tables.sql` (`scope_type` → enum) | migration / DDL | — | `300-auth-tables.sql:13` (`role user_role_type NOT NULL`) | exact |
| `schema/301-auth-functions.sql` (enum params) | model / predicate fn | request-response | `104-nominations.sql:35-42` (`::public.entity_type` casts) | role-match |
| `schema/104-nominations.sql` (CHECK) | migration / DDL | — | `104-nominations.sql:52` (`CHECK (num_nonnulls(...) = 1)`) | exact — adjacent line |
| `schema/011-validation-functions.sql` (`is_image` / `validate_image`) | utility | transform | `011-validation-functions.sql:16-19` (`is_localized_string`) | **exact** |
| `schema/303-column-grants.sql` (narrow GRANTs) | config / privileges | — | `303-column-grants.sql:31-36` ↔ `:52-56` (the two GRANT blocks mirror each other) | exact |
| `schema/503-entity-rpcs.sql` (`upsert_answers` widen, `c.name` → `NULL::jsonb`) | service (RPC) | CRUD | `503-entity-rpcs.sql:97-137` (`get_candidate_user_data` UNION ALL, org branch's `NULL::timestamptz` padding) | **exact** |
| `schema/504-admin-rpcs.sql` (rename) | service (RPC) | CRUD | `504-admin-rpcs.sql:1-36` (self — rename in place) | exact |
| `schema/106-app-settings.sql` (`ON DELETE CASCADE`) | migration / DDL | — | `104-nominations.sql:44-45` (`REFERENCES … ON DELETE CASCADE`) | exact |
| `tests/database/09-column-restrictions.test.sql` (+6 assertions) | test (pgTAP) | request-response | `09-column-restrictions.test.sql:29-43` | **exact — same file** |
| `tests/database/10-schema-migrations.test.sql` (shape assertions) | test (pgTAP) | — | `10-schema-migrations.test.sql:30-40, 129-138, 488-496` | **exact — same file** |
| `tests/database/05-party-admin.test.sql` → `05-organization-admin.test.sql` | test (pgTAP) | — | itself (rename; `05-` prefix preserved) | exact |
| `tests/database/00-helpers.test.sql:196-197, 312` | test fixture | — | itself | exact |
| `apps/frontend/…/adminWriter/supabaseAdminWriter.ts:26` | API adapter | request-response | `…/dataWriter/supabaseDataWriter.ts:388` (identical body) | **exact — sibling** |
| `apps/frontend/…/adminWriter/supabaseAdminWriter.test.ts:65,74` | test (vitest) | — | itself | exact |
| `packages/supabase-types/src/database.ts` | generated | — | **do not hand-edit** — `yarn db:types` | n/a |
| `packages/dev-seed/src/**` (84 comment hits) | comments only | — | `packages/dev-seed/src/supabaseAdminClient.ts:195-205` (house comment style) | role-match |
| `.planning/todos/pending/2026-08-28-*.md` ×4 | planning artifact | — | `.planning/todos/pending/2026-03-28-investigate-migrating-candidate-answer-store.md` | **exact** |
| `156-DISPOSITIONS.md` | planning artifact | — | *(none — see § No Analog Found)* | none |
| `scripts/assert-schema-migration-parity.mjs` *(optional)* | build tooling | batch | `scripts/assert-i18n-catalog-namespaces.mjs` / `assert-a11y-scan-wiring.mjs` | role-match |

---

## Pattern Assignments

### `schema/000-enums.sql` — criterion 1, the enum rename (DDL)

**Analog:** the file itself. `entity_type` at `:16-18` **already uses `organization`** — the rename
makes `user_role_type` consistent with a vocabulary the codebase has settled on.

**Verbatim, current state** (`schema/000-enums.sql:1-26` → `00001:1-26`):

```sql
-- Enum type definitions
--
-- All enum types used across the schema:
--   question_type   - question answer value types
--   entity_type     - nomination entity discriminator
--   category_type   - question category classification
--   user_role_type  - auth role assignments

CREATE TYPE public.entity_type AS ENUM (
    'candidate', 'organization', 'faction', 'alliance'
);

CREATE TYPE public.user_role_type AS ENUM (
    'candidate', 'party', 'project_admin', 'account_admin', 'super_admin'
);
```

**Pattern to copy for criterion 2's new enum** — same header-comment line in the file's opening
block, same `CREATE TYPE public.<name> AS ENUM (` + 4-space-indented single-line member list +
`);` shape. RESEARCH recommends `public.role_scope_type` with members
`'candidate', 'organization', 'project', 'account', 'global'`, placed after `user_role_type`, and
its one-line entry added to the file header comment (`--   role_scope_type - user_roles.scope_type vocabulary`).

**⚠ D-N1 comment constraint:** the header block is a clean model — it describes *what each type is*,
with no phase number, no `.planning/` path, no decision id. Copy that register.

---

### `schema/300-auth-tables.sql` — criterion 2, typed column declaration

**Analog:** line `:13`, immediately above the line being changed. **This is the exact target shape.**

**Verbatim** (`schema/300-auth-tables.sql:10-18` → `00001:1106-1114`):

```sql
CREATE TABLE public.user_roles (
  id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role_type NOT NULL,
  scope_type text           NOT NULL,  -- 'candidate', 'party', 'project', 'account', 'global'
  scope_id   uuid,                     -- NULL for super_admin (global scope)
  created_at timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, scope_type, scope_id)
);
```

**Copy the `role` line's form exactly:** bare type name (no `public.` prefix — the file does not use
one here), column-aligned, `NOT NULL`. After criterion 2, `:14` becomes
`  scope_type role_scope_type NOT NULL,` and **the trailing `--` comment is deleted**, because the
enum now *is* the vocabulary — a comment restating enum members is the exact redundancy the criterion
removes. Re-align the `NOT NULL` column of the surrounding lines if the type name width changes.

---

### `schema/301-auth-functions.sql` — criterion 2, the enum-comparison rewrite

**Analog for the cast idiom:** `schema/104-nominations.sql:35-42` — the only place in the schema that
casts literals to an enum:

```sql
  entity_type          public.entity_type NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
```

**Current comparisons to rewrite** (`schema/301-auth-functions.sql:58-62, 76-83` → `00001:1221-1225, 1239-1246`):

```sql
CREATE OR REPLACE FUNCTION public.has_role(
  p_check_role text,
  p_check_scope_type text DEFAULT NULL,
  p_check_scope_id uuid DEFAULT NULL
)
```
```sql
    IF role_entry->>'role' = p_check_role THEN
      IF p_check_role = 'super_admin' THEN RETURN true; END IF;
      IF p_check_scope_type IS NULL THEN RETURN true; END IF;
      IF role_entry->>'scope_type' = p_check_scope_type
         AND role_entry->>'scope_id' = p_check_scope_id::text THEN
```

**Pattern:** `role_entry->>'x'` yields `text`; comparing it to an enum parameter is an operator that
does not exist. Use the schema's existing `<literal>::public.<enum>` cast direction —
`(role_entry->>'role')::public.user_role_type = p_check_role` — matching `104-nominations.sql`'s
explicit `::public.<enum>` style (fully qualified, unlike the column declarations).

**No `DROP FUNCTION … CASCADE` is needed.** Under D-E2 rewrite-in-place, `00001` creates the function
(~`:1221`) *before* the 9 policies that call it (`:1327+`); `supabase db reset` replays a history that
was never wrong.

---

### `schema/104-nominations.sql` — criterion 3, the CHECK

**Analog:** the adjacent line `:52`, inside the same table body.

**Verbatim** (`schema/104-nominations.sql:44-53` → `00001:733-742`):

```sql
  election_id          uuid        NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  constituency_id      uuid        NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  election_round       integer     DEFAULT 1,
  election_symbol      text,
  -- Nesting
  parent_nomination_id uuid        REFERENCES public.nominations(id) ON DELETE CASCADE,
  unconfirmed          boolean     DEFAULT false,
  -- Exactly one entity FK must be set
  CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)
);
```

**Pattern to copy:** table-level anonymous `CHECK (…)` at the end of the column list, preceded by a
one-line `--` comment stating the invariant in plain words. New constraint follows as a sibling:

```sql
  -- Exactly one entity FK must be set
  CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1),
  -- Election rounds are 1-based
  CHECK (election_round >= 1)
```

> ⚠ **Do not conflate the two `= 1` tokens.** `:52` is the *exactly-one-entity-FK* constraint and is
> already present. Criterion 3 is met only by a **new** `CHECK (election_round >= 1)` proven by a
> rejected `election_round = 0` insert. Note the column is nullable, so the CHECK passes on NULL —
> record that caveat in `156-DISPOSITIONS.md`.

**Note the comma:** adding a constraint requires appending `,` to the existing `:52` line. That is a
2-line diff per copy, i.e. **4 changed lines total**.

---

### `schema/011-validation-functions.sql` — criterion 4, the `is_image` extraction

**Analog:** `is_localized_string` in the same file — **the file's own utility convention.**

**Header + volatility pattern to copy exactly** (`schema/011-validation-functions.sql:9-24` → `00001:89-104`):

```sql
--------------------------------------------------------------------------------
-- is_localized_string: check if a JSONB value is a localized string object
--
-- A localized string is a JSONB object where all values are strings.
-- Examples: {"en": "Hello", "fi": "Hei"}, {"en": "text"}
-- Returns false for: null, "plain string", 42, [], {"key": 42}
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_localized_string(p_val JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  p_key TEXT;
  p_value JSONB;
BEGIN
  IF p_val IS NULL OR jsonb_typeof(p_val) != 'object' THEN
    RETURN FALSE;
  END IF;
```

Extract every element of that header:

| Element | Value in the analog | Required in `is_image` |
|---|---|---|
| Banner | 80-char `---…---` rule above and below the doc block | same |
| Doc first line | `-- <name>: <one-line what-it-does>` | same |
| Signature | `CREATE OR REPLACE FUNCTION public.<name>(p_val JSONB)` | same param name `p_val`, uppercase `JSONB` |
| Return | `RETURNS BOOLEAN` (uppercase) | same |
| Language + volatility | `LANGUAGE plpgsql IMMUTABLE` (one line, no `SECURITY`, **no `SET search_path`**) | same |
| Body delimiter | `AS $$ … $$;` | same |
| Guard style | `IF … THEN RETURN FALSE; END IF;` early-returns | same |

> **`SECURITY` / `SET search_path`:** neither appears on any function in this file, nor on
> `010-utility-functions.sql`'s `get_localized` / `update_updated_at`. **Do not add them** — matching
> the analog exactly means omitting both. (`SECURITY INVOKER` appears only on the RPCs in
> `503`/`504`, where it is load-bearing and documented.)

**The block being extracted, verbatim** (`schema/011-validation-functions.sql:164-200` → `00001:244-280`):

```sql
    WHEN 'image' THEN
      IF jsonb_typeof(p_answer_value) != 'object' THEN
        RAISE EXCEPTION 'Answer for image question must be an object';
      END IF;
      -- Validate StoredImage structure: {path, pathDark?, alt?, width?, height?, focalPoint?}
      IF NOT (p_answer_value ? 'path') THEN
        RAISE EXCEPTION 'StoredImage must have a "path" property';
      END IF;
      IF jsonb_typeof(p_answer_value -> 'path') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "path" must be a string';
      END IF;
      IF p_answer_value ? 'pathDark' AND jsonb_typeof(p_answer_value -> 'pathDark') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "pathDark" must be a string';
      END IF;
      … (alt, width, height, focalPoint object, focalPoint x/y presence, x, y) …
```

**The raise-vs-predicate tension** (RESEARCH recommends shape (b)): the analog convention is a
**boolean predicate**, but this block raises **nine distinct messages**. Ship both —
`validate_image(jsonb) RETURNS void` carrying the nine `RAISE EXCEPTION`s verbatim, and
`is_image(jsonb) RETURNS BOOLEAN` as the convention-matching predicate. The call site at the `CASE`
arm becomes `WHEN 'image' THEN PERFORM public.validate_image(p_answer_value);`.

**Precedent for `public.`-qualified intra-file calls** — `011-validation-functions.sql:110`:

```sql
    IF jsonb_typeof(p_answer_info) != 'string' AND NOT public.is_localized_string(p_answer_info) THEN
```

Always call sibling helpers as `public.<name>(…)`.

---

### `schema/303-column-grants.sql` — criteria 1, 5, 7

**Analog:** the file's two mirrored blocks. Whatever is done to the candidates block at `:16-36` must
be done to the organizations block at `:38-56` — that mirroring **is** the pattern, and D-E3 makes it
mandatory.

**Verbatim, both blocks** (`schema/303-column-grants.sql:19-36` → `00001:1817-1834`, and
`:41-56` → `00001:1839-1854`):

```sql
-- Protected (admin-only) columns:
--   project_id      - determines project tenancy
--   auth_user_id    - links candidate to auth user, set during invite/registration
--   organization_id - party assignment
--   published       - publication status, admin-controlled
--   id              - primary key, immutable
--   is_generated    - system flag for mock/generated data
--
-- Allowed columns for candidates (self-edit):
--   name, short_name, info, color, image, sort_order, subtype,
--   custom_data, first_name, last_name, answers, created_at, updated_at

REVOKE UPDATE ON public.candidates FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, first_name, last_name, answers, created_at, updated_at,
  terms_of_use_accepted
) ON public.candidates TO authenticated;
```
```sql
-- Allowed columns for party admins (self-edit):
--   name, short_name, info, color, image, sort_order, subtype,
--   custom_data, answers, created_at, updated_at

REVOKE UPDATE ON public.organizations FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, answers, created_at, updated_at
) ON public.organizations TO authenticated;
```

**Four coordinated edits per block** — the "Allowed columns" comment is a *hand-maintained mirror* of
the GRANT list. Editing one without the other is the classic defect this file invites:

1. **criterion 5** — drop `sort_order`, `created_at`, `updated_at` from **both** GRANT lists **and**
   both "Allowed columns" comments. (Six columns total; the denial proof is six assertions.)
2. **criterion 7** — drop `name` from the candidates GRANT list (`:33` → `00001:1831`) **and** its
   comment (`:28` → `00001:1826`). Organizations keeps `name`.
3. **criterion 1** — the three `party` comment hits at `:3`, `:22`, `:48`.
4. Consider promoting the dropped columns into the "Protected (admin-only) columns" comment block,
   which is where the file documents everything `authenticated` may not write.

**D-N1 clean-comment model:** `:19-25` is the right register — `--   <column> - <why it is protected>`,
present tense, describing behaviour. Rewrite `:22` as `--   organization_id - nominating organization`
and `:48` as `-- Allowed columns for organization admins (self-edit):`. **No phase number, no
`.planning/` path, no decision id.**

**Safety note the reviewer will ask about, already answered in RESEARCH:** revoking `updated_at`
cannot break candidate self-edit — the `set_updated_at` `BEFORE UPDATE` trigger writes the column
regardless of the caller's column privileges (proven live, in a rolled-back transaction). Column
privileges are checked against the columns *named in the statement*.

---

### `schema/503-entity-rpcs.sql` — criteria 6 & 7

#### Criterion 7 — the `RETURNS TABLE` column-count preservation pattern

**Analog: the function's own second UNION branch.** `get_candidate_user_data`
(`schema/503-entity-rpcs.sql:97-137` → `00001:3187-3227`) already pads a branch with typed NULLs:

```sql
CREATE OR REPLACE FUNCTION public.get_candidate_user_data(
  p_entity_type public.entity_type DEFAULT 'candidate'
)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  answers jsonb,
  terms_of_use_accepted timestamptz,
  first_name text,
  last_name text,
  organization_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT c.id, c.project_id, c.name, c.short_name, c.info,
         c.color, c.image, c.sort_order, c.subtype,
         c.custom_data, c.answers, c.terms_of_use_accepted,
         c.first_name, c.last_name, c.organization_id
  FROM public.candidates c
  WHERE c.auth_user_id = (SELECT auth.uid())
    AND p_entity_type = 'candidate'
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
         o.color, o.image, o.sort_order, o.subtype,
         o.custom_data, o.answers, NULL::timestamptz,
         NULL::text, NULL::text, NULL::uuid
  FROM public.organizations o
  WHERE o.auth_user_id = (SELECT auth.uid())
    AND p_entity_type = 'organization'
$$;
```

**The pattern is on the org branch's line 3:** `NULL::timestamptz, NULL::text, NULL::text, NULL::uuid`
— **typed** NULL literals padding a branch that has no such column, keeping the `RETURNS TABLE` arity
intact. Copy it exactly for the candidate branch after `candidates.name` is dropped:
`c.id, c.project_id, NULL::jsonb, c.short_name, c.info,` (`schema/503:121` → `00001:3211`).

**Do NOT drop the `name` output column from the `RETURNS TABLE` declaration.** That is a signature
change, and it is Phase 164's declared territory (`RETURNS TABLE` nullability audit). The frontend
tolerates null (`dataProvider/supabaseDataProvider.ts:349, 368`).

`get_nominations` (`schema/503:62` → `00001:3159`, **and `migrations/00002_…:90`**) needs the analogous
minimal edit: `COALESCE(c.name, o.name, f.name, a.name) AS entity_name` → drop `c.name` only.

**GRANT-follows-function pattern** (`schema/503:92`): every RPC is immediately followed by its grant —

```sql
GRANT EXECUTE ON FUNCTION public.get_nominations(uuid, uuid, boolean) TO anon, authenticated;
```

Any signature change must carry its `GRANT EXECUTE` line's argument list along with it.

#### Criterion 6 — widening `upsert_answers`

**Analog: the function's own two branches.** Today `UPDATE public.candidates` appears in both the
overwrite branch (`:160` → `00001:3250`) and the merge branch (`:169` → `00001:3259`), with a shared
tail (`:181-183` → `00001:3271-3273`):

```sql
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', p_entity_id;
  END IF;
```

**Pattern:** only `candidates` and `organizations` carry an `answers` column
(`105-answers.sql:11-12`) — a **two**-table widening, not four. `SECURITY INVOKER` means RLS gates
each attempt, so widening grants no new authority. Try candidates; on `NOT FOUND`, try organizations;
raise the existing message only if both miss. **Signature unchanged** → the adapter call site is
source-compatible (Contract C3).

---

### `schema/504-admin-rpcs.sql` — criterion 6, the RPC rename

**Analog: the file itself.** Every element except the name is already question-specific — which is the
evidence RESEARCH cites for **rename** over generalise.

**Verbatim** (`schema/504-admin-rpcs.sql:1-15` → `00001:3280-3294`):

```sql
-- Admin RPC functions
--
-- Functions:
--   merge_custom_data() - shallow JSONB merge on questions.custom_data

--------------------------------------------------------------------------------
-- merge_custom_data: shallow JSONB merge on questions.custom_data
--
-- SECURITY INVOKER: the existing admin_update_questions RLS policy enforces
-- that only admins with can_access_project() can update questions.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_custom_data(
  p_question_id uuid,
  p_patch       jsonb
)
```

and the tail (`:36` → `00001:3315`):

```sql
GRANT EXECUTE ON FUNCTION public.merge_custom_data(uuid, jsonb) TO authenticated;
```

**Rename touches five name sites in this file alone:** the file-header `Functions:` line, the banner
doc line, the `CREATE OR REPLACE FUNCTION` name, and the `GRANT EXECUTE` name — plus the
`SECURITY INVOKER` rationale block, which stays verbatim (it names `admin_update_questions`, still
correct after a rename; it would need a per-table restatement under generalisation, which is the
argument against generalising).

**The `SECURITY INVOKER: <why>` comment is the pattern to preserve** — it is the file's convention for
justifying invoker security by naming the specific RLS policy relied on.

---

### `apps/frontend/…/supabaseAdminWriter.ts` + `supabaseDataWriter.ts` — criterion 6 call sites

**Analog: each other.** The two call sites are byte-identical bodies in sibling directories. Change
both or neither.

`apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:19-32`:

```ts
  /**
   * Update a question's custom data by merging new data into the existing JSONB.
   * Uses the `merge_custom_data` RPC function.
   */
  async updateQuestion({ id, data: { customData } }: SetQuestionOptions): Promise<DataApiActionResult> {
    if (!customData || typeof customData !== 'object')
      throw new Error(`Expected a customData object but got type: ${typeof customData}`);

    const { error } = await this.supabase.rpc('merge_custom_data', {
      p_question_id: id,
      p_patch: customData
    });
    if (error) throw new Error(`updateQuestion: ${error.message}`);
    return { type: 'success' as const };
  }
```

`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:384-393` — the same
`this.supabase.rpc('merge_custom_data', { p_question_id: id, p_patch: customData })` inside
`_updateQuestion`.

> ⚠ **Path correction:** the orchestrator brief cites `dataWriter/supabaseAdminWriter.ts`. The
> measured path is **`adminWriter/`**`/supabaseAdminWriter.ts` — a sibling directory.
> The `dataWriter` site is at `:388`, not `:26`.

**Three sites change per rename, not two** — the JSDoc line ``Uses the `merge_custom_data` RPC
function.`` names the RPC too, in `adminWriter` only.

**Unit-test expectation pattern** (`adminWriter/supabaseAdminWriter.test.ts:64-79`) — the RPC name is a
string literal in a `toHaveBeenCalledWith`, so it must be renamed in lockstep:

```ts
  describe('updateQuestion', () => {
    it('calls merge_custom_data RPC and returns success', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
      const result = await writer.updateQuestion({ authToken: '', id: 'q1', data: { customData: { arguments: [] } } });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('merge_custom_data', {
        p_question_id: 'q1',
        p_patch: { arguments: [] }
      });
      expect(result).toEqual({ type: 'success' });
    });
```

Note the RPC name also appears in the **test title string** — rename it there too, or the test name
lies. `dataWriter/supabaseDataWriter.test.ts` carries the mirror expectation.

---

### `tests/database/09-column-restrictions.test.sql` — criterion 5, six denial assertions

**Analog: the file itself, `:29-43`.** This is the canonical column-grant-denial idiom.

**Verbatim** (`apps/supabase/supabase/tests/database/09-column-restrictions.test.sql:29-43`):

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

**Every element is load-bearing:**

| Element | Why |
|---|---|
| `set_test_user('authenticated', test_user_id(k), test_user_roles(k))` | sets `role` **and** the full `request.jwt.claims` payload (`sub`, `role`, `user_roles`) — exactly what PostgREST does per request |
| `format($$…%s…$$, test_id(k))` | dollar-quoted SQL string with `%s` id interpolation; never a hand-built literal |
| `'42501'` | insufficient_privilege — the SQLSTATE PostgREST surfaces as HTTP 403 |
| `NULL` (message arg) | the raised message is table-scoped (`permission denied for table candidates`), not column-scoped, so asserting on it would over-specify |
| description string | `'<Actor> cannot update <column> on own <object>'` |

**The organizations fixture is already present** at `:124-128` — copy this stanza verbatim (renaming
`party_a` → `organization_a` per criterion 1) before the three org-side assertions:

```sql
SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET published = true WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Party admin cannot update published on own organization'
);
```

**`plan(N)` maintenance** — the count is a hand-maintained literal near the top of every file, after a
fixed 4-line preamble (`schema/09:13-24`):

```sql
BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(15);

-- Create test fixture data
SELECT create_test_data();
```

`SELECT plan(15);` → **`SELECT plan(21);`** (+3 candidates × {sort_order, created_at, updated_at},
+3 organizations × the same).

**Section-banner convention** — 69-char `=` rules around a `-- Section N: <title>` line. Criterion 5's
new assertions want `-- Section 4: Structural/audit columns are not self-editable` or equivalent, and
the file's *header* comment (`:1-11`) lists the protected columns per table — **extend that list**, or
the header goes stale.

**Header `Depends on:` line** — every test file carries one (`:10-11`
`-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)`). Preserve it.

---

### `tests/database/10-schema-migrations.test.sql` — criteria 1, 2, 3, 4, 6, 7 shape assertions

**Analog: the file itself.** It is the schema-shape test file, and it already carries every assertion
form this phase needs.

**`has_column` / `col_type_is`** (`:29-40`) — for criterion 7's `hasnt_column` and criterion 2's
enum-typed column:

```sql
-- 1. Column exists
SELECT has_column(
  'public', 'app_settings', 'customization',
  'app_settings has customization column'
);

-- 2. Column type is jsonb
SELECT col_type_is(
  'public', 'app_settings', 'customization', 'jsonb',
  'customization column is jsonb type'
);
```

Compact one-line form for runs of columns (`:101-108`):

```sql
SELECT has_column('public', 'feedback', 'id',          'feedback has id column');
SELECT has_column('public', 'feedback', 'project_id',  'feedback has project_id column');
```

- criterion 7 → `SELECT hasnt_column('public', 'candidates', 'name', 'candidates no longer has name column');`
  plus `has_column('public','organizations','name', …)` to prove the asymmetry is deliberate.
- criterion 2 → `col_type_is('public', 'user_roles', 'scope_type', 'role_scope_type', …)`.

**`throws_ok` with SQLSTATE `23514` (CHECK violation)** — the analog criterion 3 needs. **Exactly one
exists in the suite**, at `:129-138`:

```sql
-- 19. Anon INSERT with both rating AND description NULL throws CHECK violation
SELECT throws_ok(
  format(
    $$INSERT INTO feedback (project_id, date, created_at) VALUES ('%s', now(), now())$$,
    test_id('project_a')
  ),
  '23514',
  NULL,
  'anon INSERT feedback with both rating and description NULL throws CHECK violation'
);
```

Copy this exactly for the `election_round = 0` rejection — same 4 args, same `format($$INSERT …$$, test_id(…))`
shape, `NULL` for the message.

**`has_function` + `prosecdef` pair** (`:486-496`) — the analog for criterion 6's renamed RPC and
criterion 4's new `is_image` / `validate_image`:

```sql
SELECT reset_role();

-- 58. Function exists
SELECT has_function(
  'public', 'merge_custom_data', ARRAY['uuid', 'jsonb'],
  'merge_custom_data(uuid, jsonb) function exists'
);

-- 59. SECURITY INVOKER (not DEFINER)
SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc WHERE proname = 'merge_custom_data'),
  'merge_custom_data is SECURITY INVOKER (not DEFINER)'
);
```

Note `SELECT reset_role();` before fixture/DDL-shaped operations — the helper that switches back to
the postgres superuser (`00-helpers.test.sql:255-257`).

**Numbered `-- N.` comments** precede each assertion and track the `plan()` count. Renumber on insert.

**`merge_custom_data` appears ~7 times in this file** (`:488-490, 495-496, 507-508, 526-527, 539, 544,
556, 561, 575-576`) — as the function name, in assertion descriptions, and in `pg_proc` lookups. All
change on rename.

**No `enum_has_labels` / `has_type` assertion exists anywhere in the suite** — criterion 1 and 2 would
be the first. `enum_has_labels('public','user_role_type', ARRAY['candidate','organization',…], …)`
is the natural addition and is the one thing that turns a `schema/`-only edit (which reaches no
database) from a silent green into a failure.

---

### `tests/database/00-helpers.test.sql` — criteria 1 & 2 fixture fan-out

**Two fixture sites carry the literals.** They are not analogs to copy from — they are targets.

**JWT-claims builder** (`:194-198`):

```sql
    WHEN 'party_a' THEN
      jsonb_build_array(jsonb_build_object(
        'role', 'party',
        'scope_type', 'party',
        'scope_id', 'dddddddd-dddd-dddd-dddd-000000000003'
      ))
```

**`user_roles` insert** (`:305-314`) — note the aligned-column style:

```sql
  -- ===== User roles =====
  INSERT INTO user_roles (user_id, role, scope_type, scope_id) VALUES
    (test_user_id('admin_a'),         'project_admin', 'project',   test_id('project_a')),
    (test_user_id('candidate_a'),     'candidate',     'candidate', test_id('candidate_a')),
    (test_user_id('party_a'),         'party',         'party',     test_id('org_a')),
    (test_user_id('super_admin'),     'super_admin',   'global',    NULL),
    (test_user_id('account_admin_a'), 'account_admin', 'account',   test_id('account_a'));
```

Both `'party'` literals → `'organization'`. **Unknown-typed literals coerce to the enum on INSERT**, so
criterion 2 needs no explicit cast here. The fixture *key* `'party_a'` → `'organization_a'` is a
separate, wider rename (it appears in `09`, `05`, and the `test_user_id` / `test_user_roles` CASE
arms) — decide once and apply everywhere, keeping the column alignment.

---

### `tests/database/05-party-admin.test.sql` → `05-organization-admin.test.sql`

**No manifest exists.** pgTAP runs via `cd apps/supabase && npx supabase test db`, which globs
`supabase/tests/`; CI does the same (`.github/workflows/main.yaml:133`). **A rename is safe for
discovery provided the `NN-` numeric prefix is kept** — files run in filename order and
`00-helpers.test.sql` must run first.

The file's header is itself a doc that restates the RLS predicates and must be rewritten with the
rename (`:1-15`):

```sql
-- 05-party-admin.test.sql: Party admin scope tests
--
-- Verifies that a party admin (role=party, scope_type=party, scope_id=org_id)
-- can read and update their own organization, see their party's candidates,
…
-- Party admin access patterns (from 010-rls.sql):
--   organizations SELECT: auth_user_id = auth.uid() OR has_role('party','party',id) OR published = true
```

> Note this header cites `010-rls.sql`, a **stale filename** (the file is `302-rls.sql`). Fix while
> renaming — and note the `Depends on:` / `(from <file>)` cross-reference style is the *house* pattern
> and is D-N1-clean (it cites source files, not planning artifacts).

**Silent-skip detector:** total planned assertions across the suite is **264** today
(`01:26, 02:15, 03:59, 04:30, 05:14, 06:15, 07:9, 08:16, 09:15, 10:65`). After this phase the total
must be **≥ 264 + 6 (criterion 5) + N (criterion 3) + M (criterion 4)**. A total that *drops* means a
file stopped being discovered.

---

### `.planning/todos/pending/<date>-<slug>.md` — D-N2, four todos

**Analog:** `.planning/todos/pending/2026-03-28-investigate-migrating-candidate-answer-store.md`
(the closest — it has a populated `files:` list; the sibling
`2026-03-28-generalize-candidate-app-to-party-app.md` shows the `files: []` empty form).

**Exact frontmatter + body shape, verbatim:**

```markdown
---
created: "2026-03-28T09:38:22.149Z"
title: Investigate migrating candidate answer store to something more robust
area: ui
files:
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.ts
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
---

## Problem

The current candidate answer store (`candidateUserDataStore`) manages candidate answers in a
client-side store pattern that may not be robust enough for production use. Potential concerns
include data persistence reliability, conflict resolution when multiple sessions edit answers, and
the overall architecture of how candidate answers flow between client and server.

## Solution

TBD — Investigate:
- Current pain points with the answer store (data loss scenarios, race conditions, stale state)
- Whether answers should be persisted more aggressively to the backend
- Alternative state management approaches
```

| Element | Rule |
|---|---|
| Filename | `YYYY-MM-DD-<kebab-slug>.md`, date = creation date (`2026-08-28-…`) |
| `created` | ISO-8601 with `Z`, **double-quoted** |
| `title` | sentence case, unquoted, imperative or "Investigate …" |
| `area` | free string (`ui` in both analogs; `database` / `backend` is the right value for these four) |
| `files` | YAML list of repo-relative paths, or `[]` |
| Body | exactly two `##` sections: `## Problem` (prose paragraph) then `## Solution` (`TBD — …` + a `-` bullet list of candidate approaches) |

**The four todos to file:** `lint-schema.mjs` → pgTAP re-expression; the id-JSONB FK linkage question
(covering **both** `question_categories:20-23` **and** `questions:48-51`); the feedback IP salted-hash
recommendation; and — if the planner declines the `app_settings` FK fix — an `ON DELETE CASCADE` todo
**naming Phase 161 as the consumer**.

> These are `.planning/` documents, **not** SQL/dev-seed comments, so D-N1's no-phase-number rule does
> not bind them. Cross-references to Phase 161/162 are appropriate here and nowhere else.

---

## Shared Patterns

### Pattern S1 — Every SQL edit lands twice

**Source:** `apps/supabase/README.md:8-27`; `config.toml:53-58`
**Apply to:** all 14 `schema/*.sql` files in the change set

Use the per-file twin table above to locate the `00001` pair, then **content-match**, do not seek to a
line number after the first edit. **The commit diff must show each change twice.** A Wave A diff with
an odd number of changed SQL hunks is a defect signal.

### Pattern S2 — pgTAP file preamble and `plan(N)`

**Source:** `tests/database/09-column-restrictions.test.sql:13-24`
**Apply to:** every pgTAP file touched

```sql
BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(N);

SELECT create_test_data();
```

`plan(N)` is hand-maintained. Bump it in the same edit that adds assertions, or the file fails with a
plan-count mismatch. Files end with `SELECT * FROM finish(); ROLLBACK;`.

### Pattern S3 — simulating a PostgREST-authenticated session

**Source:** `tests/database/00-helpers.test.sql:215-222` (docstring), used at `09:29-33`
**Apply to:** every RLS / grant assertion

```sql
SELECT set_test_user('authenticated', test_user_id(<key>), test_user_roles(<key>));
-- … assertions …
SELECT reset_role();   -- back to postgres superuser for fixture/DDL work
```

Never hand-craft `SET request.jwt.claims`. `set_test_user` builds `sub`, `role` and `user_roles`
exactly as PostgREST does.

### Pattern S4 — `throws_ok` four-argument form

**Source:** `09-column-restrictions.test.sql:35-43` (42501); `10-schema-migrations.test.sql:129-138` (23514);
`08-triggers.test.sql:54-62` (message-matching form)

```sql
SELECT throws_ok(
  format($$<statement with %s>$$, test_id(<key>)),
  '<sqlstate>' | NULL,
  '<expected message>' | NULL,
  '<description>'
);
```

| Use case | SQLSTATE arg | message arg |
|---|---|---|
| Column-grant denial (criterion 5) | `'42501'` | `NULL` — the message is table-scoped |
| CHECK violation (criterion 3) | `'23514'` | `NULL` |
| `RAISE EXCEPTION` from a validation fn (criterion 4) | `NULL` | the exact message string — see `08-triggers.test.sql:54-62`, `'Answer for text question must be a string or localized string object'` |

Criterion 4's `validate_image` assertions should use the **third** form, asserting the nine preserved
messages — that is precisely what shape (b) buys.

### Pattern S5 — SQL comment style under D-N1

**Apply to:** every SQL comment written or rewritten in this phase

**Clean models to copy:**
- `schema/000-enums.sql:1-7` — a file-header `Functions:`/type list, one line per item.
- `schema/010-utility-functions.sql:18-30` — a banner-ruled function doc with a numbered
  `-- Fallback order:` list. No citations of anything outside the tree.
- `schema/303-column-grants.sql:19-25` — `--   <column> - <why>` alignment.
- `schema/504-admin-rpcs.sql:9-10` — `-- SECURITY INVOKER: <the specific RLS policy relied on>`.
- Test headers' `-- Depends on: <file> (<what it provides>)` — cites **source files**, which is fine.

**Violations already in the tree, to fix while passing through (not to imitate):**
- `tests/database/10-schema-migrations.test.sql:1` — `-- 10-schema-migrations.test.sql: see phase 22 + see phase 27 schema migration tests` — **phase numbers in a comment.**
- `tests/database/05-party-admin.test.sql:8` — `(from 010-rls.sql)`, a **stale filename** (now `302-rls.sql`).
- `303-column-grants.sql:11-14` and `09-column-restrictions.test.sql:11` — `Depends on: 003-entities.sql / 013-auth-rls.sql / 010-rls.sql / 006-answers-jsonb.sql / 011-auth-tables.sql` — **all five are pre-renumbering filenames that no longer exist.**
- `packages/dev-seed/src/supabaseAdminClient.ts:195-205` — good behavioural-caution prose, but it cites "Phase 145" — the exact pattern D-N1 removes.

**Rule for this phase:** no phase numbers, no `.planning/` paths, no decision ids in SQL or dev-seed
comments; comments describe **current behaviour**. Note that Phase 152's scan has **not landed** —
`yarn lint:check` chains no hygiene check today — so this is enforced **by discipline**, and every
comment-writing task must restate the rule inline.

### Pattern S6 — the `GRANT EXECUTE` shadow

**Source:** `schema/503-entity-rpcs.sql:92`, `schema/504-admin-rpcs.sql:36`

```sql
GRANT EXECUTE ON FUNCTION public.<name>(<arg types>) TO <roles>;
```

Every RPC is immediately followed by its grant, and **the grant repeats the argument-type list**. Any
rename or signature change is a two-line edit per copy, four lines total.

### Pattern S7 — generated output is never hand-edited

**Source:** CLAUDE.md; root `package.json` `"db:types"`
**Apply to:** `packages/supabase-types/src/database.ts` (`:1313`, `:1449` carry `'party'`; `:1257`
`merge_custom_data`; `:1287` `upsert_answers`; plus `candidates.name`)

Run `yarn db:types` **after** Wave A and a successful `db:reset`, then `yarn build` before
typechecking downstream. `packages/dev-seed/src/template/permittedKeys.ts:1036`
(`FixedRow<'candidates'>`) narrows automatically from the regenerated types, so `yarn typecheck` is
the detector for any template still setting `name`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `156-DISPOSITIONS.md` | planning artifact | — | No `*-DISPOSITIONS.md` exists in any phase directory. Structure is Claude's Discretion per CONTEXT. Nearest shape guidance: the CONTEXT's own `<facts>` tables (one row per item: `#` / Item / Measured anchor / Disposition) — and it must carry **six** entries: the five criterion-8 items **plus** criterion 6's `merge_custom_data` rename-vs-generalise choice, which Contract C3 makes a hard prerequisite for planning Phase 157. |
| `scripts/assert-schema-migration-parity.mjs` *(optional, O-3)* | build tooling | batch | No drift check exists. **Partial analog:** the three root-level asserts `scripts/assert-unit-test-coverage.mjs`, `assert-i18n-catalog-namespaces.mjs`, `assert-a11y-scan-wiring.mjs` — same directory, same `yarn assert:*` → `lint:check` chaining convention. Not a *behavioural* analog: `apps/supabase/scripts/lint-schema.mjs` (the other candidate home) queries a live DB at `:29`, whereas a `cmp` parity check needs none. |

---

## Metadata

**Analog search scope:** `apps/supabase/supabase/{schema,migrations,tests/database}/`,
`apps/supabase/{scripts,package.json,README.md}`, `apps/frontend/src/lib/api/adapters/supabase/`,
`packages/dev-seed/src/`, `.planning/todos/pending/`, `scripts/`
**Files scanned:** 24 read; ~40 grepped
**Pattern extraction date:** 2026-08-28
**Read-only:** no source file was modified.
