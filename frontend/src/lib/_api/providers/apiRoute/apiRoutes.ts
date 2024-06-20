const API_ROOT = '/api/data';

export const API_ROUTES = {
  candidates: `${API_ROOT}/candidates`
} as const;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];
