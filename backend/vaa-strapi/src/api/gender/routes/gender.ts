/**
 * gender router
 */
import {restrictPopulate, restrictFilters} from '../../../util/acl';

import {factories} from '@strapi/strapi';

export default factories.createCoreRouter('api::gender.gender', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    }
  }
});
