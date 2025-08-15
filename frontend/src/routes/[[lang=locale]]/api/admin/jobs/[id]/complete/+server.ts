/**
 * POST /api/admin/jobs/[id]/complete
 * Mark a job as completed
 */

import { json } from '@sveltejs/kit';
import { completeJob } from '$lib/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ params }: RequestEvent) {
  try {
    const { id } = params;

    if (!id) {
      return json({ error: 'Job ID is required' }, { status: 400 });
    }

    completeJob(id);

    return json({ message: 'Job marked as completed' });
  } catch (error) {
    console.error('Error completing job:', error);
    return json({ error: 'Failed to complete job' }, { status: 500 });
  }
}
