/**
 * POST /api/admin/jobs/start
 * Start a new job for a specific feature
 */

import { json } from '@sveltejs/kit';
import { getUserData } from '$lib/auth';
import { createJob, getActiveJobs } from '$lib/server/admin/jobs/jobStore';
import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

type StartJobRequestBody = {
  feature: AdminFeature;
  author: string;
};

type StartJobResponse = JobInfo | { error: string };

export async function POST({ fetch, cookies, request }) {
  if ((await getUserData({ fetch, cookies }))?.role !== 'admin') 
    return json({ error: 'Forbidden' } as StartJobResponse, { status: 403 });

  try {
    const { feature, author } = (await request.json()) as StartJobRequestBody;

    if (!feature || !author)
      return json({ error: 'Feature and author are required' } as StartJobResponse, { status: 400 });

    // Prevent multiple active jobs for the same feature
    const existing = getActiveJobs().find((j) => j.jobType === feature && j.status === 'running');
    if (existing)
      return json({ error: 'An active job for this feature is already running' } as StartJobResponse, { status: 409 });

    // Create the new job and return it
    const job = createJob(feature, author);
    return json(job as StartJobResponse);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' } as StartJobResponse, {
      status: 500
    });
  }
}
