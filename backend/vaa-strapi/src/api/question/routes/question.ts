/**
 * question router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate, restrictFilters } from '../../../util/acl';

export default factories.createCoreRouter('api::question.question', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'questionType',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'questionType.name.$startsWith',
        ]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'questionType',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'questionType.name.$startsWith',
        ]),
      ],
    },
  },
});
