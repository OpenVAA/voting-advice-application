/**
 * POST /api/admin/jobs/start
 * Start a new job for a specific feature
 */

import { json } from '@sveltejs/kit';
import { getUserData } from '$lib/auth';
import { createJob, getActiveJobs } from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ fetch, cookies, request }: RequestEvent) {
  if ((await getUserData({ fetch, cookies }))?.role !== 'admin') return json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { feature, author } = await request.json();

    if (!feature || !author) {
      return json({ error: 'Feature and author are required' }, { status: 400 });
    }

    // Prevent multiple active jobs for the same feature
    const existing = getActiveJobs().find((j) => j.jobType === feature && j.status === 'running');
    if (existing) {
      return json({ error: 'An active job for this feature is already running' }, { status: 409 });
    }

    // Create the new job and return it
    const job = createJob(feature, author);

    // Return Response object, not plain object
    return json(job);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
