import { redirect } from '@sveltejs/kit';
import { buildRoute } from '$lib/routes';
import { isMailedLinkType, mailedLinkLanding } from '$lib/server/auth/mailedLink';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Auth callback route: a link that names this path is handed to the confirm page, and nothing is spent.
 *
 * A `GET` must spend nothing, because a mail scanner or a prefetcher that only fetches a link would otherwise use up its token, or sign the browser that fetched it in to the link's account. So a link with a `token_hash` and a `type` the `account-access` function mails is answered with a 303 to the confirm page (`ROUTE.AuthConfirm`), carrying the same `token_hash`, `type` and `next`; the page verifies the token only when its form is posted. `next` is passed on as the link holds it, and is looked up in the landing table after the verification, as every landing is.
 *
 * A link with no token or no type, or whose type is not one the `account-access` function mails (`MAILED_LINK_TYPES`), goes with the auth error to the login page of the app its `next` names, read through the same allow-list as every landing (`mailedLinkLanding`): the Admin App's for `/admin`, the Contestant App's otherwise.
 *
 * Search-side values are passed raw: the route builder percent-encodes them, and a value encoded first would arrive encoded twice. An absent or empty `next` names none.
 *
 * Locale. The locale Paraglide resolves for this request is the one the link's path carries, so the confirm page and every landing after it are in it.
 */
export async function GET({ url, locals }: RequestEvent): Promise<never> {
  const locale = locals.currentLocale;
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next');

  if (!tokenHash || !isMailedLinkType(type))
    redirect(303, buildRoute({ route: mailedLinkLanding(next).login, locale, errorMessage: 'authError' }));

  redirect(303, buildRoute({ route: 'AuthConfirm', locale, token_hash: tokenHash, type, ...(next ? { next } : {}) }));
}
