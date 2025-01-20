/**
 * constituency router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::constituency.constituency', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: ['global::restrict-populate']
    },
    findOne: {
      policies: ['global::restrict-populate']
    }
  }
});
