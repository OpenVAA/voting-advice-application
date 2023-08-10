/*
 * Contains a mock DataProvider for use in development.
 */

import {DataProvider} from './dataProvider';
import type {EntityQueryOptions, QueryFilter, QuestionQueryFilter} from './dataProvider';
import type {AppLabels} from './dataProvider.types';
import {QuestionType} from './dataObjects';
import type {
  ElectionData,
  ConstituencyCategoryData,
  QuestionCategoryData,
  QuestionData,
  CandidateData
} from './dataObjects';

export class MockDataProvider extends DataProvider {
  constructor() {
    super();
  }

  getAppLabels(): Promise<AppLabels> {
    return new Promise<AppLabels>((resolve) => {
      resolve({
        appTitle: 'Mock Voting Advice Application',
        electionsTitle: 'Choose Elections',
        constituenciesTitle: 'Choose Your Constituency'
      });
    });
  }

  getElectionsData(): Promise<ElectionData[]> {
    return new Promise<ElectionData[]>((resolve) => {
      resolve([
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
      ]);
    });
  }

  getConstituencyCategoriesData(filter?: QueryFilter): Promise<ConstituencyCategoryData[]> {
    return new Promise<ConstituencyCategoryData[]>((resolve) => {
      const data = [
        {
          id: 'cg1',
          name: 'Electoral Districts for Election 1',
          constituencies: [
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
          constituencies: [
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
      resolve(filter ? DataProvider.applyFilter(filter, data) : data);
    });
  }

  getQuestionCategoriesData(filter?: QuestionQueryFilter): Promise<QuestionCategoryData[]> {
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
      resolve(filter ? DataProvider.applyFilter(filter, data) : data);
    });
  }

  getQuestionsData(filter?: QuestionQueryFilter): Promise<QuestionData[]> {
    return new Promise<QuestionData[]>((resolve) => {
      const data = [
        {
          id: 'q1',
          text: 'Question q1 text',
          type: QuestionType.Text
        },
        {
          id: 'q2',
          text: 'Question q2 text',
          type: QuestionType.Text
        },
        {
          id: 'q3',
          text: 'Question q3 text',
          type: QuestionType.Text
        },
        {
          id: 'q4',
          text: 'Question q4 text (for Constituency 1.2 Only)',
          type: QuestionType.Text,
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
          type: QuestionType.Text
        }
      ];
      resolve(filter ? DataProvider.applyFilter(filter, data) : data);
    });
  }

  getCandidatesData(options?: EntityQueryOptions): Promise<CandidateData[]> {
    throw new Error('Not Implemented');
  }
}
