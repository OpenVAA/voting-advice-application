---
title: "TypeScript 7 is held on 6.0.3 because typescript-eslint and svelte-check do not admit it"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: the next dependency phase after the trigger fires
keywords: [typescript-7, typescript-eslint, svelte-check, sveltekit-3, peer-dependencies, hold, D-16, D-06]
re_check_trigger: "typescript-eslint and svelte-check both admit typescript 7 (and Kit 3's peer, once Kit 3 lands)"
---

# TypeScript 7 held (D-16)

## Measured 2026-10-03T19:01Z

- Repository: `typescript` 6.0.3 (catalog `^6.0.3`; 169-02, `ebeaafa5c`). 6.0.3 is the newest 6.x.
- Registry: `latest` 7.0.2 (published 2026-07-08, so the age rule alone would admit it); `next` 7.1.0-dev.
- Blocking peers:
  - `typescript-eslint` / `@typescript-eslint/parser` / `@typescript-eslint/eslint-plugin` 8.71.0 (newest):
    `typescript: >=4.8.4 <6.1.0`.
  - `svelte-check` 4.7.6 (newest): `typescript: ^5.0.0 || ^6.0.0`.
  - `@sveltejs/kit` 3.0.0 (held itself, todo `2026-10-03-sveltekit-3-held-by-the-age-rule.md`): `typescript: ^6.0.0`.
- D-06 forbids `packageExtensions` or peer overrides to force it.

## What to do when the trigger fires

1. `npm view typescript-eslint peerDependencies` and `npm view svelte-check peerDependencies` (and Kit's) admit 7.
2. Bump the catalog `typescript`, run `yarn install` with no `YN0060`, then typecheck, `lint:check`, both svelte-checks,
   unit and build. Review TS 7's default changes against `tsconfig.base.json` as 169-02 did for 6.
