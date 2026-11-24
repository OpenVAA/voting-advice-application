/** Test stub for $app/paths */

/** A route-group segment, which is part of a route id and of no path. */
const GROUP_SEGMENT = /^\([^)]+\)$/;

/** A param in a route-id segment: `[name]`, `[name=matcher]`, `[[name]]` or `[...name]`, the last two with or without a matcher. */
const PARAM = /\[(\[)?(\.\.\.)?(\w+?)(?:=(\w+))?\]\]?/g;

/**
 * Build the path of a route id from its params by the rules SvelteKit's `resolveRoute` applies: group segments are dropped, each param is replaced by its value whatever matcher it names, an optional param without a value is left out, and a required param without a value throws `Missing parameter`. No matcher is run.
 *
 * @param route - A SvelteKit route id.
 * @param params - The values of the route's params.
 * @returns The path, beginning with a separator.
 */
export function resolveRoute(route: string, params: Record<string, string | undefined> = {}): string {
  const segments = route
    .slice(1)
    .split('/')
    .filter((segment) => segment !== '' && !GROUP_SEGMENT.test(segment));
  const path = segments
    .map((segment) =>
      segment.replace(PARAM, (_match, optional: string | undefined, rest: string | undefined, name: string) => {
        const value = params[name];
        if (!value) {
          if (optional) return '';
          if (rest && value !== undefined) return '';
          throw new Error(`Missing parameter '${name}' in route ${route}`);
        }
        if (value.startsWith('/') || value.endsWith('/'))
          throw new Error(`Parameter '${name}' in route ${route} cannot start or end with a slash`);
        return value;
      })
    )
    .filter(Boolean)
    .join('/');
  return `/${path}`;
}

export const base = '';
export const assets = '';
