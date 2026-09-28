---
created: 2026-08-23T17:31:00.000Z
title: packages/dev-seed's lint script covers only src/, so all 46 spec files under tests/ are unlinted
area: packages
files:
  - packages/dev-seed/package.json:14
related:
  - 2026-08-22-frontend-lint-script-covers-only-src.md
filed_by: Phase 144 (144-07), as residue RES-13
---

## Measurement (taken at HEAD `47ee50054`, 2026-08-23)

`packages/dev-seed/package.json:14` reads:

```
"lint": "eslint --flag v10_config_lookup_from_file src/"
```

**The script argument, not the eslint config's glob, is what limits the file set** — the same
diagnosis as the `apps/frontend` sibling todo.

`packages/dev-seed/tests/` holds **51** tracked files, **46** of them spec files. **None is linted.**

**Phase 144 added 8 files under that directory and every one of them is unlinted** — verified by
grepping the phase's own gate-2 lint log (`TURBO_FORCE=true yarn lint:check`, exit 0) for each
basename, which returns **0** for all eight:

- `tests/assertKnownRowProps.test.ts`
- `tests/assertKnownRowProps.builtins.test.ts`
- `tests/template/permittedKeys.test.ts`
- `tests/template/linkSentinels.test.ts`
- `tests/template/strictRowTypes.type-test.ts`
- `tests/fixtures/negctl-elections-sentinel.ts`
- `tests/fixtures/negctl-questions-answers.ts`
- `tests/fixtures/negctl-questions-entity-type.ts`

Those files ARE type-checked (Phase 144 widened the tsconfig `include`), so this is specifically a
**lint** gap, not a type gap.

## Deliberately NOT widened by Phase 144

Widening it would move the repo's warning baseline — currently **20** warnings, 15 of them the uniform
unused-`ctx` generator signature in `dev-seed` itself — which six later plans in that phase compared
against. Same class as Phase 143's D-08.

## Caution when doing it

The three `negctl-*.ts` fixtures are **unannotated by construction** — that is what makes each
negative-control pair a pair. A lint autofix that touches them silently converts a control into two
unrelated runs. Add them to an ignore list or verify
`git diff --exit-code -- packages/dev-seed/tests/fixtures` is clean afterwards.
