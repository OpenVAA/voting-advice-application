/**
 * admin-job router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::admin-job.admin-job', {
  only: ['find', 'findOne', 'create', 'update'],
  config: {
    find: {
      policies: ['global::user-is-admin']
    },
    findOne: {
      policies: ['global::user-is-admin']
    },
    create: {
      policies: ['global::user-is-admin']
    },
    update: {
      policies: ['global::user-is-admin']
    }
  }
});
