/**
 * The server load of the route group that holds the pages an entity needs a nomination for, driven directly with a fake request context.
 *
 * What this file holds:
 *
 * 1. **A gated parent decides nothing.** The load resolves an empty object and redirects nowhere, so the gate's view is shown at the URL the user asked for.
 * 2. **A parent with no entity data decides nothing.** The load resolves an empty object, so the entity layout's own error view is shown at the URL the user asked for.
 * 3. **An entity with no nomination is redirected to its own home**, with status 307, a candidate and an organization alike, in the locale of the request.
 * 4. **An entity with a nomination is served**, with one nomination and with several, confirmed or not.
 * 5. **Nobody is signed out.** The fake locals carry a sign-out spy the load has no reason to reach: every case asserts it was never called.
 *
 * The runtime's `getLocale` answers what a case sets, and its `localizeHref` prefixes a path with any locale but the base one, as the application's URL strategy does, so a target names the locale it was built in.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+layout.server';

const { getLocale, localizeHref } = vi.hoisted(() => ({
  getLocale: vi.fn(),
  localizeHref: (href: string, options?: { locale?: string }) =>
    options?.locale && options.locale !== 'en' ? `/${options.locale}${href}` : href
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getLocale,
  localizeHref
}));

/** The generated event type names this route's own id; the erased signature below is the surface the load touches, with the locals it must leave alone. */
type FakeEvent = {
  locals: { supabase: { auth: { signOut: (options: { scope: string }) => Promise<{ error: null }> } } };
  params: { entityType: string; entityId: string };
  parent: () => Promise<unknown>;
};
type LoadFn = (event: FakeEvent) => Promise<unknown>;
const runLoad = load as unknown as LoadFn;

const signOut = vi.fn();

const USER = { id: 'user-1', email: 'user@example.test', username: 'user@example.test', role: 'contestant' };

const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';
const ORGANIZATION_ID = '22222222-2222-4222-8222-222222222222';
const QUESTION_DATA = { categories: [], questions: [] };
const NOMINATION = { electionId: 'election-1', constituencyId: 'constituency-1', confirmed: true };
const UNCONFIRMED_NOMINATION = { electionId: 'election-2', constituencyId: 'constituency-1', confirmed: false };

/** The two entity types the app serves, each with the id its URL carries. */
const ENTITIES = [
  ['candidate', CANDIDATE_ID],
  ['organization', ORGANIZATION_ID]
] as const;

/** What the parent loads resolve to for a user who must pass the terms-of-use gate. */
const GATED_PARENT = { gate: 'termsOfUse', user: USER };

/**
 * What the parent loads resolve to for a user past the gates whose entity was read.
 * @param type - The entity's type.
 * @param id - The entity's id.
 * @param nominations - The entity's nominations.
 */
function parentWith(type: string, id: string, nominations: ReadonlyArray<unknown>) {
  return {
    gate: null,
    user: USER,
    entities: [{ type, id, confirmed: true }],
    questionData: QUESTION_DATA,
    contestantUserData: { entity: { type, id }, nominations }
  };
}

/**
 * A request context exposing what the load touches and the locals it must not. Every call builds its own object.
 * @param type - The entity type the URL names.
 * @param id - The entity id the URL names.
 * @param parent - The parent loads' data.
 * @returns The fake event.
 */
function makeEvent(type: string, id: string, parent: unknown): FakeEvent {
  return {
    locals: { supabase: { auth: { signOut } } },
    params: { entityType: type, entityId: id },
    parent: async () => parent
  };
}

/** The redirect the load throws, or `undefined` when it resolves. */
async function redirectOf(event: FakeEvent): Promise<{ status: number; location: string } | undefined> {
  try {
    await runLoad(event);
    return undefined;
  } catch (e) {
    return e as { status: number; location: string };
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  getLocale.mockReturnValue('en');
  signOut.mockResolvedValue({ error: null });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/(nominated)/+layout.server.ts — a parent that decides nothing', () => {
  it.each(ENTITIES)('resolves an empty object for a user who must pass a gate (%s)', async (type, id) => {
    const data = await runLoad(makeEvent(type, id, GATED_PARENT));

    expect(data).toEqual({});
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each(ENTITIES)('resolves an empty object when the parent holds no entity data (%s)', async (type, id) => {
    const parent = { gate: null, user: USER, entities: [{ type, id, confirmed: true }] };

    const data = await runLoad(makeEvent(type, id, parent));

    expect(data).toEqual({});
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/(nominated)/+layout.server.ts — an entity with no nomination', () => {
  it.each(ENTITIES)("redirects with 307 to the entity's own home (%s)", async (type, id) => {
    const redirected = await redirectOf(makeEvent(type, id, parentWith(type, id, [])));

    expect(redirected).toMatchObject({ status: 307, location: `/contestant/${type}/${id}` });
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each(['fi', 'sv'])("builds the home's path in the locale of the request (%s)", async (locale) => {
    getLocale.mockReturnValue(locale);

    const redirected = await redirectOf(
      makeEvent('candidate', CANDIDATE_ID, parentWith('candidate', CANDIDATE_ID, []))
    );

    expect(redirected).toMatchObject({ status: 307, location: `/${locale}/contestant/candidate/${CANDIDATE_ID}` });
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/(nominated)/+layout.server.ts — an entity with a nomination', () => {
  it.each(ENTITIES)('resolves an empty object and redirects nowhere, with one nomination (%s)', async (type, id) => {
    const data = await runLoad(makeEvent(type, id, parentWith(type, id, [NOMINATION])));

    expect(data).toEqual({});
    expect(signOut).not.toHaveBeenCalled();
  });

  it('resolves an empty object with a nomination that is not confirmed, and with several', async () => {
    for (const nominations of [[UNCONFIRMED_NOMINATION], [NOMINATION, UNCONFIRMED_NOMINATION]]) {
      const data = await runLoad(
        makeEvent('candidate', CANDIDATE_ID, parentWith('candidate', CANDIDATE_ID, nominations))
      );

      expect(data).toEqual({});
    }
    expect(signOut).not.toHaveBeenCalled();
  });
});
