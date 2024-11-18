<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { settings } from '$lib/stores';
  import { getRoute, ROUTE } from '$lib/utils/navigation';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import Layout from '../../../Layout.svelte';

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('common.returnHome')
    }
  });
</script>

<svelte:head>
  <title>{$t('about.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<Layout title={$t('about.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.about.heroEmoji')} />
  </figure>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1>{$t('about.title')}</h1>
  </HeadingGroup>

  {@html sanitizeHtml($t('about.content'))}

  {#if $settings.matching.partyMatching !== 'none'}
    <h2 class="mb-md mt-xl">{$t('about.partyMatching.title')}</h2>
    {@html sanitizeHtml($t('about.partyMatching.content', { partyMatchingMethod: $settings.matching.partyMatching }))}
  {/if}

  {#if $settings.appVersion.source}
    <h2 class="mb-md mt-lg">{$t('about.source.title')}</h2>
    <p>
      {$t('about.source.content')}
      <a
        href={$settings.appVersion.source}
        target="_blank"
        class="small-label me-md inline-block rounded-[1rem] bg-base-300 px-md py-sm">{$t('about.source.sitename')}</a>
    </p>
  {/if}

  <Button slot="primaryActions" variant="main" href={$getRoute(ROUTE.Home)} text={$t('common.returnHome')} />
</Layout>
