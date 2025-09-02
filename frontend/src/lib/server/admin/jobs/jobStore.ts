/**
 * Centralized job store for tracking admin operations across different features
 * This is a global in-memory store that will be replaced with a database later
 */

import { DEFAULT_MAX_MESSAGES } from '$lib/admin/components/jobs/shared';
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
 * Add a message to a job. Internal function.
 * @param jobId - The job ID to update
 * @param messageType - The type of message ('info', 'warning', 'error')
 * @param message - The message content
 */
function addJobMessage(jobId: string, messageType: 'info' | 'warning' | 'error', message: string): void {
  const job = activeJobs.get(jobId);
  if (!job) return;

  const jobMessage = {
    type: messageType,
    message,
    timestamp: new Date().toISOString()
  };

  // Simple switch - still eliminates duplication
  switch (messageType) {
    case 'info':
      job.infoMessages.push(jobMessage);
      if (job.infoMessages.length > DEFAULT_MAX_MESSAGES) {
        job.infoMessages = job.infoMessages.slice(-DEFAULT_MAX_MESSAGES);
      }
      break;
    case 'warning':
      job.warningMessages.push(jobMessage);
      if (job.warningMessages.length > DEFAULT_MAX_MESSAGES) {
        job.warningMessages = job.warningMessages.slice(-DEFAULT_MAX_MESSAGES);
      }
      break;
    case 'error':
      job.errorMessages.push(jobMessage);
      if (job.errorMessages.length > DEFAULT_MAX_MESSAGES) {
        job.errorMessages = job.errorMessages.slice(-DEFAULT_MAX_MESSAGES);
      }
      break;
  }

  job.lastActivityTime = new Date().toISOString();
}
/**
 * Add an info message to a job
 * @param jobId - The job ID to update
 * @param message - The info message to add
 */
export function addJobInfoMessage(jobId: string, message: string): void {
  addJobMessage(jobId, 'info', message);
}

/**
 * Add a warning message to a job
 * @param jobId - The job ID to update
 * @param message - The warning message to add
 */
export function addJobWarningMessage(jobId: string, message: string): void {
  addJobMessage(jobId, 'warning', message);
}

/**
 * Add an error message to a job
 * @param jobId - The job ID to update
 * @param message - The error message to add
 */
export function addJobErrorMessage(jobId: string, message: string): void {
  addJobMessage(jobId, 'error', message);
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
 * Finalize a job. Internal function.
 * @param jobId - The job ID to finalize
 * @param status - The final status of the job
 * @param errorMessage - Optional error message to add
 */
function finalizeJob(jobId: string, status: PastJobStatus, errorMessage?: string): void {
  const job = activeJobs.get(jobId);
  if (!job) return;
  
  if (status === 'completed') {
    job.progress = 1;
  } else if (status === 'failed' && errorMessage) {
    addJobErrorMessage(jobId, errorMessage);
  }
  
  moveJobToPast(jobId, status);
}

/**
 * Mark a job as completed
 * @param jobId - The job ID to complete
 */
export function completeJob(jobId: string): void { finalizeJob(jobId, 'completed'); } 

/**
 * Mark a job as failed
 * @param jobId - The job ID to fail
 * @param errorMessage - Optional error message to add
 */
export function failJob(jobId: string, errorMessage?: string): void { finalizeJob(jobId, 'failed', errorMessage); } 

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
