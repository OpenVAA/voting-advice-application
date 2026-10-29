/**
 * Server-side OIDC authorization endpoint: starts the identity provider's flow for the entity type the user registers as.
 *
 * The body is `{ entityType?: string }`; every other key is ignored.
 *
 * 1. The application settings are read anonymously at request time. A read that fails answers 503 `{ error: 'unavailable' }`.
 * 2. The type is checked against the registration matrix before anyone is sent to the provider, through `identityProviderEntityType` over `identityProviderEntityTypes`, the function the registration screen reads the types it offers from. A named type must be in that list; an absent one is taken only when the list holds exactly one. Anything else, and every type while answers are locked, answers 403 `{ error: 'mode_not_allowed' }`.
 * 3. The redirect the provider is given is this endpoint's own origin and the callback's path. For a provider bound by PKCE (Signicat), the verifier and its challenge are generated here and the verifier is kept in an httpOnly cookie, so the browser sends no challenge. Idura's signed request (JAR) is built here too, so its signing keys never reach the browser.
 * 4. The provider is asked to show its screens in the request's locale, `locals.currentLocale`, as `ui_locales`. The registration screen posts under its own locale's prefix, so that locale is the one the page was shown in.
 * 5. The provider's `state` and `nonce`, when it returns them (Idura), and the chosen type are set as httpOnly cookies with the flow's attributes, and the answer is `{ authorizeUrl }`.
 *
 * The type cookie returns with the provider's redirect and is bound to the flow only by the cookie jar and its lifetime. It selects which type the callback asks for and never authorises: every reader checks the matrix again, and the `identity-callback` function's check is the authority.
 */

import { log } from '@openvaa/app-shared';
import { error, isHttpError, json } from '@sveltejs/kit';
import { createDataProvider, createSupabaseAnonClient } from '$lib/api/dataProvider';
import { generateChallenge } from '$lib/api/utils/auth/generateChallenge';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import { identityProviderEntityType } from '$lib/contestant/utils/registrationOffer';
import { COOKIE } from '$lib/cookies';
import { ROUTE } from '$lib/routes';
import type { ContestantAppConfigInput } from '@openvaa/app-shared';
import type { RequestEvent } from '@sveltejs/kit';

/** The attributes of every cookie the flow leaves behind. `lax` lets them return with the provider's top-level redirect. */
const FLOW_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 600
} as const;

export async function POST({ cookies, fetch, locals, request, url }: RequestEvent): Promise<Response> {
  try {
    const body: unknown = await request.json().catch(() => error(400, { message: 'The body must be JSON' }));
    const named = body && typeof body === 'object' ? (body as Record<string, unknown>).entityType : undefined;

    const dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });
    let settings: ContestantAppConfigInput;
    try {
      settings = (await dataProvider.getAppSettings()) as ContestantAppConfigInput;
    } catch (e) {
      log.error(
        `[oidc/authorize] Error reading app settings: ${(e as Error | undefined)?.message ?? 'No error message'}`,
        { err: e }
      );
      return json({ error: 'unavailable' }, { status: 503 });
    }

    const entityType = identityProviderEntityType(settings, named);
    if (!entityType) return json({ error: 'mode_not_allowed' }, { status: 403 });

    const provider = getActiveProvider();
    const redirectUri = new URL(ROUTE.ContestantAppIdentityProviderCallback, url.origin).href;

    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;
    if (provider.callbackBinding === 'pkce') ({ codeVerifier, codeChallenge } = await generateChallenge(crypto));

    const result = await provider.getAuthorizeUrl({ redirectUri, codeChallenge, locale: locals.currentLocale });

    if (codeVerifier) cookies.set(COOKIE.oidcCodeVerifier, codeVerifier, FLOW_COOKIE_OPTIONS);
    if (result.state) cookies.set(COOKIE.oidcState, result.state, FLOW_COOKIE_OPTIONS);
    if (result.nonce) cookies.set(COOKIE.oidcNonce, result.nonce, FLOW_COOKIE_OPTIONS);
    cookies.set(COOKIE.oidcEntityType, entityType, FLOW_COOKIE_OPTIONS);

    return json({ authorizeUrl: result.authorizeUrl });
  } catch (e) {
    // The endpoint's own 4xx contract must survive its own catch: `error()` THROWS, so an in-`try` `error(400, ...)` would otherwise be swallowed and re-reported as a 500. Do not simplify this back into the `console.error` below.
    if (isHttpError(e)) throw e;
    console.error('Failed to construct authorization request:', e);
    return error(500, { message: 'Failed to construct authorization request' });
  }
}
