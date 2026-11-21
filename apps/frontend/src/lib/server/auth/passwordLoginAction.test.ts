/**
 * The shared password sign-in action, driven directly with a fake request context, for each app's configuration.
 *
 * The sign-in helper, the data-writer factory and the logout-count withdrawal are replaced, so no client is built and nothing is signed in. What the action adds to the helper is asserted here: what it hands over, what it answers for each of the helper's refusals, and where it redirects. What the withdrawal removes is asserted in its own test file.
 *
 * What this file holds:
 *
 * 1. **One call of the helper, and nothing asked of the request before it** — with the address and the password as posted, the configured grant shapes and log label, this request's own auth surface, and the claim and the read of the project's grants on one writer built for this request.
 * 2. **One answer for every refusal** — a failure whose status is the helper's and whose data holds that status and nothing else.
 * 3. **The redirect** — to the configured home in the request's locale, or to a `redirectTo` the validator accepts; a refused one falls back to the home.
 * 4. **The logout count** — withdrawn with the request's event once the helper has admitted the session, before the redirect, and kept on each of the helper's refusals.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_GRANTS, CONTESTANT_GRANTS } from '$lib/auth';
import { buildRoute } from '$lib/routes';
import { passwordLoginAction } from './passwordLoginAction';

const { claimInvitations, createDataWriter, getProjectGrants, passwordLogin, withdrawLogoutDeadline } = vi.hoisted(
  () => ({
    claimInvitations: vi.fn(),
    createDataWriter: vi.fn(),
    getProjectGrants: vi.fn(),
    passwordLogin: vi.fn(),
    withdrawLogoutDeadline: vi.fn()
  })
);

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/auth', async (importOriginal) => ({ ...(await importOriginal<object>()), passwordLogin }));
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/server/auth/logoutDeadline', () => ({ withdrawLogoutDeadline }));

/** What the action touches of the request. */
type FakeEvent = {
  request: { formData: () => Promise<FormData> };
  fetch: typeof fetch;
  locals: {
    currentLocale: string;
    safeGetSession: ReturnType<typeof vi.fn>;
    supabase: { auth: { signInWithPassword: ReturnType<typeof vi.fn> } };
  };
};

const fakeFetch = vi.fn() as unknown as typeof fetch;
/** The auth surface of the request's own client, which every fake event carries. */
const requestAuth = { signInWithPassword: vi.fn() };

const POSTED_ADDRESS = '  Someone@Example.test ';
const POSTED_PASSWORD = ' a pass phrase ';

/** Each refusal the helper can answer. */
const REFUSALS = [
  { status: 400, reason: 'invalidCredentials' },
  { status: 403, reason: 'grantNotAllowed' },
  { status: 500, reason: 'noSession' }
] as const;

/**
 * A request posting the sign-in form. Every call builds its own objects.
 * @param fields - The posted fields, added to the address and the password.
 * @param locale - The request's locale.
 * @returns The fake event.
 */
function makeEvent({
  fields = {},
  locale = 'en'
}: { fields?: Record<string, string>; locale?: string } = {}): FakeEvent {
  const data = new FormData();
  for (const [name, value] of Object.entries({ email: POSTED_ADDRESS, password: POSTED_PASSWORD, ...fields }))
    data.set(name, value);
  return {
    request: { formData: async () => data },
    fetch: fakeFetch,
    locals: {
      currentLocale: locale,
      safeGetSession: vi.fn(),
      supabase: { auth: requestAuth }
    }
  };
}

/** What the helper was handed on its one call. */
function handedOver(): {
  context: {
    auth: unknown;
    getSession: unknown;
    claimInvitations: () => unknown;
    getProjectGrants: () => unknown;
  };
  email: unknown;
  password: unknown;
  allowedGrants: unknown;
  logLabel: unknown;
} {
  expect(passwordLogin).toHaveBeenCalledTimes(1);
  return passwordLogin.mock.calls[0][0];
}

beforeEach(() => {
  passwordLogin.mockResolvedValue({ ok: true });
  createDataWriter.mockReturnValue({ claimInvitations, getProjectGrants });
  claimInvitations.mockResolvedValue({ claimed: [], skipped: [] });
  getProjectGrants.mockResolvedValue([]);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe.each([
  { allowedGrants: ADMIN_GRANTS, home: 'AdminAppHome', logLabel: 'Admin login' },
  { allowedGrants: CONTESTANT_GRANTS, home: 'ContestantAppHome', logLabel: 'Contestant sign-in' }
] as const)('passwordLoginAction for $home', (options) => {
  const signIn = passwordLoginAction(options) as unknown as (event: FakeEvent) => Promise<unknown>;

  /** The redirect the action threw. */
  async function redirectOf(event: FakeEvent): Promise<{ status: number; location: string }> {
    const thrown = await signIn(event).then(
      () => undefined,
      (error: unknown) => error
    );
    expect(thrown, 'the action should redirect').toBeDefined();
    return thrown as { status: number; location: string };
  }

  describe('the one call of the sign-in helper', () => {
    it('hands over the address and the password exactly as posted', async () => {
      await signIn(makeEvent()).catch(() => undefined);
      const { email, password } = handedOver();
      expect(email).toBe(POSTED_ADDRESS);
      expect(password).toBe(POSTED_PASSWORD);
    });

    it('hands over the configured grant shapes and log label', async () => {
      await signIn(makeEvent()).catch(() => undefined);
      const { allowedGrants, logLabel } = handedOver();
      expect(allowedGrants).toBe(options.allowedGrants);
      expect(logLabel).toBe(options.logLabel);
    });

    it("hands over this request's own auth surface and session reader", async () => {
      const event = makeEvent();
      await signIn(event).catch(() => undefined);
      const { context } = handedOver();
      expect(context.auth).toBe(requestAuth);
      expect(context.getSession).toBe(event.locals.safeGetSession);
    });

    it("hands over a claim that runs on a writer built for this request's fetch and locals", async () => {
      const event = makeEvent();
      await signIn(event).catch(() => undefined);
      const { context } = handedOver();
      expect(createDataWriter, 'no writer is built until the helper claims').not.toHaveBeenCalled();
      await context.claimInvitations();
      expect(createDataWriter).toHaveBeenCalledTimes(1);
      expect(createDataWriter).toHaveBeenCalledWith({ fetch: event.fetch, locals: event.locals });
      expect(claimInvitations).toHaveBeenCalledTimes(1);
    });

    it('hands over a read of the grants that reach this project, on the same writer as the claim', async () => {
      const event = makeEvent();
      await signIn(event).catch(() => undefined);
      const { context } = handedOver();
      await context.claimInvitations();
      await context.getProjectGrants();
      expect(createDataWriter, 'one writer serves the claim and the read of the grants').toHaveBeenCalledTimes(1);
      expect(getProjectGrants).toHaveBeenCalledTimes(1);
    });

    it('is made before anything else is asked of the request', async () => {
      const event = makeEvent();
      const before = { writers: -1, sessionReads: -1, signIns: -1 };
      passwordLogin.mockImplementation(async () => {
        before.writers = createDataWriter.mock.calls.length;
        before.sessionReads = event.locals.safeGetSession.mock.calls.length;
        before.signIns = requestAuth.signInWithPassword.mock.calls.length;
        return { ok: false, status: 400, reason: 'invalidCredentials' };
      });
      await signIn(event);
      expect(before).toEqual({ writers: 0, sessionReads: 0, signIns: 0 });
      expect(event.locals.safeGetSession).not.toHaveBeenCalled();
      expect(requestAuth.signInWithPassword).not.toHaveBeenCalled();
      expect(createDataWriter).not.toHaveBeenCalled();
    });
  });

  describe('a refusal', () => {
    it.each(REFUSALS)(
      "is answered with a failure of the helper's status $status, holding that status and nothing else",
      async ({ status, reason }) => {
        passwordLogin.mockResolvedValue({ ok: false, status, reason });
        const answer = await signIn(makeEvent({ fields: { redirectTo: 'contestant/help' } }));
        expect(answer).toMatchObject({ status });
        expect((answer as { data: unknown }).data).toEqual({ status });
      }
    );

    it('calls the helper once', async () => {
      passwordLogin.mockResolvedValue({ ok: false, status: 400, reason: 'invalidCredentials' });
      await signIn(makeEvent());
      expect(passwordLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('a sign-in', () => {
    it.each(['en', 'fi'])("redirects with 303 to the configured home in the request's locale %s", async (locale) => {
      const redirect = await redirectOf(makeEvent({ locale }));
      expect(redirect.status).toBe(303);
      expect(redirect.location).toBe(buildRoute({ route: options.home, locale }));
    });

    it('redirects to an empty redirectTo as to none', async () => {
      const redirect = await redirectOf(makeEvent({ fields: { redirectTo: '' } }));
      expect(redirect.location).toBe(buildRoute({ route: options.home, locale: 'en' }));
    });

    it("redirects to a relative app path behind the request's locale", async () => {
      const redirect = await redirectOf(makeEvent({ locale: 'fi', fields: { redirectTo: 'contestant/help?tab=a' } }));
      expect(redirect.status).toBe(303);
      expect(redirect.location).toBe('/fi/contestant/help?tab=a');
    });

    it.each(['//evil.example/contestant', 'https://evil.example', '/contestant', '../admin', 'contestant\\help'])(
      'falls back to the home for the refused redirectTo %s',
      async (redirectTo) => {
        const redirect = await redirectOf(makeEvent({ fields: { redirectTo } }));
        expect(redirect.status).toBe(303);
        expect(redirect.location).toBe(buildRoute({ route: options.home, locale: 'en' }));
      }
    );
  });

  describe('the logout count', () => {
    /** The order in which the withdrawal and the helper were called. */
    function recordOrder(outcome: { ok: true } | { ok: false; status: number; reason: string }): Array<string> {
      const order: Array<string> = [];
      withdrawLogoutDeadline.mockImplementation(() => {
        order.push('withdrawLogoutDeadline');
      });
      passwordLogin.mockImplementation(async () => {
        order.push('passwordLogin');
        return outcome;
      });
      return order;
    }

    it("is withdrawn with the request's event once the helper has admitted the session, before the redirect", async () => {
      const order = recordOrder({ ok: true });
      const event = makeEvent();
      const redirected = await signIn(event).catch((e: unknown) => e);
      expect(withdrawLogoutDeadline).toHaveBeenCalledTimes(1);
      expect(withdrawLogoutDeadline.mock.calls[0][0]).toBe(event);
      expect(order).toEqual(['passwordLogin', 'withdrawLogoutDeadline']);
      expect(redirected).toMatchObject({ status: 303 });
    });

    it.each(REFUSALS)(
      'is not withdrawn when the helper refuses the sign-in with $status $reason',
      async ({ status, reason }) => {
        const order = recordOrder({ ok: false, status, reason });
        const answer = await signIn(makeEvent());
        expect(answer).toMatchObject({ status });
        expect(withdrawLogoutDeadline).not.toHaveBeenCalled();
        expect(order).toEqual(['passwordLogin']);
      }
    );
  });
});
