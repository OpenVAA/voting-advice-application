/**
 * language router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::language.language', {
  only: ['find', 'findOne'],
  config: {
    findOne: {
      policies: ['global::ignore-drafts'],
    },
  },
});
