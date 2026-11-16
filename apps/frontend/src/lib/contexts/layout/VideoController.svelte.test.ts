import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VideoController } from './VideoController.svelte';
import type { VideoContent } from '@openvaa/app-shared';
import type { OptionalVideoProps, Video } from '$lib/components/video';

// A minimal `Video` stub: `load` resolves to a configurable boolean and `togglePlay` is a no-op. Only the members `VideoController` touches are implemented; the rest of the `Video` surface is unused here.
function makePlayer(loadResult: boolean, marker = 'player'): Video {
  return {
    marker,
    load: vi.fn(async () => loadResult),
    togglePlay: vi.fn()
  } as unknown as Video;
}

// A throwaway `load` props payload — its shape is irrelevant to the controller, which forwards it straight to `player.load(props)`.
const PROPS = {} as VideoContent & OptionalVideoProps;

describe('VideoController', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  /** Construct the controller inside an `$effect.root` so its `$state` fields settle (A11). */
  function setup(): VideoController {
    let controller!: VideoController;
    cleanup = $effect.root(() => {
      controller = new VideoController();
    });
    flushSync();
    return controller;
  }

  it('a fresh VideoController has the documented defaults', () => {
    const video = setup();
    expect(video.show).toBe(false);
    expect(video.hasContent).toBe(false);
    expect(video.mode).toBe('video');
    expect(video.player).toBeUndefined();
  });

  it('setting show/hasContent/mode/player round-trips through the $state fields', () => {
    const video = setup();
    const player = makePlayer(true, 'round-trip');
    video.show = true;
    video.hasContent = true;
    video.mode = 'text';
    video.player = player;
    flushSync();
    expect(video.show).toBe(true);
    expect(video.hasContent).toBe(true);
    expect(video.mode).toBe('text');
    // `.player` reads through the `$state` proxy (a distinct ref from the original object — see popupStore.svelte.test.ts), so compare by marker, not identity.
    expect((video.player as unknown as { marker: string }).marker).toBe('round-trip');
  });

  it('load() returns false and is a no-op when there is no player ref', async () => {
    const video = setup();
    const result = await video.load(PROPS);
    flushSync();
    expect(result).toBe(false);
    expect(video.hasContent).toBe(false);
    expect(video.show).toBe(false);
  });

  it('load() with a player resolving truthy sets hasContent + show (autoshow default) and returns true', async () => {
    const video = setup();
    video.player = makePlayer(true);
    flushSync();
    const result = await video.load(PROPS);
    flushSync();
    expect(result).toBe(true);
    expect(video.hasContent).toBe(true);
    expect(video.show).toBe(true);
  });

  it('load() with { autoshow: false } sets hasContent but leaves show unchanged', async () => {
    const video = setup();
    video.player = makePlayer(true);
    flushSync();
    const result = await video.load(PROPS, { autoshow: false });
    flushSync();
    expect(result).toBe(true);
    expect(video.hasContent).toBe(true);
    expect(video.show).toBe(false);
  });

  it('load() with a player resolving falsy returns false and does not set hasContent/show', async () => {
    const video = setup();
    video.player = makePlayer(false);
    flushSync();
    const result = await video.load(PROPS);
    flushSync();
    expect(result).toBe(false);
    expect(video.hasContent).toBe(false);
    expect(video.show).toBe(false);
  });

  it('load is an arrow-function field that survives detach (captures this)', async () => {
    const video = setup();
    video.player = makePlayer(true);
    flushSync();
    const { load } = video;
    const result = await load(PROPS);
    flushSync();
    expect(result).toBe(true);
    expect(video.hasContent).toBe(true);
  });
});
