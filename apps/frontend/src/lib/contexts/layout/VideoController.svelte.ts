import type { VideoContent } from '@openvaa/app-shared';
import type { OptionalVideoProps, Video, VideoMode } from '$lib/components/video';
import type { VideoController as VideoControllerApi } from './layoutContext.type';

/**
 * The video player controller as a Svelte 5 CLASS (Group F helper; v2.13
 * context-as-class migration, CLASS-01). EXTRACTED from the `video` const-ref
 * formerly embedded inside `initLayoutContext()` (`show`/`hasContent`/`mode`/
 * `player` `$state` mutated in place + the inline `load()`).
 *
 * The reactive core is the four PUBLIC `$state` FIELDS — `show` / `hasContent` /
 * `mode` / `player` (§17: a reassigned/assigned `$state` field read as
 * `instance.show` tracks via the field accessor, so no private-field-plus-getter
 * indirection is needed to keep the read+write API byte-identical to the old ref).
 *
 * `load` is an ARROW-FUNCTION FIELD (§18) so it survives `const { load } = video`
 * detach (it captures `this`). It preserves the inline `load()` logic verbatim:
 * returns `false` when there is no `player` ref; awaits `player.load(props)`; on a
 * truthy result clears `shouldClearContent`, sets `hasContent = true`, and (default
 * `autoshow:true`) sets `show = true`.
 *
 * There is NO `$effect` here (§20): the navigation-driven auto-hide stays in the
 * host's `beforeNavigate` / `afterNavigate` hooks in `initLayoutContext()`, which
 * toggle the public `shouldClearContent` field and drive the instance. That field
 * is NOT part of the public `VideoController` interface, so it is kept off the typed
 * surface (the class still satisfies `implements VideoControllerApi`).
 */
export class VideoController implements VideoControllerApi {
  show = $state(false);
  hasContent = $state(false);
  mode = $state<VideoMode>('video');
  player = $state<Video | undefined>(undefined);

  /**
   * Used in connection with the timeout delay to allow for the next page to load possible video content before hiding it and setting `hasContent` to `false`, which triggers layout changes as well. Toggled by the host's `beforeNavigate`/`afterNavigate` hooks; NOT part of the public `VideoController` interface.
   */
  shouldClearContent = false;

  load = async (
    props: VideoContent & OptionalVideoProps,
    { autoshow = true }: { autoshow?: boolean } = {}
  ): Promise<boolean> => {
    const player = this.player;
    if (!player) return false;
    const result = await player.load(props);
    if (!result) return false;
    this.shouldClearContent = false;
    this.hasContent = true;
    if (autoshow) this.show = true;
    return true;
  };
}
