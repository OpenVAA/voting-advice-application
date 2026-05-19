---
title: Rename `yarn dev:*` supabase scripts to `yarn db:*`; add `yarn dev:clean` for vite + svelte-kit cache wipe
priority: medium
created: 2026-05-10
resolves_phase: 78
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

## Resolution (2026-05-12, Phase 78 Plan 01)

Resolved by Phase 78 Plan 01 (CLEAN-01). Outcome:
- 8 Supabase-facing `dev:*` scripts renamed to `db:*` canonical names in root `package.json`.
- New `dev:clean` script lands the v2.8-close vite-cache wipe recipe (`rm -rf apps/frontend/.svelte-kit apps/frontend/node_modules/.vite`).
- `db:reset` and `db:reset-with-data` chain `dev:clean` after the supabase reset (per CONTEXT D-03: supabase reset → cache wipe, never reversed).
- All 8 old `dev:*` names preserved as deprecated aliases — each emits `[deprecated] yarn dev:X is now yarn db:X; alias will be removed after v2.10` to stderr then forwards to canonical (CONTEXT D-02; in-flight Phases 76/77 cross-refs continue to work).
- CLAUDE.md `## Supabase Commands` and `## Development Commands` updated; deprecated-aliases note added.
- CI workflow grep at task time: zero `dev:reset` / `dev:seed` / `dev:status` / `dev:start` refs in `.github/workflows/*.yml` (CONTEXT D-04 verified).
- Smoke tests passed: `yarn db:status` exits 0; `yarn dev:clean` wipes both cache dirs; `yarn dev:status` emits `[deprecated]` warning then forwards.
- Source commit: `27e42f52d feat(78-01): rename dev:* supabase scripts to db:*; add dev:clean`.
- Followup captured at phase close: removal of the 8 deprecated aliases scheduled for v2.10+ (per CONTEXT line 516).
