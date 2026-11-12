/**
 * The sign-in screen's server action, driven directly with a fake request context.
 *
 * The sign-in helper and the data-writer factory are replaced, so no client is built and nothing is signed in. What the action adds to the helper is asserted here: what it hands over, what it answers for each of the helper's refusals, and where it redirects.
 *
 * What this file holds:
 *
 * 1. **One call of the helper, and nothing before it** — with the address and the password as posted, the Contestant App's grant shapes, this request's own auth surface and the claim on this request's writer.
 * 2. **One answer for every refusal** — a failure whose status is the helper's and whose data holds that status and nothing else.
 * 3. **The redirect** — to the app's home in the request's locale, or to a `redirectTo` the validator accepts; a refused one falls back to the home.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTESTANT_GRANTS } from '$lib/auth';
import { buildRoute } from '$lib/routes';
import { actions } from './+page.server';

const { claimInvitations, createDataWriter, passwordLogin } = vi.hoisted(() => ({
  claimInvitations: vi.fn(),
  createDataWriter: vi.fn(),
  passwordLogin: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/auth', async (importOriginal) => ({ ...(await importOriginal<object>()), passwordLogin }));
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));

/** What the action touches of the request. The generated event type names this route's own id and locals. */
type FakeEvent = {
  request: { formData: () => Promise<FormData> };
  fetch: typeof fetch;
  locals: {
    currentLocale: string;
    safeGetSession: ReturnType<typeof vi.fn>;
    supabase: { auth: { signInWithPassword: ReturnType<typeof vi.fn> } };
  };
};
type ActionFn = (event: FakeEvent) => Promise<unknown>;
const signIn = actions.default as unknown as ActionFn;

const fakeFetch = vi.fn() as unknown as typeof fetch;
/** The auth surface of the request's own client, which every fake event carries. */
const requestAuth = { signInWithPassword: vi.fn() };

const POSTED_ADDRESS = '  Someone@Example.test ';
const POSTED_PASSWORD = ' a pass phrase ';

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
  context: { auth: unknown; getSession: unknown; claimInvitations: () => unknown };
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
  createDataWriter.mockReturnValue({ claimInvitations });
  claimInvitations.mockResolvedValue({ claimed: [], skipped: [] });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('the one call of the sign-in helper', () => {
  it('hands over the address and the password exactly as posted', async () => {
    await signIn(makeEvent()).catch(() => undefined);
    const { email, password } = handedOver();
    expect(email).toBe(POSTED_ADDRESS);
    expect(password).toBe(POSTED_PASSWORD);
  });

  it('hands over the grant shapes of the Contestant App and names the entry point', async () => {
    await signIn(makeEvent()).catch(() => undefined);
    const { allowedGrants, logLabel } = handedOver();
    expect(allowedGrants).toBe(CONTESTANT_GRANTS);
    expect(logLabel).toBe('Contestant sign-in');
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
  const REFUSALS = [
    { status: 400, reason: 'invalidCredentials' },
    { status: 403, reason: 'grantNotAllowed' },
    { status: 500, reason: 'noSession' }
  ] as const;

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
  /** The redirect the action threw. */
  async function redirectOf(event: FakeEvent): Promise<{ status: number; location: string }> {
    const thrown = await signIn(event).then(
      () => undefined,
      (error: unknown) => error
    );
    expect(thrown, 'the action should redirect').toBeDefined();
    return thrown as { status: number; location: string };
  }

  it.each(['en', 'fi'])("redirects with 303 to the app's home in the request's locale %s", async (locale) => {
    const redirect = await redirectOf(makeEvent({ locale }));
    expect(redirect.status).toBe(303);
    expect(redirect.location).toBe(buildRoute({ route: 'ContestantAppHome', locale }));
  });

  it('redirects to an empty redirectTo as to none', async () => {
    const redirect = await redirectOf(makeEvent({ fields: { redirectTo: '' } }));
    expect(redirect.location).toBe(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
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
      expect(redirect.location).toBe(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
    }
  );
});
