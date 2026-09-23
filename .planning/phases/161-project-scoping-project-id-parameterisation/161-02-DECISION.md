# Phase 161 Plan 02 Task 1 — operator decision record

**Recorded:** 2026-09-04, before any file under `apps/supabase` was modified.

**Instrument, both directions.** The task's `<verify>` is
`git status --porcelain apps/supabase | wc -l | grep -qx '0'`. It returned `0` at the moment of
recording. The zero is not vacuous: appending a newline to `apps/supabase/package.json` made the same
pipeline return `1`; `git checkout -- apps/supabase/package.json` returned it to `0`. The instrument
reports a real modification under that path and reports none here.

---

## Answer 1 — `required-parameter`

`public.get_nominations` gains a **required** `p_project_id uuid` first parameter, delivered as an
additive migration that drops and re-creates the granted signature.

Operator's reasoning, verbatim:

> "This is the phase's central deliverable: criterion 2 says every project-scoped query is
> parameterised, and get_nominations is the largest unscoped read in the app. Making it REQUIRED
> rather than defaulting NULL is what makes a missing parameter a hard error instead of a silent
> cross-project read."

### The three constraints attached to the answer

1. **Re-derive the CURRENT parameter list before writing the migration.** Do not trust the plan's.
2. **Place `p_project_id` so it does not silently reorder existing positional callers.** Find every
   call site and confirm.
3. **Re-`GRANT` to `anon` after the re-create, and confirm a fresh `yarn db:reset` and an
   already-applied database converge.**

### Constraint 1, discharged — the plan's cited signature is stale

The plan's DR-6 cites the signature as
`get_nominations(p_election_id uuid DEFAULT NULL, p_constituency_id uuid DEFAULT NULL, p_include_unconfirmed boolean DEFAULT false)`
and anchors it at `apps/supabase/supabase/schema/503-entity-rpcs.sql lines 1-95`.

**Measured at HEAD**, `apps/supabase/supabase/schema/503-entity-rpcs.sql:8-11`:

```sql
CREATE OR REPLACE FUNCTION public.get_nominations (
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false,
  p_election_round integer DEFAULT NULL
)
```

with `GRANT EXECUTE ON FUNCTION public.get_nominations (uuid, uuid, boolean, integer)` at line 83.

`p_election_round` was added by `apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql`,
which phase 157 plan 03 landed **after** this plan was written. The plan's cited signature and its
`lines 1-95` anchor are therefore both stale, and the delivered signature is **five** arguments, not
four:

```
public.get_nominations(p_project_id uuid, p_election_id uuid DEFAULT NULL, p_constituency_id uuid DEFAULT NULL, p_include_unconfirmed boolean DEFAULT false, p_election_round integer DEFAULT NULL)
GRANT EXECUTE ON FUNCTION public.get_nominations (uuid, uuid, uuid, boolean, integer) TO anon, authenticated;
```

Every "four-argument" phrasing in the plan's DR-6, task 2, task 4 and must-haves reads as
**five-argument** from here on.

### Constraint 1, second correction — the migration filename

The plan names the new file `00004_get_nominations_project_scope.sql`. `00004` is **taken**, by the
phase-157 migration above. The delivered file is
`apps/supabase/supabase/migrations/00005_get_nominations_project_scope.sql`.

### Constraint 2, discharged — no positional caller exists

Every `get_nominations` caller measured at HEAD, and how it passes arguments:

| Caller | Shape | Positional? |
| --- | --- | --- |
| `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:330` | `rpc('get_nominations', { p_election_id, p_constituency_id, p_include_unconfirmed, p_election_round })` | No — PostgREST named keys |
| `packages/dev-seed/tests/integration/default-template.integration.test.ts:429` | `anonClient.rpc('get_nominations', {})` | No — empty named object |
| `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` (9 call sites) | `get_nominations ()` and `get_nominations (p_election_round => 1)` | No — no-argument or `=>` named notation |
| `scripts/fixtures/project-scoped-queries/clean.fixture.ts:44` | `rpc('get_nominations', { p_project_id })` | No — named, and already expects this change |

**Zero positional callers exist.** Placing `p_project_id` first therefore reorders nothing that any
caller depends on. The placement is not a preference: PostgreSQL forbids a parameter without a
default from following one that has a default, so a required `p_project_id` **must** come first.

Every one of the nine pgTAP call sites and the dev-seed integration call still has to gain the new
key, because the parameter is required. That is the intended hard failure, not a regression.

### Constraint 3 — recorded here, discharged in the plan SUMMARY

The re-issued `GRANT` and the fresh-versus-already-applied convergence are execution facts, measured
in task 2 and reported in `161-02-SUMMARY.md`.

### Reversibility, restated as delivered

One-way. The migration drops a granted, `anon`-executable signature. A database that has applied
`00005` cannot return to the previous signature without a further migration, and every caller must be
updated in lockstep.

---

## Answer 2 — correct DR-9 in place

Two of DR-9's four rows are wrong at HEAD. Both were verified independently before this record was
written.

### Correction A — the RPC is `merge_question_custom_data`

DR-9 names `merge_custom_data`. No such function exists. The real RPC is
`public.merge_question_custom_data`, called at
`apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:62`.

**Cause and date:** the plan was authored against a name that was never in the tree. Plan `161-01`
measured the same defect from the other side on 2026-09-04 (its deviation 6) and seeded the guard's
`PROJECT_SCOPED_RPCS` from the measured call sites rather than from the plan's list, so the shipped
guard already carries the correct name. Only the prose was stale.

### Correction B — `get_questions` EXISTS, and its recorded disposition was wrong

DR-9 asserts "Phase 157's `get_questions` RPC does not exist yet — verified this session". It does
exist, at HEAD, in three places:

- `apps/supabase/supabase/schema/505-question-rpcs.sql` — the declaration.
- `apps/supabase/supabase/migrations/00004_question_rpcs_and_nomination_election_round.sql` — the
  migration that created it.
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:559` — the call.

**Cause and date:** phase 157 plan 03 shipped `get_questions` after this plan was written. The plan's
"verified this session" was true when it was written and false by the time it ran.

**The re-derived disposition, read off the body rather than assumed.**
`get_questions(p_election_id uuid DEFAULT NULL, p_constituency_id uuid DEFAULT NULL, p_election_round integer DEFAULT NULL)`
selects from `public.question_categories` and `public.questions`. Both tables carry
`project_id NOT NULL REFERENCES public.projects(id)`. The body's `WHERE` clauses test **only**
`election_ids`, `constituency_ids` and `election_rounds`, each under an
`IS NULL OR jsonb_array_length(...) = 0 OR ... @> ...` predicate. There is **no** `project_id` term
anywhere in the function.

Therefore `get_questions` with all three parameters NULL — which is exactly the shape the voter app
sends before an election is chosen — **returns every project's questions and categories**. It is the
same defect class as `get_nominations`, in the same phase, one function over.

The disposition the guard carried, `scoped-by-identity: election id + RLS`, is **false** on both
halves: the election id is optional and defaults NULL, and row-level security cannot scope by project
for an `anon` caller who has no project identity. The guard's string is corrected to state the
measured truth rather than launder the leak.

**Why it is not fixed here.** Adding a required `p_project_id` to `get_questions` is a **second**
one-way change to a granted, `anon`-executable signature. The operator answered `required-parameter`
for `get_nominations` and for `get_nominations` only. Making the same change to a different function
without being asked is a Rule 4 architectural decision taken unilaterally, so it is recorded and
filed instead. The written disposition and the filed follow-up are what stop the stale claim from
propagating into Phase 162's planning; the guard's undeclared-RPC hard failure is the backstop
behind them, not the primary mechanism.

---

## Disposition

- DR-6: **stands**, amended in place for the stale three-argument signature and the taken `00004`
  filename. The delivered signature is five arguments and the file is `00005`.
- DR-8: stands, unamended.
- DR-9: **amended in place** — `merge_custom_data` renamed to `merge_question_custom_data`, and the
  `get_questions` row rewritten from "does not exist yet" to the measured unscoped disposition.
