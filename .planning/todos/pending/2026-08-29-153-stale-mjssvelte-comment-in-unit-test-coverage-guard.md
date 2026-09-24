---
title: "`scripts/assert-unit-test-coverage.mjs`'s header comment still claims `.mjs` matches no lint-staged pattern — falsified by the CFG-08 glob fix"
created: 2026-08-29
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 05
priority: low
suggested_phase: future-build-tooling
keywords: [stale-comment, mjssvelte, lint-staged, assert-unit-test-coverage, REVIEW-CFG-08, comment-hygiene, scripts]
---

# A guard's header comment now asserts the defect plan 05 just fixed

## Origin

Plan `153-05` split the fused `mjssvelte` token in `.lintstagedrc.json`'s first glob
(`9973a2f69`), so `.mjs` files are now matched by lint-staged. A `git grep` for consumers of
that file turned up one in-tree comment that documents the old behaviour as a load-bearing
fact about itself.

`scripts/assert-unit-test-coverage.mjs`, in the header block comment (locate by the sentence
beginning *"This file is deliberately OUTSIDE TypeScript"*, not by line number — Phase 152's
sweep moved these):

> It is also linted by nothing (there is no root `lint` script, and `.lintstagedrc.json`'s
> first glob carries an unseparated `mjssvelte` token so `.mjs` matches no lint-staged
> pattern) — `prettier --write .` via `yarn format` is its only automated formatter.

Both halves of the parenthetical are now false. The token is separated, and the file is
matched by the first glob's `prettier --write` **and** `eslint --fix` tasks. Measured:

```
$ npx eslint --flag v10_config_lookup_from_file scripts/assert-unit-test-coverage.mjs
   61:1   error  Run autofix to sort these imports!   simple-import-sort/imports
  222:9   error  Strings must use singlequote         quotes
  …
EXIT=1
```

So the file is no longer "linted by nothing" — it is linted, and it is red.

## Why filed rather than fixed

Out of the plan's declared scope (`files_modified` names four paths, none in `scripts/`), and
`scripts/` is a live collision surface this wave: `153-01` creates
`scripts/assert-declared-binaries.mjs` and `153-10` creates `scripts/assert-env-pair-registry.mjs`
and `scripts/assert-env-pairs-agree.mjs`.

## Suggested action

Rewrite the parenthetical to state the post-fix reality — there is still no root `lint`
script, but the file is now covered by lint-staged's first glob. Keep it inside the existing
block-comment style; `scripts/assert-comment-hygiene.mjs` is at 1579 files / 0 violations and
must stay there. Best done in the same change that dispositions
`2026-08-29-153-pre-commit-eslint-red-on-mjs-and-apps-docs.md`, since the honest wording
depends on how that is resolved.
