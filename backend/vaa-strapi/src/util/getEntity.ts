import { getEntityApi } from './getEntityApi';
import type { EntityData, EntityType } from '../../types/entities';

/**
 * Get an entity by its type and `documentId`.
 */
export async function getEntity<TEntity extends EntityType>({
  entityType,
  entityId
}: {
  entityType: TEntity;
  entityId: string;
}): Promise<EntityData<TEntity>> {
  const api = getEntityApi(entityType);
  const entity = await strapi.documents(api).findOne({ documentId: entityId });
  if (!entity) throw new Error(`EntityType not found: ${api}/${entityId}`);
  return entity as EntityData<TEntity>;
}
