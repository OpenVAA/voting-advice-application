<!-- To enable accessing properties via the component reference in `LayoutContext` -->
<svelte:options accessors />

<!--
@component
A video player that also includes a switcher between the video and a text transcript. The player also supports a variety of controls that mimic social media video controls.

The player can be initialized without providing any content in which case it will be hidden until the content is provided using the `load` function.

It's best to supply a number of sources, such as `mp4` and `webm` to support different browsers and devices. You also need to supply a `poster` image and VTT `captions` for accessibility reasons. `aspectRatio` is required for sizing the player correctly. A text `transcript` is recommended to be supplied, but if it's missing, one will be created from the `captions`.

You can hide some of the controls using the `hideControls` property, in which case you should implement the functionality otherwise by binding to the control functions (see below).

The player will try to unmute the video when the user first interacts with it. You can disable this by setting `autoUnmute` to `false`.

User choices are stored in the `videoPreferences` store so that they persist across page loads. The preferences included are `muted`, `textTracksHidden` and `transcriptVisible`.

### Content properties

If not provided, the `video` element will be hidden until these properties are provided using the `load` function.

- `title`: The title of the video for labelling.
- `sources`: The source URLs of the video.
- `captions`: The source URL for the video's captions.
- `poster`: The poster image URL for the video.
- `aspectRatio`: The aspect ratio of the video. This is needed so that the component can be sized correctly even before the data is loaded. Default: `1/1`
- `transcript`: Optional transcript text for the video as a HTML string. If empty, `captions` will be used instead.

### Other properties

- `hideControls`: The controls to hide. All are shown if the list is not defined. Default: `undefined`
- `autoPlay`: Whether to autoPlay the video (when content is provided). Default: `true`
- `autoUnmute`: Whether to automatically try to unmute the video when the user interacts with it. Default: `true`
- `showCaptions`: Whether to show captions by default. Default: `true`
- `showTranscript`: Whether to show the transcript instead of the video by default. Default: `false`
- `skipByCue`: Whether to skip using the captions' cues. Default: `true`
- `skipAmount`: The amount in seconds to skip if not using cues. Default: `10`

### Callbacks

- `onTrack`: A callback triggered when the video tracking event should be sent. Send to `TrackingService.startEvent` or `track` to track.
- `onEnded`: Forwarded from the `<video>` element.

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
- `load`: Change the video contents, i.e. sources, captions, poster and transcript, and optionally other properties.

### Tracking events

- `video`: The video player creates an analytics event for each video viewed which combines a number of properties. See the `VideoTrackingEventData` in [`Video.type.ts`](./Video.type.ts) for a complete description. The event is started and submitted when:
  - the component is created/destroyed
  - when the video shown is changed with `reload`
  - when the page's visibility changes to `hidden`.

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

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { beforeNavigate } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { videoPreferences } from './component-stores';
  import type { TrackingEvent } from '$lib/contexts/app/tracking';
  import type {
    OptionalVideoProps,
    PlayButtonAction,
    VideoContentProps,
    VideoProps,
    VideoTrackingEventData
  } from './Video.type';

  ////////////////////////////////////////////////////////////////////////////////
  // CONSTANTS
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * The default skip amount
   */
  const DEFAULT_SKIP_AMOUNT = 10;
  /**
   * The time in ms to wait for a loading error to be resolved before an error message is shown. The same time out is also used to check for silent errors, i.e., when the video should be playing but is not.
   */
  const ERROR_DELAY = 4000;
  /**
   * The frequency with which to check for errors in playback.
   */
  const ERROR_CHECK_INTERVAL = 1005;
  /**
   * A small eps in seconds used to determine whether we treat the video is being at the end
   */
  const END_EPS = 0.05;

  ////////////////////////////////////////////////////////////////////////////////
  // PUBLIC PROPERTIES
  ////////////////////////////////////////////////////////////////////////////////

  type $$Props = VideoProps;

  export let title: $$Props['title'] = undefined;
  export let sources: $$Props['sources'] = undefined;
  export let captions: $$Props['captions'] = undefined;
  export let poster: $$Props['poster'] = undefined;
  export let aspectRatio: $$Props['aspectRatio'] = 1;
  export let transcript: $$Props['transcript'] = '';
  export let hideControls: $$Props['hideControls'] = undefined;
  export let autoPlay: $$Props['autoPlay'] = true;
  export let autoUnmute: $$Props['autoUnmute'] = true;
  export let showCaptions: $$Props['showCaptions'] = true;
  export let showTranscript: $$Props['showTranscript'] = false;
  export let skipByCue: $$Props['skipByCue'] = true;
  export let skipAmount: $$Props['skipAmount'] = DEFAULT_SKIP_AMOUNT;
  export let onTrack: $$Props['onTrack'] = undefined;
  export let onEnded: $$Props['onEnded'] = undefined;
  export let mode: $$Props['mode'] = undefined;
  export let atEnd: $$Props['atEnd'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { locale, t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////////////////
  // CONTENT AVAILABLE
  ////////////////////////////////////////////////////////////////////////////////

  let hasContent: boolean;
  $: hasContent = !!title && !!sources?.length && !!captions && !!poster;

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
  let boundPaused: boolean;
  let muted = true;

  /**
   * Bindable: Whether the video is at the end (with a small margin)
   */
  $: atEnd = isAtEnd(currentTime);

  /**
   * We need a custom `playing` property because the bound one from the video element does not always work.
   * For more criteria, see https://stackoverflow.com/questions/6877403/how-to-tell-if-a-video-element-is-currently-playing
   */
  let playing: boolean;
  $: playing = !!video && currentTime > 0 && !boundPaused && !video.ended && video.readyState > 2;

  ////////////////////////////////////////////////////////////////////////////////
  // ERROR DETECTION
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * For error detection:
   * 1. Whenever play/pause is toggled, we save the expected state in the `shouldPlay` variable
   * 2. We set an interval which checks whether the video is playing at that time and saves the latest timepoint when it was playing. If `shouldPlay` is `true` and the latest confirmed playing timepoint is older than `ERROR_DELAY`, we show an error message.
   */

  /**
   * The current loading status of the video. The `error-pending` status is used when an error has occurred but we're still waiting for it to be resolved.
   */
  let status: 'waiting' | 'error' | 'error-pending' | 'normal' = 'normal';
  /**
   * Allow the user to hide the error message
   */
  let hideError = false;
  /**
   * An interval which checks whether the video is playing at that time and saves the latest timepoint when it was playing.
   */
  let errorCheckInterval: NodeJS.Timeout | undefined;
  /**
   * Whether the video should be playing now
   */
  let shouldPlay: boolean;
  /**
   * The last known time and video `currentTime` when the video was playing or the time the component was mounted. We need both to double-check that the video is actually playing, because even our compex `playing` detector fails in some configurations, uh
   */
  let lastPlaying = {
    time: -1,
    videoTime: -1
  };

  // Initialize error checking
  onMount(() => setShouldPlay(!!autoPlay));

  /**
   * Call when explicitly toggling play/paused to use `errorCheckInterval` to check whether we should show an error message. This is automatically called by `setPaused()`.
   * @param value Whether the video should be playing
   */
  function setShouldPlay(value: boolean): void {
    if (!hasContent || !value) {
      clearErrorChecking();
      return;
    }
    shouldPlay = value;
    if (!errorCheckInterval) initErrorChecking();
  }

  /**
   * Start the error checking regime
   */
  function initErrorChecking(): void {
    clearErrorChecking();
    hideError = false;
    shouldPlay = !!(hasContent && autoPlay);
    lastPlaying = {
      time: Date.now(),
      videoTime: currentTime
    };
    errorCheckInterval = setInterval(() => {
      if (transcriptVisible) {
        clearErrorChecking();
        return;
      }
      // We can't use `playing` to decide whether the video is actually playing, so we'll assume the timepoint has to have changed
      if (currentTime != lastPlaying.videoTime) {
        lastPlaying = {
          time: Date.now(),
          videoTime: currentTime
        };
      }
      if (!shouldPlay || Date.now() - lastPlaying.time < ERROR_DELAY) {
        status = 'normal';
        return;
      }
      status = 'error';
      addToEvent({ shouldPlayError: true });
    }, ERROR_CHECK_INTERVAL);
  }

  // Cleanup
  function clearErrorChecking(): void {
    if (errorCheckInterval) clearTimeout(errorCheckInterval);
    status = 'normal';
    errorCheckInterval = undefined;
    shouldPlay = false;
  }

  $: if (atEnd) clearErrorChecking();
  onDestroy(clearErrorChecking);

  ////////////////////////////////////////////////////////////////////////////////
  // TRANSCRIPT
  ////////////////////////////////////////////////////////////////////////////////

  let transcriptVisible = $videoPreferences.transcriptVisible ?? showTranscript;
  $: mode = transcriptVisible ? 'text' : 'video';

  ////////////////////////////////////////////////////////////////////////////////
  // CONTROLS
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * The current action of the combined play/pause/replay button.
   */
  let playButtonAction: PlayButtonAction = 'play';
  $: playButtonAction = playing ? 'pause' : atEnd ? 'replay' : 'play';

  /**
   * Used to highlight the jump buttons when the corresponding invisible screen area is pressed
   */
  let jumpBackPressed = false;

  /**
   * Used to highlight the jump buttons when the corresponding invisible screen area is pressed
   */
  let jumpForwardPressed = false;

  /**
   * Used to highlight the toggle play button when the corresponding invisible screen area is pressed
   */
  let togglePlayPressed = false;

  ////////////////////////////////////////////////////////////////////////////////
  // EVENTS
  ////////////////////////////////////////////////////////////////////////////////

  function handleEnded(): void {
    addToEvent({ ended: true });
    onEnded?.();
  }

  ////////////////////////////////////////////////////////////////////////////////
  // TRACKING
  ////////////////////////////////////////////////////////////////////////////////

  beforeNavigate(endVideoEvent);
  onMount(startVideoEvent);

  /**
   * The event data for the current video
   */
  let event: TrackingEvent<VideoTrackingEventData> | undefined = undefined;

  /**
   * Start a new video event if none exists
   */
  function startVideoEvent(): void {
    if (!hasContent) return;
    if (event) return;
    event = {
      name: 'video',
      data: {
        startMuted: muted,
        startWithTranscript: transcriptVisible,
        startWithCaptions: showCaptions
      }
    };
  }

  /**
   * Finalize the current video event
   */
  function endVideoEvent(): void {
    if (!event) return;
    event.data = {
      ...event.data,
      src: video?.currentSrc,
      duration,
      endAt: atEnd ? 'end' : duration !== 0 ? currentTime / duration : 0,
      endMuted: muted,
      endWithTranscript: transcriptVisible,
      endWithCaptions: showCaptions
    };
    onTrack?.(event);
    // Delete the reference to the video event
    event = undefined;
  }

  /**
   * Add properties to the video event
   * @param data
   */
  function addToEvent(
    data: Partial<VideoTrackingEventData> | ((current: VideoTrackingEventData) => VideoTrackingEventData)
  ): void {
    if (!event) startVideoEvent();
    if (typeof data === 'function') {
      event!.data = data(event!.data);
    } else {
      event!.data = { ...event!.data, ...data };
    }
  }

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
   * Fired when the invisible jump areas of the screen are pressed. We treat this clicks as jumps only if the video is not paused.
   * @param steps Passed to `jump`
   */
  function screenJump(steps: number): void {
    if (!playing || steps === 0) {
      togglePlay();
      togglePlayPressed = true;
      setTimeout(() => (togglePlayPressed = false), 125);
      return;
    }
    // Use the `jumpBack/ForwardPressed` variables to temporarily highlight the buttons doing the same action
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
   * @param action The action to perform: `'play'`, `'pause'` or `'replay'`. Default: Toggle between `'play'` and `'pause'`.
   */
  export function togglePlay(action?: PlayButtonAction): void {
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
  export function toggleSound(unmute?: boolean): void {
    unmute ??= muted;
    muted = !unmute;
    $videoPreferences = { ...$videoPreferences, muted };
  }

  /**
   * Show or hide captions.
   * @param show If defined will define whether the captions should be shown, otherwise their visibility will be toggled.
   */
  export function toggleCaptions(show?: boolean): void {
    const track = getTrack();
    if (!track) return;
    if (show == null) show = track.mode !== 'showing';
    track.mode = show ? 'showing' : 'hidden';
    textTracksHidden = track.mode === 'hidden';
    $videoPreferences = { ...$videoPreferences, textTracksHidden };
  }

  /**
   * Toggle transcript visibility.
   * @param show If defined will define whether the transcript should be shown, otherwise its visibility will be toggled.
   */
  export function toggleTranscript(show?: boolean): void {
    if (!hasContent) return;
    if (show == null) show = !transcriptVisible;
    if (show === transcriptVisible) return;
    if (show && !transcript) transcript = buildTranscript();
    transcriptVisible = show;
    setPaused(show || !!atEnd);
    addToEvent((data) => ({
      toggleTranscript: `${data.toggleTranscript ?? ''}${show ? 'true' : 'false'},`
    }));
    $videoPreferences = { ...$videoPreferences, transcriptVisible };
  }

  let seekTarget: number | undefined;

  /**
   * Skip the video a number of steps based on text track cues or `skipAmount` if cues are not available. If the video is in the end, a `steps` of `-1` will be skip to the beginning of the last cue. If `steps` would result in a negative index or one greater than the number of cues, the video will be scrolled to the beginning or the end.
   * @param steps A positive or negative number of steps to skip. If zero, the current cue will be rewound.
   */
  export function jump(steps: number): void {
    if (!video || !hasContent || (steps > 0 && atEnd)) return;
    let effectiveTime = video.currentTime;
    const cues = getTrack()?.cues;
    if (!skipByCue || cues == null) {
      gotoAndPlay(effectiveTime + (skipAmount ?? DEFAULT_SKIP_AMOUNT) * steps);
      return;
    }
    const cue = (atEnd ? cues.length : findCue(effectiveTime)) + steps;
    seekTarget = cue < 0 ? 0 : cue >= cues.length ? duration : cues[cue].startTime;
    addToEvent((data) => ({ jump: `${data.jump ?? ''}${steps},` }));
    gotoAndPlay(seekTarget);
  }

  /**
   * Scroll the video to the given time and play.
   * @param timepoint
   */
  export function gotoAndPlay(timepoint: number): void {
    if (!video || !hasContent) return;
    // On Safari, there's a strange bug if the timepoint is passed is not precise enough, which sometimes causes the player to freeze. Therefore, we add a tiny fraction to the value.
    // We also need to deduct a small margin from duration, bc otherwise the video will start again
    video.currentTime = Math.max(0, Math.min(timepoint, duration - END_EPS)) + 1e-10;
    setPaused(false);
  }

  /**
   * Try to play or pause the video.
   * @param paused Whether to pause or play the video.
   */
  function setPaused(paused: boolean): void {
    if (!video || !hasContent) return;
    if (paused) {
      video.pause();
    } else {
      video.play().catch(); // Closely repeated pause/play calls may result in a DOM error
    }
    setShouldPlay(!paused);
  }

  /**
   * Change the video contents, i.e. sources, captions, poster and transcript, and optionally other properties.
   * TODO: Convert this to an init function which is always called, even on first use of the component
   * @returns A `Promise` that resolves to `true` if the `video` element was present.
   */
  export function load(props: VideoContentProps & OptionalVideoProps): Promise<boolean> {
    return new Promise((resolve) => {
      if (!video) return resolve(false);
      // End the current video tracking event if it exists
      endVideoEvent();
      // Hide text track before reloading to prevent duplicate rendering on Chrome, the state is restored after the timeout
      const tracksShown = !textTracksHidden;
      const track = getTrack();
      if (track) track.mode = 'hidden';
      ({
        // Content props
        title,
        sources,
        captions,
        poster,
        aspectRatio,
        transcript,
        // Optional props
        skipAmount,
        skipByCue,
        showTranscript,
        showCaptions,
        autoUnmute,
        autoPlay,
        hideControls
      } = {
        // Use the current values as defaults for optional props
        skipAmount,
        skipByCue,
        showTranscript,
        showCaptions,
        autoUnmute,
        autoPlay,
        hideControls,
        ...props
      });
      atEnd = false;
      seekTarget = undefined;
      clearErrorChecking();
      setTimeout(() => {
        video?.load();
        if (transcriptVisible && !transcript) transcript = buildTranscript();
        if (!transcriptVisible && autoPlay) togglePlay('play');
        if (track && tracksShown) track.mode = 'showing';
        // Start a new video tracking event
        startVideoEvent();
        resolve(true);
      }, 225);
    });
  }

  ////////////////////////////////////////////////////////////////////////////////
  // OTHER FUNCTIONS
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * Get the text track.
   * NB. This can be expanded later if we support multiple text tracks.
   */
  function getTrack(): TextTrack | undefined {
    return video?.textTracks?.[0];
  }

  /**
   * Create a transcript from the text track
   */
  function buildTranscript(): string | undefined {
    const track = getTrack();
    if (!track?.cues) return;
    const blocks: Array<string> = [];
    // Sometimes the cues continue from the previous cue, so we need may need to concatenate them
    let combined = '';
    for (const cue of [...track.cues].filter((cue) => 'text' in cue && typeof cue.text === 'string')) {
      let continued = false;
      let text = (cue as VTTCue).text.trim();
      // The text continues in the next cue
      if (text.match(/[-–—]$/)) {
        text = text.slice(0, text.length - 1);
        continued = true;
      }
      if (combined && !continued) {
        // This was the last part to combine
        text = `${combined} ${text}`;
        combined = '';
      }
      // The text will still continue
      if (continued) {
        combined += ` ${text}`;
        continue;
      }
      // The text is not continuing
      blocks.push(text);
    }
    // We might have one last piece if the combined text was never finished
    if (combined) blocks.push(combined);
    return blocks.map((text) => `<p>${text}</p>`).join('\n');
  }

  /**
   * Returns the index of the cue which would have been the current or the last to display for the given time, or -1 if the first cue would not have been displayed yet.
   * @param timepoint The time point on the video to check.
   * @returns The index of the cue or `-1` if the first cue would not have been displayed.
   * @throws Error if no cues are available.
   */
  function findCue(timepoint: number): number {
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
  function getVideoType(src: string): string | undefined {
    const match = src.match(/\.(\w+)$/);
    return match ? `video/${match[1]}` : undefined;
  }

  /**
   * Check whether the supplied time is at the end of the video.
   */
  function isAtEnd(timepoint: number): boolean {
    return duration - timepoint <= END_EPS;
  }
</script>

<!-- NB. We need select-none and touch-manipulation to avoid distracting functions touch devices -->
<div
  {...concatClass(
    $$restProps,
    'relative select-none touch-manipulation aspect-[var(--video-aspectRatio)] overflow-hidden rounded-b-md sm:rounded-t-md bg-accent'
  )}
  class:hidden={!hasContent}
  style:--video-aspectRatio={aspectRatio}
  style:max-height="min(36rem, calc(100vw / var(--video-aspectRatio))"
  style:min-width="min(100%, calc(36rem * var(--video-aspectRatio)))">
  <!-- Show video button if transcript visible -->
  {#if !hideControls?.includes('transcript') && transcriptVisible}
    <Button
      variant="icon"
      color="white"
      icon="videoOff"
      on:click={() => toggleTranscript(false)}
      text={$t('components.video.showVideo')}
      class="!absolute bottom-4 left-sm z-20 rounded-full bg-primary" />
  {/if}

  <!-- Transcript -->
  <div
    class="video-transcript relative h-full w-full overflow-scroll rounded-md bg-base-300 p-lg leading-lg sm:mt-0 sm:h-full"
    class:pb-[4rem]={!hideControls?.includes('transcript')}
    class:hidden={!transcriptVisible}>
    <div class="w-full">
      {@html sanitizeHtml(transcript)}
    </div>
  </div>

  <!-- Video -->
  <div class="h-full w-full" class:hidden={transcriptVisible}>
    <video
      bind:this={video}
      bind:currentTime
      bind:duration
      bind:muted
      bind:paused={boundPaused}
      on:canplay={() => (status = 'normal')}
      on:playing={() => (status = 'normal')}
      on:waiting={() => (status = 'waiting')}
      on:error={() => (status = 'error-pending')}
      on:ended={handleEnded}
      autoplay={autoPlay && !transcriptVisible}
      {poster}
      crossorigin="anonymous"
      disablepictureinpicture={true}
      playsinline={true}
      preload="auto"
      {title}
      aria-label={title}
      class="relative w-full object-contain">
      {#if sources}
        {#each sources as src}
          <source {src} type={getVideoType(src)} />
        {/each}
      {/if}

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
      <div class="flex grow flex-row justify-stretch">
        <button
          on:click|once={tryUnmute}
          on:click|capture={() => screenJump(-1)}
          aria-hidden="true"
          tabindex="-1"
          class="w-[33.333%] opacity-20 transition-colors duration-sm active:bg-gradient-to-r active:from-neutral active:to-50%"
          ><span class="sr-only">{$t('components.video.jumpBack')}</span></button>
        <button
          on:click|once={tryUnmute}
          on:click|capture={() => screenJump(0)}
          aria-hidden="true"
          tabindex="-1"
          class="grow-1 w-[33.333%] opacity-20 transition-colors duration-sm active:bg-gradient-to-r active:from-transparent active:via-neutral active:via-50%"
          ><span class="sr-only">{$t('components.video.jumpBack')}</span></button>
        <button
          on:click|once={tryUnmute}
          on:click|capture={() => screenJump(+1)}
          aria-hidden="true"
          tabindex="-1"
          class="w-[33.333%] opacity-20 transition-colors duration-sm active:bg-gradient-to-l active:from-neutral active:to-50%"
          class:hidden={atEnd}><span class="sr-only">{$t('components.video.jumpForward')}</span></button>
      </div>

      <!-- Icon buttons -->
      <div
        class="flex items-center justify-between px-sm py-4 {!hideControls || hideControls.length === 0
          ? "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[4rem] before:bg-gradient-to-t before:from-neutral before:from-50% before:opacity-50 before:content-['']"
          : ''}">
        {#if !hideControls?.includes('transcript')}
          <Button
            variant="icon"
            color="white"
            icon="videoOn"
            on:click={() => toggleTranscript(true)}
            text={$t('components.video.showTranscript')}
            class="rounded-full !bg-opacity-30 active:bg-white" />
        {/if}
        {#if !hideControls?.includes('captions')}
          <Button
            variant="icon"
            color="white"
            icon={textTracksHidden ? 'subtitlesOff' : 'subtitlesOn'}
            on:click|once={tryUnmute}
            on:click={() => toggleCaptions()}
            text={$t(`components.video.${textTracksHidden ? 'hideCaptions' : 'showCaptions'}`)}
            class="relative rounded-full !bg-opacity-30 active:bg-white" />
        {/if}
        {#if !hideControls?.includes('skip')}
          <Button
            variant="icon"
            color="white"
            icon="skipPrevious"
            on:click|once={tryUnmute}
            on:click={() => jump(-1)}
            text={$t('components.video.jumpBack')}
            class="relative rounded-full !bg-opacity-30 {jumpBackPressed ? 'bg-white' : ''} active:bg-white" />
        {/if}
        {#if !hideControls?.includes('pause')}
          <Button
            variant="icon"
            color="white"
            icon={playButtonAction}
            on:click|once={tryUnmute}
            on:click={() => togglePlay()}
            text={$t(`components.video.${playButtonAction}`)}
            class="relative rounded-full !bg-opacity-30 {togglePlayPressed ? 'bg-white' : ''} active:bg-white" />
        {/if}
        {#if !hideControls?.includes('skip')}
          <Button
            variant="icon"
            color="white"
            icon="skipNext"
            on:click|once={tryUnmute}
            on:click={() => jump(+1)}
            text={$t('components.video.jumpForward')}
            class="relative rounded-full !bg-opacity-30 {jumpForwardPressed ? 'bg-white' : ''}  active:bg-white" />
        {/if}
        {#if !hideControls?.includes('mute')}
          <Button
            variant="icon"
            color="white"
            icon={muted ? 'soundOff' : 'soundOn'}
            on:click={() => toggleSound()}
            text={$t(`components.video.${muted ? 'unmute' : 'mute'}`)}
            class="relative rounded-full !bg-opacity-30 active:bg-white" />
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
        class="relative h-2 w-[var(--progress)] overflow-hidden rounded-full bg-primary" />
    </div>

    <!-- Loading spinner -->
    <Loading
      inline
      size="md"
      class="absolute right-[0.8rem] top-[3.1rem] !text-white transition-all duration-sm
        {status === 'waiting' || status === 'error-pending' ? '' : 'opacity-0'}" />

    <!-- Error message -->
    {#if status === 'error' && !hideError}
      <div
        role="status"
        aria-live="polite"
        transition:fade
        class="absolute left-[0.8rem] right-[0.8rem] top-[3.1rem] grid justify-items-center rounded-md bg-base-100 p-md text-warning">
        <Icon name="warning" />
        <div class="mt-sm text-center">
          {$t('components.video.error')}
        </div>
        <Button on:click={() => toggleTranscript(true)} text={$t('components.video.showTranscript')} />
        <button on:click={() => (hideError = true)} class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
          <span aria-hidden="true">✕</span>
          <span class="sr-only">{$t('common.close')}</span>
        </button>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  :global(video::cue) {
    /* sm: is a valid class prefix even though it's flagged by the linter */
    @apply font-base text-[0.85rem] sm:text-md;
  }

  :global(video::-webkit-media-text-track-display) {
    @apply box-border rounded-lg p-md;
  }

  :global(video::-webkit-media-text-track-container) {
    /* The caption positioning support between Chrome and Safari is very confusing, and the latter treats captions with 1-2 or 3 lines of text in a strangely different way. Here the `bottom` directive has no effect on Safari while `translate` effects both Chrome and Safari.  */
    @apply relative translate-y-[-2.5rem];
  }

  :global(.video-transcript img) {
    @apply mx-auto my-lg max-h-[100vw] rounded-sm;
  }
  :global(.video-transcript figure img) {
    @apply mb-sm;
  }
  :global(.video-transcript figure) {
    @apply small-info mb-lg text-center;
  }
  :global(.video-transcript figcaption) {
    @apply small-info text-center;
  }

  :global(.video-transcript h1),
  :global(.video-transcript h2),
  :global(.video-transcript h3),
  :global(.video-transcript h4) {
    @apply mb-sm mt-lg text-start text-md;
  }
</style>
