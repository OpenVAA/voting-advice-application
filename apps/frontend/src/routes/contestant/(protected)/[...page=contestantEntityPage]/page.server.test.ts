/**
 * The server load that resolves an entity page asked for without an entity, driven directly with a fake request context.
 *
 * What this file holds:
 *
 * 1. **A gated parent decides nothing.** The load resolves an empty object and redirects nowhere, so the gate's view is shown at the URL the user asked for.
 * 2. **A user listed with exactly one entity is redirected to the same page under it**, with status 307, for each form of sub-path that names an entity page, a candidate and an organization alike.
 * 3. **A user listed with no entity or with several is redirected to the app root**, whatever page was asked for.
 * 4. **A question segment that is not a plain id leads to the app root**, so no part of the requested path can steer the redirect.
 * 5. **A sub-path that names no entity page leads to the app root**: `settings` belongs to the user, has its own route at the app root, and is mapped to no page here.
 * 6. **The resolver and the entity routes claim no path in common**: no sub-path the resolver's matcher admits begins with a segment the entity-type matcher admits, and the matcher rejects what follows the app root in every entity path. Which of the two routes SvelteKit tries first therefore decides nothing.
 *
 * The event carries no `locals`, so a load that signed a user out would fail every case here.
 */

import { describe, expect, it } from 'vitest';
import { load } from './+page.server';
import { match as isContestantEntityPage } from '../../../../params/contestantEntityPage';
import { match as isServedEntityType } from '../../../../params/servedEntityType';
import type { UserEntity } from '$lib/api/base/dataWriter.type';

/** The generated event type names this route's own id; the erased signature below is the surface the load touches. */
type FakeEvent = {
  params: { page: string };
  parent: () => Promise<unknown>;
};
type LoadFn = (event: FakeEvent) => Promise<unknown>;
const runLoad = load as unknown as LoadFn;

const USER = { id: 'user-1', email: 'user@example.test', username: 'user@example.test', role: 'contestant' };

const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';
const ORGANIZATION_ID = '22222222-2222-4222-8222-222222222222';
const QUESTION_ID = '33333333-3333-4333-8333-333333333333';
const CANDIDATE: UserEntity = { type: 'candidate', id: CANDIDATE_ID, firstName: 'A', lastName: 'B', confirmed: true };
const ORGANIZATION: UserEntity = { type: 'organization', id: ORGANIZATION_ID, name: 'Org', confirmed: true };

/** What the user-level load resolves to for a user who must pass the terms-of-use gate. */
const GATED_PARENT = { gate: 'termsOfUse', user: USER };

/** What the user-level load resolves to for a user past the gates who is listed with the given entities. */
function parentWith(entities: Array<UserEntity>) {
  return { gate: null, user: USER, entities };
}

/** The five forms of sub-path that name an entity page. */
const SUB_PATHS = ['profile', 'questions', `questions/${QUESTION_ID}`, 'preview', 'nominations'];

const APP_ROOT = '/contestant';

/**
 * A request context exposing only what the load touches. Every call builds its own object.
 * @param page - The sub-path the request names.
 * @param parent - The parent load's data.
 * @returns The fake event.
 */
function makeEvent(page: string, parent: unknown): FakeEvent {
  return { params: { page }, parent: async () => parent };
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

describe('routes/contestant/(protected)/[...page]/+page.server.ts — a user who must pass a gate', () => {
  it.each(SUB_PATHS)('resolves an empty object and redirects nowhere (%s)', async (page) => {
    const data = await runLoad(makeEvent(page, GATED_PARENT));

    expect(data).toEqual({});
  });
});

describe('routes/contestant/(protected)/[...page]/+page.server.ts — a user listed with exactly one entity', () => {
  it.each(SUB_PATHS)('redirects with 307 to the same page under the one candidate (%s)', async (page) => {
    const redirected = await redirectOf(makeEvent(page, parentWith([CANDIDATE])));

    expect(redirected).toMatchObject({ status: 307, location: `/contestant/candidate/${CANDIDATE_ID}/${page}` });
  });

  it.each(SUB_PATHS)('redirects with 307 to the same page under the one organization (%s)', async (page) => {
    const redirected = await redirectOf(makeEvent(page, parentWith([ORGANIZATION])));

    expect(redirected).toMatchObject({
      status: 307,
      location: `/contestant/organization/${ORGANIZATION_ID}/${page}`
    });
  });
});

describe('routes/contestant/(protected)/[...page]/+page.server.ts — a user listed with no entity or with several', () => {
  it.each(SUB_PATHS)('redirects a user with no entity to the app root (%s)', async (page) => {
    const redirected = await redirectOf(makeEvent(page, parentWith([])));

    expect(redirected).toMatchObject({ status: 307, location: APP_ROOT });
  });

  it.each(SUB_PATHS)('redirects a user with several entities to the app root (%s)', async (page) => {
    const redirected = await redirectOf(makeEvent(page, parentWith([CANDIDATE, ORGANIZATION])));

    expect(redirected).toMatchObject({ status: 307, location: APP_ROOT });
  });
});

describe('routes/contestant/(protected)/[...page]/+page.server.ts — a sub-path that names no entity page', () => {
  it.each([
    ['one entity', [CANDIDATE]],
    ['several entities', [CANDIDATE, ORGANIZATION]]
  ] as const)(
    'sends settings, which belongs to the user and not to an entity, to the app root for %s',
    async (_, entities) => {
      const redirected = await redirectOf(makeEvent('settings', parentWith([...entities])));

      expect(redirected).toMatchObject({ status: 307, location: APP_ROOT });
    }
  );
});

describe('routes/contestant/(protected)/[...page]/+page.server.ts — a question segment that is not a plain id', () => {
  // What SvelteKit hands the load after decoding a segment the matcher saw percent-encoded.
  it.each([
    'questions/../../../admin',
    'questions/a/b',
    'questions/a?next=x',
    'questions/a#b',
    'questions/a b',
    'questions/..',
    'questions/'
  ])('redirects to the app root and puts nothing of the segment in the target (%s)', async (page) => {
    const redirected = await redirectOf(makeEvent(page, parentWith([CANDIDATE])));

    expect(redirected).toMatchObject({ status: 307, location: APP_ROOT });
  });

  it('redirects to the app root for a sub-path that names no entity page', async () => {
    const redirected = await redirectOf(makeEvent('constructor', parentWith([CANDIDATE])));

    expect(redirected).toMatchObject({ status: 307, location: APP_ROOT });
  });
});

describe('the resolver and the entity routes claim no path in common', () => {
  it.each(SUB_PATHS)('the entity-type matcher rejects the first segment of %s', (page) => {
    expect(isContestantEntityPage(page), 'the case must be a sub-path the resolver serves').toBe(true);
    expect(isServedEntityType(page.split('/')[0])).toBe(false);
  });

  it.each(
    ['candidate', 'organization'].flatMap((type) =>
      ['', ...SUB_PATHS.map((page) => `/${page}`)].map((page) => `${type}/${CANDIDATE_ID}${page}`)
    )
  )('the resolver matcher rejects the entity path %s', (rest) => {
    expect(isServedEntityType(rest.split('/')[0]), 'the case must be a path an entity route serves').toBe(true);
    expect(isContestantEntityPage(rest)).toBe(false);
  });
});
