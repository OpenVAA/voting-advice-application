/**
 * answer router
 */

import { factories } from '@strapi/strapi';
import { restrictResourceOwnedByCandidate, restrictPopulate, restrictFilters } from '../../../util/acl';

export default factories.createCoreRouter('api::answer.answer', {
  only: ['find', 'findOne', 'create', 'update', 'delete'],
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    create: {
      policies: [
        // Enforce ownership to always belong to the candidate
        'global::owned-by-candidate',
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    update: {
      policies: [
        // Allow only updating candidate's own resource
        restrictResourceOwnedByCandidate('api::answer.answer'),
        // Enforce ownership to always belong to the candidate
        'global::owned-by-candidate',
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    delete: {
      policies: [
        // Allow only deleting candidate's own resource
        restrictResourceOwnedByCandidate('api::answer.answer'),
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
  },
});
