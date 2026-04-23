---
phase: 58-templates-cli-default-dataset
plan: 03
subsystem: testing
tags: [dev-seed, zod-v4, faker, locale-fan-out, determinism, jsonb, pitfall-1, tdd]

# Dependency graph
requires:
  - phase: 56-generator-foundations-plumbing
    provides: TemplateSchema / validateTemplate / `.extend()` composition pattern; per-entity fragment shape; buildCtx seed plumbing
  - phase: 57-latent-factor-answer-model
    provides: latent block anchor point on TemplateSchema (preserved exactly via trailing `.extend({ latent: latentBlock.optional() })`)
provides:
  - Template schema field `generateTranslationsForAllLocales: boolean` (optional, top-level) — TMPL-07
  - `fanOutLocales(rows, template, seed)` utility at packages/dev-seed/src/locales.ts — post-generation JSONB locale expansion
  - `LOCALES` constant (hardcoded `['en', 'fi', 'sv', 'da']`) + `LocaleCode` type (Pitfall #1 order lock)
  - Expanded JSDoc on `Template` type covering every field, per-entity fragments, worked mixing example (D-58-18)
  - Barrel re-exports from @openvaa/dev-seed: `fanOutLocales`, `LOCALES`, `LocaleCode`
affects: [58-06 default template, 58-08 e2e template, 58-09 integration test, 58-07 pipeline wiring]

# Tech tracking
tech-stack:
  added: []  # No new deps — uses already-resolved @faker-js/faker v8.4.1 locale packs
  patterns:
    - "Pitfall #1 determinism discipline: hardcode iteration order arrays, never derive from Object.keys() or supportedLocales"
    - "Per-locale Faker factory (Pattern A, RESEARCH §5): fresh instance per call, seed differs per locale (+0/+1/+2/+3) so locales produce distinct output while run stays deterministic"
    - "JSDoc-as-IDE-contract (D-58-18): every top-level schema field is documented on the TS type so editor hover reveals what each knob does"
    - "Schema extension via `.extend()` at the END of the object chain (zod v4 idiom from Phase 56/57); new fields added inside the base `.object()` literal"

key-files:
  created:
    - packages/dev-seed/src/locales.ts
    - packages/dev-seed/tests/locales.test.ts
  modified:
    - packages/dev-seed/src/template/schema.ts
    - packages/dev-seed/src/template/types.ts
    - packages/dev-seed/src/index.ts
    - packages/dev-seed/tests/template.test.ts

key-decisions:
  - "Per-locale seed offsets (+0/+1/+2/+3) make fi/sv/da/en produce visibly distinct outputs at a single seed input, while preserving byte-identical determinism across runs"
  - "LOCALIZED_FIELDS inventory lives in locales.ts as a hardcoded map per table — not derived from a schema walk — so plans 06/08/09 have a single canonical source for which JSONB columns get fanned out"
  - "fanOutLocales mutates rows in-place (no deep clone) — documented in JSDoc; threat model T-58-03-01 accepts this (pipeline owns the rows; a frozen input would throw but that never occurs in the pipeline)"
  - "Function-level early-return (`if (... !== true) return rows`) makes opt-out the cheapest path; Phase 56/57 determinism tests run on `{}` templates and are thus untouched"

patterns-established:
  - "Opt-in locale expansion: templates declare `generateTranslationsForAllLocales: true`; utility runs AFTER generators, BEFORE writer.bulk_import. Default template (06) sets true; e2e template (08) sets false per D-58-16"
  - "Field-type dispatch for generator output: `short_name` → buzzNoun, `info` → lorem.sentence, `name` + fallback → company.name — synthetic fillers keyed on the field name, not semantic translation"
  - "Plain-text columns (candidates.first_name, last_name) are structurally single-valued and NOT fanned out — typeof 'string' check skips them even if listed"
  - "Three iteration orders locked for NF-04: table order (alphabetical within LOCALIZED_FIELDS), field order (authored list per table), locale order (LOCALES constant). No Object.keys(row), no .sort()"

requirements-completed: [TMPL-07, NF-04]

# Metrics
duration: 5 min (generator work) + recovery session for SUMMARY
completed: 2026-04-23
---

# Phase 58 Plan 03: Locale Fan-out + Schema Extension Summary

**TMPL-07 template flag + `fanOutLocales()` utility that expands `{ en: '...' }` JSONB fields to `{ en, fi, sv, da }` using per-locale Faker instances with hardcoded iteration order (NF-04 Pitfall #1 compliance)**

## Performance

- **Duration:** ~5 min (original TDD work) + recovery SUMMARY session
- **Started:** 2026-04-23T07:38:32Z (first RED commit)
- **Completed:** 2026-04-23T07:42:25Z (last GREEN commit); SUMMARY written 2026-04-23 in recovery session
- **Tasks:** 2 (both TDD: RED + GREEN commits per task, no refactor needed)
- **Files changed:** 6 (2 created, 4 modified); +447 / -3 lines

## Accomplishments

- Extended `TemplateSchema` with `generateTranslationsForAllLocales: z.boolean().optional()` inside the base `.object()` literal — trailing `.extend({ latent: ... })` preserved verbatim (zod v4 idiom, Phase 56/57 pattern).
- Replaced sparse Template JSDoc (13 lines) with a comprehensive 86-line block covering every top-level field (`seed`, `externalIdPrefix`, `projectId`, `generateTranslationsForAllLocales`, `latent`), per-entity fragment shape, and a worked synthetic+hand-authored mixing example (D-58-18).
- Shipped `packages/dev-seed/src/locales.ts` — pure-function `fanOutLocales(rows, template, seed)` that walks `LOCALIZED_FIELDS` per-table inventory and expands JSONB locale keys using four per-locale Faker instances. No-op when flag is undefined/false.
- Hardcoded `LOCALES = ['en', 'fi', 'sv', 'da'] as const` + `LocaleCode` type; three iteration orders (tables, fields, locales) locked to preserve NF-04 determinism (Pitfall #1).
- Barrel exports from `@openvaa/dev-seed`: `fanOutLocales`, `LOCALES` (runtime), `LocaleCode` (type). Plans 06, 08, 09 can now import the surface.
- 11 new unit tests (4 template schema + 11 locales — 10 in plan + 1 bonus for distinct-seed assertion). All green; full dev-seed suite (235 tests, 29 files) green with zero regressions.

## Task Commits

Each TDD task produced RED + GREEN commits (no REFACTOR commits — both implementations passed first-green with no clean-up needed):

1. **Task 1 RED: schema field tests** — `cdaea606a` (test)
2. **Task 1 GREEN: schema field + Template JSDoc** — `0efea9635` (feat)
3. **Task 2 RED: fanOutLocales tests** — `9e9fbb1a6` (test)
4. **Task 2 GREEN: fanOutLocales implementation + barrel export** — `3f274c1a9` (feat)

**Plan metadata commit:** pending (this SUMMARY.md, written in recovery session)

_TDD gate compliance: both tasks followed RED → GREEN. Confirmed via `git log` — `test(58-03)` commit precedes `feat(58-03)` commit for each task._

## Files Created/Modified

- **`packages/dev-seed/src/locales.ts`** (NEW, 185 lines) — `fanOutLocales` utility; `LOCALES` constant; `LOCALIZED_FIELDS` per-table inventory; `makeLocaleFaker` factory; Pitfall #1 discipline documentation.
- **`packages/dev-seed/tests/locales.test.ts`** (NEW, 147 lines) — 11 unit tests covering LOCALES order, opt-out (undefined/false), opt-in 4-locale expansion, pre-existing key preservation, plain-text column skip, non-localized field skip, inventory coverage, and determinism (same seed = byte-identical, different seed = different output).
- **`packages/dev-seed/src/template/schema.ts`** (+14 lines) — `generateTranslationsForAllLocales: z.boolean().optional()` added inside the base `.object()` literal with inline JSDoc referencing TMPL-07, D-58-04, D-58-16.
- **`packages/dev-seed/src/template/types.ts`** (-13 / +80 lines) — Template TS type export unchanged (`z.infer<typeof TemplateSchema>`); JSDoc expanded from 13 to 86 lines covering every field with worked example (D-58-18).
- **`packages/dev-seed/src/index.ts`** (+2 lines) — Added `export { fanOutLocales, LOCALES } from './locales';` and `export type { LocaleCode } from './locales';` to respective alphabetical barrel sections.
- **`packages/dev-seed/tests/template.test.ts`** (+22 lines) — 4 new tests appended to existing `describe('validateTemplate')` block for the TMPL-07 field (accept true, accept false, reject non-boolean with field path, `{}` still passes). Existing 7 tests unmodified.

## Decisions Made

- **Per-locale seed offsets** (`en=seed, fi=seed+1, sv=seed+2, da=seed+3`): without offsets every locale's Faker produced identical outputs (faker is purely deterministic given the seed). Offsets make locales visually distinct while preserving byte-identical determinism across calls at the same top-level seed. Documented in the JSDoc on `fanOutLocales`.
- **Hardcoded LOCALIZED_FIELDS map rather than derived from schema**: RESEARCH §5 identified nine tables with localized JSONB columns out of twelve. A runtime schema walk would re-derive this on every fan-out; hardcoding makes the inventory explicit, auditable, and order-stable.
- **No REFACTOR commits**: both GREEN implementations were clean on first pass (the plan's `<action>` blocks were specified in full-file detail). No third commit per task was needed; documented here in case the TDD gate checker expects `refactor(58-03)` commits — none exist and none are required.

## Deviations from Plan

**None — plan executed exactly as specified.**

The plan's `<action>` blocks provided complete file contents for both tasks; implementation followed them verbatim. Acceptance criteria greps all match:

- `grep -q "generateTranslationsForAllLocales: z.boolean().optional()"` — PASS
- `grep -q "extend.*latent: latentBlock.optional()"` (Phase 57 trailing extend preserved) — PASS
- `wc -l packages/dev-seed/src/template/types.ts` = 86 (>= 70 required) — PASS
- `grep -c "TMPL-\|D-58-\|NF-04"` on types.ts = 7 (>= 6 required) — PASS
- `grep -q "z.infer<typeof TemplateSchema>"` on types.ts — PASS
- `grep -q "export const LOCALES = \['en', 'fi', 'sv', 'da'\] as const"` on locales.ts — PASS
- `grep -q "export function fanOutLocales"` on locales.ts — PASS
- `grep -q "Pitfall #1"` on locales.ts — PASS (documented in module header)
- `grep -q "LOCALIZED_FIELDS"` on locales.ts — PASS
- `grep -q "export { fanOutLocales, LOCALES } from './locales'"` on index.ts — PASS
- `grep -q "export type { LocaleCode } from './locales'"` on index.ts — PASS
- `yarn workspace @openvaa/dev-seed test:unit tests/template.test.ts` — 11 passed (7 existing + 4 new)
- `yarn workspace @openvaa/dev-seed test:unit tests/locales.test.ts` — 11 passed (10 in plan + 1 bonus: different seeds produce different output — additional confidence for distinct-seed assertion; still within plan intent)
- `yarn workspace @openvaa/dev-seed test:unit` (full suite) — 235 passed across 29 files, zero regressions
- `yarn workspace @openvaa/dev-seed typecheck` — exit 0
- `npx eslint` on all plan-modified files — clean (exit 0)

## Issues Encountered

- **Recovery from API stream timeout (not a code issue).** The original executor agent completed both TDD tasks with four atomic commits (`cdaea606a` → `0efea9635` → `9e9fbb1a6` → `3f274c1a9`) but hit an upstream API stream timeout before it could write this SUMMARY.md. A recovery agent was spawned to verify the four commits, re-run all tests (still green), verify determinism twice (locales.test.ts passes byte-identically across runs), and author this SUMMARY.md. No code was changed in the recovery session — only this file was added and committed.
- **Worktree branch-base mismatch during recovery.** The recovery worktree was created on a different base branch (`worktree-agent-a78456cb` off `feat-gsd-roadmap` HEAD `9e0399286`) rather than off the prior agent's HEAD. Resolved with `git reset --hard 3f274c1a9` to inherit the four plan 58-03 commits, then `yarn install` to set up `node_modules` in the fresh worktree. Verified via `git log` that HEAD is `3f274c1a9` (last GREEN commit).

## User Setup Required

None — pure library code, no env-vars, no external services.

## Next Phase Readiness

- **Plan 58-06 (default template):** can now set `generateTranslationsForAllLocales: true` in the shipped default template; pipeline wiring (Plan 58-07) will invoke `fanOutLocales(rows, template, ctx.faker.seed)` between `runPipeline` output and the writer.
- **Plan 58-08 (e2e template):** can now set `generateTranslationsForAllLocales: false` (or omit it) per D-58-16 — Playwright specs run single-locale and bypass the ~3000-iteration fan-out walk.
- **Plan 58-09 (integration test):** can now `import { fanOutLocales, LOCALES } from '@openvaa/dev-seed'` and assert `Object.keys(elections[0].name).sort()` equals `['da', 'en', 'fi', 'sv']` after full pipeline execution.
- **Plan 58-07 (pipeline wiring):** has a documented insertion point — `fanOutLocales` runs after `runPipeline` produces rows and before `Writer.bulk_import(rows)` flushes to Postgres. No pipeline changes required by THIS plan — that integration is Plan 07's responsibility.

## Self-Check: PASSED

**File existence:**
- FOUND: `packages/dev-seed/src/locales.ts`
- FOUND: `packages/dev-seed/tests/locales.test.ts`
- FOUND: `packages/dev-seed/src/template/schema.ts` (with new field)
- FOUND: `packages/dev-seed/src/template/types.ts` (with expanded JSDoc)
- FOUND: `packages/dev-seed/src/index.ts` (with new barrel lines)
- FOUND: `packages/dev-seed/tests/template.test.ts` (with 4 new TMPL-07 tests)

**Commit existence (`git log --oneline | grep`):**
- FOUND: `cdaea606a` test(58-03): add failing tests for generateTranslationsForAllLocales field
- FOUND: `0efea9635` feat(58-03): add generateTranslationsForAllLocales schema field + Template JSDoc
- FOUND: `9e9fbb1a6` test(58-03): add failing tests for fanOutLocales utility
- FOUND: `3f274c1a9` feat(58-03): implement fanOutLocales utility with determinism discipline

**Verification command results:**
- `yarn workspace @openvaa/dev-seed test:unit tests/template.test.ts tests/locales.test.ts` → 22 passed, 2 files
- `yarn workspace @openvaa/dev-seed test:unit` → 235 passed, 29 files
- `yarn workspace @openvaa/dev-seed typecheck` → exit 0
- `npx eslint` on all plan-modified files → clean
- Determinism re-verification: `tests/locales.test.ts` run twice, byte-identical output both times (Pitfall #1 compliance)

---
*Phase: 58-templates-cli-default-dataset*
*Plan: 03*
*Completed: 2026-04-23*
