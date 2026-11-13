/**
 * The server load of an entity's preview, driven directly with a fake request context. The helper that answers whether the preview is open is replaced, so each case sets its answer; the helper's own cases are in `$lib/server/contestant/previewGate.test.ts`.
 *
 * What this file holds:
 *
 * 1. **A gated parent decides nothing.** The load resolves an empty object, asks nothing and redirects nowhere, so the gate's view is shown at the URL the user asked for.
 * 2. **A parent with no entity data decides nothing.** The load resolves an empty object and asks nothing, so the entity layout's own error view is shown at the URL the user asked for.
 * 3. **A closed preview is redirected to the entity's own home**, with status 307, a candidate and an organization alike, in the locale of the request.
 * 4. **An open preview is served, and so is one the helper gives no answer for.**
 * 5. **What the helper is asked with.** The entity and the question data of the parent, the locale of the request, and a provider built over this request's `fetch` and `locals`.
 * 6. **Nobody is signed out.** The fake locals carry a sign-out spy the load has no reason to reach: every case asserts it was never called.
 *
 * The runtime's `getLocale` answers what a case sets, and its `localizeHref` prefixes a path with any locale but the base one, as the application's URL strategy does, so a target names the locale it was built in.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

const { createDataProvider, getLocale, isPreviewOpen, localizeHref } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  getLocale: vi.fn(),
  isPreviewOpen: vi.fn(),
  localizeHref: (href: string, options?: { locale?: string }) =>
    options?.locale && options.locale !== 'en' ? `/${options.locale}${href}` : href
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getLocale,
  localizeHref
}));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));
vi.mock('$lib/server/contestant/previewGate', () => ({ isPreviewOpen }));

/** The generated event type names this route's own id; the erased signature below is the surface the load touches, with the locals it must leave alone. */
type FakeEvent = {
  fetch: typeof fetch;
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

/** The provider the replaced factory hands the load. */
const DATA_PROVIDER = { name: 'the provider of this request' };

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
 */
function parentWith(type: string, id: string) {
  return {
    gate: null,
    user: USER,
    entities: [{ type, id, confirmed: true }],
    questionData: QUESTION_DATA,
    contestantUserData: { entity: { type, id, answers: {} }, nominations: [NOMINATION] }
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
    fetch: vi.fn() as unknown as typeof fetch,
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
  createDataProvider.mockReturnValue(DATA_PROVIDER);
  isPreviewOpen.mockResolvedValue(true);
  signOut.mockResolvedValue({ error: null });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/(nominated)/preview/+page.server.ts — a parent that decides nothing', () => {
  it.each(ENTITIES)(
    'resolves an empty object and asks nothing for a user who must pass a gate (%s)',
    async (type, id) => {
      // A closed answer would redirect, were the helper asked.
      isPreviewOpen.mockResolvedValue(false);

      const data = await runLoad(makeEvent(type, id, GATED_PARENT));

      expect(data).toEqual({});
      expect(isPreviewOpen).not.toHaveBeenCalled();
      expect(createDataProvider).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    }
  );

  it.each(ENTITIES)(
    'resolves an empty object and asks nothing when the parent holds no entity data (%s)',
    async (type, id) => {
      isPreviewOpen.mockResolvedValue(false);
      const parent = { gate: null, user: USER, entities: [{ type, id, confirmed: true }] };

      const data = await runLoad(makeEvent(type, id, parent));

      expect(data).toEqual({});
      expect(isPreviewOpen).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    }
  );
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/(nominated)/preview/+page.server.ts — a closed preview', () => {
  it.each(ENTITIES)("redirects with 307 to the entity's own home (%s)", async (type, id) => {
    isPreviewOpen.mockResolvedValue(false);

    const redirected = await redirectOf(makeEvent(type, id, parentWith(type, id)));

    expect(redirected).toMatchObject({ status: 307, location: `/contestant/${type}/${id}` });
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each(['fi', 'sv'])("builds the home's path in the locale of the request (%s)", async (locale) => {
    getLocale.mockReturnValue(locale);
    isPreviewOpen.mockResolvedValue(false);

    const redirected = await redirectOf(makeEvent('candidate', CANDIDATE_ID, parentWith('candidate', CANDIDATE_ID)));

    expect(redirected).toMatchObject({ status: 307, location: `/${locale}/contestant/candidate/${CANDIDATE_ID}` });
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/(nominated)/preview/+page.server.ts — a preview that is served', () => {
  it.each(ENTITIES)('resolves an empty object and redirects nowhere for an open preview (%s)', async (type, id) => {
    isPreviewOpen.mockResolvedValue(true);

    const data = await runLoad(makeEvent(type, id, parentWith(type, id)));

    expect(data).toEqual({});
    expect(isPreviewOpen).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each(ENTITIES)(
    'resolves an empty object and redirects nowhere when the helper gives no answer (%s)',
    async (type, id) => {
      isPreviewOpen.mockResolvedValue(undefined);

      const data = await runLoad(makeEvent(type, id, parentWith(type, id)));

      expect(data).toEqual({});
      expect(isPreviewOpen).toHaveBeenCalledTimes(1);
      expect(signOut).not.toHaveBeenCalled();
    }
  );
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/(nominated)/preview/+page.server.ts — what the helper is asked with', () => {
  it("hands it the parent's entity and question data, the request's locale and a provider built over this request", async () => {
    getLocale.mockReturnValue('fi');
    const parent = parentWith('organization', ORGANIZATION_ID);
    const event = makeEvent('organization', ORGANIZATION_ID, parent);

    await runLoad(event);

    expect(createDataProvider).toHaveBeenCalledExactlyOnceWith({ fetch: event.fetch, locals: event.locals });
    expect(isPreviewOpen).toHaveBeenCalledTimes(1);
    const [input] = isPreviewOpen.mock.calls[0];
    expect(Object.keys(input).sort()).toEqual(['dataProvider', 'locale', 'questionData', 'userData']);
    expect(input.dataProvider).toBe(DATA_PROVIDER);
    expect(input.locale).toBe('fi');
    expect(input.userData).toBe(parent.contestantUserData);
    expect(input.questionData).toBe(parent.questionData);
    expect(signOut).not.toHaveBeenCalled();
  });
});
