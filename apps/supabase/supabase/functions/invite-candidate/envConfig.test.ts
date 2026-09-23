/**
 * Required-environment-variable tests (REVIEW-EDGE-02).
 *
 * The defect this guards is a `Deno.env.get('X') || fallback` chain: an operator who never set `X` gets the fallback silently, and the deployment looks configured because nothing complains. `requireEnv` replaces the silence with a throw that names the variable, so the failure is legible in a log instead of being inferred from a wrong result days later.
 *
 * Two boundaries carry the whole design and both are asserted here. An empty string is unconfigured, not configured-to-empty -- an operator who writes `SITE_URL=` in a `.env` has not chosen an origin. A value that merely READS as falsy, such as `'0'` or `'false'`, is configured and is returned unchanged -- a naive truthiness test would swallow a legitimate port `0` or a legitimate `false` flag, which is the same class of bug in the opposite direction.
 */

import { describe, it, expect } from 'vitest';
import { requireEnv } from './envConfig';

/** Run `fn`, return the Error it threw, and fail loudly if it did not throw at all. */
function captureError(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error('Expected the call to throw, but it returned normally.');
}

describe('requireEnv', () => {
  it('throws naming the variable when the value is undefined', () => {
    const error = captureError(() => requireEnv('SITE_URL', undefined));

    expect(error.message).toContain('SITE_URL');
    expect(error).toMatchObject({ code: 'ERR_ENV_UNCONFIGURED', variable: 'SITE_URL' });
  });

  it('treats an empty string as unconfigured rather than as configured-to-empty', () => {
    // The adjacency case. `SITE_URL=` in a `.env` file is an operator who has not chosen an origin, so it must fail the same way an absent variable does -- otherwise the loud failure is one keystroke away from being silent again.
    const error = captureError(() => requireEnv('SITE_URL', ''));

    expect(error.message).toContain('SITE_URL');
    expect(error).toMatchObject({ code: 'ERR_ENV_UNCONFIGURED', variable: 'SITE_URL' });
  });

  it('returns a configured value unchanged', () => {
    expect(requireEnv('SITE_URL', 'https://vaa.example')).toBe('https://vaa.example');
  });

  it('returns values that merely read as falsy, because only undefined and the empty string are missing', () => {
    // A truthiness test here would reject a legitimate port `0` and a legitimate `false` flag. The set of missing values is exactly two, and it is closed on purpose.
    expect(requireEnv('SMTP_PORT', '0')).toBe('0');
    expect(requireEnv('X', 'false')).toBe('false');
  });

  it('names the variable and nothing else, so the message carries no value, host or URL', () => {
    // The Edge Functions that call this run behind an admin check but return their error text to the caller, so a message quoting the configured origin would hand out deployment topology in exchange for a misconfiguration.
    const error = captureError(() => requireEnv('SITE_URL', ''));

    expect(error.message).toBe('Missing required environment variable: SITE_URL.');
    expect(error.message).not.toMatch(/https?:\/\//);
  });
});
