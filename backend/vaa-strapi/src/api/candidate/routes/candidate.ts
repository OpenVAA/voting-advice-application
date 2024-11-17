/**
 * candidate router
 */
import { factories } from '@strapi/strapi';
import { electionCanEditAnswers, restrictBody, restrictFilters, restrictPopulate } from '../../../util/acl';
import { Generic, StrapiContext } from '../../../util/acl.type';

export default factories.createCoreRouter('api::candidate.candidate', {
  only: ['find', 'findOne', 'update'], // Explicitly disabled create and delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'photo',
          'answers.populate.question',
          'nomination',
          'nomination.populate.constituency',
          'nomination.populate.election',
          'nomination.populate.party',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'id.$eq',
          'id.$in',
          'nomination.constituency.id.$eq',
          'nomination.constituency.id.$in',
          'nomination.election.id.$eq',
          'nomination.election.id.$in',
        ]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'photo',
          'answers.populate.question',
          'nomination',
          'nomination.populate.constituency',
          'nomination.populate.election',
          'nomination.populate.party',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'id.$eq',
          'id.$in',
          'nomination.constituency.id.$eq',
          'nomination.constituency.id.$in',
          'nomination.election.id.$eq',
          'nomination.election.id.$in',
        ]),
      ],
    },
    update: {
      policies: [
        // Allow only updating candidate itself
        async ({ params, state }: StrapiContext, config, { strapi }) => {
          const { id } = params;
          const userId = state?.user?.id;
          if (!id || !userId) return false;
          const candidate = await strapi.query('api::candidate.candidate').findOne({
            where: { id, user: { id: userId } },
          });
          return !!candidate;
        },
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
        // Allow only updating the following fields
        restrictBody(['photo', 'appLanguage']),
        // Allow modification only when the current election allows it
        electionCanEditAnswers,
      ],
    },
  } as unknown as Generic,
});
