---
created: "2026-08-28T00:00:00.000Z"
title: Folding the two follow-on migrations into the initial one would collapse the schema drift gate to a single comparison
area: database
severity: low
source: Phase 156 (supabase-schema-corrections) — the option 156-RESEARCH.md surfaced and plan 01 declined; recorded in 156-DISPOSITIONS.md Entry 6 § "The schema↔migration drift check"
files:
  - scripts/assert-schema-migration-parity.mjs
  - apps/supabase/scripts/schema-migration-parity.expected.txt
  - apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql
  - apps/supabase/supabase/migrations/00003_authenticated_insert_feedback.sql
related_phase: 163
---

## Problem

This repository keeps the database schema in two places: `apps/supabase/supabase/schema/`, which is
the human-readable per-object source, and `apps/supabase/supabase/migrations/`, which is what
`supabase db reset` actually replays. Phase 156 added
`scripts/assert-schema-migration-parity.mjs` as the twelfth link of `yarn lint:check` to stop the two
drifting apart — before it, nothing verified they agreed.

The gate cannot be a plain `cmp`, because the two trees are **not** byte-identical: the concatenated
`schema/` differs from `00001_initial_schema.sql` by exactly the deltas that `00002` and `00003`
apply on top of it (the terms-of-use / `get_nominations` RLS guard, and the authenticated feedback
insert). So the gate instead computes a normalised golden signature and compares it against a
reviewed fixture at `apps/supabase/scripts/schema-migration-parity.expected.txt`.

That fixture is maintenance. Every legitimate schema change updates it, and a reviewer has to be
able to tell a legitimate update from a drift being papered over. **Folding `00002` and `00003` into
`00001`** would make the concatenation byte-identical, collapse the gate to a one-line comparison,
and delete the fixture entirely.

**Why Phase 156 declined it.** Folding deletes migration files, which is the most history-destructive
act available in that phase. Its authorisation (decision D-E2) covers rewriting *its own* edits into
migration history; it does not extend to collapsing migrations unrelated to it. The option is
recorded here rather than taken so the cheaper form of the gate is not lost — it is a good idea that
needs a phase willing to own the history rewrite deliberately.

Known limit of the adopted form, which the fold would not change: it catches one-sidedness, which is
the measured hazard. It cannot catch a change made *identically wrong* in both copies.

## Solution

TBD — choose one:

- **Fold and simplify.** Merge `00002` and `00003` into `00001`, delete both files, replace the
  normalised-signature comparison with a direct one, and delete the fixture. Requires an explicit
  decision that no environment has already applied the three migrations separately — check that
  first, because a deployed database with `00002`/`00003` recorded in `supabase_migrations` will not
  match a folded `00001`.
- **Keep the golden fixture.** Status quo. Costs a fixture update per schema change and a reviewer
  who understands what the signature means.
- **Regenerate the fixture automatically, with the diff surfaced for human review.** A middle path:
  the maintenance disappears, the review does not. Worth costing before choosing the fold, since it
  keeps the migration history intact.
