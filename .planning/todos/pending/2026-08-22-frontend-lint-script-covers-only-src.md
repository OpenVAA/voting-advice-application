---
created: '2026-08-22T00:00:00.000Z'
title: The frontend lint script lints only `src/` — five `apps/frontend/*` config files sit outside every lint gate
area: frontend
files:
  - apps/frontend/package.json
  - apps/frontend/eslint.config.mjs
source: Phase 143 (D-08)
---

## Problem

`apps/frontend/package.json:10`, quoted verbatim:

```json
"lint": "eslint --flag v10_config_lookup_from_file src/",
```

The trailing `src/` is a **path argument**, and it is what limits the file set. Everything at
`apps/frontend/*` is therefore outside **every** lint gate — not merely outside the `svelte/store`
guard:

| File | Linted today |
| --- | --- |
| `apps/frontend/vite.config.ts` | no |
| `apps/frontend/vitest.config.ts` | no |
| `apps/frontend/svelte.config.js` | no |
| `apps/frontend/prettier.config.mjs` | no |
| `apps/frontend/eslint.config.mjs` | no |

The last one is worth pausing on: **the lint configuration is itself unlinted.**

## Why this is a lint-script-scope question, not a store-guard question

Phase 143's **D-05** widened the guard block's glob from `src/**/*.{ts,svelte}` to
`src/**/*.{ts,js,mjs,cjs,svelte}`, which is what let a `.js` file under `src/` be caught. **That change
does not move this line at all.** The guard glob is relative to the config's directory and selects
*within* whatever ESLint is asked to look at; the **script argument** decides what ESLint is asked to
look at in the first place. Widening the glob to `**/*` would still lint nothing outside `src/`.

Phase 143 measured this rather than assuming it: an ESLint probe against a virtual
`apps/frontend/vite.config.ts` path was **SILENT** while a control probe under `src/` **FIRED**, so the
silence is attributable to reach and not to a misconfigured probe.

## Solution

Widen the script's path argument — `eslint --flag v10_config_lookup_from_file .` — and then deal with
the fallout, which is the actual work:

1. **Expect the five files to red.** They have never been linted; some of the repo-wide rules (import
   ordering, `no-console`, unused vars) will have drifted there.
2. **Check the ignore list first.** `apps/frontend/eslint.config.mjs`'s `ignores` array (16 entries as
   of Phase 143, re-measured — `**/node_modules/**`, `**/dist/**`, `**/build/**`, `.svelte-kit`,
   generated Paraglide output, lockfiles, `src/app.html`, `src/error.html`, …) is written on the
   assumption that only `src/` is ever visited. Widening the argument makes several entries load-bearing
   for the first time.
3. **Do not "fix" this by adding exclusions.** Phase 143's SC-3 forbids silencing a site by broadening
   the exclusion list, and the same reasoning applies here: an exclusion added to make a newly-linted
   file green is indistinguishable from an exclusion added to hide a real finding.
4. Consider whether the root-level `eslint … tests` step in `yarn lint:check` has the same shape of hole
   for `tests/*` config files.

## Context

- **Source:** Phase 143 decision **D-08**, measured out of scope. The measurement, the probe run and the
  FIRING control are recorded in
  `.planning/phases/143-svelte-store-guard-app-wide-reach-fallout-triage/143-NEGATIVE-CONTROL-LEDGER.md`
  § Out of scope, measured (D-07 / D-08) and § Probe-apparatus control.
- **All numbers in this todo live in that ledger.** Cross-referenced rather than restated so nothing
  here can drift from its source.
- Related in kind to Phase 142.1's `format:check` finding — a gate whose reach is narrower than its name
  suggests stays green for reasons unrelated to the code being correct.
- Not scheduled: no `resolves_phase`.
