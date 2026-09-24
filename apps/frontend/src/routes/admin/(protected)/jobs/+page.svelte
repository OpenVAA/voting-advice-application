<script lang="ts">
  import { MainContent } from '$layouts/main';
  import { FeatureJobs } from '$lib/admin/components/jobs';
  import { ADMIN_FEATURES } from '$lib/admin/features';
  import { ButtonWithConfirmation } from '$lib/components/buttonWithConfirmation';
  import { getAdminContext } from '$lib/contexts/admin';

  // TODO: add error handling & info updates if polling service refresh, abortAllJobs or abortJob fails

  ////////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////////

  const ctx = getAdminContext();
  // Stable members: safe to destructure. The job projections are NOT — see below.
  const { t, abortAllJobs } = ctx;

  ////////////////////////////////////////////////////////////////////////
  // Get jobs
  ////////////////////////////////////////////////////////////////////////

  // `activeJobsByFeature` and `pastJobs` are read-only PROTOTYPE GETTERS over `$derived`/`$derived.by` (`jobStates.svelte.ts`), and both return a NEW collection on every recompute. Destructuring them — as this file did — bound the initial empty `Map`/array at component init, so the polling service updated the registry while every tile below stayed frozen at zero: the page rendered perfectly and showed nothing. Read them through `ctx.jobs.X` inside the tracking scope instead, per CLAUDE.md § Context Destructuring Rule. That includes the template reads further down; a local alias would reintroduce the same freeze.
  let activeJobsCount = $derived([...ctx.jobs.activeJobsByFeature.values()].filter((j) => !!j).length);

  ////////////////////////////////////////////////////////////////////////
  // Handle aborting jobs
  ////////////////////////////////////////////////////////////////////////

  // Emergency: abort all running jobs
  async function performEmergencyCleanup() {
    try {
      await abortAllJobs();
    } catch (error) {
      console.error(error);
      alert(t('adminApp.jobs.abortAllFailed'));
    }
  }
</script>

<MainContent title={t('adminApp.jobs.title')}>
  {#snippet primaryActions()}
    <div class="flex gap-2">
      <ButtonWithConfirmation
        text={t('adminApp.jobs.emergencyCleanup')}
        modalTitle={t('adminApp.jobs.confirmAbortAll')}
        variant="secondary"
        onConfirm={performEmergencyCleanup}>
      </ButtonWithConfirmation>
    </div>
  {/snippet}

  {#snippet fullWidth()}
    <div class="gap-lg flex flex-col">
      <div class="px-1">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">{t('adminApp.jobs.systemHealth')}</h2>

            <div class="stats stats-horizontal shadow">
              <div class="stat">
                <div class="stat-title">{t('adminApp.jobs.activeJobs')}</div>
                <div class="stat-value {activeJobsCount > 0 ? 'text-primary' : 'text-success'}">{activeJobsCount}</div>
              </div>

              <div class="stat">
                <div class="stat-title">{t('adminApp.jobs.successfulJobs')}</div>
                <div class="stat-value text-success">
                  {ctx.jobs.pastJobs.filter((job) => job.status === 'completed').length}
                </div>
              </div>

              <div class="stat">
                <div class="stat-title">{t('adminApp.jobs.failedJobs')}</div>
                <div class="stat-value text-error">
                  {ctx.jobs.pastJobs.filter((job) => job.status === 'failed').length}
                </div>
              </div>

              <div class="stat">
                <div class="stat-title">{t('adminApp.jobs.abortedJobs')}</div>
                <div class="stat-value text-warning">
                  {ctx.jobs.pastJobs.filter((job) => job.status === 'aborted').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="gap-lg flex w-full px-1">
        <!-- Main Content - Features list -->
        <div class="gap-lg flex w-3/4 flex-col">
          {#each ADMIN_FEATURES as feature}
            <div class="relative">
              <FeatureJobs {feature} />
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/snippet}
</MainContent>
