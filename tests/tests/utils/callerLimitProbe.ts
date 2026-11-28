/**
 * The probe of the per-caller limit of the `account-access` Edge Function.
 *
 * Pure: it imports nothing at run time, reads no environment and holds no client. The caller supplies the one function that sends a request, so the same classifier runs against stand-in answers, the local function and a deployed one.
 */

/** The calls one caller is admitted per window, as `access_caller_take` counts them under the default `private.deployment_settings.access_caller_max`. The unit test pins it to that column's default. */
export const CALLER_LIMIT = 30;

/** The length of the limit's window in seconds, and so the longest `Retry-After` a refusal can carry. The unit test pins it to the function's `v_window`. */
export const CALLER_WINDOW_SECONDS = 600;

/** Where a code check is sent: the Supabase URL, its public anon key and the project the code is looked up in. */
export type CheckCodeTarget = { supabaseUrl: string; anonKey: string; projectId: string };

/** A `check-code` request to `account-access`, ready for a caller's HTTP client. */
export type CheckCodeRequest = {
  url: string;
  headers: Record<string, string>;
  data: { operation: 'check-code'; project_id: string; code: string };
};

/** What the probe reads of one answer: its status, its body as text and its `Retry-After` header, or null when it has none. */
export type ProbeAnswer = { status: number; bodyText: string; retryAfter: string | null };

/** The probe's verdict: the limit refused a call as the function refuses one, or the reason it was not seen to. */
export type ProbeResult = { ok: true; admitted: number; retryAfterSeconds: number } | { ok: false; reason: string };

const CODE_STATUSES: ReadonlyArray<string> = ['valid', 'used', 'unknown'];
const RETRY_AFTER_PATTERN = /^[1-9][0-9]*$/;

/**
 * Reads the code-check target from the environment a page serves and the project id it carries.
 *
 * @param env - The served public environment, or null when the page served none.
 * @param projectId - The served `data-project-id`, or null when the page carried none.
 * @returns The target.
 * @throws `CALLER LIMIT TARGET UNREADABLE: <names>`, naming each of `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` and `data-project-id` that is absent, blank or not a string, and holding no value.
 */
export function checkCodeTargetFrom(env: Record<string, unknown> | null, projectId: string | null): CheckCodeTarget {
  const supabaseUrl = env?.PUBLIC_SUPABASE_URL;
  const anonKey = env?.PUBLIC_SUPABASE_ANON_KEY;
  if (!nonBlank(supabaseUrl) || !nonBlank(anonKey) || !nonBlank(projectId)) {
    const missing = [
      nonBlank(supabaseUrl) ? null : 'PUBLIC_SUPABASE_URL',
      nonBlank(anonKey) ? null : 'PUBLIC_SUPABASE_ANON_KEY',
      nonBlank(projectId) ? null : 'data-project-id'
    ].filter((name) => name !== null);
    throw new Error(`CALLER LIMIT TARGET UNREADABLE: ${missing.join(', ')}`);
  }
  return { supabaseUrl, anonKey, projectId };
}

/**
 * Builds a `check-code` request to `account-access`.
 *
 * It carries no client-address header: the platform in front of a hosted function sets the caller's address itself and refuses a request that sends one.
 *
 * @param target - Where the request goes.
 * @param code - The code to check.
 * @returns A `POST` to `<supabaseUrl>/functions/v1/account-access` with exactly `apikey`, `Authorization` and `Content-Type`.
 */
export function checkCodeRequest(target: CheckCodeTarget, code: string): CheckCodeRequest {
  return {
    url: `${target.supabaseUrl.replace(/\/+$/, '')}/functions/v1/account-access`,
    headers: {
      apikey: target.anonKey,
      Authorization: `Bearer ${target.anonKey}`,
      'Content-Type': 'application/json'
    },
    data: { operation: 'check-code', project_id: target.projectId, code }
  };
}

/**
 * Makes a code no invitation holds, so each call of the probe checks a code of its own.
 *
 * @returns `smoke-` followed by a random uuid, within the function's code length.
 */
export function freshCheckCode(): string {
  return `smoke-${globalThis.crypto.randomUUID()}`;
}

/**
 * Calls the function until the per-caller limit refuses a call, and judges the refusal.
 *
 * It makes at most `2 * limit + 1` calls, each with a fresh code, and stops at the first answer that is not 200. The budget allows for one window reset: a window that other calls of the same caller had partly used can end partway through the probe, and the window that follows admits `limit` more calls. Every admitted answer must be a code status. It passes only on a 429 whose body is exactly the function's refusal and whose `Retry-After` is a whole number of seconds from 1 to the window. How many calls were admitted before it is reported, not judged, since other calls of the same caller may share the window.
 *
 * @param post - Sends one code check and gives its answer.
 * @param freshCode - Makes the code of each call.
 * @param limit - The calls the limit admits per window.
 * @param windowSeconds - The window's length in seconds.
 * @returns `ok: true` with the calls admitted and the wait, or `ok: false` with a reason naming the call, the status and, for `Retry-After`, its value or `absent`, never quoting a body. With no 429 at all, the reason lists the possible causes; a window that other calls of the caller had partly used is not among them, since the budget allows for its reset.
 */
export async function probeCallerLimit(
  post: (code: string) => Promise<ProbeAnswer>,
  freshCode: () => string,
  limit: number = CALLER_LIMIT,
  windowSeconds: number = CALLER_WINDOW_SECONDS
): Promise<ProbeResult> {
  const calls = 2 * limit + 1;
  for (let call = 1; call <= calls; call++) {
    const answer = await post(freshCode());
    if (answer.status === 200) {
      if (!isCodeStatus(parseJson(answer.bodyText))) {
        return { ok: false, reason: `call ${call}: status 200 with a body that is not a code status` };
      }
      continue;
    }
    if (answer.status !== 429) {
      return { ok: false, reason: `call ${call}: status ${answer.status}, neither 200 nor 429` };
    }
    if (!isRefusal(parseJson(answer.bodyText))) {
      return { ok: false, reason: `call ${call}: status 429 with a body that is not {"error":"too-many-requests"}` };
    }
    const retryAfter = answer.retryAfter;
    if (retryAfter === null) {
      return { ok: false, reason: `call ${call}: status 429 with Retry-After absent` };
    }
    const seconds = RETRY_AFTER_PATTERN.test(retryAfter) ? Number(retryAfter) : NaN;
    if (!(seconds <= windowSeconds)) {
      return {
        ok: false,
        reason: `call ${call}: status 429 with Retry-After ${retryAfter}, not a whole number from 1 to ${windowSeconds}`
      };
    }
    return { ok: true, admitted: call - 1, retryAfterSeconds: seconds };
  }
  return {
    ok: false,
    reason:
      `no 429 within ${calls} calls: the per-caller limit was not seen to be in force. Possible causes: ` +
      'private.deployment_settings.behind_cloudflare is not true (infra/scripts/check-deployment-settings.sql); ' +
      `private.deployment_settings.access_caller_max is set above ${limit}; ` +
      'cf-connecting-ip does not reach the function; the deployed account-access predates its access_caller_take; ' +
      "this caller's address changed between calls"
  };
}

function nonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function hasOnlyKey(value: unknown, key: string): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0] === key;
}

function isCodeStatus(value: unknown): boolean {
  return hasOnlyKey(value, 'status') && typeof value.status === 'string' && CODE_STATUSES.includes(value.status);
}

function isRefusal(value: unknown): boolean {
  return hasOnlyKey(value, 'error') && value.error === 'too-many-requests';
}
