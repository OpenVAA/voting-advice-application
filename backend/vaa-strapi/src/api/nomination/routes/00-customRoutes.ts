/**
 * Contains the definitions for the `api::candidate.answers.overwrite/update` and `api::candidate.properties.update` actions.
 * NB. The filename starts with zeros so that it is matched before the core routes.
 */

import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/nominations/with-relations',
      handler: 'nomination.withRelations',
      config: {
        auth: false,
        policies: []
      }
    } as Core.RouteConfig
  ]
};
