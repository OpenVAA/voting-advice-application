'use strict';
const { OpenAIProvider, Role } = require('@openvaa/llm');

module.exports = {
  register({ strapi }) {
    // Register server-side functionality here
  },

  async bootstrap({ strapi }) {
    // Create a hello world entry on startup
    try {
      const existingEntries = await strapi.entityService.findMany('api::llm-test.llm-test', {
        filters: {
          prompt: 'Initial test'
        }
      });

      if (existingEntries.length === 0) {
        await strapi.entityService.create('api::llm-test.llm-test', {
          data: {
            prompt: 'Initial test',
            response: 'Hello World!',
            timestamp: new Date()
          }
        });
        console.log('Created initial LLM test entry');
      }

      // Second entry using OpenAI
      const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
      if (OPEN_AI_API_KEY) {
        const provider = new OpenAIProvider({ apiKey: OPEN_AI_API_KEY });
        const res = await provider.generate([
          {
            role: Role.SYSTEM,
            content: 'You are a helpful assistant'
          },
          {
            role: Role.USER,
            content: 'Say something interesting about AI'
          }
        ]);

        await strapi.entityService.create('api::llm-test.llm-test', {
          data: {
            prompt: 'AI Facts',
            response: res.content,
            timestamp: new Date()
          }
        });
        console.log('Created LLM-generated test entry');
      }
    } catch (error) {
      console.error('Failed to create test entries:', error);
    }
  },

  destroy({ strapi }) {
    // Cleanup when plugin is destroyed
  }
};
