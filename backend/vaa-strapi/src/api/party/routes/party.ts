/**
 * party router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::party.party', {
  only: ['find', 'findOne'],
  config: {
    findOne: {
      policies: ['global::ignore-drafts'],
    },
  },
});
