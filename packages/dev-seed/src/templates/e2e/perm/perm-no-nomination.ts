/**
 * perm-no-nomination minimal-data template: the dataset on which an entity's editor signs in whether or not the entity has a nomination.
 *
 * Topology: 1 election, 1 constituency group with 1 constituency, 2 candidates, 1 organization, 1 nomination, an info and an opinion category, 3 questions.
 *
 * What each row is for:
 *   - `ca-none` is a candidate with **no nomination row**, and `or-none` is an organization with **no nomination row**: each has an editor, and neither is nominated in any election as seeded.
 *   - `ca-nominated` is a candidate with one nomination, `nom-ca-nominated`, in the one election and constituency, which takes the seed's confirmed default.
 *   - All three entities take the seed's confirmed default, so none of their names is editable.
 *   - `or-none`, the election and the constituency each have a name in the default locale and in one other; the organization's short name and the election's have an entry in the default locale alone.
 *   - `qu-info-req` is a required, editable info question; `qu-opin-1` and `qu-opin-2` are opinion questions on a five-step scale with no open comment. No question and no category states an entity type, so each is asked of candidates and of organizations.
 *   - No entity is seeded with an answer.
 *
 * Settings: `MINIMAL_BASE_APP_SETTINGS`, with the `contestantApp` root restated. The Contestant App serves both entity types; `entityTypes` is a list, and a stored list replaces the default one whole, so the root is stated complete.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-no-nomination-'`. Row external_ids are bare; nested references are prefixed. The ids are semantic slugs with hyphens, which no generator emits: a generated id is a type code, an underscore and a zero-padded number.
 */

import { LIKERT_5_EN, MINIMAL_BASE_APP_SETTINGS } from './shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-no-nomination-';

export const permNoNominationTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL-1] Nomination Election', fi: '[EL-1] Ehdokasasetteluvaalit' },
        short_name: { en: 'EL-1' },
        election_type: 'organization_list_and_independents',
        election_date: '2026-06-15',
        sort_order: 0,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-1` }]
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'cg-1',
        name: { en: '[CG-1] Nomination Group' },
        sort_order: 0,
        constituencies: [{ external_id: `${P}co-1` }]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      {
        external_id: 'co-1',
        name: { en: '[CO-1] Nomination Constituency', fi: '[CO-1] Ehdokasasettelun vaalipiiri' },
        sort_order: 0
      }
    ]
  },

  // The organization has no nomination row.
  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'or-none',
        name: { en: '[OR-N] Unnominated Party', fi: '[OR-N] Ehdokkuudeton puolue' },
        short_name: { en: 'ORN' },
        sort_order: 0
      }
    ]
  },

  alliances: { count: 0 },
  factions: { count: 0 },

  // `ca-none` has no nomination row; `ca-nominated` has the one below.
  candidates: {
    count: 0,
    fixed: [
      {
        external_id: 'ca-none',
        first_name: '[CA-N] Unnominated',
        last_name: 'Candidate',
        sort_order: 0
      },
      {
        external_id: 'ca-nominated',
        first_name: '[CA-Y] Nominated',
        last_name: 'Candidate',
        sort_order: 1
      }
    ]
  },

  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'qc-info',
        name: { en: '[QC-INFO] Info questions' },
        category_type: 'info',
        sort_order: 0
      },
      {
        external_id: 'qc-opin',
        name: { en: '[QC-OPIN] Opinion questions' },
        category_type: 'opinion',
        sort_order: 1
      }
    ]
  },

  questions: {
    count: 0,
    fixed: [
      {
        external_id: 'qu-info-req',
        type: 'text',
        name: { en: '[QU-INFO-REQ] Describe your campaign' },
        category: { external_id: `${P}qc-info` },
        allow_open: false,
        required: true,
        sort_order: 0
      },
      {
        external_id: 'qu-opin-1',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-OPIN-1] No-nomination opinion 1.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: false,
        required: true,
        sort_order: 100
      },
      {
        external_id: 'qu-opin-2',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-OPIN-2] No-nomination opinion 2.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: false,
        required: true,
        sort_order: 101
      }
    ]
  },

  // The one seeded nomination, under no parent. It does not state `entity_type`: the column is generated from the entity reference.
  nominations: {
    count: 0,
    fixed: [
      {
        external_id: 'nom-ca-nominated',
        election_symbol: '7',
        candidate: { external_id: `${P}ca-nominated` },
        election: { external_id: `${P}el-1` },
        constituency: { external_id: `${P}co-1` },
        election_round: 1
      }
    ]
  },

  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'app-settings',
        settings: {
          ...MINIMAL_BASE_APP_SETTINGS,
          contestantApp: {
            questions: {
              hideHero: false,
              hideVideo: false
            },
            entityTypes: ['candidate', 'organization'],
            registrationModes: {
              candidate: ['email', 'code'],
              organization: []
            }
          }
        }
      }
    ]
  }
};

export default permNoNominationTemplate;
