import type {GetDataMethod} from './dataProvider.type';

export const DATA_COLLECTIONS: Record<string, GetDataMethod> = {
  candidates: 'getCandidatesData'
} as const;
