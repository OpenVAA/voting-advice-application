import { json } from '@sveltejs/kit';
import qs from 'qs';
import { getActiveJobs } from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';
import type { AdminJobName } from '$lib/admin/features';

/**
 * GET /api/admin/jobs/active
 * Query params:
 * - jobType?: string
 *
 * Returns: JobInfo[]
 */
export async function GET({ url }: RequestEvent) {
  try {
    // Parse params
    const params = qs.parse(url.search.replace(/^\?/g, '')) as { jobType?: string };
    const jobType = params.jobType as AdminJobName | undefined;

    // Get and filter jobs
    let jobs = getActiveJobs();
    if (jobType) jobs = jobs.filter((j) => j.jobType === jobType);
    return json(jobs);
  } catch (error) {
    console.error('Error getting active jobs:', error);
    return json({ error: 'Failed to get active jobs' }, { status: 500 });
  }
}
