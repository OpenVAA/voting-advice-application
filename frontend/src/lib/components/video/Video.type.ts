import type { SvelteHTMLElements } from 'svelte/elements';
import type { TrackingEvent } from '$lib/utils/legacy-analytics/track';

export type VideoProps = SvelteHTMLElements['div'] & {
  /**
   * The title of the video for labelling.
   */
  title: string;
  /**
   * The source URLs of the video.
   */
  sources: Array<string>;
  /**
   * The source URL for the video's captions.
   */
  captions: string;
  /**
   * The poster image URL for the video.
   */
  poster: string;
  /**
   * The aspect ratio of the video. This is needed so that the component can be sized correctly even before the data is loaded.
   */
  aspectRatio: number;
  /**
   * The transcript text for the video as a HTML string. If empty, `captions` will be used instead.
   */
  transcript?: string;
  /**
   * The controls to hide. All are shown if the list is not defined. @default undefined
   */
  hideControls?: Array<VideoControl>;
  /**
   * Whether to autoplay the video. @default true
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
