/**
 * GET /api/admin/jobs/[id]/progress
 * Get progress and status for a specific job
 */

import { json } from '@sveltejs/kit';
import { getUserData } from '$lib/auth';
import { getJob } from '$lib/server/admin/jobs/jobStore';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

type JobProgressResponse = JobInfo | { error: string };

export async function GET({ fetch, cookies, params }) {
  if ((await getUserData({ fetch, cookies }))?.role !== 'admin')
    return json({ error: 'Forbidden' } as JobProgressResponse, { status: 403 });

  try {
    const { jobId } = params;

    if (!jobId) {
      return json({ error: 'Job ID is required' } as JobProgressResponse, { status: 400 });
    }

    const job = getJob(jobId);

    if (!job) {
      return json({ error: 'Job not found' } as JobProgressResponse, { status: 404 });
    }

    return json(job as JobProgressResponse);
  } catch (error) {
    console.error('Error getting job progress:', error);
    return json({ error: 'Failed to get job progress' } as JobProgressResponse, { status: 500 });
  }
}

/**
 * The result returned by /api/admin/jobs/[id]/progress
 */
export type JobProgressResult = JobProgressResponse;
