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
 * generators capture ctx at construction (`new CandidateGenerator(ctx)`), NOT per call. `defaults(ctx)` remains a per-call method because template-merge happens at resolve time.
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

export interface Ctx {
  faker: Faker;
  projectId: string;
  externalIdPrefix: string;
  refDate: Date;
  refs: {
    accounts: Array<{ id: string; external_id?: string }>;
    projects: Array<{ id: string; external_id?: string }>;
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
    feedback: Array<{ external_id: string }>;
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
 *  - `seed`: 42 (arbitrary but stable — determinism test uses it).
 *  - `projectId`: TEST_PROJECT_ID from seed.sql bootstrap (`00000000-0000-0000-0000-000000000001`).
 *  - `externalIdPrefix`: `'seed_'`.
 *  - `refDate`: {@link SEED_REF_DATE}, parsed to a `Date` once per run so every date draw shares one anchor.
 *  - `accounts`/`projects` refs: pre-populated from seed.sql bootstrap (these tables are never written by dev-seed; generators read them only).
 *  - other refs: empty arrays, populated as generators run in topo order.
 *  - `logger`: no-op (tests can override by mutating the returned ctx or via a later pipeline seam).
 *  - `answerEmitter`: undefined (CandidatesGenerator falls back to `defaultRandomValidEmit`).
 */
export function buildCtx(template: Template): Ctx {
  // Construct a fresh Faker instance per pipeline run (NOT the module-level `faker` singleton + `faker.seed()`). Seeding happens via `.seed()` on the fresh instance immediately after construction — the `new Faker({ seed })` constructor option does not exist in the @faker-js/faker v10 API surface we consume.
  const faker = new Faker({ locale: [en] });
  faker.seed(template.seed ?? 42);
  return {
    faker,
    projectId: template.projectId ?? '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: template.externalIdPrefix ?? 'seed_',
    refDate: new Date(template.refDate ?? SEED_REF_DATE),
    refs: {
      accounts: [{ id: '00000000-0000-0000-0000-000000000001' }],
      projects: [{ id: '00000000-0000-0000-0000-000000000001' }],
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
      app_settings: [],
      feedback: []
    },
    logger: () => {}
  };
}
