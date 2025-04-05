/**
 * question controller
 */

import { factories } from '@strapi/strapi';
import { generateQuestionInfo } from '../../../functions/generateQuestionInfo';
import type { StrapiContext } from '../../../../types/customStrapiTypes';

export default factories.createCoreController('api::question.question', () => ({
  async generateInfo({ response, params }: StrapiContext) {
    try {
      await generateQuestionInfo(params.id);

      response.status = 200;
      response.body = {
        type: 'success'
      };
    } catch (error) {
      console.error('Error generating question info:', error);

      response.status = 400;
      response.body = {
        type: 'failure',
        error: error.message
      };
    }
  }
}));
