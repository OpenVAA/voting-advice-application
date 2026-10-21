import { expect, test } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { supabaseAnonKey } from '../../utils/supabaseAnonKey';
import type { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * # The auth service creates no user for an unauthenticated caller
 *
 * A function that grants authority to a confirmed address cannot tell how the address came to be confirmed, so a confirmed address has to mean that a mailed link was opened or that the service role vouched for it. That holds only while the two public routes that can bring a user into existence refuse: `POST /auth/v1/signup`, and `POST /auth/v1/otp` with `create_user: true`.
 *
 * `yarn assert:auth-signup-closed` checks the two switches in `config.toml`. This spec observes the RUNNING service, which reads that file only when the stack starts: a stack that was not restarted, or a service that creates users again, fails here.
 *
 * API level only. No page is opened and no seeded row is read, so the project that runs this file has no dependency.
 *
 * Both refusals are synchronous, so the absence of a user is asserted straight after the answer, with no wait.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch around an expectation).
 */

/** Same fallback the tests' admin client uses. */
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

/** The error code the auth service answers with while public sign-up is off. */
const SIGNUP_DISABLED = 'signup_disabled';

/** Every address a test of this file asked the service to create a user for. */
const attemptedAddresses: Array<string> = [];

/** An address no user holds, remembered so that {@link removeAttemptedUsers} can remove a user a refusal failed to prevent. */
function freshAddress(): string {
  const address = `signup-closed-${crypto.randomUUID()}@test.openvaa.local`;
  attemptedAddresses.push(address);
  return address;
}

/**
 * One request to the auth service as an unauthenticated caller: the anon key and nothing else.
 * @param request - The test's API request context.
 * @param route - The route under `/auth/v1/`.
 * @param data - The JSON body.
 */
function postAsAnon(request: APIRequestContext, route: string, data: Record<string, unknown>): Promise<APIResponse> {
  const key = supabaseAnonKey();
  return request.post(`${SUPABASE_URL}/auth/v1/${route}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    data
  });
}

/** Removes any user an attempt created. A refusal creates none, so on a green run this deletes nothing. */
async function removeAttemptedUsers(): Promise<void> {
  const client = new SupabaseAdminClient();
  for (const address of attemptedAddresses.splice(0)) await client.unregisterCandidate(address);
}

test.describe('public sign-up is closed', () => {
  test.afterEach(removeAttemptedUsers);

  test('an address cannot become an account without the service role: public sign-up is refused', async ({
    request
  }) => {
    const address = freshAddress();

    // A password the service's own policy accepts, so that the refusal is the only reason no user is created.
    const response = await postAsAnon(request, 'signup', { email: address, password: `${crypto.randomUUID()}-Aa1!` });

    expect(response.status()).toBe(422);
    expect((await response.json()).error_code).toBe(SIGNUP_DISABLED);
    expect(await new SupabaseAdminClient().getAuthUserByEmail(address)).toBeUndefined();
  });

  test('an address cannot become an account without the service role: a one-time-password request creates no user', async ({
    request
  }) => {
    const address = freshAddress();

    const response = await postAsAnon(request, 'otp', { email: address, create_user: true });

    expect(response.status()).toBe(422);
    expect((await response.json()).error_code).toBe(SIGNUP_DISABLED);
    expect(await new SupabaseAdminClient().getAuthUserByEmail(address)).toBeUndefined();
  });
});
