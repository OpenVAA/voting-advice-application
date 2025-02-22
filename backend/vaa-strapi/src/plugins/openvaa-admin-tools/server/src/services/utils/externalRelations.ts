import type { UID } from '@strapi/strapi';
import type { ExternalRelation, ExternalRelationConfig, ImportDatum } from '../data.type';

/**
 * Convert any `ExternalRelation`s in `datum` to actual Strapi document IDs.
 * @param config - A mapping of relation property names and their corresponding Strapi content types.
 * @param datum - The data to parse.
 * @param strapi - The Strapi client instance.
 * @returns The datum with parsed external relations.
 * @throws Error relations or not found or they match multiple Strapi documents.
 */
export async function parseExternalRelations<TData extends ImportDatum>({
  config,
  datum,
  strapi,
}: {
  config: ExternalRelationConfig<TData>;
  datum: TData;
  strapi;
}): Promise<ImportDatum> {
  if (Object.keys(config).length === 0) return datum;
  const parsed = { ...datum } as ImportDatum;
  for (const [key, api] of Object.entries(config)) {
    const value = parsed[key];
    if (!isExternalRelation(value)) continue;
    let ids = [value.externalId].flat();
    ids = await Promise.all(
      ids.map(async (externalId) => {
        const doc = await findOneByExternalId({ api, externalId, strapi });
        if (!doc) throw new Error(`No ${api} found for externalId ${externalId}`);
        return doc.documentId;
      })
    );
    parsed[key] = ids;
  }
  return parsed;
}

/**
 * Find a single document by `externalId`. Returns the document or `undefined` if not found.
 * @param api - The Strapi content type.
 * @param externalId - The `externalId` to find.
 * @param strapi - The Strapi client instance.
 * @returns The document or `undefined` if not found.
 * @thwrows Error if multiple documents are found.
 */
export async function findOneByExternalId({
  api,
  externalId,
  strapi,
}: {
  api: UID.ContentType;
  externalId: string;
  strapi;
}): Promise<(object & { documentId: string }) | undefined> {
  const results = await strapi.documents(api).findMany({
    filters: { externalId: { $eq: externalId } },
  });
  if (!results.length) return undefined;
  if (results.length > 1)
    throw new Error(
      `Multiple ${api} objects (${results.length}) with externalId ${externalId} found`
    );
  return results[0];
}

function isExternalRelation(value: unknown): value is ExternalRelation {
  return value && typeof value === 'object' && 'externalId' in value;
}
