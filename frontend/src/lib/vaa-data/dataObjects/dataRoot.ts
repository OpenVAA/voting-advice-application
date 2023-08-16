/*
 * DataRoot is the root for all of the DataObjects. Data passed by the DataProvider
 * is passed to the DataRoot, which converts it into DataObjects and organises
 * them.
 *
 * TO DO: Add an id checking whenever objects are added to the data root.
 *   Set this as an option of the constructor.
 */

import type {Id} from '../data.types';
import type {Constituency} from './constituency';
import {
  ConstituencyCategory,
  ConstituencyCategoryBase,
  ConstituencyCategoryFragment,
  type ConstituencyCategoryData,
  type ConstituencyCategoryFragmentData,
  type AnyConstituencyCategoryData
} from './constituencyCategory';
import {Election, type ElectionData} from './election';
import {
  Alliance,
  Faction,
  Person,
  Organization,
  type FactionData,
  type PersonData,
  type AllianceData,
  type OrganizationData,
  type FullySpecifiedAnswerData,
  EntityType,
  type AnswerDict,
  Entity,
  type NominationData
} from './entities';
import {DataObjectCollection} from './dataObjectCollection';
import {QuestionCategory, type QuestionCategoryData} from './questionCategory';
import {
  QuestionTemplate,
  type Question,
  type QuestionData,
  type QuestionTemplateData,
  MatchableQuestionBase,
  isMatchableQuestion
} from './questions';

export class DataRoot {
  // DataObjectLists
  // Here we store all the DataObjects, in addition to which they will be
  // be nested within each other, where necessary.

  readonly elections = new DataObjectCollection<Election>([]);
  readonly constituencyCategories = new DataObjectCollection<ConstituencyCategoryBase>([]);
  readonly questionCategories = new DataObjectCollection<QuestionCategory>([]);
  readonly questionTemplates = new DataObjectCollection<QuestionTemplate>([]);
  readonly entities = {
    alliances: new DataObjectCollection<Alliance>([]),
    factions: new DataObjectCollection<Faction>([]),
    persons: new DataObjectCollection<Person>([]),
    organizations: new DataObjectCollection<Organization>([])
  } as const;

  // Getters

  // A utility getter
  get constituencies(): DataObjectCollection<Constituency> {
    return new DataObjectCollection(
      this.constituencyCategories.items
        .filter((c) => c instanceof ConstituencyCategory)
        .map((c) => c.constituencies.items)
        .flat()
    );
  }

  // A utility getter
  get questions(): DataObjectCollection<Question> {
    return this.questionCategories.mapAsList((c) => c.questions.items);
  }

  // Another utility getter
  get matchableQuestions(): DataObjectCollection<MatchableQuestionBase> {
    return new DataObjectCollection(
      this.questions.items.filter((q) => isMatchableQuestion(q)) as MatchableQuestionBase[]
    );
  }

  // Another utility getter
  get nonMatchableQuestions(): DataObjectCollection<Question> {
    return new DataObjectCollection(this.questions.items.filter((q) => !isMatchableQuestion(q)));
  }

  // Provide methods
  // Provide each data type with these methods and relevant DataObjects will
  // be created and added to the hierarchy.

  provideElectionData(data: ElectionData[]) {
    this.elections.extend(data.map((d) => new Election(d, this)));
  }

  provideConstituencyCategoryData(data: AnyConstituencyCategoryData[]) {
    // We need to first process the proper constituencies to get ahold of all Constituency
    // objects because with need to pass one as the parent argument to
    // ConstituencyCategoryFragments.
    const proper = data.filter((d) => 'constituencyData' in d) as ConstituencyCategoryData[];
    const fragments = data.filter(
      (d) => 'parentConstituencyId' in d
    ) as ConstituencyCategoryFragmentData[];
    if (proper.length + fragments.length !== data.length) {
      throw new Error('ConstituencyCategoryData cannot be divided into propers and fragments.');
    }
    // Create the proper constituencies
    this.constituencyCategories.extend(proper.map((d) => new ConstituencyCategory(d, this)));
    // Create possible fragments
    if (fragments.length) {
      const consts = this.constituencies.asDict;
      this.constituencyCategories.extend(
        fragments.map((d) => {
          const parent = consts[d.parentConstituencyId];
          if (!parent) {
            throw new Error(`Constituency ${d.parentConstituencyId} does not exist.`);
          }
          return new ConstituencyCategoryFragment(d, parent);
        })
      );
    }
  }

  provideQuestionTemplateData(data: QuestionTemplateData[]) {
    this.questionTemplates.extend(data.map((d) => new QuestionTemplate(d, this)));
  }

  provideQuestionCategoryData(data: QuestionCategoryData[]) {
    this.questionCategories.extend(data.map((d) => new QuestionCategory(d, this)));
  }

  provideQuestionData(data: QuestionData[]) {
    this.questionCategories.items.forEach((cat) => cat.provideQuestionData(data));
  }

  provideAllianceData(data: AllianceData[]) {
    this.entities.alliances.extend(data.map((d) => new Alliance(d, this)));
  }

  provideOrganizationData(data: OrganizationData[]) {
    this.entities.organizations.extend(data.map((d) => new Organization(d, this)));
  }

  provideFactionData(data: FactionData[]) {
    this.entities.factions.extend(data.map((d) => new Faction(d, this)));
  }

  providePersonData(data: PersonData[]) {
    this.entities.persons.extend(data.map((d) => new Person(d, this)));
  }

  /**
   * This a secondary method of provideing answer data. The prererred way is to provide
   * it directly to each Entity as an AnswerDict.
   * @param data An array of fully specified answers.
   */
  provideAnswerData(data: FullySpecifiedAnswerData[]) {
    // Sort all of the answers and add to relavant entities as AnswerDicts
    const sorted = sortByProperties(data, ['entityType', 'entityId', 'questionId']);
    let currentType: EntityType | undefined;
    let currentEntityDict: Record<Id, Entity> | undefined;
    let currentId: Id | undefined;
    let currentEntity: Entity | undefined;
    let answerDict: AnswerDict = {};
    for (const {entityType, entityId, questionId, ...answerProps} of sorted) {
      // Switch EntityType
      if (entityType != currentType) {
        currentEntityDict = this.entities[entityTypeToKey(entityType)].asDict;
        currentType = entityType;
        currentId = undefined;
        currentEntity = undefined;
      }
      // Switch Entity but save the answer dict before
      if (entityId != currentId) {
        if (answerDict && Object.keys(answerDict).length && currentEntity) {
          currentEntity.provideAnswerData(answerDict);
          answerDict = {};
        }
        currentEntity = currentEntityDict?.[entityId];
        currentId = entityId;
      }
      // Otherwise just expand the answer dict
      answerDict[questionId] = answerProps;
    }
    // Finally, save the last answer dict
    if (answerDict && Object.keys(answerDict).length && currentEntity) {
      currentEntity.provideAnswerData(answerDict);
    }
  }

  provideNominationData(data: NominationData[]) {
    this.elections.items.forEach((e) => e.provideNominationData(data));
  }
}

function sortByProperties<T>(items: T[], props: (keyof T)[]): T[] {
  return items.sort((a, b) => {
    for (const p of props) {
      if (a[p] < b[p]) {
        return -1;
      }
      if (a[p] > b[p]) {
        return 1;
      }
    }
    return 0;
  });
}

function entityTypeToKey(type: EntityType): keyof DataRoot['entities'] {
  switch (type) {
    case EntityType.Alliance:
      return 'alliances';
    case EntityType.Faction:
      return 'factions';
    case EntityType.Person:
      return 'persons';
    case EntityType.Organization:
      return 'organizations';
    default:
      throw new Error(`Unknown entity type: ${type}`);
  }
}
