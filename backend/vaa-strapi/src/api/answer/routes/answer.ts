/**
 * answer router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::answer.answer', {
  only: ['find', 'findOne'],
  config: {
    findOne: {
      policies: ['global::ignore-drafts'],
    },
  },
});

