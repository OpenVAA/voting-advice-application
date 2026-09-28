# Phase 162: Permissions & Auth Model Refactor — Pattern Map

**Mapped:** 2026-09-15
**Tree:** worktree `voting-advice-application-gsd`, branch `integration/ship-12-squash`, HEAD `440a7780f`
**Files analyzed:** 24 create/modify targets across the 19 plans of brief § 5
**Analogs found:** 21 / 24 — **3 constructs have NO in-tree analog** (see § No Analog Found).
**Corrected 2026-09-16:** one of the two "weaker" flags below was wrong — the OLD-conditional immutability trigger *does* have an exact in-tree analog.
**Brought into agreement 2026-09-17 by 162-17 Task 8**, which 162-13 recorded as this plan's obligation: the
struck entry in § No Analog Found is the correction, and the counts above now agree with it. The three
constructs in the § No Analog Found TABLE are unchanged and still have no in-tree analog; what changed is
that one of the two weaker flags below the table is withdrawn, so the effective analog count is **22 / 24**
rather than 21 / 24. The withdrawn flag is left struck through rather than deleted, because a pattern map
that silently loses a wrong entry teaches nothing about how it was caught.
**Research input:** none (no RESEARCH.md by design); brief § 2 facts 16–27 and §§ 11.5–11.8 facts 28–39.

All analog paths below are **git-tracked source** (`git ls-files` verified). No `.gsd/capabilities/**`
mirror path appears anywhere in this document.

---

## File Classification

| New/Modified file | Plan(s) | Role | Data flow | Closest analog | Match |
|---|---|---|---|---|---|
| `apps/supabase/supabase/schema/000-enums.sql` | 162-03, 162-07 | schema/enum | declarative DDL | *itself* — `user_role_type` / `role_scope_type` blocks | exact |
| `apps/supabase/supabase/schema/300-auth-tables.sql` (`grants` table; `published` deletion) | 162-03, 162-16 | schema/table + RLS | declarative DDL | *itself* — `CREATE TABLE public.user_roles` + its four-policy block | exact |
| `apps/supabase/supabase/schema/301-auth-functions.sql` (`user_can`, `is_child_nominee`, shims, hook) | 162-04, 162-05, 162-06, 162-15 | security predicate fn | request-response (per-row, per-policy) | *itself* — `can_access_project` | exact |
| `apps/supabase/supabase/schema/302-rls.sql` (80 policies) | 162-08…162-13, 162-16 | RLS policy | CRUD authz | *itself* — the `accounts`/`projects`/`elections` policy quads | exact |
| `apps/supabase/supabase/schema/303-column-grants.sql` (INSERT column list for `nominations`) | 162-12, 162-13, 162-16 | column grant | DDL grant | `candidates` REVOKE/GRANT **UPDATE** pair | **partial — INSERT form does not exist** |
| `apps/supabase/supabase/schema/104-nominations.sql` (uniqueness constraint, `unconfirmed`→`confirmed`, FK ruling) | 162-12 | schema/table | declarative DDL | `nominations_election_round_check` in the same `CREATE TABLE` | exact (naming); **none for `NULLS NOT DISTINCT`** |
| `apps/supabase/supabase/schema/102-entities.sql` (`confirmed` ×4; `factions.organization_id`; drop `candidates.organization_id`) | 162-07, 162-07b | schema/table | declarative DDL | `CREATE TABLE public.factions` / `public.candidates` in the same file | exact |
| `apps/supabase/supabase/schema/100-tenancy.sql` (`projects.open_for_voters`, `lock_nominations`) | 162-07 | schema/table | declarative DDL | same file's `CREATE TABLE public.projects` | exact |
| `apps/supabase/supabase/schema/101-elections.sql` (**`election_type` repurposed** to an enum carrying the nomination shape — corrected 2026-09-15; there is no `nomination_shape` column, see `162-CONTEXT.md` D-16) | 162-07 | schema/table | declarative DDL | existing `elections.election_type text` — **the same column**, so this is a type + meaning change, not a new column | exact |
| `apps/supabase/supabase/schema/011-validation-functions.sql` (faction-org tightening) | 162-12 | trigger fn | event-driven (BEFORE INSERT/UPDATE) | `validate_nomination()` in the same file | exact |
| `apps/supabase/supabase/schema/400-storage.sql` (15 policies) | 162-14 | RLS policy (storage) | file-I/O authz | `admin_insert_public_assets` (good) vs `candidate_insert_public_assets` (the defect) | exact |
| `apps/supabase/supabase/schema/200-indexes.sql` | 162-03, 162-07b, 162-16 | schema/index | DDL | `idx_user_roles_user_id`, `idx_candidates_organization_id` | exact |
| `apps/supabase/supabase/schema/503-entity-rpcs.sql` (two `RETURNS TABLE` shapes) | 162-07b | RPC | request-response | the two existing `c.organization_id AS entity_organization_id` select lists | exact |
| `apps/supabase/supabase/schema/501-bulk-operations.sql`, `502-email-helpers.sql`, `105-answers.sql`, `500-external-id.sql`, `106-app-settings.sql` | 162-02b, 162-07b, 162-16 | schema | DDL | the `ADD COLUMN` sites themselves (fact 31) | exact |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` (regenerated; `00002`–`00008` deleted) | 162-02b + every later wave | generated artefact | batch | current `00001` | exact |
| `scripts/assert-schema-migration-parity.mjs` (→ one-line `cmp`) | 162-02b | gate script | batch | its **own docblock**, which specifies the collapse | exact |
| `apps/supabase/scripts/lint-schema.mjs` (structural non-collapse guard) | 162-17 | gate script | batch | its two Splinter-derived checks (`SQL_RLS_DISABLED` pattern) | role-match |
| `apps/supabase/supabase/tests/database/*.test.sql` (widened estate) | 162-17 | pgTAP test | batch | `02-candidate-self-edit.test.sql`, `06-storage-rls.test.sql`, `09-column-restrictions.test.sql` | exact |
| `packages/supabase-types/**` (regenerated) + `src/column-map.ts` (RES-7) | every schema wave; 162-07b | generated types + map | transform | `COLUMN_MAP` / `PROPERTY_MAP` in the same file | exact |
| `apps/frontend/src/lib/auth/roles.ts` (+ 3 other claim readers) | 162-06 | utility / claim reader | transform | *itself* — `readUserRoles`, `RoleClaim`, `UserRole` | exact |
| `apps/frontend/src/lib/server/admin/requireAdminIdentity.ts`, `…/adapters/supabase/dataWriter/supabaseDataWriter.ts`, `routes/api/admin/jobs/adminJobsAuthorization.ts` | 162-06 | middleware/service | request-response | `roles.ts` consumers | exact |
| `apps/supabase/supabase/functions/invite-candidate/index.ts` | 162-06, 162-20-scope (D-20) | edge function | request-response | its own `user_roles` insert block + `identity-callback`'s hard-throw | exact |
| `apps/supabase/supabase/functions/identity-callback/index.ts` | 162-06 (D-22) | edge function | request-response | its own candidate-create + role-insert block | exact |
| `packages/dev-seed/src/generators/*.ts`, `src/template/permittedKeys.ts`, `seed.sql`, ~43 E2E specs | 162-07, 162-07b, 162-16 | fixture/generator | batch | `FactionsGenerator.ts` / `CandidatesGenerator.ts` | exact |
| `.planning/phases/162-…/162-SPEC.md`, `162-NEGATIVE-CONTROL-LEDGER.md` | 162-01, 162-17 | doc | — | `144-NEGATIVE-CONTROL-LEDGER.md`, `157-…`, `158-…` | exact |

---

## Pattern Assignments

### `301-auth-functions.sql` → `user_can` (162-04) and the shims (162-05)

**Analog:** `apps/supabase/supabase/schema/301-auth-functions.sql`, function `can_access_project`.

This is the shape `user_can` generalises, and CONTEXT § Existing Code Insights says so. Copy four things
verbatim: the `LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''` header, the
`(SELECT auth.jwt() -> '<claim>')` single-evaluation read, the NULL-claim early `RETURN false`
(deny-by-default), and the `FOR … IN SELECT * FROM jsonb_array_elements(...)` loop with a table lookup
**inside** the loop only for the hierarchy hop.

```sql
CREATE OR REPLACE FUNCTION public.can_access_project (p_project_id uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  user_roles jsonb;
  role_entry jsonb;
  p_account_id uuid;
BEGIN
  user_roles := (SELECT auth.jwt() -> 'user_roles');
  IF user_roles IS NULL THEN RETURN false; END IF;

  FOR role_entry IN SELECT * FROM jsonb_array_elements(user_roles)
  LOOP
    IF (role_entry->>'role')::public.user_role_type = 'super_admin' THEN RETURN true; END IF;
    ...
    IF (role_entry->>'role')::public.user_role_type = 'account_admin' THEN
      -- the account hop: the ONE table lookup, and the reason D-06's hybrid is not a new shape
      SELECT account_id INTO p_account_id FROM public.projects WHERE id = p_project_id;
      ...
    END IF;
  END LOOP;

  RETURN false;
END;
$$;
```

**The access-token hook `162-06` rewrites** is in the same file; copy its `jsonb_agg` +
`COALESCE(…, '[]'::jsonb)` + `jsonb_set(claims, '{…}', …)` form, substituting `grants` for `user_roles`:

```sql
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('role', ur.role::text, 'scope_type', ur.scope_type::text, 'scope_id', ur.scope_id)
  ), '[]'::jsonb)
  INTO user_roles_claim
  FROM public.user_roles ur
  WHERE ur.user_id = (p_event->>'user_id')::uuid;

  claims := jsonb_set(claims, '{user_roles}', user_roles_claim);
```

**The shim form 162-05 needs** is `is_candidate_self` — the file's only `LANGUAGE sql` one-liner, and
exactly the shape a `has_role` / `can_access_project` shim over `user_can` should take:

```sql
CREATE OR REPLACE FUNCTION public.is_candidate_self (p_row_auth_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT p_row_auth_user_id = (SELECT auth.uid());
$$;
```

(162-10 **deletes** this function per A3(a); its body is the re-derivation being folded in.)

---

### `302-rls.sql` → the 80 policies (162-08 … 162-13, 162-16)

**Analog:** the `projects` quad in the same file — and it is simultaneously **criterion 2's confirmed
defect**. The SELECT and the UPDATE are the *same predicate*:

```sql
CREATE POLICY "authenticated_select_projects" ON public.projects FOR
SELECT
  TO authenticated USING (
    (SELECT can_access_project (id))
    OR (SELECT has_role ('account_admin', 'account', account_id))
    OR (SELECT has_role ('super_admin'))
  );

CREATE POLICY "admin_update_projects" ON public.projects
FOR UPDATE
  TO authenticated USING ((SELECT can_access_project (id)))
WITH
  CHECK ((SELECT can_access_project (id)));
```

**The new policies must NOT look like this.** Under D-09 the UPDATE becomes
`user_can('project', id, 'project.edit_project_settings')` while the SELECT becomes a read verb —
the read/write collapse is what the phase removes.

**House conventions to preserve** (stated in the file's own header and obeyed by all 80 policies):

- `SELECT` = `USING` only · `INSERT` = `WITH CHECK` only · `UPDATE` = both · `DELETE` = `USING` only.
- Always name `TO anon` or `TO authenticated` explicitly.
- Always wrap the predicate as `(SELECT fn(...))` for optimizer caching of `auth.jwt()`/`auth.uid()`.
- Name policies `<actor>_<verb>_<table>`. Under the generalisation instruction (D-21) the actor segment
  must not be an entity type where the predicate could take one as an argument.
- Each table's block opens with `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` and
  `DROP POLICY IF EXISTS "<table>_deny_all" ON …;`.

**The anon read pattern 162-08 replaces** (the `published` term D-11b deletes):

```sql
CREATE POLICY "anon_select_elections" ON public.elections FOR
SELECT
  TO anon USING (published = true);

CREATE POLICY "anon_select_candidates" ON public.candidates FOR
SELECT
  TO anon USING (
    published = true
    AND terms_of_use_accepted IS NOT NULL
    AND terms_of_use_accepted < now()
  );
```

`anon_select_candidates` is the **closest analog for the new conjunctive rule**: it already ANDs a
non-`published` condition onto the visibility test, so 162-08's "project open AND nomination confirmed
AND every linked entity confirmed" is the same *shape* with a different (and transitive) right-hand side.

---

### `400-storage.sql` → all 15 storage policies (162-14)

**The contrast is the whole of D-03 / criterion 6.** Both excerpts are in this one file.

**GOOD — routes through the predicate** (`admin_insert_public_assets`; 11 such sites):

```sql
CREATE POLICY "admin_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (
      SELECT
        can_access_project (
          (storage.foldername (storage.objects.name)) [1]::uuid
        )
    )
  );
```

**BAD — the `candidate_*` parallel implementation** (`candidate_insert_public_assets`; 7 policies,
12 inline re-derivations). It hardcodes the entity type in a path segment and re-derives ownership with
a bare `auth_user_id = auth.uid()` `EXISTS`:

```sql
CREATE POLICY "candidate_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (storage.foldername (storage.objects.name)) [2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername (storage.objects.name)) [3]::uuid
        AND c.auth_user_id = (SELECT auth.uid ())
    )
  );
```

`authenticated_select_public_assets` is worse still — it carries a two-branch `UNION ALL` over
`candidates` and `organizations` for the same question. Under D-21 both collapse to
`user_can('entity', <id>, 'entity.edit_answers')` with the entity type taken from path segment `[2]`
as an **argument**, not a literal. The folder convention `{project}/{entity_table}/{entity_id}/…` is
already the parameterisation the note asks for — nothing new is needed to carry the type.

---

### `104-nominations.sql` → constraint, confirmation flip, FK ruling (162-12)

**Named-constraint precedent** (same `CREATE TABLE`, two lines below `parent_nomination_id`). Copy the
name-plus-rationale-comment form exactly; D-12c's constraint needs the same handle for `throws_ok`, and
its comment must additionally state that it **pins the PostgreSQL floor at 15**:

```sql
  -- Election rounds are numbered from one. Named explicitly rather than left to PostgreSQL's generated
  -- name: the name is cited by 156-DISPOSITIONS.md Record B and is the handle any throws_ok on this
  -- constraint has to match, so it belongs under source control. …
  CONSTRAINT nominations_election_round_check CHECK (election_round >= 1)
```

**The CHECK that makes `NULLS NOT DISTINCT` load-bearing** (three of four entity FKs are NULL on every
row, always):

```sql
  CHECK (num_nonnulls (candidate_id, organization_id, faction_id, alliance_id) = 1),
```

**The two columns 162-12 changes**, verbatim from the same body:

```sql
  parent_nomination_id uuid REFERENCES public.nominations (id) ON DELETE CASCADE,
  unconfirmed boolean DEFAULT false,
```

D-12d rules on the `CASCADE`; D-11c flips the boolean. Note `custom_data jsonb` is already declared
above them — D-12a's free-text branch needs no new column and no new policy.

---

### `011-validation-functions.sql` → the faction↔organization tightening (162-12)

**Analog:** `validate_nomination()` in the same file. Two patterns to copy.

**The `SELECT … INTO` D-13 extends by one column** — it already reads the parent row, so the tightening
adds a column to a query that already runs, not a round trip:

```sql
  SELECT
    CASE
      WHEN p.candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
      ...
    END,
    p.election_id,
    p.constituency_id,
    p.election_round
  INTO p_parent_type, p_parent_election_id, p_parent_constituency_id, p_parent_election_round
  FROM public.nominations p
  WHERE p.id = NEW.parent_nomination_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent nomination % not found', NEW.parent_nomination_id;
  END IF;
```

**The named-exception discipline D-23 requires** — every violation names the rule and interpolates the
offending value:

```sql
    WHEN 'faction' THEN
      IF p_parent_type != 'organization' THEN
        RAISE EXCEPTION 'Faction nomination parent must be an organization nomination, got %', p_parent_type;
      END IF;
...
  IF NEW.election_id != p_parent_election_id THEN
    RAISE EXCEPTION 'Nomination election_id must match parent (expected %, got %)',
      p_parent_election_id, NEW.election_id;
  END IF;
```

D-23's obligation is concrete against this: the new *the*-organization check must interpolate **both**
organization ids, or in a seed log it is indistinguishable from the `got %` line directly above it.

---

### `000-enums.sql` → the three new enums (162-03)

**Analog:** the two enums this phase deletes, in the same file. The house form is a bare
`CREATE TYPE public.<name> AS ENUM(...)`, one member per line for a multi-member enum, single line for a
short one, with the file header's one-line inventory comment updated:

```sql
CREATE TYPE public.user_role_type AS ENUM(
  'candidate',
  'organization',
  'project_admin',
  'account_admin',
  'super_admin'
);

CREATE TYPE public.role_scope_type AS ENUM(
  'candidate', 'organization', 'project', 'account', 'global'
);

CREATE TYPE public.category_type AS ENUM('info', 'opinion', 'default');
```

`entity_type` (`candidate` / `organization` / `faction` / `alliance`) in the same file is the exact
domain of D-05's `grant_scope_type` discriminator — **reuse it as `target_type`'s type** rather than
declaring a fifth parallel entity vocabulary.

---

### `300-auth-tables.sql` → the `grants` table (162-03) and the `published` deletion (162-16)

**Analog:** `user_roles` — the table `grants` replaces, in the file `grants` lands in. Copy the whole
five-part block: table + composite UNIQUE + user index + the RLS quartet + the blanket REVOKE.

```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  scope_type role_scope_type NOT NULL,
  scope_id uuid, -- NULL for super_admin (global scope)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, scope_type, scope_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin;

CREATE POLICY "auth_admin_read_user_roles" ON public.user_roles FOR
SELECT TO supabase_auth_admin USING (true);

CREATE POLICY "service_role_manage_user_roles" ON public.user_roles FOR ALL TO service_role USING (true)
WITH CHECK (true);

-- Prevent regular users from accessing user_roles directly
REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon, public;
```

⚠ **The `supabase_auth_admin` read policy + the blanket REVOKE are load-bearing, not boilerplate** —
the file's own comment says they exist to "prevent circular RLS with the auth hook". `grants` must carry
both, or the access-token hook deadlocks against its own table. D-05's
`CHECK (target_type IS NOT NULL) = (scope = 'entity')` goes in the `CREATE TABLE` body as a **named**
constraint, per the `104-nominations.sql` precedent.

**The 10 `ADD COLUMN` sites 162-16 deletes** are immediately below, and carry the comment D-14a cites:

```sql
-- Published columns on voter-facing tables (Using ALTER TABLE since the base tables are defined in earlier schema files)
ALTER TABLE public.elections
ADD COLUMN published boolean NOT NULL DEFAULT false;
```

162-02b leaves these ten alone (§ 11.4) and adds the one-line "scheduled for deletion by 162-16" note.

---

### `102-entities.sql` → `confirmed` ×4 and `factions.organization_id` (162-07, 162-07b)

**Analog:** `CREATE TABLE public.factions` in the same file — the plainest of the four entity tables and
the one D-13 changes. Note it has **no** `organization_id` (fact 37), and none of the four has any
confirmation column (fact 28):

```sql
CREATE TABLE public.factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name jsonb,
  ...
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();
```

`project_id uuid NOT NULL REFERENCES … ON DELETE CASCADE` on the line above is the **exact** analog for
D-13's new column, including the cascade choice the brief § 11.8 justifies by pointing at it.

`candidates.organization_id uuid REFERENCES public.organizations (id)` in the same file is the column
162-07b removes; sweep its consumers per fact 38.

---

### `303-column-grants.sql` → the `GRANT INSERT (…)` for `nominations` (162-12)

**Analog is partial and the planner must know it.** The file's pattern is a global
REVOKE-then-GRANT on **UPDATE** only, for **two** tables, and it mentions `nominations` zero times
(fact 34):

```sql
-- Approach: REVOKE table-level UPDATE, then GRANT UPDATE only on allowed columns.
-- (Column-level REVOKE is ineffective when table-level UPDATE exists.)
REVOKE
UPDATE ON public.candidates
FROM
  authenticated;

GRANT
UPDATE (
  short_name, info, color, image, subtype, custom_data,
  first_name, last_name, answers, terms_of_use_accepted
) ON public.candidates TO authenticated;
```

Copy: the two-block comment header (protected columns enumerated with *why*, then allowed columns), the
REVOKE-before-GRANT ordering, and the parenthesised column list. **The verb is the new part** — see
§ No Analog Found. Also note the header comment's "Approach" line is the reason the ordering matters;
an INSERT grant needs the identical reasoning restated for INSERT.

D-11a's finding lives here too: this file is a *single global* pair against `authenticated`, so it
**cannot** express "frozen only once `confirmed`" — 162-13 is a trigger reading `OLD.confirmed`, and this
file is reduced to the coarse outer bound it can express.

---

### `scripts/assert-schema-migration-parity.mjs` → the `cmp` collapse (162-02b)

**Analog: the script's own docblock, which specifies the change.** Two passages are the plan's warrant:

```
 * WHY A SIGNATURE AND NOT A `cmp`. The two copies are not byte-equal today and
 * cannot be while `00002`/`00003` exist as separate files. Folding them into
 * `00001` would collapse this check to a one-line `cmp`, but that deletes
 * migration files — the most history-destructive act available — so the
 * non-destructive form is used instead.
```

```
 *   2. It reads ONLY `00001`. `00002` and `00003` are never opened. … This is
 *      the LARGER of the two blind spots.
```

Also copy forward, because they are house standard and survive the collapse: **the invariant stated in
prose at the top**, the **CENSUS printed on every run** ("a comparison gate that parses neither input
correctly reports agreement, exits 0, and examines nothing"), and the explicit "WHAT THIS CHECK CANNOT
DO" section. The `--update` re-baseline flag and
`apps/supabase/scripts/schema-migration-parity.expected.txt` both go away with the signature; D-17's
replacement obligation ("the regenerated `00001` reviewed as a diff in the same commit") must be written
into the new docblock, since nothing else will carry it.

---

### `apps/supabase/scripts/lint-schema.mjs` → the structural non-collapse guard (162-17)

**Analog:** the two existing Splinter-derived checks in the same file. The pattern is: a
`const SQL_<NAME> = \`…\`` template-literal query against `DATABASE_URL`, a named check with an
ERROR/WARNING severity, and the documented exit contract:

```js
 * Checks implemented:
 *   - 0013 RLS disabled on public tables  (ERROR)
 *   - 0001 Unindexed foreign keys         (WARNING)
 *
 * Exit codes:
 *   0 - No errors (warnings may be present) 1 - At least one ERROR-level issue found (or WARNING in --strict mode)

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const RLS_EXCLUDE = ['schema_migrations', 'supabase_migrations'];
```

F2(a)'s guard is a third entry in that list, queried from `pg_policies` — it must run against the
**applied** database like its two siblings, which is why `yarn db:start` is its precondition.

---

### `apps/supabase/supabase/tests/database/` → the widened pgTAP estate (162-17)

**Analog:** `02-candidate-self-edit.test.sql`. Every test file follows one skeleton — copy it exactly:

```sql
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (15);

SELECT
  create_test_data ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_roles ('candidate_a')
  );

SELECT
  is (
    (SELECT count(*) FROM candidates WHERE id = test_id ('candidate_a'))::integer,
    1,
    'candidate_a can SELECT own record'
  );
```

Note the **explicit `plan(N)` count** (it must be updated as assertions are added), the
`-- Section N:` banner comments, and the three helpers from `00-helpers.test.sql`:
`set_test_user`, `test_user_id`, `test_user_roles`, `test_id`, `create_test_data`.
⚠ **`test_user_roles()` is a `user_roles`-shaped fixture helper** — 162-06 or 162-15 must re-shape it to
emit a `grants` claim, and every one of the 12 test files calls it. Existing per-concern file split
(`06-storage-rls`, `09-column-restrictions`, `08-triggers`, `10-schema-migrations`) is the split the new
matrix tests should extend rather than replace. For D-12c use `throws_ok` against the constraint **by
name**, and assert the accepting direction too.

---

### `packages/supabase-types/src/column-map.ts` → RES-7 (162-07b)

**Analog: the collision itself**, in the file 162-07b edits:

```ts
export const COLUMN_MAP = {
  ...
  // CandidateData
  first_name: 'firstName',
  last_name: 'lastName',
  organization_id: 'organizationId',      // ← candidates
  ...
  // NominationData
  organization_id_nom: 'organizationId',  // ← nominations, same target property
```

`PROPERTY_MAP` is a last-wins reversal, so `FIELD_MAP.organizationId` resolves to a column on no table.
Deleting the `// CandidateData` line is the whole fix; the `_nom` suffix hack on the nominations entry
can then also go, which is the second half of closing the todo.

---

### `apps/frontend/src/lib/auth/roles.ts` → the four claim readers (162-06)

**Analog: the file itself.** Three patterns to preserve verbatim while swapping `user_roles` → `grants`:

```ts
export function readUserRoles(accessToken: string): Array<RoleClaim> {
  const payload = decodeTokenPayload(accessToken);
  const claimed = payload?.user_roles;
  if (!Array.isArray(claimed)) return [];
  return claimed.filter(isRoleClaim);
}

export const ADMIN_ROLES = ['project_admin', 'account_admin', 'super_admin'] as const satisfies ReadonlyArray<UserRole>;

export type UserRole = Enums<'user_role_type'>;
```

1. **Fail closed, always** — every malformed shape yields `[]`, and `[]` fails every gate.
2. **`Enums<'…'>` from the generated types**, never a transcribed literal union — this is what makes the
   enum rename a compile error rather than a gate that silently stops matching. The new
   `grant_permission` / `grant_role_type` types must be consumed the same way.
3. **The boundary comment** — "THE DATABASE IS THE AUTHORITATIVE BOUNDARY, NOT THIS ARRAY" — restate it
   over the grants equivalent; it is what stops a reader treating the app-entry set as the permission
   model. Consumers to sweep: `requireAdminIdentity.ts`, `supabaseDataWriter.ts`,
   `adminJobsAuthorization.ts`, plus the four `*.test.ts` files beside them.

---

### The two Edge Functions (162-06 / D-20 / D-22)

**Analog for the grant write** — `invite-candidate/index.ts`, the block D-20 changes. The defect is in
the excerpt, not in a comment about it:

```ts
const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
  user_id: inviteData.user.id,
  role: 'candidate',
  scope_type: 'candidate',
  scope_id: candidate.id
});

if (roleError) {
  // Log but don't fail -- invite email already sent, user can still complete registration.
  console.error('Failed to create role assignment:', roleError.message);
}
```

**Analog for the hard abort D-20 requires** — `identity-callback/index.ts`, the *same* insert, ten files
away, already written correctly:

```ts
const { error: roleError } = await supabaseAdmin.from('user_roles').insert({ ... });

if (roleError) {
  throw new Error(`Failed to create role assignment: ${roleError.message}`);
}
```

So D-20's "stop swallowing the failure" is a **copy from the sibling function**, not a new decision.

**Analog for the JWT authorization check** both functions share — and the site where D-21's
generalisation bites, since `role === 'candidate'` and the three admin literals are hardcoded:

```ts
const payload = JSON.parse(decodeJwtSegment(token.split('.')[1]));
const userRoles: Array<{ role: string; scope_type: string; scope_id: string }> = payload.user_roles || [];

const isAdmin = userRoles.some(
  (r) => r.role === 'super_admin' || r.role === 'account_admin' ||
         (r.role === 'project_admin' && r.scope_type === 'project' && r.scope_id === projectId)
);
```

Note `decodeJwtSegment` (base64url, per REVIEW-EDGE-01) — reuse it; do not reintroduce `atob`.

---

### `162-NEGATIVE-CONTROL-LEDGER.md` (162-17)

**Analog:** `.planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md`
(157, 157.1, 157.2, 158 and 164 carry the same instrument; 144's is the fullest). Mandatory elements,
all present in 144's front matter:

- A **declared row count** asserted in the document's own § Completeness table, with the schema choice
  (half-row vs pair-per-row) stated explicitly.
- **OLD (blind) halves measured on the untouched tree**, before the behaviour-changing commit exists.
  *"The word for a borrowed observation — the past participle of 'to cite' — is not a legal value in any
  cell of this register."*
- **A row whose run did not execute keeps its placeholder cells and carries no outcome** — a
  measurement that did not run is a failure, not a pass.
- **Per-row HEAD and log path** (OLD and NEW rows legitimately carry different HEADs), plus a resolved
  `$TMPDIR` — *"a log path that cannot be resolved later is not evidence."*
- **Restoration blob hashes** (`git hash-object`) for every file the phase edits, taken at ledger
  creation.
- A **"Decisions discharged by this ledger"** list naming the D-numbers.

For 162 the instruments are `psql`/pgTAP, the two gate scripts, `yarn db:reset`, and the E2E suite —
so the ledger's machine section records exit codes, not visual baselines.

---

## Shared Patterns

### Deny-by-default security predicate
**Source:** `apps/supabase/supabase/schema/301-auth-functions.sql`
**Apply to:** `user_can`, `is_child_nominee`, every shim, and the frontend claim readers.
```sql
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
...
  IF <claim> IS NULL THEN RETURN false; END IF;
...
  RETURN false;   -- falls off the end denying
```
`SECURITY DEFINER` + empty `search_path` is non-negotiable (search_path attack); `STABLE` is what lets
the planner cache it per statement.

### Optimizer-cached auth reads inside policies
**Source:** `302-rls.sql` header and all 80 policies; `400-storage.sql:79` restates it.
**Apply to:** every policy 162-08…162-14 writes.
```sql
(SELECT auth.uid ())   -- never a bare auth.uid()
(SELECT auth.jwt ())
(SELECT user_can (...))
```

### Named constraints under source control
**Source:** `104-nominations.sql`, `nominations_election_round_check`
**Apply to:** D-12c's uniqueness key, D-05's `grants` scope CHECK, and any CHECK a pgTAP `throws_ok`
targets. Name it, and put the *reason it is named* in the comment beside it.

### Declared, not ALTERed
**Source:** the 25 `ALTER TABLE … ADD COLUMN` sites (fact 31) — the anti-pattern.
**Apply to:** every new column in 162-03, 162-07, 162-07b. The rule (§ 11.4): the column declaration goes
in the `CREATE TABLE` body; the concern file keeps its indexes, triggers, grants and a header comment
that now says *which tables carry* the column.

### Regenerate-and-review
**Source:** `CLAUDE.md` § Backend; D-17, D-18.
**Apply to:** every wave that touches `schema/`. `00001_initial_schema.sql` regenerated and reviewed as
a diff **in the same commit**; `yarn db:types` regenerates `packages/supabase-types/`;
`yarn db:lint:sql` runs against the applied database (needs `yarn db:start` first).

### pgTAP fixture helpers
**Source:** `apps/supabase/supabase/tests/database/00-helpers.test.sql`
**Apply to:** all 12 existing test files and every new one. ⚠ `test_user_roles()` is `user_roles`-shaped
and is a **phase-wide blast-radius item**, not a 162-17-local one.

---

## No Analog Found

Three constructs are genuinely new to this tree. The planner must budget for writing them from the
PostgreSQL manual, not from a neighbour, and must not let a reviewer assume house precedent exists.

| Construct | Plan | Role | Data flow | Evidence of absence |
|---|---|---|---|---|
| **`GRANT INSERT (<column list>)`** | 162-12 | column grant | DDL grant | `grep -rn "GRANT INSERT" apps/supabase/supabase/schema/` → **0 hits**. `303-column-grants.sql` is REVOKE/GRANT **UPDATE** only, on two tables, and names `nominations` zero times (fact 34). The UPDATE pair is a *shape* analog for the syntax; the INSERT semantics (a column absent from the list takes its DEFAULT rather than erroring) have no in-tree precedent and no in-tree test. This is what makes "created unconfirmed" enforceable — fact 34 calls it the amendment's sharpest edge. |
| **`UNIQUE NULLS NOT DISTINCT`** | 162-12 | table constraint | DDL | `grep -rn "NULLS NOT DISTINCT" apps packages scripts` → **0 hits repo-wide**. The only UNIQUE on `nominations` anywhere is `idx_nominations_external_id` (`500-external-id.sql`), which is a plain unique index. Nothing in the tree demonstrates the semantics, so nothing will catch a reviewer reading a plain `UNIQUE` as equivalent — and on this table a plain `UNIQUE` enforces **nothing** (every row has three NULL entity FKs). Also the first construct pinning the PG floor at 15 (`config.toml:39`). |
| **An entity-user INSERT policy on `nominations`** | 162-12 | RLS policy | CRUD authz | Fact 19: `admin_insert_nominations` / `admin_update_nominations` / `admin_delete_nominations` all gate on `can_access_project`; no non-admin write policy exists on this table at all. The closest partial analog is the candidate self-**UPDATE** family on `candidates` — but that is same-row ownership, whereas `nomination.create_parent` inserts a row belonging to *another* entity under five conjunctive guards. No policy in the tree has that shape. |

**Two more, weaker but worth flagging:**

- ~~**A trigger that reads `OLD.<flag>` to gate column immutability** (162-13).~~ **WRONG — CORRECTED
  2026-09-16 by 162-13's analog search, verified against the tree.** This entry claimed
  `validate_nomination()` was the closest analog and that "the OLD/NEW comparison pattern must be
  written fresh". It does not have to be. **`public.enforce_external_id_immutability()` in
  `apps/supabase/supabase/schema/500-external-id.sql` is an OLD-conditional immutability trigger** — its
  body is `IF OLD.external_id IS NOT NULL AND OLD.external_id IS DISTINCT FROM NEW.external_id THEN
  RAISE EXCEPTION …` — and it is registered `BEFORE UPDATE … FOR EACH ROW` on the entity tables from a
  single function body, which is precisely 162-13's shape (one rule, four tables, gated on the OLD
  value). 162-13 copies it rather than writing from the PostgreSQL manual. It also supplies the house
  error-message idiom (the offending and attempted values interpolated), which D-23's discipline wants
  and which a from-scratch trigger would have had to invent.
- **A `RETURNS TABLE` shape change** (162-07b). Phase 164's guard
  (`scripts/assert-rpc-return-nullability.mjs`) exists to *notice* this, but the tree contains no prior
  example of a column being **removed** from one of the three audited RPCs. Measurement 3 in CONTEXT
  § ⚠ Three measurements belongs to this plan's first task.

---

## Metadata

**Analog search scope:** `apps/supabase/supabase/schema/`, `apps/supabase/supabase/tests/database/`,
`apps/supabase/supabase/functions/`, `apps/supabase/scripts/`, `scripts/`,
`packages/supabase-types/src/`, `packages/dev-seed/src/`, `apps/frontend/src/lib/auth/`,
`apps/frontend/src/lib/api/adapters/supabase/`, `.planning/phases/*/`
**Files read:** 16 · **Files grepped:** ~120
**Tracked-source gate:** every analog path verified via `git ls-files`; no gitignored mirror paths emitted.
**Pattern extraction date:** 2026-09-15
