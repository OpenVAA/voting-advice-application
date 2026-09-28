/**
 * Tests for the leak-safe JWKS fetch.
 *
 * Two jobs, and the second matters as much as the first.
 *
 * 1. CLASSIFICATION. Every way retrieving the key set can fail must produce a NAMED code that names `IDENTITY_PROVIDER_JWKS_URI`, instead of jose's uncoded `ERR_JOSE_GENERIC`. The 3xx cases are the specific regression: jose requests the key set with `redirect: 'manual'`, so a redirect is a non-200 response and is NOT followed -- a JWKS URI that redirects fails exactly like a 404, which is invisible at the call site and was invisible in the log.
 *
 * 2. ABSENCE OF LEAKS. The wrapper handles the JWKS url and a response body from a host we do not control, so its whole value depends on neither reaching a message or a log line. Every failing case is asserted against a fixture host, url, body and `location` value chosen to be unmistakable if they ever appear. These are the tests that let `fetchJwksLeakSafe.ts`'s leak-safety comment be a fact rather than an intention -- do not add a field to a message there without adding its absence here.
 *
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchJwksLeakSafe } from './fetchJwksLeakSafe';
import { OIDC_FAILURE } from './oidcFailure';

/**
 * Fixture identifiers, deliberately distinctive.
 *
 * Every string here is something a leak would have to carry verbatim, so an assertion on its absence cannot pass by coincidence -- unlike a plausible value such as `example.com`, which could appear in an unrelated hint.
 */
const SECRET_HOST = 'jwks-host-tenant-zz9plural.idp.invalid';
const JWKS_URL = `https://${SECRET_HOST}/.well-known/openid-configuration/jwks`;
const SECRET_BODY = '<html><body>No key set for tenant zz9plural (leaked-body-marker)</body></html>';
const SECRET_LOCATION = `https://${SECRET_HOST}/relocated?tenant=zz9plural&leaked-location-marker=1`;

/** Everything that must never appear in a thrown message or a log line. */
const FORBIDDEN = [
  SECRET_HOST,
  JWKS_URL,
  SECRET_BODY,
  SECRET_LOCATION,
  'zz9plural',
  'leaked-body-marker',
  'leaked-location-marker'
];

/** The options jose passes to a `FetchImplementation`, mirrored exactly so the seam under test is the real one. */
function joseOptions(): Parameters<typeof fetchJwksLeakSafe>[1] {
  return {
    headers: new Headers({ accept: 'application/json' }),
    method: 'GET',
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000)
  };
}

let consoleError: ReturnType<typeof vi.spyOn>;

/** Every string this module wrote to the console during the current test, concatenated. */
function loggedText(): string {
  return consoleError.mock.calls.map((call) => call.map(String).join(' ')).join('\n');
}

/** Assert that neither the thrown message nor anything logged carries a fixture identifier. */
function expectNoLeak(message: string): void {
  const logged = loggedText();
  for (const forbidden of FORBIDDEN) {
    expect(message).not.toContain(forbidden);
    expect(logged).not.toContain(forbidden);
  }
}

/** Catch and return a rejection, so a test can assert on the code AND the message without a try/catch each time. */
async function callAndCatch(url = JWKS_URL): Promise<Error & { code?: string }> {
  try {
    await fetchJwksLeakSafe(url, joseOptions());
  } catch (e) {
    return e as Error & { code?: string };
  }
  throw new Error('expected fetchJwksLeakSafe to reject, but it resolved');
}

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchJwksLeakSafe', () => {
  describe('the happy path is unchanged', () => {
    // The control. A wrapper that classified failures correctly but altered a successful retrieval would break every verification in production, so this asserts the body survives the re-wrap `.text()` forces.
    it('returns a 200 response whose json() yields the same key set', async () => {
      const keySet = { keys: [{ kty: 'RSA', kid: 'sig-1', n: 'abc', e: 'AQAB' }] };
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(JSON.stringify(keySet), { status: 200, headers: { 'content-type': 'application/json' } })
        )
      );

      const response = await fetchJwksLeakSafe(JWKS_URL, joseOptions());

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(keySet);
    });

    it('accepts a key set served as application/jwk-set+json', async () => {
      const keySet = { keys: [] };
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(JSON.stringify(keySet), {
              status: 200,
              headers: { 'content-type': 'application/jwk-set+json' }
            })
        )
      );

      await expect((await fetchJwksLeakSafe(JWKS_URL, joseOptions())).json()).resolves.toEqual(keySet);
    });

    it('forwards jose’s own request options to fetch unchanged', async () => {
      const spy = vi.fn(async () => new Response('{"keys":[]}', { status: 200 }));
      vi.stubGlobal('fetch', spy);

      const options = joseOptions();
      await fetchJwksLeakSafe(JWKS_URL, options);

      expect(spy).toHaveBeenCalledWith(JWKS_URL, options);
    });
  });

  describe('non-200 statuses classify as ERR_JWKS_URI_HTTP_STATUS', () => {
    // Boundary neighbours of "200". 201 and 204 sit immediately above the success value, 304 is the redirect-adjacent case that carries no location header, and 400/401/403/404/500/502/503 are the realistic misconfigurations. jose's own check is `status !== 200`, so every one of these must be classified here rather than reaching it.
    //
    // There is deliberately no neighbour BELOW 200: the WHATWG `Response` constructor rejects a status under 200 with a RangeError, so a 1xx is not constructible here -- and `fetch` never surfaces an informational response as a status either, so the case does not exist at runtime rather than merely going untested.
    it.each([201, 204, 304, 400, 401, 403, 404, 500, 502, 503])('classifies status %i', async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status }))
      );

      const caught = await callAndCatch();

      expect(caught.code).toBe(OIDC_FAILURE.jwksUriHttpStatus);
      expect(caught.message).toContain('IDENTITY_PROVIDER_JWKS_URI');
      expect(caught.message).toContain(`status=${status}`);
      expectNoLeak(caught.message);
    });

    // THE REGRESSION. jose sets `redirect: 'manual'`, so a redirect arrives as a response rather than being followed, and a JWKS URI that redirects fails identically to one that 404s. Reporting the `location` header's PRESENCE is what separates "the URL moved" from "the URL is wrong" -- two different edits to the same variable.
    it.each([301, 302, 307, 308])('classifies redirect status %i and says it was not followed', async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status, headers: { location: SECRET_LOCATION } }))
      );

      const caught = await callAndCatch();

      expect(caught.code).toBe(OIDC_FAILURE.jwksUriHttpStatus);
      expect(caught.message).toContain(`status=${status}`);
      expect(caught.message).toContain('redirect');
      expect(caught.message).toContain('not followed');
      expect(loggedText()).toContain('redirect=manual');
      expectNoLeak(caught.message);
    });

    it('does not claim a redirect when no location header is present', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 404 }))
      );

      const caught = await callAndCatch();

      expect(caught.message).not.toContain('redirect');
      expect(loggedText()).not.toContain('redirect=manual');
    });
  });

  describe('a 200 that is not JSON classifies as ERR_JWKS_URI_NOT_JSON', () => {
    it('classifies an HTML error page and names the content-type', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(SECRET_BODY, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
        )
      );

      const caught = await callAndCatch();

      expect(caught.code).toBe(OIDC_FAILURE.jwksUriNotJson);
      expect(caught.message).toContain('IDENTITY_PROVIDER_JWKS_URI');
      expect(caught.message).toContain('text/html');
      expect(caught.message).toContain('looksLikeMarkup=true');
      expect(caught.message).toContain(`bytes=${SECRET_BODY.length}`);
      expectNoLeak(caught.message);
    });

    it('classifies a non-markup non-JSON body with looksLikeMarkup=false', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('not json at all', { status: 200, headers: { 'content-type': 'text/plain' } }))
      );

      const caught = await callAndCatch();

      expect(caught.code).toBe(OIDC_FAILURE.jwksUriNotJson);
      expect(caught.message).toContain('looksLikeMarkup=false');
    });

    it('reports an absent content-type as absent rather than as undefined', async () => {
      // A body with no content-type at all is a real server behaviour, and `content-type=undefined` in a log reads like a bug in the logger rather than a fact about the response.
      const response = new Response('<!doctype html>', { status: 200 });
      response.headers.delete('content-type');
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => response)
      );

      const caught = await callAndCatch();

      expect(caught.code).toBe(OIDC_FAILURE.jwksUriNotJson);
      expect(caught.message).toContain('content-type=absent');
      expect(caught.message).not.toContain('undefined');
    });

    // An empty body is the boundary neighbour of "a body": `JSON.parse('')` throws, so it must classify here and not slip through as valid.
    it('classifies an empty 200 body', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('', { status: 200 }))
      );

      const caught = await callAndCatch();

      expect(caught.code).toBe(OIDC_FAILURE.jwksUriNotJson);
      expect(caught.message).toContain('bytes=0');
    });
  });

  describe('transport failures classify as ERR_JWKS_URI_UNREACHABLE', () => {
    // Node reports a DNS failure as `TypeError: fetch failed` with the symbolic code on `.cause.code` -- and the HOSTNAME on `.cause.message` (`getaddrinfo ENOTFOUND <host>`). Taking the code and not the message is the whole design of `transportCode`, and this pair of assertions is what holds it in place.
    it.each(['ENOTFOUND', 'ECONNREFUSED', 'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'])(
      'classifies transport code %s and keeps the cause message out',
      async (code) => {
        const cause = Object.assign(new Error(`getaddrinfo ${code} ${SECRET_HOST}`), { code });
        vi.stubGlobal(
          'fetch',
          vi.fn(async () => {
            throw Object.assign(new TypeError('fetch failed'), { cause });
          })
        );

        const caught = await callAndCatch();

        expect(caught.code).toBe(OIDC_FAILURE.jwksUriUnreachable);
        expect(caught.message).toContain('IDENTITY_PROVIDER_JWKS_URI');
        expect(caught.message).toContain(`transport=${code}`);
        expectNoLeak(caught.message);
      }
    );

    // The whitelist is a guarantee, not a formality: if a runtime ever put a url or a path on `.code`, it would be reported as `unidentified` rather than echoed.
    it('reports a non-symbolic cause code as unidentified rather than echoing it', async () => {
      const cause = Object.assign(new Error('boom'), { code: `https://${SECRET_HOST}/leaked` });
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw Object.assign(new TypeError('fetch failed'), { cause });
        })
      );

      const caught = await callAndCatch();

      expect(caught.code).toBe(OIDC_FAILURE.jwksUriUnreachable);
      expect(caught.message).toContain('transport=unidentified');
      expectNoLeak(caught.message);
    });

    it('reports a missing cause as unidentified', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new TypeError('fetch failed');
        })
      );

      expect((await callAndCatch()).message).toContain('transport=unidentified');
    });

    // A TimeoutError must pass through UNTOUCHED. jose's own wrapper around this call converts it to `JWKSTimeout` / `ERR_JWKS_TIMEOUT`, which is already a well-named class; re-labelling it here would replace a specific code with a vaguer one.
    it('re-throws a TimeoutError unchanged so jose can map it to ERR_JWKS_TIMEOUT', async () => {
      const timeout = Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw timeout;
        })
      );

      const caught = await callAndCatch();

      expect(caught).toBe(timeout);
      expect(caught.code).toBeUndefined();
      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe('leak safety', () => {
    // A single case asserting that SOMETHING was logged, so the absence assertions elsewhere cannot pass merely because nothing is ever written.
    it('logs a diagnostic line at each throw site', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 404 }))
      );

      await callAndCatch();

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(loggedText()).toContain('[oidc/jwks]');
      expect(loggedText()).toContain('status=404');
    });

    // Says out loud, in an assertion, that the url is deliberately withheld -- so a future edit that starts logging it fails here rather than being noticed in a support transcript.
    it('states that the url is withheld rather than silently omitting it', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 404 }))
      );

      await callAndCatch();

      expect(loggedText()).toContain('not logged');
      expect(loggedText()).toContain('IDENTITY_PROVIDER_JWKS_URI');
    });

    it('never echoes the url even when it is the only thing wrong with it', async () => {
      const oddUrl = `https://${SECRET_HOST}/wrong/path/zz9plural`;
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 404 }))
      );

      const caught = await callAndCatch(oddUrl);

      expect(caught.message).not.toContain(oddUrl);
      expectNoLeak(caught.message);
    });
  });
});
