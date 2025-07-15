import type { UID } from '@strapi/strapi';
import type { EntityType } from '../../types/entities';

export function getEntityApi(entityType: EntityType): UID.ContentType {
  switch (entityType) {
    case 'candidate':
      return 'api::candidate.candidate';
    case 'party':
      return 'api::party.party';
    default:
      throw new Error(`Unsupported entityType: ${entityType}`);
  }
}
