# `tests/vitest.config.ts` runs in no automated command

**Filed:** 2026-08-27 (Phase 147 validation audit, residue R1)
**Scope:** pre-existing — NOT introduced by Phase 147

## The hole

`tests/vitest.config.ts` declares `include: ['tests/utils/**/*.test.ts']` and three test files sit
under it:

- `tests/tests/utils/preflight.test.ts`
- `tests/tests/utils/tcpForward.test.ts`
- `tests/tests/utils/buildTestIdToken.test.ts`

None of them is executed by any standing command:

- `vitest.workspace.ts` is `['packages/**/vitest.config.ts']` — `tests/` is not matched.
- `yarn test:unit` is `yarn assert:unit-coverage && turbo run test:unit`; `tests/` has no
  `package.json`, so it is not a workspace and turbo never reaches it.
- `scripts/assert-unit-test-coverage.mjs` scans `WORKSPACE_ROOTS = ['packages', 'apps']` only, so
  the guard that exists precisely to catch "tests that no CI command executes" is structurally
  blind to this directory.
- CI (`.github/workflows/main.yaml`) runs `yarn test:unit` and `yarn test:e2e`. Neither reaches them.

The config's own docblock says as much ("this config is NOT yet listed in the root
`vitest.workspace.ts`") and directs authors to run it by hand — which is the non-guard shape
`assert-unit-test-coverage.mjs`'s docblock argues against.

## Why it matters

Per `CLAUDE.md`, a "did not run" test counts as a **failure**. Three test files currently imply a
coverage that no automated run delivers, and nothing in the tree distinguishes a wired tree from an
unwired one — the exact incident `assert-unit-test-coverage.mjs` was written for after five
`packages/*` workspaces held 18 files and 140 tests that CI never executed.

This directly shaped the Phase 147 validation audit: both new guards were placed in `scripts/` and
wired into `test:e2e` + `lint:check` rather than added as vitest tests here, because a guard placed
here would not run.

## Possible fixes (not yet decided)

1. Add `tests/vitest.config.ts` to `vitest.workspace.ts` and add a root script that runs it — the
   smallest change, but `vitest.workspace.ts`'s glob shape would need widening.
2. Give `tests/` a `package.json` with a `test:unit` script so turbo and the coverage guard both
   reach it — the most consistent with the rest of the monorepo, but it makes `tests/` a workspace.
3. Extend `WORKSPACE_ROOTS` in `scripts/assert-unit-test-coverage.mjs` to cover non-workspace test
   roots, so at minimum the hole fails loudly instead of staying invisible.

Option 3 is worth doing regardless of which of 1/2 is chosen: it is what makes the *next* instance
of this visible.

## References

- `.planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-VALIDATION.md` § Residue R1
- `scripts/assert-unit-test-coverage.mjs` (docblock — the incident and the two-direction invariant)
- `tests/vitest.config.ts` (docblock — states the gap in its own words)
