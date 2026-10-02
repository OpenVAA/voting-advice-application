import { locales } from '$lib/paraglide/runtime';
import { ROUTE, VOTER } from './route';

/**
 * The first path segment of every Voter App route, derived from the route ids in `ROUTE`: route groups do not appear in a path, and a route whose first segment is a param has no fixed root to match.
 */
const VOTER_ROOT_SEGMENTS: ReadonlySet<string> = new Set(
  Object.values(ROUTE)
    .filter((id) => id.startsWith(`${VOTER}/`))
    .map((id) => id.split('/').find((segment) => segment !== '' && !/^\(.+\)$/.test(segment)))
    .filter((segment): segment is string => !!segment && !segment.startsWith('['))
);

/**
 * True when `path` is a same-origin path to a Voter App page, with or without a locale prefix, optionally followed by a query string or fragment.
 *
 * This is the allowlist for the `next=` target the voter selection flow returns to, so anything that could leave the origin or climb out of the Voter App is rejected: a scheme (`https://host`), an authority (`//host`), a backslash, and any empty, `.` or `..` segment, which URL resolution could otherwise turn into one of those.
 *
 * @param path - A pathname, or a pathname with a query string, e.g. `url.pathname` or a decoded `next` value.
 * @returns `true` when the path names a Voter App route.
 */
export function isVoterAppPath(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0];
  if (!pathname.startsWith('/') || pathname.includes('\\')) return false;
  const segments = pathname.slice(1).split('/');
  // A single trailing separator is the only empty segment allowed.
  if (segments.length > 1 && segments.at(-1) === '') segments.pop();
  if (segments.some(isUnsafeSegment)) return false;
  const [first, second] = segments;
  const root = (locales as ReadonlyArray<string>).includes(first) ? second : first;
  return root != null && VOTER_ROOT_SEGMENTS.has(root);
}

/** An empty or dot segment, including the percent-encoded dots URL resolution also treats as dots. */
function isUnsafeSegment(segment: string): boolean {
  const dots = segment.replace(/%2e/gi, '.');
  return dots === '' || dots === '.' || dots === '..';
}
