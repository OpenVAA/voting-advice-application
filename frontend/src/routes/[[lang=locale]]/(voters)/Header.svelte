<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { settings } from '$lib/stores';
  import { AppLogo } from '$lib/templates/parts/appLogo';
  import { darkMode } from '$lib/utils/darkMode';
  import Banner from './Banner.svelte';
  import type { BasicPageProps } from '$lib/templates/basicPage/BasicPage.type';

  export let navId: BasicPageProps['navId'] = 'pageNav';

  export let openDrawer: () => void;
  export let drawerOpen = false;
  export let drawerOpenElement: HTMLButtonElement | undefined;

  /** We use `videoHeight` and `videoWidth` as proxies to check for the presence of content in the `video` slot. Note that we cannot merely check if the slot is provided, because it might be empty. */
  /*
  let videoHeight = 0;
  let videoWidth = 0;
  let hasVideo = videoWidth > 0 && videoHeight > 0;

  let screenWidth = 0;
  */

  /** The complicated condition for invertLogo ensures that when video is present behind the header, the logo is always white. Invert would otherwise render the default logo in dark mode. */
  /* let invertLogo = hasVideo && screenWidth < Breakpoints.sm && !$darkMode; */

  const { topBarSettings, progress } = getLayoutContext(onDestroy);

  const currentProgress = progress.current;
  const maxProgress = progress.max;

  const headerStyle = $settings.headerStyle;

  let bgColor: string | undefined;
  $: {
    const mode = $darkMode ? headerStyle.dark : headerStyle.light;
    bgColor = $topBarSettings.imageSrc ? mode.overImgBgColor : mode.bgColor;
  }
</script>

<!-- {hasVideo ? '!absolute w-full bg-transparent z-10' : ''} -->
<header
  class="relative flex max-h-fit pt-safet"
  class:prominent-top-bar-with-background={$topBarSettings.imageSrc}
  class:top-bar={!$topBarSettings.imageSrc}
  style:--image={$topBarSettings.imageSrc && `url(${$topBarSettings.imageSrc})`}
  style:--background-size={$topBarSettings.imageSrc && headerStyle.imgSize}
  style:--background-position={$topBarSettings.imageSrc && headerStyle.imgPosition}>
  {#if $topBarSettings.progress === 'show'}
    <progress
      class="progress progress-primary absolute left-0 top-0 h-2"
      value={$currentProgress}
      max={$maxProgress}
      title={$t('common.progress')} />
  {/if}
  <div class="inner-actions-bar flex w-full items-center justify-between pr-6" style:--background-color={bgColor}>
    <!-- invertLogo ? 'text-primary-content' : 'text-neutral' -->
    <button
      on:click={openDrawer}
      bind:this={drawerOpenElement}
      aria-expanded={drawerOpen}
      aria-controls={navId}
      aria-label={$t('common.openMenu')}
      class="btn btn-ghost drawer-button flex cursor-pointer items-center gap-md text-neutral">
      <Icon name="menu" />
      <!-- inverse={invertLogo} -->
      <AppLogo inverse={false} aria-hidden="true" />
    </button>
    <Banner />
  </div>
</header>

<style lang="postcss">
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
