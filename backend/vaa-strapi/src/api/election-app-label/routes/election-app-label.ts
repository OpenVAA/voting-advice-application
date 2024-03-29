/**
 * election-app-label router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate, restrictFilters } from '../../../util/acl';

export default factories.createCoreRouter('api::election-app-label.election-app-label', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'electionAppLabel.populate.actionLabels',
          'electionAppLabel.populate.viewTexts',
          'electionAppLabel.populate.localizations.populate',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'electionAppLabel.populate.actionLabels',
          'electionAppLabel.populate.viewTexts',
          'electionAppLabel.populate.localizations.populate',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
  },
});
