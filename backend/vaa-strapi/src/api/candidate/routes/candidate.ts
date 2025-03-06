/**
 * candidate router
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::candidate.candidate', {
  only: ['find', 'findOne'], // Explicitly disabled create and delete
  config: {
    find: {
      policies: ['global::restrict-populate']
    },
    findOne: {
      policies: ['global::restrict-populate']
    }
  }
});
