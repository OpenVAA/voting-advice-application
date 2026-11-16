/**
 * The `account-access` Edge Function, called as an anonymous visitor calls it: the anon key and nothing else.
 *
 * Three functions, one per operation. Each returns the status and the parsed JSON body with no interpretation, so a test can compare two answers whole.
 *
 * Nothing here logs or throws a code, a password, a token or a key. An error names the operation and the status.
 */

import { supabaseAnonKey } from './supabaseAnonKey';

/** Same fallback the tests' admin client uses. */
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

/** The endpoint of the function. */
const ACCOUNT_ACCESS_URL = `${SUPABASE_URL}/functions/v1/account-access`;

/** What the function answered: its status and its JSON body, as received. */
export interface AccountAccessAnswer {
  status: number;
  body: unknown;
}

/**
 * One `POST` to the function with the anon key as `apikey` and bearer.
 *
 * @param operation - The operation named in the body, and in an error.
 * @param fields - The body's other fields. A field whose value is `undefined` is not sent.
 * @param headers - Extra request headers. They cannot replace the key headers.
 * @throws Error naming the operation and the status when the body is not JSON.
 */
async function post(
  operation: string,
  fields: Record<string, unknown>,
  headers: Record<string, string> = {}
): Promise<AccountAccessAnswer> {
  const key = supabaseAnonKey();
  const response = await fetch(ACCOUNT_ACCESS_URL, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ operation, ...fields })
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`account-access ${operation}: status ${response.status} with a body that is not JSON`);
  }
  return { status: response.status, body };
}

/**
 * Ask whether a code is valid, used or unknown.
 *
 * @param params.projectId - The project the code belongs to.
 * @param params.code - The code as typed.
 */
export function checkCode({ projectId, code }: { projectId: string; code: string }): Promise<AccountAccessAnswer> {
  return post('check-code', { project_id: projectId, code });
}

/**
 * Ask for a sign-in link: by address, by code and address, or by code alone.
 *
 * The answer says nothing about whether a mail is sent. A test that asserts on the mail, or on its absence, passes a `witness` it opened with the service role and waits for that witness to finish.
 *
 * @param params.projectId - The project the request is made in.
 * @param params.email - The address typed.
 * @param params.code - The code typed.
 * @param params.locale - The locale of the mail and of the link's path.
 * @param params.witness - The id of a completion witness the service role opened.
 * @param params.headers - Extra request headers.
 */
export function requestLink({
  projectId,
  email,
  code,
  locale,
  witness,
  headers
}: {
  projectId: string;
  email?: string;
  code?: string;
  locale?: string;
  witness?: string;
  headers?: Record<string, string>;
}): Promise<AccountAccessAnswer> {
  return post('request-link', { project_id: projectId, email, code, locale, witness }, headers);
}

/**
 * Sign in with a used code and its claimant's password.
 *
 * @param params.projectId - The project the code belongs to.
 * @param params.code - The code as typed.
 * @param params.password - The password as typed.
 */
export function codeSignIn({
  projectId,
  code,
  password
}: {
  projectId: string;
  code: string;
  password: string;
}): Promise<AccountAccessAnswer> {
  return post('code-sign-in', { project_id: projectId, code, password });
}
