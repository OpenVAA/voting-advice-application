---
created: 2026-09-24T13:54:11.680Z
title: Check that the @openvaa/data model agrees with the DB constraints on elections, constituencies, entities and questions
area: packages
severity: major
owner: unassigned — the nomination part was Phase 177's and is done (below); the four remaining tables have no phase
files:
  - apps/supabase/supabase/schema/101-elections.sql
  - apps/supabase/supabase/schema/102-entities.sql
  - apps/supabase/supabase/schema/103-questions.sql
  - apps/supabase/supabase/schema/105-answers.sql
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - packages/data/src/objects/election/
  - packages/data/src/objects/constituency/
  - packages/data/src/objects/entities/
  - packages/data/src/objects/questions/
  - packages/data/README.md
---

## Problem

The database enforces a precise set of rules on the tables the data model mirrors. For nominations the two sides are now compared rule by rule (see *Done* below). Nobody has made the same comparison for the other tables: **elections, constituencies and constituency groups, the four entity tables, and question categories and questions**. If the two disagree, the data model can build objects the database would reject, or reject shapes the database allows. A mismatch like that shows up as missing objects or confusing errors in the frontend, not as a clear failure.

Rules on the database's side that have no stated counterpart check yet, as a starting list (read from the schema files, not compared):

- entities: the validated shape of `color`, the name columns frozen once an entity is confirmed, and the answers JSONB validated against each question's type;
- questions and categories: `entity_type` as a list of entity types, and the refusal of a type change that would invalidate stored answers;
- elections: `election_type` is compared (it is the nomination shape, below); `current_round`, `multiple_rounds` and the dates are not;
- constituencies: the group and parent relations.

## Solution

1. List the database's constraints for each remaining table, from `apps/supabase/supabase/schema/1xx-*.sql` and the validation functions.
2. For each one, find where `@openvaa/data` enforces it, relaxes it or ignores it: constructors, smart defaults, the variants. Use `Skill("data")` and `Skill("database")`.
3. Record each as a row of a comparison table in `packages/data/README.md`, in the form the nomination section already has: the rule, where each side states it, the test that holds it, and "Not stated" where a side does not know the rule. Add a data-package unit test for any rule that should hold on both sides.

## Done 2026-10-11 — the nomination part (Phase 177, plan 177-08; re-scoped at the phase's close, plan 177-21)

Context decision D-24: the nomination part of this todo is done in Phase 177 and the todo is re-scoped to the tables that remain. The frontmatter's `resolves_phase: 177` is removed for that reason: no phase resolves what is left.

- **The comparison table** is `packages/data/README.md` § *Nomination rules: the data model and the database*: nine rules, each with where the data model states it, its test, where the database states it and its test. It covers the parent named by type and id together, a faction's parent, which entity type a parent may be, a child sharing its parent's contest, uniqueness at a contest, which entity type an election's shape admits, a candidate's required parent in a closed-list election, the election round, and the confirmed state.
- **The shape matrix is stated on both sides and held together**: `packages/data/src/objects/election/nominationShape.ts` (`isNominableInShape`, `allowedParentTypes`, read through `Election.nominationShape`) and `public.nomination_shape_rule` in `011-validation-functions.sql`. `nominationShape.test.ts` holds one case for each of the sixteen cells, the election-type section of `08-triggers.test.sql` the same grid in pgTAP, and the Supabase adapter's test `supabaseDataProvider.test.ts` holds the four names of `NOMINATION_SHAPE` equal to the members of the generated enum.

**Gaps the table itself states, still open and now part of this todo** (each a "None" in its test column; found by search, not by reading every assertion):

- the data package has no test of the `Nomination` constructor's refusal of a parent named by type without id, or by id without type;
- it has no test of `FactionNomination`'s refusal of a faction without a parent;
- in pgTAP, only the election half of "a child shares its parent's election, constituency and round" has an assertion that names it (`08-triggers.test.sql`, "Nomination with mismatched election_id rejected"); none names the constituency or the round;
- the data model does not refuse a nomination its election's shape does not admit, and does not state uniqueness at a contest or the confirmed state at all. Each is recorded in the table as intentional or "Not stated", and was not changed.
