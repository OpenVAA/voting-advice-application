---
created: 2026-08-23T17:30:00.000Z
title: 69 spec files across 8 packages sit outside the repo typecheck gate, by two different exclusion mechanisms
area: packages
files:
  - packages/argument-condensation/tsconfig.json
  - packages/filters/tsconfig.json
  - packages/llm/tsconfig.json
  - packages/matching/tsconfig.json
  - packages/question-info/tsconfig.json
  - packages/app-shared/tsconfig.json
  - packages/core/tsconfig.json
  - packages/data/tsconfig.json
related:
  - 2026-08-22-frontend-lint-script-covers-only-src.md
filed_by: Phase 144 (144-07), as residue RES-12
---

## Measurement (taken at HEAD `47ee50054`, 2026-08-23 — not a description)

`144-06` made `TURBO_FORCE=true npx turbo run typecheck` a blocking gate (root `lint:check` + a named
CI step). **What that gate type-checks is decided per package, by each package's own tsconfig, and
most of them exclude their tests.**

**12** packages declare a `typecheck` script — `apps/docs`, `apps/frontend`, and `packages/{app-shared,
argument-condensation, core, data, dev-seed, dev-tools, filters, llm, matching, question-info}`. That
agrees exactly with `144-RESEARCH.md:1372` B-15. **11 are beyond `dev-seed`.**

⚠ **The count 11 is right; the description carried by `144-CONTEXT.md:75` and `:471` — "the 11
packages whose `tests/` sit outside their own tsconfig `include`" — is not.** Re-measured:

| Mechanism | Packages | Spec files outside the gate |
|---|---|---|
| Has a `tests/` dir and **explicitly `exclude`s** it | **5** — `argument-condensation`, `filters`, `llm`, `matching`, `question-info` | **16** |
| No `tests/` dir; excludes **co-located** specs with `"exclude": ["**/*.test.ts"]` | **3** — `app-shared` (3), `core` (3), `data` (47) | **53** |
| **Total** | **8** | **69** |

The other 3 of the 11 (`apps/docs`, `apps/frontend`, `dev-tools`) are not in this class:
`apps/frontend` has no `include` key at all and carries its own `svelte-check` gate, `apps/docs` has
no tests, `dev-tools` has none either.

`packages/dev-seed` is the **only** workspace whose include is
`["src/**/*", "tests/**/*", "scripts/**/*"]` — Phase 144 made it so, and the pair of ledger rows
`G-OLD` / `G-NEW` is what proved it matters: under the narrow `["src/**/*"]` a deliberate type error
in `tests/` exited **0**.

## Why this is worth doing

Widening `dev-seed`'s include **immediately surfaced three `as unknown as` casts nothing had ever
looked at, two of them working counter-examples to TMPL-01 inside the package that owns it**
(removed in `64b728c97`). There is no reason to expect the other eight packages to be cleaner; that
is the measured basis for expecting a return, not an assumption.

## Deliberately deferred by Phase 144

D-06 adopted the repo-wide gate; the per-package `include` audit was explicitly out of scope. Doing it
here would have moved a baseline six later plans in the same phase compare against.

## Suggested approach

Per package, widen `include` (or drop the `exclude`), run
`TURBO_FORCE=true npx turbo run typecheck --filter=<pkg>`, and fix what surfaces — one package per
commit, so each package's fallout is separately revertable. Sibling of Phase 143's D-08
lint-script-scope todo.
