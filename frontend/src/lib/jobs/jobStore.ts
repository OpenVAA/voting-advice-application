/**
 * Centralized job store for tracking admin operations across different features
 * This is a global in-memory store that will be replaced with a database later
 */

export interface JobInfo {
  id: string;
  feature: string; // 'argument-condensation', 'factor-analysis', etc.
  author: string; // admin email
  status: 'running' | 'completed' | 'failed';
  progress: number; // 0-1 range
  startTime: Date;
  endTime?: Date; // Set when job completes or fails
  infoMessages: Array<string>;
  warningMessages: Array<string>;
  errorMessages: Array<string>;
}

// Global in-memory job stores
const activeJobs = new Map<string, JobInfo>();
const pastJobs = new Map<string, JobInfo>();

/**
 * Create a new job entry
 * @param feature - The feature name (e.g., 'argument-condensation')
 * @param author - Admin email who started the job
 * @returns The created job ID
 */
export function createJob(feature: string, author: string): string {
  const jobId = crypto.randomUUID();

  const job: JobInfo = {
    id: jobId,
    feature,
    author,
    status: 'running',
    progress: 0,
    startTime: new Date(),
    infoMessages: [],
    warningMessages: [],
    errorMessages: []
  };

  activeJobs.set(jobId, job);
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

/**
 * Clean up old past jobs to prevent memory bloat
 * This keeps only the last 100 past jobs across all features
 * @param maxPastJobs - Maximum number of past jobs to keep (default: 100)
 */
export function cleanupOldPastJobs(maxPastJobs: number = 100): void {
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
