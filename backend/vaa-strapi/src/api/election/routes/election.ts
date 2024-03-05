/**
 * election router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate } from '../../../util/acl';

export default factories.createCoreRouter('api::election.election', {
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
      ],
    },
  },
});
