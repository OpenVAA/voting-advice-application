/**
 * constituency router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate } from '../../../util/acl';

export default factories.createCoreRouter('api::constituency.constituency', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
  },
});
