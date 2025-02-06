/**
 * Api routes that are used by the universal adapters.
 */
export const UNIVERSAL_API_ROUTES = {
  logout: '/api/candidate/logout',
  preregister: '/api/candidate/preregister',
  token: '/api/oidc/token'
} as const;
