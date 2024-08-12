<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, ROUTE} from '$lib/utils/navigation';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {DataConsent} from '$lib/components/dataConsent';
  import {assertTranslationKey} from '$lib/i18n/utils/assertTranslationKey';
  import Layout from '../../Layout.svelte';
  import {onDestroy} from 'svelte';
  import {getLayoutContext} from '$lib/contexts/layout';

  const {topBarSettings} = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('common.returnHome')
    }
  });
</script>

<svelte:head>
  <title>{$t('privacy.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<Layout title={$t('privacy.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.privacy.heroEmoji')} />
  </figure>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1>{$t('privacy.title')}</h1>
  </HeadingGroup>

  <div class="grid">
    <div>
      {@html sanitizeHtml($t('dynamic.privacy.content'))}
    </div>
    {#if $settings.analytics?.platform}
      <h2>{$t('privacy.analytics.title')}</h2>
      <div>
        {@html sanitizeHtml(
          $t(assertTranslationKey(`privacy.analyticsContent.${$settings.analytics.platform.name}`))
        )}
      </div>
    {/if}
    <h2>{$t('privacy.cookies.title')}</h2>
    <div>
      {@html sanitizeHtml($t('privacy.cookies.content'))}
    </div>
    {#if $settings.analytics.trackEvents}
      <h2>{$t('common.privacy.dataCollection.title')}</h2>
      <DataConsent description="inline" class="rounded-lg bg-base-300 p-lg" />
    {/if}
  </div>

  <Button
    slot="primaryActions"
    variant="main"
    href={$getRoute(ROUTE.Home)}
    text={$t('common.returnHome')} />
</Layout>

<style lang="postcss">
  h2 {
    @apply mb-md mt-lg;
  }
</style>
