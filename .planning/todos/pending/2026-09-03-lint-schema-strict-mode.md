---
created: '2026-09-03'
title: '`lint-schema.mjs --strict` is a loaded gun: turning it on reddens CI on pre-existing state'
source: Phase 163 plan 163-03 (Task 1, filed rather than absorbed)
resolves_phase: null
severity: medium
area: infra
---

## The hazard

`apps/supabase/scripts/lint-schema.mjs` advertises a `--strict` mode in its own usage block
at `:12-16`, and implements it at `:26` (`const STRICT = process.argv.includes('--strict')`)
and `:178` (`const hasErrors = errorCount > 0 || (STRICT && warningCount > 0)`).

It is **not** passed today. `apps/supabase/package.json` runs the bare
`node scripts/lint-schema.mjs`, so warnings are non-fatal and the script exits 0 while
reporting them.

Two unindexed foreign keys are reported on every run of a freshly reset database, measured
at HEAD on 2026-09-03 immediately after `yarn db:reset`:

    Summary: 0 error(s), 2 warning(s)
    [WARNING] Foreign keys without indexes:
      - constituency_group_constituencies.constituency_id
        (constraint: constituency_group_constituencies_constituency_id_fkey)
      - election_constituency_groups.constituency_group_id
        (constraint: election_constituency_groups_constituency_group_id_fkey)

Both are harmless **only** because `--strict` is absent.

## Why this is filed instead of fixed

Phase 163 wired `yarn db:lint:sql` into CI as the `sql-lint` job. Adding `--strict` in the
same breath would have made that job red on arrival for pre-existing state that nothing in
the phase introduced - the exact defect 163-03 existed to remove from the plpgsql half of the
same script. A gate that is red on arrival cannot attribute its own red.

## What has to happen first, in this order

1. Land the two missing indexes on `constituency_group_constituencies.constituency_id` and
   `election_constituency_groups.constituency_group_id`, in **both**
   `apps/supabase/supabase/migrations/` and the `apps/supabase/supabase/schema/` mirror, and
   re-baseline `yarn assert:schema-migration-parity` if the signature moves.
2. Re-run `yarn db:reset && yarn db:lint:sql` and observe `0 error(s), 0 warning(s)`.
3. Only then change `lint:schema` in `apps/supabase/package.json` to pass `--strict`, and
   observe the `sql-lint` CI job still green.

Doing 3 before 1 turns an advisory warning into a build failure with no code change to blame.

## Cross-reference

`.planning/phases/163-ci-gates-sql-lint-format-secrets-vulnerability-scanning/163-03-SUMMARY.md`
records the measurement this note is derived from, including the before/after linter output.
