/**
 *
 * This controller is used for validating that the frontend request for the question
 * info generation is formatted correctly (that the body is an array of numbers). That data is
 * then passed to generateQuestionInfo that generates new question info for the question whose
 * ids are listed in the array.
 *
 */

import { factories } from '@strapi/strapi';
import { StrapiContext } from '../../../../types/customStrapiTypes';
import { generateQuestionInfo } from '../../../functions/generateQuestionInfo';

export default factories.createCoreController('api::question.question', () => ({
  async generateInfo(ctx: StrapiContext) {
    try {
      const ids = ctx.request?.body.data.ids;
      if (!Array.isArray(ids)) throw new Error(`Non-array ids parameter: ${ids}`);
      const generationResult = await generateQuestionInfo(ids);
      if (generationResult.type !== 'success') {
        throw new Error(
          'Failed to generate question info in generateQuestionInfo. Number of parameters given in request does not match number of questions found on server.'
        );
      }
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
