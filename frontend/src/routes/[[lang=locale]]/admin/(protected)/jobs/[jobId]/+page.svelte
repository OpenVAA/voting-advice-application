<!--@component
# Single Admin Job Page

Display the details of a single admin job.
-->

<script lang="ts">
  import { page } from '$app/stores';
  import JobMonitor from '$lib/admin/components/jobs/JobMonitor.svelte';
  import { Button } from '$lib/components/button';
  import Loading from '$lib/components/loading/Loading.svelte';
  import { getAdminContext } from '$lib/contexts/admin';
  import { parseParams } from '$lib/utils/route';
  import MainContent from '../../../../MainContent.svelte';
  import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

  const {
    getRoute,
    jobs: { pastJobsStore, pollingService },
    t
  } = getAdminContext();

  let job: JobInfo | undefined;
  let jobId: string | undefined;

  $: jobId = parseParams($page).jobId;
  $: job = jobId ? $pastJobsStore.get(jobId) : undefined;

  pollingService.refresh();
</script>

<MainContent title="Job {jobId ?? '–'}">
  {#if job}
    <JobMonitor
      jobType="Job details"
      activeJob={job}
      onKillJob={() => window.alert('Cannot kill job')}
      maxMessages={Infinity} />
  {:else if jobId}
    <p>No job details found for id ${jobId}</p>
  {:else}
    <Loading />
  {/if}
  <Button slot="primaryActions" variant="main" href={$getRoute('AdminAppJobs')} text={$t('common.back')} />
</MainContent>
