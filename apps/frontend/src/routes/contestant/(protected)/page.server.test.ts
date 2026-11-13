/**
 * The server load of the Contestant App's root page, driven directly with a fake request context.
 *
 * What this file holds:
 *
 * 1. **A gated parent decides nothing.** The load resolves an empty object, redirects nowhere and signs nobody out, so the gate's view is shown at the root.
 * 2. **A user listed with no entity is shown the "nothing to edit" view.** The load resolves `{ view: 'nothingToEdit' }`, redirects nowhere and signs nobody out.
 * 3. **A user listed with exactly one entity is redirected to that entity's home**, a candidate and an organization alike, with status 307 and without being signed out.
 * 4. **A user listed with several entities chooses.** The load resolves `{ view: 'select' }` for two entities of one type and for a candidate with an organization, redirects nowhere and signs nobody out.
 * 5. **A list that could not be read is shown as the read failure.** The load resolves `{ view: 'readFailed' }` before it looks at the list, so neither the one-entity redirect nor the "nothing to edit" view is reached, and signs nobody out.
 *
 * The fake locals carry a sign-out spy the load has no reason to reach: every case asserts it was never called.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';
import type { UserEntity } from '$lib/api/base/dataWriter.type';

/** The generated event type names this route's own id and locals; the erased signature below is the surface the load touches. */
type FakeEvent = {
  locals: { supabase: { auth: { signOut: (options: { scope: string }) => Promise<{ error: null }> } } };
  parent: () => Promise<unknown>;
};
type LoadFn = (event: FakeEvent) => Promise<unknown>;
const runLoad = load as unknown as LoadFn;

const signOut = vi.fn();

const USER = { id: 'user-1', email: 'user@example.test', username: 'user@example.test', role: 'contestant' };

const CANDIDATE: UserEntity = {
  type: 'candidate',
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'A',
  lastName: 'B',
  confirmed: true
};
const ORGANIZATION: UserEntity = {
  type: 'organization',
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Org',
  confirmed: true
};
const SECOND_CANDIDATE: UserEntity = {
  type: 'candidate',
  id: '33333333-3333-4333-8333-333333333333',
  firstName: 'C',
  lastName: 'D',
  confirmed: false
};

/** What the user-level load resolves to for a user who must pass the terms-of-use gate. */
const GATED_PARENT = { gate: 'termsOfUse', user: USER };

/**
 * A request context exposing only what the load touches. Every call builds its own object.
 * @param parent - The parent load's data.
 * @returns The fake event.
 */
function makeEvent(parent: unknown): FakeEvent {
  return {
    locals: { supabase: { auth: { signOut } } },
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
  signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('routes/contestant/(protected)/+page.server.ts — a user who must pass a gate', () => {
  it('resolves an empty object, redirects nowhere and signs nobody out', async () => {
    const data = await runLoad(makeEvent(GATED_PARENT));

    expect(data).toEqual({});
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/+page.server.ts — a user listed with no entity', () => {
  it('resolves the "nothing to edit" view, redirects nowhere and signs nobody out', async () => {
    const event = makeEvent({ gate: null, user: USER, entities: [] });

    expect(await redirectOf(event)).toBeUndefined();
    expect(await runLoad(event)).toEqual({ view: 'nothingToEdit' });
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/+page.server.ts — a list that could not be read', () => {
  it.each([
    ['an empty list', []],
    ['a list of one entity', [CANDIDATE]]
  ] as const)('resolves the read-failure view with %s, redirects nowhere and signs nobody out', async (_, entities) => {
    const event = makeEvent({ gate: null, user: USER, entities, entitiesReadFailed: true });

    expect(await redirectOf(event)).toBeUndefined();
    expect(await runLoad(event)).toEqual({ view: 'readFailed' });
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/+page.server.ts — a user listed with exactly one entity', () => {
  it.each([
    ['candidate', CANDIDATE, '/contestant/candidate/11111111-1111-4111-8111-111111111111'],
    ['organization', ORGANIZATION, '/contestant/organization/22222222-2222-4222-8222-222222222222']
  ] as const)('redirects with 307 to the home of the one %s', async (_, entity, home) => {
    const redirected = await redirectOf(makeEvent({ gate: null, user: USER, entities: [entity] }));

    expect(redirected).toMatchObject({ status: 307, location: home });
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/+page.server.ts — a user listed with several entities', () => {
  it.each([
    ['two candidates', [CANDIDATE, SECOND_CANDIDATE]],
    ['a candidate with an organization', [CANDIDATE, ORGANIZATION]],
    ['an organization listed before two candidates', [ORGANIZATION, CANDIDATE, SECOND_CANDIDATE]]
  ] as const)('resolves the selection view for %s, redirects nowhere and signs nobody out', async (_, entities) => {
    const event = makeEvent({ gate: null, user: USER, entities });

    expect(await redirectOf(event)).toBeUndefined();
    expect(await runLoad(event)).toEqual({ view: 'select' });
    expect(signOut).not.toHaveBeenCalled();
  });
});
