/**
 * POST /api/admin/jobs/[id]/force-fail
 * Force fail a specific job (useful for recovery from stuck jobs)
 */

import { json } from '@sveltejs/kit';
import { forceFailJob } from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ params, request }: RequestEvent) {
  try {
    const { id } = params;
    const { reason } = await request.json();

    if (!id) {
      return json({ error: 'Job ID is required' }, { status: 400 });
    }

    if (!reason) {
      return json({ error: 'Reason for force-failing is required' }, { status: 400 });
    }

    // Force fail the job
    forceFailJob(id, reason);

    return json({ message: 'Job force-failed successfully' });
  } catch (error) {
    console.error('Error force-failing job:', error);
    return json({ error: 'Failed to force-fail job' }, { status: 500 });
  }
}
