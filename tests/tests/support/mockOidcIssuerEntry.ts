/**
 * Runnable entrypoint for the mock OIDC issuer of the identity-provider E2E specs. Localhost-only, TEST-ONLY.
 *
 * Launched by the Playwright `webServer` entry in `tests/playwright.config.ts` (e.g. `tsx tests/tests/support/mockOidcIssuerEntry.ts`) in every run. It starts the issuer on a FIXED port bound to 127.0.0.1 only, logs a ready line Playwright's `webServer` readiness probe can wait on, and stays alive until terminated.
 *
 * The issuer serves authorize/token/JWKS over HTTPS with the committed self-signed localhost cert (see `mockOidcIssuer.ts` for the full security/HTTPS rationale).
 *
 * Port: defaults to 9443; override with MOCK_OIDC_PORT. The SvelteKit server's `IDURA_DOMAIN` / `IDENTITY_PROVIDER_JWKS_URI` must point at this host:port; `tests/scripts/e2e-run.sh` gives the dev server that environment.
 */
import { createMockOidcIssuer } from './mockOidcIssuer';

const PORT = process.env.MOCK_OIDC_PORT ? Number(process.env.MOCK_OIDC_PORT) : 9443;

async function main(): Promise<void> {
  const issuer = createMockOidcIssuer({ port: PORT });

  function shutdown(): void {
    void issuer.stop().finally(() => process.exit(0));
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await issuer.start();
  // Ready line — Playwright's webServer readiness probe waits on the URL; this log is the human/CI-visible confirmation that the issuer bound successfully.
  // eslint-disable-next-line no-console
  console.log(`mock OIDC issuer ready at ${issuer.url} (127.0.0.1 only, TEST-ONLY)`);
}

void main().catch((err) => {
  console.error('mock OIDC issuer failed to start:', err);
  process.exit(1);
});
