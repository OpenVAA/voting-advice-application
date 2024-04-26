<script lang="ts">
  import {fade} from 'svelte/transition';
  import {locale, t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {Button} from '$lib/components/button';
  import {Icon} from '$lib/components/icon';
  import {videoPreferences} from './component-stores';
  import type {VideoMode, VideoProps} from './Video.type';

  ////////////////////////////////////////////////////////////////////////////////
  // CONSTANTS
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * The default skip amount
   */
  const DEFAULT_SKIP_AMOUNT = 10;
  /**
   * The time in ms to wait for a loading error to be resolved before an error message is shown
   */
  const ERROR_DELAY = 4000;
  /**
   * The duration in seconds of a pressing down that is treated as hold (i.e. keeping the video paused) instead of a click.
   */
  const HOLD_THRESHOLD = 0.7;
  /**
   * A small eps in seconds used to determine if the video's currrent time is at the end of the video and in seeking to the end.
   */
  const TIME_EPS = 0.05;

  ////////////////////////////////////////////////////////////////////////////////
  // PUBLIC PROPERTIES
  ////////////////////////////////////////////////////////////////////////////////

  type $$Props = VideoProps;

  export let title: $$Props['title'];
  export let sources: $$Props['sources'];
  export let captions: $$Props['captions'];
  export let poster: $$Props['poster'];
  export let aspectRatio: $$Props['aspectRatio'];
  export let transcript: $$Props['transcript'] = '';
  export let hideControls: $$Props['hideControls'] = undefined;
  export let autoPlay: $$Props['autoPlay'] = true;
  export let autoUnmute: $$Props['autoUnmute'] = true;
  export let showCaptions: $$Props['showCaptions'] = true;
  export let showTranscript: $$Props['showTranscript'] = false;
  export let skipByCue: $$Props['skipByCue'] = true;
  export let skipAmount: $$Props['skipAmount'] = DEFAULT_SKIP_AMOUNT;

  ////////////////////////////////////////////////////////////////////////////////
  // TEXT TRACKS
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * Whether text tracks are shown
   */
  let textTracksHidden = $videoPreferences.textTracksHidden ?? !showCaptions;

  ////////////////////////////////////////////////////////////////////////////////
  // BOUND PROPS OF <video>
  ////////////////////////////////////////////////////////////////////////////////

  let video: HTMLVideoElement | undefined;
  let currentTime = 0;
  let duration: number;
  let paused: boolean;
  let muted = true;

  /**
   * Bindable: Whether the video is at the end (with a small margin)
   */
  export let atEnd = false;
  $: atEnd = duration - currentTime <= TIME_EPS;

  /**
   * The current loading status of the video. The `error-pending` status is used when an error has occurred but we're still waiting for it to be resolved.
   */
  let status: 'waiting' | 'error' | 'error-pending' | 'normal' = 'normal';
  let errorTimeout: NodeJS.Timeout | undefined;

  ////////////////////////////////////////////////////////////////////////////////
  // TRANSCRIPT
  ////////////////////////////////////////////////////////////////////////////////

  let transcriptVisible = $videoPreferences.transcriptVisible ?? showTranscript;
  export let mode: VideoMode | undefined = undefined;
  $: mode = transcriptVisible ? 'text' : 'video';

  ////////////////////////////////////////////////////////////////////////////////
  // CONTROLS
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * The actions and icons for the combined play/pause/replay button.
   */
  type PlayButtonAction = 'play' | 'pause' | 'replay';

  /**
   * The current action of the combined play/pause/replay button.
   */
  let playButtonAction: PlayButtonAction = 'play';
  $: playButtonAction = !paused ? 'pause' : atEnd ? 'replay' : 'play';

  /**
   * The time when a hold action was started.
   */
  let holdStart: number | undefined;

  /**
   * Used to highlight the jump buttons when the corresponding invisible screen area is pressed
   */
  let jumpBackPressed = false;

  /**
   * Used to highlight the jump buttons when the corresponding invisible screen area is pressed
   */
  let jumpForwardPressed = false;

  /**
   * Toggle between transcript and video
   */
  let transcriptToggleValue = transcriptVisible ? 'text' : 'video';
  $: toggleTranscript(transcriptToggleValue === 'text');

  ////////////////////////////////////////////////////////////////////////////////
  // CONTROL FUNCTIONS
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * On the first interaction, try to unmute the video
   */
  function tryUnmute(): void {
    if (!muted || !autoUnmute || $videoPreferences.muted) return;
    muted = false;
  }

  /**
   * Enable holding down to pause the video
   */
  function hold(pointerDown: boolean) {
    holdStart = pointerDown ? Date.now() : undefined;
    setPaused(pointerDown || atEnd);
  }

  /**
   * Fired when pointer is released on the invisible skip areas. A long press will be treated only as the end of a hold and the jump will not be triggered.
   * @param steps Passed to `jump`
   */
  function heldJump(steps: number) {
    if (holdStart && Date.now() - holdStart > HOLD_THRESHOLD * 1000) return hold(false);
    if (steps < 0) {
      jumpBackPressed = true;
      setTimeout(() => (jumpBackPressed = false), 125);
    } else {
      jumpForwardPressed = true;
      setTimeout(() => (jumpForwardPressed = false), 125);
    }
    jump(steps);
  }

  /**
   * Toggle video playback or replay.
   * @param action The action to perform: `'play'`, `'pause'` or `'replay'`. @default Toggle between `'play'` and `'pause'`.
   */
  export function togglePlay(action?: PlayButtonAction) {
    if (action == null) action = playButtonAction;
    switch (action) {
      case 'replay':
        return gotoAndPlay(0);
      default:
        setPaused(action === 'pause');
    }
  }

  /**
   * Toggle sound
   * @param unmuted If defined will define whether sounds are unmuted, otherwise sound will be toggled.
   */
  export function toggleSound(unmute?: boolean) {
    unmute ??= muted;
    muted = !unmute;
    $videoPreferences.muted = muted;
  }

  /**
   * Show or hide captions.
   * @param show If defined will define whether the captions should be shown, otherwise their visibility will be toggled.
   */
  export function toggleCaptions(show?: boolean) {
    const track = getTrack();
    if (!track) return;
    if (show == null) show = track.mode !== 'showing';
    track.mode = show ? 'showing' : 'hidden';
    textTracksHidden = track.mode === 'hidden';
    $videoPreferences.textTracksHidden = textTracksHidden;
  }

  /**
   * Toggle transcript visibility.
   * @param show If defined will define whether the transcript should be shown, otherwise its visibility will be toggled.
   */
  export function toggleTranscript(show?: boolean) {
    if (show == null) show = !transcriptVisible;
    if (show === transcriptVisible) return;
    if (show && !transcript) transcript = buildTranscript();
    setPaused(show || atEnd);
    transcriptVisible = show;
    $videoPreferences.transcriptVisible = show;
  }

  /**
   * Skip the video a number of steps based on text track cues or `skipAmount` if cues are not available. If the video is in the end, a `steps` of `-1` will be skip to the beginning of the last cue. If `steps` would result in a negative index or one greater than the number of cues, the video will be scrolled to the beginning or the end.
   * @param steps A positive or negative number of steps to skip. If zero, the current cue will be rewound.
   */
  export function jump(steps: number) {
    if (steps > 0 && atEnd) return;
    const cues = getTrack()?.cues;
    if (!skipByCue || cues == null)
      return gotoAndPlay(currentTime + (skipAmount ?? DEFAULT_SKIP_AMOUNT) * steps);
    const cue = (atEnd ? cues.length : findCue(currentTime)) + steps;
    return gotoAndPlay(cue < 0 ? 0 : cue >= cues.length ? 'end' : cues[cue].startTime);
  }

  /**
   * Scroll the video to the given time and play.
   * @param timepoint
   */
  export function gotoAndPlay(timepoint: number | 'end') {
    if (timepoint === 'end') timepoint = duration;
    // We need to deduct a small margin from duration, bc otherwise the video will start again
    currentTime = Math.max(0, Math.min(timepoint, duration - TIME_EPS));
    setPaused(false);
  }

  /**
   * Try to play or pause the video.
   * @param paused Whether to pause or play the video.
   */
  function setPaused(paused: boolean) {
    if (!video) return;
    if (paused) {
      video.pause();
    } else {
      video.play().catch(); // Closely repeated pause/play calls may result in a DOM error
    }
  }

  /**
   * Call this function after changing the video contents, i.e. sources, captions, poster and transcript.
   */
  export function reload(props: CustomVideoProps) {
    if (!video) return;
    // Hide text track before reloading to prevent duplicate rendering on Chrome
    const tracksShown = !textTracksHidden;
    if (tracksShown) toggleCaptions(false);
    title = props.title;
    sources = props.sources;
    captions = props.captions;
    poster = props.poster;
    aspectRatio = props.aspectRatio;
    transcript = props.transcript ?? '';
    setTimeout(() => {
      video?.load();
      if (transcriptVisible && !transcript) transcript = buildTranscript();
      toggleCaptions(tracksShown);
    }, 225);
  }

  ////////////////////////////////////////////////////////////////////////////////
  // OTHER FUNCTIONS
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * Get the text track.
   * NB. This can be expanded later if we support multiple text tracks.
   */
  function getTrack() {
    return video?.textTracks?.[0];
  }

  /**
   * Create a transcript from the text track
   */
  function buildTranscript() {
    const track = getTrack();
    if (!track?.cues) return;
    return [...track.cues]
      .filter((cue) => 'text' in cue && typeof cue.text === 'string')
      .map((cue) => `<p>${(cue as VTTCue).text}</p>`)
      .join('\n');
  }

  /**
   * Returns the index of the cue which would have been the current or the last to display for the given time, or -1 if the first cue would not have been displayed yet.
   * @param timepoint The time point on the video to check.
   * @returns The index of the cue or `-1` if the first cue would not have been displayed yet or `undefined` if no cues are available.
   */
  function findCue(timepoint: number) {
    const cues = getTrack()?.cues;
    if (!cues) throw new Error('No cues available.');
    for (let i = 0; i < cues.length; i++) {
      if (cues[i].startTime > timepoint) return i - 1;
    }
    return cues.length - 1;
  }

  /**
   * Get the source type of a video source.
   */
  function getVideoType(src: string) {
    const match = src.match(/\.(\w+)$/);
    return match ? `video/${match[1]}` : undefined;
  }

  /**
   * Set a timeout for showing an error message when an error occurs.
   */
  function onError() {
    status = 'error-pending';
    // Clear any existing timeout, because onError would be called again only if the error has been cleared in the meantime
    if (errorTimeout) clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      if (status === 'error-pending') status = 'error';
    }, ERROR_DELAY);
  }
</script>

<!--
@component
A video player that also includes a switcher between the video and a text transcript. The player also supports a variety of controls that mimic social media video controls.

It's best to supply a number of sources, such as `mp4` and `webm` to support different browsers and devices. You also need to supply a `poster` image and VTT `captions` for accessibility reasons. `aspectRatio` is required for sizing the player correctly. A text `transcript` is recommended to be supplied, but if it's missing, one will be created from the `captions`.

You can hide some of the controls using the `hideControls` property, in which case you should implement the functionality otherwise by binding to the control functions (see below).

The player will try to unmute the video when the user first interacts with it. You can disable this by setting `autoUnmute` to `false`.

User choices are stored in the `videoPreferences` store so that they persist across page loads. The preferences included are `muted`, `textTracksHidden` and `transcriptVisible`.

### Properties

- `title`: The title of the video for labelling.
- `sources`: The source URLs of the video.
- `captions`: The source URL for the video's captions.
- `poster`: The poster image URL for the video.
- `aspectRatio`: The aspect ratio of the video. This is needed so that the component can be sized correctly even before the data is loaded.
- `transcript`: The transcript text for the video as a HTML string. If empty, `captions` will be used instead.
- `hideControls`: The controls to hide. All are shown if the list is not defined. @default `undefined`
- `autoPlay`: Whether to autoPlay the video. @default `true`
- `autoUnmute`: Whether to automatically try to unmute the video when the user interacts with it. @default `true`
- `showCaptions`: Whether to show captions by default. @default `true`
- `showTranscript`: Whether to show the transcript instead of the video by default. @default `false`
- `skipByCue`: Whether to skip using the captions' cues. @default `true`
- `skipAmount`: The amount in seconds to skip if not using cues. @default `10`

### Bindable properties

- `atEnd`: Bindable: Whether the video is at the end (with a small margin)
- `mode`: Bindable: Whether the video or the transcript is visible.

### Bindable functions

- `togglePlay`: Toggle video playback or replay.
- `toggleSound`: Toggle sound
- `toggleCaptions`: Show or hide captions.
- `toggleTranscript`:  Toggle transcript visibility.
- `jump`: Skip the video a number of steps based on text track cues or `skipAmount` if cues are not available. If the video is in the end, a `steps` of `-1` will be skip to the beginning of the last cue. If `steps` would result in a negative index or one greater than the number of cues, the video will be scrolled to the beginning or the end.
- `gotoAndPlay`: Scroll the video to the given time and play.
- `reload`: Call this function after changing the video contents, i.e. sources, captions, poster and transcript.

### Usage

```tsx
<Video
  title="Video title"
  sources={['https://example.com/video.webm', 'https://example.com/video.mp4']}
  captions="https://example.com/video.vtt"
  poster="https://example.com/video.jpg"
  aspectRatio={4/5}
  transcript="<p>Transcript text</p>"/>
```
-->

<!-- NB. We need select-none and touch-manipulation to avoid distracting functions touch devices -->
<div
  {...concatClass(
    $$restProps,
    `relative select-none touch-manipulation w-full aspect-[var(--video-aspectRatio)] overflow-hidden
   max-h-[36rem] rounded-b-md sm:rounded-t-md bg-accent sm:bg-transparent`
  )}
  style:--video-aspectRatio={aspectRatio}
  style:width="min(100%, calc(36rem * var(--video-aspectRatio)))">
  <!-- Show video button if transcript visible -->
  {#if !hideControls || !hideControls.includes('transcript')}
    {#if transcriptToggleValue === 'text'}
      <Button
        variant="icon"
        color="primary-content"
        icon="video"
        on:click={() => (transcriptToggleValue = 'video')}
        text={$t('components.video.showVideo')}
        class="!absolute bottom-4 left-sm z-50 rounded-full bg-primary" />
    {/if}
  {/if}

  <!-- Transcript -->
  <div
    class="video-transcript relative mt-[3rem] h-[calc(100%_-_3rem)] w-full overflow-scroll rounded-md bg-base-100 p-lg pb-[4rem] sm:mt-0 sm:h-full"
    class:hidden={!transcriptVisible}>
    <div class="w-full">
      {@html sanitizeHtml(transcript)}
    </div>
  </div>

  <!-- Video -->
  <div class:hidden={transcriptVisible}>
    <video
      bind:this={video}
      bind:currentTime
      bind:duration
      bind:muted
      bind:paused
      on:canplay={() => (status = 'normal')}
      on:playing={() => (status = 'normal')}
      on:waiting={() => (status = 'waiting')}
      on:error={() => onError()}
      autoplay={autoPlay && !transcriptVisible}
      {poster}
      crossorigin="anonymous"
      disablepictureinpicture={true}
      playsinline={true}
      preload="auto"
      {title}
      aria-label={title}
      class="relative object-contain">
      {#each sources as src}
        <source {src} type={getVideoType(src)} />
      {/each}

      <track
        label={$t('components.video.captions')}
        kind="captions"
        srclang={$locale}
        src={captions}
        default={textTracksHidden ? undefined : true} />

      <div class="flex items-center bg-base-100 p-lg text-center text-warning">
        {$t('components.video.unsupportedWarning')}
      </div>
    </video>

    <!-- All controls. Note that we do not want these two overlap -->
    <div class="absolute bottom-0 left-0 right-0 top-0 flex flex-col">
      <!-- Invisible overlay areas -->
      <div
        on:pointerdown|once={tryUnmute}
        on:pointerdown={() => hold(true)}
        on:pointerup={() => hold(false)}
        class="flex grow flex-row justify-between">
        <button
          on:click|once={tryUnmute}
          on:pointerdown={() => hold(true)}
          on:pointerup={() => heldJump(-1)}
          aria-hidden="true"
          tabindex="-1"
          class="w-[20%] opacity-20 transition-colors duration-sm active:bg-gradient-to-r active:from-neutral"
          ><span class="sr-only">{$t('components.video.jumpBack')}</span></button>
        <button
          on:click|once={tryUnmute}
          on:pointerdown={() => hold(true)}
          on:pointerup={() => heldJump(+1)}
          aria-hidden="true"
          tabindex="-1"
          class="w-[50%] opacity-20 transition-colors duration-sm active:bg-gradient-to-l active:from-neutral active:to-50%"
          class:hidden={atEnd}
          ><span class="sr-only">{$t('components.video.jumpForward')}</span></button>
      </div>
      <!-- Icon buttons -->
      <div
        class="flex items-center justify-between px-sm py-4 {!hideControls ||
        hideControls.length === 0
          ? "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[4rem] before:bg-gradient-to-t before:from-neutral before:from-50% before:opacity-50 before:content-['']"
          : ''}">
        {#if !hideControls || !hideControls.includes('transcript')}
          <Button
            variant="icon"
            color="primary-content"
            icon="videoOff"
            on:click={() => (transcriptToggleValue = 'text')}
            text={$t('components.video.showTranscript')}
            class="rounded-full !bg-opacity-30 active:bg-primary-content" />
        {/if}
        {#if !hideControls || !hideControls.includes('captions')}
          <Button
            variant="icon"
            color="primary-content"
            icon={textTracksHidden ? 'showSubtitles' : 'hideSubtitles'}
            on:click|once={tryUnmute}
            on:click={() => toggleCaptions()}
            text={$t(`components.video.${textTracksHidden ? 'hideCaptions' : 'showCaptions'}`)}
            class="relative rounded-full !bg-opacity-30 active:bg-primary-content" />
        {/if}
        {#if !hideControls || !hideControls.includes('skip')}
          <Button
            variant="icon"
            color="primary-content"
            icon="skipPrevious"
            on:click|once={tryUnmute}
            on:click={() => jump(-1)}
            text={$t('components.video.jumpBack')}
            class="relative rounded-full !bg-opacity-30 {jumpBackPressed
              ? 'bg-primary-content'
              : ''} active:bg-primary-content" />
        {/if}
        {#if !hideControls || !hideControls.includes('pause')}
          <Button
            variant="icon"
            color="primary-content"
            icon={playButtonAction}
            on:click|once={tryUnmute}
            on:click={() => togglePlay()}
            text={$t(`components.video.${playButtonAction}`)}
            class="relative rounded-full !bg-opacity-30 active:bg-primary-content" />
        {/if}
        {#if !hideControls || !hideControls.includes('skip')}
          <Button
            variant="icon"
            color="primary-content"
            icon="skipNext"
            on:click|once={tryUnmute}
            on:click={() => jump(+1)}
            text={$t('components.video.jumpForward')}
            class="relative rounded-full !bg-opacity-30 {jumpForwardPressed
              ? 'bg-primary-content'
              : ''}  active:bg-primary-content" />
        {/if}
        {#if !hideControls || !hideControls.includes('mute')}
          <Button
            variant="icon"
            color="primary-content"
            icon={muted ? 'unmute' : 'mute'}
            on:click={() => toggleSound()}
            text={$t(`components.video.${muted ? 'unmute' : 'mute'}`)}
            class="relative rounded-full !bg-opacity-30 active:bg-primary-content" />
        {/if}
      </div>
      <!-- Progress bar -->
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Math.round(currentTime)}
        aria-label={$t('components.video.progessbarLabel')}
        style:--progress={`${!duration ? 0 : atEnd ? 100 : ((100 * currentTime) / duration).toFixed(2)}%`}
        class="relative h-2 w-[var(--progress)] overflow-hidden rounded-full bg-primary-content" />
    </div>

    <!-- Loading spinner -->
    <span
      class="loading loading-spinner loading-md absolute right-[0.8rem] top-[3.1rem] text-primary-content transition-all duration-sm"
      class:opacity-0={status !== 'waiting'} />

    <!-- Error message -->
    {#if status === 'error'}
      <div
        transition:fade
        class="absolute left-[0.8rem] right-[0.8rem] top-[3.1rem] rounded-md bg-base-100 p-md text-warning">
        <Icon name="warning" />
        {$t('components.video.error')}
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  video::cue {
    /* sm: is a valid class prefix even though it's flagged by the linter */
    @apply font-base text-[0.8rem] sm:text-md;
  }

  video::-webkit-media-text-track-display {
    @apply box-border rounded-lg p-md;
  }

  video::-webkit-media-text-track-container {
    /* The caption positioning support between Chrome and Safari is very confusing, and the latter treats captions with 1-2 or 3 lines of text in a strangely different way. Here the `bottom` directive has no effect on Safari while `translate` effects both Chrome and Safari.  */
    @apply relative bottom-[1.5rem] translate-y-[-1.5rem];
  }

  :global(.video-transcript img) {
    @apply mx-auto my-lg max-h-[100vw] rounded-sm;
  }
  :global(.video-transcript figure img) {
    @apply mb-sm;
  }
  :global(.video-transcript figure) {
    @apply mb-lg text-center text-sm;
  }
  :global(.video-transcript figcaption) {
    @apply text-center text-sm;
  }

  :global(.video-transcript h1),
  :global(.video-transcript h2),
  :global(.video-transcript h3),
  :global(.video-transcript h4) {
    @apply mb-sm mt-lg text-start text-md;
  }
</style>
