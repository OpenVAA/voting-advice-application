import { LocalizedAnswer } from '@openvaa/app-shared';
import { getEntity } from './getEntity';
import { getEntityApi } from './getEntityApi';
import { error, warn } from './logger';
import { removeNullishProps } from './removeNullishProps';
import type { EntityData, EntityType } from '../../types/entities';

/**
 * Update or overwrite a `Candidate`’s or `Party`’s editable properties.
 * @param entityType - The type of the entity
 * @param entityId - The `documentId` of the entity
 * @param properties.answers - The new answers
 * @param properties.image - The `documentId` of the new image for the entity or `null` to remove it
 * @param options.overwriteAnswers - If `true`, overwrite the existing answers with the new ones. If false, `merge` the new answers with the existing ones.
 * @returns The updated entity
 */
export async function setEntityProperties<TEntity extends EntityType>({
  entityType,
  entityId,
  properties: { answers, image },
  options: { overwriteAnswers } = { overwriteAnswers: false }
}: {
  entityType: TEntity;
  entityId: string;
  properties: {
    answers?: Record<string, LocalizedAnswer>;
    image?: string | null;
  };
  options?: {
    overwriteAnswers?: boolean;
  };
}): Promise<EntityData<TEntity>> {
  const { documentId, ...currentData } = await getEntity({ entityType, entityId, populate: POPULATE });

  // We need this trickery for typing
  const update = strapi.documents(getEntityApi(entityType)).update;
  type Args = Parameters<typeof update>[0];
  const updatedData: Partial<Args['data']> = {};

  if (answers && typeof answers === 'object') {
    const oldAnswers = currentData.answers;
    // Possibly merge answers
    if (!overwriteAnswers && oldAnswers && typeof oldAnswers === 'object')
      answers = { ...(oldAnswers as Record<string, LocalizedAnswer>), ...answers };
    // Remove any answers that are nullish
    answers = removeNullishProps(answers);
    updatedData['answers'] = answers;
  }

  if (image !== undefined) {
    if (image === null) {
      updatedData['image'] = null;
    } else if (typeof image === 'string') {
      // We need to link images by their `id` but are getting a `documentId` or null
      const imageData = await strapi.documents('plugin::upload.file').findOne({ documentId: image });
      if (!imageData) error(`[setEntityProperties] Image with documentId "${image}" not found.`);
      updatedData['image'] = imageData.id;
    } else {
      error(`[setEntityProperties] Invalid image provided: ${image}. Expected a string or null.`);
    }
  }

  const args = {
    documentId,
    data: { ...currentData, ...updatedData },
    populate: POPULATE
  } as Args;
  return update(args).catch((e) => {
    warn(`[setEntityProperties] Could not update document "${documentId}" not found.`, e);
    throw e;
  });
}

/**
 * The relations to populate and return.
 * NB. Check that this creates the same return type as in `/frontend/src/lib/api/adapters/strapi/strapiApi.ts`.
 */
const POPULATE = ['image'] as const;
