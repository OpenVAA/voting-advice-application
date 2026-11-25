# Lens: Incremental changes and data-structure rot · ID prefix `ROT`

**Applies when** the PR changes an existing type, interface, union, enum or schema: a TypeScript type, the `StaticSettings` / `DynamicSettings` shapes or per-project `app_settings`, a jsonb column or localized-content shape, a class or interface in `@openvaa/data`, the generated `@openvaa/supabase-types`, the dev-seed template schema, or a logical predicate or flag set.

## List

Each incremental change as _structure_ → _what was added or changed_ → _why (per the PR)_. Include new optional fields, new union members, new boolean flags, new special-case branches in existing predicates, and new fallbacks for old shapes.

## Evaluate (criterion slugs)

- `rot-patchwork`: the addition makes the structure harder to reason about when a fuller refactor would make it simpler. Signs: a second boolean that only makes sense combined with the first (a missing enum); an optional field valid only when another field has a certain value (a missing discriminated union); an `if (special case)` at the top of a general predicate; a flag set that encodes a state machine. Propose the refactored shape concretely, and say what it would cost now. Nothing is deployed yet, so a `?? legacyDefault` or other back-compat fallback has no reader to protect and is pure rot.
- `rot-consumer-audit`: when a shared shape changed, were **all** consumers updated? Grep at `$HEAD_SHA` and list any missed, across:
  - the generated types (`yarn db:types` regenerates `packages/supabase-types/`) and the `COLUMN_MAP` / `PROPERTY_MAP` row mapping;
  - the Supabase adapter and server-side adapters;
  - dev-seed templates and generators (`packages/dev-seed/src/`);
  - the settings defaults in `dynamicSettings.ts` / `staticSettings.ts` and their readers;
  - the docs that describe the shape.
- `rot-predicate-duplication`: a predicate extended in one place while a twin elsewhere was not (`G-single-source`).

## Where to look

`packages/app-shared/src/settings/`, `packages/app-shared/src/data/`, `packages/data/src/objects/`, `packages/supabase-types/`, `packages/dev-seed/src/templates/`, `apps/frontend/src/lib/api/adapters/supabase/utils/`.

## Promote to

`.agents/code-review-checklist.md`; `.claude/skills/data/SKILL.md`; `.claude/skills/database/SKILL.md`.
