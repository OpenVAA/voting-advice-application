// Use direct import to avoid loading other modules which depend on `$app/...`
import { ROUTE, type Route } from '../../../frontend/src/lib/utils/route/route';

/**
 * A limited route builder to use in testing because we cannot use the real `buildRoute` that depends on Svelte kit.
 * Also removes the leading slash from the path.
 * @param route - The name of the route, limited to those routes that demand no other parameters than the locale.
 */
export function buildRoute({ route, locale }: { route: Route; locale: string }): string {
  const parts = ROUTE[route].split('/');
  return parts
    .map((p) => {
      if (p === '[[lang=locale]]') return locale;
      if (p.startsWith('(')) return undefined;
      return p;
    })
    .filter((p) => p !== undefined)
    .join('/')
    .replace(/^\/+/, '');
}
