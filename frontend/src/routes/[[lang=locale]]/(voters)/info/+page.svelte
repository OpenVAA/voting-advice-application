<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {election, openFeedbackModal, settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {BasicPage} from '$lib/templates/basicPage';
</script>

<BasicPage title={$t('info.title')}>
  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('dynamic.info.heroEmoji')} />
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
        text={$t('feedback.send')} />
    {/if}
    <Button
      slot="banner"
      class="!text-neutral"
      variant="icon"
      icon="close"
      href={$getRoute(Route.Home)}
      text={$t('common.returnHome')} />
  </svelte:fragment>

  <div>
    {@html sanitizeHtml(
      $t('dynamic.info.content', {
        electionDate: new Date($election?.electionDate ?? '')
      })
    )}
  </div>

  <svelte:fragment slot="primaryActions">
    <Button variant="main" href={$getRoute(Route.Home)} text={$t('common.returnHome')} />
  </svelte:fragment>
</BasicPage>
