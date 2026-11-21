import { describe, expect, it } from 'vitest';
import { buildRoute } from './buildRoute';
import { CONTESTANT_PROT, isApiRoute, isContestantRoute, isProtectedRoute, ROUTE } from './route';

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

describe('ROUTE.AuthConfirm', () => {
  it('is the confirm page between a mailed link and its verification, outside the API and both apps', () => {
    expect(ROUTE.AuthConfirm).toBe('/auth/confirm');
    expect(isApiRoute(ROUTE.AuthConfirm)).toBe(false);
    expect(isContestantRoute(ROUTE.AuthConfirm)).toBe(false);
  });
});

describe('ROUTE.ContestantAppSettings', () => {
  it('is the one settings page, directly below the protected root of the Contestant App, naming no entity', () => {
    expect(ROUTE.ContestantAppSettings).toBe(`${CONTESTANT_PROT}/settings`);
    expect(isProtectedRoute(ROUTE.ContestantAppSettings)).toBe(true);
  });

  it('is built with no params as the settings path at the app root', () => {
    expect(ROUTE.ContestantAppSettings).toBe(`${CONTESTANT_PROT}/settings`);
    expect(buildRoute({ route: 'ContestantAppSettings', locale: 'en' })).toBe('/contestant/settings');
  });
});
