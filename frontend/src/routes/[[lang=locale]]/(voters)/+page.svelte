<!--@component

# Voter app frontpage

The frontpage of the app for voters.

### Settings

- `survey.showIn`: Affects whether the survey banner is shown.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeadingGroup } from '$lib/components/headingGroup';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import { SurveyBanner } from '$lib/dynamic-components/survey/banner';
  import MainContent from '../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, darkMode, getRoute, locale, t } = getAppContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Edit layout
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: undefined } });
  // topBarSettings.push({
  //   imageSrc: $darkMode
  //     ? ($appCustomization.poster?.urlDark ?? '/images/hero.png')
  //     : ($appCustomization.poster?.url ?? '/images/hero.png')
  // });
</script>

<MainContent
  title={$t('dynamic.appName')}
  class="!sm:px-lg !px-0 !pb-0"
  contentClass="!max-w-xl p-lg sm:p-xl rounded-t-lg bg-base-300 grow">
  <HeadingGroup slot="heading" class="mt-[10vh] w-full p-lg">
    <h1>
      <img
        src="/images/nuorten-vaalikone-logo-{$locale ?? 'fi'}-{$darkMode ? 'white' : 'black'}.svg"
        alt={$t('dynamic.appName')}
        class="m-auto w-[26rem]" />
      <div class="sr-only">{$t('dynamic.appName')}</div>
      <div class="mt-lg">{$t('gameMode.title')}</div>
    </h1>
  </HeadingGroup>

  <Button variant="main" href={$getRoute('GameModeIntro')} text={$t('dynamic.frontPage.startButton')} />

  <!-- <p class="mt-lg text-center">
    {$t('dynamic.frontPage.ingress', {
      electionDate: new Date()
    })}
  </p> -->

  <a href="https://nuortenvaalikone.openvaa.org" class="btn btn-ghost mt-lg w-full max-w-md"
    >{$t('gameMode.exitGameMode')}</a>

  {#if $appSettings.survey?.showIn?.includes('frontpage')}
    <SurveyBanner class="mt-lg" />
  {/if}

  <Footer />
</MainContent>

<style lang="postcss">
  :global(body) {
    @apply bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-sm.jpg')] bg-cover bg-fixed bg-center sm:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-md.jpg')] lg:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-lg.jpg')] dark:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-sm-dark.jpg')] dark:sm:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-md-dark.jpg')] dark:lg:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-lg-dark.jpg')];
  }

  :global(.vaa-frontpage-logos > svg, .vaa-frontpage-logos > img) {
    @apply inline-block max-h-[2rem] max-w-[8rem];
  }
</style>
