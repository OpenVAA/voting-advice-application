/**
 * app-customization router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::app-customization.app-customization', {
  only: ['find'],
  config: {
    find: {
      policies: ['global::restrict-populate']
    }
  }
});
