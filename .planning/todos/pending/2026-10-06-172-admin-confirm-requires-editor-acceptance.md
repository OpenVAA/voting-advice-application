---
created: 2026-10-06T07:05:00.000Z
title: The Admin app should refuse to confirm, or warn when confirming, an entity none of whose editors has accepted the terms of use (TOU-F01)
area: Admin app / database
severity: minor
source: Phase 172 (172-CONTEXT.md D-16 and D-17; requirement TOU-03; filed by 172-09)
files:
  - apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql
  - apps/supabase/supabase/schema/300-auth-tables.sql
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql
  - apps/frontend/src/routes/admin/(protected)
---

## The rule

Future requirement **TOU-F01**: the Admin app refuses to confirm, or warns when confirming, an entity whose
primary editor has not accepted the terms of use.

**Which of the two is undecided.** "Refuse" and "warn" are different features: a refusal can live in the
database, a warning can only live in the app. Nobody has ruled on it; this todo does not.

## Why it matters now

Since Phase 172 a confirmed entity is public whether or not anyone has accepted anything. The public rule is
three conditions for every entity type: the project is open for voters, the entity is `confirmed`, and a
confirmed nomination links it into the project. Acceptance of the terms of use left that rule on purpose
(172-CONTEXT.md D-13), so `confirmed` is the single entity-side lever and whoever sets it publishes the
entity. Nothing in the product records or prevents the case "confirmed and public, no editor has accepted"
(threat T-172-19, accepted and deferred here). Measured on the `default` dataset after the change: 327
never-registered candidates are readable by anon.

## The definition (a proposal)

**"Primary editor has not accepted" is read as: no holder of an editor grant on the entity has an
acceptance row for the project.**

- **"Primary" is not a schema concept.** No table, column, grant shape or index marks one editor of an
  entity as primary. The sentence above is the proposed reading of the requirement's wording, not a fact
  about the schema, and whoever takes this todo must confirm it or replace it.
- **It is a join of two existing tables and needs no new column:** `public.grants` (rows with
  `scope = 'entity'`, the entity's `target_type` and `target_id`, `role = 'editor'`) against
  `public.terms_of_use_acceptances` on `user_id`, for the entity's `project_id`.

  ```sql
  -- true when the rule applies to the entity
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.grants g
    JOIN public.terms_of_use_acceptances a
      ON a.user_id = g.user_id AND a.project_id = $project_id
    WHERE g.scope = 'entity' AND g.target_type = $entity_type
      AND g.target_id = $entity_id AND g.role = 'editor'
  );
  ```

- **For a candidate it equals "the editor has not accepted"**, for as long as the unique index
  `idx_grants_one_candidate_editor` (`300-auth-tables.sql`) admits one editor per candidate.
- **For an organization it equals "no editor has accepted"**, that is, any one editor's acceptance
  satisfies it: an organization admits several editors and none of them is marked.
- **An entity with no editor at all satisfies the definition vacuously**: nobody holds an editor grant, so
  nobody has accepted. Under "refuse" the rule would then block confirming every seeded or invited entity
  that no one has claimed yet, which is the case D-13 deliberately leaves public. Whether the rule is meant
  to cover that case has to be decided together with "refuse or warn".

## Implementation notes

1. **An admin's own session cannot compute the join.** `public.grants` is readable by
   `supabase_auth_admin` and `service_role` only, and a user reads only their own rows of
   `terms_of_use_acceptances`. The answer has to come from a `SECURITY DEFINER` function gated on the
   caller's authority over the entity (`entity.confirm`), or from a service-role path. No administrator
   can read an acceptance at all, so auditing who has accepted is deferred here too: a project-scoped
   admin read of the table is the decision this item needs, and the table header says it has none
   (172 review, WR-02).
2. **The pgTAP census will go red, on purpose.** Section 7 of `37-terms-of-use-acceptances.test.sql` fails
   when any function in `public` or `private`, or any policy in `public` or `storage`, contains
   `terms_of_use`, the acceptance table's own name included. A function that joins the table trips its
   second assertion. That assertion's description says how to adjust it: exempt the function there by
   name, with the reason beside it, or narrow the searched text. Do not delete the census.
3. **A refusal placed in `enforce_entity_immutability`** (`011-validation-functions.sql`, the trigger that
   already gates the `confirmed` flag on `entity.confirm`) would make an entity's public visibility depend
   on acceptance again, indirectly. That is the dependence TOU-02 removed, so it needs an explicit
   decision and not a quiet reintroduction.
4. **There is no confirmation screen in the Admin app today** (`apps/frontend/src/routes/admin/(protected)`
   holds the jobs, argument-condensation and question-info pages). The rule lands with whatever phase
   builds entity confirmation there.
5. The definition holds across the planned grant work: Phase 173 keeps the one-editor index for candidates
   (172-CONTEXT.md R10), and the general grant specification of Phase 174 changes who may be granted what,
   not this join.

## Not covered by any other todo

Four other pending todos mention terms of use (`2026-08-27-147-empty-answer-candidate-states-unscanned.md`,
`2026-08-28-fold-migrations-for-byte-parity.md`,
`2026-09-03-datawriter-row-erasure-absorbs-rpc-nullability.md` and, until Phase 172 closed it,
`2026-08-27-147-tou-gate-modal-unscanned.md`). None is about confirming an entity, so this is a standalone
item and not a merge into one of them.
