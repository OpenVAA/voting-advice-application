import { json } from '@sveltejs/kit';
import { version } from '$app/environment';

/**
 * The health answer a load balancer reads to decide whether this server may receive traffic.
 *
 * The handler calls no upstream: it reads nothing from the request and reaches neither the backend nor the resolved client address, so it answers while the backend is unreachable and for a request that carries no forwarding header.
 *
 * @returns A json `Response` with status 200, the body `{ status: 'ok', build }`, where `build` is the id of the served build, and `cache-control: no-store`.
 */
export function GET(): Response {
  return json({ status: 'ok', build: version }, { headers: { 'cache-control': 'no-store' } });
}
