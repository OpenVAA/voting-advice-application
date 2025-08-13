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
      href={$getRoute('AdminAppArgumentCondensation')}
      text={$t('adminApp.argumentCondensation.title')}
      icon="create"
      iconPos="left" />

    <Button
      href={$getRoute('AdminAppFactorAnalysis')}
      text={$t('adminApp.factorAnalysis.title')}
      icon="create"
      iconPos="left"
      disabled />

    <Button
      href={$getRoute('AdminAppQuestionInfo')}
      text={$t('adminApp.questionInfo.title')}
      icon="create"
      iconPos="left"
      disabled />
  </div>
</MainContent>
