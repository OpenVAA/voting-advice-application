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
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, locale: currentLocale, getRoute, locales, t } = getAppContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Edit layout
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-primary' }, header: { background: 'bg-primary' } });
  // topBarSettings.push({
  //   imageSrc: $darkMode
  //     ? ($appCustomization.poster?.urlDark ?? $appCustomization.poster?.url ?? '/images/hero.png')
  //     : ($appCustomization.poster?.url ?? '/images/hero.png')
  // });
</script>

<MainContent
  title={$t('dynamic.appName')}
  hideTitle
  class="!sm:px-lg !px-0 !pb-0"
  contentClass="!max-w-xl p-lg pb-0 sm:p-xl rounded-t-lg bg-base-300 grow z-10">
  <img
    slot="hero2"
    src="https://projects-471112560111-eu-north-1-an.s3.eu-north-1.amazonaws.com/kisam-2026/valkompass_2026_girl.png"
    alt="Valkompass 2026 Girl"
    class="m-auto max-h-full translate-y-[0.5rem]" />

  <HeadingGroup class="w-full">
    <h1 class="text-center text-3xl font-bold">
      {$t('dynamic.appName')}
    </h1>
    <!-- <h1>
      <img
        src="/images/nuorten-vaalikone-logo-{$locale ?? 'fi'}-{$darkMode ? 'white' : 'black'}.svg"
        alt={$t('dynamic.appName')}
        class="w-[26rem] m-auto" />
      <div class="sr-only">{$t('dynamic.appName')}</div>
    </h1> -->
  </HeadingGroup>

  <div class="mt-lg text-center">
    {@html sanitizeHtml(
      $t('dynamic.frontPage.ingress', {
        electionDate: new Date()
      })
    )}
  </div>

  <div class="mt-lg grid w-full gap-md">
    <!-- <p class="text-center">{$t('dynamic.frontPage.startButtonIntro')}</p> -->
    <Button variant="main" href={$getRoute('Intro')} text={$t('dynamic.frontPage.startButton')} />
    <div class="mt-md text-center text-sm">
      {@html sanitizeHtml($t('dynamic.frontPage.selectLanguage'))}
      <div class="grid w-full grid-cols-3 gap-md">
        {#each $locales.filter((l) => l !== $currentLocale) as locale}
          <Button
            data-sveltekit-reload
            href={$getRoute({ locale })}
            text={$t(assertTranslationKey(`lang.${locale}`))} />
        {/each}
      </div>
    </div>

    <!-- <Button href={$getRoute('Questions')} text={$t('dynamic.frontPage.startButtonSkip')} /> -->
    <!-- <a href={$getRoute('Info')} class="btn btn-ghost w-full max-w-md">{$t('info.title')}</a>
    <a href={$getRoute('About')} class="btn btn-ghost w-full max-w-md">{$t('about.title')}</a> -->
  </div>
  {#if $appSettings.survey?.showIn?.includes('frontpage')}
    <SurveyBanner class="mt-lg" />
  {/if}

  <Footer class="mt-auto" />
</MainContent>

<style lang="postcss">
  :global(body) {
    @apply bg-[url('https://projects-471112560111-eu-north-1-an.s3.eu-north-1.amazonaws.com/kisam-2026/frontpage-bg-sm.jpg')] bg-cover bg-fixed bg-center sm:bg-[url('https://projects-471112560111-eu-north-1-an.s3.eu-north-1.amazonaws.com/kisam-2026/frontpage-bg-md.jpg')] lg:bg-[url('https://projects-471112560111-eu-north-1-an.s3.eu-north-1.amazonaws.com/kisam-2026/frontpage-bg-lg.jpg')] dark:bg-[url('https://projects-471112560111-eu-north-1-an.s3.eu-north-1.amazonaws.com/kisam-2026/frontpage-bg-sm-dark.jpg')] dark:sm:bg-[url('https://projects-471112560111-eu-north-1-an.s3.eu-north-1.amazonaws.com/kisam-2026/frontpage-bg-md-dark.jpg')] dark:lg:bg-[url('https://projects-471112560111-eu-north-1-an.s3.eu-north-1.amazonaws.com/kisam-2026/frontpage-bg-lg-dark.jpg')];
  }

  :global(.vaa-frontpage-logos > svg, .vaa-frontpage-logos > img) {
    @apply inline-block max-h-[2rem] max-w-[8rem];
  }
</style>
