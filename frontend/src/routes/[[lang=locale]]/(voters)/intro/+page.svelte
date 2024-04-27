<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {goto} from '$app/navigation';
  import {locale, t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {openFeedbackModal, settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {Video, type VideoMode} from '$lib/components/video';
  import {BasicPage} from '$lib/templates/basicPage';
  import introVideos from './introVideos.json';

  // Variables related to video content
  let currentIndex = 0;
  let mode: VideoMode;
  let reload: (props: CustomVideoProps) => void;
  let toggleTranscript: (show?: boolean) => void;
  let videoProps: CustomVideoProps | undefined;
  let backButtonText = '';
  let nextButtonText = '';

  // Load the first video
  loadVideo();

  // Update page on locale change
  locale.subscribe(loadVideo);

  function jump(steps: number) {
    currentIndex += steps;
    if (currentIndex < 0) return goto($getRoute(Route.Home));
    if (currentIndex >= introVideos.length) return goto($getRoute(Route.Questions));
    loadVideo();
  }

  function loadVideo() {
    const introVideoProps = introVideos[currentIndex]?.[$locale as keyof LocalizedIntroVideoProps];
    if (introVideoProps == null) error(500, 'No video content for this intro index');
    const currentProps = videoProps;
    videoProps = introVideoProps.video;
    if (currentProps === videoProps) return;
    // Get button texts
    if (currentIndex > 0) {
      backButtonText =
        introVideos[currentIndex - 1]?.[$locale as keyof LocalizedIntroVideoProps].video.title;
    } else {
      backButtonText = $t('header.back');
    }
    if (currentIndex < introVideos.length - 1) {
      nextButtonText =
        introVideos[currentIndex + 1]?.[$locale as keyof LocalizedIntroVideoProps].video.title;
    } else {
      nextButtonText = $t('intro.continue');
    }
    // Reload the video, if we're updating the existing video component
    if (currentIndex > 0) reload(videoProps);
  }

  let loadingNext = false;

  /** The ended event is sometimes fired multiple times, so we'll use this quick and dirty trick to disregard such multiple firings */
  function onEnded() {
    if (loadingNext) return;
    loadingNext = true;
    jump(1);
    setTimeout(() => (loadingNext = false), 1000);
  }

  interface LocalizedIntroVideoProps {
    fi: IntroVideoProps;
    sv: IntroVideoProps;
    en: IntroVideoProps;
  }
  interface IntroVideoProps {
    video: CustomVideoProps;
  }
</script>

<BasicPage
  title={$t('intro.title')}
  class={videoProps ? 'bg-base-300' : undefined}
  titleClass={videoProps ? '!pb-0' : undefined}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-primary"
      >{$t('intro.preheading')}
      {Math.min(introVideos.length, Math.max(0, currentIndex + 1))}/{introVideos?.length ??
        ''}</PreHeading>
    <h1>{videoProps?.title ?? ''}</h1>
  </HeadingGroup>

  <svelte:fragment slot="video">
    {#if videoProps}
      <Video
        on:ended={onEnded}
        bind:mode
        bind:reload
        bind:toggleTranscript
        hideControls={['transcript']}
        {...videoProps} />
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="banner">
    {#if $settings.header.showFeedback && $openFeedbackModal}
      <Button
        on:click={$openFeedbackModal}
        variant="icon"
        icon="feedback"
        text={$t('navigation.sendFeedback')} />
    {/if}
    {#if $settings.header.showHelp}
      <Button
        href={$getRoute(Route.Help)}
        variant="icon"
        icon="help"
        text={$t('actionLabels.help')} />
    {/if}
    <Button
      on:click={() => toggleTranscript()}
      variant="responsive-icon"
      icon={mode === 'video' ? 'videoOn' : 'videoOff'}
      text={mode === 'video'
        ? $t('components.video.showTranscript')
        : $t('components.video.showVideo')} />
  </svelte:fragment>

  <svelte:fragment slot="primaryActions">
    <Button href={$getRoute(Route.Questions)} variant="main" text={$t('intro.continue')} />
    <!-- <Button on:click={nextVideo} text={buttonText} /> -->
    <div class="mt-lg grid w-full grid-cols-2 items-stretch gap-md">
      <Button
        icon="previous"
        iconPos="left"
        color="secondary"
        variant="secondary"
        on:click={() => jump(-1)}
        text={backButtonText} />
      <Button
        icon="next"
        iconPos="right"
        color="secondary"
        variant="secondary"
        on:click={() => jump(+1)}
        text={nextButtonText} />
    </div>
  </svelte:fragment>
</BasicPage>
