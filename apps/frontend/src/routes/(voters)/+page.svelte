<!--@component

# Voter app frontpage

The frontpage of the app for voters.

### Settings

- `survey.showIn`: Affects whether the survey banner is shown.
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import { SurveyBanner } from '$lib/dynamic-components/survey/banner';
  import MainContent from '../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const ctx = getAppContext();
  const { appCustomization, darkMode, getRoute, t } = ctx;
  // appSettings is a reactive accessor (Phase 113 flatten) — read via ctx.X, never destructure.
  const appSettings = $derived(ctx.appSettings);
  const { pageStyles, topBarSettings } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Edit layout
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
  topBarSettings.use({
    imageSrc: darkMode.current
      ? (appCustomization.current.poster?.urlDark ?? appCustomization.current.poster?.url ?? '/images/hero.png')
      : (appCustomization.current.poster?.url ?? '/images/hero.png')
  });
</script>

<MainContent title={t('dynamic.appName')} data-testid="voter-home">
  <Button
    variant="main"
    href={getRoute.current('Intro')}
    text={t('dynamic.frontPage.startButton')}
    data-testid="voter-home-start" />

  <p class="mt-lg text-center">
    {t('dynamic.frontPage.ingress', {
      electionDate: new Date()
    })}
  </p>

  <a href={getRoute.current('Info')} class="btn btn-ghost w-full max-w-md" data-testid="voter-home-info-link"
    >{t('info.title')}</a>
  <a href={getRoute.current('About')} class="btn btn-ghost w-full max-w-md" data-testid="voter-home-about-link"
    >{t('about.title')}</a>

  {#if appSettings.survey?.showIn?.includes('frontpage')}
    <SurveyBanner class="mt-lg" />
  {/if}

  <Footer />
</MainContent>
