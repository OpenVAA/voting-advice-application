---
created: 2026-03-22
title: Add SQL linting and formatting tooling
source: Phase 30 discussion (2026-03-22)
resolves_phase: 163
severity: low
area: CI / SQL tooling
---

# Add SQL linting and formatting tooling

## The original ask

> Set up linting and formatting for SQL files in `apps/supabase/supabase/schema/` and
> `apps/supabase/supabase/tests/`. Consider tools like sqlfluff, pgFormatter, or sqlfmt.
> Integrate into the lint/format scripts.

## Closed by Phase 163 — fully, not partially

Both halves of the ask are now real, and **both directories this todo names are inside the
formatted set**, which is what makes this a full discharge rather than a partial one.

**Formatting.** `prettier-plugin-sql@0.20.0` is declared once in `packages/shared-config` with
`overrides: [{ files: '*.sql', options: { language: 'postgresql' } }]`, and reaches every workspace
through the `?? []` spreads the leaf prettier configs already carried (163-07, commit `de5c13039`).
Before that, `prettier --check .` silently skipped every `.sql` file — proven by a negative control
run against the pre-plugin config, not inferred. 42 in-scope `.sql` files were then normalised in a
single formatting commit `83e07d0ba` (8535 insertions / 4972 deletions = 13,507 changed lines,
`.sql`-only), so the gate starts from clean rather than from a backlog. That SHA is recorded in
`.git-blame-ignore-revs`.

Covered surface, measured with the gate's own resolver (`prettier --file-info`) rather than a glob
of our choosing — 42 files over four directories:

| Directory | Files |
|---|---|
| `apps/supabase/supabase/schema/` | 25 |
| `apps/supabase/supabase/tests/database/` | 12 |
| `apps/supabase/supabase/migrations/` | 4 |
| `apps/supabase/supabase/seed.sql` | 1 |

**Linting.** `yarn db:lint:sql` (`supabase db lint --schema public --fail-on warning`, which is
plpgsql_check, plus `apps/supabase/scripts/lint-schema.mjs`, two Splinter-derived advisors) is now
wired into a `sql-lint` GitHub Actions job that starts a live Supabase first (163-03). It is proven
to catch: a planted unused variable reddened the job in run 33790909985 and reverting it greened the
same job in run 33791749587.

**No sqlfluff.** This todo suggested sqlfluff, pgFormatter or sqlfmt. Phase 163 measured that there
is no sqlfluff anywhere in this repository and never was; the linter is plpgsql_check plus the two
Splinter advisors, and the formatter is `prettier-plugin-sql` (`sql-formatter` underneath). The
suggestion is recorded here as not taken, so nobody later goes looking for a sqlfluff config that
does not exist.

## What was deliberately EXCLUDED from formatting, and why

Three paths hold `.sql` that is intentionally outside the gate. Each exclusion is a decision, not an
oversight:

1. **`apps/supabase/benchmarks/`** — pgbench scripts containing psql meta-commands (`\timing on`),
   which prettier cannot parse at all: it exits **2** with `Parse error: Unexpected "\timing on"`,
   a different failure from the exit **1** that `yarn format` repairs. Phase 156 (commit `0c1b876f6`)
   has since deleted this directory outright, so no `.prettierignore` glob was added for it — a dead
   entry carrying a dated measurement about files nobody can find would be prose bent to satisfy a
   count. The reasoning is written into `.prettierignore` as a comment instead.
2. **`apps/supabase/supabase/snippets/`** — a Supabase Studio scratch export, already covered by
   `.gitignore`; it holds one untracked file and contributes to neither column of the count above.
3. **`.claude/` fixtures** (2 files), plus `.planning/` (4) and `scripts/fixtures/` (1) — byte-exact
   inputs to the comment-hygiene codemod and its self-test. Reformatting them would change the
   assertions rather than the code under test.

## Related

- `.planning/phases/163-ci-gates-sql-lint-format-secrets-vulnerability-scanning/163-CI-EVIDENCE.md` — the observed runs
- `.planning/todos/pending/2026-09-03-lint-schema-strict-mode.md` — `lint-schema.mjs` advertises `--strict` but nothing passes it
- `.planning/todos/pending/2026-09-03-163-sql-in-lintstaged-prettier-glob.md` — the pre-commit-hook half, addressed to Phase 153
