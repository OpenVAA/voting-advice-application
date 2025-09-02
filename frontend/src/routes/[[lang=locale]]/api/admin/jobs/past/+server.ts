import { json } from '@sveltejs/kit';
import qs from 'qs';
import { getPastJobs } from '$lib/server/admin/jobs/jobStore';
import type { RequestEvent } from '@sveltejs/kit';
import type { AdminJobName } from '$lib/admin/features';
import type { PastJobStatus } from '$lib/server/admin/jobs/jobStore.type';

/**
 * Parse `startFrom` value into a Date.
 */
function parseStartFromParam(raw?: string | null): Date | undefined {
  if (!raw) return undefined;
  const ts = new Date(raw);
  return Number.isNaN(ts.getTime()) ? undefined : ts;
}

/**
 * GET /api/admin/jobs/past
 * Query params:
 * - jobType?: string
 * - statuses?: PastJobStatus[]  // array format
 * - startFrom?: ISO timestamp (delta mode)
 *
 * Returns: JobInfo[]
 */
export async function GET({ url }: RequestEvent) {
  try {
    const params = qs.parse(url.search.replace(/^\?/g, '')) as {
      jobType?: string | Array<string>;
      statuses?: string | Array<string>;
      startFrom?: string | Array<string>;
    };

    const jobType = (Array.isArray(params.jobType) ? params.jobType[0] : params.jobType) as AdminJobName | undefined;
    const statuses = Array.isArray(params.statuses) ? (params.statuses as Array<PastJobStatus>) : undefined;
    const startFromRaw = Array.isArray(params.startFrom) ? params.startFrom[0] : params.startFrom;
    const startFrom = parseStartFromParam(startFromRaw);

    // Get and filter jobs
    let jobs = getPastJobs();
    if (jobType) jobs = jobs.filter((j) => j.jobType === jobType);
    if (startFrom) jobs = jobs.filter((j) => j.endTime && new Date(j.endTime) > startFrom);
    if (statuses) jobs = jobs.filter((j) => statuses.includes(j.status as PastJobStatus));
    return json(jobs);
  } catch (error) {
    console.error('Error getting past jobs:', error);
    return json({ error: 'Failed to get past jobs' }, { status: 500 });
  }
}
