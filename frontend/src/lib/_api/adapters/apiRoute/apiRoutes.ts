import {DATA_COLLECTIONS} from '../../dataCollections';

const API_ROOT = '/api/data';

export const API_ROUTES = Object.fromEntries(
  Object.keys(DATA_COLLECTIONS).map((collection) => [collection, `${API_ROOT}/${collection}`])
) as Record<keyof typeof DATA_COLLECTIONS, string>;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];
