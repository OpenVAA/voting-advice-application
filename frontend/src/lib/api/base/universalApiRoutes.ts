/**
 * The root of all api routes.
 * Note that this is imported by `hooks.server.ts` to handle api routes differently.
 */
export const API_ROOT = '/api';

/**
 * Api routes that are used by the universal adapters.
 */
export const UNIVERSAL_API_ROUTES = {
  logout: `${API_ROOT}/candidate/logout`,
  preregister: `${API_ROOT}/candidate/preregister`,
  token: `${API_ROOT}/oidc/token`,
  cacheProxy: `${API_ROOT}/cache`
} as const;
