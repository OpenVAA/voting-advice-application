/**
 * constituency router
 */

import { factories } from '@strapi/strapi';
import { restrictFilters, restrictPopulate } from '../../../util/acl';
import { Generic } from '../../../util/acl.type';

export default factories.createCoreRouter('api::constituency.constituency', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate(['parent']),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate(['parent']),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    }
  } as unknown as Generic
});
