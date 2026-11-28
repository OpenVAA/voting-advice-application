---
created: "2026-08-28T00:00:00.000Z"
title: Eight JSONB linkage columns across both question tables hold election and constituency ids with no referential integrity
area: database
severity: medium
source: Phase 156 (supabase-schema-corrections) criterion 8 / REVIEW-DB-08, item 4 — dispositioned ANSWERED-ON-THE-RECORD in 156-DISPOSITIONS.md Entry 4
files:
  - apps/supabase/supabase/schema/103-questions.sql
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
related_phase: 157
---

## Problem

Four columns — `election_ids`, `election_rounds`, `constituency_ids` and `entity_type` — are typed
`jsonb` and carry arrays of identifiers with no foreign key, no trigger and no check behind them.
They exist on **both** question tables, not one:

| Table | Location |
|---|---|
| `public.question_categories` | `apps/supabase/supabase/schema/103-questions.sql:20-23` |
| `public.questions` | `apps/supabase/supabase/schema/103-questions.sql:48-51` |

(`156-CONTEXT.md` § D-E5 item 4 cites only `:20-23`, i.e. `question_categories`. Measured, the
identical four are on `questions`. Anything that linked one table would leave the other carrying the
same defect.)

Deleting an election or a constituency therefore leaves dangling ids inside JSONB that nothing
detects. Every other reference to `public.projects` in this schema cascades on delete — these do
not, because they are not references at all: they are opaque documents that happen to contain
identifiers.

**Why this was not fixed in Phase 156.** The three candidate structures have materially different
costs depending on how the ids are *read*, and the reader does not exist yet. Phase 157's criterion 3
introduces a `get_questions` RPC returning categories and their questions together with filtering by
election, constituency and election round — that RPC's query is what determines whether a junction
table is the right answer (if it joins) or an expensive detour (if it does a containment test on the
JSONB and never joins). Choosing a structure before that query is written is guessing at its
requirements, and a guessed schema is harder to remove than an absent one.

The defect is real and is not in question. Only the remedy is underdetermined.

## Solution

TBD — after Phase 157's `get_questions` exists and its query shape is known, choose among:

- **Junction tables with real foreign keys** (`question_elections`, `question_constituencies`, and
  the same pair for categories). Correct by construction, cascades for free, and the right answer if
  the filter joins. Costs a migration of existing JSONB contents and a write-path rewrite.
- **A validation trigger** on insert/update that resolves each id and rejects unresolvable ones.
  Keeps the column shape, so no read-path change; catches bad writes but not orphaning caused by a
  *later* delete of the referenced row.
- **Keep the JSONB, add a periodic consistency check** — cheapest, detects rather than prevents, and
  is the honest option if the arrays turn out to be advisory rather than authoritative.
- Whichever is chosen, apply it to **both** tables, and decide explicitly what `entity_type` is —
  it is in the same group by position but is not an id list, and it may not want the same treatment.
