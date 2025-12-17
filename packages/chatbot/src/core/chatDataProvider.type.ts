import type { AnyQuestionVariantData } from '@openvaa/data';

// TODO: IMPLEMENT AND USE. CURRENTLY A STUB TO SHOW THE PATTERN.
// Currently tools are defined in tools/tools.ts. They are defined independently of the data provider. 
// What we want is for the data provider to be the source of truth for the chatbot's knowledge.

export interface ChatDataProvider {
  /**
   * Find questions by query.
   * @param query - The query to find questions by.
   * @param opts - The options for finding questions.
   * @returns A `Promise` resolving to the questions.
   */
  findQuestions: (query: string, opts?: { electionId?: string }) => Promise<Array<AnyQuestionVariantData>>;
}
