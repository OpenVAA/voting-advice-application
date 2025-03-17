import { dynamicSettings } from '@openvaa/app-shared';
import { LLMResponse, OpenAIProvider } from '@openvaa/llm';
import { LLM_OPENAI_API_KEY } from '../constants';
import { API } from '../util/api';

export async function generateQuestionInfo(questionId: number) {
  if (!LLM_OPENAI_API_KEY) {
    throw new Error('LLM_OPENAI_API_KEY is required for generating LLM summaries');
  }

  try {
    const question = await strapi.db.query(API.Question).findOne({
      where: { id: questionId }
    });
    // Fail if there is no question with given id
    if (!question) throw new Error(`No question with given id ${questionId} exists`);
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
  } catch (error) {
    console.error('Failed to generate LLM summary, ', error);
    throw new Error(error);
  }
}

export async function generateQuestionInfoForAllQuestions() {
  const questions = await strapi.db.query(API.Question).findMany({});
  for (const question of questions) {
    if (!LLM_OPENAI_API_KEY) {
      throw new Error('LLM_OPENAI_API_KEY is required for generating mock LLM summaries');
    }

    try {
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
        infoSections: generatedCustomData.infoSections || existingCustomData.infoSections || []
        // terms here
      };

      await strapi.db.query(API.Question).update({
        where: { id: question.id },
        data: {
          customData: mergedCustomData
        }
      });
    } catch (error) {
      console.error('Failed to generate LLM summary, ', error);
    }
  }
}
