/**
 * question-type router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate, restrictFilters } from '../../../util/acl';

export default factories.createCoreRouter('api::question-type.question-type', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'questions.populate.category.populate.elections',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'questions.populate.category.populate.elections',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
  },
});
