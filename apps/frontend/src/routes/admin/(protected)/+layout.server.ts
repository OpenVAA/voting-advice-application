/**
 * Decide, on the server, whether a signed-in user is let into the Admin App's protected pages and which gate they must pass first. Four decisions, in this order:
 *
 * 1. **Session.** A request without a session is redirected to the login page with `loginFailed`.
 * 2. **Admission.** The grants that reach this project are matched against `ADMIN_GRANTS`: a project grant on it, an account grant on its account or a global grant. They are read from the database through the writer's `getProjectGrants`, and only for a session whose token holds an admin grant somewhere, because the token lists the user's grants in every project. A user none of whose grants here opens the Admin App, an admin of another project only among them, is answered `{ admitted: false }` before any user-level data is read, and no gate is decided for them; the universal load signs them out. A user who also edits an entity is admitted on their admin grant. A read of the grants that fails is answered as a failed read of the user-level data is.
 * 3. **User-level data.** `getBasicUserData()`, which carries whether the account has a password and the state of its address. A read that answers nothing, or that does not say as a boolean whether the account has a password, signs nobody out: the request's client is asked whether a session is left, and none redirects to the login page with `loginFailed`, while one left ends on the error page, because the gate sends a live session straight back from the login page.
 * 4. **Gate.** `firstNeededGate` over `ADMIN_GATES` decides whether the user must pass a gate before any protected page is shown.
 *
 * The load returns `{ admitted: false }` or `{ admitted: true, gate, user }`, where `gate` is the id of the first needed gate or `null`. Neither holds any part of the session.
 *
 * It reads no `url`, `route` or `params`, so a navigation between the Admin App's pages does not rerun it; a rerun of every load, as after a password is saved, does.
 *
 * Every authenticated call runs on `event.locals.supabase`, the server client built over this request's session cookies.
 */

import { log } from '@openvaa/app-shared';
import { error, redirect } from '@sveltejs/kit';
import { ADMIN_GATES } from '$lib/admin/gates/adminGates';
import { createDataWriter } from '$lib/api/dataWriter';
import { ADMIN_GRANTS, hasAnyGrant, readSessionGrants } from '$lib/auth';
import { firstNeededGate } from '$lib/auth/gates';
import { t } from '$lib/i18n';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';

export async function load({ fetch, locals }) {
  const lang = getLocale();

  // A writer this request alone holds, over the cookie-bearing client `hooks.server.ts` built for this request.
  const dataWriter = createDataWriter({ fetch, locals });

  // The session.
  const { session } = await locals.safeGetSession();
  if (!session) return redirect(307, buildRoute({ route: 'AdminAppLogin', locale: lang, errorMessage: 'loginFailed' }));

  // The admission, before any user-level data is read: an admin grant that reaches this project.
  if (!hasAnyGrant(readSessionGrants(session), ADMIN_GRANTS)) return { admitted: false as const };
  const grants = await dataWriter.getProjectGrants().catch((e) => {
    log.error(`Error reading the grants that reach this project: ${e?.message ?? 'No error message'}`, { err: e });
    return undefined;
  });
  if (!grants) return await readFailed();
  if (!hasAnyGrant(grants, ADMIN_GRANTS)) return { admitted: false as const };

  // The user-level data, which the gate is decided on.
  const user = await dataWriter.getBasicUserData().catch((e) => {
    log.error(`Error fetching basic user data: ${e?.message ?? 'No error message'}`, { err: e });
    return undefined;
  });
  if (!user || typeof user.passwordSet !== 'boolean') {
    if (user) log.error('The user-level data does not say whether the account has a password.');
    return await readFailed();
  }

  // The gate.
  return { admitted: true as const, gate: firstNeededGate({ user }, ADMIN_GATES), user };

  /**
   * Answer a read that failed: the login page with `loginFailed` when the request's client holds no session, and otherwise the error page, because the gate sends a live session straight back from the login page. Nobody is signed out.
   */
  async function readFailed(): Promise<never> {
    if (await dataWriter.isSessionGone())
      redirect(307, buildRoute({ route: 'AdminAppLogin', locale: lang, errorMessage: 'loginFailed' }));
    error(503, { message: t('error.default') });
  }
}
