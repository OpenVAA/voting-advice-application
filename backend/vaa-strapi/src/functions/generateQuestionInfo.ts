import { dynamicSettings } from '@openvaa/app-shared';
import { LLMResponse, OpenAIProvider } from '@openvaa/llm';
import { LLM_OPENAI_API_KEY } from '../constants';
import { API } from '../util/api';

export async function generateQuestionInfo(questionIds?: Array<number>): Promise<{ type: 'success' | 'failure' }> {
  if (!LLM_OPENAI_API_KEY) {
    throw new Error('LLM_OPENAI_API_KEY is required for generating LLM summaries');
  }
  try {
    let questions = [];
    if (!questionIds || questionIds.length == 0) {
      questions = await strapi.db.query(API.Question).findMany({
        limit: 9999 // Arbitrary to get all questions
      });
    } else {
      questions = await strapi.db.query(API.Question).findMany({
        where: {
          id: {
            $in: questionIds
          }
        }
      });
    }

    for (const question of questions) {
      const res: LLMResponse = await new OpenAIProvider({ apiKey: LLM_OPENAI_API_KEY }).generate({
        messages: [
          {
            role: 'system',
            content: 'message.content'
          },
          {
            role: 'user',
            content: dynamicSettings.llm.prompt + JSON.stringify(question?.text) + dynamicSettings.llm.answerFormat
          }
        ]
      });

      const generatedCustomData = JSON.parse(res.content);

      // Replace existing data with new generated data
      const existingCustomData = question.customData || {};
      const mergedCustomData = {
        ...existingCustomData,
        infoSections: generatedCustomData.infoSections || existingCustomData.infoSections || [],
        terms: generatedCustomData.terms || existingCustomData.terms || []
      };

      await strapi.db.query(API.Question).update({
        where: { id: question.id },
        data: {
          customData: mergedCustomData
        }
      });
    }
    return { type: 'success' };
  } catch (error) {
    console.error('Failed to generate LLM summary, ', error);
    return { type: 'failure' };
  }
}
