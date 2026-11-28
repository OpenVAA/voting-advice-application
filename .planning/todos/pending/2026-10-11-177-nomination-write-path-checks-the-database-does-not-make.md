---
created: 2026-10-11T00:00:00.000Z
title: What the nomination write path does not bound, hold or test — two unbounded arguments, a parent not held to the options, roles no fixture impersonates, and the cells pgTAP leaves unasserted
area: Supabase / nominations
severity: major
source: Phase 177 plans 177-03 to 177-07, 177-09 and 177-17 (the § Not done, or not verified and § Threat Flags of their summaries), as the orchestrator collected them in 177-21-INPUTS.md; the notes at the end of section G of .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md; filed by 177-21
owner: the operator for the rulings of items 3 and 5 to 7; unassigned for items 2 and 9 and the rest (Phase 177.1 did item 1 and documented item 4; see § Phase 177.1)
files:
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/schema/400-storage.sql
  - apps/supabase/supabase/tests/database/23-nominations-write.test.sql
  - apps/supabase/supabase/tests/database/43-set-entity-nominations.test.sql
  - apps/supabase/supabase/tests/database/44-nomination-parent-options.test.sql
---

Each item is a property of the schema as it stands at the close of Phase 177. None is a known defect a user can meet through the application's pages; several are what a caller of the API can do that the pages never do.

## Not bounded

1. **`p_nominations` of `set_entity_nominations` has no length bound.** The whole argument is validated before anything is written, so a very long array costs validation and, object by object, the function's reads. Not measured, no cap built.
2. **`p_contests` of `get_nomination_parent_options` has no length bound.** Each asked contest costs one definer-helper call for each listed option. Not measured, no cap built.

## Not held

3. **A named parent is not held to the listed options.** The selector lists a project's confirmed organizations for a candidate. `set_entity_nominations` checks the parent's type and that its id is a uuid, and then links to, or creates, that entity's nomination at the contest: a candidate that knows the id of an **unconfirmed** organization of its project can link to it. The parent policy already admits the same direct insert. Inferred from the function's body; no test asserts it either way. The row it makes is unconfirmed like any other. Put to the operator: say if the function should refuse an id that is not among the options.
4. **Two saves that create the same parent's nomination at once are not reconciled** (item P-08, built as accepted): the second call is refused whole on the uniqueness key and succeeds when made again. Not tested: no test runs two saves in parallel.
5. **The faction pairing of the parent policy** (operator item G4, P-04). The item reads "a faction's editor may create its organization's row". It cannot: a faction's nomination must stand under its own organization's, so guard 3 always refuses that row. What the kept pairing admits is a faction's editor creating **another** organization's placeholder. Built as ruled and said in the policy's comment; option (b) drops the pairing. Faction users are out of scope either way.
6. **An alliance's editor holds `nomination.create_parent`**, which no row type lets it use: all four entity editor roles hold the permission. Not changed.
7. **Whether the two rules of `enforce_nomination_confirmation` should swap.** A direct `UPDATE` that adds `requestedParentOrganization` to a confirmed row is refused, because rule 1 is judged before rule 2 turns the confirmation off. `set_entity_nominations` states `confirmed` false in the same statement for that reason. Nothing in the application makes the direct update. With the rules swapped it would unconfirm the row instead of being refused. The operator's.
8. **The message of that refusal still speaks of a candidate**: "confirming would publish as an independent a candidate who asked for a party". Since Phase 177 an organization's nomination carries the same key for a typed alliance. The comments were corrected by plan 177-21; the message is asserted whole in pgTAP and was left as it is.
9. **`public.nomination_shape_rule` is callable over the API by `anon` and `authenticated`.** It reads no table and answers a fixed matrix; the same exposure as `grant_role_permissions`.

## Not exercised

10. **An entity editor's DELETE of a nomination reaches the definer trigger `cleanup_storage_on_delete`**, which enqueues the deletion of the objects in that nomination's folder. Never exercised with an object present: no nomination of a fixture or a dataset has one.
11. **Roles no pgTAP fixture impersonates in the files Phase 177 extended**: a faction's and an alliance's editor, a project editor, an account admin and a root admin, in `23-nominations-write.test.sql`, `43-set-entity-nominations.test.sql` and `08-triggers.test.sql`. `44-nomination-parent-options.test.sql` does refuse a faction's and an alliance's editor and a project admin.
12. **Unasserted in pgTAP file 43**, each marked inferred in `177-07-SUMMARY.md`: `other` for an organization (a typed alliance name); `none` on a kept candidate row in an `organization_list` election; a project admin, a project editor or the service role as the caller; a placeholder created for a kept row under the lock; a move of a row whose custom data holds another key; a parent `entity_id` that names no entity, or one of another project.
13. **`entity` over a stored link to another nomination of the same party** repoints the row and unconfirms it. Observed once in a rolled-back scratch transaction (plan 177-07), asserted by no test. An editor that has not changed a listed parent sends `keep`.
14. **Nothing of `set_entity_nominations` was run through PostgREST by pgTAP**; the writer's integration test is where its refusals cross the API, and it runs in no CI job (`2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md`).

## Phase 177.1

**Update 2026-10-18 (Phase 177.1 close; its decision J3 and the operator's rulings of 2026-10-17).** Item 1 is done: one bound of 1000 nominations, stated once in `private.nomination_list_checked` (`apps/supabase/supabase/schema/503-entity-rpcs.sql`) and asked by both writers, `set_entity_nominations` and `create_invitations`, before any object is read; held by the LIST block of `46-nomination-write-helpers.test.sql` and the BOUND block of `47-invitation-nominations.test.sql` (commits `f074142d8` and `d65814195`). Item 4 is documented on `private.parent_nomination_resolved`, the one resolve-or-create step both writers ask: two calls that create the same parent's nomination at once are decided by the uniqueness key `nominations_entity_parent_contest_key`, the second refused whole and succeeding when made again; untested, as no pgTAP file runs two calls in parallel. Item 3 stays the operator's ruling: the shared function neither adds nor removes the check, so a candidate can still name an unconfirmed organization of its own project. Items 2 and 9 touch nothing the phase writes and return to unassigned. Of item 12, "a parent `entity_id` that names no entity, or one of another project" is now refused with SQLSTATE 22023 by both writers and asserted in file 46's XPROJ block, through `set_entity_nominations` and through `create_invitations`; the item's other cells stay unasserted in file 43, which the phase left byte-identical.

## Related

The cap and the placeholder a move leaves behind: `2026-10-11-177-cap-of-ten-counts-an-editors-own-nominations.md`. A save built on a stale list: `2026-10-11-177-a-save-built-on-nominations-an-administrator-changed.md`. `nominations.created_by` readable by anon: `2026-10-01-nominations-created-by-readable-by-anon.md`.
