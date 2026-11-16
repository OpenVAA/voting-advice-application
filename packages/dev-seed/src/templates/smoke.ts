/**
 * `smoke` built-in template.
 *
 * A dataset large enough that an anonymous read of more than 1000 rows can be observed whole: 1001 candidates, each with one nomination, in a single project. It is meant to be seeded once on a hosted project from an operator's shell, with `--allow-remote`, and left there for the checks that read it.
 *
 * Shape:
 *   - 1 election, 1 constituency group, 1 constituency and 4 organizations, all synthetic
 *   - 1 opinion category with 6 Likert-5 opinion questions and no info questions
 *   - 1001 candidates, answered by the latent-factor emitter, and 1001 candidate nominations wired to the election × constituency
 *   - the minimal application settings the perm datasets state, so the voter app has a settings tree to read on a project whose bootstrapped settings row is empty
 *   - a fixed seed and English only
 *
 * It creates no auth user, no account and no storage-configuration row, so a project seeded with it still passes a check that no seed user exists. It targets the default project `00000000-0000-0000-0000-000000000001`, and it does not change whether that project is open for voters: openness is set when the project is bootstrapped, and an anonymous read of these rows needs it open.
 *
 * Every row carries the external id prefix `smoke_`; `yarn db:seed:teardown --prefix smoke_` removes exactly its content rows. Like every teardown, it keeps the settings row it merged into and leaves the project open for voters.
 */

import { LIKERT_5_EN, MINIMAL_BASE_APP_SETTINGS } from './e2e/perm/shared';
import type { QuestionsFixedRow } from '../template/permittedKeys';
import type { Template } from '../template/types';

const PREFIX = 'smoke_';
const CATEGORY_ID = 'cat_opinion';

const STATEMENTS = [
  'Public transport should be free of charge in cities.',
  'The state should raise taxes on high incomes.',
  'Nuclear power should be expanded.',
  'Municipalities should get more decision-making power.',
  'Defence spending should be increased.',
  'Immigration for work should be made easier.'
];

const questions: Array<QuestionsFixedRow> = STATEMENTS.map((statement, i) => ({
  external_id: `q_opinion_${i + 1}`,
  type: 'singleChoiceOrdinal',
  name: { en: statement },
  choices: LIKERT_5_EN,
  category: { external_id: `${PREFIX}${CATEGORY_ID}` },
  allow_open: false,
  required: true,
  sort_order: i
}));

export const smokeTemplate: Template = {
  seed: 1001,
  externalIdPrefix: PREFIX,
  generateTranslationsForAllLocales: false,

  elections: { count: 1 },
  constituency_groups: { count: 1 },
  constituencies: { count: 1 },
  organizations: { count: 4 },

  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: CATEGORY_ID,
        name: { en: 'Opinions' },
        category_type: 'opinion',
        sort_order: 0
      }
    ]
  },

  questions: { count: 0, fixed: questions },

  candidates: { count: 1001 },

  nominations: { count: 1001 },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'appsettings', settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default smokeTemplate;
