import { factories } from '@strapi/strapi';

export default factories.createCoreRouter(
  'api::factor-loading.factor-loading',
  {
    only: ['find', 'findOne'],
    config: {
      find: {
        policies: ['global::restrict-populate']
      },
      findOne: {
        policies: ['global::restrict-populate']
      }
    }
  }
);
