import { analyzeFactors } from '@openvaa/factor-analysis';
import { factories } from '@strapi/strapi';

// Define supported question types and their validation rules
interface QuestionValidation {
  validate: (answer: unknown) => number | null;
  range?: { min: number; max: number };
}

const SUPPORTED_QUESTION_TYPES: Record<string, QuestionValidation> = {
  'Likert-4': {
    validate: (answer: unknown) => {
      const value = Number(answer);
      return Number.isInteger(value) && value >= 1 && value <= 4 ? value : null;
    },
    range: { min: 1, max: 4 }
  },
  'Likert-5': {
    validate: (answer: unknown) => {
      const value = Number(answer);
      return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
    },
    range: { min: 1, max: 5 }
  }
};

const MIN_VALID_RESPONSES = 30;

export default factories.createCoreService(
  'api::factor-loading.factor-loading',
  ({ strapi }) => ({
    async transformAnswersForAnalysis(electionId: number) {
      const candidates = await strapi.entityService.findMany(
        'api::candidate.candidate',
        {
          filters: {
            nomination: {
              election: electionId
            }
          },
          sort: ['id:asc']
        }
      );

      const questions = await strapi.entityService.findMany(
        'api::question.question',
        {
          filters: {
            category: {
              election: electionId
            }
          },
          sort: ['order:asc', 'id:asc'],
          populate: ['questionType']
        }
      );

      const answers = await strapi.entityService.findMany(
        'api::answer.answer',
        {
          filters: {
            candidate: {
              nomination: {
                election: electionId
              }
            }
          },
          populate: ['candidate', 'question']
        }
      );

      // Create a map for quick answer lookup
      const answerMap = new Map();
      answers.forEach((answer: any) => {
        const key = `${answer.candidate.id}-${answer.question.id}`;
        answerMap.set(key, answer.value);
      });

      // Process answers based on question type
      const responses = questions.map((question: any) =>
        candidates.map((candidate: any) => {
          const key = `${candidate.id}-${question.id}`;
          const answer = answerMap.get(key);
          const questionType = question.questionType?.name;

          if (answer === undefined || answer === null) {
            console.warn(
              `Missing answer for candidate ${candidate.id} question ${question.id}`
            );
            return NaN;
          }

          try {
            const validator = SUPPORTED_QUESTION_TYPES[questionType];

            if (validator) {
              const validValue = validator.validate(answer);
              if (validValue === null) {
                console.warn(
                  `Invalid answer ${answer} for ${questionType} question ${question.id} (candidate ${candidate.id}). ` +
                    `Expected range: ${validator.range?.min}-${validator.range?.max}`
                );
                return NaN;
              }
              // Ensure the value is an integer
              return Math.round(validValue); // This ensures we always return integers
            }

            // Skip non-supported question types
            console.warn(
              `Skipping unsupported question type ${questionType} for question ${question.id}`
            );
            return NaN;
          } catch (error) {
            console.error(
              `Error processing answer for candidate ${candidate.id} question ${question.id}:`,
              error,
              'Answer value:',
              answer
            );
            return NaN;
          }
        })
      );

      // Process and filter questions with sufficient valid responses
      const validQuestions = questions
        .map((q, idx) => ({
          question: q,
          responses: responses[idx],
          validCount: responses[idx].filter((v) => !isNaN(v)).length
        }))
        .filter(({ validCount }) => validCount >= MIN_VALID_RESPONSES);

      if (validQuestions.length === 0) {
        throw new Error(
          `No questions had sufficient valid responses (minimum ${MIN_VALID_RESPONSES} required)`
        );
      }

      // Log what's being included in analysis
      console.log(
        'Question statistics:',
        validQuestions.map(
          ({ question, responses: qResponses, validCount }) => ({
            id: question.id,
            type: question.questionType?.name,
            totalResponses: qResponses.length,
            validResponses: validCount,
            validValues: qResponses.filter((v) => !isNaN(v)),
            range: SUPPORTED_QUESTION_TYPES[question.questionType?.name]?.range,
            included: true
          })
        )
      );

      // Extract filtered data
      const filteredResponses = validQuestions.map(
        ({ responses: qResponses }) => qResponses
      );
      const filteredQuestionIds = validQuestions.map(
        ({ question }) => question.id
      );

      return {
        responses: filteredResponses,
        questionIds: filteredQuestionIds,
        candidateIds: candidates.map((c: any) => c.id)
      };
    },

    async computeAndStoreFactors(electionId: number) {
      try {
        const election = await strapi.entityService.findOne(
          'api::election.election',
          electionId
        );

        if (!election) {
          throw new Error('Election not found');
        }

        const { responses, questionIds, candidateIds } =
          await this.transformAnswersForAnalysis(electionId);

        if (responses.length === 0) {
          throw new Error('No answers found for analysis');
        }

        const minResponses = 3;
        if (responses[0].length < minResponses) {
          throw new Error(
            `Insufficient responses. Minimum ${minResponses} required.`
          );
        }

        const result = analyzeFactors({ responses });

        const analysisData = {
          data: {
            election: electionId,
            results: {
              questionFactorLoadings: result.questionFactorLoadings.map(
                (loadings: Array<number>, index: number) => ({
                  questionId: questionIds[index],
                  factors: loadings
                })
              ),
              explainedVariancePerFactor: result.explainedVariancePerFactor,
              totalExplainedVariance: result.totalExplainedVariance,
              candidateOrder: candidateIds
            },
            metadata: {
              timestamp: new Date().toISOString(),
              numberOfQuestions: questionIds.length,
              numberOfResponses: responses[0]?.length || 0,
              converged: result.converged
            }
          }
        };

        const existingAnalysis = await strapi.entityService.findMany(
          'api::factor-loading.factor-loading',
          {
            filters: { election: electionId }
          }
        );

        const factorLoading =
          existingAnalysis?.length > 0
            ? await strapi.entityService.update(
                'api::factor-loading.factor-loading',
                existingAnalysis[0].id,
                analysisData as any
              )
            : await strapi.entityService.create(
                'api::factor-loading.factor-loading',
                analysisData as any
              );

        return factorLoading;
      } catch (error) {
        console.error('Error in computeAndStoreFactors:', error);
        throw error;
      }
    }
  })
);
