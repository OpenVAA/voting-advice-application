# Phase 141 — Deferred Items

Out-of-scope discoveries made during execution. Logged, not fixed.

## Pre-existing prettier drift (found in plan 141-03 task 1)

`yarn format` (`prettier --write .`), run to format the new `scripts/assert-unit-test-coverage.mjs`,
also reformatted two files unrelated to this phase:

- `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts` (one call re-joined onto a
  118-char line)
- `tests/README.md` (opt-in project table re-aligned)

Both were committed in a state the current prettier config does not produce, so `yarn format:check`
was already failing at HEAD `28cf7eb3d` for reasons predating this phase. Reverted by targeted
`git checkout --` of those two paths; NOT fixed here (scope boundary). A standalone
`yarn format` sweep is the right home for it.
