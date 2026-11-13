# Phase 177 — the SQL linter's verdict on forcing the deferred rule inside a function (RESEARCH assumption A2)

Measured by plan 177-01, Task 3, on 2026-10-10 between 23:52Z and 23:55Z at head `0d57b19f8`, in the local
database (PostgreSQL 17.6, 127.0.0.1:54322), through `yarn db:lint:sql` — `supabase db lint --schema public
--fail-on warning` (CLI 2.118.0, `plpgsql_check` 2.8) and then `apps/supabase/scripts/lint-schema.mjs`. No E2E
run was in flight (413 `started` markers under `tests/e2e-runs/`, each with an `ended` beside it; nothing
listened on port 5273). No schema file was written and the database was not reset.

Everything below was observed in a run unless it is marked as inferred. The evidence is under
`tests/e2e-runs/177-unit/` (gitignored), every file named `177-01-a2-*`.

## The verdict

A2: held
A2-FALLBACK: held

With A2 held, plan 177-07 writes the two statements inside `set_entity_nominations`; with A2 not held and the fallback held, plan 177-07 writes them in `private.force_nomination_parent_rule ()`, a `LANGUAGE sql` function defined in `apps/supabase/supabase/schema/301-auth-functions.sql` above the grant on the `private` schema, and calls it; with neither held, the phase stops here and the question goes back to the operator.

**So plan 177-07 writes the two statements inside `set_entity_nominations`.** The fallback is not needed.

## What was created

All in `public`, by `psql` as the superuser, each named with the prefix `a2_probe`; EXECUTE and the table's
privileges were revoked from `PUBLIC`, `anon`, `authenticated` and `service_role` at creation.

| Object | What it is |
|---|---|
| table `a2_probe` | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `parent_id uuid` (nullable, no foreign key); row-level security enabled, no policy |
| function `a2_probe_parent_required ()` | `RETURNS trigger`, `LANGUAGE plpgsql`, `SECURITY DEFINER`, `search_path = ''`: re-reads the row by `NEW.id` and raises `check_violation` when the row is there and its `parent_id` is null |
| constraint trigger `a2_probe_parent_required` | `AFTER INSERT OR UPDATE ON public.a2_probe`, `DEFERRABLE INITIALLY DEFERRED`, `FOR EACH ROW`, no `WHEN` clause |
| **the built form:** function `a2_probe_built (p_parent uuid)` | `RETURNS uuid`, `LANGUAGE plpgsql`, `SECURITY INVOKER`, `search_path = ''`: inserts a row with no parent; when `p_parent` is not null, updates the row to it; then `SET CONSTRAINTS public.a2_probe_parent_required IMMEDIATE;` and `SET CONSTRAINTS public.a2_probe_parent_required DEFERRED;`; returns the id |
| **the fallback form:** function `a2_probe_force ()` | `RETURNS void`, `LANGUAGE sql`, `SECURITY INVOKER`, `search_path = ''`: the two `SET CONSTRAINTS` statements and nothing else |
| the fallback form's caller: function `a2_probe_fallback (p_parent uuid)` | as `a2_probe_built`, with `PERFORM public.a2_probe_force ();` in place of the two statements |
| a control, not ordered by the plan: function `a2_probe_control (p_parent uuid)` | `a2_probe_built` with one defect — its `UPDATE` sets a column the table does not have — created with `check_function_bodies = off` |

The built form and the fallback form were never in the database together: the built function was dropped
before the fallback's two were created, as the plan lays out. The control was created beside the built form and
dropped before the fallback.

## The linter runs

Five runs of `yarn db:lint:sql`, each in the background with its status written by the command itself.

| Run | The database held | Status | `supabase db lint` | `lint-schema.mjs` |
|---|---|---|---|---|
| `before` | nothing of the probe | **0** | `No schema errors found`, `{"results":[],"message":"db lint"}` | `Summary: 0 error(s), 3 warning(s)` |
| `built` | the table, the trigger and the built form | **0** | the same two lines | the same summary |
| `control` | the same and the control function | **1** | one result, for `public.a2_probe_control`: level `error`, SQLSTATE `42703`, `column "no_such_column" of relation "a2_probe" does not exist`, at the function's line 7 | not run: the script chains the two with `&&` |
| `fallback` | the table, the trigger and the fallback form's two functions | **0** | as `before` | the same summary |
| `after` | nothing of the probe | **0** | as `before` | the same summary |

**The lines that differ from the first run.** `built` and `fallback` each differ from `before` in one line, the
same one, and in nothing else:

```
< [9001] census: policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)
> [9001] census: policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 32)
```

That is the probe table, counted among the tables with row-level security. Neither log names a probe function,
a warning or an error. `after` is equal to `before` line for line.

**What the control shows.** The linter reads a `plpgsql` function created in `public` by hand, between resets,
and reports a defect in it by name: the run with the control is red on the control alone, and its one result
names no line of the two `SET CONSTRAINTS` statements, which the control also holds. The built form was in the
database during that run and is not named in it. So the status 0 of `built` is the linter's answer about a
function it read, not the silence of an instrument that reached nothing.

**`plpgsql_check` asked directly**, in a transaction that created the extension and was rolled back
(`plpgsql_check_function` with `fatal_errors` off and the other, extra, performance and security warnings all
on): 0 rows for `a2_probe_built (uuid)`; 0 rows for `a2_probe_fallback (uuid)`; for the control, the one error
above. After each such transaction the extension was not installed.

**What the linter does not read.** `a2_probe_force` is `LANGUAGE sql`, and `supabase db lint` reads `plpgsql`
functions that do not return `trigger` (RESEARCH § RQ-4). *Inferred from that query, not observed separately:*
the fallback's status says the linter accepts the `plpgsql` caller, and says nothing about the two statements
in the `sql` function, which it never opens. The trigger function is not linted either, in either form.

## The behaviours

One script, `177-01-a2-behaviours.sql`, run once for each form with the writing function's name as its only
variable, every case in a transaction that stores nothing. `rows_stored` was 0 after every case.

| # | Case | The fallback form (`a2_probe_fallback`) — the three the plan names | The built form (`a2_probe_built`) — measured as well |
|---|---|---|---|
| a | called for a row with no parent | **raises `23514` inside the call**: `a2_probe parent required: row … has no parent`, with the context `SQL function "a2_probe_force" statement 1` → `PL/pgSQL function public.a2_probe_fallback(uuid) line 9 at PERFORM` | raises `23514` inside the call, with the context `SQL statement "SET CONSTRAINTS public.a2_probe_parent_required IMMEDIATE"` → `PL/pgSQL function public.a2_probe_built(uuid) line 9 at SQL statement` |
| b | called with the parent set before the forcing | **returns** (`returned = t`) | returns |
| c | after (a), its savepoint rolled back: a row with no parent inserted in the same transaction | **`INSERT 0 1`** — no raise at its own statement; the `COMMIT` of that transaction then fails `23514` | the same |
| c | after (b): a row with no parent inserted in the same transaction | **`INSERT 0 1`** — no raise at its own statement; `SET CONSTRAINTS … IMMEDIATE` by hand then raises `23514` for that row | the same |
| control for c | the mode left `IMMEDIATE` by hand, then a row with no parent | raises `23514` at the `INSERT` itself | the same |
| control for c | the mode left `IMMEDIATE` by hand, then the writing function with a parent | raises `23514` at the function's first statement, its `INSERT` (line 5) | the same |

So for both forms: the refusal is raised inside the call; a write that sets the parent before the forcing
passes; and the mode is `DEFERRED` again afterwards — after a call that returned because the second statement
ran, and after a call that raised because the caller's rolled-back savepoint restored it. The two controls show
that case (c) can tell: with the mode left `IMMEDIATE` the same `INSERT` does raise at its own statement, and a
later call of the writing function fails at its first statement, which is the research's U3.

## What was not measured

- **The real function.** The probe's write is one insert and one optional update on a two-column table. What
  the linter says of `set_entity_nominations` itself is read when plan 177-07 writes it.
- **Another role.** Every statement ran as the superuser. The research measured the forcing as `authenticated`
  under row-level security (T2, T3); this measurement adds nothing to that.
- **A `WHEN` clause on the constraint trigger.** The probe's trigger has none, so every insert and update
  queues an event; the planned trigger has one.
- **A stricter linter.** `lint-schema.mjs` ran without `--strict`, as `yarn db:lint:sql` runs it; its three
  unindexed-foreign-key warnings are the database's own and were there before the probe.

## The database afterwards

Every probe object was dropped by `177-01-a2-drop.sql`. Read from the catalogue after it: 0 relations and 0
functions named `a2_probe%` in `public` or in any schema, 0 triggers, 0 constraints and 0 types of that name;
`plpgsql_check` not installed; 21 tables and 28 non-trigger `plpgsql` functions in `public`, as before the
probe. The run `after` gave status 0 and a log equal to `before`.
