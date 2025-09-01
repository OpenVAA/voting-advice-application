import { getActiveJobs, getPastJobs } from './jobStore';
import type { JobInfo } from './jobStore.type';

/**
 * Parse the startFrom parameter from the admin/jobs API URL
 * @param url - The URL object
 * @returns The startFrom parameter as a Date object, or undefined if not found
 */
export function parseStartFrom(url: URL): Date | undefined {
  const raw = url.searchParams.get('startFrom') ?? undefined;
  if (!raw) return undefined;
  const ts = new Date(raw);
  return Number.isNaN(ts.getTime()) ? undefined : ts;
}

/**
 * Parse the status parameter from the admin/jobs API URL
 * @param url - The URL object
 * @returns The status parameter as an array of strings, or ['completed', 'failed'] if not found
 */
export function parsePastStatuses(url: URL): Array<'completed' | 'failed'> {
  const raw = url.searchParams.get('status') ?? 'completed,failed';
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s === 'completed' || s === 'failed')
  ) as Set<'completed' | 'failed'>;
  if (set.size === 0) {
    set.add('completed');
    set.add('failed');
  }
  return Array.from(set);
}

/**
 * Select the active jobs from the admin/jobs API URL
 * @param url - The URL object
 * @returns The active jobs as an array of JobInfo objects
 *
 * @example
 * ```ts
 * const jobs = selectActiveJobs(new URL('http://localhost:5173/api/admin/jobs/active'));
 * console.log(jobs);
 * // [JobInfo, JobInfo, ...]
 *
 * const jobs = selectActiveJobs(new URL('http://localhost:5173/api/admin/jobs/active?feature=test&startFrom=2025-01-01T00:00:00Z'));
 * console.log(jobs);
 * // [JobInfo, JobInfo, ...]
 * ```
 */
export function selectActiveJobs(url: URL): Array<JobInfo> {
  const feature = url.searchParams.get('feature') ?? undefined;
  const startFrom = parseStartFrom(url);
  let jobs = getActiveJobs();
  if (feature) jobs = jobs.filter((j) => j.feature === feature);
  if (startFrom) jobs = jobs.filter((j) => new Date(j.startTime) > startFrom);
  return jobs;
}

/**
 * Select the past jobs from the admin/jobs API URL
 * @param url - The URL object
 * @returns The past jobs as an array of JobInfo objects
 *
 * @example
 * ```ts
 * const jobs = selectPastJobs(new URL('http://localhost:5173/api/admin/jobs/past'));
 * console.log(jobs);
 * // [JobInfo, JobInfo, ...]
 *
 * const jobs = selectPastJobs(new URL('http://localhost:5173/api/admin/jobs/past?feature=test&status=completed&startFrom=2025-01-01T00:00:00Z'));
 * console.log(jobs);
 * // [JobInfo, JobInfo, ...]
 * ```
 */
export function selectPastJobs(url: URL): Array<JobInfo> {
  const feature = url.searchParams.get('feature') ?? undefined;
  const statuses = new Set(parsePastStatuses(url));
  const startFrom = parseStartFrom(url);
  let jobs = getPastJobs();
  if (feature) jobs = jobs.filter((j) => j.feature === feature);
  if (statuses.size) jobs = jobs.filter((j) => statuses.has(j.status as 'completed' | 'failed'));
  if (startFrom) jobs = jobs.filter((j) => j.endTime && new Date(j.endTime) > startFrom);
  return jobs;
}
