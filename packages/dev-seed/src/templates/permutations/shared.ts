/**
 * Shared building blocks for the 8 perm-* minimal-data templates.
 *
 * Phase 88 Plan 03. Authored from TEST-INVENTORY-REFACTOR-2.md:7-109 (the
 * minimal-base dataset shape + base settings block).
 *
 * Per 88-03-SCOPE.md "Operator amendments — A2": every entity's `name` field
 * uses the `[<SYMBOL>] <description>` display convention so specs can match
 * inline via `/\[<SYMBOL>\]/i` regexes without a shared `TEXT_RE` bucket.
 *
 * Prefix discipline (88-03-SCOPE.md:104-110 + invariant 6):
 *   - Templates declare a unique `externalIdPrefix` (e.g.
 *     `'test-perm-1e1cg1co-'`). The writer prepends this prefix to every
 *     row's top-level `external_id` AT WRITE TIME — row external_ids in
 *     `fixed[]` are AUTHORED BARE (e.g. `external_id: 'el-1'`) and become
 *     `test-perm-1e1cg1co-el-1` after the writer's prepend.
 *   - Nested-ref `external_id` fields (e.g. `organization: { external_id: ... }`,
 *     `parent: { external_id: ... }`) are passed VERBATIM by the writer to
 *     bulk_import — so they MUST contain the FULL prefixed external_id
 *     (e.g. `organization: { external_id: 'test-perm-1e1cg1co-or-1' }`).
 *     The shared builder functions below take a `P` (prefix) argument and
 *     emit refs with `${P}or-1` etc.
 *
 * This matches the documented behavior in Risk #6 of 88-03-PLAN.md and
 * preserves the parallel-only contract: `setupFromTemplate.ts:131-137`
 * derives the teardown prefix from `template.externalIdPrefix`, so each
 * perm-* setup teardowns ITS OWN unique prefix.
 */

/**
 * Likert-5 choices for opinion questions. Mirrors baseV1 / e2e shape so
 * Phase 57's latent-factor emitter (ordinal dispatch) treats perm-* opinion
 * questions identically.
 */
export const LIKERT_5_EN: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Fully disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Somewhat disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Neutral' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Somewhat agree' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Fully agree' }, normalizableValue: 5 }
];

/**
 * Minimal-base app_settings — TEST-INVENTORY-REFACTOR-2.md:19-109 verbatim.
 *
 * The `elections.startFromConstituencyGroup` key is OMITTED entirely per Plan
 * 88-01 Deviation T1 (JSONB drops `undefined` keys and breaks
 * `toMatchObject` parity in setupFromTemplate's post-seed assertion). Variants
 * that override `disallowSelection` spread this base.
 *
 * `matching.minimumAnswers = 1` so the perm-* specs need to answer at most
 * one opinion question.
 */
export const MINIMAL_BASE_APP_SETTINGS = {
  entityDetails: {
    contents: {
      candidate: ['info', 'opinions'],
      organization: ['info', 'children', 'opinions']
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
    showFeedback: false,
    showHelp: false
  },
  entities: {
    hideIfMissingAnswers: {
      candidate: false
    },
    showAllNominations: true
  },
  matching: {
    minimumAnswers: 1,
    organizationMatching: 'impute'
  },
  questions: {
    categoryIntros: {
      allowSkip: true,
      show: false
    },
    questionsIntro: {
      allowCategorySelection: false,
      show: false
    },
    showCategoryTags: false,
    showResultsLink: true
  },
  results: {
    cardContents: {
      candidate: ['submatches'],
      organization: ['children']
    },
    sections: ['candidate', 'organization'],
    showFeedbackPopup: 0,
    showSurveyPopup: 0
  },
  elections: {
    disallowSelection: false,
    showElectionTags: true
    // startFromConstituencyGroup OMITTED — see top-of-file JSONB rationale.
  },
  access: {
    candidateApp: true,
    voterApp: true,
    adminApp: true,
    underMaintenance: false,
    answersLocked: false
  },
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
} as const;

/**
 * Build the standard 2 question_categories (1 info + 1 opinion).
 *
 * Row external_ids are BARE (the writer prepends `P`). The category
 * reference IS NOT a nested ref — `question_categories` rows have no
 * cross-table refs themselves.
 */
export function buildQuestionCategories(): Array<Record<string, unknown>> {
  return [
    {
      external_id: 'qc-info',
      name: { en: '[QC-INFO] Info questions' },
      category_type: 'info',
      sort_order: 0,
      is_generated: false
    },
    {
      external_id: 'qc-opin',
      name: { en: '[QC-OPIN] Opinion questions' },
      category_type: 'opinion',
      sort_order: 1,
      is_generated: false
    }
  ];
}

/**
 * Build the standard 2 questions (text info + Likert5 opinion). The nested
 * `category` ref uses the FULL prefixed external_id (writer passes refs
 * verbatim).
 */
export function buildQuestions(P: string): Array<Record<string, unknown>> {
  return [
    {
      external_id: 'qu-info-text',
      type: 'text',
      name: { en: '[QU-INFO-TEXT] Tell us about yourself' },
      category: { external_id: `${P}qc-info` },
      allow_open: false,
      required: false,
      sort_order: 0,
      is_generated: false
    },
    {
      external_id: 'qu-opin-l5',
      type: 'singleChoiceOrdinal',
      name: { en: '[QU-OPIN-L5] I agree with this statement.' },
      choices: LIKERT_5_EN,
      category: { external_id: `${P}qc-opin` },
      allow_open: false,
      required: true,
      sort_order: 100,
      is_generated: false
    }
  ];
}

/**
 * Build the standard 2 organizations. Row external_ids are BARE (the writer
 * prepends `P`).
 */
export function buildOrganizations(): Array<Record<string, unknown>> {
  return [
    {
      external_id: 'or-1',
      name: { en: '[OR1] Party One' },
      short_name: { en: 'OR1' },
      color: { normal: '#1f4ea0', dark: '#7aa3d6' },
      sort_order: 0,
      is_generated: false
    },
    {
      external_id: 'or-2',
      name: { en: '[OR2] Party Two' },
      short_name: { en: 'OR2' },
      color: { normal: '#a82525', dark: '#d67070' },
      sort_order: 1,
      is_generated: false
    }
  ];
}

/**
 * Build standard candidate answers (info text + Likert5 neutral) used by
 * every perm-* candidate. Keyed by FULL prefixed question external_ids
 * (importAnswers resolves the question external_id verbatim against the DB).
 */
export function buildStandardCandidateAnswers(P: string): Record<string, { value: unknown }> {
  return {
    [`${P}qu-info-text`]: { value: { en: '(test info)' } },
    [`${P}qu-opin-l5`]: { value: '3' }
  };
}

/**
 * Build a candidate row. Row external_id is BARE (writer prepends `P`).
 * The nested `organization` ref uses the FULL prefixed external_id.
 *
 * @param P            prefix (e.g. `'test-perm-1e1cg1co-'`) — used for refs
 * @param orgN         organization index (1 or 2, matching or-1 / or-2)
 * @param candLetter   candidate letter unique within (orgN, constituency)
 * @param idSuffix     candidate's row external_id (BARE; writer prepends P)
 * @param sortOrder    candidate row sort_order
 */
export function buildCandidate(
  P: string,
  orgN: 1 | 2,
  candLetter: string,
  idSuffix: string,
  sortOrder: number
): Record<string, unknown> {
  return {
    external_id: idSuffix,
    first_name: `[CA${orgN}${candLetter}]`,
    last_name: `Candidate ${orgN === 1 ? 'One' : 'Two'} ${candLetter}`,
    terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
    sort_order: sortOrder,
    is_generated: false,
    organization: { external_id: `${P}or-${orgN}` },
    answersByExternalId: buildStandardCandidateAnswers(P)
  };
}

/**
 * Build a tuple of (or-1 org nom, or-2 org nom, candidate-1 nom, candidate-2
 * nom, ...) for the given election × constituency. Returns 2 + N rows.
 *
 * Row external_ids are BARE; nested refs use the FULL prefixed external_id.
 *
 * `electionSymbolStart` is the symbol number for the first candidate
 * nomination (subsequent candidates increment by 1).
 */
export function buildElectionConstituencyNoms(
  P: string,
  electionIdSuffix: string,
  constituencyIdSuffix: string,
  candidateIdSuffixes: Array<string>,
  electionSymbolStart: number,
  /** Optional nomination external_id sub-prefix to disambiguate when one
   *  election × constituency pair recurs across different shapes (rare). */
  nomKeyPrefix: string = ''
): Array<Record<string, unknown>> {
  const electionExtId = `${P}${electionIdSuffix}`;
  const constituencyExtId = `${P}${constituencyIdSuffix}`;
  const key = nomKeyPrefix === '' ? `${electionIdSuffix}-${constituencyIdSuffix}` : nomKeyPrefix;
  const noms: Array<Record<string, unknown>> = [
    {
      external_id: `nom-${key}-or-1`,
      organization: { external_id: `${P}or-1` },
      election: { external_id: electionExtId },
      constituency: { external_id: constituencyExtId },
      election_round: 1
    },
    {
      external_id: `nom-${key}-or-2`,
      organization: { external_id: `${P}or-2` },
      election: { external_id: electionExtId },
      constituency: { external_id: constituencyExtId },
      election_round: 1
    }
  ];
  for (let i = 0; i < candidateIdSuffixes.length; i++) {
    const candIdSuffix = candidateIdSuffixes[i];
    const orgN = i % 2 === 0 ? 1 : 2;
    noms.push({
      external_id: `nom-${key}-${candIdSuffix}`,
      election_symbol: String(electionSymbolStart + i),
      candidate: { external_id: `${P}${candIdSuffix}` },
      parent_nomination: { external_id: `${P}nom-${key}-or-${orgN}` },
      election: { external_id: electionExtId },
      constituency: { external_id: constituencyExtId },
      election_round: 1
    });
  }
  return noms;
}
