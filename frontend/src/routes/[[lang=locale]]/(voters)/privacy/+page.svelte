<!--@component

# Privacy page

Displays information about the privacy policy of the app as well as the possible data collection consent of the voter.

### Settings

- `analytics.platform`: Affects the information displayed.
- `analytics.trackEvents`: Affects the information displayed and whether the `DataConsent` component is shown.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { DataConsent } from '$lib/dynamic-components/dataConsent';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../MainContent.svelte';

  const { appSettings, getRoute, t } = getAppContext();

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('common.returnHome')
    }
  });
</script>

<MainContent title={$t('privacy.title')}>
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
    {#if $appSettings.analytics?.platform}
      <h2>{$t('privacy.analytics.title')}</h2>
      <div>
        {@html sanitizeHtml(
          $t(assertTranslationKey(`privacy.analytics.content.${$appSettings.analytics.platform.name}`))
        )}
      </div>
    {/if}
    <h2>{$t('privacy.cookies.title')}</h2>
    <div>
      {@html sanitizeHtml($t('privacy.cookies.content'))}
    </div>
    {#if $appSettings.analytics.trackEvents}
      <h2>{$t('common.privacy.dataCollection.title')}</h2>
      <DataConsent description="inline" class="rounded-lg bg-base-300 p-lg" />
    {/if}
  </div>

  <Button slot="primaryActions" variant="main" href={$getRoute('Home')} text={$t('common.returnHome')} />
</MainContent>

<style lang="postcss">
  h2 {
    @apply mb-md mt-lg;
  }
</style>
