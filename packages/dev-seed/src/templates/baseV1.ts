/**
 * `baseV1` built-in template — Phase 88 mega-journey scaffolding (Plan 88-01).
 *
 * Authored from TEST-INVENTORY-REFACTOR-1.md:13-200 (verbatim spec); this is
 * the canonical dataset for the new voter mega-journey at
 * tests/tests/specs/voter/voter-mega-journey.spec.ts.
 *
 * Lands ALONGSIDE the existing `e2e` template (single-election shape); both
 * share `externalIdPrefix: ''` + write `test-`-prefixed external_ids verbatim,
 * cleared by `runTeardown('test-', client)`. Phase 88-01 runs the baseV1
 * chain as a NEW set of playwright projects (data-setup-baseV1 →
 * voter-mega-journey → data-teardown-baseV1) parallel to the existing chain.
 *
 * ## Convention (top-of-file invariants)
 *
 * - `externalIdPrefix: ''` — fixed[] external_ids are pre-written with the
 *   full `test-` literal so `runTeardown('test-', ...)` matches verbatim
 *   (D-58-15 parity with the e2e template).
 * - external_id kebabing: `test-{group}-{name}` lowercase. Symbolic names from
 *   the refactor doc map as:
 *     - Elections:           test-el-reg, test-el-mun
 *     - Constituency groups: test-cg-reg, test-cg-mun
 *     - Constituencies:      test-co-reg-n, test-co-reg-s,
 *                            test-co-mun-ne, test-co-mun-nw,
 *                            test-co-mun-se, test-co-mun-sw
 *     - Question categories: test-qg-info, test-qg-opin-base,
 *                            test-qg-opin-opt-a (was: -base-b),
 *                            test-qg-opin-opt-b (was: -base-c),
 *                            test-qg-opin-el-reg, test-qg-opin-co-mun-se-sw,
 *                            test-qg-opin-filt-a, test-qg-opin-filt-b
 *     - Questions:           test-qu-info-{type}, test-qu-opin-base-{i}-{type},
 *                            test-qu-opin-opt-a-1 (was: -base-b-1),
 *                            test-qu-opin-opt-b-1 (was: -base-c-1),
 *                            test-qu-opin-el-reg-1, test-qu-opin-co-mun-se-sw-1,
 *                            test-qu-open-filt-mun-ne, test-qu-open-filt-mun-se
 *     - Alliances:           test-al-a, test-al-b
 *     - Organisations:       test-or-aa, test-or-ab, test-or-ba, test-or-bb, test-or-c
 *     - Candidates:          test-ca-{org}-{name} or test-ca-{org}-{n}-gen
 *     - Nominations:         test-nom-{constituency-stub}-{entity-type}-{entity-name}
 * - `generateTranslationsForAllLocales: false` (single-locale e2e per D-58-16).
 * - `seed: 42` for deterministic generation.
 *
 * ## Hierarchy (refactor-doc:15-25)
 *
 * Per-constituency parent_id: each CO-Mun-* has parent_id pointing at the
 * matching CO-Reg-* (the Reg constituency). This is implemented via
 * `parent: { external_id }` on each CO-Mun row — the ConstituenciesGenerator
 * passes the sentinel to bulk_import which resolves it server-side
 * (see ConstituenciesGenerator.ts:34-39).
 *   - CO-Mun-NE → parent CO-Reg-N
 *   - CO-Mun-NW → parent CO-Reg-N
 *   - CO-Mun-SE → parent CO-Reg-S
 *   - CO-Mun-SW → parent CO-Reg-S
 * NOTE: the refactor doc's "Fully hierarchical with CG-Reg as parent" line
 * (line 21) is realized at the per-constituency level (USER NOTE on Task 1)
 * rather than at the CG level — there is no CG-level parent relationship on
 * the dev-seed pipeline today.
 *
 * ## Question scoping
 *
 * - QG-Opin-EL-Reg carries `_elections: { external_id: ['test-el-reg'] }`
 *   so linkJoinTables (supabaseAdminClient.ts) resolves to
 *   `election_ids: [uuid(test-el-reg)]` on the question_categories row.
 * - QG-Opin-CO-Mun-SE-SW carries `_constituencies: { external_id: [...] }`
 *   resolved by linkJoinTables to `constituency_ids: [uuid(...)]` JSONB on
 *   the question_categories row (column at migration line 597).
 * - Per-question constituency scoping (QU-Open-Filt-Mun-NE under QG-Opin-Filt-A
 *   and QU-Open-Filt-Mun-SE under QG-Opin-Filt-B) carries the same
 *   `_constituencies: { external_id: [...] }` sentinel on the question row;
 *   resolved to `questions.constituency_ids` JSONB (column at migration line 625).
 *
 * ## Partial-answer candidate arrangement
 *
 * Per USER NOTE on Task 1: voter mega-journey skips QU-Opin-Opt-A-1 (was
 * Base-B-1) and QU-Opin-EL-Reg-1; skips QU-Open-Filt-Mun-NE; and never sees
 * QG-Opin-Opt-B (was Base-C; unchecked) nor QG-Opin-CO-Mun-SE-SW (filtered
 * out for
 * CO-Mun-NE). CA-AA-Special's answer arrangement (one of two
 * partial-answer roles) exercises the 4-case matrix in 9.6.5-8:
 *   - (a) base-1, base-3, base-4, base-5: both answered
 *   - (b) base-2: voter answered, entity missing
 *   - (c) B-1 + EL-Reg-1: voter missing (skipped), entity answered
 *   - (d) Filt-Mun-NE: both missing (voter skipped + entity missing)
 *
 * ## Settings
 *
 * `BASE_V1_APP_SETTINGS` (exported) is the verbatim object literal from
 * refactor-doc:109-200; future variants compose via `mergeSettings(...)`.
 */

import type { Template } from '../template/types';

// ---------------------------------------------------------------------------
// Choice arrays
// ---------------------------------------------------------------------------

const LIKERT_5_EN: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Fully disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Somewhat disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Neutral' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Somewhat agree' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Fully agree' }, normalizableValue: 5 }
];

const LIKERT_4_EN: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Strongly disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Agree' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Strongly agree' }, normalizableValue: 4 }
];

const LIKERT_7_EN: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Strongly disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Somewhat disagree' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Neutral' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Somewhat agree' }, normalizableValue: 5 },
  { id: '6', label: { en: 'Agree' }, normalizableValue: 6 },
  { id: '7', label: { en: 'Strongly agree' }, normalizableValue: 7 }
];

const OPIN_CATEGORICAL_EN: Array<{ id: string; label: { en: string } }> = [
  { id: 'a', label: { en: 'Option A' } },
  { id: 'b', label: { en: 'Option B' } },
  { id: 'c', label: { en: 'Option C' } }
];

const INFO_MULTIPLE_CHOICE_EN: Array<{ id: string; label: { en: string } }> = [
  { id: 'a', label: { en: 'Choice A' } },
  { id: 'b', label: { en: 'Choice B' } },
  { id: 'c', label: { en: 'Choice C' } },
  { id: 'd', label: { en: 'Choice D' } }
];

const INFO_SINGLE_CATEGORICAL_EN: Array<{ id: string; label: { en: string } }> = [
  { id: 'x', label: { en: 'Selection X' } },
  { id: 'y', label: { en: 'Selection Y' } },
  { id: 'z', label: { en: 'Selection Z' } }
];

// ---------------------------------------------------------------------------
// Settings — refactor-doc:109-200 verbatim
// ---------------------------------------------------------------------------

export const BASE_V1_APP_SETTINGS = {
  entityDetails: {
    contents: {
      candidate: ['info', 'opinions'],
      organization: ['info', 'children', 'opinions'],
      alliance: ['info', 'children']
    },
    showMissingElectionSymbol: {
      candidate: true,
      organization: false
    },
    showMissingAnswers: {
      candidate: true,
      organization: true
    }
  },
  header: {
    showFeedback: true,
    showHelp: true
  },
  headerStyle: {
    dark: {
      bgColor: 'oklch(var(--b3))',
      overImgBgColor: 'transparent'
    },
    light: {
      bgColor: 'oklch(var(--b3))',
      overImgBgColor: 'transparent'
    },
    imgSize: 'cover',
    imgPosition: 'center'
  },
  entities: {
    hideIfMissingAnswers: {
      candidate: false
    },
    showAllNominations: true
  },
  matching: {
    minimumAnswers: 5,
    organizationMatching: 'impute'
  },
  questions: {
    categoryIntros: {
      allowSkip: true,
      show: true
    },
    interactiveInfo: {
      enabled: false
    },
    questionsIntro: {
      allowCategorySelection: true,
      show: true
    },
    showCategoryTags: true,
    showResultsLink: true
  },
  results: {
    cardContents: {
      candidate: ['submatches'],
      organization: ['children'],
      alliance: ['children']
    },
    showFeedbackPopup: 180,
    showSurveyPopup: 500,
    sections: ['candidate', 'organization']
  },
  elections: {
    disallowSelection: false,
    showElectionTags: true
    // refactor-doc:181 declares `startFromConstituencyGroup: undefined`;
    // omitting the key is equivalent (JSONB drops `undefined` on serialize,
    // breaking post-seed `toMatchObject` parity if the literal is included).
  },
  access: {
    candidateApp: true,
    voterApp: true,
    adminApp: true,
    underMaintenance: false,
    answersLocked: false
  },
  notifications: {
    candidateApp: null,
    voterApp: null
  },
  candidateApp: {
    questions: {
      hideHero: false,
      hideVideo: false
    }
  }
} as const;

// ---------------------------------------------------------------------------
// Info-question answers (every candidate gets a default for each info q —
// per USER NOTE on Task 1: "fill in all for all candidates" unless reason not to).
// ---------------------------------------------------------------------------

const DEFAULT_INFO_ANSWERS: Record<string, { value: unknown }> = {
  'test-qu-info-multipleChoiceCategorical': { value: ['a', 'b'] },
  'test-qu-info-singleChoiceCategorical': { value: 'y' },
  'test-qu-info-text': { value: { en: 'Default candidate biography text.' } },
  'test-qu-info-text-longText': {
    value: {
      en: 'Default longer biography text used to exercise the longText render branch in the voter entity-detail info tab.'
    }
  },
  'test-qu-info-text-link': { value: 'https://example.com/candidate-link' },
  'test-qu-info-number': { value: 42 },
  'test-qu-info-boolean': { value: true },
  'test-qu-info-date': { value: '1980-06-15' },
  // multipleText: top-level array per validate_answers_jsonb trigger (migration line 233-243);
  // each item is a localized-string object.
  'test-qu-info-multipleText': {
    value: [{ en: 'Tag A' }, { en: 'Tag B' }, { en: 'Tag C' }]
  }
};

function withInfoAnswers(extra: Record<string, { value: unknown }>): Record<string, { value: unknown }> {
  return { ...DEFAULT_INFO_ANSWERS, ...extra };
}

// Polar answer sets for the 5 base opinion questions.
const POLAR_MAX: Record<string, { value: unknown }> = {
  'test-qu-opin-base-1-likert5': { value: '5' },
  'test-qu-opin-base-2-likert4': { value: '4' },
  'test-qu-opin-base-3-likert7': { value: '7' },
  'test-qu-opin-base-4-categorical': { value: 'c' },
  'test-qu-opin-base-5-boolean': { value: true }
};

const POLAR_MIN: Record<string, { value: unknown }> = {
  'test-qu-opin-base-1-likert5': { value: '1' },
  'test-qu-opin-base-2-likert4': { value: '1' },
  'test-qu-opin-base-3-likert7': { value: '1' },
  'test-qu-opin-base-4-categorical': { value: 'a' },
  'test-qu-opin-base-5-boolean': { value: false }
};

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export const baseV1Template: Template = {
  seed: 42,
  externalIdPrefix: '',
  generateTranslationsForAllLocales: false,

  // ------------------------------------------------------------------- elections
  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'test-el-reg',
        name: { en: 'Regional Election' },
        short_name: { en: 'Regional' },
        election_type: 'general',
        election_date: '2026-06-15',
        sort_order: 0,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: 'test-cg-reg' }]
      },
      {
        external_id: 'test-el-mun',
        name: { en: 'Municipal Election' },
        short_name: { en: 'Municipal' },
        election_type: 'local',
        election_date: '2026-06-15',
        sort_order: 1,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: 'test-cg-mun' }]
      }
    ]
  },

  // ------------------------------------------------------------- constituency_groups
  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'test-cg-reg',
        name: { en: 'Regions' },
        sort_order: 0,
        is_generated: false,
        constituencies: [{ external_id: 'test-co-reg-n' }, { external_id: 'test-co-reg-s' }]
      },
      {
        external_id: 'test-cg-mun',
        name: { en: 'Municipalities' },
        sort_order: 1,
        is_generated: false,
        constituencies: [
          { external_id: 'test-co-mun-ne' },
          { external_id: 'test-co-mun-nw' },
          { external_id: 'test-co-mun-se' },
          { external_id: 'test-co-mun-sw' }
        ]
      }
    ]
  },

  // ------------------------------------------------------------------- constituencies
  // CO-Mun-* rows carry `parent: { external_id }` → resolves to parent_id
  // on the constituencies table via bulk_import (ConstituenciesGenerator.ts:34-39).
  constituencies: {
    count: 0,
    fixed: [
      {
        external_id: 'test-co-reg-n',
        name: { en: 'Region North' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-co-reg-s',
        name: { en: 'Region South' },
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-co-mun-ne',
        name: { en: 'Municipality North-East' },
        sort_order: 2,
        is_generated: false,
        parent: { external_id: 'test-co-reg-n' }
      },
      {
        external_id: 'test-co-mun-nw',
        name: { en: 'Municipality North-West' },
        sort_order: 3,
        is_generated: false,
        parent: { external_id: 'test-co-reg-n' }
      },
      {
        external_id: 'test-co-mun-se',
        name: { en: 'Municipality South-East' },
        sort_order: 4,
        is_generated: false,
        parent: { external_id: 'test-co-reg-s' }
      },
      {
        external_id: 'test-co-mun-sw',
        name: { en: 'Municipality South-West' },
        sort_order: 5,
        is_generated: false,
        parent: { external_id: 'test-co-reg-s' }
      }
    ]
  },

  // ------------------------------------------------------------------- organizations
  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'test-or-aa',
        name: { en: 'Party AA' },
        short_name: { en: 'AA' },
        color: { normal: '#1f4ea0', dark: '#7aa3d6' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-or-ab',
        name: { en: 'Party AB' },
        short_name: { en: 'AB' },
        color: { normal: '#3a72c2', dark: '#8db5dc' },
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-or-ba',
        name: { en: 'Party BA' },
        short_name: { en: 'BA' },
        color: { normal: '#a82525', dark: '#d67070' },
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'test-or-bb',
        name: { en: 'Party BB' },
        short_name: { en: 'BB' },
        color: { normal: '#c24545', dark: '#dc8d8d' },
        sort_order: 3,
        is_generated: false
      },
      {
        external_id: 'test-or-c',
        name: { en: 'Party C' },
        short_name: { en: 'C' },
        color: { normal: '#1f8b3c', dark: '#6bdc88' },
        sort_order: 4,
        is_generated: false
      }
    ]
  },

  // ------------------------------------------------------------------- alliances
  alliances: {
    count: 0,
    fixed: [
      {
        external_id: 'test-al-a',
        name: { en: 'Alliance A' },
        short_name: { en: 'AL-A' },
        color: { normal: '#1f4ea0', dark: '#7aa3d6' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-al-b',
        name: { en: 'Alliance B' },
        short_name: { en: 'AL-B' },
        color: { normal: '#a82525', dark: '#d67070' },
        sort_order: 1,
        is_generated: false
      }
    ]
  },

  // -------------------------------------------------------------- question_categories
  // 8 categories total: 1 info + 7 opinion (Base + Opt-A (was Base-B) +
  // Opt-B (was Base-C) + EL-Reg scoped + CO-Mun-SE-SW scoped + Filt-A + Filt-B).
  // Scoping refs (resolved by linkJoinTables from `_<sentinel>` shape):
  //   - QG-Opin-EL-Reg → `_elections` sentinel → election_ids JSONB column.
  //   - QG-Opin-CO-Mun-SE-SW → `_constituencies` sentinel → constituency_ids
  //     JSONB column. Per-question (test-qu-open-filt-mun-ne / -se) entries
  //     in `questions` use the same `_constituencies` sentinel.
  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'test-qg-info',
        name: { en: 'Info Questions' },
        category_type: 'info',
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-qg-opin-base',
        name: { en: 'Base Opinion Questions' },
        category_type: 'opinion',
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-qg-opin-opt-a',
        name: { en: 'Optional Opinion Questions A' },
        category_type: 'opinion',
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'test-qg-opin-opt-b',
        name: { en: 'Optional Opinion Questions B' },
        category_type: 'opinion',
        sort_order: 3,
        is_generated: false
      },
      {
        external_id: 'test-qg-opin-el-reg',
        name: { en: 'Opinion Questions for Regional Elections Only' },
        category_type: 'opinion',
        sort_order: 4,
        is_generated: false,
        _elections: { external_id: ['test-el-reg'] }
      },
      {
        external_id: 'test-qg-opin-co-mun-se-sw',
        name: { en: 'Opinion Questions for Municipalities SE and SW Only' },
        category_type: 'opinion',
        sort_order: 5,
        is_generated: false,
        _constituencies: { external_id: ['test-co-mun-se', 'test-co-mun-sw'] }
      },
      {
        external_id: 'test-qg-opin-filt-a',
        name: { en: 'Opinion Questions Filtered per Question NE' },
        category_type: 'opinion',
        sort_order: 6,
        is_generated: false
      },
      {
        external_id: 'test-qg-opin-filt-b',
        name: { en: 'Opinion Questions Filtered per Question SE' },
        category_type: 'opinion',
        sort_order: 7,
        is_generated: false
      }
    ]
  },

  // ------------------------------------------------------------------- questions
  // 14 questions: 9 info + 5 opinion-base + Opt-A-1 (was Base-B-1) + Opt-B-1
  // (was Base-C-1) + EL-Reg-1 + CO-Mun-SE-SW-1 + Filt-Mun-NE + Filt-Mun-SE
  // = 9 + 5 + 1 + 1 + 1 + 1 + 1 + 1 = 20.
  // Refactor-doc:26-56 says "14 questions total" but the per-line enumeration
  // adds up to 20 (9 info + 5 base + 1 Opt-A + 1 Opt-B + 1 EL-Reg + 1 CO-Mun + 2 Filt).
  // Following the per-line enumeration verbatim — the "14" appears to count
  // opinion questions only (5 + 1 + 1 + 1 + 1 + 2 = 11) or is approximate.
  // The dataset declares all questions the refactor doc explicitly lists.
  questions: {
    count: 0,
    fixed: [
      // QG-Info — 9 questions covering all info question types
      {
        external_id: 'test-qu-info-multipleChoiceCategorical',
        type: 'multipleChoiceCategorical',
        name: { en: 'Info: pick multiple categories that apply.' },
        choices: INFO_MULTIPLE_CHOICE_EN,
        category: { external_id: 'test-qg-info' },
        custom_data: { filterable: true },
        allow_open: false,
        required: false,
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-qu-info-singleChoiceCategorical',
        type: 'singleChoiceCategorical',
        name: { en: 'Info: pick one category.' },
        choices: INFO_SINGLE_CATEGORICAL_EN,
        category: { external_id: 'test-qg-info' },
        // filterable:false per refactor-doc:30 (NOT filterable)
        allow_open: false,
        required: false,
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-qu-info-text',
        type: 'text',
        name: { en: 'Info: short biography.' },
        category: { external_id: 'test-qg-info' },
        allow_open: false,
        required: false,
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'test-qu-info-text-longText',
        type: 'text',
        name: { en: 'Info: long biography.' },
        category: { external_id: 'test-qg-info' },
        custom_data: { longText: true },
        allow_open: false,
        required: false,
        sort_order: 3,
        is_generated: false
      },
      {
        external_id: 'test-qu-info-text-link',
        type: 'text',
        subtype: 'link',
        name: { en: 'Info: personal link.' },
        category: { external_id: 'test-qg-info' },
        settings: { type: 'link' },
        allow_open: false,
        required: false,
        sort_order: 4,
        is_generated: false
      },
      {
        external_id: 'test-qu-info-number',
        type: 'number',
        name: { en: 'Info: years of experience.' },
        category: { external_id: 'test-qg-info' },
        custom_data: { filterable: true, min: 0, max: 80 },
        allow_open: false,
        required: false,
        sort_order: 5,
        is_generated: false
      },
      {
        external_id: 'test-qu-info-boolean',
        type: 'boolean',
        name: { en: 'Info: would-you-run-again-yes-no?' },
        category: { external_id: 'test-qg-info' },
        custom_data: { filterable: true },
        allow_open: false,
        required: false,
        sort_order: 6,
        is_generated: false
      },
      {
        external_id: 'test-qu-info-date',
        type: 'date',
        name: { en: 'Info: date of birth.' },
        category: { external_id: 'test-qg-info' },
        allow_open: false,
        required: false,
        sort_order: 7,
        is_generated: false
      },
      {
        external_id: 'test-qu-info-multipleText',
        type: 'multipleText',
        name: { en: 'Info: keywords.' },
        category: { external_id: 'test-qg-info' },
        allow_open: false,
        required: false,
        sort_order: 8,
        is_generated: false
      },

      // QG-Opin-Base — 5 opinion questions covering ordinal/categorical/boolean variants
      {
        external_id: 'test-qu-opin-base-1-likert5',
        type: 'singleChoiceOrdinal',
        name: { en: 'Base opinion 1 — Likert 5.' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-qg-opin-base' },
        allow_open: true,
        required: true,
        sort_order: 100,
        is_generated: false
      },
      {
        external_id: 'test-qu-opin-base-2-likert4',
        type: 'singleChoiceOrdinal',
        name: { en: 'Base opinion 2 — Likert 4.' },
        choices: LIKERT_4_EN,
        category: { external_id: 'test-qg-opin-base' },
        allow_open: true,
        required: true,
        sort_order: 101,
        is_generated: false
      },
      {
        external_id: 'test-qu-opin-base-3-likert7',
        type: 'singleChoiceOrdinal',
        name: { en: 'Base opinion 3 — Likert 7.' },
        choices: LIKERT_7_EN,
        category: { external_id: 'test-qg-opin-base' },
        allow_open: true,
        required: true,
        sort_order: 102,
        is_generated: false
      },
      {
        external_id: 'test-qu-opin-base-4-categorical',
        type: 'singleChoiceCategorical',
        name: { en: 'Base opinion 4 — Categorical.' },
        choices: OPIN_CATEGORICAL_EN,
        category: { external_id: 'test-qg-opin-base' },
        allow_open: true,
        required: true,
        sort_order: 103,
        is_generated: false
      },
      {
        external_id: 'test-qu-opin-base-5-boolean',
        type: 'boolean',
        name: { en: 'Base opinion 5 — Boolean.' },
        category: { external_id: 'test-qg-opin-base' },
        allow_open: true,
        required: true,
        sort_order: 104,
        is_generated: false
      },

      // QG-Opin-Opt-A (formerly Base-B; used for testing category intros and selection)
      {
        external_id: 'test-qu-opin-opt-a-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'Opt-A opinion 1 — Likert 5.' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-qg-opin-opt-a' },
        allow_open: true,
        required: true,
        sort_order: 110,
        is_generated: false
      },

      // QG-Opin-Opt-B (formerly Base-C; used for filtering out)
      {
        external_id: 'test-qu-opin-opt-b-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'Opt-B opinion 1 — Likert 5.' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-qg-opin-opt-b' },
        allow_open: true,
        required: true,
        sort_order: 120,
        is_generated: false
      },

      // QG-Opin-EL-Reg — Regional-only scoped category; question carries election_ids
      {
        external_id: 'test-qu-opin-el-reg-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'Regional-only opinion 1 — Likert 5.' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-qg-opin-el-reg' },
        // The category itself carries election_ids via _elections (above);
        // the question inherits scoping via its category.
        allow_open: true,
        required: true,
        sort_order: 130,
        is_generated: false
      },

      // QG-Opin-CO-Mun-SE-SW
      {
        external_id: 'test-qu-opin-co-mun-se-sw-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'Municipal SE/SW opinion 1 — Likert 5.' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-qg-opin-co-mun-se-sw' },
        _constituencies: { external_id: ['test-co-mun-se', 'test-co-mun-sw'] },
        allow_open: true,
        required: true,
        sort_order: 140,
        is_generated: false
      },

      // QG-Opin-Filt-A — per-question constituency_ids (CO-Mun-NE)
      {
        external_id: 'test-qu-open-filt-mun-ne',
        type: 'singleChoiceOrdinal',
        name: { en: 'Filtered Mun-NE opinion — Likert 5.' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-qg-opin-filt-a' },
        _constituencies: { external_id: ['test-co-mun-ne'] },
        allow_open: true,
        required: true,
        sort_order: 150,
        is_generated: false
      },

      // QG-Opin-Filt-B — per-question constituency_ids (CO-Mun-SE)
      {
        external_id: 'test-qu-open-filt-mun-se',
        type: 'singleChoiceOrdinal',
        name: { en: 'Filtered Mun-SE opinion — Likert 5.' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-qg-opin-filt-b' },
        _constituencies: { external_id: ['test-co-mun-se'] },
        allow_open: true,
        required: true,
        sort_order: 160,
        is_generated: false
      }
    ]
  },

  // ------------------------------------------------------------------- candidates
  // Per refactor-doc:66-107. terms_of_use_accepted set on all except CA-AA-Hidden
  // (per refactor-doc:72). Every candidate answers every info question by default
  // (USER NOTE on Task 1); opinion answers vary to support matching invariants.
  //
  // Perfect-match candidate: CA-AA-Special (also exercises 4-case matrix below).
  // Worst-match candidate: CA-BA-1 (CO-Reg-N) — all base opinions at polar min.
  // Partial-answer candidate: CA-AA-Special — selected answers per arrangement.
  // Independent candidate: test-ca-independent (no organization).
  candidates: {
    count: 0,
    fixed: [
      // ---- CO-Reg-N — 13 candidates (the bulk per refactor-doc:67-83) ----
      // Per USER NOTE on Task 1: partial-answer arrangement supports the
      // 9.6.5-8 voter-detail matrix given the voter SKIPS qu-opin-base-b-1
      // and qu-opin-el-reg-1 (and filt-mun-ne). CA-AA-Special is the
      // partial-answer candidate; its answer set is asymmetric across the
      // 4 cases (see top-of-file docstring).
      {
        external_id: 'test-ca-aa-special',
        first_name: 'Special',
        last_name: 'Candidate AA',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 0,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        // Partial-answer arrangement (top-of-file docstring §"Partial-answer
        // candidate arrangement"):
        //   (a) both answered: base-1, base-3, base-4, base-5
        //   (b) voter answered, entity missing: base-2 (omitted)
        //   (c) voter missing (skipped), entity answered: B-1, EL-Reg-1
        //   (d) both missing: Filt-Mun-NE (entity also skipped)
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '5' },
          // base-2 INTENTIONALLY missing — case (b)
          'test-qu-opin-base-3-likert7': { value: '7' },
          'test-qu-opin-base-4-categorical': { value: 'c' },
          'test-qu-opin-base-5-boolean': { value: true },
          // case (c) — voter skips these, entity has answers
          'test-qu-opin-opt-a-1': { value: '5' },
          'test-qu-opin-el-reg-1': { value: '5' }
          // test-qu-open-filt-mun-ne INTENTIONALLY missing — case (d)
        })
      },
      {
        external_id: 'test-ca-aa-hidden',
        first_name: 'Hidden',
        last_name: 'Candidate AA',
        // terms_of_use_accepted DELIBERATELY absent (refactor-doc:72)
        sort_order: 1,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '5' },
          'test-qu-opin-base-2-likert4': { value: '4' },
          'test-qu-opin-base-3-likert7': { value: '7' },
          'test-qu-opin-base-4-categorical': { value: 'c' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      // CA-AA-1 — the perfect-match candidate (POLAR_MAX → matches voter answerMode='max')
      {
        external_id: 'test-ca-aa-1',
        first_name: 'Generic',
        last_name: 'AA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 2,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        answersByExternalId: withInfoAnswers(POLAR_MAX)
      },
      {
        external_id: 'test-ca-aa-2',
        first_name: 'Generic',
        last_name: 'AA Two',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 3,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '6' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      {
        external_id: 'test-ca-aa-3',
        first_name: 'Generic',
        last_name: 'AA Three',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 4,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '5' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },
      {
        external_id: 'test-ca-aa-4',
        first_name: 'Generic',
        last_name: 'AA Four',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 5,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '3' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '4' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      // OR-AB — 1 candidate in CO-Reg-N
      {
        external_id: 'test-ca-ab-1',
        first_name: 'Generic',
        last_name: 'AB One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 6,
        is_generated: false,
        organization: { external_id: 'test-or-ab' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '4' },
          'test-qu-opin-base-3-likert7': { value: '6' },
          'test-qu-opin-base-4-categorical': { value: 'c' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      // OR-BA — 2 candidates in CO-Reg-N. CA-BA-1 = worst-match (polar min)
      {
        external_id: 'test-ca-ba-1',
        first_name: 'Generic',
        last_name: 'BA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 7,
        is_generated: false,
        organization: { external_id: 'test-or-ba' },
        answersByExternalId: withInfoAnswers(POLAR_MIN)
      },
      {
        external_id: 'test-ca-ba-2',
        first_name: 'Generic',
        last_name: 'BA Two',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 8,
        is_generated: false,
        organization: { external_id: 'test-or-ba' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '2' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '2' },
          'test-qu-opin-base-4-categorical': { value: 'a' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },
      // OR-BB — 2 candidates in CO-Reg-N
      {
        external_id: 'test-ca-bb-1',
        first_name: 'Generic',
        last_name: 'BB One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 9,
        is_generated: false,
        organization: { external_id: 'test-or-bb' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '2' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '3' },
          'test-qu-opin-base-4-categorical': { value: 'a' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },
      {
        external_id: 'test-ca-bb-2',
        first_name: 'Generic',
        last_name: 'BB Two',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 10,
        is_generated: false,
        organization: { external_id: 'test-or-bb' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '3' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '4' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },
      // OR-C — 2 candidates in CO-Reg-N (unaffiliated party)
      {
        external_id: 'test-ca-c-1',
        first_name: 'Generic',
        last_name: 'C One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 11,
        is_generated: false,
        organization: { external_id: 'test-or-c' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '3' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '5' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      {
        external_id: 'test-ca-c-2',
        first_name: 'Generic',
        last_name: 'C Two',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 12,
        is_generated: false,
        organization: { external_id: 'test-or-c' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '4' },
          'test-qu-opin-base-4-categorical': { value: 'c' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      // Independent in CO-Reg-N (also the only candidate in CO-Mun-NW)
      {
        external_id: 'test-ca-independent',
        first_name: 'Free',
        last_name: 'Independent',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 13,
        is_generated: false,
        // No organization — independent (refactor-doc:83)
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '5' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },

      // ---- CO-Reg-S — 4 candidates ("not always allied" foil) ----
      // OR-AA + OR-AB are present BUT NOT under AL-A here. Per refactor-doc:84-94,
      // CO-Reg-S has OR-AA + OR-AB UNGROUPED, plus AL-B with OR-BA + OR-BB.
      {
        external_id: 'test-ca-reg-s-aa-1',
        first_name: 'South',
        last_name: 'AA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 20,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '5' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      {
        external_id: 'test-ca-reg-s-ab-1',
        first_name: 'South',
        last_name: 'AB One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 21,
        is_generated: false,
        organization: { external_id: 'test-or-ab' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '3' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '4' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      {
        external_id: 'test-ca-reg-s-ba-1',
        first_name: 'South',
        last_name: 'BA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 22,
        is_generated: false,
        organization: { external_id: 'test-or-ba' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '2' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '3' },
          'test-qu-opin-base-4-categorical': { value: 'a' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },
      {
        external_id: 'test-ca-reg-s-bb-1',
        first_name: 'South',
        last_name: 'BB One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 23,
        is_generated: false,
        organization: { external_id: 'test-or-bb' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '2' },
          'test-qu-opin-base-2-likert4': { value: '1' },
          'test-qu-opin-base-3-likert7': { value: '3' },
          'test-qu-opin-base-4-categorical': { value: 'a' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },

      // ---- CO-Mun-NE — 6 candidates (CA-AA-Special re-nominated + 1 AA-gen + 1 per other party) ----
      // CA-AA-Special is re-nominated (same candidate row, additional nomination triangle below).
      {
        external_id: 'test-ca-mun-ne-aa-1',
        first_name: 'NE',
        last_name: 'AA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 30,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '5' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      {
        external_id: 'test-ca-mun-ne-ab-1',
        first_name: 'NE',
        last_name: 'AB One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 31,
        is_generated: false,
        organization: { external_id: 'test-or-ab' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '3' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '4' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      {
        external_id: 'test-ca-mun-ne-ba-1',
        first_name: 'NE',
        last_name: 'BA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 32,
        is_generated: false,
        organization: { external_id: 'test-or-ba' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '2' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '3' },
          'test-qu-opin-base-4-categorical': { value: 'a' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },
      {
        external_id: 'test-ca-mun-ne-bb-1',
        first_name: 'NE',
        last_name: 'BB One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 33,
        is_generated: false,
        organization: { external_id: 'test-or-bb' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '2' },
          'test-qu-opin-base-2-likert4': { value: '1' },
          'test-qu-opin-base-3-likert7': { value: '3' },
          'test-qu-opin-base-4-categorical': { value: 'a' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },
      {
        external_id: 'test-ca-mun-ne-c-1',
        first_name: 'NE',
        last_name: 'C One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 34,
        is_generated: false,
        organization: { external_id: 'test-or-c' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '3' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '4' },
          'test-qu-opin-base-4-categorical': { value: 'c' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },

      // ---- CO-Mun-SE — 4 candidates (1 per OR-AA..BB) ----
      {
        external_id: 'test-ca-mun-se-aa-1',
        first_name: 'SE',
        last_name: 'AA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 40,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '6' },
          'test-qu-opin-base-4-categorical': { value: 'c' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      {
        external_id: 'test-ca-mun-se-ab-1',
        first_name: 'SE',
        last_name: 'AB One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 41,
        is_generated: false,
        organization: { external_id: 'test-or-ab' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '4' },
          'test-qu-opin-base-3-likert7': { value: '5' },
          'test-qu-opin-base-4-categorical': { value: 'b' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      {
        external_id: 'test-ca-mun-se-ba-1',
        first_name: 'SE',
        last_name: 'BA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 42,
        is_generated: false,
        organization: { external_id: 'test-or-ba' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '2' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '2' },
          'test-qu-opin-base-4-categorical': { value: 'a' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },
      {
        external_id: 'test-ca-mun-se-bb-1',
        first_name: 'SE',
        last_name: 'BB One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 43,
        is_generated: false,
        organization: { external_id: 'test-or-bb' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '2' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '3' },
          'test-qu-opin-base-4-categorical': { value: 'a' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      },

      // ---- CO-Mun-SW — 2 candidates (OR-AA + OR-BA per refactor-doc:107) ----
      {
        external_id: 'test-ca-mun-sw-aa-1',
        first_name: 'SW',
        last_name: 'AA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 50,
        is_generated: false,
        organization: { external_id: 'test-or-aa' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '4' },
          'test-qu-opin-base-2-likert4': { value: '3' },
          'test-qu-opin-base-3-likert7': { value: '5' },
          'test-qu-opin-base-4-categorical': { value: 'c' },
          'test-qu-opin-base-5-boolean': { value: true }
        })
      },
      {
        external_id: 'test-ca-mun-sw-ba-1',
        first_name: 'SW',
        last_name: 'BA One',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 51,
        is_generated: false,
        organization: { external_id: 'test-or-ba' },
        answersByExternalId: withInfoAnswers({
          'test-qu-opin-base-1-likert5': { value: '2' },
          'test-qu-opin-base-2-likert4': { value: '2' },
          'test-qu-opin-base-3-likert7': { value: '3' },
          'test-qu-opin-base-4-categorical': { value: 'a' },
          'test-qu-opin-base-5-boolean': { value: false }
        })
      }
    ]
  },

  // ------------------------------------------------------------------- nominations
  // Per refactor-doc:66-107. Each constituency / election triangle:
  //   1. Alliance-type nomination (declared first; parent for the OR-* nominations under it)
  //   2. Organization-type nominations (parent for the candidate nominations under each)
  //   3. Candidate-type nominations (each links candidate ID + parent_nomination → its OR)
  //
  // CO-Mun-NW carries ONLY CA-Independent (refactor-doc:102-103).
  // OR-C is NOT alliance-affiliated.
  nominations: {
    count: 0,
    fixed: [
      // ================== EL-Reg / CO-Reg-N ==================
      // Alliances
      {
        external_id: 'test-nom-reg-n-al-a',
        alliance: { external_id: 'test-al-a' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-al-b',
        alliance: { external_id: 'test-al-b' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      // Organizations under AL-A
      {
        external_id: 'test-nom-reg-n-or-aa',
        organization: { external_id: 'test-or-aa' },
        parent_nomination: { external_id: 'test-nom-reg-n-al-a' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-or-ab',
        organization: { external_id: 'test-or-ab' },
        parent_nomination: { external_id: 'test-nom-reg-n-al-a' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      // Organizations under AL-B
      {
        external_id: 'test-nom-reg-n-or-ba',
        organization: { external_id: 'test-or-ba' },
        parent_nomination: { external_id: 'test-nom-reg-n-al-b' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-or-bb',
        organization: { external_id: 'test-or-bb' },
        parent_nomination: { external_id: 'test-nom-reg-n-al-b' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      // OR-C — standalone (no alliance)
      {
        external_id: 'test-nom-reg-n-or-c',
        organization: { external_id: 'test-or-c' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      // Candidates (CO-Reg-N)
      {
        external_id: 'test-nom-reg-n-ca-aa-special',
        candidate: { external_id: 'test-ca-aa-special' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-aa' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-aa-hidden',
        candidate: { external_id: 'test-ca-aa-hidden' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-aa' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-aa-1',
        candidate: { external_id: 'test-ca-aa-1' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-aa' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-aa-2',
        candidate: { external_id: 'test-ca-aa-2' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-aa' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-aa-3',
        candidate: { external_id: 'test-ca-aa-3' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-aa' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-aa-4',
        candidate: { external_id: 'test-ca-aa-4' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-aa' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-ab-1',
        candidate: { external_id: 'test-ca-ab-1' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-ab' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-ba-1',
        candidate: { external_id: 'test-ca-ba-1' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-ba' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-ba-2',
        candidate: { external_id: 'test-ca-ba-2' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-ba' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-bb-1',
        candidate: { external_id: 'test-ca-bb-1' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-bb' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-bb-2',
        candidate: { external_id: 'test-ca-bb-2' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-bb' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-c-1',
        candidate: { external_id: 'test-ca-c-1' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-c' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-c-2',
        candidate: { external_id: 'test-ca-c-2' },
        parent_nomination: { external_id: 'test-nom-reg-n-or-c' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-n-ca-independent',
        candidate: { external_id: 'test-ca-independent' },
        // No parent_nomination — independent (refactor-doc:83)
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-n' },
        election_round: 1
      },

      // ================== EL-Reg / CO-Reg-S ==================
      // Per refactor-doc:84-94: OR-AA + OR-AB UNGROUPED (no AL-A), plus AL-B with OR-BA + OR-BB.
      {
        external_id: 'test-nom-reg-s-al-b',
        alliance: { external_id: 'test-al-b' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-s' },
        election_round: 1
      },
      // OR-AA + OR-AB standalone (no AL-A here)
      {
        external_id: 'test-nom-reg-s-or-aa',
        organization: { external_id: 'test-or-aa' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-s' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-s-or-ab',
        organization: { external_id: 'test-or-ab' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-s' },
        election_round: 1
      },
      // OR-BA + OR-BB under AL-B
      {
        external_id: 'test-nom-reg-s-or-ba',
        organization: { external_id: 'test-or-ba' },
        parent_nomination: { external_id: 'test-nom-reg-s-al-b' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-s' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-s-or-bb',
        organization: { external_id: 'test-or-bb' },
        parent_nomination: { external_id: 'test-nom-reg-s-al-b' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-s' },
        election_round: 1
      },
      // CO-Reg-S candidates
      {
        external_id: 'test-nom-reg-s-ca-aa-1',
        candidate: { external_id: 'test-ca-reg-s-aa-1' },
        parent_nomination: { external_id: 'test-nom-reg-s-or-aa' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-s' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-s-ca-ab-1',
        candidate: { external_id: 'test-ca-reg-s-ab-1' },
        parent_nomination: { external_id: 'test-nom-reg-s-or-ab' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-s' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-s-ca-ba-1',
        candidate: { external_id: 'test-ca-reg-s-ba-1' },
        parent_nomination: { external_id: 'test-nom-reg-s-or-ba' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-s' },
        election_round: 1
      },
      {
        external_id: 'test-nom-reg-s-ca-bb-1',
        candidate: { external_id: 'test-ca-reg-s-bb-1' },
        parent_nomination: { external_id: 'test-nom-reg-s-or-bb' },
        election: { external_id: 'test-el-reg' },
        constituency: { external_id: 'test-co-reg-s' },
        election_round: 1
      },

      // ================== EL-Mun / CO-Mun-NE ==================
      // Alliances + orgs at the municipal constituency
      {
        external_id: 'test-nom-mun-ne-al-a',
        alliance: { external_id: 'test-al-a' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-al-b',
        alliance: { external_id: 'test-al-b' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-or-aa',
        organization: { external_id: 'test-or-aa' },
        parent_nomination: { external_id: 'test-nom-mun-ne-al-a' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-or-ab',
        organization: { external_id: 'test-or-ab' },
        parent_nomination: { external_id: 'test-nom-mun-ne-al-a' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-or-ba',
        organization: { external_id: 'test-or-ba' },
        parent_nomination: { external_id: 'test-nom-mun-ne-al-b' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-or-bb',
        organization: { external_id: 'test-or-bb' },
        parent_nomination: { external_id: 'test-nom-mun-ne-al-b' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-or-c',
        organization: { external_id: 'test-or-c' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      // Candidates (CO-Mun-NE)
      // CA-AA-Special is re-nominated here (refactor-doc:99)
      {
        external_id: 'test-nom-mun-ne-ca-aa-special',
        candidate: { external_id: 'test-ca-aa-special' },
        parent_nomination: { external_id: 'test-nom-mun-ne-or-aa' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-ca-aa-1',
        candidate: { external_id: 'test-ca-mun-ne-aa-1' },
        parent_nomination: { external_id: 'test-nom-mun-ne-or-aa' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-ca-ab-1',
        candidate: { external_id: 'test-ca-mun-ne-ab-1' },
        parent_nomination: { external_id: 'test-nom-mun-ne-or-ab' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-ca-ba-1',
        candidate: { external_id: 'test-ca-mun-ne-ba-1' },
        parent_nomination: { external_id: 'test-nom-mun-ne-or-ba' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-ca-bb-1',
        candidate: { external_id: 'test-ca-mun-ne-bb-1' },
        parent_nomination: { external_id: 'test-nom-mun-ne-or-bb' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-ne-ca-c-1',
        candidate: { external_id: 'test-ca-mun-ne-c-1' },
        parent_nomination: { external_id: 'test-nom-mun-ne-or-c' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-ne' },
        election_round: 1
      },

      // ================== EL-Mun / CO-Mun-NW ==================
      // Only CA-Independent (refactor-doc:102-103)
      {
        external_id: 'test-nom-mun-nw-ca-independent',
        candidate: { external_id: 'test-ca-independent' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-nw' },
        election_round: 1
      },

      // ================== EL-Mun / CO-Mun-SE ==================
      // OR-AA..BB each with 1 candidate
      {
        external_id: 'test-nom-mun-se-al-a',
        alliance: { external_id: 'test-al-a' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-se-al-b',
        alliance: { external_id: 'test-al-b' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-se-or-aa',
        organization: { external_id: 'test-or-aa' },
        parent_nomination: { external_id: 'test-nom-mun-se-al-a' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-se-or-ab',
        organization: { external_id: 'test-or-ab' },
        parent_nomination: { external_id: 'test-nom-mun-se-al-a' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-se-or-ba',
        organization: { external_id: 'test-or-ba' },
        parent_nomination: { external_id: 'test-nom-mun-se-al-b' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-se-or-bb',
        organization: { external_id: 'test-or-bb' },
        parent_nomination: { external_id: 'test-nom-mun-se-al-b' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-se-ca-aa-1',
        candidate: { external_id: 'test-ca-mun-se-aa-1' },
        parent_nomination: { external_id: 'test-nom-mun-se-or-aa' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-se-ca-ab-1',
        candidate: { external_id: 'test-ca-mun-se-ab-1' },
        parent_nomination: { external_id: 'test-nom-mun-se-or-ab' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-se-ca-ba-1',
        candidate: { external_id: 'test-ca-mun-se-ba-1' },
        parent_nomination: { external_id: 'test-nom-mun-se-or-ba' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-se-ca-bb-1',
        candidate: { external_id: 'test-ca-mun-se-bb-1' },
        parent_nomination: { external_id: 'test-nom-mun-se-or-bb' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-se' },
        election_round: 1
      },

      // ================== EL-Mun / CO-Mun-SW ==================
      // OR-AA + OR-BA each with 1 candidate (refactor-doc:107)
      {
        external_id: 'test-nom-mun-sw-al-a',
        alliance: { external_id: 'test-al-a' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-sw' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-sw-al-b',
        alliance: { external_id: 'test-al-b' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-sw' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-sw-or-aa',
        organization: { external_id: 'test-or-aa' },
        parent_nomination: { external_id: 'test-nom-mun-sw-al-a' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-sw' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-sw-or-ba',
        organization: { external_id: 'test-or-ba' },
        parent_nomination: { external_id: 'test-nom-mun-sw-al-b' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-sw' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-sw-ca-aa-1',
        candidate: { external_id: 'test-ca-mun-sw-aa-1' },
        parent_nomination: { external_id: 'test-nom-mun-sw-or-aa' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-sw' },
        election_round: 1
      },
      {
        external_id: 'test-nom-mun-sw-ca-ba-1',
        candidate: { external_id: 'test-ca-mun-sw-ba-1' },
        parent_nomination: { external_id: 'test-nom-mun-sw-or-ba' },
        election: { external_id: 'test-el-mun' },
        constituency: { external_id: 'test-co-mun-sw' },
        election_round: 1
      }
    ]
  },

  // ------------------------------------------------------------------- app_settings
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-baseV1',
        settings: BASE_V1_APP_SETTINGS
      }
    ]
  }
};

export default baseV1Template;
