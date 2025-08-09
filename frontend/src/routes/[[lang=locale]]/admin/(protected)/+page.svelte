<!--@component
# Admin Home Page

Main landing page for admin section showing available tools
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import MainContent from '../../MainContent.svelte';

  const { t, getRoute } = getAppContext();
</script>

<MainContent title={$t('adminApp.common.home')}>
  <p class="text-center">{$t('adminApp.common.description')}</p>

  <div class="flex flex-col gap-sm">
    <Button
      href={$getRoute('AdminFactorAnalysis')}
      text={$t('adminApp.factorAnalysis.title')}
      icon="create"
      iconPos="left"
      variant="normal">
      <svelte:fragment slot="badge">
        <span class="text-primary-600 font-mono"></span>
      </svelte:fragment>
    </Button>

    <Button
      href={$getRoute('AdminQuestionInfo')}
      text={$t('adminApp.questionInfo.title')}
      icon="create"
      iconPos="left"
      variant="normal">
      <svelte:fragment slot="badge">
        <span class="font-mono text-gray-400"></span>
      </svelte:fragment>
    </Button>

    <Button text={$t('adminApp.argumentCondensation.title')} icon="create" iconPos="left" variant="normal" disabled>
      <svelte:fragment slot="badge">
        <span class="font-mono text-gray-400"></span>
      </svelte:fragment>
    </Button>
  </div>
</MainContent>
