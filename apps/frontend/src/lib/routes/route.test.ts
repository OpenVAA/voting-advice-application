import { describe, expect, it } from 'vitest';
import { isApiRoute } from './route';

describe('isApiRoute', () => {
  it.each(['/api', '/api/cache', '/api/candidate/auth/callback', '/api/admin/jobs/single/[jobId]/progress'])(
    'claims the API route id %s',
    (routeId) => {
      expect(isApiRoute(routeId)).toBe(true);
    }
  );

  it.each(['/', '/(voters)/(located)/results', '/candidate/(protected)/profile', '/admin', '/apiary', '/(voters)/api'])(
    'does not claim the route id %s',
    (routeId) => {
      expect(isApiRoute(routeId)).toBe(false);
    }
  );
});
