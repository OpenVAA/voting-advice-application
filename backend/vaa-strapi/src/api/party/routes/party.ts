/**
 * party router
 */

import { factories } from '@strapi/strapi';
import { restrictFilters, restrictPopulate } from '../../../util/acl';
import { Generic } from '../../../util/acl.type';

export default factories.createCoreRouter('api::party.party', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'logo',
          'candidates',
          'answers.populate.question',
          'nominations',
          'nominations.populate.constituency',
          'nominations.populate.election',
          'nominations.populate.candidate',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'id.$eq',
          'id.$in',
          'nominations.constituency.id.$eq',
          'nominations.constituency.id.$in',
          'nominations.election.id.$eq',
          'nominations.election.id.$in',
        ]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'logo',
          'candidates',
          'answers.populate.question',
          'nominations',
          'nominations.populate.constituency',
          'nominations.populate.election',
          'nominations.populate.candidate',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'id.$eq',
          'id.$in',
          'nominations.constituency.id.$eq',
          'nominations.constituency.id.$in',
          'nominations.election.id.$eq',
          'nominations.election.id.$in',
        ]),
      ],
    },
  } as unknown as Generic,
});
