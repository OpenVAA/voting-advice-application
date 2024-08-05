import type {EntityData} from './internal';

export interface PartyData extends EntityData {
  // From EntityData
  // - order?: number;
  // - id: Id;
  // - name?: string;
  // - answers?: Answers;
  // - photo?: ImageProps | null;
  name: string;
}
