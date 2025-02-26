import { factories } from '@strapi/strapi';

export default factories.createCoreRouter(
  'api::factor-loading.factor-loading',
  {
    only: ['find', 'findOne'],
    config: {
      find: {
        auth: false,
        policies: []
      },
      findOne: {
        auth: false,
        policies: []
      }
    }
  }
);
