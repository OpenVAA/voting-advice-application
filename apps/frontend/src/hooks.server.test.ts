/**
 * The server's error hook.
 *
 * `handleError` answers the error the error page renders: its `message` is the response's status, which the page replaces with that status's translated message, `error.default` when there is none. A server error is logged through the shared logger and never reaches the page; a missing page is not logged.
 *
 * @vitest-environment node
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleError } from './hooks.server';
import type { RequestEvent } from '@sveltejs/kit';
import type { MockInstance } from 'vitest';

const event = {} as RequestEvent;

describe('handleError', () => {
  let logError: MockInstance<typeof log.error>;
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logError.mockRestore();
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

  it('logs a server error through the shared logger, with the error, and returns nothing of it', async () => {
    const error = new Error('the database is unreachable');
    const answer = await handleError({ error, event, status: 500, message: 'Internal Error' });
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith('Server error', { err: error, status: 500 });
    expect(consoleError).not.toHaveBeenCalled();
    expect(JSON.stringify(answer)).not.toContain('unreachable');
  });

  it('logs nothing for a page that does not exist', async () => {
    const error = new Error('Not found: /no-such-page');
    await handleError({ error, event, status: 404, message: 'Not Found' });
    expect(logError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
