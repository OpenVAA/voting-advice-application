/**
 * nomination router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::nomination.nomination', {
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
