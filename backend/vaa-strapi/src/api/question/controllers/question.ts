/**
 * question controller
 */

import { factories } from '@strapi/strapi';
import { StrapiContext } from '../../../../types/customStrapiTypes';
import { generateQuestionInfo } from '../../../functions/generateQuestionInfo';

export default factories.createCoreController('api::question.question', () => ({
  async generateInfo(ctx: StrapiContext) {
    try {
      await handleGenerateInfo(ctx);
    } catch (error) {
      console.error('Error generating question info:', error);
      ctx.response.status = 400;
      ctx.response.body = {
        type: 'failure',
        error: error.message
      };
      return;
    }
    ctx.response.status = 200;
    ctx.response.body = {
      type: 'success'
    };
  }
}));

async function handleGenerateInfo(ctx: StrapiContext) {
  // Get array of Id:s from request body
  const data = ctx.request?.body.data;
  // What we get is unknown
  // It needs to be either an empty array or number[]
  const array: Array<number> = data.ids;
  const generatedInfo = await generateQuestionInfo(array);
  if (generatedInfo.type !== 'success') {
    throw new Error('Failed to generate question info');
  }
}
