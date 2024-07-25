import type {CandidateData, ConstituencyData, ElectionData, NominationData} from '$lib/_vaa-data';
import type {GetDataMethod} from './dataProvider.type';

export const DATA_COLLECTIONS: Record<keyof DataCollectionTypes, GetDataMethod> = {
  candidates: 'getCandidatesData',
  constituencies: 'getConstituenciesData',
  elections: 'getElectionsData',
  nominations: 'getNominationsData'
  // parties: 'getPartiesData',
} as const;

export type DataCollectionTypes = {
  candidates: CandidateData;
  constituencies: ConstituencyData;
  elections: ElectionData;
  nominations: NominationData;
  // parties: PartyData;
};

export function isDataCollection(collection?: string): collection is keyof DataCollectionTypes {
  return collection != null && collection in DATA_COLLECTIONS;
}
