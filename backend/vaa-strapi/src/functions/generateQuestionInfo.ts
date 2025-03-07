import { API } from "../util/api";
import { LLMResponse, OpenAIProvider } from "@openvaa/llm";
import { LLM_OPENAI_API_KEY } from "../constants";
import { dynamicSettings } from "@openvaa/app-shared";

export async function generateQuestionInfo(questionId: number) { // 
  if (!LLM_OPENAI_API_KEY) {
    throw new Error('LLM_OPENAI_API_KEY is required for generating mock LLM summaries')  
  }

  try {
    const question = await strapi.db.query(API.Question).findOne({
      where: { id: questionId }
    });
    console.log(question.text);
    const res: LLMResponse = await new OpenAIProvider({ apiKey: LLM_OPENAI_API_KEY }).generate({
      messages: [
        {
          role: 'system',
          content: 'message.content'
        },
        {
          role: 'user',
          // Is question.text concatenated correctly here
          content: dynamicSettings.llm.prompt + question.text + dynamicSettings.llm.answerFormat
        }
      ]
    });

    const generatedCustomData = JSON.parse(res.content);

    // Replace existing data with new generated data
    const existingCustomData = question.customData || {};
    const mergedCustomData = {
      ...existingCustomData,
      infoSections: generatedCustomData.infoSections || existingCustomData.infoSections || [],
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

export async function generateQuestionInfoForAllQuestions() {
  const questions = await strapi.db.query(API.Question).findMany({});
  for (const question of questions) {
    if (!LLM_OPENAI_API_KEY) {
      throw new Error('LLM_OPENAI_API_KEY is required for generating mock LLM summaries')  
    }

    try {
      console.log(question.text);
      const res: LLMResponse = await new OpenAIProvider({ apiKey: LLM_OPENAI_API_KEY }).generate({
        messages: [
          {
            role: 'system',
            content: 'message.content'
          },
          {
            role: 'user',
            // Is question.text concatenated correctly here
            content: dynamicSettings.llm.prompt + question.text + dynamicSettings.llm.answerFormat
          }
        ]
      });

      const generatedCustomData = JSON.parse(res.content);

      // Replace existing data with new generated data
      const existingCustomData = question.customData || {};
      const mergedCustomData = {
        ...existingCustomData,
        infoSections: generatedCustomData.infoSections || existingCustomData.infoSections || [],
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
