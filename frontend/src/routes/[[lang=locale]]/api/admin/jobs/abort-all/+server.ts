import { json } from '@sveltejs/kit';
import { getUserData } from '$lib/auth';
import { getActiveJobs, requestAbort } from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ fetch, cookies, request }: RequestEvent) {
  // TODO: Consider checking the user role with claims in the server hook when the route matches /api/admin
  if ((await getUserData({ fetch, cookies }))?.role !== 'admin') return json({ error: 'Forbidden' }, { status: 403 });

  try {
    // Body is optional
    let reason: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.reason === 'string') reason = body.reason;
    } catch {
      // ignore invalid/empty body
    }

    // Collect current active jobs to target (both running and aborting)
    const active = getActiveJobs();
    const targets = active.filter((j) => j.status === 'running' || j.status === 'aborting');
    const targetIds = targets.map((j) => j.id);

    // Request abort for jobs that are still running
    let requested = 0;
    for (const job of targets) {
      if (job.status === 'running') {
        requestAbort(job.id, reason ?? 'Admin-initiated emergency cleanup');
        requested++;
      }
    }

    // Fire-and-forget: UI will observe 'aborting' → 'aborted' via polling
    return json(
      {
        message: 'Abort requested for all running jobs',
        targetedJobs: targetIds.length,
        abortRequestedFor: requested
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error aborting all jobs:', error);
    return json({ error: 'Failed to abort all jobs' }, { status: 500 });
  }
}
