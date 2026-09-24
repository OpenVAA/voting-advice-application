/**
 * GET /api/admin/jobs/[id]/progress Get progress and status for a specific job
 */

import { json } from '@sveltejs/kit';
import { getJob } from '$lib/server/admin/jobs/jobStore';
import { requireVerifiedAdmin } from '$lib/server/admin/requireVerifiedAdmin';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

type JobProgressResponse = JobInfo | { error: string };

export async function GET({ fetch, locals, params }) {
  const denied = await requireVerifiedAdmin({ fetch, locals });
  if (denied) return denied;

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
