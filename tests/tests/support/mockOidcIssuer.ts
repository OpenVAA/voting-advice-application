/**
 * A mock OIDC issuer for the identity-provider E2E tests: the provider the application's Idura flow talks to when a run points `IDURA_DOMAIN` at this server. Test-only.
 *
 * The code-for-token exchange and the token's decryption run in the SvelteKit server, not in the browser, so `page.route()` cannot stand in for the provider. This server is reachable from that server and leaves the application's authorize, callback, exchange and decryption code unchanged.
 *
 * **What it serves**, over HTTPS:
 *   1. `GET /oauth2/authorize`: decodes, without verifying, the signed request object the application sends in the `request` parameter, reads its `redirect_uri` and `state`, and redirects back to that `redirect_uri` with a code or an error and the same `state`. The redirect also sets the cookie {@link MOCK_UI_LOCALES_COOKIE} on this server's origin to the request object's `ui_locales`, or to {@link NO_UI_LOCALES} when it carries none, so a test can read what the provider was asked for.
 *   2. `POST /oauth2/token`: exchanges a code for `{ id_token }`, a token built by `buildTestIdToken` with the issuer {@link MOCK_ISSUER} and the audience {@link MOCK_AUDIENCE}. The client assertion is not checked.
 *   3. `GET` any path ending in `/jwks`: the public signing key of the committed test pair.
 *
 * **The selector.** A test chooses who the provider says the user is, and how it answers, with the cookie {@link MOCK_SCENARIO_COOKIE} set in the test's own browser context; its value is {@link encodeMockScenario} of a {@link MockScenario}. The authorize endpoint reads it from the request's `Cookie` header and from nowhere else:
 *   - `success`: a fresh random code, remembered with the scenario's claims; the token endpoint mints a token for that identity.
 *   - `token-error`: a fresh random code that the token endpoint refuses with 400 `invalid_grant`.
 *   - `cancel`: a redirect with `error=access_denied`; `provider-error`: a redirect with `error=server_error`.
 * A request with no selector, or one that does not decode, gets the fixed code `test-code`, which always mints {@link IDURA_CLAIMS}.
 *
 * **Single use.** The token endpoint is called server to server and carries no browser cookie, so it reads only the code. A random code is removed from memory on its first exchange; a second exchange of it, or a code never issued, is refused with 400 `invalid_grant`. Two tests therefore cannot receive each other's identity.
 *
 * **TLS.** The application builds `https://` URLs for the provider, so the server uses the committed self-signed certificate under this directory (subject alternative names `127.0.0.1` and `localhost`). That certificate is installed into no trust store. The dev server trusts it through `NODE_EXTRA_CA_CERTS`, which `tests/scripts/e2e-run.sh` sets for that process alone, and the browser through `ignoreHTTPSErrors` on the projects that navigate here. Certificate verification is disabled nowhere.
 *
 * **Security.** It listens on `127.0.0.1` alone. It signs with the committed test key pair (`tests/tests/utils/testKeys.ts`) and no other key; no deployment trusts that pair.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import https from 'node:https';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as jose from 'jose';
import { buildTestIdToken } from '../utils/buildTestIdToken';
import { getTestKeys } from '../utils/testKeys';
import type { IncomingMessage, ServerResponse } from 'node:http';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Fixed loopback host the issuer binds to — never a public interface. */
const BIND_HOST = '127.0.0.1';

/** The issuer every token this server mints carries, and the one the test environment of the application and of `identity-callback` expects. */
export const MOCK_ISSUER = 'https://127.0.0.1:9443';

/** The audience every token this server mints carries: the client id of the test environment. */
export const MOCK_AUDIENCE = 'test-client-id';

/** The name of the cookie that selects a test's identity and outcome. */
export const MOCK_SCENARIO_COOKIE = 'mock_oidc_scenario';

/** The name of the cookie the authorize endpoint sets to the `ui_locales` of the request object it received, URI-encoded. */
export const MOCK_UI_LOCALES_COOKIE = 'mock_oidc_ui_locales';

/** The value of {@link MOCK_UI_LOCALES_COOKIE} for a request object that carries no `ui_locales`. */
export const NO_UI_LOCALES = 'none';

/** How the provider answers a selected authorization. */
export type MockOutcome = 'success' | 'cancel' | 'provider-error' | 'token-error';

/** Who the provider says the user is, and how it answers. */
export interface MockScenario {
  sub: string;
  givenName: string;
  familyName: string;
  outcome: MockOutcome;
}

const MOCK_OUTCOMES: ReadonlyArray<MockOutcome> = Object.freeze(['success', 'cancel', 'provider-error', 'token-error']);

/** The longest value a scenario field may hold. */
const MAX_FIELD_LENGTH = 128;

/** The longest selector cookie value that is decoded at all. */
const MAX_SELECTOR_LENGTH = 1024;

/** The code that mints the fixed identity, answered to an authorization without a selector. */
const FIXED_CODE = 'test-code';

/**
 * The fixed identity: the claims the token endpoint mints for {@link FIXED_CODE}. `sub` is the persistent pseudonym an Idura identity is matched on.
 */
export const IDURA_CLAIMS: Record<string, string> = {
  sub: 'test-bank-auth-journey-sub-001',
  given_name: 'Testi',
  family_name: 'Tunnistautuja',
  birthdate: '1990-01-15',
  hetu: '150190-999X',
  country: 'FI',
  identityscheme: 'fitupas'
};

/**
 * Encode a scenario as the value of {@link MOCK_SCENARIO_COOKIE}: base64url of its JSON.
 *
 * @param scenario - The identity and the outcome.
 * @returns A cookie value with no character that needs escaping.
 */
export function encodeMockScenario(scenario: MockScenario): string {
  const { sub, givenName, familyName, outcome } = scenario;
  return Buffer.from(JSON.stringify({ sub, givenName, familyName, outcome }), 'utf8').toString('base64url');
}

/** Whether a value is a non-empty string no longer than {@link MAX_FIELD_LENGTH}. */
function isBoundedString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_FIELD_LENGTH;
}

/**
 * Decode a {@link MOCK_SCENARIO_COOKIE} value.
 *
 * @param value - The cookie's value as received.
 * @returns The scenario, or null when the value is not base64url JSON of an object whose four fields are bounded strings with a known outcome.
 */
export function decodeMockScenario(value: string): MockScenario | null {
  if (value.length === 0 || value.length > MAX_SELECTOR_LENGTH || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const { sub, givenName, familyName, outcome } = parsed as Record<string, unknown>;
  if (!isBoundedString(sub) || !isBoundedString(givenName) || !isBoundedString(familyName)) return null;
  if (!MOCK_OUTCOMES.includes(outcome as MockOutcome)) return null;
  return { sub, givenName, familyName, outcome: outcome as MockOutcome };
}

/**
 * The claims the token endpoint mints for a scenario: those of {@link IDURA_CLAIMS} with the scenario's subject and names.
 *
 * @param scenario - The selected identity.
 * @returns A claim set of the same keys as {@link IDURA_CLAIMS}.
 */
export function mockIdentityClaims(
  scenario: Pick<MockScenario, 'sub' | 'givenName' | 'familyName'>
): Record<string, string> {
  return {
    ...IDURA_CLAIMS,
    sub: scenario.sub,
    given_name: scenario.givenName,
    family_name: scenario.familyName
  };
}

/** The selector a request carries in its own `Cookie` header, or null. */
function selectorOf(req: IncomingMessage): MockScenario | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === MOCK_SCENARIO_COOKIE) {
      return decodeMockScenario(part.slice(separator + 1).trim());
    }
  }
  return null;
}

/** Options for {@link createMockOidcIssuer}. */
export interface MockOidcIssuerOptions {
  /** Port to bind on 127.0.0.1; 0 for any free port. */
  port: number;
  /**
   * Absolute paths to the TLS cert/key. Defaults to the committed self-signed localhost pair colocated with this module.
   */
  certPath?: string;
  keyPath?: string;
}

/** Handle returned by {@link createMockOidcIssuer}. */
export interface MockOidcIssuerHandle {
  /** Start listening; resolves once bound. */
  start(): Promise<void>;
  /** Stop listening; resolves once closed. */
  stop(): Promise<void>;
  /** The base HTTPS URL, read from the bound socket once started (e.g. `https://127.0.0.1:9443`). */
  readonly url: string;
}

/** Read the full request body. */
async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Array<Buffer> = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** A redirect target: the URI with the given parameters appended as its query. */
function redirectTo(redirectUri: string, parameters: Array<[string, string]>): string {
  return `${redirectUri}?${parameters.map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('&')}`;
}

/**
 * The `Set-Cookie` value that reports the `ui_locales` of a request object: the claim URI-encoded, or {@link NO_UI_LOCALES} when it is absent, not a string, empty or longer than {@link MAX_FIELD_LENGTH}.
 *
 * @param uiLocales - The request object's `ui_locales` claim.
 * @returns The header value, for this server's origin alone.
 */
export function uiLocalesCookie(uiLocales: unknown): string {
  const value = isBoundedString(uiLocales) ? encodeURIComponent(uiLocales) : NO_UI_LOCALES;
  return `${MOCK_UI_LOCALES_COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax`;
}

/** Answer with a JSON body. */
function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

/**
 * Create the mock OIDC issuer. Returns a `{ start, stop, url }` handle.
 *
 * Each issuer keeps its own memory of the codes it issued for a selector.
 */
export function createMockOidcIssuer(opts: MockOidcIssuerOptions): MockOidcIssuerHandle {
  const certPath = opts.certPath ?? join(HERE, 'mock-oidc-cert.pem');
  const keyPath = opts.keyPath ?? join(HERE, 'mock-oidc-key.pem');

  const tlsCert = readFileSync(certPath);
  const tlsKey = readFileSync(keyPath);

  /** Codes issued for a selector, each removed on its first exchange. */
  const issuedCodes = new Map<string, { claims: Record<string, string>; outcome: MockOutcome }>();

  const server = https.createServer({ cert: tlsCert, key: tlsKey }, (req, res) => {
    void handle(req, res);
  });

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // The base only serves relative-URL parsing.
      const u = new URL(req.url ?? '/', `https://${BIND_HOST}`);

      if (u.pathname === '/oauth2/authorize') {
        const jarParam = u.searchParams.get('request');
        if (!jarParam) {
          sendJson(res, 400, { error: 'missing request (JAR) param' });
          return;
        }
        const jar = jose.decodeJwt(jarParam);
        const redirectUri = String(jar.redirect_uri ?? '');
        const state = String(jar.state ?? '');
        if (!redirectUri) {
          sendJson(res, 400, { error: 'JAR missing redirect_uri' });
          return;
        }

        const scenario = selectorOf(req);
        let location: string;
        if (!scenario) {
          location = redirectTo(redirectUri, [
            ['code', FIXED_CODE],
            ['state', state]
          ]);
        } else if (scenario.outcome === 'cancel' || scenario.outcome === 'provider-error') {
          location = redirectTo(redirectUri, [
            ['error', scenario.outcome === 'cancel' ? 'access_denied' : 'server_error'],
            ['state', state]
          ]);
        } else {
          const code = randomBytes(24).toString('base64url');
          issuedCodes.set(code, { claims: mockIdentityClaims(scenario), outcome: scenario.outcome });
          location = redirectTo(redirectUri, [
            ['code', code],
            ['state', state]
          ]);
        }
        res.writeHead(302, { Location: location, 'Set-Cookie': uiLocalesCookie(jar.ui_locales) });
        res.end();
        return;
      }

      if (u.pathname === '/oauth2/token' && req.method === 'POST') {
        const code = new URLSearchParams(await readBody(req)).get('code') ?? '';
        let claims: Record<string, string>;
        if (code === FIXED_CODE) {
          claims = IDURA_CLAIMS;
        } else {
          const issued = issuedCodes.get(code);
          issuedCodes.delete(code);
          if (!issued || issued.outcome !== 'success') {
            sendJson(res, 400, { error: 'invalid_grant' });
            return;
          }
          claims = issued.claims;
        }
        const { sigPriv, encPubJwk } = await getTestKeys();
        const idToken = await buildTestIdToken(claims, sigPriv, encPubJwk, {
          issuer: MOCK_ISSUER,
          audience: MOCK_AUDIENCE
        });
        sendJson(res, 200, { id_token: idToken, token_type: 'Bearer', expires_in: 300 });
        return;
      }

      if (req.method === 'GET' && u.pathname.endsWith('/jwks')) {
        const { sigPubJwk } = await getTestKeys();
        sendJson(res, 200, { keys: [sigPubJwk] });
        return;
      }

      sendJson(res, 404, { error: 'not found', path: u.pathname });
    } catch (err) {
      sendJson(res, 500, { error: 'mock issuer error', detail: String(err) });
    }
  }

  return {
    get url(): string {
      const address = server.address();
      if (address && typeof address === 'object') return `https://${address.address}:${address.port}`;
      return `https://${BIND_HOST}:${opts.port}`;
    },
    start(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(opts.port, BIND_HOST, () => {
          server.removeListener('error', reject);
          resolve();
        });
      });
    },
    stop(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  };
}
