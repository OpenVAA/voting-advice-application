/**
 * global-copy router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::global-copy.global-copy', {
  only: ['find', 'findOne'],
  config: {
    findOne: {
      policies: ['global::ignore-drafts'],
    },
  },
});
