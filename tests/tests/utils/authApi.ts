/**
 * The calls a signed-in visitor's own session makes: to the auth service, and to the one RPC that claims invitations.
 *
 * Every call carries the anon key, and a user's own access token where the user is the caller. None uses the service role.
 *
 * Nothing here logs or throws a token or a password. An error names the operation, the status and the service's error code.
 */

import { supabaseAnonKey } from './supabaseAnonKey';

/** Same fallback the tests' admin client uses. */
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

/** The two tokens of a session. Both are credentials: neither goes into a log, a test title or an assertion message. */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** One grant as the access token's `grants` claim and `public.grants` both state it. */
export interface GrantSpec {
  scope: string;
  target_type: string | null;
  target_id: string | null;
  role: string;
}

/** The answer of a PostgREST call: its status and its JSON body, as received. */
export interface RpcAnswer {
  status: number;
  body: unknown;
}

/**
 * One JSON request with the anon key as `apikey`, and as bearer unless a user's token is given.
 *
 * @param method - The HTTP method.
 * @param route - The route under the stack's URL, beginning with a slash.
 * @param body - The JSON body.
 * @param bearer - A user's access token.
 */
async function call(method: string, route: string, body: unknown, bearer?: string): Promise<Response> {
  const key = supabaseAnonKey();
  return fetch(`${SUPABASE_URL}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${bearer ?? key}` },
    body: JSON.stringify(body)
  });
}

/** The parsed JSON body of a response, or `null` when it is empty or not JSON. */
async function jsonOrNull(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** The auth service's error code in a failed answer, or `unknown`. A code is a fixed word of the service, never a caller's value. */
function errorCodeOf(body: unknown): string {
  if (typeof body === 'object' && body !== null) {
    const { error_code: errorCode, code } = body as { error_code?: unknown; code?: unknown };
    if (typeof errorCode === 'string') return errorCode;
    if (typeof code === 'string' || typeof code === 'number') return String(code);
  }
  return 'unknown';
}

/**
 * Read the two tokens out of an auth-service answer that issues a session.
 *
 * @param operation - The operation, named in an error.
 * @param response - The auth service's answer.
 * @throws Error naming the operation, the status and the error code when no session was issued.
 */
async function sessionOf(operation: string, response: Response): Promise<SessionTokens> {
  const body = await jsonOrNull(response);
  const { access_token: accessToken, refresh_token: refreshToken } = (body ?? {}) as {
    access_token?: unknown;
    refresh_token?: unknown;
  };
  if (!response.ok || typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    throw new Error(`${operation}: status ${response.status}, error code ${errorCodeOf(body)}`);
  }
  return { accessToken, refreshToken };
}

/**
 * Exchange the token of a mailed link for a session.
 *
 * @param params.tokenHash - The `token_hash` of the received link.
 * @param params.type - The `type` of the received link.
 * @throws Error when the auth service issues no session.
 */
export async function verifyTokenHash({
  tokenHash,
  type
}: {
  tokenHash: string;
  type: string;
}): Promise<SessionTokens> {
  return sessionOf('verifyTokenHash', await call('POST', '/auth/v1/verify', { type, token_hash: tokenHash }));
}

/**
 * Exchange a refresh token for a new session, whose access token carries the grants the user holds now.
 *
 * @param refreshToken - The session's refresh token.
 * @throws Error when the auth service issues no session.
 */
export async function refreshSession(refreshToken: string): Promise<SessionTokens> {
  return sessionOf(
    'refreshSession',
    await call('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: refreshToken })
  );
}

/**
 * Sign in with an address and a password.
 *
 * @throws Error when the auth service issues no session.
 */
export async function signInWithPassword({
  email,
  password
}: {
  email: string;
  password: string;
}): Promise<SessionTokens> {
  return sessionOf('signInWithPassword', await call('POST', '/auth/v1/token?grant_type=password', { email, password }));
}

/**
 * Set the password of the signed-in user.
 *
 * @param params.accessToken - The user's own access token.
 * @param params.password - The new password.
 * @throws Error naming the status and the error code when the auth service refuses.
 */
export async function setPassword({ accessToken, password }: { accessToken: string; password: string }): Promise<void> {
  const response = await call('PUT', '/auth/v1/user', { password }, accessToken);
  if (!response.ok) {
    throw new Error(`setPassword: status ${response.status}, error code ${errorCodeOf(await jsonOrNull(response))}`);
  }
}

/**
 * Call `claim_invitations` as the signed-in user.
 *
 * Returns the answer uninterpreted, so a test can assert a refusal as well as a claim.
 *
 * @param params.accessToken - The user's own access token.
 * @param params.projectId - The project whose invitations are claimed.
 * @param params.extraArgs - Further arguments to send beside `p_project_id`. The function takes none, so the API refuses a call that carries any.
 */
export async function claimInvitations({
  accessToken,
  projectId,
  extraArgs = {}
}: {
  accessToken: string;
  projectId: string;
  extraArgs?: Record<string, unknown>;
}): Promise<RpcAnswer> {
  const response = await call(
    'POST',
    '/rest/v1/rpc/claim_invitations',
    { ...extraArgs, p_project_id: projectId },
    accessToken
  );
  return { status: response.status, body: await jsonOrNull(response) };
}

/**
 * The `grants` claim of an access token.
 *
 * Pure: it decodes the token's payload and verifies nothing. The claim is what the token carried when it was issued; a grant written later reaches a token only through a refresh.
 *
 * @param accessToken - A JWT access token.
 * @returns The claim's array. An empty array means the token states that its user holds no grant.
 * @throws Error when the token has no decodable payload, or when the payload carries no `grants` array: a token without the claim says nothing about grants, which is not the same as stating none.
 */
export function readGrantsClaim(accessToken: string): Array<GrantSpec> {
  const segment = accessToken.split('.')[1];
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(segment ?? '', 'base64url').toString('utf8'));
  } catch {
    throw new Error('readGrantsClaim: the access token has no decodable payload');
  }
  const grants = (payload as { grants?: unknown } | null)?.grants;
  if (!Array.isArray(grants)) throw new Error('readGrantsClaim: the access token carries no grants array');
  return grants as Array<GrantSpec>;
}
