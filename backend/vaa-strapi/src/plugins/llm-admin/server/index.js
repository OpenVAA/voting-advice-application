'use strict';

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
    } catch (error) {
      console.error('Failed to create initial LLM test entry:', error);
    }
  },

  destroy({ strapi }) {
    // Cleanup when plugin is destroyed
  }
};
