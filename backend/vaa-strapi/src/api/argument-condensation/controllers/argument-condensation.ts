import { processComments } from '@openvaa/argument-condensation';
import { generateAnswersCSV } from '../utils/csv-generator';

export default {
  async condense(ctx) {
    try {
      // Get all questions with their answers
      console.log('\n=== Starting Argument Condensation ===');
      console.log('Fetching questions and answers...');
      const questions = await strapi.db.query('api::question.question').findMany({
        populate: ['answers', 'questionType']
      });

      // Filter for Likert questions
      const likertQuestions = questions.filter(
        (q) => q.questionType?.name === 'Likert-4' || q.questionType?.name === 'Likert-5'
      );

      console.log(`Found ${likertQuestions.length} Likert-4/5 questions out of ${questions.length} total`);

      // Generate CSV file for debugging
      console.log('\n=== Generating CSV for Debugging ===');
      await generateAnswersCSV(likertQuestions);

      // Process each question
      console.log('\n=== Processing Questions ===');
      for (const question of likertQuestions) {
        console.log(`\nProcessing Question ID ${question.id}:`);
        console.log('Text (FI):', question.text?.fi);
        console.log('Type:', question.questionType?.name);

        // Get all answers for this question
        const answers = question.answers;
        const comments = answers
          .map((answer) => answer.openAnswer?.fi) // Only select Finnish answers
          .filter((openAnswer) => openAnswer)
          .slice(0, 10); // Take only first 10 answers

        console.log('Finnish Open Answers (first 10):', comments);
        console.log(`Using ${comments.length} out of ${answers.length} total answers`);

        if (comments.length > 0) {
          console.log('Processing comments with OpenAI...');
          // Process the comments for this question
          const condensedArguments = await processComments(comments, question.text?.fi || '');
          console.log('Condensed Arguments:', condensedArguments);

          // Update question with condensed arguments
          await strapi.db.query('api::question.question').update({
            where: { id: question.id },
            data: {
              customData: {
                ...question.customData,
                argumentSummary: condensedArguments
              }
            }
          });

          console.log(`Updated question ${question.id} with ${condensedArguments.length} arguments`);
        } else {
          console.log('Skipping question - no valid Finnish comments found');
        }
      }

      console.log('\n=== Process Complete ===');
      ctx.body = {
        data: {
          message: `Successfully processed all questions`,
          processedCount: likertQuestions.length
        }
      };
    } catch (error) {
      console.error('\n=== Error in Argument Condensation ===');
      console.error('Detailed error:', error);
      ctx.throw(500, error.message || 'Failed to process and update arguments');
    }
  }
};
