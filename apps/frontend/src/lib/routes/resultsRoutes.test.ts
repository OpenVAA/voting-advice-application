import { describe, expect, it, vi } from 'vitest';
import { buildListRoute, narrowEntityPlural, pluralForEntityType } from './resultsRoutes';
import type { BuildRouteCurrent } from './buildRoute';

const locale = vi.hoisted(() => ({ current: 'en', base: 'en' }));

// The shared `$app/paths` stub only substitutes required `[name]` params. The results route is all optional, matcher-gated params under route groups, so this mirrors SvelteKit's own resolution: groups drop out, and an optional param without a value drops its segment.
vi.mock('$app/paths', () => ({
  resolveRoute: (id: string, params: Record<string, string | undefined>) =>
    '/' +
    id
      .slice(1)
      .split('/')
      .filter((segment) => segment !== '' && !/^\([^)]+\)$/.test(segment))
      .map((segment) =>
        segment.replace(/\[(\[)?(\w+?)(?:=\w+)?\]\]?/g, (_, _optional, name: string) => params[name] ?? '')
      )
      .filter(Boolean)
      .join('/')
}));

// Paraglide's `url` strategy prefixes every non-base locale and leaves the base locale bare.
vi.mock('$lib/paraglide/runtime', () => ({
  localizeHref: (href: string, options?: { locale?: string }) => {
    const target = options?.locale ?? locale.current;
    return target === locale.base ? href : `/${target}${href}`;
  }
}));

function current(path: string, params: Record<string, string> = {}): BuildRouteCurrent {
  return {
    params,
    route: { id: '/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]' },
    url: new URL(`http://localhost${path}`)
  };
}

describe('buildListRoute', () => {
  it('builds the election and plural segments', () => {
    expect(buildListRoute('el-1', 'organizations', current('/results'))).toBe('/results/el-1/organizations');
  });

  it('never fills in a plural that was not passed', () => {
    expect(
      buildListRoute(
        'el-1',
        undefined,
        current('/results/el-1/candidates', { electionTab: 'el-1', entityTab: 'candidates' })
      )
    ).toBe('/results/el-1');
  });

  it('builds the election-picker shape without an election', () => {
    expect(buildListRoute(undefined, undefined, current('/results/el-1', { electionTab: 'el-1' }))).toBe('/results');
  });

  it('drops the drawer segments of the current URL', () => {
    const from = current('/results/el-1/candidates/candidate/c-1', {
      electionTab: 'el-1',
      entityTab: 'candidates',
      entity: 'candidate',
      id: 'c-1'
    });
    expect(buildListRoute('el-1', 'candidates', from)).toBe('/results/el-1/candidates');
  });

  it('keeps the persistent search params and drops the others', () => {
    const url = buildListRoute('el-1', 'candidates', current('/results?electionId=el-1&constituencyId=co-1&other=x'));
    const [path, search] = url.split('?');
    expect(path).toBe('/results/el-1/candidates');
    const query = new URLSearchParams(search);
    expect(query.get('electionId')).toBe('el-1');
    expect(query.get('constituencyId')).toBe('co-1');
    expect(query.has('other')).toBe(false);
  });

  it('carries the locale prefix of a non-base locale', () => {
    locale.current = 'fi';
    try {
      expect(buildListRoute('el-1', 'alliances', current('/fi/results'))).toBe('/fi/results/el-1/alliances');
    } finally {
      locale.current = 'en';
    }
  });
});

describe('narrowEntityPlural', () => {
  it.each(['candidates', 'organizations', 'alliances'])('admits %s', (plural) => {
    expect(narrowEntityPlural(plural)).toBe(plural);
  });

  it.each([undefined, '', 'candidate', 'parties'])('rejects %s', (raw) => {
    expect(narrowEntityPlural(raw)).toBeUndefined();
  });
});

describe('pluralForEntityType', () => {
  it('maps each list entity type to its plural and anything else to undefined', () => {
    expect(pluralForEntityType('candidate')).toBe('candidates');
    expect(pluralForEntityType('organization')).toBe('organizations');
    expect(pluralForEntityType('alliance')).toBe('alliances');
    expect(pluralForEntityType('faction')).toBeUndefined();
    expect(pluralForEntityType(undefined)).toBeUndefined();
  });
});
