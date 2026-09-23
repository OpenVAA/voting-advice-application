import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';

/**
 * A utility for getting the user data in a load or server function.
 *
 * ## Why it takes a client source rather than only a `fetch`
 *
 * With Supabase, auth is cookie-based, so no token parameter is needed — but the cookies must reach a client that will actually send the credential. `_getBasicUserData` reads `supabase.auth.getSession()`, so a writer configured from a bare `fetch` asks an ANONYMOUS client who the user is, gets no session, throws, and is caught into `undefined`. That is the exact shape ruling **D10** blames for the admin outage: this helper appeared to work only because the module-scope writer singleton had usually been configured with a real client by some earlier request, which is contamination rather than correctness. It now names its client source, and there is no arm of `AdapterSource` without one — an endpoint passes `{ fetch, locals }`, a universal load passes `{ fetch, client }` from `await parent()`.
 *
 * The `parent`-based session pre-check is unchanged and still short-circuits before any adapter work: it reads `page.data.session` supplied by an ancestor server load, so an unauthenticated caller never reaches Supabase at all.
 *
 * ## Why `parent` is a SECOND parameter and not a member of the first
 *
 * It used to ride on the source — `source: AdapterSource & { parent?: … }` — and the whole object was then handed to `createDataWriter(source)` and on to `resolveAdapterConfig(source)`. That worked only because `resolveAdapterConfig` happens to read known keys and ignore the rest, while the TYPE said "this object is a client source" about something that also carried a loader function. Splitting them makes the boundary explicit and means a future `resolveAdapterConfig` that spreads its input cannot carry `parent` into an adapter config.
 * @param source - Where this request's client comes from. Nothing else.
 * @param options.parent - The ancestor data loader used for the session pre-check.
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
