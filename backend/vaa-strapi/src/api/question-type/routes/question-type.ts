/**
 * question-type router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::question-type.question-type', {
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
