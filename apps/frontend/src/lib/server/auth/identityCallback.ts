import { OIDC_ERROR, oidcErrorFromFunction } from '$contestant/utils/oidcError';
import type { OidcError } from '$contestant/utils/oidcError';
import type { IdentityProviderArrival } from '$lib/contestant/gates/gates';

/** The arrival marker a successful `identity-callback` answer leaves. */
export type IdentityCallbackArrival = Exclude<IdentityProviderArrival, null>;

/**
 * The outcome of {@link invokeIdentityCallback}: the arrival marker and the sign-in token, or one closed code with a fixed cause for the operator's log.
 */
export type IdentityCallbackOutcome =
  { ok: true; arrival: IdentityCallbackArrival; token: string } | { ok: false; error: OidcError; cause: string };

/** The marker each successful `result` of `identity-callback` leaves. */
const ARRIVAL_OF_RESULT: Readonly<Record<string, IdentityCallbackArrival>> = Object.freeze({
  created: 'created',
  found: 'existing',
  no_entity: 'existing'
});

/**
 * Invoke the `identity-callback` Edge Function with a verified id_token, the project and the entity type, sending the frontend server's secret in the function's credential header, and read its answer.
 *
 * Never throws. A failed answer is mapped to a code by `oidcErrorFromFunction`, and a successful one without a sign-in token is `registration_failed`. The cause names the stage that failed, or the function's closed `result` and its HTTP status, or the name of the error the invoke threw; it holds no value of the tokens and no message the function sent.
 * @param supabase - The request's Supabase client, whose `functions.invoke` is called.
 * @param serverSecret - The frontend server's `IDENTITY_CALLBACK_SERVER_SECRET`.
 * @param idToken - The provider's id_token, already verified.
 * @param projectId - The project the application is scoped to.
 * @param entityType - The entity type the registration matrix allowed.
 */
export async function invokeIdentityCallback({
  supabase,
  serverSecret,
  idToken,
  projectId,
  entityType
}: {
  supabase: Pick<App.Locals['supabase'], 'functions'>;
  serverSecret: string;
  idToken: string;
  projectId: string;
  entityType: string;
}): Promise<IdentityCallbackOutcome> {
  let answer: { result?: unknown; token?: unknown } | undefined;
  let status: FunctionStatus;
  try {
    const { data, error } = await supabase.functions.invoke('identity-callback', {
      // The function's `SERVER_CREDENTIAL_HEADER`; its conformance test reads this line.
      headers: { 'x-identity-callback-secret': serverSecret },
      body: { id_token: idToken, project_id: projectId, entity_type: entityType }
    });
    answer = error ? await failedAnswerOf(error) : (data ?? undefined);
    status = error ? failedStatusOf(error) : '2xx';
  } catch (e) {
    return { ok: false, error: oidcErrorFromFunction(undefined), cause: `the invoke threw ${errorName(e)}` };
  }

  const result = answer?.result;
  const token = answer?.token;
  const arrival =
    typeof result === 'string' && Object.hasOwn(ARRIVAL_OF_RESULT, result) ? ARRIVAL_OF_RESULT[result] : undefined;
  const answerCause = `function result ${String(result)}, status ${status}`;
  if (!arrival) return { ok: false, error: oidcErrorFromFunction(result), cause: withAnswerHint(answerCause, result) };
  if (typeof token !== 'string' || token === '')
    return { ok: false, error: OIDC_ERROR.registrationFailed, cause: `${answerCause}, with no sign-in token` };
  return { ok: true, arrival, token };
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
