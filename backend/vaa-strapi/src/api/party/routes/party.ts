/**
 * party router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate, restrictFilters } from '../../../util/acl';

export default factories.createCoreRouter('api::party.party', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'candidates',
          'answers.populate.question',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'candidates',
          'answers.populate.question',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
  },
});
