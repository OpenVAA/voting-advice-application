/**
 * question router
 */

import { factories } from '@strapi/strapi';
import { restrictFilters, restrictPopulate } from '../../../util/acl';
import { Generic } from '../../../util/acl.type';

export default factories.createCoreRouter('api::question.question', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate(['questionType', 'category', 'constituencies']),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters(['questionType.name.$startsWith', 'constituencies.id.$eq', 'constituencies.id.$in'])
      ]
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate(['questionType', 'category', 'constituencies']),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters(['questionType.name.$startsWith', 'constituencies.id.$eq', 'constituencies.id.$in'])
      ]
    }
  } as unknown as Generic
});
