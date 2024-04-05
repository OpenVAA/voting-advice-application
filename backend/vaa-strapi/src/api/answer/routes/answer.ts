/**
 * answer router
 */

import { factories } from '@strapi/strapi';
import { restrictResourceOwnedByCandidate, restrictPopulate, restrictFilters } from '../../../util/acl';

const electionCanEditQuestions = async (ctx, config, {strapi}) => {
  if (!ctx.state.user) return false;

  // TODO: refactor this when nomination is one-to-one mapping to the candidate
  const candidate = await strapi.db.query('api::candidate.candidate').findOne({
    where: {user: {id: ctx.state.user.id}},
    populate: {
      nominations: {
        populate: {
          election: true,
        },
      },
    },
  });

  return candidate?.nominations[0]?.election?.canEditQuestions ?? false;
};

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
