/**
 * constituency router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::constituency.constituency', {
  only: ['find', 'findOne'],
  config: {
    findOne: {
      policies: ['global::ignore-drafts'],
    },
  },
});
