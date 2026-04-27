/**
 * Shared test utilities for `@openvaa/dev-seed` generator unit tests.
 *
 * D-22: tests are pure I/O — NO Supabase imports, NO `createClient`, NO `.rpc()`.
 * Each test constructs a fresh `Ctx` via `makeCtx()` with a seeded Faker instance,
 * synthetic bootstrap refs, and a no-op logger. Overrides are spread LAST so tests
 * can patch `refs`, `logger`, `answerEmitter`, etc. per scenario.
 *
 * Pattern A per RESEARCH §5: fresh `new Faker()` + `.seed()` per call — never
 * module-level `faker.seed()` (shared-state trap). Same construction pattern as
 * `buildCtx` in `src/ctx.ts`, minus the `Template` argument (tests don't exercise
 * the template-merge surface; that lives in Plan 09's cross-cutting tests).
 */

import { en, Faker } from '@faker-js/faker';
import type { Ctx } from '../src/ctx';

export function makeCtx(overrides: Partial<Ctx> = {}): Ctx {
  const faker = new Faker({ locale: [en] });
  faker.seed(42);
  return {
    faker,
    projectId: '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: 'seed_',
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
    logger: () => {},
    ...overrides
  };
}
