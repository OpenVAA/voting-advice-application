/**
 * Contains the definitions for the `api::question-category.question-category.withRelations` getter.
 * NB. The filename starts with zeros so that it is matched before the core routes.
 */

import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/question-categories/with-relations',
      handler: 'question-category.withRelations',
      config: {
        auth: false,
        policies: []
      }
    } as Core.RouteConfig
  ]
};
