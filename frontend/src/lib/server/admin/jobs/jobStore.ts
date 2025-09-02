/**
 * Centralized job store for tracking admin operations across different features
 * This is a global in-memory store that will be replaced with a database later
 */

import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo, PastJobStatus } from './jobStore.type';

// Global in-memory job stores
const activeJobs = new Map<string, JobInfo>();
const pastJobs = new Map<string, JobInfo>();

/**
 * Create a new job entry
 * @param feature - The feature name (e.g., 'argument-condensation')
 * @param author - Admin email who started the job
 * @returns The created job ID
 */
export function createJob(feature: AdminFeature, author: string): JobInfo {
  const jobId = crypto.randomUUID();
  const now = new Date();

  const job: JobInfo = {
    id: jobId,
    jobType: feature,
    author,
    status: 'running',
    progress: 0,
    startTime: now.toISOString(),
    lastActivityTime: now.toISOString(),
    infoMessages: [],
    warningMessages: [],
    errorMessages: []
  };

  activeJobs.set(jobId, job);

  return job;
}

/**
 * Update job progress
 * @param jobId - The job ID to update
 * @param progress - Progress value between 0 and 1
 */
export function updateJobProgress(jobId: string, progress: number): void {
  const job = activeJobs.get(jobId);
  if (job) {
    job.progress = Math.max(0, Math.min(1, progress));
    job.lastActivityTime = new Date().toISOString();
  }
}

/**
 * Add an info message to a job
 * @param jobId - The job ID to update
 * @param message - The info message to add
 */
export function addJobInfoMessage(jobId: string, message: string): void {
  const job = activeJobs.get(jobId);
  if (job) {
    job.infoMessages.push({
      type: 'info',
      message,
      timestamp: new Date().toISOString()
    });
    job.lastActivityTime = new Date().toISOString();
    // Keep only the last 20 info messages to prevent memory bloat
    if (job.infoMessages.length > 20) {
      job.infoMessages = job.infoMessages.slice(-20);
    }
  }
}

/**
 * Add a warning message to a job
 * @param jobId - The job ID to update
 * @param message - The warning message to add
 */
export function addJobWarningMessage(jobId: string, message: string): void {
  const job = activeJobs.get(jobId);
  if (job) {
    job.warningMessages.push({
      type: 'warning',
      message,
      timestamp: new Date().toISOString()
    });
    job.lastActivityTime = new Date().toISOString();
    // Keep only the last 50 warning messages to prevent memory bloat
    if (job.warningMessages.length > 50) {
      job.warningMessages = job.warningMessages.slice(-50);
    }
  }
}

/**
 * Add an error message to a job
 * @param jobId - The job ID to update
 * @param message - The error message to add
 */
export function addJobErrorMessage(jobId: string, message: string): void {
  const job = activeJobs.get(jobId);
  if (job) {
    job.errorMessages.push({
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    });
    job.lastActivityTime = new Date().toISOString();
    // Keep only the last 50 error messages to prevent memory bloat
    if (job.errorMessages.length > 50) {
      job.errorMessages = job.errorMessages.slice(-50);
    }
  }
}

/**
 * Move a job from active to past jobs
 * @param jobId - The job ID to move
 * @param status - The final status of the job
 */
function moveJobToPast(jobId: string, status: PastJobStatus): void {
  const job = activeJobs.get(jobId);
  if (job) {
    // Update job with final status and end time
    job.status = status;
    job.endTime = new Date().toISOString();
    job.lastActivityTime = new Date().toISOString();

    // Move to past jobs
    pastJobs.set(jobId, job);

    // Remove from active jobs immediately
    activeJobs.delete(jobId);
  }
}

/**
 * Mark a job as completed
 * @param jobId - The job ID to complete
 */
export function completeJob(jobId: string): void {
  const job = activeJobs.get(jobId);
  if (job) {
    job.progress = 1;
    moveJobToPast(jobId, 'completed');
  }
}

// TODO: combine these two functions into one
/**
 * Mark a job as failed
 * @param jobId - The job ID to mark as failed
 * @param errorMessage - Optional error message to add
 */
export function failJob(jobId: string, errorMessage?: string): void {
  const job = activeJobs.get(jobId);
  if (job) {
    if (errorMessage) {
      addJobErrorMessage(jobId, errorMessage);
    }
    moveJobToPast(jobId, 'failed');
  }
}

/**
 * Clean up all past jobs for a feature (useful for testing/reset)
 * @param feature - The feature name to clean up
 */
export function cleanupPastJobsForFeature(feature: string): void {
  for (const [jobId, job] of pastJobs.entries()) {
    if (job.jobType === feature) {
      pastJobs.delete(jobId);
    }
  }
}

/**
 * Request cooperative abort for a running job
 * Sets status to 'aborting' and logs a warning
 * @param jobId - The job ID
 * @param reason - Optional reason
 */
export function requestAbort(jobId: string, reason?: string): void {
  const job = activeJobs.get(jobId);
  if (job) {
    job.status = 'aborting'; // Set status to 'aborting', but keep in active jobs
    addJobWarningMessage(jobId, `Abort requested: ${reason ?? 'No message provided'}`);
    job.lastActivityTime = new Date().toISOString();
  }
}

/**
 * Check if an abort has been requested for a job
 */
export function isAbortRequested(jobId: string): boolean {
  const job = activeJobs.get(jobId);
  return job?.status === 'aborting';
}

/**
 * Mark a job as aborted (move to past with status 'aborted')
 */
export function markAborted(jobId: string): void {
  const job = activeJobs.get(jobId);
  if (job) {
    addJobWarningMessage(jobId, 'Job aborted');
  }
  moveJobToPast(jobId, 'aborted');
}

/**
 * Get a specific job by ID (checks both active and past jobs)
 * @param jobId - The job ID to retrieve
 * @returns The job info or undefined if not found
 */
export function getJob(jobId: string): JobInfo | undefined {
  return activeJobs.get(jobId) || pastJobs.get(jobId);
}

/**
 * Get all active jobs
 * @returns Array of all active jobs
 */
export function getActiveJobs(): Array<JobInfo> {
  return Array.from(activeJobs.values());
}

/**
 * Get all past jobs
 * @returns Array of all past jobs
 */
export function getPastJobs(): Array<JobInfo> {
  return Array.from(pastJobs.values());
}
