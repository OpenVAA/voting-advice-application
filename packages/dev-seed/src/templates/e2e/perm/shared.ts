/**
 * Shared building blocks for the perm-* minimal-data templates.
 *
 * Every entity's `name` field uses the `[<SYMBOL>] <description>` display
 * convention so specs can match inline via `/\[<SYMBOL>\]/i` regexes without
 * a shared `TEXT_RE` bucket.
 *
 * Prefix discipline:
 *   - Templates declare a unique `externalIdPrefix` (e.g.
 *     `'test-perm-1e1cg1co-'`). The writer prepends this prefix to every
 *     row's top-level `external_id` AT WRITE TIME — row external_ids in
 *     `fixed[]` are AUTHORED BARE (e.g. `external_id: 'el-1'`) and become
 *     `test-perm-1e1cg1co-el-1` after the writer's prepend.
 *   - Nested-ref `external_id` fields (e.g. `organization: { external_id: ... }`,
 *     `parent: { external_id: ... }`) are passed VERBATIM by the writer to
 *     bulk_import — so they MUST contain the FULL prefixed external_id
 *     (e.g. `organization: { external_id: 'test-perm-1e1cg1co-or-1' }`).
 *     The shared builder functions below take a `prefix` argument (named
 *     params) and emit refs with `${prefix}or-1` etc.
 *
 * This preserves the parallel-only contract: `setupFromTemplate.ts:131-137`
 * derives the teardown prefix from `template.externalIdPrefix`, so each
 * perm-* setup tears down ITS OWN unique prefix.
 *
 * Named-params convention: every builder that takes more than one parameter
 * where positional order can be confused accepts a single named-options
 * object. Single-param builders stay parameterless.
 * `buildCandidate.answersByExternalId` is OPTIONAL — the leaf builder writes
 * an empty map when omitted; the assembling layer (perm template OR
 * `buildMinimal` helper) is responsible for populating the answer map when
 * the candidate should carry answers.
 */

/**
 * Likert-5 choices for opinion questions. Mirrors the e2e/base shape so the
 * latent-factor emitter (ordinal dispatch) treats perm-* opinion questions
 * identically.
 */
export const LIKERT_5_EN: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Fully disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Somewhat disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Neutral' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Somewhat agree' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Fully agree' }, normalizableValue: 5 }
];

/**
 * Minimal-base app_settings.
 *
 * The `elections.startFromConstituencyGroup` key is OMITTED entirely because
 * JSONB drops `undefined` keys and breaks `toMatchObject` parity in
 * setupFromTemplate's post-seed assertion. Variants that override
 * `disallowSelection` spread this base.
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
 * Row external_ids are BARE (the writer prepends the template prefix). The
 * category reference IS NOT a nested ref — `question_categories` rows have
 * no cross-table refs themselves.
 *
 * Parameterless (single-param functions stay parameterless).
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
 * Options for {@link buildQuestions} (named-params).
 */
export interface BuildQuestionsOptions {
  /** External-id prefix (e.g. `'e2e-perm-1e1cg1co-'`). Used for nested category refs. */
  prefix: string;
}

/**
 * Build the standard 2 questions (text info + Likert5 opinion). The nested
 * `category` ref uses the FULL prefixed external_id (writer passes refs
 * verbatim).
 */
export function buildQuestions({ prefix }: BuildQuestionsOptions): Array<Record<string, unknown>> {
  return [
    {
      external_id: 'qu-info-text',
      type: 'text',
      name: { en: '[QU-INFO-TEXT] Tell us about yourself' },
      category: { external_id: `${prefix}qc-info` },
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
      category: { external_id: `${prefix}qc-opin` },
      allow_open: false,
      required: true,
      sort_order: 100,
      is_generated: false
    }
  ];
}

/**
 * Build the standard 2 organizations. Row external_ids are BARE (the writer
 * prepends the template prefix).
 *
 * Parameterless.
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
 * Options for {@link buildStandardCandidateAnswers} (named-params).
 */
export interface BuildStandardCandidateAnswersOptions {
  /** External-id prefix (e.g. `'e2e-perm-1e1cg1co-'`). Used for question-ref keys. */
  prefix: string;
}

/**
 * Build standard candidate answers (info text + Likert5 neutral) used by
 * every perm-* candidate that wants the legacy "always-answered" behaviour.
 * Keyed by FULL prefixed question external_ids (importAnswers resolves the
 * question external_id verbatim against the DB).
 *
 * Callers pass the result explicitly via `buildCandidate({ ...,
 * answersByExternalId: buildStandardCandidateAnswers({ prefix }) })`.
 */
export function buildStandardCandidateAnswers({
  prefix
}: BuildStandardCandidateAnswersOptions): Record<string, { value: unknown }> {
  return {
    [`${prefix}qu-info-text`]: { value: { en: '(test info)' } },
    [`${prefix}qu-opin-l5`]: { value: '3' }
  };
}

/**
 * Options for {@link buildCandidate} (named-params).
 *
 * `answersByExternalId` is OPTIONAL — when omitted the leaf builder writes
 * an empty answer map. The assembling layer (perm template OR `buildMinimal`
 * helper) is responsible for populating answers when the candidate should
 * carry them. This enables the clean-candidate use case the
 * hide-if-missing-answers perm depends on.
 */
export interface BuildCandidateOptions {
  /** External-id prefix (e.g. `'e2e-perm-1e1cg1co-'`). Used for nested organization ref. */
  prefix: string;
  /** Organization index (1 or 2) — matches `or-1` or `or-2` from {@link buildOrganizations}. */
  orgN: 1 | 2;
  /** Candidate letter unique within (orgN, constituency). Renders into first_name `[CA<orgN><letter>]`. */
  candLetter: string;
  /** Candidate's row external_id (BARE; writer prepends prefix). */
  idSuffix: string;
  /** Candidate row sort_order. */
  sortOrder: number;
  /**
   * Per-question answer map. Optional — defaults to `{}` (clean candidate at
   * the leaf-builder level). Keys are FULL prefixed question external_ids.
   * For the legacy "always-answered" behaviour, pass
   * `buildStandardCandidateAnswers({ prefix })`.
   */
  answersByExternalId?: Record<string, { value: unknown; info?: { en: string } }>;
}

/**
 * Build a candidate row. Row external_id is BARE (writer prepends prefix).
 * The nested `organization` ref uses the FULL prefixed external_id.
 *
 */
export function buildCandidate({
  prefix,
  orgN,
  candLetter,
  idSuffix,
  sortOrder,
  answersByExternalId
}: BuildCandidateOptions): Record<string, unknown> {
  return {
    external_id: idSuffix,
    first_name: `[CA${orgN}${candLetter}]`,
    last_name: `Candidate ${orgN === 1 ? 'One' : 'Two'} ${candLetter}`,
    terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
    sort_order: sortOrder,
    is_generated: false,
    organization: { external_id: `${prefix}or-${orgN}` },
    answersByExternalId: answersByExternalId ?? {}
  };
}

/**
 * Options for {@link buildElectionConstituencyNoms} (named-params).
 */
export interface BuildElectionConstituencyNomsOptions {
  /** External-id prefix (e.g. `'e2e-perm-1e1cg1co-'`). */
  prefix: string;
  /** Election external_id suffix (BARE; writer prepends prefix on the nested election ref). */
  electionIdSuffix: string;
  /** Constituency external_id suffix (BARE). */
  constituencyIdSuffix: string;
  /** Candidate external_id suffixes (BARE). */
  candidateIdSuffixes: Array<string>;
  /** Symbol number for the first candidate nomination (subsequent candidates increment by 1). */
  electionSymbolStart: number;
  /**
   * Optional nomination external_id sub-prefix to disambiguate when one
   * election × constituency pair recurs across different shapes (rare).
   * Defaults to `''` (empty — keyed by `${electionIdSuffix}-${constituencyIdSuffix}`).
   */
  nomKeyPrefix?: string;
}

/**
 * Build a tuple of (or-1 org nom, or-2 org nom, candidate-1 nom, candidate-2
 * nom, ...) for the given election × constituency. Returns 2 + N rows.
 *
 * Row external_ids are BARE; nested refs use the FULL prefixed external_id.
 */
export function buildElectionConstituencyNoms({
  prefix,
  electionIdSuffix,
  constituencyIdSuffix,
  candidateIdSuffixes,
  electionSymbolStart,
  nomKeyPrefix = ''
}: BuildElectionConstituencyNomsOptions): Array<Record<string, unknown>> {
  const electionExtId = `${prefix}${electionIdSuffix}`;
  const constituencyExtId = `${prefix}${constituencyIdSuffix}`;
  const key = nomKeyPrefix === '' ? `${electionIdSuffix}-${constituencyIdSuffix}` : nomKeyPrefix;
  const noms: Array<Record<string, unknown>> = [
    {
      external_id: `nom-${key}-or-1`,
      organization: { external_id: `${prefix}or-1` },
      election: { external_id: electionExtId },
      constituency: { external_id: constituencyExtId },
      election_round: 1
    },
    {
      external_id: `nom-${key}-or-2`,
      organization: { external_id: `${prefix}or-2` },
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
      candidate: { external_id: `${prefix}${candIdSuffix}` },
      parent_nomination: { external_id: `${prefix}nom-${key}-or-${orgN}` },
      election: { external_id: electionExtId },
      constituency: { external_id: constituencyExtId },
      election_round: 1
    });
  }
  return noms;
}
