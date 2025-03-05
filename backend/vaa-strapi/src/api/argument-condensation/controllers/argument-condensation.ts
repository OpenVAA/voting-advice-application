import { processComments } from '@openvaa/argument-condensation';
import { generateAnswersJSON } from '../utils/debug-data-generator';
import { finnishConfig } from '@openvaa/argument-condensation';
import { OpenAIProvider } from '@openvaa/llm';

// Initialize the OpenAI provider
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const model = 'gpt-4o-mini';
const llmProvider = new OpenAIProvider({ apiKey: OPENAI_API_KEY, model });

// Testing function for condensing arguments from strapi (currently lorem ipsum)
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
      let likertQuestions = questions.filter((q) => q.questionType?.name === 'Likert-5');
      console.log(`Found ${likertQuestions.length} Likert-5 questions total`);

      // Process all Likert questions
      for (const questionToProcess of likertQuestions) {
        console.log('\n=== Processing Question ===');
        console.log('Question ID:', questionToProcess.id);
        console.log('Text (FI):', questionToProcess.text?.fi);
        console.log('Type:', questionToProcess.questionType?.name);

        // Get all answers for this question
        const answers = questionToProcess.answers;
        const comments = answers.map((answer) => answer.openAnswer?.fi).filter((openAnswer) => openAnswer);

        console.log(`Using ${comments.length} out of ${answers.length} total answers`);

        if (comments.length > 0) {
          // Process the comments for this question
          const condensedArguments = await processComments(
            llmProvider,
            finnishConfig,
            comments,
            questionToProcess.text?.fi || 'Unknown Topic'
          );
          console.log('Condensed Arguments:', condensedArguments);

          // Update question with condensed arguments
          await strapi.db.query('api::question.question').update({
            where: { id: questionToProcess.id },
            data: {
              customData: {
                ...questionToProcess.customData,
                argumentSummary: condensedArguments
              }
            }
          });

          console.log(`Updated question ${questionToProcess.id} with ${condensedArguments.length} arguments`);
        } else {
          console.log('Skipping question - no valid Finnish comments found');
        }
      }

      console.log('\n=== Process Complete ===');
      ctx.body = {
        data: {
          message: 'Successfully processed all Likert questions',
          processedQuestions: likertQuestions.length
        }
      };
    } catch (error) {
      console.error('\n=== Error in Argument Condensation ===');
      console.error('Detailed error:', error);
      ctx.throw(500, error.message || 'Failed to process and update arguments');
    }
  }
};
