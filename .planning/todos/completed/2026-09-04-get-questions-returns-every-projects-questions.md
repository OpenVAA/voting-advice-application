---
created: '2026-09-04T00:00:00.000Z'
title: get_questions has no project term and returns every project's questions
area: database
priority: high
files:
  - apps/supabase/supabase/schema/505-question-rpcs.sql
  - apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - scripts/assert-project-scoped-queries.mjs
---

## Problem

**Measured, from the function body, on 2026-09-04.**

`public.get_questions(p_election_id uuid DEFAULT NULL, p_constituency_id uuid DEFAULT NULL, p_election_round integer DEFAULT NULL)`
selects from `public.question_categories` and `public.questions`. Both carry
`project_id uuid NOT NULL REFERENCES public.projects(id)`. Its `WHERE` clauses test **only**
`election_ids`, `constituency_ids` and `election_rounds`, each under an
`IS NULL OR jsonb_array_length(...) = 0 OR ... @> ...` predicate. There is no `project_id` term
anywhere in the function.

With all three parameters NULL — the shape the voter app sends before an election is chosen — it
returns every project's questions and categories. Row-level security does not close this: an `anon`
caller has no project identity for a policy to key on, and RLS returns empty results rather than
failing anyway.

This is the **same defect class** as the one `get_nominations` had before
`migrations/00005_get_nominations_project_scope.sql`, in the same adapter, one function over. The
adapter calls it at
`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:559`.

## Why it was not fixed at the same time

Closing it means a required `p_project_id` on a **second** granted, `anon`-executable signature: a
`DROP FUNCTION` of `get_questions(uuid, uuid, integer)`, a re-created four-argument form, a re-issued
grant, and a lockstep update of every caller. That is a second one-way schema decision. The operator
answered the equivalent question for `get_nominations` and for `get_nominations` only, so making the
same change to a different function unasked would be taking an architectural decision unilaterally.

It is recorded rather than done, in two places that a later reader cannot miss:

- `scripts/assert-project-scoped-queries.mjs` carries the disposition
  `get_questions: 'UNSCOPED: no project term in its body; returns every project's questions'`. Before
  this, it claimed `scoped-by-identity: election id + RLS`, which is false on both halves.
- The plan's decision record amends the claim that `get_questions` did not exist.

## What to do

Mirror `00005_get_nominations_project_scope.sql`:

1. `DROP FUNCTION IF EXISTS public.get_questions (uuid, uuid, integer);`
2. Re-create it with `p_project_id uuid` first and no `DEFAULT`, adding `AND qc.project_id = p_project_id`
   to the category subquery and `AND q.project_id = p_project_id` to the question subquery.
3. `GRANT EXECUTE ON FUNCTION public.get_questions (uuid, uuid, uuid, integer) TO anon, authenticated;`
4. Update `schema/505-question-rpcs.sql` to match, leave `00001_initial_schema.sql` alone, and
   re-baseline `apps/supabase/scripts/schema-migration-parity.expected.txt`.
5. Update the callers: the adapter's `get_questions` rpc call, and the `get_questions` call sites in
   `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` (all named-argument or
   no-argument today, so none is positionally sensitive).
6. Change the guard's disposition to `requires p_project_id` — check 4 then enforces the key at the
   call site, which is the point.
7. Add pgTAP cross-project cases beside the `get_nominations` ones in
   `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`, with the same positive controls.

## Verification when done

`node scripts/assert-project-scoped-queries.mjs` must report `get_questions` as
`requires p_project_id` and still exit 0, and the pgTAP suite must show a recorded red half when the
new project conjuncts are removed from the live definition.

## Closed — 161-02.1, 2026-09-04

Done as written, with three corrections to the recipe above, all measured before acting.

1. **The signature was re-derived from `pg_proc`, not trusted from the mirror.** It was
   `get_questions(p_election_id uuid, p_constituency_id uuid, p_election_round integer)` — the
   recipe was right this time, but 161-02's equivalent was stale by one parameter, so it was
   checked rather than assumed.
2. **Step 5 was wrong about positional callers.** It claims the `get_questions` call sites in
   `tests/database/11-question-rpcs.test.sql` are "all named-argument or no-argument today, so none
   is positionally sensitive". Every one of the 30 call sites in that file is POSITIONAL
   (`get_questions ()`, `get_questions (test_id ('election_a'))`, `get_questions (NULL, NULL, 2)`).
   All were rewritten to pass `test_id ('project_a')` first; every row that file reads belongs to
   project A, so no assertion changed meaning.
3. **`migrations/00006_get_questions_project_scope.sql`**, not a number reserved in advance — 00005
   was taken by the `get_nominations` change.

Delivered: required `p_project_id uuid` first, no DEFAULT; three-argument form dropped and the
four-argument form re-created and re-`GRANT`ed to `anon, authenticated`; `schema/505-question-rpcs.sql`
mirrored; `schema-migration-parity.expected.txt` re-baselined; the adapter passing
`p_project_id: this.projectId` on every call of its fan-out; generated types carrying
`p_project_id: string` (required, not optional); the guard disposition now `requires p_project_id`,
which leaves `PROJECT_SCOPED_RPCS` with no `UNSCOPED:` entry at all.

Verification, on a database carrying 377 seeded nominations rather than a pristine one: seven new
pgTAP assertions in `07-rpc-security.test.sql` §9 (suite 386 → 393, all green), and the guard proved
red/green — stripping both project conjuncts from the live definition failed assertions 19–22 while
the two positive controls stayed green, and restoring from the migration reproduced the definition
byte-identically (`md5 fac236ef4756d0fa98ecc41bd4f85e8b` before and after).
