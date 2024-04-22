/**
 * app-setting router
 */

import { factories } from '@strapi/strapi';
import { restrictPopulate, restrictFilters } from '../../../util/acl';

export default factories.createCoreRouter('api::app-setting.app-setting', {
  only: ['find', 'findOne'], // Explicitly disabled create and delete
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'poster',
          'posterCandidateApp',
          'publisherLogo',
          'publisherLogoDark',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'poster',
          'posterCandidateApp',
          'publisherLogo',
          'publisherLogoDark',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([]),
      ],
    },
  },
});