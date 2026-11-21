---
created: 2026-10-18
title: pg-delta as an aid for authoring numbered migrations after the freeze, reconsidered when pg-delta leaves alpha
area: database
severity: low
source: Phase 181.1 (declarative schema on pg-delta), decision D-01
related_phase: 181.1
re_check_trigger: "pg-delta leaves alpha (a non-alpha engine release, and the CLI no longer needs [experimental.pgdelta])"
keywords: [pg-delta, declarative-schema, migrations, freeze]
files:
  - apps/supabase/supabase/schema/400-storage.sql
  - apps/supabase/supabase/schema/107-feedback.sql
  - apps/supabase/supabase/schema/001-role-settings.sql
  - apps/supabase/supabase/config.toml
  - scripts/assert-schema-migration-parity.mjs
---

## The decision (D-01)

pg-delta is not adopted before the 181-17 freeze. The freeze runs on the project's own model
(181 D-01 to D-05). pg-delta is recorded here as an option for authoring `000NN` migrations after
the freeze.

Why not now, five reasons:

- pg-delta is alpha and may break between releases;
- DML in a schema file is an error under it;
- buckets are not diffed;
- it has no drift check against a live database;
- the freeze is one-way.

What it would give: the next numbered migration generated rather than written by hand, with the
181-10 equivalence check as the authority on whether the result is right.

## What adoption needs

- [ ] `[experimental.pgdelta]` enabled in `apps/supabase/supabase/config.toml`.
- [ ] The two top-level DML statements moved out of `schema/` while still reaching the migration
      (D-02): the `storage.buckets` insert in `400-storage.sql`, which SUPA-04 requires in the
      migration, and the `private.deployment_settings` insert in `107-feedback.sql`. The DML of
      `506-invitation-rpcs.sql` is all inside function bodies and needs nothing.
- [ ] The `NOTIFY pgrst, 'reload config'` in `001-role-settings.sql` handled. How pg-delta treats it
      is unverified.
- [ ] A rename step for the timestamped files pg-delta writes. One sync may be split into several
      files.
- [ ] The guard in `scripts/assert-schema-migration-parity.mjs`: its name pattern widened
      (`MIGRATION_NAME_RE`, which refuses a timestamp name as `BAD NAME`) and its no-gap rule
      relaxed (`VERSION GAP`) for timestamp versions. The order rule needs no change, because every
      timestamp sorts after `00001`. This is D-03 as corrected on 2026-10-18; the earlier wording
      named only the no-gap rule.
- [ ] A CLI of at least 2.119. The spike todo
      `2026-10-18-native-per-worktree-stack-and-cli-bump-spike.md` brings it.

## What it does not replace (D-04)

These all stay:

- the 181-10 equivalence check, `apps/supabase/scripts/check-schema-equivalence.sh`;
- the 181-12 drift check, `infra/scripts/check-drift.sh`;
- the freeze guard, `scripts/assert-schema-migration-parity.mjs`.

pg-delta never reads a live database and does not compare rows or role settings.

## Sources

- `.planning/workstreams/deployment/phases/181.1-declarative-schema-on-pg-delta-agent-ready-local-stack-and-s/181.1-CONTEXT.md`, D-01 to D-04
- `.planning/workstreams/deployment/phases/181.1-declarative-schema-on-pg-delta-agent-ready-local-stack-and-s/181.1-DISCUSSION-POINTS.md`, § 0 rows 3 to 10
- https://supabase.com/blog/declarative-schemas-2-0-pg-delta
- https://supabase.com/docs/guides/local-development/declarative-database-schemas
