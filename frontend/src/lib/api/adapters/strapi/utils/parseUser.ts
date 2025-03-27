import { formatId } from '$lib/api/utils/formatId';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';
import type { StrapiBasicUserData } from '../strapiData.type';

/**
 * Parse a Strapi User data `BasicUserData` object.
 */
export function parseUser({
  documentId,
  username,
  email,
  confirmed,
  blocked,
  role
}: StrapiBasicUserData): BasicUserData {
  const id = formatId(documentId);
  return {
    id,
    // TODO: Implement language setting for the User object
    settings: {
      language: undefined
    },
    username,
    email,
    confirmed,
    blocked,
    role: role ? role.type : undefined
  };
}
