<!--@component

# Header component

Defines the global app header.

### Dynamic component

Accesses `AppContext` and renders the dynamic `Banner` component.

### Settings

- `headerStyle`: affects the background color of the header.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fromStore } from 'svelte/store';
  import { Icon } from '$lib/components/icon';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { AppLogo } from '$lib/dynamic-components/appLogo';
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

  const { appSettings: appSettingsStore, darkMode: darkModeStore, t } = getAppContext();
  const appSettings = fromStore(appSettingsStore);
  const darkMode = fromStore(darkModeStore);

  const { navigationSettings, progress, topBarSettings } = getLayoutContext(onDestroy);

  const bgColor = $derived.by(() => {
    const mode = darkMode.current ? appSettings.current.headerStyle.dark : appSettings.current.headerStyle.light;
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
  class="pt-safet relative flex max-h-fit"
  class:prominent-top-bar-with-background={topBarSettings.current.imageSrc}
  class:top-bar={!topBarSettings.current.imageSrc}
  style:--image={topBarSettings.current.imageSrc && `url(${topBarSettings.current.imageSrc})`}
  style:--background-size={topBarSettings.current.imageSrc && appSettings.current.headerStyle.imgSize}
  style:--background-position={topBarSettings.current.imageSrc && appSettings.current.headerStyle.imgPosition}>
  {#if topBarSettings.current.progress === 'show'}
    <progress
      class="progress progress-primary absolute top-0 left-0 h-2"
      value={progress.current.current}
      max={progress.max}
      title={t('common.progress')} />
  {/if}
  <div class="inner-actions-bar flex w-full items-center justify-between pr-6" style:--background-color={bgColor}>
    <!-- invertLogo ? 'text-primary-content' : 'text-neutral' -->
    <button
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

<style lang="postcss">
  @reference "../tailwind-theme.css";
  progress {
    border-radius: 0;
  }

  progress::-webkit-progress-bar {
    border-radius: 0;
  }

  progress::-moz-progress-bar {
    border-radius: 0;
  }

  progress::-webkit-progress-value {
    border-radius: 0;
  }

  .top-bar {
    @apply min-h-0;
    transition: min-height 0.25s ease-out;
  }

  .prominent-top-bar-with-background {
    @apply min-h-[40vh];
    transition: min-height 0.25s ease-in;
    align-items: start;
    background-image: var(--image);
    background-size: var(--background-size);
    background-position: var(--background-position);
    background-repeat: no-repeat;
  }

  .inner-actions-bar {
    @apply bg-base-300;
    background-color: var(--background-color);
    transition: background-color 0.5s ease;
  }
</style>
