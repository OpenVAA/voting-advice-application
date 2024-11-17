/**
 * constituency-group router
 */

import { factories } from '@strapi/strapi';
import { restrictFilters, restrictPopulate } from '../../../util/acl';
import { Generic } from '../../../util/acl.type';

export default factories.createCoreRouter('api::constituency-group.constituency-group', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate(['constituencies', 'constituencies.populate.parent']),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters(['id.$eq', 'id.$in']),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate(['constituencies', 'constituencies.populate.parent']),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters(['id.$eq', 'id.$in']),
      ],
    },
  } as unknown as Generic,
});
