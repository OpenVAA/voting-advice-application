import { log } from '@openvaa/app-shared';
import { COOKIE } from '$lib/cookies';
import {
  cookieValues,
  everyCopyOf,
  LOGOUT_COOKIE_ATTRIBUTES,
  LOGOUT_DEADLINE_SETTLED,
  LOGOUT_PENDING_MAX_AGE_SECONDS,
  logoutDeadlineState
} from './logoutDeadline';
import type { Handle, RequestEvent } from '@sveltejs/kit';

/**
 * Logout-deadline handler.
 *
 * Signs out a request whose logout count the browser has let run out: it carries an id of the count's opening in `COOKIE.logoutPending` and no `COOKIE.logoutDeadline`, which the browser drops by its own clock at the count's end plus a grace. The count ended while no document ran it, as in a tab closed during the count. No time is compared, so a device clock that is off neither moves the deadline nor signs out a user who is present. The sign-out is local and made with the request's client, so the cookie removal it writes reaches the response and the gate after it reads no session.
 *
 * Once the sign-out has worked, or has found no session, the count is settled in the same response: `COOKIE.logoutPending` is set to `LOGOUT_DEADLINE_SETTLED`, with {@link LOGOUT_COOKIE_ATTRIBUTES}, which the page writes it with too. This handler never acts on a request that carries that value, so every later request keeps its session, a sign-in made after this one included. The page reads the value as "discard the Contestant App's drafts" and removes it at the tab's next navigation or in the next document. A sign-out that fails otherwise is logged by the error's name alone and writes nothing: the request goes through with its session, and the next request tries again.
 *
 * More than one id pending at once, as a copy written for the host's own domain or a parent domain makes possible, signs nothing out: every copy of both cookies {@link everyCopyOf} names for the request's host is expired, and a line naming the cookie is logged.
 *
 * Reads those two cookies alone, from the request's `Cookie` header, which holds every copy. The sign-out is the caller's: `hooks.server.ts`, which provides `event.locals.supabase`, passes one on that client, and the handler runs after the one that provides it and before the session gate.
 * @param signOutLocally - Signs the request's session out of this browser, answering `{ error }` as Supabase's `auth.signOut` does.
 * @returns The handler.
 */
export function logoutDeadlineHandle(
  signOutLocally: (event: RequestEvent) => Promise<{ error: Error | null }>
): Handle {
  return async ({ event, resolve }) => {
    const header = event.request.headers.get('cookie');
    const state = logoutDeadlineState(
      cookieValues(header, COOKIE.logoutPending),
      cookieValues(header, COOKIE.logoutDeadline)
    );
    if (state === 'runOut') {
      const { error } = await signOutLocally(event).catch((e: Error) => ({ error: e }));
      if (error && error.name !== 'AuthSessionMissingError') {
        log.error(`[logout deadline] sign-out failed: ${error.name}`);
      } else {
        event.cookies.set(COOKIE.logoutPending, LOGOUT_DEADLINE_SETTLED, {
          ...LOGOUT_COOKIE_ATTRIBUTES,
          httpOnly: false,
          secure: event.url.protocol === 'https:',
          maxAge: LOGOUT_PENDING_MAX_AGE_SECONDS
        });
      }
    } else if (state === 'duplicated') {
      log.warn(`[logout deadline] more than one ${COOKIE.logoutPending} cookie; every copy is expired`);
      const { path } = LOGOUT_COOKIE_ATTRIBUTES;
      for (const { name, domain } of everyCopyOf(event.url.hostname)) {
        event.cookies.delete(name, domain ? { path, domain } : { path });
      }
    }
    return resolve(event);
  };
}
