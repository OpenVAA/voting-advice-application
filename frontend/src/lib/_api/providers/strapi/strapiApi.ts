export const STRAPI_API = {
  candidates: 'api/nominations'
} as const;

export type StrapiApi = (typeof STRAPI_API)[keyof typeof STRAPI_API];
