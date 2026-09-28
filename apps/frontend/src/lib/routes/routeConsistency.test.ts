import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APP_GATES } from './appGates';
import { isProtectedRoute, PROTECTED_GROUP, ROUTE } from './route';

/**
 * # Consistency lock for the protected route group (REVIEW-RT-04)
 *
 * Four things have to agree about which routes sit behind the candidate and admin auth gates, and nothing in the tree makes them agree. This file does.
 *
 * 1. **The pattern.** `PROTECTED_GROUP` and the two group-prefix constants built from it, exported by the sibling `route.ts`, plus every `ROUTE` value that carries the group segment.
 * 2. **The route tree.** The directories under `src/routes/` whose basename is exactly the group segment, and every addressable page directory beneath them, discovered by a filesystem walk rather than by a hand-maintained list.
 * 3. **The request hook.** `hooks.server.ts`, whose application session-gate handler must decide membership from the SvelteKit route id through the exported gate table, never from a substring or suffix test on `url.pathname`.
 * 4. **The gate table.** `APP_GATES` in the sibling `appGates.ts`, which is what the handler loops over. A gated application subtree that the tree carries and the table has no row for is an application the request hook does not gate at all.
 *
 * The pattern being defined once was the construction half of that requirement. This file is the proof half: it imports the module AND walks the filesystem AND reads the hook as text, which is why it is a vitest spec and not one of the `scripts/assert-*.mjs` guards. `route.ts` has no imports of its own, so it loads under the jsdom harness with no framework stub.
 *
 * ## The five checks
 *
 * - **C1.** Every addressable page directory inside a protected group has at least one `ROUTE` entry that addresses it or something below it. Catches: a new protected route is added and never registered, so the hook still gates it (the predicate is structural) but `buildRoute` cannot address it.
 * - **C2.** Every `ROUTE` value carrying the group segment names a directory that exists on disk. Catches: a `ROUTE` entry that rots after its route is deleted or renamed. Two entries fail this today and are carried in an explicit register below, which is itself asserted so it cannot rot in turn.
 * - **C3.** `isProtectedRoute` answers true for every route id the walk derives and false for a sample of unprotected ids. Catches: the predicate degenerating into a constant, which would make C1 and C2 pass while gating nothing.
 * - **C4.** The application session-gate handler's body contains no `includes` or `endsWith` call on `pathname`. Catches: the reopening of the subpath-unsafe defect class, where serving the app under a path prefix, or a route parameter whose value happens to contain the word, makes the handler misfire.
 * - **C5.** Every gated application subtree the walk finds has a row in `APP_GATES`, every row claims exactly one such subtree, and the admin row's error-message value is the one the admin protected layout redirects with. Catches: a new application shipping with an auth gate in its route tree and no gate row, which is the shape the Admin App itself had before the table existed — protected in name, ungated by the hook.
 *
 * ## What counts as a gated application subtree, and why the voter surface is not one
 *
 * **Definition, derived from the tree rather than enumerated:** a gated application subtree is a TOP-LEVEL directory under `src/routes/` that contains a `(protected)` route-group directory anywhere beneath it. Its route id is `/` plus that directory's name. The definition is mechanical on purpose — a list written here would be a fourth thing to keep in agreement, and the one most likely to be forgotten.
 *
 * **The voter surface is a deliberate EXCLUSION, not an oversight.** It is public: every voter route is served to a caller with no session, so it carries no `(protected)` group, so the definition above does not select it, so it correctly has no gate row. Its `(located)` group is a SCOPING group — it requires a selected election and constituency, not a session — and scoping is enforced by that group's own load, not by an auth gate. `/api` is likewise not selected, and would be excluded anyway: the handler returns early for it before any gate lookup.
 *
 * If the voter surface ever grows a `(protected)` group, this definition promotes it to a gated application subtree and C5 fails until it has a row. That is the intended behaviour and is why the definition keys on the group rather than on a name.
 *
 * ## Correctness invariants, each one a distinct way this file could hand back a false pass
 *
 * 1. **The walk must find something.** An empty protected set makes C1 and C3 vacuous, so the count is asserted to be at least two before either check runs. Two is the measured truth: one group under the candidate app, one under the admin app.
 * 2. **C4's scan must be scoped to the handler body, not to the whole file.** The same handler skips API requests with a `startsWith` test on `pathname`, which guards a served URL prefix rather than a route id and is correct as written. A whole-file ban would flag it, so the ban names `includes` and `endsWith` only, and the body is extracted by brace matching from the handler's declared identifier.
 * 3. **C4's scan must be proved to have reached real source.** The extracted body is asserted to contain both the API-root `startsWith` call and the `isProtectedRoute` call, so a body that came back empty, or that came back from the wrong region of the file, fails loudly instead of passing by finding nothing.
 * 4. **Nothing here anchors to a line or column number.** Every assertion binds to an identifier, a path or a message substring. The anchors into `hooks.server.ts` have drifted repeatedly under unrelated edits; identifiers do not drift.
 * 5. **Prefix comparisons are segment-safe.** A bare `startsWith` would let `/candidate/settings` satisfy a directory called `/candidate/set`. Every prefix test below either matches the whole string or requires a separator immediately after the prefix.
 * 6. **The literal-masking pass used by C4 is deliberately simple and does not model regular-expression literals.** It is safe here only because invariant 3 turns any mis-mask into a loud failure rather than a silent empty scan.
 * 7. **C5's subtree set must be derived, and must be non-empty.** It comes from the same walk C1 and C3 use, so a broken walk fails the shared non-vacuity check rather than making C5 pass by finding no subtrees to check. The non-vacuity assertion for it JOINS the existing block below rather than opening a second one.
 *
 * ## What this file deliberately does not do
 *
 * It does not assert the URL a protected route is served at, nor that the hook actually redirects: those are the browser suite's, and the hook's redirect targets are pinned by the sibling round-trip spec. It does not walk the voter route group, which is a scoping group and not an auth gate. It does not edit or repair the two known unbuilt admin routes it reports; it only refuses to let their number grow in silence.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The SvelteKit route tree, i.e. the directory whose children become route ids. */
const ROUTE_TREE_ROOT = path.resolve(HERE, '..', '..', 'routes');

/** The request hook, read as text by C4. */
const HOOKS_FILE = path.resolve(HERE, '..', '..', 'hooks.server.ts');

/** The declared identifier of the handler C4 scopes itself to. Named, never located by line. It gates both applications from the shared table, which is why it is no longer named for one of them. */
const APP_GATE_HANDLER = 'appGateHandle';

/** Directory names that can never be part of a route id, pruned so a stray install or build output cannot enter the walk. */
const PRUNED_DIRECTORIES = new Set(['node_modules', '.svelte-kit']);

/** The files whose presence makes a directory an addressable page rather than a grouping or layout-only node. */
const PAGE_FILES = ['+page.svelte', '+page.server.ts', '+page.ts'];

/** A SvelteKit route-group segment, which exists in the route id and in the directory tree but never in the served URL. */
const GROUP_SEGMENT = /^\(.+\)$/;

/**
 * `ROUTE` entries that carry the protected group segment but have no directory behind them, each with the reason it is carried rather than fixed here.
 *
 * This register is the honest form of C2: both rows are real gaps measured on the tree, not test scaffolding, and neither is this file's to repair. Repairing them means deleting a route entry that live code still calls, or building a page, and both are product changes owned elsewhere.
 *
 * The register is asserted in both directions so it cannot become a place where failures go to be forgotten. A row whose key has left `ROUTE`, and a row whose route has since been built, both fail this spec and force the row out.
 */
const KNOWN_UNBUILT_PROTECTED_ROUTES: Record<string, string> = {
  AdminAppJob:
    'Admin job detail. No directory exists for it and no in-repo caller asks for the key, so it is a dead entry rather than a broken link.',
  AdminAppFactorAnalysis:
    'Admin factor analysis. The admin navigation and the admin dashboard both build a link from this key, so both links resolve to a missing page today. Translations for the feature exist; the page does not.'
};

/**
 * Every directory under `absoluteDirectory`, depth first, with pruned names skipped.
 *
 * @param absoluteDirectory - An absolute path to walk.
 * @returns Absolute directory paths, each child set sorted by name so a run is reproducible.
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
 * @returns The route id, group segments included, e.g. `/candidate/(protected)/profile`.
 */
function toRouteId(absoluteDirectory: string): string {
  return `/${path.relative(ROUTE_TREE_ROOT, absoluteDirectory).split(path.sep).join('/')}`;
}

/**
 * The served URL path of a route id, i.e. the id with its route-group segments removed.
 *
 * The normalisation is needed because `ROUTE` addresses the same page in two different shapes. A group-root page is addressed without its group (`/candidate` for `/candidate/(protected)`) while a page below it is addressed with it (`/candidate/(protected)/profile`). Comparing raw ids would report the two group roots as unaddressable, which is false.
 *
 * @param routeId - A SvelteKit route id.
 * @returns The path the route is served at, always beginning with a separator.
 */
function toUrlPath(routeId: string): string {
  const joined = routeId
    .split('/')
    .filter((segment, index) => index === 0 || !GROUP_SEGMENT.test(segment))
    .join('/');
  return joined === '' ? '/' : joined;
}

/**
 * Segment-safe prefix test, per correctness invariant 5.
 *
 * @param candidate - The path being tested.
 * @param prefix - The path it must be equal to or sit below.
 * @returns `true` when `candidate` is `prefix` itself or a descendant of it.
 */
function coversPath(candidate: string, prefix: string): boolean {
  return candidate === prefix || candidate.startsWith(`${prefix}/`);
}

/**
 * Blank out every comment, string and template literal in a TypeScript source, preserving length and newlines.
 *
 * Preserving length is what lets a match found in the masked text be reported with the untouched source line it came from. Per correctness invariant 6 this pass does not model regular-expression literals, and invariant 3 is what makes that safe.
 *
 * @param source - TypeScript source text.
 * @returns The same text with non-code spans replaced by spaces.
 */
function maskNonCode(source: string): string {
  const chars = Array.from(source);
  let mode: 'code' | 'line' | 'block' | 'single' | 'double' | 'template' = 'code';
  let index = 0;
  while (index < chars.length) {
    const current = chars[index];
    const pair = `${current}${chars[index + 1] ?? ''}`;
    if (mode === 'code') {
      if (pair === '//' || pair === '/*') {
        mode = pair === '//' ? 'line' : 'block';
        chars[index] = ' ';
        chars[index + 1] = ' ';
        index += 2;
        continue;
      }
      if (current === "'" || current === '"' || current === '`') {
        mode = current === "'" ? 'single' : current === '"' ? 'double' : 'template';
      }
      index += 1;
      continue;
    }
    if (mode === 'line') {
      if (current === '\n') mode = 'code';
      else chars[index] = ' ';
      index += 1;
      continue;
    }
    if (mode === 'block') {
      if (pair === '*/') {
        chars[index] = ' ';
        chars[index + 1] = ' ';
        mode = 'code';
        index += 2;
        continue;
      }
      if (current !== '\n') chars[index] = ' ';
      index += 1;
      continue;
    }
    if (current === '\\') {
      chars[index] = ' ';
      chars[index + 1] = ' ';
      index += 2;
      continue;
    }
    const closes =
      (mode === 'single' && current === "'") ||
      (mode === 'double' && current === '"') ||
      (mode === 'template' && current === '`');
    if (closes) {
      mode = 'code';
      index += 1;
      continue;
    }
    if (current !== '\n') chars[index] = ' ';
    index += 1;
  }
  return chars.join('');
}

/**
 * The body of a named arrow-function handler, located by its declared identifier and delimited by brace matching.
 *
 * @param maskedSource - Source that has already been through `maskNonCode`, so braces inside comments and literals cannot unbalance the match.
 * @param identifier - The handler's declared name.
 * @returns The body text including its outer braces, or an empty string when the handler or its body cannot be located.
 */
function extractHandlerBody(maskedSource: string, identifier: string): string {
  const declaration = maskedSource.indexOf(`const ${identifier}`);
  if (declaration === -1) return '';
  const arrow = maskedSource.indexOf('=>', declaration);
  if (arrow === -1) return '';
  const open = maskedSource.indexOf('{', arrow);
  if (open === -1) return '';
  let depth = 0;
  for (let index = open; index < maskedSource.length; index += 1) {
    if (maskedSource[index] === '{') depth += 1;
    else if (maskedSource[index] === '}') {
      depth -= 1;
      if (depth === 0) return maskedSource.slice(open, index + 1);
    }
  }
  return '';
}

/**
 * The untouched source line an index falls on, so a failure can quote real code without citing a line number.
 *
 * @param source - The original, unmasked source text.
 * @param index - A character offset into it.
 * @returns The trimmed line.
 */
function sourceLineAt(source: string, index: number): string {
  const start = source.lastIndexOf('\n', index) + 1;
  const end = source.indexOf('\n', index);
  return source.slice(start, end === -1 ? source.length : end).trim();
}

const ALL_ROUTE_DIRECTORIES = collectDirectories(ROUTE_TREE_ROOT);

const PROTECTED_GROUP_DIRECTORIES = ALL_ROUTE_DIRECTORIES.filter(
  (directory) => path.basename(directory) === PROTECTED_GROUP
);

/**
 * Membership is decided structurally, by containment under a group directory, and NOT by calling `isProtectedRoute`.
 *
 * That separation is what keeps C3 discriminating: a predicate that had degenerated into `return true` would still be measured against a set derived without it.
 *
 * @param absoluteDirectory - An absolute path inside the route tree.
 * @returns `true` when the directory is a protected group or sits below one.
 */
function isInsideProtectedGroup(absoluteDirectory: string): boolean {
  return PROTECTED_GROUP_DIRECTORIES.some(
    (group) => absoluteDirectory === group || absoluteDirectory.startsWith(`${group}${path.sep}`)
  );
}

const PROTECTED_PAGE_ROUTE_IDS = ALL_ROUTE_DIRECTORIES.filter(
  (directory) =>
    isInsideProtectedGroup(directory) && PAGE_FILES.some((file) => fs.existsSync(path.join(directory, file)))
)
  .map(toRouteId)
  .sort();

/**
 * The route ids of the gated application subtrees, derived from the walk per the definition in this file's docstring: the top-level directory of every `(protected)` group the tree carries.
 *
 * Derived from `PROTECTED_GROUP_DIRECTORIES` rather than from a list, and deduplicated because one application may carry more than one protected group.
 */
const APP_SUBTREE_ROUTE_IDS = Array.from(
  new Set(
    PROTECTED_GROUP_DIRECTORIES.map((directory) => `/${path.relative(ROUTE_TREE_ROOT, directory).split(path.sep)[0]}`)
  )
).sort();

/** The admin protected layout, whose own unauthenticated bounce the admin gate row has to reproduce. */
const ADMIN_PROTECTED_LAYOUT_FILE = path.join(ROUTE_TREE_ROOT, 'admin', PROTECTED_GROUP, '+layout.ts');

const ROUTE_URL_PATHS = Object.entries(ROUTE).map(([key, value]) => ({ key, value, urlPath: toUrlPath(value) }));

const PROTECTED_ROUTE_ENTRIES = ROUTE_URL_PATHS.filter((entry) => entry.value.split('/').includes(PROTECTED_GROUP));

const UNREGISTERED_PROTECTED_ROUTE_ENTRIES = PROTECTED_ROUTE_ENTRIES.filter(
  (entry) => !(entry.key in KNOWN_UNBUILT_PROTECTED_ROUTES)
);

const HOOKS_SOURCE = fs.readFileSync(HOOKS_FILE, 'utf8');
const HOOKS_CODE = maskNonCode(HOOKS_SOURCE);
const APP_GATE_HANDLER_BODY = extractHandlerBody(HOOKS_CODE, APP_GATE_HANDLER);

/** A substring or suffix test on a pathname, in either the plain or the optional-chained form. This is the construct C4 bans. */
const PATHNAME_SUBSTRING_TEST = /\bpathname\s*\??\.\s*(?:includes|endsWith)\s*\(/g;

/** The prefix test on a pathname, which is correct for a served URL prefix and must stay permitted. C4 also uses its presence as its non-vacuity proof. */
const PATHNAME_PREFIX_TEST = 'pathname.startsWith(';

describe('the walk is not vacuous (REVIEW-RT-04)', () => {
  it('finds at least the two protected route groups the tree is known to carry', () => {
    expect(
      PROTECTED_GROUP_DIRECTORIES.map(toRouteId),
      `The walk of ${ROUTE_TREE_ROOT} found ${PROTECTED_GROUP_DIRECTORIES.length} directories named ${PROTECTED_GROUP}, and the tree is known to carry two, one under the candidate app and one under the admin app. Every check in this file measures that set, so a smaller one makes them pass by looking at nothing. Either the walk is broken or the protected groups have been renamed, and in both cases this file has stopped guarding what it claims to guard.`
    ).toHaveLength(2);
  });

  it('finds at least one addressable page inside a protected group', () => {
    expect(
      PROTECTED_PAGE_ROUTE_IDS.length,
      `No directory inside a protected route group contains any of ${PAGE_FILES.join(', ')}, so there is nothing for the pattern to agree with and C1 and C3 below would both pass vacuously.`
    ).toBeGreaterThan(0);
  });

  it('derives at least the two gated application subtrees from the groups it found', () => {
    expect(
      APP_SUBTREE_ROUTE_IDS,
      `The walk derived ${APP_SUBTREE_ROUTE_IDS.length} gated application subtree(s) from the ${PROTECTED_GROUP} directories it found, and the tree is known to carry two, the candidate app and the admin app. C5 below measures exactly this set, so a smaller one makes it pass by having nothing to hold the gate table to. Derived set: ${APP_SUBTREE_ROUTE_IDS.join(', ')}`
    ).not.toHaveLength(0);
    expect(APP_SUBTREE_ROUTE_IDS.length).toBeGreaterThanOrEqual(2);
  });

  it('finds at least one ROUTE entry carrying the protected group segment', () => {
    expect(
      PROTECTED_ROUTE_ENTRIES.length,
      `No value in the ROUTE map contains the segment ${PROTECTED_GROUP}, so C2 below would pass by having nothing to check. Either the map has stopped addressing protected routes, or the group segment exported as PROTECTED_GROUP no longer matches the one the map is built from.`
    ).toBeGreaterThan(0);
  });
});

describe('C1 — every protected route on disk is addressable through ROUTE (REVIEW-RT-04)', () => {
  it.each(PROTECTED_PAGE_ROUTE_IDS)('%s is addressed by at least one ROUTE entry', (routeId) => {
    const urlPath = toUrlPath(routeId);
    const addressedBy = ROUTE_URL_PATHS.filter((entry) => coversPath(entry.urlPath, urlPath)).map((entry) => entry.key);
    expect(
      addressedBy,
      `The route tree carries an addressable page at ${routeId}, served at ${urlPath}, and no entry in the ROUTE map addresses it or anything below it. A protected route added without a ROUTE entry is still gated, because the hook's predicate is structural, but it cannot be linked to: buildRoute has no key for it, so every link to it has to be a hand written string, which is the drift this check exists to stop. Add a key to the ROUTE map in route.ts whose value is ${routeId}, or delete the page directory.`
    ).not.toHaveLength(0);
  });
});

describe('C2 — every protected ROUTE entry names a route that exists (REVIEW-RT-04)', () => {
  it.each(UNREGISTERED_PROTECTED_ROUTE_ENTRIES.map((entry) => [entry.key, entry.value]))(
    'ROUTE.%s has a directory on disk',
    (key, value) => {
      const directory = path.join(ROUTE_TREE_ROOT, value.slice(1));
      expect(
        fs.existsSync(directory) && fs.statSync(directory).isDirectory(),
        `ROUTE.${key} is ${value}, which carries the protected group segment, and there is no directory at ${directory}. A ROUTE entry with no route behind it produces a link to a page that does not exist, and nothing else in the tree notices. Either restore the route directory, or delete the ROUTE key and every caller that asks for it. If the gap is deliberate and is owned elsewhere, add ${key} to KNOWN_UNBUILT_PROTECTED_ROUTES in this file with the reason, which keeps it counted rather than silent.`
      ).toBe(true);
    }
  );

  it('the register of known unbuilt protected routes has not itself rotted', () => {
    const stale: Array<string> = [];
    for (const [key, reason] of Object.entries(KNOWN_UNBUILT_PROTECTED_ROUTES)) {
      // The register is keyed by plain strings on purpose, because a row must survive its key leaving the map: typing it as `Route` would turn a stale row into a compile error in this file rather than the named runtime failure below, and the reader would lose the recorded reason. The widening cast is what lets an absent key read back as undefined instead of the declared string type.
      const value = (ROUTE as Record<string, string | undefined>)[key];
      if (value == null) {
        stale.push(
          `${key} is registered here as a known unbuilt protected route, and it is no longer a key of the ROUTE map. Delete its row from KNOWN_UNBUILT_PROTECTED_ROUTES. Recorded reason: ${reason}`
        );
        continue;
      }
      const directory = path.join(ROUTE_TREE_ROOT, value.slice(1));
      if (fs.existsSync(directory)) {
        stale.push(
          `${key} is registered here as a known unbuilt protected route, and ${directory} now exists, so the gap is closed. Delete its row from KNOWN_UNBUILT_PROTECTED_ROUTES so the route is checked by C2 from now on. Recorded reason: ${reason}`
        );
      }
    }
    expect(
      stale,
      `The register of carried C2 gaps disagrees with the tree, which means an exemption is now hiding a route that is checkable. ${stale.join(' ')}`
    ).toEqual([]);
  });
});

describe('C3 — isProtectedRoute agrees with the route tree and stays discriminating (REVIEW-RT-04)', () => {
  it.each(PROTECTED_PAGE_ROUTE_IDS)('isProtectedRoute answers true for %s', (routeId) => {
    expect(
      isProtectedRoute(routeId),
      `${routeId} is an addressable page inside a directory named ${PROTECTED_GROUP}, and isProtectedRoute answered false for it. The request hook gates on exactly this predicate, so a route the walk calls protected and the predicate calls public is a route that is served to anyone who asks.`
    ).toBe(true);
  });

  it.each([
    ['Home', ROUTE.Home],
    ['CandAppLogin', ROUTE.CandAppLogin],
    ['CandAppHome', ROUTE.CandAppHome],
    ['Results', ROUTE.Results],
    ['AdminAppLogin', ROUTE.AdminAppLogin]
  ])('isProtectedRoute answers false for ROUTE.%s', (key, routeId) => {
    expect(
      isProtectedRoute(routeId),
      `ROUTE.${key} is ${routeId}, which carries no ${PROTECTED_GROUP} segment, and isProtectedRoute answered true for it. A predicate that answers true for everything gates nothing and makes every other check in this file pass while the gate is open. The login routes in particular must stay public, or a signed out visitor is redirected to a page they are then redirected away from.`
    ).toBe(false);
  });

  it('rejects a route id that merely contains the group name inside a larger segment', () => {
    const lookalike = `${ROUTE.CandAppHome}/xx${PROTECTED_GROUP}yy`;
    expect(
      isProtectedRoute(lookalike),
      `isProtectedRoute answered true for ${lookalike}, whose segments include no exact ${PROTECTED_GROUP}. That is a substring match rather than a segment match, and it is the escalation shape the predicate exists to rule out: a route parameter value carrying the group name would be treated as a protected route.`
    ).toBe(false);
  });
});

describe('C4 — the application session-gate handler decides from the route id, not from the pathname (REVIEW-RT-04)', () => {
  it('the handler body was located and the scan reached real source', () => {
    expect(
      APP_GATE_HANDLER_BODY.length,
      `The body of ${APP_GATE_HANDLER} could not be extracted from ${HOOKS_FILE}. Every assertion below scans that body, so an empty one would report a clean handler no matter what the handler does. The handler is located by its declared identifier, so the likely cause is a rename.`
    ).toBeGreaterThan(0);
    expect(
      APP_GATE_HANDLER_BODY.includes(PATHNAME_PREFIX_TEST),
      `The extracted body of ${APP_GATE_HANDLER} does not contain ${PATHNAME_PREFIX_TEST}, which the handler uses to skip API requests. That call is correct and is expected to be there, and its presence is how this file proves the extraction reached the handler rather than some empty or wrong region of ${HOOKS_FILE}.`
    ).toBe(true);
    expect(
      APP_GATE_HANDLER_BODY.includes('isProtectedRoute('),
      `The extracted body of ${APP_GATE_HANDLER} does not call isProtectedRoute. The whole point of exporting the predicate is that the hook and the route map share one definition of the protected group, so a handler that has stopped calling it has drifted away from the pattern even if it happens to behave correctly today.`
    ).toBe(true);
  });

  it('contains no includes or endsWith test on a pathname', () => {
    PATHNAME_SUBSTRING_TEST.lastIndex = 0;
    const offenders: Array<string> = [];
    let match = PATHNAME_SUBSTRING_TEST.exec(APP_GATE_HANDLER_BODY);
    while (match !== null) {
      const absolute = HOOKS_CODE.indexOf(APP_GATE_HANDLER_BODY) + match.index;
      offenders.push(`${match[0].trim()} in the source line: ${sourceLineAt(HOOKS_SOURCE, absolute)}`);
      match = PATHNAME_SUBSTRING_TEST.exec(APP_GATE_HANDLER_BODY);
    }
    expect(
      offenders,
      `${APP_GATE_HANDLER} in ${HOOKS_FILE} tests a pathname with includes or endsWith, and that is the subpath-unsafe defect class this handler was rewritten to close. A pathname carries the deployment's base path and the locale prefix and the resolved values of every route parameter, so a substring test fires when the app is served under a path that contains the word and fails to fire when it is served under one that does not. Decide membership from the SvelteKit route id instead, through resolveAppGate and isProtectedRoute, which take a route id and compare whole segments. The prefix test ${PATHNAME_PREFIX_TEST} is deliberately NOT banned: it guards a served URL prefix rather than a route id and is correct as written. Offending constructs: ${offenders.join(' | ')}`
    ).toEqual([]);
  });
});

describe('C5 — every gated application subtree has a row in the gate table (D10-C09, REVIEW-RT-04)', () => {
  it.each(APP_SUBTREE_ROUTE_IDS)('%s is claimed by a row of APP_GATES', (subtreeRouteId) => {
    const claimedBy = APP_GATES.filter((gate) => gate.isRoute(subtreeRouteId)).map((gate) => gate.name);
    expect(
      claimedBy,
      `The route tree carries a gated application subtree at ${subtreeRouteId} — it contains a ${PROTECTED_GROUP} route group — and no row of APP_GATES claims it. The request hook resolves exactly one row from the route id and returns early when none matches, so an application with no row is an application the hook does not gate at all: its ${PROTECTED_GROUP} routes are served to anyone who asks, and whatever its own layout does about that is the only thing standing between an unauthenticated caller and the page. Add a row to APP_GATES in appGates.ts whose predicate claims ${subtreeRouteId}, carrying that application's own login route and the redirect pair its protected layout already uses. Rows declared today: ${APP_GATES.map((gate) => gate.name).join(', ')}`
    ).not.toHaveLength(0);
  });

  it.each(APP_GATES.map((gate) => [gate.name, gate] as [string, (typeof APP_GATES)[number]]))(
    'the %s row claims exactly one gated application subtree',
    (name, gate) => {
      const claimed = APP_SUBTREE_ROUTE_IDS.filter((subtreeRouteId) => gate.isRoute(subtreeRouteId));
      expect(
        claimed,
        `The gate row ${name} claims ${claimed.length} of the gated application subtrees the tree carries, and a row exists to gate exactly one. A row claiming none is a row for an application that has been deleted or renamed, and it gates nothing while looking as though it does. A row claiming two has a predicate wide enough to swallow a sibling application, whose callers would then be bounced to this application's login page. Subtrees on disk: ${APP_SUBTREE_ROUTE_IDS.join(', ')}. Claimed by this row: ${claimed.join(', ') || 'none'}`
      ).toHaveLength(1);
    }
  );

  it('the admin row bounces with the same error message the admin protected layout redirects with', () => {
    const adminGate = APP_GATES.find((gate) => gate.loginRoute === 'AdminAppLogin');
    expect(
      adminGate,
      'No row of APP_GATES names the admin login route, so the admin application has no gate row at all and the check below has nothing to compare.'
    ).toBeDefined();
    if (!adminGate) return;
    const { errorMessage } = adminGate.whenUnauthenticatedInProtectedGroup.params({ redirectTo: '' });
    expect(
      errorMessage,
      'The admin gate row emits no error message. The admin login page renders a specific error state for an unauthenticated bounce, and a bounce without the value renders a different page than the one this application has always shown.'
    ).toBeTruthy();

    const layoutSource = fs.readFileSync(ADMIN_PROTECTED_LAYOUT_FILE, 'utf8');
    expect(
      layoutSource.includes('AdminAppLogin'),
      `${ADMIN_PROTECTED_LAYOUT_FILE} does not mention AdminAppLogin, so it is not the file this check believes it is reading and the assertion below would pass or fail for the wrong reason. This is the non-vacuity half: the layout is expected to build its own bounce from that route key.`
    ).toBe(true);
    expect(
      layoutSource.includes(`errorMessage: '${errorMessage}'`),
      `The admin gate row bounces an unauthenticated caller to the admin login page with errorMessage '${errorMessage}', and ${ADMIN_PROTECTED_LAYOUT_FILE} does not redirect with that value. The hook now bounces one layer earlier than the layout does, so the two must agree or an unauthenticated admin request starts rendering a different login page state than it rendered before the hook gained this row. Change one to match the other, deliberately.`
    ).toBe(true);
  });
});
