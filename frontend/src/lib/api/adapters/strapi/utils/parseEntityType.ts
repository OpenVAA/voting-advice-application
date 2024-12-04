import type { EntityType,FilterValue } from '@openvaa/data';
import type { StrapiQuestionData } from '../strapiData.type';

/**
 * Parse a Strapi entity type enum value into a proper `EntityType` filter value.
 */
export function parseEntityType(
  type: StrapiQuestionData['attributes']['entityType']
): FilterValue<EntityType> | undefined {
  switch (type) {
    case 'candidate':
      return 'candidate';
    case 'party':
      return 'organization';
    case 'all':
      return undefined;
    default:
      throw new Error(`Unknown entityType: ${type}`);
  }
}
