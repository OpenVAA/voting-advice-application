---
title: "The root workspace declares `glob` but nothing in the root imports it"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: any cleanup slot
keywords: [glob, root-package-json, unused-dependency, cleanup]
re_check_trigger: "any time"
---

# Consumer-less root `glob`

Measured in 169-10 and unchanged at the end of the phase: the root `package.json` declares `glob` (`^13.0.6`), but
`git grep` for `from 'glob'` / `require('glob')` in `tests/`, `scripts/` and the root `*.mjs` files exits 1. Only
`apps/docs/scripts/*` import `glob`, and `apps/docs` declares it itself. 169-10 bumped it with the docs declaration
rather than remove it, because the plan named a bump.

**What to do:** confirm with `git grep -n -E "['\"]glob['\"]" -- ':!apps/docs' ':!**/node_modules/**' ':!yarn.lock'`
that nothing outside `apps/docs` uses it (CLI calls in scripts included), then remove it from the root
`package.json`, `yarn install`, and run the root gates.
