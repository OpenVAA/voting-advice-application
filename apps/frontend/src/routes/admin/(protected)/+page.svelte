<!--@component
# Admin Home Page

Main landing page for admin section showing available tools
-->

<script lang="ts">
  import { fromStore } from 'svelte/store';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import MainContent from '../../MainContent.svelte';

  const { t, getRoute } = getAppContext();
  const getRouteState = fromStore(getRoute);
</script>

<MainContent title={t('adminApp.common.home')}>
  <p class="text-center">{t('adminApp.common.description')}</p>

  <!-- Could also be dynamic based on the available features -->
  <div class="gap-sm flex flex-col">
    <Button href={getRouteState.current('AdminAppJobs')} text="Jobs Monitoring" icon="list" iconPos="left" />

    <Button
      href={getRouteState.current('AdminAppArgumentCondensation')}
      text={t('adminApp.argumentCondensation.title')}
      icon="create"
      iconPos="left" />

    <Button
      href={getRouteState.current('AdminAppFactorAnalysis')}
      text={t('adminApp.factorAnalysis.title')}
      icon="create"
      iconPos="left"
      disabled />

    <Button
      href={getRouteState.current('AdminAppQuestionInfo')}
      text={t('adminApp.questionInfo.title')}
      icon="create"
      iconPos="left" />
  </div>
</MainContent>
