/*
 * Contains an interface for getting the necessary data which data
 * providers must implement.
 *
 * Agnostic to specific database or API calls. The data returned by
 * the provider methods is passed to the DataRoot object which will
 * process them (on the client side) and correctly place them in
 * the DataObject hierarchy.
 *
 * The paradigm is currently such that all DataObjectData types are
 * retrieved as separate calls and referenced by id and not as
 * nested properties of the objects. It may be necessary to change
 * this behaviour in the future or allow for both id-based
 * referencing and nested properties.
 *
 * TO DO: Possibly remove some calls and include ConstiuencyCats in
 * the Elections and Questions in QuestionCategories but allow
 * filtering, which can be implemented by the provider or in its
 * underlying external API call.
 *
 * TO DO: Figure out whether this should actually be an interface.
 * The case for a base class is that, we might want to implement some
 * utility methods already in the base class.
 *
 * TO DO: Add sorting by order and by name and apply it automatically
 * to the results. Also expose it so that it can be used elsewhere.
 */
import type {Id} from './data.types';
import type {
  ElectionData,
  EntityData,
  QuestionCategoryData,
  QuestionData,
  PersonData,
  AnyConstituencyCategoryData,
  NominationData,
  FullySpecifiedAnswerData,
  EntityType,
  QuestionTemplateData
} from './dataObjects';
import type {FilterValue} from './filter';

/**
 * The base type for filters
 */
export interface LocaleFilter {
  locale?: FilterValue<string>;
}

/**
 * The basic type of filter used with DataProvider: filter by locale and the object's own id.
 */
export interface IdFilter extends LocaleFilter {
  id?: FilterValue<Id>;
}

/**
 * Filter by locale, the object's own id or that of the relevant election.
 */
export interface ElectionIdFilter extends IdFilter {
  electionId?: FilterValue<Id>;
}

/**
 * Filter by locale, the object's own id, that of the relevant election
 * or that of the constituency.
 */
export interface ConstituencyIdFilter extends ElectionIdFilter {
  constituencyId?: FilterValue<Id>;
}

/**
 * Filter by locale, entityType and entityId. Used for Answers
 */
export interface AnswerFilter extends LocaleFilter {
  entityType?: FilterValue<EntityType>;
  entityId?: FilterValue<Id>;
}

/**
 * The interface all DataProviders must implement.
 */
export interface DataProvider {
  getElectionData(filter?: IdFilter): Promise<ElectionData[]>;

  getConstituencyCategoryData(filter?: ElectionIdFilter): Promise<AnyConstituencyCategoryData[]>;

  getQuestionTemplateData(filter?: IdFilter): Promise<QuestionTemplateData[]>;

  getQuestionCategoryData(filter?: ConstituencyIdFilter): Promise<QuestionCategoryData[]>;

  getQuestionData(filter?: ConstituencyIdFilter): Promise<QuestionData[]>;

  getNominationData(filter?: ConstituencyIdFilter): Promise<NominationData[]>;

  /**
   * For now, we don't expect ConstituencyIdFilter to apply to Entities.
   * To limit them, first load NominationData and get the relevant
   * entity ids from there.
   */
  getPersonData(filter?: IdFilter): Promise<PersonData[]>;

  /**
   * For now, we don't expect ConstituencyIdFilter to apply to Entities.
   * To limit them, first load NominationData and get the relevant
   * entity ids from there.
   */
  getOrganizationData(filter?: IdFilter): Promise<EntityData[]>;

  getAnswerData(filter?: AnswerFilter): Promise<FullySpecifiedAnswerData[]>;

  // getOrganizationNominationData(filter?: QueryFilter):
  // Promise<OrganizationNominationData[]>;

  // These other entity getters should also be implemented.
  // getElectoralAlliancesData, getPoliticalOrganizationsData, getOrganizationFactionsData
}
