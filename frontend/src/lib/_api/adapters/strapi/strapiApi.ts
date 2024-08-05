import type {StrapiCollectionTypes} from './strapiData.type';

export const STRAPI_API: Record<keyof StrapiCollectionTypes, string> = {
  candidates: 'api/candidates',
  constituencies: 'api/constituencies',
  elections: 'api/elections',
  nominations: 'api/nominations'
} as const;

export type StrapiApi = (typeof STRAPI_API)[keyof typeof STRAPI_API];
