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

  const { appSettings, getRoute, t } = getAppContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Edit layout
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: undefined } });
  // topBarSettings.push({
  //   imageSrc: $darkMode
  //     ? ($appCustomization.poster?.urlDark ?? $appCustomization.poster?.url ?? '/images/hero-dark.jpg')
  //     : ($appCustomization.poster?.url ?? '/images/hero.jpg')
  // });
</script>

<MainContent
  title={$t('dynamic.appName')}
  class="!sm:px-lg !px-0 !pb-0"
  contentClass="!max-w-xl p-lg sm:p-xl rounded-t-lg bg-base-300 grow">
  <HeadingGroup slot="heading" class="mt-[20dvh] text-2xl text-base-100">
    <h1>
      {$t('dynamic.appName')}
    </h1>
  </HeadingGroup>

  <Button variant="main" href={$getRoute('Intro')} text={$t('dynamic.frontPage.startButton')} />

  <p class="mt-lg text-center">
    {$t('dynamic.frontPage.ingress', {
      electionDate: new Date()
    })}
  </p>

  <a href={$getRoute('Info')} class="btn btn-ghost w-full max-w-md">{$t('info.title')}</a>
  <a href={$getRoute('About')} class="btn btn-ghost w-full max-w-md">{$t('about.title')}</a>

  {#if $appSettings.survey?.showIn?.includes('frontpage')}
    <SurveyBanner class="mt-lg" />
  {/if}

  <Footer />
</MainContent>

<style lang="postcss">
  :global(body) {
    @apply bg-[url('/images/hero.jpg')] bg-cover bg-fixed bg-center dark:bg-[url('/images/hero-dark.jpg')];
  }

  :global(.vaa-frontpage-logos > svg, .vaa-frontpage-logos > img) {
    @apply inline-block max-h-[2rem] max-w-[8rem];
  }
</style>
