/**
 * app-setting router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::app-setting.app-setting', {
  only: ['find'], // Explicitly disabled create and delete
  config: {
    find: {
      policies: ['global::restrict-populate']
    }
  }
});
