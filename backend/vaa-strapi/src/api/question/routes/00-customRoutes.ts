/**
 * Contains the definitions for the `api::question.customData.update` action.
 * NB. The filename starts with zeros so that it is matched before the core routes.
 */

import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'POST',
      path: '/question/:id/update-custom-data',
      handler: 'customdata.update',
      config: {
        policies: ['global::user-is-admin']
      }
    } as Core.RouteConfig
  ]
};
