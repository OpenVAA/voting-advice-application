/**
 * app-customization router
 */

import {factories} from '@strapi/strapi';
import {restrictPopulate, restrictFilters} from '../../../util/acl';

export default factories.createCoreRouter('api::app-customization.app-customization', {
  only: ['find'],
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([
          'translationOverrides',
          'candidateAppFAQ',
          'publisherLogo',
          'publisherLogoDark',
          'poster',
          'posterDark',
          'candPoster',
          'candPosterDark',
        ]),
        // Disable filters by default to avoid accidentally leaking data of relations
        restrictFilters([])
      ]
    }
  }
});
