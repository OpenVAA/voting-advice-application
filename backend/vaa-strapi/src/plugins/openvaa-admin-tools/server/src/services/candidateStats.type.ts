import type { ActionResult } from './actionResult.type';

export interface CandidateStatRow {
  email: string;
  firstName: string;
  lastName: string;
  registrationKey: string;
  partyExternalId: string;
  constituencyExternalId: string;
}

export interface CandidateStatsResult extends ActionResult {
  totalCount?: number;
  notRegistered?: {
    count: number;
    rows: Array<CandidateStatRow>;
  };
  registeredNotAnswered?: {
    count: number;
    rows: Array<CandidateStatRow>;
  };
  answeredAll?: {
    count: number;
    rows: Array<CandidateStatRow>;
  };
}
