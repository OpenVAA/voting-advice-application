---
created: 2026-09-24T13:54:11.680Z
title: Check that the @openvaa/data model agrees with the DB constraints on nominations (and other entities)
area: packages
severity: major
files:
  - apps/supabase/supabase/schema/104-nominations.sql
  - apps/supabase/supabase/schema/011-validation-functions.sql (validate_nomination)
  - packages/data/src/objects/nominations/base/nomination.ts
  - packages/data/src/objects/nominations/variants/
---

## Problem

The database now enforces a precise set of nomination rules, several of them
tightened in Phase 162. Nobody has checked that `@openvaa/data` models the
same rules. If the two disagree, the data model can build objects the database
would reject, or reject shapes the database allows. A mismatch like that shows
up as missing nominations or confusing errors in the frontend, not as a clear
failure.

DB-side rules to compare against, from `104-nominations.sql` and
`validate_nomination()`:
- exactly one of `candidate_id` / `organization_id` / `faction_id` /
  `alliance_id` (CHECK), with `entity_type` generated from it
- `election_id` and `constituency_id` NOT NULL; `election_round >= 1`
- `parent_nomination_id`: when set, the child's election, constituency and
  round must match the parent's
- a faction's parent must be the nomination of that faction's own
  organization (162-12)
- election and constituency must belong to the nomination's own project
  (162-REVIEW CR-03)
- `nominations_entity_parent_contest_key UNIQUE NULLS NOT DISTINCT`, i.e. no
  duplicate entity + parent + contest
- `confirmed boolean NOT NULL DEFAULT false`
- the column-write and confirmation triggers
  (`enforce_nomination_columns`, `enforce_nomination_confirmation`)

"etc." in the request: apply the same comparison to the other tables the data
model mirrors, at least elections, constituencies and constituency groups,
entities, and question categories/questions.

## Solution

TBD. Suggested approach:
1. List the DB constraints per table, from `apps/supabase/supabase/schema/1xx-*.sql`
   and the validation functions.
2. For each one, find where `@openvaa/data` enforces it, relaxes it or
   ignores it: constructors, smart defaults, nomination variants and
   parent/child wiring. Use `Skill("data")` and `Skill("database")`.
3. Record each mismatch as either intentional (the data model is laxer by
   design, e.g. it accepts partial data) or a defect. Add data-package unit
   tests for any rule that should hold on both sides.
