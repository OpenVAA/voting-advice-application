---
created: 2026-10-02
title: "@openvaa/shared-config imports globals without declaring it; the resolved version moved from 16.5.0 to 15.14.0 in Phase 167"
area: packages/shared-config
severity: follow-up
source: Phase 167 plan 167-04 (commit ddcd396ef), RESEARCH Pitfall 6, filed per orchestrator ruling 7
files:
  - packages/shared-config/eslint.config.mjs (`import globals from 'globals';`)
  - packages/shared-config/package.json (no `globals` entry)
---

## Problem

`packages/shared-config/eslint.config.mjs` imports `globals` and spreads `globals.browser`,
`globals.node` and `globals.jest` into `languageOptions.globals`, but `packages/shared-config/package.json`
does not declare `globals`. The import resolves through hoisting to whatever version sits at the
root `node_modules/globals`. This is the same class of defect as `@openvaa/llm` importing `js-yaml`
undeclared (167-CONTEXT D-01 fact 12, fixed in commit `879d0ccf0`).

## Observed effect

Commit `ddcd396ef` removed `apps/docs`'s unused `"globals": "^16.5.0"`. After `yarn install`, the
root `globals` moved from **16.5.0** to **15.14.0** (the catalog's `^15.14.0`), so every workspace
that lints through `@openvaa/shared-config` now gets a smaller globals set: for the frontend,
`languageOptions.globals` went from 1193 to 1151 keys, none added. Lint findings did not change,
because shared-config turns `no-undef` off (167-04 SUMMARY, normalised findings diff empty).

## Fix

Declare `"globals": "catalog:"` in `packages/shared-config/package.json` (or the version range the
team wants every consumer to see), run `yarn install`, and confirm with a before/after lint findings
diff and a `--print-config` diff on a representative file that nothing else changed.
