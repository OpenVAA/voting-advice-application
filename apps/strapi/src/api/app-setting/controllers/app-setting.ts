/**
 * app-setting controller
 *
 * The controller is customised to convert the `results.cardContents` from Strapi to the format used in `DynamicSettings`.
 */

import { factories } from '@strapi/strapi';
import { parseStrapiCardContents } from '../../..//util/appSettings';
import type { Data } from '@strapi/strapi';
import type { StrapiContext } from '../../../../types/customStrapiTypes';

export default factories.createCoreController('api::app-setting.app-setting', () => ({
  async find(ctx: StrapiContext) {
    const response = await super.find(ctx);
    if (response?.data) {
      const { results } = response.data as Data.ContentType<'api::app-setting.app-setting'>;
      if (results) {
        response.data.results.cardContents = parseStrapiCardContents(results);
        delete response.data.results.candidateCardContents;
        delete response.data.results.organizationCardContents;
      }
    }
    return response;
  }
}));
