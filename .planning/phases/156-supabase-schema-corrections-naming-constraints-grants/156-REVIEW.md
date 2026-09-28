---
phase: 156-supabase-schema-corrections-naming-constraints-grants
reviewed: 2026-08-30T11:25:00Z
depth: standard
diff_base: 0dce31a1bb2762caef072b8c1b5624563be3b5d8
files_reviewed: 57
findings:
  critical: 0
  warning: 10
  info: 8
  total: 18
status: issues
---

# Phase 156: Code Review Report

**Reviewed:** 2026-08-30
**Depth:** standard (per-file, plus targeted cross-file tracing on the auth/grant surfaces)
**Files reviewed:** 57 of the 57 in scope
**Status:** issues

## Summary

The phase does what it says: the enum/label renames are complete and consistent across SQL,
generated types, adapters, seed data and pgTAP; the parity guard is real and I ran it green
(`24 schema file(s) -> 3345 lines; 00001 -> 3337 lines; 4 hunks, 11 signature lines; matches`);
`yarn workspace @openvaa/dev-seed test:unit` is 603/603 and `@openvaa/frontend test:unit` is
816/816. The revoke in `303-column-grants.sql` neither over- nor under-reaches: the allowlist
approach means every column not named is protected, the surviving counts (10 on candidates,
8 on organizations) match the schema, and the one production write path that touches these
tables (`_updateEntityProperties`) only writes `terms_of_use_accepted` and `image`, both still
granted.

**No Critical-tier defect was found.** I looked specifically for the ones the brief named and
can state the negative results: `user_roles` has `REVOKE ALL ... FROM authenticated, anon, public`
(`300-auth-tables.sql:41`), so the enum retype opens no self-grant path; `upsert_answers` is
`SECURITY INVOKER` and both branches are gated by their own table's RLS, and an
organization-id call cannot reach a candidate row (or vice versa) except through an id
collision, which is W4 below; the `is_image`/`validate_image` extraction is semantics-preserving
because `validate_answer_value` early-returns on `p_answer_value IS NULL` (`:163-165`) before
the `image` arm can ever hand a SQL NULL to the new guard.

What the phase did *not* get right is mostly its own evidence. The headline finding is W1: an
assertion added to prove the criterion-7 revoke is safe cannot observe the thing it asserts, and
I proved that against the running database rather than reasoning about it. Around that sit a
cluster of stale mirrors — the workspace README still tells readers the parity gate does not
exist, the repo's own backend skill docs still teach the retired `party` vocabulary, and one
pgTAP header still lists the columns criterion 7 revoked as allowed.

---

## Warnings

### WR-01: The `updated_at` trigger assertion is vacuous — proven against the live database

**File:** `apps/supabase/supabase/tests/database/09-column-restrictions.test.sql:277-301`

**Issue.** Section 6 exists to prove that revoking `UPDATE(updated_at)` from `authenticated` does
not break the `set_updated_at` trigger. Its method, stated in its own comment at `:279`, is:

> "now() is frozen for the whole transaction, so the fixture row's updated_at already equals what
> the trigger would write. Backdating it as postgres first is what makes the trigger's write
> observable rather than a coincidence."

The backdating step is `:280`:

```sql
UPDATE candidates SET updated_at = 'epoch'::timestamptz WHERE id = test_id('candidate_a');
```

That statement fires the very trigger it is trying to make observable.
`public.update_updated_at()` (`schema/010-utility-functions.sql:9-15`) is
`NEW.updated_at = now()` with no `WHEN` clause, so the backdate never lands — the row's
`updated_at` is `now()` immediately after `:280`, not `'epoch'`. The assertion at `:298-301`
therefore compares `now() > 'epoch'`, which is true regardless of anything the test does.

**Measured, not inferred.** Against the running local stack:

```
-- after `UPDATE candidates SET updated_at = 'epoch'::timestamptz`
after backdate attempt | 2026-08-30 11:18:15.882271+00     <- not 'epoch'
```

and with the candidate's permitted-column UPDATE **deliberately omitted**, the assertion's
predicate still evaluates:

```
assertion_still_true_without_the_candidate_update
-------------------------------------------------
 t
```

The assertion passes with the thing it claims to test removed entirely.

**Why it matters.** The production behaviour is in fact correct — column privileges are checked
against the statement's target list, not against trigger assignments, and the `lives_ok` at
`:288-294` does soundly prove the self-edit still works. What is broken is the *proof* of the
second half. Criterion 7's safety argument rests on an assertion that would stay green if the
trigger were dropped, which is exactly the "green suite read as behavioural coverage" failure
Record A warns about elsewhere in this phase.

**Fix.** Make the pre-state observable in a way the trigger cannot overwrite. Either disable the
trigger around the backdate:

```sql
SELECT reset_role();
ALTER TABLE candidates DISABLE TRIGGER set_updated_at;
UPDATE candidates SET updated_at = 'epoch'::timestamptz WHERE id = test_id('candidate_a');
ALTER TABLE candidates ENABLE TRIGGER set_updated_at;
```

or capture the value into a temp table before the candidate's UPDATE and assert strict
advancement against the captured value using `clock_timestamp()`-based writes. Either way the
assertion must fail if the candidate's UPDATE statement is deleted; that is the property to
check when re-fixing it.

---

### WR-02: The workspace README still says the parity gate does not exist

**File:** `apps/supabase/README.md:23-27`

**Issue.** The README reads, in bold: **"Nothing verifies that they agree."** That sentence is
now false — plan 01 shipped `scripts/assert-schema-migration-parity.mjs` and wired it as the
twelfth link of `yarn lint:check` specifically to verify it. The script's own header quotes this
exact sentence as "the incident this file exists for"
(`scripts/assert-schema-migration-parity.mjs:6-8`). The README *was* edited in this phase (two
new sections, +104 lines) and this line was left standing.

**Why it matters.** This is the one document a backend contributor is told to read before editing
either SQL directory. It currently instructs them that drift is caught by discipline alone, which
is the condition under which nobody runs or trusts the new gate — and the gate is not mentioned
anywhere in the workspace README, so there is no other way to discover it from here.

**Fix.** Replace the paragraph with the current state and name the command:

```markdown
**A gate verifies that they agree.** `yarn assert:schema-migration-parity` (link 12 of
`yarn lint:check`) compares `cat schema/*.sql` against `migrations/00001_initial_schema.sql`
and fails on any difference outside the reviewed signature in
`apps/supabase/scripts/schema-migration-parity.expected.txt`. It catches one-sidedness between
those two files. It does **not** read `00002`/`00003` — see the script header for the limits.
When you change the schema, still write the migration **and** the `schema/` mirror in the same
commit.
```

---

### WR-03: No assertion that the retired `has_role(text, text, uuid)` signature is absent

**File:** `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql:714-719`

**Issue.** Assertion 78 proves `has_role(user_role_type, role_scope_type, uuid)` exists. Nothing
proves the pre-rewrite `has_role(text, text, uuid)` does not. Contrast `:646-650`, where the same
file *does* use `hasnt_function` to prove `merge_custom_data` left no stale catalogue entry, with
a comment explaining precisely why source-tree greps cannot see such a survivor.

**Why it matters.** `CREATE OR REPLACE FUNCTION` with changed parameter types creates an
**overload**, it does not replace. Every call site in `302-rls.sql` passes bare string literals
(`has_role('organization', 'organization', id)` at `:223`, `:235`, `:239`, `:266`). An `unknown`
literal resolves to `text` in preference to a user-defined enum, so if a `text` overload ever
coexists — a hand-applied migration, a partially-replayed database, a future revert — every RLS
predicate silently binds to the string-comparing version and criterion 2 is undone with no test
turning red. The asymmetry is not defensible given the file itself establishes the stricter
standard six sections earlier.

**Fix.** Add next to assertion 78:

```sql
SELECT hasnt_function(
  'public', 'has_role', ARRAY['text', 'text', 'uuid'],
  'no text-typed has_role overload survives (an unknown literal binds to text in preference to a user-defined enum, so a surviving overload would silently reinstate string comparison at every RLS call site)'
);
```

---

### WR-04: `upsert_answers`'s fall-through safety is asserted in a comment, not enforced

**File:** `apps/supabase/supabase/schema/503-entity-rpcs.sql:139`, `:164-176`, `:186-197`

**Issue.** The doc comment states as fact: *"the two id spaces are distinct, candidates are tried
first, and the organizations attempt runs only when the candidate update matched no row, so one
call never writes both tables."* The first clause is a convention, not a constraint. Nothing in
the schema makes `public.candidates.id` and `public.organizations.id` disjoint, and `id` is a
writable, importable column — it is in the dev-seed allowlist at
`packages/dev-seed/src/template/permittedKeys.ts:218`, and `bulk_import` builds its INSERT
column list from the JSON keys it is handed. A hand-authored template or an external import that
reuses one UUID across the two tables makes the *first* branch match, so an intended
organization answer write lands on the candidate row and the caller gets a success return.

I want to be precise about likelihood: with `gen_random_uuid()` defaults this cannot happen by
accident, and I found no template today that supplies a colliding id. The defect is that the
function documents an invariant it does not check while writing two tables under
`SECURITY INVOKER`.

**Second, separable gap.** The new organization branch has no negative RLS assertion. Assertion
37 (`:328-336`) proves candidate_a cannot call `upsert_answers` for candidate_b. There is no
mirror proving `organization_a` cannot write `org_b`'s answers — and the organization branch is
the newly-reachable authorization surface. `10-schema-migrations.test.sql:404-470` covers only
the positive path, the merge no-op, the unregressed candidate path, and the neither-table case.

**Fix.** Cheapest durable form is to make the branch explicit rather than positional — take the
entity table from the caller and reject anything else:

```sql
CREATE OR REPLACE FUNCTION public.upsert_answers(
    p_entity_id uuid,
    p_answers jsonb,
    p_overwrite boolean DEFAULT false,
    p_entity_type public.entity_type DEFAULT NULL   -- NULL keeps the current try-candidates-first behaviour
)
```

If the positional form is kept for source compatibility, at minimum add the missing negative
assertion:

```sql
SELECT set_test_user('authenticated', test_user_id('organization_a'), test_user_roles('organization_a'));
SELECT throws_ok(
  format($$SELECT upsert_answers('%s', '{}'::jsonb, false)$$, test_id('org_b')),
  'P0001', NULL,
  'organization_a cannot call upsert_answers for org_b (the widened branch is RLS-gated, not merely id-gated)'
);
```

---

### WR-05: The widened organization branch is unreachable from the application

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:258`

**Issue.**

```ts
if (type !== ENTITY_TYPE.Candidate) throw new Error(`Unsupported entity type for setting answers: ${type}`);
```

`_setAnswers` is the only production caller of `upsert_answers`, and it hard-rejects every entity
type but `Candidate` before the RPC is reached. So the organization branch added by plan 08 has
no consumer.

**Why it matters.** `156-DISPOSITIONS.md` Entry 6 justifies the asymmetry between renaming
`merge_custom_data` and *promoting* `upsert_answers` with: *"`upsert_answers` generalises because
a second real consumer exists — organizations answer questions in this product."* Measured
against the tree, that consumer does not exist in code. The decision may still be right on
product grounds, but the recorded rationale asserts a fact the codebase contradicts, and the
new SQL is dead outside pgTAP — the exact "ships with zero consumers" cost the same entry uses to
argue *against* generalising `merge_custom_data`.

**Fix.** Either lift the guard so the branch is reachable —

```ts
if (type !== ENTITY_TYPE.Candidate && type !== ENTITY_TYPE.Organization)
  throw new Error(`Unsupported entity type for setting answers: ${type}`);
```

— or amend Entry 6 to say the consumer is *planned* rather than existing, and name the phase that
adds it. Do not leave the record claiming a consumer that is not there.

---

### WR-06: The repo's own backend reference still teaches the retired vocabulary

**Files:** `.claude/skills/database/SKILL.md:130`, `:168`;
`.claude/skills/database/rls-policy-map.md:10`, `:44`, `:84`, `:90-91`, `:171`, `:175`;
`.claude/skills/database/schema-reference.md:190`, `:82`

**Issue.** After this phase, the skill documentation still states:

- `SKILL.md:130` — "`party`: scope_type='party', scope_id=organization UUID"
- `SKILL.md:168`, `rls-policy-map.md:44`, `:84`, `:90-91` — `has_role('party', 'party', id)` and
  the policy name `party_update_own_organizations`
- `schema-reference.md:190` — "scope_type: text NOT NULL (values: 'candidate', 'party', ...)"
- `schema-reference.md:82` — `candidates ... name: jsonb`
- `rls-policy-map.md:171` and `:175` — the pre-criterion-7 grant lists, still naming
  `sort_order, created_at, updated_at` (and `name` on candidates) as self-editable

**Why it matters.** CLAUDE.md routes backend work through this skill; it is the primary in-repo
description of the auth model. Every one of those lines is now wrong, and three of them are wrong
in a security-relevant direction (a reader concludes `sort_order`/`created_at`/`updated_at` are
self-editable, and that `scope_type` is unconstrained text). The checklist item "the repo
documentation markdown files are updated if the changes touch upon those" is not met. The
failure mode is loud rather than silent for the enum — a new policy written as
`has_role('party','party',id)` fails at migration parse time with `22P02` — but the grant-list
and column-list errors fail silently in review.

**Fix.** Sweep the three files: `party` → `organization` in the role and scope vocabularies,
`scope_type: role_scope_type NOT NULL` with the five labels, policy name
`organization_update_own_organizations`, drop `name` from the candidates column list, and
restate both grant lists as
`short_name, info, color, image, subtype, custom_data, first_name, last_name, answers, terms_of_use_accepted`
(candidates, 10) and `name, short_name, info, color, image, subtype, custom_data, answers`
(organizations, 8), moving `sort_order`, `created_at`, `updated_at` into the protected lists.

---

### WR-07: A pgTAP header still lists the revoked columns as allowed

**File:** `apps/supabase/supabase/tests/database/05-organization-admin.test.sql:55`

**Issue.**

```sql
-- Column-level GRANT on organizations allows: name, short_name, info, color, image, sort_order, subtype, custom_data, answers, created_at, updated_at
```

Criterion 7 revoked `sort_order`, `created_at` and `updated_at` from `organizations`
(`303-column-grants.sql:36-39`). This comment survived because plan 03 renamed the file and plan
07 changed the grants, and neither pass looked at the other's text.

**Why it matters.** It is a comment mirror of a privilege list, sitting directly above the
assertions that exercise those privileges, and it now contradicts `09-column-restrictions.test.sql:5`
in the same suite. A reader adding a case here will trust the nearer comment.

**Fix.**

```sql
-- Column-level GRANT on organizations allows: name, short_name, info, color, image, subtype, custom_data, answers
-- (sort_order, created_at and updated_at were revoked in phase 156 criterion 7 — see 303-column-grants.sql)
```

---

### WR-08: The `Depends on:` renumbering sweep stopped at the files criterion 1 opened

**Files:** `apps/supabase/supabase/schema/400-storage.sql:3-4`,
`500-external-id.sql:7-8`, `501-bulk-operations.sql:9-10`, `502-email-helpers.sql:3-4`

**Issue.** Criterion 1 corrected stale schema-file references in `300-auth-tables.sql:3-4`,
`301-auth-functions.sql:3-4` and `303-column-grants.sql:8-9` (e.g. `001-tenancy.sql` →
`100-tenancy.sql`). Four other files still cite the retired numbering that no longer exists in
`schema/`:

| File | Line | Cites |
|---|---|---|
| `400-storage.sql` | 3-4 | `012-auth-hooks.sql`, `011-auth-tables.sql`, `003-entities.sql`, `002-elections.sql`, `004-questions.sql`, `005-nominations.sql` |
| `500-external-id.sql` | 7-8 | `002-elections.sql`, `003-entities.sql`, `004-questions.sql`, `005-nominations.sql`, `007-app-settings.sql` |
| `501-bulk-operations.sql` | 9-10 | `015-external-id.sql`, `010-rls.sql` |
| `502-email-helpers.sql` | 3-4 | `003-entities.sql`, `005-nominations.sql`, `002-elections.sql`, `011-auth-tables.sql`, `000-functions.sql` |

`501` and `502` were **both edited by this phase** (the `party` → `organization` rename), so the
stale headers were touched-past rather than merely missed — `502-email-helpers.sql:3-4` is three
lines above nothing and the edit is at `:62`.

**Why it matters.** Nine of the eleven cited filenames do not exist. The README (`:29-38`)
presents the `Depends on:` headers as part of how the two SQL copies are kept in step; a header
pointing at a deleted filename is worse than no header, and criterion 1 is "naming corrections"
— it is the criterion that owns exactly this.

**Fix.** Map each to its current name (`002-elections.sql` → `101-elections.sql`,
`003-entities.sql` → `102-entities.sql`, `004-questions.sql` → `103-questions.sql`,
`005-nominations.sql` → `104-nominations.sql`, `007-app-settings.sql` → `106-app-settings.sql`,
`010-rls.sql` → `302-rls.sql`, `011-auth-tables.sql` → `300-auth-tables.sql`,
`012-auth-hooks.sql` → `301-auth-functions.sql`, `015-external-id.sql` → `500-external-id.sql`,
`000-functions.sql` → `010-utility-functions.sql`) and apply the same edit to the `00001` twin so
the parity guard stays green.

---

### WR-09: `is_image` swallows every error class, and has no production caller

**File:** `apps/supabase/supabase/schema/011-validation-functions.sql:77-88`

**Issue.**

```sql
CREATE OR REPLACE FUNCTION public.is_image(p_val JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  PERFORM public.validate_image(p_val);
  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RETURN FALSE;
END; $$;
```

`WHEN others` catches far more than a shape violation — `insufficient_privilege` if EXECUTE on
`validate_image` is ever narrowed, `undefined_function` if it is dropped or renamed,
stack-depth and out-of-memory conditions, and any future bug inside `validate_image`. All of
them are reported to the caller as the single word "this is not an image". The one thing the
function is for — distinguishing a bad value from a broken validator — is the thing it cannot do.

Separately, `grep -rn 'is_image' apps packages scripts tests` returns only its own definition,
the `00001` twin, and `08-triggers.test.sql`. It has no caller in the schema or the application:
it exists solely to be tested.

**Why it matters.** The narrower catch costs nothing and closes the "silently reports FALSE
because something unrelated is broken" hole. And the exported-but-unused predicate is new public
API surface (EXECUTE defaults to PUBLIC, so `anon` can call it) with no consumer — the same
"zero consumers" objection Entry 6 raises against generalising `merge_custom_data`, applied
here without comment.

**Fix.** Narrow the handler and record why the function exists without a caller:

```sql
EXCEPTION
  -- Only a shape violation raised by validate_image is a FALSE verdict. Anything else
  -- (a missing function, a privilege error, resource exhaustion) must propagate, or a
  -- broken validator reports every value as "not an image".
  WHEN raise_exception THEN
    RETURN FALSE;
```

and either give it a call site or add a one-line comment naming the intended consumer.

---

### WR-10: The parity guard's stated limits omit its largest blind spot

**File:** `scripts/assert-schema-migration-parity.mjs:42-44`, `:80-81`, `:244-250`

**Issue.** The header documents exactly one limitation: *"it cannot catch a change made
IDENTICALLY WRONG in both copies."* There is a second, larger one it does not state. The guard
reads `schema/*.sql` and `migrations/00001_initial_schema.sql` and nothing else (`:80-81`,
`:245-256`). `00002` and `00003` are never opened. So a change applied correctly to `schema/`
**and** `00001`, for an object that a later migration recreates, leaves the schema/00001 delta
unchanged — signature identical, guard green — while the applied database ends up with the later
migration's stale definition.

That is not hypothetical shape: `get_nominations` exists in **three** copies, and `00002:79-95`
recreates it. This very phase had to remember to edit all three (it did — `00002:82` carries the
`COALESCE(o.name, f.name, a.name)` change). The next person has only the header to tell them, and
the header says the check covers the two-copy rule.

**Secondary, smaller.** `:245-247` concatenates the schema files with `schemaText += readFileSync(...)`
and no separator. All 24 files currently end with a newline, so this is latent; a file added
without a trailing newline would glue its last line to the next file's first line and report a
spurious hunk. Fail-loud rather than fail-silent, but one character fixes it.

**Fix.** Extend the header's "WHAT THIS CHECK CANNOT DO" block:

```js
 * It also reads ONLY `00001`. `00002` and `00003` are never opened, so a change written
 * correctly into both `schema/` and `00001` for an object a LATER migration recreates —
 * `get_nominations` lives in all three — leaves this signature unchanged and this check
 * green while the applied database carries the later migration's stale definition. When you
 * touch an object named in a `00002`/`00003` header, grep all three copies by symbol.
```

and normalise the concatenation:

```js
for (const name of schemaNames) {
  const text = readFileSync(path.join(schemaDir, name), 'utf8');
  schemaText += text.endsWith('\n') ? text : `${text}\n`;
}
```

---

## Info

### IN-01: pgTAP assertion numbering renumbered only where the diff touched it
**File:** `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql:486`
`-- 42-53. Column existence checks` was left alone while `-- 41.` above it became `-- 45.` and
`-- 54.` below it became `-- 58.`. Renumber to `-- 46-57.`, or drop the numbers — they are
maintained by hand and have now drifted twice.

### IN-02: The cascade's behavioural assertion does not observe the cascade
**File:** `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql:723-733`
Assertion 84 is `lives_ok` on `DELETE FROM projects WHERE id = project_a`, described as
"deleting a project cascades to its app_settings row". It proves no FK violation is raised — which
is meaningful, since `create_test_data()` does insert `app_settings_a` for `project_a`
(`00-helpers.test.sql:373-375`), so this would have failed before the fix. It does not prove the
child row was removed. Add
`SELECT is((SELECT count(*)::integer FROM app_settings WHERE project_id = test_id('project_a')), 0, ...)`
after it, and bump `plan()`.

### IN-03: The new CHECK constraint is unnamed
**File:** `apps/supabase/supabase/schema/104-nominations.sql:51-53`
`CHECK (election_round >= 1)` relies on PostgreSQL's generated name
`nominations_election_round_check`, which `156-DISPOSITIONS.md` Record B cites as if it were
declared. Write it as
`CONSTRAINT nominations_election_round_check CHECK (election_round >= 1)` so the name the record
and any future `throws_ok(..., 'nominations_election_round_check')` depend on is under source
control.

### IN-04: The JWT retype is half-applied and asserts what it does not validate
**Files:** `apps/frontend/src/routes/candidate/login/+page.server.ts:37-38`,
`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:162-167`,
`apps/frontend/src/routes/admin/login/+page.server.ts:37`
Both retyped sites decode the JWT with `JSON.parse(atob(token.split('.')[1]))` and then *declare*
the result as `Array<{ role: Enums<'user_role_type'> }>`. The value is unvalidated attacker-shaped
JSON at the type boundary; the annotation is an assertion, not a check. (`atob` on base64url is
also pre-existing brittleness — `-`/`_` are not in the base64 alphabet — and neither call is
wrapped in `try`.) Meanwhile `admin/login/+page.server.ts:37` was left at `role: string`, so the
same claim is typed two different ways in two adjacent route guards. Neither is a live
vulnerability (the server re-checks against RLS on every query), but the retype should either
cover all three sites or none, and a `Constants.public.Enums.user_role_type.includes(...)` guard
would make the annotation earned.

### IN-05: The rename is half-applied inside dev-seed's own tests
**File:** `packages/dev-seed/tests/templates/default.test.ts:31-34`, `:51`, `:106`, `:134`;
`packages/dev-seed/tests/templates/nominations-override.test.ts:23`, `:37`, `:50`, `:56`
The imported symbols became `ORGANIZATION_WEIGHTS` / `ORGANIZATION_CONSTITUENCY_MATRIX`, but the
fixture helper is still `eightParties()`, its ids are still `seed_party_${i}`, and test titles
still read "party assignment", "one per party", "party counts". Harmless at runtime; it leaves
the retired term as the thing a grep for `party` finds first in the package the rename was for.

### IN-06: Component doc comments were renamed in the `.svelte` file but not its `.type.ts`
**Files:** `apps/frontend/src/lib/components/entityTag/EntityTag.type.ts:5` vs
`apps/frontend/src/lib/components/entityTag/EntityTag.svelte:6`
The `@component` block now reads "candidate or an organization"; the JSDoc on the prop it
documents still reads "candidate or a party". The wider `entityDetails`/`entityCard` prose
mentions of "party" are about political parties as a domain concept and are fine to leave; this
one is the paired half of a line that *was* changed.

### IN-07: The a11y assertion change is out of phase scope, and loosens the assertion slightly
**File:** `tests/tests/specs/a11y/a11y-smoke.spec.ts:265-281`
Converting the one-shot `page.evaluate` to `expect.poll` is the right web-first fix for the
rAF/`afterNavigate` race and the rationale comment is good. Two notes: it is a Playwright
flake fix landing in a Supabase-schema phase with no plan entry claiming it, and polling accepts a
*transient* focus on an `<h1>` that subsequently moves elsewhere, where the snapshot did not. If
settled focus is the property under test, follow the poll with a second immediate read.

### IN-08: `--update` blesses drift and is not reachable through a package script
**File:** `scripts/assert-schema-migration-parity.mjs:273-278`, `package.json:33`
`--update` rewrites the fixture unconditionally; the only defence is the printed "read the fixture
diff" line. That is the normal golden-file tradeoff and is acceptable, but the flag exists only as
a raw `node` invocation — `package.json` wires the check, not the re-baseline. Add
`"assert:schema-migration-parity:update": "node scripts/assert-schema-migration-parity.mjs --update"`
so the documented recovery path in the failure message is a script name rather than a path a
reader has to retype.

---

## Coverage — what I actually reviewed, and what I did not

**Read in full and traced:** all 24 files under `apps/supabase/supabase/schema/` that the diff
touched, plus `010-utility-functions.sql` and `102-entities.sql` for the trigger and column
inventories; `503-entity-rpcs.sql` and `504-admin-rpcs.sql` end to end; all six touched pgTAP
files; `scripts/assert-schema-migration-parity.mjs` line by line; the six touched frontend files
and the call chains around `_setAnswers` / `_updateEntityProperties` /
`_getCandidateUserData`; every touched dev-seed source and test file.

**Verified by execution, not by reading:**
- `node scripts/assert-schema-migration-parity.mjs` → exit 0, census as quoted above.
- `yarn workspace @openvaa/dev-seed test:unit` → 53 files / 603 tests passed.
- `yarn workspace @openvaa/frontend test:unit` → 54 files / 816 tests passed.
- WR-01's vacuity, against the running local Postgres (two queries, quoted in the finding).
- The ten `config.toml` port literals, counted against the file — the README table at `:113-124`
  is accurate.

**Reviewed shallowly, and why:**
- `packages/supabase-types/src/database.ts` — generated by `yarn db:types`. I read the diff for
  agreement with the SQL (enum labels, `scope_type` type, `has_role` arg types, the
  `merge_custom_data` → `merge_question_custom_data` move, the new `is_image`/`validate_image`
  entries, the dropped `candidates.name` in Row/Insert/Update) and confirmed all of it matches.
  I did not review the other ~1400 lines.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — 3337 lines. Reviewed via the
  parity guard (green) plus targeted greps confirming each of the eight criteria landed
  (`role_scope_type` at `:25`, `scope_type role_scope_type` at `:1127`, the enum casts at
  `:1254`/`:1293`/`:1300`, `CHECK (election_round >= 1)` at `:763`, `ON DELETE CASCADE` on
  `app_settings` at `:935`, both `REVOKE UPDATE` at `:1816`/`:1832`,
  `merge_question_custom_data` at `:3246`/`:3270`, `is_image`/`validate_image` at `:155`/`:173`).
  Not read in full.
- `apps/supabase/README.md` benchmark section (`:41-100`) — the p95 figures cannot be re-derived,
  because the 36 result JSON files they summarise were deleted by this phase. I checked internal
  consistency only (the stated ratios follow from the stated numbers; the two archival SHAs are
  reachable). The numbers themselves are taken on trust.
- `apps/supabase/scripts/schema-migration-parity.expected.txt` — read in full (12 lines); the
  `# hunks: 4` header reconciles by hand against the 11 payload lines.

**Not reviewed:** the 62 deleted files under `apps/supabase/benchmarks/`, excluded by the brief
(pure deletion, archived at `714d1e1885b091af95b86d2b497b3e2bff76f031`). I did not run
`npx supabase test db` or the Playwright suite; the pgTAP findings above are from reading the SQL
and from the two direct psql probes, not from a suite run.

**Known items I did not re-report:** WINDOWS 17/115/125, 183, 184/186, 185, 187, 188, 190, and the
`00-helpers.test.sql` out-of-transaction helper definitions. WR-03 is adjacent to WINDOWS 183 but
is a different gap (a catalogue-shape assertion that is missing, not a behavioural one that is
blind). WR-05 and IN-04 touch WINDOWS 185's territory from the opposite direction — the frontend
now over-declares where Deno under-declares — and are new.

---

_Reviewed: 2026-08-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
