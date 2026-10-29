/**
 * # The server side of the confirm page
 *
 * The page stands between a mailed link and its verification. It belongs to neither application: the links of both open it, so no application's gate stands in front of it.
 *
 * The load reads the link's `token_hash`, `type` and `next` off the address and answers them for the page's form. It verifies nothing and claims nothing, so a mail scanner or a prefetcher that only fetches the link spends nothing. A link with a missing token or type, or of a type the `account-access` function does not mail, is led to the login page with the auth error.
 *
 * The load also says whether the browser is signed in. A verified session makes the page say that continuing signs that account out, and offer Cancel, which leads to that account's app: the Admin App's home when the session's grants open the Admin App and none opens the Contestant App, the Contestant App's home otherwise. The page cannot name the account the link is for, because its token is unverified until the post, so nothing of either account is answered: no part of the session leaves the server, only whether there is one and where Cancel leads.
 *
 * The action verifies. It reads the three fields from the posted form, not from the address. When the request holds a session it signs that session out on this request's own client first, so a link never replaces a signed-in account without the person having pressed Continue after the page said so. It then hands the fields and the request's cookies to `verifyMailedLink`, which verifies, claims, refreshes and lands the user in that order and always ends in a redirect, and marks a browser that confirmed an address on the way. SvelteKit's origin check of a form action, on by default, refuses a post another site makes, so a link cannot be verified in a browser by a form on another site.
 *
 * Because the sign-out comes first, a failed `email_change` link confirmed from a signed-in browser lands on the login page, as one confirmed from a browser with no session does.
 *
 * A session that cannot be read counts as none, in the load and in the action alike.
 *
 * Tested in `page.server.test.ts`.
 */

import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { ADMIN_GRANTS, CONTESTANT_GRANTS, hasAnyGrant, readSessionGrants } from '$lib/auth';
import { buildRoute } from '$lib/routes';
import { isMailedLinkType, verifyMailedLink } from '$lib/server/auth/mailedLink';

export async function load({ url, locals }) {
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next');
  const locale = locals.currentLocale;
  if (!tokenHash || !isMailedLinkType(type))
    redirect(303, buildRoute({ route: 'ContestantAppLogin', locale, errorMessage: 'authError' }));

  const { session } = await readHeldSession(locals);
  if (!session) return { tokenHash, type, next, signedIn: false as const };

  const grants = readSessionGrants(session);
  const cancelHome =
    hasAnyGrant(grants, ADMIN_GRANTS) && !hasAnyGrant(grants, CONTESTANT_GRANTS) ? 'AdminAppHome' : 'ContestantAppHome';
  const cancelRoute = buildRoute({ route: cancelHome, locale });
  return { tokenHash, type, next, signedIn: true as const, cancelRoute };
}

export const actions = {
  default: async ({ request, locals, cookies, fetch }) => {
    const form = await request.formData();
    const { session } = await readHeldSession(locals);
    if (session)
      await locals.supabase.auth
        .signOut({ scope: 'local' })
        .catch((e: Error) => log.error(`Confirm page: signing out before the verification failed: ${e?.name ?? '-'}`));
    return verifyMailedLink({
      tokenHash: fieldOf(form, 'token_hash'),
      type: fieldOf(form, 'type'),
      next: fieldOf(form, 'next'),
      locals,
      cookies,
      fetch
    });
  }
};

/**
 * Read the session the request's cookies hold, taking one that cannot be read for none.
 * @param locals - The request's locals.
 * @returns The verified session, or `null`.
 */
async function readHeldSession(locals: App.Locals): ReturnType<App.Locals['safeGetSession']> {
  return locals.safeGetSession().catch((e: Error) => {
    log.error(`Confirm page: reading the session failed: ${e?.name ?? '-'}`);
    return { session: null, user: null };
  });
}

/**
 * A text field of a posted form.
 * @param form - The posted form.
 * @param name - The field's name.
 * @returns The field's value, or `null` when the form holds none or an empty one.
 */
function fieldOf(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === 'string' && value !== '' ? value : null;
}
