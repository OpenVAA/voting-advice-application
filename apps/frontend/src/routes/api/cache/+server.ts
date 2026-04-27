import { error, json } from '@sveltejs/kit';
import crypto from 'crypto';
import { FlatCache } from 'flat-cache';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';
import { logDebugError } from '$lib/utils/logger';
import type { RequestEvent } from '@sveltejs/kit';

const cacheTtl = Number(constants.CACHE_TTL);
const cacheLruSize = Number(constants.CACHE_LRU_SIZE);
const cacheExpirationInterval = Number(constants.CACHE_EXPIRATION_INTERVAL);

const cache = new FlatCache({
  cacheDir: constants.CACHE_DIR || '/var/data/cache',
  ttl: !Number.isNaN(cacheTtl) ? cacheTtl : undefined,
  lruSize: !Number.isNaN(cacheLruSize) ? cacheLruSize : undefined,
  expirationInterval: !Number.isNaN(cacheExpirationInterval) ? cacheExpirationInterval : undefined
});

export async function GET({ fetch, url }: RequestEvent): Promise<Response> {
  let resource = url.searchParams.get('resource');

  if (!resource) {
    return error(400, { message: '"resource" is required' });
  }

  try {
    new URL(resource);
  } catch {
    return error(400, { message: '"resource" must be a valid URL' });
  }

  const cacheKey = crypto.createHash('sha256').update(resource).digest('hex');
  const cacheValue = cache.getKey<{ data: object }>(cacheKey);

  if (cacheValue?.data) {
    logDebugError(`[api/cache] Returned cached data for ${resource}`);
    return json(cacheValue.data);
  }

  try {
    // Before attempting to fetch the resource, convert public URLs to server URLs
    if (resource.startsWith(publicConstants.PUBLIC_BROWSER_BACKEND_URL)) {
      resource =
        publicConstants.PUBLIC_SERVER_BACKEND_URL +
        resource.substring(publicConstants.PUBLIC_BROWSER_BACKEND_URL.length);
    } else if (resource.startsWith(publicConstants.PUBLIC_BROWSER_FRONTEND_URL)) {
      resource =
        publicConstants.PUBLIC_SERVER_FRONTEND_URL +
        resource.substring(publicConstants.PUBLIC_BROWSER_FRONTEND_URL.length);
    }

    const response = await fetch(new URL(resource));

    if (!response.ok) {
      return error(response.status, { message: `Failed to fetch data from ${resource}` });
    }

    const data = await response.json();

    cache.setKey(cacheKey, { timestamp: Date.now(), data });
    cache.save();
    logDebugError(`[api/cache] Fetched and cached fresh data for ${resource}`);

    return json(data);
  } catch (e) {
    logDebugError(
      `[api/cache] Failed to fetch data from ${resource} with error: ${e instanceof Error ? e.message : e}`
    );
    return error(500, { message: `Failed to fetch data from ${resource}` });
  }
}
