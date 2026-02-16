<!--@component

# Voter app frontpage

The frontpage of the app for voters.

### Settings

- `survey.showIn`: Affects whether the survey banner is shown.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import { SurveyBanner } from '$lib/dynamic-components/survey/banner';
  import MainContent from '../MainContent.svelte';
  import { AppLogo } from '$lib/dynamic-components/appLogo';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, appSettings, darkMode, getRoute, t } = getAppContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Edit layout
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  // topBarSettings.push({
  //   imageSrc: $darkMode
  //     ? ($appCustomization.poster?.urlDark ?? $appCustomization.poster?.url ?? '/images/hero.png')
  //     : ($appCustomization.poster?.url ?? '/images/hero.png')
  // });
</script>

<MainContent title={$t('dynamic.appName')}>
  <div slot="heading" class="grid place-items-center">
    <AppLogo class="h-[20rem] max-h-[min(20rem,40dvh)]" />
  </div>

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
