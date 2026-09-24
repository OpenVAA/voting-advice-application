/**
 * The fetch jose uses to retrieve the remote signature JWK set, wrapped so its failures carry a NAMED class instead of jose's uncoded base error.
 *
 * WHY THIS EXISTS. jose 6.2.1 defines fifteen error codes, and fourteen of them name a real failure. The fifteenth, `ERR_JOSE_GENERIC`, is the code of the base `JOSEError` class, and a bare `JOSEError` is constructed at exactly two sites in the whole library -- both in `fetchJwks` in `jose/dist/webapi/jwks/remote.js`, one for a non-200 status and one for a body that will not parse as JSON. So the ONE stage jose leaves uncoded is fetching the key set, and a deployment whose `IDENTITY_PROVIDER_JWKS_URI` is wrong gets a log line that names no stage, no variable and no remedy.
 *
 * That is not hypothetical. A live Idura callback produced exactly `[oidc/callback] ID token claims rejected; code= ERR_JOSE_GENERIC` and nothing else; the failing stage had to be recovered by reading jose's source. See `.planning/debug/resolved/idura-bank-auth-empty-client.md`, finding 2.
 *
 * Passing this as `createRemoteJWKSet`'s `[jose.customFetch]` option moves the classification in front of jose's two throw sites: we observe the status and the body ourselves and raise {@link OIDC_FAILURE.jwksUriHttpStatus}, {@link OIDC_FAILURE.jwksUriNotJson} or {@link OIDC_FAILURE.jwksUriUnreachable}, each naming the variable. jose's own checks then never fire, which is why `ERR_JOSE_GENERIC` reaching a log after this landed is itself a signal -- see its entry in `oidcFailure.ts`.
 *
 * THE REDIRECT TRAP, worth stating because it is invisible at the call site. jose requests the key set with `redirect: 'manual'`, so a 301/302/307/308 is delivered as a response with a non-200 status and is NOT followed. A JWKS URI that redirects -- http to https, a trailing-slash normalisation, a moved `.well-known` path -- fails exactly like a 404. The hint on `jwksUriHttpStatus` says so, and a test pins it.
 *
 * LEAK SAFETY, and this is the whole reason the module is shaped the way it is. The first argument is the JWKS URL and the response may be an arbitrary page from an arbitrary host, so almost everything in scope here is unsafe to log. What crosses into a message is a CLOSED WHITELIST of non-identifying facts:
 *
 * - the HTTP status code,
 * - the `content-type` response header,
 * - the body LENGTH, and a boolean for whether it begins with `<`,
 * - whether a `location` header was present (never its value -- that carries the host and often a tenant id),
 * - the transport error's `cause.code`, and only when it matches `/^[A-Z][A-Z0-9_]*$/`.
 *
 * NEVER the url, the hostname, the body text, the `location` value, the transport error's message (Node writes `getaddrinfo ENOTFOUND <host>` there), or any key material. A colocated test asserts each of those absences rather than trusting this comment. Do not add a field here without adding its absence test.
 */

import { OIDC_FAILURE } from './oidcFailure';
import type * as jose from 'jose';

/**
 * Extract a transport error's code without touching its message.
 *
 * Node reports a DNS or TLS failure as `TypeError: fetch failed` with the real detail on `.cause`, and `cause.message` is where the HOSTNAME lives (`getaddrinfo ENOTFOUND idp.example`). `cause.code` is a bare symbolic constant (`ENOTFOUND`, `ECONNREFUSED`, `CERT_HAS_EXPIRED`, `UNABLE_TO_VERIFY_LEAF_SIGNATURE`) and is the single most useful thing on the object, so it is taken and the message is not.
 *
 * The regexp is a whitelist, not a formality: it guarantees that whatever ends up in the message is a symbolic constant and cannot be a smuggled URL, path or hostname even if a future runtime puts something else on `code`.
 */
function transportCode(error: unknown): string {
  const cause = (error as { cause?: unknown })?.cause;
  const code = (cause as { code?: unknown })?.code;
  return typeof code === 'string' && /^[A-Z][A-Z0-9_]*$/.test(code) ? code : 'unidentified';
}

/**
 * A `jose.FetchImplementation` that classifies JWKS retrieval failures as named, leak-safe coded errors.
 *
 * Pass it to `createRemoteJWKSet` under the `[jose.customFetch]` key. On success it returns a `Response` carrying the same JSON body, so jose's subsequent `response.json()` behaves exactly as it would have unwrapped -- the happy path is unchanged by design, and a test pins that.
 *
 * Writes one `[oidc/jwks]` line to the server console at each throw site. That is deliberate duplication with the route-level `[oidc/callback]` line, because the two lines carry different things and reach the same reader: this one has the observed HTTP facts, which exist only here and must not cross the provider result boundary; the route's has the stage and the remedy. Server console and browser URL are different audiences, and only the opaque class is allowed to reach the second.
 *
 * @param url - The JWKS url jose is fetching. Used to make the request and NEVER put into a message or a log line.
 * @param options - jose's request options, forwarded unchanged. Carries the `accept` headers, `redirect: 'manual'` and the 5s `AbortSignal`.
 * @returns The response, when it is a 200 carrying parseable JSON.
 * @throws {Error & { code: string }} `ERR_JWKS_URI_UNREACHABLE`, `ERR_JWKS_URI_HTTP_STATUS` or `ERR_JWKS_URI_NOT_JSON`. A `TimeoutError` from the abort signal is re-thrown UNCHANGED so that jose's own wrapper still maps it to `ERR_JWKS_TIMEOUT`, which is already a well-named class and needs no help from us.
 */
export async function fetchJwksLeakSafe(
  url: Parameters<jose.FetchImplementation>[0],
  options: Parameters<jose.FetchImplementation>[1]
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (e) {
    // Let the abort signal's own failure through untouched: jose's wrapper around this call converts a `TimeoutError` into `JWKSTimeout` / `ERR_JWKS_TIMEOUT`, and re-labelling it here would REPLACE a specific class with a vaguer one.
    if ((e as { name?: unknown })?.name === 'TimeoutError') throw e;

    const code = transportCode(e);
    console.error(
      `[oidc/jwks] key-set request failed before any HTTP response; transport=${code}. The url is not logged; it is the value of IDENTITY_PROVIDER_JWKS_URI.`
    );
    throw Object.assign(
      new Error(
        `Cannot verify ID token: the key-set endpoint configured in IDENTITY_PROVIDER_JWKS_URI could not be reached (transport=${code}).`
      ),
      { code: OIDC_FAILURE.jwksUriUnreachable }
    );
  }

  if (response.status !== 200) {
    // A 3xx lands here like any other non-200: jose sets `redirect: 'manual'`, so the redirect is handed back rather than followed. Reporting the `location` header's PRESENCE (never its value) is what distinguishes "the URL moved" from "the URL is wrong", which are different edits to the same variable.
    const redirected = response.headers.has('location');
    console.error(
      `[oidc/jwks] key-set endpoint answered status=${response.status}${redirected ? ' with a location header (a redirect, which is NOT followed: the request sets redirect=manual)' : ''}. The url is not logged; it is the value of IDENTITY_PROVIDER_JWKS_URI.`
    );
    throw Object.assign(
      new Error(
        `Cannot verify ID token: the key-set endpoint configured in IDENTITY_PROVIDER_JWKS_URI answered status=${response.status}${redirected ? ' and is a redirect, which is not followed' : ''}.`
      ),
      { code: OIDC_FAILURE.jwksUriHttpStatus }
    );
  }

  const contentType = response.headers.get('content-type') ?? 'absent';
  const body = await response.text();

  try {
    JSON.parse(body);
  } catch {
    // Length and a single leading-`<` boolean, and nothing else. An HTML error page is the overwhelmingly common case and `looksLikeMarkup` identifies it without quoting one byte of a body that came from a host we do not control.
    const looksLikeMarkup = body.trimStart().startsWith('<');
    console.error(
      `[oidc/jwks] key-set endpoint answered 200 but the body is not JSON; content-type=${contentType} bytes=${body.length} looksLikeMarkup=${looksLikeMarkup}. The body and the url are not logged.`
    );
    throw Object.assign(
      new Error(
        `Cannot verify ID token: the key-set endpoint configured in IDENTITY_PROVIDER_JWKS_URI answered 200 but the body is not JSON (content-type=${contentType}, bytes=${body.length}, looksLikeMarkup=${looksLikeMarkup}).`
      ),
      { code: OIDC_FAILURE.jwksUriNotJson }
    );
  }

  // The body was consumed by `.text()` to validate it, so hand jose a fresh `Response` over the same bytes. Only `content-type` is carried across: re-emitting the original headers would also re-emit `content-encoding`, which describes bytes that `.text()` has already decoded.
  return new Response(body, {
    status: 200,
    headers: { 'content-type': contentType === 'absent' ? 'application/json' : contentType }
  });
}

/**
 * Compile-time proof that {@link fetchJwksLeakSafe} still satisfies jose's own `FetchImplementation`.
 *
 * A function DECLARATION cannot carry that type annotation directly (and the `func-style` lint rule requires a declaration here rather than a typed `const` arrow), so the conformance is asserted separately instead of being merely assumed. It is not decoration: `createRemoteJWKSet` accepts the option through an index signature, so a signature that drifted out of step with jose's -- after an upgrade that adds a parameter, say -- would be accepted silently at the call site and fail only at runtime, inside the one code path whose whole purpose is to stop runtime failures being illegible. This line makes that a type error at build time.
 *
 * Underscore-prefixed because it is deliberately unread; the lint configuration allows unused names matching `/^_/`.
 */
const _conformsToJoseFetchImplementation: jose.FetchImplementation = fetchJwksLeakSafe;
