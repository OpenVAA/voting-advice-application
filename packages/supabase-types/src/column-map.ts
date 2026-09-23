/**
 * Mapping between snake_case database column names and camelCase @openvaa/data property names.
 * Used by data adapters to convert between DB and TypeScript conventions.
 *
 * Only includes columns where the names differ (id, name, type, etc. are identical).
 */
export const COLUMN_MAP = {
  // DataObjectData common columns
  sort_order: 'order',
  short_name: 'shortName',
  custom_data: 'customData',
  is_generated: 'isGenerated',

  // CandidateData
  first_name: 'firstName',
  last_name: 'lastName',

  // QuestionData
  category_id: 'categoryId',
  election_ids: 'electionIds',
  election_rounds: 'electionRounds',
  constituency_ids: 'constituencyIds',
  entity_type: 'entityType',
  allow_open: 'allowOpen',

  // QuestionCategoryData
  category_type: 'categoryType',

  // NominationData
  candidate_id: 'candidateId',
  // This key was spelled `organization_id_nom` until 162-07b, and the suffix was not a naming choice — it was a workaround. Two tables carried a column called `organization_id`, `candidates` and `nominations`, and an object literal cannot declare the same key twice, so the second one was given a suffix that names a column on no table at all. The cost was RES-7 / T-144-11: `PROPERTY_MAP` is this map reversed and reversal is last-wins, so `organizationId` resolved to the suffixed spelling and the dev-seed guard derived from it admitted the camel key NOWHERE. 162-07b removed `candidates.organization_id`, one mapping is left, and the suffix goes with the problem it worked around. `packages/dev-seed/tests/template/permittedKeys.test.ts` carries the standing assertion that no two keys here map to one property again — it lives there because this package has no test runner of its own.
  organization_id: 'organizationId',
  faction_id: 'factionId',
  alliance_id: 'allianceId',
  election_id: 'electionId',
  constituency_id: 'constituencyId',
  election_round: 'electionRound',
  election_symbol: 'electionSymbol',
  parent_nomination_id: 'parentNominationId',

  // ElectionData
  election_date: 'electionDate',
  election_start_date: 'electionStartDate',
  election_type: 'electionType',
  multiple_rounds: 'multipleRounds',
  current_round: 'currentRound',

  // Multi-tenant
  project_id: 'projectId',
  account_id: 'accountId',
  default_locale: 'defaultLocale',

  // Timestamps
  created_at: 'createdAt',
  updated_at: 'updatedAt',

  // ConstituencyData
  parent_id: 'parentId',

  // AnswerData (relational alternative)
  open_answer: 'openAnswer',
  question_id: 'questionId',

  // Auth columns
  auth_user_id: 'authUserId',

  // Candidate columns
  terms_of_use_accepted: 'termsOfUseAccepted',

  // External ID (used across all content tables)
  external_id: 'externalId'
} as const;

/** Database column name (snake_case) */
export type ColumnName = keyof typeof COLUMN_MAP;

/** TypeScript property name (camelCase) */
export type PropertyName = (typeof COLUMN_MAP)[ColumnName];

/** Reverse mapping: camelCase -> snake_case */
export const PROPERTY_MAP = Object.fromEntries(Object.entries(COLUMN_MAP).map(([k, v]) => [v, k])) as {
  [K in PropertyName]: ColumnName;
};

/**
 * Mapping between camelCase collection names and snake_case database table names.
 * Used by data import/seeding tools to convert between TypeScript and DB conventions.
 *
 * Only includes collections where the names differ (elections, candidates, etc. are identical).
 */
export const TABLE_MAP = {
  constituencyGroups: 'constituency_groups',
  questionCategories: 'question_categories',
  appSettings: 'app_settings',
  adminJobs: 'admin_jobs',
  electionConstituencyGroups: 'election_constituency_groups',
  constituencyGroupConstituencies: 'constituency_group_constituencies'
} as const;

/** camelCase collection name */
export type CollectionName = keyof typeof TABLE_MAP;

/** snake_case table name */
export type TableName = (typeof TABLE_MAP)[CollectionName];

/** Reverse mapping: snake_case table name -> camelCase collection name */
export const COLLECTION_NAME_MAP = Object.fromEntries(Object.entries(TABLE_MAP).map(([k, v]) => [v, k])) as {
  [K in TableName]: CollectionName;
};
