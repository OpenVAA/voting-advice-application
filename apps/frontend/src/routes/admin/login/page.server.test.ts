/**
 * The Admin App login page's server module: the apps' shared login load, and the shared password sign-in action configured for the Admin App.
 *
 * The sign-in helper and the logout-count withdrawal are replaced, so nothing is signed in. What the shared load and action do is asserted in `$lib/server/auth/accountLoads.test.ts` and `$lib/server/auth/passwordLoginAction.test.ts`; this file asserts the Admin App's configuration of them.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_GRANTS } from '$lib/auth';
import { buildRoute } from '$lib/routes';
import { signedOutReasonLoad } from '$lib/server/auth/accountLoads';
import * as server from './+page.server';

const { passwordLogin, withdrawLogoutDeadline } = vi.hoisted(() => ({
  passwordLogin: vi.fn(),
  withdrawLogoutDeadline: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/auth', async (importOriginal) => ({ ...(await importOriginal<object>()), passwordLogin }));
vi.mock('$lib/server/auth/logoutDeadline', () => ({ withdrawLogoutDeadline }));
// The action builds a data writer only inside the calls it hands the helper, which the replaced helper never makes.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter: vi.fn() }));

afterEach(() => {
  vi.resetAllMocks();
});

/** What the action touches of the request. */
type FakeActionEvent = {
  request: { formData: () => Promise<FormData> };
  fetch: typeof fetch;
  locals: { currentLocale: string; safeGetSession: () => Promise<unknown>; supabase: { auth: object } };
};
const signIn = server.actions.default as unknown as (event: FakeActionEvent) => Promise<unknown>;

/** A request posting the login form. */
function postedLogin(): FakeActionEvent {
  const data = new FormData();
  data.set('email', 'admin@example.test');
  data.set('password', 'a pass phrase');
  return {
    request: { formData: async () => data },
    fetch: vi.fn() as unknown as typeof fetch,
    locals: { currentLocale: 'en', safeGetSession: vi.fn(), supabase: { auth: {} } }
  };
}

it('loads with the apps’ shared login load', () => {
  expect(server.load).toBe(signedOutReasonLoad);
});

describe('the sign-in action', () => {
  it('hands the helper the Admin App’s grant shapes and log label', async () => {
    passwordLogin.mockResolvedValue({ ok: true });
    await signIn(postedLogin()).catch(() => undefined);
    expect(passwordLogin).toHaveBeenCalledTimes(1);
    expect(passwordLogin.mock.calls[0][0]).toMatchObject({ allowedGrants: ADMIN_GRANTS, logLabel: 'Admin login' });
  });

  it('redirects a sign-in to the Admin App’s home', async () => {
    passwordLogin.mockResolvedValue({ ok: true });
    const redirected = await signIn(postedLogin()).catch((e: unknown) => e);
    expect(redirected).toMatchObject({ status: 303, location: buildRoute({ route: 'AdminAppHome', locale: 'en' }) });
  });

  it.each([400, 403, 500])('answers a refusal with %s with a failure whose data holds the status', async (status) => {
    passwordLogin.mockResolvedValue({ ok: false, status, reason: 'invalidCredentials' });
    const answer = await signIn(postedLogin());
    expect(answer).toMatchObject({ status, data: { status } });
    expect(withdrawLogoutDeadline).not.toHaveBeenCalled();
  });
});
