import { handleUsageRequest } from '$lib/server/analytics/runtime';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * The usage endpoint the browser sends batches of events to.
 *
 * It owns no logic: the relay judges the request and decides the status. The endpoint reads only the request and the server's origin, never the client's address or cookies.
 *
 * The body of the answer is always empty, so a request that was dropped cannot be told from one that was accepted.
 *
 * @returns An empty `Response` with the relay's status: 204, 400, 403, 413 or 415.
 */
export async function POST({ request, url }: RequestEvent): Promise<Response> {
  const status = await handleUsageRequest(request, url.origin);
  return new Response(null, { status });
}
