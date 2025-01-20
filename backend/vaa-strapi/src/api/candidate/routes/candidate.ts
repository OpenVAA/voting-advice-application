/**
 * candidate router
 */
import { factories } from '@strapi/strapi';
import { RestrictBodyConfig } from '../../../policies/restrict-body';

export default factories.createCoreRouter('api::candidate.candidate', {
  only: ['find', 'findOne', 'update'], // Explicitly disabled create and delete
  config: {
    find: {
      policies: ['global::restrict-populate']
    },
    findOne: {
      policies: ['global::restrict-populate']
    },
    update: {
      policies: [
        'global::user-owns-candidate',
        {
          name: 'global::restrict-body',
          config: {
            allowedFields: ['answers', 'photo', 'appLanguage']
          } as RestrictBodyConfig
        },
        'global::restrict-populate'
      ]
    }
  }
});
