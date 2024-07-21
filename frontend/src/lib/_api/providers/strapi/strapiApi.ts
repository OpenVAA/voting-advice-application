export const STRAPI_API = {
  candidates: 'api/nominations',
  constituencies: 'api/constituencies',
  elections: 'api/elections',
  nominations: 'api/nominations'
} as const;

export type StrapiApi = (typeof STRAPI_API)[keyof typeof STRAPI_API];
