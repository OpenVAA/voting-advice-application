/**
 * Barrel re-export for the template module.
 *
 * Downstream consumers import `validateTemplate` + `Template` + `TemplateSchema` from `./template` instead of reaching into `./schema` vs `./types`.
 *
 * This barrel also carries the single permitted-key declaration: `LINK_SENTINELS` (what the join-table resolver reads) and `permittedKeys` plus the twelve `FixedRow` aliases (what the type layer and the runtime guard both consume).
 */
export type { LinkSentinelRule, LinkTarget, SentinelPayload } from './linkSentinels';
export { LINK_SENTINELS } from './linkSentinels';
export type {
  AlliancesFixedRow,
  AppSettingsFixedRow,
  CandidatesFixedRow,
  CollectionKey,
  ConstituenciesFixedRow,
  ConstituencyGroupsFixedRow,
  ElectionsFixedRow,
  ExternalRef,
  FactionsFixedRow,
  FeedbackFixedRow,
  FixedRow,
  GuardedCollectionKey,
  NominationsFixedRow,
  OrganizationsFixedRow,
  PassThroughCollectionKey,
  QuestionCategoriesFixedRow,
  QuestionsFixedRow,
  SentinelValue
} from './permittedKeys';
export {
  COLLECTION_NON_COLUMNS,
  DENIED_BY_TABLE,
  deniedKeys,
  NON_COLUMN_FIELDS,
  permittedKeys,
  RELATIONSHIP_REFS,
  resolveCollectionName,
  SKIP_COLUMNS_NOT_DENIED,
  SKIP_COLUMNS_SOURCE
} from './permittedKeys';
export { TemplateSchema, validateTemplate } from './schema';
export type { Template } from './types';
