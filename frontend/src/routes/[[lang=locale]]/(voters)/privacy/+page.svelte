<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {openFeedbackModal, settings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {BasicPage} from '$lib/templates/basicPage';
  import {DataConsent} from '$lib/components/dataConsent';
</script>

<BasicPage title={$t('privacy.title')}>
  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('privacy.heroEmoji')} />
  </svelte:fragment>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1>{$t('privacy.title')}</h1>
  </HeadingGroup>

  <svelte:fragment slot="banner">
    {#if $settings.header.showFeedback && $openFeedbackModal}
      <Button
        on:click={$openFeedbackModal}
        variant="icon"
        icon="feedback"
        text={$t('navigation.sendFeedback')} />
    {/if}
    <Button
      class="!text-neutral"
      variant="icon"
      icon="close"
      href={$getRoute(Route.Home)}
      text={$t('privacy.returnButton')} />
  </svelte:fragment>

  <div class="grid">
    <div>
      {@html sanitizeHtml($t('privacy.content'))}
    </div>

    <h2>{$t('privacy.cookiesTitle')}</h2>

    <div>
      {@html sanitizeHtml($t('privacy.cookiesContent'))}
    </div>

    {#if $settings.research.collectUsageData}
      <h2>{$t('privacy.dataTitle')}</h2>

      <div>
        {@html sanitizeHtml($t('privacy.dataContent'))}
      </div>

      <p class="mt-md">{$t('privacy.dataConsentIntro')}</p>

      <DataConsent infoModal={false} />
    {/if}
  </div>

  <svelte:fragment slot="primaryActions">
    <Button variant="main" href={$getRoute(Route.Home)} text={$t('privacy.returnButton')} />
  </svelte:fragment>
</BasicPage>

<style lang="postcss">
  h2 {
    @apply mb-md mt-lg;
  }
</style>
