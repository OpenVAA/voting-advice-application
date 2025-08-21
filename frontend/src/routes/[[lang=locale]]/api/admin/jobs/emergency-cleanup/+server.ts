/**
 * POST /api/admin/jobs/emergency-cleanup
 * Emergency cleanup to recover from stuck jobs
 * This will force-fail all running jobs and clean up the system
 */

import { json } from '@sveltejs/kit';
import { emergencyCleanup } from '$lib/server/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    const { reason } = await request.json();

    // Perform emergency cleanup
    const result = emergencyCleanup();

    return json({
      message: 'Emergency cleanup completed successfully',
      reason: reason || 'No reason provided',
      ...result
    });
  } catch (error) {
    console.error('Error during emergency cleanup:', error);
    return json({ error: 'Failed to perform emergency cleanup' }, { status: 500 });
  }
}
