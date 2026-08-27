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
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, appSettings, darkMode, getRoute, locale, t } = getAppContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Edit layout
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($appCustomization.poster?.urlDark ?? $appCustomization.poster?.url ?? '/images/hero.png')
      : ($appCustomization.poster?.url ?? '/images/hero.png')
  });
</script>

<MainContent title={$t('dynamic.appName')}>
  <Button variant="main" href={$getRoute('Intro')} text={$t('dynamic.frontPage.startButton')} />

  <p class="mt-lg text-center">
    {@html sanitizeHtml(
      $t('dynamic.frontPage.ingress', {
        electionDate: new Date()
      })
    )}
  </p>

  <a href={$getRoute('Info')} class="btn btn-ghost w-full max-w-md">{$t('info.title')}</a>
  <a href={$getRoute('Voting')} class="btn btn-ghost w-full max-w-md">{$t('dynamic.howToVote.shortTitle')}</a>
  <a href={$getRoute('About')} class="btn btn-ghost w-full max-w-md">{$t('about.title')}</a>

  {#if $appSettings.survey?.showIn?.includes('frontpage')}
    <SurveyBanner class="mt-lg" />
  {/if}

  <div class="mt-md flex flex-col items-center justify-center justify-items-center gap-sm md:flex-row">
    <img
      src="images/co-funded-by-the-eu-{$locale || 'en'}.png"
      alt="Co-funded by the European Union"
      class="max-w-[10rem]" />
    <img src="images/youthvotes-logo-black.png" alt="YouthVotes" class="max-w-[5rem]" />
  </div>
  <Footer />
</MainContent>
