import { updateCustomData } from '../../../util/updateCustomData';
import type { Data } from '@strapi/strapi';
import type { StrapiContext } from '../../../../types/customStrapiTypes';

export default {
  /**
   * Update the `Question`’s `customData` by merging the new data.
   */
  async update(ctx: StrapiContext) {
    const data = await updateQuestionCustomData(ctx);
    ctx.response.status = 200;
    ctx.response.body = { data };
  }
};

function updateQuestionCustomData({
  params,
  request
}: StrapiContext): Promise<Data.ContentType<'api::question.question'>> {
  console.error({ params });
  const customData = request.body?.data;
  if (!customData || typeof customData !== 'object')
    throw new Error('[updateQuestionCustomData] No customData object provided.');
  return updateCustomData({
    collection: 'api::question.question',
    documentId: params.id,
    customData
  });
}
