import type {EntityData} from './internal';

export interface CandidateData extends EntityData {
  // From EntityData
  // - order?: number;
  // - id: Id;
  // - name?: string;
  // - answers?: Answers;
  // - photo?: ImageProps | null;
  firstName: string;
  lastName: string;
}
