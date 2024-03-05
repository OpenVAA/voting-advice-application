/**
 * candidate router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate, restrictResourceOwnedByCandidate, restrictBody } from '../../../util/acl';

export default factories.createCoreRouter('api::candidate.candidate', {
  only: ['find', 'findOne', 'update'], // Explicitly disabled create and delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
    update: {
      policies: [
        // Allow only updating candidate's own resource
        restrictResourceOwnedByCandidate('api::candidate.candidate'),
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Allow only updating the following fields
        restrictBody(['gender', 'birthday', 'unaffiliated', 'photo', 'manifesto', 'motherTongues', 'otherLanguages', 'politicalExperience']),
      ],
    },
  },
});
