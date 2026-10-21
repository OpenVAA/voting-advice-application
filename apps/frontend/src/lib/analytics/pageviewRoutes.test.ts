import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ROUTE } from '$lib/routes/route';
import { appOfRoute } from './appOfRoute';
import { allowedPageviewParams, isPageviewRoute, PAGEVIEW_ROUTES } from './pageviewRoutes';

/**
 * The pageview allowlist is checked against the route tree itself, found by a filesystem walk rather than by a hand-maintained list, so a page route added to the tree fails this file until it is listed.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The SvelteKit route tree, i.e. the directory whose children become route ids. */
const ROUTE_TREE_ROOT = path.resolve(HERE, '..', '..', 'routes');

/** Directory names that can never be part of a route id, pruned so a stray install or build output cannot enter the walk. */
const PRUNED_DIRECTORIES = new Set(['node_modules', '.svelte-kit']);

/** The files whose presence makes a directory an addressable page rather than a grouping or layout-only node. */
const PAGE_FILES = ['+page.svelte', '+page.server.ts', '+page.ts'];

/** Parameter names that identify an entity or a nomination, or carry a free path. None of them may be on any list. */
const IDENTIFYING_PARAMS = ['id', 'entityId', 'page'];

/**
 * Every directory below `absoluteDirectory`, depth first, in a stable order.
 *
 * @param absoluteDirectory - An absolute path inside the route tree.
 * @returns The absolute paths of all directories below it.
 */
function collectDirectories(absoluteDirectory: string): Array<string> {
  const found: Array<string> = [];
  const entries = fs
    .readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !PRUNED_DIRECTORIES.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const child = path.join(absoluteDirectory, entry.name);
    found.push(child, ...collectDirectories(child));
  }
  return found;
}

/**
 * The SvelteKit route id a directory in the route tree corresponds to.
 *
 * @param absoluteDirectory - An absolute path inside the route tree.
 * @returns The route id, always beginning with a separator.
 */
function toRouteId(absoluteDirectory: string): string {
  return `/${path.relative(ROUTE_TREE_ROOT, absoluteDirectory).split(path.sep).join('/')}`;
}

/**
 * Compare the page routes of a tree with the keys of an allowlist, in both directions.
 *
 * @param pageRouteIds - The route ids of the pages the tree holds.
 * @param listedRouteIds - The route ids the allowlist holds.
 * @returns The page routes that are not listed, and the listed ids that are not a page route.
 */
function compareCoverage(
  pageRouteIds: ReadonlyArray<string>,
  listedRouteIds: ReadonlyArray<string>
): { unlisted: Array<string>; stale: Array<string> } {
  const pages = new Set(pageRouteIds);
  const listed = new Set(listedRouteIds);
  return {
    unlisted: [...pages].filter((id) => !listed.has(id)).sort(),
    stale: [...listed].filter((id) => !pages.has(id)).sort()
  };
}

/**
 * The parameter names a route id declares, with any matcher and the optional or rest brackets removed.
 *
 * @param routeId - A SvelteKit route id.
 * @returns The declared parameter names, in order.
 */
function declaredParams(routeId: string): Array<string> {
  return [...routeId.matchAll(/\[{1,2}(?:\.\.\.)?([A-Za-z0-9_]+)(?:=[A-Za-z0-9_]+)?\]{1,2}/g)].map(([, name]) => name);
}

const PAGE_ROUTE_IDS = collectDirectories(ROUTE_TREE_ROOT)
  .filter((directory) => PAGE_FILES.some((file) => fs.existsSync(path.join(directory, file))))
  .map(toRouteId)
  .sort();

const LISTED_ROUTE_IDS = Object.keys(PAGEVIEW_ROUTES);

describe('PAGEVIEW_ROUTES covers the route tree', () => {
  it('the walk finds page routes in every app', () => {
    expect(
      PAGE_ROUTE_IDS.length,
      `The walk of ${ROUTE_TREE_ROOT} found no page route, so the coverage check below would pass by looking at nothing.`
    ).toBeGreaterThan(0);
    expect(PAGE_ROUTE_IDS.map(appOfRoute)).toEqual(expect.arrayContaining(['voter', 'contestant', 'admin']));
  });

  it('every page route is listed and every listed route is a page route', () => {
    expect(compareCoverage(PAGE_ROUTE_IDS, LISTED_ROUTE_IDS)).toEqual({ unlisted: [], stale: [] });
  });

  it('reports a page route that is not listed (control)', () => {
    const outside = `${ROUTE.Home}/not-listed-control`;
    expect(isPageviewRoute(outside)).toBe(false);
    expect(compareCoverage([...PAGE_ROUTE_IDS, outside], LISTED_ROUTE_IDS)).toEqual({
      unlisted: [outside],
      stale: []
    });
  });

  it('reports a listed route that is not a page route (control)', () => {
    const outside = `${ROUTE.Home}/not-a-page-control`;
    expect(compareCoverage(PAGE_ROUTE_IDS, [...LISTED_ROUTE_IDS, outside])).toEqual({
      unlisted: [],
      stale: [outside]
    });
  });

  it('every listed route belongs to an app', () => {
    for (const routeId of LISTED_ROUTE_IDS)
      expect(['voter', 'contestant', 'admin'], routeId).toContain(appOfRoute(routeId));
  });
});

describe('the allowlists', () => {
  it('name no parameter that identifies an entity or a nomination', () => {
    for (const [routeId, allowlist] of Object.entries(PAGEVIEW_ROUTES))
      for (const name of IDENTIFYING_PARAMS) expect(Object.keys(allowlist), routeId).not.toContain(name);
  });

  it('name only parameters their route declares', () => {
    for (const [routeId, allowlist] of Object.entries(PAGEVIEW_ROUTES))
      for (const name of Object.keys(allowlist)) expect(declaredParams(routeId), routeId).toContain(name);
  });

  it('do list the parameters the identifying ones sit beside, so the check above is not vacuous', () => {
    expect(declaredParams(ROUTE.ResultEntity)).toEqual(['electionTab', 'entityTab', 'entity', 'id']);
    expect(declaredParams(ROUTE.ContestantAppEntityResolver)).toEqual(['page']);
    expect(declaredParams(ROUTE.ContestantAppQuestion)).toEqual(['entityType', 'entityId', 'questionId']);
  });
});

describe('isPageviewRoute', () => {
  it('is true for a listed route and false otherwise', () => {
    expect(isPageviewRoute(ROUTE.Home)).toBe(true);
    expect(isPageviewRoute(ROUTE.Question)).toBe(true);
    expect(isPageviewRoute('/api/usage')).toBe(false);
    expect(isPageviewRoute('')).toBe(false);
  });

  it('is false for the names an object inherits', () => {
    expect(isPageviewRoute('constructor')).toBe(false);
    expect(isPageviewRoute('__proto__')).toBe(false);
    expect(isPageviewRoute('toString')).toBe(false);
  });
});

describe('allowedPageviewParams', () => {
  it('keeps the election, the list tab and the drawer type on the results route and drops the entity id', () => {
    expect(
      allowedPageviewParams(ROUTE.ResultEntity, {
        electionTab: 'election-1',
        entityTab: 'candidates',
        entity: 'candidate',
        id: '3b241101-e2bb-4255-8caf-4136c566a962'
      })
    ).toEqual({ electionTab: 'election-1', entityTab: 'candidates', entity: 'candidate' });
  });

  it('drops a results parameter whose value is outside its closed set', () => {
    expect(
      allowedPageviewParams(ROUTE.ResultEntity, { electionTab: 'e1', entityTab: 'party', entity: 'parties' })
    ).toEqual({ electionTab: 'e1' });
  });

  it('drops an absent or empty optional parameter', () => {
    expect(allowedPageviewParams(ROUTE.ResultEntity, { electionTab: '', entityTab: undefined })).toEqual({});
  });

  it('keeps the entity type on a contestant entity route and drops the entity id', () => {
    const params = { entityType: 'candidate', entityId: '3b241101-e2bb-4255-8caf-4136c566a962' };
    expect(allowedPageviewParams(ROUTE.ContestantAppEntityHome, params)).toEqual({ entityType: 'candidate' });
    expect(allowedPageviewParams(ROUTE.ContestantAppProfile, params)).toEqual({ entityType: 'candidate' });
    expect(allowedPageviewParams(ROUTE.ContestantAppEntityHome, { entityType: 'alliance' })).toEqual({});
  });

  it('keeps the entity type and the question id on the contestant question route', () => {
    expect(
      allowedPageviewParams(ROUTE.ContestantAppQuestion, {
        entityType: 'organization',
        entityId: '3b241101-e2bb-4255-8caf-4136c566a962',
        questionId: 'q-1'
      })
    ).toEqual({ entityType: 'organization', questionId: 'q-1' });
  });

  it('keeps a question id of the id form and drops one that holds free text', () => {
    expect(allowedPageviewParams(ROUTE.Question, { questionId: '__first__' })).toEqual({ questionId: '__first__' });
    expect(allowedPageviewParams(ROUTE.Question, { questionId: 'a'.repeat(64) })).toEqual({
      questionId: 'a'.repeat(64)
    });
    expect(allowedPageviewParams(ROUTE.Question, { questionId: 'my answer' })).toEqual({});
    expect(allowedPageviewParams(ROUTE.Question, { questionId: 'a/b' })).toEqual({});
    expect(allowedPageviewParams(ROUTE.Question, { questionId: 'a'.repeat(65) })).toEqual({});
  });

  it('keeps a valid category id and drops a parameter the route does not list', () => {
    expect(allowedPageviewParams(ROUTE.QuestionCategory, { categoryId: 'c1', questionId: 'q1' })).toEqual({
      categoryId: 'c1'
    });
  });

  it('sends nothing for the rest parameter of the entity resolver', () => {
    expect(allowedPageviewParams(ROUTE.ContestantAppEntityResolver, { page: 'questions/anything' })).toEqual({});
  });

  it('returns an empty object for an unknown route id', () => {
    expect(allowedPageviewParams('/not/a/route', { questionId: 'q1' })).toEqual({});
    expect(allowedPageviewParams('__proto__', { questionId: 'q1' })).toEqual({});
  });

  it('returns a new object and leaves the given one unchanged', () => {
    const params = { questionId: 'q1', other: 'x' };
    const kept = allowedPageviewParams(ROUTE.Question, params);
    expect(kept).not.toBe(params);
    expect(params).toEqual({ questionId: 'q1', other: 'x' });
  });
});
