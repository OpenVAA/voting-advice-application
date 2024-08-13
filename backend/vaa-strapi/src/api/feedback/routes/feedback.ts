/**
 * feedback router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::feedback.feedback', {
  only: ['create'],
  config: {
    create: {
      policies: []
    }
  }
});
