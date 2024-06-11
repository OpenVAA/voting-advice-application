/**
 * feedback router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::feedback.feedback', {
  only: ['find', 'findOne', 'create'],
  config: {
    find: {
      policies: [],
    },
    findOne: {
      policies: [],
    },
    create: {
      policies: [],
    }
  }
});
