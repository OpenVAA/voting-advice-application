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

    // Create the new job and return it
    const job = createJob(feature, author);

    // Return Response object, not plain object
    return json(job);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
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
