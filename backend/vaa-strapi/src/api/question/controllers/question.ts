/**
 * question controller
 */

import { factories } from '@strapi/strapi';
import { StrapiContext } from '../../../../types/customStrapiTypes';
import { generateQuestionInfo } from '../../../functions/generateQuestionInfo';

export default factories.createCoreController('api::question.question', () => ({
  async generateInfo({ response, params }: StrapiContext) {
    try {
      await generateQuestionInfo(params.id);
    } catch (error) {
      response.status = 400;
      response.message = error;
      return error;
    }
    response.status = 200;
    response.body = {
      success: true
    };
  }
}));
