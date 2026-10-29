<!--@component
# Admin Home Page

Main landing page for admin section showing available tools
-->

<script lang="ts">
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';

  const { t, getRoute } = getAppContext();
</script>

<MainContent title={t('adminApp.common.home')}>
  <p class="text-center">{t('adminApp.common.description')}</p>

  <!-- Could also be dynamic based on the available features -->
  <div class="gap-sm flex flex-col">
    <Button href={getRoute.current('AdminAppJobs')} text="Jobs Monitoring" icon="list" iconPos="left" />

    <Button
      href={getRoute.current('AdminAppArgumentCondensation')}
      text={t('adminApp.argumentCondensation.title')}
      icon="create"
      iconPos="left" />

    <Button
      href={getRoute.current('AdminAppFactorAnalysis')}
      text={t('adminApp.factorAnalysis.title')}
      icon="create"
      iconPos="left"
      disabled />

    <Button
      href={getRoute.current('AdminAppQuestionInfo')}
      text={t('adminApp.questionInfo.title')}
      icon="create"
      iconPos="left" />
  </div>
</MainContent>
