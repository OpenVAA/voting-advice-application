import type {DataObjectData, Id} from './internal';

export interface NominationData extends DataObjectData {
  electionSymbol?: string;
  candidateId?: Id | null;
  partyId?: Id | null;
}
