/**
 * The server load and the server action of the screen that signs in the holder of a claimed registration code, each driven directly with a fake request context.
 *
 * The code sign-in helper, the data-writer factory and the data-provider factory are replaced, so no client is built and nothing is signed in. The guard of the registration addresses is the real one, over settings each case controls. What the action adds to the helper is asserted here: what it asks first, what it hands over, what it answers for each refusal, and where it redirects.
 *
 * What this file holds:
 *
 * 1. **The load** — the screen is served only where registration offers the code mode, and leads to the login route otherwise.
 * 2. **The guard over the action** — where registration does not offer the code mode the post is refused before the helper is called, in the form of every other refusal.
 * 3. **One call of the helper, and nothing of the session before it** — with the code and the password of the posted form, the Contestant App's grant shapes, this request's own auth surface, and a claim and a code sign-in that run on one writer built for this request.
 * 4. **One answer for every refusal** — a failure whose status is the helper's and whose data holds that status and nothing else.
 * 5. **The redirect** — to the app's home in the request's locale, whatever else the request carries.
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTESTANT_GRANTS } from '$lib/auth';
import { buildRoute } from '$lib/routes';
import { actions, load } from './+page.server';

const {
  claimInvitations,
  createDataProvider,
  createDataWriter,
  createSupabaseAnonClient,
  getAppSettings,
  invitationCodeLogin,
  signInWithInvitationCode
} = vi.hoisted(() => ({
  claimInvitations: vi.fn(),
  createDataProvider: vi.fn(),
  createDataWriter: vi.fn(),
  createSupabaseAnonClient: vi.fn(),
  getAppSettings: vi.fn(),
  invitationCodeLogin: vi.fn(),
  signInWithInvitationCode: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/auth', async (importOriginal) => ({ ...(await importOriginal<object>()), invitationCodeLogin }));
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider, createSupabaseAnonClient }));

/** What the action touches of the request. The generated event type names this route's own id and locals. */
type FakeEvent = {
  request: { formData: () => Promise<FormData> };
  fetch: typeof fetch;
  locals: {
    currentLocale: string;
    safeGetSession: ReturnType<typeof vi.fn>;
    supabase: { auth: { setSession: ReturnType<typeof vi.fn> } };
  };
  url: URL;
};
type ActionFn = (event: FakeEvent) => Promise<unknown>;
const signIn = actions.default as unknown as ActionFn;
const runLoad = load as unknown as (event: Pick<FakeEvent, 'fetch' | 'locals'>) => Promise<unknown>;

/** Settings of a project that serves candidates and allows them the given registration modes. */
function settingsFor(modes: Array<string>, { answersLocked = false }: { answersLocked?: boolean } = {}) {
  return {
    access: { answersLocked },
    contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: modes, organization: [] } }
  };
}

/** The settings under which registration does not offer the code mode. */
const CODE_MODE_NOT_OFFERED = [
  ['an empty registration matrix', settingsFor([])],
  ['the email mode alone', settingsFor(['email'])],
  ['the code mode while answers are locked', settingsFor(['code'], { answersLocked: true })]
] as const;

/** What the helper was handed on its one call. */
type HandedOver = {
  context: {
    auth: unknown;
    getSession: unknown;
    claimInvitations: () => Promise<unknown>;
    signInWithInvitationCode: (credentials: { code: string; password: string }) => Promise<boolean>;
  };
  code: unknown;
  password: unknown;
  allowedGrants: unknown;
  logLabel: unknown;
};

const fakeFetch = vi.fn() as unknown as typeof fetch;
/** The auth surface of the request's own client, which every fake event carries. */
const requestAuth = { setSession: vi.fn() };

const POSTED_CODE = '  a posted code ';
const POSTED_PASSWORD = ' a pass phrase ';
/** A code the request's address carries, which the action must not read. */
const CODE_IN_ADDRESS = 'a-code-in-the-address';

/**
 * A request posting the sign-in form. Every call builds its own objects.
 * @param fields - The posted fields, added to the code and the password.
 * @param locale - The request's locale.
 * @param search - The query string of the request's address.
 * @returns The fake event.
 */
function makeEvent({
  fields = {},
  locale = 'en',
  search = ''
}: { fields?: Record<string, string>; locale?: string; search?: string } = {}): FakeEvent {
  const data = new FormData();
  for (const [name, value] of Object.entries({ code: POSTED_CODE, password: POSTED_PASSWORD, ...fields }))
    data.set(name, value);
  return {
    request: { formData: async () => data },
    fetch: fakeFetch,
    locals: {
      currentLocale: locale,
      safeGetSession: vi.fn(),
      supabase: { auth: requestAuth }
    },
    url: new URL(`http://localhost/${locale}/contestant/register/sign-in${search}`)
  };
}

function handedOver(): HandedOver {
  expect(invitationCodeLogin).toHaveBeenCalledTimes(1);
  return invitationCodeLogin.mock.calls[0][0];
}

/** The redirect the action threw. */
async function redirectOf(event: FakeEvent): Promise<{ status: number; location: string }> {
  const thrown = await signIn(event).then(
    () => undefined,
    (error: unknown) => error
  );
  expect(thrown, 'the action should redirect').toBeDefined();
  return thrown as { status: number; location: string };
}

beforeEach(() => {
  createDataProvider.mockReturnValue({ getAppSettings });
  getAppSettings.mockResolvedValue(settingsFor(['code']));
  invitationCodeLogin.mockResolvedValue({ ok: true });
  createDataWriter.mockReturnValue({ claimInvitations, signInWithInvitationCode });
  claimInvitations.mockResolvedValue({ claimed: [], skipped: [], passwordSet: true });
  signInWithInvitationCode.mockResolvedValue({ type: 'success' });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('the load', () => {
  it.each(CODE_MODE_NOT_OFFERED)('leads to the login route with 303 under %s', async (_name, settings) => {
    getAppSettings.mockResolvedValue(settings);
    const thrown = await runLoad(makeEvent()).then(
      () => undefined,
      (error: unknown) => error
    );
    expect(thrown).toMatchObject({ status: 303, location: buildRoute({ route: 'ContestantAppLogin', locale: 'en' }) });
  });

  it('serves the screen and returns nothing where the code mode is offered', async () => {
    expect(await runLoad(makeEvent())).toBeUndefined();
  });
});

describe('the guard over the action', () => {
  it.each(CODE_MODE_NOT_OFFERED)(
    'refuses the post under %s before the helper is called, and builds no writer and reads no session',
    async (_name, settings) => {
      getAppSettings.mockResolvedValue(settings);
      const event = makeEvent();
      const answer = await signIn(event);

      expect(answer).toMatchObject({ status: 400 });
      expect((answer as { data: unknown }).data).toEqual({ status: 400 });
      expect(invitationCodeLogin).not.toHaveBeenCalled();
      expect(createDataWriter).not.toHaveBeenCalled();
      expect(event.locals.safeGetSession).not.toHaveBeenCalled();
      expect(requestAuth.setSession).not.toHaveBeenCalled();
    }
  );

  it('refuses the post when the settings cannot be read', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    getAppSettings.mockRejectedValue(new Error('unreachable'));
    const answer = await signIn(makeEvent());
    expect(answer).toMatchObject({ status: 400 });
    expect(invitationCodeLogin).not.toHaveBeenCalled();
  });

  it('answers its refusal exactly as a wrong password is answered', async () => {
    invitationCodeLogin.mockResolvedValue({ ok: false, status: 400, reason: 'invalidCredentials' });
    const wrongPassword = await signIn(makeEvent());

    getAppSettings.mockResolvedValue(settingsFor([]));
    const refused = await signIn(makeEvent());
    expect(refused).toEqual(wrongPassword);
  });

  it('does not redirect: the refusal is an answer to the post, with no target taken from the request', async () => {
    getAppSettings.mockResolvedValue(settingsFor([]));
    const answer = await signIn(makeEvent({ search: '?redirectTo=contestant%2Fhelp', fields: { redirectTo: 'x' } }));
    expect(answer).toMatchObject({ status: 400 });
    expect(answer).not.toHaveProperty('location');
  });

  it('reads the settings once, with an anonymous client, before the helper is called', async () => {
    const order = new Array<string>();
    getAppSettings.mockImplementation(async () => {
      order.push('settings');
      return settingsFor(['code']);
    });
    invitationCodeLogin.mockImplementation(async () => {
      order.push('helper');
      return { ok: true };
    });
    await signIn(makeEvent()).catch(() => undefined);
    expect(order).toEqual(['settings', 'helper']);
    expect(createSupabaseAnonClient.mock.calls).toEqual([[{ fetch: fakeFetch }]]);
  });
});

describe('the one call of the code sign-in helper', () => {
  it('hands over the code and the password of the posted form, exactly as posted', async () => {
    await signIn(makeEvent()).catch(() => undefined);
    const { code, password } = handedOver();
    expect(code).toBe(POSTED_CODE);
    expect(password).toBe(POSTED_PASSWORD);
  });

  it("takes the code from the form's body and never from the request's address", async () => {
    await signIn(makeEvent({ search: `?code=${CODE_IN_ADDRESS}` })).catch(() => undefined);
    expect(handedOver().code).toBe(POSTED_CODE);
  });

  it('hands over the grant shapes of the Contestant App and names the entry point', async () => {
    await signIn(makeEvent()).catch(() => undefined);
    const { allowedGrants, logLabel } = handedOver();
    expect(allowedGrants).toBe(CONTESTANT_GRANTS);
    expect(logLabel).toBe('Contestant code sign-in');
  });

  it("hands over this request's own auth surface and session reader", async () => {
    const event = makeEvent();
    await signIn(event).catch(() => undefined);
    const { context } = handedOver();
    expect(context.auth).toBe(requestAuth);
    expect(context.getSession).toBe(event.locals.safeGetSession);
  });

  it("hands over a code sign-in that goes through a writer built for this request's fetch and locals", async () => {
    const event = makeEvent();
    await signIn(event).catch(() => undefined);
    const { context } = handedOver();
    expect(createDataWriter, 'no writer is built until the helper signs in').not.toHaveBeenCalled();
    const credentials = { code: 'the code the helper passes', password: 'the password the helper passes' };
    await context.signInWithInvitationCode(credentials);
    expect(createDataWriter).toHaveBeenCalledTimes(1);
    expect(createDataWriter).toHaveBeenCalledWith({ fetch: event.fetch, locals: event.locals });
    expect(signInWithInvitationCode).toHaveBeenCalledTimes(1);
    expect(signInWithInvitationCode).toHaveBeenCalledWith(credentials);
  });

  it.each([
    ['a session was established', { type: 'success' }, true],
    ['the sign-in was refused', { type: 'failure' }, false]
  ])("answers the helper whether the writer's call succeeded: %s", async (_name, answer, established) => {
    signInWithInvitationCode.mockResolvedValue(answer);
    await signIn(makeEvent()).catch(() => undefined);
    const { context } = handedOver();
    expect(await context.signInWithInvitationCode({ code: 'c', password: 'p' })).toBe(established);
  });

  it('lets a code sign-in that throws reach the helper, which answers it as a refusal', async () => {
    signInWithInvitationCode.mockRejectedValue(new Error('the request could not be made'));
    await signIn(makeEvent()).catch(() => undefined);
    const { context } = handedOver();
    await expect(context.signInWithInvitationCode({ code: 'c', password: 'p' })).rejects.toThrow(
      'the request could not be made'
    );
  });

  it('hands over a claim that runs on the same writer as the code sign-in', async () => {
    const event = makeEvent();
    await signIn(event).catch(() => undefined);
    const { context } = handedOver();
    await context.signInWithInvitationCode({ code: 'c', password: 'p' });
    await context.claimInvitations();
    expect(createDataWriter, 'one writer serves the sign-in and the claim').toHaveBeenCalledTimes(1);
    expect(claimInvitations).toHaveBeenCalledTimes(1);
  });

  it('is made before a writer is built or anything is asked of the session', async () => {
    const event = makeEvent();
    const before = { writers: -1, sessionReads: -1, sessionWrites: -1 };
    invitationCodeLogin.mockImplementation(async () => {
      before.writers = createDataWriter.mock.calls.length;
      before.sessionReads = event.locals.safeGetSession.mock.calls.length;
      before.sessionWrites = requestAuth.setSession.mock.calls.length;
      return { ok: false, status: 400, reason: 'invalidCredentials' };
    });
    await signIn(event);
    expect(before).toEqual({ writers: 0, sessionReads: 0, sessionWrites: 0 });
    expect(event.locals.safeGetSession).not.toHaveBeenCalled();
    expect(requestAuth.setSession).not.toHaveBeenCalled();
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
      invitationCodeLogin.mockResolvedValue({ ok: false, status, reason });
      const answer = await signIn(makeEvent());
      expect(answer).toMatchObject({ status });
      expect((answer as { data: unknown }).data).toEqual({ status });
    }
  );

  it('calls the helper once', async () => {
    invitationCodeLogin.mockResolvedValue({ ok: false, status: 400, reason: 'invalidCredentials' });
    await signIn(makeEvent());
    expect(invitationCodeLogin).toHaveBeenCalledTimes(1);
  });
});

describe('a sign-in', () => {
  it.each(['en', 'fi'])("redirects with 303 to the app's home in the request's locale %s", async (locale) => {
    const redirect = await redirectOf(makeEvent({ locale }));
    expect(redirect.status).toBe(303);
    expect(redirect.location).toBe(buildRoute({ route: 'ContestantAppHome', locale }));
  });

  it.each([
    ['a posted field', { fields: { redirectTo: 'contestant/help' } }],
    ['the address', { search: '?redirectTo=contestant%2Fhelp' }],
    ['a posted field that names another site', { fields: { redirectTo: 'https://evil.example' } }]
  ])('redirects to the home whatever redirect target %s carries', async (_name, given) => {
    const redirect = await redirectOf(makeEvent(given));
    expect(redirect.status).toBe(303);
    expect(redirect.location).toBe(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
  });
});
