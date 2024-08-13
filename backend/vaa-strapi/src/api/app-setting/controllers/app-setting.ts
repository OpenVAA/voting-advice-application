/**
 * app-setting controller
 */

import {factories} from '@strapi/strapi';
import {API} from '../../../functions/utils/api';
import {getCardContentsFromStrapi} from '../../../functions/utils/appSettings';

export default factories.createCoreController(API.AppSettings, () => ({
  async findOne(ctx) {
    const result = await super.find(ctx);

    for (const [i, val] of result.data.entries()) {
      const cardContents = await getCardContentsFromStrapi(val.id);
      result.data[i].attributes.results.cardContents = cardContents;
    }

    return result;
  },

  async find(ctx) {
    const {data, meta} = await super.find(ctx);

    for (const [i, val] of data.entries()) {
      const cardContents = await getCardContentsFromStrapi(val.id);
      data[i].attributes.results.cardContents = cardContents;
    }

    return {data, meta};
  }
}));
