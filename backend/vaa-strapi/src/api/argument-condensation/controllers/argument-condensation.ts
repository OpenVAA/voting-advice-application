import { processComments } from '@openvaa/argument-condensation';
import { generateAnswersJSON } from '../utils/debug-data-generator';
import { finnishConfig } from '@openvaa/argument-condensation';
import { OpenAIProvider } from '@openvaa/llm';

// Initialize the OpenAI provider
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const model = 'gpt-4o-mini';
const llmProvider = new OpenAIProvider({ apiKey: OPENAI_API_KEY, model });


// !!
// Note: Logic for question selection and grouping will be refactored
// !!

interface LikertGroups {
  presumedPros: Array<string>;
  presumedCons: Array<string>;
  neutral?: Array<string>;
}

interface CategoryGroups {
  [key: string]: Array<string>;
}

function groupLikertAnswers(answers: any[], likertType: string): LikertGroups {
  // Extract the scale size from likert type (e.g., "Likert-5" -> 5)
  const likertScale = parseInt(likertType.split('-')[1]);
  const midpoint = (likertScale + 1) / 2;
  
  // Initialize groups
  const groups: LikertGroups = {
    presumedPros: [],
    presumedCons: [],
  };

  answers.forEach(answer => {
    // Check for valid open answer (will be refactored) or string (which should contain an integer value)
    if (!answer.openAnswer?.fi || typeof answer.value !== 'string') {
      return;
    }

    // Convert value to a number
    const value = parseInt(answer.value);
    
    // Group based on position relative to the Likert scale's midpoint
    if (value < midpoint - 0.5) {
      groups.presumedCons.push(answer.openAnswer.fi);
    } else if (value > midpoint + 0.5) {
      groups.presumedPros.push(answer.openAnswer.fi);
    }
  });
  console.log('Likert Groups:', groups);

  return groups;
}

// Note: NOT IN USE, as our test data does not yet contain categorical answers
function groupCategoricalAnswers(answers: any[]): CategoryGroups {
  const groups: CategoryGroups = {};

  answers.forEach(answer => {
    // Skip if no valid open answer or categorical answer
    if (!answer.openAnswer?.fi || !answer.categoricalAnswer) {
      return;
    }

    const category = answer.categoricalAnswer;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(answer.openAnswer.fi);
  });

  return groups;
}

// Testing function for condensing arguments from strapi (currently lorem ipsum)
export default {
  async condense(ctx) {
    try {
      console.log('\n=== Starting Argument Condensation ===');
      console.log('Fetching questions and answers...');
      const qs = await strapi.db.query('api::question.question').findMany({
        populate: ['answers', 'questionType']
      });

      const questions = qs.filter(q => q.questionType?.name === 'Likert-5')[0];
      console.log('Question:', questions);

      // Process each question based on its type
      for (const questionToProcess of (Array.isArray(questions) ? questions : [questions])) {
        console.log('\n=== Processing Question ===');
        console.log('Question ID:', questionToProcess.id);
        console.log('Text (FI):', questionToProcess.text?.fi);
        console.log('Type:', questionToProcess.questionType?.name);

        const answers = questionToProcess.answers;
        const questionType = questionToProcess.questionType?.name;

        let processedResults; // Results for the question

        // If LIKERT
        if (questionType?.startsWith('Likert-')) {
          // Handle Likert questions
          const groupedAnswers = groupLikertAnswers(answers, questionType);
          
          console.log(`Found ${groupedAnswers.presumedPros.length} presumed pros`);
          console.log(`Found ${groupedAnswers.presumedCons.length} presumed cons`);

          const results = {
            pros: [],
            cons: []
          };

          if (groupedAnswers.presumedPros.length > 0) {
            results.pros = await processComments(
              llmProvider,
              finnishConfig,
              groupedAnswers.presumedPros,
              questionToProcess.text?.fi || 'Unknown Topic'
            );
            console.log(`Found ${results.pros.length} pros for question ID ${questionToProcess.id}`);
          }

          if (groupedAnswers.presumedCons.length > 0) {
            results.cons = await processComments(
              llmProvider,
              finnishConfig,
              groupedAnswers.presumedCons,
              questionToProcess.text?.fi || 'Unknown Topic'
            );
            console.log(`Found ${results.cons.length} cons for question ID ${questionToProcess.id}`);
          }

          processedResults = results;
          
        // If CATEGORICAL
        } else if (questionType === 'Categorical') {
          // Handle categorical questions
          const groupedAnswers = groupCategoricalAnswers(answers);
          
          console.log('Categories found:', Object.keys(groupedAnswers));
          
          const results = {};
          
          for (const [category, comments] of Object.entries(groupedAnswers)) {
            if (comments.length > 0) {
              results[category] = await processComments(
                llmProvider,
                finnishConfig,
                comments,
                `${questionToProcess.text?.fi || 'Unknown Topic'} - ${category}`
              );
              console.log(`Found ${results[category].length} comments for category ${category} in question ID ${questionToProcess.id}`);
            }
          }

          processedResults = results;

        } else {
          console.log(`Skipping question - unsupported type: ${questionType}`);
          continue;
        }

        // Update question with processed results
        await strapi.db.query('api::question.question').update({
          where: { id: questionToProcess.id },
          data: {
            customData: {
              ...questionToProcess.customData,
              argumentSummary: processedResults
            }
          }
        });

        console.log(`Updated question ${questionToProcess.id} with the results`);
      }

      console.log('\n=== Process Complete ===');
      ctx.body = {
        data: {
          message: 'Successfully processed all questions',
          processedQuestions: questions.length
        }
      };
    } catch (error) {
      console.error('\n=== Error in Argument Condensation ===');
      console.error('Detailed error:', error);
      ctx.throw(500, error.message || 'Failed to process and update arguments');
    }
  }
};
