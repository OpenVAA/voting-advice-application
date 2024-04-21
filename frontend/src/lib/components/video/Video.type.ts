import type {SvelteHTMLElements} from 'svelte/elements';
export type VideoProps = SvelteHTMLElements['div'] & {
  /**
   * The title of the video for labelling.
   */
  title: string;
  /**
   * The source URLs of the video.
   */
  sources: string[];
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
  hideControls?: VideoControl[];
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
 * Whether the video or the transcript is visible.
 */
export type VideoMode = 'video' | 'text';

/**
 * The types of video controls to show or hide.
 */
export type VideoControl = 'pause' | 'mute' | 'skip' | 'captions' | 'transcript';
