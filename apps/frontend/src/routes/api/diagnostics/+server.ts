import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

/** The request headers the response reports. An allow-list, so a header that carries a credential is never echoed. */
const FORWARDING_HEADERS: ReadonlyArray<string> = [
  'host',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-port',
  'x-forwarded-host',
  'forwarded',
  'via'
];

/** The body `GET /api/diagnostics` answers with when it is enabled. */
type DiagnosticsBody = {
  /** The origin the server resolved for the request. */
  origin: string;
  /** The client address the server resolved, or `null` when it could not resolve one. */
  clientAddress: string | null;
  /** Why no client address was resolved, or `null` when one was. */
  clientAddressError: string | null;
  /** The forwarding headers the request carried, by lower-case name. */
  headers: Record<string, string>;
};

/**
 * Deployment diagnostics: what this server resolved for the caller's own request.
 *
 * The route answers 404 unless the private variable `DEPLOYMENT_DIAGNOSTICS` is `true`, read at call time. When enabled it reports the resolved origin, the resolved client address and the forwarding headers the server received, which is what a deployer needs to check a reverse-proxy setup.
 *
 * It writes nothing to any log, so no visitor address is recorded.
 *
 * @returns A json `Response` with a `DiagnosticsBody` and `cache-control: no-store`.
 * @throws The kit 404 error when the route is not enabled.
 */
export function GET({ request, url, getClientAddress }: RequestEvent): Response {
  if (!isEnabled(env.DEPLOYMENT_DIAGNOSTICS)) error(404);

  let clientAddress: string | null = null;
  let clientAddressError: string | null = null;
  try {
    clientAddress = getClientAddress();
  } catch (e) {
    // The Node adapter throws when an address header is configured and the request does not carry it. That is a finding to report, not a failure of this route.
    clientAddressError = e instanceof Error ? e.message : String(e);
  }

  const headers: Record<string, string> = {};
  for (const name of FORWARDING_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers[name] = value;
  }

  const body: DiagnosticsBody = { origin: url.origin, clientAddress, clientAddressError, headers };
  return json(body, { headers: { 'cache-control': 'no-store' } });
}

/**
 * Whether the raw value of the switch enables the route. Only `true` does, in any letter case and with surrounding whitespace ignored, so a value that merely looks affirmative leaves the route off.
 *
 * @param raw - The raw environment value.
 * @returns `true` when the route is enabled.
 */
function isEnabled(raw: unknown): boolean {
  return typeof raw === 'string' && raw.trim().toLowerCase() === 'true';
}
