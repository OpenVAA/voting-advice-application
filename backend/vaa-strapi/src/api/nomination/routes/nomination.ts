/**
 * nomination router
 */

import { factories } from '@strapi/strapi';
import { restrictFilters, restrictPopulate } from '../../../util/acl';
import { Generic } from '../../../util/acl.type';

export default factories.createCoreRouter('api::nomination.nomination', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'candidate.populate.answers.populate.question',
          'candidate.populate.party',
          'candidate.populate.photo',
          'candidate',
          'constituency',
          'election',
          'party.populate.answers.populate.question',
          'party.populate.logo',
          'party'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'candidate.id.$eq',
          'candidate.id.$in',
          'candidate.id.$notNull',
          'constituency.id.$eq',
          'constituency.id.$in',
          'election.id.$eq',
          'election.id.$in',
          'candidate.party.id.$eq',
          'candidate.party.id.$in',
          'party.id.$eq',
          'party.id.$in',
          'party.id.$notNull'
        ])
      ]
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'candidate.populate.answers.populate.question',
          'candidate.populate.party',
          'candidate.populate.photo',
          'candidate',
          'constituency',
          'election',
          'party.populate.answers.populate.question',
          'party.populate.logo',
          'party'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([
          'candidate.id.$eq',
          'candidate.id.$in',
          'candidate.id.$notNull',
          'constituency.id.$eq',
          'constituency.id.$in',
          'election.id.$eq',
          'election.id.$in',
          'candidate.party.id.$eq',
          'candidate.party.id.$in',
          'party.id.$eq',
          'party.id.$in',
          'party.id.$notNull'
        ])
      ]
    }
  } as unknown as Generic
});
