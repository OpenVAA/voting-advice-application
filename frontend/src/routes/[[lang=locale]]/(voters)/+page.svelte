<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {election, settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {SurveyBanner} from '$lib/components/survey/banner';
  import {FrontPage} from '$lib/templates/frontPage';
</script>

<FrontPage title={$election?.name ?? ''}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1 class="text-3xl font-normal">{$election?.name ?? ''}</h1>
  </HeadingGroup>

  <img slot="hero" class="bg-white" src={$settings.poster?.url ?? '/images/hero.png'} alt="" />

  <Button variant="main" href={$getRoute(Route.Intro)} text={$t('dynamic.frontPage.startButton')} />

  <p class="mt-lg text-center">
    {$t('dynamic.frontPage.ingress', {
      electionDate: new Date($election?.electionDate ?? '')
    })}
  </p>

  <a href={$getRoute(Route.Info)} class="btn btn-ghost w-full max-w-md">{$t('info.title')}</a>
  <a href={$getRoute(Route.About)} class="btn btn-ghost w-full max-w-md">{$t('about.title')}</a>

  {#if $settings.survey?.showIn?.includes('frontpage')}
    <SurveyBanner class="mt-lg" />
  {/if}
</FrontPage>
