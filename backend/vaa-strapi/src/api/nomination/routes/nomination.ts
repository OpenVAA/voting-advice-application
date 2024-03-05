/**
 * nomination router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate } from '../../../util/acl';

export default factories.createCoreRouter('api::nomination.nomination', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'election',
          'constituency',
          'party',
          'candidate',
          'candidate.populate.party',
          'candidate.populate.photo',
          'candidate.populate.answers.populate.question',
        ]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'election',
          'constituency',
          'party',
          'candidate',
          'candidate.populate.party',
          'candidate.populate.photo',
          'candidate.populate.answers.populate.question',
        ]),
      ],
    },
  },
});
