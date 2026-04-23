/**
 * Default-template candidates override — D-25 Overrides signature.
 *
 * Replaces Phase 56 CandidatesGenerator's round-robin `i % orgCount` party
 * assignment with a sorted-descending non-uniform distribution per D-58-02.
 *
 * Weights: [20, 18, 15, 12, 10, 10, 8, 7] → sum 100, 8 parties.
 * Shape: sorted descending; two adjacent slots at `10, 10` reflect realistic
 * close-sibling parties; tail party is 35% of the largest (7/20) — ensures
 * the 8th party is not invisibly small while keeping the profile clearly
 * non-uniform for matching/clustering visibility.
 *
 * Per RESEARCH §Open Q 4 (resolved): cycle faker locale per candidate for
 * visual variety. 25 candidates per locale block — candidates 0-24 use en,
 * 25-49 fi, 50-74 sv, 75-99 da. The locale packs are fresh per-locale Faker
 * instances seeded deterministically at fixed offsets so the 4 blocks produce
 * visibly distinct name output while the overall run stays deterministic.
 *
 * THROWS if `ctx.refs.organizations.length !== 8` — the weights are tuned for
 * 8 parties. T-58-06-02 mitigation: if a future edit adds or drops a party in
 * defaultTemplate without updating this override, runtime fails loudly here
 * rather than silently mis-distributing candidates. Ship a new override (or
 * generalize this one) if a template legitimately needs different weights.
 *
 * Answer emission: the override calls `ctx.answerEmitter ?? defaultRandomValidEmit`
 * exactly as Phase 56's CandidatesGenerator does (CandidatesGenerator.ts:93).
 * Phase 57's latent emitter is auto-installed by pipeline.ts:177
 * (`ctx.answerEmitter ??= latentAnswerEmitter(template)`) before this override
 * runs, so candidates get clustered answers "for free" — Plan 09's integration
 * test will exercise the full clustering path through this code path.
 */

import { da, en, Faker, fi, sv } from '@faker-js/faker';
import { defaultRandomValidEmit } from '../../emitters/answers';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Overrides } from '../../types';

/**
 * Sorted-descending weights. Sum MUST equal the candidates count.
 * D-58-02 + Claude's Discretion.
 */
export const PARTY_WEIGHTS: ReadonlyArray<number> = [20, 18, 15, 12, 10, 10, 8, 7];

/** TOTAL_CANDIDATES = 100 per D-58-02. Derived from PARTY_WEIGHTS for consistency. */
const TOTAL_CANDIDATES = PARTY_WEIGHTS.reduce((a, b) => a + b, 0);

/** 100 candidates / 4 locales = 25 per block. */
export const LOCALE_BLOCK_SIZE = 25;

/**
 * Per-locale faker seed offsets. Same pattern as `locales.ts` fanOutLocales —
 * fixed offsets ensure locales produce visibly distinct output while the
 * overall run is deterministic at a given base seed.
 */
const LOCALE_ORDER = ['en', 'fi', 'sv', 'da'] as const;
type LocaleCode = (typeof LOCALE_ORDER)[number];
const LOCALE_PACKS: Record<LocaleCode, typeof en> = { en, fi, sv, da };
const LOCALE_SEED_OFFSETS: Record<LocaleCode, number> = {
  en: 0,
  fi: 1000,
  sv: 2000,
  da: 3000
};

/**
 * Build a per-locale Faker instance. Fallback chain `[locale, en]` keeps name
 * generation robust if the locale pack lacks an entry. Seed is the ctx base
 * seed plus a fixed per-locale offset (Pattern A, RESEARCH §5).
 *
 * The base seed is read defensively — we cannot extract the *original* seed
 * from `ctx.faker` once draws have occurred (faker.seed() without args
 * returns the MUTATED internal state, not the input seed). We therefore fall
 * back to a canonical `42` base. Tests in `default.test.ts` verify byte-level
 * determinism at this base; the Phase 58 contract is that the default
 * template uses `seed: 42` (see defaultTemplate.seed).
 */
function buildLocaleFaker(locale: LocaleCode): Faker {
  const f = new Faker({ locale: [LOCALE_PACKS[locale], en] });
  f.seed(42 + LOCALE_SEED_OFFSETS[locale]);
  return f;
}

/**
 * D-25 candidates override. Replaces the class-based CandidatesGenerator's
 * output wholesale (GEN-03). Mirrors the row shape the generator emits with
 * three differences:
 *   1. Party assignment is PARTY_WEIGHTS-driven, not `i % orgCount`.
 *   2. Names are drawn from per-locale Faker instances (25-per-locale cycling).
 *   3. Answer emission goes through the same D-27 seam the generator uses.
 */
export const candidatesOverride: NonNullable<Overrides['candidates']> = (_fragment, ctx) => {
  const orgs = ctx.refs.organizations;
  if (orgs.length !== PARTY_WEIGHTS.length) {
    throw new Error(
      `candidatesOverride: expected ${PARTY_WEIGHTS.length} organizations in ctx.refs (matching PARTY_WEIGHTS), ` +
        `got ${orgs.length}. Adjust PARTY_WEIGHTS or provide 8 organizations in the template.`
    );
  }

  // Expand weights → flat party-ref array of length 100.
  //   [party_0, party_0, ... ×20, party_1, party_1, ... ×18, ...]
  const partyByIndex: Array<{ external_id: string }> = [];
  for (let p = 0; p < PARTY_WEIGHTS.length; p++) {
    for (let k = 0; k < PARTY_WEIGHTS[p]; k++) {
      partyByIndex.push({ external_id: orgs[p].external_id });
    }
  }

  // Per-locale Faker cache (built once per override invocation).
  const localeFakers: Record<LocaleCode, Faker> = {
    en: buildLocaleFaker('en'),
    fi: buildLocaleFaker('fi'),
    sv: buildLocaleFaker('sv'),
    da: buildLocaleFaker('da')
  };

  // D-27 seam — mirrors CandidatesGenerator.ts:93. Phase 57's latent emitter
  // is auto-installed by pipeline.ts:177 (`ctx.answerEmitter ??=
  // latentAnswerEmitter(template)`), so by the time this override runs the
  // field is populated when the template has a latent block (or non-empty
  // organizations).
  const emit = ctx.answerEmitter ?? defaultRandomValidEmit;

  // Pipeline contract (Plan 56-07): ctx.refs.questions carries the FULL
  // question rows after QuestionsGenerator runs, so the emitter can read
  // q.type + q.choices. The cast matches CandidatesGenerator's pattern.
  const questionRows = ctx.refs.questions as unknown as Array<TablesInsert<'questions'>>;

  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < TOTAL_CANDIDATES; i++) {
    const localeIdx = Math.floor(i / LOCALE_BLOCK_SIZE);
    const locale = LOCALE_ORDER[localeIdx];
    const faker = localeFakers[locale];

    const row: Record<string, unknown> = {
      external_id: `${ctx.externalIdPrefix}cand_${String(i).padStart(4, '0')}`,
      project_id: ctx.projectId,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      sort_order: i,
      is_generated: true,
      organization: partyByIndex[i]
    };

    // Answer emission via the D-27 seam (mirrors CandidatesGenerator.ts:141-149).
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
};

/**
 * Internal helper exposed for unit tests that need to construct a locale Faker
 * outside the override. Not part of the public API surface.
 *
 * @internal
 */
export function __buildLocaleFakerForTests(locale: LocaleCode, baseSeed = 42): Faker {
  const f = new Faker({ locale: [LOCALE_PACKS[locale], en] });
  f.seed(baseSeed + LOCALE_SEED_OFFSETS[locale]);
  return f;
}

