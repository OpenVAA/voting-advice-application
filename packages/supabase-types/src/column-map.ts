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
  organization_id: 'organizationId',

  // QuestionData
  category_id: 'categoryId',
  template_id: 'templateId',
  election_ids: 'electionIds',
  election_rounds: 'electionRounds',
  constituency_ids: 'constituencyIds',
  entity_type: 'entityType',
  allow_open: 'allowOpen',

  // QuestionTemplateData
  default_choices: 'defaultChoices',

  // QuestionCategoryData
  category_type: 'categoryType',

  // NominationData
  candidate_id: 'candidateId',
  organization_id_nom: 'organizationId',
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
  question_id: 'questionId'
} as const;

/** Database column name (snake_case) */
export type ColumnName = keyof typeof COLUMN_MAP;

/** TypeScript property name (camelCase) */
export type PropertyName = (typeof COLUMN_MAP)[ColumnName];

/** Reverse mapping: camelCase -> snake_case */
export const PROPERTY_MAP = Object.fromEntries(
  Object.entries(COLUMN_MAP).map(([k, v]) => [v, k])
) as {[K in PropertyName]: ColumnName};
