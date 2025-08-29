/**
 * API endpoints for job management
 * Handles creating, updating, and retrieving job information
 */

import { json } from '@sveltejs/kit';
import { selectActiveJobs, selectPastJobs } from '$lib/server/admin/jobs/jobFiltering';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * GET /api/admin/jobs
 * Get jobs with optional filtering:
 * - No startFrom: return all jobs (active + past)
 * - With startFrom: return active jobs + past jobs updated since timestamp
 *
 * Query parameters:
 * - feature?: string
 * - status?: 'completed' | 'failed'
 * - startFrom?: ISO timestamp (delta mode)
 *
 * Response format:
 * {
 *   activeJobs: JobInfo[],
 *   pastJobs: JobInfo[]
 * }
 */
export async function GET({ url }: RequestEvent) {
  try {
    return json({
      activeJobs: selectActiveJobs(url),
      pastJobs: selectPastJobs(url)
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    return json({ error: 'Failed to get jobs' }, { status: 500 });
  }
}
