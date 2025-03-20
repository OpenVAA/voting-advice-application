import { UNIVERSAL_API_ROUTES } from '../base/universalApiRoutes';

/**
 * Injects a cache proxy into the URL.
 * @returns URL string
 */
export function cachifyUrl(url: string | URL): string {
  return `${UNIVERSAL_API_ROUTES.cacheProxy}?resource=${encodeURIComponent(url.toString())}`;
}
