/**
 * defaultProject — Phase 57 sub-step default behind `ctx.latent?.project` (GEN-06f).
 *
 * Projects each candidate's latent `position` through the loading matrix,
 * adds Gaussian noise (D-57-11; `noiseStdDev === 0` short-circuits via the
 * shared `boxMuller`), and maps the resulting scalar `z` to a valid answer per
 * question type. This is the last and most complex of the six sub-step defaults.
 *
 * ## Per-type dispatch (matches Phase 56 S-2 pattern)
 *
 *  - `singleChoiceOrdinal` → D-57-08: inverse-normalize `z` through
 *    `@openvaa/core`'s `COORDINATE` semantics to find the choice whose
 *    `normalizableValue` is closest. NO hand-rolled bucket tables.
 *  - `singleChoiceCategorical` → D-57-09: sample per-choice N(0,1) loading
 *    vectors (cached per-ctx), return `choice.id` of argmax dot product.
 *  - `multipleChoiceCategorical` → D-57-09 + S-4: include each choice whose
 *    dot product > 0; if none qualify, fall back to the argmax to satisfy
 *    the DB CHECK (parity with `pickMultipleChoiceIds` in answers.ts).
 *  - `text` / `multipleText` / `number` / `boolean` / `date` / `image` → D-57-10:
 *    delegate to `defaultRandomValidEmit` from answers.ts (Phase 56 parity).
 *  - Unknown types → compile-time `never` assertion (Phase 56 S-2 guardrail);
 *    runtime returns `{ value: null }` to match the enum-addition path.
 *
 * ## Per-choice loading cache — WeakMap by ctx identity (D-57-09 / D-57-13)
 *
 * Categorical questions need per-choice loading vectors. These must be sampled
 * ONCE per pipeline run (same ctx → same cache → deterministic argmax across
 * candidates), NOT once per function invocation and NOT at module scope. The
 * emitter shell (Plan 57-07) calls `defaultProject` once per candidate, so a
 * function-local cache would give each candidate a different choice space —
 * wrong semantics. A module-level mutable object would leak between pipeline
 * runs.
 *
 * Solution: `WeakMap<Ctx, Record<qExtId, Array<Array<number>>>>` keyed on the
 * ctx object reference. Fresh `buildCtx(template)` → fresh map entry → fresh
 * sampling. GC'd automatically when the ctx is discarded. No global mutation
 * visible outside this module; preserves the `LatentHooks.project` signature
 * without adding a cache parameter.
 *
 * ## Pitfall 5 defense (Choice id-vs-index confusion)
 *
 * Every dispatch path returns `choice.id` (a string), NEVER `choice_index`
 * (a number). Tests assert `typeof value === 'string'` + membership in the
 * choice id set over 100 seeded runs.
 */

import { COORDINATE } from '@openvaa/core';
import { boxMuller } from './gaussian';
import { defaultRandomValidEmit } from '../answers';
import type { Enums, TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../ctx';
import type { LatentHooks, LoadingMatrix } from './latentTypes';

type QuestionType = Enums<'question_type'>;

/**
 * Module-scoped per-ctx cache of per-choice loading vectors.
 *
 * One pipeline run = one `Ctx` = one cache. `WeakMap` keys on ctx identity;
 * entries GC with the ctx. No cross-run bleed, no mutation of ctx itself,
 * no extra parameter on the `LatentHooks.project` seam signature.
 */
const CHOICE_LOADINGS: WeakMap<Ctx, Record<string, Array<Array<number>>>> = new WeakMap();

function getChoiceLoadings(ctx: Ctx): Record<string, Array<Array<number>>> {
  let cache = CHOICE_LOADINGS.get(ctx);
  if (!cache) {
    cache = {};
    CHOICE_LOADINGS.set(ctx, cache);
  }
  return cache;
}

/**
 * GEN-06f default: project `position` through `loadings` to a per-question
 * answer dict keyed by question `external_id`.
 *
 * Callers: `latentAnswerEmitter` (Plan 57-07) invokes this once per candidate
 * after the one-shot space bundle is built. Users may replace this wholesale
 * via `ctx.latent.project = myProjectFn` (D-57-12).
 *
 * Return shape matches `AnswerEmitter`'s return — `importAnswers` then resolves
 * each `external_id` to a question UUID and stitches the JSONB.
 */
export function defaultProject(
  position: Array<number>,
  loadings: LoadingMatrix,
  questions: ReadonlyArray<TablesInsert<'questions'>>,
  noiseStdDev: number,
  ctx: Ctx
): Record<string, { value: unknown; info?: unknown }> {
  const out: Record<string, { value: unknown; info?: unknown }> = {};

  for (const q of questions) {
    const qExtId = q.external_id;
    if (!qExtId) continue;

    const type = q.type as QuestionType;
    switch (type) {
      case 'singleChoiceOrdinal': {
        const qLoading = loadings[qExtId] ?? [];
        const z = computeZ(position, qLoading, noiseStdDev, ctx);
        out[qExtId] = { value: mapOrdinal(q, z) };
        break;
      }
      case 'singleChoiceCategorical': {
        out[qExtId] = { value: mapSingleCategorical(q, position, ctx, qExtId) };
        break;
      }
      case 'multipleChoiceCategorical': {
        out[qExtId] = { value: mapMultiCategorical(q, position, ctx, qExtId) };
        break;
      }
      case 'text':
      case 'multipleText':
      case 'number':
      case 'boolean':
      case 'date':
      case 'image': {
        // D-57-10 fallback — reuse the Phase 56 per-type stub one question at a
        // time. The candidate argument is unused by `defaultRandomValidEmit`;
        // pass a minimal TablesInsert<'candidates'> shell.
        const fallback = defaultRandomValidEmit({} as TablesInsert<'candidates'>, [q], ctx);
        out[qExtId] = fallback[qExtId];
        break;
      }
      default: {
        // Exhaustiveness guardrail (Phase 56 S-2): if the DB enum adds a new
        // question_type without a matching case above, this line fails to
        // compile. Runtime fallback matches answers.ts's null-return policy.
        const _exhaustive: never = type;
        void _exhaustive;
        out[qExtId] = { value: null };
      }
    }
  }
  return out;
}

// --- Helpers ---

function computeZ(position: Array<number>, qLoading: Array<number>, noiseStdDev: number, ctx: Ctx): number {
  let z = 0;
  const L = Math.min(position.length, qLoading.length);
  for (let d = 0; d < L; d++) z += position[d] * qLoading[d];
  z += boxMuller(ctx.faker, 0, noiseStdDev);
  return z;
}

/**
 * D-57-08: inverse-normalize `z` through `@openvaa/core`'s `COORDINATE`
 * semantics. `z` is clipped to `[COORDINATE.Min, COORDINATE.Max]` (Pitfall 1
 * of T-57-26 — unbounded z from noise could otherwise land outside the
 * normalizable range and produce NaN target values). The inverse of
 * `normalizeCoordinate({ value, min: vmin, max: vmax })` is
 * `targetValue = vmin + ((zClipped - COORDINATE.Min) / COORDINATE.Extent) * (vmax - vmin)`.
 */
function mapOrdinal(q: TablesInsert<'questions'>, z: number): string | null {
  const choices = extractOrdinalChoices(q);
  if (choices.length === 0) return null;
  const zClipped = Math.max(COORDINATE.Min, Math.min(COORDINATE.Max, z));
  const values = choices.map((c) => c.normalizableValue);
  const vmin = Math.min(...values);
  const vmax = Math.max(...values);
  // Handle the degenerate single-value-range case (T-57-31 — avoids divide-by-
  // zero in the inverse-normalize formula below).
  if (vmin === vmax) return choices[0].id;
  const targetValue = vmin + ((zClipped - COORDINATE.Min) / COORDINATE.Extent) * (vmax - vmin);
  let best = choices[0];
  let bestDiff = Math.abs(best.normalizableValue - targetValue);
  for (const c of choices) {
    const diff = Math.abs(c.normalizableValue - targetValue);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  return best.id;
}

function mapSingleCategorical(
  q: TablesInsert<'questions'>,
  position: Array<number>,
  ctx: Ctx,
  qExtId: string
): string | null {
  const choices = extractChoiceIds(q);
  if (choices.length === 0) return null;
  const cls = getOrSampleChoiceLoadings(getChoiceLoadings(ctx), qExtId, choices.length, position.length, ctx);
  let bestIdx = 0;
  let bestDot = -Infinity;
  for (let i = 0; i < choices.length; i++) {
    const d = dot(position, cls[i]);
    if (d > bestDot) {
      bestDot = d;
      bestIdx = i;
    }
  }
  return choices[bestIdx];
}

function mapMultiCategorical(
  q: TablesInsert<'questions'>,
  position: Array<number>,
  ctx: Ctx,
  qExtId: string
): Array<string> {
  const choices = extractChoiceIds(q);
  if (choices.length === 0) return [];
  const cls = getOrSampleChoiceLoadings(getChoiceLoadings(ctx), qExtId, choices.length, position.length, ctx);
  const picked: Array<string> = [];
  let bestIdx = 0;
  let bestDot = -Infinity;
  for (let i = 0; i < choices.length; i++) {
    const d = dot(position, cls[i]);
    if (d > 0) picked.push(choices[i]);
    if (d > bestDot) {
      bestDot = d;
      bestIdx = i;
    }
  }
  // D-57-09 / S-4: guarantee ≥ 1 selection. DB CHECK on multi-choice requires
  // at least one id per row; if every dot product fell ≤ 0, fall back to the
  // argmax choice. Mirrors `pickMultipleChoiceIds` in answers.ts.
  if (picked.length === 0) picked.push(choices[bestIdx]);
  return picked;
}

/**
 * Lazy-sample per-choice loading vectors for a question. Each vector is length
 * `dims` with entries drawn iid N(0, 1) via the shared `boxMuller`. Cache is
 * keyed by `qExtId` so repeated calls for the same question reuse the sampled
 * vectors — critical for determinism across the cluster of candidates that
 * share a ctx (same seed + same question → same choice space → coherent
 * argmax across candidates).
 */
function getOrSampleChoiceLoadings(
  cache: Record<string, Array<Array<number>>>,
  qExtId: string,
  numChoices: number,
  dims: number,
  ctx: Ctx
): Array<Array<number>> {
  const existing = cache[qExtId];
  if (existing) return existing;
  const cls = Array.from({ length: numChoices }, () =>
    Array.from({ length: dims }, () => boxMuller(ctx.faker, 0, 1))
  );
  cache[qExtId] = cls;
  return cls;
}

function dot(a: Array<number>, b: Array<number>): number {
  let s = 0;
  const L = Math.min(a.length, b.length);
  for (let i = 0; i < L; i++) s += a[i] * b[i];
  return s;
}

/**
 * Extract ordinal choices with `normalizableValue`. Follows the S-5 defensive
 * narrowing pattern from `extractChoiceIds` in answers.ts: treats `q.choices`
 * as JSONB-unsafe, narrows entry-by-entry, drops malformed shapes.
 *
 * When the choice entry lacks an explicit `normalizableValue`, falls back to
 * parsing the `id` as a number (the Phase 56 Likert convention — `id`s were
 * `'1'..'5'`). The A2 fix in QuestionsGenerator makes the explicit field the
 * primary path; the parseInt fallback keeps older templates / fixtures
 * backwards-compatible.
 */
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
            : Number.isFinite(Number(id))
              ? Number(id)
              : NaN;
        if (!Number.isFinite(nv)) return null;
        return { id, normalizableValue: nv };
      }
      return null;
    })
    .filter((v): v is { id: string; normalizableValue: number } => v !== null);
}

function extractChoiceIds(q: TablesInsert<'questions'>): Array<string> {
  const choices = q.choices;
  if (!Array.isArray(choices)) return [];
  return choices
    .map((c) => {
      if (c && typeof c === 'object' && 'id' in c) {
        const id = (c as { id: unknown }).id;
        if (typeof id === 'string') return id;
      }
      return null;
    })
    .filter((v): v is string => v !== null);
}

// Compile-time contract assertion — if the `LatentHooks.project` signature
// drifts in latentTypes.ts, TypeScript reports the incompatibility here. The
// one seam, one place to audit convention from Phase 56 answers.ts.
const _typecheckProject: NonNullable<LatentHooks['project']> = defaultProject;
void _typecheckProject;
