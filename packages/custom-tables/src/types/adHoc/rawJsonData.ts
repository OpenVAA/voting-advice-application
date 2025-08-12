/**
 * Raw JSON data types for parsing candidate data from the production JSON file
 */

/**
 * Raw candidate data as it appears in the JSON file
 */
export interface RawCandidateData {
  id: number;
  documentId: string;
  email: string;
  registrationKey: string | null;
  identifier: string;
  firstName: string;
  lastName: string;
  answers: Record<string, RawAnswer>;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string | null;
}

/**
 * Raw answer data as it appears in the JSON file
 */
export interface RawAnswer {
  value?: RawAnswerValue;
  info?: Record<string, string> | null;
}

/**
 * The possible value types for raw answers
 */
export type RawAnswerValue = string | number | boolean | Array<string> | Record<string, string> | null;

/**
 * Array of raw candidate data from the JSON file
 */
export type RawCandidatesData = Array<RawCandidateData>;

/**
 * Simple question data structure for creating mock questions
 */
export interface SimpleQuestionData {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'singleChoiceOrdinal' | 'singleChoiceCategorical' | 'multipleChoiceCategorical';
  categoryId: string;
  categoryName: string;
  categoryInfo?: string;
  ordinalChoices?: Array<{
    id: string;
    label: string;
    normalizableValue: number;
  }>;
  categoricalChoices?: Array<{
    id: string;
    label: string;
  }>;
}

/**
 * Simple entity data structure for creating mock entities
 */
export interface SimpleEntityData {
  id: string;
  name: string;
  type: 'candidate';
  answers: Record<
    string,
    {
      value: string | number | boolean | Array<string> | null;
      info?: string;
    }
  >;
}
