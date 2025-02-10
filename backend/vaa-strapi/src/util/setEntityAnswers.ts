import { LocalizedAnswer } from '@openvaa/app-shared';
import { getEntity } from './getEntity';
import { getEntityApi } from './getEntityApi';
import { removeNullishProps } from './removeNullishProps';
import type { EntityData, EntityType } from '../../types/entities';

/**
 * Update or overwrite a `Candidate`’s or `Party`’s answers.
 * @param entityType - The type of the entity
 * @param entityId - The `documentId` of the entity
 * @param answers - The new answers
 * @param overwrite - If `true`, overwrite the existing answers with the new ones. If false, `merge` the new answers with the existing ones.
 * @returns The updated answers
 */
export async function setEntityAnswers<TEntity extends EntityType>({
  entityType,
  entityId,
  answers,
  overwrite = false
}: {
  entityType: TEntity;
  entityId: string;
  answers: Record<string, LocalizedAnswer>;
  overwrite?: boolean;
}): Promise<Record<string, LocalizedAnswer>> {
  const { documentId, answers: oldAnswers, ...data } = await getEntity({ entityType, entityId });

  // Possibly merge answers
  if (!overwrite && oldAnswers && typeof oldAnswers === 'object')
    answers = { ...(oldAnswers as Record<string, LocalizedAnswer>), ...answers };

  // Remove any answers that are nullish
  answers = removeNullishProps(answers);

  // We need this trickery for typing
  const update = strapi.documents(getEntityApi(entityType)).update;
  const args = { documentId, data: { ...data, answers } } as Parameters<typeof update>[0];
  const updated = (await update(args)) as EntityData<TEntity>;

  return updated.answers;
}
