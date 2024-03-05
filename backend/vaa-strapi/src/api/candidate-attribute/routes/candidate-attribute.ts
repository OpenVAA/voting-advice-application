/**
 * candidate-attribute router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate, restrictResourceOwnedByCandidate } from '../../../util/acl';

export default factories.createCoreRouter('api::candidate-attribute.candidate-attribute', {
  only: ['find', 'findOne', 'create', 'update', 'delete'],
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
    create: {
      policies: [
        // Enforce ownership to always belong to the candidate
        'global::owned-by-candidate',
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
    update: {
      policies: [
        // Allow only updating candidate's own resource
        restrictResourceOwnedByCandidate('api::candidate-attribute.candidate-attribute'),
        // Enforce ownership to always belong to the candidate
        'global::owned-by-candidate',
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
    delete: {
      policies: [
        // Allow only deleting candidate's own resource
        restrictResourceOwnedByCandidate('api::candidate-attribute.candidate-attribute'),
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
  },
});
