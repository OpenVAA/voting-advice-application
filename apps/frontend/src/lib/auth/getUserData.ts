import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';

/**
 * A utility for getting the user data in a load or server function.
 * With Supabase, auth is cookie-based, so no token parameter is needed.
 * The `parent` variant checks page.data.session for authentication state.
 * @param fetch - The fetch function for making API requests.
 * @param parent - Optional parent data loader to check session state.
 * @returns BasicUserData or undefined if user data is not available.
 */
export async function getUserData({
  fetch,
  parent
}: {
  fetch: Fetch;
  parent?: () => Promise<{ session?: unknown }>;
}): Promise<BasicUserData | undefined> {
  // If parent provided, check if session exists
  if (parent) {
    const parentData = await parent();
    if (!parentData.session) return undefined;
  }

  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  // authToken is ignored by Supabase adapter -- session is cookie-based
  const userData = await dataWriter.getBasicUserData({ authToken: '' }).catch((e) => {
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
    return undefined;
  });

  return userData;
}
