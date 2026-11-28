---
title: "Stray top-level `supabase/` directory survives Phase 153 — it looks like pure CLI residue, but deletion still owes a cwd-resolution check"
created: 2026-08-28
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 06
priority: low
suggested_phase: future-build-tooling
keywords: [supabase, supabase-cli, stray-directory, residue, gitignore, REVIEW-CFG-06, D-B2, branches, temp, snippets, cwd-resolution]
---

# A second `supabase/` directory at the repo root, holding nothing but CLI state

## Origin

Plan `153-06` (REVIEW-CFG-06 / D-B2) untracked `supabase/.branches/_current_branch` and added a
root `.gitignore` rule `supabase/.branches/`, beside the `supabase/.temp/` entry that was already
there. **B2 option (c) — deleting the directory outright — was considered and not chosen**, because
it needs a check that nothing depends on the directory existing. Only the tracked file was
untracked; the directory stays on disk.

This todo carries the evidence gathered while doing that, so whoever picks up the deletion does not
have to re-measure it.

## The evidence that makes it look like pure residue

Full contents, measured 2026-08-29 (`find supabase -maxdepth 3`):

```
supabase
supabase/snippets            (empty)
supabase/.branches
supabase/.branches/_current_branch   → "main"  (4 bytes)
supabase/.temp
supabase/.temp/cli-latest
```

1. **It holds no `config.toml`, no `migrations/` and no `functions/`.** It is therefore not a
   Supabase project, and the CLI would not operate against it.
2. **The real project is `apps/supabase/supabase/`**, which does hold `config.toml`, `functions/`,
   `migrations/`, `schema/`, `seed.sql`, `snippets/` and `tests/`.
3. **Every `db:*` script runs with cwd `apps/supabase`.** Root `package.json:14-24` routes all of
   them through `yarn workspace @openvaa/supabase …`, and `apps/supabase/package.json`'s scripts are
   bare `supabase start` / `supabase stop` / `supabase db reset` / `supabase status` /
   `supabase db lint …`. Nothing invokes the CLI from the repo root.
4. **The repo already treats these paths as machine-local for the real project.**
   `apps/supabase/supabase/.gitignore` is:

   ```
   # Supabase
   .branches
   .temp
   ```

   So `.branches` was *supposed* to be untracked all along; the stray copy escaped only because no
   root rule covered it.
5. **No tracked file references the root-relative directory.** `git grep -nP
   "(^|[^/\w])supabase/(\.branches|\.temp|config\.toml|migrations|functions|snippets)"` over the
   non-`.planning`, non-markdown tree returns only the two new `.gitignore` lines. The one
   near-miss, `apps/supabase/vitest.config.ts:7`'s `include: ['supabase/functions/**/*.test.ts']`,
   is relative to the `apps/supabase` workspace root — i.e. the real project.

## The check still owed before deleting it

Points 1–5 establish that nothing *in the repository* names the directory. They do **not**
establish that nothing depends on it existing at runtime. Before `rm -rf supabase/`:

- Confirm the Supabase CLI's cwd/ancestor resolution does not walk upward from `apps/supabase` and
  latch onto the root `supabase/` directory (the CLI searches for a project directory; establish
  whether an ancestor `supabase/` without a `config.toml` is ignored, or is treated as a match and
  then errors).
- Confirm no developer- or CI-side invocation runs `supabase …` with cwd = repo root. The scripts
  do not, but a README instruction, a `.github/workflows/` step or a personal shell alias might.
- Run `yarn db:start` / `yarn db:reset` / `yarn db:status` once with the directory removed and
  confirm the CLI recreates only what it needs, under `apps/supabase/supabase/`.

If all three come back clean, the directory is deletable and both root `.gitignore` rules
(`supabase/.branches/`, `supabase/.temp/`) become dead and can go with it.

## Adjacent gap noticed while measuring

`.gitignore:53` ignores `apps/supabase/supabase/snippets/` (Supabase Studio scratch) but there is
**no rule for the root-level `supabase/snippets/`**, which also exists. It is currently empty, so
git does not see it; the moment Studio writes an `Untitled query NNN.sql` there while the CLI is
pointed at the root, it would show up as untracked. Deleting the stray directory resolves this too;
if the directory is kept for any reason, the rule should be widened.

## Why filed rather than fixed

D-B2 explicitly declines option (c), and `153-CONTEXT.md` `<open>` item 7 records that if the
directory is pure residue then that is a todo, not this phase's work. Deleting it is also a
behaviour-affecting change to local developer tooling, which is outside a criterion whose wording is
about *tracked build artefacts*.

## Cross-links

- `.planning/phases/153-build-tooling-config-correctness/153-NC-ROW-4-CFG-06.md` — the Row-4 evidence, § *Deliberately not done, and filed*
- `.planning/phases/153-build-tooling-config-correctness/153-RESEARCH.md` § E.5 — the original safety argument for untracking `_current_branch`
- `.planning/phases/153-build-tooling-config-correctness/153-CONTEXT.md` `<open>` item 7
- `.gitignore:55-57` — the `supabase/.branches/` + `supabase/.temp/` pair
- `apps/supabase/supabase/.gitignore:1-3` — the real project's equivalent

## Tags

#supabase #cli-residue #gitignore #deferred-from-153-06 #REVIEW-CFG-06 #build-tooling
