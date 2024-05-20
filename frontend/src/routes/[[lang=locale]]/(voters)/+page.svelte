<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {election, resetVoterAnswers, settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {SurveyBanner} from '$lib/components/survey/banner';
  import {FrontPage} from '$lib/templates/frontPage';
</script>

<FrontPage title={$election?.name ?? ''}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1 class="text-3xl font-normal">{$election?.name ?? ''}</h1>
  </HeadingGroup>

  <img slot="hero" class="bg-white" src={$settings.poster?.url ?? '/images/hero.png'} alt="" />

  <Button
    variant="main"
    href={$getRoute(Route.Intro)}
    on:click={resetVoterAnswers}
    text={$t('actionLabels.startButton')} />

  <p class="mt-lg text-center">
    {$t('viewTexts.frontpageIngress', {
      electionDate: new Date($election?.electionDate ?? '')
    })}
  </p>

  <a href={$getRoute(Route.Info)} class="btn btn-ghost w-full max-w-md"
    >{$t('actionLabels.electionInfo')}</a>
  <a href={$getRoute(Route.About)} class="btn btn-ghost w-full max-w-md"
    >{$t('actionLabels.howItWorks')}</a>

  {#if $settings.analytics.survey?.showIn?.includes('frontpage')}
    <SurveyBanner class="mt-lg" />
  {/if}
</FrontPage>
