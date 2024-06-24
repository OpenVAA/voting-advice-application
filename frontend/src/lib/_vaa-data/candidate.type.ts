import type {SerializableValue} from './data.type';
import type {DataObjectData} from './dataObject.type';

export interface CandidateData extends DataObjectData {
  answers: _AnswerDict;
  electionRound?: number;
  electionSymbol?: string;
  firstName: string;
  lastName: string;
  photo?: ImageProps | null;
}

export type _AnswerDict = Record<string, SerializableValue>;
