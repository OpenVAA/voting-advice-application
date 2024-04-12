/**
 * answer router
 */

import { factories } from '@strapi/strapi';
import { restrictResourceOwnedByCandidate, restrictPopulate, restrictFilters, electionCanEditQuestions } from '../../../util/acl';

export default factories.createCoreRouter('api::answer.answer', {
  only: ['find', 'findOne', 'create', 'update', 'delete'],
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'question.populate.category',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'candidate.id.$eq',
          'question.category.type.$eq',
        ]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'question.populate.category',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'candidate.id.$eq',
          'question.category.type.$eq',
        ]),
      ],
    },
    create: {
      policies: [
        // Enforce ownership to always belong to the candidate
        'global::owned-by-candidate',
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'question.populate.category',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'candidate.id.$eq',
          'question.category.type.$eq',
        ]),
        // Allow modification only when the current election allows it
        electionCanEditQuestions,
      ],
    },
    update: {
      policies: [
        // Allow only updating candidate's own resource
        restrictResourceOwnedByCandidate('api::answer.answer'),
        // Enforce ownership to always belong to the candidate
        'global::owned-by-candidate',
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'question.populate.category',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'candidate.id.$eq',
          'question.category.type.$eq',
        ]),
        // Allow modification only when the current election allows it
        electionCanEditQuestions,
      ],
    },
    delete: {
      policies: [
        // Allow only deleting candidate's own resource
        restrictResourceOwnedByCandidate('api::answer.answer'),
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'question.populate.category',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'candidate.id.$eq',
          'question.category.type.$eq',
        ]),
        // Allow modification only when the current election allows it
        electionCanEditQuestions,
      ],
    },
  },
});
