import { json } from '@sveltejs/kit';
import qs from 'qs';
import { getUserData } from '$lib/auth';
import { getActiveJobs } from '$lib/server/admin/jobs/jobStore';
import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

type ActiveJobsResponse = Array<JobInfo> | { error: string };

/**
 * GET /api/admin/jobs/active
 * Query params:
 * - jobType?: string
 *
 * Returns: JobInfo[]
 */
export async function GET({ url, cookies, fetch }) {
  if ((await getUserData({ fetch, cookies }))?.role !== 'admin')
    return json({ error: 'Forbidden' } as ActiveJobsResponse, { status: 403 });

  try {
    // Parse params
    const params = qs.parse(url.search.replace(/^\?/g, '')) as { jobType?: AdminFeature };
    const jobType = params.jobType;

    let jobs = getActiveJobs();
    if (jobType) jobs = jobs.filter((j) => j.jobType === jobType);
    return json(jobs as ActiveJobsResponse);
  } catch (error) {
    console.error('Error getting active jobs:', error);
    return json({ error: 'Failed to get active jobs' } as ActiveJobsResponse, { status: 500 });
  }
}
