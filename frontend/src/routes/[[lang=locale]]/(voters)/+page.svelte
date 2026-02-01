<!--@component

# Voter app frontpage

The frontpage of the app for voters.

### Settings

- `survey.showIn`: Affects whether the survey banner is shown.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import { SurveyBanner } from '$lib/dynamic-components/survey/banner';
  import MainContent from '../MainContent.svelte';
  import { getVoterContext } from '$lib/contexts/voter';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, appSettings, constituenciesSelectable, darkMode, electionsSelectable, getRoute, t } =
    getVoterContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Edit layout
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($appCustomization.poster?.urlDark ?? '/images/hero.png')
      : ($appCustomization.poster?.url ?? '/images/hero.png')
  });
</script>

<MainContent title={$t('dynamic.appName')}>
  <Button variant="main" href={$getRoute('Questions')} text={$t('dynamic.frontPage.startButton')} />

  <!-- <p class="mt-lg text-center">
    {$t('dynamic.frontPage.ingress', {
      electionDate: new Date()
    })}
  </p> -->

  <ol class="list-circled mt-lg w-fit">
    <!-- Elections are selected either before or after constituencies depending on `startFromConstituencyGroup` -->
    {#if $electionsSelectable && !$appSettings.elections?.startFromConstituencyGroup}
      <li>{$t('dynamic.intro.list.elections')}</li>
    {/if}
    {#if $constituenciesSelectable}
      <li>{$t('dynamic.intro.list.constituencies')}</li>
    {/if}
    {#if $electionsSelectable && $appSettings.elections?.startFromConstituencyGroup}
      <li>{$t('dynamic.intro.list.elections')}</li>
    {/if}
    <li>{$t('dynamic.intro.list.opinions')}</li>
    {#if $appSettings.matching.questionWeights && $appSettings.matching.questionWeights !== 'none'}
      <li>{$t('dynamic.intro.list.questionWeights')}</li>
    {/if}
    <li>{$t('dynamic.intro.list.results')}</li>
    <li>{$t('dynamic.intro.list.details')}</li>
  </ol>

  <!-- <a href={$getRoute('Info')} class="btn btn-ghost w-full max-w-md">{$t('info.title')}</a> -->
  <a href={$getRoute('About')} class="btn btn-ghost w-full max-w-md">{$t('about.title')}</a>

  {#if $appSettings.survey?.showIn?.includes('frontpage')}
    <SurveyBanner class="mt-lg" />
  {/if}

  <Footer />
</MainContent>
