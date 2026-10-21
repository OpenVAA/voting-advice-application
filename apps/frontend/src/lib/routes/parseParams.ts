import { log } from '@openvaa/app-shared';
import qs from 'qs';
import { isArrayParam } from './params';
import type { Params } from './params';

/**
 * Parse params from params and the URL.
 */
export function parseParams({
  params,
  url
}: {
  params?: Record<string, string> | null;
  url?: URL | null;
}): Partial<Params> {
  const parsed: Partial<Params> = {};
  if (url) {
    for (const [key, value] of Object.entries(qs.parse(url.search.replace(/^\?/g, '')))) {
      if (isArrayParam(key)) {
        parsed[key] = [value].flat().filter((v) => v != null && v !== '') as Array<string>;
      } else if (typeof value === 'string') {
        parsed[key] = value;
      } else {
        log.debug(`Invalid search param value for ${key}: ${value}`);
      }
    }
  }
  // Name-disjoint dissociation rule:
  // ----------------------------------------------------------------
  // `params.electionTab` (route-side, singular SELECTED election) and `url.searchParams.electionId` / `qs.parse(...).electionId` array form (search-side, AVAILABLE-multi) live on the merged `Partial<Params>` object under TWO DISTINCT KEYS — they have different identifiers throughout the codebase (see the block comment in `params.ts`). The existing merge order below (search first, then route) is preserved verbatim because no special-case slash-guard is needed: the route side emits `electionTab` and the search side emits `electionId`, so neither surface ever overwrites the other.
  //
  // `isArrayParam('electionTab')` is `false` (route-side is always singular), so the branch below just passes the singular string through unchanged for the route segment. `isArrayParam('electionId')` is `true`, which keeps the AVAILABLE-array semantics on the search side intact.
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      parsed[key] = (isArrayParam(key) ? value.split('/') : value) as Params[typeof key];
    }
  }
  return parsed;
}
