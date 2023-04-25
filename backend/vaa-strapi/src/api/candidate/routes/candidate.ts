/**
 * candidate router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::candidate.candidate', {
  only: ['find', 'findOne'],
  config: {
    findOne: {
      policies: ['global::ignore-drafts'],
    },
  },
});
