import { redirect } from '@sveltejs/kit';
import { buildRoute } from '$lib/routes';
import { REFUSED_LINK_TYPES } from '$lib/server/auth/mailedLink';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Auth callback route: the address a mailed link names. It hands the link to the confirm page and spends nothing.
 *
 * A `GET` must spend nothing, because a mail scanner or a prefetcher that only fetches a link would otherwise use up its token, or sign the browser that fetched it in to the link's account. So a link with a `token_hash` and a `type` the route does not refuse is answered with a 303 to the confirm page (`ROUTE.AuthConfirm`), carrying the same `token_hash`, `type` and `next`; the page verifies the token only when its form is posted. `next` is passed on as the link holds it, and is validated after the verification, as every landing is.
 *
 * A link with no token or no type, or of the type `invite`, `signup` or `email`, goes to the Contestant App's login page with the auth error.
 *
 * Search-side values are passed raw: the route builder percent-encodes them, and a value encoded first would arrive encoded twice. An absent or empty `next` names none.
 *
 * Locale. The link carries its locale because the address that produced it is built the same way, and the auth service's redirect allowlist admits exactly one locale segment in front of this path, so the locale Paraglide resolves for this request is the link's, and the confirm page and every landing after it are in it.
 */
export async function GET({ url, locals }: RequestEvent): Promise<never> {
  const locale = locals.currentLocale;
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next');

  if (!tokenHash || !type || REFUSED_LINK_TYPES.has(type))
    redirect(303, buildRoute({ route: 'ContestantAppLogin', locale, errorMessage: 'authError' }));

  redirect(303, buildRoute({ route: 'AuthConfirm', locale, token_hash: tokenHash, type, ...(next ? { next } : {}) }));
}
