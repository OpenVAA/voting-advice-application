/**
 * perm-contestant-nominations minimal-data template: the dataset on which an entity's editor defines, changes and removes the entity's nominations.
 *
 * Topology: 3 elections of 3 types over 2 constituency groups with 3 constituencies, 5 organizations, 2 alliances, 3 candidates, 7 nominations, an info category and 3 opinion categories, 4 questions.
 *
 * What each row is for:
 *   - `el-list` is a closed-list election (`organization_list`) over `cg-regions`, a group of two constituencies: a candidate stands in it under a party, and an entity that stands in it chooses between `co-north` and `co-south`. Its English name is longer than a 320 px viewport is wide.
 *   - `el-open` admits every entity type with or without a parent (`organization_list_and_independents`), and `el-cand` admits candidates alone (`candidate_only`). Both are over `cg-nation`, a group of the one constituency `co-nation`.
 *   - `or-new` is a confirmed party with **no nomination row** and an editor; `ca-new` is a candidate with **no nomination row** and an editor.
 *   - `or-edit` is a confirmed party with an editor and two nominations: at `el-open` / `co-nation` with an election symbol, and at `el-list` / `co-north`, where `ca-child` is listed under it. It has no nomination at `el-list` / `co-south`.
 *   - `or-green` is a confirmed party nominated at `el-list` / `co-north` and at `el-open` / `co-nation`, and at no other pair. `ca-edit`, a candidate with an editor, is listed under its nomination at `el-list` / `co-north`, with an election symbol.
 *   - `or-long` is a confirmed party with no nomination, whose name is longer than a 320 px viewport is wide; `or-pending` is a party with no nomination that states `confirmed: false`.
 *   - `al-coast` is a confirmed alliance nominated at `el-open` / `co-nation` and at no other pair; `al-inland` is an alliance with no nomination that states `confirmed: false`.
 *   - `ca-child` is a candidate with no editor, there to be listed under `or-edit`'s nomination.
 *   - Every nomination takes the seed's confirmed default, and so does every entity that does not state otherwise.
 *   - Every nomination states a `sort_order`, so an entity's nominations are read in one order: `or-edit`'s in the closed-list election before its one in the open election.
 *   - Every party and alliance has a colour pair: the normal colour is dark enough for white initials and the dark colour light enough for black ones.
 *   - `qu-info-req` is a required, editable info question. `qu-opin-all` is in a category scoped to no election; `qu-opin-list` is in a category scoped to `el-list` and `qu-opin-open` in one scoped to `el-open`. No question and no category states an entity type, so each is asked of candidates and of organizations.
 *   - No entity is seeded with an answer.
 *
 * Settings: `MINIMAL_BASE_APP_SETTINGS`, with the `contestantApp` root restated. The Contestant App serves both entity types; `entityTypes` is a list, and a stored list replaces the default one whole, so the root is stated complete. Neither lock is on: `access.answersLocked` is stated off and `access.nominationsLocked` is not stated, which is off.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-contestant-nominations-'`. Row external_ids are bare; nested references are prefixed. The ids are semantic slugs with hyphens, which no generator emits: a generated id is a type code, an underscore and a zero-padded number.
 */

import { LIKERT_5_EN, MINIMAL_BASE_APP_SETTINGS } from './shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-contestant-nominations-';

export const permContestantNominationsTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-list',
        name: {
          en: '[EL-LIST] Regional Assembly Election of the Northern and Southern Regions for Party Lists',
          fi: '[EL-LIST] Aluevaalit'
        },
        short_name: { en: 'EL-LIST' },
        election_type: 'organization_list',
        election_date: '2026-06-15',
        sort_order: 0,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-regions` }]
      },
      {
        external_id: 'el-open',
        name: { en: '[EL-OPEN] National Election', fi: '[EL-OPEN] Valtakunnalliset vaalit' },
        short_name: { en: 'EL-OPEN' },
        election_type: 'organization_list_and_independents',
        election_date: '2026-06-15',
        sort_order: 1,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-nation` }]
      },
      {
        external_id: 'el-cand',
        name: { en: '[EL-CAND] Presidential Election', fi: '[EL-CAND] Presidentinvaalit' },
        short_name: { en: 'EL-CAND' },
        election_type: 'candidate_only',
        election_date: '2026-06-15',
        sort_order: 2,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-nation` }]
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'cg-regions',
        name: { en: '[CG-REGIONS] Regions' },
        sort_order: 0,
        constituencies: [{ external_id: `${P}co-north` }, { external_id: `${P}co-south` }]
      },
      {
        external_id: 'cg-nation',
        name: { en: '[CG-NATION] Whole country' },
        sort_order: 1,
        constituencies: [{ external_id: `${P}co-nation` }]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      {
        external_id: 'co-north',
        name: { en: '[CO-NORTH] Northern Region', fi: '[CO-NORTH] Pohjoinen alue' },
        sort_order: 0
      },
      {
        external_id: 'co-south',
        name: { en: '[CO-SOUTH] Southern Region', fi: '[CO-SOUTH] Eteläinen alue' },
        sort_order: 1
      },
      {
        external_id: 'co-nation',
        name: { en: '[CO-NATION] Whole Country', fi: '[CO-NATION] Koko maa' },
        sort_order: 2
      }
    ]
  },

  // `or-new`, `or-long` and `or-pending` have no nomination row.
  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'or-new',
        name: { en: '[OR-NEW] Unnominated Party', fi: '[OR-NEW] Ehdokkuudeton puolue' },
        short_name: { en: 'ORN' },
        color: { normal: '#1f4ea0', dark: '#7aa3d6' },
        sort_order: 0
      },
      {
        external_id: 'or-edit',
        name: { en: '[OR-EDIT] Nominated Party', fi: '[OR-EDIT] Ehdolla oleva puolue' },
        short_name: { en: 'ORE' },
        color: { normal: '#a82525', dark: '#d67070' },
        sort_order: 1
      },
      {
        external_id: 'or-green',
        name: { en: '[OR-GREEN] Green Party', fi: '[OR-GREEN] Vihreä puolue' },
        short_name: { en: 'ORG' },
        color: { normal: '#1a6b2f', dark: '#6bdc88' },
        sort_order: 2
      },
      {
        external_id: 'or-long',
        name: { en: '[OR-LONG] Independent Association of Northern and Southern Regional Smallholders and Fishers' },
        short_name: { en: 'ORL' },
        color: { normal: '#6b3fa0', dark: '#b79ad9' },
        sort_order: 3
      },
      {
        external_id: 'or-pending',
        name: { en: '[OR-PENDING] Unconfirmed Party' },
        short_name: { en: 'ORP' },
        color: { normal: '#8a5a00', dark: '#d9b36b' },
        confirmed: false,
        sort_order: 4
      }
    ]
  },

  // `al-inland` has no nomination row.
  alliances: {
    count: 0,
    fixed: [
      {
        external_id: 'al-coast',
        name: { en: '[AL-COAST] Coastal Alliance', fi: '[AL-COAST] Rannikon liitto' },
        short_name: { en: 'ALC' },
        color: { normal: '#3a4660', dark: '#9aa9bd' },
        sort_order: 0
      },
      {
        external_id: 'al-inland',
        name: { en: '[AL-INLAND] Unconfirmed Inland Alliance' },
        short_name: { en: 'ALI' },
        color: { normal: '#5c4a3e', dark: '#b8a596' },
        confirmed: false,
        sort_order: 1
      }
    ]
  },

  factions: { count: 0 },

  // `ca-new` has no nomination row; `ca-edit` and `ca-child` have one each, under a party's.
  candidates: {
    count: 0,
    fixed: [
      {
        external_id: 'ca-new',
        first_name: '[CA-NEW] Unnominated',
        last_name: 'Candidate',
        sort_order: 0
      },
      {
        external_id: 'ca-edit',
        first_name: '[CA-EDIT] Nominated',
        last_name: 'Candidate',
        sort_order: 1
      },
      {
        external_id: 'ca-child',
        first_name: '[CA-CHILD] Listed',
        last_name: 'Candidate',
        sort_order: 2
      }
    ]
  },

  // `qc-opin-all` names no election, so it is asked in every one; the other two opinion categories are asked in one election each.
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
        external_id: 'qc-opin-all',
        name: { en: '[QC-OPIN-ALL] Opinion questions for every election' },
        category_type: 'opinion',
        sort_order: 1
      },
      {
        external_id: 'qc-opin-list',
        name: { en: '[QC-OPIN-LIST] Opinion questions for the regional election' },
        category_type: 'opinion',
        sort_order: 2,
        _elections: { external_id: [`${P}el-list`] }
      },
      {
        external_id: 'qc-opin-open',
        name: { en: '[QC-OPIN-OPEN] Opinion questions for the national election' },
        category_type: 'opinion',
        sort_order: 3,
        _elections: { external_id: [`${P}el-open`] }
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
        external_id: 'qu-opin-all',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-OPIN-ALL] Opinion asked in every election.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin-all` },
        allow_open: false,
        required: true,
        sort_order: 100
      },
      {
        external_id: 'qu-opin-list',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-OPIN-LIST] Opinion asked in the regional election.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin-list` },
        allow_open: false,
        required: true,
        sort_order: 200
      },
      {
        external_id: 'qu-opin-open',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-OPIN-OPEN] Opinion asked in the national election.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin-open` },
        allow_open: false,
        required: true,
        sort_order: 300
      }
    ]
  },

  // A party's and an alliance's nominations stand under no parent; a candidate's stands under the nomination of a party in the same election and constituency, which is listed before it. No row states `entity_type`: the column is generated from the entity reference.
  nominations: {
    count: 0,
    fixed: [
      {
        external_id: 'nom-or-green-list-north',
        organization: { external_id: `${P}or-green` },
        election: { external_id: `${P}el-list` },
        constituency: { external_id: `${P}co-north` },
        election_round: 1,
        sort_order: 0
      },
      {
        external_id: 'nom-or-green-open',
        organization: { external_id: `${P}or-green` },
        election: { external_id: `${P}el-open` },
        constituency: { external_id: `${P}co-nation` },
        election_round: 1,
        sort_order: 1
      },
      {
        external_id: 'nom-al-coast-open',
        alliance: { external_id: `${P}al-coast` },
        election: { external_id: `${P}el-open` },
        constituency: { external_id: `${P}co-nation` },
        election_round: 1,
        sort_order: 2
      },
      {
        external_id: 'nom-or-edit-list-north',
        organization: { external_id: `${P}or-edit` },
        election: { external_id: `${P}el-list` },
        constituency: { external_id: `${P}co-north` },
        election_round: 1,
        sort_order: 3
      },
      {
        external_id: 'nom-or-edit-open',
        election_symbol: '21',
        organization: { external_id: `${P}or-edit` },
        election: { external_id: `${P}el-open` },
        constituency: { external_id: `${P}co-nation` },
        election_round: 1,
        sort_order: 4
      },
      {
        external_id: 'nom-ca-child-list-north',
        candidate: { external_id: `${P}ca-child` },
        parent_nomination: { external_id: `${P}nom-or-edit-list-north` },
        election: { external_id: `${P}el-list` },
        constituency: { external_id: `${P}co-north` },
        election_round: 1,
        sort_order: 5
      },
      {
        external_id: 'nom-ca-edit-list-north',
        election_symbol: '34',
        candidate: { external_id: `${P}ca-edit` },
        parent_nomination: { external_id: `${P}nom-or-green-list-north` },
        election: { external_id: `${P}el-list` },
        constituency: { external_id: `${P}co-north` },
        election_round: 1,
        sort_order: 6
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

export default permContestantNominationsTemplate;
