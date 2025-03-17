/**
 * Contains the definitions for the `api::candidate.answers.overwrite/update` and `api::candidate.properties.update` actions.
 * NB. The filename starts with zeros so that it is matched before the core routes.
 */

import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'POST',
      path: '/candidate/:id/overwrite-answers',
      handler: 'answers.overwrite',
      config: {
        policies: ['global::user-owns-candidate', 'global::not-answers-locked']
      }
    } as Core.RouteConfig,
    {
      method: 'POST',
      path: '/candidate/:id/update-answers',
      handler: 'answers.update',
      config: {
        policies: ['global::user-owns-candidate', 'global::not-answers-locked']
      }
    } as Core.RouteConfig,
    {
      method: 'POST',
      path: '/candidate/:id/update-properties',
      handler: 'properties.update',
      config: {
        policies: ['global::user-owns-candidate', 'global::not-answers-locked']
      }
    } as Core.RouteConfig
  ]
};
