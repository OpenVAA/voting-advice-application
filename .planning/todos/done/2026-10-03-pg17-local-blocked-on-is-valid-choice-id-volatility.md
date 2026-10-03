---
created: 2026-10-03
title: "Local Postgres 17 is blocked on is_valid_choice_id volatility: the PG17 image's SQL lint flags an IMMUTABLE function that calls STABLE functions"
area: database / apps/supabase
severity: blocking for 169-13's PG17 pgTAP gate and DEPS-08 (operator decision); does not block 169-07 through 169-12
source: Phase 169 plan 169-06 Task 2, deferred by orchestrator ruling 2026-10-03; evidence 169-EVIDENCE.md § 4, § 6 and § 7 (169-06 Task 2)
re_check_trigger: "the operator rules on option A, B or C below"
files:
  - apps/supabase/supabase/config.toml (`[db] major_version`, still 15)
  - apps/supabase/supabase/schema/011-validation-functions.sql (`public.is_valid_choice_id`)
  - apps/supabase/supabase/migrations/00001_initial_schema.sql (the same function)
patches:
  - tests/e2e-runs/169-gates/06/t2-pg17-config.patch (major_version = 17 plus the comment stating the PG15 constraint)
  - tests/e2e-runs/169-gates/06/t2-option-a-stable.patch (IMMUTABLE -> STABLE in both SQL files)
---

## Problem

D-14, an operator overrule, moves local Supabase from Postgres 15 to 17. 169-06 Task 2 made the switch: the volume
was reset, `show server_version` read `17.6` on image `postgres:17.6.1.171`, and `db:types` produced no diff. On PG17:

- pgTAP passed 1335/1335, census included.
- An information-only full E2E run passed 171/171.
- `yarn db:lint:sql` (`supabase db lint --schema public --fail-on warning`) **exited 1**. It reported two
  plpgsql_check warnings on `public.is_valid_choice_id`: "routine is marked as IMMUTABLE, but expression is STABLE".
  One is on body line 9, `SELECT jsonb_agg(c -> 'id') … FROM jsonb_array_elements(…)`. The other is on body line 16,
  `RETURN p_choice_ids @> jsonb_build_array(p_value)`.

The fix is a schema and migration edit. PROH-169-12 forbids any such edit in phase 169, and turning the lint off would
weaken a gate. D-14 is an operator overrule, so only the operator can resolve it. Postgres 17 was parked: the local
stack is back on PG15, and `config.toml` stays `major_version = 15`.

## Evidence (169-EVIDENCE.md § 6, 169-06 Task 2)

- **Probe:** throwaway containers loaded only this function and ran `plpgsql_check_function(…, format:='json')`, the
  same call `supabase db lint` makes (`tests/e2e-runs/169-gates/06/t2-probe.sh`, `t2-plpgsql-check-probe.log`):
  - `postgres:15.8.1.085` (Postgres 15.8, plpgsql_check 2.7): no issues.
  - `postgres:17.6.1.171` (Postgres 17.6, plpgsql_check 2.8): the same two warnings.
- **Volatility:** `provolatile` for `jsonb_agg(anyelement)`, `jsonb_agg_transfn`, `jsonb_build_array("any")` and
  `jsonb_build_array()` is `s` on both 15.8 and 17.6. The functions did not change; the checker now reports the
  mismatch. Whether that comes from plpgsql_check 2.8 itself or from a PG17 planner change is UNCONFIRMED.
- **Option A probe** (`t2-option-a-probe.log`): the same function declared `STABLE` gives no issues under PG17's
  plpgsql_check 2.8.
- **Call sites:** `is_valid_choice_id` is referenced only from `validate_answer_value`'s plpgsql body (twice:
  single-choice and multiple-choice). No index, constraint or generated column uses it, and `validate_answer_value` is
  VOLATILE. STABLE is therefore legal and nothing cascades.

## Options

- **(A) ★ RECOMMENDED: mark `is_valid_choice_id` STABLE** in `011-validation-functions.sql` and
  `00001_initial_schema.sql` (`t2-option-a-stable.patch`).
  - It is valid on Postgres 15 and 17.
  - It corrects a label that is wrong on both versions.
  - The one-line change is identical in both files.
  - Cost: phase 169's "no migration or schema file changed" proof becomes "one reviewed volatility fix". Hosted PG15
    can take the migration unchanged in meaning.
- **(B) Hold Postgres 17 locally:** leave `major_version = 15`, record the hold, and close DEPS-08 as not done. This
  is today's parked state.
- **(C) Keep the function IMMUTABLE and rewrite the body with immutable operators only.** This is also a schema
  edit. It must keep the documented behaviour: true when `p_valid_choices` is NULL or carries no ids. A naive
  `EXISTS (…)` rewrite would return false for an empty choice list.

## Resume steps (option A)

Run from `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`, with Node 24.21.0 on PATH. On this
host, a `db:start` that needs a pull uses a scratch `DOCKER_CONFIG` (`{}`) and
`DOCKER_HOST=unix://$HOME/.docker/run/docker.sock`. `postgres:17.6.1.171` is already pulled.

1. `git apply tests/e2e-runs/169-gates/06/t2-option-a-stable.patch tests/e2e-runs/169-gates/06/t2-pg17-config.patch`
2. `yarn db:stop && yarn workspace @openvaa/supabase exec supabase stop --no-backup`. This removes only
   `openvaa-local`'s volumes; check the container names before and after. Then run `docker builder prune -af` and
   confirm at least 15 GiB free in the Docker VM.
3. `yarn db:reset`, then confirm `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -Atc 'show
   server_version'` prints `17.*` and that `apps/supabase/supabase/.temp/postgres-version` does not exist.
4. `yarn db:types` on that fresh reset, before pgTAP. Explain any `database.ts` diff (169-06 saw none on PG17).
5. `yarn workspace @openvaa/supabase test:db`: exit 0, `Files=36, Tests=1335`, `36-entity-identity.test.sql` ok,
   no `not ok`.
6. `yarn db:lint:sql`: exit 0.
7. Commit the schema fix, `fix(supabase): mark is_valid_choice_id STABLE`, with the two SQL files. Then commit the
   switch separately, `chore(supabase): run local Postgres 17`, with `config.toml`.
8. `bash .planning/phases/169-dependency-bump-to-latest-safe-versions/169-e2e.sh 169-06-pg17`
9. `bash .planning/phases/169-dependency-bump-to-latest-safe-versions/169-gates.sh 169-06-pg17-gates`, run in the
   background and polled.
10. Record the results in 169-EVIDENCE.md, mark DEPS-08 complete (and DEPS-07 if 169-07 has landed), and give every
    developer the one-time local step:
    `yarn db:stop && yarn workspace @openvaa/supabase exec supabase stop --no-backup && yarn db:reset`.

Hosted Postgres stays 15 until the operator upgrades it. Every migration must stay valid on PG15 until then.
