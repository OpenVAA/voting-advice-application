import { OpenAIProvider, Role, type LLMResponse } from '@openvaa/llm';

export default {
  // Add standard CRUD methods
  async find(ctx) {
    try {
      const entries = await strapi.entityService.findMany('api::llm-test.llm-test', {
        sort: { timestamp: 'desc' }
      });
      return entries;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async create(ctx) {
    try {
      const entry = await strapi.entityService.create('api::llm-test.llm-test', {
        data: ctx.request.body
      });
      return entry;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  // Original LLM test method
  async generate(ctx) {
    console.log('LLM test endpoint hit');
    const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;

    if (!OPEN_AI_API_KEY) {
      console.error('No OpenAI API key found');
      ctx.throw(500, 'OpenAI API key not configured');
      return;
    }

    try {
      console.log('Initializing OpenAI provider...');
      const provider = new OpenAIProvider({ apiKey: OPEN_AI_API_KEY });

      const prompt = ctx.request.body.prompt || 'Say hello!';

      console.log('Generating response...');
      const res: LLMResponse = await provider.generate([
        {
          role: Role.SYSTEM,
          content: 'You are a helpful assistant'
        },
        {
          role: Role.USER,
          content: prompt
        }
      ]);

      // Save to database
      await strapi.entityService.create('api::llm-test.llm-test', {
        data: {
          prompt: prompt,
          response: res.content,
          timestamp: new Date()
        }
      });

      console.log('Response saved to database');
      ctx.body = { success: true, data: res.content };
    } catch (error) {
      console.error('LLM generation failed:', error);
      ctx.throw(500, `Failed to generate LLM response: ${error.message}`);
    }
  }
};
