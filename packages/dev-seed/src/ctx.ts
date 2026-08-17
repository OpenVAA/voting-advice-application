/**
 * Ctx — per-pipeline-run context passed to every generator.
 *
 * fields:
 *   1. `faker` — single seeded `Faker` instance (Pattern A per RESEARCH;
 *      NOT module-level `faker.seed()` — shared-state trap).
 *   2. `projectId` + `externalIdPrefix` — resolved once at build time, read by every
 *      generator.
 *   3. `refs` — prior-entity ref map populated in topo order; downstream generators
 *      read upstream refs (e.g. candidates reference constituencies).
 *   4. `logger` — warnings sink for tests / see phase 58 CLI summary. Default is a no-op
 *      so generator + pipeline code paths do not need nullish checks.
 *
 * `answerEmitter?: AnswerEmitter` — single function pointer seam. see phase 56
 * default is `defaultRandomValidEmit` (fallback resolved inside CandidatesGenerator
 * via `ctx.answerEmitter?? defaultRandomValidEmit`). see phase 57 supplies a
 * latent-factor emitter by setting this field. NO class hierarchy, NO AnswerEmitter
 * interface ceremony.
 *
 * generators capture ctx at construction (`new CandidateGenerator(ctx)`), NOT
 * per call. `defaults(ctx)` remains a per-call method because template-merge happens
 * at resolve time.
 */

import { en, Faker } from '@faker-js/faker';
import type { AnswerEmitter } from './emitters/answers';
import type { LatentHooks } from './emitters/latent/latentTypes';
import type { Template } from './template/types';

export interface Ctx {
  faker: Faker;
  projectId: string;
  externalIdPrefix: string;
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
   * swappable seam — per-sub-step function pointers for the latent
   * emitter. Every field optional; unset → built-in default. Memoized space
   * state (`SpaceBundle`) lives in the `latentAnswerEmitter` closure (Plan
   * 57-07), NOT on ctx, per. `buildCtx` leaves this `undefined` so
   * see phase 56 consumers are unaffected.
   */
  latent?: LatentHooks;
}

/**
 * Build a fresh Ctx from a validated Template. Called once per pipeline run.
 *
 * Defaults:
 *  - `seed`: 42 (arbitrary but stable — determinism test uses it).
 *  - `projectId`: TEST_PROJECT_ID from seed.sql bootstrap
 *    (`00000000-0000-0000-0000-000000000001`).
 *  - `externalIdPrefix`: `'seed_'`.
 *  - `accounts`/`projects` refs: pre-populated from seed.sql bootstrap (these
 *    tables are never written by dev-seed; generators read them only).
 *  - other refs: empty arrays, populated as generators run in topo order.
 *  - `logger`: no-op (tests can override by mutating the returned ctx or via a later
 *    pipeline seam).
 *  - `answerEmitter`: undefined (CandidatesGenerator falls back to
 *    `defaultRandomValidEmit`).
 */
export function buildCtx(template: Template): Ctx {
  // Pattern A per RESEARCH: construct a fresh Faker instance per pipeline run
  // (NOT the module-level `faker` singleton + `faker.seed()`). Seeding happens
  // via `.seed()` on the fresh instance immediately after construction — the
  // `new Faker({ seed })` constructor option does not exist in the @faker-js/faker
  // v10 API surface we consume (see RESEARCH code sample update).
  const faker = new Faker({ locale: [en] });
  faker.seed(template.seed ?? 42);
  return {
    faker,
    projectId: template.projectId ?? '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: template.externalIdPrefix ?? 'seed_',
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
