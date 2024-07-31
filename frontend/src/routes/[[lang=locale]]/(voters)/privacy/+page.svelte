<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {openFeedbackModal, settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {BasicPage} from '$lib/templates/basicPage';
  import {DataConsent} from '$lib/components/dataConsent';
  import {assertTranslationKey} from '$lib/i18n/utils/assertTranslationKey';
</script>

<BasicPage title={$t('privacy.title')}>
  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('dynamic.privacy.heroEmoji')} />
  </svelte:fragment>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1>{$t('privacy.title')}</h1>
  </HeadingGroup>

  <svelte:fragment slot="banner">
    {#if $settings.header.showFeedback && $openFeedbackModal}
      <Button
        on:click={$openFeedbackModal}
        variant="icon"
        icon="feedback"
        text={$t('feedback.send')} />
    {/if}
    <Button
      class="!text-neutral"
      variant="icon"
      icon="close"
      href={$getRoute(Route.Home)}
      text={$t('common.returnHome')} />
  </svelte:fragment>

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

  <svelte:fragment slot="primaryActions">
    <Button variant="main" href={$getRoute(Route.Home)} text={$t('common.returnHome')} />
  </svelte:fragment>
</BasicPage>

<style lang="postcss">
  h2 {
    @apply mb-md mt-lg;
  }
</style>
