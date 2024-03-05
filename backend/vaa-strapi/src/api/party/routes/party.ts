/**
 * party router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate } from '../../../util/acl';

export default factories.createCoreRouter('api::party.party', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'candidates',
          'answers.populate.question',
        ]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'candidates',
          'answers.populate.question',
        ]),
      ],
    },
  },
});
