/**
 * perm-organization-editing minimal-data template: the dataset an organization's editor and a candidate's editor each edit their own entity on.
 *
 * Topology: 1 election, 1 constituency group with 1 constituency, 2 organizations, 1 candidate, 1 nomination each, an info and an opinion category, 6 questions.
 *
 * What each row is for:
 *   - `or-confirmed` takes the seed's confirmed default, and so does its nomination: voters see it, and its two names are frozen. Its name has an entry in the default locale and in one other. It has no logo and no colour, so a colour stored on it is what its avatar is painted with. It answers every opinion question but the last and no info question.
 *   - `or-unconfirmed` states `confirmed: false`: voters see neither it nor its nomination, and its two names are editable. Its name has an entry in one locale that is not the default one, and it has no short name, no logo, no colour and no answer.
 *   - `ca-unconfirmed` states `confirmed: false`: voters do not see it, and its first and last name are editable. It belongs to no organization and answers nothing. No opinion question is addressed to candidates, so it is an entity with nothing to answer. The row and its nomination are one block, and nothing else in the dataset depends on them.
 *   - `qu-opin-1` to `qu-opin-3` are addressed to organizations alone. The last, which the confirmed organization has not answered, admits an open comment beside its answer; the other two do not.
 *   - `qu-info-org` is an editable info question for organizations; `qu-info-org-locked` is an info question for organizations that its custom data locks and that nobody answers; `qu-info-cand` is an editable info question for candidates, which shows that an organization is not asked a candidate's question. None is required.
 *
 * Settings: `MINIMAL_BASE_APP_SETTINGS`, with three roots restated. The Contestant App serves both entity types; `entityTypes` is a list, and a stored list replaces the default one whole, so the root is stated complete. Candidates lacking an opinion answer are not hidden, because hiding them also removes every organization left without a visible candidate. Organizations are matched on their own answers, since neither organization has a member a voter can see.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-organization-editing-'`. Row external_ids are bare; nested references are prefixed. The ids are semantic slugs with hyphens, which no generator emits: a generated id is a type code, an underscore and a zero-padded number.
 */

import { LIKERT_5_EN, MINIMAL_BASE_APP_SETTINGS } from './shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-organization-editing-';

/** The confirmed organization's own answers: every opinion question but the last. Keyed by the full prefixed question external_id. */
const CONFIRMED_ORGANIZATION_ANSWERS: Record<string, { value: unknown }> = {
  [`${P}qu-opin-1`]: { value: '5' },
  [`${P}qu-opin-2`]: { value: '1' }
};

export const permOrganizationEditingTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] Organization-editing election' },
        short_name: { en: 'EL1' },
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
        name: { en: '[CG1] Only group' },
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
        name: { en: '[CO1] Only constituency' },
        sort_order: 0
      }
    ]
  },

  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'or-confirmed',
        name: { en: '[OR-A] Confirmed Party', fi: '[OR-A] Vahvistettu puolue' },
        short_name: { en: 'ORA', fi: 'ORA-FI' },
        sort_order: 0,
        answersByExternalId: CONFIRMED_ORGANIZATION_ANSWERS
      },
      {
        external_id: 'or-unconfirmed',
        name: { fi: '[OR-B] Vahvistamaton puolue' },
        confirmed: false,
        sort_order: 1
      }
    ]
  },

  alliances: { count: 0 },
  factions: { count: 0 },

  // The candidate block: this row and its nomination below.
  candidates: {
    count: 0,
    fixed: [
      {
        external_id: 'ca-unconfirmed',
        first_name: '[CA-U] Unconfirmed',
        last_name: 'Candidate',
        confirmed: false,
        sort_order: 0
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
        external_id: 'qu-info-org',
        type: 'text',
        name: { en: '[QU-INFO-ORG] Describe the party' },
        category: { external_id: `${P}qc-info` },
        entity_type: ['organization'],
        allow_open: false,
        required: false,
        sort_order: 0
      },
      {
        external_id: 'qu-info-org-locked',
        type: 'text',
        name: { en: '[QU-INFO-ORG-LOCKED] Registration number' },
        category: { external_id: `${P}qc-info` },
        entity_type: ['organization'],
        custom_data: { locked: true },
        allow_open: false,
        required: false,
        sort_order: 1
      },
      {
        external_id: 'qu-info-cand',
        type: 'text',
        name: { en: '[QU-INFO-CAND] Describe yourself' },
        category: { external_id: `${P}qc-info` },
        entity_type: ['candidate'],
        allow_open: false,
        required: false,
        sort_order: 2
      },
      {
        external_id: 'qu-opin-1',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-OPIN-1] Organization-editing opinion 1.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        entity_type: ['organization'],
        allow_open: false,
        required: true,
        sort_order: 100
      },
      {
        external_id: 'qu-opin-2',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-OPIN-2] Organization-editing opinion 2.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        entity_type: ['organization'],
        allow_open: false,
        required: true,
        sort_order: 101
      },
      {
        external_id: 'qu-opin-3',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-OPIN-3] Organization-editing opinion 3 (the confirmed party leaves it blank).' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        entity_type: ['organization'],
        allow_open: true,
        required: true,
        sort_order: 102
      }
    ]
  },

  // One nomination per entity, none under a parent, all in the one election and constituency. No row states `entity_type`: the column is generated from the entity reference.
  nominations: {
    count: 0,
    fixed: [
      {
        external_id: 'nom-or-confirmed',
        organization: { external_id: `${P}or-confirmed` },
        election: { external_id: `${P}el-1` },
        constituency: { external_id: `${P}co-1` },
        election_round: 1
      },
      {
        external_id: 'nom-or-unconfirmed',
        organization: { external_id: `${P}or-unconfirmed` },
        election: { external_id: `${P}el-1` },
        constituency: { external_id: `${P}co-1` },
        election_round: 1
      },
      // The candidate block's nomination.
      {
        external_id: 'nom-ca-unconfirmed',
        election_symbol: '1',
        candidate: { external_id: `${P}ca-unconfirmed` },
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
          entities: {
            ...MINIMAL_BASE_APP_SETTINGS.entities,
            hideIfMissingAnswers: {
              candidate: false
            }
          },
          matching: {
            ...MINIMAL_BASE_APP_SETTINGS.matching,
            organizationMatching: 'answersOnly'
          },
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

export default permOrganizationEditingTemplate;
