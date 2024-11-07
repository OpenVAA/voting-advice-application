import type { factories } from '@strapi/strapi';
import type { Strapi } from '@strapi/types';

/**
 * Any of the following ACL implementations. The type is a detailed restricted version of Strapi's own PolicyImplementation type.
 */
export type ACLImplementation = (
  ctx: StrapiContext,
  config: unknown,
  { strapi }: { strapi: Strapi }
) => Promise<boolean>;

/**
 * A non-exhaustive type for parts of the context we're interested in.
 */
export type StrapiContext = {
  params?: { id: number };
  request: {
    body?: {
      data: Record<string, unknown>;
    };
    query: StrapiQuery | Record<string, Array<string>>;
  };
  state?: { user: { id: number } };
};

/**
 * Proper type for a Strapi Query. Source: https://docs.strapi.io/dev-docs/backend-customization/requests-responses#ctxrequestquery
 */
export type StrapiQuery = {
  sort: string | Array<string>;
  filters: object;
  populate: string | object;
  fields: Array<string>;
  pagination: object;
  publicationState: string;
  locale: string | Array<string>;
};

/**
 * This unseemly workaround is needed to bypass Strapi’s buggy typing for `PolicyImplementation`. When passing `ACLImplementation` objects, we need to use `as unknown as Generic` for the config.
 * See also https://github.com/strapi/strapi/issues/18526
 */
export type Generic = Parameters<typeof factories.createCoreRouter>[1]['config'];
