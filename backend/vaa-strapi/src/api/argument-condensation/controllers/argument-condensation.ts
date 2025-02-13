import { processArguments } from '@openvaa/argument-condensation';

export default {
  async condense(ctx) {
    try {
      // Process the arguments
      console.log('Starting argument processing...');
      const condensedArguments = await processArguments();
      console.log('Arguments processed:', condensedArguments?.length || 0);

      // Get all questions
      console.log('Fetching questions...');
      const questions = await strapi.db.query('api::question.question').findMany({
        populate: ['customData']
      });
      console.log('Questions fetched:', questions?.length || 0);

      // Update questions sequentially
      for (let i = 0; i < Math.min(condensedArguments.length, questions.length); i++) {
        const argument = condensedArguments[i];
        const question = questions[i];

        // Preserve existing customData
        const existingCustomData = question.customData || {};

        await strapi.db.query('api::question.question').update({
          where: { id: question.id },
          data: {
            customData: {
              ...existingCustomData,
              argumentSummary: {
                mainArgument: argument.mainArgument,
                sources: argument.sources,
                sourceIndices: argument.sourceIndices
              }
            }
          }
        });

        console.log(`Updated question ${question.id} with argument summary`);
      }

      // Return success response
      ctx.body = {
        data: {
          message: `Successfully updated ${Math.min(condensedArguments.length, questions.length)} questions with argument summaries`,
          processedCount: condensedArguments.length,
          updatedCount: Math.min(condensedArguments.length, questions.length)
        }
      };
    } catch (error) {
      console.error('Detailed error in argument condensation:', error);
      ctx.throw(500, error.message || 'Failed to process and update arguments');
    }
  }
};
