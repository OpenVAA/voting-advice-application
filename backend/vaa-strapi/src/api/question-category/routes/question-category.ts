/**
 * question-category router
 */

import { factories } from '@strapi/strapi';
import { restrictFilters, restrictPopulate } from '../../../util/acl';
import { Generic } from '../../../util/acl.type';

export default factories.createCoreRouter('api::question-category.question-category', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'constituencies',
          'elections',
          'questions',
          'questions.populate.constituencies',
          'questions.populate.election',
          'questions.populate.questionType'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters(['type.$eq', 'elections.id.$eq', 'elections.id.$in', 'elections.id.$null'])
      ]
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'constituencies',
          'elections',
          'questions',
          'questions.populate.constituencies',
          'questions.populate.election',
          'questions.populate.questionType'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters(['type.$eq', 'elections.id.$eq', 'elections.id.$in', 'elections.id.$null'])
      ]
    }
  } as unknown as Generic
});
