import { isHttpError } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '$env/dynamic/private';
import { GET } from './+server';

/**
 * `/api/diagnostics` reports what the server resolved for the caller's own request, so a deployer can check a reverse-proxy setup.
 *
 * The 404 cases are the load-bearing ones. The response names a client address and the forwarding headers, so the route must not exist for anyone unless the deployment switches it on, and a value that merely looks affirmative must not do so.
 */

/** The variable that switches the route on. */
const SWITCH = 'DEPLOYMENT_DIAGNOSTICS';

/** The origin of the request URL the cases use. It differs from every header value below, so a body that took its origin from a header would not equal it. */
const REQUEST_ORIGIN = 'https://vaa.example';

/** The address the default `getClientAddress` resolves. */
const CLIENT_ADDRESS = '203.0.113.7';

/** The response body the route promises its callers. */
type DiagnosticsBody = {
  origin: string;
  clientAddress: string | null;
  clientAddressError: string | null;
  headers: Record<string, string>;
};

/** The members of the response body, in no particular order. */
const BODY_KEYS: ReadonlyArray<keyof DiagnosticsBody> = ['origin', 'clientAddress', 'clientAddressError', 'headers'];

/** The request headers the response may report. Restated locally so the cases assert against the contract rather than against the handler's own list. */
const ALLOWED_HEADERS: ReadonlyArray<string> = [
  'host',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-port',
  'x-forwarded-host',
  'forwarded',
  'via'
];

/** Every allow-listed header, as a proxy would send them. */
const FORWARDING_HEADERS: Readonly<Record<string, string>> = {
  host: 'internal.example:3000',
  'x-forwarded-for': '198.51.100.4, 203.0.113.7',
  'x-forwarded-proto': 'http',
  'x-forwarded-port': '8080',
  'x-forwarded-host': 'spoofed.example',
  forwarded: 'for=198.51.100.4;proto=http',
  via: '1.1 proxy.example'
};

/** Headers the response must never report, each with a value that would be a leak if it appeared anywhere in the body. */
const CREDENTIAL_HEADERS: Readonly<Record<string, string>> = {
  cookie: 'session=cookie-secret',
  authorization: 'Bearer authorization-secret',
  'x-api-key': 'api-key-secret'
};

/** The message {@link failingClientAddress} throws with. */
const ADDRESS_ERROR = 'address header is absent from request';

/** The four console methods a handler could write a visitor's address with. */
const CONSOLE_METHODS = ['log', 'info', 'warn', 'error'] as const;

/**
 * Build the event the handler receives.
 *
 * @param options - The request headers, and the function the handler resolves the client address with.
 * @returns The event, typed as the handler's own parameter.
 */
function eventWith({
  headers = {},
  getClientAddress = () => CLIENT_ADDRESS
}: {
  headers?: Record<string, string>;
  getClientAddress?: () => string;
} = {}): Parameters<typeof GET>[0] {
  const url = new URL(`${REQUEST_ORIGIN}/api/diagnostics`);
  // A bare `Headers`, not a `Request`: a `Request` may drop the header names a browser forbids, `cookie` and `host` among them, and the cases need them to arrive.
  return { request: { headers: new Headers(headers) }, url, getClientAddress } as unknown as Parameters<typeof GET>[0];
}

/**
 * A `getClientAddress` that fails as the Node adapter's does when an address header is configured and the request does not carry it.
 *
 * @throws An `Error` whose message is {@link ADDRESS_ERROR}.
 */
function failingClientAddress(): string {
  throw new Error(ADDRESS_ERROR);
}

/**
 * Read a response's json body as the promised shape.
 *
 * @param response - The handler's response.
 * @returns The parsed body.
 */
async function bodyOf(response: Response): Promise<DiagnosticsBody> {
  return (await response.json()) as DiagnosticsBody;
}

/**
 * Run a function and hand back what it threw.
 *
 * @param run - The function to run.
 * @returns The thrown value, or `undefined` when nothing was thrown.
 */
function thrownBy(run: () => unknown): unknown {
  try {
    run();
  } catch (e) {
    return e;
  }
  return undefined;
}

afterEach(() => {
  // reason: `Reflect.deleteProperty`, not `delete`: the generated type of `$env/dynamic/private` makes a variable required once `.env` defines it, and `delete` of a required property does not type-check.
  Reflect.deleteProperty(env, SWITCH);
  vi.restoreAllMocks();
});

describe('GET /api/diagnostics', () => {
  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['`false`', 'false'],
    ['`1`', '1']
  ])('throws the kit 404 error when the switch is %s', (_label, value) => {
    if (value !== undefined) env[SWITCH] = value;

    expect(
      isHttpError(
        thrownBy(() => GET(eventWith({ headers: FORWARDING_HEADERS }))),
        404
      )
    ).toBe(true);
  });

  it.each([['true'], [' TRUE ']])(
    'answers 200 with the body shape and `cache-control: no-store` when the switch is `%s`',
    async (value) => {
      env[SWITCH] = value;

      const response = GET(eventWith({ headers: FORWARDING_HEADERS }));

      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      const body = await bodyOf(response);
      expect(Object.keys(body).sort()).toEqual([...BODY_KEYS].sort());
      expect(body.clientAddress).toBe(CLIENT_ADDRESS);
      expect(body.clientAddressError).toBeNull();
    }
  );

  it('reports the origin of the event URL, not one taken from a header', async () => {
    env[SWITCH] = 'true';

    const body = await bodyOf(GET(eventWith({ headers: FORWARDING_HEADERS })));

    expect(body.origin).toBe(REQUEST_ORIGIN);
  });

  it('reports the allow-listed headers and no other, never `cookie` or `authorization`', async () => {
    env[SWITCH] = 'true';
    const event = eventWith({ headers: { ...FORWARDING_HEADERS, ...CREDENTIAL_HEADERS } });
    // The request must carry the credentials, or their absence from the body would prove nothing.
    for (const [name, value] of Object.entries(CREDENTIAL_HEADERS)) expect(event.request.headers.get(name)).toBe(value);

    const response = GET(event);
    const text = await response.clone().text();
    const body = await bodyOf(response);

    expect(body.headers).toEqual(FORWARDING_HEADERS);
    for (const name of Object.keys(body.headers)) expect(ALLOWED_HEADERS).toContain(name);
    for (const value of Object.values(CREDENTIAL_HEADERS)) expect(text).not.toContain(value);
  });

  it('leaves out an allow-listed header the request does not carry', async () => {
    env[SWITCH] = 'true';

    const body = await bodyOf(GET(eventWith({ headers: { host: FORWARDING_HEADERS.host } })));

    expect(body.headers).toEqual({ host: FORWARDING_HEADERS.host });
  });

  it('still answers 200 when `getClientAddress` throws, with a null address and the thrown message', async () => {
    env[SWITCH] = 'true';

    const response = GET(eventWith({ headers: FORWARDING_HEADERS, getClientAddress: failingClientAddress }));

    expect(response.status).toBe(200);
    const body = await bodyOf(response);
    expect(body.clientAddress).toBeNull();
    expect(body.clientAddressError).toBe(ADDRESS_ERROR);
  });

  it('writes nothing to the console, whether it refuses, answers or fails to resolve the address', () => {
    const spies = CONSOLE_METHODS.map((method) => vi.spyOn(console, method).mockImplementation(() => {}));

    thrownBy(() => GET(eventWith({ headers: FORWARDING_HEADERS })));
    env[SWITCH] = 'true';
    const answered = GET(eventWith({ headers: { ...FORWARDING_HEADERS, ...CREDENTIAL_HEADERS } }));
    const unresolved = GET(eventWith({ headers: FORWARDING_HEADERS, getClientAddress: failingClientAddress }));

    // Both enabled calls must have answered, or the silence below would be that of a handler that did nothing.
    expect(answered.status).toBe(200);
    expect(unresolved.status).toBe(200);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});
