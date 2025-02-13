/**
 * app-customization router
 */

import { factories } from '@strapi/strapi';
import { restrictFilters } from '../../../util/acl';
import { Generic } from '../../../util/acl.type';

export default factories.createCoreRouter('api::app-customization.app-customization', {
  only: ['find'],
  config: {
    find: {
      policies: [
        // No populate restrictions for appCustomization are needed
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    }
  } as unknown as Generic
});
