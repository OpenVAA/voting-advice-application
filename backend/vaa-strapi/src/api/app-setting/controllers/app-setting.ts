/**
 * app-setting controller
 */

import { factories } from '@strapi/strapi';
import { API } from '../../../functions/utils/api';
import { getCardContentsFromStrapi } from '../../../functions/utils/appSettings';

export default factories.createCoreController(API.AppSettings, () => ({
  async findOne(ctx) {
    const result = await super.find(ctx);
    if (result?.data) {
      for (const [i, val] of result.data.entries()) {
        const cardContents = await getCardContentsFromStrapi(val.id);
        if (!cardContents) continue;
        result.data[i].attributes.results ??= {};
        result.data[i].attributes.results.cardContents = cardContents;
      }
    }
    return result;
  },

  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    if (data) {
      for (const [i, val] of data.entries()) {
        const cardContents = await getCardContentsFromStrapi(val.id);
        if (!cardContents) continue;
        data[i].attributes.results ??= {};
        data[i].attributes.results.cardContents = cardContents;
      }
    }
    return { data, meta };
  }
}));
