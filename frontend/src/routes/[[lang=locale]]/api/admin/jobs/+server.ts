/**
 * API endpoints for job management
 * Handles creating, updating, and retrieving job information
 */

import { json } from '@sveltejs/kit';
import {
  getAllJobs,
  getAllPastJobs,
  getJobsByFeature,
  getPastJobsByFeature,
  getPastJobsByFeatureAndStatus,
  getPastJobsByStatus
} from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * GET /api/admin/jobs
 * Get all active jobs or filter by feature
 */
export async function GET({ url }: RequestEvent) {
  try {
    const feature = url.searchParams.get('feature');
    const status = url.searchParams.get('status') as 'running' | 'completed' | 'failed' | undefined;
    const includePast = url.searchParams.get('includePast') === 'true';

    // If requesting past jobs
    if (includePast) {
      if (feature && status && (status === 'completed' || status === 'failed')) {
        // Get past jobs by feature and status
        const jobs = getPastJobsByFeatureAndStatus(feature, status);
        return json(jobs);
      } else if (feature) {
        // Get past jobs by feature
        const jobs = getPastJobsByFeature(feature);
        return json(jobs);
      } else if (status && (status === 'completed' || status === 'failed')) {
        // Get past jobs by status
        const jobs = getPastJobsByStatus(status);
        return json(jobs);
      } else {
        // Get all past jobs
        const jobs = getAllPastJobs();
        return json(jobs);
      }
    }

    // Default: get active jobs only
    if (feature) {
      const jobs = getJobsByFeature(feature);
      return json(jobs);
    } else {
      const jobs = getAllJobs();
      return json(jobs);
    }
  } catch (error) {
    console.error('Error getting jobs:', error);
    return json({ error: 'Failed to get jobs' }, { status: 500 });
  }
}
