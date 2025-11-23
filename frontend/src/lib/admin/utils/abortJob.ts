import type { AdminFeature } from '$lib/admin/features';
import type { AdminContext } from '$lib/contexts/admin/adminContext.type';

/**
 * Handles aborting a job with user confirmation and error handling.
 *
 * @param jobId - The ID of the job to abort
 * @param options - Configuration options
 * @param options.feature - The admin feature (for localized confirmation message)
 * @param options.reason - Optional custom abort reason
 * @param options.abortJob - The abortJob function from AdminContext
 * @param options.t - The translation function from AdminContext
 * @returns Promise that resolves when the job is aborted or user cancels
 */
export async function handleAbortJob(
  jobId: string,
  options: {
    feature: AdminFeature | string;
    reason?: string;
    abortJob: AdminContext['abortJob'];
    t: AdminContext['t'];
  }
): Promise<void> {
  const { feature, reason, abortJob, t } = options;

  // Get the feature display name
  const featureName = typeof feature === 'string' ? feature : t.get(`adminApp.jobs.features.${feature}.title`);

  // Confirm with user
  if (!confirm(t.get('adminApp.jobs.confirmAbortJob', { feature: featureName }))) {
    return;
  }

  // Abort the job with error handling
  try {
    await abortJob({
      jobId,
      reason: reason || `Admin aborted this ${featureName.toLowerCase()} process`
    });
  } catch (error) {
    console.error('Error aborting job:', error);
    alert(t.get('adminApp.jobs.abortJobFailed'));
    throw error; // Re-throw in case caller wants to handle it
  }
}