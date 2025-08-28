/**
 * API endpoints for job management
 * Handles creating, updating, and retrieving job information
 */

import { json } from '@sveltejs/kit';
import {
  getActiveJobs as getActiveJobs,
  getJobsByFeature as getActiveJobsByFeature,
  getPastJobs,
  getPastJobsByFeature,
  getPastJobsByFeatureAndStatus,
  getPastJobsByFeatureAndStatusSince,
  getPastJobsByFeatureSince,
  getPastJobsByStatus,
  getPastJobsByStatusSince,
  getPastJobsSince
} from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

/**
 * GET /api/admin/jobs
 * Get jobs with optional filtering:
 * - No lastUpdate: return all jobs (active + past)
 * - With lastUpdate: return active jobs + past jobs updated since lastUpdate (delta)
 *
 * Response format:
 * {
 *   activeJobs: JobInfo[],
 *   pastJobs: JobInfo[]
 * }
 */
export async function GET({ url }: RequestEvent) {
  try {
    const feature = url.searchParams.get('feature');
    const status = url.searchParams.get('status');
    const lastUpdate = url.searchParams.get('lastUpdate');

    // Get active jobs (always included)
    const activeJobs = feature ? getActiveJobsByFeature(feature) : getActiveJobs();

    // Get past jobs based on parameters
    let pastJobs: Array<JobInfo> = [];

    if (lastUpdate) {
      // Delta mode: only get past jobs updated since lastUpdate
      if (feature && status && (status === 'completed' || status === 'failed')) {
        pastJobs = getPastJobsByFeatureAndStatusSince(feature, status, lastUpdate);
      } else if (feature) {
        pastJobs = getPastJobsByFeatureSince(feature, lastUpdate);
      } else if (status && (status === 'completed' || status === 'failed')) {
        pastJobs = getPastJobsByStatusSince(status, lastUpdate);
      } else {
        pastJobs = getPastJobsSince(lastUpdate);
      }
    } else {
      // Full mode: get all past jobs
      if (feature && status && (status === 'completed' || status === 'failed')) {
        pastJobs = getPastJobsByFeatureAndStatus(feature, status);
      } else if (feature) {
        pastJobs = getPastJobsByFeature(feature);
      } else if (status && (status === 'completed' || status === 'failed')) {
        pastJobs = getPastJobsByStatus(status);
      } else {
        pastJobs = getPastJobs();
      }
    }

    return json({
      activeJobs,
      pastJobs
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    return json({ error: 'Failed to get jobs' }, { status: 500 });
  }
}
