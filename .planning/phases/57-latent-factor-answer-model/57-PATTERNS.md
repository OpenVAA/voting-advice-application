# Phase 57: Latent-Factor Answer Model — Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 19 new + 3 modified = 22 total
**Analogs found:** 22 / 22 (100%)

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `packages/dev-seed/src/emitters/latent/latentTypes.ts` (NEW) | type barrel | transform | `packages/dev-seed/src/types.ts` | exact-role |
| `packages/dev-seed/src/emitters/latent/gaussian.ts` (NEW) | utility (pure helper) | transform | `packages/dev-seed/src/emitters/answers.ts` (`extractChoiceIds` helper shape) | role-match |
| `packages/dev-seed/src/emitters/latent/dimensions.ts` (NEW) | generator-sub-step default | transform (template → config) | `packages/dev-seed/src/emitters/answers.ts` (named default export style) | exact-pattern |
| `packages/dev-seed/src/emitters/latent/centroids.ts` (NEW) | generator-sub-step default | transform (stateful, one-shot) | `packages/dev-seed/src/emitters/answers.ts` (`defaultRandomValidEmit` + `_typecheckDefaultEmit` pattern) | exact-pattern |
| `packages/dev-seed/src/emitters/latent/spread.ts` (NEW) | generator-sub-step default | transform (scalar) | `packages/dev-seed/src/emitters/answers.ts` | exact-pattern |
| `packages/dev-seed/src/emitters/latent/positions.ts` (NEW) | generator-sub-step default | transform (per-candidate) | `packages/dev-seed/src/emitters/answers.ts` (`emitValueFor` per-row dispatch) | role-match |
| `packages/dev-seed/src/emitters/latent/loadings.ts` (NEW) | generator-sub-step default | transform (one-shot matrix) | `packages/dev-seed/src/emitters/answers.ts` | exact-pattern |
| `packages/dev-seed/src/emitters/latent/project.ts` (NEW) | generator-sub-step default | transform (per-candidate dispatch) | `packages/dev-seed/src/emitters/answers.ts` (`emitValueFor` switch) | exact-pattern |
| `packages/dev-seed/src/emitters/latent/latentEmitter.ts` (NEW) | composition shell / answer emitter | request-response (AnswerEmitter contract) | `packages/dev-seed/src/emitters/answers.ts` (`defaultRandomValidEmit`) | exact-role |
| `packages/dev-seed/src/emitters/latent/index.ts` (NEW) | module barrel | re-export | `packages/dev-seed/src/index.ts` (package barrel) | role-match |
| `packages/dev-seed/src/ctx.ts` (MOD) | ctx interface extension | schema | (self — extend existing interface) | in-place |
| `packages/dev-seed/src/template/schema.ts` (MOD) | zod schema extension | schema | `packages/dev-seed/src/template/schema.ts` (own `perEntityFragment` composition) | in-place |
| `packages/dev-seed/src/pipeline.ts` (MOD) | integration / wire-up | request-response (one-line assignment) | (self — add emitter assignment before topo loop) | in-place |
| `packages/dev-seed/src/types.ts` (MOD) | type barrel | re-export | `packages/dev-seed/src/types.ts` (extend existing re-exports) | in-place |
| `packages/dev-seed/src/index.ts` (MOD) | package barrel | re-export | self | in-place |
| `packages/dev-seed/package.json` (MOD) | config | N/A | self | in-place |
| `packages/dev-seed/tests/latent/gaussian.test.ts` (NEW) | unit test | transform | `packages/dev-seed/tests/determinism.test.ts` + `tests/generators/CandidatesGenerator.test.ts` | exact-pattern |
| `packages/dev-seed/tests/latent/dimensions.test.ts` (NEW) | unit test | transform | `packages/dev-seed/tests/generators/QuestionsGenerator.test.ts` | exact-pattern |
| `packages/dev-seed/tests/latent/centroids.test.ts` (NEW) | unit test | transform | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | exact-pattern |
| `packages/dev-seed/tests/latent/spread.test.ts` (NEW) | unit test | transform | `packages/dev-seed/tests/generators/QuestionsGenerator.test.ts` | exact-pattern |
| `packages/dev-seed/tests/latent/positions.test.ts` (NEW) | unit test | transform | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | exact-pattern |
| `packages/dev-seed/tests/latent/loadings.test.ts` (NEW) | unit test | transform | `packages/dev-seed/tests/generators/QuestionsGenerator.test.ts` | exact-pattern |
| `packages/dev-seed/tests/latent/project.test.ts` (NEW) | unit test | transform | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` (D-27 seam test) | exact-pattern |
| `packages/dev-seed/tests/latent/latentEmitter.test.ts` (NEW) | unit test (composition) | transform | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` (D-27 seam test) | exact-pattern |
| `packages/dev-seed/tests/latent/clustering.integration.test.ts` (NEW) | integration test | transform | `packages/matching/examples/example.ts` + `packages/dev-seed/tests/determinism.test.ts` | composite |
| (optional) `packages/dev-seed/tests/latent/fixedRows.test.ts` OR extend existing test | unit test | transform | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` (fixed-row passthrough test) | exact-pattern |
| `packages/dev-seed/src/generators/QuestionsGenerator.ts` (MOD — A2 fix, Plan call) | generator (field add) | transform | self (add `normalizableValue: j+1` to each `LIKERT_5` entry) | in-place |

---

## Pattern Assignments

### `packages/dev-seed/src/emitters/latent/latentEmitter.ts` (composition shell)

**Analog:** `packages/dev-seed/src/emitters/answers.ts` (the `defaultRandomValidEmit` function + `_typecheckDefaultEmit` compile-time check)

**AnswerEmitter contract pattern** (`answers.ts:35-39`):

```typescript
export type AnswerEmitter = (
  candidate: TablesInsert<'candidates'>,
  questions: Array<TablesInsert<'questions'>>,
  ctx: Ctx
) => Record<string, { value: unknown; info?: unknown }>;
```

**Signature-drift guardrail** (`answers.ts:70-73`) — MUST mirror for `latentAnswerEmitter`:

```typescript
// Compile-time assertion that `defaultRandomValidEmit` conforms to the
// `AnswerEmitter` seam signature. If the signature drifts, TS reports here.
const _typecheckDefaultEmit: AnswerEmitter = defaultRandomValidEmit;
void _typecheckDefaultEmit;
```

**Adaptation for latent emitter** — wrap in a factory that captures `template` and a lazy closure cache, and assert the *returned function* satisfies `AnswerEmitter`:

```typescript
export function latentAnswerEmitter(template: Template): AnswerEmitter {
  let bundle: SpaceBundle | undefined;
  return function emit(candidate, questions, ctx) { /* D-57-13 body */ };
}
// Compile-time check that the factory's return value still satisfies the seam.
const _typecheckLatent: AnswerEmitter = latentAnswerEmitter({} as Template);
void _typecheckLatent;
```

**Exhaustiveness `never` guardrail** (`answers.ts:97-106`) — `project.ts` MUST reuse this pattern:

```typescript
default: {
  const _exhaustive: never = type;
  void _exhaustive;
  return null;
}
```

**What's novel:**
- Factory-returning-emitter shape (Phase 56's `defaultRandomValidEmit` is itself the emitter; Phase 57 adds one level of closure).
- `SpaceBundle` cache pattern (not present in Phase 56 — per-run memoization).
- Party-index lookup + `defaultRandomValidEmit` fallback when `candidate.organization` ref is missing (Pitfall 4 in RESEARCH).

---

### `packages/dev-seed/src/emitters/latent/dimensions.ts` / `spread.ts` / `centroids.ts` / `loadings.ts` / `positions.ts` / `project.ts` (sub-step defaults)

**Analog:** `packages/dev-seed/src/emitters/answers.ts` (named `defaultRandomValidEmit` export pattern — D-57-15 replicates this for each sub-step)

**Named export + JSDoc pattern** (`answers.ts:56-68`):

```typescript
/**
 * Phase 56 default: random-valid-per-question-type (D-19).
 * ...
 */
export function defaultRandomValidEmit(
  _candidate: TablesInsert<'candidates'>,
  questions: Array<TablesInsert<'questions'>>,
  ctx: Ctx
): Record<string, { value: unknown; info?: unknown }> {
  // ... implementation
}
```

**Faker-via-ctx pattern** (`answers.ts:65`) — EVERY sub-step default MUST read `ctx.faker`, never `Math.random`:

```typescript
out[qExtId] = { value: emitValueFor(q, ctx.faker) };
```

**Per-type dispatch switch pattern** (`answers.ts:75-107`) — the template for `project.ts`'s latent-vs-fallback dispatch:

```typescript
function emitValueFor(q: TablesInsert<'questions'>, faker: Faker): unknown {
  const type = q.type as QuestionType;
  switch (type) {
    case 'text':
      return faker.lorem.sentence();
    case 'multipleText': { /* ... */ }
    case 'singleChoiceOrdinal':
    case 'singleChoiceCategorical':
      return pickOneChoiceId(q, faker);
    case 'multipleChoiceCategorical':
      return pickMultipleChoiceIds(q, faker);
    default: {
      const _exhaustive: never = type;
      void _exhaustive;
      return null;
    }
  }
}
```

**Choice-id extraction helper pattern** (`answers.ts:129-140`) — the template for `extractOrdinalChoices` in `project.ts`:

```typescript
function extractChoiceIds(q: TablesInsert<'questions'>): Array<string> {
  const choices = q.choices;
  if (!Array.isArray(choices)) return [];
  return choices
    .map((c) => {
      if (c && typeof c === 'object' && 'id' in c && typeof (c as { id: unknown }).id === 'string') {
        return (c as { id: string }).id;
      }
      return null;
    })
    .filter((v): v is string => v !== null);
}
```

**Multi-choice "≥1 selection" guardrail pattern** (`answers.ts:115-127`) — D-57-09 multi-choice must preserve this invariant:

```typescript
function pickMultipleChoiceIds(q: TablesInsert<'questions'>, faker: Faker): Array<string> {
  const choices = extractChoiceIds(q);
  if (choices.length === 0) return [];
  const picked: Array<string> = [];
  for (const c of choices) {
    if (faker.datatype.boolean()) picked.push(c);
  }
  // Guarantee non-empty selection — DB CHECK may require ≥ 1 for multi-choice.
  if (picked.length === 0) {
    picked.push(choices[faker.number.int({ min: 0, max: choices.length - 1 })]);
  }
  return picked;
}
```

**What's novel per file:**
- `dimensions.ts`: reads `template.latent?.dimensions` + `template.latent?.eigenvalues` via `.extend()`-extended schema; computes geometric `(1/3)^i` decay default.
- `spread.ts`: simplest — returns scalar 0.15, honors `template.latent?.spread` scalar override.
- `centroids.ts`: uses `boxMuller` from `gaussian.ts` + farthest-point greedy max-min algorithm; honors `template.latent?.centroids` anchor map per D-57-05. **Closure state (caching) lives in the emitter shell, NOT this file** (each default is pure).
- `loadings.ts`: matrix `(Q × D)` of iid Gaussian draws via `boxMuller`; honors per-question `questions.fixed[i].loadings` override.
- `positions.ts`: per-candidate Gaussian draw `N(centroid, spread²·I)`.
- `project.ts`: per-question type dispatch; ordinal/single-cat/multi-cat go through latent path, others fall through to `defaultRandomValidEmit` per D-57-10; uses `COORDINATE.Min / Max / Extent` from `@openvaa/core` (see Shared Patterns).

---

### `packages/dev-seed/src/emitters/latent/gaussian.ts` (Box-Muller helper)

**Analog:** `packages/dev-seed/src/emitters/answers.ts` (pure helper pattern — same file-local style as `pickOneChoiceId`, `extractChoiceIds`)

**Imports pattern** (RESEARCH § Code Examples → Box-Muller):

```typescript
import type { Faker } from '@faker-js/faker';
```

**Function signature + Pitfall 1 guardrail** (from RESEARCH lines 721-740):

```typescript
export function boxMuller(
  faker: Faker,
  mean: number = 0,
  stdDev: number = 1
): number {
  if (stdDev === 0) return mean; // short-circuit for deterministic runs (D-57-11)
  const u1 = Math.max(faker.number.float({ min: 0, max: 1 }), Number.MIN_VALUE);
  const u2 = faker.number.float({ min: 0, max: 1 });
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}
```

**What's novel:**
- `Math.max(…, Number.MIN_VALUE)` clamp for Pitfall 1 (`Math.log(0) = -Infinity`).
- `stdDev === 0` short-circuit for D-57-11 (deterministic mode when `latent.noise: 0`).

---

### `packages/dev-seed/src/emitters/latent/latentTypes.ts` (type barrel)

**Analog:** `packages/dev-seed/src/types.ts` (cross-module type re-export convention)

**Pattern to mirror** (`types.ts:1-47`):

```typescript
/**
 * Shared type contracts for ... Consumers import from here so
 * the type surface stays canonical — one `import type { ... } from '../latentTypes'`
 * covers every cross-module contract in the module.
 */
import type { Ctx } from './ctx';
export type { Ctx } from './ctx';
export type { AnswerEmitter } from './emitters/answers';
```

**What's novel:**
- New types: `LatentHooks` (the `ctx.latent?` nested shape per D-57-12), `SpaceBundle`, `LoadingMatrix` (`Record<questionExtId, number[]>` or `number[][]`), `Centroids` (`number[][]`), `LatentConfig` (template-facing).

---

### `packages/dev-seed/src/ctx.ts` (MODIFIED — add `latent` field per D-57-12)

**Analog:** `packages/dev-seed/src/ctx.ts` itself (line 50, `answerEmitter?: AnswerEmitter` field — the prior seam addition we mirror)

**Existing seam pattern** (`ctx.ts:26, 50`):

```typescript
import type { AnswerEmitter } from './emitters/answers';

export interface Ctx {
  // ...
  logger: (msg: string) => void;
  answerEmitter?: AnswerEmitter;
}
```

**Adaptation — add one line** (per D-57-12 nested object seam):

```typescript
import type { LatentHooks } from './emitters/latent/latentTypes';

export interface Ctx {
  // ...
  answerEmitter?: AnswerEmitter;
  latent?: LatentHooks;  // NEW — D-57-12 nested function-pointer seam
}
```

**`buildCtx` body** (`ctx.ts:69-99`) — NO change needed. `latent` stays undefined by default; `pipeline.ts` sets `ctx.answerEmitter = latentAnswerEmitter(template)` and individual sub-step hooks remain undefined (fall through to defaults).

**What's novel:**
- One nested-object field. No change to `buildCtx` defaults.

---

### `packages/dev-seed/src/template/schema.ts` (MODIFIED — `.extend()` latent block)

**Analog:** `packages/dev-seed/src/template/schema.ts` itself (the own `perEntityFragment` composition style + `.optional()` discipline from D-18)

**Existing object-schema pattern** (`schema.ts:35-74`) — D-18's "every field optional at top level":

```typescript
const perEntityFragment = z.object({
  count: z.number().int().nonnegative().optional(),
  fixed: z.array(z.record(z.string(), z.unknown())).optional()
});

export const TemplateSchema = z.object({
  seed: z.number().int().optional(),
  // ... all .optional()
  feedback: perEntityFragment.optional()
});
```

**Adaptation — add `latent` block per D-57-21** (using `.extend()`, `.strict()`, and `.superRefine` for eigenvalue-length check per RESEARCH Open Question 5):

```typescript
const latentBlock = z
  .object({
    dimensions: z.number().int().positive().optional(),
    eigenvalues: z.array(z.number().nonnegative()).optional(),
    centroids: z.record(z.string(), z.array(z.number())).optional(),
    spread: z.number().nonnegative().optional(),
    loadings: z.record(z.string(), z.array(z.number())).optional(),
    noise: z.number().nonnegative().optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    // D-57-02: eigenvalues length must match dimensions
    if (
      data.eigenvalues !== undefined &&
      data.dimensions !== undefined &&
      data.eigenvalues.length !== data.dimensions
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['eigenvalues'],
        message: `Expected length ${data.dimensions}, got ${data.eigenvalues.length}`
      });
    }
  });

export const TemplateSchema = z
  .object({ /* Phase 56 fields, unchanged */ })
  .extend({ latent: latentBlock.optional() });
```

**TMPL-09 error-path pattern** (`schema.ts:87-92`) — `validateTemplate` is unchanged; the `.superRefine` `path: ['eigenvalues']` becomes `template.latent.eigenvalues: ...` through the existing formatter:

```typescript
const msg = result.error.issues.map((iss) => `  template.${iss.path.join('.')}: ${iss.message}`).join('\n');
```

**What's novel:**
- First use of `.strict()` and `.superRefine` in this schema. Phase 56 used neither.
- Must use `.extend()` (not `.merge()`, deprecated in zod v4 per `schema.ts:9` comment).

---

### `packages/dev-seed/src/pipeline.ts` (MODIFIED — one-line latent wire-up)

**Analog:** `packages/dev-seed/src/pipeline.ts` itself (the `runPipeline` opening block where ctx and defaults are materialized)

**Existing wire-up pattern** (`pipeline.ts:162-170`):

```typescript
export function runPipeline(
  template: Template,
  overrides: Overrides = {},
  ctx: Ctx = buildCtx(template)
): Record<string, Array<Record<string, unknown>>> {
  const output: Record<string, Array<Record<string, unknown>>> = {};
  const templateFragments = template as unknown as Record<string, unknown>;

  for (const table of TOPO_ORDER) {
    // ...
  }
```

**Adaptation — one line before the topo loop** (RESEARCH Pattern 3 + D-57-13):

```typescript
  // D-27 seam: install the latent-factor emitter unless a caller has already
  // wired a custom one (test-injection path). The latent emitter internally
  // falls back to defaultRandomValidEmit for non-ordinal / non-choice types
  // (D-57-10) and for candidates missing an organization ref (Pitfall 4).
  ctx.answerEmitter ??= latentAnswerEmitter(template);

  for (const table of TOPO_ORDER) { /* unchanged */ }
```

**Import addition** (after the existing generator imports at `pipeline.ts:43-56`):

```typescript
import { latentAnswerEmitter } from './emitters/latent/latentEmitter';
```

**What's novel:**
- The `??=` is deliberate: the existing test injection path (`tests/generators/CandidatesGenerator.test.ts:114`) sets `ctx.answerEmitter = customEmitter` BEFORE calling into the pipeline via `runPipeline(tpl, {}, ctx)`. `??=` preserves that contract.

---

### `packages/dev-seed/src/types.ts` (MODIFIED — re-export latent types)

**Analog:** `packages/dev-seed/src/types.ts` itself (`types.ts:14-16`)

**Existing re-export pattern**:

```typescript
export type { Ctx } from './ctx';
export type { AnswerEmitter } from './emitters/answers';
export type { Template } from './template/types';
```

**Adaptation — add one line**:

```typescript
export type { LatentHooks } from './emitters/latent/latentTypes';
```

---

### `packages/dev-seed/src/index.ts` (MODIFIED — re-export latentAnswerEmitter + types)

**Analog:** `packages/dev-seed/src/index.ts` itself (`index.ts:43-57`)

**Existing runtime / type-export split pattern**:

```typescript
// Runtime exports
export { defaultRandomValidEmit } from './emitters/answers';
// ...
// Type exports
export type { AnswerEmitter } from './emitters/answers';
```

**Adaptation**:

```typescript
// Runtime exports
export { latentAnswerEmitter } from './emitters/latent/latentEmitter';
// Type exports
export type { LatentHooks } from './emitters/latent/latentTypes';
```

---

### `packages/dev-seed/package.json` (MODIFIED — add workspace deps)

**Analog:** `packages/dev-seed/package.json` itself (lines 18-23)

**Existing dependencies block**:

```json
"dependencies": {
  "@faker-js/faker": "catalog:",
  "@openvaa/supabase-types": "workspace:^",
  "@supabase/supabase-js": "catalog:",
  "zod": "catalog:"
}
```

**Adaptation — add two workspace deps** (per RESEARCH § Environment Availability → package.json changes):

```json
"dependencies": {
  "@faker-js/faker": "catalog:",
  "@openvaa/core": "workspace:^",
  "@openvaa/matching": "workspace:^",
  "@openvaa/supabase-types": "workspace:^",
  "@supabase/supabase-js": "catalog:",
  "zod": "catalog:"
}
```

**Note:** `@openvaa/matching` is imported only by `tests/latent/clustering.integration.test.ts`. `@openvaa/core` is imported by `emitters/latent/project.ts` (for `COORDINATE` constants). Both must be in `dependencies`, not `devDependencies`, because `src/emitters/latent/project.ts` is library code (even if the matching import is test-only, keeping both in `dependencies` is simpler and Phase 56's pattern already has `@openvaa/supabase-types` as a runtime dep).

---

### `packages/dev-seed/tests/latent/*.test.ts` (unit tests — 8 files)

**Analog:** `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` + `tests/generators/QuestionsGenerator.test.ts` + `tests/determinism.test.ts`

**Imports pattern** (`CandidatesGenerator.test.ts:17-21`):

```typescript
import { describe, expect, it, vi } from 'vitest';
import { CandidatesGenerator } from '../../src/generators/CandidatesGenerator';
import { makeCtx } from '../utils';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { AnswerEmitter } from '../../src/types';
```

**`makeCtx()` usage pattern** (`CandidatesGenerator.test.ts:41-44`) — every unit test spins a fresh `Ctx` per scenario:

```typescript
const base = makeCtx();
const gen = new CandidatesGenerator(makeCtx({ refs: { ...base.refs, organizations: [ORG_REF] } }));
expect(gen.generate({ count: 5 })).toHaveLength(5);
```

**Hook-injection + vi.fn pattern** (`CandidatesGenerator.test.ts:106-123`) — the template for `latentEmitter.test.ts` D-57-14 "hook wins over template" test:

```typescript
it('D-27 seam: uses ctx.answerEmitter when provided (Phase 57 path)', () => {
  const customEmitter: AnswerEmitter = vi.fn(() => ({
    seed_q_001: { value: 'CUSTOM_VALUE' }
  }));
  const base = makeCtx();
  const gen = new CandidatesGenerator(
    makeCtx({
      refs: { ...base.refs, organizations: [ORG_REF], questions: questionRefs },
      answerEmitter: customEmitter
    })
  );
  const rows = gen.generate({ count: 1 });
  expect(customEmitter).toHaveBeenCalledTimes(1);
  // ...
});
```

**Determinism test pattern** (`CandidatesGenerator.test.ts:64-71`) — template for D-57-19 "deterministic under fixed ctx.faker seed":

```typescript
it('produces deterministic output for same seed', () => {
  const base = makeCtx();
  const ctxA = makeCtx({ refs: { ...base.refs, organizations: [ORG_REF] } });
  const ctxB = makeCtx({ refs: { ...base.refs, organizations: [ORG_REF] } });
  const run1 = new CandidatesGenerator(ctxA).generate({ count: 3 });
  const run2 = new CandidatesGenerator(ctxB).generate({ count: 3 });
  expect(run1).toEqual(run2);
});
```

**Invalid-branch / edge-case pattern** (`CandidatesGenerator.test.ts:83-87`):

```typescript
it('omits organization ref when refs.organizations empty', () => {
  const gen = new CandidatesGenerator(makeCtx());
  const rows = gen.generate({ count: 1 });
  expect(rows[0]).not.toHaveProperty('organization');
});
```

**What's novel per test file:**
- `gaussian.test.ts`: Box-Muller mean ≈ 0 and std ≈ 1 over 10_000 draws; `stdDev = 0` returns `mean`; no `NaN` / `Infinity`; deterministic under seed.
- `dimensions.test.ts`: default `{ dims: 2, eigenvalues: [1, 1/3] }`; `template.latent.dimensions: 3` → `[1, 1/3, 1/9]`; mismatch rejected at schema layer (via `validateTemplate`).
- `centroids.test.ts`: farthest-point deterministic; `N=1` edge; template anchor partial-fill per D-57-05.
- `spread.test.ts`: default 0.15; scalar template override.
- `positions.test.ts`: per-dim Gaussian around centroid; `spread=0` returns exact centroid.
- `loadings.test.ts`: shape `(questions.length × dims)`; `questions.length === 0` returns `{}`/`[]` no-throw per Pitfall 3; per-question override honored.
- `project.test.ts`: per-type dispatch correctness; `noise=0` deterministic; ordinal produces valid `id` string from `q.choices`; D-57-10 fallback branches verified via `vi.fn` spy on `defaultRandomValidEmit`.
- `latentEmitter.test.ts`: D-57-13 composition (closure cache reused across candidates); D-57-14 hook precedence (hook called with template value as arg); Pitfall 4 (no org → `defaultRandomValidEmit` fallback, not throw).

---

### `packages/dev-seed/tests/latent/clustering.integration.test.ts` (Success Criterion 5)

**Primary analog:** `packages/matching/examples/example.ts` (MatchingSpace + `OrdinalQuestion.fromLikert` construction pattern)

**Secondary analog:** `packages/dev-seed/tests/determinism.test.ts` (seeded-pipeline test shape)

**Imports pattern** (derived from `example.ts:1-3` + RESEARCH test sketch at lines 892-903):

```typescript
import { describe, expect, it } from 'vitest';
import { Faker, en } from '@faker-js/faker';
import {
  OrdinalQuestion,
  MatchingSpace,
  manhattanDistance,
  Position
} from '@openvaa/matching';
import type { MatchableQuestion } from '@openvaa/core';
import type { TablesInsert } from '@openvaa/supabase-types';
import { latentAnswerEmitter } from '../../src/emitters/latent/latentEmitter';
import type { Ctx, Template } from '../../src/types';
```

**MatchableQuestion construction pattern** (`example.ts:19-21`):

```typescript
const questions = Array.from({ length: numQuestions }, (i: number) =>
  OrdinalQuestion.fromLikert({ id: `q${i}`, scale: likertScale })
);
```

**MatchingSpace + Position construction pattern** (`matchingSpace.ts:49-64` + `position.ts:14-22`):

```typescript
const space = MatchingSpace.fromQuestions({ questions: matchable });
const position = new Position({ coordinates: coords, space });
```

**Manhattan distance pattern** (`metric.ts:57-77`):

```typescript
const d = manhattanDistance({ a: positions[i], b: positions[j] });
```

**Determinism assertion shape** (`determinism.test.ts:18-22`) — bracket the clustering test with a seed-42 determinism sibling if planner chooses to split:

```typescript
it('same seed (42) produces byte-identical output across two fresh runs', () => {
  const run1 = runPipeline({ seed: 42 });
  const run2 = runPipeline({ seed: 42 });
  expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
});
```

**What's novel:**
- Full 4-party × 10-candidate × 12-question synthetic pipeline run (D-57-18).
- Pairwise intra-/inter-party distance computation loop — not present in any existing test.
- Margin ratio assertion `< 0.5` (D-57-17).
- Optional Pearson-correlation soft assertion (RESEARCH Open Question 4).
- Test constructs its own `Ctx` directly (NOT `makeCtx()` — which is in `tests/utils.ts`) because it needs to inject the questions / organizations refs directly rather than running the generators (for speed and isolation). OR it can call `latentAnswerEmitter(template)` without the pipeline and feed `candidate`/`questions`/`ctx` manually — see RESEARCH lines 904-998 for the full concrete template.

---

## Shared Patterns

### Pattern S-1: `ctx.faker` for all RNG (no `Math.random`)

**Source:** `packages/dev-seed/src/emitters/answers.ts:65, 82, 85, 87, 112, 120`
**Source:** `packages/dev-seed/src/ctx.ts:69-76`
**Apply to:** every `src/emitters/latent/*.ts` file (dimensions, centroids, spread, positions, loadings, project, gaussian, latentEmitter); every `tests/latent/*.test.ts` (construct ctx via `makeCtx()` which seeds faker to 42)

```typescript
// In buildCtx (ctx.ts:69-76) — Pattern A: fresh Faker per run
const faker = new Faker({ locale: [en] });
faker.seed(template.seed ?? 42);
```

```typescript
// In every sub-step default — read faker from ctx, NOT module-level singleton
export function defaultLoadings(
  questions: Array<TablesInsert<'questions'>>,
  dims: number,
  ctx: Ctx
  // ...
) {
  // ...
  const draw = boxMuller(ctx.faker);
  // ...
}
```

**Anti-pattern forbidden:** `import { faker } from '@faker-js/faker'` at module top and using it directly — RESEARCH § Anti-Patterns.

---

### Pattern S-2: Exhaustiveness `never` in `question_type` switch

**Source:** `packages/dev-seed/src/emitters/answers.ts:97-106`
**Apply to:** `src/emitters/latent/project.ts` (the per-type dispatch MUST use this guardrail)

```typescript
default: {
  const _exhaustive: never = type;
  void _exhaustive;
  return null; // or in project.ts: out[q.external_id] = { value: null };
}
```

**Why:** DB enum additions (e.g. a future question_type) force a TS compile error pointing exactly at this branch. Runtime fallback keeps the pipeline running with a clear null rather than throwing.

---

### Pattern S-3: `AnswerEmitter` compile-time type assertion

**Source:** `packages/dev-seed/src/emitters/answers.ts:70-73`
**Apply to:** `src/emitters/latent/latentEmitter.ts` (after defining `latentAnswerEmitter`)

```typescript
// Compile-time assertion that the factory's return type conforms to AnswerEmitter.
const _typecheckLatent: AnswerEmitter = latentAnswerEmitter({} as Template);
void _typecheckLatent;
```

---

### Pattern S-4: Multi-choice non-empty guardrail

**Source:** `packages/dev-seed/src/emitters/answers.ts:115-127` (`pickMultipleChoiceIds`)
**Apply to:** `src/emitters/latent/project.ts` — `mapMultiCategorical` MUST guarantee ≥1 selection (DB CHECK may require it; D-57-09)

```typescript
if (picked.length === 0) {
  picked.push(choices[faker.number.int({ min: 0, max: choices.length - 1 })]);
}
```

---

### Pattern S-5: Choice-shape extraction from JSONB

**Source:** `packages/dev-seed/src/emitters/answers.ts:129-140` (`extractChoiceIds`)
**Apply to:** `src/emitters/latent/project.ts` — `extractOrdinalChoices` mirrors this shape but also pulls `normalizableValue` (RESEARCH § "Latent → Likert mapping" lines 863-884)

```typescript
function extractOrdinalChoices(q: TablesInsert<'questions'>): Array<{ id: string; normalizableValue: number }> {
  const choices = q.choices;
  if (!Array.isArray(choices)) return [];
  return choices
    .map((c) => {
      if (c && typeof c === 'object' && 'id' in c) {
        const id = String((c as { id: unknown }).id);
        const nv =
          typeof (c as { normalizableValue?: unknown }).normalizableValue === 'number'
            ? (c as { normalizableValue: number }).normalizableValue
            : Number.isFinite(Number(id)) ? Number(id) : NaN;
        if (!Number.isFinite(nv)) return null;
        return { id, normalizableValue: nv };
      }
      return null;
    })
    .filter((v): v is { id: string; normalizableValue: number } => v !== null);
}
```

**Note:** Planner should consider A2 fix in Phase 57 — extend `QuestionsGenerator.LIKERT_5` (`QuestionsGenerator.ts:56-62`) to include `normalizableValue: j+1` per RESEARCH Open Question 2.

---

### Pattern S-6: Normalization primitives from `@openvaa/core`

**Source:** `packages/core/src/matching/distance.ts:11-32`
**Apply to:** `src/emitters/latent/project.ts` (ordinal / categorical mapping) — D-57-08 "MUST NOT hand-roll bucket boundaries"

```typescript
import { COORDINATE } from '@openvaa/core';

// COORDINATE.Min  = -0.5
// COORDINATE.Max  = +0.5
// COORDINATE.Extent = 1.0
// COORDINATE.Neutral = 0

// Clip z into the normalized coordinate range (same as @openvaa/data does):
const zClipped = Math.max(COORDINATE.Min, Math.min(COORDINATE.Max, z));

// Inverse of normalizeCoordinate:
// normalizeCoordinate({value, min, max}) = COORDINATE.Min + COORDINATE.Extent * ((value - min) / (max - min))
// Invert to map zClipped back to raw value:
const targetValue = vmin + ((zClipped - COORDINATE.Min) / COORDINATE.Extent) * (vmax - vmin);
```

**Reference implementation the latent emitter inverts:** `packages/data/src/objects/questions/variants/singleChoiceOrdinalQuestion.ts:72-79`:

```typescript
protected _normalizeValue(value): CoordinateOrMissing {
  if (isMissingValue(value)) return MISSING_VALUE;
  const numeric = this.getChoice(value)!.normalizableValue;
  return normalizeCoordinate({ value: numeric, min: this.min, max: this.max });
}
```

---

### Pattern S-7: `makeCtx()` test helper for fresh per-scenario ctx

**Source:** `packages/dev-seed/tests/utils.ts:18-44`
**Apply to:** every `tests/latent/*.test.ts` unit test

```typescript
import { makeCtx } from '../utils';

const ctx = makeCtx({
  refs: { /* patch specific refs per scenario */ },
  // optionally override logger, answerEmitter, latent, etc.
});
```

**Why:** D-22 contract — tests are pure I/O (no Supabase imports); `makeCtx()` seeds faker to 42, populates bootstrap accounts/projects refs, installs a no-op logger. Overrides spread LAST so tests can patch refs / answerEmitter / latent per scenario.

---

### Pattern S-8: Fixed-row passthrough pattern (D-57-20)

**Source:** `packages/dev-seed/src/generators/CandidatesGenerator.ts:82-88`
**Apply to:** (nothing new in src — D-57-20 says synthetic-only path runs through latent; fixed rows skip the emitter). Tests in `tests/latent/fixedRows.test.ts` (or extending existing `CandidatesGenerator.test.ts:52-62`) verify the three branches from D-57-20.

**Existing synthetic-vs-fixed split** (`CandidatesGenerator.ts:82-88`):

```typescript
// fixed[] pass-through — external_id prefixed, project_id defaulted.
for (const fx of fragment.fixed ?? []) {
  rows.push({
    ...fx,
    external_id: `${externalIdPrefix}${fx.external_id}`,
    project_id: fx.project_id ?? projectId
  } as CandidateRow);
}
```

**Emitter invocation only for synthetic** (`CandidatesGenerator.ts:124-138`) — already gated by the synthetic-loop branch; fixed rows never hit it.

**What Phase 57 tests verify:**
1. Fixed + `answersByExternalId` → verbatim passthrough, emitter NOT invoked (spy).
2. Fixed without `answersByExternalId` → emitter NOT invoked (spy); the Phase 56 path does not populate answers on fixed rows (`CandidatesGenerator.ts` currently never assigns `answersByExternalId` to fixed rows). **Planner call:** either accept current behavior or add a `defaultRandomValidEmit` call for fixed rows per D-57-20. Read `CandidatesGenerator.ts:82-88` carefully before writing the test.
3. Synthetic rows → latent emitter IS invoked.

---

### Pattern S-9: Pure I/O test contract (D-22)

**Source:** `packages/dev-seed/tests/determinism.test.ts:11-14`
**Apply to:** every `tests/latent/*.test.ts` file

> **D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.**

Clustering integration test (D-57-18) runs in memory: builds MatchingSpace from emitter output, no DB. This preserves the D-22 contract for ALL Phase 57 tests — even the one named `*.integration.test.ts`.

---

## No Analog Found

None. Every new file in Phase 57 has a strong analog in either Phase 56's `@openvaa/dev-seed` deliverables or `packages/matching/`. The clustering integration test is a *composite* analog (MatchingSpace example + determinism test shape), but every building block is present.

---

## Metadata

**Analog search scope:**
- `packages/dev-seed/src/**` (all Phase 56 src files)
- `packages/dev-seed/tests/**` (all Phase 56 tests)
- `packages/matching/src/**` (MatchingSpace, Position, OrdinalQuestion, manhattanDistance, examples/)
- `packages/core/src/matching/**` (COORDINATE, normalizeCoordinate)
- `packages/data/src/objects/questions/variants/singleChoiceOrdinalQuestion.ts`

**Files scanned:** 15 source files read, 5 test files read, 3 schema / package.json / index files read.

**Pattern extraction date:** 2026-04-22

**Confidence:** HIGH — every pattern has a concrete line-number citation in either the Phase 56 codebase or a sibling workspace. Planner can `Edit` Phase 56 files and `Write` new files using the excerpts above as drop-in templates.
