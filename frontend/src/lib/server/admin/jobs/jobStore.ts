/**
 * Centralized job store for tracking admin operations across different features
 * This is a global in-memory store that will be replaced with a database later
 */

import type { JobInfo } from './jobStore.type';

// Global in-memory job stores
const activeJobs = new Map<string, JobInfo>();
const pastJobs = new Map<string, JobInfo>();

// Configuration for job timeouts and cleanup
const JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const JOB_ACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes of inactivity
const MAX_ACTIVE_JOBS = 50; // Maximum number of active jobs to prevent memory bloat
const MAX_PAST_JOBS = 100; // Maximum number of past jobs to keep

// Cleanup interval (runs every 5 minutes)
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Initialize the job store with automatic cleanup
 */
function initializeJobStore(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  // Run cleanup every 5 minutes
  cleanupInterval = setInterval(
    () => {
      cleanupStaleJobs();
      cleanupOldPastJobs(MAX_PAST_JOBS);
    },
    5 * 60 * 1000
  );

  // Also run cleanup on process exit
  if (typeof process !== 'undefined') {
    process.on('exit', () => {
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }
    });
  }
}

/**
 * Create a new job entry
 * @param feature - The feature name (e.g., 'argument-condensation')
 * @param author - Admin email who started the job
 * @returns The created job ID
 */
export function createJob(feature: string, author: string): string {
  const jobId = crypto.randomUUID();
  const now = new Date();

  const job: JobInfo = {
    id: jobId,
    feature,
    author,
    status: 'running',
    progress: 0,
    startTime: now,
    lastActivityTime: now,
    infoMessages: [],
    warningMessages: [],
    errorMessages: []
  };

  activeJobs.set(jobId, job);

  // Initialize cleanup if this is the first job
  if (activeJobs.size === 1 && !cleanupInterval) {
    initializeJobStore();
  }

  return jobId;
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
    job.lastActivityTime = new Date();
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
    job.infoMessages.push(message);
    job.lastActivityTime = new Date();
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
    job.warningMessages.push(message);
    job.lastActivityTime = new Date();
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
    job.errorMessages.push(message);
    job.lastActivityTime = new Date();
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
function moveJobToPast(jobId: string, status: 'completed' | 'failed'): void {
  const job = activeJobs.get(jobId);
  if (job) {
    // Update job with final status and end time
    job.status = status;
    job.endTime = new Date();
    job.lastActivityTime = new Date();

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
 * Force fail a job (useful for recovery from stuck jobs)
 * @param jobId - The job ID to force fail
 * @param reason - Reason for force failing
 */
export function forceFailJob(jobId: string, reason: string): void {
  const job = activeJobs.get(jobId);
  if (job) {
    addJobErrorMessage(jobId, `Job force-failed: ${reason}`);
    moveJobToPast(jobId, 'failed');
  } else {
    // Check if it's already in past jobs
    const pastJob = pastJobs.get(jobId);
    if (pastJob && pastJob.status === 'running') {
      pastJob.status = 'failed';
      pastJob.endTime = new Date();
      pastJob.lastActivityTime = new Date();
      pastJob.errorMessages.push(`Job force-failed: ${reason}`);
    }
  }
}

/**
 * Clean up stale jobs that have been running too long or are inactive
 */
export function cleanupStaleJobs(): void {
  const now = new Date();
  const staleJobs: Array<{ jobId: string; reason: string }> = [];

  // Check for jobs that have been running too long
  for (const [jobId, job] of activeJobs.entries()) {
    const runningTime = now.getTime() - job.startTime.getTime();
    const inactiveTime = now.getTime() - job.lastActivityTime.getTime();

    if (runningTime > JOB_TIMEOUT_MS) {
      staleJobs.push({ jobId, reason: `Job running too long (${Math.round(runningTime / 60000)} minutes)` });
    } else if (inactiveTime > JOB_ACTIVITY_TIMEOUT_MS) {
      staleJobs.push({ jobId, reason: `Job inactive too long (${Math.round(inactiveTime / 60000)} minutes)` });
    }
  }

  // Force fail all stale jobs
  for (const { jobId, reason } of staleJobs) {
    console.warn(`Cleaning up stale job ${jobId}: ${reason}`);
    forceFailJob(jobId, reason);
  }

  // If we have too many active jobs, fail the oldest ones
  if (activeJobs.size > MAX_ACTIVE_JOBS) {
    const sortedJobs = Array.from(activeJobs.entries()).sort(
      (a, b) => a[1].startTime.getTime() - b[1].startTime.getTime()
    );

    const jobsToFail = sortedJobs.slice(0, activeJobs.size - MAX_ACTIVE_JOBS);
    for (const [jobId] of jobsToFail) {
      console.warn(`Cleaning up excess active job ${jobId}: Too many active jobs`);
      forceFailJob(jobId, 'Too many active jobs - auto-cleanup');
    }
  }

  if (staleJobs.length > 0) {
    console.info(`Cleaned up ${staleJobs.length} stale jobs`);
  }
}

/**
 * Get job health information
 * @param jobId - The job ID to check
 * @returns Health status information
 */
export function getJobHealth(jobId: string):
  | {
      isHealthy: boolean;
      runningTime: number;
      inactiveTime: number;
      warnings: Array<string>;
    }
  | undefined {
  const job = activeJobs.get(jobId);
  if (!job) return undefined;

  const now = new Date();
  const runningTime = now.getTime() - job.startTime.getTime();
  const inactiveTime = now.getTime() - job.lastActivityTime.getTime();

  const warnings: Array<string> = [];

  if (runningTime > JOB_TIMEOUT_MS * 0.8) {
    warnings.push(
      `Job has been running for ${Math.round(runningTime / 60000)} minutes (timeout: ${JOB_TIMEOUT_MS / 60000} minutes)`
    );
  }

  if (inactiveTime > JOB_ACTIVITY_TIMEOUT_MS * 0.8) {
    warnings.push(
      `Job has been inactive for ${Math.round(inactiveTime / 60000)} minutes (inactivity timeout: ${JOB_ACTIVITY_TIMEOUT_MS / 60000} minutes)`
    );
  }

  const isHealthy = runningTime <= JOB_TIMEOUT_MS && inactiveTime <= JOB_ACTIVITY_TIMEOUT_MS;

  return {
    isHealthy,
    runningTime,
    inactiveTime,
    warnings
  };
}

/**
 * Get overall system health
 * @returns System health information
 */
export function getSystemHealth(): {
  activeJobs: number;
  pastJobs: number;
  staleJobs: number;
  warnings: Array<string>;
} {
  const warnings: Array<string> = [];
  let staleJobs = 0;

  // Check for stale jobs
  for (const [jobId] of activeJobs.entries()) {
    const health = getJobHealth(jobId);
    if (health && !health.isHealthy) {
      staleJobs++;
      warnings.push(...health.warnings.map((w) => `Job ${jobId}: ${w}`));
    }
  }

  if (activeJobs.size > MAX_ACTIVE_JOBS * 0.8) {
    warnings.push(`High number of active jobs: ${activeJobs.size}/${MAX_ACTIVE_JOBS}`);
  }

  if (pastJobs.size > MAX_PAST_JOBS * 0.8) {
    warnings.push(`High number of past jobs: ${pastJobs.size}/${MAX_PAST_JOBS}`);
  }

  return {
    activeJobs: activeJobs.size,
    pastJobs: pastJobs.size,
    staleJobs,
    warnings
  };
}

/**
 * Clean up old past jobs to prevent memory bloat
 * This keeps only the last 100 past jobs across all features
 * @param maxPastJobs - Maximum number of past jobs to keep (default: 100)
 */
export function cleanupOldPastJobs(maxPastJobs: number = MAX_PAST_JOBS): void {
  if (pastJobs.size <= maxPastJobs) {
    return; // No cleanup needed
  }

  // Sort by end time (newest first) and keep only the most recent ones
  const sortedJobs = Array.from(pastJobs.values()).sort((a, b) => {
    const aTime = a.endTime?.getTime() || 0;
    const bTime = b.endTime?.getTime() || 0;
    return bTime - aTime;
  });

  // Clear all past jobs
  pastJobs.clear();

  // Keep only the most recent ones
  for (let i = 0; i < Math.min(maxPastJobs, sortedJobs.length); i++) {
    pastJobs.set(sortedJobs[i].id, sortedJobs[i]);
  }

  console.info(`Cleaned up past jobs: kept ${pastJobs.size} most recent jobs`);
}

/**
 * Clean up all past jobs for a feature (useful for testing/reset)
 * @param feature - The feature name to clean up
 */
export function cleanupPastJobsForFeature(feature: string): void {
  for (const [jobId, job] of pastJobs.entries()) {
    if (job.feature === feature) {
      pastJobs.delete(jobId);
    }
  }
}

/**
 * Clean up all jobs (active and past) for a feature (useful for testing/reset)
 * @param feature - The feature name to clean up
 */
export function cleanupAllJobsForFeature(feature: string): void {
  // Clean up active jobs
  for (const [jobId, job] of activeJobs.entries()) {
    if (job.feature === feature) {
      activeJobs.delete(jobId);
    }
  }

  // Clean up past jobs
  cleanupPastJobsForFeature(feature);
}

/**
 * Emergency cleanup function to recover from stuck jobs
 * This will force-fail all running jobs and clean up the system
 * Use this when the system gets into a bad state
 */
export function emergencyCleanup(): {
  cleanedJobs: number;
  activeJobsRemaining: number;
  pastJobsRemaining: number;
} {
  console.warn('Emergency cleanup initiated - force-failing all running jobs');

  const runningJobs = Array.from(activeJobs.keys());
  let cleanedJobs = 0;

  // Force fail all running jobs
  for (const jobId of runningJobs) {
    forceFailJob(jobId, 'Emergency cleanup - system recovery');
    cleanedJobs++;
  }

  // Clean up old past jobs aggressively
  cleanupOldPastJobs(Math.floor(MAX_PAST_JOBS / 2));

  const result = {
    cleanedJobs,
    activeJobsRemaining: activeJobs.size,
    pastJobsRemaining: pastJobs.size
  };

  console.info('Emergency cleanup completed:', result);
  return result;
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
export function getAllJobs(): Array<JobInfo> {
  return Array.from(activeJobs.values());
}

/**
 * Get all past jobs
 * @returns Array of all past jobs
 */
export function getAllPastJobs(): Array<JobInfo> {
  return Array.from(pastJobs.values());
}

/**
 * Get jobs for a specific feature (active only)
 * @param feature - The feature name to filter by
 * @returns Array of active jobs for the specified feature
 */
export function getJobsByFeature(feature: string): Array<JobInfo> {
  return getAllJobs().filter((job) => job.feature === feature);
}

/**
 * Get past jobs for a specific feature
 * @param feature - The feature name to filter by
 * @returns Array of past jobs for the specified feature
 */
export function getPastJobsByFeature(feature: string): Array<JobInfo> {
  return getAllPastJobs().filter((job) => job.feature === feature);
}

/**
 * Get past jobs by status
 * @param status - The job status to filter by ('completed' | 'failed')
 * @returns Array of past jobs with the specified status
 */
export function getPastJobsByStatus(status: 'completed' | 'failed'): Array<JobInfo> {
  return getAllPastJobs().filter((job) => job.status === status);
}

/**
 * Get past jobs by feature and status
 * @param feature - The feature name to filter by
 * @param status - The job status to filter by ('completed' | 'failed')
 * @returns Array of past jobs matching both criteria
 */
export function getPastJobsByFeatureAndStatus(feature: string, status: 'completed' | 'failed'): Array<JobInfo> {
  return getAllPastJobs().filter((job) => job.feature === feature && job.status === status);
}
