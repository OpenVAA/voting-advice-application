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

/**
 * Read the inner-JWT iss/aud the token endpoint must align to (Pitfall 4). Read lazily per token request so the values reflect the SvelteKit-server env this issuer was launched alongside. Throws loudly if absent — a silent default would produce a mysterious `invalid_token` callback redirect.
 */
function tokenIssAud(): { issuer: string; audience: string } {
  const issuer = process.env.IDENTITY_PROVIDER_ISSUER;
  const audience = process.env.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
  if (!issuer || !audience) {
    throw new Error(
      'mockOidcIssuer: IDENTITY_PROVIDER_ISSUER and PUBLIC_IDENTITY_PROVIDER_CLIENT_ID must be set ' +
        'so the synthetic id_token iss/aud match the server verify (Pitfall 4).'
    );
  }
  return { issuer, audience };
}

/** Read the full request body (used for the token endpoint). */
async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Array<Buffer> = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
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
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'missing request (JAR) param' }));
          return;
        }
        const jar = jose.decodeJwt(jarParam);
        const redirectUri = String(jar.redirect_uri ?? '');
        const state = String(jar.state ?? '');
        if (!redirectUri) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'JAR missing redirect_uri' }));
          return;
        }
        const location = `${redirectUri}?code=test-code&state=${encodeURIComponent(state)}`;
        res.writeHead(302, { Location: location });
        res.end();
        return;
      }

      if (u.pathname === '/oauth2/token' && req.method === 'POST') {
        await readBody(req); // drain the body; client_assertion accepted without validation
        const { sigPriv, encPubJwk } = await getTestKeys();
        const idToken = await buildTestIdToken(IDURA_CLAIMS, sigPriv, encPubJwk, tokenIssAud());
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id_token: idToken, token_type: 'Bearer', expires_in: 300 }));
        return;
      }

      if (req.method === 'GET' && u.pathname.endsWith('/jwks')) {
        const { sigPubJwk } = await getTestKeys();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ keys: [sigPubJwk] }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found', path: u.pathname }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'mock issuer error', detail: String(err) }));
    }
  }

  return {
    url: `https://${BIND_HOST}:${opts.port}`,
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
