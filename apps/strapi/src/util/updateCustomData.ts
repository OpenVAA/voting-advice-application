import { warn } from './logger';
import type { Data } from '@strapi/strapi';

/**
 * Update any object’s `customData` by merging it with the existing value.
 * @param entityType - The type of the entity
 * @returns The updated entity
 */
export async function updateCustomData<
  TCollection extends 'api::question.question' | 'api::question-category.question-category'
>({
  collection,
  documentId,
  customData
}: {
  collection: TCollection;
  documentId: string;
  customData: object;
}): Promise<Data.ContentType<TCollection>> {
  if (!customData || typeof customData !== 'object') throw new Error('No customData object provided.');

  const { customData: currentCustomData } = await strapi.documents(collection).findOne({ documentId });

  const updatedData = {
    ...(typeof currentCustomData === 'object' ? currentCustomData : {}),
    ...customData
  };

  const update = strapi.documents(collection).update;
  type Args = Parameters<typeof update>[0];

  return update({ documentId, data: { customData: updatedData } } as unknown as Args).catch((e) => {
    warn(`[updateCustomData] Could not update document ${collection}/${documentId}`, e);
    throw e;
  });
}
