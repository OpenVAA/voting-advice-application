import { findOneByExternalId, parseExternalRelations } from './externalRelations';
import { IMPORTABLE_COLLECTIONS } from './importableCollections';
import type { ImportableCollection, ImportDatum } from '../data.type';

/**
 * Create or update existing data based on `externalId` or `documentId` if provided.
 * @param collection - The importable collection.
 * @param datum - The data item.
 * @returns Either 'created' or 'updated'
 * @throws Error if both `externalId` and `documentId` are provided or there are problems with `externalId`s, updating or creating.
 */
export async function createOrUpdate<TCollection extends ImportableCollection>({
  collection,
  datum,
  strapi,
}: {
  collection: TCollection;
  datum: ImportDatum;
  strapi;
}): Promise<'created' | 'updated'> {
  const { api, externalRelations, singleType } = IMPORTABLE_COLLECTIONS[collection];
  const parsed = await parseExternalRelations({
    config: externalRelations,
    datum,
    strapi,
  });
  const { documentId, externalId } = parsed;
  if (singleType && (documentId || externalId))
    throw new Error(`DocumentId or externalId provided for single type ${collection}`);
  if (documentId && externalId)
    throw new Error(
      `Both documentId ${documentId} and externalId ${externalId} provided for ${collection}`
    );
  let existing: (object & { documentId: string }) | undefined;
  if (singleType) {
    existing = await strapi.documents(api).findFirst();
  } else if (documentId) {
    existing = await strapi.documents(api).findOne({ documentId });
  } else if (externalId) {
    if (typeof externalId !== 'string') throw new Error(`Invalid externalId ${externalId}`);
    existing = await findOneByExternalId({ api, externalId, strapi });
  }
  if (existing) {
    const { documentId, ...rest } = existing;
    await strapi.documents(api).update({
      documentId,
      data: { ...rest, ...parsed },
    });
    return 'updated';
  }
  await strapi.documents(api).create({ data: parsed });
  return 'created';
}

// Stashed code for file upload
// const files = {} as Record<keyof TData, FileUploadProps>;
// if (mediaFields?.length) {
//   for (const key of mediaFields) {
//     if (itemData[key]) {
//       try {
//         const path = `${itemData[key]}`;
//         const name = Path.parse(path).name;
//         const fullPath = Path.resolve(folder, path);
//         const size = fs.statSync(fullPath).size;
//         const type = mime.lookup(fullPath);
//         files[key] = { name, path: fullPath, size, type };
//       } catch (e) {
//         console.error(`[loadData] [create] Error reading media file '${itemData[key]}'`, e);
//         throw e;
//       }
//     }
//     delete itemData[key];
//   }
// }
