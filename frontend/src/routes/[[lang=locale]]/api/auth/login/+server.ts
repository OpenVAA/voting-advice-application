import { json } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { apiFail } from '$lib/api/utils/fail';
import { AUTH_TOKEN_KEY } from '$lib/server/auth';
import { logDebugError } from '$lib/utils/logger';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { BasicUserData, UserRole } from '$lib/api/base/dataWriter.type';

/**
 * # Login api route. Call this from page actions.
 *
 * On succesfull login saves the jwt token into the cookie.
 *
 * @params params - `LoginParams`
 * @returns A json `Response` with a `DataApiActionResult` and `BasicUserData`.
 */

export async function POST({ cookies, request, locals, fetch }) {
  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  const { username, password, role } = (await request.json()) as LoginParams;

  const loginResponse = await dataWriter.login({ username, password }).catch(() => undefined);
  if (!loginResponse?.authToken) return apiFail(400);
  const { authToken } = loginResponse;

  const userData = await dataWriter.getBasicUserData({ authToken }).catch((e) => {
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
    return undefined;
  });

  if (!userData) return apiFail(500);

  if (role != null && ![role].flat().includes(userData.role!)) {
    await dataWriter
      .backendLogout({ authToken })
      .catch((e) =>
        logDebugError(`Error handling backendLogout for unauthorized user: ${e?.message ?? 'No error message'}`)
      );
    console.error('Unauthorized user tried to access restricted resource');
    return apiFail(403);
  }

  // Only set the auth token if we also got the basic user data and the role matched
  cookies.set(AUTH_TOKEN_KEY, authToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });

  const language = userData.settings?.language;
  if (language) {
    locals.currentLocale = language;
  }

  return json({ ok: true, type: 'success', userData } as LoginResult);
}

/**
 * The parameters for the login api route.
 */
export type LoginParams = {
  /**
   * The user's email.
   */
  username: string;
  /**
   * The user's password.
   */
  password: string;
  /**
   * Optional role or array of roles in the `BasicUserData`. If set, a 403 error will be returned if the role does not match, and the logout sequence will be initiated.
   */
  role?: UserRole | Array<UserRole>;
};

/**
 * Returned on successful login.
 */
export type LoginResult = DataApiActionResult & { userData: BasicUserData };
