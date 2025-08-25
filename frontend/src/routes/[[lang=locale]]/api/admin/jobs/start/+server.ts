/**
 * POST /api/admin/jobs/start
 * Start a new job for a specific feature
 */

import { json } from '@sveltejs/kit';
import { createJob } from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    const { feature, author } = await request.json();

    if (!feature || !author) {
      return json({ error: 'Feature and author are required' }, { status: 400 });
    }

    // Create the new job
    const jobId = createJob(feature, author);

    return json({
      jobId,
      message: `Job started for ${feature}`
    });
  } catch (error) {
    console.error('Error starting job:', error);
    return json({ error: 'Failed to start job' }, { status: 500 });
  }
}

/**
 * The result returned by /api/admin/jobs/start
 */
export type JobStartParams = { feature: string; author: string };

/**
 * The result returned by /api/admin/jobs/start
 */
export type JobStartResult = { jobId: string; message: string };
