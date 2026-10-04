# 168-01 — claims checker (`scripts/check-claims.mjs`) negative controls

Checker: `.planning/phases/168-docs-site-rewrite-strapi-to-supabase/scripts/check-claims.mjs` (Node built-ins only).
Scratch ledgers and pages were written to the session scratch directory, outside the repository, and are not kept.
`$C` below is the checker path. Exit codes were read from the command itself.

## Control 1 — `ledger`: one valid row, one mutated anchor

Scratch ledger:

```
## Claims

| # | Page | Kind | Claim | Anchor file | Anchor |
|---|---|---|---|---|---|
| 1 | quick-start | command | `yarn db:reset` exists | package.json | `"db:reset":` |
| 2 | quick-start | command | mutated anchor | package.json | `"db:resett":` |
```

- Command: `node $C ledger <scratch>/nc-ledger-1.md`
- Result: exit=1. `Claim rows checked: 2`; only the mutated row fails:
  `nc-ledger-1.md #2: anchor `"db:resett":` not found in package.json`

## Control 2 — `ledger`: line-number anchor file

Scratch ledger row: `| 1 | quick-start | command | line-number anchor | package.json:12 | `"db:reset":` |`

- Command: `node $C ledger <scratch>/nc-ledger-2.md`
- Result: exit=1.
  `nc-ledger-2.md #1: line-number anchor (package.json:12 / `"db:reset":`) — content anchors, never line numbers`

## Control 3 — `commands`: a command with no script

Scratch page: a fenced `bash` block holding `yarn db:nonexistent`.

- Command: `node $C commands <scratch>/nc-page-bad.md`
- Result: exit=1.
  `nc-page-bad.md:4: `yarn db:nonexistent` — root has no script db:nonexistent, and it is not a Yarn built-in or a root binary`

## Control 4 — `commands`: valid commands pass

Scratch page: inline `` `yarn install` `` and a fenced block with `$ yarn db:reset # resets` and
`yarn workspace @openvaa/docs check`.

- Command: `node $C commands <scratch>/nc-page-good.md`
- Result: exit 0. `yarn commands found: 3 in 1 page(s)` / `All yarn commands resolve.` (prompt and trailing comment
  stripped; built-in, root script and workspace script each resolved).

## Extra probe — workspace resolution

Scratch page with `yarn workspace @openvaa/docs nosuchscript` and `yarn workspace @openvaa/nosuch build`:
exit 1, both unresolved (`@openvaa/docs has no script, built-in or binary nosuchscript`; `no workspace named @openvaa/nosuch`).
No-argument run (`node $C`): exit 2 (usage error).

Summary of the four required controls: 1, 1, 1, 0 — as specified.

## Command baseline (base revision `0ec229dfe`)

Command: `node $C commands $(git ls-files 'apps/docs/src/routes' | grep -E '\.md$')` → exit 1.

```
yarn commands found: 40 in 197 page(s)

SKIPPED (placeholder, not resolvable) (1):
  apps/docs/src/routes/(content)/developers-guide/development/monorepo/+page.md:8: yarn workspace [module-name] [script-name].

UNRESOLVED (4):
  apps/docs/src/routes/(content)/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi/+page.md:39: `yarn workspace @openvaa/strapi-admin-tools watch` — no workspace named @openvaa/strapi-admin-tools
  apps/docs/src/routes/(content)/developers-guide/backend/re-generating-types/+page.md:5: `yarn strapi ts:generate-types` — root has no script strapi, and it is not a Yarn built-in or a root binary
  apps/docs/src/routes/(content)/developers-guide/backend/running-the-backend-separately/+page.md:9: `yarn start` — root has no script start, and it is not a Yarn built-in or a root binary
  apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:278: `yarn start` — root has no script start, and it is not a Yarn built-in or a root binary
```

The research prototype's "5 unresolved" counted the `monorepo` placeholder as unresolved; this checker lists it as a
skipped placeholder instead (it names no real workspace or script). All five sit on pages plans 03–04 rewrite or delete.
