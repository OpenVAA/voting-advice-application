import type { VideoContent } from '@openvaa/app-shared';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { TrackingEvent } from '$lib/contexts/app/tracking';

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
  onTrack?: (event: TrackingEvent<VideoTrackingEventData>) => void;
};

/**
 * Bindable video properties.
 */
export type BindableVideoProps = {
  /**
   * Bindable: Whether the video is at the end (with a small margin)
   */
  readonly atEnd?: boolean;
  /**
   * Bindable: Whether the video or the transcript is visible.
   */
  readonly mode?: VideoMode;
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
 * The analytics data for a video event.
 */
export type VideoTrackingEventData = TrackingEvent['data'] &
  Partial<{
    duration: number;
    /** As a fraction of duration [0,1] */
    endAt: 'end' | number;
    /** Whether the end was reached at any point */
    ended: boolean;
    endMuted: boolean;
    endWithCaptions: boolean;
    endWithTranscript: boolean;
    error: boolean;
    /** Jump steps as a comma-separeted list, '1,-1,1,' */
    jump: string;
    src: string;
    startMuted: boolean;
    startWithCaptions: boolean;
    startWithTranscript: boolean;
    /** Toggle values as a comma-separeted list, 'true,false,true,' */
    toggleTranscript: string;
  }>;
