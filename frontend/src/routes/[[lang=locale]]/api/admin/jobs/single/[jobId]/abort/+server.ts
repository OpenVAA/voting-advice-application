/**
 * POST /api/admin/jobs/[id]/abort
 * Request a cooperative abort for a specific job
 */
import { json } from '@sveltejs/kit';
import { requestAbort } from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ params, request }: RequestEvent) {
  try {
    const { jobId } = params;
    if (!jobId) {
      return json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Body is optional; DataWriter sends no body. Try to parse, ignore if empty/invalid.
    let reason: string | undefined = undefined;
    const text = await request.text();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.reason === 'string') reason = parsed.reason;
      } catch {
        // ignore invalid JSON
      }
    }

    // Request cooperative abort and return immediately
    requestAbort(jobId, reason);

    // Fire-and-forget: UI will observe 'aborting' → 'aborted' via polling
    return json({ message: 'Abort requested', jobId }, { status: 202 });
  } catch (error) {
    console.error('Error requesting abort:', error);
    return json({ error: 'Failed to request abort' }, { status: 500 });
  }
}
