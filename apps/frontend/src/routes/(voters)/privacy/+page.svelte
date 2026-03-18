<!--@component

# Privacy page

Displays information about the privacy policy of the app as well as the possible data collection consent of the voter.

### Settings

- `analytics.platform`: Affects the information displayed.
- `analytics.trackEvents`: Affects the information displayed and whether the `DataConsent` component is shown.
-->

<script lang="ts">
  import { staticSettings } from '@openvaa/app-shared';
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

  // Construct the analytics link for privacy translations
  const analyticsLink = staticSettings.analytics?.platform?.infoUrl
    ? `<a href="${staticSettings.analytics.platform.infoUrl}" target="_blank">${
        staticSettings.analytics.platform.name.charAt(0).toUpperCase() + staticSettings.analytics.platform.name.slice(1)
      }</a>`
    : '';

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: t('common.returnHome')
    }
  });
</script>

<MainContent title={t('privacy.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={t('dynamic.privacy.heroEmoji')} />
  </figure>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{t('dynamic.appName')}</PreHeading>
    <h1>{t('privacy.title')}</h1>
  </HeadingGroup>

  <div class="grid" data-testid="voter-privacy-content">
    <div>
      {@html sanitizeHtml(t('dynamic.privacy.content'))}
    </div>
    {#if $appSettings.analytics?.platform}
      <h2>{t('privacy.analytics.title')}</h2>
      <div>
        {@html sanitizeHtml(
          t(assertTranslationKey(`privacy.analytics.content.${$appSettings.analytics.platform.name}`), {
            analyticsLink
          })
        )}
      </div>
    {/if}
    <h2>{t('privacy.cookies.title')}</h2>
    <div>
      {@html sanitizeHtml(t('privacy.cookies.content'))}
    </div>
    {#if $appSettings.analytics.trackEvents}
      <h2>{t('common.privacy.dataCollection.title')}</h2>
      <DataConsent description="inline" class="bg-base-300 p-lg rounded-lg" />
    {/if}
  </div>

  <Button
    slot="primaryActions"
    variant="main"
    href={$getRoute('Home')}
    text={t('common.returnHome')}
    data-testid="voter-privacy-return" />
</MainContent>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  h2 {
    @apply mb-md mt-lg;
  }
</style>
