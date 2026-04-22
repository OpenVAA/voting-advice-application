---
phase: 56-generator-foundations-plumbing
plan: 03
subsystem: testing
tags: [dev-seed, zod, zod-v4, faker, faker-v10, template, ctx, answer-emitter, types]

# Dependency graph
requires:
  - phase: 56-generator-foundations-plumbing
    provides: "@openvaa/dev-seed workspace scaffold (Plan 01)"
provides:
  - "TemplateSchema + validateTemplate (TMPL-01, TMPL-02, TMPL-09)"
  - "Template TS type via z.infer<> (D-16, D-17)"
  - "Ctx interface + buildCtx factory (D-07, D-27) with seeded faker, bootstrap refs, answerEmitter seam"
  - "defaultRandomValidEmit — covers all 9 question_type enum variants (D-19, D-20)"
  - "AnswerEmitter function-pointer seam type (D-27) — Phase 57 plugs latent emitter here"
  - "Fragment<TRow> + Overrides public type contracts (D-25) exposed via types.ts barrel"
affects:
  - "Wave 3 generators (Plans 05/06/07) — import Ctx, Fragment, defaultRandomValidEmit"
  - "Plan 04 writer/pipeline — import validateTemplate, buildCtx, Overrides"
  - "Phase 57 latent-factor emitter — plugs into ctx.answerEmitter using AnswerEmitter seam"
  - "Phase 57/58 template extensions — extend TemplateSchema via `.extend()` (NOT `.merge()`)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod v4 declarative schema with every field `.optional()` (D-18); defaults live in per-generator `defaults(ctx)`, not in the schema"
    - "Zod v4 validator using `safeParse()` + `result.error.issues[].path` for field-path errors (TMPL-09)"
    - "Faker Pattern A: construct fresh `new Faker({ locale: [en] })` per pipeline run, seed via `.seed(n)` on the instance (NOT module-level `faker.seed()`)"
    - "Answer-emitter seam as single function pointer on ctx (D-27) — no interface ceremony; Phase 57 extension is one-line assignment"
    - "Exhaustiveness guardrail via `const _exhaustive: never = type` in switch default — compile-time catches new DB enum variants"
    - "Shared types barrel (`types.ts`) re-exports Ctx/AnswerEmitter/Template from their canonical modules so generators import from one place"

key-files:
  created:
    - "packages/dev-seed/src/template/schema.ts (TemplateSchema + validateTemplate)"
    - "packages/dev-seed/src/template/types.ts (Template TS type via z.infer<>)"
    - "packages/dev-seed/src/template/index.ts (template module barrel)"
    - "packages/dev-seed/src/ctx.ts (Ctx interface + buildCtx factory)"
    - "packages/dev-seed/src/emitters/answers.ts (defaultRandomValidEmit + AnswerEmitter seam)"
    - "packages/dev-seed/src/types.ts (Fragment<TRow> + Overrides + shared type barrel)"
  modified: []

key-decisions:
  - "Zod schema is declarative-only: no `.default()` calls; every field `.optional()`. Defaults centralize in per-generator `defaults(ctx)` methods (D-08)."
  - "Faker seeded per-instance (not module-level) — plan's `new Faker({ seed })` signature is not a supported API in @faker-js/faker v10; `.seed()` on the fresh instance achieves the same determinism without global state."
  - "`defaultRandomValidEmit` uses a function declaration (not a const arrow) to satisfy the repo-wide `func-style: declaration` ESLint rule; the AnswerEmitter seam contract is enforced via a `const _typecheckDefaultEmit: AnswerEmitter = defaultRandomValidEmit` compile-time assertion."
  - "Exhaustiveness guardrail on question_type via `const _exhaustive: never = type` — fires at compile time if the DB enum gains a new variant (e.g. when Phase 58 adds anything question-shaped)."
  - "Shared types module (`types.ts`) does NOT own type definitions — only re-exports. `Ctx` stays in `ctx.ts`, `AnswerEmitter` stays in `emitters/answers.ts`, `Template` stays in `template/types.ts`. This avoids circular-import hazards."

patterns-established:
  - "Pattern A Faker seeding: `const faker = new Faker({ locale: [en] }); faker.seed(template.seed ?? 42);` — per-run fresh instance"
  - "Zod validator returns typed value or throws formatted error: `template.<path>: <message>` lines"
  - "Emitter seam as optional function pointer on ctx (not an interface) — extension point is `ctx.answerEmitter = myEmitter`"
  - "Shared types barrel re-exports canonical types via `export type { ... } from './source'`"

requirements-completed: [TMPL-01, TMPL-02, TMPL-08, TMPL-09, NF-03]

# Metrics
duration: 8m
completed: 2026-04-22
---

# Phase 56 Plan 03: Template Schema + Ctx + Emitter + Types Summary

**Zod v4 TemplateSchema + `Template` (via z.infer<>) + seeded-faker Ctx factory + `defaultRandomValidEmit` across all 9 question_type variants + AnswerEmitter seam for Phase 57 — Wave 3 generators can now import their type surface from one place.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-22T14:02:31Z
- **Completed:** 2026-04-22T14:10:43Z
- **Tasks:** 3
- **Files created:** 6
- **Files modified:** 0

## Accomplishments

- Declarative Zod v4 template schema with 12 optional per-entity fragments (+ 3 top-level optionals: `seed`, `externalIdPrefix`, `projectId`). `{}` passes validation (TMPL-02); invalid input emits `template.<path>: <message>` errors via `result.error.issues[].path` (TMPL-09).
- `Ctx` interface captures D-07 fields (seeded `faker`, `projectId`, `externalIdPrefix`, 14-key `refs` map, no-op `logger`) + D-27 seam (`answerEmitter?: AnswerEmitter`). `buildCtx(template)` constructs a fresh `Faker` per pipeline run (Pattern A) and prefills `accounts`/`projects` refs from seed.sql bootstrap UUIDs.
- `defaultRandomValidEmit` covers every `question_type` enum variant (text, number, boolean, date, image, multipleText, singleChoiceOrdinal, singleChoiceCategorical, multipleChoiceCategorical) with shape-valid output using only `ctx.faker` (no module-level faker). Exhaustiveness-checked via `const _exhaustive: never`.
- Shared types barrel (`types.ts`) exposes `Ctx`, `AnswerEmitter`, `Template`, `Fragment<TRow>`, and `Overrides` (D-25) from one canonical path.
- Determinism verified by smoke test: `buildCtx({seed:42}).faker.number.int(...)` produces the same value across runs.

## Task Commits

Each task was committed atomically:

1. **Task 1: Template schema + type + barrel** — `48562f485` (feat)
2. **Task 2: Ctx factory + shared types module** — `8d7e0b819` (feat)
3. **Task 3: defaultRandomValidEmit answer emitter** — `6887d86ee` (feat)

## Files Created/Modified

- `packages/dev-seed/src/template/schema.ts` — Zod `TemplateSchema` + `validateTemplate` with field-path errors
- `packages/dev-seed/src/template/types.ts` — `Template` TS type (`z.infer<typeof TemplateSchema>`)
- `packages/dev-seed/src/template/index.ts` — barrel re-exporting schema + type
- `packages/dev-seed/src/ctx.ts` — `Ctx` interface + `buildCtx(template)` factory (seeded faker Pattern A, bootstrap refs, answerEmitter seam)
- `packages/dev-seed/src/emitters/answers.ts` — `AnswerEmitter` seam type + `defaultRandomValidEmit` function covering all 9 question_type enum variants with exhaustiveness guardrail
- `packages/dev-seed/src/types.ts` — shared types barrel (`Fragment<TRow>`, `Overrides`, re-exports of `Ctx`/`AnswerEmitter`/`Template`)

## Decisions Made

- **Schema stays declarative:** No `.default()` calls in the zod schema; defaults live in per-generator `defaults(ctx)` methods per D-08. Keeping the schema declarative means Phase 57/58 extensions via `.extend()` do not have to navigate around per-field default overrides.
- **Faker seeded per-instance:** The plan's `new Faker({ seed })` call isn't a valid @faker-js/faker v10 signature. Using `new Faker({ locale: [en] })` + `faker.seed(n)` on the fresh instance achieves the same determinism without reintroducing the module-level shared-state trap that RESEARCH §5 warns against (Pitfall 4).
- **Function declaration for `defaultRandomValidEmit`:** The repo-wide `func-style: declaration` ESLint rule forbids `export const fn: Type = (...) => {...}` form. Switched to `export function defaultRandomValidEmit(...)` with a compile-time `const _typecheckDefaultEmit: AnswerEmitter = defaultRandomValidEmit` to preserve the seam contract.
- **Exhaustiveness via `never`:** Added `const _exhaustive: never = type` in the switch default so any future DB enum addition surfaces at compile time — not as a silent null-return path (D-21 forward-compat for Phase 57/58).
- **Types barrel re-exports only:** `types.ts` does NOT own canonical definitions — it re-exports from `ctx.ts` / `emitters/answers.ts` / `template/types.ts` to avoid circular-import hazards while still giving consumers a single import path (reduces code churn in Wave 3/4).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Corrected `new Faker` API usage**
- **Found during:** Task 2 (Ctx factory)
- **Issue:** Plan template and acceptance criterion specified `new Faker({ locale: [en], seed: template.seed ?? 42 })`. The `@faker-js/faker` v10 `Faker` constructor does not accept a `seed` option (typecheck TS2769: "Object literal may only specify known properties, and 'seed' does not exist in type..."). Seeding is done via `.seed()` post-construction.
- **Fix:** Split the two-step init: `const faker = new Faker({ locale: [en] }); faker.seed(template.seed ?? 42);` on a fresh per-run instance. Pattern A (per-run fresh instance + explicit seed) is preserved — the RESEARCH §5 Pitfall 4 against *module-level* `faker.seed()` still stands because we are not mutating a shared singleton.
- **Files modified:** `packages/dev-seed/src/ctx.ts`
- **Verification:** typecheck clean, lint clean; smoke test `buildCtx({seed:42}).faker.number.int({min:0,max:100})` returns `37` repeatably across runs, `buildCtx({seed:7})` returns a different value.
- **Committed in:** `8d7e0b819` (Task 2 commit)

**2. [Rule 3 — Blocking] ESLint `func-style: declaration` forbids const-arrow export for `defaultRandomValidEmit`**
- **Found during:** Task 3 (answer emitter)
- **Issue:** Plan specified `export const defaultRandomValidEmit: AnswerEmitter = (...) => {...}`. The repo-wide shared eslint config (`packages/shared-config/eslint.config.mjs` line 84) sets `'func-style': ['error', 'declaration', { allowArrowFunctions: false }]`, which rejects that form.
- **Fix:** Converted to a named function declaration (`export function defaultRandomValidEmit(...)`) with a compile-time assertion `const _typecheckDefaultEmit: AnswerEmitter = defaultRandomValidEmit; void _typecheckDefaultEmit;` to preserve the D-27 seam contract — if the signature ever drifts from `AnswerEmitter`, TypeScript reports at the assertion, not at a far-away call site.
- **Files modified:** `packages/dev-seed/src/emitters/answers.ts`
- **Verification:** lint clean, typecheck clean; smoke test covers all 9 question_type variants via `defaultRandomValidEmit` and shows shape-valid output.
- **Committed in:** `6887d86ee` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both deviations preserve the plan's design intent (Pattern A faker, D-27 seam) — they only adjust the mechanical wiring to match real library / tooling constraints. No scope creep; no architectural change.

## Issues Encountered

- Circular type imports between `ctx.ts` (imports `AnswerEmitter` type) and `emitters/answers.ts` (imports `Ctx` type) meant that committing ctx.ts in Task 2 without answers.ts would leave the package in a transiently broken typecheck state. Resolved by keeping the commits atomic per task but running full-package typecheck only after all three files exist. Because TypeScript's `import type` erases at runtime, the type-only circular dep is correct TS — it only affects commit-time verification, not runtime.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 3 generators (Plans 05/06/07) can now `import type { Ctx, Fragment } from '../types'` and `import { defaultRandomValidEmit } from '../emitters/answers'`.
- Plan 04 (pipeline + writer) can `import { validateTemplate } from './template'`, `import { buildCtx } from './ctx'`, and `import type { Overrides } from './types'`.
- Phase 57 latent-factor emitter plugs into the seam via `ctx.answerEmitter = latentEmit` — no changes to candidate generator required.
- Phase 57/58 template extensions via `TemplateSchema.extend({...})` (NOT `.merge()`, which is deprecated in zod v4).

---
*Phase: 56-generator-foundations-plumbing*
*Completed: 2026-04-22*

## Self-Check: PASSED

Verified:
- All 6 source files exist on disk (`template/schema.ts`, `template/types.ts`, `template/index.ts`, `ctx.ts`, `emitters/answers.ts`, `types.ts`)
- All 3 task commits present in git log (`48562f485`, `8d7e0b819`, `6887d86ee`)
- `yarn workspace @openvaa/dev-seed typecheck` exits 0
- `yarn workspace @openvaa/dev-seed lint` exits 0
- Smoke tests: `validateTemplate({})` returns an object; `buildCtx({})` returns projectId `00000000-0000-0000-0000-000000000001` + prefix `seed_` + 1 bootstrap account ref; `defaultRandomValidEmit` produces shape-valid values for all 9 question_type variants; determinism check shows same `faker.number.int()` output across equal-seed runs.
