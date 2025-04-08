import { dynamicSettings } from '@openvaa/app-shared';
import { LLMResponse, OpenAIProvider } from '@openvaa/llm';
import { LLM_OPENAI_API_KEY } from '../constants';
import { API } from '../util/api';

/*
 *
 * Generate info for questions using OpenAI API. Generates questions for all whose ids are in the questionIds
 * array. An empty array generates info for all questions. The information is generated according to the prompt template in
 * /packages/shared/src/settings/dynamicSettings.ts.
 *
 */

export async function generateQuestionInfo(questionIds: Array<string>): Promise<{ type: 'success' | 'failure' }> {
  if (!LLM_OPENAI_API_KEY) {
    throw new Error('LLM_OPENAI_API_KEY is required for generating LLM summaries');
  }
  try {
    let questions = [];
    if (questionIds.length == 0) {
      questions = await strapi.documents(API.Question).findMany({
        limit: 9999 // Arbitrary to get all questions
      });
    } else {
      questions = await strapi.documents(API.Question).findMany({
        filters: {
          documentId: {
            $in: questionIds
          }
        }
      });
      if (questions.length !== questionIds.length) {
        throw new Error('Number of questions found is different from number of questions given');
      }
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
      const existingCustomData = question.customData ?? {};
      const mergedCustomData = {
        ...existingCustomData,
        infoSections: generatedCustomData.infoSections ?? existingCustomData.infoSections ?? [],
        terms: generatedCustomData.terms ?? existingCustomData.terms ?? []
      };

      await strapi.documents('api::question.question').update({
        documentId: question.documentId,
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
