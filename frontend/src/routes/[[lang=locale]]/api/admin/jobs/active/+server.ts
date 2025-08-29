import { json } from '@sveltejs/kit';
import { selectActiveJobs } from '$lib/server/admin/jobs/jobFiltering';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * GET /api/admin/jobs/active
 * Query params:
 * - feature?: string
 * - startFrom?: ISO string (filters by startTime > startFrom)
 *
 * Returns: JobInfo[]
 */
export async function GET({ url }: RequestEvent) {
  try {
    return json(selectActiveJobs(url));
  } catch (error) {
    console.error('Error getting active jobs:', error);
    return json({ error: 'Failed to get active jobs' }, { status: 500 });
  }
}
