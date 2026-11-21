import { OIDC_ERROR, oidcErrorFromFunction } from '$contestant/utils/oidcError';
import type { OidcError } from '$contestant/utils/oidcError';
import type { IdentityProviderArrival } from '$lib/contestant/gates/gates';

/**
 * The outcome of {@link invokeIdentityCallback}: the arrival marker, `null` for a sign-in, and the sign-in token, or one closed code with a fixed cause for the operator's log.
 */
export type IdentityCallbackOutcome =
  { ok: true; arrival: IdentityProviderArrival; token: string } | { ok: false; error: OidcError; cause: string };

/**
 * What the call asks `identity-callback` for: a registration of the entity type the registration matrix allowed, or a sign-in of the identity's existing account, which names no type and creates nothing.
 */
export type IdentityCallbackIntent =
  { intent?: 'register'; entityType: string } | { intent: 'sign_in'; entityType?: never };

/** The marker each successful `result` of a registration leaves. */
const ARRIVAL_OF_REGISTRATION: Readonly<Record<string, IdentityProviderArrival>> = Object.freeze({
  created: 'created',
  found: 'existing',
  no_entity: 'existing'
});

/** The marker the one successful `result` of a sign-in leaves: none, because the user came to sign in and not to register. */
const ARRIVAL_OF_SIGN_IN: Readonly<Record<string, IdentityProviderArrival>> = Object.freeze({
  signed_in: null
});

/**
 * Invoke the `identity-callback` Edge Function with a verified id_token, the project and what is asked for, sending the frontend server's secret in the function's credential header, and read its answer.
 *
 * A registration sends the entity type; a sign-in sends `intent: 'sign_in'` and no type. Each accepts only its own successes: `created`, `found` and `no_entity` for a registration, `signed_in` for a sign-in.
 *
 * Never throws. A failed answer, and a success of the other intent, is mapped to a code by `oidcErrorFromFunction`, and a successful one without a sign-in token is `registration_failed`. The cause names the stage that failed, or the function's closed `result` and its HTTP status, or the name of the error the invoke threw; it holds no value of the tokens and no message the function sent.
 * @param supabase - The request's Supabase client, whose `functions.invoke` is called.
 * @param serverSecret - The frontend server's `IDENTITY_CALLBACK_SERVER_SECRET`.
 * @param idToken - The provider's id_token, already verified.
 * @param projectId - The project the application is scoped to.
 * @param intent - `sign_in` for a sign-in; absent or `register` for a registration.
 * @param entityType - For a registration, the entity type the registration matrix allowed.
 */
export async function invokeIdentityCallback({
  supabase,
  serverSecret,
  idToken,
  projectId,
  ...asked
}: {
  supabase: Pick<App.Locals['supabase'], 'functions'>;
  serverSecret: string;
  idToken: string;
  projectId: string;
} & IdentityCallbackIntent): Promise<IdentityCallbackOutcome> {
  const signIn = asked.intent === 'sign_in';
  let answer: { result?: unknown; token?: unknown } | undefined;
  let status: FunctionStatus;
  try {
    const { data, error } = await supabase.functions.invoke('identity-callback', {
      // The function's `SERVER_CREDENTIAL_HEADER`; its conformance test reads this line.
      headers: { 'x-identity-callback-secret': serverSecret },
      body: signIn
        ? { id_token: idToken, project_id: projectId, intent: 'sign_in' }
        : { id_token: idToken, project_id: projectId, entity_type: asked.entityType }
    });
    answer = error ? await failedAnswerOf(error) : (data ?? undefined);
    status = error ? failedStatusOf(error) : '2xx';
  } catch (e) {
    return { ok: false, error: oidcErrorFromFunction(undefined), cause: `the invoke threw ${errorName(e)}` };
  }

  const result = answer?.result;
  const token = answer?.token;
  const arrivals = signIn ? ARRIVAL_OF_SIGN_IN : ARRIVAL_OF_REGISTRATION;
  const succeeded = typeof result === 'string' && Object.hasOwn(arrivals, result);
  const answerCause = `function result ${String(result)}, status ${status}`;
  if (!succeeded)
    return { ok: false, error: oidcErrorFromFunction(result), cause: withAnswerHint(answerCause, result) };
  if (typeof token !== 'string' || token === '')
    return { ok: false, error: OIDC_ERROR.registrationFailed, cause: `${answerCause}, with no sign-in token` };
  return { ok: true, arrival: arrivals[result as string], token };
}

/** The name of a thrown value, the only part of it a log names: never its message. */
export function errorName(thrown: unknown): string {
  return thrown instanceof Error ? thrown.name : 'a non-error value';
}

/**
 * The body of a failed `identity-callback` answer. `functions.invoke` keeps the function's response as the error's `context` when the function answered; when it was never reached there is none.
 * @param error - The error `functions.invoke` returned.
 * @returns The answer's body, or `undefined` when there is none that reads as an object.
 */
async function failedAnswerOf(error: unknown): Promise<{ result?: unknown } | undefined> {
  const context = (error as { context?: unknown }).context;
  if (!(context instanceof Response)) return undefined;
  const body: unknown = await context.json().catch(() => undefined);
  return body && typeof body === 'object' ? (body as { result?: unknown }) : undefined;
}

/** The HTTP status of an `identity-callback` answer as the log names it: `2xx` for a successful one, `unreachable` when the function was never reached. */
type FunctionStatus = number | '2xx' | 'unreachable';

/**
 * The HTTP status of a failed `identity-callback` answer, read from the response `functions.invoke` keeps as the error's `context`.
 * @param error - The error `functions.invoke` returned.
 * @returns The status, or `unreachable` when the function never answered.
 */
function failedStatusOf(error: unknown): FunctionStatus {
  return (error as { context?: Response }).context?.status ?? 'unreachable';
}

/**
 * Add the operator hint a function `result` has to the log's cause. `refused` is the function's answer to a missing or mismatched credential, which the function does not log itself.
 */
function withAnswerHint(cause: string, result: unknown): string {
  return result === 'refused' ? `${cause}; the secret differs between the root .env and the function env` : cause;
}
