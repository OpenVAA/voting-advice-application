import { getEntityApi } from './getEntityApi';
import type { EntityData, EntityType } from '../../types/entities';

/**
 * Get an entity by its type and `documentId`.
 */
export async function getEntity<TEntity extends EntityType>({
  entityType,
  entityId,
  populate = ['image']
}: {
  entityType: TEntity;
  entityId: string;
  populate?: ReadonlyArray<string>;
}): Promise<EntityData<TEntity>> {
  const api = getEntityApi(entityType);
  const findOne = strapi.documents(api).findOne;
  // We need this trickery to be able to pass `populate`
  const entity = await findOne({ documentId: entityId, populate } as Parameters<typeof findOne>[0]);
  if (!entity) throw new Error(`EntityType not found: ${api}/${entityId}`);
  return entity as EntityData<TEntity>;
}
