import { log } from '@openvaa/app-shared';
import { admitSession } from './sessionAdmission';
import type { GrantShape } from './roles';
import type { SessionAdmissionContext, SessionAdmissionOutcome } from './sessionAdmission';

/**
 * Sign in the user who claimed an invitation code, with that code and their password, and gate them on a set of grant shapes.
 *
 * ## Who calls it
 *
 * A form action that owns the response. The sign-in is issued through the caller's context, on the caller's own client, so the session cookies land on the response that action is building; see `passwordLogin` for why no arm of these helpers works without a context. The allowed grant shapes are chosen by that caller, in code, and never read from the request.
 *
 * ## One failure for every refusal
 *
 * A sign-in that established no session, and a sign-in that threw, are both the `invalidCredentials` outcome with status 400. Nothing in the outcome tells an unknown code from a wrong password, from a user who has no password, or from a backend that could not be reached, because the difference would tell the holder of a code something about the account behind it. Neither refusal reaches the claim.
 *
 * After a session is established it is handed to `admitSession`, which claims, refreshes and gates in that order.
 *
 * Holds no module-level mutable state.
 * @param options.context - This request's own auth surface, its claim and its code sign-in. Required.
 * @param options.code - The submitted code. Never logged.
 * @param options.password - The submitted password. Never logged.
 * @param options.allowedGrants - The `(scope, role)` grant shapes that open this entry point. No default, deliberately.
 * @param options.logLabel - Names the entry point in this helper's log lines.
 * @returns A discriminated outcome. Never throws for an expected failure.
 */
export async function invitationCodeLogin({
  context,
  code,
  password,
  allowedGrants,
  logLabel
}: {
  context: InvitationCodeLoginContext;
  code: string;
  password: string;
  allowedGrants: ReadonlyArray<GrantShape>;
  logLabel: string;
}): Promise<InvitationCodeLoginOutcome> {
  if (!(await signIn({ context, code, password, logLabel }))) {
    return { ok: false, status: 400, reason: 'invalidCredentials' };
  }
  return admitSession({ context, allowedGrants, logLabel });
}

/**
 * The slice of the caller's request context this helper acts through: what an admission needs, and the code sign-in.
 *
 * Described structurally rather than imported, as `PasswordLoginContext` is.
 */
export type InvitationCodeLoginContext = SessionAdmissionContext & {
  /**
   * Sign in with a code and a password on this request's client.
   * @param credentials - The submitted code and password.
   * @returns Whether a session was established. May throw.
   */
  signInWithInvitationCode(credentials: { code: string; password: string }): Promise<boolean>;
};

/**
 * What a code login came to: refused credentials, or what the admission of the session came to.
 */
export type InvitationCodeLoginOutcome =
  SessionAdmissionOutcome | { ok: false; status: 400; reason: 'invalidCredentials' };

/**
 * The one place the code sign-in is issued. A throw is logged by its message and answered like a refusal, so nothing vendor-shaped and neither credential escapes into the outcome.
 * @param options.context - This request's own code sign-in.
 * @param options.code - The submitted code.
 * @param options.password - The submitted password.
 * @param options.logLabel - Names the entry point in the log lines.
 * @returns Whether a session was established.
 */
async function signIn({
  context,
  code,
  password,
  logLabel
}: {
  context: InvitationCodeLoginContext;
  code: string;
  password: string;
  logLabel: string;
}): Promise<boolean> {
  try {
    const established = await context.signInWithInvitationCode({ code, password });
    if (!established) log.debug(`${logLabel}: code sign-in refused`);
    return established;
  } catch (e) {
    log.error(`${logLabel} failed: ${e instanceof Error ? e.message : String(e)}`);
    return false;
  }
}
