/**
 * The server load of the settings address under an entity, driven directly with a fake request context.
 *
 * What this file holds:
 *
 * 1. **The address leads to the settings page at the app's root**, with status 307, under a candidate and under an organization alike.
 * 2. **The load reads nothing of the entity.** It awaits no parent data and reads no locals, so the redirect is the same for every id the entity matcher admits, and it tells nothing about whether the entity exists or is the user's.
 *
 * The module is looked up through a glob, so a tree without the load fails on an assertion rather than on a missing import.
 */

import { describe, expect, it, vi } from 'vitest';

/** The generated event type names this route's own id; the erased signature below is the surface the load may touch. */
type FakeEvent = {
  params: { entityType: string; entityId: string };
  parent: () => Promise<unknown>;
};
type LoadFn = (event: FakeEvent) => Promise<unknown>;

const SERVER_MODULES = import.meta.glob<{ load?: LoadFn }>('./+page.server.ts');

const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';
const ORGANIZATION_ID = '22222222-2222-4222-8222-222222222222';

/** The path of the settings page at the app's root, before the locale prefix the unit harness does not add. */
const SETTINGS_PAGE = '/contestant/settings';

/** The address's server load. */
async function loadOf(): Promise<LoadFn> {
  const importModule = SERVER_MODULES['./+page.server.ts'];
  expect(importModule, 'the settings address under an entity has a server load').toBeDefined();
  const { load } = await importModule!();
  expect(load, 'the module exports a load').toBeTypeOf('function');
  return load!;
}

/** The redirect the load throws, or `undefined` when it resolves. */
async function redirectOf(load: LoadFn, event: FakeEvent): Promise<{ status: number; location: string } | undefined> {
  try {
    await load(event);
    return undefined;
  } catch (e) {
    return e as { status: number; location: string };
  }
}

describe('routes/contestant/(protected)/[entityType]/[entityId]/settings/+page.server.ts', () => {
  it.each([
    ['candidate', CANDIDATE_ID],
    ['organization', ORGANIZATION_ID]
  ])('redirects with 307 to the settings page at the app root, under a %s', async (entityType, entityId) => {
    const load = await loadOf();
    const parent = vi.fn(async () => ({ gate: null, entities: [] }));

    const redirected = await redirectOf(load, { params: { entityType, entityId }, parent });

    expect(redirected).toMatchObject({ status: 307, location: SETTINGS_PAGE });
  });

  it('awaits no parent data and reads no locals, so the answer is the same whatever the entity is', async () => {
    const load = await loadOf();
    const parent = vi.fn(async () => ({ gate: null, entities: [] }));

    const redirected = await redirectOf(load, { params: { entityType: 'candidate', entityId: CANDIDATE_ID }, parent });

    expect(redirected).toMatchObject({ status: 307, location: SETTINGS_PAGE });
    expect(parent).not.toHaveBeenCalled();
  });
});
