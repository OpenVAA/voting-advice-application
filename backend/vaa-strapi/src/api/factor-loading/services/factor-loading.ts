import { analyzeFactors, prepareDataForAnalysis, processAnalysisResults } from '@openvaa/factor-analysis';
import { factories } from '@strapi/strapi';
import type { CandidateData, Question } from '@openvaa/factor-analysis';

export default factories.createCoreService('api::factor-loading.factor-loading', ({ strapi }) => ({
  async fetchElectionData(electionId: string) {
    // Get election and validate
    const election = await strapi.documents('api::election.election').findOne({ documentId: electionId });
    if (!election) throw new Error('Election not found');

    // Fetch questions
    const questions = await strapi.documents('api::question.question').findMany({
      filters: { elections: { documentId: electionId } },
      populate: { questionType: { fields: ['settings'] } }
    });
    if (!questions?.length) throw new Error('Election has no questions');

    // Get candidates
    const candidates = await strapi.documents('api::candidate.candidate').findMany({
      filters: { nominations: { election: { id: electionId } } },
      populate: ['nominations'],
      sort: ['id:asc']
    });

    return { questions, candidates };
  },

  async computeAndStoreFactors(electionId: string) {
    try {
      // Fetch data
      const { questions, candidates } = await this.fetchElectionData(electionId);

      if (candidates.length === 0) {
        throw new Error('No candidates found for analysis');
      }

      // Here we've moved the transformAnswersForAnalysis logic to factor-analysis package
      // Now we just pass the raw questions and candidates
      const { responses, dimensions, uniqueQuestionIds } = prepareDataForAnalysis(
        questions as Array<Question>,
        candidates as unknown as Array<CandidateData>
      );

      if (responses.length === 0) {
        throw new Error('No answers found for analysis');
      }

      const minResponses = 3;
      if (responses[0].length < minResponses) {
        throw new Error(`Insufficient responses. Minimum ${minResponses} required.`);
      }

      // Run the factor analysis (using existing API)
      const result = analyzeFactors({ responses });

      // Process the results (moved to factor-analysis package)
      const analysisData = processAnalysisResults(result, dimensions, uniqueQuestionIds);

      // Store results - this part is still handled in backend
      const existingAnalyses = await strapi.documents('api::factor-loading.factor-loading').findMany({
        filters: { election: { documentId: electionId } }
      });

      const existingFactorLoading = existingAnalyses[0];

      let factorLoading;

      if (existingFactorLoading) {
        factorLoading = await strapi.documents('api::factor-loading.factor-loading').update({
          documentId: existingFactorLoading.documentId,
          election: electionId,
          ...analysisData
        });
      } else {
        factorLoading = await strapi.documents('api::factor-loading.factor-loading').create({
          data: {
            election: electionId,
            ...analysisData
          }
        });
      }

      return factorLoading;
    } catch (error) {
      console.error('Error in computeAndStoreFactors:', error);
      throw error;
    }
  }
}));
