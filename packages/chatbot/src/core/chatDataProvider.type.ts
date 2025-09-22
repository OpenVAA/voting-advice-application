import type {
  AnyQuestionVariantData,
} from '@openvaa/data';

export type CandidateInfo = {
  name: string;
  party: string;
};

export interface ChatDataProvider {
  // ---
  // (1) Candidate-related methods 
  // ---
  /**
   * Get information about a candidate.
   * @param id - The ID of the candidate.
   * @returns A `Promise` resolving to the candidate information.
   */
  getCandidateInfo: (id: string) => Promise<CandidateInfo>;

  /**
   * Find candidates by name.
   * @param name - The name of the candidate.
   * @returns A `Promise` resolving to the candidate information.
   */
  findCandidates: (name: string) => Promise<Array<CandidateInfo>>;

  /**
   * List candidates for an election and constituency.
   * @param opts - The options for listing the candidates.
   * @returns A `Promise` resolving to the candidate information.
   */
  listCandidatesFor: (opts: { electionId: string; constituencyId?: string }) => Promise<Array<CandidateInfo>>;


  /**
   * Get the answer to a question for a candidate.
   * @param candidateId - The ID of the candidate.
   * @param questionId - The ID of the question.
   * @returns A `Promise` resolving to the answer to the question.
   */
  getCandidateAnswer: (candidateId: string, questionId: string) =>
    Promise<{ questionId: string; answer?: { value: unknown; info?: string | null } }>;

  /**
   * Get the answers to all questions for a candidate.
   * @param candidateId - The ID of the candidate.
   * @returns A `Promise` resolving to the answers to all questions for the candidate.
   */
  getCandidateAnswers: (candidateId: string) => Promise<Array<{ questionId: string; answer?: { value: unknown; info?: string | null } }>>;


  // ---
  // (2) Question-related methods 
  // ---

  /**
   * Find questions by query.
   * @param query - The query to find questions by.
   * @param opts - The options for finding questions.
   * @returns A `Promise` resolving to the questions.
   */
  findQuestions: (query: string, opts?: { electionId?: string }) => Promise<Array<AnyQuestionVariantData>>;

  
}
