import {
  analyzeFactors,
  prepareDataForAnalysis,
  processAnalysisResults
} from '@openvaa/factor-analysis';
import { factories } from '@strapi/strapi';

interface StrapiService {
  strapi: {
    entityService: {
      findMany: (uid: string, params: any) => Promise<any>;
      findOne: (uid: string, id: number | string, params?: any) => Promise<any>;
      create: (uid: string, params: any) => Promise<any>;
      update: (uid: string, id: number | string, params: any) => Promise<any>;
    };
  };
}

export default factories.createCoreService(
  'api::factor-loading.factor-loading',
  ({ strapi }: StrapiService) => ({
    async fetchElectionData(electionId: number) {
      // Get election and validate
      const election = await strapi.entityService.findOne(
        'api::election.election',
        electionId
      );
      if (!election) throw new Error('Election not found');

      // Fetch questions
      const questions = await strapi.entityService.findMany(
        'api::question.question',
        {
          filters: { elections: { id: electionId } },
          fields: ['id', 'documentId'],
          populate: { questionType: { fields: ['settings'] } }
        }
      );
      if (!questions?.length) throw new Error('Election has no questions');

      // Get candidates
      const candidates = await strapi.entityService.findMany(
        'api::candidate.candidate',
        {
          filters: { nominations: { election: { id: electionId } } },
          populate: ['nominations'],
          sort: ['id:asc']
        }
      );

      return { election, questions, candidates };
    },

    async computeAndStoreFactors(electionId: number) {
      try {
        // Fetch election data
        const { election, questions, candidates } =
          await this.fetchElectionData(electionId);

        if (candidates.length === 0) {
          throw new Error('No candidates found for analysis');
        }

        // Here we've moved the transformAnswersForAnalysis logic to factor-analysis package
        // Now we just pass the raw questions and candidates
        const { responses, dimensions, uniqueQuestionIds } =
          prepareDataForAnalysis(questions, candidates);

        if (responses.length === 0) {
          throw new Error('No answers found for analysis');
        }

        const minResponses = 3;
        if (responses[0].length < minResponses) {
          throw new Error(
            `Insufficient responses. Minimum ${minResponses} required.`
          );
        }

        // Run the factor analysis (using existing API)
        const result = analyzeFactors({ responses });

        // Process the results (moved to factor-analysis package)
        const analysisData = processAnalysisResults(
          result,
          dimensions,
          uniqueQuestionIds,
          election.id
        );

        // Store results - this part is still handled in backend
        const existingAnalyses = await strapi.entityService.findMany(
          'api::factor-loading.factor-loading',
          { filters: { election: election.id } }
        );

        const existingFactorLoading = existingAnalyses[0];

        let factorLoading;
        if (existingFactorLoading) {
          factorLoading = await strapi.entityService.update(
            'api::factor-loading.factor-loading',
            existingFactorLoading.id,
            { data: analysisData }
          );
        } else {
          factorLoading = await strapi.entityService.create(
            'api::factor-loading.factor-loading',
            { data: analysisData }
          );
        }

        return factorLoading;
      } catch (error) {
        console.error('Error in computeAndStoreFactors:', error);
        throw error;
      }
    }
  })
);
