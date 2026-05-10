---
title: Rename `yarn dev:*` supabase scripts to `yarn db:*`; add `yarn dev:clean` for vite + svelte-kit cache wipe
priority: medium
created: 2026-05-10
context: Captured at v2.8 milestone close. The current `yarn dev:start / dev:stop / dev:reset / dev:reset-with-data / dev:status / dev:seed` family conflates "dev server" and "supabase database" semantics under one prefix. Rename for clarity, and add a separate `yarn dev:clean` that wipes the vite + svelte-kit caches (the recipe that v2.8 close revealed is a hidden gotcha behind manual smoke tests).
---

# Rename `dev:*` → `db:*`; add `dev:clean` and chain `db:reset`

## Renames

| Current | Proposed |
|---------|----------|
| `yarn dev:start` | `yarn db:start` |
| `yarn dev:stop` | `yarn db:stop` |
| `yarn dev:down` | `yarn db:down` |
| `yarn dev:reset` | `yarn db:reset` (and chain `dev:clean` after the supabase reset — see below) |
| `yarn dev:reset-with-data` | `yarn db:reset-with-data` (also chains `dev:clean`) |
| `yarn dev:status` | `yarn db:status` |
| `yarn dev:seed` | `yarn db:seed` |
| `yarn dev:seed:teardown` | `yarn db:seed:teardown` |
| (none) | `yarn dev:clean` — `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` |

Keep `yarn dev` as-is — that one truly *is* the dev server.

## Chain semantics

`yarn db:reset` should run the Supabase reset AND the `dev:clean` — the
v2.8 bundled parity gate caveat documents the cache-staleness gotcha
that bit a manual smoke run on 2026-05-10. Combining them means
operators don't have to remember the second step.

## Approach

1. **Rename in `package.json` (root).** Add the new scripts; keep the
   old ones as deprecated aliases that print a one-line warning and
   forward to the new name. Plan to drop the aliases after one
   milestone.
2. **Update CLAUDE.md.** The "Supabase Commands" section under
   `## Development Commands` is the canonical doc — sync the table.
3. **Update `.planning/` references.** Several PLAN.md / VALIDATION.md
   files reference `yarn dev:reset-with-data`; ensure they continue to
   work via alias OR get updated. Aliases preserve back-compat.
4. **Update CI.** GitHub Actions workflows that invoke any of these
   scripts need to be checked.
5. **Communicate.** Operator-facing change; flag in the next session
   resume notes.

## Why this matters

- Clarity: `yarn db:reset` is unambiguous; `yarn dev:reset` could mean
  "reset the dev server" or "reset the database" depending on reader.
- Discoverability: a new contributor running `yarn run` and scanning
  the script list will instantly understand what each command targets.
- Safety: chaining `dev:clean` into `db:reset` prevents the next
  operator from hitting the vite-cache-staleness bug we documented in
  the Phase 69 parity-gate-followup (now completed, archived).

## Cross-references

- `.planning/milestones/v2.8-MILESTONE-AUDIT.md` — origin of this todo.
- `.planning/todos/completed/2026-05-09-phase-69-parity-gate-followup.md`
  "Pre-capture caveat" — the vite-cache gotcha that motivates
  `dev:clean`.
- CLAUDE.md `## Development Commands` — the doc to sync.
