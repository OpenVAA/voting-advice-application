/**
 * POST /api/admin/jobs/[id]/abort
 * Abort a specific job (useful for recovery from stuck jobs)
 */

import { json } from '@sveltejs/kit';
import { abortJob } from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ params, request }: RequestEvent) {
  try {
    const { id } = params;
    const { reason } = await request.json();

    if (!id) {
      return json({ error: 'Job ID is required' }, { status: 400 });
    }

    if (!reason) {
      return json({ error: 'Reason for aborting is required' }, { status: 400 });
    }

    // Force fail the job
    abortJob(id, reason);

    return json({ message: 'Job aborted successfully' });
  } catch (error) {
    console.error('Error aborting job:', error);
    return json({ error: 'Failed to abort job' }, { status: 500 });
  }
}
