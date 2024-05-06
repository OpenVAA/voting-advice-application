<script lang="ts">
  import {locale, t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {election, openFeedbackModal, settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {BasicPage} from '$lib/templates/basicPage';
  import introVideos from '../intro/introVideos.json';

  // Use the transcripts from the intro videos for text content here
  let videoProps: CustomVideoProps[];

  $: videoProps = introVideos
    .slice(1)
    .map((d) => d[$locale as keyof (typeof introVideos)[0]]?.video);
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

  <div class="text-content">
    {#each videoProps as { title, transcript }}
      <h2 class="mb-md mt-lg">{title}</h2>
      <div>
        {@html sanitizeHtml(transcript)}
      </div>
    {/each}
  </div>

  <svelte:fragment slot="primaryActions">
    <Button variant="main" href={$getRoute(Route.Home)} text={$t('info.returnButton')} />
  </svelte:fragment>
</BasicPage>

<style lang="postcss">
  :global(.text-content img) {
    @apply mx-auto my-lg max-h-[100vw] rounded-sm;
  }
  :global(.text-content figure) {
    @apply mb-lg text-center text-sm;
  }
  :global(.text-content figure img) {
    @apply mb-sm;
  }
  :global(.text-content figure figcaption) {
    @apply mb-lg text-center text-sm;
  }
</style>
