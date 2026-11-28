/**
 * Default-template candidates override.
 *
 * Replaces the CandidatesGenerator's round-robin `i % orgCount` organization assignment with a sorted-descending non-uniform distribution.
 *
 * Weights: [61, 56, 49, 43, 38, 33, 26, 21] → sum 327, 8 organizations. These are the row sums of `nominations-override.ts`'s `ORGANIZATION_CONSTITUENCY_MATRIX`.
 * Shape: sorted descending; tail organization is 34% of the largest (21/61) — ensures the 8th organization is not invisibly small while keeping the profile clearly non-uniform for matching/clustering visibility.
 *
 * Faker locale cycles per candidate for visual variety: the candidates are split into one consecutive block per locale in `LOCALES` (currently en, fi, sv: 3 × 109 = 327 exactly, candidates 0-108 use en, 109-217 fi, 218-326 sv). The locale packs are fresh per-locale Faker instances seeded deterministically at fixed offsets so the blocks produce visibly distinct name output while the overall run stays deterministic.
 *
 * THROWS if `ctx.refs.organizations.length !== 8` — the weights are tuned for 8 organizations. If a future edit adds or drops an organization in defaultTemplate without updating this override, runtime fails loudly here rather than silently mis-distributing candidates. Ship a new override (or generalize this one) if a template legitimately needs different weights.
 *
 * Answer emission: the override calls `ctx.answerEmitter ?? defaultRandomValidEmit` exactly as the CandidatesGenerator does. The latent emitter is auto-installed by `pipeline.ts` (`ctx.answerEmitter ??= latentAnswerEmitter(template)`) before this override runs, so candidates get clustered answers "for free".
 */

import { en, Faker } from '@faker-js/faker';
import { defaultRandomValidEmit } from '../../emitters/answers';
import { localePack, LOCALES } from '../../locales';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../ctx';
import type { LocaleCode } from '../../locales';

/**
 * Sorted-descending weights. Sum MUST equal the candidates count.
 * Row sums of `nominations-override.ts`'s `ORGANIZATION_CONSTITUENCY_MATRIX`: each organization's row in that matrix sums to its weight here.
 *   [61, 56, 49, 43, 38, 33, 26, 21] = 327 candidates.
 */
export const ORGANIZATION_WEIGHTS: ReadonlyArray<number> = [61, 56, 49, 43, 38, 33, 26, 21];

/** TOTAL_CANDIDATES derived from ORGANIZATION_WEIGHTS for consistency. */
const TOTAL_CANDIDATES = ORGANIZATION_WEIGHTS.reduce((a, b) => a + b, 0);

/**
 * The number of consecutive candidates per locale block: 327 candidates / 3 locales = 109 per block exactly. Math.floor(i / LOCALE_BLOCK_SIZE) gives the index in `LOCALES` of candidate i's locale.
 */
export const LOCALE_BLOCK_SIZE = Math.ceil(TOTAL_CANDIDATES / LOCALES.length);

/**
 * The faker seed offset of a locale: its index in `LOCALES` times 1000 (0, 1000, 2000 for en, fi, sv). Fixed offsets ensure locales produce visibly distinct output while the overall run is deterministic at a given base seed.
 */
function localeSeedOffset(locale: LocaleCode): number {
  return LOCALES.indexOf(locale) * 1000;
}

/**
 * Build a per-locale Faker instance. Fallback chain `[locale, en]` keeps name generation robust if the locale pack lacks an entry. Seed is the ctx base seed plus a fixed per-locale offset.
 *
 * The base seed is read defensively — we cannot extract the *original* seed from `ctx.faker` once draws have occurred (faker.seed() without args returns the MUTATED internal state, not the input seed). We therefore fall back to a canonical `42` base. Tests in `default.test.ts` verify byte-level determinism at this base; the default template uses `seed: 42` (see defaultTemplate.seed).
 */
function buildLocaleFaker(locale: LocaleCode, baseSeed = 42): Faker {
  const f = new Faker({ locale: [localePack(locale), en] });
  f.seed(baseSeed + localeSeedOffset(locale));
  return f;
}

/**
 * Candidates override. Replaces the class-based CandidatesGenerator's output wholesale. Mirrors the row shape the generator emits with three differences:
 *   1. Organization assignment is ORGANIZATION_WEIGHTS-driven, not `i % orgCount`.
 *   2. Names are drawn from per-locale Faker instances (per-locale cycling).
 *   3. Answer emission goes through the same emitter seam the generator uses.
 */
export function candidatesOverride(_fragment: unknown, ctx: Ctx): Array<Record<string, unknown>> {
  const orgs = ctx.refs.organizations;
  if (orgs.length !== ORGANIZATION_WEIGHTS.length) {
    throw new Error(
      `candidatesOverride: expected ${ORGANIZATION_WEIGHTS.length} organizations in ctx.refs (matching ORGANIZATION_WEIGHTS), ` +
        `got ${orgs.length}. Adjust ORGANIZATION_WEIGHTS or provide 8 organizations in the template.`
    );
  }

  // Expand weights → flat organization-ref array of length 327.
  //   [org_0, org_0, ... ×61, org_1, org_1, ... ×56, ...]
  const organizationByIndex: Array<{ external_id: string }> = [];
  for (let p = 0; p < ORGANIZATION_WEIGHTS.length; p++) {
    for (let k = 0; k < ORGANIZATION_WEIGHTS[p]; k++) {
      organizationByIndex.push({ external_id: orgs[p].external_id });
    }
  }

  // Per-locale Faker cache (built once per override invocation).
  const localeFakers: Record<LocaleCode, Faker> = Object.fromEntries(
    LOCALES.map((locale) => [locale, buildLocaleFaker(locale)])
  );

  // Emitter seam — mirrors CandidatesGenerator's. The latent emitter is auto-installed by `pipeline.ts` (`ctx.answerEmitter ??= latentAnswerEmitter(template)`), so by the time this override runs the field is populated when the template has a latent block (or non-empty organizations).
  const emit = ctx.answerEmitter ?? defaultRandomValidEmit;

  // Pipeline contract: ctx.refs.questions carries the FULL question rows after QuestionsGenerator runs, so the emitter can read q.type + q.choices. The cast matches CandidatesGenerator's pattern.
  const questionRows = ctx.refs.questions as unknown as Array<TablesInsert<'questions'>>;

  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < TOTAL_CANDIDATES; i++) {
    const localeIdx = Math.floor(i / LOCALE_BLOCK_SIZE);
    const locale = LOCALES[localeIdx];
    const faker = localeFakers[locale];

    const row: Record<string, unknown> = {
      external_id: `${ctx.externalIdPrefix}cand_${String(i).padStart(4, '0')}`,
      project_id: ctx.projectId,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      sort_order: i,
      organization: organizationByIndex[i]
    };

    // Answer emission via the emitter seam (mirrors CandidatesGenerator).
    // Skipped when no questions exist — nothing to stitch.
    if (questionRows.length > 0) {
      const candidateForEmit: TablesInsert<'candidates'> = {
        external_id: row.external_id as string,
        project_id: ctx.projectId,
        first_name: row.first_name as string,
        last_name: row.last_name as string,
        organization: row.organization as { external_id: string }
      } as TablesInsert<'candidates'>;
      row.answersByExternalId = emit(candidateForEmit, questionRows, ctx);
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Internal helper exposed for unit tests that need to construct a locale Faker outside the override. Not part of the public API surface.
 *
 * @internal
 */
export function __buildLocaleFakerForTests(locale: LocaleCode, baseSeed = 42): Faker {
  return buildLocaleFaker(locale, baseSeed);
}
