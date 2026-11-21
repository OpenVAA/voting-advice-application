---
created: 2026-10-07T12:53:29.000Z
title: Nothing type-checks apps/supabase/supabase/functions/ - no tsconfig, no typecheck script, no Deno on the host
area: apps/supabase - Edge Functions / gates
severity: major
source: Phase 174 (174-05-SUMMARY.md § Next Phase Readiness; filed by 174-10)
files:
  - apps/supabase/package.json
  - apps/supabase/vitest.config.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/send-email/index.ts
---

## Problem

The three Edge Functions are TypeScript that no compiler reads before it is served:

- `apps/supabase` has no `tsconfig.json` and no `typecheck` script (its scripts are `start stop reset diff status lint:sql lint:schema lint:all test:unit test:db`), so `yarn typecheck` and the gate row of that name never see the directory.
- The host has no `deno` binary, so `deno check` is not available either, and no CI job runs it.
- Vitest runs the pure modules (`linkIssue.ts`, `contract.ts`, `callerAuthority.ts`, …) and strips types without checking them. It cannot import an `index.ts`, because those import `npm:` specifiers and use the `Deno` global; each function's `flowConformance.test.ts` reads the source text of its `index.ts` instead.

So a type error in an `index.ts` is first seen when the edge runtime loads the file, which under `policy = "per_worker"` is after a stack restart, as a function that answers 500 or does not boot. The E2E project `invitation-contract` would catch a function that does not boot; a wrong argument shape on a path no test walks would not be caught at all.

Related and distinct: `2026-09-03-deno-edge-functions-do-not-consume-supabase-types.md` (the functions share no types with `packages/supabase-types`, so the generated signatures of the RPCs they call do not reach them).

## Solution

- Add a type-check the gate set can run. Either `deno check` over the three `index.ts` files in CI and locally (needs Deno installed, pinned to the edge runtime's version), or a `tsconfig.json` for the directory with a small ambient declaration for the `Deno` and `EdgeRuntime` globals and path mappings for the `npm:` specifiers, checked by `tsc --noEmit`.
- Wire it into `yarn typecheck`, so the existing gate row covers it.
- Prefer `deno check`: it is the compiler that agrees with the runtime about `npm:` resolution.

## Resolution (Phase 180, 2026-11-13)

Done, measured on `feat/entity-signup-multi-grant`:

- `deno` `2.9.6`, exact, is a devDependency of `@openvaa/supabase` (plan 180-02 commit 1, `f94032781`), and
  `apps/supabase/package.json` has `"typecheck": "cd supabase/functions && deno check ."`, so the root
  `yarn typecheck` runs `@openvaa/supabase#typecheck`. The `cd` is load-bearing: Deno discovers the scoped
  `functions/deno.json` (`"lock": false`, `exclude: ["**/*.test.ts"]`, `lint` excluding `no-import-prefix`; no
  import map) from the working directory.
- `deno check .` checks every non-test module of the tree: 26 before the `_shared/` move, 22 after it (plan
  180-02's cold counts, each equal to the tracked non-test `.ts` count under `functions/` at that point).
- The check bites: the planted controls of `.planning/phases/180-edge-functions-typecheck-shared-modules/180-CONTROL-LEDGER.md`
  (rows 180-02-1 to -5, all confirmed) turned the root `yarn typecheck` red with `TS2322` for a plant in
  `identity-callback/index.ts`, `_shared/envConfig.ts` and `send-email/index.ts`, stayed green for the same plant
  in an excluded `*.test.ts`, and missed turbo's cache on the planted tree.
- CI: run `43405262494` of `ci-evidence/180-deno` (commit `1ed7c6d28`, this branch's tree without `.planning/`,
  `.bg-shell/` and two spike captured outputs), job `frontend-and-shared-module-validation` concluded `success`.
  Its "Type-check all packages" step shows the `@openvaa/supabase:typecheck` task with 22 `Check` lines (one per
  non-test module of the evidence tree) and 23 `Download https://registry.npmjs.org/` lines, so it ran from a cold
  Deno cache.
- **D-07 overrules this todo's suggestion of pinning Deno to the edge runtime's version (2.1.4).** The checker is
  Deno 2.9.6 (TypeScript 6.0.3); the deployed runtime is `supabase/edge-runtime:v1.76.2`, which embeds Deno 2.1.4.
  That both accept this code is an observation about this code, not a guarantee; the runtime-side checks are the
  bundle-and-serve pass of `180-verify-bundles.sh` (every function bundles and answers `OPTIONS` 200 standalone)
  and the E2E runs.
