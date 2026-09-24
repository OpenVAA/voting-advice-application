import { log } from '@openvaa/app-shared';
import { createDataWriter } from '$lib/api/dataWriter';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';
import type { AdapterSource } from '$lib/api/dataProvider';

/**
 * The one member of the ancestor's data this helper reads.
 *
 * `session` was typed `unknown`, which made the pre-check `if (!parentData.session)` accept ANY truthy value as evidence of a session — a string, a number, `true`. Naming a member the ancestor's session data actually carries rejects those at the type level, and the member below is REQUIRED rather than optional precisely so that a truthy scalar cannot pass as evidence of a session. It is described structurally rather than imported, because `Session` comes from `@supabase/supabase-js`, which the adapter-boundary guard bans outside `src/lib/api/adapters/**`, and this helper has no business naming the auth vendor.
 *
 * NARROWED with its producers (phase 158, D10 criterion 13). It named `access_token` while the two ancestor server loads returned the whole `Session`; those loads now return a PROJECTION — `{ userId, expiresAt }` — because everything a server load returns is serialised into the hydration payload, and the whole `Session` put a refresh token into the document of every authenticated page. The type follows the payload: it names `userId`, which the payload carries, rather than a credential the payload no longer has. The REQUIRED-member property is preserved, not relaxed — `{ session: true }` and `{ session: { expiresAt: 1 } }` are both still rejected, and `routes/admin/layout.server.test.ts` asserts that at compile time.
 *
 * @example
 * ```ts
 * // Accepted — the shape `routes/admin/+layout.server.ts` and `routes/candidate/+layout.server.ts` return.
 * { session: { userId: 'a1b2', expiresAt: 1893456000 } }
 * { session: null }
 * // Rejected — a truthy value that is not evidence of a session.
 * { session: true }
 * ```
 */
type ParentSessionData = { session?: { userId: string } | null };

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
export async function getUserData(
  source: AdapterSource,
  options?: { parent?: () => Promise<ParentSessionData> }
): Promise<BasicUserData | undefined> {
  const parent = options?.parent;

  // If parent provided, check if session exists
  if (parent) {
    const parentData = await parent();
    if (!parentData.session) return undefined;
  }

  const dataWriter = createDataWriter(source);

  const userData = await dataWriter.getBasicUserData().catch((e) => {
    log.error(`Error fetching user data: ${e?.message ?? 'No error message'}`);
    return undefined;
  });

  return userData;
}
