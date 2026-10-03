---
title: "Hosted Postgres is still 15 while the local stack runs 17: upgrade hosted, and keep every migration PG15-valid until then"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: medium
suggested_phase: operator / hosting action (Supabase dashboard), before the first migration that needs a PG16+ feature
keywords: [postgres-17, postgres-15, supabase-hosted, migrations, config-toml, operator, D-14, DEPS-08]
re_check_trigger: "when the operator schedules the hosted upgrade; and before merging any migration that uses PG16/17-only syntax, functions or GUCs"
---

# Local runs Postgres 17, hosted runs 15

## State at the end of Phase 169 (2026-10-03)

- **Local:** `apps/supabase/supabase/config.toml` `[db] major_version = 17` (`bfdc1afc3`); image `postgres:17.6.1.171`;
  `show server_version` → 17.6. pgTAP 1335/1335 and `db:lint:sql` 0 on 17 (169-13 final gate, `169-EVIDENCE.md` § 4).
- **Hosted:** not changed by the phase; still Postgres 15. Check with `SHOW server_version;` on the hosted database.
- **The one schema change of the phase:** `public.is_valid_choice_id` is now `STABLE` (was `IMMUTABLE`) in
  `schema/011-validation-functions.sql` and `migrations/00001_initial_schema.sql` (`f1ac8164a`, operator ruling R1). The
  migration was edited in place, so a hosted database that already applied `00001` keeps the old `IMMUTABLE` label.
  That is harmless in practice (the only caller, `validate_answer_value`, is VOLATILE, and no index or generated column
  uses the function), but schema and hosted catalog differ on that one attribute until someone runs
  `ALTER FUNCTION public.is_valid_choice_id(...) STABLE;` on hosted or ships it as a new migration.

## Standing constraint until hosted runs 17

Every migration must stay valid on Postgres 15: no PG16/17-only syntax, function or GUC. `config.toml`'s `[db]`
comment states this rule; revisit that comment once hosted is on 17 (it can then say the two majors match).

## What to do

1. Operator: upgrade the hosted project to Postgres 17 (Supabase dashboard → Infrastructure → upgrade), in a
   maintenance window, after a backup. Confirm with `SHOW server_version;`.
2. Optionally align the volatility label on hosted (`ALTER FUNCTION … STABLE`, or a follow-up migration).
3. Update the `config.toml` `[db]` comment.

## The one-time local step for every developer machine

A PG15 data volume cannot be opened by PG17. Each machine that pulls the Postgres commit runs once (this project's
stack only — never `supabase stop --all`):

```
yarn db:stop && yarn workspace @openvaa/supabase exec supabase stop --no-backup && yarn db:reset
```

Local data is re-seeded, not migrated. Run `docker builder prune -af` first if disk is tight. No
`.temp/postgres-version` file was moved aside by the phase (`apps/supabase/supabase/.temp/` holds only `cli-latest`
and `start-secrets`), so nothing needs restoring.
