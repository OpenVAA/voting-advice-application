/**
 * GET /api/admin/jobs/[id]/progress
 * Get progress and status for a specific job
 */

import { json } from '@sveltejs/kit';
import { getJob } from '$lib/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ params }: RequestEvent) {
  try {
    const { id } = params;

    if (!id) {
      return json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = getJob(id);

    if (!job) {
      return json({ error: 'Job not found' }, { status: 404 });
    }

    return json(job);
  } catch (error) {
    console.error('Error getting job progress:', error);
    return json({ error: 'Failed to get job progress' }, { status: 500 });
  }
}
