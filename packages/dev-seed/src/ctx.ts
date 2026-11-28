/**
 * Ctx — per-pipeline-run context passed to every generator.
 *
 * fields:
 *   1. `faker` — single seeded `Faker` instance, constructed fresh per run; NOT module-level `faker.seed()`, which is a shared-state trap.
 *   2. `projectId` + `externalIdPrefix` — resolved once at build time, read by every generator.
 *   3. `refs` — prior-entity ref map populated in topo order; downstream generators read upstream refs (e.g. candidates reference constituencies).
 *   4. `logger` — warnings sink for tests / the CLI summary. Default is a no-op so generator + pipeline code paths do not need nullish checks.
 *   5. `refDate` — the fixed anchor every generated date is drawn relative to, resolved once per run. Required, so no generator can fall back to the wall clock.
 *
 * `answerEmitter?: AnswerEmitter` — single function pointer seam. The default is `defaultRandomValidEmit` (the fallback is resolved inside CandidatesGenerator via `ctx.answerEmitter ?? defaultRandomValidEmit`); the latent-factor emitter is installed by setting this field. NO class hierarchy, NO AnswerEmitter interface ceremony.
 *
 * generators capture ctx at construction (`new CandidateGenerator(ctx)`), NOT per call.
 */

import { en, Faker } from '@faker-js/faker';
import type { AnswerEmitter } from './emitters/answers';
import type { LatentHooks } from './emitters/latent/latentTypes';
import type { Template } from './template/types';

/**
 * The fixed anchor every generated date is drawn relative to.
 *
 * A template overrides it with its own `refDate`. Pinning it is what makes a seeded dataset reproducible across calendar days: without an anchor, `faker.date.future` and `faker.date.recent` measure from `new Date()`, so the same seed emits different dates tomorrow.
 */
export const SEED_REF_DATE = '2027-01-01T00:00:00.000Z';

/**
 * The faker seed a template that sets no `seed` is generated with.
 */
export const DEFAULT_SEED = 42;

/**
 * The prefix every seeded row's `external_id` carries when a template sets no `externalIdPrefix`. Teardown removes the rows that carry it.
 */
export const DEFAULT_EXTERNAL_ID_PREFIX = 'seed_';

export interface Ctx {
  faker: Faker;
  projectId: string;
  externalIdPrefix: string;
  refDate: Date;
  refs: {
    elections: Array<{ external_id: string }>;
    constituency_groups: Array<{ external_id: string }>;
    constituencies: Array<{ external_id: string }>;
    organizations: Array<{ external_id: string }>;
    alliances: Array<{ external_id: string }>;
    factions: Array<{ external_id: string }>;
    candidates: Array<{ external_id: string }>;
    question_categories: Array<{ external_id: string }>;
    questions: Array<{ external_id: string }>;
    nominations: Array<{ external_id: string }>;
    app_settings: Array<{ external_id: string }>;
  };
  logger: (msg: string) => void;
  answerEmitter?: AnswerEmitter;
  /**
   * swappable seam — per-sub-step function pointers for the latent emitter. Every field optional; unset → built-in default. Memoized space state (`SpaceBundle`) lives in the `latentAnswerEmitter` closure, NOT on ctx. `buildCtx` leaves this `undefined`, so consumers that do not use the latent emitter are unaffected.
   */
  latent?: LatentHooks;
}

/**
 * Build a fresh Ctx from a validated Template. Called once per pipeline run.
 *
 * Defaults:
 *  - `seed`: {@link DEFAULT_SEED}.
 *  - `projectId`: TEST_PROJECT_ID from seed.sql bootstrap (`00000000-0000-0000-0000-000000000001`).
 *  - `externalIdPrefix`: {@link DEFAULT_EXTERNAL_ID_PREFIX}.
 *  - `refDate`: {@link SEED_REF_DATE}, parsed to a `Date` once per run so every date draw shares one anchor.
 *  - refs: empty arrays, populated as generators run in topo order.
 *  - `logger`: no-op (tests can override by mutating the returned ctx or via a later pipeline seam).
 *  - `answerEmitter`: undefined (CandidatesGenerator falls back to `defaultRandomValidEmit`).
 */
export function buildCtx(template: Template): Ctx {
  // Construct a fresh Faker instance per pipeline run (NOT the module-level `faker` singleton + `faker.seed()`). Seeding happens via `.seed()` on the fresh instance immediately after construction. The v10 constructor also accepts a `seed` option, which yields the same sequence; `.seed()` is kept because `makeLocaleFaker` in `locales.ts` and the tests seed their instances the same way, so every Faker this package builds is seeded by one idiom.
  const faker = new Faker({ locale: [en] });
  faker.seed(template.seed ?? DEFAULT_SEED);
  return {
    faker,
    projectId: template.projectId ?? '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: template.externalIdPrefix ?? DEFAULT_EXTERNAL_ID_PREFIX,
    refDate: new Date(template.refDate ?? SEED_REF_DATE),
    refs: {
      elections: [],
      constituency_groups: [],
      constituencies: [],
      organizations: [],
      alliances: [],
      factions: [],
      candidates: [],
      question_categories: [],
      questions: [],
      nominations: [],
      app_settings: []
    },
    logger: () => {}
  };
}
