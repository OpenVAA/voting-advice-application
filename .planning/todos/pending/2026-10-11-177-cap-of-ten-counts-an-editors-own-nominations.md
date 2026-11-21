---
created: 2026-10-11T00:00:00.000Z
title: The cap of ten unconfirmed parent nominations is counted by user and includes the editor's own organization's nominations
area: Supabase / nomination policies
severity: major
source: Phase 177 research item RQ-8 and Pitfall 11 (177-RESEARCH.md); obligation O-7 item 4; operator item G3 of .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md; filed by 177-21
owner: "the operator, for the ruling: G3 has not been read and stands at (a), the option built. The change of (b) is located in two places of the schema"
files:
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/tests/database/23-nominations-write.test.sql
  - apps/supabase/supabase/tests/database/43-set-entity-nominations.test.sql
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
---

## What is built

`private.caller_unconfirmed_originated_count()` counts the rows of `public.nominations` with `created_by` = the caller that nominate an organization or an alliance and are not confirmed. `entity_insert_parent_nominations` admits a parent's row only while the count is below 10, and `enforce_nomination_confirmation` raises on INSERT with a message that begins `A caller may originate at most `, so that the caller is told the limit. The frontend's data writer maps that refusal to `tooManyPending`, and the nomination editor shows its own message for it.

Whose entity a row nominates is not asked. So the count includes:

- the placeholder nominations the caller created for other parties and alliances, which is what the cap is for;
- **every unconfirmed nomination the caller inserted for an organization or an alliance it edits itself.** Since Phase 177 an organization's editor creates those rows through the nomination editor.

The count is by user, not by entity: a user who edits several parties shares one count across them.

## Consequences

- An editor of several parties, or of one party that stands in many elections, can be refused its **own** eleventh nomination while ten of its nominations wait for an administrator.
- **A changed constituency leaves a placeholder behind, still counted** (Pitfall 11). A move is a delete and an insert. The parent's nomination an earlier save created at the old contest is not the caller's row, the caller may not delete it, and it stays unconfirmed and counted until an administrator acts. A candidate that changes constituency twice with a party that is nominated in neither leaves two such rows, which also appear on that party's own nominations view as pending nominations its editor did not make.

## The research's finding (RQ-8), as written

The cap does not protect voters and does not bound the table: an unconfirmed row is shown to no voter, the caller must hold a nomination at that contest, and a placeholder is admitted only where the party has no nomination at that contest, so the project never holds more than one placeholder per party per contest. What only the cap does is bound **one user's share** of the administrator's queue: a caller can move its own nomination from contest to contest by a direct `UPDATE` and leave a placeholder for every party at each, where the cap stops it at ten. The research marks that walk as derived from the policies, **not run** (its assumption A11).

| | Option | Effect |
|---|---|---|
| (a) | As ruled: 10, per user, counting organization and alliance rows the caller originated, its own included | An editor of several parties, or of one party standing in many elections, can be refused its **own** eleventh nomination |
| (b) ★ recommended by the research | Keep the cap at 10 and stop counting rows of an entity the caller edits (the count and the trigger's branch both ask `nomination.edit` on the row's entity) | The cap bounds placeholders only, which is what its own comment says it is for |
| (c) | Remove the cap (the policy conjunct, the trigger branch, the helper) | One user can create parties × contests placeholders; `created_by` loses its only reader |
| (d) | Count per entity instead of per user | Fixes the several-parties case and not the many-elections one |

**The operator has not ruled on it.** Item G3 of the decisions document carries (a) as its recommended option, with the sentence "The researcher recommends (b)"; untouched, it stands at (a), which is what is built.

## Where (b) lands

One conjunct in `private.caller_unconfirmed_originated_count` and one in the cap branch of `enforce_nomination_confirmation` (item P-03 of `.planning/phases/177-define-nominations/177-EXECUTION-RULES.md`), with the cap's cells of pgTAP files 23 and 43. It must be settled before `2026-10-11-177-several-constituencies-per-election-for-one-entity.md` is built.

## Not established

`tooManyPending` was never produced in a browser: it is asserted through the real API by the writer's integration test and shown by a component case with the write as a spy. The walk across contests was not run.
