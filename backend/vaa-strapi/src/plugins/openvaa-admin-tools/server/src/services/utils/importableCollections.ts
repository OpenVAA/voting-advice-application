import type { UID } from '@strapi/strapi';
import type { ExternalRelationConfig } from '../data.type';

/**
 * Any importable collection.
 */
export const IMPORTABLE_COLLECTIONS: Record<
  string,
  {
    api: UID.ContentType;
    externalRelations: ExternalRelationConfig;
    singleType?: boolean;
  }
> = {
  alliances: {
    api: 'api::alliance.alliance',
    externalRelations: {
      election: 'api::election.election',
      constituencies: 'api::constituency.constituency',
      parties: 'api::party.party',
    },
  },
  appCustomization: {
    api: 'api::app-customization.app-customization',
    externalRelations: {},
    singleType: true,
  },
  candidates: {
    api: 'api::candidate.candidate',
    externalRelations: {},
  },
  constituencies: {
    api: 'api::constituency.constituency',
    externalRelations: {
      parent: 'api::constituency.constituency',
    },
  },
  constituencyGroups: {
    api: 'api::constituency-group.constituency-group',
    externalRelations: {
      constituencies: 'api::constituency.constituency',
    },
  },
  elections: {
    api: 'api::election.election',
    externalRelations: {
      constituencyGroups: 'api::constituency-group.constituency-group',
    },
  },
  feedbacks: {
    api: 'api::feedback.feedback',
    externalRelations: {},
  },
  nominations: {
    api: 'api::nomination.nomination',
    externalRelations: {
      candidate: 'api::candidate.candidate',
      election: 'api::election.election',
      constituency: 'api::constituency.constituency',
      party: 'api::party.party',
    },
  },
  parties: {
    api: 'api::party.party',
    externalRelations: {},
  },
  questionTypes: {
    api: 'api::question-type.question-type',
    externalRelations: {},
  },
  questionCategories: {
    api: 'api::question-category.question-category',
    externalRelations: {
      elections: 'api::election.election',
      constituencies: 'api::constituency.constituency',
      questions: 'api::question.question',
    },
  },
  questions: {
    api: 'api::question.question',
    externalRelations: {
      category: 'api::question-category.question-category',
      questionType: 'api::question-type.question-type',
      constituencies: 'api::constituency.constituency',
    },
  },
} as const;
