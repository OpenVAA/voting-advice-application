/**
 * GET /api/admin/jobs/[id]/progress
 * Get progress and status for a specific job
 */

import { json } from '@sveltejs/kit';
import { getJob, updateJobProgress } from '$lib/jobs/jobStore';
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

/**
 * POST /api/admin/jobs/[id]/progress
 * Update progress for a specific job
 */

export async function POST({ params, request }: RequestEvent) {
  try {
    const { id } = params;
    const { progress } = await request.json();

    if (!id) {
      return json({ error: 'Job ID is required' }, { status: 400 });
    }

    if (typeof progress !== 'number' || progress < 0 || progress > 1) {
      return json({ error: 'Progress must be a number between 0 and 1' }, { status: 400 });
    }

    updateJobProgress(id, progress);

    return json({ message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Error updating job progress:', error);
    return json({ error: 'Failed to update job progress' }, { status: 500 });
  }
}
