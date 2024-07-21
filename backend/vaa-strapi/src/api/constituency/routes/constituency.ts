/**
 * constituency router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate, restrictFilters } from '../../../util/acl';

export default factories.createCoreRouter('api::constituency.constituency', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'nominations',
          'nominations.populate.candidate',
          'nominations.populate.party'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'nominations',
          'nominations.populate.candidate',
          'nominations.populate.party'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
  },
});
