/**
 * # The server side of the confirm page
 *
 * The page stands between a mailed link and its verification. It belongs to neither application: the links of both open it, so no application's gate stands in front of it.
 *
 * The load reads the link's `token_hash`, `type` and `next` off the address and answers them for the page's form. It verifies nothing and claims nothing, so a mail scanner or a prefetcher that only fetches the link spends nothing. A link with a missing token or type, or of a type the `account-access` function does not mail, is led with the auth error to the login page of the app its `next` names, read through the same allow-list as every landing (`mailedLinkLanding`): the Admin App's for `/admin`, the Contestant App's otherwise. No value of `next` reaches a target.
 *
 * The load also says whether the browser is signed in. A verified session makes the page say that continuing signs that account out, and offer Cancel, which leads to that account's app: the Admin App's home when the session's grants in this project open the Admin App and none opens the Contestant App (`isAdminOnlyInProject`), the Contestant App's home otherwise, a read of those grants that fails included. The page cannot name the account the link is for, because its token is unverified until the post, so nothing of either account is answered: no part of the session leaves the server, only whether there is one and where Cancel leads.
 *
 * The action verifies. It reads the three fields from the posted form, not from the address, and refuses a post with a missing token or type, or of a type the function does not mail, as the load refuses such a link: it leads to the login page of the app the posted `next` names, with the auth error and leaves a held session signed in and every count of the logout modal in place. For a link it will verify, when the request holds a session, it first signs that session out on this request's own client, through `signOutOrFail`, so a link never replaces a signed-in account without the person having pressed Continue after the page said so. A sign-out that fails, by answering `{ error }` or by rejecting, is logged, and the client is then asked whether a session is left. When it answers a session or an error, the action ends on the error page: nothing is verified, and a count a closed tab left is kept, so that the request hook signs out the browser's next request once the count has run out. Otherwise it hands the fields, the request's cookies, the request and its address to `verifyMailedLink`, which verifies, withdraws every count of the logout modal the request carries once the verification has set the session, then claims, refreshes and lands the user in that order and always ends in a redirect, and marks a browser that confirmed an address on the way. SvelteKit's origin check of a form action, on by default, refuses a post another site makes, so a link cannot be verified in a browser by a form on another site.
 *
 * Because a held session is signed out before the verification, or the action ends on the error page, a failed `email_change` link confirmed from a signed-in browser lands on the login page, as one confirmed from a browser with no session does.
 *
 * A session that cannot be read counts as none, in the load and in the action alike.
 *
 * Tested in `page.server.test.ts`.
 */

import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { isAdminOnlyInProject } from '$lib/auth';
import { buildRoute } from '$lib/routes';
import { isMailedLinkType, mailedLinkLanding, verifyMailedLink } from '$lib/server/auth/mailedLink';
import { signOutOrFail } from '$lib/server/auth/signOutOrFail';

export async function load({ url, locals, fetch }) {
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next');
  const locale = locals.currentLocale;
  if (!tokenHash || !isMailedLinkType(type))
    redirect(303, buildRoute({ route: mailedLinkLanding(next).login, locale, errorMessage: 'authError' }));

  const { session } = await readHeldSession(locals);
  if (!session) return { tokenHash, type, next, signedIn: false as const };

  const adminOnly = await isAdminOnlyInProject(
    session,
    () => createDataWriter({ fetch, locals }).getProjectGrants(),
    'Confirm page'
  );
  const cancelRoute = buildRoute({ route: adminOnly ? 'AdminAppHome' : 'ContestantAppHome', locale });
  return { tokenHash, type, next, signedIn: true as const, cancelRoute };
}

export const actions = {
  default: async (event) => {
    const { request, locals, cookies, fetch, url } = event;
    const form = await request.formData();
    const tokenHash = fieldOf(form, 'token_hash');
    const type = fieldOf(form, 'type');
    const next = fieldOf(form, 'next');
    if (!tokenHash || !isMailedLinkType(type))
      redirect(
        303,
        buildRoute({ route: mailedLinkLanding(next).login, locale: locals.currentLocale, errorMessage: 'authError' })
      );
    const { session } = await readHeldSession(locals);
    if (session) await signOutOrFail(locals, 'Confirm page');
    return verifyMailedLink({ tokenHash, type, next, locals, cookies, fetch, request, url });
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
