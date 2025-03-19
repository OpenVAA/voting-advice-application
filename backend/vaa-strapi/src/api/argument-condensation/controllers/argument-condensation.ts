import { processComments, finnishConfig, CondensationType } from '@openvaa/argument-condensation';
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

function groupLikertAnswers(answers: any[], likertType: string): LikertGroups {
  // Extract the scale size from likert type (e.g., "Likert-5" -> 5)
  const likertScale = parseInt(likertType.split('-')[1]);
  const midpoint = (likertScale + 1) / 2;

  // Initialize groups
  const groups: LikertGroups = {
    presumedPros: [],
    presumedCons: []
  };

  answers.forEach((answer) => {
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

function validateEnvironment() {
  const requiredVars = ['OPENAI_API_KEY'];
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!llmProvider) {
    throw new Error('LLM Provider initialization failed');
  }
}

export default {
  /**
   * Lists questions available for condensation
   */
  async list(ctx) {
    try {
      console.log('\n=== Listing Questions for Argument Condensation ===');
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
   * Condenses arguments for specified questions
   */
  async condense(ctx) {
    try {
      console.log('\n=== Starting Argument Condensation ===');

      // Validate environment first
      validateEnvironment();

      try {
        // Get all processable questions first
        console.log('Fetching all eligible questions...');
        const allEligibleQuestions = await questionService.fetchProcessableQuestions();
        console.log(`Fetched ${allEligibleQuestions.length} eligible questions`);

        if (allEligibleQuestions.length === 0) {
          return ctx.badRequest('No eligible questions (Likert-5) found in the system');
        }

        // Get question document IDs from request body (optional)
        const { questionDocumentIds } = ctx.request.body || {};
        console.log('Request body:', ctx.request.body);
        console.log('Extracted question document IDs:', questionDocumentIds);

        let questionsToProcess = allEligibleQuestions;

        // If specific question IDs were provided, filter to just those questions
        if (questionDocumentIds && Array.isArray(questionDocumentIds) && questionDocumentIds.length > 0) {
          console.log(
            `Filtering to ${questionDocumentIds.length} specified questions: ${questionDocumentIds.join(', ')}`
          );
          questionsToProcess = allEligibleQuestions.filter((q) => questionDocumentIds.includes(q.documentId));

          if (questionsToProcess.length === 0) {
            return ctx.badRequest('None of the provided question document IDs match eligible questions');
          }

          console.log(`Found ${questionsToProcess.length} matching questions to process`);
        } else {
          console.log(
            `No specific questions requested. Processing all ${allEligibleQuestions.length} eligible questions`
          );
        }

        // Get documentIds for fetching answers
        console.log('Preparing to fetch answers...');
        const documentIdsToProcess = questionsToProcess.map((q) => q.documentId);
        console.log('Document IDs to process:', documentIdsToProcess);

        try {
          const answersMap = await questionService.fetchAnswersForQuestions(documentIdsToProcess);
          console.log('Successfully fetched answers map');

          // Process each question based on its type
          for (const questionToProcess of questionsToProcess) {
            console.log('\n=== Processing Question ===');
            console.log('Question ID:', questionToProcess.id);
            console.log('Document ID:', questionToProcess.documentId);
            console.log(
              'Text:',
              questionToProcess.text ? JSON.stringify(questionToProcess.text).substring(0, 100) : 'No text'
            );
            console.log('Type:', questionToProcess.questionType?.name || 'Unknown type');

            try {
              // Get answers for this specific question using documentId
              const answers = answersMap[questionToProcess.documentId] || [];
              console.log(`Found ${answers.length} answers for this question`);

              if (answers.length === 0) {
                console.log('Skipping question - no answers found');
                continue;
              }

              const questionType = questionToProcess.questionType?.name;
              let processedResults = null; // Results for the question

              // If LIKERT
              if (questionType?.startsWith('Likert-')) {
                try {
                  // Handle Likert questions
                  const groupedAnswers = groupLikertAnswers(answers, questionType);

                  console.log(`Found ${groupedAnswers.presumedPros.length} presumed pros`);
                  console.log(`Found ${groupedAnswers.presumedCons.length} presumed cons`);

                  const results = {
                    pros: [],
                    cons: []
                  };

                  // Process pro comments if any exist
                  if (groupedAnswers.presumedPros.length > 0) {
                    console.log('Processing pro comments...');
                    results.pros = await processComments(
                      llmProvider,
                      finnishConfig,
                      groupedAnswers.presumedPros,
                      questionToProcess.text?.fi || 'Unknown Topic',
                      30,
                      CondensationType.SUPPORTING
                    );
                    console.log(`Generated ${results.pros.length} pro arguments`);
                  }

                  // Process con comments if any exist
                  if (groupedAnswers.presumedCons.length > 0) {
                    console.log('Processing con comments...');
                    results.cons = await processComments(
                      llmProvider,
                      finnishConfig,
                      groupedAnswers.presumedCons,
                      questionToProcess.text?.fi || 'Unknown Topic',
                      30,
                      CondensationType.OPPOSING
                    );
                    console.log(`Generated ${results.cons.length} con arguments`);
                  }

                  processedResults = results;
                } catch (likertError) {
                  console.error('Error processing Likert question:', likertError);
                  continue; // Skip this question on error
                }
              } else if (questionType === 'Categorical') {
                try {
                  // Handle categorical questions
                  const groupedAnswers = groupCategoricalAnswers(answers);
                  console.log('Categories found:', Object.keys(groupedAnswers));

                  const results = {};

                  for (const [category, comments] of Object.entries(groupedAnswers)) {
                    if (comments.length > 0) {
                      console.log(`Processing category "${category}" with ${comments.length} comments...`);
                      results[category] = await processComments(
                        llmProvider,
                        finnishConfig,
                        comments,
                        `${questionToProcess.text?.fi || 'Unknown Topic'} - ${category}`,
                        30,
                        CondensationType.GENERAL
                      );
                      console.log(`Generated ${results[category].length} arguments for category ${category}`);
                    }
                  }

                  processedResults = results;
                } catch (categoricalError) {
                  console.error('Error processing Categorical question:', categoricalError);
                  continue; // Skip this question on error
                }
              } else {
                console.log(`Skipping question - unsupported type: ${questionType}`);
                continue;
              }

              // Update question with processed results
              try {
                console.log('Updating question with results...');
                await strapi.db.query('api::question.question').update({
                  where: { id: questionToProcess.id },
                  data: {
                    customData: {
                      ...(questionToProcess.customData || {}),
                      argumentSummary: processedResults
                    }
                  }
                });
                console.log(`Updated question ${questionToProcess.id} with the results`);
              } catch (updateError) {
                console.error('Error updating question:', updateError);
                console.error('Failed to update question ID:', questionToProcess.id);
              }
            } catch (questionError) {
              console.error('Error processing question:', questionError);
              console.error('Problematic question:', JSON.stringify(questionToProcess, null, 2));
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
        } catch (answersError) {
          console.error('Error fetching answers:', answersError);
          throw answersError;
        }
      } catch (eligibleQuestionsError) {
        console.error('Error getting eligible questions:', eligibleQuestionsError);
        throw eligibleQuestionsError;
      }
    } catch (error) {
      console.error('\n=== Error in Argument Condensation ===');
      console.error('Error details:', error);
      ctx.throw(500, 'Failed to process and update arguments');
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
