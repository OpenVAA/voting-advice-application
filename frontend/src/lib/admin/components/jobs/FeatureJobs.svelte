<script lang="ts">
  import JobDetails from './JobDetails.svelte';
  import { ADMIN_FEATURE } from '$lib/admin/features';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';
  import { concatClass } from '$lib/utils/components';
  import type { FeatureJobsProps } from './FeatureJobs.type';
  import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
  import { compareDates } from '$lib/utils/sorting';

  type $$Props = FeatureJobsProps;

  const DEFAULT_MAX_MESSAGES = 1000;
  const DEFAULT_MESSAGES_HEIGHT = 'max-h-64';

  export let feature: $$Props['feature'];
  export let onAbortJob: $$Props['onAbortJob'] = undefined;
  export let showFeatureLink: $$Props['showFeatureLink'] = true;

  ////////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////////

  const {
    getRoute,
    jobs: { activeJobsByFeature, pastJobsByFeature },
    t
  } = getAdminContext();

  ////////////////////////////////////////////////////////////////////////
  // Get jobs for feature
  ////////////////////////////////////////////////////////////////////////

  let activeJob: JobInfo | undefined;
  let pastJobs: Array<JobInfo>;

  $: activeJob = $activeJobsByFeature.get(feature);
  $: pastJobs = ($pastJobsByFeature.get(feature) ?? []).sort((a, b) => compareDates(b.startTime, a.startTime)); // Sorting reversed

  ////////////////////////////////////////////////////////////////////////
  // Show or hide past jobs
  ////////////////////////////////////////////////////////////////////////

  /**
   * Control past jobs visibility (default closed)
   */
  let pastOpen = false;

  function togglePast() {
    pastOpen = !pastOpen;
  }
</script>

<section {...concatClass($$restProps, 'card w-full max-w-full bg-base-100 shadow-lg border border-base-300')}>
  <div class="card-body space-y-8 overflow-hidden p-6">
    <!-- Feature Header -->
    <div class="flex items-center justify-between gap-4">
      <h2 class="card-title text-primary flex-1">
        {$t(`adminApp.jobs.features.${feature}.title`)}
      </h2>
      {#if showFeatureLink}
        <div class="flex-shrink-0">
          <Button
            text="Go to Feature"
            variant="secondary"
            href={$getRoute(ADMIN_FEATURE[feature].route)}
            icon="create"
            iconPos="right"
            class="btn-sm" />
        </div>
      {/if}
    </div>

    <!-- Active Jobs Section -->
    <div class="space-y-4">
      <h3 class="border-base-300 text-base-content border-b pb-3 text-lg font-semibold">
        {$t('adminApp.jobs.activeJobs')}
      </h3>
      {#if !activeJob}
        <div class="border-base-300 bg-base-200/30 rounded-lg border-2 border-dashed py-8 text-center">
          <div class="text-base-content/60">
            <div class="text-sm">{$t('adminApp.jobs.noActiveJobs')}</div>
          </div>
        </div>
      {/if}

      {#if activeJob && activeJob.status === 'running'}
        <JobDetails job={activeJob} {onAbortJob} {maxMessages} {messagesHeight} />
      {:else if activeJob && activeJob.status === 'aborting'}
        <JobDetails job={activeJob} onAbortJob={undefined} {maxMessages} {messagesHeight} />
      {/if}
    </div>

    <!-- Past Jobs Section. Currently has a bug. TODO: fix bug of not showing past jobs. If we even want to keep this section. Do we?  -->
    <div class="border-base-300 space-y-4 border-t-2 pt-4">
      <div class="space-y-3">
        <h3 class="text-base-content text-lg font-semibold">
          {$t('adminApp.jobs.pastJobs')}
          {#if pastJobs.length > 0}
            <span class="badge badge-neutral badge-sm ml-2">{pastJobs.length}</span>
          {/if}
        </h3>
        {#if pastJobs.length > 0}
          <div class="flex justify-end">
            <Button
              text={pastOpen ? $t('adminApp.jobs.hidePastJobs') : $t('adminApp.jobs.showPastJobs')}
              variant="secondary"
              class="btn-sm"
              on:click={togglePast} />
          </div>
        {/if}
      </div>

      {#if pastJobs.length === 0}
        <div class="border-base-300 bg-base-200/30 rounded-lg border-2 border-dashed py-8 text-center">
          <div class="text-base-content/60">
            <div class="text-sm">{$t('adminApp.jobs.noPastJobs')}</div>
          </div>
        </div>
      {:else if pastOpen}
        <div class="border-base-300 bg-base-200/50 w-full rounded-lg border p-4">
          <div class="max-h-80 w-full space-y-4 overflow-y-auto overflow-x-hidden">
            {#each pastJobs as job (job.id)}
              <div class="bg-base-100 w-full rounded-lg p-1 shadow-sm">
                <JobDetails {job} onAbortJob={undefined} />
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
