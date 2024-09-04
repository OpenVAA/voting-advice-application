/**
 * nomination router
 */

import { factories } from '@strapi/strapi';
import { restrictFilters, restrictPopulate } from '../../../util/acl';

export default factories.createCoreRouter('api::nomination.nomination', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'election',
          'constituency',
          'party',
          'party.populate.logo',
          'candidate',
          'candidate.populate.party',
          'candidate.populate.photo',
          'candidate.populate.answers.populate.question'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'candidate.id.$eq',
          'candidate.id.$notNull',
          'constituency.id.$eq',
          'election.id.$eq',
          'candidate.party.id.$eq',
          'party.id.$eq',
          'party.id.$notNull'
        ])
      ]
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'election',
          'constituency',
          'party',
          'party.populate.logo',
          'candidate',
          'candidate.populate.party',
          'candidate.populate.photo',
          'candidate.populate.answers.populate.question'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    }
  }
});
