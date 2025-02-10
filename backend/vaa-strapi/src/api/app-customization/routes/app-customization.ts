/**
 * app-customization router
 */

import { factories } from '@strapi/strapi';
import { RestrictPopulateConfig } from '../../../policies/restrict-populate';

export default factories.createCoreRouter('api::app-customization.app-customization', {
  only: ['find'],
  config: {
    find: {
      policies: [
        /** Allow the use of '*' in populate to get components */
        {
          name: 'global::restrict-populate',
          config: {
            allowStar: true
          } as RestrictPopulateConfig
        }
      ]
    }
  }
});
