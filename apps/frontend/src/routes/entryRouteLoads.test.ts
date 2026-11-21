// @vitest-environment node
/**
 * The server loads that exist for the gate alone: each is there so that a client-side navigation to its entry route sends a request the request hook sees, and each returns no data, because what a load returns is serialised into the page.
 *
 * The list names these modules because they are the ones whose load does nothing else: the other entry routes' loads return data of their own. That every entry route has a load is asserted in `$lib/routes/routeConsistency.test.ts`.
 */

import { describe, expect, it, vi } from 'vitest';

// The modules' actions build a data writer, which no case here calls.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter: vi.fn() }));

const MODULES: ReadonlyArray<[string, () => Promise<Record<string, unknown>>]> = [
  ['contestant/login/email', () => import('./contestant/login/email/+page.server')]
];

describe('the server loads that exist for the gate alone', () => {
  it.each(MODULES)('the load of %s returns no data', async (_name, importModule) => {
    const { load } = await importModule();
    expect(load).toBeTypeOf('function');
    expect((load as () => unknown)()).toEqual({});
  });
});
