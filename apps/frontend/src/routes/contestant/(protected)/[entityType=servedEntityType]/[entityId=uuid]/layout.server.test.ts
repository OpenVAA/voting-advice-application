/**
 * The entity-level server load of the Contestant App's protected tree, driven directly with a fake request context.
 *
 * What this file holds:
 *
 * 1. **The parent decides first.** With a gated parent the load resolves an empty object, builds neither a writer nor a provider, redirects nowhere and signs nobody out. The entity is not read before the parent has resolved.
 * 2. **The entity the URL names is served when the user's list holds it**, a candidate and an organization alike, whether the list holds one entity or several: the load resolves its user data and the question data of the elections it is nominated in.
 * 3. **An entity the user may not edit is refused with one redirect.** An id the list does not hold, a type the list does not hold, an id held under the other type and an entity that has left the list are each redirected to the app root with status 307, with no entity read and no sign-out. A listed entity the read does not find is redirected the same way, and the five redirects are equal in status and location.
 * 4. **A refusal cannot loop.** The root load, given the list that made this load refuse an entity, does not redirect back to that entity.
 * 5. **A failed read of the entity** signs the user out through the sign-out helper and redirects to the login page with `loginFailed`.
 * 6. **An entity with no nomination** is served like any other: nobody is signed out or redirected, no question is read, and the load resolves the entity's user data with question data that holds no category and no question.
 * 7. **The request's locale.** The entity, with its nominations, and the questions are both read in the locale of the request.
 *
 * `$lib/api/dataWriter` and `$lib/api/dataProvider` are replaced, so no Supabase client is built, and the runtime's `getLocale` answers what a case sets. The sign-out helper is the real one, running on the fake locals.
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { load } from './+layout.server';
import { load as rootLoad } from '../../+page.server';
import type { UserEntity } from '$lib/api/base/dataWriter.type';

const { createDataProvider, createDataWriter, getEntityUserData, getLocale, getQuestionData } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  createDataWriter: vi.fn(),
  getEntityUserData: vi.fn(),
  getLocale: vi.fn(),
  getQuestionData: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));
// The locale the request resolved to is whatever a case makes the runtime answer; everything else of the runtime is the shared stub.
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({ ...(await importOriginal<object>()), getLocale }));

const APP_ROOT = '/contestant';
const LOGIN_FAILED_ROUTE = buildRoute({ route: 'ContestantAppLogin', locale: 'en', errorMessage: 'loginFailed' });

/** The generated event type names this route's own id and locals; the erased signature below is the surface the load touches. */
type FakeEvent = {
  fetch: typeof fetch;
  locals: { supabase: { auth: { signOut: (options: { scope: string }) => Promise<{ error: null }> } } };
  params: { entityType: string; entityId: string; questionId?: string };
  parent: () => Promise<unknown>;
};
type LoadFn = (event: FakeEvent) => Promise<unknown>;
const runLoad = load as unknown as LoadFn;
const runRootLoad = rootLoad as unknown as (event: Pick<FakeEvent, 'locals' | 'parent'>) => Promise<unknown>;

const fakeFetch = vi.fn() as unknown as typeof fetch;
const signOut = vi.fn();

const USER = { id: 'user-1', email: 'user@example.test', username: 'user@example.test', role: 'contestant' };

const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';
const ORGANIZATION_ID = '22222222-2222-4222-8222-222222222222';
/** An id no list of this file holds. */
const UNLISTED_ID = '99999999-9999-4999-8999-999999999999';

/** The candidates and the organization a user may be listed with. */
const CANDIDATE: UserEntity = { type: 'candidate', id: CANDIDATE_ID, firstName: 'A', lastName: 'B', confirmed: true };
const OTHER_CANDIDATE: UserEntity = {
  type: 'candidate',
  id: '44444444-4444-4444-8444-444444444444',
  firstName: 'C',
  lastName: 'D',
  confirmed: true
};
const ORGANIZATION: UserEntity = { type: 'organization', id: ORGANIZATION_ID, name: 'Org', confirmed: true };

/** What the user-level load resolves to for a user who must pass the terms-of-use gate. */
const GATED_PARENT = { gate: 'termsOfUse', user: USER };

/** What the user-level load resolves to for a user past the gates who is listed with the given entities. */
function parentWith(entities: Array<UserEntity>) {
  return { gate: null, user: USER, entities };
}

/** The route params that name an entity. */
function paramsOf({ type, id }: Pick<UserEntity, 'type' | 'id'>): FakeEvent['params'] {
  return { entityType: type, entityId: id };
}

/**
 * A request context exposing only what the load touches. Every call builds its own object.
 * @param params - The route params of the request.
 * @param parent - The parent load's data, or a promise of it.
 * @returns The fake event.
 */
function makeEvent(params: FakeEvent['params'], parent: unknown): FakeEvent {
  return {
    fetch: fakeFetch,
    locals: { supabase: { auth: { signOut } } },
    params,
    parent: async () => parent
  };
}

/**
 * What the one-entity read resolves to.
 * @param entity - The listed entity the data is of.
 * @param nominations - The entity's nominations.
 * @returns The user data.
 */
function entityDataFor(
  entity: UserEntity,
  nominations: Array<{ electionId: string; constituencyId: string }> = [
    { electionId: 'election-1', constituencyId: 'constituency-1' }
  ]
) {
  return { entity: { type: entity.type, id: entity.id }, nominations };
}

const QUESTION_DATA = { categories: [], questions: [] };

/** The redirect a load throws, or `undefined` when it resolves. */
async function redirectOf(loading: Promise<unknown>): Promise<{ status: number; location: string } | undefined> {
  try {
    await loading;
    return undefined;
  } catch (e) {
    return e as { status: number; location: string };
  }
}

/**
 * The requests for an entity the user's list does not hold: the params of each, and the list it is made against.
 */
const NOT_LISTED = [
  ['an id the list does not hold', paramsOf({ type: 'candidate', id: UNLISTED_ID }), [CANDIDATE]],
  // The list is filtered to the types the project serves, so an entity of an unserved type is not in it.
  ['a type the list does not hold', paramsOf(ORGANIZATION), [CANDIDATE]],
  ['an id held under the other type', paramsOf({ type: 'organization', id: CANDIDATE_ID }), [CANDIDATE, ORGANIZATION]],
  ['an entity that has left the list', paramsOf(CANDIDATE), []]
] as const satisfies ReadonlyArray<readonly [string, FakeEvent['params'], ReadonlyArray<UserEntity>]>;

beforeEach(() => {
  createDataWriter.mockReturnValue({ getEntityUserData });
  createDataProvider.mockReturnValue({ getQuestionData });
  getLocale.mockReturnValue('en');
  signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/+layout.server.ts — the parent decides first', () => {
  it('resolves an empty object for a gated parent, and neither reads an entity nor redirects', async () => {
    // If the load read past the gate, this would sign the user out and reject the load.
    getEntityUserData.mockRejectedValue(new Error('Failed to load entity data: no data'));

    // The params name an entity no list holds: a load that checked membership for a gated user would redirect.
    const data = await runLoad(makeEvent(paramsOf({ type: 'candidate', id: UNLISTED_ID }), GATED_PARENT));

    expect(data).toEqual({});
    expect(getEntityUserData).not.toHaveBeenCalled();
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(createDataWriter).not.toHaveBeenCalled();
    expect(createDataProvider).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('does not read the entity before the parent has resolved', async () => {
    getEntityUserData.mockResolvedValue(entityDataFor(CANDIDATE));
    getQuestionData.mockResolvedValue(QUESTION_DATA);
    const resolvers = new Array<(data: unknown) => void>();
    const parent = new Promise((resolve) => {
      resolvers.push(resolve);
    });

    const loading = runLoad(makeEvent(paramsOf(CANDIDATE), parent));
    // Long enough for every read the load would make without waiting for its parent.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getEntityUserData).not.toHaveBeenCalled();
    expect(getQuestionData).not.toHaveBeenCalled();

    resolvers[0](parentWith([CANDIDATE]));
    await loading;

    expect(getEntityUserData).toHaveBeenCalledTimes(1);
  });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/+layout.server.ts — a listed entity', () => {
  it.each([
    ['the one candidate', CANDIDATE, [CANDIDATE]],
    ['the one organization', ORGANIZATION, [ORGANIZATION]],
    ['a candidate among several entities', CANDIDATE, [OTHER_CANDIDATE, ORGANIZATION, CANDIDATE]],
    ['an organization among several entities', ORGANIZATION, [CANDIDATE, ORGANIZATION, OTHER_CANDIDATE]]
  ] as const)(
    'reads %s by type and id, and resolves its user data and the question data',
    async (_, entity, entities) => {
      const entityData = entityDataFor(entity);
      getEntityUserData.mockResolvedValue(entityData);
      getQuestionData.mockResolvedValue(QUESTION_DATA);

      const data = await runLoad(makeEvent(paramsOf(entity), parentWith([...entities])));

      expect(data).toEqual({ questionData: QUESTION_DATA, contestantUserData: entityData });
      expect(getEntityUserData).toHaveBeenCalledTimes(1);
      expect(getEntityUserData).toHaveBeenCalledWith({
        type: entity.type,
        id: entity.id,
        loadNominations: true,
        locale: 'en'
      });
      expect(getQuestionData).toHaveBeenCalledTimes(1);
      expect(getQuestionData).toHaveBeenCalledWith({ electionId: ['election-1'], locale: 'en' });
      expect(signOut).not.toHaveBeenCalled();
    }
  );

  it('answers a failed question read with the error itself, and signs nobody out', async () => {
    const failure = new Error('questions unavailable');
    const entityData = entityDataFor(CANDIDATE);
    getEntityUserData.mockResolvedValue(entityData);
    getQuestionData.mockRejectedValue(failure);

    const data = await runLoad(makeEvent(paramsOf(CANDIDATE), parentWith([CANDIDATE])));

    expect(data).toEqual({ questionData: failure, contestantUserData: entityData });
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/+layout.server.ts — an entity the user may not edit', () => {
  it.each(NOT_LISTED)(
    'redirects to the app root for %s, reads no entity and signs nobody out',
    async (_, params, entities) => {
      // If the load read the entity, the read would resolve it and the load would serve it.
      getEntityUserData.mockResolvedValue(entityDataFor(CANDIDATE));
      getQuestionData.mockResolvedValue(QUESTION_DATA);

      const redirected = await redirectOf(runLoad(makeEvent(params, parentWith([...entities]))));

      expect(redirected).toMatchObject({ status: 307, location: APP_ROOT });
      expect(createDataWriter).not.toHaveBeenCalled();
      expect(getEntityUserData).not.toHaveBeenCalled();
      expect(getQuestionData).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    }
  );

  it('redirects to the app root for a listed entity the read does not find, and signs nobody out', async () => {
    getEntityUserData.mockResolvedValue(undefined);

    const redirected = await redirectOf(runLoad(makeEvent(paramsOf(CANDIDATE), parentWith([CANDIDATE]))));

    expect(redirected).toMatchObject({ status: 307, location: APP_ROOT });
    expect(getEntityUserData).toHaveBeenCalledTimes(1);
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('answers the five refusals with redirects equal in status and location', async () => {
    getEntityUserData.mockResolvedValue(undefined);

    const refusals = new Array<{ status: number; location: string } | undefined>();
    for (const [, params, entities] of NOT_LISTED)
      refusals.push(await redirectOf(runLoad(makeEvent(params, parentWith([...entities])))));
    refusals.push(await redirectOf(runLoad(makeEvent(paramsOf(CANDIDATE), parentWith([CANDIDATE])))));

    expect(refusals).toHaveLength(5);
    expect(new Set(refusals.map((refusal) => JSON.stringify([refusal?.status, refusal?.location])))).toEqual(
      new Set([JSON.stringify([307, APP_ROOT])])
    );
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/+layout.server.ts — a refusal cannot loop', () => {
  it.each([
    ['an empty list', []],
    ['a list of one other entity', [OTHER_CANDIDATE]],
    ['a list of several other entities', [OTHER_CANDIDATE, ORGANIZATION]]
  ] as const)(
    'with %s the entity is refused, and the root load on the same list does not redirect back to it',
    async (_, entities) => {
      const parent = parentWith([...entities]);
      const entityHome = `/contestant/candidate/${CANDIDATE_ID}`;

      const refused = await redirectOf(runLoad(makeEvent(paramsOf(CANDIDATE), parent)));
      const atTheRoot = await redirectOf(
        runRootLoad({ locals: { supabase: { auth: { signOut } } }, parent: async () => parent })
      );

      expect(refused).toMatchObject({ status: 307, location: APP_ROOT });
      // Whatever the root does with this list, it does not send the user back to the refused entity.
      expect(atTheRoot?.location.startsWith(entityHome) ?? false).toBe(false);
    }
  );
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/+layout.server.ts — the entity cannot be read', () => {
  it('signs the user out with loginFailed when the one-entity read rejects', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const failure = new Error('Failed to load entity data: boom');
    getEntityUserData.mockRejectedValue(failure);

    const redirected = await redirectOf(runLoad(makeEvent(paramsOf(CANDIDATE), parentWith([CANDIDATE]))));

    expect(redirected).toMatchObject({ status: 307, location: LOGIN_FAILED_ROUTE });
    expect(LOGIN_FAILED_ROUTE).toContain('loginFailed');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(error.mock.calls[0][1]).toEqual({ err: failure });
  });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/+layout.server.ts — an entity with no nomination', () => {
  it.each([
    ['a candidate', CANDIDATE],
    ['an organization', ORGANIZATION]
  ] as const)(
    'serves %s with no questions, reads none, and neither signs the user out nor redirects',
    async (_, entity) => {
      const entityData = entityDataFor(entity, []);
      getEntityUserData.mockResolvedValue(entityData);
      // If the load asked for questions, this would be the answer it served.
      getQuestionData.mockResolvedValue({ categories: [{ id: 'category-1' }], questions: [{ id: 'question-1' }] });

      const loading = runLoad(makeEvent(paramsOf(entity), parentWith([entity])));

      await expect(loading).resolves.toEqual({
        questionData: { categories: [], questions: [] },
        contestantUserData: entityData
      });
      expect(getQuestionData).not.toHaveBeenCalled();
      expect(createDataProvider).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    }
  );

  it('asks for the election of two nominations in one election once', async () => {
    getEntityUserData.mockResolvedValue(
      entityDataFor(CANDIDATE, [
        { electionId: 'election-1', constituencyId: 'constituency-1' },
        { electionId: 'election-1', constituencyId: 'constituency-2' }
      ])
    );
    getQuestionData.mockResolvedValue(QUESTION_DATA);

    await runLoad(makeEvent(paramsOf(CANDIDATE), parentWith([CANDIDATE])));

    expect(getQuestionData).toHaveBeenCalledTimes(1);
    expect(getQuestionData).toHaveBeenCalledWith({ electionId: ['election-1'], locale: 'en' });
  });
});

describe("routes/contestant/(protected)/[entityType]/[entityId]/+layout.server.ts — the request's locale", () => {
  it.each([['fi'], ['sv']] as const)(
    'reads the entity, its nominations and its questions in the locale of the request (%s)',
    async (locale) => {
      getLocale.mockReturnValue(locale);
      getEntityUserData.mockResolvedValue(entityDataFor(ORGANIZATION));
      getQuestionData.mockResolvedValue(QUESTION_DATA);

      await runLoad(makeEvent(paramsOf(ORGANIZATION), parentWith([ORGANIZATION])));

      expect(getEntityUserData).toHaveBeenCalledTimes(1);
      expect(getEntityUserData).toHaveBeenCalledWith({
        type: 'organization',
        id: ORGANIZATION_ID,
        loadNominations: true,
        locale
      });
      expect(getQuestionData).toHaveBeenCalledWith({ electionId: ['election-1'], locale });
    }
  );
});
