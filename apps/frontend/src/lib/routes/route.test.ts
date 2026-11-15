import { describe, expect, it } from 'vitest';
import { isApiRoute } from './route';

describe('isApiRoute', () => {
  it.each(['/api', '/api/auth/logout', '/api/auth/callback', '/api/admin/jobs/single/[jobId]/progress'])(
    'claims the API route id %s',
    (routeId) => {
      expect(isApiRoute(routeId)).toBe(true);
    }
  );

  it.each([
    '/',
    '/(voters)/(located)/results',
    '/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile',
    '/admin',
    '/apiary',
    '/(voters)/api'
  ])('does not claim the route id %s', (routeId) => {
    expect(isApiRoute(routeId)).toBe(false);
  });
});
