/**
 * Point-of-use assertion for identity-provider configuration.
 *
 * `$lib/utils/constants.ts` and `$lib/server/constants.ts` deliberately flatten every value with `?? ''` and never throw, because both are eager object literals imported by modules that have no interest in the identity provider — a throw on those lines would break every one of them at import time. The consequence is that an unset variable arrives here as an empty string that concatenates perfectly happily, so the check has to live at the point the value is actually USED. That is the same placement rule `PUBLIC_PROJECT_ID` follows (see the comment on it in `$lib/utils/constants.ts`, and the fail-fast in `supabaseAdapterMixin`).
 *
 * Why this exists at all: an unset `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT` used to make `signicatProvider.getAuthorizeUrl` return a string beginning `?client_id=…`. That is a RELATIVE url, so `window.location.href = authorizeUrl` sent the browser back to the page it was already on, carrying the authorization request as a query string, with a 200 from the endpoint and nothing thrown anywhere. The bug presented as "clicking Identify yourself just reloads the page" and took a full debug session to trace to a missing env var. Failing loudly here, naming the variable, is the difference between a five-second fix and that session; see `.planning/debug/resolved/idura-bank-auth-empty-client.md`.
 *
 * Whitespace counts as unset: a variable left as `FOO= ` in an env file is a configuration mistake, not a value, and `https:// /oauth2/authorize` is not a url worth constructing.
 */

/**
 * Throw unless every supplied configuration value is present and non-blank.
 *
 * @param values - Map of variable NAME to its resolved value. The names are what the error message reports, so pass them under the exact spelling used in the env file — shorthand property syntax (`{ IDURA_DOMAIN }`) gets this right for free.
 * @throws {Error} Naming every missing variable. The message carries names only and never a value, so it is safe to log and safe to surface in a server error; callers in `routes/api/oidc/*` turn it into a 500 with the reason on the server console.
 */
export function requireConfigured(values: Record<string, string | undefined>): void {
  const missing = Object.entries(values)
    .filter(([, value]) => value === undefined || value.trim() === '')
    .map(([name]) => name);

  if (missing.length === 0) return;

  throw new Error(
    `Identity provider is not configured: ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} unset or empty. ` +
      'Set them in the repo-root `.env` (see `.env.example`) and restart the dev server.'
  );
}
