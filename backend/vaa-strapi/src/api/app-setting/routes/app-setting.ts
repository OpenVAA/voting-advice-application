/**
 * app-setting router
 */

import {factories} from '@strapi/strapi';
import {restrictFilters} from '../../../util/acl';

export default factories.createCoreRouter('api::app-setting.app-setting', {
  only: ['find', 'findOne'], // Explicitly disabled create and delete
  config: {
    find: {
      policies: [
        // No populate restrictions for appSettings are needed
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    },
    findOne: {
      policies: [
        // No populate restrictions for appSettings are needed
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    }
  }
});
