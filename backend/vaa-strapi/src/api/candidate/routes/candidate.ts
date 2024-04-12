/**
 * candidate router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate, restrictFilters, restrictBody, electionCanEditQuestions } from '../../../util/acl';

export default factories.createCoreRouter('api::candidate.candidate', {
  only: ['find', 'findOne', 'update'], // Explicitly disabled create and delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
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
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    update: {
      policies: [
        // Allow only updating candidate itself
        async (ctx: any, config, {strapi}) => {
          const {id} = ctx.params;

          const candidate = await strapi.query('api::candidate.candidate').findOne({
            where: {id, user: {id: ctx.state.user.id}}
          });

          return !!candidate;
        },
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
        // Allow only updating the following fields
        restrictBody(['gender', 'birthday', 'unaffiliated', 'photo', 'manifesto', 'motherTongues', 'otherLanguages', 'politicalExperience', 'appLanguage']),
        // Allow modification only when the current election allows it
        electionCanEditQuestions,
      ],
    },
  },
});
