import { processComments, LanguageConfigs, CONDENSATION_TYPE } from '@openvaa/argument-condensation';
import { OpenAIProvider } from '@openvaa/llm';
import questionService from '../services/question-service';

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

function groupLikertAnswers(answers: any[], questionScale: number): LikertGroups {
  const isEven = questionScale % 2 === 0;
  const middleValue = Math.ceil(questionScale / 2);

  const groups: LikertGroups = {
    presumedPros: [],
    presumedCons: []
  };

  answers.forEach((answer) => {
    if (!answer.openAnswer?.fi || typeof answer.value !== 'string') {
      return;
    }

    const value = parseInt(answer.value);

    if (isEven) {
      // For 4-point scale: 1,2 -> cons, 3,4 -> pros
      value <= questionScale / 2
        ? groups.presumedCons.push(answer.openAnswer.fi)
        : groups.presumedPros.push(answer.openAnswer.fi);
    } else {
      // For 5-point scale: 1,2 -> cons, 3 -> ignored, 4,5 -> pros
      if (value < middleValue) {
        groups.presumedCons.push(answer.openAnswer.fi);
      } else if (value > middleValue) {
        groups.presumedPros.push(answer.openAnswer.fi);
      }
      // Middle value is ignored
    }
  });

  return groups;
}

// Note: NOT IN USE, as our test data does not yet contain categorical answers
function groupCategoricalAnswers(answers: any[]): CategoryGroups {
  const groups: CategoryGroups = {};

  answers.forEach((answer) => {
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

export default {
  /**
   * Condenses arguments for specified questions
   */
  async condense(ctx) {
    try {
      console.log('\n=== Starting Argument Condensation ===');

      const { questionDocumentIds } = ctx.request.body || {};

      // Validate questionDocumentIds if provided
      if (questionDocumentIds && (!Array.isArray(questionDocumentIds) || questionDocumentIds.length === 0)) {
        return ctx.badRequest('Question document IDs must be a non-empty array');
      }

      const questionsToProcess = await questionService.fetchProcessableQuestions(questionDocumentIds);
      if (questionsToProcess.length === 0) {
        return ctx.badRequest('No eligible questions found');
      }

      const answersMap = await questionService.fetchAnswersForQuestions(questionsToProcess.map((q) => q.documentId));
      console.log('Successfully fetched answers map');

      // Process each question based on its type
      for (const question of questionsToProcess) {
        console.log('\n=== Processing Question ===');
        console.log('Question ID:', question.id);
        console.log('Document ID:', question.documentId);
        console.log('Text:', question.text ? JSON.stringify(question.text).substring(0, 100) : 'No text');
        console.log('Type:', question.questionType?.settings?.type || 'Unknown type');
        console.log('Name:', question.questionType?.name || 'Unknown name');

        try {
          // Get answers for this specific question using documentId
          const answers = answersMap[question.documentId] || [];
          console.log(`Found ${answers.length} answers for this question`);

          if (answers.length === 0) {
            console.log('Skipping question - no answers found');
            continue;
          }

          const questionType = question.questionType?.settings?.type;
          let processedResults = null;

          // Get the number of choices in the question scale
          const questionScale = question?.questionType?.settings?.choices?.length || 0;

          if (questionType === 'singleChoiceOrdinal') {
            const groupedAnswers = groupLikertAnswers(answers, questionScale);
            processedResults = {
              pros:
                groupedAnswers.presumedPros.length > 0
                  ? await processComments(
                      llmProvider,
                      LanguageConfigs.Finnish,
                      groupedAnswers.presumedPros,
                      question.text?.fi || 'Unknown Topic',
                      30,
                      CONDENSATION_TYPE.SUPPORTING
                    )
                  : [],
              cons:
                groupedAnswers.presumedCons.length > 0
                  ? await processComments(
                      llmProvider,
                      LanguageConfigs.Finnish,
                      groupedAnswers.presumedCons,
                      question.text?.fi || 'Unknown Topic',
                      30,
                      CONDENSATION_TYPE.OPPOSING
                    )
                  : []
            };
          } else if (questionType === 'Categorical') {
            const groupedAnswers = groupCategoricalAnswers(answers);
            processedResults = await Object.entries(groupedAnswers).reduce(async (acc, [category, comments]) => {
              if (comments.length > 0) {
                return {
                  ...(await acc),
                  [category]: await processComments(
                    llmProvider,
                    LanguageConfigs.Finnish,
                    comments,
                    `${question.text?.fi || 'Unknown Topic'} - ${category}`,
                    30,
                    CONDENSATION_TYPE.GENERAL
                  )
                };
              }
              return acc;
            }, Promise.resolve({}));
          } else {
            console.log(`Skipping question - unsupported type: ${questionType}`);
            continue;
          }

          // Update question with processed results
          try {
            console.log('Updating question with results...');
            await strapi.db.query('api::question.question').update({
              where: { id: question.id },
              data: {
                customData: {
                  ...(question.customData || {}),
                  argumentSummary: processedResults
                }
              }
            });
            console.log(`Updated question ${question.id} with the results`);
          } catch (updateError) {
            console.error('Error updating question:', updateError);
            console.error('Failed to update question ID:', question.id);
          }
        } catch (questionError) {
          console.error('Error processing question:', questionError);
          console.error('Problematic question:', JSON.stringify(question, null, 2));
        }
      }

      console.log('\n=== Process Complete ===');
      ctx.body = {
        data: {
          message: 'Successfully processed selected questions',
          processedQuestions: questionsToProcess.length,
          processedQuestionIds: questionsToProcess.map((q) => q.documentId)
        }
      };
    } catch (error) {
      console.error('\n=== Error in Argument Condensation ===');
      console.error('Error details:', error);
      ctx.throw(500, 'Failed to process and update arguments');
    }
  },

  /**
   * Lists questions available for condensation
   */
  async listQuestions(ctx) {
    try {
      const questions = await questionService.fetchProcessableQuestions();
      questionService.logQuestionDetails(questions);

      ctx.body = {
        data: questions.map((q) => ({
          id: q.id,
          documentId: q.documentId,
          text: q.text?.fi,
          type: q.questionType?.name
        }))
      };
    } catch (error) {
      console.error('\n=== Error listing questions ===');
      console.error('Detailed error:', error);
      ctx.throw(500, error.message || 'Failed to list questions');
    }
  },

  /**
   * Test endpoint to verify question retrieval
   */
  async test(ctx) {
    try {
      const questions = await questionService.testQuestionRetrieval();

      ctx.body = {
        success: true,
        message: 'Question retrieval test completed successfully',
        questionCount: questions.length,
        questions: questions.map((q) => ({
          id: q.id,
          documentId: q.documentId,
          type: q.questionType?.name,
          text: q.text
        }))
      };
    } catch (error) {
      ctx.throw(500, error.message || 'Failed to test question retrieval');
    }
  },

  /**
   * Test endpoint to verify answer retrieval functionality
   */
  async testAnswers(ctx) {
    try {
      console.log('\n=== Testing Answer Retrieval ===');
      const results = await questionService.testAnswerRetrieval();

      ctx.body = results;
    } catch (error) {
      console.error('Error in answer retrieval test endpoint:', error);
      ctx.throw(500, error.message || 'Failed to test answer retrieval');
    }
  }
};
