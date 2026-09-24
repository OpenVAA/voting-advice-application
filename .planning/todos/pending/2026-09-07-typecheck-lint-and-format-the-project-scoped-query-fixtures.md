# The project-scoped query fixtures are read by no typechecker, linter or formatter

**Filed:** 2026-09-07
**Source:** Phase 161 plan 16 (161-REVIEW.md IN-03, restating the prior review's IN-08)
**Effort:** ~1 plan, mostly configuration

## What

`scripts/fixtures/project-scoped-queries/*.fixture.ts` are TypeScript files that nothing typechecks,
nothing lints and nothing formats:

- `scripts/` is not a Yarn workspace, so `turbo run typecheck` never reaches it.
- There is no root `tsconfig.json` that includes it.
- `.prettierignore` excludes `scripts/fixtures/`.

The four fixtures now carry more than forty hand-authored call shapes between them, and the guard's
self-test asserts EXACT counts over all four. Those counts are the phase's whole precision mechanism,
and they depend on the fixtures being what they claim to be — a mistyped member, a missing brace or a
stray character changes what the matchers read with nothing but the counts to notice.

## Why it is not done here

Plan 161-16 does not touch the fixtures at all; its file set is the gate spec, the guard's docblock
and `.gitignore`. Adding a tsconfig for `scripts/` and wiring it into `lint:check` is a build-config
change affecting every file under `scripts/`, not only these four, and it will surface pre-existing
errors in sibling `assert-*.mjs` helpers that have never been typechecked either — which is a
worthwhile sweep and a different one.

## What would make it worth doing

A count moving for a reason nobody can explain. The failure mode is quiet: the guard reports the
number it reports, and a malformed fixture looks exactly like a matcher that stopped matching. It is
also cheap insurance now that the counts are load-bearing in three places (the self-test, the family
tally, and the per-message exact counts).

## Scope when picked up

1. Add `scripts/fixtures/tsconfig.json` with `noEmit`, `strict`, and no `lib.dom`, including only the
   fixture directory.
2. Wire it beside `typecheck:tests` in the root `package.json`, so it is a link of the `lint:check`
   chain rather than a command somebody has to remember.
3. Remove `scripts/fixtures/` from `.prettierignore`, or state in each fixture's docblock that the
   guard's regexes are its only reader — the point is that the answer is written down either way.
4. Expect the fixtures to need small repairs: they are written to be READ as text and have never been
   compiled, so some shapes may not typecheck as written. A shape that has to change is a shape whose
   self-test count has to be re-measured, not adjusted.
