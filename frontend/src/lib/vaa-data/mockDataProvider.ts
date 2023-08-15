/*
 * Contains a mock DataProvider for use in development.
 */

import type {AnswerFilter, ConstituencyIdFilter, DataProvider, IdFilter} from './dataProvider';
import {EntityType, QuestionType} from './dataObjects';
import type {
  ElectionData,
  ConstituencyCategoryData,
  QuestionCategoryData,
  QuestionData,
  EntityData,
  PersonData,
  NominationData,
  FullySpecifiedAnswerData,
  QuestionTemplateData
} from './dataObjects';
import {filterItems} from './filter';

export class MockDataProvider implements DataProvider {
  getElectionData(filter?: IdFilter): Promise<ElectionData[]> {
    return new Promise<ElectionData[]>((resolve) => {
      const data = [
        {
          id: 'e1',
          name: 'First Election',
          date: new Date(2023, 10, 10),
          constituencyCategoryIds: ['cg1']
        },
        {
          id: 'e2',
          name: 'Second Election',
          date: new Date(2023, 10, 12),
          constituencyCategoryIds: ['cg2']
        }
      ];
      resolve(filter ? filterItems(data, filter) : data);
    });
  }

  getConstituencyCategoryData(filter?: ConstituencyIdFilter): Promise<ConstituencyCategoryData[]> {
    return new Promise<ConstituencyCategoryData[]>((resolve) => {
      const data = [
        {
          id: 'cg1',
          name: 'Electoral Districts for Election 1',
          constituencyData: [
            {
              id: 'cg1-c1',
              name: 'Constituency 1.1'
            },
            {
              id: 'cg1-c2',
              name: 'Constituency 1.2'
            },
            {
              id: 'cg1-c3',
              name: 'Constituency 1.3'
            }
          ]
        },
        {
          id: 'cg2',
          name: 'Electoral Districts for Election 2',
          constituencyData: [
            {
              id: 'cg2-c1',
              name: 'Constituency 2.1'
            },
            {
              id: 'cg2-c2',
              name: 'Constituency 2.2'
            },
            {
              id: 'cg2-c3',
              name: 'Constituency 2.3'
            }
          ]
        }
      ];
      resolve(filter ? filterItems(data, filter) : data);
    });
  }

  getQuestionTemplateData(filter?: IdFilter): Promise<QuestionTemplateData[]> {
    return new Promise<QuestionTemplateData[]>((resolve) => {
      const data = [
        {
          id: 'qt1',
          type: QuestionType.Likert,
          values: [
            {
              key: 1,
              label: 'Strongly disagree'
            },
            {
              key: 2,
              label: 'Somewhat disagree'
            },
            {
              key: 3,
              label: 'Somewhat agree'
            },
            {
              key: 4,
              label: 'Strongly agree'
            }
          ]
        }
      ] as QuestionTemplateData[];
      resolve(filter ? filterItems(data, filter) : data);
    });
  }

  getQuestionCategoryData(filter?: ConstituencyIdFilter): Promise<QuestionCategoryData[]> {
    return new Promise<QuestionCategoryData[]>((resolve) => {
      const data = [
        {
          id: 'qc1',
          name: 'Question Category 1 (for Constituency 1.1 Only)',
          questionIds: ['q1', 'q2', 'q3'],
          constituencyId: 'cg1-c1'
        },
        {
          id: 'qc2',
          name: 'Question Category 2',
          questionIds: ['q4', 'q5', 'q6']
        }
      ];
      resolve(filter ? filterItems(data, filter) : data);
    });
  }

  getQuestionData(filter?: ConstituencyIdFilter): Promise<QuestionData[]> {
    return new Promise<QuestionData[]>((resolve) => {
      const data = [
        {
          id: 'q1',
          text: 'Question q1 text',
          templateId: 'qt1'
        },
        {
          id: 'q2',
          text: 'Question q2 text',
          templateId: 'qt1'
        },
        {
          id: 'q3',
          text: 'Question q3 text',
          templateId: 'qt1'
        },
        {
          id: 'q4',
          text: 'Question q4 text (for Constituency 1.2 Only)',
          templateId: 'qt1',
          constituencyId: 'cg1-c2'
        },
        {
          id: 'q5',
          text: 'Question q5 text',
          type: QuestionType.Text
        },
        {
          id: 'q6',
          text: 'Question q6 text',
          templateId: 'qt1'
        }
      ];
      resolve(filter ? filterItems(data, filter) : data);
    });
  }

  getNominationData(filter?: ConstituencyIdFilter): Promise<NominationData[]> {
    return new Promise<NominationData[]>((resolve) => {
      const data = [
        {
          id: 'n1',
          entityType: EntityType.Person,
          entityId: 'prs1',
          electionId: 'e1',
          constituencyId: 'cg1-c1',
          electionSymbol: 10
        },
        {
          id: 'n2',
          entityType: EntityType.Person,
          entityId: 'prs2',
          electionId: 'e1',
          constituencyId: 'cg1-c1',
          electionSymbol: 11
        },
        {
          id: 'n3',
          entityType: EntityType.Person,
          entityId: 'prs3',
          electionId: 'e2',
          constituencyId: 'cg2-c1'
        },
        {
          id: 'n4',
          entityType: EntityType.Person,
          entityId: 'prs4',
          electionId: 'e1',
          constituencyId: 'cg1-c1'
        },
        {
          id: 'no1',
          entityType: EntityType.Organization,
          entityId: 'prt1',
          electionId: 'e1',
          constituencyId: 'cg1-c1',
          personNominationIds: ['n1', 'n2', 'n4']
        },
        {
          id: 'no2',
          entityType: EntityType.Organization,
          entityId: 'prt2',
          electionId: 'e2',
          constituencyId: 'cg2-c1',
          personNominationIds: ['n3']
        }
      ];
      resolve(filter ? filterItems(data, filter) : data);
    });
  }

  /**
   * For now, we don't expect ConstituencyIdFilter to apply to Entities.
   * To limit them, first load NominationData and get the relevant
   * entity ids from there.
   */
  getPersonData(filter?: IdFilter): Promise<PersonData[]> {
    return new Promise<PersonData[]>((resolve) => {
      const data = [
        {
          id: 'prs1',
          familyName: 'Jäppinen',
          givenName: 'Teuvo',
          namePrefix: 'Mr.',
          organizationId: 'prt1'
        },
        {
          id: 'prs2',
          familyName: 'Huttunen',
          givenName: 'Marja-Liisa',
          organizationId: 'prt2',
          initials: ''
        },
        {
          id: 'prs3',
          familyName: 'Von Neumann',
          givenName: 'John',
          namePrefix: 'Dr.',
          initials: 'Dr. vN.'
        },
        {
          id: 'prs4',
          familyName: 'Ingrid',
          givenName: 'Jäppinen',
          organizationId: 'prt2'
        }
      ];
      resolve(filter ? filterItems(data, filter) : data);
    });
  }

  /**
   * For now, we don't expect ConstituencyIdFilter to apply to Entities.
   * To limit them, first load NominationData and get the relevant
   * entity ids from there.
   */
  getOrganizationData(filter?: IdFilter): Promise<EntityData[]> {
    return new Promise<EntityData[]>((resolve) => {
      const data = [
        {
          id: 'prt1',
          name: 'Party of One',
          shortName: 'Po1'
        },
        {
          id: 'prt2',
          name: 'Move Forwards',
          shortName: 'MFwd',
          type: 'constituency association'
        }
      ];
      resolve(filter ? filterItems(data, filter) : data);
    });
  }

  getAnswerData(filter?: AnswerFilter): Promise<FullySpecifiedAnswerData[]> {
    return new Promise<FullySpecifiedAnswerData[]>((resolve) => {
      const data = [
        {
          entityType: EntityType.Person,
          entityId: 'prs1',
          questionId: 'q1',
          value: 3,
          info: 'My lorem ipsum.'
        },
        {
          entityType: EntityType.Person,
          entityId: 'prs1',
          questionId: 'q2',
          value: 1
        },
        {
          entityType: EntityType.Person,
          entityId: 'prs1',
          questionId: 'q3',
          value: 4,
          info: 'My lorem ipsum.'
        },
        {
          entityType: EntityType.Person,
          entityId: 'prs1',
          questionId: 'q4',
          value: 2,
          info: 'My lorem ipsum.'
        },
        {
          entityType: EntityType.Person,
          entityId: 'prs1',
          questionId: 'q5',
          value: 'This is my text answer'
        },
        {
          entityType: EntityType.Person,
          entityId: 'prs2',
          questionId: 'q1',
          value: 3
        },
        {
          entityType: EntityType.Person,
          entityId: 'prs2',
          questionId: 'q2',
          value: 1
        },
        {
          entityType: EntityType.Person,
          entityId: 'prs3',
          questionId: 'q3',
          value: 4,
          info: 'My lorem ipsum.'
        },
        {
          entityType: EntityType.Person,
          entityId: 'prs3',
          questionId: 'q4',
          value: 2,
          info: 'My lorem ipsum.'
        },
        {
          entityType: EntityType.Person,
          entityId: 'prs3',
          questionId: 'q5',
          value: 'This is my text answer'
        }
      ];
      resolve(filter ? filterItems(data, filter) : data);
    });
  }
}

////////////////////////////////////////
// STASHED CACHED QUERY FUNCTIONALITY
////////////////////////////////////////

// type CachableQuery = {
//   type: 'NominationData'
//   filter?: QueryFilter;
// }

// protected cache: {
//   [key: string]: DataObjectData[]
// } = {};

/**
 * This might be unnecessary, as Sveltekit automatically caches fetch responses.
 */
// protected cachedGet(query: CachableQuery) {
//   const key = query.type + '___' + (query.filter == null ? JSON.stringify(query.filter) : '');
//   if (this.cache[key]) {
//     return Promise.resolve(this.cache[key]);
//   }
//   switch (query.type) {
//     case 'NominationData':
//       return new Promise<NominationData[]>((resolve) => {
//         this._getNominationData(query.filter).then(data => {
//           this.cache[key] = data;
//           resolve(data);
//         });
//       });
//     default:
//       throw new Error('Unknown cachable query type:'+ query.type);
//   }
// }

// getPersonData(filter?: ConstituencyIdFilter) {
//  In order to filter the person's by constituency, we need to use the nomination data
//  const personNominationData = await this.cachedGet({type: 'NominationData', filter});
//  ... get relevant Person ids

// getNominationData(filter?: ConstituencyIdFilter): Promise<NominationData[]> {
//   return this.cachedGet({type: 'NominationData', filter}) as Promise<NominationData[]>;
// }
