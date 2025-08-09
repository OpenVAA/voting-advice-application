import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'POST',
      path: '/questions/generateInfo',
      handler: 'question.generateInfo',
      config: {
        policies: ['global::user-is-admin']
      }
    } as Core.RouteConfig
  ]
};
