import type { ActionResult } from './actionResult.type';

export interface CandidateSearchResult {
  documentId: string;
  firstName: string;
  lastName: string;
  email: string;
  isRegistered: boolean;
}

export interface CandidateInfo {
  documentId: string;
  firstName: string;
  lastName: string;
  email: string;
  isRegistered: boolean;
  /** Only present if the candidate is not yet registered */
  registrationKey?: string;
  /** Only present if the candidate is not yet registered */
  registrationUrl?: string;
  /** Only present if the candidate is registered */
  userId?: number;
}

export interface CandidateAuthActionResult extends ActionResult {
  /** Included in forgot-password response so admin can copy it */
  resetUrl?: string;
  /** Included in generate-password response */
  password?: string;
  /** Included in get-info response */
  candidate?: CandidateInfo;
  /** Included in search response */
  candidates?: Array<CandidateSearchResult>;
}
