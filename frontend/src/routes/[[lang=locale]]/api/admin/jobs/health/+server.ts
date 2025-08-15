/**
 * GET /api/admin/jobs/health
 * Get system health information and check for stale jobs
 */

import { json } from '@sveltejs/kit';
import { cleanupStaleJobs, getSystemHealth } from '$lib/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ url }: RequestEvent) {
  try {
    const autoCleanup = url.searchParams.get('autoCleanup') === 'true';

    if (autoCleanup) {
      // Automatically clean up stale jobs
      cleanupStaleJobs();
    }

    // Get current system health
    const health = getSystemHealth();

    return json(health);
  } catch (error) {
    console.error('Error getting system health:', error);
    return json({ error: 'Failed to get system health' }, { status: 500 });
  }
}
