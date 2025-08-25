import { formatId } from '$lib/api/utils/formatId';
import type { BasicUserData, UserRole } from '$lib/api/base/dataWriter.type';
import type { StrapiBasicUserData, StrapiRoleName } from '../strapiData.type';

export const STRAPI_ROLES: Record<StrapiRoleName, UserRole | null> = {
  admin: 'admin',
  authenticated: 'candidate',
  public: null
};

/**
 * Parse a Strapi User data `BasicUserData` object.
 */
export function parseUser({ documentId, username, email, role }: StrapiBasicUserData): BasicUserData {
  const id = formatId(documentId);
  return {
    id,
    // TODO: Implement language setting for the User object
    settings: {
      language: undefined
    },
    username,
    email,
    role: role ? STRAPI_ROLES[role.type] : null
  };
}
