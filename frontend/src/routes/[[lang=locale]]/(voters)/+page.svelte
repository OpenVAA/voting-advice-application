<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { SurveyBanner } from '$lib/components/survey/banner';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { customization, election, settings } from '$lib/legacy-stores';
  import Footer from '$lib/templates/parts/footer/Footer.svelte';
  import { darkMode } from '$lib/utils/legacy-darkMode';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../Layout.svelte';

  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($customization.posterDark?.url ?? '/images/hero.png')
      : ($customization.poster?.url ?? '/images/hero.png')
  });
</script>

<svelte:head>
  <title>{$election?.name ?? ''} – {$t('dynamic.appName')}</title>
</svelte:head>

<Layout title={$election?.name ?? ''}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1 class="text-3xl font-normal">{$election?.name ?? ''}</h1>
  </HeadingGroup>

  <Button variant="main" href={$getRoute(ROUTE.Intro)} text={$t('dynamic.frontPage.startButton')} />

  <p class="mt-lg text-center">
    {$t('dynamic.frontPage.ingress', {
      electionDate: new Date($election?.electionDate ?? '')
    })}
  </p>

  <a href={$getRoute(ROUTE.Info)} class="btn btn-ghost w-full max-w-md">{$t('info.title')}</a>
  <a href={$getRoute(ROUTE.About)} class="btn btn-ghost w-full max-w-md">{$t('about.title')}</a>

  {#if $settings.survey?.showIn?.includes('frontpage')}
    <SurveyBanner class="mt-lg" />
  {/if}

  <Footer />
</Layout>
