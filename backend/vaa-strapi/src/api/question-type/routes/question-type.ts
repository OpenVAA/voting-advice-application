/**
 * question-type router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate } from '../../../util/acl';

export default factories.createCoreRouter('api::question-type.question-type', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'questions.populate.category.populate.elections',
        ]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'questions.populate.category.populate.elections',
        ]),
      ],
    },
  },
});
