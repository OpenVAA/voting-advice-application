import { error, json } from '@sveltejs/kit';
import crypto from 'crypto';
import { FlatCache } from 'flat-cache';
import { constants } from '$lib/server/constants';
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
  const resource = url.searchParams.get('resource');

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
    return json(cacheValue.data);
  }

  try {
    const response = await fetch(new URL(resource));

    if (!response.ok) {
      return error(response.status, { message: `Failed to fetch data from ${resource}` });
    }

    const data = await response.json();

    cache.setKey(cacheKey, { timestamp: Date.now(), data });
    cache.save();

    return json(data);
  } catch {
    return error(500, { message: `Failed to fetch data from ${resource}` });
  }
}
