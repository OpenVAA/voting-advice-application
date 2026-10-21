import { json } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * Return a failure json response.
 * @param status - The HTTP status code for the response.
 */
export function apiFail(status = 500): Response {
  return json({ ok: false, type: 'failure', status } as DataApiActionResult);
}
