/**
 * The server's error hook.
 *
 * `handleError` answers the error the error page renders: its `message` is the response's status, which the page shows as its title. The error itself is logged on the server and never reaches the page.
 *
 * The paraglide server middleware is generated at build time, so it is replaced; the module's other imports are the real ones, over the test stubs of the environment modules.
 *
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleError } from './hooks.server';
import type { RequestEvent } from '@sveltejs/kit';
import type { MockInstance } from 'vitest';

vi.mock('$lib/paraglide/server', () => ({
  paraglideMiddleware: vi.fn()
}));

const event = {} as RequestEvent;

describe('handleError', () => {
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('answers a page that does not exist with the message 404', async () => {
    const error = new Error('Not found: /no-such-page');
    expect(await handleError({ error, event, status: 404, message: 'Not Found' })).toEqual({ message: '404' });
  });

  it('answers a server error with the message 500', async () => {
    const error = new Error('the database is unreachable');
    expect(await handleError({ error, event, status: 500, message: 'Internal Error' })).toEqual({ message: '500' });
  });

  it('logs the error on the server and returns nothing of it', async () => {
    const error = new Error('the database is unreachable');
    const answer = await handleError({ error, event, status: 500, message: 'Internal Error' });
    expect(consoleError).toHaveBeenCalledWith('Server error:', error);
    expect(JSON.stringify(answer)).not.toContain('unreachable');
  });
});
