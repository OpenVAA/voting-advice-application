import type { VideoContent } from '@openvaa/app-shared';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { TrackingEvent, TrackingEventData } from '$lib/contexts/app/tracking';

/**
 * If `VideoContent` are not provided, the `video` element will be hidden until these properties are provided.
 */
export type VideoProps = SvelteHTMLElements['div'] & Partial<VideoContent> & OptionalVideoProps & BindableVideoProps;

/**
 * Optional video properties.
 */
export type OptionalVideoProps = {
  /**
   * The controls to hide. All are shown if the list is not defined. @default undefined
   */
  hideControls?: Array<VideoControl>;
  /**
   * Whether to autoplay the video (when content is provided). @default true
   */
  autoPlay?: boolean;
  /**
   * Whether to automatically try to unmute the video when the user interacts with it. @default true
   */
  autoUnmute?: boolean;
  /**
   * Whether to show captions by default. @default true
   */
  showCaptions?: boolean;
  /**
   * Whether to show the transcript instead of the video by default. @default false
   */
  showTranscript?: boolean;
  /**
   * Whether to skip using the captions' cues. @default true
   */
  skipByCue?: boolean;
  /**
   * The amount in seconds to skip if not using cues. @default 10
   */
  skipAmount?: number;
  /**
   * A callback triggered when the `video` element’s `ended` event is triggered.
   */
  onEnded?: () => void;
  /**
   * A callback triggered when the video tracking event should be sent. Send to `TrackingService.startEvent` or `track` to track.
   */
  onTrack?: (event: TrackingEvent<'video'>) => void;
};

/**
 * Bindable video properties.
 */
export type BindableVideoProps = {
  /**
   * Bindable: Whether the video is at the end (with a small margin)
   */
  atEnd?: boolean;
  /**
   * Bindable: Whether the video or the transcript is visible.
   */
  mode?: VideoMode;
};

/**
 * The actions and icons for the combined play/pause/replay button.
 */
export type PlayButtonAction = 'play' | 'pause' | 'replay';

/**
 * Whether the video or the transcript is visible.
 */
export type VideoMode = 'video' | 'text';

/**
 * The types of video controls to show or hide.
 */
export type VideoControl = 'pause' | 'mute' | 'skip' | 'captions' | 'transcript';

/**
 * The analytics data for a video event: the attributes of the `video` event of the vocabulary, all optional. `duration` is in seconds, `endAt` is a fraction of the duration in [0, 1] or `'end'`, `ended` tells whether the end was reached at any point, `jump` lists the jump steps as `'1,-1,1,'` and `toggleTranscript` the toggle values as `'true,false,true,'`.
 */
export type VideoTrackingEventData = TrackingEventData<'video'>;
