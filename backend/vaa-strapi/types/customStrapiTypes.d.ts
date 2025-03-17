/**
 * A non-exhaustive type for parts of the context we're interested in.
 */
export type StrapiContext = RequestContext & {
  request: {
    body?: {
      data: Record<string, unknown>;
    };
    query: StrapiQuery | Record<string, Array<string>>;
    url: string;
  };
  state?: { user: { id: number; role: string } };
};

/**
 * A non-exhaustive type for a Strapi Query.
 * See: https://docs.strapi.io/dev-docs/backend-customization/requests-responses#ctxrequestquery
 */
export type StrapiQuery = {
  sort: string | Array<string>;
  filters: object;
  populate: string | object;
  fields: Array<string>;
  pagination: object;
  status: 'draft' | 'published';
  locale: string | Array<string>;
};

type RequestContext = ReturnType<typeof strapi.requestContext.get>;
