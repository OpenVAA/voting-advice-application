<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {election, settings, customization} from '$lib/stores';
  import {darkMode} from '$lib/utils/darkMode';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {SurveyBanner} from '$lib/components/survey/banner';
  import {FrontPage} from '$lib/templates/frontPage';
</script>

<FrontPage
  title={$election?.name ?? ''}
  invertLogo
  style="background-image: url('{$darkMode
    ? ($customization.posterDark?.url ?? '/images/hero.png')
    : ($customization.poster?.url ?? '/images/hero.png')}');"
  class="bg-cover bg-center"
  mainClass="bg-base-300 grow-0 mt-0 mx-auto rounded-t-lg max-w-xl">
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1 class="text-3xl font-normal">{$election?.name ?? ''}</h1>
  </HeadingGroup>

  <!-- <img
    slot="hero"
    class="bg-neutral-content"
    src={$darkMode
      ? ($customization.posterDark?.url ?? '/images/hero.png')
      : ($customization.poster?.url ?? '/images/hero.png')}
    alt="" /> -->

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
