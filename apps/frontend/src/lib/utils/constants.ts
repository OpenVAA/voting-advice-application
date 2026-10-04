import { env } from '$env/dynamic/public';

export const constants = {
  PUBLIC_BROWSER_FRONTEND_URL: env.PUBLIC_BROWSER_FRONTEND_URL ?? '',
  PUBLIC_SERVER_FRONTEND_URL: env.PUBLIC_SERVER_FRONTEND_URL ?? '',
  PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: env.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID ?? '',
  PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT: env.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT ?? '',
  // The one default for the provider keyword; nothing downstream applies another. `getActiveProvider()` has no case for an empty string, so without it an unset `PUBLIC_IDENTITY_PROVIDER_TYPE` would throw in all four callers: the three `/api/oidc/*` endpoints and the preregister layout load.
  PUBLIC_IDENTITY_PROVIDER_TYPE: env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat-ftn',
  PUBLIC_DEBUG: env.PUBLIC_DEBUG?.toLowerCase() === 'true',
  // A raw passthrough, deliberately NOT the coercion shape used above and below. `resolveLogLevel` owns every bit of normalisation because an unset value and a wrong value must stay distinguishable, and a `?.toLowerCase() === '…'` here would map both onto one result before the resolver ever saw them.
  PUBLIC_LOG_LEVEL: env.PUBLIC_LOG_LEVEL ?? '',
  PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL ?? '',
  PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY ?? '',
  // Deliberately the same flat `?? ''` shape as its neighbours, with no throw here. Every module that imports `constants` would throw at import time if the check lived on this line, including server modules that never touch the Supabase adapter. The fail-fast belongs at the one place the value is actually resolved, `supabaseAdapterMixin`, and it lives there.
  PUBLIC_PROJECT_ID: env.PUBLIC_PROJECT_ID ?? ''
};
