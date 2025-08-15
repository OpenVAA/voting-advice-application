/**
 * POST /api/admin/jobs/[id]/fail
 * Mark a job as failed
 */

import { json } from '@sveltejs/kit';
import { failJob } from '$lib/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ params, request }: RequestEvent) {
  try {
    const { id } = params;
    const { errorMessage } = await request.json();

    if (!id) {
      return json({ error: 'Job ID is required' }, { status: 400 });
    }

    failJob(id, errorMessage);

    return json({ message: 'Job marked as failed' });
  } catch (error) {
    console.error('Error failing job:', error);
    return json({ error: 'Failed to mark job as failed' }, { status: 500 });
  }
}
