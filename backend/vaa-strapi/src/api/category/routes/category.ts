/**
 * category router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::category.category', {
  only: ['find', 'findOne'],
  config: {
    findOne: {
      policies: ['global::ignore-drafts'],
    },
  },
});
