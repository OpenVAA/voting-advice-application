/**
 * election router
 */

import {factories} from '@strapi/strapi';
import {restrictPopulate, restrictFilters} from '../../../util/acl';

export default factories.createCoreRouter('api::election.election', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'constituencies',
          'electionAppLabel.populate.actionLabels',
          'electionAppLabel.populate.viewTexts',
          'electionAppLabel.populate.localizations.populate',
          'question.populate.category.populate.election'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'constituencies',
          'electionAppLabel.populate.actionLabels',
          'electionAppLabel.populate.viewTexts',
          'electionAppLabel.populate.localizations.populate',
          'question.populate.category.populate.election'
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    }
  }
});
