<script lang="ts">
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { t } from '$lib/i18n';
  import { election, openFeedbackModal, settings } from '$lib/stores';
  import { BasicPage } from '$lib/templates/basicPage';
  import { getRoute, Route } from '$lib/utils/navigation';
  import { sanitizeHtml } from '$lib/utils/sanitize';
</script>

<BasicPage title={$t('info.title')}>
  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('info.heroEmoji')} />
  </svelte:fragment>

  <HeadingGroup slot="heading">
    <PreHeading class="text-primary">{$election?.name ?? ''}</PreHeading>
    <h1>{$t('info.title')}</h1>
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
      slot="banner"
      class="!text-neutral"
      variant="icon"
      icon="close"
      href={$getRoute(Route.Home)}
      text={$t('info.returnButton')} />
  </svelte:fragment>

  <div>
    {@html sanitizeHtml(
      $t('info.content', {
        electionDate: new Date($election?.electionDate ?? '')
      })
    )}
  </div>

  <svelte:fragment slot="primaryActions">
    <Button variant="main" href={$getRoute(Route.Home)} text={$t('info.returnButton')} />
  </svelte:fragment>
</BasicPage>
