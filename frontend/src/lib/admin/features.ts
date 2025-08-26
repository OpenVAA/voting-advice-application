import { type Route } from '$lib/utils/route';

export type AdminFeature = 'ArgumentCondensation'; // Add rest

export const ADMIN_FEATURE: Record<AdminFeature, Route> = {
  ArgumentCondensation: 'AdminAppArgumentCondensation'
} as const;
