import { log } from '@openvaa/app-shared';
import { hasAnyRole, readUserRoles } from './roles';
import type { UserRole } from './roles';

/**
 * Sign a principal in with a password and gate them on a role set.
 *
 * ## Why the caller's request context is required rather than optional
 *
 * The sign-in must be issued on the CALLER'S OWN client, so the session cookies land on the response the caller is building. Creating a client inside this helper would put them on a nested response instead, whose `Set-Cookie` headers never reach the browser — a recorded incident, and the reason both login form actions carry a docblock warning about it. There is deliberately no arm of this function that works without a context.
 *
 * ## Why it returns an outcome instead of throwing or redirecting
 *
 * The surviving entry points have genuinely different error and redirect semantics, and a helper that redirected would force one of them to be emulated by the other. Each caller translates the outcome into its own failure response and its own redirect target; the role set, the redirect target and the log label are the only things that differ between them.
 *
 * ## What it deliberately does not take
 *
 * A role, scope or permission parameter supplied by the request. The allowed set is chosen by the entry point, in code. On a login path the caller is unauthenticated by definition, so a role read out of request input would be attacker-controlled input deciding its own gate.
 *
 * Holds no module-level mutable state: two concurrent invocations carrying different contexts cannot observe each other.
 * @param options.context - This request's own auth surface. Required; see above.
 * @param options.email - The submitted e-mail.
 * @param options.password - The submitted password. Never logged.
 * @param options.allowedRoles - The roles that open this entry point. No default, deliberately.
 * @param options.logLabel - Names the entry point in this helper's log lines, which is what preserves the callers' distinct messages without a role switch.
 * @returns A discriminated outcome. Never throws for an expected failure.
 */
export async function passwordLogin({
  context,
  email,
  password,
  allowedRoles,
  logLabel
}: {
  context: PasswordLoginContext;
  email: string;
  password: string;
  allowedRoles: ReadonlyArray<UserRole>;
  logLabel: string;
}): Promise<PasswordLoginOutcome> {
  const signInError = await signIn({ context, email, password });
  if (signInError) {
    log.error(`${logLabel} failed: ${signInError}`);
    return { ok: false, status: 400, reason: 'invalidCredentials' };
  }

  const { session, user } = await context.getSession();
  if (!session || !user) {
    log.error(`${logLabel}: session not established after signIn`);
    return { ok: false, status: 500, reason: 'noSession' };
  }

  if (!hasAnyRole(readUserRoles(session.access_token), allowedRoles)) {
    await context.auth.signOut({ scope: 'local' });
    log.debug(`${logLabel}: unauthorized user rejected at the app entry gate`);
    return { ok: false, status: 403, reason: 'roleNotAllowed' };
  }

  return { ok: true, session, user };
}

/**
 * The slice of the caller's request context this helper acts through.
 *
 * Described structurally rather than imported. The backend client's own types are banned outside the adapter directory, and naming them here would hard-wire today's backend into this helper's contract — which is precisely what the single sign-in function below exists to avoid.
 */
export type PasswordLoginContext = {
  auth: {
    /**
     * Issue the sign-in on this request's client.
     * @param credentials - The submitted e-mail and password.
     * @returns The backend's error, or an object carrying `null`.
     */
    signInWithPassword(credentials: { email: string; password: string }): Promise<{
      error: { message: string } | null;
    }>;
    /**
     * Drop the session this request just established, locally only.
     * @param options - Scope of the sign-out.
     * @returns Whatever the backend returns; the result is not read.
     */
    signOut(options: { scope: 'local' }): Promise<unknown>;
  };
  /**
   * Read back the session the sign-in established, verified server side.
   * @returns The session and user, either of which may be `null`.
   */
  getSession(): Promise<{ session: { access_token: string } | null; user: { id: string } | null }>;
};

/**
 * What a login attempt came to.
 *
 * Statuses are the ones the callers already returned for these three cases, so translating an outcome into a form-action failure stays a one-liner. `reason` is for the caller and the logs; it is never surfaced to the browser as a message, because the three failures are deliberately indistinguishable to an unauthenticated caller beyond their status.
 */
export type PasswordLoginOutcome =
  | { ok: true; session: { access_token: string }; user: { id: string } }
  | { ok: false; status: 400; reason: 'invalidCredentials' }
  | { ok: false; status: 500; reason: 'noSession' }
  | { ok: false; status: 403; reason: 'roleNotAllowed' };

/**
 * The ONE place a backend sign-in is issued.
 *
 * Isolated so its body can be swapped — for a call through the data-writer interface, say — without touching this module's contract or any caller. Returns the error MESSAGE rather than the error object, so nothing vendor-shaped escapes into the outcome, and returns nothing at all on success so the credentials cannot ride along.
 * @param options.context - This request's own auth surface.
 * @param options.email - The submitted e-mail.
 * @param options.password - The submitted password.
 * @returns The backend's error message, or `undefined` when the sign-in succeeded.
 */
async function signIn({
  context,
  email,
  password
}: {
  context: PasswordLoginContext;
  email: string;
  password: string;
}): Promise<string | undefined> {
  const { error } = await context.auth.signInWithPassword({ email, password });
  return error?.message;
}
