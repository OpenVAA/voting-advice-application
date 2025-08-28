import { API_ROOT } from '../adapters/apiRoute/apiRoutes';

/**
 * Api routes that are used by the universal adapters.
 */
export const UNIVERSAL_API_ROUTES = {
  cacheProxy: `${API_ROOT}/auth/cache`,
  login: `${API_ROOT}/auth/login`,
  logout: `${API_ROOT}/auth/logout`,
  preregister: `${API_ROOT}/candidate/preregister`,
  token: `${API_ROOT}/oidc/token`,

  // Job management routes for the Admin App
  jobs: '/api/admin/jobs',
  jobStart: '/api/admin/jobs/start',
  jobProgress: (id: string) => `/api/admin/jobs/single/${id}/progress`,
  jobAbort: (id: string) => `/api/admin/jobs/single/${id}/abort`,
  jobAbortAll: '/api/admin/jobs/abort-all'
} as const;
