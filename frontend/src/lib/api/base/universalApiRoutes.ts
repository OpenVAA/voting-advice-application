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
  jobsActive: `${API_ROOT}/admin/jobs/active`,
  jobsPast: `${API_ROOT}/admin/jobs/past`,
  jobStart: `${API_ROOT}/admin/jobs/start`,
  jobProgress: `${API_ROOT}/admin/jobs/single/[jobId]/progress`,
  jobAbort: `${API_ROOT}/admin/jobs/single/[jobId]/abort`,
  jobAbortAll: `${API_ROOT}/admin/jobs/abort-all`
} as const;
