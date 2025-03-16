import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'POST',
      path: '/questions/:id/generateInfo',
      handler: 'question.generateInfo',
      policies: [
        'global::user-is-admin'
      ]
    } as Core.RouteConfig
  ]
}
