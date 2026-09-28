<!--@component

# Header component

Defines the global app header.

### Dynamic component

Accesses `AppContext` and renders the dynamic `Banner` component.

### Settings

- `headerStyle`: affects the background color of the header.
-->

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { AppLogo } from '$lib/dynamic-components/appLogo';
  import { cn } from '$lib/utils/components';
  import Banner from './Banner.svelte';

  let {
    menuId,
    openDrawer,
    isDrawerOpen = false,
    drawerOpenElement
  }: {
    menuId: string;
    openDrawer: () => void;
    isDrawerOpen?: boolean;
    drawerOpenElement?: HTMLButtonElement;
  } = $props();

  // `darkMode` is a stable `{ readonly current }` rune handle from AppContext.
  // `appSettings` is a reactive accessor — read via `ctx.appSettings`, never destructure (the alias below tracks it).
  const ctx = getAppContext();
  const { darkMode, t } = ctx;
  const appSettings = $derived(ctx.appSettings);

  const { navigationSettings, progress, topBarSettings } = getLayoutContext();

  const bgColor = $derived.by(() => {
    const mode = darkMode.current ? appSettings.headerStyle.dark : appSettings.headerStyle.light;
    return topBarSettings.current.imageSrc ? mode.overImgBgColor : mode.bgColor;
  });

  ////////////////////////////////////////////////////////////////////
  // Stashed for video
  ////////////////////////////////////////////////////////////////////

  /** We use `videoHeight` and `videoWidth` as proxies to check for the presence of content in the `video` slot. Note that we cannot merely check if the slot is provided, because it might be empty. */
  /*
  let videoHeight = 0;
  let videoWidth = 0;
  let hasVideo = videoWidth > 0 && videoHeight > 0;

  let screenWidth = 0;
  */

  /** The complicated condition for invertLogo ensures that when video is present behind the header, the logo is always white. Invert would otherwise render the default logo in dark mode. */
  /* let invertLogo = hasVideo && screenWidth < Breakpoints.sm && !darkMode.current; */
</script>

<!-- {hasVideo ? '!absolute w-full bg-transparent z-10' : ''} -->
<header
  class={cn(
    'pt-safet relative flex max-h-fit min-h-0 transition-[min-height] duration-250 ease-out',
    topBarSettings.current.imageSrc &&
      'min-h-[40vh] items-start bg-(image:--image) bg-(size:--background-size) bg-(position:--background-position) bg-no-repeat ease-in'
  )}
  style:view-transition-name="persistent-header"
  style:--image={topBarSettings.current.imageSrc && `url(${topBarSettings.current.imageSrc})`}
  style:--background-size={topBarSettings.current.imageSrc && appSettings.headerStyle.imgSize}
  style:--background-position={topBarSettings.current.imageSrc && appSettings.headerStyle.imgPosition}>
  {#if topBarSettings.current.progress === 'show'}
    <progress
      class="progress progress-primary absolute top-0 left-0 h-2 rounded-none [&::-moz-progress-bar]:rounded-none [&::-webkit-progress-bar]:rounded-none [&::-webkit-progress-value]:rounded-none"
      value={progress.current.current}
      max={progress.max}
      title={t('common.progress')}></progress>
  {/if}
  <div
    class="flex w-full items-center justify-between bg-(--background-color) pr-6 transition-colors duration-500"
    style:--background-color={bgColor}>
    <!-- invertLogo ? 'text-primary-content' : 'text-neutral' -->
    <button
      data-testid="nav-menu-toggle"
      onclick={openDrawer}
      bind:this={drawerOpenElement}
      aria-expanded={isDrawerOpen}
      aria-controls={menuId}
      aria-label={t('common.openMenu')}
      disabled={navigationSettings.current.hide}
      class="btn btn-ghost drawer-button gap-md text-neutral flex cursor-pointer items-center">
      <Icon name="menu" class={navigationSettings.current.hide ? 'hidden' : undefined} />
      <!-- inverse={invertLogo} -->
      <AppLogo inverse={false} aria-hidden="true" />
    </button>
    <Banner />
  </div>
</header>
