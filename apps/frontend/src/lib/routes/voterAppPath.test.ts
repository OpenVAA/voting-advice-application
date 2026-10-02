import { describe, expect, it } from 'vitest';
import { isVoterAppPath } from './voterAppPath';

describe('isVoterAppPath', () => {
  it.each([
    '/results',
    '/results/el-1/candidates',
    '/results/el-1/candidates/candidate/c-1',
    '/results/statistics',
    '/questions',
    '/questions/q-1',
    '/questions/category/cat-1',
    '/nominations',
    '/results/',
    '/results?electionId=el-1&constituencyId=co-1',
    '/fi/results',
    '/fi/questions/q-1?electionId=el-1'
  ])('accepts the Voter App path %s', (path) => {
    expect(isVoterAppPath(path)).toBe(true);
  });

  it.each([
    ['a cross-origin URL', 'https://evil.com/results'],
    ['a protocol-relative URL', '//evil.com/results'],
    ['a protocol-relative URL behind a locale', '//fi/results'],
    ['a backslash authority', '/\\evil.com/results'],
    ['a relative path', 'results'],
    ['an empty string', ''],
    ['the bare root', '/'],
    ['a bare locale', '/fi'],
    ['a bare locale with a separator', '/fi/'],
    ['an empty segment', '/results//evil.com'],
    ['a dot-dot segment', '/results/../..//evil.com'],
    ['a percent-encoded dot-dot segment', '/results/%2e%2E/%2e%2e//evil.com'],
    ['a dot segment', '/results/./x'],
    ['a Candidate App path', '/candidate/profile'],
    ['a locale-prefixed Candidate App path', '/fi/candidate/profile'],
    ['an Admin App path', '/admin/jobs'],
    ['an API path', '/api/auth/logout'],
    ['a root that only begins with a voter segment', '/resultsx'],
    ['an unknown locale-like prefix', '/xx/results']
  ])('rejects %s: %s', (_label, path) => {
    expect(isVoterAppPath(path)).toBe(false);
  });
});
