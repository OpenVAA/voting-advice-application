<script lang="ts">
  import JobDetails from './JobDetails.svelte';
  import { ADMIN_FEATURE } from '$lib/admin/features';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';
  import { concatClass } from '$lib/utils/components';
  import type { FeatureJobsProps } from './FeatureJobs.type';
  import type { TranslationKey } from '$types';
  import type { AdminFeature } from '$lib/admin/features';

  type $$Props = FeatureJobsProps;

  const DEFAULT_MAX_MESSAGES = 1000;
  const DEFAULT_MESSAGES_HEIGHT = 'max-h-64';

  export let feature: $$Props['feature'];
  const jobType = ADMIN_FEATURE[feature].jobName; // For convenience
  export let maxMessages: $$Props['maxMessages'] = DEFAULT_MAX_MESSAGES;
  export let messagesHeight: $$Props['messagesHeight'] = DEFAULT_MESSAGES_HEIGHT;
  export let onAbortJob: $$Props['onAbortJob'] = undefined;
  export let showFeatureLink: $$Props['showFeatureLink'] = true;

  // Control past jobs visibility (default closed)
  let pastOpen: boolean = false;

  function togglePast() {
    pastOpen = !pastOpen;
  }

  const {
    getRoute,
    jobs: { activeJobsStore, pastJobsStore },
    t
  } = getAdminContext();

  // Resolve feature link from jobType
  $: featureLink = (() => {
    for (const feature of Object.values(ADMIN_FEATURE)) {
      if (feature.jobName === jobType) return $getRoute(feature.route);
    }
    return null;
  })();

  // Active job for this feature
  $: activeJob = $activeJobsStore.get(jobType) || null;

  // Past jobs for this feature, newest first
  $: pastJobs = Array.from($pastJobsStore.values())
    .filter((j) => j.jobType === jobType)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const featureTitleKey: Record<AdminFeature, TranslationKey> = {
    ArgumentCondensation: 'adminApp.jobs.argumentCondensation.title',
    QuestionInfoGeneration: 'adminApp.jobs.questionInfoGeneration.title'
  } as const;
</script>

<section {...concatClass($$restProps, 'card w-full max-w-full bg-base-100 shadow-lg border border-base-300')}>
  <div class="card-body space-y-8 overflow-hidden p-6">
    <!-- Feature Header -->
    <div class="flex items-center justify-between gap-4">
      <h2 class="card-title flex-1 text-primary">
        {$t(featureTitleKey[feature])}
      </h2>
      {#if featureLink && showFeatureLink}
        <div class="flex-shrink-0">
          <Button
            text="Go to Feature"
            variant="secondary"
            href={featureLink}
            icon="create"
            iconPos="right"
            class="btn-sm" />
        </div>
      {/if}
    </div>

    <!-- Active Jobs Section -->
    <div class="space-y-4">
      <h3 class="font-semibold pb-3 border-b border-base-300 text-lg text-base-content">
        {$t('adminApp.jobs.activeJobs')}
      </h3>
      {#if !activeJob}
        <div class="border-2 rounded-lg border-dashed border-base-300 bg-base-200/30 py-8 text-center">
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

    <!-- Past Jobs Section -->
    <div class="border-t-2 space-y-4 border-base-300 pt-4">
      <div class="space-y-3">
        <h3 class="font-semibold text-lg text-base-content">
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
        <div class="border-2 rounded-lg border-dashed border-base-300 bg-base-200/30 py-8 text-center">
          <div class="text-base-content/60">
            <div class="text-sm">{$t('adminApp.jobs.noPastJobs')}</div>
          </div>
        </div>
      {:else if pastOpen}
        <div class="w-full rounded-lg border border-base-300 bg-base-200/50 p-4">
          <div class="max-h-80 w-full space-y-4 overflow-y-auto overflow-x-hidden">
            {#each pastJobs as job (job.id)}
              <div class="p-1 w-full rounded-lg bg-base-100 shadow-sm">
                <JobDetails {job} onAbortJob={undefined} {maxMessages} {messagesHeight} />
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
