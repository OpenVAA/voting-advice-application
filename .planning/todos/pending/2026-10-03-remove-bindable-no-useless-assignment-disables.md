---
created: 2026-10-03
title: "Remove the three no-useless-assignment disables once eslint-plugin-svelte#1478 is fixed"
area: lint / apps/frontend
severity: low (lint hygiene; three scoped one-line disables of an upstream false positive)
source: Phase 169 operator ruling 2026-10-03 (ESLint 10 landed with three scoped disables, overruling PROH-169-07 for exactly these lines); replaces todo `2026-10-03-eslint-10-held-on-bindable-no-useless-assignment.md` (done)
re_check_trigger: "sveltejs/eslint-plugin-svelte#1478 (or a svelte-eslint-parser fix for it) released and at least 7 days old"
files:
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte (line 50, above `valid = $bindable(true)`)
  - apps/frontend/src/lib/components/video/Video.svelte (line 132, above `mode = $bindable(undefined)`)
  - apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte (line 45, above `itemsShown = $bindable(0)`)
---

## Problem

ESLint 10's recommended `no-useless-assignment` reports write-only `$bindable` props as useless assignments. The
component writes the prop and the parent reads it through `bind:`, which the rule cannot see. This is an upstream false
positive: https://github.com/sveltejs/eslint-plugin-svelte/issues/1478 (open since 2026-02-23; eslint-plugin-svelte
3.23.0 was the newest release on 2026-10-03).

On 2026-10-03 the operator ruled to land ESLint 10 anyway, with one scoped disable above each of the three props:

```
// eslint-disable-next-line no-useless-assignment -- false positive on write-only $bindable prop; remove when https://github.com/sveltejs/eslint-plugin-svelte/issues/1478 is fixed
```

No other `no-useless-assignment` disable exists in the repository. Find them with
`git grep -n 'eslint-disable-next-line no-useless-assignment' -- ':!.planning'` (3 hits).

## When the upstream fix ships

1. Re-measure: the fixing `eslint-plugin-svelte` (or `svelte-eslint-parser`) release must be at least 7 days old.
   Move the catalog entry in `.yarnrc.yml` to it and run `yarn install`.
2. Remove one disable comment and run `yarn workspace @openvaa/frontend lint`. Expect a clean run: no
   `no-useless-assignment` error on that prop.
3. If it is clean, remove the other two and run `TURBO_FORCE=true yarn lint:check`. Expect exit 0, with the
   normalised findings list unchanged apart from the removed lines.
4. If the rule still fires, the fix has not landed for this pattern. Put the comment back and keep this todo open.

ESLint also reports a directive as unused once the rule stops firing on its line (`Unused eslint-disable directive`, a
warning). That warning is the other signal that the disables can go.
