import type {NamedObjectData} from './internal';

export interface ConstituencyData extends NamedObjectData {
  // From NamedObjectData
  // - order?: number;
  // - id: Id;
  // - name?: string;
  name: string;
}
