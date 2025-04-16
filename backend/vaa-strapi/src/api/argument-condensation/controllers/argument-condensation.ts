import { CONDENSATION_TYPE, getLanguageConfig, processComments } from '@openvaa/argument-condensation';
import { OpenAIProvider } from '@openvaa/llm';
import { OPENAI_API_KEY } from '../../../constants';
import questionService from '../services/question-service';
import { CandidateAnswer } from '../services/question-service';

/**
 * Options for controller methods
 */
interface ControllerOptions {
  /**
   * The locale code to use for text content
   * @default "fi"
   */
  locale?: string;
}

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

function groupLikertAnswers(
  answers: Array<CandidateAnswer>,
  questionScale: number,
  localeCode: string = 'fi',
  higherIsPros: boolean = true
): LikertGroups {
  const isEven = questionScale % 2 === 0;
  const groups: LikertGroups = {
    presumedPros: [],
    presumedCons: []
  };

  answers.forEach((answer) => {
    if (!answer.openAnswer?.[localeCode] || (typeof answer.value !== 'string' && typeof answer.value !== 'number')) {
      return;
    }

    const value = parseInt(answer.value.toString());

    if (isEven) {
      // For 4-point scale: split at the middle
      const isHigherValue = value > questionScale / 2;

      // Determine which group to add to based on higherIsPros parameter
      if (higherIsPros ? isHigherValue : !isHigherValue) {
        groups.presumedPros.push(answer.openAnswer[localeCode]);
      } else {
        groups.presumedCons.push(answer.openAnswer[localeCode]);
      }
    } else {
      const middleValue = Math.ceil(questionScale / 2);
      const isHigherValue = value > middleValue;
      const isLowerValue = value < middleValue;

      // Middle value is still ignored
      if (isHigherValue) {
        higherIsPros
          ? groups.presumedPros.push(answer.openAnswer[localeCode])
          : groups.presumedCons.push(answer.openAnswer[localeCode]);
      } else if (isLowerValue) {
        higherIsPros
          ? groups.presumedCons.push(answer.openAnswer[localeCode])
          : groups.presumedPros.push(answer.openAnswer[localeCode]);
      }
      // Middle value is ignored
    }
  });

  return groups;
}

// Note: NOT IN USE, as our test data does not yet contain categorical answers
function groupCategoricalAnswers(answers: Array<CandidateAnswer>, localeCode: string = 'fi'): CategoryGroups {
  const groups: CategoryGroups = {};

  return groups;
}

function getQuestionText(question, localeCode): string {
  // Try direct property access first
  if (localeCode == 'fi' && question.text && question.text.fi) {
    return question.text.fi;
  }
  if (localeCode == 'en' && question.text && question.text.en) {
    return question.text.en;
  }

  // Default fallback
  return 'No question text available';
}

export default {
  /**
   * Condenses arguments for specified questions
   */
  async condense(ctx, options: ControllerOptions = {}) {
    try {
      console.info('\n=== Starting Argument Condensation ===');

      // Extract locale from options or use default
      const localeCode = options.locale || 'fi';

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
      console.info('Successfully fetched answers map');

      const languageConfig = getLanguageConfig(localeCode);

      // Process each question based on its type
      for (const question of questionsToProcess) {
        console.info('\n=== Processing Question ===');
        console.info('Question ID:', question.id);
        console.info('Document ID:', question.documentId);
        console.info('Type:', question.questionType?.settings?.type || 'Unknown type');
        console.info('Name:', question.questionType?.name || 'Unknown name');

        try {
          // Get answers for this specific question using documentId
          const answers = answersMap[question.documentId] || [];
          console.info(`Found ${answers.length} answers for this question`);

          if (answers.length === 0) {
            console.info('Skipping question - no answers found');
            continue;
          }

          const questionType = question.questionType?.settings?.type as string | undefined;
          let processedResults = null;

          if (questionType === 'singleChoiceOrdinal') {
            // Get the number of choices in the question scale
            const questionScale = question?.questionType?.settings?.choices?.length || 0;

            if (questionScale < 2) {
              console.info('Question has less than 2 choices, skipping');
              continue;
            }
            const groupedAnswers = groupLikertAnswers(answers, questionScale, localeCode);

            processedResults = {
              pros:
                groupedAnswers.presumedPros.length > 0
                  ? await processComments({
                      llmProvider,
                      languageConfig: languageConfig,
                      comments: groupedAnswers.presumedPros,
                      topic: getQuestionText(question, localeCode),
                      batchSize: 30,
                      condensationType: CONDENSATION_TYPE.SUPPORTING
                    })
                  : [],
              cons:
                groupedAnswers.presumedCons.length > 0
                  ? await processComments({
                      llmProvider,
                      languageConfig: languageConfig,
                      comments: groupedAnswers.presumedCons,
                      topic: getQuestionText(question, localeCode),
                      batchSize: 30,
                      condensationType: CONDENSATION_TYPE.OPPOSING
                    })
                  : []
            };
          } else if (questionType === 'singleChoiceCategorical') {
            const groupedAnswers = groupCategoricalAnswers(answers, localeCode);
            processedResults = {};

            for (const [category, comments] of Object.entries(groupedAnswers)) {
              if (!comments?.length) {
                continue;
              }

              processedResults[category] = await processComments({
                llmProvider,
                languageConfig: languageConfig,
                comments,
                topic: getQuestionText(question, localeCode),
                batchSize: 30,
                condensationType: CONDENSATION_TYPE.GENERAL
              });
            }
          } else {
            console.info(`Skipping question - unsupported type: ${questionType}`);
            continue;
          }

          // Update question with processed results
          try {
            console.info('Updating question with results...');

            // First, get the current customData from the database
            const currentQuestion = await strapi.documents('api::question.question').findOne({
              documentId: question.documentId,
              fields: ['customData']
            });

            const baseCustomData =
              typeof currentQuestion.customData === 'object' &&
              currentQuestion.customData !== null &&
              !Array.isArray(currentQuestion.customData)
                ? currentQuestion.customData
                : {};

            // Then update with the merged data
            await strapi.documents('api::question.question').update({
              documentId: question.documentId,
              data: {
                customData: {
                  ...baseCustomData,
                  argumentSummary: processedResults
                }
              }
            });
            console.info(`Updated question ${question.id} with the results`);
          } catch (updateError) {
            console.error('Error updating question:', updateError);
            console.error('Failed to update question ID:', question.id);
          }
        } catch (questionError) {
          console.error('Error processing question:', questionError);
          console.error('Problematic question:', JSON.stringify(question, null, 2));
        }
      }

      console.info('\n=== Process Complete ===');
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
  async listQuestions(ctx, options: ControllerOptions = {}) {
    try {
      // Extract locale from options or use default
      const localeCode = options.locale || 'fi';

      const questions = await questionService.fetchProcessableQuestions();
      questionService.logQuestionDetails(questions);

      ctx.body = {
        data: questions.map((q) => ({
          id: q.id,
          documentId: q.documentId,
          text: q.text?.[localeCode],
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
   * Test endpoint to verify answer retrieval functionality
   */
  async testAnswers(ctx) {
    try {
      console.info('\n=== Testing Answer Retrieval ===');
      const results = await questionService.testAnswerRetrieval();

      ctx.body = results;
    } catch (error) {
      console.error('Error in answer retrieval test endpoint:', error);
      ctx.throw(500, error.message || 'Failed to test answer retrieval');
    }
  }
};
