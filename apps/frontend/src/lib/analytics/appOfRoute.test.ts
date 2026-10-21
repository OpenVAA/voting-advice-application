import { describe, expect, it } from 'vitest';
import { ADMIN, CONTESTANT, ROUTE, VOTER } from '$lib/routes/route';
import { appOfRoute } from './appOfRoute';

describe('appOfRoute', () => {
  it('names the voter app for the voter root and every route below it', () => {
    expect(appOfRoute('/(voters)/(located)/questions')).toBe('voter');
    expect(appOfRoute(VOTER)).toBe('voter');
    expect(appOfRoute(ROUTE.ResultEntity)).toBe('voter');
  });

  it('names the contestant app for the contestant root and every route below it', () => {
    expect(appOfRoute(CONTESTANT)).toBe('contestant');
    expect(appOfRoute('/contestant/(protected)')).toBe('contestant');
    expect(appOfRoute(ROUTE.ContestantAppQuestion)).toBe('contestant');
  });

  it('names the admin app for the admin root and every route below it', () => {
    expect(appOfRoute(ADMIN)).toBe('admin');
    expect(appOfRoute('/admin/(protected)/jobs')).toBe('admin');
    expect(appOfRoute(ROUTE.AdminAppLogin)).toBe('admin');
  });

  it('names no app for an endpoint or an empty id', () => {
    expect(appOfRoute('/api/usage')).toBeUndefined();
    expect(appOfRoute('')).toBeUndefined();
    expect(appOfRoute('/')).toBeUndefined();
  });

  it('matches whole segments only', () => {
    expect(appOfRoute('/contestants')).toBeUndefined();
    expect(appOfRoute('/administration')).toBeUndefined();
    expect(appOfRoute('/(voters)extra')).toBeUndefined();
    expect(appOfRoute('contestant')).toBeUndefined();
  });
});
