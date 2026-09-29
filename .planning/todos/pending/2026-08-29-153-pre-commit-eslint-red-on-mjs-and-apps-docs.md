---
title: The pre-commit hook's `eslint --fix` task is red on 37 of 44 `.mjs` files and aborts outright on `apps/docs` — pre-existing, and widened by the CFG-08 glob fix
created: 2026-08-29
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 05
priority: medium
suggested_phase: future-build-tooling
keywords: [lint-staged, pre-commit, eslint, no-console, func-style, no-control-regex, apps-docs, ERR_INTERNAL_ASSERTION, v10_config_lookup_from_file, REVIEW-CFG-08, churn, mjs]
---

# `eslint --fix` in the pre-commit hook is red on `.mjs`, and aborts on `apps/docs`

## Origin

Plan `153-05` fixed `.lintstagedrc.json`'s fused `mjssvelte` glob token (REVIEW-CFG-08), which
makes `.mjs` and `.svelte` files reachable by the pre-commit hook for the first time. Task 3
then measured, as instructed, what that newly-reached set actually needs — rather than
inheriting research's "zero churn" figure. The prettier half is genuinely zero. The **eslint**
half is not, and research never measured it: `153-RESEARCH.md § D.6`'s table carries an eslint
column filled in for exactly one row and `—` for all the others.

Filed rather than fixed because closing it requires semantic code changes (`no-console`,
`func-style`) across files owned by no plan, in a directory two sibling plans are actively
creating files in this wave, and plan 05's own constraints forbid a semantic change inside a
formatting commit. Full measurement:
`.planning/phases/153-build-tooling-config-correctness/153-CHURN-MEASUREMENT.md`.

## What was measured

At `d8f988704` on `integration/ship-12-squash`, 2026-08-29. Node v24.14.1, eslint 9.39.2.

`npx eslint --flag v10_config_lookup_from_file --fix-dry-run -f json <set>`:

| Set | files | `--fix` would rewrite | problems REMAINING after `--fix` |
|---|---|---|---|
| `.mjs` `scripts/**` | 9 | 5 | **28** — `no-console` 23, `func-style` 5 |
| `.mjs` `apps/frontend/**` | 4 | 2 | **21** — `no-console` 21 |
| `.mjs` `.planning/**` | 20 | 18 | **263** |
| `.mjs` `.claude/**` | 2 | 2 | **54** |
| `.mjs` `packages/**`, `tests/**`, root | 7 | 0 | 0 |
| `.mjs` `apps/docs/**` | 2 | — | **eslint aborts, exit 2** |
| `.svelte` `apps/frontend/**` | 170 | 0 | **0** |
| `.svelte` `apps/docs/**` | 16 | — | **eslint aborts, exit 2** |

Totals across `.mjs`: **27 files rewritten, 366 problems surviving the fix** — `no-console`
297, `func-style` 36, `no-control-regex` 26, `unused-imports/no-unused-vars` 7.

## The `apps/docs` abort, separately

```
$ npx eslint --flag v10_config_lookup_from_file apps/docs/src/lib/components/Author.svelte
Error [ERR_INTERNAL_ASSERTION]: This is caused by either a bug in Node.js or incorrect usage of Node.js internals.
    at loadCJSModuleWithModuleLoad (node:internal/modules/esm/translators:325:3)
    at async dynamicImportConfig (node_modules/eslint/lib/config/config-loader.js:186:17)
    at async loadConfigFile (node_modules/eslint/lib/config/config-loader.js:276:9)
EXIT=2

$ npx eslint apps/docs/src/lib/components/Author.svelte      # same file, no flag
  0:0  warning  File ignored because no matching configuration was supplied
EXIT=0
```

Node's ESM loader hits an internal assertion while dynamically importing
`apps/docs/eslint.config.js` — a five-line ESM file in a `"type": "module"` workspace. Only
the `v10_config_lookup_from_file` flag reaches it, because only that flag resolves a config
from the linted file's own directory. `.lintstagedrc.json`'s eslint task passes that flag.

## Why it is not a regression of plan 05

Measured over exactly the extensions the **pre-fix** glob already matched
(`html,js,jsx,cjs,ts,tsx,cts,mts,xml,yaml,yml`):

| Directory | files already matched | remaining after `--fix` |
|---|---|---|
| `tests/` | 166 | 1 |
| `.planning/` | 16 | 10 |
| `.claude/` | 17 | 5 |
| `scripts/` | 2 | 1 |
| `apps/docs/` | 22 | **aborts, exit 2 — already** |

The hook was already red for a population of files, and the `apps/docs` abort already fired on
`apps/docs/**/*.ts`. Plan 05 enlarges the affected population; it does not create the defect.
`yarn lint:check` is unaffected and stays green (22/22) because `turbo run lint` invokes each
workspace's own `lint` script, not `--flag v10_config_lookup_from_file` per file.

## Suggested action

1. Decide whether `.planning/**` and `.claude/**` should be in eslint's scope at all. They are
   in `.prettierignore` but have no eslint equivalent, and they account for 317 of the 366
   residual problems. An `ignores` entry in `eslint.config.mjs` for those two trees is a
   scoping decision, not a weakening of the gate — but it must be argued as such, not slipped
   in to turn a light green.
2. Fix or consciously accept the 49 in-bounds residual problems (`scripts/` 28,
   `apps/frontend/` 21) — almost all `no-console` in build/guard scripts whose whole job is to
   print. A targeted `no-console` override for `scripts/**` is the obvious candidate and is
   again a scoping decision to be argued.
3. Investigate the `apps/docs/eslint.config.js` import abort. Likely a Node v24.14.1
   CJS/ESM-interop bug rather than anything wrong with the config; worth an upstream
   reproduction. Until it is resolved, any commit staging an `apps/docs` file fails the hook.
4. Only after 1-3: re-run `153-CHURN-MEASUREMENT.md`'s command set and land the (then genuinely
   formatting-only) churn commit D-B3 anticipated.
