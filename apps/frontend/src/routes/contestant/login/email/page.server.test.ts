/**
 * The sign-in screen's server module: a load with no data, and the shared password sign-in action configured for the Contestant App.
 *
 * The sign-in helper and the logout-count withdrawal are replaced, so nothing is signed in. What the shared action does is asserted in `$lib/server/auth/passwordLoginAction.test.ts`; this file asserts the Contestant App's configuration of it.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTESTANT_GRANTS } from '$lib/auth';
import { buildRoute } from '$lib/routes';
import { actions, load } from './+page.server';

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
type FakeEvent = {
  request: { formData: () => Promise<FormData> };
  fetch: typeof fetch;
  locals: { currentLocale: string; safeGetSession: () => Promise<unknown>; supabase: { auth: object } };
};
const signIn = actions.default as unknown as (event: FakeEvent) => Promise<unknown>;

/** A request posting the sign-in form. */
function postedSignIn(locale = 'en'): FakeEvent {
  const data = new FormData();
  data.set('email', 'someone@example.test');
  data.set('password', 'a pass phrase');
  return {
    request: { formData: async () => data },
    fetch: vi.fn() as unknown as typeof fetch,
    locals: { currentLocale: locale, safeGetSession: vi.fn(), supabase: { auth: {} } }
  };
}

it('loads no data', () => {
  expect(load()).toEqual({});
});

describe('the sign-in action', () => {
  it('hands the helper the Contestant App’s grant shapes and log label', async () => {
    passwordLogin.mockResolvedValue({ ok: true });
    await signIn(postedSignIn()).catch(() => undefined);
    expect(passwordLogin).toHaveBeenCalledTimes(1);
    expect(passwordLogin.mock.calls[0][0]).toMatchObject({
      allowedGrants: CONTESTANT_GRANTS,
      logLabel: 'Contestant sign-in'
    });
  });

  it.each(['en', 'fi'])("redirects a sign-in to the Contestant App's home in the locale %s", async (locale) => {
    passwordLogin.mockResolvedValue({ ok: true });
    const redirected = await signIn(postedSignIn(locale)).catch((e: unknown) => e);
    expect(redirected).toMatchObject({ status: 303, location: buildRoute({ route: 'ContestantAppHome', locale }) });
  });

  it.each([400, 403, 500])('answers a refusal with %s with a failure whose data holds the status', async (status) => {
    passwordLogin.mockResolvedValue({ ok: false, status, reason: 'invalidCredentials' });
    const answer = await signIn(postedSignIn());
    expect(answer).toMatchObject({ status, data: { status } });
    expect(withdrawLogoutDeadline).not.toHaveBeenCalled();
  });
});
