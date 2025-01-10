import { DP_METHOD } from '$lib/api/base/dataTypes';

export const API_ROOT = '/api';

export const API_GET_ROUTES = Object.fromEntries(
  Object.keys(DP_METHOD).map((collection) => [collection, `${API_ROOT}/data/${collection}`])
) as Record<keyof typeof DP_METHOD, string>;

export type ApiGetRoute = keyof typeof API_GET_ROUTES;

export const API_POST_ROUTES = {
  feedbacks: `${API_ROOT}/feedback`
};

export type ApiPostRoute = keyof typeof API_POST_ROUTES;

export const API_ROUTES = { ...API_GET_ROUTES, ...API_POST_ROUTES };

export type ApiRoute = keyof typeof API_ROUTES;
