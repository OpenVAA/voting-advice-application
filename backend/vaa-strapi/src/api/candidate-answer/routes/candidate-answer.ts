/**
 * candidate-answer router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::candidate-answer.candidate-answer', {
  only: ['find', 'findOne'],
  config: {
    findOne: {
      policies: ['global::ignore-drafts'],
    },
  },
});
