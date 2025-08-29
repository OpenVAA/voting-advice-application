import { json } from '@sveltejs/kit';
import { selectPastJobs } from '$lib/server/admin/jobs/jobFiltering';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * GET /api/admin/jobs/past
 * Query params:
 * - feature?: string
 * - status?: 'completed' | 'failed'
 * - startFrom?: ISO timestamp (delta mode)
 *
 * Returns: JobInfo[]
 */
export async function GET({ url }: RequestEvent) {
  try {
    return json(selectPastJobs(url));
  } catch (error) {
    console.error('Error getting past jobs:', error);
    return json({ error: 'Failed to get past jobs' }, { status: 500 });
  }
}
