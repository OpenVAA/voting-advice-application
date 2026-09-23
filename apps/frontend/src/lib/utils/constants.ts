import { env } from '$env/dynamic/public';

export const constants = {
  PUBLIC_BROWSER_BACKEND_URL: env.PUBLIC_BROWSER_BACKEND_URL ?? '',
  PUBLIC_SERVER_BACKEND_URL: env.PUBLIC_SERVER_BACKEND_URL ?? '',
  PUBLIC_BROWSER_FRONTEND_URL: env.PUBLIC_BROWSER_FRONTEND_URL ?? '',
  PUBLIC_SERVER_FRONTEND_URL: env.PUBLIC_SERVER_FRONTEND_URL ?? '',
  PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: env.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID ?? '',
  PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT: env.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT ?? '',
  // The ONE authoritative default, and it has to stay. The review comment "Remove default." on this line predates `55c9c07e9` (157-13), which removed the SECOND, downstream `|| 'signicat'` in `$lib/api/utils/auth/providers` - so the duplication that comment named is already gone and this is the only default left. Removing this one as well is NOT a no-op: `getActiveProvider()` has no `case` for an empty string, so an unset `PUBLIC_IDENTITY_PROVIDER_TYPE` would fall through to its `default:` throw and break all four callers (the three `/api/oidc/*` endpoints and the preregister layout load). Whether an unconfigured deployment SHOULD fail loudly there is a fail-loudly-posture question and belongs to Phase 157.1; filed at `.planning/todos/pending/2026-09-03-159-identity-provider-default-remove-request.md`.
  PUBLIC_IDENTITY_PROVIDER_TYPE: env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat',
  PUBLIC_DEBUG: env.PUBLIC_DEBUG?.toLowerCase() === 'true',
  PUBLIC_CACHE_ENABLED: env.PUBLIC_CACHE_ENABLED?.toLowerCase() === 'true',
  PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL ?? '',
  PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY ?? ''
};
